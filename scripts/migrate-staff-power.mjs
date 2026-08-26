#!/usr/bin/env node
/**
 * Applies 010_new_project_fix.sql (staff_power + leading_staff role).
 * Requires SUPABASE_DB_PASSWORD in .env.local
 *   Supabase → Project Settings → Database → Database password
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return {};
  return Object.fromEntries(
    fs.readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .filter((l) => l && !l.startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i), l.slice(i + 1)];
      })
  );
}

const env = loadEnv();
const password = env.SUPABASE_DB_PASSWORD ?? process.env.SUPABASE_DB_PASSWORD;
const match = env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/);

if (!match || !password) {
  console.error(
    "Missing database password.\n\n" +
      "1. Supabase Dashboard → Project Settings → Database → copy password\n" +
      "2. Add to .env.local:\n" +
      "   SUPABASE_DB_PASSWORD=your_password\n\n" +
      "Or paste supabase/migrations/010_new_project_fix.sql into Supabase → SQL Editor → Run"
  );
  process.exit(1);
}

const sql = fs.readFileSync(
  path.join(__dirname, "..", "supabase", "migrations", "010_new_project_fix.sql"),
  "utf8"
);

const client = new pg.Client({
  connectionString: `postgresql://postgres:${encodeURIComponent(password)}@db.${match[1]}.supabase.co:5432/postgres`,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log("Applied 010_new_project_fix.sql — staff_power and roles are ready.");
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
