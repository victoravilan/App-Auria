import React from 'react';
import ReactDOM from 'react-dom/client';
import EmotionPuzzle from './components/EmotionPuzzle';
import './index.css';

function PuzzlePreview() {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 px-4 py-4 pb-8">
      <EmotionPuzzle />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PuzzlePreview />
  </React.StrictMode>,
);