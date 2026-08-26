import { isWhatsAppLinked } from "@/lib/whatsapp";

const storageKey = (userId: string) => `homefy-office-wa-connected:${userId}`;

/** Staff confirmed WhatsApp on this device matches their saved office number. */
export function isOfficeWhatsAppConnected(
  profile: { id: string; phone?: string | null } | null | undefined
): boolean {
  if (!isWhatsAppLinked(profile) || !profile) return false;
  if (typeof window === "undefined") return true;

  try {
    return localStorage.getItem(storageKey(profile.id)) === profile.phone;
  } catch {
    return false;
  }
}

export function confirmOfficeWhatsApp(profile: { id: string; phone: string }): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(profile.id), profile.phone);
  } catch {
    /* private browsing */
  }
}

export function clearOfficeWhatsAppConnection(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {
    /* ignore */
  }
}

export const OFFICE_WHATSAPP_CONNECT_ID = "connect-office-whatsapp";

export const OFFICE_WHATSAPP_REQUIRED_MESSAGE =
  "Connect your office WhatsApp first — save your number and confirm below.";
