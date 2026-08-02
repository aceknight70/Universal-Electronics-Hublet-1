export const bulkSave = `
  let dbInsertedCount = 0;
  let dbErrorCount = 0;
  let processedCount = 0;

  try {
    // 1. Get all unique product names & brands from the CSV
    const catalogKeys = normalized.map(item => \`\${item.product_name}|\${item.brand}\`);
    const uniqueProductNames = [...new Set(normalized.map(i => i.product_name))];
    
    // 2. Fetch existing catalog items to minimize inserts
    let existingCatalogItems = [];
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
    const missingCatalogItems = [];
    const missingKeys = new Set();
    
    normalized.forEach(item => {
      const key = \`\${item.product_name}|\${item.brand}\`;
      if (!catalogMap.has(key) && !missingKeys.has(key)) {
        missingKeys.add(key);
        missingCatalogItems.push({
          product_name: item.product_name,
          brand: item.brand,
          category: item.category,
          exclusive_to_client_id: item.exclusive_to_client_id
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
      .select('id, catalog_id')
      .eq('client_id', clientId);
      
    const inventoryMap = new Map();
    if (existingInventory) {
      existingInventory.forEach(inv => {
        inventoryMap.set(inv.catalog_id, inv.id);
      });
    }

    // 5. Prepare updates and inserts
    const inventoryUpdates = [];
    const inventoryInserts = [];
    
    normalized.forEach(item => {
      const catId = catalogMap.get(\`\${item.product_name}|\${item.brand}\`);
      if (catId) {
        const existingInvId = inventoryMap.get(catId);
        if (existingInvId) {
          inventoryUpdates.push({
            id: existingInvId,
            client_id: clientId,
            catalog_id: catId,
            price: item.price,
            tag: item.tag,
            in_stock: item.in_stock
          });
        } else {
          inventoryInserts.push({
            client_id: clientId,
            catalog_id: catId,
            price: item.price,
            tag: item.tag,
            in_stock: item.in_stock
          });
        }
      } else {
        dbErrorCount++;
      }
    });

    // 6. Execute bulk inserts and updates
    for (let i = 0; i < inventoryInserts.length; i += 100) {
      const { error } = await supabase
        .from('manifest_inventory')
        .insert(inventoryInserts.slice(i, i + 100));
      if (!error) dbInsertedCount += inventoryInserts.slice(i, i + 100).length;
      else dbErrorCount += inventoryInserts.slice(i, i + 100).length;
      
      processedCount = dbInsertedCount + dbErrorCount;
      window.dispatchEvent(new CustomEvent('catalog_save_progress', { detail: { processedCount, total: normalized.length } }));
    }
    
    for (let i = 0; i < inventoryUpdates.length; i += 100) {
      const { error } = await supabase
        .from('manifest_inventory')
        .upsert(inventoryUpdates.slice(i, i + 100)); // upsert on primary key 'id' works well
      if (!error) dbInsertedCount += inventoryUpdates.slice(i, i + 100).length;
      else dbErrorCount += inventoryUpdates.slice(i, i + 100).length;
      
      processedCount = dbInsertedCount + dbErrorCount;
      window.dispatchEvent(new CustomEvent('catalog_save_progress', { detail: { processedCount, total: normalized.length } }));
    }
    
    if (processedCount < normalized.length) {
        window.dispatchEvent(new CustomEvent('catalog_save_progress', { detail: { processedCount: normalized.length, total: normalized.length } }));
    }

  } catch (err) {
    console.error("Bulk save error", err);
    dbErrorCount += normalized.length;
  }
`
