const fs = require('fs');
let code = fs.readFileSync('src/lib/catalog.ts', 'utf-8');

// 1. Add fields to CatalogProduct
code = code.replace(
  '  exclusive_to_client_id?: string | null;',
  '  exclusive_to_client_id?: string | null;\n  product_code?: string;'
);

// 2. Add mappings to normalizeProductRow
const search = `  const stockRaw = getVal(['Stock', 'stock', 'Quantity', 'qty', 'in_stock']);
  const in_stock = stockRaw ? stockRaw.toLowerCase() !== '0' && stockRaw.toLowerCase() !== 'false' && stockRaw.toLowerCase() !== 'no' : true;

  return {`;

const replace = `  const stockRaw = getVal(['Stock', 'stock', 'Quantity', 'qty', 'in_stock']);
  const in_stock = stockRaw ? stockRaw.toLowerCase() !== '0' && stockRaw.toLowerCase() !== 'false' && stockRaw.toLowerCase() !== 'no' : true;

  const product_code = getVal(['Product Code', 'product_code', 'Code', 'SKU']) || '';
  const technical_specs = getVal(['Technical Specs', 'tech_specs', 'specs', 'Spec', 'Technical Specification']) || '';
  const extra_details = getVal(['Extra Details', 'extra_details', 'details', 'description']) || '';
  const combined_spec = [technical_specs, extra_details].filter(Boolean).join('\\n\\n');

  return {
    product_code,
    spec: combined_spec,`;

code = code.replace(search, replace);

// 3. Add them to missingCatalogItems push
const pushSearch = `        missingCatalogItems.push({
          product_name: item.product_name,
          brand: item.brand,
          category: item.category,
          exclusive_to_client_id: item.exclusive_to_client_id
        });`;

const pushReplace = `        missingCatalogItems.push({
          product_name: item.product_name,
          brand: item.brand,
          category: item.category,
          exclusive_to_client_id: item.exclusive_to_client_id,
          product_code: item.product_code,
          spec: item.spec
        });`;

code = code.replace(pushSearch, pushReplace);

// 4. Update getCatalogProducts select query
const selectSearch = `        manifest_catalog (
          id,
          product_name,
          brand,
          category,
          exclusive_to_client_id
        )`;

const selectReplace = `        manifest_catalog (
          id,
          product_name,
          brand,
          category,
          exclusive_to_client_id,
          product_code,
          spec
        )`;

code = code.replace(selectSearch, selectReplace);

// 5. Add them to mapped item in getCatalogProducts
const mapSearch = `          return {
            ...item,
            id: item.id,
            catalog_id: cat.id,
            product_name: cat.product_name,
            brand: cat.brand,
            category: cat.category,
            exclusive_to_client_id: cat.exclusive_to_client_id,
            price: String(numPrice)
          };`;
const mapReplace = `          return {
            ...item,
            id: item.id,
            catalog_id: cat.id,
            product_name: cat.product_name,
            brand: cat.brand,
            category: cat.category,
            exclusive_to_client_id: cat.exclusive_to_client_id,
            product_code: cat.product_code,
            spec: cat.spec,
            price: String(numPrice)
          };`;
          
code = code.replace(mapSearch, mapReplace);

fs.writeFileSync('src/lib/catalog.ts', code);
