# Using Stytch for Remote MCP Server authorization

## The Model Context Protocol

The [Model Context Protocol (MCP)](https://modelcontextprotocol.io) is a specification for how AI agents can communicate with, and discover the capabilities of, servers which implement specific functionality. Whereas an LLM may not natively have the capability to perform certain actions, such as sending email, if it can communicate with an MCP server that advertises this capability it is empowered to delegate the implementation of email sending to that server. Naturally, this type of interaction can extend beyond email to whatever services implementers wish to create.

For the purposes of implementing authorization with Stytch, MCP Clients are a type of Connected App. MCP Clients request access to a user's account through the authorization\_code grant.

In this guide, we'll walk through the creation of a Remote (MCP) server which manages authorization using Stytch. We'll discuss all the steps that go into a complete MCP Authorization flow. These steps are performed between a variety of actors - some are performed by the MCP Client, some by your MCP Server, and some by Stytch directly. At each step, we'll call out which actor is responsible for what. For steps that need to be implemented by you, we'll show code snippets in a variety of languages.

To illustrate, we'll follow along with the [Stytch MCP Server](https://mcp.stytch.dev/), which uses Stytch under the hood.

This guide is for implementing MCP Authorization with the Stytch product. For a more general purpose guide on the role of OAuth within the MCP ecosystem, check out our [Blog](https://stytch.com/blog/MCP-authentication-and-authorization-guide/).

## The Complete MCP Authorization Flow

At a high level, your MCP Server is responsible for the following:

1. Validating Stytch-issued access tokens and returning a specific error format on failure
2. Serving a JSON document instructing MCP Clients to talk to Stytch

In addition, your application is responsible for hosting the Stytch <IdentityProvider /> React Component, which handles the OAuth Consent step.

* If you are adding MCP to an existing project, this should be added to your main frontend codebase
* If you are building a standalone MCP Server, this can be added to the MCP Server directly

### 

1

Access Token Validation

**This step is performed by your MCP Server**

When an MCP client first tries to connect to your MCP server, the client will send an [Initialization](https://modelcontextprotocol.io/specification/2025-06-18/basic/lifecycle#initialization) request.

Your MCP server should validate that the request contains a valid Stytch-issued access token JWT.

If the request has no access token, or an invalid or expired access token, your MCP server must respond with a 401 Unauthorized status code, and a specially formatted [WWW-Authenticate](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/WWW-Authenticate) header. This header will direct the client to look up the Protected Resource Metadata (PRM) document as detailed in [RFC 9728](https://datatracker.ietf.org/doc/html/rfc9728#name-use-of-www-authenticate-for).

Let's try with the [Stytch MCP Server](https://mcp.stytch.dev/), which uses Stytch under the hood.

```bash
# The MCP Client initializes a connection without any credentials
curl -D - "https://mcp.stytch.dev/mcp"
```

The response contains a WWW-Authenticate header with a resource\_metadata attribute.

```bash
HTTP/2 401
www-authenticate: Bearer error="Unauthorized", error_description="Unauthorized",
  resource_metadata="https://mcp.stytch.dev/.well-known/oauth-protected-resource"

Unauthorized
```

Here are some examples of how to implement this check in a variety of languages and runtimes:

Node projects should use the [stytch](https://www.npmjs.com/package/stytch) backend SDK to perform token validation using the [Introspect Access Token](https://stytch.com/docs/api/connected-app-token-introspection) API method.

```js
import * as stytch from "stytch";
import express from "express";

const app = express();

const client = new stytch.Client({
   project_id: "PROJECT_ID",
   secret: "SECRET",
   custom_base_url: '${projectDomain}',
})

const authorizeTokenMiddleware = async (req, res, next) => {
   const wwwAuthValue = `Bearer error="Unauthorized", ` +
     `error_description="Unauthorized",` +
     `resource_metadata="${req.get("host")}/.well-known/oauth-protected-resource"`;

   const token = req.headers.authorization &&
     req.headers.authorization.split(' ')[1];
   if (!token) {
      res.setHeader('WWW-Authenticate', wwwAuthValue);
      return res.status(401).json({ error: 'Unauthorized' });
   }

   client.idp.introspectTokenLocal(token)
     .then(tokenData => {
        // Set the token data on the request for later use
        req.user = response;
        next();
     })
     .catch(err => {
        console.error('Error in middleware:', err);
        res.setHeader('WWW-Authenticate', wwwAuthValue);
        return res.status(401).json({ error: 'Unauthorized' });
     })
};

app.post('/mcp', authorizeTokenMiddleware, async (req, res) => {
   const server = new McpServer({ name: "Demo", version: "1.0.0" });

   // The server can now access the validated req.user within tool calls
   server.tool("whoami", {}, async () => ({
      content: [{
        type: "text",
         text: "You are " + JSON.stringify(req.user, null, 2),
      }]
   }));

   const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
   });
   res.on('close', () => {
      transport.close();
      server.close();
   });
   try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
   } catch (error) {
      console.error('Error handling MCP request:', error);
      res.status(500).json({
         jsonrpc: '2.0',
         error: {
            code: -32603,
            message: 'Internal server error',
         },
         id: null,
      });
   }
})
```

NextJS projects should use the [Vercel MCP Adapter](https://github.com/vercel/mcp-adapter) as well as the [stytch](https://www.npmjs.com/package/stytch) backend SDK to perform token validation using the [Introspect Access Token](https://stytch.com/docs/api/connected-app-token-introspection) API method.

```js
import { createMcpHandler, withMcpAuth } from "mcp-handler";
import * as stytch from "stytch";

const client = new stytch.Client({
   project_id: "PROJECT_ID",
   secret: "SECRET",
   custom_base_url: '${projectDomain}',
})

const handler = createMcpHandler(
  server => {
    // withMcpAuth will set the authInfo on the server for use in tool calls
     server.tool("whoami", {}, async ({authInfo}) => ({
        content: [{
          type: "text",
          text: "You are " + JSON.stringify(authInfo, null, 2),
        }]
     }));

     return server
  }
);

const verifyToken = async (req, token) => {
  if (!token) return;
  const { audience, scope, expires_at, ...rest } =
          await client.idp.introspectTokenLocal(token);

  // This payload will be passed as authInfo
  return {
     token,
     clientId: audience,
     scopes: scope.split(' '),
     expiresAt: expires_at,
     extra: rest
  };
};

const authHandler = withMcpAuth(handler, verifyToken, {
   required: true, // Make auth required for all requests
});

export { authHandler as GET, authHandler as POST };
```

[FastMCP](https://gofastmcp.com/getting-started/welcome) projects should use the builtin [JWT Verifier](https://gofastmcp.com/servers/auth/token-verification#jwt-token-verification) utility to perform token validation.

```python
from fastmcp import FastMCP
from fastmcp.server.auth import BearerAuthProvider
from fastmcp.server.dependencies import get_access_token, AccessToken

auth = BearerAuthProvider(
    jwks_uri=f"{os.getenv('STYTCH_DOMAIN')}/.well-known/jwks.json",
    issuer=os.getenv("STYTCH_DOMAIN"),
    algorithm="RS256",
    audience=os.getenv("STYTCH_PROJECT_ID")
)

mcp = FastMCP(name="My MCP Server", auth=auth)

@mcp.tool()
def whoami() -> str:
    """Retrieve the current caller information"""
    access_token = get_access_token()
    user_id = access_token.claims.get("sub")
    return f"user is: {user_id}"
```

Hono applications should use the Stytch [Hono SDK](https://www.npmjs.com/package/@hono/stytch-auth) to perform token validation. Add a custom onError handler to set the WWW-Authenticate header.

```js
import {Consumer} from '@hono/stytch-auth';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPTransport } from '@hono/mcp'

const bearerAuthMiddleware = Consumer.authenticateOAuthToken({
   onError: (c, err) => {
      console.error(err);
      // Construct the WWW-Authenticate header
      const url = new URL(c.req.url);
      const wwwAuthValue = `Bearer error="Unauthorized", ` +
        `error_description="Unauthorized",` +
        `resource_metadata="${url.origin}/.well-known/oauth-protected-resource"`;

      const errorResponse = new Response('Unauthorized', {
         status: 401,
         headers: {'WWW-Authenticate': wwwAuthValue}
      });
      throw new HTTPException(401, {res: errorResponse});
   }
});

export default new Hono()
  .use('/mcp', bearerAuthMiddleware)
  .route('/mcp', async (c) => {
     // The server can access the OAuth data validated by the bearerAuthMiddleware
     const {claims, token: accessToken} = Consumer.getOAuthData(c);

     const server = new McpServer({ name: "Demo", version: "1.0.0" });
     server.tool("whoami", {}, async () => ({
        content: [{
          type: "text",
          text: "You are " + JSON.stringify(claims, null, 2),
        }]
     }));

     const transport = new StreamableHTTPTransport()
     await mcpServer.connect(transport)
     return transport.handleRequest(c)
  })
```

### 

2

Protected Resource Metadata

**This step is performed by your MCP Server**

The MCP Client will extract the resource\_metadata field from the WWW-Authenticate header returned and issue a GET request to that URL to retrieve the Protected Resource Metadata (PRM) Document. The PRM Document is hosted by your MCP Server. Your MCP Server will return a JSON document containing information about how the client should request an access token.

```bash
# The MCP Client retrieves the PRM document
curl -s "https://mcp.stytch.dev/.well-known/oauth-protected-resource" | jq
```

Here's what the Stytch MCP Server returns. Note that there are several [Custom Scopes](https://stytch.com/docs/guides/connected-apps/oauth-scopes#custom-scopes) used by the Stytch MCP Server that have been eliminated for brevity.

```json
{
  "resource": "https://mcp.stytch.dev",
  "authorization_servers": [
    "https://rustic-kilogram-6347.customers.stytch.com"
  ],
  "scopes_supported": ["openid", "email", "profile", "manage:project_data", ...]
}
```

| Field Name             | Meaning                                                                                                                                                                                                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| resource               | The resource identifier - a https:// URL. This should be the location of your MCP Server.                                                                                                                                                                             |
| authorization\_servers | A JSON array containing a list of OAuth authorization server issuer URLs. This should be your Stytch PROJECT\_DOMAIN.                                                                                                                                                 |
| scopes\_supported      | A JSON array of [OAuth scopes](https://stytch.com/docs/guides/connected-apps/oauth-scopes) that can be requested from your Stytch project. Some MCP clients will use the scopes returned in the scopes\_supported array as the initial set of permissions to request. |

Here are some examples of how to implement this endpoint in your MCP Server in a variety of languages and runtimes:

```js
import express from "express";

const app = express();

app.get('/.well-known/oauth-protected-resource/:transport?', (req, res) => {
   return res.json({
      resource: req.get("host"),
      authorization_servers: [process.env.STYTCH_DOMAIN],
      scopes_supported: ["openid", "email", "profile"]
   })
})
```

Add the following at src/app/.well-known/oauth-protected-resource/route.ts

```js
// In src/app/.well-known/oauth-protected-resource/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
   const response =  NextResponse.json({
      resource: new URL(request.url).origin,
      authorization_servers: [process.env.STYTCH_DOMAIN],
      scopes_supported: ["openid", "email", "profile"]
   });

   response.headers.set('Access-Control-Allow-Origin', '*');
   response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
   response.headers.set('Access-Control-Allow-Headers',
     'Content-Type, Authorization');

   return response;
}
```

```python
from fastmcp import FastMCP

# Use the auth defined before
mcp = FastMCP(name="My MCP Server", auth=auth)

@mcp.custom_route("/.well-known/oauth-protected-resource", methods=["GET", "OPTIONS"])
def oauth_metadata(request: StarletteRequest) -> JSONResponse:
    base_url = str(request.base_url).rstrip("/")

    return JSONResponse(
        {
            "resource": base_url,
            "authorization_servers": [os.getenv("STYTCH_DOMAIN")],
            "scopes_supported": ["openid", "email", "profile"]
        }
    )
```

```js
import {Hono} from "hono";

export default new Hono()
  .get('/.well-known/oauth-protected-resource/:transport?', async (c) => {
     const url = new URL(c.req.url);
     return c.json({
        resource: url.origin,
        authorization_servers: [c.env.STYTCH_DOMAIN],
        scopes_supported: ['openid', 'email', 'profile'],
     })
  })
```

### 

3

Authorization Server Metadata

**This step is performed by Stytch**

The MCP Client will extract the authorization\_servers field from the PRM document and issue a GET request to the first authorization server's Authorization Server Metadata (ASM) endpoint, as defined by [RFC 8414](https://datatracker.ietf.org/doc/html/rfc8414#section-3.1).

The ASM endpoint is hosted by Stytch, not by your server. However, the ASM endpoint needs to know the location where you host the <IdentityProvider /> React component. Configure this in the Connected Apps section of the [Stytch Dashboard](https://stytch.com/dashboard/connected-apps). Enter the URL where the component is mounted into the Authorization URL field. If you don't have a value for this yet - put https://example.com \- we'll come back to it later.

```bash
curl -s "https://rustic-kilogram-6347.customers.stytch.com/.well-known/oauth-authorization-server" | jq
```

This will return a JSON document containing information about what functionality your Stytch project supports, and what endpoints will be used for the rest of the authorization process. For example, we see that the <IdentityProvider /> React component is hosted at <https://stytch.com/oauth/authorize>, which is communicated to the MCP Client as the authorization\_endpoint.

```json
{
  "authorization_endpoint": "https://stytch.com/oauth/authorize",
  "registration_endpoint": "https://rustic-kilogram-6347.customers.stytch.com/v1/oauth2/register",
  "token_endpoint": "https://rustic-kilogram-6347.customers.stytch.com/v1/oauth2/token",
  ...
}
```

| Field Name              | Meaning                                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| authorization\_endpoint | URL of your Stytch Project's authorization endpoint, hosted by you and configured in the Stytch Dashboard. |
| registration\_endpoint  | URL of your Stytch Project's OAuth 2.0 Dynamic Client Registration endpoint, hosted by Stytch.             |
| token\_endpoint         | URL of your Stytch Project's token endpoint, hosted by Stytch.                                             |

### 

4

Dynamic Client Registration

**This step is performed by Stytch**

The MCP Client needs to be given a client\_id by Stytch, in order to uniquely identify itself. There are two ways for this to happen:

* **Pre-registration** \- if the MCP Client already has a client\_id, it may use that client\_id and skip this step. Some MCP Clients will let users specify their own client\_id. This is especially common in Enterprise environments where there are more limitations on what parties have access to sensitive data.
* **Dynamic registration** \- the MCP Client can send a [Dynamic Client Registration](https://datatracker.ietf.org/doc/html/rfc7591) (DCR) request to your Stytch Project's [DCR Endpoint](https://stytch.com/docs/api/connected-app-dynamic-client-registration) and be granted a unique client\_id on the fly.

Dynamic Client Registration is an opt-in feature, and must be enabled in the [Connected Apps](https://stytch.com/dashboard/connected-apps) dashboard.

```bash
curl -s "https://rustic-kilogram-6347.customers.stytch.com/v1/oauth2/register" \
  -H 'Content-Type: application/json' \
  -d '{
    "client_name": "MCP Inspector",
    "redirect_uris": ["http://localhost:6274/oauth/callback"],
    "grant_types": ["authorization_code", "refresh_token"],
    "response_types": ["code"]
  }' | jq
```

Stytch will return a JSON blob with the client registration information. This will be a superset of the original registration metadata, and will contain a newly-issued client\_id. All clients created through DCR will be [Third Party Public](https://stytch.com/docs/guides/connected-apps/client-types) clients within Stytch.

```json
{
  "client_id": "connected-app-live-aa7562c6-67b6-4363-bbc0-643fed5990ec",
  "client_name": "MCP Inspector",
  "grant_types": ["authorization_code", "refresh_token"],
  "redirect_uris": ["http://localhost:6274/oauth/callback"],
  "response_types": ["code"],
  ...
}
```

### 

5

Request Consent

**This step is performed by the MCP Client**

The MCP client will now open a browser window to the authorization\_endpoint previously returned in the ASM document. The MCP client will pass in various query parameters to tell us who it is and what data it is trying to access. The full set of parameters that may be passed are detailed in the [OAuth 2.1 Authorization Request](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-13#name-authorization-request) specification.

```js
const base = "https://stytch.com/oauth/authorize";

const params = new URLSearchParams({
   // The client_id issued from Dynamic Client Registration in step 4
   client_id: "connected-app-live-aa7562c6-67b6-4363-bbc0-643fed5990ec",
   // Where the user should be redirected back with the code
   // This _must_ match one of the `redirect_uris` previously registered
   redirect_uri: "http://localhost:6274/oauth/callback",
   // The desired response - an authorization code
   response_type: "code",
   // The permissions being requested
   // Usually inferred from the `scopes_supported` field in the PRM
   scope: "openid email profile manage:project_data",
   // An opaque value used by the client to track login state
   // The AS will return this value in the callback
   state: "29499...",
   // A PKCE code challenge - a one-time secret created by the client to secure the request
   code_challenge: "meY9Iy...",
   code_challenge_method: "S256",
});

// Perform a full-page navigation
window.location.href = `${base}?${params.toString()}`;
```

### 

6

Grant Consent

**This step is performed by your main application**

The authorization\_endpoint is the location of a web page hosting the Stytch <IdentityProvider /> React component. This component will parse the query parameters passed by the MCP Client in step 5, validate the authorization request, and prompt the user for consent. If the user consents to share their data with the MCP Client, the user will be redirected back to the redirect\_uri owned by the client with a code.

```js
import { IdentityProvider, useStytchUser } from '@stytch/react';
import { useEffect } from 'react';

const OAuthAuthorizePage = () => {
  const { user } = useStytchUser();

  // The user must be logged in before they can consent to share data
  useEffect(() => {
    if (!user) window.location.href = '/login';
  }, [user]);

  return <IdentityProvider />;
};
```

```js
import { StytchUIClient } from '@stytch/vanilla-js';

const stytch = new StytchUIClient('PUBLIC_TOKEN');

// The user must be logged in before they can consent to share data
if (!stytch.user.getSync()) {
  throw Error('User is not logged in; please redirect to login')
}

stytch.mountIdentityProvider({
  // replace this with a selector for the element where you want to render the component
  elementId: '#stytch-idp-container',
});
```

### 

6

Exchange Authorization Code

**This step is performed by Stytch**

The <IdentityProvider /> React component will redirect the user back to the client with an authorization code that the client exchanges for tokens. The client will call the token\_endpoint listed in the ASM response - an endpoint hosted by Stytch.

```bash
curl -X POST "https://rustic-kilogram-6347.customers.stytch.com/v1/oauth2/token" \
  -d "grant_type=authorization_code" \
  -d "client_id=connected-app-live-aa7562c6-67b6-4363-bbc0-643fed5990ec" \
  -d "code=$CODE" \
  -d "code_verifier=$CODE_VERIFIER" \
  -d "redirect_uri=http://localhost:6274/oauth/callback"
```

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "refresh_token": "def502...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

The access token can now be used by the MCP Client to make requests to the MCP server.

### 

7

Complete

Finally, the MCP Client can make requests to your MCP Server using the access token embedded in the Authorization header:

```bash
curl -X POST "https://mcp.stytch.dev/mcp" \
  -H 'Authorization: Bearer $ACCESS_TOKEN'
```

The middleware we implemented in Step 1 will validate this token and process the request. Your MCP Server can now use the authenticated MCP Client's information inside tool calls.

## What's Next

You should now have a working overview of all the steps that go in to setting up authorization for MCP servers.

* Follow along with our [Cloudflare](https://stytch.com/docs/guides/connected-apps/mcp-servers) MCP Guide and demo app
* Learn more about [OAuth Scopes](https://stytch.com/docs/guides/connected-apps/oauth-scopes) in the Stytch platform
