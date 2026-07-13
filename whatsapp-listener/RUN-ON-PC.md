# Run WhatsApp Listener on Your PC

Keep the listener on **this computer**. Good for development and personal use.

---

## One-time setup

```bash
cd whatsapp-listener
npm install
copy .env.example .env
```

Edit `whatsapp-listener/.env` if needed (group name, auto-reply, etc.).

Root `.env.local` should have:

```env
NEXT_PUBLIC_WHATSAPP_LISTENER_URL=http://localhost:4000
```

(Already set in your project.)

---

## Start everything

**Option A — CRM + listener together**

From project root:

```bash
npm run dev:all
```

**Option B — listener only** (CRM already running elsewhere)

```bash
npm run whatsapp:listener
```

**Option C — listener only from its folder**

```bash
cd whatsapp-listener
npm start
```

---

## Use WhatsApp in the CRM

1. Open **http://localhost:3000/whatsapp**
2. Scan QR in the **Linked WhatsApp** card
3. WhatsApp stays linked while the listener is running

Session is saved in `whatsapp-listener/.wwebjs_auth/` — you usually only scan once.

---

## Keep it running on Windows

- Leave the terminal open, **or**
- Use **PM2 for Windows**: `npm install -g pm2` then from `whatsapp-listener`:
  ```bash
  pm2 start server.js --name whatsapp-listener
  pm2 save
  ```
- Don’t sleep/shutdown the PC if you need WhatsApp 24/7

---

## Production site (`crm.teamhomefy.in`)

**localhost only works on this PC.** The live Vercel site cannot reach your PC’s `localhost:4000`.

| Where you open CRM | WhatsApp works? |
|--------------------|-----------------|
| `http://localhost:3000/whatsapp` | Yes (listener on this PC) |
| `https://crm.teamhomefy.in/whatsapp` | No (unless you add Cloudflare Tunnel later) |

For now: use **local CRM** for WhatsApp, or deploy listener to a server when the client needs it.

---

## Stop

- Terminal: `Ctrl+C`
- PM2: `pm2 stop whatsapp-listener`
