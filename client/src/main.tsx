import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { MoviesView } from "./views/MoviesView";
import { RewatchPlanView } from "./views/RewatchPlanView";
import { BookingView } from "./views/BookingView";
import "./styles.css";

function App() {
  const [view, setView] = useState("movies");
  return (
    <main>
      <nav aria-label="Main navigation">
        {["movies", "rewatch", "booking"].map((item) => (
          <button key={item} className={view === item ? "active" : ""} onClick={() => setView(item)}>
            {item === "rewatch" ? "Rewatch Plan" : item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </nav>
      {view === "movies" && <MoviesView />}
      {view === "rewatch" && <RewatchPlanView />}
      {view === "booking" && <BookingView />}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode><App /></StrictMode>,
);
