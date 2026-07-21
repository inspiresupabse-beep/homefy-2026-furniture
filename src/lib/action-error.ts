const SETUP_HINT =
  "Database setup incomplete. In Supabase SQL Editor run: 001_initial_schema.sql, 008_lead_reminders.sql, then 010_new_project_fix.sql";

export function formatActionError(error: unknown): string {
  if (error == null) return SETUP_HINT;

  if (typeof error === "string") {
    const text = error.trim();
    if (!text || text === "{}" || text === "undefined") return SETUP_HINT;
    if (text.includes("staff_power")) {
      return "Missing staff_power column. Run 010_new_project_fix.sql in Supabase SQL Editor.";
    }
    if (text.includes("enum user_role")) return SETUP_HINT;
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
      obj.code && obj.code !== obj.message ? `code: ${obj.code}` : null,
      obj.status ? `status: ${obj.status}` : null,
      obj.details,
      obj.hint,
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
    message.includes("staff_power")
  );
}
