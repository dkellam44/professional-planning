# Reverse Proxy Capability - Traefik Migration

## MODIFIED Requirements

### Requirement: Automatic Service Discovery
The reverse proxy SHALL automatically discover and route to Docker services based on container labels, without requiring manual configuration or proxy restarts.

#### Scenario: New service deployment
- **WHEN** a new service container starts with Traefik labels
- **THEN** the reverse proxy automatically creates routing rules within 5 seconds
- **AND** the service is immediately accessible via its configured hostname
- **AND** no proxy restart is required

#### Scenario: Service update
- **WHEN** an existing service is restarted with updated labels
- **THEN** the reverse proxy updates routing rules automatically
- **AND** zero downtime occurs for other services

### Requirement: HTTP-Only Routing via Cloudflare Tunnel
The reverse proxy SHALL accept HTTP traffic on port 80 from Cloudflare Tunnel, with SSL termination handled by Cloudflare edge servers.

#### Scenario: HTTP request from Cloudflare Tunnel
- **WHEN** Cloudflare Tunnel sends an HTTP request to port 80
- **THEN** the reverse proxy routes the request to the appropriate service
- **AND** no SSL/TLS processing occurs at the proxy level
- **AND** the service receives the request with proper host headers

#### Scenario: Service configuration
- **WHEN** a service is configured with Traefik labels
- **THEN** only the `web` entrypoint (port 80) is required
- **AND** no TLS/certificate configuration is needed
- **AND** Cloudflare handles all SSL termination

### Requirement: Backward Compatibility via Network Alias
The reverse proxy SHALL respond to the `nginx-proxy` hostname on the docker_proxy network for compatibility with existing Cloudflare Tunnel configuration.

#### Scenario: Cloudflare Tunnel connection
- **WHEN** Cloudflare Tunnel sends requests to `http://nginx-proxy:80`
- **THEN** the Traefik container responds using its network alias
- **AND** no Cloudflare Tunnel configuration changes are required
- **AND** zero downtime migration is achieved

### Requirement: Service Label Format
Services SHALL be configured for reverse proxy routing using Traefik labels in docker-compose.yml files.

#### Scenario: Service configuration
- **WHEN** a service needs external HTTPS access
- **THEN** the following labels are required:
  ```yaml
  traefik.enable: "true"
  traefik.http.routers.{service}.rule: "Host(`domain.com`)"
  traefik.http.routers.{service}.entrypoints: "web"
  traefik.http.services.{service}.loadbalancer.server.port: "{port}"
  ```
- **AND** no VIRTUAL_HOST environment variables are needed
- **AND** no TLS configuration is required

#### Scenario: Multi-service application
- **WHEN** an application has multiple services (e.g., archon-ui, archon-server, archon-mcp)
- **THEN** each service has unique router names in labels
- **AND** services can share the same domain with different paths (optional)
- **AND** all services are discovered independently

## REMOVED Requirements

### Requirement: Manual Proxy Configuration
**Reason**: Traefik provides automatic service discovery, eliminating the need for manual nginx configuration files.

**Migration**: Removed docker-gen template-based configuration generation. Services now use Docker labels for routing configuration.

### Requirement: ACME Certificate Management
**Reason**: Cloudflare Tunnel terminates SSL at the edge, eliminating the need for Let's Encrypt certificates at the proxy level.

**Migration**: Removed acme-companion container. SSL certificates now managed entirely by Cloudflare.

### Requirement: Proxy Restart for Configuration Changes
**Reason**: Traefik automatically applies configuration changes when containers are restarted.

**Migration**: nginx-proxy required manual restart after service changes. Traefik eliminates this requirement.

### Requirement: VIRTUAL_HOST Environment Variables
**Reason**: Traefik uses Docker labels for configuration, not environment variables.

**Migration**:
- Before: `VIRTUAL_HOST=example.com`, `VIRTUAL_PORT=8080`
- After: Traefik labels (see Service Label Format requirement)

## ADDED Requirements

### Requirement: Dashboard Visibility
The reverse proxy SHALL provide a web-based dashboard showing all configured routes, services, and middleware.

#### Scenario: View routing configuration
- **WHEN** an operator accesses http://localhost:8080/dashboard
- **THEN** a dashboard displays all active routers
- **AND** each router shows its rule, entrypoints, and backend service
- **AND** service health status is visible

#### Scenario: Troubleshooting routing
- **WHEN** a service is not accessible
- **THEN** the dashboard shows whether the router exists
- **AND** the dashboard shows the backend service URL
- **AND** logs are available via the Traefik container

### Requirement: Zero-Downtime Service Updates
The reverse proxy SHALL continue routing to other services when one service is restarted or updated.

#### Scenario: Service restart
- **WHEN** one service container is restarted
- **THEN** other services remain accessible
- **AND** the restarted service becomes available when healthy
- **AND** no proxy restart is required
