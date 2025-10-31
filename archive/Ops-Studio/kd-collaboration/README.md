# KD Collaboration Pitch — Web App (v2)

A mobile-first Next.js site presenting the KD pitch as calm, scrollable slides with a simple text Appendix (Personal Profile + Trial Sprint).

## Quick Start
```bash
pnpm i    # or npm i / yarn
pnpm dev  # http://localhost:3000
```

## Build & Deploy (Vercel)
- Import GitHub repo in Vercel
- Build command: `next build`
- Output dir: `.next`

## Content
- Slides config: `content/slides.json`
- Appendix docs: `content/appendix/profile.mdx`, `content/appendix/trial-sprint.mdx`
- Images: `public/images` (4:5 KD hero recommended)

## Print to PDF
Use the browser print dialog. Each slide is a section; the Appendix prints as readable pages.

## License
MIT
