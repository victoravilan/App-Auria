import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import EmotionPuzzle from "./components/EmotionPuzzle";

function PuzzlePreview() {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 px-4 py-4 pb-8">
      <EmotionPuzzle />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PuzzlePreview />
  </StrictMode>
);
