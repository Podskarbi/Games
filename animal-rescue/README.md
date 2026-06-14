# Animal Rescue Adventure 🐾

A kid-friendly riddle game for ages 7–9, built by Hania and Wojtek (with grown-up help).

The animals of the city of **Karandas** have wandered off! Make your hero, then solve
Detective Whiskers' riddles to light up the map, rescue every animal, and earn a badge
for each one. When all five are home, everybody plays together in the sunshine. ☀️

## How to play (on a computer)

Just open `index.html` in a web browser — that's it. No installing anything.

If your browser blocks the game from saving progress when opened directly, run a tiny
local server instead from this folder:

```
python3 -m http.server 8000
```

Then visit **http://localhost:8000** in your browser.

## How to play (on an iPad)

1. Put the game online with GitHub Pages (see the build instructions, section 8).
2. Open the link in Safari.
3. Tap **Share → Add to Home Screen** to get an app icon.

## The files

| File | What it is |
|------|------------|
| `index.html` | The page that loads the game |
| `style.css` | All the colors and layout |
| `game.js` | The game's "brain" (logic) |
| `riddles.js` | **The riddles — easy to edit!** |
| `README.md` | This note |

## Want to add or change a riddle?

Open `riddles.js`. Copy one of the blocks and change the words. Each riddle needs an
`answer`, a `hint`, a `location`, an `animal`, an `emoji`, and a `badge`. The game
accepts small spelling mistakes and ignores CAPITAL letters, so kids don't get stuck.

## Good to know

- **No accounts, no logins, no ads.** Progress saves only on the device.
- Nothing about the child is collected or sent anywhere.
- Single-player — no chat, no strangers.

Made with 🐾 in Karandas.
