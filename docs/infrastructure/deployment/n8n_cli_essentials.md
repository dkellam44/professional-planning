• n8n CLI essentials

  - n8n import:workflow --input=… – load a JSON workflow file (add --active=true to enable immediately).
  - n8n export:workflow --id=<id> --output=… – dump an existing workflow (handy for versioning).
  - n8n update:workflow --id=<id> --active=true|false – toggle activation status.
  - n8n list:workflow – list all workflows (great for grabbing IDs).
  - n8n import:credentials / export:credentials – move cred bundles between environments.
  - n8n execute-batch / n8n execute – run workflows from the CLI without the UI (useful for tests).

  [n8n CLI Docs](https://docs.n8n.io/hosting/cli-commands/)