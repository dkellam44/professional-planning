# Development Learning Journal

> Personal knowledge base for development concepts, patterns, and troubleshooting

**Last Updated:** 2025-10-12

---

## Git & Version Control

### Branch Management & Workflow
**Date:** 2025-10-12
**Context:** Setting up feature branch workflow for code organization

**What I learned:**

**Creating and switching branches:**
```bash
git checkout -b branch-name  # Creates and switches in one command
git branch                   # Lists all local branches (* shows current)
git branch -r               # Shows remote branches
git branch -a               # Shows all branches (local + remote)
```

**Flag meanings:**
- `-b` = "branch" - create new branch
- `-r` = "remote" - show remote branches only
- `-a` = "all" - show both local and remote

**Preserving file history:**
```bash
git mv oldpath newpath  # Git tracks as rename (preserves history)
mv oldpath newpath      # Git sees as delete + add (loses history)
```

**Why it matters:** Using `git mv` maintains the file's commit history, essential for understanding code evolution and using `git blame` effectively.

---

### Understanding "origin"
**Date:** 2025-10-12

**Key insight:** `origin` is WHERE, not WHICH BRANCH

**Two locations for code:**
1. **Local** - Your computer (`/Users/davidkellam/Projects/kd-collaboration`)
2. **Remote** - GitHub (nicknamed "origin")

**Breaking down the command:**
```bash
git push -u origin feature/code-organization
```
- `git push` = send commits
- `-u` = set upstream (remember this connection)
- `origin` = WHERE to push (GitHub remote)
- `feature/code-organization` = WHICH BRANCH to push

**Check your remotes:**
```bash
git remote -v  # Shows origin URL
```

**Analogy:** Think of `origin` like Gmail (the service), and branch names like folders (inbox, drafts, etc.)

**Always know where you are:**
```bash
git branch  # Shows current branch with *
```

---

### Merge Workflows: CLI vs Pull Request
**Date:** 2025-10-12

**Two methods to merge branches:**

**Method 1: Command Line (for feature → develop)**
```bash
git checkout develop
git merge feature/branch-name
git push origin develop
```
- ✅ Fast for solo work
- ✅ Good for internal merges
- Use for: feature branches → develop

**Method 2: Pull Request (for develop → main)**
- Create PR on GitHub UI
- Review changes visually
- Check CI/CD and preview deployments
- Click "Merge pull request"
- ✅ Professional history
- ✅ Final review before production
- ✅ Shows Vercel preview links
- Use for: develop → main (production)

**My workflow preference:**
- feature → develop: CLI merge (faster)
- develop → main: Pull Request (professional, safer)

---

### Commit Messages Best Practices
**Date:** 2025-10-12

**Good format:**
```
Type: Short summary (50 chars max)

Detailed explanation with bullets:
- What changed
- Why it changed

Benefits or impact
```

**Common types:** feat, fix, refactor, style, docs, test, chore

**Multi-line commits with HEREDOC (best method):**
```bash
git commit -m "$(cat <<'EOF'
Refactor: Organize code structure

- Create lib/, types/, components/ directories
- Add Zod validation
- Split content files

Benefits: Easier content editing, type-safe
EOF
)"
```

**Why HEREDOC:**
- ✅ Easy to read while typing
- ✅ Preserves formatting
- ✅ No escaping needed
- ✅ Can see full message before committing

**Alternative methods:**
```bash
# Method 2: Backslash continuation
git commit -m "Title\
\
- Bullet 1\
- Bullet 2"

# Method 3: Press Enter in quotes (zsh)
git commit -m "Title
<press Enter>
- Bullet 1"
```

**Practice HEREDOC syntax:**
```bash
cat <<'EOF'
Line 1
Line 2
EOF
```

---

## TypeScript & Validation

### Zod Runtime Validation
**Date:** 2025-10-12
**Context:** Adding content validation to prevent runtime errors

**The Problem:**
- TypeScript only validates at **compile-time**
- JSON files can be edited with typos/errors
- Runtime errors crash the app

**The Solution: Zod**
```bash
npm install zod
```

**Basic Zod patterns:**
```typescript
import { z } from "zod";

// Define schema
const UserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  age: z.number().min(18),
  website: z.string().url().optional(),  // Optional field
});

// Validate data
const result = UserSchema.parse(data);  // Throws if invalid
const safe = UserSchema.safeParse(data); // Returns {success: boolean, data/error}

// Infer TypeScript type from schema
type User = z.infer<typeof UserSchema>;
```

**Common validators:**
- `z.string()` - Must be string
- `z.string().min(1)` - Non-empty string
- `z.string().email()` - Valid email format
- `z.string().url()` - Valid URL
- `z.number()` - Must be number
- `z.boolean()` - Must be boolean
- `z.array(z.string())` - Array of strings
- `z.object({...})` - Object with shape
- `.optional()` - Can be undefined
- `.nullable()` - Can be null

