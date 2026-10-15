import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { Meme } from "../../lib/memes";
const { vote, load } = vi.hoisted(() => ({ vote: vi.fn(), load: vi.fn() }));
vi.mock("../brainrot/actions", () => ({ voteMeme: vote, loadSwipeMemes: load }));
vi.mock("motion/react", async () => {
 const React = await import("react");
 const TestArticle = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(function TestArticle(props, ref) {
  const safe = Object.fromEntries(Object.entries(props).filter(([key]) => !["drag", "dragMomentum", "dragElastic", "dragConstraints", "onDragEnd", "whileDrag", "initial", "animate", "transition", "style"].includes(key)));
  return React.createElement("article", { ...safe, ref });
 });
 return { motion: { article: TestArticle, div: (props: React.HTMLAttributes<HTMLDivElement>) => <div className={props.className}>{props.children}</div> }, useMotionValue: () => ({ set: vi.fn() }), useTransform: () => 0, useReducedMotion: () => true, animate: () => Promise.resolve() };
});
import SwipeDeck from "./swipe-deck";
const meme = (id: string): Meme => ({ id, caption_id: id, text: `Caption ${id}`, photo_path: "", photo_url: "/photo.jpg", style: "Brainrot", author_name: "Sam", username: "sam", avatar_path: null, rendered_path: null, published_at: "2026-10-15T00:00:00Z", score: 0, upvotes: 0, downvotes: 0, vote: null, own: false });
afterEach(() => { cleanup(); vi.resetAllMocks(); });
it("does not submit guest gestures and offers sign-in", async () => {
 render(<SwipeDeck initialPosts={[meme("one")]} signedIn={false}/>);
 fireEvent.click(screen.getByRole("button", { name: "Upvote meme" }));
 expect(vote).not.toHaveBeenCalled(); expect(screen.getByRole("link", { name: "Sign in to vote" })).toBeInTheDocument();
});
it("serializes rapid inputs and advances only after the vote succeeds", async () => {
 let finish!: (value: unknown) => void;
 vote.mockReturnValue(new Promise(resolve => { finish = resolve; }));
 render(<SwipeDeck initialPosts={[meme("one"), meme("two")]} signedIn/>);
 const button = screen.getByRole("button", { name: "Upvote meme" });
 fireEvent.click(button); fireEvent.click(button); fireEvent.keyDown(window, { key: "ArrowRight" });
 expect(vote).toHaveBeenCalledTimes(1);
 finish({ ok: true, vote: 1, score: 1 });
 await waitFor(() => expect(screen.getByRole("article", { name: "Current meme" })).toHaveTextContent("Caption two"));
});
it("restores the same card after a write failure and allows retry", async () => {
 vote.mockResolvedValueOnce({ ok: false, error: "Network interrupted" }).mockResolvedValueOnce({ ok: true, vote: -1, score: -1 });
 render(<SwipeDeck initialPosts={[meme("one"), meme("two")]} signedIn/>);
 fireEvent.click(screen.getByRole("button", { name: "Downvote meme" }));
 await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Network interrupted"));
 expect(screen.getByRole("article", { name: "Current meme" })).toHaveTextContent("Caption one");
 fireEvent.click(screen.getByRole("button", { name: "Downvote meme" }));
 await waitFor(() => expect(screen.getByRole("article", { name: "Current meme" })).toHaveTextContent("Caption two"));
});
it("does not intercept arrow keys when a text field has focus", () => {
 render(<><input aria-label="Search"/><SwipeDeck initialPosts={[meme("one")]} signedIn/></>);
 fireEvent.keyDown(screen.getByRole("textbox"), { key: "ArrowRight" }); expect(vote).not.toHaveBeenCalled();
});

it("accepts arrows after a voting button or navigation link receives focus", async () => {
 vote.mockResolvedValue({ ok: true, vote: 1, score: 1 });
 render(<><a href="/feed">Feed navigation</a><SwipeDeck initialPosts={[meme("one"), meme("two"), meme("three")]} signedIn/></>);
 const up = screen.getByRole("button", { name: "Upvote meme" }); up.focus();
 fireEvent.keyDown(up, { key: "ArrowRight" });
 await waitFor(() => expect(screen.getByRole("article", { name: "Current meme" })).toHaveTextContent("Caption two"));
 const navigation = screen.getByRole("link", { name: "Feed navigation" }); navigation.focus();
 fireEvent.keyDown(navigation, { key: "ArrowLeft" });
 await waitFor(() => expect(vote).toHaveBeenLastCalledWith("two", -1));
 await waitFor(() => expect(screen.getByRole("article", { name: "Current meme" })).toHaveTextContent("Caption three"));
 expect(vote.mock.calls).toEqual([["one", 1], ["two", -1]]);
});
it("leaves editor, selection, dialog and modifier keys alone", () => {
 render(<><div contentEditable suppressContentEditableWarning data-testid="editor">Editing</div><div role="slider" aria-label="Volume" aria-valuenow={5}/><div role="dialog"><button>Dialog action</button></div><SwipeDeck initialPosts={[meme("one")]} signedIn/></>);
 for (const target of [screen.getByTestId("editor"), screen.getByRole("slider"), screen.getByRole("button", { name: "Dialog action" })]) fireEvent.keyDown(target, { key: "ArrowRight" });
 fireEvent.keyDown(window, { key: "ArrowRight", ctrlKey: true });
 fireEvent.keyDown(window, { key: "ArrowRight", repeat: true });
 expect(vote).not.toHaveBeenCalled();
});
it("keeps landing previews out of global keyboard voting", () => {
 render(<SwipeDeck initialPosts={[meme("one")]} signedIn preview/>);
 fireEvent.keyDown(window, { key: "ArrowRight" }); expect(vote).not.toHaveBeenCalled();
});
