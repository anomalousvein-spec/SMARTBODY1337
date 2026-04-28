import { describe, it, expect } from "vitest";
import {
  validateWeight,
  validateWaist,
  validateCalories,
  validateMacro,
} from "../utils/validation";

describe("Validation Utils", () => {
  it("validates weight within range", () => {
    expect(validateWeight("150").valid).toBe(true);
    expect(validateWeight("40").valid).toBe(false);
    expect(validateWeight("1100").valid).toBe(false);
    expect(validateWeight("abc").valid).toBe(false);
  });

  it("validates waist within range", () => {
    expect(validateWaist("32").valid).toBe(true);
    expect(validateWaist("15").valid).toBe(false);
    expect(validateWaist("105").valid).toBe(false);
  });

  it("validates calories within range", () => {
    expect(validateCalories("2000").valid).toBe(true);
    expect(validateCalories("400").valid).toBe(false);
    expect(validateCalories("6000").valid).toBe(false);
  });

  it("validates macros within range", () => {
    expect(validateMacro("150", "protein").valid).toBe(true);
    expect(validateMacro("-1", "protein").valid).toBe(false);
    expect(validateMacro("600", "protein").valid).toBe(false);
  });
});
