/** URL of the Node whatsapp-listener service (must run separately — not on Vercel). */
export function getWhatsAppListenerUrl(): string {
  const url = process.env.NEXT_PUBLIC_WHATSAPP_LISTENER_URL?.trim();
  if (url) return url.replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:4000";
  }
  return "";
}

export function whatsAppListenerApi(path: string): string {
  const base = getWhatsAppListenerUrl();
  if (!base) return "";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
