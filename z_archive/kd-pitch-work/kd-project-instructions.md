Step 1: Set Up Project Structure
First, let's create a proper React-based version that's easier to maintain and deploy. I'll create the project files:KD Collaboration Pitch - Creating Spaciousness Through StructureInteractive artifact ∙ Version 2 Perfect! I've converted it to a React component. Now let me guide you through the complete setup:
Step 2: Create Local Project
Open your terminal and run these commands:
bash# Create a new Next.js project
npx create-next-app@latest kd-pitch-deck

# When prompted, choose:
# ✓ TypeScript? No
# ✓ ESLint? Yes
# ✓ Tailwind CSS? No (we're using custom CSS)
# ✓ src/ directory? No
# ✓ App Router? Yes
# ✓ Import alias? No

# Navigate into the project
cd kd-pitch-deck
Step 3: Set Up Project Files
Replace the content of app/page.js with the React component I just created above. You can copy it from the artifact.
Then update app/layout.js:
javascriptexport const metadata = {
  title: 'Creating Spaciousness Through Structure',
  description: 'Operations Support for KamalaDevi Creative',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
Step 4: Test Locally
bash# Start the development server
npm run dev

# Open http://localhost:3000 in your browser
Step 5: Set Up GitHub Repository
bash# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: KD pitch deck"

# Create a new repository on GitHub (via browser):
# Go to github.com → New Repository → Name it "kd-pitch-deck"

# Link your local repo to GitHub (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/kd-pitch-deck.git

# Push to GitHub
git branch -M main
git push -u origin main
Step 6: Deploy to Vercel
Option A: Via Vercel Dashboard (Easiest)

Go to vercel.com
Sign in with GitHub
Click "New Project"
Import your kd-pitch-deck repository
Click "Deploy" (Vercel auto-detects Next.js settings)
Wait ~1-2 minutes for deployment
Get your live URL: https://kd-pitch-deck.vercel.app

Option B: Via Terminal
bash# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts:
# Link to existing project? No
# Project name: kd-pitch-deck
# Directory: ./
# Build settings: (accept defaults)

# For production deployment:
vercel --prod
Step 7: Making Edits
Now you can easily edit content and style:
Edit Content:
Open app/page.js and modify the slides array. Each slide is clearly labeled with comments.
Edit Styles:
Modify the <style> section in the same file. All CSS variables are at the top:
css:root {
  --plum: #812D6B;
  --gold: #D4B483;
  --cream: #FAF8F3;
  --sage: #9BA88C;
  --lavender: #D8A7C4;