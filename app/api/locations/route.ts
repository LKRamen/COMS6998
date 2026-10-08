import { NextResponse } from 'next/server';
import { countries } from '../../../lib/countries';
import { photonLocations } from '../../../lib/locations';
export async function GET(request: Request) {
 const q = new URL(request.url).searchParams.get('q')?.trim() ?? '';
 if (q.length < 3 || q.length > 80) return NextResponse.json({ results: [], error: 'Search with 3–80 characters.' }, { status: 400 });
 const countryResults = countries.filter(c => c.name.toLowerCase().includes(q.toLowerCase())).slice(0, 8).map(c => ({ label: c.name, country_code: c.code }));
 try {
  const url = new URL('https://photon.komoot.io/api/'); url.searchParams.set('q', q); url.searchParams.set('limit', '8'); url.searchParams.set('lang', 'en');
  const response = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 86400 }, headers: { 'User-Agent': 'BeenThere-class-project/1.0' } });
  if (!response.ok) throw new Error('Search unavailable');
  const results = [...photonLocations(await response.json()), ...countryResults];
  return NextResponse.json({ results: [...new Map(results.map(r => [`${r.country_code}:${r.label}`, r])).values()].slice(0, 12) }, { headers: { 'Cache-Control': 'public, max-age=300' } });
 } catch {
  return NextResponse.json({ results: countryResults, error: 'Place search is unavailable. You can still select a country below.' }, { headers: { 'Cache-Control': 'no-store' } });
 }
}
