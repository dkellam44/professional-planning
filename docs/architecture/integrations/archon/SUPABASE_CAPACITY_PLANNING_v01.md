# Supabase Capacity Planning & Pricing Analysis v0.1

- entity: capacity_planning
- level: documentation
- zone: internal
- version: v01
- tags: [supabase, pricing, capacity, archon, database]
- source_path: /docs/architecture/integrations/archon/SUPABASE_CAPACITY_PLANNING_v01.md
- date: 2025-11-05

---

## Supabase Pricing Tiers (2025)

| Feature | **Free** | **Pro** ($25/mo) | **Team** ($599/mo) |
|---------|----------|------------------|-------------------|
| **Database Size** | 500 MB | 8 GB (+ $0.125/GB) | 8 GB (+ $0.125/GB) |
| **Storage** | 1 GB | 100 GB (+ $0.021/GB) | 100 GB (+ $0.021/GB) |
| **Egress** | 5 GB/mo | 250 GB/mo (+ $0.09/GB) | 250 GB/mo (+ $0.09/GB) |
| **Backups** | None | 7 days | 14 days |
| **Pausing** | After 7 days inactive | Never | Never |
| **Point-in-Time Recovery** | No | $100/mo per 7 days | $100/mo per 7 days |
| **MAUs** | 50,000 | 100,000 (+ $0.00325/MAU) | 100,000 (+ $0.00325/MAU) |
| **File Upload Limit** | 50 MB | 500 GB | 500 GB |
| **Support** | Community | Email | Email + SLA |

**Source**: https://supabase.com/pricing (accessed 2025-11-05)

---

## Your Use Case: Archon + Letta Memory System

### Database Schema Requirements

**Archon Tables** (from `migration/complete_setup.sql`):
1. `sources` - Crawled websites/documents metadata
2. `documents` - Document chunks with embeddings (1536-dim vectors via pgvector)
3. `code_examples` - Extracted code snippets
4. `archon_projects` - Project management
5. `archon_tasks` - Task tracking
6. `archon_settings` - Configuration + encrypted credentials

**Letta Tables** (future - shared database):
- Agent state/memory
- Conversation history
- Tool execution logs

**Estimated Row Sizes**:
- `documents` with embedding: ~2-5 KB per chunk (1536-dim float vector + text)
- `sources`: ~1-2 KB per source
- `code_examples`: ~1-3 KB per example
- `archon_tasks`: ~0.5-1 KB per task
- `archon_projects`: ~1-2 KB per project

---

## Capacity Estimates

### Scenario 1: Solo Developer (You)

**Assumptions**:
- 50 documentation sites crawled (e.g., React, Next.js, Supabase docs)
- 100 PDF documents uploaded
- 500 markdown files from your portfolio
- Active coding on 5 projects, 50 tasks total
- 1,000 code examples extracted

**Database Size Calculation**:

| Data Type | Count | Size per Item | Total Size |
|-----------|-------|---------------|------------|
| **Document chunks** | ~10,000 | 3 KB | 30 MB |
| **Embeddings (1536-dim)** | 10,000 | 6 KB | 60 MB |
| **Sources** | 150 | 1.5 KB | 0.2 MB |
| **Code examples** | 1,000 | 2 KB | 2 MB |
| **Projects** | 5 | 1.5 KB | 0.01 MB |
| **Tasks** | 50 | 0.8 KB | 0.04 MB |
| **Settings** | ~50 | 0.5 KB | 0.025 MB |
| **Indexes + overhead** | - | - | ~15 MB |
| **TOTAL** | | | **~107 MB** |

**Egress** (monthly):
- RAG queries: 500/month × 50 KB response = 25 MB
- UI interactions: 1,000/month × 10 KB = 10 MB
- n8n workflows: 200/month × 20 KB = 4 MB
- **Total egress: ~40 MB/month**

**Verdict**: ✅ **Free tier sufficient** (500 MB limit)

