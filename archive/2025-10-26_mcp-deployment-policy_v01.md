# ADR: MCP Deployment Policy

- **Date**: 2025-10-26
- **Status**: Proposed

## Context

We have been facing issues with unreliable pre-built Docker images for MCP servers, specifically for the Coda MCP server. This has led to a lot of troubleshooting and has highlighted the need for a more robust and reliable deployment strategy.

## Decision

We will adopt a hybrid MCP deployment policy:

1.  **Self-Host Critical Servers**: For essential and custom MCP servers (like the Coda MCP), we will build our own Docker images. This gives us full control over the server's configuration and dependencies.
2.  **Expose via Cloudflare**: These self-hosted servers will be exposed securely through a Cloudflare tunnel at `*.bestviable.com`. This will make them accessible as remote servers from all clients (CLI, web, etc.).
3.  **Keep Simple Servers Local**: For stable, official MCPs that are only used locally (like `calculator` or `time`), we will continue to use the simple `npx` stdio configuration.
4.  **Retire Unreliable Configurations**: We will remove any broken or unreliable MCP configurations from our setup to avoid confusion.

## Consequences

**Pros**:
-   Increased reliability and control over critical MCP servers.
-   Unified access to self-hosted servers through a single domain.
-   Reduced dependence on third-party images that can be deprecated or become incompatible.

**Cons**:
-   Requires more initial setup and maintenance (creating Dockerfiles, managing images).
-   Requires a working Cloudflare Tunnel setup.

## Implementation Plan

The first step in implementing this policy is to create a custom Docker image for the Coda MCP server.
