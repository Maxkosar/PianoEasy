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

  const keySizeSelect = document.getElementById("keySizeSelect");
  const keyCountCustom = document.getElementById("keyCountCustom");
  const applyKeyboardSize = document.getElementById("applyKeyboardSize");
  const keyboardAutoNote = document.getElementById("keyboardAutoNote");
  const keyboardEl = document.getElementById("keyboard");

  let userChoseSize = false; // true en cuanto el usuario toca los controles a mano

  function currentTargetOrNull() {
    const note = GameLogic.currentTargetNote?.();
    return typeof note === "number" ? note : null;
  }

  function renderKeyboardForCount(count) {
    const range = KeyboardRenderer.rangeForKeyCount(count);
    KeyboardRenderer.render(keyboardEl, range);
    const target = currentTargetOrNull();
    if (target !== null && KeyboardRenderer.inRange(target)) {
      KeyboardRenderer.setTarget(target);
    }
  }

  // --- Controles de tamaño de teclado ---
  keySizeSelect.addEventListener("change", () => {
    keyCountCustom.style.display = keySizeSelect.value === "custom" ? "inline-block" : "none";
  });

  applyKeyboardSize.addEventListener("click", () => {
    userChoseSize = true;
    keyboardAutoNote.textContent = "";
    const count =
      keySizeSelect.value === "custom"
        ? parseInt(keyCountCustom.value, 10) || 61
        : parseInt(keySizeSelect.value, 10);
    renderKeyboardForCount(count);
  });

  // Render inicial con el valor por defecto del select (61 teclas).
  renderKeyboardForCount(parseInt(keySizeSelect.value, 10));

  function maybeAutoSizeFromDevice(deviceName) {
    if (userChoseSize) return; // el usuario ya eligió a mano, no lo pisamos
    const preset = KeyboardRenderer.presetForDeviceName(deviceName);
    if (!preset) return;
    keySizeSelect.value = String(preset);
    keyCountCustom.style.display = "none";
    renderKeyboardForCount(preset);
    keyboardAutoNote.textContent =
      `Detectamos "${deviceName}" y ajustamos a ${preset} teclas automáticamente ` +
      `(Web MIDI no permite leer la cantidad real de teclas del hardware — esto es una ` +
      `estimación por nombre de dispositivo). Cambiala arriba si no es correcta.`;
  }

  function setStatus(state, deviceName) {
    statusPill.dataset.state = state;
    const messages = {
      searching: "Buscando piano MIDI por cable…",
      connected: `Conectado por cable: ${deviceName}`,
      error: "No se pudo acceder a MIDI",
      unsupported: "Este navegador no soporta Web MIDI",
    };
    statusText.textContent = messages[state] || "";

    if (state === "connected") {
      deviceLabel.textContent = deviceName;
      deviceSub.textContent = "Tocá las teclas iluminadas en color latón.";
      maybeAutoSizeFromDevice(deviceName);
    } else if (state === "unsupported") {
      deviceLabel.textContent = "No soportado";
      deviceSub.textContent = "Probá con Chrome o Edge en escritorio/Android.";
    } else {
      deviceLabel.textContent = "Sin conexión";
      deviceSub.textContent = "Conectá tu Roland FP-30X por cable USB.";
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
