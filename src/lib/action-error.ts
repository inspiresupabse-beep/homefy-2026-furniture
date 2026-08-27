const SETUP_HINT =
  "Database setup incomplete. In Supabase → SQL Editor, run supabase/migrations/010_new_project_fix.sql (adds staff_power and leading_staff role).";

function duplicateFieldMessage(text: string): string | null {
  const lower = text.toLowerCase();

  const isEmailDuplicate =
    lower.includes("email_exists") ||
    lower.includes("users_email") ||
    (lower.includes("email") &&
      (lower.includes("already") ||
        lower.includes("registered") ||
        lower.includes("exists") ||
        lower.includes("duplicate") ||
        lower.includes("unique")));

  if (isEmailDuplicate) {
    return "This email is already used by another staff account.";
  }

  const isPhoneDuplicate =
    lower.includes("phone_exists") ||
    lower.includes("users_phone") ||
    (lower.includes("phone") &&
      (lower.includes("already") ||
        lower.includes("registered") ||
        lower.includes("exists") ||
        lower.includes("duplicate") ||
        lower.includes("unique")));

  if (isPhoneDuplicate) {
    return "This mobile number is already used by another staff account.";
  }

  if (lower.includes("23505") || lower.includes("duplicate key")) {
    if (lower.includes("email")) {
      return "This email is already used by another staff account.";
    }
    if (lower.includes("phone")) {
      return "This mobile number is already used by another staff account.";
    }
  }

  return null;
}

export function formatActionError(error: unknown): string {
  if (error == null) return SETUP_HINT;

  if (typeof error === "string") {
    const text = error.trim();
    if (!text || text === "{}" || text === "undefined") return SETUP_HINT;
    const duplicate = duplicateFieldMessage(text);
    if (duplicate) return duplicate;
    if (text.includes("staff_power") || text.includes("PGRST204")) {
      return "Missing staff_power column. In Supabase SQL Editor run: supabase/migrations/010_new_project_fix.sql";
    }
    if (text.includes("leading_staff") || text.includes("enum user_role") || text.includes("22P02")) {
      return "Missing leading_staff role. In Supabase SQL Editor run: supabase/migrations/010_new_project_fix.sql";
    }
    if (text.includes("Invalid API key") || text.includes("JWT")) {
      return "Invalid Supabase service key. Update SUPABASE_SERVICE_ROLE_KEY in Vercel and .env.local.";
    }
    return text;
  }

  if (error instanceof Error) {
    return formatActionError(error.message || error.name);
  }

  if (typeof error === "object") {
    const obj = error as {
      message?: unknown;
      code?: unknown;
      status?: unknown;
      details?: unknown;
      hint?: unknown;
      name?: unknown;
    };

    const parts = [
      obj.message,
      obj.details,
      obj.hint,
      obj.code && obj.code !== obj.message ? `code: ${obj.code}` : null,
      obj.status ? `status: ${obj.status}` : null,
      obj.name,
    ]
      .filter(Boolean)
      .map(String);

    if (parts.length > 0) {
      const combined = parts.join(" — ");
      if (combined.trim() && combined !== "{}") return formatActionError(combined);
    }
  }

  return SETUP_HINT;
}

export function isRoleEnumError(message: string): boolean {
  return (
    message.includes("enum user_role") ||
    message.includes("invalid input value for enum") ||
    message.includes("leading_staff") ||
    message.includes("staff_power") ||
    message.includes("PGRST204")
  );
}

export function supabaseErrorText(error: {
  message?: string | null;
  details?: string | null;
  hint?: string | null;
  code?: string | null;
} | null): string {
  if (!error) return "";
  return [error.message, error.details, error.hint, error.code ? `code: ${error.code}` : null]
    .filter(Boolean)
    .join(" — ");
}
