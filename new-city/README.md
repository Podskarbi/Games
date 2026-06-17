# New City — Build a Voxel Town 🏙️✨

A kid-friendly browser game for Hania and Wojtek. You make a sparkly **K-pop
demon-hunter idol**, then use your super-strong hands to smash old houses, sweep
up the rubble, build brand-new homes block by block (Minecraft-style), and
decorate them. Idol neighbours move in, and the whole city glows through a
gentle day-and-night cycle. There's **no way to lose** — everything is undoable
and cheerful.

## How to play

1. **Make your idol.** Pick hair, jacket, bottoms, boots, a prop, your face, fun
   extras and a glowing aura. Tap **Surprise Me!** for a random look, type an
   idol name, then **Done →**.
2. **Smash.** Tap the blocks of the house to pop them off with your super hands.
3. **Sweep.** Tap the leftover rubble until the lot is 100% clean.
4. **Build.** Pick a block type (floor, wall, window, door, roof) and tap the
   glowing grid to stack it. Tap a placed block to take it off. In a hurry? Tap
   **🏠 Quick House**. Then **Done →**.
5. **Decorate.** Choose a room (kitchen, bathroom, bedroom, living room), tap to
   place furniture, and use the colour swatches to paint walls, floor or the
   furniture. Then **Move in! →**.
6. **Move in.** A new idol neighbour walks up, waves, and the home lights up with
   confetti. Tap **Next lot →** to grow the city with the next house.

At night the windows glow warm yellow, streetlights switch on, and stars come
out. Tap **🔊** to mute, **❓** for a hint.

**Controls:** drag to spin the camera, scroll / pinch to zoom, tap to act.
Works with a mouse on desktop and with touch on a tablet.

## Run it

It's just static files — no build step, no server required.

- **Quickest:** double-click `index.html` to open it in a browser.
- **Or serve it** (nicer on some setups):
  ```
  cd "New City Simulation"
  python3 -m http.server 8125
  ```
  then open <http://localhost:8125>.

Three.js is bundled in `vendor/three.min.js`, so the game can run offline and
inside the iOS app bundle.

## Files

```
New City Simulation/
├── index.html      ← loads everything
├── style.css       ← all the colours and layout
└── src/
    ├── data.js     ← wardrobe, colours, blocks, furniture (easy to edit)
    ├── sound.js    ← friendly sound effects (Web Audio, with mute)
    ├── avatar.js   ← the idol creator + 3D voxel character
    ├── world.js    ← the 3D scene, camera, day/night, voxels
    └── game.js     ← the game loop: smash → sweep → build → decorate → move in
```

Same tech and spirit as the other Kids Games: plain HTML + CSS + JavaScript, all
state in memory, no logins, no ads, hostable for free on GitHub Pages.
