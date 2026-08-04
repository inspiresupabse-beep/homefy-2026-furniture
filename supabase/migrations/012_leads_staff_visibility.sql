-- Staff see only their assigned leads; admins see all leads.
-- Safe to re-run.

DROP POLICY IF EXISTS "Authenticated users can view leads" ON leads;
DROP POLICY IF EXISTS "Admins can view all leads" ON leads;
DROP POLICY IF EXISTS "Staff can view assigned leads" ON leads;

CREATE POLICY "Admins can view all leads" ON leads
  FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "Staff can view assigned leads" ON leads
  FOR SELECT TO authenticated
  USING (
    assigned_to = auth.uid()
    OR assigned_staff = auth.uid()
    OR created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Agents can update assigned leads" ON leads;

CREATE POLICY "Agents can update assigned leads" ON leads
  FOR UPDATE TO authenticated
  USING (
    assigned_to = auth.uid()
    OR assigned_staff = auth.uid()
    OR created_by = auth.uid()
  );

NOTIFY pgrst, 'reload schema';
