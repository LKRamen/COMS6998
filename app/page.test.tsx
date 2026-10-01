import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import Home from "./page";

describe("Home", () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
  it("renders the public ranking", async () => {
    vi.stubEnv("supabase_project_url", "https://example.supabase.co");
    vi.stubEnv("supabase_anon_key", "public-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [{ rank: 1, country: "India", population_count: 1477000000, estimate_year: 2026 }] }));
    render(await Home());

    expect(
      screen.getByRole("heading", { level: 1, name: "Countries by population" }),
    ).toBeInTheDocument();
    expect(screen.getByText("India")).toBeInTheDocument();
  });
  it("loads rankings with the standard Supabase environment variables", async () => {
    vi.stubEnv("supabase_project_url", "");
    vi.stubEnv("supabase_anon_key", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://standard.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "standard-public-key");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal("fetch", fetchMock);
    await Home();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({ origin: "https://standard.supabase.co" }),
      expect.objectContaining({ headers: expect.objectContaining({ apikey: "standard-public-key" }) }),
    );
  });
});
