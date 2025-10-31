# Content Drafts

This directory is for **staging raw content** before committing to validated JSON/MDX files.

## Purpose

- Draft content in human-readable markdown (easier to edit than JSON)
- Iterate with AI or manually without breaking validation
- Review and refine before implementation
- Version control tracks content evolution

## Workflow

### 1. Draft
Write content in the appropriate template file:
- `blurbs.md` - Draft all slide blurb text
- `profile-long.md` - Expanded profile content
- `resume.md` - Traditional resume content

### 2. Review
- Read aloud for flow and tone
- Check against ICP guidelines (`docs/content-review-context.md`)
- Iterate with AI using `/content-review` command

### 3. Implement
- Copy final content to JSON files (`content/slides/*.json`)
- Or copy to MDX files (`content/appendix/*.mdx`)
- Dev server validates automatically (Zod schemas)

### 4. Clean Up
- Delete draft file once implemented
- Or keep as reference/archive

## Benefits

✅ Separates drafting from implementation
✅ Markdown more accessible than JSON
✅ Safe experimentation without breaking schemas
✅ AI can read/edit naturally
✅ Git tracks all changes

## Tips

- **Use blurbs.md for all slide blurbs** - Easier to see them together and maintain consistent tone
- **Profile content** - Draft the full story first, then edit for length
- **Resume** - Start with traditional format, then adapt for web if needed
- **Don't worry about perfect formatting** - Focus on content, we'll format during implementation

## Example: Updating a Blurb

1. Edit `blurbs.md` with new text
2. Review (read aloud, check tone)
3. Copy to `content/slides/[slide-name].json`
4. Check terminal for validation errors
5. Preview in browser
6. Delete or archive draft

---

**Remember:** This is a *staging area*, not the source of truth. The JSON/MDX files are what actually render.
