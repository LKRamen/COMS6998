import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ path: "/feed", query: "", refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => state.path, useSearchParams: () => new URLSearchParams(state.query), useRouter: () => ({ refresh: state.refresh }) }));
import VoteNavigationRefresh, { notifySwipeVoteSaved } from "./vote-navigation-refresh";
afterEach(() => { cleanup(); state.path = "/feed"; state.query = ""; vi.resetAllMocks(); });
it("defers invalidation until leaving the feed, including cached Back navigation", () => {
 state.path = "/explore"; const view = render(<VoteNavigationRefresh/>);
 state.path = "/feed"; view.rerender(<VoteNavigationRefresh/>);
 notifySwipeVoteSaved(); notifySwipeVoteSaved();
 expect(state.refresh).not.toHaveBeenCalled();
 state.path = "/explore"; view.rerender(<VoteNavigationRefresh/>);
 expect(state.refresh).toHaveBeenCalledTimes(1);
 state.path = "/meme/one"; view.rerender(<VoteNavigationRefresh/>);
 expect(state.refresh).toHaveBeenCalledTimes(1);
});
it("refreshes every previously visited destination and query after a successful swipe", () => {
 state.path = "/meme/one"; const view = render(<VoteNavigationRefresh/>);
 state.path = "/explore"; state.query = "sort=new"; view.rerender(<VoteNavigationRefresh/>);
 state.query = "sort=top"; view.rerender(<VoteNavigationRefresh/>);
 state.path = "/feed"; state.query = ""; view.rerender(<VoteNavigationRefresh/>);
 notifySwipeVoteSaved();
 state.path = "/explore"; state.query = "sort=top"; view.rerender(<VoteNavigationRefresh/>);
 expect(state.refresh).toHaveBeenCalledTimes(1);
 state.query = "sort=new"; view.rerender(<VoteNavigationRefresh/>);
 expect(state.refresh).toHaveBeenCalledTimes(2);
 state.path = "/meme/one"; state.query = ""; view.rerender(<VoteNavigationRefresh/>);
 expect(state.refresh).toHaveBeenCalledTimes(3);
 view.rerender(<VoteNavigationRefresh/>); expect(state.refresh).toHaveBeenCalledTimes(3);
});
it("refreshes if a vote finishes after the user has already left", () => {
 state.path = "/explore"; render(<VoteNavigationRefresh/>);
 notifySwipeVoteSaved(); expect(state.refresh).toHaveBeenCalledTimes(1);
});
it("does not refresh ordinary navigation without a successful swipe", () => {
 const view = render(<VoteNavigationRefresh/>);
 state.path = "/explore"; view.rerender(<VoteNavigationRefresh/>);
 expect(state.refresh).not.toHaveBeenCalled();
});
