# WhatsApp Listener

Monitor a WhatsApp group, extract messages matching a pattern, save them to a text file, and manage messages from a web dashboard.

## Stack

- **Node.js + Express** — API & static dashboard
- **whatsapp-web.js** — WhatsApp Web automation (`LocalAuth` session)
- **Socket.io** — QR code & live status to the browser
- **Vanilla HTML/CSS/JS** — Dashboard UI

## Production deploy (no developer PC)

| Option | Cost | Card? | Client-ready? | Guide |
|--------|------|-------|---------------|--------|
| **Oracle Cloud** | $0/month | Yes | Yes | [DEPLOY-ORACLE-FREE.md](./DEPLOY-ORACLE-FREE.md) |
| **Render** | $0 free / ~$7 Starter | No (free) | Free: **No** (sleeps) | [DEPLOY-RENDER.md](./DEPLOY-RENDER.md) |
| Hetzner VPS | ~€4/month | Yes | Yes | [DEPLOY-HETZNER.md](./DEPLOY-HETZNER.md) |

**Recommended:** Oracle (free + always on) or Render **Starter** if you want no Oracle signup.

## Setup (local dev)

```bash
cd whatsapp-listener
npm install
cp .env.example .env
npm start
```

Open **http://localhost:4000** and scan the QR code with WhatsApp → **Linked devices**.

## Configuration (`.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default `4000`) |
| `WHATSAPP_GROUP_NAME` | Group name substring to monitor (empty = all chats) |
| `MESSAGE_PATTERN` | Regex — only matching messages are saved |
| `AUTO_REPLY_MESSAGE` | Reply sent to direct (DM) messages |
| `AUTO_REPLY_ENABLED` | `true` / `false` |
| `DATA_FILE` | Path to extracted messages `.txt` file |

## Features

1. **QR login** — Scan once; session saved in `.wwebjs_auth/`
2. **Group listener** — Watches configured group for new messages
3. **Pattern filter** — Saves matches to `data/extracted-messages.txt`
4. **Auto-reply** — DMs get “How can I help you?” style reply
5. **Staff reminders** — Send lead update messages from the dashboard
6. **Download** — Download the extracted messages file from the dashboard

## API

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/status` | Connection status |
| GET | `/api/messages` | Extracted message log |
| GET | `/api/download` | Download `.txt` file |
| POST | `/api/send` | `{ phone, message }` |
| POST | `/api/send-lead-reminder` | `{ phone, customerName, reminder }` |

## Notes

- Uses **headless Puppeteer** (Chrome). On Linux servers you may need extra dependencies.
- WhatsApp Web automation is unofficial — use a dedicated business number.
- Keep `.wwebjs_auth/` private; it contains your session.
