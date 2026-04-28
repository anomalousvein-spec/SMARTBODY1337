import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AlertBanner } from "../AlertBanner";
import React from "react";

describe("AlertBanner", () => {
  it("renders the message", () => {
    render(<AlertBanner type="info" message="Test Message" />);
    expect(screen.getByText(/Test Message/i)).toBeDefined();
  });

  it("calls onDismiss when close button is clicked", () => {
    const onDismiss = vi.fn();
    render(<AlertBanner type="critical" message="Error" onDismiss={onDismiss} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(onDismiss).toHaveBeenCalled();
  });
});
