-- 1. CRITICAL — fix this identifier inconsistency FIRST
UPDATE manifest_clients SET slug = 'ofrank' WHERE slug = 'o-frank';

-- 3. Real, confirmed table structures
CREATE TABLE IF NOT EXISTS manifest_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  categories jsonb DEFAULT '[]'::jsonb,
  theme jsonb DEFAULT '{}'::jsonb,
  invoice_settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS manifest_domain_config (
  domain text PRIMARY KEY,
  client_id text NOT NULL REFERENCES manifest_clients(slug) ON UPDATE CASCADE,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS manifest_master (
  user_id uuid NOT NULL,
  client_id text NOT NULL REFERENCES manifest_clients(slug) ON UPDATE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, client_id)
);

CREATE TABLE IF NOT EXISTS manifest_client_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL REFERENCES manifest_clients(slug) ON UPDATE CASCADE,
  brand_name text NOT NULL,
  tier text,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS manifest_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  category text NOT NULL,
  product_name text NOT NULL,
  spec text,
  reference_photo_url text,
  exclusive_to_client_id text REFERENCES manifest_clients(slug) ON UPDATE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS manifest_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL REFERENCES manifest_clients(slug) ON UPDATE CASCADE,
  catalog_id uuid NOT NULL REFERENCES manifest_catalog(id) ON DELETE CASCADE,
  price numeric NOT NULL,
  in_stock boolean DEFAULT true,
  tag text CHECK (tag IN ('hot_deal', 'display_floor', 'arcade', 'live_sheet', null)),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS manifest_brand_exclusions (
  client_id text NOT NULL REFERENCES manifest_clients(slug) ON UPDATE CASCADE,
  brand_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (client_id, brand_name)
);

CREATE TABLE IF NOT EXISTS manifest_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL REFERENCES manifest_clients(slug) ON UPDATE CASCADE,
  photo_url text NOT NULL,
  thumbnail_url text NOT NULL,
  caption text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS manifest_complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL REFERENCES manifest_clients(slug) ON UPDATE CASCADE,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  product_name text NOT NULL,
  purchase_date date NOT NULL,
  issue_description text NOT NULL,
  requested_resolution text CHECK (requested_resolution IN ('repair', 'exchange', 'refund')),
  status text DEFAULT 'received' CHECK (status IN ('received', 'in_review', 'awaiting_customer', 'resolved')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS manifest_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL REFERENCES manifest_clients(slug) ON UPDATE CASCADE,
  doc_type text CHECK (doc_type IN ('invoice', 'receipt')),
  invoice_number text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  items jsonb NOT NULL,
  total numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Authentication PIN tables
CREATE TABLE IF NOT EXISTS manifest_tier_pins (
  client_id text NOT NULL REFERENCES manifest_clients(slug) ON UPDATE CASCADE,
  tier text NOT NULL CHECK (tier = 'manager'),
  pin_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (client_id, tier)
);

CREATE TABLE IF NOT EXISTS manifest_individual_staff_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL REFERENCES manifest_clients(slug) ON UPDATE CASCADE,
  staff_name text NOT NULL,
  pin_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (client_id, staff_name)
);

-- Note: In a real environment, you'd use pgcrypto extension for exact bcrypt hashes.
-- For this setup, we'll create stub RPC functions for testing if they don't exist.

CREATE OR REPLACE FUNCTION verify_tier_pin(p_client_id text, p_tier text, p_pin_attempt text)
RETURNS boolean AS $$
DECLARE
  v_hash text;
BEGIN
  SELECT pin_hash INTO v_hash FROM manifest_tier_pins WHERE client_id = p_client_id AND tier = p_tier;
  IF v_hash IS NULL THEN RETURN false; END IF;
  -- In real implementation: RETURN v_hash = crypt(p_pin_attempt, v_hash);
  -- For plain text check (not recommended, but if that's what's currently used)
  RETURN v_hash = p_pin_attempt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION verify_individual_staff_pin(p_client_id text, p_name text, p_pin_attempt text)
RETURNS boolean AS $$
DECLARE
  v_hash text;
BEGIN
  SELECT pin_hash INTO v_hash FROM manifest_individual_staff_pins WHERE client_id = p_client_id AND staff_name = p_name;
  IF v_hash IS NULL THEN RETURN false; END IF;
  RETURN v_hash = p_pin_attempt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION list_staff_names(p_client_id text)
RETURNS TABLE (staff_name text) AS $$
BEGIN
  RETURN QUERY SELECT staff_name FROM manifest_individual_staff_pins WHERE client_id = p_client_id ORDER BY staff_name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add Daikin globally if not excluded
-- Note: 'Daikin' should be handled as a universal brand in frontend logic as specified.
