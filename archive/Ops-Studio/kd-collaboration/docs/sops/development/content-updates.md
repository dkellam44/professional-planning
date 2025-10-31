# Content Updates SOP

**Version:** 1.0
**Last Updated:** 2025-10-12
**Author:** David Kellam
**Status:** Active

---

## Purpose
Safely add or edit content for KD pitch deck slides using validated JSON files

## When to Use
- Adding descriptive text to existing slides
- Updating copy, pricing, or contact information
- Expanding blurbs or adding new content fields
- Refining messaging before sharing with KD

## Prerequisites
- [ ] Node.js and npm installed (via nvm)
- [ ] Project cloned and dependencies installed
- [ ] VS Code (or preferred editor) available
- [ ] Notion/Coda workspace for drafting content

## Tools Required
- **Notion/Coda** - Draft and refine content before implementation
- **VS Code** - Edit JSON files
- **Terminal/Warp** - Run dev server and git commands
- **Browser** - Preview changes at localhost:3000

---

## Procedure

### Step 1: Draft Content in Notion/Coda

**What:** Write and refine all content updates in one place before touching code

**How:**
1. Open Founder HQ in Notion/Coda
2. Create page: "KD Pitch - Content Updates [Date]"
3. Use this structure for each slide:

```markdown
## Slide [Number]: [Name]

**Current:**
[Paste current content from JSON file]

**New/Expanded:**
[Draft your updates here]
[Can be multiple paragraphs]
[Iterate until satisfied]

**Notes:**
- [Any layout considerations]
- [Questions to resolve]
```

4. Write freely - focus on content, not JSON syntax
5. Iterate and refine until polished
6. Get feedback if needed

**Expected Result:** Complete content draft for all slides you're updating

**Troubleshooting:**
- Can't decide on copy? Write 2-3 versions, test which resonates
- Too long? Remember slides are visual - keep it scannable

---

### Step 2: Set Up Development Environment

**What:** Prepare your workspace for implementing content changes

**How:**

**Terminal:**
```bash
# Navigate to project
cd ~/Projects/kd-collaboration

# Ensure you're on develop branch
git checkout develop

# Get latest changes
git pull origin develop

# Create feature branch for content updates
git checkout -b content/expand-slides-[date or description]

# Start dev server (leave running)
npm run dev
```

**VS Code:**
```bash
# Open project
code ~/Projects/kd-collaboration
```

**Window Layout:**
- **Left:** VS Code with `content/slides/` directory open
- **Right:** Browser with two tabs:
  - Tab 1: `localhost:3000` (preview)
  - Tab 2: Notion/Coda (content draft)

