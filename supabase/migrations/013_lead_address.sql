-- Structured address fields on leads (safe to re-run)

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'Kerala',
  ADD COLUMN IF NOT EXISTS pin_code TEXT;

CREATE OR REPLACE FUNCTION format_lead_address(
  p_line1 TEXT,
  p_line2 TEXT,
  p_city TEXT,
  p_district TEXT,
  p_state TEXT,
  p_pin TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  parts TEXT[] := ARRAY[]::TEXT[];
  city_line TEXT;
  state_line TEXT;
BEGIN
  IF NULLIF(TRIM(p_line1), '') IS NOT NULL THEN
    parts := array_append(parts, TRIM(p_line1));
  END IF;
  IF NULLIF(TRIM(p_line2), '') IS NOT NULL THEN
    parts := array_append(parts, TRIM(p_line2));
  END IF;

  city_line := NULLIF(TRIM(CONCAT_WS(', ', NULLIF(TRIM(p_city), ''), NULLIF(TRIM(p_district), ''))), '');
  IF city_line IS NOT NULL THEN
    parts := array_append(parts, city_line);
  END IF;

  IF NULLIF(TRIM(p_pin), '') IS NOT NULL THEN
    state_line := NULLIF(TRIM(CONCAT_WS(' - ', NULLIF(TRIM(p_state), ''), TRIM(p_pin))), '');
  ELSE
    state_line := NULLIF(TRIM(p_state), '');
  END IF;

  IF state_line IS NOT NULL THEN
    parts := array_append(parts, state_line);
  END IF;

  IF array_length(parts, 1) IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN array_to_string(parts, E'\n');
END;
$$;

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
BEGIN
  SELECT * INTO v_lead FROM leads WHERE id = p_lead_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;

  IF v_lead.status = 'converted' THEN
    RAISE EXCEPTION 'Lead is already converted';
  END IF;

  IF v_lead.interaction_type IN ('site', 'shop') AND v_lead.visit_status <> 'completed' THEN
    RAISE EXCEPTION 'Visit status must be Completed before converting Site or Shop leads';
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
