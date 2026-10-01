import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
const { visits, getUser } = vi.hoisted(() => ({visits: vi.fn(), getUser: vi.fn()}));
vi.mock("../lib/travel", () => ({ getCommunityVisits: visits }));
vi.mock("../lib/supabase/server", () => ({ createClient: async () => ({auth:{getUser}}) }));
vi.mock("./auth/actions", () => ({signOut: vi.fn()}));
import Home from "./page";
describe("public travel map", () => {
  afterEach(() => { cleanup(); vi.resetAllMocks(); });
  it("shows aggregate visits and a sign-in invitation to guests", async () => {
    visits.mockResolvedValue([{country_code:"840",visitor_count:3}]);
    getUser.mockResolvedValue({data:{user:null}});
    render(await Home());
    expect(screen.getByRole("heading", {level:1})).toHaveTextContent("One shared map.");
    expect(screen.getByRole("button", {name:"United States: 3 travelers"})).toBeInTheDocument();
    expect(screen.getByText("3 travelers")).toBeInTheDocument();
    expect(screen.getByRole("link",{name:/Start your map/})).toHaveAttribute("href","/login");
  });
  it("shows member navigation to authenticated users", async () => {
    visits.mockResolvedValue([]); getUser.mockResolvedValue({data:{user:{id:"owner"}}});
    render(await Home());
    expect(screen.getByRole("link",{name:"My travels"})).toHaveAttribute("href","/members");
    expect(screen.getByText(/No trips recorded yet/)).toBeInTheDocument();
  });
  it("reports loading failures instead of presenting empty counts as real data", async () => {
    visits.mockRejectedValue(new Error("offline")); getUser.mockResolvedValue({data:{user:null}});
    render(await Home());
    expect(screen.getByRole("alert")).toHaveTextContent("couldn’t load visit counts");
    expect(screen.queryByRole("region",{name:"Community travel map"})).not.toBeInTheDocument();
  });
});
