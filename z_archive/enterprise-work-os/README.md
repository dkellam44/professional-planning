# Enterprise Work OS

Operational workspace + scripts for Notion/Coda + sales ops.

## Structure
- coda/ — API scripts for Coda
- notion/ — prompts/specs for Notion connector
- docs/ — planning docs

## Quickstart
1) `python3 -m venv .venv && source .venv/bin/activate`
2) `pip install -r requirements.txt`
3) Copy `.env.example` to `.env` and fill secrets
4) CSVs go in `coda/data/`
5) Run `python coda/coda_loader.py` to load data into Coda
