import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { moviesRouter } from "./routes/movies.js";
import { cinemasRouter } from "./routes/cinemas.js";
import { AppError, isDuplicateError } from "./errors.js";

export function createApp() {
  const app = express();

  app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(",").map((origin) => origin.trim()) ?? true,
  }));
  app.use(express.json());

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.use("/api/movies", moviesRouter);
  app.use("/api/cinemas", cinemasRouter);

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    if (error instanceof AppError) {
      response.status(error.status).json({
        error: { code: error.code, message: error.message, details: error.details },
      });
      return;
    }
    const duplicate = isDuplicateError(error);
    if (duplicate.indexName) {
      const code = duplicate.indexName.includes("title")
        ? "DUPLICATE_TITLE"
        : duplicate.indexName.includes("name")
          ? "DUPLICATE_NAME"
          : "INTERNAL_ERROR";
      if (code !== "INTERNAL_ERROR") {
        response.status(409).json({ error: { code, message: "A conflicting record already exists." } });
        return;
      }
    }
    console.error(error);
    response.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Unexpected server error." } });
  });

  return app;
}
