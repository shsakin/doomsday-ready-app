export type Movie = {
  id: number;
  title: string;
  releaseYear: number;
  runtimeMinutes: number;
  watched: boolean;
  prerequisiteIds: number[];
};

export type Cinema = { id: number; name: string; bundleSizes: number[] };

export type RewatchOrder = {
  target: { id: number; title: string };
  order: Array<{ id: number; title: string; releaseYear: number; runtimeMinutes: number; watched: boolean }>;
  totalCount: number;
  watchedCount: number;
  remainingRuntimeMinutes: number;
};
