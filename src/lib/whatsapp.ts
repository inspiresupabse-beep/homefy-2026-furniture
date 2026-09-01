/** Normalize Indian phone numbers for wa.me links */
export function normalizeWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith("91") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 11) return `91${digits.slice(1)}`;
  return digits;
}

export function buildWhatsAppUrl(phone: string, message?: string): string {
  const normalized = normalizeWhatsAppPhone(phone);
  const base = `https://wa.me/${normalized}`;
  if (!message?.trim()) return base;
  return `${base}?text=${encodeURIComponent(message.trim())}`;
}

export function whatsAppSenderLabel(senderName?: string | null): string {
  const name = senderName?.trim();
  return name ? `${name} from Homefy` : "Homefy";
}

export function isWhatsAppLinked(profile: { phone?: string | null } | null | undefined): boolean {
  if (!profile?.phone) return false;
  const digits = profile.phone.replace(/\D/g, "");
  return digits.length >= 10;
}

export function defaultLeadMessage(customerName: string, senderName?: string | null): string {
  return `Hi ${customerName}, this is ${whatsAppSenderLabel(senderName)}. How can we help you with your furniture needs today?`;
}

export function defaultFollowUpMessage(
  customerName: string,
  reminderTitle: string,
  senderName?: string | null
): string {
  return `Hi ${customerName}, this is ${whatsAppSenderLabel(senderName)} regarding your inquiry — ${reminderTitle}. Please let us know a good time to connect.`;
}

export function defaultOrderMessage(
  customerName: string,
  orderNumber: string,
  senderName?: string | null
): string {
  return `Hi ${customerName}, this is ${whatsAppSenderLabel(senderName)} about your order ${orderNumber}. Please share if you have any questions.`;
}

export const WHATSAPP_WEB_URL = "https://web.whatsapp.com";

/** Native app home — no phone number, opens chat list (not a specific contact). */
export const WHATSAPP_APP_HOME_URL = "whatsapp://";

/**
 * Opens WhatsApp home (all chats).
 * Tries the installed WhatsApp app on PC/mobile first; falls back to WhatsApp Web.
 */
export function openWhatsAppHome(): void {
  if (typeof window === "undefined") return;

  let appOpened = false;

  const markAppOpened = () => {
    appOpened = true;
  };

  window.addEventListener("blur", markAppOpened, { once: true });
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) markAppOpened();
    },
    { once: true }
  );

  window.setTimeout(() => {
    if (!appOpened) {
      window.open(WHATSAPP_WEB_URL, "_blank", "noopener,noreferrer");
    }
  }, 1500);

  const link = document.createElement("a");
  link.href = WHATSAPP_APP_HOME_URL;
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/** Opens WhatsApp on this device (app or WhatsApp Web) with a prefilled message. */
export function openWhatsAppChat(phone: string, message?: string): void {
  window.open(buildWhatsAppUrl(phone, message), "_blank", "noopener,noreferrer");
}

export async function sendMessageViaListener(
  phone: string,
  message: string,
  senderName?: string | null
): Promise<{ ok: boolean; error?: string }> {
  const { whatsAppListenerApi } = await import("@/lib/whatsapp-listener-config");
  const url = whatsAppListenerApi("/api/send");
  if (!url) return { ok: false, error: "WhatsApp listener not configured" };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, message, senderName: senderName ?? undefined }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || "Send failed" };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}
