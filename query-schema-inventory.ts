import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data } = await supabase.from('manifest_inventory').select('*').limit(1);
  if (data) console.log('manifest_inventory:', Object.keys(data[0] || {}));
}
checkSchema();