**Or use integrated terminal:**
- VS Code full screen
- Integrated terminal (⌘`) running `npm run dev`
- Separate browser window split: localhost + Notion

**Expected Result:**
- ✅ Dev server running at localhost:3000
- ✅ VS Code open to content/slides/ directory
- ✅ Notion draft visible for reference
- ✅ Feature branch created

**Troubleshooting:**
- `npm run dev` fails? Check nvm initialized: `source ~/.zshrc`
- Branch already exists? Use different name or delete old: `git branch -D content/old-branch-name`

---

### Step 3: Update JSON Files

**What:** Copy content from Notion into JSON files with proper formatting

**How:**

For each slide you're updating:

1. **Open JSON file in VS Code:**
   - Navigate: `content/slides/[slide-name].json`
   - Example: `content/slides/alignment.json`

2. **Reference Notion draft** (visible in browser/second monitor)

3. **Copy content from Notion and paste into JSON**

   **⚠️ CRITICAL: JSON Formatting Rules**
   - Strings use **double quotes** only: `"text"`
   - Quotes inside text must be **escaped**: `\"like this\"`
   - No unescaped line breaks (use separate fields for paragraphs)
   - Commas between properties, **no trailing comma** on last property

   **Example - Notion draft:**
   ```
   I bring dependable structure that expands creative freedom.
   This isn't about "doing more" — it's about creating spaciousness.
   ```

   **Example - VS Code JSON:**
   ```json
   {
     "h1": "Alignment & Intention",
     "bodyMdx": "I bring dependable structure that expands creative freedom. This isn't about \"doing more\" — it's about creating spaciousness."
   }
   ```

4. **Save file** (⌘S)

5. **Check terminal** - watch for errors:
   - ✅ No errors = valid JSON, Next.js recompiled
   - ❌ Red error = JSON syntax issue (see Troubleshooting)

6. **Check browser** (`localhost:3000`):
   - Refresh if needed (usually auto-refreshes)
   - Verify content displays correctly
   - Check for layout issues

7. **Repeat** for next slide

**Expected Result:**
- Content updates visible at localhost:3000
- No syntax errors in terminal
- Layout looks good

**Troubleshooting:**

**Error: `Expected ',' or '}' after property value`**
- **Cause:** Smart quotes, missing comma, or trailing comma
- **Fix:**
  - Find & Replace: `"` → `"` (smart quotes to straight)
  - Check last property doesn't have trailing comma
  - Each property line needs comma except the last

**Error: `Unexpected token`**
- **Cause:** Unescaped quote inside string
- **Fix:** Add backslash before inner quotes: `\"text\"`

**Error: Zod validation failed**
- **Cause:** Missing required field or wrong data type
- **Fix:** Check terminal error - tells you which field and why
- Reference schema: `lib/schemas.ts`

**Content doesn't look right on page:**
- Check component: `components/slides/[ComponentName].tsx`
- May need to update component to display new fields

**Smart quotes keep appearing:**
- VS Code setting: Turn off smart quotes
- Or: Paste as plain text first, then edit

---

### Step 4: Test Changes Thoroughly

**What:** Verify all content displays correctly before committing

**How:**

**Visual Check:**
- [ ] All updated slides visible on page
- [ ] Text displays as intended
- [ ] No layout breaking or overflow
- [ ] Quotes, dashes, special characters render correctly
- [ ] Links work (if applicable)

**Responsive Check:**
- [ ] Resize browser window to mobile width
- [ ] Check tablet size (iPad)
- [ ] Verify desktop looks good

**Technical Check:**
```bash
# In terminal (stop dev server with Ctrl+C first)
npm run build

# Should see: ✓ Compiled successfully
# If errors, fix before committing
```

**Cross-browser (if major changes):**
- [ ] Chrome/Arc
- [ ] Safari
- [ ] Firefox (if available)

**Expected Result:**
- ✅ All content displays correctly
- ✅ No console errors (F12 → Console)
- ✅ Production build succeeds
- ✅ Mobile/tablet responsive

**Troubleshooting:**
- Build fails? Check terminal for specific error
- Layout broken? May need to adjust component or add CSS
- Content cut off? Check for overflow or width constraints

---

### Step 5: Commit Changes

**What:** Save your content updates to git with clear commit message

**How:**

```bash
# Check what changed
git status

# Stage content files
git add content/slides/

# Commit with descriptive message
git commit -m "content: Expand [which slides] with [what kind of updates]"

# Examples:
# git commit -m "content: Expand alignment and help slides with detailed descriptions"
# git commit -m "content: Update pricing and add testimonial quote"
# git commit -m "content: Refine all slide copy for clarity"
```

**Expected Result:**
- ✅ Commit created successfully
- ✅ Clear message describes what changed

**Troubleshooting:**
- Forgot to add files? `git add content/slides/` then commit again
- Want to change commit message? `git commit --amend -m "new message"`

---

### Step 6: Merge to Develop

**What:** Integrate content changes into develop branch

**How:**

```bash
# Switch to develop
git checkout develop

# Pull any remote changes
git pull origin develop

# Merge your content branch (CLI merge - our workflow)
git merge content/[your-branch-name]

# Push to GitHub
git push origin develop
```

**Expected Result:**
- ✅ Merge successful (no conflicts)
- ✅ Pushed to GitHub
- ✅ Vercel creates preview deployment

**Troubleshooting:**
- Merge conflict? Rare for content-only changes. Use VS Code merge tool or ask for help.
- Push rejected? Someone else pushed to develop - `git pull origin develop` then try again

---

### Step 7: Review Preview Deployment

**What:** Test changes in production-like environment before going live

**How:**

1. **Find Vercel preview URL:**
   - Vercel Dashboard → kd-collaboration → Deployments
   - Or: GitHub repo → commits → green checkmark → Details

2. **Test preview deployment:**
   - [ ] All content displays correctly
   - [ ] No errors in browser console
   - [ ] Mobile responsive
   - [ ] Fast loading

3. **Share for feedback (optional):**
   - Send preview URL to trusted reviewer
   - Get input before production deploy

**Expected Result:**
- ✅ Preview deployment looks perfect
- ✅ Ready to deploy to production

**Troubleshooting:**
- Preview shows old content? Check deployment succeeded, may need to hard refresh (⌘+Shift+R)
- Error on preview? Check Vercel deployment logs

---

### Step 8: Deploy to Production (When Ready)

**What:** Make content updates live on production site

**How:**

**Option A: Pull Request (Recommended)**
1. Go to GitHub repo
2. Click "Compare & pull request" for develop branch
3. Title: "Content: [brief description of updates]"
4. Description:
   ```markdown
   ## Changes
   - Updated slide 2 with expanded mission statement
   - Added detailed service descriptions to slide 3
   - Refined pricing copy on slide 6

   ## Preview
   [Link to Vercel preview]

   ## Ready to Deploy
   - [x] Tested on preview deployment
   - [x] Mobile responsive
   - [x] No console errors
   ```
5. Click "Create pull request"
6. Review changes in GitHub diff view
7. Click "Merge pull request"
8. Click "Confirm merge"
9. Optionally delete the content branch

**Option B: CLI (Faster, less review)**
```bash
git checkout main
git pull origin main
git merge develop
git push origin main
```

**Expected Result:**
- ✅ Content live on production URL
- ✅ Vercel production deployment succeeds

**Troubleshooting:**
- Deployment failed? Check Vercel logs for specific error
- Still shows old content? Hard refresh browser (⌘+Shift+R)

---

## Success Criteria

After completing this SOP:
- [ ] Content draft created and polished in Notion/Coda
- [ ] JSON files updated with proper formatting
- [ ] Local development server shows updates correctly
- [ ] Production build succeeds (`npm run build`)
- [ ] Changes committed with clear message
- [ ] Merged to develop branch
- [ ] Preview deployment tested
- [ ] (Optional) Deployed to production via PR

---

## Adding New Content Fields

**If you need to add a field that doesn't exist in the schema:**

1. **Update Zod schema** (`lib/schemas.ts`):
   ```typescript
   export const TextSlideSchema = z.object({
     h1: z.string().min(1),
     bodyMdx: z.string().min(1),
     detailedText: z.string().optional(),  // NEW FIELD
   });
   ```

2. **Update TypeScript types** (auto-generated via `z.infer`):
   - No action needed if using `z.infer`
   - Or manually update `types/slides.ts` if using separate types

3. **Update JSON file**:
   ```json
   {
     "h1": "Heading",
     "bodyMdx": "Main text",
     "detailedText": "Additional paragraph here"
   }
   ```

4. **Update component** (`components/slides/[Component].tsx`):
   ```typescript
   export default function TextSlide({ h1, bodyMdx, detailedText }) {
     return (
       <div>
         <h2>{h1}</h2>
         <p>{bodyMdx}</p>
         {detailedText && <p className="mt-4">{detailedText}</p>}
       </div>
     );
   }
   ```

5. **Test thoroughly** - new fields need validation

---

## Related SOPs
- [Git Workflow](git-workflow.md) - Branching and merging details
- [Troubleshooting](troubleshooting.md) - Common issues and fixes
- [Deployment](deployment.md) - Production deployment checklist

---

## Tips & Best Practices

**Content Writing:**
- ✅ Keep slides scannable - visitors read fast
- ✅ Use strong verbs and specific outcomes
- ✅ Show value, not just features
- ✅ Write for KD specifically (personalize)

**Technical:**
- ✅ Commit frequently (after 2-3 slides)
- ✅ Test on localhost before committing
- ✅ Run `npm run build` before merging to develop
- ✅ Review preview deployment before production

**Workflow:**
- ✅ Draft ALL content first (Notion), then implement
- ✅ Don't context-switch between writing and coding
- ✅ Keep dev server running (faster feedback)
- ✅ Use split screen or second monitor

**JSON Formatting:**
- ✅ Use VS Code - it highlights syntax errors
- ✅ Watch for smart quotes (find & replace)
- ✅ Save frequently and check terminal
- ✅ When in doubt, validate: `node -e "JSON.parse(require('fs').readFileSync('[file]', 'utf-8'))"`

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2025-10-12 | 1.0 | Initial SOP creation based on content workflow design |
