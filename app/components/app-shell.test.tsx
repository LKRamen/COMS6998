import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("./generation-status", () => ({ default: () => null }));
import AppShell from "./app-shell";

describe("Quip navigation", () => {
 afterEach(cleanup);
 it("brands the public shell and keeps private creations out of signed-out navigation", () => {
  render(<AppShell signedIn={false}><p>Public content</p></AppShell>);
  expect(screen.getByRole("link", { name: "Quip home" })).toHaveTextContent("quip.");
  expect(screen.queryByRole("link", { name: "My creations" })).not.toBeInTheDocument();
  expect(within(screen.getByRole("navigation", { name: "Mobile navigation" })).getAllByRole("link")).toHaveLength(4);
 });
 it("makes creations discoverable and active on desktop and mobile without losing create or profile", () => {
  render(<AppShell signedIn current="creations"><p>Your drafts</p></AppShell>);
  for (const name of ["Main navigation", "Mobile navigation"]) {
   const nav = within(screen.getByRole("navigation", { name }));
   expect(nav.getByRole("link", { name: "My creations" })).toHaveAttribute("href", "/creations");
   expect(nav.getByRole("link", { name: "My creations" })).toHaveAttribute("aria-current", "page");
  }
  const mobile = within(screen.getByRole("navigation", { name: "Mobile navigation" }));
  expect(mobile.getAllByRole("link")).toHaveLength(5);
  expect(mobile.getByRole("link", { name: "Create" })).toHaveAttribute("href", "/create");
  expect(mobile.getByRole("link", { name: "Profile" })).toHaveAttribute("href", "/profile");
  expect(screen.getByRole("link", { name: "Your profile" })).toHaveAttribute("href", "/profile");
 });
});
