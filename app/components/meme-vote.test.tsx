import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const { vote } = vi.hoisted(() => ({ vote: vi.fn() }));
vi.mock("../brainrot/actions", () => ({ voteMeme: vote }));
import MemeVote from "./meme-vote";
afterEach(() => { cleanup(); vi.clearAllMocks(); });
it("keeps own posts visible with attribution and score but no voting arrows or controls", () => {
 const { container } = render(<MemeVote captionId="own" score={4} vote={null} signedIn own/>);
 expect(screen.getByText("Your post")).toBeInTheDocument();
 expect(screen.getByLabelText("Net score: 4")).toBeInTheDocument();
 expect(screen.queryByRole("button")).not.toBeInTheDocument();
 expect(container.querySelector("svg")).toBeNull();
 expect(vote).not.toHaveBeenCalled();
});
it("retains voting controls for another creator’s post", () => {
 render(<MemeVote captionId="other" score={2} vote={1} signedIn own={false}/>);
 expect(screen.getByRole("button", { name: "Upvote meme" })).toHaveAttribute("aria-pressed", "true");
 expect(screen.getByRole("button", { name: "Downvote meme" })).toBeEnabled();
 expect(screen.queryByText("Your post")).not.toBeInTheDocument();
});
