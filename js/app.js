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
  const progressTrack = document.getElementById("progressTrack");
  const progressFill = document.getElementById("progressFill");
  const scoreLabel = document.getElementById("scoreLabel");
  const scorePanelTitle = document.getElementById("scorePanelTitle");
  const scorePanelSub = document.getElementById("scorePanelSub");
  const modeLabel = document.getElementById("modeLabel");
  const modeSub = document.getElementById("modeSub");
  const modeSwitch = document.getElementById("modeSwitch");

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

  renderKeyboardForCount(parseInt(keySizeSelect.value, 10));

  function maybeAutoSizeFromDevice(deviceName) {
    if (userChoseSize) return;
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

  // --- Selector de modalidad (Espera / Libre) ---
  modeSwitch.addEventListener("click", (e) => {
    const btn = e.target.closest(".mode-switch__btn");
    if (!btn) return;
    const newMode = btn.dataset.mode;
    modeSwitch.querySelectorAll(".mode-switch__btn").forEach((b) => {
      b.setAttribute("aria-pressed", String(b === btn));
    });
    KeyboardRenderer.clearStates();
    GameLogic.setMode(newMode);
  });

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

  function handleAdvance({ mode, done, targetNote, targetLabel: label, hint, progress, title }) {
    targetRing.dataset.feedback = "";

    if (mode === "wait") {
      lessonEyebrow.textContent = `Nivel 0 · ${title}`;
      progressTrack.style.display = "";
      progressFill.style.width = `${Math.round(progress * 100)}%`;
      modeLabel.textContent = "Modo Espera";
      modeSub.textContent = "La lección se pausa hasta que toques la nota correcta.";
      scorePanelTitle.textContent = "Aciertos";
      scorePanelSub.textContent = "Notas correctas en esta lección.";
      scoreLabel.textContent = "0 / 0";

      if (done) {
        targetLabel.textContent = "🎉";
        targetHint.textContent = hint;
        KeyboardRenderer.clearStates();
        return;
      }
      targetLabel.textContent = label;
      targetHint.textContent = hint;
      KeyboardRenderer.setTarget(targetNote);
    } else {
      lessonEyebrow.textContent = `Nivel 0 · ${title}`;
      progressTrack.style.display = "none";
      modeLabel.textContent = "Modo Libre";
      modeSub.textContent = "Tocá lo que quieras: no hay notas correctas ni incorrectas.";
      scorePanelTitle.textContent = "Notas tocadas";
      scorePanelSub.textContent = "Cantidad de notas que tocaste en esta sesión.";
      scoreLabel.textContent = "0";
      targetLabel.textContent = label;
      targetHint.textContent = hint;
      KeyboardRenderer.clearStates();
    }
  }

  function handleScoreChange(payload) {
    if (payload.mode === "wait") {
      scoreLabel.textContent = `${payload.hits} / ${payload.attempts}`;
    } else {
      scoreLabel.textContent = String(payload.count);
    }
  }

  GameLogic.init({ onAdvance: handleAdvance, onScoreChange: handleScoreChange });

  MidiEngine.init({
    onStatusChange: setStatus,
    onNoteOn: (noteNumber) => {
      const outcome = GameLogic.submitNote(noteNumber);
      if (!outcome) return;

      if (outcome.result === "free") {
        targetLabel.textContent = outcome.label;
        targetHint.textContent = "Explorá el teclado con confianza — acá no hay errores.";
        targetRing.dataset.feedback = "correct";
        KeyboardRenderer.flash(noteNumber, "correct");
        return;
      }

      targetRing.dataset.feedback = outcome.result;
      KeyboardRenderer.flash(noteNumber, outcome.result);
      if (outcome.result === "wrong") {
        setTimeout(() => KeyboardRenderer.setTarget(GameLogic.currentTargetNote()), 350);
      }
    },
    onNoteOff: (noteNumber) => {
      // En Modo Libre, la tecla se apaga apenas soltás la nota (feedback en vivo).
      if (GameLogic.getMode() === "free") {
        KeyboardRenderer.clearKey(noteNumber);
      }
    },
  });
})();
