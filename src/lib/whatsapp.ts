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

export function defaultLeadMessage(customerName: string): string {
  return `Hi ${customerName}, this is Homefy. How can we help you with your furniture needs today?`;
}

export function defaultFollowUpMessage(customerName: string, reminderTitle: string): string {
  return `Hi ${customerName}, this is Homefy regarding your inquiry — ${reminderTitle}. Please let us know a good time to connect.`;
}

export function defaultOrderMessage(customerName: string, orderNumber: string): string {
  return `Hi ${customerName}, this is Homefy about your order ${orderNumber}. Please share if you have any questions.`;
}
