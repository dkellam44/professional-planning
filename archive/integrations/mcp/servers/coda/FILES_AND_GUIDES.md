# Coda MCP Project Files and Guides

**Project**: Coda MCP HTTP-Native Server
**Status**: Production-Ready
**Version**: 1.0.0

---

## Quick Navigation

### For Testing
- **START HERE**: `TEST_QUICK_START.md` (30-second setup)
- **Full Guide**: `TESTING_WITH_REAL_TOKEN.md` (detailed testing)
- **Test Script**: `test-with-real-token.sh` (executable test suite)

### For Deployment
- **Full Guide**: `DROPLET_DEPLOYMENT_GUIDE.md` (step-by-step)

### For Client Integration
- **Full Guide**: `CLIENT_INTEGRATION_GUIDE.md` (Web/CLI/SDK examples)

### For Development
- **Conventions**: `CLAUDE.md` (patterns and best practices)
- **Monitoring**: `MONITORING_HEALTH_CHECKS.md`

---

## All Documentation Files

### Phase Summaries
- `PHASE_1_COMPLETION_SUMMARY.md` - Phase 1 (architecture, tools, OAuth)
- `PHASE_2_SUMMARY.md` - Phase 2 (testing, deployment, clients) [CURRENT]

### Getting Started
- `TEST_QUICK_START.md` - 2.5KB - **Start here for testing**
- `TESTING_WITH_REAL_TOKEN.md` - 14KB - Comprehensive test guide
- `DROPLET_DEPLOYMENT_GUIDE.md` - 9.9KB - Production deployment
- `CLIENT_INTEGRATION_GUIDE.md` - 17KB - Web and CLI clients

### Reference Guides
- `CLAUDE.md` - 17KB - Development conventions and patterns
- `MONITORING_HEALTH_CHECKS.md` - 400+ lines - Monitoring strategy
- `DOCKERFILE_MIGRATION_NOTES.md` - Docker optimization details
- `examples/README.md` - Example code reference

---

## Source Files

### Core Server
- `src/http-server.ts` - Main HTTP server (500+ lines)
  - Express.js setup
  - OAuth endpoints
  - MCP protocol handlers
  - Authentication middleware
  - Session management

- `src/server.ts` - MCP server definition (1068 lines)
  - 40+ tool implementations
  - Coda API SDK integration
  - Response wrapping
  - Error handling

### Supporting Modules
- `src/middleware/response-wrapper.ts` - Response metadata
- `src/types/memory-hooks.ts` - Lifecycle hooks
- `src/utils/token-counter.ts` - Token estimation
- `src/client/client.gen.ts` - Generated Coda API client

### Configuration
- `Dockerfile` - Multi-stage build (150MB)
- `.dockerignore` - Build optimization
- `tsconfig.json` - TypeScript config
- `package.json` - Dependencies
- `pnpm-lock.yaml` - Lock file

---

## Test Scripts

### Executable Scripts
- `test-oauth.sh` - OAuth endpoint tests
- `test-with-real-token.sh` - **Comprehensive test suite** (executable)
- `validate-deployment.sh` - Production validation

### Example Scripts
- `examples/curl-mcp-request.sh` - HTTP MCP example
- `examples/token-estimation-demo.ts` - Token demo

---

## Directory Structure

