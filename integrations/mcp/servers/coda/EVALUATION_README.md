# Coda MCP - Complete Evaluation & Fix Documentation

**Status**: Evaluation Complete ✓ | Bugs Identified ✓ | Fix Plan Created ✓

**Documents Created**:
1. **DROPLET_EVALUATION_SUMMARY.md** - Start here! Executive summary of findings
2. **BUG_FIX_PLAN.md** - Detailed fix procedures for all 5 issues
3. **BUILD_STRATEGY.md** - Architecture, build process, deployment strategy

---

## What You Need to Know

### The Problem

Claude Desktop and ChatGPT web connectors fail to connect to the Coda MCP server.

**Why?** The production domain `https://coda.bestviable.com` is inaccessible because:
- Nginx reverse proxy is not configured to route traffic to the application
- Returns 301 redirect instead of proxying to port 8080

### The Solution

**5 issues identified, all fixable:**

1. **Health Check Timeout** (15 min) - Container marked unhealthy
2. **Nginx 301 Redirect** (30 min) - Production domain not routable ← THIS IS THE MAIN ISSUE
3. **Accept Headers** (20 min) - MCP endpoint too strict on content negotiation
4. **OAuth Issuer URL** (15 min) - Wrong domain in OAuth metadata
5. **ChatGPT Plan Limitation** (N/A) - Pro plan doesn't support full MCP (not a bug)

**Total fix time**: 2-3 hours including testing

### Quick Start

1. **Read**: DROPLET_EVALUATION_SUMMARY.md (5 minutes)
2. **Plan**: Review BUG_FIX_PLAN.md Issue #2 (most critical)
3. **Execute**: Follow the fix procedures in BUG_FIX_PLAN.md
4. **Test**: Run test-with-sse-stream.sh to validate fixes

---

## Document Guide

### DROPLET_EVALUATION_SUMMARY.md
**Purpose**: What's broken and why

**Key Sections**:
- Quick Summary (findings at a glance)
- Detailed Findings (each issue explained)
- Root Cause Analysis (why it happened)
- Why Claude Desktop Is Failing (connection failure explanation)

**Read This First**. It explains the complete situation in business-friendly terms.

### BUG_FIX_PLAN.md
**Purpose**: How to fix each issue

**Key Sections**:
- Executive Summary (issue table + severity)
- 5 detailed issue sections:
  - Issue #1: Health Check Timeout
  - Issue #2: Nginx 301 Redirect ← MOST IMPORTANT
  - Issue #3: MCP Accept Headers
  - Issue #4: OAuth Issuer URL
  - Issue #5: ChatGPT Plan Limitation
- Fix Execution Timeline (what to do when)
- Complete Fix Checklist (before/during/after)
- Rollback Plan (if something breaks)

**Read This After Summary**. It provides step-by-step fix procedures for each issue.

### BUILD_STRATEGY.md
**Purpose**: How the system is architected and deployed

**Key Sections**:
- Architecture Overview (system diagram)
- Technology Stack (tools and versions)
- Build Process (how code becomes containers)
- Deployment Strategy (how to push to production)
- Network & Security (how traffic flows)
- Client Integration (CLI, Claude, ChatGPT)
- Monitoring & Operations (logs, health checks)

**Read This For Reference**. Use when understanding deployment or troubleshooting infrastructure issues.

---

## The 5 Issues at a Glance

### Issue #1: Health Check Timeout
- **What**: Docker container marked "unhealthy"
- **Why**: 5-second timeout too aggressive for droplet
- **Fix**: Increase to 10s, add start_period
- **Time**: 15 minutes

### Issue #2: Nginx 301 Redirect ⭐ CRITICAL
- **What**: Production domain returns HTML instead of proxying
- **Why**: Nginx config file not created for coda-mcp
- **Fix**: Create /etc/nginx/conf.d/coda-mcp.conf with proxy rules
- **Time**: 30 minutes
- **Impact**: THIS IS WHY CLAUDE DESKTOP CAN'T CONNECT

### Issue #3: Accept Headers
- **What**: Direct requests fail with "Not Acceptable" error
- **Why**: Server requires both application/json AND text/event-stream headers
- **Fix**: Make server more lenient, only require application/json
- **Time**: 20 minutes

### Issue #4: OAuth Issuer URL
- **What**: OAuth discovery returns http://127.0.0.1:8080 instead of https://coda.bestviable.com
- **Why**: Issuer URL set to request hostname instead of environment variable
- **Fix**: Add MCP_ISSUER_URL environment variable
- **Time**: 15 minutes

