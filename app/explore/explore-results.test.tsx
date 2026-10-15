import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Suspense, use, useState } from "react";
import { afterEach, expect, it, vi } from "vitest";
const { push, refresh } = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
import ExploreResults from "./explore-results";
afterEach(() => { cleanup(); vi.resetAllMocks(); });
function deferred() { let resolve!: () => void; const promise = new Promise<void>(done => { resolve = done; }); return { promise, resolve }; }
it("hides old results immediately and waits for the server-sorted navigation to finish", async () => {
 const response = deferred();
 function Harness() {
  const [sort, setSort] = useState<"trending" | "new">("trending");
  push.mockImplementation(() => setSort("new"));
  if (sort === "new") use(response.promise);
  return <ExploreResults sort={sort} query="@sam" page={3} failed={false}><p>{sort === "new" ? "Server's new order" : "Old trending order"}</p></ExploreResults>;
 }
 render(<Suspense fallback={<p>Route fallback</p>}><Harness/></Suspense>);
 await act(async () => { fireEvent.click(screen.getByRole("link", { name: "New" })); });
 expect(push).toHaveBeenCalledWith("/explore?sort=new&q=%40sam", { scroll: false });
 expect(screen.getByRole("status")).toHaveTextContent("Loading New memes");
 expect(screen.queryByText("Old trending order")).not.toBeInTheDocument();
 await act(async () => { response.resolve(); await response.promise; });
 await waitFor(() => expect(screen.getByText("Server's new order")).toBeInTheDocument());
 expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
it("keeps server content order intact and provides retry for a failed server read", () => {
 render(<ExploreResults sort="top" query="" page={1} failed><p>Server error detail</p></ExploreResults>);
 expect(screen.getByText("Server error detail")).toBeInTheDocument();
 fireEvent.click(screen.getByRole("button", { name: "Try loading again" })); expect(refresh).toHaveBeenCalledTimes(1);
});
it("does not expose click-through pagination", () => {
 render(<ExploreResults sort="top" query="sam" page={2} failed={false}><p>Authoritative results</p></ExploreResults>);
 expect(screen.queryByRole("link", { name: "More memes" })).not.toBeInTheDocument();
 expect(screen.queryByRole("link", { name: "Previous" })).not.toBeInTheDocument();
});

it("keeps rapid sort requests hidden and commits the last requested server set", async () => {
 const newest = deferred(), highest = deferred();
 function Harness() {
  const [sort, setSort] = useState<"trending" | "new" | "top">("trending");
  push.mockImplementation((url: string) => setSort(new URL(url, "https://example.invalid").searchParams.get("sort") as "new" | "top"));
  if (sort === "new") use(newest.promise);
  if (sort === "top") use(highest.promise);
  return <ExploreResults sort={sort} query="" page={1} failed={false}><p>Server set: {sort}</p></ExploreResults>;
 }
 render(<Suspense fallback={<p>Route fallback</p>}><Harness/></Suspense>);
 await act(async () => { fireEvent.click(screen.getByRole("link", { name: "New" })); });
 await act(async () => { fireEvent.click(screen.getByRole("link", { name: "Top" })); });
 expect(screen.getByRole("status")).toHaveTextContent("Loading Top memes");
 await act(async () => { highest.resolve(); newest.resolve(); await Promise.all([highest.promise, newest.promise]); });
 await waitFor(() => expect(screen.getByText("Server set: top")).toBeInTheDocument());
 expect(screen.queryByText("Server set: new")).not.toBeInTheDocument();
});
it("recovers from an immediate navigation failure without losing the last result set", () => {
 push.mockImplementationOnce(() => { throw new Error("Navigation unavailable"); });
 render(<ExploreResults sort="trending" query="" page={1} failed={false}><p>Last server result</p></ExploreResults>);
 fireEvent.click(screen.getByRole("link", { name: "New" }));
 expect(screen.getByRole("alert")).toHaveTextContent("couldn’t be loaded");
 expect(screen.getByText("Last server result")).toBeInTheDocument();
 fireEvent.click(screen.getByRole("button", { name: "Try loading again" }));
 expect(push).toHaveBeenLastCalledWith("/explore?sort=new", { scroll: false });
});

it("can return to the current tab while another sort is still loading", async () => {
 const response = deferred();
 function Harness() {
  const [sort, setSort] = useState<"trending" | "new">("trending");
  push.mockImplementation((url: string) => setSort(new URL(url, "https://example.invalid").searchParams.get("sort") as "trending" | "new"));
  if (sort === "new") use(response.promise);
  return <ExploreResults sort={sort} query="" page={1} failed={false}><p>Current server set: {sort}</p></ExploreResults>;
 }
 render(<Suspense fallback={<p>Route fallback</p>}><Harness/></Suspense>);
 await act(async () => { fireEvent.click(screen.getByRole("link", { name: "New" })); });
 await act(async () => { fireEvent.click(screen.getByRole("link", { name: "Trending" })); });
 expect(push).toHaveBeenLastCalledWith("/explore?sort=trending", { scroll: false });
 await act(async () => { response.resolve(); await response.promise; });
 await waitFor(() => expect(screen.getByText("Current server set: trending")).toBeInTheDocument());
 expect(refresh).not.toHaveBeenCalled();
});

it("preserves a newly submitted search when sorting before its response arrives", async () => {
 const response = deferred();
 function Harness() {
  const [route, setRoute] = useState({ sort: "trending" as "trending" | "top", query: "cat" });
  push.mockImplementation((url: string) => {
   const params = new URL(url, "https://example.invalid").searchParams;
   setRoute({ sort: params.get("sort") as "trending" | "top", query: params.get("q") ?? "" });
  });
  if (route.query === "dog") use(response.promise);
  return <ExploreResults sort={route.sort} query={route.query} page={1} failed={false}><p>Server results: {route.sort} {route.query}</p></ExploreResults>;
 }
 render(<Suspense fallback={<p>Route fallback</p>}><Harness/></Suspense>);
 fireEvent.change(screen.getByRole("textbox", { name: "Search captions or creators" }), { target: { value: "dog" } });
 await act(async () => { fireEvent.submit(screen.getByRole("textbox").closest("form")!); });
 expect(push).toHaveBeenLastCalledWith("/explore?sort=trending&q=dog", { scroll: false });
 expect(screen.getByRole("link", { name: "Top" })).toHaveAttribute("href", "/explore?sort=top&q=dog");
 await act(async () => { fireEvent.click(screen.getByRole("link", { name: "Top" })); });
 expect(push).toHaveBeenLastCalledWith("/explore?sort=top&q=dog", { scroll: false });
 await act(async () => { response.resolve(); await response.promise; });
 await waitFor(() => expect(screen.getByText("Server results: top dog")).toBeInTheDocument());
});
