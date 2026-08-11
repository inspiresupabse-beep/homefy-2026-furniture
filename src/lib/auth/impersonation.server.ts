import { cookies } from "next/headers";
import { IMPERSONATION_META_COOKIE, type ImpersonationMeta } from "@/lib/auth/impersonation";

export async function getImpersonationMeta(): Promise<ImpersonationMeta | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(IMPERSONATION_META_COOKIE)?.value;
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ImpersonationMeta;
  } catch {
    return null;
  }
}
