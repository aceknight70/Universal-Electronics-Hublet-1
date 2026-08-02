import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { error } = await supabase.rpc('execute_sql', { sql: 'ALTER TABLE manifest_inventory DROP CONSTRAINT IF EXISTS manifest_inventory_client_id_catalog_id_key;' });
  console.log('Drop constraint:', error);
}
check();
