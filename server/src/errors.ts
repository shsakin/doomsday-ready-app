export class AppError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function isDuplicateError(error: unknown): { indexName?: string } {
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current && typeof current === "object"; depth += 1) {
    const record = current as Record<string, unknown>;
    if (record.code === "23505") {
      const constraint = String(record.constraint ?? record.constraintName ?? "");
      return { indexName: constraint };
    }
    current = record.cause;
  }
  return {};
}
