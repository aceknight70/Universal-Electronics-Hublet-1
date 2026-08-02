import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: cat } = await supabase.from('manifest_catalog').select('product_name, brand, product_code');
  console.log('Total catalog items:', cat?.length);
  if (cat) {
    const names = new Set(cat.map(c => c.product_name));
    console.log('Unique names:', names.size);
  }
}
check();
