import { Fragment, useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "../api";
import type { Movie } from "../types";

export function MoviesView() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [prerequisites, setPrerequisites] = useState<number[]>([]);
  const [toast, setToast] = useState<{ text: string; kind: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function showError(error: unknown, fallback: string) {
    const text = error instanceof ApiError && error.code === "CIRCULAR_DEPENDENCY"
      ? "Circular dependency detected. The prerequisites were not saved."
      : error instanceof Error
        ? error.message
        : fallback;
    setMessage(text);
    setToast({ text, kind: "error" });
  }

  async function load() {
    setLoading(true);
    try { setMovies(await api<Movie[]>("/api/movies")); }
    catch (error) { showError(error, "Could not load movies."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function addMovie(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setMessage("");
    const form = new FormData(formElement);
    const title = String(form.get("title")).trim();
    try {
      await api<Movie>("/api/movies", {
        method: "POST",
        body: JSON.stringify({
          title: form.get("title"),
          releaseYear: Number(form.get("releaseYear")),
          runtimeMinutes: Number(form.get("runtimeMinutes")),
          prerequisiteIds: [...form.keys()].includes("prerequisite")
            ? form.getAll("prerequisite").map(Number)
            : [],
        }),
      });
      formElement.reset();
      await load();
      setToast({ text: `${title} added.`, kind: "success" });
    } catch (error) {
      showError(error, "Could not add the movie.");
    }
  }

  async function patchMovie(id: number, values: Record<string, unknown>) {
    setMessage("");
    try {
      await api<Movie>(`/api/movies/${id}`, { method: "PATCH", body: JSON.stringify(values) });
      await load();
    } catch (error) {
      showError(error, "Could not update the movie.");
    }
  }

  async function savePrerequisites(movie: Movie) {
    setMessage("");
    try {
      await api<Movie>(`/api/movies/${movie.id}`, {
        method: "PATCH",
        body: JSON.stringify({ prerequisiteIds: prerequisites }),
      });
      await load();
      setEditingId(null);
      setToast({ text: `Prerequisites saved for ${movie.title}.`, kind: "success" });
    } catch (error) {
      showError(error, "Could not update prerequisites.");
    }
  }

  async function deleteMovie(movie: Movie) {
    if (!window.confirm(`Delete "${movie.title}"?`)) return;
    setMessage("");
    try {
      await api<void>(`/api/movies/${movie.id}`, { method: "DELETE" });
      await load();
      setToast({ text: `${movie.title} deleted.`, kind: "success" });
    } catch (error) {
      showError(error, "Could not delete the movie.");
    }
  }

  return (
    <section>
      <h1>Movies</h1>
      {message && <p className="inline-error" role="alert">{message}</p>}
      <form className="card" onSubmit={addMovie}>
        <h2>Add a movie</h2>
        <div className="form-grid">
          <label>Title<input name="title" required maxLength={200} /></label>
          <label>Release year<input name="releaseYear" type="number" min="1900" max="2100" required /></label>
          <label>Runtime (minutes)<input name="runtimeMinutes" type="number" min="1" max="300" required /></label>
        </div>
        <fieldset><legend>Prerequisites</legend>
          <div className="checks">{movies.map((movie) => (
            <label key={movie.id}><input type="checkbox" name="prerequisite" value={movie.id} /> {movie.title}</label>
          ))}</div>
        </fieldset>
        <button type="submit">Add movie</button>
      </form>
      {loading ? <p>Loading movies...</p> : movies.length === 0 ? <p>No movies yet.</p> : (
        <div className="table-wrap"><table>
          <thead><tr><th>Title</th><th>Year</th><th>Runtime</th><th>Watched</th><th></th><th></th></tr></thead>
          <tbody>{movies.map((movie) => (
            <Fragment key={movie.id}>
              <tr key={movie.id}>
                <td>{movie.title}</td><td>{movie.releaseYear}</td><td>{movie.runtimeMinutes} min</td>
                <td><input aria-label={`Watched ${movie.title}`} type="checkbox" checked={movie.watched}
                  onChange={(event) => void patchMovie(movie.id, { watched: event.target.checked })} /></td>
                <td><button className="text-button" type="button" onClick={() => {
                  setEditingId(editingId === movie.id ? null : movie.id);
                  setPrerequisites(movie.prerequisiteIds);
                }}>Edit prerequisites</button></td>
                <td><button className="text-button danger" type="button"
                  onClick={() => void deleteMovie(movie)}>Delete</button></td>
              </tr>
              {editingId === movie.id && (
                <tr key={`${movie.id}-editor`}><td colSpan={6}>
                  <div className="checks">{movies.filter((option) => option.id !== movie.id).map((option) => (
                    <label key={option.id}><input type="checkbox" checked={prerequisites.includes(option.id)}
                      onChange={(event) => setPrerequisites((current) => event.target.checked
                        ? [...current, option.id] : current.filter((id) => id !== option.id))} /> {option.title}</label>
                  ))}</div>
                  <button type="button" onClick={() => void savePrerequisites(movie)}>Save prerequisites</button>
                  <button className="secondary-button" type="button" onClick={() => setEditingId(null)}>Cancel</button>
                </td></tr>
              )}
            </Fragment>
          ))}</tbody>
        </table></div>
      )}
      {toast && <div className={`toast ${toast.kind}`} role={toast.kind === "error" ? "alert" : "status"} aria-live="polite">{toast.text}</div>}
    </section>
  );
}