**Why `z.infer` is powerful:**
Instead of maintaining types separately:
```typescript
// ❌ Maintaining two things
const Schema = z.object({name: z.string()});
type MyType = {name: string};  // Duplicate!

// ✅ Single source of truth
const Schema = z.object({name: z.string()});
type MyType = z.infer<typeof Schema>;  // Auto-generated!
```

**Pattern used in project:**
```typescript
// lib/schemas.ts
export const TitleSlideSchema = z.object({
  deckTitle: z.string().min(1),
  subtitle: z.string().min(1),
  quote: z.string().min(1),
  image: z.string().min(1),
});

export type TitleSlide = z.infer<typeof TitleSlideSchema>;

// lib/utils/loadSlides.ts
const data = await loadJSON('title.json');
const validated = TitleSlideSchema.parse(data);  // Throws if invalid
```

**Benefits:**
- ✅ Catches errors at runtime before they crash the app
- ✅ Provides helpful error messages
- ✅ Single source of truth for types and validation
- ✅ Self-documenting code

---

## Next.js Patterns

### Async Server Components
**Date:** 2025-10-12
**Context:** Loading and validating content server-side

**Next.js 15 App Router supports async page components natively.**

**Before (synchronous):**
```typescript
import data from './data.json';

export default function Page() {
  // Data must be imported statically
  return <div>{data.title}</div>;
}
```

**After (asynchronous):**
```typescript
import { loadData } from '@/lib/utils';

export default async function Page() {
  const data = await loadData();  // Can read files, fetch APIs, etc.
  return <div>{data.title}</div>;
}
```

**Why this is powerful:**
- ✅ Load data from files at request time
- ✅ Validate data before rendering
- ✅ Handle errors gracefully
- ✅ Server-side rendering with fresh data
- ✅ Can use `await` directly in component

**Use cases:**
- Reading config files
- Loading dynamic content
- Fetching from APIs
- Database queries
- File system operations

**Pattern used in project:**
```typescript
// app/page.tsx
export default async function Page() {
  const slides = await loadSlides();  // Loads & validates 7 JSON files

  return (
    <main>
      <TitleCard {...slides.title} />
      <TextSlide {...slides.alignment} />
      {/* ... */}
    </main>
  );
}
```

**Error handling:**
```typescript
export default async function Page() {
  try {
    const data = await loadData();
    return <SuccessView data={data} />;
  } catch (error) {
    return <ErrorView error={error} />;
  }
}
```

---

## Code Organization

### Directory Structure Best Practices
**Date:** 2025-10-12
**Context:** Refactoring flat component structure into organized hierarchy

**Before (flat structure):**
```
/components
  TitleCard.tsx
  TextSlide.tsx
  TableSlide.tsx
  SlideFrame.tsx
  NavBar.tsx
  AppendixRenderer.tsx
```

**After (organized structure):**
```
/components
  /ui              # Reusable UI components
    SlideFrame.tsx
  /slides          # Domain-specific slide components
    TitleCard.tsx
    TextSlide.tsx
    TableSlide.tsx
  NavBar.tsx       # App-level components stay in root
  AppendixRenderer.tsx
```

**Complete project structure:**
```
/app                    # Next.js pages (App Router)
  page.tsx
  layout.tsx
  /appendix
/components
  /ui                   # Reusable UI primitives
  /slides               # Feature-specific components
/lib
  /utils                # Utility functions
  /hooks                # Custom React hooks
  schemas.ts            # Validation schemas
/types                  # TypeScript type definitions
/content
  /slides               # Individual content files
  /appendix             # MDX documentation
/public                 # Static assets
  /images
/.claude
  /commands             # Custom slash commands
/docs                   # Project documentation
```

**Why this matters:**
- ✅ Easy to find things ("Where are slide components?")
- ✅ Clear separation of concerns
- ✅ Reusable components identified
- ✅ Scalable as project grows
- ✅ Follows Next.js conventions

**Moving files with git:**
```bash
git mv components/SlideFrame.tsx components/ui/SlideFrame.tsx
```

**Updating imports:**
```typescript
// Before
import SlideFrame from '@/components/SlideFrame';

// After
import SlideFrame from '@/components/ui/SlideFrame';
```

---

## Content Management

### Splitting Monolithic Content Files
**Date:** 2025-10-12

**Problem:** Single large `slides.json` file
- ❌ One typo breaks everything
- ❌ Hard to find specific content
- ❌ Git diffs show entire file changed
- ❌ Merge conflicts on teams

**Solution:** Individual files per content section
```
content/
  slides/
    title.json
    alignment.json
    help.json
    regenerative.json
    fit.json
    engagement.json
    cta.json
```

