/**
 * OAuth 2.0 Authorization Server Metadata (RFC 8414)
 *
 * Provides discovery endpoint for clients to learn about authentication requirements
 */

interface OAuthServerMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint?: string;
  registration_endpoint?: string;
  revocation_endpoint?: string;
  introspection_endpoint?: string;
  service_documentation: string;
  code_challenge_methods_supported: string[];
  response_types_supported: string[];
  response_modes_supported: string[];
  grant_types_supported: string[];
  token_endpoint_auth_methods_supported: string[];
  revocation_endpoint_auth_methods_supported: string[];
  introspection_endpoint_auth_methods_supported: string[];
  scopes_supported?: string[];
  claims_supported?: string[];
}

/**
 * Generate OAuth 2.0 discovery metadata
 *
 * This documents how clients should authenticate with the MCP server
 */
export function getOAuthDiscovery(
  baseUrl: string,
  serviceName: string
): OAuthServerMetadata {
  return {
    // OAuth 2.0 Authorization Server Metadata (RFC 8414)
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/oauth/authorize`,
    token_endpoint: `${baseUrl}/oauth/token`,
    registration_endpoint: `${baseUrl}/oauth/register`,
    revocation_endpoint: `${baseUrl}/oauth/revoke`,
    introspection_endpoint: `${baseUrl}/oauth/introspect`,

    // Service documentation
    service_documentation: 'https://docs.bestviable.com/mcp/',

    // PKCE support (required for security)
    code_challenge_methods_supported: ['S256', 'plain'],

    // Supported flows
    response_types_supported: ['code'],
    response_modes_supported: ['query', 'fragment'],
    grant_types_supported: ['authorization_code', 'refresh_token', 'implicit'],

    // Authentication methods at token endpoint
    token_endpoint_auth_methods_supported: [
      'client_secret_basic',
      'client_secret_post',
      'none' // For public clients with PKCE
    ],

    // Revocation authentication
    revocation_endpoint_auth_methods_supported: [
      'client_secret_basic',
      'client_secret_post',
      'none'
    ],

    // Introspection authentication
    introspection_endpoint_auth_methods_supported: [
      'client_secret_basic',
      'client_secret_post',
      'Bearer'
    ],

    // Scopes (if applicable)
    scopes_supported: [
      'openid',
      'profile',
      'email',
      'mcp:read',
      'mcp:write'
    ],

    // Claims (if using OpenID Connect)
    claims_supported: [
      'sub',
      'iss',
      'aud',
      'exp',
      'iat',
      'auth_time',
      'name',
      'email'
    ]
  };
}

/**
 * Minimal Bearer token metadata (for API key services like Coda, GitHub)
 *
 * For services that don't support OAuth but use Bearer tokens
 */
export function getBearerTokenMetadata(
  baseUrl: string,
  serviceName: string
): any {
  return {
    // Service info
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
