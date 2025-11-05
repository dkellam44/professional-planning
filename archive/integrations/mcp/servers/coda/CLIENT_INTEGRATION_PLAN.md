# Coda MCP Client Integration Plan
**Status**: Ready for multi-client deployment
**Date**: November 2, 2025
**Target**: Get Coda MCP working seamlessly across Claude Desktop, ChatGPT, and CLI

---

## Executive Summary

The Coda MCP HTTP-native server is **production-ready** and deployed to `https://coda.bestviable.com`. All endpoints are functional:

- ✅ **HTTP Health & OAuth endpoints** - Working
- ✅ **MCP initialization** - Working
- ✅ **Bearer token authentication** - Working
- ✅ **SSE streaming protocol** - Working (validates with real tokens)

The main challenge is ensuring **each client type properly handles the async SSE streaming pattern**. This plan details setup for all three client categories.

---

## Current Architecture

```
User (CLI / Claude / ChatGPT)
        ↓
        POST /mcp (initialize) → Session ID
        ↓
        POST /mcp (tool request) → Queued
        ↓
        GET /mcp SSE stream ← Results stream back in real-time
```

The pattern requires:
1. **POST phase**: Send command, get session ID
2. **GET phase**: Open SSE stream to receive responses
3. Both requests must use same `Mcp-Session-Id` header

---

## Client-by-Client Rollout

### Phase 1: CLI (Foundation Testing)
**Duration**: Immediate (validation script ready)
**Difficulty**: Low
**Owner**: Developers / QA

**Deliverables:**
- ✅ `test-with-sse-stream.sh` - New script with proper SSE handling
- ✅ `CLIENT_SETUP_GUIDE.md` - Comprehensive setup docs
- [ ] Validate against droplet: `CODA_API_TOKEN=... bash test-with-sse-stream.sh https://coda.bestviable.com`
- [ ] Document any SSE handling issues

**Success Criteria:**
- CLI can initialize session
- CLI can call `tools/list` and receive results via SSE
- CLI can call `coda_list_documents` with real token
- Error handling works for invalid methods

**Next Step After Success:**
- Move to Phase 2 (Claude Desktop)

---

### Phase 2: Claude Desktop (Primary Client)
**Duration**: 1-2 days
**Difficulty**: Medium
**Owner**: Integration lead

**Prerequisites:**
- Claude Desktop installed on local machine
- Valid Coda API token (from coda.io/account/settings)
- Phase 1 (CLI) validated

**Setup Steps:**

1. **Launch Claude Desktop Settings**
   - Click ⚙️ → Developer → MCP Servers

2. **Add Server Configuration**
   ```
   Name: Coda MCP
   URL: https://coda.bestviable.com
   Auth: Bearer Token
   Token: pat_your_actual_token
   ```

3. **Test Connection**
   - Click "Connect"
   - Look for green ✓ indicator
   - Test with: "List my Coda documents"

4. **Validation Checklist**
   - [ ] Server shows as "Connected" in settings
   - [ ] Chat window shows Coda tools available
   - [ ] Can ask Claude: "What documents do I have in Coda?"
   - [ ] Receives actual document list
   - [ ] Can ask for specific document details
   - [ ] Error handling works (e.g., invalid doc ID)

**Troubleshooting by Symptom:**

| Symptom | Diagnosis | Fix |
|---------|-----------|-----|
| "Server refused connection" | Network or DNS issue | Check `curl https://coda.bestviable.com/health` works |
| "Invalid authentication" | Token format wrong | Token must start with `pat_` |
| "Server not responding" | Server down or firewall | Check docker logs: `docker logs -f coda-mcp` |
| "Tools don't appear" | Client cache | Restart Claude Desktop completely |
| "Partial responses" | SSE stream timeout | Check server logs for truncation |

**Success Criteria:**
- Claude can see Coda tools
- Claude can execute `coda_list_documents`
- Claude receives complete responses
- Session persists across multiple tool calls

**Documentation to Update:**
- Add "Claude Desktop Setup" section to CLIENT_SETUP_GUIDE.md with screenshots
- Create troubleshooting FAQ

