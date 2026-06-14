# Helmet Heroes — Skate Park 🛹

An auto-skate trick game for ages 9–12 — Wojtek's idea (with grown-up help).

You roll forward by yourself; **tap at the right moment** (when the shrinking ring lines up
with the glowing target) to land tricks. The clever twist: **safe skating is how you win.**
Helmet ON means clean tricks give points *and* stamina, and a slip is just a wobble. Helmet
OFF means a missed trick is a big wipeout — and a police skater starts chasing you. Get caught
and you're **GROUNDED!** Keep your helmet on, build combos, and unlock more gear.

## How to play

- **Tap the screen** (or press **Space**) to land a trick as an obstacle approaches.
- **🪖 Helmet button** (or press **H**) toggles your helmet. Keep it ON to win!
- **Stamina bar** up top: clean tricks raise it, mistakes lower it. Don't hit empty.
- Land tricks in a row for a **combo multiplier** and a **second wind** that refills stamina.
- **⏸** (or **P**) pauses.

## Run it

Open `index.html` in a browser. (If saving is blocked when opened directly, serve the folder
with `python3 -m http.server 8000` and visit http://localhost:8000.)

Live online: https://podskarbi.github.io/Games/helmet-heroes/

## The files

| File | What it is |
|------|------------|
| `index.html` | The page + menus |
| `style.css` | Menu/overlay styling |
| `game.js` | The game loop and skating logic |
| `tricks.js` | **The tricks list — easy to edit** |
| `gear.js` | **Unlockable helmets, boards, and fact cards — easy to edit** |
| `README.md` | This note |

## Add a trick or some gear

- New trick? Copy a block in `tricks.js` and change the name, points, and timing window.
- New helmet or board? Add an entry in `gear.js` with its colors and an `unlockScore`.

## Two design choices made as sensible defaults (tweak with Wojtek)

- **Stamina drain:** mostly trick-driven, plus a *gentle* auto-drain only while the helmet is
  OFF — so the pressure is tied to skating unsafely. (Change `helmetlessDrain` in `game.js`.)
- **Obstacles & parks:** ramps + rails with three rising difficulty levels (instead of separate
  unlockable parks, and no cones/puddles yet). Easy to extend later.

## Good to know

- **No accounts, no logins, no ads.** High score and gear save on the device only.
- The chase and wipeouts are **funny, not scary** — spinning stars and a kazoo "wah-wah."
