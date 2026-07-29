import { saveCatalogProducts } from './src/lib/catalog';

const sampleRows = [
  { 'Product Name': 'Bruhm 6kg Twin Tub', Brand: 'Bruhm', Category: 'Washing Machine', Price: '₦199,000', RoomTag: 'price list', Stock: '10' }
];

async function run() {
  try {
    const res = await saveCatalogProducts(sampleRows, 'ofrank');
    console.log("Success:", res);
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
