import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: cat } = await supabase.from('manifest_catalog').select('*').limit(1);
  if (cat && cat.length > 0) {
    const item = cat[0];
    const { error } = await supabase.from('manifest_catalog').insert({
      product_name: item.product_name,
      brand: item.brand,
      category: item.category
    });
    console.log('Catalog Insert Error:', error);
  }
}
check();
