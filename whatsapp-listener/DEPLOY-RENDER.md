# Deploy WhatsApp Listener on Render

Deploy from GitHub with Docker. **No card required** on Render’s free tier.

| Component | URL example |
|-----------|-------------|
| CRM (Vercel) | `https://crm.teamhomefy.in` |
| Listener (Render) | `https://homefy-wa.onrender.com` or `https://wa.teamhomefy.in` |

---

## Important — read before using Render

| Render plan | Always on? | WhatsApp session | Good for client? |
|-------------|------------|------------------|------------------|
| **Free** | **No** — sleeps after ~15 min idle | Lost on sleep/redeploy | **Not recommended** |
| **Starter (~$7/mo)** | Yes | Persists until redeploy | OK for small clients |

**Free Render problems for WhatsApp:**

1. Service **spins down** when idle → CRM shows “Listener offline”
2. Cold start takes 30–60+ seconds
3. WhatsApp may **disconnect** after sleep
4. Disk is **ephemeral** — session may be lost on redeploy

**For a real client product**, prefer [DEPLOY-ORACLE-FREE.md](./DEPLOY-ORACLE-FREE.md) (free + always on, card required) or [DEPLOY-HETZNER.md](./DEPLOY-HETZNER.md) (paid, reliable).

Use Render if you want **quick testing** or **Starter paid** plan.

---

## 1. Push code to GitHub

Repo must include `whatsapp-listener/Dockerfile` (already in this project).

---

## 2. Create Render account

1. Go to [render.com](https://render.com)
2. **Get Started** → sign up with **GitHub**
3. Authorize Render to access your repo

No credit card needed for free tier.

---

## 3. Create Web Service

1. Dashboard → **New +** → **Web Service**
2. Connect repository: `inspiresupabse-beep/homefy-2026`
3. Settings:

| Field | Value |
|-------|--------|
| **Name** | `homefy-whatsapp` |
| **Region** | Singapore (closest to India) or Frankfurt |
| **Root Directory** | `whatsapp-listener` |
| **Runtime** | **Docker** |
| **Instance Type** | Free (testing) or **Starter $7** (production) |

Render auto-detects `Dockerfile` in `whatsapp-listener/`.

---

## 4. Environment variables

In **Environment** → **Add Environment Variable**:

| Key | Value |
|-----|--------|
| `PORT` | `4000` (Render may override — server reads `process.env.PORT`) |
| `CORS_ORIGINS` | `https://crm.teamhomefy.in` |
| `WHATSAPP_GROUP_NAME` | `Homefy Leads` |
| `MESSAGE_PATTERN` | `(?:lead\|order\|inquiry\|customer)[\s:#-]*(.+)?` |
| `AUTO_REPLY_MESSAGE` | `Hi! Thanks for reaching out to Homefy. How can I help you today?` |
| `AUTO_REPLY_ENABLED` | `true` |
| `DATA_FILE` | `./data/extracted-messages.txt` |
| `PUPPETEER_EXECUTABLE_PATH` | `/usr/bin/chromium` |

Click **Create Web Service**. First deploy takes 5–10 minutes.

---

## 5. Get your Render URL

After deploy succeeds, Render gives a URL like:

```
https://homefy-whatsapp.onrender.com
```

Test:

```bash
curl https://homefy-whatsapp.onrender.com/api/status
```

If the service was sleeping (free tier), wait ~1 minute for wake-up.

---

## 6. Custom domain (optional)

Render Dashboard → your service → **Settings** → **Custom Domains**

Add: `wa.teamhomefy.in`

At GoDaddy, add **CNAME**:

| Type | Name | Value |
|------|------|-------|
| CNAME | `wa` | `homefy-whatsapp.onrender.com` |

(Render shows the exact target — copy from their UI.)

---

## 7. Update Vercel CRM

Vercel → **homefy-2026-axys** → **Settings** → **Environment Variables**

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_WHATSAPP_LISTENER_URL` | `https://homefy-whatsapp.onrender.com` |

(or `https://wa.teamhomefy.in` if custom domain is set)

**Redeploy** production (required for `NEXT_PUBLIC_*` vars).

---

## 8. Link WhatsApp

1. Open `https://crm.teamhomefy.in/whatsapp`
2. If free tier: wait for Render to wake up (status may show offline first)
3. Scan QR when it appears
4. Status → **Connected & listening**

---

## Keep free tier awake (hack — not for production)

Free Render sleeps after inactivity. Some people use an external ping (e.g. UptimeRobot) every 10 minutes to hit `/api/status`.

This is **unreliable** for WhatsApp — use **Starter plan** or **Oracle/Hetzner** for clients.

---

## Redeploy after code changes

Render auto-deploys on `git push` to connected branch, or:

Dashboard → **Manual Deploy** → **Deploy latest commit**

**Note:** Redeploy may require **re-scanning WhatsApp QR** (session on ephemeral disk).

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails | Check **Logs** — usually Docker/Chrome |
| Listener offline | Free tier asleep — wait or upgrade to Starter |
| CORS error | Fix `CORS_ORIGINS` to match CRM URL exactly |
| QR then disconnects | Free tier sleep — upgrade or use Oracle |
| Out of memory | Free tier has 512 MB — upgrade to Starter (512MB+) |

---

## Cost summary

| Plan | Monthly | Client-ready? |
|------|---------|---------------|
| Render Free | $0 | No (sleeps) |
| Render Starter | ~$7 | Yes (basic) |
| Oracle Always Free | $0 | Yes (card required) |
| Hetzner CX22 | ~€4 | Yes |
