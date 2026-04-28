import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RecommendationCard } from "../RecommendationCard";
import React from "react";
import type { Recommendation } from "../../utils/recommendations";

const mockRecommendation: Recommendation = {
  id: "1",
  type: "progress_update",
  title: "Test Title",
  message: "Test Message",
  severity: "info",
  timestamp: new Date().toISOString(),
  action: "Test Action",
};

describe("RecommendationCard", () => {
  it("renders recommendation details", () => {
    render(<RecommendationCard recommendation={mockRecommendation} />);
    expect(screen.getByText(/Test Title/i)).toBeDefined();
    expect(screen.getByText(/Test Message/i)).toBeDefined();
    expect(screen.getByText(/Test Action/i)).toBeDefined();
  });

  it("calls onDismiss when dismiss button is clicked", () => {
    const onDismiss = vi.fn();
    render(<RecommendationCard recommendation={mockRecommendation} onDismiss={onDismiss} />);
    const button = screen.getByText(/Dismiss/i);
    fireEvent.click(button);
    expect(onDismiss).toHaveBeenCalledWith("1");
  });
});
