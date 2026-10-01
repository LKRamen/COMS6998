import { describe, expect, it } from "vitest";
import { countries, isCountryCode } from "./countries";
import shapes from "./data/world-map.json";
describe("country catalog", () => {
  it("has unique codes shared by the map and database", () => {
    expect(new Set(countries.map(c => c.code)).size).toBe(countries.length);
    expect(new Set(shapes.map(c => c.code)).size).toBe(shapes.length);
    expect(countries.every(c => shapes.some(shape => shape.code === c.code))).toBe(true);
  });
  it("supports all five requested countries and rejects unknown codes", () => {
    for (const code of ["840", "300", "826", "360", "764"]) expect(isCountryCode(code)).toBe(true);
    expect(isCountryCode("INVALID")).toBe(false);
  });
});
