import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ShareButton from "./share-button";

describe("Quip sharing", () => {
 afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
 it("uses the Quip brand in the default native share title", async () => {
  const share = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("navigator", { share });
  render(<ShareButton path="/meme/example"/>);
  fireEvent.click(screen.getByRole("button", { name: "Share meme" }));
  await waitFor(() => expect(share).toHaveBeenCalledWith({ title: "A Quip meme for you", url: `${window.location.origin}/meme/example` }));
  expect(screen.getByRole("status")).toHaveTextContent("Shared");
 });
});
