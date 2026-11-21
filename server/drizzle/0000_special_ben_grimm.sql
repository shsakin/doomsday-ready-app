CREATE TABLE "cinema_bundle_sizes" (
	"cinema_id" integer NOT NULL,
	"size" integer NOT NULL,
	CONSTRAINT "cinema_bundle_sizes_cinema_id_size_pk" PRIMARY KEY("cinema_id","size"),
	CONSTRAINT "bundle_size_range" CHECK ("cinema_bundle_sizes"."size" BETWEEN 1 AND 500)
);
--> statement-breakpoint
CREATE TABLE "cinemas" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "cinemas_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "movie_prerequisites" (
	"movie_id" integer NOT NULL,
	"prerequisite_id" integer NOT NULL,
	CONSTRAINT "movie_prerequisites_movie_id_prerequisite_id_pk" PRIMARY KEY("movie_id","prerequisite_id"),
	CONSTRAINT "no_self_prerequisite" CHECK ("movie_prerequisites"."movie_id" <> "movie_prerequisites"."prerequisite_id")
);
--> statement-breakpoint
CREATE TABLE "movies" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "movies_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" text NOT NULL,
	"release_year" integer NOT NULL,
	"runtime_minutes" integer NOT NULL,
	"watched" boolean DEFAULT false NOT NULL,
	CONSTRAINT "movies_release_year_range" CHECK ("movies"."release_year" BETWEEN 1900 AND 2100),
	CONSTRAINT "movies_runtime_range" CHECK ("movies"."runtime_minutes" BETWEEN 1 AND 300)
);
--> statement-breakpoint
ALTER TABLE "cinema_bundle_sizes" ADD CONSTRAINT "cinema_bundle_sizes_cinema_id_cinemas_id_fk" FOREIGN KEY ("cinema_id") REFERENCES "public"."cinemas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_prerequisites" ADD CONSTRAINT "movie_prerequisites_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_prerequisites" ADD CONSTRAINT "movie_prerequisites_prerequisite_id_movies_id_fk" FOREIGN KEY ("prerequisite_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cinemas_name_unique" ON "cinemas" USING btree (lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "movies_title_unique" ON "movies" USING btree (lower("title"));