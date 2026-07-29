import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useClient } from '../contexts/ClientContext';
import { Play, Pause, CheckSquare, Square, RefreshCw } from 'lucide-react';
import { ProductModal } from '../components/showroom/ProductModal';
import { getCatalogProducts, JoinedProduct } from '../lib/catalog';

const ROOMS = [
  { id: 'showroom', label: 'Showroom', path: '/', isFilter: true },
  { id: 'arcade', label: 'Arcade', path: '/arcade', isFilter: true },
  { id: 'displayfloor', label: 'Display Floor', path: '/display-floor', isFilter: true },
  { id: 'hotdeals', label: 'Hot Deals', path: '/hot-deals', isFilter: true },
  { id: 'pricelist', label: 'Price List', path: '/price-list', isFilter: true },
  { id: 'workbook', label: 'Workbook', path: '/workbook' },
  { id: 'gallery', label: 'Gallery', path: '/gallery' },
  { id: 'videos', label: 'Videos', path: '/videos' },
  { id: 'channels', label: 'Channels', path: '/channels' },
  { id: 'pickup', label: 'Pickup & Dispatch', path: '/pickup' },
  { id: 'warranty', label: 'Warranty', path: '/warranty' },
  { id: 'contact', label: 'Contact', path: '/contact' },
  { id: 'feedback', label: 'Feedback', path: '/feedback' },
  { id: 'education', label: 'Education', path: '/education' },
  { id: 'comparison', label: 'Comparison Tool', path: '/comparison' },
  { id: 'invoice', label: 'Invoice', path: '/invoice' },
  { id: 'complaints', label: 'Complaints', path: '/complaints' },
  { id: 'master', label: 'Master Room', path: '/master' }
];

const DEFAULT_BRANDS = ['Samsung', 'Bruhm', 'Daikin', 'Polystar', 'LG', 'Sony', 'Whirlpool', 'Panasonic', 'TeleprompterCo', 'Hisense', 'TCL', 'Midea', 'Gree'];
const DEFAULT_CATEGORIES = ['LED TV', 'Washing Machine', 'Air Conditioner', 'Refrigerator', 'Microwave', 'Soundbar', 'Teleprompter'];

