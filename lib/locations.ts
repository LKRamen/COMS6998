import { countries, isCountryCode } from './countries';
import alpha2 from './data/country-alpha2.json';
export type SelectedLocation = { label: string; country_code: string };
export function parseLocation(value: unknown): SelectedLocation | null {
 if (value === null) return null;
 if (!value || typeof value !== 'object' || !('label' in value) || !('country_code' in value) || typeof value.label !== 'string' || !value.label.trim() || value.label.length > 120 || !isCountryCode(value.country_code)) throw new Error('Select a place or country from the location results.');
 return { label: value.label.trim(), country_code: value.country_code };
}
export function photonLocations(value: unknown): SelectedLocation[] {
 if (!value || typeof value !== 'object' || !('features' in value) || !Array.isArray(value.features)) return [];
 const results: SelectedLocation[] = [];
 for (const feature of value.features.slice(0, 12)) {
  const p = feature?.properties;
  if (!p || typeof p.countrycode !== 'string') continue;
  const code = (alpha2 as Record<string, string>)[p.countrycode.toUpperCase()];
  if (!isCountryCode(code)) continue;
  const country = countries.find(c => c.code === code)!;
  const parts = [p.name, p.city, p.state, p.country || country.name].filter((v): v is string => typeof v === 'string' && Boolean(v.trim()));
  const label = [...new Set(parts.map(v => v.trim()))].join(', ');
  if (!label || label.length > 120) continue;
  if (!results.some(r => r.label === label && r.country_code === code)) results.push({ label, country_code: code });
 }
 return results;
}
