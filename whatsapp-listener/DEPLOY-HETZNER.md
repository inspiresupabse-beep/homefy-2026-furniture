# Deploy WhatsApp Listener on Hetzner

Run the listener on a **Hetzner VPS** so your client’s CRM works 24/7 without any developer PC.

| Component | URL example |
|-----------|-------------|
| CRM (Vercel) | `https://crm.teamhomefy.in` |
| Listener (Hetzner) | `https://wa.teamhomefy.in` |

---

## 1. Create Hetzner server (client account)

1. Sign up at [hetzner.com/cloud](https://www.hetzner.com/cloud)
2. **New Project** → **Add Server**
3. Recommended:
   - **Location:** Falkenstein or Nuremberg (EU) — pick closest to India if latency matters, or Singapore if available on your plan
   - **Image:** Ubuntu 24.04
   - **Type:** **CX22** (2 vCPU, 4 GB RAM, ~€4/month) — enough for Node + Chrome
   - **Networking:** IPv4 + IPv6
   - **SSH key:** add yours (recommended) or use password once and disable password login later
4. Note the **server IP** (e.g. `95.217.x.x`)

Create the server in the **client’s** Hetzner account so they own it after handoff.

---

## 2. DNS (GoDaddy / your registrar)

Add an **A record** for the listener subdomain:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `wa` | `<HETZNER_SERVER_IP>` | 600 |

Result: `wa.teamhomefy.in` → your VPS.

Wait 5–30 minutes for DNS to propagate.

---

## 3. SSH into the server

```bash
ssh root@<HETZNER_SERVER_IP>
```

---

## 4. Install Node.js, Chrome dependencies, PM2, Caddy

```bash
apt update && apt upgrade -y

# Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Puppeteer / Chrome dependencies (required for whatsapp-web.js)
apt install -y \
  ca-certificates fonts-liberation libasound2t64 libatk-bridge2.0-0t64 \
  libatk1.0-0t64 libc6 libcairo2 libcups2t64 libdbus-1-3 libexpat1 \
  libfontconfig1 libgbm1 libgcc-s1 libglib2.0-0t64 libgtk-3-0t64 \
  libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 \
  libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 \
  libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
  lsb-release wget xdg-utils

# Process manager + HTTPS reverse proxy
npm install -g pm2
apt install -y caddy
```

---

## 5. Deploy the listener app

```bash
mkdir -p /opt/homefy
cd /opt/homefy

git clone https://github.com/inspiresupabse-beep/homefy-2026.git
cd homefy-2026/whatsapp-listener

npm install --omit=dev
cp .env.example .env
nano .env
```

### `.env` for production

```env
PORT=4000
CORS_ORIGINS=https://crm.teamhomefy.in
WHATSAPP_GROUP_NAME=Homefy Leads
MESSAGE_PATTERN=(?:lead|order|inquiry|customer)[\s:#-]*(.+)?
AUTO_REPLY_MESSAGE=Hi! Thanks for reaching out to Homefy. How can I help you today?
AUTO_REPLY_ENABLED=true
DATA_FILE=./data/extracted-messages.txt
```

Replace `crm.teamhomefy.in` with the client’s actual CRM domain if different.

---

## 6. Start with PM2 (auto-restart + boot)

From `/opt/homefy/homefy-2026/whatsapp-listener`:

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
# Run the command PM2 prints (systemd enable)
```

Check logs:

```bash
pm2 logs whatsapp-listener
pm2 status
```

---

## 7. HTTPS with Caddy

Create `/etc/caddy/Caddyfile`:

```caddy
wa.teamhomefy.in {
    reverse_proxy localhost:4000
}
```

Replace `wa.teamhomefy.in` with your listener subdomain.

```bash
systemctl reload caddy
systemctl status caddy
```

Caddy obtains a free Let’s Encrypt certificate automatically.

Test:

```bash
curl https://wa.teamhomefy.in/api/status
```

Expected: `{"status":"initializing"}` or `"waiting_for_qr"` or `"ready"`.

---

## 8. Point Vercel CRM at Hetzner

In **Vercel** → project **homefy-2026-axys** → **Settings** → **Environment Variables**:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_WHATSAPP_LISTENER_URL` | `https://wa.teamhomefy.in` |

Apply to **Production**, then **redeploy** (required — `NEXT_PUBLIC_*` is baked at build time).

```bash
npx vercel deploy --prod --yes
```

---

## 9. Link WhatsApp (one time)

1. Open `https://crm.teamhomefy.in/whatsapp`
2. Wait for **Linked WhatsApp** → **Scan QR to link**
3. On phone: WhatsApp → **Linked devices** → **Link a device** → scan QR
4. Status should become **Connected & listening**

Session is stored in `/opt/homefy/homefy-2026/whatsapp-listener/.wwebjs_auth/` — survives restarts unless WhatsApp logs out the device.

---

## 10. Client handoff checklist

- [ ] Hetzner account owned by client
- [ ] VPS running, PM2 + Caddy enabled on boot
- [ ] DNS `wa.*` → server IP
- [ ] Vercel env `NEXT_PUBLIC_WHATSAPP_LISTENER_URL` set
- [ ] CRM redeployed after env change
- [ ] WhatsApp QR scanned from client phone
- [ ] Firewall: only ports **22**, **80**, **443** open (Hetzner Cloud Firewall)

```bash
# Optional: UFW on server
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable
```

---

## Updates

```bash
cd /opt/homefy/homefy-2026
git pull
cd whatsapp-listener
npm install --omit=dev
pm2 restart whatsapp-listener
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CRM shows “Listener offline” | Check `curl https://wa.teamhomefy.in/api/status`, Caddy, PM2 |
| CORS error in browser | Add CRM URL to `CORS_ORIGINS` in listener `.env`, restart PM2 |
| QR never appears | `pm2 logs whatsapp-listener` — often missing Chrome libs |
| WhatsApp logged out | Re-scan QR; avoid using same number on too many linked devices |
| Mixed content blocked | Listener must be **HTTPS**, not `http://` |

---

## Cost

- **Hetzner CX22:** ~€4–5/month
- **Caddy + Let’s Encrypt:** free
- **Vercel hobby:** free (CRM)
- **No developer PC required**
