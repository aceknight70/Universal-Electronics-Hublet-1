import { supabase } from './supabase';

export interface CatalogProduct {
  id?: string;
  product_name: string;
  brand: string;
  category: string;
  spec?: string;
  reference_photo_url?: string;
  exclusive_to_client_id?: string | null;
}

export interface InventoryItem {
  id?: string;
  client_id: string;
  catalog_id: string;
  price: string;
  tag: string | null;
  in_stock: boolean;
  custom_photos?: Record<string, string>;
  
  // Joined fields for UI convenience
  product_name?: string;
  brand?: string;
  category?: string;
}

export type JoinedProduct = CatalogProduct & InventoryItem;

/**
 * Normalizes an arbitrary CSV row into a standardized JoinedProduct object.
 */
export function normalizeProductRow(row: Record<string, any>, clientId: string): JoinedProduct {
  const getVal = (keys: string[]) => {
    for (const k of keys) {
      if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
        return String(row[k]).trim();
      }
    }
    const rowKeys = Object.keys(row);
    for (const k of keys) {
      const lowerK = k.toLowerCase();
      const match = rowKeys.find(rk => rk.toLowerCase() === lowerK);
      if (match && row[match] !== undefined && row[match] !== null && String(row[match]).trim() !== '') {
        return String(row[match]).trim();
      }
    }
    return '';
  };

  const name = getVal(['Product Name', 'product_name', 'Name', 'title', 'Item', 'Product']) || 'Unnamed Product';
  const brand = getVal(['Brand', 'brand', 'Manufacturer', 'Maker']) || 'Generic';
  const category = getVal(['Category', 'category', 'Type', 'Class']) || 'General';
  let rawPrice = getVal(['Price', 'price', 'Cost', 'Amount']) || '0';
  const numericPriceMatch = rawPrice.replace(/,/g, '').match(/[\d.]+/);
  const numericPrice = numericPriceMatch ? String(Number(numericPriceMatch[0])) : '0';

  let tagVal = getVal(['RoomTag', 'room_tag', 'Tag', 'tag', 'Room', 'room']) || 'arcade';
  const lowerTag = tagVal.toLowerCase().replace(/\s+/g, '_');
  let tag: string = 'arcade';
  if (lowerTag.includes('display') || lowerTag.includes('floor')) tag = 'display_floor';
  else if (lowerTag.includes('hot') || lowerTag.includes('deal')) tag = 'hot_deal';
  else if (lowerTag.includes('price') || lowerTag.includes('list') || lowerTag.includes('live')) tag = 'live_sheet';
  else if (lowerTag.includes('arcade')) tag = 'arcade';
  else tag = 'arcade';

  const stockRaw = getVal(['Stock', 'stock', 'Quantity', 'qty', 'in_stock']);
  const in_stock = stockRaw ? stockRaw.toLowerCase() !== '0' && stockRaw.toLowerCase() !== 'false' && stockRaw.toLowerCase() !== 'no' : true;

  return {
    product_name: name,
    brand,
    category,
    price: numericPrice,
    in_stock,

    tag,
    client_id: clientId,
    catalog_id: '',
    exclusive_to_client_id: null
  };
}

/**
 * Saves products using the proper two-table split (manifest_catalog & manifest_inventory).
 */
export async function saveCatalogProducts(rows: Record<string, any>[], clientId: string) {
  const normalized = rows.map(r => normalizeProductRow(r, clientId));
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // 1. Always save to local storage first so user changes persist immediately
  try {
    localStorage.setItem(`app_saved_csv_products_${clientId}`, JSON.stringify(normalized));
    localStorage.setItem('app_saved_csv_products', JSON.stringify(normalized));
    localStorage.setItem(`app_saved_csv_timestamp_${clientId}`, timestamp);
    localStorage.setItem('app_saved_csv_timestamp', timestamp);
  } catch (err) {
    console.warn('LocalStorage save warning:', err);
  }

  let dbInsertedCount = 0;
  let dbErrorCount = 0;

  // 2. Attempt to persist into Supabase DB
  for (const item of normalized) {
    try {
      let catalogId = '';
      const { data: existingCatalog, error: searchError } = await supabase
        .from('manifest_catalog')
        .select('id')
        .eq('product_name', item.product_name)
        .eq('brand', item.brand)
        .limit(1)
        .maybeSingle();

      if (!searchError && existingCatalog?.id) {
        catalogId = existingCatalog.id;
      } else {
        const { data: newCatalog, error: insertCatError } = await supabase
          .from('manifest_catalog')
          .insert({
            product_name: item.product_name,
            brand: item.brand,
            category: item.category,
            exclusive_to_client_id: item.exclusive_to_client_id
          })
          .select('id')
          .maybeSingle();

        if (!insertCatError && newCatalog?.id) {
          catalogId = newCatalog.id;
        }
      }

      if (catalogId) {
        const { data: existingInv, error: searchInvError } = await supabase
          .from('manifest_inventory')
          .select('id')
          .eq('client_id', clientId)
          .eq('catalog_id', catalogId)
          .maybeSingle();

        if (existingInv?.id) {
          const { error: invUpdateError } = await supabase
            .from('manifest_inventory')
            .update({
              price: item.price,
              tag: item.tag,
              in_stock: item.in_stock
            })
            .eq('id', existingInv.id);

          if (!invUpdateError) {
            dbInsertedCount++;
          } else {
            dbErrorCount++;
          }
        } else {
          const { error: invInsertError } = await supabase
            .from('manifest_inventory')
            .insert({
              client_id: clientId,
              catalog_id: catalogId,
              price: item.price,
              tag: item.tag,
              in_stock: item.in_stock
            });

          if (!invInsertError) {
            dbInsertedCount++;
          } else {
            dbErrorCount++;
          }
        }
      } else {
        dbErrorCount++;
      }
    } catch (e) {
      dbErrorCount++;
    }
  }

  // Always notify Showroom & rooms to refresh
  window.dispatchEvent(new CustomEvent('catalog_updated', { detail: { clientId } }));

  return {
    success: true,
    count: normalized.length,
    dbInsertedCount,
    dbErrorCount,
    timestamp,
    normalized
  };
}

