FROM golang:1.25.1-alpine AS builder

WORKDIR /src

RUN apk add --no-cache git

COPY integrations/mcp/servers/digitalocean/src/go.mod integrations/mcp/servers/digitalocean/src/go.sum ./
RUN go mod download

COPY integrations/mcp/servers/digitalocean/src/ .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags "-s -w" -o /out/mcp-digitalocean ./cmd/mcp-digitalocean

FROM python:3.12-alpine

WORKDIR /app

RUN apk add --no-cache ca-certificates && update-ca-certificates

COPY --from=builder /out/mcp-digitalocean /usr/local/bin/mcp-digitalocean
COPY integrations/mcp/servers/digitalocean/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh && pip install --no-cache-dir mcp-proxy

ENV MCP_PROXY_PORT=8082 \
    DIGITALOCEAN_LOG_LEVEL=info \
    DIGITALOCEAN_SERVICES="" \
    DIGITALOCEAN_API_TOKEN="" \
    DIGITALOCEAN_API_ENDPOINT="https://api.digitalocean.com"

EXPOSE 8082

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
