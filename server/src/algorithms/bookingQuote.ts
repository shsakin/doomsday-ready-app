export type BookingQuote =
  | { possible: true; groupSize: number; totalBundles: number; breakdown: Array<{ size: number; count: number }> }
  | { possible: false; groupSize: number; message: string };

export function bookingQuote(bundleSizes: number[], groupSize: number): BookingQuote {
  const inf = groupSize + 1;
  const best = new Array<number>(groupSize + 1).fill(inf);
  const last = new Array<number>(groupSize + 1).fill(0);
  best[0] = 0;
  const sizes = [...new Set(bundleSizes)].sort((a, b) => a - b);

  for (let seats = 1; seats <= groupSize; seats += 1) {
    for (const size of sizes) {
      if (size <= seats && best[seats - size] + 1 < best[seats]) {
        best[seats] = best[seats - size] + 1;
        last[seats] = size;
      }
    }
  }

  if (best[groupSize] === inf) {
    return { possible: false, groupSize, message: "Not possible with these bundle sizes" };
  }

  const counts = new Map<number, number>();
  let remaining = groupSize;
  while (remaining > 0) {
    const size = last[remaining];
    counts.set(size, (counts.get(size) ?? 0) + 1);
    remaining -= size;
  }
  const breakdown = [...counts.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([size, count]) => ({ size, count }));
  return { possible: true, groupSize, totalBundles: best[groupSize], breakdown };
}
