import React, { useEffect, useState } from 'react';
import { useClient } from '../contexts/ClientContext';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';

export function Brands() {
  const { activeBusiness } = useClient();
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBrands() {
      if (!activeBusiness) return;
      setLoading(true);

      // We fetch manifest_client_brands for display_order
      const { data: clientBrands } = await supabase
        .from('manifest_client_brands')
        .select('*')
        .eq('client_id', activeBusiness.slug)
        .order('display_order', { ascending: true });

      // We also fetch exclusions
      const { data: exclusions } = await supabase
        .from('manifest_brand_exclusions')
        .select('brand_name')
        .eq('client_id', activeBusiness.slug);
      
      const excludedNames = new Set(exclusions?.map(e => e.brand_name) || []);

      // And we fetch global catalog to find "universal" brands that have products
      // In a real app we'd do a complex join, but here we can just list unique brands
      const { data: catalog } = await supabase
        .from('manifest_catalog')
        .select('brand, exclusive_to_client_id');
        
      // Filter catalog for this client
      const availableCatalog = (catalog || []).filter(item => 
         (!item.exclusive_to_client_id || item.exclusive_to_client_id === activeBusiness.slug) &&
         !excludedNames.has(item.brand)
      );

      const uniqueBrandsFromCatalog = new Set(availableCatalog.map(i => i.brand));
      
      // Combine explicitly defined client_brands with universally available ones
      // keeping the display_order of client_brands if they exist.
      
      let finalBrands: any[] = [];
      const handled = new Set();
      
      if (clientBrands) {
        for (const cb of clientBrands) {
          if (!excludedNames.has(cb.brand_name)) {
            finalBrands.push({ name: cb.brand_name, order: cb.display_order });
            handled.add(cb.brand_name);
          }
        }
      }
      
      for (const ub of uniqueBrandsFromCatalog) {
         if (!handled.has(ub)) {
            // Also Daikin is universally injected by the SQL if available
            finalBrands.push({ name: ub, order: 999 }); // Default low priority order
            handled.add(ub);
         }
      }
      
      // Add Daikin universally if not excluded, as per requirement:
      if (!handled.has('Daikin') && !excludedNames.has('Daikin')) {
         finalBrands.push({ name: 'Daikin', order: 999 });
      }

      finalBrands.sort((a, b) => a.order - b.order);
      setBrands(finalBrands);
      setLoading(false);
    }
    
    fetchBrands();
  }, [activeBusiness]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            🏷️ Brands
            <span className="text-sm font-normal text-[#8892a8] ml-2">Browse by manufacturer</span>
          </h1>
        </div>

        {loading ? (
          <div className="text-[#8892a8] animate-pulse">Loading brands...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
            {brands.map((brand, i) => (
              <button key={i} className="bg-[#111a24] border border-[#1e2a36] rounded-2xl p-6 hover:border-[#7db8df] hover:bg-[#152332] transition-colors shadow-[0_8px_24px_rgba(0,0,0,0.4)] text-left group flex flex-col justify-between aspect-[4/3]">
                <div className="w-12 h-12 rounded-full bg-[#0e1520] flex items-center justify-center text-[#5a6a7a] mb-4 border border-[#1a2634] group-hover:border-[#7db8df] group-hover:text-[#7db8df] transition-colors">
                  <span className="text-xl">🏢</span>
                </div>
                <h3 className="text-lg font-bold text-[#e6edf5] group-hover:text-white transition-colors">{brand.name}</h3>
                <span className="text-xs text-[#5a6a7a] uppercase tracking-wider group-hover:text-[#7db8df] transition-colors">View Products</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
