import { asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/db.js";
import { movies, moviePrerequisites } from "../db/schema.js";
import { AppError, isDuplicateError } from "../errors.js";
import { wouldCreateCycle } from "../algorithms/cycleDetection.js";
import { rewatchOrder } from "../algorithms/rewatchOrder.js";
import type { MovieCreateInput } from "../validation/movieValidation.js";

type MovieRow = typeof movies.$inferSelect;

async function loadPrerequisiteIds(movieIds: number[]) {
  if (movieIds.length === 0) return new Map<number, number[]>();
  const rows = await db.select()
    .from(moviePrerequisites)
    .where(inArray(moviePrerequisites.movieId, movieIds));
  const result = new Map<number, number[]>();
  for (const row of rows) result.set(row.movieId, [...(result.get(row.movieId) ?? []), row.prerequisiteId]);
  return result;
}

async function mapMovie(row: MovieRow): Promise<MovieRow & { prerequisiteIds: number[] }> {
  const links = await db.select({ prerequisiteId: moviePrerequisites.prerequisiteId })
    .from(moviePrerequisites)
    .where(eq(moviePrerequisites.movieId, row.id));
  return { ...row, prerequisiteIds: links.map((link) => link.prerequisiteId).sort((a, b) => a - b) };
}

function duplicateTitle(error: unknown): never {
  const duplicate = isDuplicateError(error);
  if (duplicate.indexName?.includes("title")) {
    throw new AppError("DUPLICATE_TITLE", 409, "A movie with that title already exists.");
  }
  throw error;
}

export async function createMovie(input: MovieCreateInput) {
  try {
    return await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(1)`);
      if (input.prerequisiteIds.length > 0) {
        const found = await tx.select({ id: movies.id }).from(movies)
          .where(inArray(movies.id, input.prerequisiteIds));
        const missing = input.prerequisiteIds.filter((id) => !found.some((row) => row.id === id));
        if (missing.length > 0) throw new AppError("VALIDATION_ERROR", 400, "One or more prerequisite movies do not exist.", { missingIds: missing });
      }
      const [row] = await tx.insert(movies).values({
        title: input.title,
        releaseYear: input.releaseYear,
        runtimeMinutes: input.runtimeMinutes,
        watched: input.watched,
      }).returning();
      if (input.prerequisiteIds.length > 0) {
        await tx.insert(moviePrerequisites).values(
          input.prerequisiteIds.map((prerequisiteId) => ({ movieId: row.id, prerequisiteId })),
        );
      }
      return mapMovie(row);
    });
  } catch (error) {
    duplicateTitle(error);
  }
}

export async function listMovies() {
  const rows = await db.select().from(movies).orderBy(asc(movies.releaseYear), asc(movies.id));
  return Promise.all(rows.map(mapMovie));
}

export async function getMovie(id: number) {
  const [row] = await db.select().from(movies).where(eq(movies.id, id)).limit(1);
  if (!row) throw new AppError("NOT_FOUND", 404, "Movie not found.");
  return mapMovie(row);
}

export async function updateMovie(id: number, input: Partial<MovieCreateInput>) {
  try {
    return await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(1)`);
      const [existing] = await tx.select().from(movies).where(eq(movies.id, id)).limit(1);
      if (!existing) throw new AppError("NOT_FOUND", 404, "Movie not found.");

      if (input.prerequisiteIds) {
        const found = input.prerequisiteIds.length === 0 ? [] : await tx.select({ id: movies.id }).from(movies)
          .where(inArray(movies.id, input.prerequisiteIds));
        const missing = input.prerequisiteIds.filter((prerequisiteId) => !found.some((row) => row.id === prerequisiteId));
        if (missing.length > 0) {
          throw new AppError("VALIDATION_ERROR", 400, "One or more prerequisite movies do not exist.", { missingIds: missing });
        }
        const allRows = await tx.select({ id: movies.id }).from(movies);
        const links = await tx.select().from(moviePrerequisites);
        const prereqMap = new Map<number, number[]>();
        for (const row of links) prereqMap.set(row.movieId, [...(prereqMap.get(row.movieId) ?? []), row.prerequisiteId]);
        if (wouldCreateCycle(prereqMap, id, input.prerequisiteIds)) {
          throw new AppError("CIRCULAR_DEPENDENCY", 409, "That prerequisite change would create a dependency loop.");
        }
      }

      const values: Partial<typeof movies.$inferInsert> = {};
      if (input.title !== undefined) values.title = input.title;
      if (input.releaseYear !== undefined) values.releaseYear = input.releaseYear;
      if (input.runtimeMinutes !== undefined) values.runtimeMinutes = input.runtimeMinutes;
      if (input.watched !== undefined) values.watched = input.watched;
      const [row] = Object.keys(values).length === 0
        ? [existing]
        : await tx.update(movies).set(values).where(eq(movies.id, id)).returning();

      if (input.prerequisiteIds !== undefined) {
        await tx.delete(moviePrerequisites).where(eq(moviePrerequisites.movieId, id));
        if (input.prerequisiteIds.length > 0) {
          await tx.insert(moviePrerequisites).values(
            input.prerequisiteIds.map((prerequisiteId) => ({ movieId: id, prerequisiteId })),
          );
        }
      }
      return mapMovie(row);
    });
  } catch (error) {
    duplicateTitle(error);
  }
}

export async function deleteMovie(id: number) {
  const [row] = await db.delete(movies).where(eq(movies.id, id)).returning({ id: movies.id });
  if (!row) throw new AppError("NOT_FOUND", 404, "Movie not found.");
}

export async function getRewatchOrder(id: number) {
  const [target] = await db.select().from(movies).where(eq(movies.id, id)).limit(1);
  if (!target) throw new AppError("NOT_FOUND", 404, "Movie not found.");
  const allMovieIds = await db.select({ id: movies.id }).from(movies);
  const prerequisiteMap = await loadPrerequisiteIds(allMovieIds.map((row) => row.id));
  const orderedIds = rewatchOrder(prerequisiteMap, id);
  if (orderedIds.length === 0) {
    return {
      target: { id: target.id, title: target.title },
      order: [],
      totalCount: 0,
      watchedCount: 0,
      remainingRuntimeMinutes: 0,
    };
  }
  const rows = await db.select().from(movies).where(inArray(movies.id, orderedIds));
  const byId = new Map(rows.map((row) => [row.id, row]));
  const order = orderedIds.map((movieId) => byId.get(movieId)).filter((row): row is MovieRow => Boolean(row));
  return {
    target: { id: target.id, title: target.title },
    order: order.map((row) => ({
      id: row.id,
      title: row.title,
      releaseYear: row.releaseYear,
      runtimeMinutes: row.runtimeMinutes,
      watched: row.watched,
    })),
    totalCount: order.length,
    watchedCount: order.filter((row) => row.watched).length,
    remainingRuntimeMinutes: order.filter((row) => !row.watched).reduce((sum, row) => sum + row.runtimeMinutes, 0),
  };
}