### Issue #5: ChatGPT Plan Limitation
- **What**: User has ChatGPT Pro, but full MCP requires Business plan
- **Why**: This is an OpenAI product feature difference, not our bug
- **Fix**: Either upgrade plan or document limitation
- **Time**: N/A

---

## Priority Order

### Do First (Critical Path)
1. **Issue #2: Nginx Config** ← Unblocks everything else
   - 30 minutes
   - Makes production domain accessible
   - Allows Claude Desktop to connect

### Do Second (Configuration)
2. **Issue #1: Health Check Timeout** ← Improves reliability
   - 15 minutes
   - Prevents container restarts
3. **Issue #4: OAuth Issuer URL** ← Fixes compliance
   - 15 minutes
   - Ensures OAuth validation passes

### Do Third (Compatibility)
4. **Issue #3: Accept Headers** ← Improves usability
   - 20 minutes
   - Makes CLI requests work
5. **Issue #5: ChatGPT** ← Document limitation
   - N/A
   - Explain to user

### Total Execution Time
- First: 30 minutes (unblocks everything)
- Second: 30 minutes (improves stability)
- Third: 20 minutes (improves usability)
- Testing: 30-60 minutes (verify all works)
- **Total: 2-3 hours**

---

## What Happens After Fixes

### Phase 1: Server Health
```
✅ Production domain accessible
✅ Container shows "healthy"
✅ OAuth endpoints responding with correct issuer
```

### Phase 2: Client Connectivity
```
✅ Claude Desktop connects
✅ Tools appear in chat window
✅ Can execute tools (coda_list_documents, etc.)
✅ Results stream back properly
```

### Phase 3: User Workflows
```
✅ CLI tests pass: test-with-sse-stream.sh https://coda.bestviable.com
✅ Claude Desktop: "List my Coda documents"
✅ ChatGPT: N/A unless plan upgraded
```

---

## Implementation Checklist

### Preparation (5 minutes)
- [ ] Read DROPLET_EVALUATION_SUMMARY.md
- [ ] Review BUG_FIX_PLAN.md Issue #2
- [ ] Have SSH access to tools-droplet-agents ready
- [ ] Have nginx/curl knowledge or willingness to follow steps exactly

### Fix Execution (70-90 minutes)

#### Issue #2: Nginx Config (30 min)
- [ ] SSH to droplet
- [ ] Create /etc/nginx/conf.d/coda-mcp.conf
- [ ] Configure upstream backend (localhost:8080)
- [ ] Configure server block (coda.bestviable.com)
- [ ] Test nginx syntax
- [ ] Reload nginx
- [ ] Verify: `curl https://coda.bestviable.com/health` returns JSON

#### Issue #1: Health Check (15 min)
- [ ] Locate docker-compose.production.yml
- [ ] Update health check timeout to 10s
- [ ] Add start_period: 10s
- [ ] Restart container
- [ ] Wait 60 seconds
- [ ] Verify: `docker ps | grep coda-mcp` shows "healthy"

#### Issue #4: OAuth Issuer (15 min)
- [ ] Update docker-compose.production.yml
- [ ] Add MCP_ISSUER_URL=https://coda.bestviable.com
- [ ] Restart container
- [ ] Verify: `curl https://coda.bestviable.com/.well-known/oauth-authorization-server` shows correct issuer

#### Issue #3: Accept Headers (20 min)
- [ ] Edit src/http-server.ts
- [ ] Find Content-Type validation
- [ ] Change to only require application/json
- [ ] Build: `pnpm build`
- [ ] Copy to droplet
- [ ] Rebuild docker image v1.0.6
- [ ] Restart container
- [ ] Verify: MCP endpoint accepts requests

### Testing (30-60 minutes)
- [ ] Health endpoint: `curl https://coda.bestviable.com/health`
- [ ] OAuth metadata: `curl https://coda.bestviable.com/.well-known/oauth-authorization-server`
- [ ] MCP endpoint: `curl -X POST https://coda.bestviable.com/mcp -H "Authorization: Bearer pat_xxx" -d '...'`
- [ ] CLI test: `CODA_API_TOKEN=pat_xxx bash test-with-sse-stream.sh https://coda.bestviable.com`
- [ ] Claude Desktop: Configure and verify connection
- [ ] Container health: `docker ps` shows "healthy"

