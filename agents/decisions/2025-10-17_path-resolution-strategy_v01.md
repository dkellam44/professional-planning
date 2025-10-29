# ADR: Path Resolution Strategy

- entity: decision
- level: policy
- zone: internal
- version: v01
- tags: [adr, paths, portability]
- source_path: /decisions/2025-10-17_path-resolution-strategy_v01.md
- date: 2025-10-17

## Status
**ACCEPTED**

## Context
The context architecture must work across multiple environments:
- Local development (macOS/Linux/Windows)
- Claude Code CLI sessions
- Chat-based planning sessions
- Future: containerized execution, cloud environments

We need a consistent way to reference files that:
1. Works across different mount points and environments
2. Maintains portability when repos are cloned
3. Enables validation and testing
4. Keeps configuration files (`.contextrc.yaml`) portable

## Decision

### For Builder Prompts and Agent Instructions
**Declare `REPO_ROOT` at the top** of every builder/agent prompt:
```
> REPO_ROOT = "/Users/davidkellam/portfolio"
> All paths below are relative to REPO_ROOT unless stated otherwise.
```

Then reference all inputs as:
```
${REPO_ROOT}/architecture-spec_v0.3.md
${REPO_ROOT}/sot/context_schemas_v02.yaml
${REPO_ROOT}/templates/offer_brief_v01.md
```

### For Configuration Files (`.contextrc.yaml`)
**Use relative paths** back to Portfolio root to maintain portability:
```yaml
inherit:
  sot: ../../sot/context_schemas_v02.yaml
  prompts_dir: ../../prompts
  eval_dir: ../../eval
```

This allows ventures/projects to be moved or cloned without breaking references.

## Consequences

### Positive
- Clear, unambiguous file references in prompts
- Easy to adapt to different environments (change one variable)
- Configuration files remain portable across clones
- Validates that prompts are environment-aware

### Negative
- Requires manual `REPO_ROOT` declaration in each prompt
- Builder must substitute `${REPO_ROOT}` when reading paths
- Slight duplication across prompts

### Mitigations
- Document this pattern in `CONTRIBUTING.md`
- Include `REPO_ROOT` declaration in all prompt templates
- Future: create prompt preprocessor to inject `REPO_ROOT` automatically

## References
- Architecture spec: `/architecture-spec_v0.3.md` line 21
- Builder prompt: `/builder_prompt_v0.3.md` line 4