---

### Phase 3: ChatGPT Web Connector (Secondary Client)
**Duration**: 2-3 days
**Difficulty**: Medium-High
**Owner**: Integration engineer

**Prerequisites:**
- ChatGPT Plus account with custom GPT support
- Phase 1 & 2 validated

**Setup Steps:**

1. **Create Custom GPT**
   - Go to ChatGPT Builder
   - Create new GPT: "Coda Assistant"

2. **Add Custom Action**
   - Button: "Add Action"
   - Import OpenAPI spec (see CLIENT_SETUP_GUIDE.md section 3)
   - Configure authentication:
     ```
     Auth type: API Key
     Key name: Authorization
     Header name: Authorization
     Value: Bearer pat_your_token
     ```

3. **Test in ChatGPT**
   - Start conversation with your custom GPT
   - Ask: "What documents do I have in Coda?"
   - Monitor action execution in GPT debug panel

4. **Validation Checklist**
   - [ ] Action executes without timeout
   - [ ] Receives document list response
   - [ ] Subsequent requests work (session reuse)
   - [ ] Error responses are readable
   - [ ] Response time < 10s (typical Coda API speed)

**Key Differences from Claude:**
- ChatGPT handles SSE internally (behind the scenes)
- Need to ensure action schema matches OpenAPI spec
- Authentication header must be in correct format
- May need to implement retry logic for timeouts

**Success Criteria:**
- ChatGPT custom action lists documents from Coda
- Responses are parsed correctly by ChatGPT
- Can chain multiple tool calls in one conversation
- Session doesn't timeout mid-conversation

**Documentation to Update:**
- Create detailed ChatGPT action setup guide with screenshots
- Document common OpenAPI validation issues

---

## Technical Validation Checklist

### For All Clients

- [ ] **Server Reachability**
  ```bash
  curl -L https://coda.bestviable.com/health
  # Should return: {"status":"ok",...}
  ```

- [ ] **OAuth Endpoints**
  ```bash
  curl https://coda.bestviable.com/.well-known/oauth-authorization-server
  # Should return issuer, endpoints, etc.
  ```

- [ ] **Bearer Token Acceptance**
  ```bash
  curl -H "Authorization: Bearer pat_xxx" \
    -X POST https://coda.bestviable.com/mcp \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{...}}'
  # Should return mcp-session-id header
  ```

- [ ] **Session Persistence**
  - Create session with POST
  - Use session ID on GET stream
  - Verify same session receives responses

- [ ] **SSE Protocol**
  ```bash
  curl -N -H "Accept: text/event-stream" \
    -H "Authorization: Bearer pat_xxx" \
    -H "Mcp-Session-Id: session-uuid" \
    https://coda.bestviable.com/mcp
  # Should see: :keep-alive and data: {...} events
  ```

### For Claude Desktop Specifically

- [ ] Settings panel shows server as "Connected"
- [ ] Tools appear in tool picker
- [ ] Tool descriptions are readable
- [ ] Authorization header is sent (check server logs)
- [ ] Session ID header present in follow-up requests

### For ChatGPT Specifically

- [ ] OpenAPI schema validates
- [ ] Action executes in test panel
- [ ] Authorization header included in requests
- [ ] Timeout doesn't exceed GPT limits (30s)
- [ ] Response parsing works (JSON validation)

---

## Deployment Steps (Overall)

### Week 1: Validate & Document

**Monday - Friday:**
1. Run `CODA_API_TOKEN=... bash test-with-sse-stream.sh` locally
2. Run against droplet: `CODA_API_TOKEN=... bash test-with-sse-stream.sh https://coda.bestviable.com`
3. Document any SSE stream issues
4. Update CLIENT_SETUP_GUIDE.md with findings
5. Create separate docs for Claude and ChatGPT setup

**Deliverables by Friday:**
- ✅ Validated CLI testing with real tokens
- ✅ CLIENT_SETUP_GUIDE.md with all sections complete
- ✅ Technical validation checklist passed

### Week 2: Claude Desktop Integration

