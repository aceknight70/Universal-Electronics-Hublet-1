import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('manifest_clients').select('*');
  console.log("Clients count:", data?.length);
  console.log("Error:", error);
}
test();
