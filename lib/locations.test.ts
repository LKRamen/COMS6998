// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { parseLocation, photonLocations } from './locations';
describe('location selection', () => {
 it('rejects unknown countries and blank labels', () => {
  expect(() => parseLocation({label:'Central Park',country_code:'US'})).toThrow();
  expect(() => parseLocation({label:' ',country_code:'840'})).toThrow();
 });
 it('allows unselected drafts and validates a selected place', () => {
  expect(parseLocation(null)).toBeNull();
  expect(parseLocation({label:' Central Park, New York, United States ',country_code:'840'})).toEqual({label:'Central Park, New York, United States',country_code:'840'});
 });
 it('maps Photon alpha-2 codes to atlas codes and ignores unsupported results', () => {
  expect(photonLocations({features:[{properties:{name:'Central Park',city:'New York',country:'United States',countrycode:'US'}},{properties:{name:'Unknown',countrycode:'ZZ'}}]})).toEqual([{label:'Central Park, New York, United States',country_code:'840'}]);
 });
});
