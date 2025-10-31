# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Preview Your Pitch Deck Locally
```bash
cd /Users/davidkellam/Projects/kd-pitch-deck/app
npm run dev
```
Open http://localhost:3000 in your browser

### 2. Make Changes
Edit `app/page.tsx` to change:
- Content (slides array, line 6+)
- Colors (style section, line 244+)
- Layout and design

Changes appear instantly in your browser!

### 3. Deploy Your Changes
```bash
git add .
git commit -m "Describe your changes"
git push origin main
```

Vercel automatically deploys in ~2 minutes!

---

## 📁 Important Files

- **`app/page.tsx`** - All your content and styling
- **`app/layout.tsx`** - Page title and metadata
- **`WORKFLOW.md`** - Full guide for version control

## 🎨 Common Edits

### Change Colors
Find this in `app/page.tsx` (around line 244):
```css
:root {
  --plum: #812d6b;
  --gold: #d4b483;
  --cream: #faf8f3;
  --sage: #9ba88c;
  --lavender: #d8a7c4;
}
```

### Edit Content
Find the `slides` array in `app/page.tsx` (starts line 6):
```javascript
const slides: ReactNode[] = [
  // Slide 1: Title
  (<div>...</div>),
  // Slide 2: Alignment
  (<div>...</div>),
  // etc...
]
```

## 🔄 Try Different Versions

### Save Current Version
```bash
git add .
git commit -m "Current version"
```

### Create Experiment
```bash
git checkout -b try-new-colors
# Make changes...
npm run dev  # Preview
```

### Keep It or Revert
```bash
# Like it? Merge to main
git checkout main
git merge try-new-colors

# Don't like it? Just switch back
git checkout main
```

## 🌐 Your Links

- **GitHub**: https://github.com/dkellam44/kd-pitch-deck
- **Vercel**: (Get this after first deployment)
- **Local**: http://localhost:3000

## 💡 Pro Tips

1. Always run `npm run dev` to preview changes before deploying
2. Commit often - each commit is a save point
3. Use branches for experiments - keep main stable
4. Pushing to main auto-deploys to Vercel

---

**Need more details?** See `WORKFLOW.md` for the complete guide!