**Loading pattern:**
```typescript
// lib/utils/loadSlides.ts
export async function loadSlides() {
  const [title, alignment, help, ...] = await Promise.all([
    loadJSON('content/slides/title.json'),
    loadJSON('content/slides/alignment.json'),
    loadJSON('content/slides/help.json'),
    // ...
  ]);

  // Validate each with Zod
  return {
    title: TitleSlideSchema.parse(title),
    alignment: TextSlideSchema.parse(alignment),
    // ...
  };
}
```

**Benefits:**
- ✅ Edit one slide without touching others
- ✅ Clear git history (see exactly which slide changed)
- ✅ Easier to find and update content
- ✅ Can add lengthy content per slide
- ✅ Validation per file (better error messages)

---

## Troubleshooting

### JSON Parsing Errors
**Date:** 2025-10-12
**Error:** `SyntaxError: Expected ',' or '}' after property value in JSON at position 132`

**Common causes:**

1. **Smart quotes vs straight quotes**
```json
// ❌ Invalid (smart quotes)
"quote": ""The value isn't...""

// ✅ Valid (escaped straight quotes)
"quote": "\"The value isn't...\""

// ✅ Valid (straight quotes, no inner quotes)
"quote": "The value is not..."
```

2. **Trailing commas**
```json
// ❌ Invalid
{
  "name": "value",
  "age": 30,  ← trailing comma
}

// ✅ Valid
{
  "name": "value",
  "age": 30
}
```

3. **Single quotes**
```json
// ❌ Invalid
{'name': 'value'}

// ✅ Valid
{"name": "value"}
```

**How to debug JSON files:**
```bash
# Validate JSON syntax with Node
node -e "console.log(JSON.parse(require('fs').readFileSync('file.json', 'utf-8')))"

# If valid: prints parsed object
# If invalid: shows exact error location
```

**Error message breakdown:**
```
Expected ',' or '}' after property value in JSON at position 132 (line 4 column 14)
                                                              ^^^   ^^^^^^  ^^^^^^^^^
                                                          Character  Line#   Column#
```

**Quick fixes:**
- Search for smart quotes: `""` or `''`
- Look at the line/column mentioned
- Check for trailing commas
- Verify all strings use double quotes

---

## Development Environment

### Node/npm Setup with nvm
**Date:** 2025-10-12
**Issue:** `zsh: command not found: npm`

**Solution: Initialize nvm in shell**

**Check if Node is installed:**
```bash
ls -la ~/.nvm/versions/node/*/bin/node  # Shows installed versions
which node  # Shows if it's in PATH
echo $SHELL # Shows current shell (zsh or bash)
```

**Add nvm to .zshrc:**
```bash
cat >> ~/.zshrc << 'EOF'

# nvm (Node Version Manager)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
EOF
```

**Reload shell:**
```bash
source ~/.zshrc  # Applies changes without restarting terminal
```

**Verify:**
```bash
nvm --version   # Should show nvm version
node --version  # Should show Node version (v22.14.0)
npm --version   # Should show npm version
```

**What this fixes:**
- nvm initialization wasn't running on shell startup
- `source` reads and executes the config file
- Now Node/npm available in all new terminal sessions

---

## Vercel Deployment

### Automatic Deployments
**Date:** 2025-10-12

**How Vercel deploys:**
```
Push to main      → Production deployment (live site)
Push to develop   → Preview deployment (unique URL)
Push to feature/* → Preview deployment (unique URL)
Open Pull Request → Preview deployment (commented on PR)
```

**Finding preview URLs:**
1. Vercel dashboard → Project → Deployments
2. GitHub PR comments (Vercel bot adds link)
3. Terminal output after push (sometimes)

**Best practice:**
- Always test preview deployment before merging to main
- Use PR workflow for main (shows preview link)
- CLI merge for develop (faster iteration)

---

## Next Session Topics

### To Learn
- [ ] Error boundaries in Next.js
- [ ] Suspense and loading states
- [ ] Image optimization with next/image
- [ ] Font optimization with next/font
- [ ] SEO metadata best practices
- [ ] Accessibility patterns (ARIA, semantic HTML)

### To Practice
- [ ] Creating custom React hooks
- [ ] Component composition patterns
- [ ] CSS modules vs Tailwind patterns
- [ ] Testing with Vitest

---

## Quick Reference Commands

```bash
# Git workflow
git status                    # Check current state
git branch                    # Show branches (* = current)
git checkout -b branch-name   # Create and switch to branch
git add .                     # Stage all changes
git commit -m "message"       # Commit with message
git push -u origin branch     # Push branch to GitHub
git merge branch-name         # Merge branch into current

# Node/npm
npm install package-name      # Install package
npm run dev                   # Start dev server
npm run build                 # Production build
npm run typecheck             # TypeScript validation

# Debugging
node -e "console.log(...)"    # Execute JavaScript
cat file.txt                  # View file contents
ls -la                        # List files (including hidden)
which command                 # Find command location

# Shell
source ~/.zshrc               # Reload shell config
echo $VARIABLE                # Print variable value
```
