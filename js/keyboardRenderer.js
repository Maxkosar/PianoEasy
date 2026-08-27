/**
 * keyboardRenderer.js
 * Dibuja un teclado virtual dado un rango de notas MIDI [lowNote, highNote]
 * con proporciones reales de teclas blancas/negras, y expone métodos para
 * iluminar teclas (target / correcto / incorrecto).
 *
 * Nota importante: Web MIDI API no informa cuántas teclas tiene el
 * dispositivo físico conectado (el protocolo no expone esa propiedad).
 * Por eso KEY_COUNT_PRESETS existe: mapea tamaños comerciales estándar
 * a su rango real de notas, y KNOWN_DEVICE_PRESETS asocia el *nombre*
 * de algunos dispositivos conocidos (ej. "FP-30X" = 88 teclas) a un preset,
 * pero siempre es una inferencia, no una lectura directa del hardware.
 */
const KeyboardRenderer = (() => {
  const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const WHITE_SET = new Set(["C", "D", "E", "F", "G", "A", "B"]);

  const WHITE_KEY_WIDTH = 34;
  const BLACK_KEY_WIDTH = 20;

  // Rangos reales de teclados comerciales estándar (nota MIDI baja/alta).
  const KEY_COUNT_PRESETS = {
    25: { low: 48, high: 72, label: "25 teclas · 2 octavas (C3–C5)" },
    37: { low: 36, high: 72, label: "37 teclas · 3 octavas (C2–C5)" },
    49: { low: 36, high: 84, label: "49 teclas · 4 octavas (C2–C6)" },
    61: { low: 36, high: 96, label: "61 teclas · 5 octavas (C2–C7)" },
    76: { low: 28, high: 103, label: "76 teclas (E1–G7)" },
    88: { low: 21, high: 108, label: "88 teclas · piano completo (A0–C8)" },
  };

  // Nombres de dispositivo conocidos → preset a aplicar automáticamente.
  const KNOWN_DEVICE_PRESETS = [{ pattern: /FP-30X/i, keyCount: 88 }];

  let container = null;
  let keyEls = {}; // noteNumber -> element
  let currentRange = { low: 36, high: 96 };

  function noteLabel(noteNumber) {
    return `${NOTE_NAMES[noteNumber % 12]}${Math.floor(noteNumber / 12) - 1}`;
  }

  function rangeForKeyCount(count) {
    if (KEY_COUNT_PRESETS[count]) return KEY_COUNT_PRESETS[count];
    // Cantidad personalizada: arranca en C3 hacia arriba.
    const low = 48;
    return { low, high: low + Math.max(1, count) - 1, label: `${count} teclas (personalizado)` };
  }

  function presetForDeviceName(name) {
    if (!name) return null;
    const match = KNOWN_DEVICE_PRESETS.find((d) => d.pattern.test(name));
    return match ? match.keyCount : null;
  }

  function render(el, { low, high } = {}) {
    container = el;
    container.innerHTML = "";
    keyEls = {};
    currentRange = { low, high };

    let whiteCount = 0;
    const fragment = document.createDocumentFragment();

    for (let n = low; n <= high; n++) {
      const name = NOTE_NAMES[n % 12];
      if (WHITE_SET.has(name)) {
        const key = document.createElement("div");
        key.className = "key key--white";
        key.dataset.note = n;
        const label = document.createElement("span");
        label.className = "key__label";
        label.textContent = noteLabel(n);
        key.appendChild(label);
        fragment.appendChild(key);
        keyEls[n] = key;
        whiteCount++;
      } else {
        const key = document.createElement("div");
        key.className = "key key--black";
        key.dataset.note = n;
        key.style.left = `${whiteCount * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2}px`;
        fragment.appendChild(key);
        keyEls[n] = key;
      }
    }

    container.style.width = `${whiteCount * WHITE_KEY_WIDTH}px`;
    container.appendChild(fragment);
  }

  function clearStates() {
    Object.values(keyEls).forEach((k) =>
      k.classList.remove("key--target", "key--correct", "key--wrong")
    );
  }

  function setTarget(noteNumber) {
    clearStates();
    keyEls[noteNumber]?.classList.add("key--target");
  }

  function flash(noteNumber, state) {
    // state: 'correct' | 'wrong'
    const el = keyEls[noteNumber];
    if (!el) return;
    el.classList.remove("key--target");
    el.classList.add(state === "correct" ? "key--correct" : "key--wrong");
  }

  function inRange(noteNumber) {
    return noteNumber >= currentRange.low && noteNumber <= currentRange.high;
  }

  /** Limpia el estado visual de una sola tecla (para feedback nota a nota, ej. Modo Libre). */
  function clearKey(noteNumber) {
    keyEls[noteNumber]?.classList.remove("key--target", "key--correct", "key--wrong");
  }

  return {
    render,
    setTarget,
    flash,
    clearStates,
    clearKey,
    inRange,
    rangeForKeyCount,
    presetForDeviceName,
    KEY_COUNT_PRESETS,
  };
})();
