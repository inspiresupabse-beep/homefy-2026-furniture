-- Daily telecaller / staff ad reports (one row per staff per day)

CREATE TABLE IF NOT EXISTS daily_staff_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  leads_assigned INT NOT NULL DEFAULT 0 CHECK (leads_assigned >= 0),
  leads_contacted INT NOT NULL DEFAULT 0 CHECK (leads_contacted >= 0),
  interested_customers INT NOT NULL DEFAULT 0 CHECK (interested_customers >= 0),
  shop_visits_planned INT NOT NULL DEFAULT 0 CHECK (shop_visits_planned >= 0),
  orders_confirmed INT NOT NULL DEFAULT 0 CHECK (orders_confirmed >= 0),
  not_interested INT NOT NULL DEFAULT 0 CHECK (not_interested >= 0),
  no_response INT NOT NULL DEFAULT 0 CHECK (no_response >= 0),
  pending_follow_up INT NOT NULL DEFAULT 0 CHECK (pending_follow_up >= 0),
  advance_received NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (advance_received >= 0),
  notes TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, report_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_staff_reports_user_date
  ON daily_staff_reports(user_id, report_date DESC);

ALTER TABLE daily_staff_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff manage own daily reports" ON daily_staff_reports;
CREATE POLICY "Staff manage own daily reports"
  ON daily_staff_reports FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins view all daily reports" ON daily_staff_reports;
CREATE POLICY "Admins view all daily reports"
  ON daily_staff_reports FOR SELECT TO authenticated
  USING (is_admin());

CREATE TRIGGER daily_staff_reports_updated_at
  BEFORE UPDATE ON daily_staff_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

NOTIFY pgrst, 'reload schema';