---

### Scenario 2: Growing Use (6 months from now)

**Assumptions**:
- 200 documentation sites crawled
- 500 PDF documents
- 2,000 markdown files
- 20 projects, 200 tasks
- 5,000 code examples
- Letta agent conversations added

**Database Size Calculation**:

| Data Type | Count | Size per Item | Total Size |
|-----------|-------|---------------|------------|
| **Document chunks** | ~40,000 | 3 KB | 120 MB |
| **Embeddings** | 40,000 | 6 KB | 240 MB |
| **Sources** | 700 | 1.5 KB | 1 MB |
| **Code examples** | 5,000 | 2 KB | 10 MB |
| **Projects** | 20 | 1.5 KB | 0.03 MB |
| **Tasks** | 200 | 0.8 KB | 0.16 MB |
| **Letta conversations** | 500 | 5 KB | 2.5 MB |
| **Indexes + overhead** | - | - | ~50 MB |
| **TOTAL** | | | **~424 MB** |

**Egress** (monthly):
- RAG queries: 2,000/month × 50 KB = 100 MB
- UI: 5,000/month × 10 KB = 50 MB
- n8n: 1,000/month × 20 KB = 20 MB
- **Total egress: ~170 MB/month**

**Verdict**: ✅ **Still within Free tier** (barely)

---

### Scenario 3: Heavy Use (12+ months)

**Assumptions**:
- 500+ documentation sites
- 1,000+ PDFs
- 5,000+ markdown files
- 50 projects, 500 tasks
- 10,000+ code examples
- Extensive Letta conversations

**Database Size Calculation**:

| Data Type | Count | Size per Item | Total Size |
|-----------|-------|---------------|------------|
| **Document chunks** | ~100,000 | 3 KB | 300 MB |
| **Embeddings** | 100,000 | 6 KB | 600 MB |
| **Sources** | 1,500 | 1.5 KB | 2.25 MB |
| **Code examples** | 10,000 | 2 KB | 20 MB |
| **Projects** | 50 | 1.5 KB | 0.075 MB |
| **Tasks** | 500 | 0.8 KB | 0.4 MB |
| **Letta conversations** | 2,000 | 5 KB | 10 MB |
| **Indexes + overhead** | - | - | ~100 MB |
| **TOTAL** | | | **~1,032 MB (1+ GB)** |

**Egress** (monthly):
- RAG queries: 10,000/month × 50 KB = 500 MB
- UI: 20,000/month × 10 KB = 200 MB
- n8n: 5,000/month × 20 KB = 100 MB
- **Total egress: ~800 MB/month**

**Verdict**: ⚠️ **Need Pro tier** ($25/mo)

---

## Cost Breakdown: When to Upgrade

### Free Tier Limitations

**Hard Limits**:
- 500 MB database (embeddings are the killer)
- 1 GB file storage
- 5 GB egress/month
- 50 MB max file upload
- **Pauses after 7 days inactivity** (critical issue!)

**Soft Limits**:
- No backups (risky for production)
- No point-in-time recovery
- Community support only

### Pro Tier Benefits ($25/mo)

**What you get**:
- 8 GB database (16x increase)
- 100 GB storage (100x increase)
- 250 GB egress (50x increase)
- 500 GB max file upload
- **Never pauses**
- 7-day backups
- Email support

**When to upgrade**:
1. ✅ **Database > 400 MB** (approaching limit with overhead)
2. ✅ **Egress > 4 GB/month** (avoid overages)
3. ✅ **Need production reliability** (no pausing, backups)
4. ✅ **Uploading large PDFs** (> 50 MB files)

---

## Recommended Strategy

### Phase 1: Start with Free Tier (Now - 6 months)

**Why**:
- Solo developer use case
- Testing integration
- Estimated usage well within limits
- No financial commitment

