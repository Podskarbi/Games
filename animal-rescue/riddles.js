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
  },
];

// Make the riddles available to game.js
window.RIDDLES = RIDDLES;
