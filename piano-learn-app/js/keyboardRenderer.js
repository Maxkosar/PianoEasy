/**
 * keyboardRenderer.js
 * Dibuja un teclado virtual (2 octavas, C3–B4) con proporciones reales
 * y expone métodos para iluminar teclas (target / correcto / incorrecto).
 */
const KeyboardRenderer = (() => {
  const WHITE_STEPS = ["C", "D", "E", "F", "G", "A", "B"];
  const BLACK_AFTER = { C: "C#", D: "D#", F: "F#", G: "G#", A: "A#" }; // negra tras esta blanca

  let container = null;
  let keyEls = {}; // noteNumber -> element

  function midiFromNameOctave(name, octave) {
    const idx = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"].indexOf(name);
    return (octave + 1) * 12 + idx;
  }

  function render(el, { startOctave = 3, octaves = 2 } = {}) {
    container = el;
    container.innerHTML = "";
    keyEls = {};

    const whiteKeyWidth = 40;
    let whiteIndex = 0;

    for (let o = 0; o < octaves; o++) {
      const octave = startOctave + o;
      WHITE_STEPS.forEach((step) => {
        const midiNum = midiFromNameOctave(step, octave);
        const whiteKey = document.createElement("div");
        whiteKey.className = "key key--white";
        whiteKey.dataset.note = midiNum;
        const label = document.createElement("span");
        label.className = "key__label";
        label.textContent = `${step}${octave}`;
        whiteKey.appendChild(label);
        container.appendChild(whiteKey);
        keyEls[midiNum] = whiteKey;

        if (BLACK_AFTER[step]) {
          const blackName = BLACK_AFTER[step];
          const blackMidi = midiFromNameOctave(blackName, octave);
          const blackKey = document.createElement("div");
          blackKey.className = "key key--black";
          blackKey.dataset.note = blackMidi;
          blackKey.style.left = `${(whiteIndex + 1) * whiteKeyWidth - 12}px`;
          container.appendChild(blackKey);
          keyEls[blackMidi] = blackKey;
        }
        whiteIndex++;
      });
    }
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

  return { render, setTarget, flash, clearStates };
})();
