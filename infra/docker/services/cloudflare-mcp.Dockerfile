FROM python:3.12-alpine

WORKDIR /app

RUN apk add --no-cache nodejs npm ca-certificates && update-ca-certificates

RUN npm install -g mcp-remote@latest && pip install --no-cache-dir mcp-proxy

COPY integrations/mcp/servers/cloudflare/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh

ENV MCP_PROXY_PORT=8083 \
    CLOUDFLARE_REMOTE_URL="" \
    CLOUDFLARE_TRANSPORT_STRATEGY="http-first" \
    CLOUDFLARE_CALLBACK_PORT="" \
    CLOUDFLARE_HEADERS="" \
    CLOUDFLARE_API_TOKEN="" \
    CLOUDFLARE_IGNORE_TOOLS=""

EXPOSE 8083

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
