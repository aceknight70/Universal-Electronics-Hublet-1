import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { count } = await supabase.from('manifest_inventory').select('*', { count: 'exact', head: true }).eq('client_id', 'ofrank');
  console.log('Total inventory count for ofrank:', count);
}
check();
