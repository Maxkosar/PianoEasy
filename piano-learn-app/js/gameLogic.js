/**
 * gameLogic.js
 * Nivel 0 — Principiante Absoluto.
 * Ejercicio de 1 a 3 notas con la mano derecha, en Modo Espera:
 * la lección no avanza hasta tocar la nota correcta.
 */
const GameLogic = (() => {
  const SPANISH_NAMES = {
    C: "Do", D: "Re", E: "Mi", F: "Fa", G: "Sol", A: "La", B: "Si",
  };

  // Lección 1: Do–Re–Mi, mano derecha, octava central.
  const LESSON = {
    title: "Lección 1 · Mano derecha",
    notes: [60, 62, 64, 62, 60], // C4 D4 E4 D4 C4
  };

  let cursor = 0;
  let hits = 0;
  let attempts = 0;
  let onAdvance = null;
  let onScoreChange = null;

  function spanishLabel(midiNoteName) {
    const letter = midiNoteName.replace(/[0-9#-]/g, "").charAt(0);
    return SPANISH_NAMES[letter] || midiNoteName;
  }

  function currentTargetNote() {
    return LESSON.notes[cursor];
  }

  function init({ onAdvance: advanceCb, onScoreChange: scoreCb }) {
    onAdvance = advanceCb;
    onScoreChange = scoreCb;
    cursor = 0;
    hits = 0;
    attempts = 0;
    emitAdvance();
  }

  function emitAdvance() {
    const done = cursor >= LESSON.notes.length;
    onAdvance?.({
      done,
      targetNote: done ? null : currentTargetNote(),
      targetLabel: done ? "¡Listo!" : spanishLabel(MidiEngine.midiNoteToPitch(currentTargetNote())),
      progress: cursor / LESSON.notes.length,
      title: LESSON.title,
    });
  }

  /** Devuelve 'correct' | 'wrong' | null (si ya terminó la lección) */
  function submitNote(noteNumber) {
    if (cursor >= LESSON.notes.length) return null;
    attempts++;
    const target = currentTargetNote();
    const result = noteNumber === target ? "correct" : "wrong";
    if (result === "correct") {
      hits++;
      cursor++;
    }
    onScoreChange?.({ hits, attempts });
    if (result === "correct") {
      // Modo Espera: pequeña pausa antes de mostrar la próxima nota.
      setTimeout(emitAdvance, 450);
    }
    return result;
  }

  return { init, submitNote, currentTargetNote };
})();
