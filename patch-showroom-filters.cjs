const fs = require('fs');
let code = fs.readFileSync('src/pages/Showroom.tsx', 'utf-8');

const search = `    const hasFilterSelected = selectedRooms.length > 0;

    if (hasFilterSelected) {
      if (selectedRooms.includes('arcade') || selectedRooms.includes('showroom')) activeTags.push('arcade');
      if (selectedRooms.includes('displayfloor')) activeTags.push('display_floor');
      if (selectedRooms.includes('hotdeals')) activeTags.push('hot_deal');
      if (selectedRooms.includes('pricelist')) activeTags.push('live_sheet');
    }`;

const replace = `    // If ONLY 'showroom' is selected, show all products
    const isOnlyShowroom = selectedRooms.length === 1 && selectedRooms[0] === 'showroom';
    const hasFilterSelected = selectedRooms.length > 0 && !isOnlyShowroom;

    if (hasFilterSelected) {
      if (selectedRooms.includes('arcade')) activeTags.push('arcade');
      if (selectedRooms.includes('displayfloor')) activeTags.push('display_floor');
      if (selectedRooms.includes('hotdeals')) activeTags.push('hot_deal');
      if (selectedRooms.includes('pricelist')) activeTags.push('live_sheet');
    }`;

code = code.replace(search, replace);
fs.writeFileSync('src/pages/Showroom.tsx', code);
