/** Normalize to 10-digit Indian mobile (no country code). */
export function normalizePhoneDigits(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  return digits.slice(-10);
}

export function isValidIndianMobile(phone: string): boolean {
  const digits = normalizePhoneDigits(phone);
  return /^[6-9]\d{9}$/.test(digits);
}

/** E.164 for Supabase phone auth (+91XXXXXXXXXX). */
export function toE164Phone(phone: string): string {
  const digits = normalizePhoneDigits(phone);
  return `+91${digits}`;
}

export function phonesMatch(a: string, b: string): boolean {
  return normalizePhoneDigits(a) === normalizePhoneDigits(b);
}

export function formatPhoneDisplay(phone: string): string {
  const digits = normalizePhoneDigits(phone);
  if (digits.length !== 10) return phone;
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}
