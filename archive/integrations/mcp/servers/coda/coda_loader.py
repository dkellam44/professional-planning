"""
Coda API Loader: creates (optionally) a Coda doc and upserts CSV data into base tables.

Prereqs:
  - Python 3.10+
  - pip install requests python-dotenv

Env (.env):
  CODA_API_TOKEN=xxxxxxxx
  CODA_DOC_ID=            # (optional) if you already have the target doc
  CODA_FOLDER_ID=         # (optional)
  CODA_SOURCE_DOC_ID=     # (optional) doc ID to copy as a template
  CODA_TIMEZONE=America/Los_Angeles
"""

import os, csv, time, sys
from typing import Dict, List
import requests
from dotenv import load_dotenv

BASE = "https://coda.io/apis/v1"

def _hdr():
    token = os.getenv("CODA_API_TOKEN")
    if not token:
        raise RuntimeError("Missing CODA_API_TOKEN in environment")
    return {"Authorization": f"Bearer {token}"}

def create_doc(title: str, folder_id: str|None=None,
               source_doc: str|None=None,
               timezone: str="America/Los_Angeles",
               initial_page: dict|None=None) -> dict:
    """Create a doc (optionally by copying an existing source doc)."""
    payload = {"title": title, "timezone": timezone}
    if folder_id:  payload["folderId"] = folder_id
    if source_doc: payload["sourceDoc"] = source_doc
    if initial_page: payload["initialPage"] = initial_page
    r = requests.post(f"{BASE}/docs", headers=_hdr(), json=payload)
    r.raise_for_status()
    return r.json()  # includes id, browserLink, etc.

def list_tables(doc_id: str) -> Dict[str, str]:
    """Return mapping: table_name -> table_id (base tables only)."""
    params = {"tableTypes": "table"}  # exclude views; upsert requires base table
    r = requests.get(f"{BASE}/docs/{doc_id}/tables", headers=_hdr(), params=params)
    r.raise_for_status()
    return {t["name"]: t["id"] for t in r.json().get("items", [])}

def list_columns(doc_id: str, table_id: str) -> Dict[str, str]:
    """Return mapping: column_name -> column_id."""
    r = requests.get(f"{BASE}/docs/{doc_id}/tables/{table_id}/columns", headers=_hdr())
    r.raise_for_status()
    return {c["name"]: c["id"] for c in r.json().get("items", [])}

def poll_mutation(request_id: str, timeout_s: float=15.0):
    """Poll Coda's mutation status for up to timeout_s seconds."""
    if not request_id:
        return
    start = time.time()
    while time.time() - start < timeout_s:
        r = requests.get(f"{BASE}/mutationStatus/{request_id}", headers=_hdr())
        if r.status_code == 200 and r.json().get("completed"):
            warn = r.json().get("warning")
            if warn:
                print(f"⚠️  Mutation completed with warning: {warn}")
            return
        time.sleep(0.5)

def upsert_rows(doc_id: str, table_id: str, rows: List[dict], key_columns: List[str]):
    """Insert/upsert batch of rows. key_columns are Coda column IDs or names."""
    payload = {"rows": rows}
    if key_columns:
        payload["keyColumns"] = key_columns
    r = requests.post(f"{BASE}/docs/{doc_id}/tables/{table_id}/rows", headers=_hdr(), json=payload)
    r.raise_for_status()
    rid = r.json().get("requestId")
    poll_mutation(rid)

def _maybe_cast(v: str):
    """Tiny helper to convert common CSV strings -> native types for Coda."""
    if v is None: return None
    s = str(v).strip()
    if s.lower() in {"yes", "true"}: return True
    if s.lower() in {"no", "false"}: return False
    # numeric? (leave IDs like D-0001 alone)
    try:
        if s.isdigit(): return int(s)
        # floats including '0.10'
        return float(s)
    except Exception:
        return v

def upsert_csv(doc_id: str, table_name: str, csv_path: str, key_cols_by_name: List[str],
               column_map: Dict[str, str]|None=None, batch_size: int=50):
    """Upsert a CSV into the named base table.
       column_map: CSV header -> Coda column name (if they differ)."""
    tables = list_tables(doc_id)
    if table_name not in tables:
        raise RuntimeError(f"Table '{table_name}' not found in doc. Is it a base table?")
    table_id = tables[table_name]
    col_map = list_columns(doc_id, table_id)  # name -> id

    # Resolve key columns to IDs when possible (names work but IDs are safer)
    key_cols_ids = [col_map.get(k, k) for k in key_cols_by_name]

    batch = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for rec in reader:
            cells = []
            for csv_col, val in rec.items():
                coda_col_name = column_map.get(csv_col, csv_col) if column_map else csv_col
                col_id_or_name = col_map.get(coda_col_name, coda_col_name)  # fall back to name
                cells.append({"column": col_id_or_name, "value": _maybe_cast(val)})
            batch.append({"cells": cells})
            if len(batch) >= batch_size:
                upsert_rows(doc_id, table_id, batch, key_cols_ids)
                batch = []
    if batch:
        upsert_rows(doc_id, table_id, batch, key_cols_ids)
    print(f"✅ Upserted {csv_path} into '{table_name}'")

def main():
    load_dotenv()
    doc_id = os.getenv("CODA_DOC_ID")
    folder_id = os.getenv("CODA_FOLDER_ID") or None
    source_doc_id = os.getenv("CODA_SOURCE_DOC_ID") or None
    tz = os.getenv("CODA_TIMEZONE", "America/Los_Angeles")

    if not doc_id:
        # If you already created your doc + tables by hand, set CODA_DOC_ID in .env and skip this
        print("Creating a new doc… (Tip: provide CODA_SOURCE_DOC_ID to copy a template with tables)")
        doc = create_doc(title="Enterprise Work OS", folder_id=folder_id, source_doc=source_doc_id, timezone=tz,
                         initial_page={"name":"Loader","pageContent":{"type":"canvas","canvasContent":{"format":"html","content":"<h2>Enterprise Work OS</h2><p>Created via API.</p>"}}})
        doc_id = doc["id"]
        print(f"Doc created: {doc.get('browserLink')}  (id={doc_id})")

    # CONFIG: table -> csv, keys, optional column header mapping
    here = os.path.dirname(os.path.abspath(__file__))
    data = os.path.join(here, "data")  # put your CSVs in ./data
    config = [
        {"table": "Deals / Pipeline", "csv": os.path.join(data, "enterprise_deals_pipeline.csv"),
         "keys": ["deal_id"], "colmap": {}},
        {"table": "Organizations", "csv": os.path.join(data, "enterprise_organizations.csv"),
         "keys": ["name"], "colmap": {}},
        {"table": "Contacts", "csv": os.path.join(data, "enterprise_contacts.csv"),
         "keys": ["email"], "colmap": {}},
        {"table": "Outreach Log", "csv": os.path.join(data, "enterprise_outreach_log.csv"),
         "keys": ["deal_id","date","touch_no"], "colmap": {}},
        {"table": "Assets / Proof", "csv": os.path.join(data, "enterprise_assets_proof.csv"),
         "keys": ["case_study_id"], "colmap": {}},
    ]

    # Sanity: list tables so you see what the API sees (base tables only)
    tmap = list_tables(doc_id)
    print("Tables (base):", list(tmap.keys()))

    # Upsert each CSV
    for cfg in config:
        upsert_csv(doc_id, cfg["table"], cfg["csv"], cfg["keys"], cfg.get("colmap"))

    print("🎉 Done.")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("ERROR:", e)
        sys.exit(1)
