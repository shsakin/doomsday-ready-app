import { AppError } from "../errors.js";

export function validateCinemaCreate(body: unknown): { name: string; bundleSizes: number[] } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError("VALIDATION_ERROR", 400, "Request body must be an object.");
  }
  const input = body as Record<string, unknown>;
  if (typeof input.name !== "string" || input.name.trim().length === 0) {
    throw new AppError("VALIDATION_ERROR", 400, "Name is required.");
  }
  const name = input.name.trim();
  if (name.length > 200) throw new AppError("VALIDATION_ERROR", 400, "Name must be at most 200 characters.");
  if (!Array.isArray(input.bundleSizes) || input.bundleSizes.length < 1 || input.bundleSizes.length > 10) {
    throw new AppError("VALIDATION_ERROR", 400, "bundleSizes must contain from 1 to 10 values.");
  }
  if (!input.bundleSizes.every((size) => Number.isInteger(size) && (size as number) >= 1 && (size as number) <= 500)) {
    throw new AppError("VALIDATION_ERROR", 400, "Bundle sizes must be integers from 1 to 500.");
  }
  const bundleSizes = Array.from(new Set(input.bundleSizes as number[])).sort((a, b) => a - b);
  if (bundleSizes.length !== (input.bundleSizes as number[]).length) {
    throw new AppError("VALIDATION_ERROR", 400, "Bundle sizes must be distinct.");
  }
  return { name, bundleSizes };
}
