-- Allow admins to create, update, and delete any daily staff report

DROP POLICY IF EXISTS "Admins view all daily reports" ON daily_staff_reports;

CREATE POLICY "Admins manage all daily reports"
  ON daily_staff_reports FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

NOTIFY pgrst, 'reload schema';
