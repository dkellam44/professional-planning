MCP 2025-11-25 is here: async Tasks, better OAuth, extensions, and a smoother agentic future
Year two starts with fewer hacks and more infrastructure.


Maria Paktiti
November 26, 2025
Yesterday, the Model Context Protocol (MCP) shipped a new spec revision: 2025-11-25—right on the one-year anniversary of MCP going public. The maintainers describe this release as a set of “highly-anticipated features” driven by production feedback from the community.

Let’s walk through what’s new and why it matters.

1. Tasks: async and long-running workflows are finally first-class
The maintainers called this a top priority for the November release: MCP needed a real story for long-running work.

The 2025-11-25 spec introduces an experimental Tasks primitive that lets any request become “call-now, fetch-later”.

Any request can now return a task handle, letting clients check status and fetch results later. Tasks can move through states like working, input_required, completed, failed, and cancelled, which makes multi-step operations much easier to coordinate.

### High-level flow:

- Client calls a tool with a task hint (“this might take a while”).
- Server starts work and returns a task ID / task resource URI immediately.
- Client subscribes or polls that task resource for progress and final results.

Why this is a big deal:

- No more hanging connections or fake progress spinners. Clients can give users real progress.
- Servers can start expensive jobs without holding a connection open.
- Unified async model across tools/resources/prompts instead of each server inventing their own.
- Agent frameworks can kick off work and keep planning.

Expect SDKs to add helpers for:

- Task creation flags.
- Task status schemas (queued/running/succeeded/failed).
- Resumable subscriptions.

## 2. OAuth got simpler: goodbye Dynamic Client Registration, hello Client ID Metadata Documents (CIMD)
Historically, MCP relied on Dynamic Client Registration (DCR) to address the many-clients/many-servers OAuth problem. In practice, DCR is kinda messy:

- Authorization servers have to expose public DCR endpoints, rate-limit them hard, and deal with unbounded client sprawl.
- Clients have to manage the client credential lifecycle in addition to tokens, and many implementations “fixed” failures by re-registering over and over.

Client ID Metadata Documents (CIMD) replaces all that.