**Monitoring**:
```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('postgres'));

-- Check table sizes
SELECT
  table_name,
  pg_size_pretty(pg_total_relation_size(table_name::regclass)) as size
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY pg_total_relation_size(table_name::regclass) DESC;

-- Check vector count
SELECT COUNT(*) FROM documents WHERE embedding IS NOT NULL;
```

**Set Alerts**:
- Database size > 400 MB → Upgrade warning
- Egress > 4 GB/month → Upgrade warning
- Inactivity pausing → Keep active with health check

### Phase 2: Upgrade to Pro ($25/mo) When...

**Triggers**:
1. Database size > 450 MB (90% capacity)
2. You start using system heavily (daily RAG queries)
3. Adding Letta production agents (more conversations)
4. Need production stability (no pausing)

**Cost**: $25/month = **$300/year**

### Phase 3: Optimize Before Team Tier

**Before jumping to Team ($599/mo)**, consider:

1. **Self-hosted Supabase** (on your droplet):
   - Free (except compute)
   - Full control
   - Requires maintenance
   - Repo: https://github.com/supabase/supabase

2. **Alternative: PostgreSQL + pgvector** (self-managed):
   - DigitalOcean Managed Postgres: $15/mo for 1GB RAM, 10GB storage
   - Self-host on droplet (free, but uses droplet resources)

3. **Optimize data**:
   - Archive old conversations
   - Prune low-value embeddings
   - Use `VACUUM FULL` to reclaim space

---

## Embedding Size Deep Dive

### pgvector Storage Calculation

**OpenAI `text-embedding-3-small`**:
- Dimensions: 1536
- Data type: `float4` (4 bytes per dimension)
- Raw vector size: 1536 × 4 = **6,144 bytes (~6 KB)**

**Per Document Chunk**:
- Embedding vector: 6 KB
- Text content: ~1-2 KB (chunked to ~500 words)
- Metadata (JSON): ~0.5-1 KB
- **Total per row: ~8-9 KB**

**1,000 documents = ~8-9 MB**
**10,000 documents = ~80-90 MB**
**100,000 documents = ~800-900 MB** (approaching free tier limit)

### Optimization Strategies

1. **Use smaller embedding models** (if available):
   - OpenAI `text-embedding-3-small` (1536-dim) - current
   - Custom quantization (reduce to `float2` or `int8`) - advanced

2. **Selective embedding**:
   - Only embed important docs (not everything)
   - Archive old embeddings to cold storage

3. **Chunking strategy**:
   - Larger chunks = fewer embeddings (but less precise search)
   - Current: ~500 words/chunk
   - Could increase to 1,000 words = 50% fewer embeddings

---

## Redis Cloud Pricing (for your stack)

Since you want to add Redis for short-term state:

### Redis Cloud Free Tier

| Feature | Free Tier |
|---------|-----------|
| **Memory** | 30 MB |
| **Connections** | 30 concurrent |
| **Data Persistence** | Yes |
| **Eviction Policy** | LRU when full |

**Verdict**: ✅ **Sufficient for n8n/Open WebUI session state**

**Upgrade**: $5/mo for 250 MB if needed

---

## Alternative: Self-Hosted Supabase on Droplet

### Why Consider?

**Pros**:
- No database size limits (use droplet storage)
- No egress fees
- Full control
- Free (except droplet resources)

**Cons**:
- Uses droplet RAM (~1-2 GB for Postgres)
- Maintenance burden (backups, updates)
- Your 2GB droplet is already tight

### Resource Impact on 2GB Droplet

**Current Stack** (Phase 1):
- n8n: ~512 MB
- Postgres (for n8n): ~256 MB
- Nginx: ~50 MB
- Cloudflared: ~50 MB
- **Total: ~868 MB**

**With Archon + Supabase**:
- Archon stack: ~1.5 GB
- Self-hosted Supabase: ~1-2 GB
- **Total: ~3.5 GB** (too much for 2GB droplet)

