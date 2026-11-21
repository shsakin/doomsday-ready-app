import { useEffect, useState } from "react";
import { api } from "../api";
import type { Movie, RewatchOrder } from "../types";

export function RewatchPlanView() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [targetId, setTargetId] = useState("");
  const [plan, setPlan] = useState<RewatchOrder | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 4000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function showError(caught: unknown, fallback: string) {
    const text = caught instanceof Error ? caught.message : fallback;
    setError(text);
    setToast(text);
  }

  async function loadMovies() {
    try {
      const result = await api<Movie[]>("/api/movies");
      setMovies(result);
      if (!targetId && result.length) setTargetId(String(result[result.length - 1].id));
    } catch (caught) { showError(caught, "Could not load movies."); }
  }

  async function loadPlan(id: string) {
    if (!id) return;
    setError("");
    try { setPlan(await api<RewatchOrder>(`/api/movies/${id}/rewatch-order`)); }
    catch (caught) { showError(caught, "Could not load rewatch plan."); }
  }

  useEffect(() => { void loadMovies(); }, []);
  useEffect(() => { void loadPlan(targetId); }, [targetId]);

  async function toggleWatched(id: number, watched: boolean) {
    try {
      await api(`/api/movies/${id}`, { method: "PATCH", body: JSON.stringify({ watched }) });
      await loadPlan(targetId);
    } catch (caught) {
      showError(caught, "Could not update the watched status.");
    }
  }

  const percent = plan?.totalCount ? Math.round((plan.watchedCount / plan.totalCount) * 100) : 0;
  const hours = Math.floor((plan?.remainingRuntimeMinutes ?? 0) / 60);
  const minutes = (plan?.remainingRuntimeMinutes ?? 0) % 60;

  return (
    <section>
      <h1>Rewatch Plan</h1>
      {error && <p className="inline-error" role="alert">{error}</p>}
      <label>Target movie
        <select value={targetId} onChange={(event) => setTargetId(event.target.value)}>
          {movies.map((movie) => <option key={movie.id} value={movie.id}>{movie.title}</option>)}
        </select>
      </label>
      {plan && <>
        {plan.totalCount === 0 ? <p>Nothing to watch first. This movie has no prerequisites.</p> : (
          <>
            <progress value={plan.watchedCount} max={plan.totalCount} aria-label="Rewatch progress" />
            <p>{plan.watchedCount} of {plan.totalCount} watched · {hours}h {minutes}m remaining</p>
            <ol className="watch-list">{plan.order.map((movie) => (
              <li key={movie.id}>
                <label><input type="checkbox" checked={movie.watched}
                  onChange={(event) => void toggleWatched(movie.id, event.target.checked)} /> {movie.title}
                  <small>{movie.releaseYear} · {movie.runtimeMinutes} min</small></label>
              </li>
            ))}</ol>
          </>
        )}
      </>}
      {toast && <div className="toast error" role="alert" aria-live="assertive">{toast}</div>}
    </section>
  );
}
