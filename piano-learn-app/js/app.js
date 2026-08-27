/**
 * app.js
 * Controlador principal: conecta MidiEngine, KeyboardRenderer y GameLogic
 * con el DOM de index.html.
 */
(function () {
  const statusPill = document.getElementById("midiStatus");
  const statusText = statusPill.querySelector(".status-text");
  const deviceLabel = document.getElementById("deviceLabel");
  const deviceSub = document.getElementById("deviceSub");
  const targetLabel = document.getElementById("targetLabel");
  const targetHint = document.getElementById("targetHint");
  const targetRing = document.getElementById("targetRing");
  const lessonEyebrow = document.getElementById("lessonEyebrow");
  const progressFill = document.getElementById("progressFill");
  const scoreLabel = document.getElementById("scoreLabel");

  KeyboardRenderer.render(document.getElementById("keyboard"), {
    startOctave: 3,
    octaves: 2,
  });

  function setStatus(state, deviceName) {
    statusPill.dataset.state = state;
    const messages = {
      searching: "Buscando piano MIDI…",
      connected: `Conectado: ${deviceName}`,
      error: "No se pudo acceder a MIDI",
      unsupported: "Este navegador no soporta Web MIDI",
    };
    statusText.textContent = messages[state] || "";

    if (state === "connected") {
      deviceLabel.textContent = deviceName;
      deviceSub.textContent = "Tocá las teclas iluminadas en color latón.";
    } else if (state === "unsupported") {
      deviceLabel.textContent = "No soportado";
      deviceSub.textContent = "Probá con Chrome o Edge en escritorio/Android.";
    } else {
      deviceLabel.textContent = "Sin conexión";
      deviceSub.textContent = "Conectá tu Roland FP-30X por USB o Bluetooth MIDI.";
    }
  }

  function handleAdvance({ done, targetNote, targetLabel: label, progress, title }) {
    lessonEyebrow.textContent = `Nivel 0 · ${title}`;
    progressFill.style.width = `${Math.round(progress * 100)}%`;
    targetRing.dataset.feedback = "";

    if (done) {
      targetLabel.textContent = "🎉";
      targetHint.textContent = "Lección completa. ¡Muy bien!";
      KeyboardRenderer.clearStates();
      return;
    }
    targetLabel.textContent = label;
    targetHint.textContent = "Tocá la tecla iluminada en tu piano";
    KeyboardRenderer.setTarget(targetNote);
  }

  function handleScoreChange({ hits, attempts }) {
    scoreLabel.textContent = `${hits} / ${attempts}`;
  }

  GameLogic.init({ onAdvance: handleAdvance, onScoreChange: handleScoreChange });

  MidiEngine.init({
    onStatusChange: setStatus,
    onNoteOn: (noteNumber) => {
      const result = GameLogic.submitNote(noteNumber);
      if (!result) return; // lección ya terminada
      targetRing.dataset.feedback = result;
      KeyboardRenderer.flash(noteNumber, result);
      if (result === "wrong") {
        // Vuelve a mostrar el objetivo tras el destello rojo.
        setTimeout(() => KeyboardRenderer.setTarget(GameLogic.currentTargetNote()), 350);
      }
    },
  });
})();
