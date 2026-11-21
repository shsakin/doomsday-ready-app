export function wouldCreateCycle(
  prereqMap: Map<number, number[]>,
  movieId: number,
  proposedPrerequisiteIds: number[],
): boolean {
  if (proposedPrerequisiteIds.includes(movieId)) return true;
  const visited = new Set<number>();
  const stack = [...proposedPrerequisiteIds];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current === undefined) continue;
    if (current === movieId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const prerequisiteId of prereqMap.get(current) ?? []) {
      if (!visited.has(prerequisiteId)) stack.push(prerequisiteId);
    }
  }
  return false;
}