```
integrations/mcp/servers/coda/
├── Documentation/
│   ├── PHASE_1_COMPLETION_SUMMARY.md    (Phase 1 results)
│   ├── PHASE_2_SUMMARY.md               (Phase 2 results) [CURRENT]
│   ├── TEST_QUICK_START.md              (Testing quick ref)
│   ├── TESTING_WITH_REAL_TOKEN.md       (Full test guide)
│   ├── DROPLET_DEPLOYMENT_GUIDE.md      (Deployment steps)
│   ├── CLIENT_INTEGRATION_GUIDE.md      (Client examples)
│   ├── CLAUDE.md                        (Dev conventions)
│   ├── DOCKERFILE_MIGRATION_NOTES.md    (Docker details)
│   ├── MONITORING_HEALTH_CHECKS.md      (Monitoring guide)
│   ├── FILES_AND_GUIDES.md              (This file)
│   └── examples/
│       ├── README.md                    (Examples guide)
│       ├── curl-mcp-request.sh          (HTTP example)
│       └── token-estimation-demo.ts     (Token demo)
│
├── Source Code/
│   ├── src/
│   │   ├── http-server.ts               (Main server)
│   │   ├── server.ts                    (MCP server + 40+ tools)
│   │   ├── middleware/
│   │   │   └── response-wrapper.ts      (Response metadata)
│   │   ├── types/
│   │   │   └── memory-hooks.ts          (Lifecycle hooks)
│   │   ├── utils/
│   │   │   └── token-counter.ts         (Token estimation)
│   │   └── client/
│   │       ├── client.gen.ts            (Generated Coda client)
│   │       └── client.gen.d.ts          (Type defs)
│   │
│   ├── dist/                            (Compiled output)
│   │   ├── http-server.js               (Main server compiled)
│   │   └── *.js                         (Other compiled files)
│   │
│   ├── Dockerfile                       (Multi-stage build)
│   ├── .dockerignore                    (Build exclusions)
│   ├── tsconfig.json                    (TypeScript config)
│   ├── package.json                     (Dependencies)
│   └── pnpm-lock.yaml                   (Lock file)
│
├── Test Scripts/
│   ├── test-oauth.sh                    (OAuth tests)
│   ├── test-with-real-token.sh          (Full test suite) [EXECUTABLE]
│   └── validate-deployment.sh           (Production validation)
│
└── Configuration/
    └── (Docker Compose in parent directory)
        └── docs/ops/docker-compose.production.yml
```

---

## File Purposes Quick Reference

| File | Purpose | For Whom |
|------|---------|----------|
| `TEST_QUICK_START.md` | 30-sec testing setup | QA/Testers |
| `TESTING_WITH_REAL_TOKEN.md` | Detailed test guide | Developers/QA |
| `test-with-real-token.sh` | Automated tests | CI/CD/Manual |
| `DROPLET_DEPLOYMENT_GUIDE.md` | Production deploy steps | DevOps/Ops |
| `CLIENT_INTEGRATION_GUIDE.md` | SDK/CLI examples | Developers |
| `CLAUDE.md` | Dev conventions | Developers |
| `MONITORING_HEALTH_CHECKS.md` | Monitoring setup | Ops/DevOps |
| `PHASE_1_COMPLETION_SUMMARY.md` | Phase 1 results | Project tracking |
| `PHASE_2_SUMMARY.md` | Phase 2 results | Project tracking |

---

## Getting Started Paths

### Path 1: Test with Real Token (5-10 min)
1. Read: `TEST_QUICK_START.md`
2. Get token from https://coda.io/account/settings
3. Run: `./test-with-real-token.sh`
4. Reference: `TESTING_WITH_REAL_TOKEN.md` for details

### Path 2: Deploy to Production (20-30 min)
1. Complete Path 1 (testing)
2. Read: `DROPLET_DEPLOYMENT_GUIDE.md`
3. Follow step-by-step deployment
4. Reference: `MONITORING_HEALTH_CHECKS.md` for ops

### Path 3: Integrate with Client (15-20 min)
1. Choose platform: Web/CLI/JavaScript/TypeScript/Python
2. Read: `CLIENT_INTEGRATION_GUIDE.md`
3. Copy code example for your platform
4. Authenticate with Bearer token
5. Test: Use examples from guide

### Path 4: Understanding the Code (1+ hours)
1. Read: `CLAUDE.md` (conventions and patterns)
2. Read: `PHASE_1_COMPLETION_SUMMARY.md` (architecture)
3. Read: `src/http-server.ts` (main server)
4. Read: `src/server.ts` (tools implementation)
5. Reference: Comments in source code

---

## Key Commands Reference

