export type ApiErrorShape = { error: { code: string; message: string; details?: unknown } };

export class ApiError extends Error {
  code: string;
  details?: unknown;
  constructor(shape: ApiErrorShape) {
    super(shape.error.message);
    this.code = shape.error.code;
    this.details = shape.error.details;
  }
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!response.ok) {
    const body = await response.json() as ApiErrorShape;
    throw new ApiError(body);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
