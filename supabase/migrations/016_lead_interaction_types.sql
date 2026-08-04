-- Custom interaction types (add via + button in UI)

CREATE TABLE IF NOT EXISTS lead_interaction_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📋',
  requires_visit BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO lead_interaction_types (value, label, icon, requires_visit, sort_order) VALUES
  ('whatsapp', 'WhatsApp', '💬', false, 1),
  ('facebook', 'Facebook', '📘', false, 2),
  ('instagram', 'Instagram', '📸', false, 3),
  ('meta_ads', 'Meta ads', '📣', false, 4),
  ('google_lead', 'Google lead', '🔍', false, 5),
  ('direct_shop_visit', 'Direct shop visit', '🛒', true, 6),
  ('referral', 'Referral', '🤝', false, 7),
  ('other', 'Other', '📋', false, 8),
  ('site', 'Site Visit', '🏠', true, 90),
  ('shop', 'Shop Visit', '🛒', true, 91),
  ('phone', 'Phone', '📞', false, 92),
  ('online', 'Online', '💻', false, 93)
ON CONFLICT (value) DO NOTHING;

-- Store any interaction type string (built-in or user-added)
ALTER TABLE leads ALTER COLUMN interaction_type DROP DEFAULT;
ALTER TABLE leads
  ALTER COLUMN interaction_type TYPE TEXT
  USING interaction_type::text;
ALTER TABLE leads ALTER COLUMN interaction_type SET DEFAULT 'whatsapp';
ALTER TABLE leads ALTER COLUMN interaction_type SET NOT NULL;

ALTER TABLE lead_interaction_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read interaction types" ON lead_interaction_types;
CREATE POLICY "Authenticated can read interaction types"
  ON lead_interaction_types FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated can add interaction types" ON lead_interaction_types;
CREATE POLICY "Authenticated can add interaction types"
  ON lead_interaction_types FOR INSERT TO authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION convert_lead_to_order(p_lead_id UUID, p_created_by UUID DEFAULT auth.uid())
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead leads%ROWTYPE;
  v_order_id UUID;
  v_address TEXT;
  v_requires_visit BOOLEAN;
BEGIN
  SELECT * INTO v_lead FROM leads WHERE id = p_lead_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;

  IF v_lead.status = 'converted' THEN
    RAISE EXCEPTION 'Lead is already converted';
  END IF;

  SELECT requires_visit INTO v_requires_visit
  FROM lead_interaction_types
  WHERE value = v_lead.interaction_type;

  IF COALESCE(v_requires_visit, false) AND v_lead.visit_status <> 'completed' THEN
    RAISE EXCEPTION 'Visit status must be Completed before converting this lead';
  END IF;

  v_address := format_lead_address(
    v_lead.address_line1,
    v_lead.address_line2,
    v_lead.city,
    v_lead.district,
    v_lead.state,
    v_lead.pin_code
  );

  INSERT INTO orders (
    lead_id,
    customer_name,
    phone,
    address,
    assigned_to,
    assigned_staff,
    narration,
    site_visit_date,
    created_by,
    order_number
  ) VALUES (
    v_lead.id,
    v_lead.customer_name,
    v_lead.phone,
    v_address,
    COALESCE(v_lead.assigned_staff, v_lead.assigned_to),
    v_lead.assigned_staff,
    v_lead.narration,
    v_lead.site_visit_date,
    p_created_by,
    ''
  )
  RETURNING id INTO v_order_id;

  UPDATE leads
  SET status = 'converted', updated_at = NOW()
  WHERE id = p_lead_id;

  RETURN v_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION convert_lead_to_order(UUID, UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
