-- Expand lead interaction types (marketing / channel sources)

ALTER TYPE interaction_type ADD VALUE IF NOT EXISTS 'whatsapp';
ALTER TYPE interaction_type ADD VALUE IF NOT EXISTS 'facebook';
ALTER TYPE interaction_type ADD VALUE IF NOT EXISTS 'instagram';
ALTER TYPE interaction_type ADD VALUE IF NOT EXISTS 'meta_ads';
ALTER TYPE interaction_type ADD VALUE IF NOT EXISTS 'google_lead';
ALTER TYPE interaction_type ADD VALUE IF NOT EXISTS 'direct_shop_visit';
ALTER TYPE interaction_type ADD VALUE IF NOT EXISTS 'referral';
ALTER TYPE interaction_type ADD VALUE IF NOT EXISTS 'other';

-- Direct shop visit requires completed visit before convert (same as legacy shop)
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

  IF v_lead.interaction_type IN ('site', 'shop', 'direct_shop_visit')
    AND v_lead.visit_status <> 'completed' THEN
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
