import { describe, expect, it } from "vitest";
import { wouldCreateCycle } from "../src/algorithms/cycleDetection.js";

describe("cycle detection", () => {
  it("detects direct and transitive cycles", () => {
    expect(wouldCreateCycle(new Map(), 1, [1])).toBe(true);
    expect(wouldCreateCycle(new Map([[2, [1]]]), 1, [2])).toBe(true);
  });
  it("allows valid diamonds", () => {
    const graph = new Map([[2, [4]], [3, [4]]]);
    expect(wouldCreateCycle(graph, 1, [2, 3])).toBe(false);
  });
});
