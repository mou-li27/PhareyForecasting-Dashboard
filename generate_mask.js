const fs = require('fs');
const turf = require('@turf/turf');

try {
  const data = JSON.parse(fs.readFileSync('src/lib/phrae-districts.json', 'utf8'));
  
  // Need to extract all polygons and union them
  let merged = data.features[0];
  for (let i = 1; i < data.features.length; i++) {
    merged = turf.union(turf.featureCollection([merged, data.features[i]]));
  }
  
  const mask = turf.mask(merged);
  
  fs.writeFileSync('src/lib/phrae-mask.json', JSON.stringify(mask));
  console.log('Successfully generated phrae-mask.json');
} catch (error) {
  console.error('Failed to generate mask:', error);
}
