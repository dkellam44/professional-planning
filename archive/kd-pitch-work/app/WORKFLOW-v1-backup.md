# Simple Workflow for KD Pitch Deck

This guide will help you edit content, try different versions, and deploy your favorite.

## 🎨 Making Changes

### Step 1: Start Local Preview
```bash
npm run dev
```
- Opens at http://localhost:3000
- Changes appear instantly as you edit
- Press `Ctrl+C` to stop

### Step 2: Edit Content & Styling

**Edit Content:**
- Open `app/page.tsx`
- Find the `slides` array (starts around line 6)
- Each slide is clearly labeled with comments
- Edit text, change wording, update contact info

**Edit Styling:**
- In the same file, find the `<style>` section (around line 241)
- Change colors at the top:
  ```css
  :root {
    --plum: #812d6b;    /* Main brand color */
    --gold: #d4b483;    /* Accent color */
    --cream: #faf8f3;   /* Background */
    --sage: #9ba88c;    /* Secondary accent */
    --lavender: #d8a7c4; /* Highlights */
  }
  ```
- Adjust fonts, sizes, spacing below

## 🔄 Version Control Workflow

### Save a Version (Checkpoint)
When you like what you see, save it:
```bash
git add .
git commit -m "Describe what you changed"
```

Example:
```bash
git commit -m "Updated pricing and changed accent color to teal"
```

### Try Different Versions

**Create a Branch for Experiments:**
```bash
# Save your current work first!
git add .
git commit -m "Current version before experimenting"

# Create a new experimental branch
git checkout -b experiment-pricing
# Make changes, preview them...
git add .
git commit -m "Trying higher pricing model"
```

**Switch Between Versions:**
```bash
# Go back to main version
git checkout main

# Go to experimental version
git checkout experiment-pricing

# Create another experiment
git checkout -b experiment-colors
```

**See All Your Versions:**
```bash
git branch
```

### Choose Your Final Version

**Option A: Keep Experimental Changes**
```bash
# Make sure you're on the branch you like
git checkout experiment-pricing

# Merge it into main
git checkout main
git merge experiment-pricing
```

**Option B: Go Back to Previous Version**
```bash
# Just switch back to main
git checkout main

# Delete the experiment if you don't want it
git branch -d experiment-pricing
```

## 🚀 Deploy to Vercel

### First Time Setup
1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "New Project"
4. Import `dkellam44/kd-pitch-deck`
5. Click "Deploy"
6. Save your deployment URL!

### Update Deployment (After Changes)

**Quick Update:**
```bash
# Make sure you're on main branch
git checkout main

# Push to GitHub
git push origin main
```
- Vercel automatically deploys within 1-2 minutes
- Check your deployment URL to see changes live

**Manual Deploy:**
- Go to Vercel dashboard
- Find your project
- Click "Redeploy" if needed

## 📋 Quick Reference

### Daily Workflow
```bash
# 1. Start working
npm run dev                    # Preview locally

# 2. Make changes in app/page.tsx

# 3. Like what you see? Save it
git add .
git commit -m "What I changed"

# 4. Deploy it
git push origin main           # Auto-deploys to Vercel
```

### Experimenting Workflow
```bash
# 1. Save current work
git add .
git commit -m "Current version"

# 2. Create experiment
git checkout -b try-new-design

# 3. Make changes, preview with npm run dev

# 4. Like it? Merge to main
git checkout main
git merge try-new-design
git push origin main

# 5. Don't like it? Just go back
git checkout main
```

## 🆘 Common Tasks

**See what changed:**
```bash
git status                     # Files you've modified
git diff                       # See exact changes
```

**Undo recent changes (not committed yet):**
```bash
git checkout app/page.tsx      # Undo changes to this file
```

**See version history:**
```bash
git log --oneline              # List of all versions
```

**Go back to a previous version:**
```bash
git log --oneline              # Find the version ID
git checkout abc123            # Replace abc123 with the ID
git checkout -b version-from-past  # Save it as a branch
```

## 💡 Tips

1. **Commit often** - Each commit is a save point you can return to
2. **Write clear commit messages** - "Updated pricing" is better than "changes"
3. **Use branches for big experiments** - Keep main stable
4. **Preview before deploying** - Always test with `npm run dev` first
5. **Vercel auto-deploys** - Pushing to main triggers deployment automatically

## 🎯 Example Workflow

Let's say you want to try different pricing:

```bash
# 1. Start from a clean slate
git checkout main
git add .
git commit -m "Current version with $1,200 pricing"

# 2. Try version A - higher pricing
git checkout -b pricing-version-a
# Edit app/page.tsx, change to $1,800
npm run dev  # Preview
git add .
git commit -m "Pricing option A: $1,800"

# 3. Try version B - lower pricing
git checkout main
git checkout -b pricing-version-b
# Edit app/page.tsx, change to $800
npm run dev  # Preview
git add .
git commit -m "Pricing option B: $800"

# 4. Compare them
git checkout pricing-version-a  # See version A
git checkout pricing-version-b  # See version B
git checkout main               # See original

# 5. Choose your favorite (let's say version A)
git checkout main
git merge pricing-version-a
git push origin main  # Deploys to Vercel!

# 6. Clean up
git branch -d pricing-version-b  # Delete version B
git branch -d pricing-version-a  # Delete version A (already merged)
```

---

**Need help?** All these commands work from the terminal in the `app` directory.
