#!/usr/bin/env bash
# Simple helper to push secrets from a dotenv file into Infisical.
#
# Usage:
#   ./import_from_dotenv.sh path/to/.env portfolio-prod prod
#
# Requirements:
#   - Infisical CLI installed (`curl -fsSL https://get.infisical.com | bash`)
#   - Logged in (`infisical login --method token`)
#   - The target project/environment already exists
#
# The script skips blank lines and comments. Keys are written as SHARED secrets.

set -euo pipefail

if [[ $# -ne 3 ]]; then
  echo "Usage: $0 <dotenv_file> <project_slug_or_id> <environment_slug>" >&2
  exit 1
fi

ENV_FILE=$1
PROJECT_LABEL=$2
ENVIRONMENT=$3

if [[ ! -f "$ENV_FILE" ]]; then
  echo "dotenv file not found: $ENV_FILE" >&2
  exit 1
fi

if ! command -v infisical >/dev/null 2>&1; then
  echo "Infisical CLI not found. Install from https://infisical.com/docs/cli/overview" >&2
  exit 1
fi

echo "Importing secrets from $ENV_FILE into project=$PROJECT_LABEL environment=$ENVIRONMENT"

CLI_ARGS=(--env "$ENVIRONMENT" --type shared)

# When running under a machine identity, Infisical requires the project ID if it
# isn't embedded in the token. Export INFISICAL_PROJECT_ID to enable this.
if [[ -n "${INFISICAL_PROJECT_ID:-}" ]]; then
  CLI_ARGS+=(--projectId "$INFISICAL_PROJECT_ID")
fi

# Allow callers to override default path (/, shared) by exporting
# INFISICAL_SECRET_PATH, default remains "/".
SECRET_PATH=${INFISICAL_SECRET_PATH:-/}

while IFS= read -r line || [[ -n "$line" ]]; do
  # Trim leading/trailing whitespace
  line=${line#"${line%%[![:space:]]*}"}   # ltrim
  line=${line%"${line##*[![:space:]]}"}   # rtrim

  # Skip comments and blank lines
  if [[ -z "$line" ]] || [[ "${line:0:1}" == "#" ]]; then
    continue
  fi

  # Remove leading "export " if present
  if [[ "$line" == export\ * ]]; then
    line=${line#export }
  fi

  # Split on the first '='
  KEY=${line%%=*}
  VALUE=${line#*=}

  if [[ -z "$KEY" ]]; then
    echo "Skipping malformed line: $line" >&2
    continue
  fi

  # Remove optional surrounding quotes from the value
  if [[ "${VALUE:0:1}" == "\"" && "${VALUE: -1}" == "\"" ]]; then
    VALUE=${VALUE:1:-1}
  elif [[ "${VALUE:0:1}" == "'" && "${VALUE: -1}" == "'" ]]; then
    VALUE=${VALUE:1:-1}
  fi

  echo "→ syncing $KEY"
  infisical secrets set \
    "${CLI_ARGS[@]}" \
    --path "$SECRET_PATH" \
    "$KEY=$VALUE" >/dev/null
done < "$ENV_FILE"

echo "Import complete."
