import { sql } from "drizzle-orm";
import {
  pgTable,
  integer,
  text,
  boolean,
  primaryKey,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";

export const movies = pgTable("movies", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: text().notNull(),
  releaseYear: integer("release_year").notNull(),
  runtimeMinutes: integer("runtime_minutes").notNull(),
  watched: boolean().notNull().default(false),
}, (table) => [
  uniqueIndex("movies_title_unique").on(sql`lower(${table.title})`),
  check("movies_release_year_range", sql`${table.releaseYear} BETWEEN 1900 AND 2100`),
  check("movies_runtime_range", sql`${table.runtimeMinutes} BETWEEN 1 AND 300`),
]);

export const moviePrerequisites = pgTable("movie_prerequisites", {
  movieId: integer("movie_id").notNull()
    .references(() => movies.id, { onDelete: "cascade" }),
  prerequisiteId: integer("prerequisite_id").notNull()
    .references(() => movies.id, { onDelete: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.movieId, table.prerequisiteId] }),
  check("no_self_prerequisite", sql`${table.movieId} <> ${table.prerequisiteId}`),
]);

export const cinemas = pgTable("cinemas", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
}, (table) => [
  uniqueIndex("cinemas_name_unique").on(sql`lower(${table.name})`),
]);

export const cinemaBundleSizes = pgTable("cinema_bundle_sizes", {
  cinemaId: integer("cinema_id").notNull()
    .references(() => cinemas.id, { onDelete: "cascade" }),
  size: integer().notNull(),
}, (table) => [
  primaryKey({ columns: [table.cinemaId, table.size] }),
  check("bundle_size_range", sql`${table.size} BETWEEN 1 AND 500`),
]);
