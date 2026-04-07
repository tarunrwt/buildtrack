-- ============================================================================
-- PURE TESTING DATA — DO NOT RUN IN A REAL PRODUCTION DATABASE
-- This will insert realistic dummy projects, materials, and issues.
-- It assigns all data to the very first user found in auth.users.
-- ============================================================================

DO $$
DECLARE
  _user_id UUID;
  _proj_alpha_id UUID := gen_random_uuid();
  _proj_beta_id UUID := gen_random_uuid();
  _proj_gamma_id UUID := gen_random_uuid();
  _mat_steel_id UUID := gen_random_uuid();
  _mat_cement_id UUID := gen_random_uuid();
  _mat_sand_id UUID := gen_random_uuid();
BEGIN
  -- Grab the first registered user to own this test data
  SELECT id INTO _user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'No user found in auth.users! Please sign up a user in the app first.';
  END IF;

  -- 1. Insert Projects
  INSERT INTO projects (id, name, start_date, target_end_date, total_cost, area_of_site, latitude, longitude, status, user_id)
  VALUES 
    (_proj_alpha_id, 'Alpha Tech Park', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '180 days', 50000000, 12000, 12.9716, 77.5946, 'active', _user_id),
    (_proj_beta_id, 'Skyline Residence Phase 2', CURRENT_DATE - INTERVAL '120 days', CURRENT_DATE + INTERVAL '60 days', 25000000, 8000, 12.9900, 77.5800, 'delayed', _user_id),
    (_proj_gamma_id, 'Metro Station Renovation', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '90 days', 18000000, 4500, 12.9600, 77.6000, 'on_hold', _user_id);

  -- 2. Insert Materials (Global Inventory)
  INSERT INTO materials (id, name, category, unit, cost_per_unit, current_stock, min_stock_level, supplier_name, user_id)
  VALUES
    (_mat_steel_id, 'TMT Rebar 12mm', 'Steel', 'ton', 62000, 15, 20, 'Tata Steel Corp', _user_id),
    (_mat_cement_id, 'Portland Cement 53 Grade', 'Cement & Concrete', 'bag', 380, 500, 200, 'UltraTech', _user_id),
    (_mat_sand_id, 'River Sand (M-Sand)', 'Aggregates', 'cft', 65, 8000, 2000, 'Rao Sands Pvt Ltd', _user_id);

  -- 3. Insert Material Usage Log
  INSERT INTO material_usage (material_id, project_id, user_id, quantity_used, usage_date, notes)
  VALUES
    (_mat_cement_id, _proj_alpha_id, _user_id, 150, CURRENT_DATE - INTERVAL '2 days', 'Foundation pouring block A'),
    (_mat_steel_id, _proj_alpha_id, _user_id, 5, CURRENT_DATE - INTERVAL '2 days', 'Pillars 1-12'),
    (_mat_cement_id, _proj_beta_id, _user_id, 100, CURRENT_DATE - INTERVAL '1 days', 'Roof slab casting');

  -- 4. Insert Material Purchases Log
  INSERT INTO material_purchases (material_id, user_id, quantity_purchased, cost_per_unit, purchase_date, supplier_name, invoice_number)
  VALUES
    (_mat_cement_id, _user_id, 400, 375, CURRENT_DATE - INTERVAL '10 days', 'UltraTech', 'INV-2026-901'),
    (_mat_steel_id, _user_id, 10, 61000, CURRENT_DATE - INTERVAL '15 days', 'Tata Steel Corp', 'INV-2026-887');

  -- 5. Insert Site Issues (AI Classification Demo Data)
  INSERT INTO site_issues (project_id, user_id, reported_date, description, ai_category, priority, status)
  VALUES
    (_proj_alpha_id, _user_id, CURRENT_DATE - INTERVAL '1 days', 'Excavator engine seized up, causing a complete halt on sector B.', 'equipment_failure', 'critical', 'in_progress'),
    (_proj_beta_id, _user_id, CURRENT_DATE - INTERVAL '3 days', 'Heavy continuous rain flooded the basement levels.', 'weather_disruption', 'high', 'open'),
    (_proj_gamma_id, _user_id, CURRENT_DATE - INTERVAL '4 days', 'Waiting on final NOC from fire department before we can run the electrical mains.', 'approval_pending', 'medium', 'open'),
    (_proj_alpha_id, _user_id, CURRENT_DATE - INTERVAL '10 days', 'Cement delivery truck got stuck in traffic, delayed mix by 4 hours.', 'material_delay', 'low', 'resolved');

END $$;
