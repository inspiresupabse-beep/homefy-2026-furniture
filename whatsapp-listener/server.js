require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");
const {
  initWhatsAppService,
  sendMessageToPhone,
  sendLeadReminder,
  getConnectionStatus,
  getLinkedPhone,
  getExtractedLog,
  getDataFilePath,
} = require("./whatsappService");

const PORT = Number(process.env.PORT) || 4000;
const CORS_ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:3000,https://crm.teamhomefy.in")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CORS_ORIGINS.length ? CORS_ORIGINS : true,
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/status", (_req, res) => {
  res.json({ status: getConnectionStatus(), linkedPhone: getLinkedPhone() });
});

app.get("/api/messages", (_req, res) => {
  res.json({ messages: getExtractedLog() });
});

app.get("/api/download", (_req, res) => {
  try {
    const filePath = getDataFilePath();
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "No messages file yet" });
    }
    res.download(filePath, "extracted-messages.txt");
  } catch (err) {
    res.status(500).json({ error: err.message || "Download failed" });
  }
});

app.post("/api/send", async (req, res) => {
  try {
    const { phone, message, expectedSenderPhone } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ error: "phone and message are required" });
    }
    const sent = await sendMessageToPhone(phone, message, expectedSenderPhone);
    io.emit("message-sent", sent);
    res.json({ ok: true, sent });
  } catch (err) {
    res.status(500).json({ error: err.message || "Send failed" });
  }
});

app.post("/api/send-lead-reminder", async (req, res) => {
  try {
    const { phone, customerName, reminder, senderName, expectedSenderPhone } = req.body;
    if (!phone || !customerName || !reminder) {
      return res.status(400).json({
        error: "phone, customerName, and reminder are required",
      });
    }
    const sent = await sendLeadReminder(
      phone,
      customerName,
      reminder,
      senderName,
      expectedSenderPhone
    );
    io.emit("message-sent", sent);
    res.json({ ok: true, sent });
  } catch (err) {
    res.status(500).json({ error: err.message || "Reminder send failed" });
  }
});

io.on("connection", (socket) => {
  socket.emit("status", { status: getConnectionStatus(), linkedPhone: getLinkedPhone() });
  socket.emit("extracted-log", getExtractedLog());

  socket.on("request-status", () => {
    socket.emit("status", { status: getConnectionStatus(), linkedPhone: getLinkedPhone() });
  });
});

initWhatsAppService(io);

server.listen(PORT, () => {
  console.log(`WhatsApp Listener dashboard: http://localhost:${PORT}`);
});
