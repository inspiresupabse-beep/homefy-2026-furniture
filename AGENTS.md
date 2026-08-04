<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:homefy-deploy-accounts -->
# Homefy — use ONLY these accounts

Always commit, push, and deploy using the **Homefy project accounts** below. Do not use other GitHub repos, Vercel projects/teams, or Supabase projects.

| Service | Account / resource |
|---------|-------------------|
| **GitHub repo** | `inspiresupabse-beep/homefy-2026-furniture` |
| **Git branch** | `master` |
| **Live site** | `https://furniture.teamhomefy.in` |
| **Vercel project** | `homefy-2026-axys` |
| **Vercel team ID** | `team_XhEbXsVrI7jEkzMZlbcMZO03` |
| **Supabase project** | `ulyqbffnltkscbyjdjbj` (Homefy-furniture-crm) |

Note: If the old project ID is missing in Vercel, GitHub Actions will recreate/link `homefy-2026-axys` on deploy. Re-add env vars in Vercel and attach domain `furniture.teamhomefy.in`.

Deploy via push to `master` (GitHub Actions → Vercel) or Vercel dashboard for **homefy-2026-axys** only. Never deploy to unrelated Vercel projects (e.g. jokerly-music, trading-app).
<!-- END:homefy-deploy-accounts -->