// Default Mock Products
const mockProducts: JoinedProduct[] = [
  { product_name: 'Samsung 65" QLED 4K Smart TV', brand: 'Samsung', price: '$1,299', category: 'LED TV', tag: 'hot_deal', client_id: 'ofrank', catalog_id: '', in_stock: true },
  { product_name: 'LG 55" OLED C2 Series', brand: 'LG', price: '$1,499', category: 'LED TV', tag: 'display_floor', client_id: 'ofrank', catalog_id: '', in_stock: true },
  { product_name: 'Sony Bravia XR 65"', brand: 'Sony', price: '$1,399', category: 'LED TV', tag: 'arcade', client_id: 'ofrank', catalog_id: '', in_stock: true },
  { product_name: 'Hisense 50" ULED 4K', brand: 'Hisense', price: '$499', category: 'LED TV', tag: 'live_sheet', client_id: 'ofrank', catalog_id: '', in_stock: true },
  { product_name: 'TCL 65" 6-Series 4K Roku TV', brand: 'TCL', price: '$699', category: 'LED TV', tag: null, client_id: 'ofrank', catalog_id: '', in_stock: true },
  { product_name: 'LG 9.0kg Front Load Washer', brand: 'LG', price: '$799', category: 'Washing Machine', tag: 'hot_deal', client_id: 'ofrank', catalog_id: '', in_stock: true },
  { product_name: 'Samsung 8.5kg Top Load', brand: 'Samsung', price: '$649', category: 'Washing Machine', tag: 'display_floor', client_id: 'ofrank', catalog_id: '', in_stock: true },
  { product_name: 'Whirlpool 7kg Front Load', brand: 'Whirlpool', price: '$549', category: 'Washing Machine', tag: null, client_id: 'ofrank', catalog_id: '', in_stock: true },
  { product_name: 'Bruhm 6kg Twin Tub', brand: 'Bruhm', price: '$199', category: 'Washing Machine', tag: 'live_sheet', client_id: 'ofrank', catalog_id: '', in_stock: true },
  { product_name: 'Daikin 1.5HP Split AC', brand: 'Daikin', price: '$450', category: 'Air Conditioner', tag: 'arcade', client_id: 'ofrank', catalog_id: '', in_stock: true },
  { product_name: 'Panasonic 2.0HP Inverter AC', brand: 'Panasonic', price: '$650', category: 'Air Conditioner', tag: 'display_floor', client_id: 'ofrank', catalog_id: '', in_stock: true },
  { product_name: 'Gree 1.0HP Window AC', brand: 'Gree', price: '$320', category: 'Air Conditioner', tag: 'hot_deal', client_id: 'ofrank', catalog_id: '', in_stock: true },
  { product_name: 'Midea 1.5HP Portable AC', brand: 'Midea', price: '$399', category: 'Air Conditioner', tag: null, client_id: 'ofrank', catalog_id: '', in_stock: true },
  { product_name: 'Samsung 400L Double Door Refrigerator', brand: 'Samsung', price: '$899', category: 'Refrigerator', tag: 'display_floor', client_id: 'ofrank', catalog_id: '', in_stock: true },
  { product_name: 'LG 600L Side-by-Side Fridge', brand: 'LG', price: '$1,599', category: 'Refrigerator', tag: 'hot_deal', client_id: 'ofrank', catalog_id: '', in_stock: true },
  { product_name: 'Polystar 200L Chest Freezer', brand: 'Polystar', price: '$299', category: 'Refrigerator', tag: 'arcade', client_id: 'ofrank', catalog_id: '', in_stock: true },
  { product_name: 'Samsung 32L Solo Microwave', brand: 'Samsung', price: '$120', category: 'Microwave', tag: null, client_id: 'ofrank', catalog_id: '', in_stock: true },
  { product_name: 'LG 42L NeoChef Microwave', brand: 'LG', price: '$180', category: 'Microwave', tag: 'hot_deal', client_id: 'ofrank', catalog_id: '', in_stock: true },
  { product_name: 'Sony HT-S400 Soundbar', brand: 'Sony', price: '$250', category: 'Soundbar', tag: 'display_floor', client_id: 'ofrank', catalog_id: '', in_stock: true },
  { product_name: 'Samsung HW-Q600A Soundbar', brand: 'Samsung', price: '$350', category: 'Soundbar', tag: 'arcade', client_id: 'ofrank', catalog_id: '', in_stock: true },
  { product_name: 'TeleprompterCo Pro 15"', brand: 'TeleprompterCo', price: '$899', category: 'Teleprompter', tag: 'display_floor', client_id: 'ofrank', catalog_id: '', in_stock: true },
  { product_name: 'TeleprompterCo Studio 19"', brand: 'TeleprompterCo', price: '$1,299', category: 'Teleprompter', tag: 'hot_deal', client_id: 'ofrank', catalog_id: '', in_stock: true },
];

