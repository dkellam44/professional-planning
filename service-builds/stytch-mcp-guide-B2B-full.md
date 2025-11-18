# Create a remote MCP server with Stytch authentication and authorization

In this guide, we'll walk through the creation of a Remote Model Context Protocol (MCP) server which manages authentication and authorization as a Stytch Connected App, including authentication and authorization through role-based access control. We will be examining a simple server that's maintaining a list of Objectives and Key Results (OKR Manager) ([GitHub project](https://github.com/stytchauth/mcp-stytch-b2b-okr-manager)). The OKR Manager has a web browser client that communicates to the app's server via an HTTP API. Additionally, the server implements the MCP protocol to become accessible to an MCP-compliant Large Language Model (LLM) AI client (for example Anthropic's [Claude](https://claude.ai/)), allowing us to compare and contrast the approach taken for each implementation. This app can be run locally and can also be deployed as a Cloudflare Worker, but the basic concepts we'll cover here generalize to any cloud platform.

## Before you start

In order to complete this guide, you'll need:

* A Stytch project. In the [Stytch Dashboard](https://stytch.com/dashboard), click on your existing project name at the top of the Dashboard, click "Create project", and select "B2B SaaS Authentication".
* The [MCP Inspector](https://github.com/modelcontextprotocol/inspector). This is a tool that will help us ensure that our MCP server is exposing the correct interface, is running properly, and allows us to explore the features of the MCP protocol in a web-based tool.

### 

1

Configure Stytch for our example app

Navigate to "Project Settings" to note your "Project ID" and "Public token". You will need these values later.

![Project ID and Public token](https://static.stytch.com/docs/_next/static/media/project-id-public-token.577d26a6.png)

Navigate to "Frontend SDKs" to enable the Frontend SDK for http://localhost:3000

![Authorized frontend applications for SDK use](https://static.stytch.com/docs/_next/static/media/authorized-frontend-applications.bcc9fd82.png)

Navigate to "Connected Apps" and enable "Allow dynamic client registration". [Dynamic Client Registration](https://datatracker.ietf.org/doc/html/rfc7591) is a protocol that allows applications to register themselves with Stytch as a Connected App client. We will dive more into how Dynamic Client Registration works [later in this guide](https://stytch.com/docs/b2b/guides/connected-apps/mcp-servers?organization%5Fid=organization-test-07971b06-ac8b-4cdb-9c15-63b17e653931#learn-how-authentication-and-authorization-with-stytch-is-implemented).

![Allow dynamic client registration](https://static.stytch.com/docs/_next/static/media/allow-dynamic-client.cdc62df8.png)

Navigate to your [Workspace Settings > Management API](https://stytch.com/dashboard/settings/management-api) and create a new workspace management key. Copy the "Key ID" and "Secret", you will need these values later. These credentials are used for Stytch's [Programmatic Workspace Actions](https://stytch.com/docs/workspace-management/pwa/overview), which allows applications to make changes to Stytch's configuration. We will use this to define roles for authorization with Stytch's [Role-Based Access Control](https://stytch.com/docs/b2b/guides/rbac/overview), which will be covered more [later in this guide](https://stytch.com/docs/b2b/guides/connected-apps/mcp-servers?organization%5Fid=organization-test-07971b06-ac8b-4cdb-9c15-63b17e653931#learn-how-authentication-and-authorization-with-stytch-is-implemented).

![Get workspace management credentials](https://static.stytch.com/docs/_next/static/media/workspace-management-credentials.614443fa.png)

### 

2

Clone the GitHub repository for this guide

The companion repository for this guide is located [in GitHub](https://github.com/stytchauth/mcp-stytch-b2b-okr-manager). Go to that repository, clone it, and follow the README to get the OKR Manager app up and running on your local machine.

Once you have the example up and running, explore its functionality and start to get a sense of how the app is structured, then return here for a tour of the app's implementation.

### 

3

Examine how the HTTP client and server implementations are built

The app exposes a straightforward REST API that implements state management and access control. This API (which can be examined at [/api/OKRAPI.ts](https://github.com/stytchauth/mcp-stytch-b2b-okr-manager/blob/main/api/OKRAPI.ts)) exposes methods to create, read, update, and delete high level Objectives, which contain zero or more Key Results to support those Objectives. State management and persistence are handled by the OKRService class, defined in [/api/OKRService.ts](https://github.com/stytchauth/mcp-stytch-b2b-okr-manager/blob/main/api/OKRService.ts), which manages the app's data in the data store.

The browser frontend includes a number of React components that work together to render the app. In [/src/OKREditor.tsx](https://github.com/stytchauth/mcp-stytch-b2b-okr-manager/blob/main/src/OKREditor.tsx) you can see how the frontend makes requests to the backend API to change the state of our data.

Take a moment to read the source code, run the app, and interact with the app's state to get a feel for how data is being modeled and what operations are valid.

### 

4

Learn how the MCP server is defined

The [MCP Core architecture documentation](https://modelcontextprotocol.io/docs/concepts/architecture) is a good reference for understanding how an MCP server is implemented. Below is a brief summary of relevant concepts.

MCP servers use a protocol based on JSON-RPC 2.0 for message passing between the remote MCP server (what we're building) and the client, which is the LLM that is integrating with the server. The RPC protocol uses POST requests and Server-Sent Events to pass messages back and forth between the server and client. There are a few core primitives (Resource, Prompts, Tools, etc...) defined by the MCP specification that describe the schema of the messages in this protocol and what behaviors can be expected.

This is a structurally different protocol than vanilla HTTP requests, so implementing a Remote MCP server is more nuanced than a typical HTTP request/response flow. Thankfully there are libraries to assist in implementing MCP servers. Our example uses [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk) to handle the specifics of conforming with the MCP protocol.

In [/api/OKRManagerMCP.ts](https://github.com/stytchauth/mcp-stytch-b2b-okr-manager/blob/main/api/OKRManagerMCP.ts), you can follow along as the McpServer class defines the resources and tools that are exposed through the MCP protocol. Note that, just as in the HTTP implementation, the MCP server uses the [OKRService class](https://github.com/stytchauth/mcp-stytch-b2b-okr-manager/blob/main/api/OKRService.ts) to handle application state.

The details of how exactly an MCP server defines its components are implementation-dependent, but for the purposes of this walkthrough the key concept is that MCP defines a protocol for our server to implement in order to establish communications with an LLM client. This protocol can coexist with an HTTP server or stand on its own, but the fundamentals of establishing authorization and authentication are similar for each.

We'll dive more deeply into how authentication is implemented in the next step.

### 

5

Learn how authentication and authorization with Stytch is implemented

### Dynamic Client Registration

[Dynamic Client Registration](https://datatracker.ietf.org/doc/html/rfc7591) is an OAuth standard for allowing a client to automatically register itself with an Identity Provider (IdP) server and is included as part of the Remote MCP protocol.

The first time the MCP Inspector attempts to access our OKR Manager app it will receive a 401 Unauthorized response. This will cause the MCP Inspector to fetch metadata about our server. In [/api/index.ts](https://github.com/stytchauth/mcp-stytch-b2b-okr-manager/blob/main/api/index.ts) the OKR Manager app creates a route at /.well-known/oauth-authorization-server which returns metadata about the OAuth server (as covered in the [Authorization Server Metadata](https://datatracker.ietf.org/doc/html/rfc8414) standard).

Once the MCP Inspector has fetched the metadata from our OKR Manager app Stytch and the MCP Inspector will handle the rest of the Dynamic Client Registration process to create a new [Connected Apps](https://stytch.com/docs/b2b/guides/connected-apps/getting-started) client.

### Connected Apps authorization

All dynamically registered clients are Third Party Public apps and will show up in the Stytch Dashboard when registration is complete.

![MCP Inspector has registered as a Connected Apps client](https://static.stytch.com/docs/_next/static/media/mcp-inspector-connected-app-client.e558e08b.png)

Now that the MCP Inspector is registered as a client app the flow continues through the standard Connected Apps authorization process. As the MCP Inspector is a "Third Party" app, this includes showing an access request dialog for the user to allow the MCP Inspector to access data in our app. Upon completion of this flow the MCP inspector should show a successful connection and allow access to the data managed by our OKR Manager app.

### Role-Based Access Control

Our OKR Manager app uses Stytch's [Role-Based Access Control](https://stytch.com/docs/b2b/guides/rbac/overview) to manage authorization. When we initially configured the app, we ran [this step](https://github.com/stytchauth/mcp-stytch-b2b-okr-manager/tree/main?tab=readme-ov-file#on-your-machine) as instructed in the GitHub README:

```bash
// Using example credentials, replace with your own
npm run update-policy -- --key-id "workspace-key-prod-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX" --secret "6ZcNGH7v9Oxxxxxxxxxx" --project-id "project-test-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
```

This command used Programmatic Workspace Actions to define roles for the OKR Manager app. On the [RBAC page](https://stytch.com/dashboard/rbac) in the Dashboard, you will now see some new Roles, Resources, and Scopes. Take a moment to examine these.

![Scopes defined by the OKR Manager app](https://static.stytch.com/docs/_next/static/media/okr-scopes.5daf1c12.png)

When the OKR Manager app begins the authorization flow with Stytch, the app [sets the desired scopes](https://github.com/stytchauth/mcp-stytch-b2b-okr-manager/blob/main/src/Auth.tsx#L98) on the request and configures the consent screen to show the desired access permissions for the inspector. If these scopes are granted by the user, they will be checked when we manage access control in the app.

### Client-side authentication

In the web client, the app [wraps the OKREditor component on export](https://github.com/stytchauth/mcp-stytch-b2b-okr-manager/blob/main/src/OKREditor.tsx#L310) in parent components that enforce authentication and authorization. For authentication, we [verify that there is a current Stytch Member](https://github.com/stytchauth/mcp-stytch-b2b-okr-manager/blob/main/src/Auth.tsx#L24) logged in and redirect to the /login page if not. For authorization, the UI uses the Stytch frontend SDK higher-order component withStytchPermissions to calculate the permissions available to the user and to pass them down as props to its wrapped component. These are [checked as the components are rendered](https://github.com/stytchauth/mcp-stytch-b2b-okr-manager/blob/main/src/OKREditor.tsx#L78) and used to present an appropriate UI that communicates the user's permissions (for instance, graying out components for operations that are not permitted to the user).

### Server-side authentication and authorization

On the server side permissions are handled slightly differently depending on whether the REST API or the MCP protocol are being used.

For the REST API, [Hono middleware](https://github.com/stytchauth/mcp-stytch-b2b-okr-manager/blob/main/api/lib/auth.ts#L29) is used to grab the Stytch session cookie and check its validity and that its claims allow access for the given resource and action. This middleware is used on each route in [/api/OKRAPI.ts](https://github.com/stytchauth/mcp-stytch-b2b-okr-manager/blob/main/api/OKRAPI.ts). As each operation happens within the context of a single API request, wrapping all the requests in the middleware will enforce the validity of each operation.

Since the MCP protocol uses long-lived connections that maintain an open channel for RPC operations, we need to handle security differently for the MCP server. Note that a connection can be established with valid credentials, but those credentials may expire during the lifetime of the long-lived connection. To handle this case properly we should check credential validity on every MCP _operation_, not on every _request_, yet the credentials are only passed with the initial request that establishes the connection.

When the connection to the MCP server is first established, again using Hono middleware, the server [saves the credentials](https://github.com/stytchauth/mcp-stytch-b2b-okr-manager/blob/main/api/lib/auth.ts#L80) from the request into properties that will be accessible to the MCP server on execution of each operation. The [OKRManagerMCP](https://github.com/stytchauth/mcp-stytch-b2b-okr-manager/blob/main/api/OKRManagerMCP.ts) class defines a helper function [withRequiredPermissions](https://github.com/stytchauth/mcp-stytch-b2b-okr-manager/blob/main/api/OKRManagerMCP.ts#L22) that is used [in the implementation of each operation](https://github.com/stytchauth/mcp-stytch-b2b-okr-manager/blob/main/api/OKRManagerMCP.ts#L105). It extracts the variables saved from when the connection was established and passes these properties on to [stytchRBACEnforcement](https://github.com/stytchauth/mcp-stytch-b2b-okr-manager/blob/main/api/lib/auth.ts#L96) to validate the credentials. This ensures that we verify access control on every operation.

### 

6

Deploying to Cloudflare

The GitHub README covers the steps necessary to deploy the app as a Cloudflare Worker. After the deploy, be sure to note that the location of the server will have changed, which requires additional configuration in Stytch. Once you have the URL for your Cloudflare Worker, repeat the process in [Step 1](https://stytch.com/docs/b2b/guides/connected-apps/mcp-servers?organization%5Fid=organization-test-07971b06-ac8b-4cdb-9c15-63b17e653931#configure-stytch-for-our-example-app) to add this URL as an "Authorized Application" in the "Frontend SDK" settings.

## What's next

* Familiarize yourself with [Stytch's SDKs](https://stytch.com/docs/b2b/sdks) for a deeper dive on how to integrate your MCP server with Stytch.
* Read more about [Role-Based Access Control](https://stytch.com/docs/b2b/guides/rbac/overview) to understand Stytch's authorization in more detail.
* Browse the [Model Context Protocol](https://modelcontextprotocol.io/introduction) documentation for more information about Remote MCP Servers.