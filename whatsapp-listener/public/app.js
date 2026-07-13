const socket = io();

const statusBadge = document.getElementById("status-badge");
const statusDetail = document.getElementById("status-detail");
const qrWrap = document.getElementById("qr-wrap");
const qrImage = document.getElementById("qr-image");
const messageLog = document.getElementById("message-log");
const activityLog = document.getElementById("activity-log");
const reminderForm = document.getElementById("reminder-form");
const customForm = document.getElementById("custom-form");
const sendFeedback = document.getElementById("send-feedback");

const STATUS_LABELS = {
  initializing: "Initializing",
  connecting: "Connecting",
  waiting_for_qr: "Waiting for QR",
  authenticated: "Authenticated",
  ready: "Ready",
  disconnected: "Disconnected",
  auth_failure: "Auth failed",
  error: "Error",
};

function setStatus(status) {
  statusBadge.textContent = STATUS_LABELS[status] || status;
  statusBadge.className = `badge badge-${status.replace(/_/g, "-")}`;

  switch (status) {
    case "waiting_for_qr":
      statusDetail.textContent = "Scan the QR code with your phone.";
      break;
    case "authenticated":
      statusDetail.textContent = "Logged in — loading chats…";
      qrWrap.classList.add("hidden");
      break;
    case "ready":
      statusDetail.textContent = "Listening for messages.";
      qrWrap.classList.add("hidden");
      break;
    case "disconnected":
      statusDetail.textContent = "Phone disconnected. Restart the server or re-link.";
      break;
    default:
      statusDetail.textContent = "WhatsApp client status updated.";
  }
}

function renderMessages(messages) {
  if (!messages?.length) {
    messageLog.innerHTML = '<li class="muted">No extracted messages yet.</li>';
    return;
  }

  messageLog.innerHTML = messages
    .map(
      (m) => `
      <li>
        <div class="log-meta">${new Date(m.timestamp).toLocaleString()} · ${escapeHtml(m.source)}</div>
        <strong>${escapeHtml(m.senderName)}</strong>
        <span class="muted">${escapeHtml(m.phone)}</span>
        <p>${escapeHtml(m.body)}</p>
      </li>`
    )
    .join("");
}

function addActivity(text, type = "info") {
  const li = document.createElement("li");
  li.className = type;
  li.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
  activityLog.prepend(li);
  while (activityLog.children.length > 50) {
    activityLog.removeChild(activityLog.lastChild);
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function showFeedback(text, ok) {
  sendFeedback.textContent = text;
  sendFeedback.classList.remove("hidden", "ok", "err");
  sendFeedback.classList.add(ok ? "ok" : "err");
}

socket.on("status", ({ status }) => setStatus(status));

socket.on("qr", ({ dataUrl, qr }) => {
  qrWrap.classList.remove("hidden");
  if (dataUrl) {
    qrImage.src = dataUrl;
  } else {
    qrImage.removeAttribute("src");
    qrImage.alt = "QR data received — install qrcode on server for image preview";
  }
  addActivity("QR code generated — scan to link WhatsApp");
});

socket.on("ready", ({ groupName }) => {
  addActivity(`Ready. Monitoring: ${groupName}`, "ok");
});

socket.on("message-extracted", (entry) => {
  addActivity(`Extracted: ${entry.senderName} — ${entry.body.slice(0, 60)}`, "ok");
});

socket.on("extracted-log", renderMessages);

socket.on("auto-reply-sent", ({ to, text }) => {
  addActivity(`Auto-reply sent to ${to}: "${text}"`);
});

socket.on("message-sent", ({ to, text }) => {
  addActivity(`Staff message sent to ${to}`, "ok");
  showFeedback("Message sent successfully.", true);
});

socket.on("error", ({ message }) => {
  addActivity(message, "err");
  showFeedback(message, false);
});

reminderForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const phone = document.getElementById("phone").value.trim();
  const customerName = document.getElementById("customer-name").value.trim();
  const reminder = document.getElementById("reminder").value.trim();

  try {
    const res = await fetch("/api/send-lead-reminder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, customerName, reminder }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Send failed");
    reminderForm.reset();
    showFeedback("Lead reminder sent on WhatsApp.", true);
  } catch (err) {
    showFeedback(err.message, false);
  }
});

customForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const phone = document.getElementById("custom-phone").value.trim();
  const message = document.getElementById("custom-message").value.trim();

  try {
    const res = await fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, message }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Send failed");
    customForm.reset();
    showFeedback("Message sent.", true);
  } catch (err) {
    showFeedback(err.message, false);
  }
});

fetch("/api/messages")
  .then((r) => r.json())
  .then((data) => renderMessages(data.messages))
  .catch(() => {});

fetch("/api/status")
  .then((r) => r.json())
  .then((data) => setStatus(data.status))
  .catch(() => {});
