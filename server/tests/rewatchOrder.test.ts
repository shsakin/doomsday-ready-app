import { describe, expect, it } from "vitest";
import { rewatchOrder } from "../src/algorithms/rewatchOrder.js";

describe("rewatch order", () => {
  it("excludes the target and returns prerequisites in post-order", () => {
    const graph = new Map([
      [8, [7]],
      [7, [6]],
      [6, [4, 5]],
      [4, [3]],
      [3, [1, 2]],
    ]);
    expect(rewatchOrder(graph, 8)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
  it("returns an empty order with no prerequisites", () => {
    expect(rewatchOrder(new Map(), 5)).toEqual([]);
  });
});
