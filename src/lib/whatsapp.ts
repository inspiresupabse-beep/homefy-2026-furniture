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

export type WhatsAppAppKind = "personal" | "business";

const APP_SCHEMES: Record<WhatsAppAppKind, string> = {
  personal: "whatsapp",
  business: "whatsapp-business",
};

const ANDROID_PACKAGES: Record<WhatsAppAppKind, string> = {
  personal: "com.whatsapp",
  business: "com.whatsapp.w4b",
};

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

/** Mobile needs location.href — programmatic anchor clicks often fail for app schemes. */
function openAppUrl(url: string): void {
  if (typeof window === "undefined") return;

  if (isMobileDevice()) {
    window.location.assign(url);
    return;
  }

  const link = document.createElement("a");
  link.href = url;
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function openHttpUrl(url: string): void {
  if (typeof window === "undefined") return;

  if (isMobileDevice()) {
    window.location.assign(url);
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function buildAndroidLaunchIntent(kind: WhatsAppAppKind): string {
  const pkg = ANDROID_PACKAGES[kind];
  const fallback = encodeURIComponent(WHATSAPP_WEB_URL);
  return `intent://#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;scheme=whatsapp;package=${pkg};S.browser_fallback_url=${fallback};end`;
}

function buildAndroidChatIntent(
  kind: WhatsAppAppKind,
  phone: string,
  message?: string
): string {
  const pkg = ANDROID_PACKAGES[kind];
  const normalized = normalizeWhatsAppPhone(phone);
  const params = new URLSearchParams({ phone: normalized });
  if (message?.trim()) params.set("text", message.trim());
  const fallback = encodeURIComponent(buildWhatsAppUrl(phone, message));
  return `intent://send?${params.toString()}#Intent;scheme=whatsapp;package=${pkg};S.browser_fallback_url=${fallback};end`;
}

/** Href for opening WhatsApp app home — use on a real <a> tag for mobile reliability. */
export function buildWhatsAppAppHomeHref(kind: WhatsAppAppKind): string {
  if (typeof navigator === "undefined") return `${APP_SCHEMES[kind]}://`;

  if (isAndroid()) {
    return buildAndroidLaunchIntent(kind);
  }

  if (isIOS()) {
    // Opens the installed app (chat list) on iPhone/iPad.
    return `${APP_SCHEMES[kind]}://`;
  }

  return `${APP_SCHEMES[kind]}://`;
}

/** Href for opening a contact chat in the native app — use on a real <a> tag. */
export function buildWhatsAppAppChatHref(
  kind: WhatsAppAppKind,
  phone: string,
  message?: string
): string {
  if (typeof navigator === "undefined") {
    return buildNativeWhatsAppChatUrl(kind, phone, message);
  }

  if (isMobileDevice() && kind === "personal") {
    return buildWhatsAppUrl(phone, message);
  }

  if (isAndroid()) {
    return buildAndroidChatIntent(kind, phone, message);
  }

  return buildNativeWhatsAppChatUrl(kind, phone, message);
}

/** Opens the installed WhatsApp app home (chat list). */
export function openWhatsAppAppHome(kind: WhatsAppAppKind): void {
  openAppUrl(buildWhatsAppAppHomeHref(kind));
}

export function buildNativeWhatsAppChatUrl(
  kind: WhatsAppAppKind,
  phone: string,
  message?: string
): string {
  const normalized = normalizeWhatsAppPhone(phone);
  const params = new URLSearchParams({ phone: normalized });
  if (message?.trim()) params.set("text", message.trim());
  return `${APP_SCHEMES[kind]}://send?${params.toString()}`;
}

export function buildWebWhatsAppChatUrl(phone: string, message?: string): string {
  const normalized = normalizeWhatsAppPhone(phone);
  const params = new URLSearchParams({ phone: normalized });
  if (message?.trim()) params.set("text", message.trim());
  return `https://web.whatsapp.com/send?${params.toString()}`;
}

/** Opens a contact chat in the installed WhatsApp app with optional prefilled message. */
export function openWhatsAppAppChat(
  kind: WhatsAppAppKind,
  phone: string,
  message?: string
): void {
  openAppUrl(buildWhatsAppAppChatHref(kind, phone, message));
}

/** Opens a contact chat in WhatsApp Web with optional prefilled message. */
export function openWhatsAppWebChat(phone: string, message?: string): void {
  openHttpUrl(buildWebWhatsAppChatUrl(phone, message));
}

/** Opens WhatsApp Web home in the browser (explicit choice only). */
export function openWhatsAppWeb(): void {
  openHttpUrl(WHATSAPP_WEB_URL);
}

/** @deprecated Use the app picker via WhatsAppSendButton instead. */
export function openWhatsAppHome(): void {
  openWhatsAppAppHome("personal");
}

export const WHATSAPP_APP_HOME_URL = `${APP_SCHEMES.personal}://`;

/** @deprecated Use the app picker via WhatsAppSendButton instead. */
export function openWhatsAppChat(phone: string, message?: string): void {
  openWhatsAppWebChat(phone, message);
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
