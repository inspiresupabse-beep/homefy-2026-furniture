-- Run once on Homefy-furniture-crm if "Create Account" fails
-- Supabase SQL Editor → New query → paste all → Run

-- 1. Staff power column (required for Users page)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS staff_power TEXT NOT NULL DEFAULT 'leads_and_orders';

UPDATE profiles SET staff_power = 'full_access' WHERE role = 'admin';

-- 2. Ensure all roles exist (safe if 001 already ran)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'sales_manager';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'sales_executive';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'leading_staff';

-- 3. Profile trigger for new signups
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role user_role := 'sales_executive';
  role_text text := NEW.raw_user_meta_data->>'role';
BEGIN
  IF role_text IS NOT NULL AND role_text <> '' THEN
    BEGIN
      assigned_role := role_text::user_role;
    EXCEPTION WHEN OTHERS THEN
      assigned_role := 'sales_executive';
    END;
  END IF;

  INSERT INTO profiles (id, email, full_name, role, staff_power)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    assigned_role,
    CASE WHEN assigned_role = 'admin' THEN 'full_access' ELSE 'leads_and_orders' END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

NOTIFY pgrst, 'reload schema';