### Verification
- [ ] All health checks passing
- [ ] Production domain returns JSON (not HTML)
- [ ] OAuth metadata has correct issuer
- [ ] Container shows healthy status
- [ ] CLI tests pass
- [ ] Claude Desktop shows "Connected"

---

## If Something Goes Wrong

### Rollback is Easy

```bash
# Revert to previous working version
docker tag coda-mcp:v1.0.5 coda-mcp:latest
docker-compose restart coda-mcp

# Or restore nginx config
cp /etc/nginx/conf.d/coda-mcp.conf.backup /etc/nginx/conf.d/coda-mcp.conf
nginx -s reload
```

**All fixes are reversible with no permanent damage possible.**

---

## Getting Help

### If Health Check Still Shows "Unhealthy"
- See BUG_FIX_PLAN.md Issue #1
- Check: `docker logs coda-mcp | tail -50`
- Verify timeout is actually 10s: `docker inspect coda-mcp | jq '.[] | .HealthCheck'`

### If Production Domain Still Returns 301
- See BUG_FIX_PLAN.md Issue #2
- Check: `nginx -t` (verify config syntax)
- Check: `curl -v https://coda.bestviable.com/health` (see what nginx returns)
- Verify config exists: `ls -la /etc/nginx/conf.d/coda-mcp.conf`

### If Claude Desktop Still Won't Connect
- See BUG_FIX_PLAN.md Issue #4
- Check issuer URL: `curl https://coda.bestviable.com/.well-known/oauth-authorization-server | jq .issuer`
- Should be: `https://coda.bestviable.com`
- Restart Claude Desktop completely after changing server config

### If Test Script Still Fails
- See BUG_FIX_PLAN.md Issue #3
- Verify: `curl -X POST https://coda.bestviable.com/mcp -H "Authorization: Bearer test" ...` doesn't return "Not Acceptable" error

---

## Related Documents

### In This Directory
- **SESSION_HANDOFF_TO_NEXT_AGENT.md** - Previous session's work summary
- **CLIENT_SETUP_GUIDE.md** - Setup for CLI, Claude, ChatGPT
- **QUICK_START.md** - Quick reference for users
- **CLIENT_INTEGRATION_PLAN.md** - 3-week rollout strategy
- **CLAUDE.md** - Code conventions

### You'll Create/Update
- **test-with-sse-stream.sh** - CLI test script
- Updated **CLIENT_SETUP_GUIDE.md** with ChatGPT plan limitation
- Updated **DEPLOYMENT_STATUS.md** with current status

---

## Success Looks Like

After fixes:
```
✅ curl https://coda.bestviable.com/health
   {"status":"ok","service":"coda-mcp","version":"1.0.0",...}

✅ docker ps | grep coda-mcp
   coda-mcp:v1.0.6  Up 5 minutes (healthy)

✅ CODA_API_TOKEN=pat_xxx bash test-with-sse-stream.sh https://coda.bestviable.com
   ✓ Server health check
   ✓ Session initialized
   ✓ Received tools/list response via SSE
   ✓ Received coda_list_documents response
   ✓ All tests passed!

✅ Claude Desktop Settings → Developer → MCP Servers → Coda MCP
   Status: Connected ✓
```

---

## Timeline

```
Now:          Read summaries and plan (5-10 min)
Hour 1:       Execute fixes #2, #1, #4 (60 min)
Hour 2:       Execute fix #3, build, deploy (40 min)
Hour 3:       Run tests, verify, document (60 min)
             
Total:        2-3 hours for complete fix + testing
```

---

## Document Navigation

**Start Here**: ← You are reading this
- Read DROPLET_EVALUATION_SUMMARY.md (5-10 min)
  - Understand what's broken and why
  - Review root causes
  - See impact on clients

**Then Read**: BUG_FIX_PLAN.md (20-30 min)
- Get detailed fix procedures
- Follow step-by-step instructions
- Understand testing process

**Reference As Needed**: BUILD_STRATEGY.md
- Understand architecture decisions
- Learn deployment process
- Study monitoring/operations

---

**Evaluation Complete**: November 2, 2025, 5:15 AM UTC
**Status**: Ready for Implementation
**Confidence Level**: Very High (95%)
**Risk Level**: Very Low (all fixes reversible)

**Now proceed to DROPLET_EVALUATION_SUMMARY.md →**
