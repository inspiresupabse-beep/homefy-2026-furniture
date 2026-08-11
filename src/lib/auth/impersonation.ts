export const IMPERSONATION_BACKUP_COOKIE = "homefy_impersonation_backup";
export const IMPERSONATION_META_COOKIE = "homefy_impersonation_meta";

export type ImpersonationMeta = {
  adminName: string;
  staffName: string;
};

function parseImpersonationMeta(raw: string | undefined): ImpersonationMeta | null {
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ImpersonationMeta;
  } catch {
    return null;
  }
}

export function readImpersonationMeta(): ImpersonationMeta | null {
  if (typeof document === "undefined") return null;

  const prefix = `${IMPERSONATION_META_COOKIE}=`;
  const entry = document.cookie.split("; ").find((row) => row.startsWith(prefix));
  if (!entry) return null;

  return parseImpersonationMeta(decodeURIComponent(entry.slice(prefix.length)));
}
