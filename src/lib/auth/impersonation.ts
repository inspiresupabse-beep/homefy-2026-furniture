export const IMPERSONATION_BACKUP_COOKIE = "homefy_impersonation_backup";
export const IMPERSONATION_META_COOKIE = "homefy_impersonation_meta";

export type ImpersonationMeta = {
  adminName: string;
  staffName: string;
};

export function readImpersonationMeta(): ImpersonationMeta | null {
  if (typeof document === "undefined") return null;

  const prefix = `${IMPERSONATION_META_COOKIE}=`;
  const entry = document.cookie.split("; ").find((row) => row.startsWith(prefix));
  if (!entry) return null;

  try {
    return JSON.parse(decodeURIComponent(entry.slice(prefix.length))) as ImpersonationMeta;
  } catch {
    return null;
  }
}