**Verdict**: ❌ **Not viable on 2GB droplet** - would need to upgrade to 4GB ($24/mo) or 8GB ($48/mo)

**Better Option**: Use managed Supabase cloud

---

## Final Recommendation

### Infrastructure Stack

```
Managed Services:
├── Supabase Cloud (Free → Pro $25/mo when needed)
│   ├── PostgreSQL + pgvector
│   └── Storage for uploaded docs
├── Redis Cloud (Free tier, 30 MB)
│   └── Session state for n8n/Open WebUI
└── Cloudflare Tunnel (Free)

Your Droplet (2GB):
├── n8n (orchestration)
├── Archon stack (memory UI + MCP)
├── Open WebUI (chat)
├── Letta (agents - optional, later)
└── Your MCP servers (Coda, GitHub, Firecrawl)
```

### Cost Projection

| Service | Year 1 | Year 2+ | Notes |
|---------|--------|---------|-------|
| **Supabase** | Free | $25/mo = $300/yr | Upgrade when > 450 MB |
| **Redis Cloud** | Free | Free or $5/mo | 30 MB sufficient |
| **DigitalOcean Droplet** | $72/yr | $72/yr | 2GB basic droplet |
| **Cloudflare** | Free | Free | Tunnel + DNS |
| **Domain** | $12/yr | $12/yr | bestviable.com |
| **TOTAL** | **$84/yr** | **$384-444/yr** | |

**Monthly**: $7/mo → $32-37/mo when scaled

---

## Monitoring & Alerts Setup

### Supabase Dashboard

1. **Database Size**:
   - Check weekly via Supabase dashboard → Database → Settings
   - Alert at 400 MB (80% capacity)

2. **Egress**:
   - Check monthly via Supabase dashboard → Usage
   - Alert at 4 GB (80% of free 5 GB)

3. **Activity**:
   - Weekly health check to prevent pausing
   - n8n cron: `curl https://your-project.supabase.co/rest/v1/` every 6 days

### SQL Monitoring Queries

```sql
-- Database size
SELECT pg_size_pretty(pg_database_size('postgres')) as db_size;

-- Table sizes (top 10)
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY size_bytes DESC
LIMIT 10;

-- Vector embedding count
SELECT
  COUNT(*) as total_embeddings,
  pg_size_pretty(SUM(pg_column_size(embedding))) as total_embedding_size
FROM documents
WHERE embedding IS NOT NULL;

-- Recent growth rate (if you have created_at timestamps)
SELECT
  DATE(created_at) as date,
  COUNT(*) as new_documents,
  pg_size_pretty(SUM(pg_column_size(embedding))) as new_embeddings_size
FROM documents
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## Decision Points Summary

### ✅ Decisions Made

1. **Supabase**: Start with free tier, monitor, upgrade to Pro when needed
2. **Redis**: Use Redis Cloud free tier (30 MB)
3. **Letta**: Wire to same Supabase backend, deploy later
4. **Archon UI**: Behind Cloudflare Access
5. **Coda**: General task management, sync with Archon projects later

### ❓ To Decide Later

1. **When to upgrade Supabase**: Set alert at 400 MB database size
2. **Self-host vs managed**: Re-evaluate if costs exceed $50/mo
3. **Droplet size**: Monitor RAM usage, upgrade to 4GB ($24/mo) if needed
4. **Archon-Coda sync**: Design bidirectional sync via n8n when Archon projects mature

---

## Next Steps

1. ✅ **Create Supabase account** (free tier)
2. ✅ **Create Redis Cloud account** (free tier)
3. ✅ **Test Archon locally** with Supabase credentials
4. ✅ **Monitor usage** for 2-4 weeks
5. ⏳ **Decide on Pro upgrade** when approaching limits

---

**Version**: 0.1
**Last Updated**: 2025-11-05
**Next Review**: After 30 days of usage tracking
