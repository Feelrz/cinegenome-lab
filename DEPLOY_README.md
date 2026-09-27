# CINEGENOME V5.0 FINAL — DEPLOY

Production target: Vercel. Domain/DNS: `cinegenome.xyz` managed in Hostinger and pointed to the Vercel project.

## Required Production environment variables
Keep the same server-side Vercel environment variables already used by the project. Depending on the enabled features these include TMDB credentials and Upstash REST credentials. Never commit real values; `.env.example` contains names only.

## Deployment
Deploy this folder as the project root so `index.html` and `/api/*` share the same origin. After deployment, attach `cinegenome.xyz` to the Vercel project and use the exact DNS records Vercel shows in Hostinger DNS.

## Final browser check
Open the deployed domain on desktop and mobile. Confirm the homepage papers, SFX toggle, Scanner/API search, Lab Wall, visitor counter, and responsive redirect. The code/data/static QA report is in `FINAL_QA.md`.