### Testing
```bash
# Quick test (no token)
curl http://localhost:8080/health

# Full test suite (with token)
export CODA_API_TOKEN=pat_xxx
./test-with-real-token.sh

# Verbose output
VERBOSE=true ./test-with-real-token.sh

# Test production
./test-with-real-token.sh https://coda.bestviable.com
```

### Development
```bash
# Build
pnpm build

# Run locally
node dist/http-server.js

# Docker build
docker build -t coda-mcp:v1.0.0 .
```

### Deployment
```bash
# Copy to droplet
scp -r . tools-droplet:/root/portfolio/integrations/mcp/servers/coda/

# Deploy to production
docker-compose -f docs/ops/docker-compose.production.yml up -d coda-mcp

# Check status
curl https://coda.bestviable.com/health
```

---

## Important Notes

### Security
- Never commit CODA_API_TOKEN to git
- Use environment variables for tokens
- Only log token prefix (pat_abc...)
- Rotate tokens monthly

### Testing Order
1. Public endpoints (no token) - Verify server responds
2. OAuth endpoints - Verify metadata
3. Auth tests - Verify token validation
4. MCP tests - Verify protocol
5. Coda API tests - Verify real connectivity

### Deployment Steps
1. Test locally with real token
2. Build Docker image
3. Push to droplet
4. Update docker-compose.yml
5. Deploy with docker-compose
6. Validate with test suite
7. Monitor logs

---

## Support and Troubleshooting

### Documentation Links
- **OAuth Issues**: See `TESTING_WITH_REAL_TOKEN.md` → Token Validation Section
- **Deployment Issues**: See `DROPLET_DEPLOYMENT_GUIDE.md` → Troubleshooting
- **Code Issues**: See `CLAUDE.md` → Troubleshooting
- **Monitoring Issues**: See `MONITORING_HEALTH_CHECKS.md` → Common Issues

### Common Quick Fixes

**Server not responding**
→ `pnpm build && node dist/http-server.js`

**Tests failing**
→ `VERBOSE=true ./test-with-real-token.sh`

**401 Unauthorized**
→ Check token at https://coda.io/account/settings

**Connection refused**
→ Ensure server is running: `curl http://localhost:8080/health`

---

## File Sizes Summary

| Category | Files | Total Size |
|----------|-------|------------|
| Documentation | 9 files | 60+ KB |
| Source Code | 8 files | ~4000 lines |
| Test Scripts | 3 files | ~1500 lines |
| Configuration | 4 files | ~200 lines |

---

## Recommended Reading Order

### New to Project
1. `TEST_QUICK_START.md` (5 min)
2. `PHASE_2_SUMMARY.md` (10 min)
3. `TESTING_WITH_REAL_TOKEN.md` (15 min)
4. `DROPLET_DEPLOYMENT_GUIDE.md` (15 min)

### Integrating Clients
1. `CLIENT_INTEGRATION_GUIDE.md` (20 min)
2. Language-specific examples (10 min)
3. Copy code and test locally

### Operating/Troubleshooting
1. `MONITORING_HEALTH_CHECKS.md` (15 min)
2. Check logs: `docker logs coda-mcp`
3. Reference troubleshooting sections

### Deep Dive
1. `CLAUDE.md` (20 min)
2. `PHASE_1_COMPLETION_SUMMARY.md` (15 min)
3. Read source: `src/http-server.ts`, `src/server.ts`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-01 | Initial HTTP-native implementation with 40+ tools, OAuth, testing, and deployment guides |

---

## Next Steps

1. **Immediate** (Ready now)
   - Test with real token: `./test-with-real-token.sh`
   - Deploy to droplet: Follow `DROPLET_DEPLOYMENT_GUIDE.md`

2. **Short-term** (Week 1)
   - Integrate with Web/CLI clients
   - Set up monitoring
   - Document any issues

3. **Medium-term** (Week 2-4)
   - Add additional OEM MCPs (GitHub, n8n, Qdrant)
   - Enhance monitoring (Prometheus, Grafana)
   - Performance optimization

---

**Last Updated**: 2025-11-01
**Status**: Production-Ready
**Maintainer**: Claude / Bestviable Portfolio

