"use strict";
/**
 * OAuth 2.0 Authorization Server Metadata (RFC 8414)
 *
 * Provides discovery endpoint for clients to learn about authentication requirements
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOAuthDiscovery = getOAuthDiscovery;
exports.getBearerTokenMetadata = getBearerTokenMetadata;
/**
 * Generate OAuth 2.0 discovery metadata
 *
 * This documents how clients should authenticate with the MCP server
 */
function getOAuthDiscovery(baseUrl, serviceName) {
    return {
        // OAuth 2.0 Authorization Server Metadata (RFC 8414)
        issuer: baseUrl,
        authorization_endpoint: `${baseUrl}/oauth/authorize`,
        token_endpoint: `${baseUrl}/oauth/token`,
        registration_endpoint: `${baseUrl}/oauth/register`,
        // Service documentation
        service_documentation: 'https://docs.bestviable.com/mcp/',
        // PKCE support (required for security)
        code_challenge_methods_supported: ['S256', 'plain'],
        // Supported flows (only what we actually implement)
        response_types_supported: ['code'],
        response_modes_supported: ['query'],
        grant_types_supported: ['authorization_code'],
        // Authentication methods at token endpoint
        token_endpoint_auth_methods_supported: [
            'none' // Public client with PKCE
        ],
        // Scopes (only what we actually use)
        scopes_supported: [
            'email'
        ]
    };
}
/**
 * Minimal Bearer token metadata (for API key services like Coda, GitHub)
 *
 * For services that don't support OAuth but use Bearer tokens
 */
function getBearerTokenMetadata(baseUrl, serviceName) {
    return {
        // RFC 8707: identify the protected resource and its authorization server(s)
        resource: `${baseUrl}/mcp`,
        authorization_servers: [
            baseUrl
        ],
        // Service info for human operators
        service_name: serviceName,
        service_documentation: 'https://docs.bestviable.com/mcp/',
        base_url: baseUrl,
        // Authentication requirements
        authentication: {
            type: 'bearer',
            scheme: 'Bearer',
            header: 'Authorization',
            format: 'Bearer <token>',
            location: 'header'
        },
        // Endpoints
        endpoints: {
            mcp: `${baseUrl}/mcp`,
            health: `${baseUrl}/health`,
            discovery: `${baseUrl}/.well-known/oauth-authorization-server`
        },
        // Transport information
        transport: {
            type: 'streamable-http',
            protocol_version: '2025-03-26',
            endpoints: {
                request: 'POST /mcp',
                stream: 'GET /mcp',
                terminate: 'DELETE /mcp'
            },
            session_management: 'stateful',
            session_id_header: 'mcp-session-id'
        },
        // Security
        security: {
            required: true,
            method: 'bearer_token',
            scopes: ['mcp:read', 'mcp:write'],
            https_required: true
        }
    };
}