Instead of registering at every server, an MCP client uses a URL it controls as its client_id (e.g. https://example.com/client.json) and uses the URL to identify itself during an OAuth flow. The authorization server fetches that JSON metadata doc (app name, logo, redirect URIs, keys, etc.) and proceeds with the OAuth flow.

Why it’s a win:

- Creates a decentralized trust model: your identity is anchored in DNS + HTTPS, not a per-server registration list. If you trust example.com, you trust the client.‍
- Frictionless ecosystem scaling: clients don’t need to pre-register with thousands of MCP servers, and new servers don’t need a “developer portal” story on day one.‍
- Cleaner security surface: fewer public endpoints, fewer weird cleanup policies, fewer “who even is this client?” failures.

If you’re building a client, this means:

- Host a metadata doc at a stable HTTPS URL.
- Make sure redirect URIs and optional signing keys are accurate.
- Expect servers to fetch and cache it during auth.

## 3. Security + enterprise features: two concrete upgrades
This release also tightens the “don’t shoot yourself in the foot” parts of MCP. Two small-sounding changes here actually smooth out a lot of real-world rollout pain.

- Client security requirements for local server installation (SEP-1024): If an MCP client lets users install/run local servers, the spec now requires safer install behavior: clear user consent, obvious visibility into what’s being installed, and no sneaky background installs. The intent is simple: local servers can touch your machine, so clients have to treat them like privileged software, not a casual plugin toggle.

- Default scopes in the auth spec (SEP-835): MCP finally standardizes baseline OAuth scope names. Before, every server made up its own scopes, which meant inconsistent consent screens and clients doing per-server permission gymnastics. With defaults, permissions become predictable across the ecosystem, and admins/users can actually understand what “access” means.

Net-net: MCP is getting harder to misuse and easier to govern, which is exactly what you want as it moves from demos into real enterprise deployments.

## 4. Extensions are now a real, formal concept
MCP is intentionally minimal at the core, but the ecosystem has been growing… creatively. The 2025-11-25 cycle formalizes how optional extensions are named, discovered, and configured.

The Extensions SEP introduces:

- A lightweight registry/namespace for extensions.
- Explicit extension capability negotiation.
- Support for extension settings so clients/servers can coordinate behavior without forking core spec.

Why this matters:

- Ecosystem innovation can move faster without bloating the core.
- Clients/servers can negotiate capabilities cleanly instead of inventing custom fields.
- Popular extensions can graduate into core later if they prove out.

The maintainers explicitly note that you may already have seen the MCP Apps Extension proposal (SEP-1865) and that extensions are now the right home for stuff like that.

## 5. Authorization Extensions: enterprise-managed access + M2M OAuth
Building on the Extensions framework, the spec adds Authorization Extensions. The release names the first two:

- OAuth client-credentials support for machine-to-machine flows (SEP-1046): This adds a standard M2M / “no human in the loop” OAuth path for MCP. Instead of always needing a user to click through consent, a backend service (or agent running headlessly) can authenticate with client_credentials and get an access token directly. Practically, this is what you want for cron jobs, background agents, internal automations, or “agent talks to agent” setups where there isn’t a user session to hang auth on. The win is consistency: servers can rely on one spec’d flow instead of each integration inventing their own service-token scheme.

- Enterprise IdP policy controls / Cross App Access / XAA (SEP-990): This one is aimed squarely at enterprise “shadow IT” pain. Previously, when a user connected an MCP client (like an AI app) to a tool (like Asana), OAuth happened directly between the AI app and Asana. Your corporate IdP (Okta/Entra/etc.) mostly just saw “Eric signed into Asana,” not “an AI app can now act as Eric in Asana.” That’s a visibility and policy nightmare: admins can’t easily answer which AI apps have access, what they can do, or revoke it centrally. Cross App Access (XAA) inserts the IdP back into the loop: the user signs into the MCP client with SSO, the client does a token exchange with the IdP for access to a downstream MCP server, the IdP applies policy/allowlists and issues a short-lived assertion, and the client swaps that for an MCP access token — no extra consent popups. Net effect: centralized admin control, no consent fatigue, and a much cleaner compliance story.

Together, these two extensions cover the two big real-world auth cases MCP needed: service-to-service automation and enterprise-governed user access. If you sell MCP servers into enterprises, SEP-990 in particular is a major unlock for centralized governance.

## 6. URL-mode elicitation: secure out-of-band flows
The release adds URL Mode Elicitation (SEP-1036). Instead of asking users for credentials inside the MCP client, a server can send a URL and have the user complete the sensitive flow in a browser (OAuth, payments, API keys, etc.).

Why that’s useful:

- The client never handles secrets.
- Servers can run proper third-party OAuth flows.
- You get a standardized pattern instead of custom hacks.

## 7. Sampling with tools: servers can be agentic too
Another core spec addition is Sampling with Tools (SEP-1577). Previously, sampling didn’t allow tool use, which was a gap for agentic workflows. Now, MCP servers can initiate sampling requests with tool definitions included, enabling server-side agent loops.

The release also notes that this makes context inclusion more explicit and capability-driven.

Net effect: servers can orchestrate multi-step reasoning using standard MCP primitives, not custom frameworks.

## 8. Developer-experience fixes
Finally, the release includes a batch of “papercut” improvements that make MCP implementations more consistent and less annoying to ship. None of these change the high-level model, but they remove real friction for SDK and server builders.

- Standardized tool-name format (SEP-986): Tool names now have a single canonical format, so clients can display, sort, and reference tools reliably. This avoids the current mess of different casing/namespace conventions that break interop across SDKs.
- Decoupled request payloads from RPC method defs (SEP-1319): The spec clarifies that the JSON-RPC method shape and the request/response payload schemas are separate concerns. In practice, this makes it easier to evolve payloads without “breaking” the base RPC contract, and simplifies codegen in SDKs.
- Better SSE polling / disconnect behavior (SEP-1699): Server-Sent Events are a common transport for MCP, and this update tightens how clients should poll and recover from disconnects. The result is fewer zombie connections, less duplicate work after reconnects, and more predictable streaming semantics.
- Improved spec version management for SDKs (SEP-1309): This adds clearer rules for how SDKs advertise and negotiate spec versions. That makes multi-version ecosystems safer — clients can talk to older servers (and vice-versa) without everyone guessing what “version mismatch” should mean.

Nothing headline-grabbing here, but these are the kinds of cleanups that make MCP feel stable in day-to-day production use.

## Ecosystem notes from anniversary week
Two other things you may have seen this week are not new core-spec features, but are still worth calling out:

MCP Bundles (.mcpb): shipping a local MCP server used to mean “clone a repo, run some scripts, hope PATH is friendly.” The community, as of November 20, has standardized a bundle format:
a ZIP archive containing the server artifacts + a manifest.json
portable across compatible MCP clients (Claude desktop, Claude Code, Windows MCP, etc.)
MCP Apps Extension proposal: The proposal standardizes support for interactive user interfaces in MCP. If you’re building something that needs more than a chat log (think Postman-style interfaces, dashboards, stepper workflows), this is the MCP-native way to do it.
Think of these as “first big tenants” of the new extensions + distribution story.

## What to do if you’re building on MCP
If you build MCP servers:

- Add Tasks for anything that might be slow.
- Share auth metadata via CIMD-compatible client flows.
- If you target enterprises, look hard at SEP-990 Cross App Access.
- If you’re experimenting, do it as an Extension instead of a spec fork.
- If you build MCP clients or agents:

Implement Tasks status/polling now; this will quickly become table stakes.
Support CIMD fetch + caching for OAuth.
Expect more extensions to appear and negotiate them cleanly.
WorkOS for MCP auth
If you’re building an MCP server that needs auth, WorkOS basically exists to save you from re-implementing OAuth edge cases. AuthKit works as an OAuth 2.1–compatible authorization server for MCP, aligned with the latest spec, so you can secure tools/resources with minimal protocol glue.

What this looks like in practice:

If you are already running user auth, use WorkOS Connect as an OAuth bridge: MCP clients authenticate through WorkOS, users sign in to your app, and WorkOS issues tokens that the MCP client can use with your MCP server. This is how Mux launched its MCP server quickly without rebuilding auth. For more details, see our docs.
If you don’t want to run user auth (as you should), use AuthKit for all your logins: users, AI agents, MCP clients, and servers. WorkOS AuthKit handles all the complexity of the OAuth Authorization Server. You just build the MCP tools and resource endpoints. For more details, see our docs.
Map OAuth scopes to internal roles and permissions using WorkOS RBAC. Each access token your MCP server receives will include the granted permissions so you can enforce least-privilege access.
Use WorkOS Audit Logs to see what your users, agents, and MCP clients did, when, and on whose behalf. Get enterprise-grade compliance and stream logs to your customer’s existing SIEM provider effortlessly.
MCP gives agents reach.

WorkOS helps you decide who gets that reach, to what, and under what rules.

## Closing thoughts
The 2025-11-25 spec doesn’t just add features; it adds infrastructure: async execution, scalable OAuth identity, extension lanes for experimentation, and more enterprise governance. The maintainers also stress that the release is backward compatible, so you can adopt pieces as you need them.

MCP’s first year was about proving “agents need a common protocol”. This release feels like the start of year two: making that protocol reliable enough to bet product on.

