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

  let dbInsertedCount = 0;

  for (const item of normalized) {
    // 1. Find or create the catalog row
    let catalogId = '';
    
    const { data: existingCatalog, error: searchError } = await supabase
      .from('manifest_catalog')
      .select('id')
      .eq('product_name', item.product_name)
      .eq('brand', item.brand)
      .limit(1)
      .maybeSingle();

    if (searchError) {
      throw new Error(`Error searching catalog for ${item.product_name}: ${searchError.message}`);
    }

    if (existingCatalog) {
      catalogId = existingCatalog.id;
    } else {
      // Insert new catalog item
      const { data: newCatalog, error: insertCatError } = await supabase
        .from('manifest_catalog')
        .insert({
          product_name: item.product_name,
          brand: item.brand,
          category: item.category,
          exclusive_to_client_id: item.exclusive_to_client_id // usually null unless explicitly private
        })
        .select('id')
        .single();
        
      if (insertCatError || !newCatalog) {
        throw new Error(`Error inserting catalog item ${item.product_name}: ${insertCatError?.message || 'Unknown error'}`);
      }
      catalogId = newCatalog.id;
    }

    // 2. Upsert the inventory row linking this client to the catalog item
    const { error: invError } = await supabase
      .from('manifest_inventory')
      .upsert({
        client_id: clientId,
        catalog_id: catalogId,
        price: item.price,
        tag: item.tag,
        in_stock: item.in_stock
      }, { onConflict: 'client_id,catalog_id' });
      
    if (invError) {
      // Fallback for tables without unique constraint on client_id + catalog_id
      const { error: invInsertError } = await supabase.from('manifest_inventory').insert({
        client_id: clientId,
        catalog_id: catalogId,
        price: item.price,
        tag: item.tag,
        in_stock: item.in_stock
      });
      
      if (invInsertError) {
        throw new Error(`Error inserting inventory for ${item.product_name}: ${invInsertError.message}`);
      } else {
        dbInsertedCount++;
      }
    } else {
      dbInsertedCount++;
    }
  }

  window.dispatchEvent(new CustomEvent('catalog_updated', { detail: { clientId } }));

  return {
    success: true,
    count: normalized.length,
    dbInsertedCount,
    dbError: null,
    timestamp,
    normalized
  };
}

/**
 * Fetches products for the active business by joining manifest_inventory with manifest_catalog.
 */
export async function getCatalogProducts(clientId: string): Promise<JoinedProduct[]> {
  let dbProducts: JoinedProduct[] = [];

  // Perform joined query
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

  if (error) {
    throw new Error(`Error querying manifest_inventory: ${error.message}`);
  }

  if (data && data.length > 0) {
    dbProducts = data
      .filter(item => item.manifest_catalog) // ensure catalog item exists
      .map(item => {
        const cat = Array.isArray(item.manifest_catalog) ? item.manifest_catalog[0] : item.manifest_catalog;
        return {
          id: item.id,
          client_id: item.client_id,
          catalog_id: item.catalog_id,
          price: `₦${Number(item.price || 0).toLocaleString()}`,
          tag: item.tag,
          in_stock: Boolean(item.in_stock),
          custom_photos: item.custom_photos || {},
          product_name: cat.product_name,
          brand: cat.brand,
          category: cat.category,
          exclusive_to_client_id: cat.exclusive_to_client_id,
          name: cat.product_name // alias for legacy components
        } as any;
      });
  }

  return dbProducts;
}
