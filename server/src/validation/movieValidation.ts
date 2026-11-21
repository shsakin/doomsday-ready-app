import { AppError } from "../errors.js";

export type MovieCreateInput = {
  title: string;
  releaseYear: number;
  runtimeMinutes: number;
  watched: boolean;
  prerequisiteIds: number[];
};

function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

function validateTitle(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError("VALIDATION_ERROR", 400, "Title is required.");
  }
  const title = value.trim();
  if (title.length > 200) {
    throw new AppError("VALIDATION_ERROR", 400, "Title must be at most 200 characters.");
  }
  return title;
}

export function validateMovieCreate(body: unknown): MovieCreateInput {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError("VALIDATION_ERROR", 400, "Request body must be an object.");
  }
  const input = body as Record<string, unknown>;
  const releaseYear = input.releaseYear;
  const runtimeMinutes = input.runtimeMinutes;
  if (!isInteger(releaseYear) || releaseYear < 1900 || releaseYear > 2100) {
    throw new AppError("VALIDATION_ERROR", 400, "releaseYear must be an integer from 1900 to 2100.");
  }
  if (!isInteger(runtimeMinutes) || runtimeMinutes < 1 || runtimeMinutes > 300) {
    throw new AppError("VALIDATION_ERROR", 400, "runtimeMinutes must be an integer from 1 to 300.");
  }
  if (input.watched !== undefined && typeof input.watched !== "boolean") {
    throw new AppError("VALIDATION_ERROR", 400, "watched must be a boolean.");
  }
  if (input.prerequisiteIds !== undefined
    && (!Array.isArray(input.prerequisiteIds)
      || input.prerequisiteIds.some((id) => !isInteger(id)))) {
    throw new AppError("VALIDATION_ERROR", 400, "prerequisiteIds must be an array of integers.");
  }
  const prerequisiteIds = Array.from(new Set((input.prerequisiteIds as number[] | undefined) ?? []));
  return {
    title: validateTitle(input.title),
    releaseYear,
    runtimeMinutes,
    watched: input.watched as boolean | undefined ?? false,
    prerequisiteIds,
  };
}

export function validateMoviePatch(body: unknown): Partial<MovieCreateInput> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError("VALIDATION_ERROR", 400, "Request body must be an object.");
  }
  const input = body as Record<string, unknown>;
  const output: Partial<MovieCreateInput> = {};
  if ("title" in input) output.title = validateTitle(input.title);
  if ("releaseYear" in input) {
    if (!isInteger(input.releaseYear) || input.releaseYear < 1900 || input.releaseYear > 2100) {
      throw new AppError("VALIDATION_ERROR", 400, "releaseYear must be an integer from 1900 to 2100.");
    }
    output.releaseYear = input.releaseYear;
  }
  if ("runtimeMinutes" in input) {
    if (!isInteger(input.runtimeMinutes) || input.runtimeMinutes < 1 || input.runtimeMinutes > 300) {
      throw new AppError("VALIDATION_ERROR", 400, "runtimeMinutes must be an integer from 1 to 300.");
    }
    output.runtimeMinutes = input.runtimeMinutes;
  }
  if ("watched" in input) {
    if (typeof input.watched !== "boolean") throw new AppError("VALIDATION_ERROR", 400, "watched must be a boolean.");
    output.watched = input.watched;
  }
  if ("prerequisiteIds" in input) {
    if (!Array.isArray(input.prerequisiteIds) || input.prerequisiteIds.some((id) => !isInteger(id))) {
      throw new AppError("VALIDATION_ERROR", 400, "prerequisiteIds must be an array of integers.");
    }
    output.prerequisiteIds = Array.from(new Set(input.prerequisiteIds as number[]));
  }
  return output;
}
