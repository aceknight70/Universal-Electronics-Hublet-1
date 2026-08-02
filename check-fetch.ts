import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
      .from('manifest_inventory')
      .select(`
        id,
        client_id,
        catalog_id,
        price,
        tag,
        in_stock,
        custom_photos,
        manifest_catalog (
          id,
          product_name,
          brand,
          category,
          exclusive_to_client_id,
          product_code,
          spec
        )
      `)
      .eq('client_id', 'ofrank');
  console.log('Fetched ofrank:', data?.length);
}
check();
