import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Meme } from "../../lib/memes";
import InfiniteGallery from "./infinite-gallery";
vi.mock("../components/meme-gallery", () => ({ default: ({ posts }: { posts: Meme[] }) => <section>{posts.map(post => <p key={post.id}>{post.text}</p>)}</section> }));
let intersect: IntersectionObserverCallback;
const fetcher = vi.fn();
const post = (id: string) => ({ id, text: `Meme ${id}` }) as Meme;
const initial = Array.from({ length: 20 }, (_, index) => post(String(index)));
beforeEach(() => {
 vi.stubGlobal("fetch", fetcher);
 vi.stubGlobal("IntersectionObserver", class { constructor(callback: IntersectionObserverCallback) { intersect = callback; } observe() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.resetAllMocks(); });
function bottom() { act(() => intersect([{ isIntersecting: true }] as IntersectionObserverEntry[], {} as IntersectionObserver)); }
function response(posts: Meme[], hasMore = false) { return { ok: true, json: async () => ({ posts, hasMore, nextOffset: 20 + posts.length }) }; }
it("automatically appends server-ranked posts without reordering or repeating existing cards and stops at the end", async () => {
 fetcher.mockResolvedValue(response([post("19"), post("20"), post("21")]));
 render(<InfiniteGallery initialPosts={initial} sort="top" query="@sam" initialOffset={0} signedIn/>);
 bottom(); bottom();
 await waitFor(() => expect(screen.getByText("Meme 21")).toBeInTheDocument());
 expect(fetcher).toHaveBeenCalledTimes(1);
 expect(fetcher).toHaveBeenCalledWith("/api/explore?sort=top&offset=20&q=%40sam", expect.objectContaining({ cache: "no-store" }));
 expect(screen.getAllByText("Meme 19")).toHaveLength(1);
 expect(screen.getAllByText(/^Meme /).map(node => node.textContent)).toEqual([...initial.map(row => row.text), "Meme 20", "Meme 21"]);
 expect(screen.getByRole("status")).toHaveTextContent("You’re all caught up");
 bottom(); expect(fetcher).toHaveBeenCalledTimes(1);
});
it("keeps earlier results during a failed append and retries the same batch", async () => {
 fetcher.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(response([post("20")]));
 render(<InfiniteGallery initialPosts={initial} sort="new" query="" initialOffset={0} signedIn={false}/>);
 bottom();
 await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("couldn’t be loaded"));
 expect(screen.getByText("Meme 0")).toBeInTheDocument();
 bottom(); expect(fetcher).toHaveBeenCalledTimes(1);
 fireEvent.click(screen.getByRole("button", { name: "Retry loading memes" }));
 await waitFor(() => expect(screen.getByText("Meme 20")).toBeInTheDocument());
 expect(fetcher.mock.calls.map(call => call[0])).toEqual(["/api/explore?sort=new&offset=20", "/api/explore?sort=new&offset=20"]);
});
it("discards a late response when sorting replaces the gallery", async () => {
 let resolve!: (value: unknown) => void;
 fetcher.mockImplementation(() => new Promise(done => { resolve = done; }));
 const view = render(<InfiniteGallery key="new" initialPosts={initial} sort="new" query="" initialOffset={0} signedIn={false}/>);
 bottom();
 view.rerender(<InfiniteGallery key="top" initialPosts={[post("top")]} sort="top" query="" initialOffset={0} signedIn={false}/>);
 await act(async () => { resolve(response([post("late")])); });
 expect(screen.queryByText("Meme late")).not.toBeInTheDocument();
 expect(screen.getByText("Meme top")).toBeInTheDocument();
});
it("uses updated server props for first-page scores without losing appended posts", async () => {
 fetcher.mockResolvedValueOnce(response([post("20")])).mockResolvedValueOnce(response([{ ...post("20"), text: "Updated appended meme" }]));
 const view=render(<InfiniteGallery initialPosts={initial} sort="top" query="" initialOffset={0} signedIn/>);
 bottom(); await screen.findByText("Meme 20");
 view.rerender(<InfiniteGallery initialPosts={[{ ...post("0"), text: "Updated meme" }, ...initial.slice(1)]} sort="top" query="" initialOffset={0} signedIn/>);
 expect(screen.getByText("Updated meme")).toBeInTheDocument();
 await screen.findByText("Updated appended meme");
 expect(screen.queryByText("Meme 20")).not.toBeInTheDocument();
});
it("reopens automatic pagination when a refreshed first page fills a previously exhausted gallery", async () => {
 fetcher.mockResolvedValue(response([post("20")]));
 const view = render(<InfiniteGallery initialPosts={initial.slice(0,19)} sort="new" query="" initialOffset={0} signedIn/>);
 expect(screen.getByRole("status")).toHaveTextContent("all caught up");
 view.rerender(<InfiniteGallery initialPosts={initial} sort="new" query="" initialOffset={0} signedIn/>);
 await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Keep scrolling"));
 bottom(); await screen.findByText("Meme 20");
});
