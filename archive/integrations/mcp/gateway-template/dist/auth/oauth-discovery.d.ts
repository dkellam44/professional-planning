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
export declare function getOAuthDiscovery(baseUrl: string, serviceName: string): OAuthServerMetadata;
/**
 * Minimal Bearer token metadata (for API key services like Coda, GitHub)
 *
 * For services that don't support OAuth but use Bearer tokens
 */
export declare function getBearerTokenMetadata(baseUrl: string, serviceName: string): any;
export {};
//# sourceMappingURL=oauth-discovery.d.ts.map