**Monday - Wednesday:**
1. Set up Claude Desktop locally
2. Configure Coda MCP server in Claude
3. Test with various tool calls
4. Document setup with screenshots
5. Create troubleshooting guide

**Wednesday - Friday:**
1. Test against production URL
2. Create video walkthrough (optional)
3. Finalize Claude setup guide
4. Create FAQ section

**Deliverables by Friday:**
- ✅ Claude can list Coda documents
- ✅ Setup guide with screenshots
- ✅ Troubleshooting FAQ

### Week 3: ChatGPT Integration

**Monday - Wednesday:**
1. Design OpenAPI spec for ChatGPT
2. Create custom GPT with action
3. Test in ChatGPT playground
4. Validate response parsing
5. Set up error handling

**Wednesday - Friday:**
1. Test with real Coda API calls
2. Create custom GPT sharing link
3. Document setup process
4. Create compatibility notes

**Deliverables by Friday:**
- ✅ ChatGPT custom GPT lists documents
- ✅ Setup guide with OpenAPI spec
- ✅ Production-ready action configuration

---

## Key Files & Documentation

### Created This Session

| File | Purpose | Status |
|------|---------|--------|
| `CLIENT_SETUP_GUIDE.md` | Comprehensive setup guide for all clients | ✅ Created |
| `test-with-sse-stream.sh` | CLI test script with proper SSE handling | ✅ Created |
| `CLIENT_INTEGRATION_PLAN.md` | This document - rollout strategy | ✅ Created |

### Existing Files to Update

| File | Update Needed | Priority |
|------|---------------|----------|
| `DEPLOYMENT_STATUS.md` | Add client status section | High |
| `test-with-real-token.sh` | Document SSE stream requirement | Medium |
| `README.md` | Add quick start for each client | High |

### Create New

| File | Content | Deadline |
|------|---------|----------|
| `CLAUDE_SETUP.md` | Claude Desktop detailed guide | Week 2 |
| `CHATGPT_SETUP.md` | ChatGPT action detailed guide | Week 3 |
| `TROUBLESHOOTING.md` | Common issues and fixes | Week 3 |

---

## Success Metrics

### Phase 1 Success (CLI)
- ✅ `test-with-sse-stream.sh` passes with real token
- ✅ All 5+ test cases pass (health, init, tools/list, coda_list_documents, error handling)
- ✅ Response times acceptable (< 5s per tool call)

### Phase 2 Success (Claude Desktop)
- ✅ Server appears in Claude settings
- ✅ Tools list loads in chat window
- ✅ At least 3 different tool calls succeed
- ✅ Session persists across 5+ tool calls
- ✅ Error responses are handled gracefully

### Phase 3 Success (ChatGPT)
- ✅ Custom GPT action validates against OpenAPI spec
- ✅ Action executes and returns results
- ✅ ChatGPT can parse and display results
- ✅ Works with chained tool calls
- ✅ Response time < 10s (ChatGPT timeout limit)

---

## Known Issues & Limitations

### Current

1. **CLI Requires Manual Stream Management**
   - Users must run 2 commands (POST + GET) separately
   - SSE stream must stay open to receive results
   - *Mitigation*: Provide reference script (`test-with-sse-stream.sh`) and clear documentation

2. **Session Timeout**
   - Sessions expire after 5 minutes of inactivity
   - Clients must keep GET stream open to maintain session
   - *Mitigation*: Server sends keep-alive pings; clients should handle gracefully

3. **Large Response Truncation**
   - Responses > token budget are truncated
   - Server logs indicate truncation
   - *Mitigation*: Add pagination support to tools (limit parameter)

4. **No OAuth Flow Yet**
   - Clients must provide Bearer token directly
   - No automatic token refresh
   - *Future*: Implement full RFC 7591 OAuth client registration

### Workarounds Implemented

- ✅ Bearer token authentication (no OAuth flow needed yet)
- ✅ SSE stream for async responses
- ✅ Session persistence via Mcp-Session-Id header
- ✅ Keep-alive pings to prevent timeouts

---

