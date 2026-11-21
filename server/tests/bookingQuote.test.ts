import { describe, expect, it } from "vitest";
import { bookingQuote } from "../src/algorithms/bookingQuote.js";

describe("booking quote", () => {
  it("beats greedy for 1,3,4 at size 6", () => {
    expect(bookingQuote([1, 3, 4], 6)).toMatchObject({ possible: true, totalBundles: 2 });
  });
  it("quotes 2 and 5 at size 11", () => {
    expect(bookingQuote([2, 5], 11)).toMatchObject({ possible: true, totalBundles: 4 });
  });
  it("quotes 6,9,20 at size 44", () => {
    expect(bookingQuote([6, 9, 20], 44)).toMatchObject({ possible: true, totalBundles: 4 });
  });
  it("reports impossible exact totals", () => {
    expect(bookingQuote([4, 6], 7)).toEqual({
      possible: false,
      groupSize: 7,
      message: "Not possible with these bundle sizes",
    });
  });
  it("handles the 10000-seat maximum", () => {
    expect(bookingQuote([499, 500], 10000)).toMatchObject({ possible: true, totalBundles: 20 });
  });
});
