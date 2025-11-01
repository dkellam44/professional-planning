---
entity: reference
level: technical
zone: documentation
version: "0.1"
tags: [mcp, documentation, external, anthropic, specification]
source_path: agents/context/external_references/mcp_official_docs_v01.md
date: 2025-10-31
author: claude-code
status: active
---

# Model Context Protocol (MCP) Official Documentation Reference

## Purpose

Centralized reference to official MCP documentation for stateless agents. These are the authoritative sources for MCP implementation.

## Official Specification

### Primary Documentation
- **URL:** https://modelcontextprotocol.io/specification/2025-03-26/basic/transports
- **Status:** Current (as of 2025-10-31)
- **Protocol Version:** 2025-03-26
- **Purpose:** Complete technical specification for MCP transports including Streamable HTTP

### Specification Mirror
- **URL:** https://spec.modelcontextprotocol.io/specification/2025-03-26/basic/transports/
- **Purpose:** Alternative access to same specification

## TypeScript SDK

### GitHub Repository
- **URL:** https://github.com/modelcontextprotocol/typescript-sdk
- **Status:** Official Anthropic SDK
- **Package:** `@modelcontextprotocol/sdk`
- **NPM:** https://www.npmjs.com/package/@modelcontextprotocol/sdk

### Key Exports
- `StreamableHTTPServerTransport` from `@modelcontextprotocol/sdk/server/streamableHttp.js`
- `StdioServerTransport` from `@modelcontextprotocol/sdk/server/stdio.js`
- `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js`

## Streamable HTTP Transport Specification Summary

### Endpoint Requirements
- **Single endpoint:** Both POST and GET on same path (e.g., `/mcp`)
- **POST:** Client to server messages (JSON-RPC)
- **GET:** Server to client messages (SSE stream)
- **DELETE:** Optional session termination

### Headers
**Request Headers:**
- `Content-Type: application/json`
- `Accept: application/json, text/event-stream`
- `Mcp-Session-Id: <session-id>` (after initialization)
- `Authorization: Bearer <token>` (custom, not in spec)

**Response Headers:**
- `Mcp-Session-Id: <session-id>` (during initialization)
- `Content-Type: application/json` or `text/event-stream`

### Security Requirements
1. **MUST validate Origin header** to prevent DNS rebinding attacks
2. **SHOULD use HTTPS** for public endpoints
3. **SHOULD bind to localhost** for local deployments
4. **Session IDs SHOULD be cryptographically secure** (UUID, JWT, or hash)

### Session Management
- **Stateless:** Set `sessionIdGenerator: undefined`
- **Stateful:** Provide custom generator, track sessions in Map
- **Termination:** Server returns HTTP 404 to signal session end

## Community Resources

### Implementation Examples

**Koyeb Tutorial:**
- **URL:** https://www.koyeb.com/tutorials/deploy-remote-mcp-servers-to-koyeb-using-streamable-http-transport
- **Purpose:** Deployment guide for remote MCP servers
- **Relevance:** Production deployment patterns

**Invariant Labs Example:**
- **URL:** https://github.com/invariantlabs-ai/mcp-streamable-http
- **Purpose:** Reference implementation in Python and TypeScript
- **Relevance:** Code examples for both languages

### Educational Content

**Visual Guide:**
- **URL:** https://medium.com/the-ai-language/a-visual-guide-to-mcps-streamable-http-transport-6dc18fe751ad
- **Author:** Kartik Marwah
- **Purpose:** Illustrated explanation of transport flow

**Production Guide:**
- **URL:** https://medium.com/@nsaikiranvarma/building-production-ready-mcp-server-with-streamable-http-transport-in-15-minutes-ba15f350ac3c
- **Author:** Sai Kiran Varma
- **Purpose:** Quick production deployment guide

**Cloudflare Blog:**
- **URL:** https://blog.cloudflare.com/streamable-http-mcp-servers-python/
- **Purpose:** Python language support announcement
- **Relevance:** Alternative implementation language

**Why Streamable HTTP:**
- **URL:** https://blog.fka.dev/blog/2025-06-06-why-mcp-deprecated-sse-and-go-with-streamable-http/
- **Purpose:** Explanation of architectural decision
- **Relevance:** Understanding design rationale

## Anthropic MCP Connector Documentation

### Claude API - MCP Connector
- **URL:** https://docs.claude.com/en/docs/agents-and-tools/mcp-connector
- **Purpose:** How to connect MCP servers to Claude.ai
- **Relevance:** Testing and integration with Claude

## Related Standards

### OAuth 2.0
- **RFC 6749:** https://datatracker.ietf.org/doc/html/rfc6749
- **RFC 8414:** OAuth 2.0 Authorization Server Metadata (discovery)
- **RFC 8707:** Resource Indicators for OAuth 2.0

### PKCE
- **RFC 7636:** https://datatracker.ietf.org/doc/html/rfc7636
- **Purpose:** Proof Key for Code Exchange (security enhancement)

### Dynamic Client Registration
- **RFC 7591:** https://datatracker.ietf.org/doc/html/rfc7591
- **Purpose:** OAuth 2.0 Dynamic Client Registration Protocol

## Update History

- **2025-10-31:** Initial documentation (v0.1)
  - Captured MCP specification 2025-03-26
  - Documented TypeScript SDK
  - Collected community resources

## Notes for Future Agents

When implementing MCP servers:

1. **Always check spec version** - Protocol may evolve
2. **Use official SDK** - Don't reinvent transport layer
3. **Follow security requirements** - Origin validation is mandatory
4. **Test with multiple clients** - ChatGPT, Claude.ai, custom clients
5. **Reference community examples** - Learn from production deployments

## Verification

Last verified: 2025-10-31
Next review: When implementing new MCP features or troubleshooting
