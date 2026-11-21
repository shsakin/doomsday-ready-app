export function rewatchOrder(prereqMap: Map<number, number[]>, targetId: number): number[] {
  const result: number[] = [];
  const visited = new Set<number>([targetId]);
  const stack: Array<{ node: number; nextChildIndex: number }> = [{ node: targetId, nextChildIndex: 0 }];

  while (stack.length > 0) {
    const frame = stack[stack.length - 1];
    const children = [...(prereqMap.get(frame.node) ?? [])].sort((a, b) => a - b);
    if (frame.nextChildIndex < children.length) {
      const child = children[frame.nextChildIndex];
      frame.nextChildIndex += 1;
      if (!visited.has(child)) {
        visited.add(child);
        stack.push({ node: child, nextChildIndex: 0 });
      }
    } else {
      stack.pop();
      if (frame.node !== targetId) result.push(frame.node);
    }
  }
  return result;
}
