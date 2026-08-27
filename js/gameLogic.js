/**
 * gameLogic.js
 * Nivel 0 — Principiante Absoluto.
 * Soporta dos modalidades de aprendizaje:
 *   - 'wait'  → Modo Espera: lección de notas en secuencia, no avanza
 *               hasta tocar la nota correcta (ideal para recién empezar).
 *   - 'free'  → Modo Práctica Libre: sin objetivo ni "errores", muestra
 *               feedback de cualquier nota que toques (ideal para
 *               familiarizarse con el teclado sin presión).
 * El Modo Tiempo Real (con metrónomo/BPM) queda para Nivel 1+, cuando
 * ya hay independencia de manos y noción de ritmo — exigir precisión
 * rítmica antes de eso suele frustrar más de lo que ayuda.
 */
const GameLogic = (() => {
  const SPANISH_NAMES = {
    C: "Do", D: "Re", E: "Mi", F: "Fa", G: "Sol", A: "La", B: "Si",
  };

  // Lección 1 (Modo Espera): Do–Re–Mi, mano derecha, octava central.
  const LESSON = {
    title: "Lección 1 · Mano derecha",
    notes: [60, 62, 64, 62, 60], // C4 D4 E4 D4 C4
  };

  let mode = "wait";
  let cursor = 0;
  let hits = 0;
  let attempts = 0;
  let freeNotesPlayed = 0;

  let onAdvance = null;
  let onScoreChange = null;

  function spanishLabel(midiNoteName) {
    const letter = midiNoteName.replace(/[0-9#-]/g, "").charAt(0);
    return SPANISH_NAMES[letter] || midiNoteName;
  }

  function currentTargetNote() {
    return mode === "wait" && cursor < LESSON.notes.length ? LESSON.notes[cursor] : null;
  }

  function resetWait() {
    cursor = 0;
    hits = 0;
    attempts = 0;
  }

  function resetFree() {
    freeNotesPlayed = 0;
  }

  function emitState() {
    if (mode === "wait") {
      const done = cursor >= LESSON.notes.length;
      onAdvance?.({
        mode: "wait",
        done,
        targetNote: done ? null : LESSON.notes[cursor],
        targetLabel: done ? "¡Listo!" : spanishLabel(MidiEngine.midiNoteToPitch(LESSON.notes[cursor])),
        hint: done ? "Lección completa. ¡Muy bien!" : "Tocá la tecla iluminada en tu piano",
        progress: cursor / LESSON.notes.length,
        title: LESSON.title,
      });
    } else {
      onAdvance?.({
        mode: "free",
        done: false,
        targetNote: null,
        targetLabel: "🎹",
        hint: "Explorá el teclado con confianza — acá no hay errores.",
        progress: 0,
        title: "Modo Práctica Libre",
      });
    }
  }

  function init({ onAdvance: advanceCb, onScoreChange: scoreCb }) {
    onAdvance = advanceCb;
    onScoreChange = scoreCb;
    resetWait();
    emitState();
  }

  function setMode(newMode) {
    if (newMode !== "wait" && newMode !== "free") return;
    if (newMode === mode) return;
    mode = newMode;
    if (mode === "wait") resetWait();
    else resetFree();
    emitState();
  }

  /**
   * Procesa una nota tocada. Devuelve:
   *   { result: 'correct' | 'wrong', noteNumber }  en Modo Espera
   *   { result: 'free', noteNumber, label }         en Modo Libre
   *   null si no corresponde reaccionar (ej. lección ya terminada)
   */
  function submitNote(noteNumber) {
    if (mode === "wait") {
      if (cursor >= LESSON.notes.length) return null;
      attempts++;
      const target = LESSON.notes[cursor];
      const result = noteNumber === target ? "correct" : "wrong";
      if (result === "correct") {
        hits++;
        cursor++;
      }
      onScoreChange?.({ mode: "wait", hits, attempts });
      if (result === "correct") {
        // Pequeña pausa antes de mostrar la próxima nota (Modo Espera real).
        setTimeout(emitState, 450);
      }
      return { result, noteNumber };
    }

    // Modo Libre: toda nota es válida, solo se informa.
    freeNotesPlayed++;
    onScoreChange?.({ mode: "free", count: freeNotesPlayed });
    return { result: "free", noteNumber, label: spanishLabel(MidiEngine.midiNoteToPitch(noteNumber)) };
  }

  return { init, setMode, submitNote, currentTargetNote, getMode: () => mode };
})();
