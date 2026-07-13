# Deploy WhatsApp Listener on Oracle Cloud (Free)

**$0/month forever** — runs on Oracle’s servers, not your PC. Best free option for handing the product to a client.

| Component | URL example |
|-----------|-------------|
| CRM (Vercel) | `https://crm.teamhomefy.in` |
| Listener (Oracle VPS) | `https://wa.teamhomefy.in` |

**Always Free allowance (2026):** up to **2 OCPU + 12 GB RAM** on ARM (Ampere A1) — enough for Node + Chrome/Puppeteer.

---

## Why Oracle (not Render / Railway)?

| Platform | Free? | Always on? | Works for WhatsApp? |
|----------|-------|------------|---------------------|
| **Oracle Cloud VPS** | Yes, forever | Yes | **Yes** |
| Render free | Yes | No (sleeps) | No |
| Railway | Trial only | — | No |
| Your PC | Yes | Only if PC on | No for clients |

---

## 1. Create Oracle account (client account)

1. Go to [oracle.com/cloud/free](https://www.oracle.com/cloud/free/)
2. Sign up in the **client’s name/email** (they should own the account)
3. Choose **Home Region** carefully — pick one close to users, e.g.:
   - **India:** `ap-mumbai-1`
   - **Europe:** `eu-frankfurt-1`
4. Complete verification (card may be required; Always Free resources are not charged if you stay within limits)

---

## 2. Create Always Free VM

1. Oracle Console → **Compute** → **Instances** → **Create instance**
2. Settings:
   - **Name:** `homefy-whatsapp`
   - **Image:** Ubuntu 24.04 (aarch64 / Arm)
   - **Shape:** **Ampere** → `VM.Standard.A1.Flex`
   - **OCPU:** 2 (max free)
   - **Memory:** 12 GB (max free)
   - **Boot volume:** 50 GB
   - **Networking:** assign public IPv4
   - **SSH key:** paste your public key
3. Click **Create**

### “Out of host capacity” error?

Common on popular regions. Try:

- Different **availability domain** (AD-1, AD-2, AD-3)
- Retry at off-peak hours (early morning)
- Another region in the same country if listed
- Split into smaller instance: 1 OCPU + 6 GB still works for WhatsApp

---

## 3. Open firewall ports

Oracle blocks traffic by default.

1. **Networking** → **Virtual cloud networks** → your VCN → **Security Lists**
2. Edit **Ingress Rules**, add:

| Source | Protocol | Port | Description |
|--------|----------|------|-------------|
| `0.0.0.0/0` | TCP | 22 | SSH |
| `0.0.0.0/0` | TCP | 80 | HTTP (Caddy) |
| `0.0.0.0/0` | TCP | 443 | HTTPS |

Also on the instance (Ubuntu):

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 7 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

---

## 4. DNS

At GoDaddy (or your registrar):

| Type | Name | Value |
|------|------|-------|
| A | `wa` | `<ORACLE_PUBLIC_IP>` |

→ `wa.teamhomefy.in`

---

## 5. SSH into the server

```bash
ssh ubuntu@<ORACLE_PUBLIC_IP>
```

(Oracle Ubuntu images use user `ubuntu`, not `root`.)

---

## 6. Install Node, Chrome deps, PM2, Caddy

Same as Hetzner — run on the server:

```bash
sudo apt update && sudo apt upgrade -y

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

sudo apt install -y \
  ca-certificates fonts-liberation libasound2t64 libatk-bridge2.0-0t64 \
  libatk1.0-0t64 libc6 libcairo2 libcups2t64 libdbus-1-3 libexpat1 \
  libfontconfig1 libgbm1 libgcc-s1 libglib2.0-0t64 libgtk-3-0t64 \
  libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 \
  libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 \
  libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
  lsb-release wget xdg-utils

sudo npm install -g pm2
sudo apt install -y caddy
```

---

## 7. Deploy listener

```bash
sudo mkdir -p /opt/homefy
sudo chown ubuntu:ubuntu /opt/homefy
cd /opt/homefy

git clone https://github.com/inspiresupabse-beep/homefy-2026.git
cd homefy-2026/whatsapp-listener

npm install --omit=dev
cp .env.example .env
nano .env
```

### `.env`

```env
PORT=4000
CORS_ORIGINS=https://crm.teamhomefy.in
WHATSAPP_GROUP_NAME=Homefy Leads
MESSAGE_PATTERN=(?:lead|order|inquiry|customer)[\s:#-]*(.+)?
AUTO_REPLY_MESSAGE=Hi! Thanks for reaching out to Homefy. How can I help you today?
AUTO_REPLY_ENABLED=true
DATA_FILE=./data/extracted-messages.txt
```

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
# Run the sudo command PM2 prints
```

---

## 8. HTTPS with Caddy

```bash
sudo nano /etc/caddy/Caddyfile
```

```caddy
wa.teamhomefy.in {
    reverse_proxy localhost:4000
}
```

```bash
sudo systemctl reload caddy
curl https://wa.teamhomefy.in/api/status
```

---

## 9. Vercel (CRM)

Set in Vercel → Environment Variables:

```
NEXT_PUBLIC_WHATSAPP_LISTENER_URL=https://wa.teamhomefy.in
```

**Redeploy** production after changing.

---

## 10. Link WhatsApp

1. Open `https://crm.teamhomefy.in/whatsapp`
2. Scan QR with client’s phone (WhatsApp → Linked devices)
3. Status → **Connected & listening**

---

## Client handoff

- [ ] Oracle account owned by client
- [ ] Always Free VM within 2 OCPU / 12 GB
- [ ] Ports 22, 80, 443 open
- [ ] PM2 + Caddy start on boot
- [ ] Vercel env set + redeployed
- [ ] QR scanned once

**Cost: $0/month** (stay within Always Free limits; do not upgrade shape without checking billing).

---

## Oracle free tier tips

- **Do not delete** `.wwebjs_auth/` — it’s the WhatsApp session
- Oracle may reclaim **idle** free accounts — keep the VM doing light traffic
- If WhatsApp logs out, re-scan QR on `/whatsapp`
- For easier setup (paid ~€4/mo), see [DEPLOY-HETZNER.md](./DEPLOY-HETZNER.md)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Can’t create VM | Try another AD/region; retry later |
| CRM “Listener offline” | Check Oracle security list + Caddy + `pm2 status` |
| QR fails | `pm2 logs whatsapp-listener` — install Chrome deps |
| CORS error | Add CRM URL to `CORS_ORIGINS`, restart PM2 |
