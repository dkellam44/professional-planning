# Goal
Extend slide schemas with optional blurbs, tune regenerative metrics to business-ops benchmarks, and lock CTA/pricing details.

# Decisions
- Add `blurb?: string` at the top level of every slide JSON.
- Keep price as string to allow ranges.
- CTA: email `dkellam44@gmail.com`, calendar `https://supercal.com/davidkellam/60`.
- Regenerative metrics track confirmations, inbox load, pre-scheduled content, SST update, response/no-show rates.

# Rationale
Blurbs preserve mobile readability while conveying tone; metrics are simple proxies for operational calm.

# Next Actions
- If blurbs feel long on mobile, consider an optional More/Less expander (see `components/ExpandableBlurb.tsx`).
