import { sql } from "drizzle-orm";
import { db, pool } from "./db.js";
import { cinemas, cinemaBundleSizes, movies, moviePrerequisites } from "./schema.js";

const movieSeed = [
  { title: "Iron Man", releaseYear: 2008, runtimeMinutes: 126 },
  { title: "Captain America: The First Avenger", releaseYear: 2011, runtimeMinutes: 124 },
  { title: "The Avengers", releaseYear: 2012, runtimeMinutes: 143 },
  { title: "Captain America: Civil War", releaseYear: 2016, runtimeMinutes: 147 },
  { title: "Thor: Ragnarok", releaseYear: 2017, runtimeMinutes: 130 },
  { title: "Avengers: Infinity War", releaseYear: 2018, runtimeMinutes: 149 },
  { title: "Avengers: Endgame", releaseYear: 2019, runtimeMinutes: 181 },
  { title: "Avengers: Doomsday", releaseYear: 2026, runtimeMinutes: 180 },
] as const;

export async function seedDatabase() {
await db.transaction(async (tx) => {
  for (const movie of movieSeed) {
    await tx.insert(movies).values(movie).onConflictDoNothing();
  }

  const links = [
    ["The Avengers", "Iron Man"],
    ["The Avengers", "Captain America: The First Avenger"],
    ["Captain America: Civil War", "The Avengers"],
    ["Avengers: Infinity War", "Captain America: Civil War"],
    ["Avengers: Infinity War", "Thor: Ragnarok"],
    ["Avengers: Endgame", "Avengers: Infinity War"],
    ["Avengers: Doomsday", "Avengers: Endgame"],
  ] as const;

  for (const [movieTitle, prerequisiteTitle] of links) {
    const movie = await tx.select({ id: movies.id }).from(movies)
      .where(sql`lower(${movies.title}) = lower(${movieTitle})`)
      .limit(1);
    const prerequisite = await tx.select({ id: movies.id }).from(movies)
      .where(sql`lower(${movies.title}) = lower(${prerequisiteTitle})`)
      .limit(1);
    if (movie[0] && prerequisite[0]) {
      await tx.insert(moviePrerequisites).values({
        movieId: movie[0].id,
        prerequisiteId: prerequisite[0].id,
      }).onConflictDoNothing();
    }
  }

  const cinemaSeed = [
    { name: "Cinema A", sizes: [1, 3, 4] },
    { name: "Cinema B", sizes: [2, 5] },
    { name: "Cinema C", sizes: [6, 9, 20] },
    { name: "Cinema D", sizes: [4, 6] },
  ] as const;

  for (const cinema of cinemaSeed) {
    await tx.insert(cinemas).values({ name: cinema.name }).onConflictDoNothing();
    const row = await tx.select({ id: cinemas.id }).from(cinemas)
      .where(sql`lower(${cinemas.name}) = lower(${cinema.name})`)
      .limit(1);
    if (row[0]) {
      for (const size of cinema.sizes) {
        await tx.insert(cinemaBundleSizes).values({
          cinemaId: row[0].id,
          size,
        }).onConflictDoNothing();
      }
    }
  }
});
}

if (process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js")) {
  seedDatabase()
    .then(async () => {
      await pool.end();
      console.log("Seed complete");
    })
    .catch(async (error) => {
      await pool.end();
      throw error;
    });
}
