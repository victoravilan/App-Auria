import { useMemo, useState } from "react";

type Gender = "h" | "m";
type Phase = "challenge" | "review";
type HistoryItem = {
  id: number;
  emotion: string;
  gender: Gender;
  correct: boolean;
  selected: number;
  points: number;
};

interface EmotionRound {
  id: string;
  label: string;
  prompt: string;
  image: Partial<Record<Gender, string>>;
  faceVideo: Record<Gender, string>;
  muscleVideo: Record<Gender, string>;
  correct: string[];
  muscleInfo: Record<string, string>;
  clue: string;
  explanation: string;
}

const MAX_SELECTIONS = 3;

const MUSCLES = [
  "Frontal",
  "Corrugador superciliar",
  "Orbicular de los ojos",
  "Cigomatico mayor",
  "Elevador del labio superior",
  "Orbicular de los labios",
  "Depresor del angulo de la boca",
  "Platisma",
  "Mentoniano",
];

const ASSETS_BASE = "";

const ROUNDS: EmotionRound[] = [
  {
    id: "feliz",
    label: "Alegria",
    prompt: "La comisura sube y los ojos se estrechan.",
    image: {
      m: `${ASSETS_BASE}/images/mujer-sonrie.PNG`,
    },
    faceVideo: {
      h: `${ASSETS_BASE}/videos/h-rostro-feliz.webm`,
      m: `${ASSETS_BASE}/videos/m-rostro-feliz.webm`,
    },
    muscleVideo: {
      h: `${ASSETS_BASE}/videos/h-musculo-feliz.webm`,
      m: `${ASSETS_BASE}/videos/m-musculo-feliz.webm`,
    },
    correct: ["Cigomatico mayor", "Orbicular de los ojos"],
    muscleInfo: {
      "Cigomatico mayor": "Eleva la comisura de los labios y dibuja la sonrisa.",
      "Orbicular de los ojos": "Estrecha los parpados y marca la sonrisa intensa alrededor de la mirada.",
    },
    clue: "Busca elevacion lateral de la boca y tension alrededor de los parpados.",
    explanation:
      "La sonrisa activa sobre todo el cigomatico mayor. Cuando es intensa o genuina tambien participa el orbicular de los ojos.",
  },
  {
    id: "ira",
    label: "Ira",
    prompt: "Las cejas bajan, la mirada se fija y la boca se tensa.",
    image: {
      h: `${ASSETS_BASE}/images/hombre-ira.PNG`,
      m: `${ASSETS_BASE}/images/mujer-ira.PNG`,
    },
    faceVideo: {
      h: `${ASSETS_BASE}/videos/h-rostro-ira.webm`,
      m: `${ASSETS_BASE}/videos/m-rostro-ira.webm`,
    },
    muscleVideo: {
      h: `${ASSETS_BASE}/videos/h-musculo-ira.webm`,
      m: `${ASSETS_BASE}/videos/m-musculo-ira.webm`,
    },
    correct: ["Corrugador superciliar", "Orbicular de los labios", "Platisma"],
    muscleInfo: {
      "Corrugador superciliar": "Aproxima y baja las cejas, creando las arrugas verticales del entrecejo.",
      "Orbicular de los labios": "Comprime la boca y aumenta la sensacion de tension.",
      "Platisma": "Tensa la zona superficial del cuello y refuerza el gesto de amenaza o esfuerzo.",
    },
    clue: "Observa la contraccion medial de las cejas y la compresion de los labios.",
    explanation:
      "La ira suele combinar tension frontal baja, cejas aproximadas y cierre fuerte de boca. Por eso intervienen corrugador, orbicular de labios y cuello superficial.",
  },
  {
    id: "tristeza",
    label: "Tristeza",
    prompt: "La expresion cae hacia abajo y se pierde tono en la mirada.",
    image: {
      h: `${ASSETS_BASE}/images/hombre-triste.PNG`,
      m: `${ASSETS_BASE}/images/mujer-triste.PNG`,
    },
    faceVideo: {
      h: `${ASSETS_BASE}/videos/h-rostro-tristeza.webm`,
      m: `${ASSETS_BASE}/videos/m-rostro-tristeza.webm`,
    },
    muscleVideo: {
      h: `${ASSETS_BASE}/videos/h-musculo-tristeza.webm`,
      m: `${ASSETS_BASE}/videos/m-musculo-tristeza.webm`,
    },
    correct: ["Depresor del angulo de la boca", "Mentoniano", "Orbicular de los ojos"],
    muscleInfo: {
      "Depresor del angulo de la boca": "Lleva las comisuras hacia abajo y construye la caida del gesto.",
      "Mentoniano": "Eleva y arruga el menton, visible cuando la expresion se contrae.",
      "Orbicular de los ojos": "Aporta cierre y perdida de apertura en la mirada.",
    },
    clue: "Fijate en las comisuras descendidas y la tension suave del menton.",
    explanation:
      "La tristeza se lee en la caida de comisuras, el menton y la zona orbitaria. El gesto no depende de un solo musculo.",
  },
  {
    id: "asombro",
    label: "Asombro",
    prompt: "Los ojos se abren y las cejas se elevan.",
    image: {
      h: `${ASSETS_BASE}/images/hombre-sonrie.PNG`,
      m: `${ASSETS_BASE}/images/mujer-asombro.PNG`,
    },
    faceVideo: {
      h: `${ASSETS_BASE}/videos/h-rostro-asombro.webm`,
      m: `${ASSETS_BASE}/videos/m-rostro-asombro.webm`,
    },
    muscleVideo: {
      h: `${ASSETS_BASE}/videos/h-musculo-asombro.webm`,
      m: `${ASSETS_BASE}/videos/m-musculo-asombro.webm`,
    },
    correct: ["Frontal", "Orbicular de los ojos", "Elevador del labio superior"],
    muscleInfo: {
      "Frontal": "Eleva las cejas y abre la parte superior del rostro.",
      "Orbicular de los ojos": "Modula la apertura de los parpados durante la sorpresa.",
      "Elevador del labio superior": "Ayuda a abrir la zona superior de la boca.",
    },
    clue: "Busca apertura ocular, elevacion de cejas y apertura superior de la boca.",
    explanation:
      "El asombro usa elevacion frontal y apertura facial. La zona ocular y el labio superior ayudan a ampliar la expresion.",
  },
];

