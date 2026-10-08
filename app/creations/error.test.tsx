import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import CreationError from "./error";

it("keeps private failure details hidden and lets the user retry the editor", () => {
 let attempts = 0;
 render(<CreationError error={new Error("private prompt and database details")} retry={() => { attempts++; }}/>);
 expect(screen.queryByText(/private prompt and database details/)).not.toBeInTheDocument();
 expect(screen.getByRole("alert")).toBeInTheDocument();
 fireEvent.click(screen.getByRole("button", { name: "Try again" }));
 expect(attempts).toBe(1);
 expect(screen.getByRole("link", { name: "My creations" })).toHaveAttribute("href", "/creations");
});
