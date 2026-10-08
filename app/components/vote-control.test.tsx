import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
const { vote } = vi.hoisted(() => ({ vote: vi.fn() }));
vi.mock("../creations/actions", () => ({ castVote: vote }));
import VoteControl from "./vote-control";
describe("vote control", () => {
 afterEach(() => { cleanup(); vi.resetAllMocks(); });
 it("sends removal when clicking a selected vote and adopts canonical score", async () => {
  vote.mockResolvedValue({ ok: true, vote: null, score: 3 });
  render(<VoteControl captionId="caption" score={4} vote={1} signedIn own={false}/>);
  fireEvent.click(screen.getByRole("button", { name: "Upvote caption" }));
  await waitFor(() => expect(screen.getByLabelText("Net score: 3")).toBeInTheDocument()); expect(vote).toHaveBeenCalledWith("caption", null);
 });
 it("retains old vote and score on failure", async () => {
  vote.mockResolvedValue({ ok: false, error: "Unavailable" });
  render(<VoteControl captionId="caption" score={4} vote={1} signedIn own={false}/>);
  fireEvent.click(screen.getByRole("button", { name: "Downvote caption" }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Unavailable"));
  expect(screen.getByLabelText("Net score: 4")).toBeInTheDocument(); expect(screen.getByRole("button", { name: "Upvote caption" })).toHaveAttribute("aria-pressed", "true");
 });
 it("does not offer self-voting", () => {
  render(<VoteControl captionId="caption" score={4} vote={null} signedIn own/>);
  expect(screen.queryByRole("button")).not.toBeInTheDocument(); expect(screen.getByText("Your post")).toBeInTheDocument();
 });
});