function sameSet(a: string[], b: string[]) {
  return a.length === b.length && a.every(item => b.includes(item));
}

function randomGender(): Gender {
  return Math.random() > 0.5 ? "h" : "m";
}

function shuffledRoundIndexes(avoidFirst?: number) {
  const indexes = ROUNDS.map((_, index) => index);
  for (let i = indexes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
  }
  if (avoidFirst !== undefined && indexes.length > 1 && indexes[0] === avoidFirst) {
    const swapIndex = 1 + Math.floor(Math.random() * (indexes.length - 1));
    [indexes[0], indexes[swapIndex]] = [indexes[swapIndex], indexes[0]];
  }
  return indexes;
}

export default function EmotionPuzzle() {
  const [gender, setGender] = useState<Gender>(() => randomGender());
  const [roundOrder, setRoundOrder] = useState<number[]>(() => shuffledRoundIndexes());
  const [roundPosition, setRoundPosition] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>("challenge");
  const [showMotion, setShowMotion] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answered, setAnswered] = useState<Record<string, boolean>>({});
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [lastPoints, setLastPoints] = useState(0);

  const roundIndex = roundOrder[roundPosition] ?? 0;
  const round = ROUNDS[roundIndex];
  const stillImage = round.image[gender];
  const usesVideoAsPrompt = !stillImage;
  const isCorrect = useMemo(() => sameSet(selected, round.correct), [round.correct, selected]);
  const progress = Object.keys(answered).length;

  const toggleMuscle = (muscle: string) => {
    if (phase === "review") return;
    setSelected(prev =>
      prev.includes(muscle)
        ? prev.filter(item => item !== muscle)
        : prev.length >= MAX_SELECTIONS
          ? prev
          : [...prev, muscle]
    );
  };

  const check = () => {
    if (selected.length === 0) return;
    const ok = sameSet(selected, round.correct);
    const points = ok ? 100 : Math.max(20, 60 - Math.abs(selected.length - round.correct.length) * 10);
    setPhase("review");
    setShowMotion(false);
    setAnswered(prev => ({ ...prev, [round.id]: ok }));
    setScore(prev => prev + points);
    setLastPoints(points);
    setStreak(prev => (ok ? prev + 1 : 0));
    setHistory(prev => [
      {
        id: Date.now(),
        emotion: round.label,
        gender,
        correct: ok,
        selected: selected.length,
        points,
      },
      ...prev,
    ].slice(0, 8));
  };

  const next = () => {
    setRoundPosition(prev => {
      if (prev + 1 < roundOrder.length) return prev + 1;
      setRoundOrder(shuffledRoundIndexes());
      return 0;
    });
    setSelected([]);
    setPhase("challenge");
    setShowMotion(false);
  };

  const reset = () => {
    setRoundOrder(shuffledRoundIndexes(roundIndex));
    setRoundPosition(0);
    setGender(randomGender());
    setSelected([]);
    setPhase("challenge");
    setShowMotion(false);
    setScore(0);
    setStreak(0);
    setAnswered({});
    setLastPoints(0);
    setHistory([]);
  };

  return (
    <div className="flex flex-col gap-4">
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 ring-1 ring-white/10">
        <img
          src={`${ASSETS_BASE}/images/rostro musculos hombre-mujer.PNG`}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="relative bg-gradient-to-b from-slate-950/40 to-slate-950 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold leading-tight">Puzzle de emociones</h2>
              <p className="mt-1 text-sm text-white/65">Reconoce los musculos que construyen cada gesto.</p>
            </div>
            <div className="rounded-2xl bg-sky-500/15 px-3 py-2 text-center ring-1 ring-sky-300/20">
              <div className="text-lg font-black">{score}</div>
              <div className="text-[10px] uppercase text-white/50">puntos</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2 rounded-2xl bg-white/5 p-1 ring-1 ring-white/10">
        <button
          onClick={() => { setGender("h"); setShowMotion(false); }}
          className={`rounded-xl px-3 py-2 text-sm font-bold transition ${gender === "h" ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20" : "text-white/60"}`}
        >
          Hombre
        </button>
        <button
          onClick={() => { setGender("m"); setShowMotion(false); }}
          className={`rounded-xl px-3 py-2 text-sm font-bold transition ${gender === "m" ? "bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/20" : "text-white/60"}`}
        >
          Mujer
        </button>
      </section>

      <section className="overflow-hidden rounded-3xl bg-black ring-1 ring-white/10">
        {showMotion || usesVideoAsPrompt ? (
          <video
            key={`${round.id}-${gender}-face`}
            src={round.faceVideo[gender]}
            poster={stillImage}
            className="aspect-square w-full object-cover"
            controls={showMotion}
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <img
            src={stillImage}
            alt={`${round.label} ${gender === "h" ? "hombre" : "mujer"}`}
            className="aspect-square w-full object-cover"
          />
        )}
      </section>

      <section className="glass rounded-3xl p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-sky-300">Desafio {roundPosition + 1}/{ROUNDS.length}</div>
            <h3 className="mt-1 text-2xl font-black leading-tight">{round.label}</h3>
            <p className="mt-1 text-sm text-white/65">{round.prompt}</p>
          </div>
          <button
            onClick={() => setShowMotion(prev => !prev)}
            className="shrink-0 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white ring-1 ring-white/10 active:scale-95"
          >
            {usesVideoAsPrompt ? "Video" : showMotion ? "Imagen" : "Video"}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {MUSCLES.map(muscle => {
            const active = selected.includes(muscle);
            const correct = round.correct.includes(muscle);
            const reveal = phase === "review";
            const stateClass = reveal
              ? correct
                ? "border-emerald-300/60 bg-emerald-400/15 text-emerald-50"
                : active
                  ? "border-rose-300/60 bg-rose-400/15 text-rose-50"
                  : "border-white/10 bg-white/[0.03] text-white/45"
              : active
                ? "border-sky-300/70 bg-sky-500/20 text-white"
                : "border-white/10 bg-white/[0.04] text-white/80";

            return (
              <button
                key={muscle}
                onClick={() => toggleMuscle(muscle)}
                className={`flex min-h-14 items-center justify-between gap-3 rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition active:scale-[0.98] ${stateClass}`}
              >
                <span>{muscle}</span>
                <span className={`grid h-6 w-6 place-items-center rounded-full border text-[11px] ${active || (reveal && correct) ? "border-current" : "border-white/30"}`}>
                  {reveal && correct ? "OK" : active ? "X" : ""}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-2xl bg-sky-400/10 p-3 text-sm leading-relaxed text-sky-50 ring-1 ring-sky-300/20">
          <div className="mb-1 flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-wider text-sky-300">
            <span>Pista anatomica</span>
            <span>{selected.length}/{MAX_SELECTIONS} seleccionadas</span>
          </div>
          <p>{round.clue}</p>
          {selected.length >= MAX_SELECTIONS && phase === "challenge" && (
            <p className="mt-2 text-xs font-semibold text-amber-200">Limite alcanzado: desmarca una opcion para elegir otra.</p>
          )}
        </div>
      </section>

      {phase === "review" && (
        <section className={`rounded-3xl p-4 ring-1 ${isCorrect ? "bg-emerald-500/12 ring-emerald-300/25" : "bg-amber-500/12 ring-amber-300/25"}`}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black">{isCorrect ? "Respuesta correcta" : "Casi. Revisa la activacion"}</h3>
              <p className="mt-1 text-sm text-white/70">{round.explanation}</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-wider text-white/50">+{lastPoints} puntos en este reto</p>
            </div>
            <div className="rounded-2xl bg-black/20 px-3 py-2 text-center">
              <div className="text-lg font-black">{streak}</div>
              <div className="text-[10px] uppercase text-white/50">racha</div>
            </div>
          </div>
          <video
            key={`${round.id}-${gender}-muscle`}
            src={round.muscleVideo[gender]}
            poster={`${ASSETS_BASE}/images/rostro musculos hombre-mujer.PNG`}
            className="aspect-square w-full rounded-2xl object-cover ring-1 ring-white/10"
            controls
            autoPlay
            loop
            muted
            playsInline
          />
          <div className="mt-3 rounded-2xl bg-black/20 p-3 ring-1 ring-white/10">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-white/50">Musculos que construyen el gesto</div>
            <div className="space-y-2">
              {round.correct.map(muscle => (
                <div key={muscle} className="rounded-xl bg-white/5 p-3 text-sm leading-relaxed">
                  <div className="font-bold text-white">{muscle}</div>
                  <div className="mt-1 text-white/65">{round.muscleInfo[muscle]}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="glass rounded-3xl p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-black">Puntuacion</h3>
            <p className="mt-1 text-xs leading-relaxed text-white/55">
              100 puntos si aciertas exactamente. Si fallas, recibes entre 20 y 60 puntos segun lo cerca que estes del numero correcto de musculos.
            </p>
          </div>
          <button
            onClick={reset}
            className="shrink-0 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white/70 ring-1 ring-white/10 active:scale-95"
          >
            Poner a cero
          </button>
        </div>
        {history.length > 0 ? (
          <div className="space-y-2">
            {history.map(item => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 px-3 py-2 text-sm ring-1 ring-white/10">
                <div>
                  <div className="font-bold">{item.emotion} · {item.gender === "h" ? "Hombre" : "Mujer"}</div>
                  <div className="text-xs text-white/45">{item.selected} seleccionadas</div>
                </div>
                <div className={item.correct ? "text-right text-emerald-200" : "text-right text-amber-200"}>
                  <div className="font-black">{item.correct ? "Atino" : "Repasar"}</div>
                  <div className="text-xs">+{item.points}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white/5 p-3 text-sm text-white/50 ring-1 ring-white/10">
            El historial aparecera cuando compruebes tu primera respuesta.
          </div>
        )}
      </section>

      <section className="grid grid-cols-3 gap-2">
        <div className="glass rounded-2xl p-3 text-center">
          <div className="text-lg font-black">{progress}/{ROUNDS.length}</div>
          <div className="text-[10px] uppercase text-white/45">retos</div>
        </div>
        <button
          onClick={phase === "review" ? next : check}
          disabled={phase === "challenge" && selected.length === 0}
          className="col-span-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-3 text-sm font-black shadow-lg shadow-sky-500/25 active:scale-[0.98] disabled:opacity-40"
        >
          {phase === "review" ? "Siguiente reto" : "Comprobar"}
        </button>
      </section>

      <button
        onClick={reset}
        className="rounded-2xl bg-white/5 px-4 py-3 text-sm font-bold text-white/70 ring-1 ring-white/10 active:scale-[0.98]"
      >
        Reiniciar partida
      </button>

      {/* Pie de página con créditos */}
      <div className="mt-8 pb-24 text-center text-[10px] font-medium tracking-wide text-white/30 uppercase">
        Creacion y diseño: Victor M. F. Avilan, Valor Agregado.<br/>Derechos reservados.
      </div>

      {/* Menú de navegación inferior (estilo Auria App) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex h-[68px] max-w-md items-center justify-around bg-[#f8f5f4] text-slate-500 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        <button onClick={() => window.location.assign('../index.html#home')} className="flex h-full w-full flex-col items-center justify-center gap-1 transition-colors hover:text-slate-900">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3V10.5Z"/></svg>
          <span className="text-[10px] font-semibold">Inicio</span>
        </button>
        <button onClick={() => window.location.assign('../index.html#calendar')} className="flex h-full w-full flex-col items-center justify-center gap-1 transition-colors hover:text-slate-900">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 3v4M17 3v4M4 9h16M6 5h12a2 2 0 0 1 2 2v13H4V7a2 2 0 0 1 2-2Z"/></svg>
          <span className="text-[10px] font-semibold">Agenda</span>
        </button>
        <button onClick={() => window.location.assign('../index.html#chat')} className="flex h-full w-full flex-col items-center justify-center gap-1 transition-colors hover:text-slate-900">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 18 3 21V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H5Z"/><path d="M8 9h8M8 13h5"/></svg>
          <span className="text-[10px] font-semibold">Chat</span>
        </button>
        <button onClick={() => window.location.assign('../index.html#care')} className="flex h-full w-full flex-col items-center justify-center gap-1 transition-colors hover:text-slate-900">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s7-4.5 7-11a4 4 0 0 0-7-2.6A4 4 0 0 0 5 10c0 6.5 7 11 7 11Z"/></svg>
          <span className="text-[10px] font-semibold">Cuidado</span>
        </button>
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[#0f172a]">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 3h4v5h5v4h-5v5H8v-5H3V8h5V3Z"/><path d="M17 16h4v5h-4z"/></svg>
          <span className="text-[10px] font-semibold">Juego</span>
        </div>
      </nav>
    </div>
  );
}
