# Network Wiring Diagram

This diagram illustrates the intended network wiring for the self-hosted MCP and automation infrastructure.

```mermaid
graph TD
    subgraph User Client
        A[Browser / Claude Code]
    end

    subgraph Cloudflare Edge
        B(Cloudflare DNS)
        C(Cloudflare WAF / CDN)
    end

    subgraph DigitalOcean Droplet
        D[cloudflared Tunnel Client]
        subgraph Docker Compose Stack
            E[Caddy (Reverse Proxy)]
            F[n8n (Automation)]
            G[Coda MCP Gateway (HTTP:8080)]
        end
    end

    A -- HTTPS --> B
    B -- Routes Traffic --> C
    C -- Secure Tunnel --> D
    D -- HTTP --> E
    E -- Proxies --> F
    E -- Proxies --> G

    G -- Coda API --> H(Coda.io)
    F -- Coda API --> H
    F -- Other APIs --> I(External Services)

    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#bbf,stroke:#333,stroke-width:2px
    style C fill:#bbf,stroke:#333,stroke-width:2px
    style D fill:#ccf,stroke:#333,stroke-width:2px
    style E fill:#cfc,stroke:#333,stroke-width:2px
    style F fill:#cfc,stroke:#333,stroke-width:2px
    style G fill:#cfc,stroke:#333,stroke-width:2px
    style H fill:#ffc,stroke:#333,stroke-width:2px
    style I fill:#ffc,stroke:#333,stroke-width:2px
```

## Explanation of the Network Flow:

1.  **User Client**: This represents your browser or the Claude Code application, initiating requests.
2.  **Cloudflare Edge**: All external requests first hit Cloudflare's global network. Cloudflare handles DNS resolution, security (WAF), and content delivery (CDN).
3.  **Secure Tunnel (Cloudflare Tunnel)**: A `cloudflared` client running on your DigitalOcean Droplet establishes a secure, outbound-only connection to the Cloudflare Edge. This tunnel allows Cloudflare to route traffic to your droplet without exposing its public IP address.
4.  **DigitalOcean Droplet**: This is your virtual server where all your self-hosted services run within a Docker Compose stack.
5.  **Docker Compose Stack**: This is the collection of services running in Docker containers on your droplet:
    *   **Caddy (Reverse Proxy)**: Caddy acts as a local reverse proxy. It receives traffic from the `cloudflared` tunnel client and forwards it to the appropriate internal service (n8n or Coda MCP Gateway) based on the hostname.
    *   **n8n (Automation)**: Your n8n instance, handling automation workflows.
    *   **Coda MCP Gateway (HTTP:8080)**: Our newly built custom Docker image, which exposes the Coda MCP server as an HTTP service on port 8080.
6.  **Internal Communication**: Caddy proxies requests to n8n and the Coda MCP Gateway. The Coda MCP Gateway and n8n communicate with `Coda.io` and other external services as needed.

**Flow of a request (e.g., from Claude Code to Coda MCP):**

1.  Claude Code makes a request to `https://coda.bestviable.com`.
2.  Cloudflare DNS resolves `coda.bestviable.com` to Cloudflare's edge network.
3.  Cloudflare's edge receives the request and, based on your Zero Trust configuration, routes it through the secure tunnel to the `cloudflared` client on your DigitalOcean Droplet.
4.  The `cloudflared` client forwards the request to Caddy (which is listening on `localhost` on the droplet).
5.  Caddy, configured for `coda.bestviable.com`, proxies the request to the `Coda MCP Gateway` container at `http://localhost:8080` (within the Docker network).
6.  The `Coda MCP Gateway` processes the request, interacts with `Coda.io` via the Coda API, and returns the response.
7.  The response travels back through Caddy, the `cloudflared` tunnel, Cloudflare Edge, and finally to your Claude Code client.
