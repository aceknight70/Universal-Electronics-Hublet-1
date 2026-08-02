import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: inv } = await supabase.from('manifest_inventory').select('*').limit(1);
  if (inv && inv.length > 0) {
    const item = inv[0];
    const { error } = await supabase.from('manifest_inventory').insert({
      client_id: item.client_id,
      catalog_id: item.catalog_id,
      price: '123'
    });
    console.log(error);
  }
}
check();
