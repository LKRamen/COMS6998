import fs from 'node:fs';
import { feature } from 'topojson-client';
import { geoNaturalEarth1, geoPath } from 'd3-geo';

// Natural Earth public-domain boundaries, redistributed by world-atlas (ISC).
const topology = JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-50m.json', 'utf8'));
const features = feature(topology, topology.objects.countries).features.filter(f => f.id !== '010');
const projection = geoNaturalEarth1().fitExtent([[18, 18], [1082, 522]], { type: 'FeatureCollection', features });
const path = geoPath(projection).digits(1);
const names = { '840': 'United States', '336': 'Vatican City', '203': 'Czechia', '807': 'North Macedonia', '180': 'Democratic Republic of the Congo', '140': 'Central African Republic', '070': 'Bosnia and Herzegovina', '214': 'Dominican Republic', '226': 'Equatorial Guinea', '090': 'Solomon Islands', '728': 'South Sudan', '784': 'United Arab Emirates' };
names['036'] = 'Australia';
const countries = [...new Map(features.filter(f => f.id || f.properties.name === 'Kosovo').map(f => [f.id || 'XKX', { code: f.id || 'XKX', name: names[f.id] || f.properties.name }])).values()].sort((a,b) => a.name.localeCompare(b.name));
const shapeGroups = new Map();
features.forEach((f,i) => {
  const code = f.id || (f.properties.name === 'Kosovo' ? 'XKX' : `region-${i}`);
  const previous = shapeGroups.get(code);
  shapeGroups.set(code, { code, name: names[f.id] || f.properties.name, path: (previous?.path || '') + (path(f) || '') });
});
const shapes = [...shapeGroups.values()];
fs.mkdirSync('lib/data', { recursive: true });
fs.writeFileSync('lib/data/countries.json', JSON.stringify(countries));
fs.writeFileSync('lib/data/world-map.json', JSON.stringify(shapes));
console.log(`Generated ${countries.length} selectable countries and territories, ${shapes.length} map shapes.`);
