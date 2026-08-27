# PianoLearn Web App — MVP Nivel 0 (entrada MIDI)

Primera base funcional del proyecto descripto en el PRD: 100% front-end estático,
lista para GitHub Pages.

## Qué incluye esta versión

- **`js/midiEngine.js`** — Web MIDI API. Detecta automáticamente el Roland FP-30X
  (o cualquier dispositivo con "Roland"/"Bluetooth" en el nombre; si no encuentra
  ninguno reconocible, usa el primer dispositivo MIDI disponible) y reacciona a
  reconexiones en caliente.
- **`js/keyboardRenderer.js`** — teclado virtual de 2 octavas (C3–B4) con
  proporciones reales de teclas blancas y negras.
- **`js/gameLogic.js`** — Nivel 0: lección de 5 notas (Do-Re-Mi-Re-Do) en Modo
  Espera — no avanza hasta que tocás la nota correcta.
- **`js/app.js`** — conecta todo lo anterior con la interfaz.
- **`css/styles.css`** — identidad visual "ébano / marfil / latón", tipografía
  Fraunces + Inter + IBM Plex Mono.

## Cómo probarlo

1. Conectá el Roland FP-30X por USB o emparejalo por Bluetooth MIDI con tu compu/tablet.
2. Abrí `index.html` en **Chrome o Edge** (Web MIDI no funciona en Safari/Firefox
   sin flags). Podés simplemente abrir el archivo o servirlo con:
   ```bash
   npx serve .
   ```
3. El navegador va a pedir permiso de acceso MIDI — aceptalo.
4. La barra superior debería mostrar "Conectado: FP-30X..." y la tecla objetivo
   se ilumina en color latón. Tocala en el piano físico: se pone verde si es
   correcta, roja si no.

> Si abrís el archivo directo con `file://`, algunos navegadores restringen
> `navigator.requestMIDIAccess`. Si el estado queda en "Buscando…" indefinidamente,
> probá con un servidor local (`npx serve .` o la extensión Live Server).

## Qué falta (siguientes fases, según el PRD)

- Modo Micrófono (Web Audio API + Pitchy/Aubio.js/ml5.js) como entrada alternativa.
- `sheetRenderer.js` con VexFlow/OSMD para el Gran Pentagrama (Nivel 1 y 2).
- Modo Tiempo Real (metrónomo/BPM) y Modo Práctica Libre.
- Carga de lecciones/canciones desde `assets/songs/*.json` en vez de hardcodear
  la lección en `gameLogic.js`.
- Persistencia de progreso (localStorage, ya que no hay backend).

## Estructura

```
piano-learn-app/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── midiEngine.js
│   ├── keyboardRenderer.js
│   └── gameLogic.js
└── assets/
    └── songs/          (vacío por ahora)
```
