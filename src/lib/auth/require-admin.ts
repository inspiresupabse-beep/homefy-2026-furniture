import { requireProfile } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import type { Profile } from "@/lib/types/database";

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/");
  return profile;
}