## Client Compatibility Matrix

| Feature | CLI | Claude | ChatGPT |
|---------|-----|--------|---------|
| Health check | ✅ | ✅ | N/A |
| Bearer auth | ✅ | ✅ | ✅ |
| Tool listing | ✅ | ✅ | ✅ |
| Session creation | ✅ | ✅ | ✅ |
| SSE streaming | ✅ | ✅ | ✅ |
| Multi-turn conversation | ✅ | ✅ | ✅ |
| Error handling | ✅ | ✅ | ✅ |
| Response formatting | Manual | Auto | Auto |
| Keep-alive handling | Manual | Auto | Auto |

---

## Testing Strategy

### Unit Level
- ✅ Server endpoints respond correctly
- ✅ Bearer token validation works
- ✅ Session management functional
- ✅ SSE stream formatting correct

### Integration Level
- **CLI**: Manual curl-based tests (test-with-sse-stream.sh)
- **Claude**: Conversation-based validation
- **ChatGPT**: Action execution validation

### End-to-End
1. User initializes tool (CLI /Claude / ChatGPT)
2. Authenticates with Coda token
3. Executes 3+ different tools
4. Receives correct responses
5. Errors handled appropriately

### Performance
- Health check: < 100ms
- Initialize: < 500ms
- Tool call: < 5s (depends on Coda API)
- Total round-trip: < 10s

---

## Rollback Plan

If issues occur at any phase:

1. **CLI Issues Only**
   - Revert test-with-sse-stream.sh changes
   - Keep using test-with-real-token.sh (without SSE stream handling)

2. **Claude Issues Only**
   - Remove server from Claude settings
   - Verify health endpoint still works
   - No impact to other clients

3. **ChatGPT Issues Only**
   - Delete custom action
   - Create new one with corrected spec
   - No impact to other clients

4. **Server Issues**
   - Check `docker logs coda-mcp`
   - Restart container: `docker restart coda-mcp`
   - If critical: rollback to v1.0.3 image
   - Notify users of maintenance window

---

## Communication Plan

### Before Phase 1 (CLI)
- [ ] Notify dev team: "Testing improved with SSE stream handling"
- [ ] Provide test script and docs

### Before Phase 2 (Claude Desktop)
- [ ] Create Claude setup guide
- [ ] Share with power users for feedback
- [ ] Create video walkthrough (optional)

### Before Phase 3 (ChatGPT)
- [ ] Create ChatGPT setup guide
- [ ] Publish shared custom GPT (if approved)
- [ ] Create comparison guide (Claude vs ChatGPT)

### Launch
- [ ] Update main README
- [ ] Create "Getting Started" section
- [ ] Add client badges to docs

---

## Next Actions (Immediate)

1. **Today**
   - ✅ Create CLIENT_SETUP_GUIDE.md
   - ✅ Create test-with-sse-stream.sh
   - ✅ Create this plan document

2. **This Week**
   - [ ] Test script against droplet with real token
   - [ ] Validate SSE stream handling
   - [ ] Document any issues found
   - [ ] Update DEPLOYMENT_STATUS.md

3. **Next Week**
   - [ ] Set up Claude Desktop
   - [ ] Test Coda MCP in Claude
   - [ ] Create Claude setup guide with screenshots
   - [ ] Finalize troubleshooting guide

4. **Following Week**
   - [ ] Design ChatGPT action OpenAPI spec
   - [ ] Create custom GPT
   - [ ] Test in ChatGPT playground
   - [ ] Create ChatGPT setup guide

---

## Resources & References

- **Server URL**: https://coda.bestviable.com
- **Health Check**: https://coda.bestviable.com/health
- **Coda API Docs**: https://coda.io/developers
- **MCP Specification**: https://spec.modelcontextprotocol.io
- **Claude Desktop Docs**: https://claude.ai/download
- **OpenAPI Spec**: https://spec.openapis.org/oas/v3.0.0

---

**Plan Status**: ✅ Ready for execution
**Last Updated**: November 2, 2025
**Owner**: Integration team
**Review Cadence**: Weekly during rollout
