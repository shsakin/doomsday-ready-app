import { Router } from "express";
import { AppError } from "../errors.js";
import { validateCinemaCreate } from "../validation/cinemaValidation.js";
import * as service from "../services/cinemaService.js";

export const cinemasRouter = Router();

function numericId(value: string) {
  if (!/^[1-9]\d*$/.test(value)) throw new AppError("VALIDATION_ERROR", 400, "ID must be a positive integer.");
  return Number(value);
}

cinemasRouter.post("/", async (request, response) => {
  response.status(201).json(await service.createCinema(validateCinemaCreate(request.body)));
});

cinemasRouter.get("/", async (_request, response) => {
  response.json(await service.listCinemas());
});

cinemasRouter.get("/:id", async (request, response) => {
  response.json(await service.getCinema(numericId(request.params.id)));
});

cinemasRouter.delete("/:id", async (request, response) => {
  await service.deleteCinema(numericId(request.params.id));
  response.status(204).send();
});

cinemasRouter.get("/:id/booking", async (request, response) => {
  const raw = request.query.groupSize;
  if (typeof raw !== "string" || raw.length === 0 || !/^\d+$/.test(raw)) {
    throw new AppError("VALIDATION_ERROR", 400, "groupSize must be an integer from 1 to 10000.");
  }
  const groupSize = Number(raw);
  if (!Number.isInteger(groupSize) || groupSize < 1 || groupSize > 10000) {
    throw new AppError("VALIDATION_ERROR", 400, "groupSize must be an integer from 1 to 10000.");
  }
  response.json(await service.getBookingQuote(numericId(request.params.id), groupSize));
});
