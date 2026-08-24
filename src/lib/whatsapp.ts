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
