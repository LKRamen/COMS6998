import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Home", () => {
  it("renders Hello world as the root page heading", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Hello world" }),
    ).toBeInTheDocument();
  });
});
