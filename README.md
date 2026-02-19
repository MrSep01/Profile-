# Sep Portfolio Site

Production portfolio site for **Sep Alamouti**, deployed via GitHub Pages.

## Main Files

- `index.html`: Home page
- `portfolio.html`: Portfolio landing page
- `blog.html`: Blog category landing page
- `styles.css`: Site styling and responsive layout
- `script.js`: UI behavior, share tools, comments, and engagement features
- `supabase-config.js`: Public Supabase client configuration
- `supabase/functions/engagement/index.ts`: Edge Function for likes/comments/reports/share tracking
- `supabase-phase-b.sql`: Phase B database hardening migration
- `supabase-phase-c.sql`: Phase C analytics and comment metadata migration

## Local Preview

Run a simple static server from this folder and open the printed URL.

## Deployment

Site is published from `main` to GitHub Pages through the repository workflow in `.github/workflows/deploy-pages.yml`.
