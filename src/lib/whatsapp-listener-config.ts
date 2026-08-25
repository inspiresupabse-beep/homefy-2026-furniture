/** URL of the Node whatsapp-listener service (must run separately — not on Vercel). */
export function getWhatsAppListenerUrl(): string {
  const url = process.env.NEXT_PUBLIC_WHATSAPP_LISTENER_URL?.trim();
  if (url) return url.replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:4000";
  }
  return "";
}

/** HTTPS CRM pages cannot call http://localhost (browser mixed-content block). */
export function isListenerUrlBlockedInBrowser(listenerUrl: string): boolean {
  if (!listenerUrl || typeof window === "undefined") return false;
  if (window.location.protocol !== "https:") return false;
  return listenerUrl.startsWith("http://");
}

export function getListenerConnectionIssue(listenerUrl: string): string | null {
  if (!listenerUrl) {
    return "WhatsApp listener URL is not configured for this site.";
  }
  if (isListenerUrlBlockedInBrowser(listenerUrl)) {
    return "This live site uses HTTPS and cannot reach http://localhost from your browser. Open the CRM at http://localhost:3000 on this PC, or set an HTTPS listener URL (for example https://wa.teamhomefy.in) in Vercel.";
  }
  return null;
}

export function whatsAppListenerApi(path: string): string {
  const base = getWhatsAppListenerUrl();
  if (!base) return "";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
