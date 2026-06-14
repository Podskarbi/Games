/* ============================================================
   TRICKS — the moves you can land in Helmet Heroes.
   ------------------------------------------------------------
   Wojtek: add new tricks or change the points here. Each trick:
     id            - a different number for each
     name          - what shows on screen when you land it
     obstacle      - "ramp" or "rail" (where this trick happens)
     timingWindowMs- how forgiving the tap is (bigger = easier)
     points        - points for landing it cleanly
     staminaGain   - stamina you get back (only with helmet ON)
   ============================================================ */

const TRICKS = [
  { id: 1, name: "Ollie",        obstacle: "ramp", timingWindowMs: 360, points: 80,  staminaGain: 7 },
  { id: 2, name: "Kickflip",     obstacle: "ramp", timingWindowMs: 320, points: 120, staminaGain: 8 },
  { id: 3, name: "Heelflip",     obstacle: "ramp", timingWindowMs: 320, points: 120, staminaGain: 8 },
  { id: 4, name: "360 Flip",     obstacle: "ramp", timingWindowMs: 260, points: 180, staminaGain: 10 },
  { id: 5, name: "50-50 Grind",  obstacle: "rail", timingWindowMs: 340, points: 110, staminaGain: 8 },
  { id: 6, name: "Boardslide",   obstacle: "rail", timingWindowMs: 320, points: 130, staminaGain: 9 },
  { id: 7, name: "Nosegrind",    obstacle: "rail", timingWindowMs: 280, points: 160, staminaGain: 10 },
  { id: 8, name: "Tailslide",    obstacle: "rail", timingWindowMs: 280, points: 160, staminaGain: 10 },
  { id: 9,  name: "Pop Shove-it", obstacle: "ramp", timingWindowMs: 340, points: 100, staminaGain: 7 },
  { id: 10, name: "Hardflip",     obstacle: "ramp", timingWindowMs: 250, points: 200, staminaGain: 11 },
  { id: 11, name: "Impossible",   obstacle: "ramp", timingWindowMs: 230, points: 230, staminaGain: 12 },
  { id: 12, name: "Crooked Grind",obstacle: "rail", timingWindowMs: 300, points: 140, staminaGain: 9 },
  { id: 13, name: "Smith Grind",  obstacle: "rail", timingWindowMs: 260, points: 170, staminaGain: 10 },
  { id: 14, name: "Bluntslide",   obstacle: "rail", timingWindowMs: 240, points: 210, staminaGain: 11 },
];

window.TRICKS = TRICKS;
