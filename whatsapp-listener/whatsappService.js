const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
const { Client, LocalAuth } = require("whatsapp-web.js");

const DATA_FILE = path.resolve(process.env.DATA_FILE || "./data/extracted-messages.txt");
const GROUP_NAME = process.env.WHATSAPP_GROUP_NAME || "";
const AUTO_REPLY = process.env.AUTO_REPLY_MESSAGE || "Hi! Thanks for reaching out to Homefy. How can I help you today?";
const AUTO_REPLY_ENABLED = process.env.AUTO_REPLY_ENABLED !== "false";

let messagePattern;
try {
  messagePattern = new RegExp(process.env.MESSAGE_PATTERN || "(lead|order|inquiry)", "i");
} catch {
  messagePattern = /(lead|order|inquiry)/i;
}

/** @type {import('socket.io').Server | null} */
let io = null;

/** @type {import('whatsapp-web.js').Client | null} */
let client = null;

let connectionStatus = "initializing";
/** @type {string | null} Last 10 digits of the WhatsApp account connected via QR */
let linkedPhone = null;
const extractedLog = [];

function phoneDigitsMatch(a, b) {
  const da = String(a || "").replace(/\D/g, "").slice(-10);
  const db = String(b || "").replace(/\D/g, "").slice(-10);
  return da.length === 10 && db.length === 10 && da === db;
}

function setStatus(status) {
  connectionStatus = status;
  if (status !== "ready") {
    linkedPhone = null;
  }
  io?.emit("status", { status, linkedPhone });
}

function captureLinkedPhone() {
  const wid = client?.info?.wid?.user;
  linkedPhone = wid ? String(wid) : null;
  return linkedPhone;
}

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "# Homefy WhatsApp extracted messages\n", "utf8");
  }
}

function cleanupStaleAuthLocks() {
  const authRoot = path.join(__dirname, ".wwebjs_auth");
  if (!fs.existsSync(authRoot)) return;

  const removeJournalFiles = (dir) => {
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        removeJournalFiles(fullPath);
        continue;
      }
      if (entry.name.endsWith("-journal")) {
        try {
          fs.unlinkSync(fullPath);
        } catch {
          /* locked by another process — listener may already be running */
        }
      }
    }
  };

  removeJournalFiles(authRoot);
}

function appendToFile(line) {
  ensureDataFile();
  fs.appendFileSync(DATA_FILE, line + "\n", "utf8");
}

function pushExtracted(entry) {
  extractedLog.unshift(entry);
  if (extractedLog.length > 200) extractedLog.pop();
  io?.emit("message-extracted", entry);
  io?.emit("extracted-log", extractedLog);
}

function formatPhoneFromId(chatId) {
  if (!chatId) return "";
  return chatId.replace(/@c\.us$|@g\.us$/, "");
}

