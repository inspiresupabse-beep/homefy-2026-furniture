const ENUM_ROLE_HINT =
  "Database setup incomplete. In Supabase SQL Editor, run supabase/migrations/009_staff_power.sql (or 010_new_project_fix.sql), then try again.";

export function formatActionError(error: unknown): string {
  if (typeof error === "string") {
    if (!error || error === "{}") return ENUM_ROLE_HINT;
    if (error.includes("staff_power")) {
      return "Missing staff_power column. Run 009_staff_power.sql or 010_new_project_fix.sql in Supabase SQL Editor.";
    }
    if (error.includes("enum user_role")) return ENUM_ROLE_HINT;
    return error;
  }

  if (error instanceof Error) {
    if (!error.message || error.message === "{}") return ENUM_ROLE_HINT;
    if (error.message.includes("staff_power")) {
      return "Missing staff_power column. Run 009_staff_power.sql or 010_new_project_fix.sql in Supabase SQL Editor.";
    }
    if (error.message.includes("enum user_role")) return ENUM_ROLE_HINT;
    return error.message;
  }

  if (error && typeof error === "object") {
    const obj = error as { message?: unknown; code?: string; details?: string; hint?: string };
    const parts = [obj.message, obj.details, obj.hint].filter(Boolean).map(String);
    if (parts.length > 0) return formatActionError(parts.join(" — "));
  }

  return "Something went wrong. Please try again.";
}

export function isRoleEnumError(message: string): boolean {
  return message.includes("enum user_role") || message.includes("invalid input value for enum");
}
