MCP and OAuth Dynamic Client Registration
Auth & identity

Apr 12, 2025

Author: Edwin Lim

MCP and OAuth Dynamic Client Registration
The Model Context Protocol (MCP) is quickly becoming the connective tissue between AI agents and the external tools or data they interact with. But with that flexibility comes a need for strong security: How do you make sure that any AI agent trying to connect to your MCP server is trustworthy? And how do you do this in a scalable way when new agents are constantly being created?

That’s where OAuth 2.0’s Dynamic Client Registration comes in, which is officially supported in MCP authorization specification.

In this post, we’ll explain what Dynamic Client Registration is, how it works, and why it’s essential for authentication between MCP servers and AI agents.

Understanding the MCP authentication challenge
MCP defines a client-server architecture where AI agents act as clients and MCP servers provide access to tools and services. To ensure secure communication, AI agents need to authenticate using OAuth 2.0.

MxN problem of manual OAuth registration
Traditionally, this involves manual client registration which is impractical at the scale of agentic AI. It’s not feasible or practical to require developers to manually register every MCP client with every MCP server. In particular:

AI agents must connect to numerous, unknown numbers of MCP servers
Manual registration introduces friction for developers and users
The number of potential client-server combinations grows exponentially
OAuth 2.0 Dynamic Client Registration solves this M × N problem by allowing AI agents to autonomously discover, register, and authenticate with MCP servers at runtime.

What is OAuth 2.0 Dynamic Client Registration?
Dynamic Client Registration is an extension to the OAuth 2.0 framework, defined in RFC 7591, that allows Relying Parties to register themselves programmatically with an OAuth2 Authorization Server.

Instead of pre-registering an application with a manual setup of credentials, Dynamic Client Registration allows the Relying Party to make a POST request with metadata (like redirect URIs and grant types) to a registration endpoint.

POST /register HTTP/1.1
Content-Type: application/json
Accept: application/json
Host: mcp.server.com
{
  "client_name": "My AI agent",
  ...metadata
}
Dynamic Client Registration allows for self-service onboarding for applications without developer intervention, which makes it particularly valuable in large-scale OAuth ecosystems.

Why Dynamic Client Registration matters for MCP and AI agents
MCP is designed for a many-to-many world, where AI agents need to authenticate and connect to a wide range of independently operated MCP servers. Dynamic Client Registration solves this challenge by allowing AI agents to discover, register, and obtain credentials from MCP servers at runtime.

With Dynamic Client Registration, the MCP servers can:

Onboard AI agents dynamically: An AI agent encountering a new MCP server can register and get credentials without human intervention or prior coordination.
Scale securely: Each agent gets its own identity and credentials, preventing token reuse or spoofing.
Delegate permissions: Agents request scopes; users approve access; tokens encode both keeping permissions granular and user-approved.
Comply with OAuth2.1: The MCP spec leans heavily on OAuth 2.1, including support for PKCE and dynamic flows.
MCP specification on Dynamic Client Registration
MCP specification on Dynamic Client Registration.
How Dynamic Client Registration works in MCP OAuth flow
Full MCP OAuth flow 
Here’s how the flow typically works within the MCP OAuth flow:

Discovery: The AI agent retrieves metadata from the MCP server, discovering OAuth endpoints.
Registration*: The agent sends a registration request to the /register endpoint. This is where Dynamic Client Registration starts.
Client Creation*: The authorization server creates a new OAuth client and stores its details. This is where Dynamic Client Registration happens.
Credentials Return: The authorization server returns the client ID and secret (if required).
Authorization: The agent initiates the OAuth flow using the returned credentials.
Token Exchange: The agent exchanges the auth code for access and refresh tokens.
Authenticated Access: The agent uses these tokens to access tools via the MCP server.
For a hands-on look, check out our MCP to-do list example app or B2B MCP OKR manager example app see how the OAuth flow code is structured and executed between MCP client and server.

Scalable, secure auth for AI agents
Dynamic Client Registration auto registering clients
OAuth 2.0 Dynamic Client Registration unlocks scalable, secure, and automated onboarding for AI agents in the MCP ecosystem. By enabling AI agents to register themselves at runtime and request delegated access via OAuth tokens, MCP servers can eliminate the bottlenecks of manual registration, gain strong OAuth security posture, and create a frictionless agent experience.

If you’re building an MCP server or AI integrations, Dynamic Client Registration, along with several other core OAuth flows, is a foundational requirement for secure, scalable agent authentication.

OAuth for your MCP servers
Stytch Connected Apps provides everything you need to make your MCP server OAuth-compliant and ready for secure agent registration out of the box, including full support for Dynamic Client Registration and OAuth 2.1 flows.

Stytch dashboard DCR
With Connected Apps, you don’t need to reinvent the wheel when it comes to OAuth infrastructure. Stytch takes care of the heavy lifting so you can focus on building great agentic experiences.

Stytch enabling MCP OAuth
Here’s some of what Stytch provides out of the box:

Core OAuth 2.1 specification
Dynamic Client Registration
Authorization Server Metadata
Custom Scopes based on Resources/Actions granted as permissions to end users
End user and IT Admin management of granted consent
Thinking about integrating MCP into your stack? Want to build secure agentic experiences without owning every piece of auth infrastructure?

Contact us for a demo or sign up and check out our MCP quickstart guide.