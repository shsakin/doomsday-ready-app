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

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined
  ?? "/api").replace(/\/$/, "");

function apiUrl(path: string): string {
  if (apiBaseUrl === "/api") return path;
  if (path === "/api") return apiBaseUrl;
  if (path.startsWith("/api/")) {
    return `${apiBaseUrl}${path.slice(4)}`;
  }
  return `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
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
