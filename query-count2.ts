import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function check() {
  const { count } = await supabase.from('manifest_inventory').select('*', { count: 'exact', head: true }).eq('client_id', 'o-frank');
  console.log('o-frank items:', count);
}
check();
