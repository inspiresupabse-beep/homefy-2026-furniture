import { formatPhoneDisplay, phonesMatch } from "@/lib/phone";
import { getListenerConnectionIssue, getWhatsAppListenerUrl } from "@/lib/whatsapp-listener-config";

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

export const WHATSAPP_LINK_REQUIRED_MESSAGE = "Please link your WhatsApp first.";

export const WHATSAPP_LISTENER_REQUIRED_MESSAGE =
  "Connect your WhatsApp first. Scan the QR code on this page with your phone.";

export const WHATSAPP_WRONG_LINKED_MESSAGE =
  "Wrong WhatsApp linked. The WhatsApp logged in on this device does not match your saved number.";

export function isWhatsAppLinked(profile: { phone?: string | null } | null | undefined): boolean {
  if (!profile?.phone) return false;
  const digits = profile.phone.replace(/\D/g, "");
  return digits.length >= 10;
}

export function getWhatsAppSendBlockReason(
  profile: { phone?: string | null } | null | undefined,
  linkedPhone: string | null | undefined,
  listenerReady: boolean
): string | null {
  if (typeof window !== "undefined") {
    const connectionIssue = getListenerConnectionIssue(getWhatsAppListenerUrl());
    if (connectionIssue) return connectionIssue;
  }

  if (!isWhatsAppLinked(profile)) {
    return WHATSAPP_LINK_REQUIRED_MESSAGE;
  }

  if (!listenerReady) {
    return WHATSAPP_LISTENER_REQUIRED_MESSAGE;
  }

  if (!linkedPhone) {
    return "Could not verify the linked WhatsApp number. Refresh the listener status.";
  }

  if (profile?.phone && !phonesMatch(linkedPhone, profile.phone)) {
    return `${WHATSAPP_WRONG_LINKED_MESSAGE} Device: ${formatPhoneDisplay(linkedPhone)} · Profile: ${formatPhoneDisplay(profile.phone)}`;
  }

  return null;
}

export async function verifyWhatsAppBeforeSend(
  profile: { phone?: string | null } | null | undefined
): Promise<string | null> {
  if (!isWhatsAppLinked(profile)) {
    return WHATSAPP_LINK_REQUIRED_MESSAGE;
  }

  const { getListenerConnectionIssue, getWhatsAppListenerUrl, whatsAppListenerApi } = await import(
    "@/lib/whatsapp-listener-config"
  );
  const listenerUrl = getWhatsAppListenerUrl();
  const connectionIssue = getListenerConnectionIssue(listenerUrl);
  if (connectionIssue) {
    return connectionIssue;
  }

  const url = whatsAppListenerApi("/api/status");
  if (!url) {
    return WHATSAPP_LISTENER_REQUIRED_MESSAGE;
  }

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return WHATSAPP_LISTENER_REQUIRED_MESSAGE;
    }
    const data = (await res.json()) as { status?: string; linkedPhone?: string | null };
    const listenerReady = data.status === "ready";
    return getWhatsAppSendBlockReason(profile, data.linkedPhone ?? null, listenerReady);
  } catch {
    return WHATSAPP_LISTENER_REQUIRED_MESSAGE;
  }
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

export async function sendMessageViaListener(
  phone: string,
  message: string,
  senderName?: string | null,
  expectedSenderPhone?: string | null
): Promise<{ ok: boolean; error?: string }> {
  const { whatsAppListenerApi } = await import("@/lib/whatsapp-listener-config");
  const url = whatsAppListenerApi("/api/send");
  if (!url) return { ok: false, error: "WhatsApp listener not configured" };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        message,
        senderName: senderName ?? undefined,
        expectedSenderPhone: expectedSenderPhone ?? undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || "Send failed" };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}