/**
 * Fetches products for the active business by joining manifest_inventory with manifest_catalog.
 * Falls back seamlessly to LocalStorage if Supabase database query returns empty or throws.
 */
export async function getCatalogProducts(clientId: string): Promise<JoinedProduct[]> {
  let dbProducts: JoinedProduct[] = [];

  try {
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
          exclusive_to_client_id
        )
      `)
      .eq('client_id', clientId);

    if (!error && data && data.length > 0) {
      dbProducts = data
        .filter(item => item.manifest_catalog)
        .map(item => {
          const cat = Array.isArray(item.manifest_catalog) ? item.manifest_catalog[0] : item.manifest_catalog;
          const numPrice = Number(item.price || 0);
          const formattedPrice = isNaN(numPrice) || numPrice === 0 
            ? (item.price || '₦0') 
            : `₦${numPrice.toLocaleString()}`;

          return {
            id: item.id,
            client_id: item.client_id,
            catalog_id: item.catalog_id,
            price: formattedPrice,
            tag: item.tag,
            in_stock: Boolean(item.in_stock),
            custom_photos: item.custom_photos || {},
            product_name: cat.product_name,
            brand: cat.brand,
            category: cat.category,
            exclusive_to_client_id: cat.exclusive_to_client_id,
            name: cat.product_name
          } as any;
        });
    }
  } catch (err) {
    console.warn('Supabase catalog fetch error:', err);
  }

  if (dbProducts.length > 0) {
    return dbProducts;
  }

  // Fallback to LocalStorage saved products
  try {
    const localProdsJson = localStorage.getItem(`app_saved_csv_products_${clientId}`) || localStorage.getItem('app_saved_csv_products');
    if (localProdsJson) {
      const parsedLocal = JSON.parse(localProdsJson);
      if (Array.isArray(parsedLocal) && parsedLocal.length > 0) {
        return parsedLocal.map((p: any) => {
          const numPrice = Number(String(p.price || '').replace(/[^0-9.]/g, ''));
          const formattedPrice = isNaN(numPrice) || numPrice === 0 
            ? (p.price || '₦0') 
            : `₦${numPrice.toLocaleString()}`;
          return {
            ...p,
            price: formattedPrice,
            name: p.product_name
          };
        });
      }
    }

    const localText = localStorage.getItem(`app_saved_csv_text_${clientId}`) || localStorage.getItem('app_saved_csv_text');
    if (localText && localText.trim()) {
      const lines = localText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length > 1) {
        const delimiter = localText.includes('\t') ? '\t' : ',';
        const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
        const rows: Array<Record<string, string>> = [];
        lines.slice(1).forEach(line => {
          const values = line.split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ''));
          const rowObj: Record<string, string> = {};
          headers.forEach((h, idx) => {
            rowObj[h || `Column ${idx + 1}`] = values[idx] || '';
          });
          rows.push(rowObj);
        });

        const normalizedLocal = rows.map(r => normalizeProductRow(r, clientId));
        return normalizedLocal.map(p => {
          const numPrice = Number(p.price || 0);
          return {
            ...p,
            price: isNaN(numPrice) || numPrice === 0 ? '₦0' : `₦${numPrice.toLocaleString()}`,
            name: p.product_name
          };
        });
      }
    }
  } catch (e) {
    console.error('Error loading fallback products from localStorage:', e);
  }

  return [];
}
