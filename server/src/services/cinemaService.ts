import { asc, eq, inArray } from "drizzle-orm";
import { db } from "../db/db.js";
import { cinemas, cinemaBundleSizes } from "../db/schema.js";
import { AppError, isDuplicateError } from "../errors.js";
import { bookingQuote } from "../algorithms/bookingQuote.js";

async function mapCinema(row: typeof cinemas.$inferSelect) {
  const sizes = await db.select({ size: cinemaBundleSizes.size })
    .from(cinemaBundleSizes)
    .where(eq(cinemaBundleSizes.cinemaId, row.id))
    .orderBy(asc(cinemaBundleSizes.size));
  return { id: row.id, name: row.name, bundleSizes: sizes.map((row) => row.size) };
}

export async function createCinema(input: { name: string; bundleSizes: number[] }) {
  try {
    return await db.transaction(async (tx) => {
      const [row] = await tx.insert(cinemas).values({ name: input.name }).returning();
      await tx.insert(cinemaBundleSizes).values(
        input.bundleSizes.map((size) => ({ cinemaId: row.id, size })),
      );
      const sizes = await tx.select({ size: cinemaBundleSizes.size })
        .from(cinemaBundleSizes)
        .where(eq(cinemaBundleSizes.cinemaId, row.id))
        .orderBy(asc(cinemaBundleSizes.size));
      return { id: row.id, name: row.name, bundleSizes: sizes.map((row) => row.size) };
    });
  } catch (error) {
    if (isDuplicateError(error).indexName?.includes("name")) {
      throw new AppError("DUPLICATE_NAME", 409, "A cinema with that name already exists.");
    }
    throw error;
  }
}

export async function listCinemas() {
  const rows = await db.select().from(cinemas).orderBy(asc(cinemas.id));
  return Promise.all(rows.map(mapCinema));
}

export async function getCinema(id: number) {
  const [row] = await db.select().from(cinemas).where(eq(cinemas.id, id)).limit(1);
  if (!row) throw new AppError("NOT_FOUND", 404, "Cinema not found.");
  return mapCinema(row);
}

export async function getBookingQuote(id: number, groupSize: number) {
  const cinema = await getCinema(id);
  return bookingQuote(cinema.bundleSizes, groupSize);
}

export async function deleteCinema(id: number) {
  const [row] = await db.delete(cinemas).where(eq(cinemas.id, id)).returning({ id: cinemas.id });
  if (!row) throw new AppError("NOT_FOUND", 404, "Cinema not found.");
}
