import countries from "./data/countries.json";
export { countries };
export type Country = { code: string; name: string };
const codes = new Set(countries.map(country => country.code));
export function isCountryCode(value: unknown): value is string {
  return typeof value === "string" && codes.has(value);
}
