import { describe, expect, it } from "vitest";
import { visitOpacity } from "./map-colors";

describe("visitor shading", () => {
  it("leaves unvisited countries uncolored and makes higher counts more opaque", () => {
    expect(visitOpacity(0, 10)).toBe(0);
    expect(visitOpacity(1, 10)).toBeGreaterThan(0);
    expect(visitOpacity(5, 10)).toBeGreaterThan(visitOpacity(1, 10));
    expect(visitOpacity(10, 10)).toBe(1);
  });
  it("handles an empty map without NaN", () => {
    expect(visitOpacity(0, 0)).toBe(0);
    expect(visitOpacity(1, 1)).toBe(1);
  });
});
