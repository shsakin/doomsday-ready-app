import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "../api";
import type { Cinema } from "../types";

type Quote = { possible: true; groupSize: number; totalBundles: number; breakdown: Array<{ size: number; count: number }> }
  | { possible: false; groupSize: number; message: string };

export function BookingView() {
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [cinemaId, setCinemaId] = useState("");
  const [groupSize, setGroupSize] = useState("6");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ text: string; kind: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function showError(caught: unknown, fallback: string) {
    const text = caught instanceof Error ? caught.message : fallback;
    setError(text);
    setToast({ text, kind: "error" });
  }

  async function loadCinemas(selectId?: number) {
    try {
      const result = await api<Cinema[]>("/api/cinemas");
      setCinemas(result);
      if (selectId) setCinemaId(String(selectId));
      else if (result[0]) setCinemaId(String(result[0].id));
    } catch (caught) {
      showError(caught, "Could not load cinemas.");
    }
  }

  useEffect(() => { void loadCinemas(); }, []);

  async function createCinema(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      setError("");
      const formElement = event.currentTarget;
      const form = new FormData(formElement);
      const name = String(form.get("name")).trim();
      const rawSizes = String(form.get("bundleSizes"));
      const bundleSizes = rawSizes.split(/[,\s]+/)
        .map((value) => value.trim())
        .filter(Boolean)
        .map(Number);

      if (!name) {
        showError(null, "Cinema name is required.");
        return;
      }
      if (bundleSizes.length < 1 || bundleSizes.length > 10) {
        showError(null, "Enter between 1 and 10 different bundle sizes.");
        return;
      }
      if (bundleSizes.some((size) => !Number.isInteger(size) || size < 1 || size > 500)) {
        showError(null, "Bundle sizes must be integers from 1 to 500.");
        return;
      }
      if (new Set(bundleSizes).size !== bundleSizes.length) {
        showError(null, "Bundle sizes must be distinct.");
        return;
      }

      try {
        const cinema = await api<Cinema>("/api/cinemas", {
          method: "POST",
          body: JSON.stringify({ name, bundleSizes }),
        });
        formElement.reset();
        await loadCinemas(cinema.id);
        setToast({ text: `${cinema.name} created.`, kind: "success" });
      } catch (caught) {
        if (caught instanceof ApiError && caught.code === "DUPLICATE_NAME") {
          showError(caught, "A cinema with that name already exists.");
        } else {
          showError(caught, "Could not create the cinema.");
        }
      }
  }

  async function getQuote(event: FormEvent) {
    event.preventDefault();
    setError("");
    const size = Number(groupSize);
    if (!Number.isInteger(size) || size < 1 || size > 10000) {
      showError(null, "Group size must be an integer from 1 to 10,000.");
      return;
    }
    try { setQuote(await api<Quote>(`/api/cinemas/${cinemaId}/booking?groupSize=${size}`)); }
    catch (caught) { showError(caught, "Could not get a quote."); }
  }

  async function deleteCinema() {
    if (!cinema) return;
    if (!window.confirm(`Delete "${cinema.name}"?`)) return;
    setError("");
    try {
      await api<void>(`/api/cinemas/${cinema.id}`, { method: "DELETE" });
      setQuote(null);
      await loadCinemas();
      setToast({ text: `${cinema.name} deleted.`, kind: "success" });
    } catch (caught) {
      showError(caught, "Could not delete the cinema.");
    }
  }

  const cinema = cinemas.find((item) => String(item.id) === cinemaId);
  return (
    <section>
      <h1>Booking</h1>
      <form className="card" onSubmit={createCinema}>
        <h2>Create a cinema</h2>
        <label>Cinema name<input name="name" required maxLength={200} placeholder="Cinema E" /></label>
        <label>Bundle sizes
          <input name="bundleSizes" required placeholder="2, 5" />
        </label>
        <p className="field-help">Enter 1–10 distinct sizes, each from 1 to 500 seats.</p>
        <button type="submit">Create cinema</button>
      </form>
      <form className="card" onSubmit={getQuote}>
        <div className="cinema-select-row">
          <label>Cinema<select value={cinemaId} onChange={(event) => {
            setCinemaId(event.target.value);
            setQuote(null);
          }}>
            {cinemas.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select></label>
          {cinema && <button className="danger-button" type="button" onClick={() => void deleteCinema()}>
            Delete cinema
          </button>}
        </div>
        {cinema && <p>Bundle sizes: {cinema.bundleSizes.join(", ")}</p>}
        <label>Group size<input type="number" min="1" max="10000" value={groupSize}
          onChange={(event) => setGroupSize(event.target.value)} /></label>
        <button type="submit">Get quote</button>
      </form>
      {error && <p className="inline-error" role="alert">{error}</p>}
      {quote && (quote.possible
        ? <div className="card result"><h2>{quote.totalBundles} bundles total</h2>
          <p>{quote.breakdown.map((item) => `${item.size} × ${item.count}`).join(", ")}</p></div>
        : <p>Not possible with these bundle sizes.</p>)}
      {toast && <div className={`toast ${toast.kind}`} role={toast.kind === "error" ? "alert" : "status"} aria-live={toast.kind === "error" ? "assertive" : "polite"}>{toast.text}</div>}
    </section>
  );
}