function normalizePhone(input) {
  const digits = String(input).replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}@c.us`;
  if (digits.length === 12 && digits.startsWith("91")) return `${digits}@c.us`;
  if (digits.length > 0) return `${digits}@c.us`;
  throw new Error("Invalid phone number");
}

function initWhatsAppService(socketIo) {
  io = socketIo;
  ensureDataFile();
  cleanupStaleAuthLocks();

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: path.join(__dirname, ".wwebjs_auth") }),
    puppeteer: {
      headless: true,
      ...(process.env.PUPPETEER_EXECUTABLE_PATH
        ? { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH }
        : {}),
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    },
  });

  client.on("qr", async (qr) => {
    setStatus("waiting_for_qr");
    try {
      require("qrcode-terminal").generate(qr, { small: true });
    } catch {
      /* optional terminal QR */
    }
    try {
      const dataUrl = await QRCode.toDataURL(qr);
      io?.emit("qr", { qr, dataUrl });
    } catch {
      io?.emit("qr", { qr });
    }
  });

  client.on("authenticated", () => {
    setStatus("authenticated");
  });

  client.on("auth_failure", (msg) => {
    setStatus("auth_failure");
    io?.emit("error", { message: `Authentication failed: ${msg}` });
  });

  client.on("ready", () => {
    captureLinkedPhone();
    setStatus("ready");
    io?.emit("ready", {
      groupName: GROUP_NAME || "(all chats)",
      linkedPhone,
    });
  });

  client.on("disconnected", (reason) => {
    linkedPhone = null;
    setStatus("disconnected");
    io?.emit("error", { message: `WhatsApp disconnected: ${reason}` });
  });

  client.on("message", async (message) => {
    try {
      if (message.fromMe) return;

      const chat = await message.getChat();
      const contact = await message.getContact();
      const senderName = contact.pushname || contact.name || contact.number || "Unknown";
      const body = (message.body || "").trim();

      if (!body) return;

      const isTargetGroup =
        !GROUP_NAME ||
        (chat.isGroup && chat.name && chat.name.toLowerCase().includes(GROUP_NAME.toLowerCase()));

      if (GROUP_NAME && !isTargetGroup) {
        return;
      }

      // Auto-reply to direct messages from customers (not group broadcasts)
      if (AUTO_REPLY_ENABLED && !chat.isGroup) {
        await message.reply(AUTO_REPLY);
        io?.emit("auto-reply-sent", {
          to: senderName,
          phone: formatPhoneFromId(message.from),
          text: AUTO_REPLY,
          at: new Date().toISOString(),
        });
      }

      if (!messagePattern.test(body)) {
        return;
      }

      const timestamp = new Date().toISOString();
      const source = chat.isGroup ? `group:${chat.name}` : `dm:${senderName}`;
      const line = `[${timestamp}] [${source}] ${senderName}: ${body}`;

      appendToFile(line);

      const entry = {
        id: message.id.id,
        timestamp,
        source,
        senderName,
        phone: formatPhoneFromId(message.from),
        body,
        chatId: message.from,
      };

      pushExtracted(entry);
    } catch (err) {
      console.error("Message handler error:", err);
      io?.emit("error", { message: err.message || "Failed to process message" });
    }
  });

  setStatus("connecting");
  client.initialize().catch((err) => {
    setStatus("error");
    const message =
      err?.message?.includes("EBUSY") || err?.message?.includes("locked")
        ? "WhatsApp session files are locked. Stop other listener processes, then run npm run whatsapp:listener again."
        : err.message || "Failed to initialize WhatsApp client";
    io?.emit("error", { message });
  });
}

function assertSenderPhone(expectedSenderPhone) {
  if (!linkedPhone) {
    throw new Error("WhatsApp is not connected on this device. Scan the QR code first.");
  }
  if (!expectedSenderPhone) {
    throw new Error("Please save your WhatsApp number in your profile first.");
  }
  if (!phoneDigitsMatch(linkedPhone, expectedSenderPhone)) {
    throw new Error(
      "Wrong WhatsApp linked. This device is logged in with a different number. Scan the QR with your own WhatsApp or update your profile number."
    );
  }
}

async function sendMessageToPhone(phone, text, expectedSenderPhone) {
  if (!client) throw new Error("WhatsApp client not initialized");
  assertSenderPhone(expectedSenderPhone);
  const state = await client.getState();
  if (state !== "CONNECTED") throw new Error(`WhatsApp not connected (state: ${state})`);

  const chatId = normalizePhone(phone);
  const result = await client.sendMessage(chatId, text);
  return {
    id: result.id.id,
    to: chatId,
    text,
    at: new Date().toISOString(),
  };
}

async function sendLeadReminder(phone, customerName, reminderText, senderName, expectedSenderPhone) {
  const from = senderName?.trim() ? `${senderName.trim()} from Homefy` : "Homefy";
  const message = `Hi ${customerName},\n\nThis is ${from} with an update on your inquiry:\n\n${reminderText}\n\nPlease reply if you have any questions.`;
  return sendMessageToPhone(phone, message, expectedSenderPhone);
}

function getConnectionStatus() {
  return connectionStatus;
}

function getLinkedPhone() {
  return linkedPhone;
}

function getExtractedLog() {
  return extractedLog;
}

function getDataFilePath() {
  ensureDataFile();
  return DATA_FILE;
}

module.exports = {
  initWhatsAppService,
  sendMessageToPhone,
  sendLeadReminder,
  getConnectionStatus,
  getLinkedPhone,
  getExtractedLog,
  getDataFilePath,
};
