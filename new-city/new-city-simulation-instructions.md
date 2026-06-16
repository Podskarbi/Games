# New City — Build a Voxel Town

A kid-friendly browser game by Hania and Wojtek. You make a sparkly **K-pop
demon-hunter idol**, then use your super-strong hands to smash old houses, sweep
up the rubble, build brand-new homes block by block (Minecraft-style), and
decorate them. Idol neighbours move in, and the whole city glows through a
gentle day-and-night cycle. **Nothing can be lost** — everything is undoable and
cheerful.

> **Status: Built ✅ and live.**
> Play it here: **https://podskarbi.github.io/Games/new-city/**
> (It also appears on the games menu at https://podskarbi.github.io/Games/.)

---

## How to play

1. **Make your idol.** Pick hair, jacket, bottoms, boots, a prop, your face,
   fun extras and a glowing aura. Tap **Surprise Me!** for a random look, type an
   idol name, then **Done →**.
2. **Smash.** Tap the blocks of the house to pop them off with your super hands.
   Neighbours' houses ask **permission** first — tap *Ask nicely*, then *Smash time!*
3. **Sweep.** Tap the leftover rubble until the lot is 100% clean.
4. **Build.** Pick a block (floor, wall, window, door, roof) and tap the glowing
   grid to stack it. Tap a placed block to take it off. In a hurry? Tap
   **🏠 Quick House**. Then **Done →**.
5. **Decorate.** The house opens up so you can **see inside**. Choose a room
   (kitchen, bathroom, bedroom, living room), tap the floor to place furniture,
   and use the colour dots to paint walls, floor or furniture. Use the
   **👁 Peeking inside / 🏠 Looking outside** button to switch the view. Then
   **Move in! →**.
6. **Move in.** A new idol neighbour walks up, waves, and the home lights up with
   confetti. Tap **Next lot →** to grow the city with the next house.

At night the windows glow warm yellow, streetlights switch on, and stars come
out. A **step-by-step instruction bar** stays on screen the whole time; tap **❓**
to hide or show it, and **🔊** to mute.

**Controls:** drag to spin the camera, scroll / pinch to zoom, tap to act. Works
with a mouse on desktop and with touch on a tablet.

---

## What's implemented

- **Avatar & wardrobe creator** — hair, stage jacket, bottoms, boots, a cartoony
  prop, face (skin tone / eyes / expression / face gem), multi-select extras
  (arm bands, gloves, choker, earrings, belt) and a glowing **stage aura**. Live
  2D preview, **Surprise Me!**, and an idol name. The same wardrobe data builds
  the NPC neighbours, so the whole city is idols.
- **Demolition** — tap blocks to smash them with poof particles and cartoon
  sounds; ask neighbours' permission before their houses.
- **Clean-up** — tap rubble to sweep it, with a 0→100% progress bar that turns
  the lot into buildable green ground.
- **Build** — a block palette (floor / wall / window / door / roof) that stacks
  on a 5×5 grid, tap-to-place / tap-to-remove, plus a one-tap **Quick House**.
- **Decorate** — kitchen, bathroom, bedroom and living-room furniture, a
  colour/material picker to paint walls, floors and furniture, and an
  **inside/outside view toggle** (the roof lifts and the walls turn see-through
  so little builders can see what they place).
- **Move-in** — the neighbour walks to the door, waves, the windows light up, and
  confetti celebrates. The city grows one house at a time.
- **Day & night** — the sky cycles sun → sunset → night → sunrise (~2.5 min); at
  night windows glow, streetlights turn on and stars appear.
- **Friendly touches** — always-on instructions, a help toggle, a sound mute,
  big tap targets, and no fail states.

---

## Tech (as built)

| Part | Choice |
|------|--------|
| Language | Plain HTML + CSS + JavaScript (vanilla, no build step) |
| 3D world | **Three.js r128** loaded from a CDN; voxel cubes for everything |
| Sound | Web Audio API tones (no audio files), with a mute toggle |
| State | All in memory — no logins, no database, no `localStorage` |
| Hosting | GitHub Pages (free), in the `Podskarbi/Games` repo |

It runs by **opening `index.html` in a browser** (the Three.js CDN needs an
internet connection on first load) — no server required. It also installs to an
iPad Home Screen via Safari → Share → *Add to Home Screen* (a manifest and app
icon are included).

### File structure

```
new-city/
├── index.html              ← loads everything
├── style.css               ← all the colours and layout
├── manifest.webmanifest    ← Add-to-Home-Screen info
├── icon-192.png / icon-512.png / apple-touch-icon.png
├── README.md
└── src/
    ├── data.js   ← wardrobe, colours, blocks, furniture (easy to edit)
    ├── sound.js  ← friendly sound effects (Web Audio, with mute)
    ├── avatar.js ← the idol creator + 3D voxel character
    ├── world.js  ← the 3D scene, camera, day/night, voxels
    └── game.js   ← the loop: smash → sweep → build → decorate → move in
```

Keeping wardrobe, blocks and furniture in `data.js` means new options can be
added without touching the game logic.

---

## Design & tone

- Bright, friendly, rounded voxel art with soft shadows and a cheerful palette.
- Simple, encouraging copy; buttons say exactly what they do.
- **No fail states, no timers, no scary content.** Everything is undoable.
- Big tap targets for little fingers; sound effects with a mute toggle.
- An always-visible instruction line explains the current step in one sentence.

## Content & safety

- **No accounts, no logins, no personal info.** Nothing about the child is
  collected or sent anywhere.
- **No ads and no in-game purchases. No chat.** Single-player only.
- The demon-hunter idol style is **original and "inspired-by"**, never a copy of
  a specific movie or its named characters. All props are cartoony and
  non-violent.

## Nice-to-have ideas (for later)

- A camera/photo button to snap a picture of the finished city.
- A "name your city" screen at the end.
- Rival idol-group neighbours with their own outfits and names.
- Custom maskable icons and a polished splash screen.
