---
- entity: checklist
- level: internal
- zone: internal
- version: v01
- tags: [operations-studio, recovery, troubleshooting]
- source_path: /ventures/ops-studio/RECOVERY_CHECKLIST.md
- date: 2025-10-28
---

# Recovery Checklist — When Things Break

---

## Level 1: Can You Access Your Files? (5 min)

```bash
cd ~/workspace/portfolio
git status  # Should work
ls ventures/ops-studio/  # Should see offers/, pipeline/, etc.
```

**If fails:** Local repo may be corrupted. Don't proceed - ask for help.

---

## Level 2: Can You Access Services? (5 min)

```bash
# Check Coda
open https://coda.bestviable.com
# Should log in successfully

# Check n8n
curl -I https://n8n.bestviable.com
# Should return 200
```

**If fails:** Check internet. Try different network.

---

## Level 3: Git Mistakes (When you messed up commit)

```bash
# See what happened
git log --oneline -5
git status

# Undo last commit (keeps changes)
git reset --soft HEAD~1

# Discard changes (CAREFUL)
git restore .
```

---

## Level 4: Services Down on Droplet

```bash
ssh root@159.65.97.146
cd /root/syncbricks
docker compose ps  # Check status
docker compose up -d  # Restart
docker logs [service-name]  # See errors
```

---

## When Totally Lost

1. Open `/agents/CURRENT_FOCUS.md`
2. Read latest session handoff
3. Start with what you remember working on
4. Commit regularly so you don't lose work

---

## Golden Rules

- Commit often (changes stay safe in git)
- Push to GitHub (backup to cloud)
- Don't force-push (breaks history)
- When confused: read CURRENT_FOCUS, not other files