function CategoryRow({ category, products, autoScroll, onProductClick }: { key?: string, category: string, products: JoinedProduct[], autoScroll: boolean, onProductClick: (product: any) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!autoScroll || isPaused || !scrollRef.current) return;
    
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        const maxScroll = scrollWidth - clientWidth;
        const cardWidth = 320; 
        
        let nextScroll = scrollLeft + cardWidth;
        if (nextScroll >= maxScroll) {
          nextScroll = 0;
        }
        scrollRef.current.scrollTo({ left: nextScroll, behavior: 'smooth' });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [autoScroll, isPaused]);

  const handleInteraction = () => {
    setIsPaused(true);
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 5000);
  };

  return (
    <div className="flex flex-col mb-10">
      <div className="flex justify-between items-center mb-4 px-4 sm:px-0">
        <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>▼</span> {category}
          <span className="text-xs font-normal text-[#888] bg-[#1a1a1a] px-2 py-0.5 rounded-full border border-[#222]">
            {products.length} {products.length === 1 ? 'item' : 'items'}
          </span>
        </h3>
        <button className="text-[0.65rem] sm:text-xs font-semibold text-[#888] flex items-center gap-1.5 bg-[#1a1a1a] px-2 sm:px-3 py-1 sm:py-1.5 rounded border border-[#333]">
          {autoScroll && !isPaused ? <Play className="w-3 h-3 fill-current"/> : <Pause className="w-3 h-3 fill-current"/>}
          Auto-Scroll: {autoScroll && !isPaused ? 'ON' : 'PAUSED'}
        </button>
      </div>
      <div 
        ref={scrollRef}
        onTouchStart={handleInteraction}
        onMouseDown={handleInteraction} onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}
        className="flex overflow-x-auto gap-4 pb-4 px-4 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory"
      >
        {products.map((p, idx) => {
          const cp = (p as any).custom_photos || {};
          const displayImg = cp.front || cp.manual_view || cp.left_side || cp.right_side || cp.back;
          return (
          <div key={idx} onClick={() => onProductClick(p)} className="shrink-0 snap-start bg-[#111] border border-[#222] rounded-2xl p-4 flex flex-col transition-all hover:bg-[#151515] hover:border-[#333] cursor-pointer w-[85%] max-w-[360px] sm:max-w-[400px]">
            <div className="w-full aspect-[4/3] bg-white rounded-xl flex flex-col items-center justify-center text-[#555] mb-4 relative overflow-hidden border border-[#e5e7eb]">
              {displayImg ? (
                 <img src={displayImg} alt={p.product_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl mb-2 drop-shadow-sm">
                  {(p.category || '').includes('TV') || (p.category || '').includes('Television') ? '📺' : (p.category || '').includes('Conditioner') || (p.category || '').includes('AC') ? '❄️' : (p.category || '').includes('Refrigerator') || (p.category || '').includes('Fridge') ? '🧊' : (p.category || '').includes('Washing') ? '🧺' : (p.category || '').includes('Microwave') ? '♨️' : (p.category || '').includes('Soundbar') ? '🔊' : '📦'}
                </span>
              )}
            </div>
            <div className="font-semibold text-[0.95rem] text-white leading-tight mb-1">{p.product_name}</div>
            <div className="text-[0.75rem] text-[#888] flex items-center justify-between">
              <span>{p.brand}</span>
              {p.in_stock ? <span className="text-[0.65rem] text-[#7db8df]">In Stock</span> : <span className="text-[0.65rem] text-[#ef4444]">Out of Stock</span>}
            </div>
            {p.tag && (
              <span className="inline-block text-[0.6rem] font-bold uppercase tracking-[0.05em] bg-[#222] text-[#ccc] px-2 py-0.5 rounded-sm mt-2 self-start border border-[#333]">
                {p.tag.replace('_', ' ')}
              </span>
            )}
            <div className="font-bold text-[1.1rem] text-white mt-auto pt-4">
              {p.price}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

export function Showroom() {
  const { role } = useAuth();
  const { activeBusiness } = useClient();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState<JoinedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRooms, setSelectedRooms] = useState<string[]>(['showroom']);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [globalAutoScroll, setGlobalAutoScroll] = useState(true);

  const clientId = activeBusiness?.slug || 'ofrank';

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const fetched = await getCatalogProducts(clientId);
      if (fetched && fetched.length > 0) {
        setProducts(fetched);
      } else {
        setProducts(mockProducts);
      }
    } catch (err) {
      console.error('Error loading products for Showroom:', err);
      setProducts(mockProducts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    const handleCatalogUpdate = () => {
      fetchProducts();
    };

    window.addEventListener('catalog_updated', handleCatalogUpdate);
    return () => {
      window.removeEventListener('catalog_updated', handleCatalogUpdate);
    };
  }, [clientId]);

  // Dynamically extract brands and categories from live products
  const availableBrands = useMemo(() => {
    const brandSet = new Set<string>(DEFAULT_BRANDS);
    products.forEach(p => {
      if (p.brand) brandSet.add(p.brand);
    });
    return Array.from(brandSet);
  }, [products]);

  const availableCategories = useMemo(() => {
    const catSet = new Set<string>(DEFAULT_CATEGORIES);
    products.forEach(p => {
      if (p.category) catSet.add(p.category);
    });
    return Array.from(catSet);
  }, [products]);

  const toggleRoom = (roomId: string) => {
    setSelectedRooms(prev => {
      if (prev.includes(roomId)) {
        return prev.filter(id => id !== roomId);
      } else {
        return [...prev, roomId];
      }
    });
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => {
      if (prev.includes(brand)) {
        return prev.filter(b => b !== brand);
      } else {
        return [...prev, brand];
      }
    });
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const filteredProducts = useMemo(() => {
    const activeTags: string[] = [];

    const hasFilterSelected = selectedRooms.length > 0;

    if (hasFilterSelected) {
      if (selectedRooms.includes('arcade') || selectedRooms.includes('showroom')) activeTags.push('arcade');
      if (selectedRooms.includes('displayfloor')) activeTags.push('display_floor');
      if (selectedRooms.includes('hotdeals')) activeTags.push('hot_deal');
      if (selectedRooms.includes('pricelist')) activeTags.push('live_sheet');
    }

    return products.filter(p => {
      let roomMatch = !hasFilterSelected;
      if (!roomMatch) {
        if (p.tag && activeTags.includes(p.tag)) roomMatch = true;
        if (!p.tag && (selectedRooms.includes('showroom') || selectedRooms.includes('arcade'))) roomMatch = true;
      }
      
      const brandMatch = selectedBrands.length === 0 || selectedBrands.includes(p.brand);
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(p.category);
      
      return roomMatch && brandMatch && categoryMatch;
    });
  }, [products, selectedRooms, selectedBrands, selectedCategories]);

  const productsByCategory = useMemo(() => {
    const grouped = {} as Record<string, JoinedProduct[]>;
    
    // Group all filtered products by their category name
    filteredProducts.forEach(p => {
      const cat = p.category || 'General';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(p);
    });
    
    return grouped;
  }, [filteredProducts]);

  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.3 }}
      className="bg-[#0a0a0a] min-h-screen text-white pb-20"
    >
      {/* Room Tabs */}
      <div className="border-b border-[#222]">
        <div className="flex gap-2 overflow-x-auto px-4 sm:px-0 py-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {ROOMS.map(room => {
            if (room.isFilter) {
              const isChecked = selectedRooms.includes(room.id);
              return (
                <button
                  key={room.id}
                  onClick={() => toggleRoom(room.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-[0.8rem] font-medium whitespace-nowrap shrink-0 transition-colors border ${
                    isChecked 
                      ? 'bg-[#1a1a1a] border-[#444] text-white' 
                      : 'bg-transparent border-[#222] text-[#888] hover:bg-[#111] hover:text-white'
                  }`}
                >
                  {isChecked ? <CheckSquare className="w-4 h-4 text-[#7db8df]" /> : <Square className="w-4 h-4 text-[#555]" />}
                  {room.label} 
                </button>
              );
            } else {
              return (
                <Link
                  key={room.id}
                  to={room.path}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded text-[0.8rem] font-medium whitespace-nowrap shrink-0 transition-colors border bg-transparent border-[#222] text-[#888] hover:bg-[#111] hover:text-white"
                >
                  {room.label} 
                </Link>
              );
            }
          })}
        </div>
      </div>

      {/* Brand Strip */}
      <div className="border-b border-[#222]">
        <div className="flex gap-2 overflow-x-auto px-4 sm:px-0 py-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button
            onClick={() => setSelectedBrands([])}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-[0.8rem] font-medium whitespace-nowrap shrink-0 transition-colors border ${
              selectedBrands.length === 0 
                ? 'bg-[#1a1a1a] border-[#444] text-white' 
                : 'bg-transparent border-[#222] text-[#888] hover:bg-[#111] hover:text-white'
            }`}
          >
            {selectedBrands.length === 0 ? <CheckSquare className="w-4 h-4 text-[#7db8df]" /> : <Square className="w-4 h-4 text-[#555]" />}
            All Brands ({availableBrands.length})
          </button>
          {availableBrands.map(brand => {
            const isChecked = selectedBrands.includes(brand);
            return (
              <button
                key={brand}
                onClick={() => toggleBrand(brand)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-[0.8rem] font-medium whitespace-nowrap shrink-0 transition-colors border ${
                  isChecked 
                    ? 'bg-[#1a1a1a] border-[#444] text-white' 
                    : 'bg-transparent border-[#222] text-[#888] hover:bg-[#111] hover:text-white'
                }`}
              >
                {isChecked ? <CheckSquare className="w-4 h-4 text-[#7db8df]" /> : <Square className="w-4 h-4 text-[#555]" />}
                {brand} 
              </button>
            );
          })}
        </div>
      </div>

      {/* Categories Strip */}
      <div className="border-b border-[#222] mb-3">
        <div className="flex gap-2 overflow-x-auto px-4 sm:px-0 py-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button
            onClick={() => setSelectedCategories([])}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-[0.8rem] font-medium whitespace-nowrap shrink-0 transition-colors border ${
              selectedCategories.length === 0 
                ? 'bg-[#1a1a1a] border-[#444] text-white' 
                : 'bg-transparent border-[#222] text-[#888] hover:bg-[#111] hover:text-white'
            }`}
          >
            {selectedCategories.length === 0 ? <CheckSquare className="w-4 h-4 text-[#7db8df]" /> : <Square className="w-4 h-4 text-[#555]" />}
            All Categories ({availableCategories.length})
          </button>
          {availableCategories.map(category => {
            const isChecked = selectedCategories.includes(category);
            return (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-[0.8rem] font-medium whitespace-nowrap shrink-0 transition-colors border ${
                  isChecked 
                    ? 'bg-[#1a1a1a] border-[#444] text-white' 
                    : 'bg-transparent border-[#222] text-[#888] hover:bg-[#111] hover:text-white'
                }`}
              >
                {isChecked ? <CheckSquare className="w-4 h-4 text-[#7db8df]" /> : <Square className="w-4 h-4 text-[#555]" />}
                {category} 
              </button>
            );
          })}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 sm:px-0 py-1 mb-4 text-xs text-[#888]">
        <div>
          Showing <span className="text-white font-semibold">{filteredProducts.length}</span> of <span className="text-white font-semibold">{products.length}</span> catalog items for client <span className="text-[#7db8df] font-mono">{clientId}</span>
        </div>
        <button 
          onClick={fetchProducts} 
          className="flex items-center gap-1 hover:text-white transition-colors"
          title="Refresh live catalog data"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Sync Catalog
        </button>
      </div>

      {/* Category Rows */}
      <div className="flex flex-col gap-2">
        {loading ? (
          <div className="text-center py-20 text-[#666] text-sm animate-pulse flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#7db8df]" /> Syncing product catalog...
          </div>
        ) : Object.keys(productsByCategory).length === 0 ? (
          <div className="text-center py-20 text-[#666] text-sm">
            No products match the selected filters.
          </div>
        ) : (
          (Object.entries(productsByCategory) as [string, JoinedProduct[]][]).map(([category, catProducts]) => (
            <CategoryRow 
              key={category}
              category={category}
              products={catProducts}
              autoScroll={globalAutoScroll}
              onProductClick={setSelectedProduct}
            />
          ))
        )}
      </div>

      <ProductModal product={selectedProduct} isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} />
    </motion.div>
  );
}
