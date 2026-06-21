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
  { id: "starter", name: "Classic Blue",  pl: "Klasyczny Niebieski", shell: "#3a7bff", stripe: "#ffffff", unlockScore: 0 },
  { id: "lime",    name: "Lime Lid",      pl: "Limonkowa Pokrywka", shell: "#7ed321", stripe: "#2b3a00", unlockScore: 800 },
  { id: "flame",   name: "Flame Helmet",  pl: "Płomienny Kask", shell: "#ff5a3c", stripe: "#ffd93b", unlockScore: 2000 },
  { id: "galaxy",  name: "Galaxy Dome",   pl: "Galaktyczna Kopuła", shell: "#7b4cff", stripe: "#b9f2ff", unlockScore: 4000 },
  { id: "gold",    name: "Golden Guard",  pl: "Złota Ochrona", shell: "#ffc83d", stripe: "#7a4a00", unlockScore: 7000 },
  { id: "mint",    name: "Mint Shell",    pl: "Miętowa Skorupa", shell: "#3ddc97", stripe: "#06402b", unlockScore: 9500 },
  { id: "candy",   name: "Candy Pop",     pl: "Cukierkowy Pop", shell: "#ff7eb6", stripe: "#ffffff", unlockScore: 12000 },
  { id: "shadow",  name: "Shadow Helmet", pl: "Kask Cienia", shell: "#3a3f55", stripe: "#9be7ff", unlockScore: 15000 },
  { id: "rainbow", name: "Rainbow Rider", pl: "Tęczowy Rajder", shell: "#ff5a3c", stripe: "#3a7bff", unlockScore: 20000 },
];

const BOARDS = [
  { id: "maple",  name: "Maple Deck",   pl: "Klonowy Deck", deck: "#e0a44a", wheels: "#fff4d6", unlockScore: 0 },
  { id: "teal",   name: "Teal Cruiser", pl: "Turkusowy Cruiser", deck: "#1fb3a6", wheels: "#062e2a", unlockScore: 1200 },
  { id: "pink",   name: "Pink Pop",     pl: "Różowy Pop", deck: "#ff7eb6", wheels: "#3a0e25", unlockScore: 3000 },
  { id: "carbon", name: "Carbon Pro",   pl: "Karbon Pro", deck: "#2d2d3a", wheels: "#9be7ff", unlockScore: 5500 },
  { id: "lava",   name: "Lava Deck",    pl: "Lawowy Deck", deck: "#ff5a3c", wheels: "#ffd93b", unlockScore: 8000 },
  { id: "galaxy", name: "Galaxy Glide", pl: "Galaktyczny Ślizg", deck: "#5b3fb8", wheels: "#b9f2ff", unlockScore: 11000 },
  { id: "neon",   name: "Neon Night",   pl: "Neonowa Noc", deck: "#0f1630", wheels: "#3ddc97", unlockScore: 14000 },
  { id: "goldb",  name: "Gold Rush",    pl: "Złota Gorączka", deck: "#ffc83d", wheels: "#7a4a00", unlockScore: 18000 },
];

// Friendly fact cards shown between levels (light, never preachy).
const FACTS = [
  { en: "Helmets prevent most serious head injuries. Gear up!", pl: "Kaski pomagają chronić głowę. Zakładaj sprzęt!" },
  { en: "Pro skaters wear helmets and pads — that's how they skate every day.", pl: "Profesjonalni skaterzy noszą kaski i ochraniacze — dzięki temu mogą jeździć codziennie." },
  { en: "A good landing starts with good timing. Watch the glowing ring!", pl: "Dobre lądowanie zaczyna się od dobrego wyczucia czasu. Patrz na świecący pierścień!" },
  { en: "Wrist guards and knee pads help too. Safe skaters skate longer.", pl: "Ochraniacze na nadgarstki i kolana też pomagają. Bezpieczni skaterzy jeżdżą dłużej." },
  { en: "Falling is part of skating — gear turns a big fall into a small one.", pl: "Upadki są częścią jazdy — ochraniacze zmieniają duży upadek w mały." },
];

window.HELMETS = HELMETS;
window.BOARDS = BOARDS;
window.FACTS = FACTS;
