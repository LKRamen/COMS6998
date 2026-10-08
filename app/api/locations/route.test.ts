// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import { GET } from './route';
afterEach(() => vi.unstubAllGlobals());
it('rejects oversized queries without calling the provider', async () => {
 const fetcher=vi.fn(); vi.stubGlobal('fetch',fetcher);
 expect((await GET(new Request('https://example.com/api/locations?q='+ 'a'.repeat(81)))).status).toBe(400);
 expect(fetcher).not.toHaveBeenCalled();
});
it('preserves local country results when the provider is unavailable', async () => {
 vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('offline')));
 const body=await (await GET(new Request('https://example.com/api/locations?q=Japan'))).json();
 expect(body.results).toContainEqual({label:'Japan',country_code:'392'});
 expect(body.error).toMatch(/unavailable/);
});
it('returns a selected country for a real-shaped place result', async () => {
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({features:[{properties:{name:'Central Park',city:'New York',country:'United States',countrycode:'US'}}]})}));
 const body=await (await GET(new Request('https://example.com/api/locations?q=Central%20Park'))).json();
 expect(body.results[0].country_code).toBe('840');
});
