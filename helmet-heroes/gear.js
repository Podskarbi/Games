/* ============================================================
   GEAR — unlockable helmets and boards.
   ------------------------------------------------------------
   The reward for high scores is SAFETY GEAR — because in this
   game, staying safe is how you win. Each item unlocks once your
   best score reaches "unlockScore". Add your own colors here!

   helmet:  shell = main color, stripe = the racing stripe
   board:   deck  = board color, wheels = wheel color
   ============================================================ */

const HELMETS = [
  { id: "starter", name: "Classic Blue",  shell: "#3a7bff", stripe: "#ffffff", unlockScore: 0 },
  { id: "lime",    name: "Lime Lid",      shell: "#7ed321", stripe: "#2b3a00", unlockScore: 800 },
  { id: "flame",   name: "Flame Helmet",  shell: "#ff5a3c", stripe: "#ffd93b", unlockScore: 2000 },
  { id: "galaxy",  name: "Galaxy Dome",   shell: "#7b4cff", stripe: "#b9f2ff", unlockScore: 4000 },
  { id: "gold",    name: "Golden Guard",  shell: "#ffc83d", stripe: "#7a4a00", unlockScore: 7000 },
];

const BOARDS = [
  { id: "maple",  name: "Maple Deck",   deck: "#e0a44a", wheels: "#fff4d6", unlockScore: 0 },
  { id: "teal",   name: "Teal Cruiser", deck: "#1fb3a6", wheels: "#062e2a", unlockScore: 1200 },
  { id: "pink",   name: "Pink Pop",     deck: "#ff7eb6", wheels: "#3a0e25", unlockScore: 3000 },
  { id: "carbon", name: "Carbon Pro",   deck: "#2d2d3a", wheels: "#9be7ff", unlockScore: 5500 },
];

// Friendly fact cards shown between levels (light, never preachy).
const FACTS = [
  "Helmets prevent most serious head injuries. Gear up!",
  "Pro skaters wear helmets and pads — that's how they skate every day.",
  "A good landing starts with good timing. Watch the glowing ring!",
  "Wrist guards and knee pads help too. Safe skaters skate longer.",
  "Falling is part of skating — gear turns a big fall into a small one.",
];

window.HELMETS = HELMETS;
window.BOARDS = BOARDS;
window.FACTS = FACTS;
