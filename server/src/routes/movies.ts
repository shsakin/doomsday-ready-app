import { Router } from "express";
import { AppError, isDuplicateError } from "../errors.js";
import { validateMovieCreate, validateMoviePatch } from "../validation/movieValidation.js";
import * as service from "../services/movieService.js";

export const moviesRouter = Router();

function numericId(value: string) {
  if (!/^[1-9]\d*$/.test(value)) throw new AppError("VALIDATION_ERROR", 400, "ID must be a positive integer.");
  return Number(value);
}

moviesRouter.post("/", async (request, response) => {
  response.status(201).json(await service.createMovie(validateMovieCreate(request.body)));
});

moviesRouter.get("/", async (_request, response) => {
  response.json(await service.listMovies());
});

moviesRouter.get("/:id", async (request, response) => {
  response.json(await service.getMovie(numericId(request.params.id)));
});

moviesRouter.patch("/:id", async (request, response) => {
  response.json(await service.updateMovie(numericId(request.params.id), validateMoviePatch(request.body)));
});

moviesRouter.delete("/:id", async (request, response) => {
  await service.deleteMovie(numericId(request.params.id));
  response.status(204).send();
});

moviesRouter.get("/:id/rewatch-order", async (request, response) => {
  response.json(await service.getRewatchOrder(numericId(request.params.id)));
});
