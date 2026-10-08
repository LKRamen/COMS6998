import { useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { SelectedLocation } from "../../lib/locations";
import LocationSearch from "./location-search";
function Search() {
 const [location, setLocation] = useState<SelectedLocation | null>(null); const [query, setQuery] = useState("");
 return <LocationSearch value={location} query={query} onChange={setLocation} onQueryChange={setQuery}/>;
}
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("supports a local country selection when place search fails, and invalidates it on typing", async () => {
 vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
 render(<Search/>); fireEvent.change(screen.getByLabelText(/Where was this/), { target: { value: "Central Park" } });
 fireEvent.click(screen.getByRole("button", { name: "Search places" }));
 await screen.findByText(/Place search is unavailable/);
 fireEvent.change(screen.getByRole("combobox"), { target: { value: "840" } });
 expect(screen.getByRole("status")).toHaveTextContent("Selected: United States");
 fireEvent.change(screen.getByLabelText(/Where was this/), { target: { value: "United States park" } });
 expect(screen.queryByText(/Selected:/)).not.toBeInTheDocument(); expect(screen.getByRole("combobox")).toHaveValue("");
});
it("ignores a stale result after the search text changes", async () => {
 let finish!: (result: unknown) => void;
 vi.stubGlobal("fetch", vi.fn(() => new Promise(resolve => { finish = resolve; })));
 render(<Search/>); fireEvent.change(screen.getByLabelText(/Where was this/), { target: { value: "Central Park" } }); fireEvent.click(screen.getByRole("button", { name: "Search places" }));
 fireEvent.change(screen.getByLabelText(/Where was this/), { target: { value: "Tokyo" } });
 finish({ ok: true, json: async () => ({ results: [{ label: "Central Park, New York", country_code: "840" }] }) });
 await waitFor(() => expect(screen.getByRole("button", { name: "Search places" })).toBeEnabled());
 expect(screen.queryByRole("button", { name: "Central Park, New York" })).not.toBeInTheDocument();
});
it("saves a selected place and its country without requiring an exact street location", async () => {
 vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [{ label: "Tokyo, Japan", country_code: "392" }] }) }));
 render(<Search/>); fireEvent.change(screen.getByLabelText(/Where was this/), { target: { value: "Tokyo" } }); fireEvent.click(screen.getByRole("button", { name: "Search places" }));
 fireEvent.click(await screen.findByRole("button", { name: "Tokyo, Japan" }));
 expect(screen.getByRole("status")).toHaveTextContent("Selected: Tokyo, Japan"); expect(screen.getByRole("combobox")).toHaveValue("392");
});
