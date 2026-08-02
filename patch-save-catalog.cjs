const fs = require('fs');
let code = fs.readFileSync('src/lib/catalog.ts', 'utf-8');

const search = `    // 1. Get all unique product names & brands from the CSV
    const uniqueProductNames = [...new Set(normalized.map(i => i.product_name))];
    
    // 2. Fetch existing catalog items to minimize inserts
    let existingCatalogItems: any[] = [];
    if (uniqueProductNames.length > 0) {
      // Chunk the select if there are too many unique names
      for (let i = 0; i < uniqueProductNames.length; i += 100) {
        const { data } = await supabase
          .from('manifest_catalog')
          .select('id, product_name, brand')
          .in('product_name', uniqueProductNames.slice(i, i + 100));
        if (data) existingCatalogItems.push(...data);
      }
    }

    const catalogMap = new Map();
    existingCatalogItems.forEach(cat => {
      catalogMap.set(\`\${cat.product_name}|\${cat.brand}\`, cat.id);
    });

    // 3. Insert missing catalog items in bulk
    const missingCatalogItems: any[] = [];
    const missingKeys = new Set();
    
    normalized.forEach(item => {
      const key = \`\${item.product_name}|\${item.brand}\`;
      if (!catalogMap.has(key) && !missingKeys.has(key)) {
        missingKeys.add(key);
        missingCatalogItems.push({
          product_name: item.product_name,
          brand: item.brand,
          category: item.category,
          exclusive_to_client_id: item.exclusive_to_client_id,
          product_code: item.product_code,
          spec: item.spec
        });
      }
    });

    if (missingCatalogItems.length > 0) {
      for (let i = 0; i < missingCatalogItems.length; i += 100) {
        const { data: newlyInserted } = await supabase
          .from('manifest_catalog')
          .insert(missingCatalogItems.slice(i, i + 100))
          .select('id, product_name, brand');
          
        if (newlyInserted) {
          newlyInserted.forEach(cat => {
            catalogMap.set(\`\${cat.product_name}|\${cat.brand}\`, cat.id);
          });
        }
      }
    }

    // 4. Fetch all existing inventory for this client to determine inserts vs updates
    const { data: existingInventory } = await supabase
      .from('manifest_inventory')
      .select('id, catalog_id, custom_photos')
      .eq('client_id', clientId);
      
    const inventoryMap = new Map();
    if (existingInventory) {
      existingInventory.forEach(inv => {
        inventoryMap.set(inv.catalog_id, inv);
      });
    }

    // 5. Prepare updates and inserts
    const inventoryUpdates: any[] = [];
    const inventoryInserts: any[] = [];
    
    normalized.forEach(item => {
      const catId = catalogMap.get(\`\${item.product_name}|\${item.brand}\`);
      if (catId) {
        const existingInv = inventoryMap.get(catId);
        if (existingInv) {
          inventoryUpdates.push({
            id: existingInv.id,
            client_id: clientId,
            catalog_id: catId,
            price: item.price,
            tag: item.tag,
            in_stock: item.in_stock,
            custom_photos: { ...(existingInv.custom_photos || {}), sn: item.sn || '' }
          });
        } else {
          inventoryInserts.push({
            client_id: clientId,
            catalog_id: catId,
            price: item.price,
            tag: item.tag,
            in_stock: item.in_stock,
            custom_photos: { sn: item.sn || '' }
          });
        }
      } else {
        dbErrorCount++;
      }
    });`;

const replace = `    // Fetch all existing inventory for this client, including catalog details
    const { data: existingInventory } = await supabase
      .from('manifest_inventory')
      .select('id, catalog_id, custom_photos, manifest_catalog(id, product_name, brand, product_code)')
      .eq('client_id', clientId);

    const inventoryMap = new Map();
    if (existingInventory) {
      existingInventory.forEach(inv => {
        const cat = Array.isArray(inv.manifest_catalog) ? inv.manifest_catalog[0] : inv.manifest_catalog;
        if (cat) {
          const sn = (inv.custom_photos || {}).sn || '';
          const key = \`\${cat.product_name}|\${cat.brand}|\${sn}|\${cat.product_code || ''}\`;
          inventoryMap.set(key, inv);
        }
      });
    }

    const missingCatalogItems: any[] = [];
    const inventoryUpdates: any[] = [];
    const pendingInserts: any[] = [];

    normalized.forEach(item => {
      const key = \`\${item.product_name}|\${item.brand}|\${item.sn}|\${item.product_code || ''}\`;
      const existingInv = inventoryMap.get(key);

      if (existingInv) {
        inventoryUpdates.push({
          id: existingInv.id,
          client_id: clientId,
          catalog_id: existingInv.catalog_id,
          price: item.price,
          tag: item.tag,
          in_stock: item.in_stock,
          custom_photos: { ...(existingInv.custom_photos || {}), sn: item.sn || '' }
        });
        // Remove from map to prevent duplicate matching if CSV has exact duplicates
        inventoryMap.delete(key);
      } else {
        pendingInserts.push(item);
        missingCatalogItems.push({
          product_name: item.product_name,
          brand: item.brand,
          category: item.category,
          exclusive_to_client_id: item.exclusive_to_client_id,
          product_code: item.product_code,
          spec: item.spec
        });
      }
    });

    let insertedCatalogItems: any[] = [];
    if (missingCatalogItems.length > 0) {
      for (let i = 0; i < missingCatalogItems.length; i += 100) {
        const { data: newlyInserted, error } = await supabase
          .from('manifest_catalog')
          .insert(missingCatalogItems.slice(i, i + 100))
          .select('id, product_name, brand, product_code');
        
        if (error) {
          console.error('Catalog insert error:', error);
        }
        if (newlyInserted) {
          insertedCatalogItems.push(...newlyInserted);
        }
      }
    }

    const availableCatalog = new Map();
    insertedCatalogItems.forEach(cat => {
      const key = \`\${cat.product_name}|\${cat.brand}|\${cat.product_code || ''}\`;
      if (!availableCatalog.has(key)) availableCatalog.set(key, []);
      availableCatalog.get(key).push(cat.id);
    });

    const inventoryInserts: any[] = [];
    pendingInserts.forEach(item => {
      const key = \`\${item.product_name}|\${item.brand}|\${item.product_code || ''}\`;
      const catList = availableCatalog.get(key);
      if (catList && catList.length > 0) {
        const catId = catList.shift();
        inventoryInserts.push({
          client_id: clientId,
          catalog_id: catId,
          price: item.price,
          tag: item.tag,
          in_stock: item.in_stock,
          custom_photos: { sn: item.sn || '' }
        });
      } else {
        dbErrorCount++;
      }
    });`;

if (code.includes('// 1. Get all unique product names')) {
  code = code.replace(search, replace);
  fs.writeFileSync('src/lib/catalog.ts', code);
  console.log('Successfully patched saveCatalogProducts');
} else {
  console.log('Could not find search string in catalog.ts');
}
