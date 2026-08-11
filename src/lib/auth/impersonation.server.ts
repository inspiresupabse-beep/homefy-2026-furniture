import { cookies } from "next/headers";
import {
  IMPERSONATION_META_COOKIE,
  type ImpersonationMeta,
} from "@/lib/auth/impersonation";

function parseImpersonationMeta(raw: string | undefined): ImpersonationMeta | null {
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ImpersonationMeta;
  } catch {
    return null;
  }
}

export async function getImpersonationMetaFromCookies(): Promise<ImpersonationMeta | null> {
  const cookieStore = await cookies();
  return parseImpersonationMeta(cookieStore.get(IMPERSONATION_META_COOKIE)?.value);
}
