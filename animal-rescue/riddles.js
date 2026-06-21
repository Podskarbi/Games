/* ============================================================
   RIDDLES — the heart of the game!
   ------------------------------------------------------------
   Hania and Wojtek: you can change these riddles, add new ones,
   or write your own. Just copy the shape below.

   Each riddle has:
     id        - a number, each one different
     riddleText- the riddle the player reads (keep it short!)
     answer    - the main answer (small spelling mistakes are OK)
     accept    - other answers we also say "Correct!" to
     hint      - a gentle clue if the player is stuck
     location  - which spot on the map it lights up
     animal    - which animal you rescue there
     emoji     - the little picture for that animal
     badge     - the sticker you earn
   ============================================================ */

const RIDDLES = [
  {
    id: 1,
    riddleText: "I am hot and yellow and high in the sky.\nI wake up the morning and watch the day go by.\nWhat am I?",
    answer: "sun",
    accept: ["the sun", "sunshine"],
    hint: "Look up on a bright day — it keeps you warm!",
    location: "park",
    animal: "panda",
    emoji: "🐼",
    badge: "Panda Pal",
    pl: {
      riddleText: "Jestem gorące i żółte, wysoko na niebie.\nBudzę poranek i patrzę na dzień.\nCzym jestem?",
      answer: "słońce",
      hint: "Spójrz w górę w jasny dzień — ono cię ogrzewa!",
      location: "park",
      animal: "pandę",
      badge: "Przyjaciel Pandy",
    },
  },
  {
    id: 2,
    riddleText: "Warm and golden, soft to eat,\nThe baker makes me as a treat.\nWith butter on top I taste so sweet.\nWhat am I?",
    answer: "bread",
    accept: ["a loaf", "loaf", "bun", "buns"],
    hint: "You find it fresh and warm at the bakery.",
    location: "bakery",
    animal: "dog",
    emoji: "🐶",
    badge: "Doggo Buddy",
    pl: {
      riddleText: "Ciepły i złoty, miękki do jedzenia,\nPiekarz robi mnie jako smakołyk.\nZ masłem na wierzchu smakuję słodko.\nCzym jestem?",
      answer: "chleb",
      hint: "Znajdziesz mnie świeżego i ciepłego w piekarni.",
      location: "piekarnia",
      animal: "pieska",
      badge: "Kumpel Pieska",
    },
  },
  {
    id: 3,
    riddleText: "I splash and sparkle, cool and clear,\nI jump up high then disappear.\nIn the fountain I dance all day.\nWhat am I?",
    answer: "water",
    accept: ["the water"],
    hint: "It is wet, you drink it, and fish swim in it.",
    location: "fountain",
    animal: "turtle",
    emoji: "🐢",
    badge: "Turtle Friend",
    pl: {
      riddleText: "Pluskam i błyszczę, chłodna i przejrzysta,\nSkaczę wysoko, a potem znikam.\nW fontannie tańczę cały dzień.\nCzym jestem?",
      answer: "woda",
      hint: "Jest mokra, pijesz ją, a ryby w niej pływają.",
      location: "fontanna",
      animal: "żółwia",
      badge: "Przyjaciel Żółwia",
    },
  },
  {
    id: 4,
    riddleText: "I have many pages but I'm not a tree.\nOpen me up and read along with me.\nA story is hiding inside of me!\nWhat am I?",
    answer: "book",
    accept: ["a book", "books", "storybook"],
    hint: "You find lots of these at the library.",
    location: "library",
    animal: "parrot",
    emoji: "🦜",
    badge: "Parrot Pal",
    pl: {
      riddleText: "Mam wiele stron, ale nie jestem drzewem.\nOtwórz mnie i czytaj razem ze mną.\nW środku ukrywa się historia!\nCzym jestem?",
      answer: "książka",
      hint: "Dużo takich znajdziesz w bibliotece.",
      location: "biblioteka",
      animal: "papugę",
      badge: "Przyjaciel Papugi",
    },
  },
  {
    id: 5,
    riddleText: "I am tall and green with leaves on top.\nBirds and squirrels on me hop.\nIn my branches you can climb!\nWhat am I?",
    answer: "tree",
    accept: ["a tree", "trees"],
    hint: "It is tall, has leaves, and you climb it to the treehouse.",
    location: "treehouse",
    animal: "cat",
    emoji: "🐱",
    badge: "Kitty Companion",
    pl: {
      riddleText: "Jestem wysokie i zielone, z liśćmi na górze.\nPtaki i wiewiórki skaczą po mnie.\nPo moich gałęziach można się wspinać!\nCzym jestem?",
      answer: "drzewo",
      hint: "Jest wysokie, ma liście i można się na nie wspinać.",
      location: "domek na drzewie",
      animal: "kotka",
      badge: "Towarzysz Kotka",
    },
  },
  {
    id: 6,
    riddleText: "I have colorful petals and a sweet, sweet smell.\nIn the garden full of bees is where I dwell.\nWhat am I?",
    answer: "flower",
    accept: ["a flower", "flowers", "rose", "tulip"],
    hint: "Bees love me, I am pretty and I grow in the garden.",
    location: "garden",
    animal: "rabbit",
    emoji: "🐰",
    badge: "Bunny Buddy",
    pl: {
      riddleText: "Mam kolorowe płatki i słodki zapach.\nMieszkam w ogrodzie pełnym pszczół.\nCzym jestem?",
      answer: "kwiat",
      hint: "Pszczoły mnie lubią, jestem ładny i rosnę w ogrodzie.",
      location: "ogród",
      animal: "królika",
      badge: "Kumpel Królika",
    },
  },
  {
    id: 7,
    riddleText: "I float on the pond and carry you across.\nWith a paddle or an oar, you'll never get lost.\nWhat am I?",
    answer: "boat",
    accept: ["a boat", "boats", "canoe"],
    hint: "You sit in me to travel on the water at the pond.",
    location: "pond",
    animal: "duck",
    emoji: "🦆",
    badge: "Ducky Pal",
    pl: {
      riddleText: "Pływam po stawie i przewożę cię na drugą stronę.\nZ wiosłem nigdy się nie zgubisz.\nCzym jestem?",
      answer: "łódka",
      hint: "Siedzisz we mnie, gdy płyniesz po wodzie.",
      location: "staw",
      animal: "kaczkę",
      badge: "Przyjaciel Kaczki",
    },
  },
  {
    id: 8,
    riddleText: "I am yellow with holes, a tasty little snack.\nA mouse would love to carry me home in a sack.\nWhat am I?",
    answer: "cheese",
    accept: ["a cheese", "the cheese"],
    hint: "Mice love this yellow food — you find it at the market.",
    location: "market",
    animal: "mouse",
    emoji: "🐭",
    badge: "Mouse Mate",
    pl: {
      riddleText: "Jestem żółty i mam dziurki, pyszna przekąska.\nMyszka chętnie zabrałaby mnie do domu.\nCzym jestem?",
      answer: "ser",
      hint: "Myszy uwielbiają to żółte jedzenie — znajdziesz je na targu.",
      location: "targ",
      animal: "myszkę",
      badge: "Kolega Myszki",
    },
  },
  {
    id: 9,
    riddleText: "I am green in the summer and red when leaves fall.\nI flutter to the ground from a tree so tall.\nWhat am I?",
    answer: "leaf",
    accept: ["a leaf", "leaves", "leafs"],
    hint: "I grow on trees and you rake piles of me in the forest.",
    location: "forest",
    animal: "hedgehog",
    emoji: "🦔",
    badge: "Hedgehog Hero",
    pl: {
      riddleText: "Latem jestem zielony, a jesienią czerwony.\nSpadam z wysokiego drzewa na ziemię.\nCzym jestem?",
      answer: "liść",
      hint: "Rosnę na drzewach, a jesienią grabisz mnie w kopce.",
      location: "las",
      animal: "jeża",
      badge: "Bohater Jeża",
    },
  },
  {
    id: 10,
    riddleText: "I glow at night, high up in the sky.\nRound and white as the clouds drift by.\nWhat am I?",
    answer: "moon",
    accept: ["the moon", "full moon"],
    hint: "You see me at night when it is dark — an owl hoots beneath me on the hill.",
    location: "hill",
    animal: "owl",
    emoji: "🦉",
    badge: "Owl Friend",
    pl: {
      riddleText: "Świecę nocą, wysoko na niebie.\nJestem okrągły i biały, gdy chmury płyną obok.\nCzym jestem?",
      answer: "księżyc",
      hint: "Widzisz mnie nocą, gdy jest ciemno.",
      location: "wzgórze",
      animal: "sowę",
      badge: "Przyjaciel Sowy",
    },
  },
];

// Make the riddles available to game.js
window.RIDDLES = RIDDLES;
