/**
 * midiEngine.js
 * Módulo de entrada MIDI (Web MIDI API) — Bluetooth / USB.
 * Optimizado para el Roland FP-30X, pero acepta cualquier dispositivo MIDI.
 *
 * Uso:
 *   MidiEngine.init({
 *     onStatusChange: (state, deviceName) => {...}, // 'searching' | 'connected' | 'error' | 'unsupported'
 *     onNoteOn: (noteNumber, velocity, noteName) => {...},
 *     onNoteOff: (noteNumber, noteName) => {...},
 *   });
 */
const MidiEngine = (() => {
  const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  function midiNoteToPitch(noteNumber) {
    const octave = Math.floor(noteNumber / 12) - 1;
    const name = NOTE_NAMES[noteNumber % 12];
    return `${name}${octave}`;
  }

  let callbacks = {};
  let connectedInput = null;

  function isPreferredDevice(name) {
    if (!name) return false;
    return /FP-30X|Roland|Bluetooth|MIDI/i.test(name);
  }

  function attachInput(input) {
    if (connectedInput) {
      connectedInput.onmidimessage = null;
    }
    connectedInput = input;
    input.onmidimessage = handleMIDIMessage;
    callbacks.onStatusChange?.("connected", input.name);
  }

  function handleMIDIMessage(message) {
    const [status, note, velocity] = message.data;
    const command = status >> 4; // extrae el comando MIDI (nibble alto)

    if (command === 9 && velocity > 0) {
      // Note On
      callbacks.onNoteOn?.(note, velocity, midiNoteToPitch(note));
    } else if (command === 8 || (command === 9 && velocity === 0)) {
      // Note Off (o Note On con velocity 0, equivalente a Note Off)
      callbacks.onNoteOff?.(note, midiNoteToPitch(note));
    }
  }

  function scanInputs(midiAccess) {
    const inputs = Array.from(midiAccess.inputs.values());
    if (inputs.length === 0) {
      callbacks.onStatusChange?.("searching", null);
      return;
    }
    // Preferí un dispositivo reconocible (Roland / Bluetooth); si no, usá el primero disponible.
    const preferred = inputs.find((i) => isPreferredDevice(i.name)) || inputs[0];
    attachInput(preferred);
  }

  function onMIDISuccess(midiAccess) {
    scanInputs(midiAccess);
    // Detecta conexión/desconexión de dispositivos en caliente (ej. reconectar Bluetooth).
    midiAccess.onstatechange = () => scanInputs(midiAccess);
  }

  function onMIDIFail() {
    callbacks.onStatusChange?.("error", null);
  }

  function init(cb) {
    callbacks = cb || {};
    if (!navigator.requestMIDIAccess) {
      console.warn("Web MIDI API no soportada en este navegador.");
      callbacks.onStatusChange?.("unsupported", null);
      return;
    }
    navigator.requestMIDIAccess({ sysex: false }).then(onMIDISuccess, onMIDIFail);
  }

  return { init, midiNoteToPitch };
})();
