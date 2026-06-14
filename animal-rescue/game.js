/* ============================================================
   Animal Rescue Adventure — game.js (the brain)
   Plain JavaScript. No libraries. Saves to localStorage.
   ============================================================ */

(function () {
  "use strict";

  /* ---------- Saved data ---------- */
  const SAVE_KEY = "animalRescueSave_v1";

  const defaultState = () => ({
    started: false,
    avatar: {
      skin: "#f3c39a",
      hairStyle: "short",
      hairColor: "#5a3a2a",
      shirt: "#ff8fb1",
      face: "happy",
    },
    solved: [],   // riddle ids the player has solved
  });

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return Object.assign(defaultState(), JSON.parse(raw));
    } catch (e) { /* ignore — start fresh */ }
    return defaultState();
  }

  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
    catch (e) { /* storage may be full or blocked; game still works this session */ }
  }

  /* ---------- Option lists for the avatar ---------- */
  const SKINS = ["#ffe0bd", "#f3c39a", "#d99a6c", "#a86b3c", "#7a4a23"];
  const HAIR_COLORS = ["#2b2b2b", "#5a3a2a", "#a8642a", "#e3b34d", "#d94f8a", "#5b8cff"];
  const SHIRTS = ["#ff8fb1", "#b58cff", "#ff9f4a", "#5bd1c0", "#6fc36b", "#ffd93b"];
  const HAIR_STYLES = [
    { id: "short", label: "Short" },
    { id: "long", label: "Long" },
    { id: "puffs", label: "Puffs" },
    { id: "bald", label: "None" },
  ];
  const FACES = [
    { id: "happy", label: "😊" },
    { id: "grin", label: "😁" },
    { id: "cool", label: "😎" },
  ];

  /* ============================================================
     SCREEN NAVIGATION
     ============================================================ */
  const screens = {};
  document.querySelectorAll(".screen").forEach((s) => { screens[s.id.replace("screen-", "")] = s; });

  function show(name) {
    Object.values(screens).forEach((s) => s.classList.remove("active"));
    if (screens[name]) screens[name].classList.add("active");

    // Top bar only appears once the adventure has started, and not on title.
    const topbar = document.getElementById("topbar");
    const showBar = state.started && name !== "title" && name !== "avatar-first";
    topbar.classList.toggle("hidden", !showBar || name === "title");

    if (name === "map") renderMap();
    if (name === "badges") renderBadges();
    if (name === "game") renderRiddle();
    if (name === "ending") runEnding();
    if (name === "avatar") renderAvatar();

    updateRescueCount();
    window.scrollTo(0, 0);
  }

  // Nav buttons (top bar + back buttons)
  document.querySelectorAll("[data-go]").forEach((btn) => {
    btn.addEventListener("click", () => show(btn.dataset.go));
  });

  /* ============================================================
     AVATAR — built from layered SVG shapes (no image files)
     ============================================================ */
  function avatarSVG(a, opts) {
    opts = opts || {};
    const faces = {
      happy: '<path d="M40 72 Q50 82 60 72" stroke="#3a2a2a" stroke-width="3" fill="none" stroke-linecap="round"/>',
      grin:  '<path d="M40 70 Q50 84 60 70 Z" fill="#fff" stroke="#3a2a2a" stroke-width="3"/>',
      cool:  '<rect x="34" y="60" width="32" height="9" rx="4" fill="#222"/>',
    };
    const eyes = (a.face === "cool")
      ? ""
      : '<circle cx="42" cy="60" r="3.2" fill="#3a2a2a"/><circle cx="58" cy="60" r="3.2" fill="#3a2a2a"/>';

    let hair = "";
    if (a.hairStyle === "short") {
      hair = `<path d="M28 52 Q50 20 72 52 Q72 40 50 34 Q28 40 28 52 Z" fill="${a.hairColor}"/>`;
    } else if (a.hairStyle === "long") {
      hair = `<path d="M26 50 Q50 18 74 50 L74 96 Q70 84 66 90 L66 54 Q50 30 34 54 L34 90 Q30 84 26 96 Z" fill="${a.hairColor}"/>`;
    } else if (a.hairStyle === "puffs") {
      hair = `<circle cx="30" cy="42" r="13" fill="${a.hairColor}"/><circle cx="70" cy="42" r="13" fill="${a.hairColor}"/><path d="M30 52 Q50 22 70 52 Q70 42 50 38 Q30 42 30 52 Z" fill="${a.hairColor}"/>`;
    } // bald = no hair

    return `
      <svg viewBox="0 0 100 130" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <!-- shadow -->
        <ellipse cx="50" cy="126" rx="26" ry="5" fill="rgba(0,0,0,0.12)"/>
        <!-- legs -->
        <rect x="40" y="104" width="8" height="20" rx="4" fill="#3a3a4a"/>
        <rect x="52" y="104" width="8" height="20" rx="4" fill="#3a3a4a"/>
        <!-- body / shirt -->
        <path d="M30 92 Q30 74 50 74 Q70 74 70 92 L70 108 Q50 114 30 108 Z" fill="${a.shirt}"/>
        <!-- arms -->
        <rect x="22" y="78" width="9" height="28" rx="4.5" fill="${a.shirt}"/>
        <rect x="69" y="78" width="9" height="28" rx="4.5" fill="${a.shirt}"/>
        <circle cx="26.5" cy="106" r="5" fill="${a.skin}"/>
        <circle cx="73.5" cy="106" r="5" fill="${a.skin}"/>
        <!-- head -->
        <circle cx="50" cy="56" r="24" fill="${a.skin}"/>
        ${eyes}
        ${faces[a.face] || faces.happy}
        ${hair}
      </svg>`;
  }

  function renderAvatarInto(el, big) {
    if (el) el.innerHTML = avatarSVG(state.avatar, { big: big });
  }

  function renderAvatar() {
    renderAvatarInto(document.getElementById("avatar-preview"), true);

    buildSwatches("skin", SKINS);
    buildSwatches("hairColor", HAIR_COLORS);
    buildSwatches("shirt", SHIRTS);
    buildChips("hairStyle", HAIR_STYLES);
    buildChips("face", FACES);
  }

  function buildSwatches(part, colors) {
    const wrap = document.querySelector(`.swatches[data-part="${part}"]`);
    if (!wrap) return;
    wrap.innerHTML = "";
    colors.forEach((c) => {
      const b = document.createElement("button");
      b.className = "swatch" + (state.avatar[part] === c ? " selected" : "");
      b.style.background = c;
      b.setAttribute("aria-label", part + " color");
      b.addEventListener("click", () => {
        state.avatar[part] = c;
        save();
        renderAvatar();
      });
      wrap.appendChild(b);
    });
  }

  function buildChips(part, options) {
    const wrap = document.querySelector(`.chips[data-part="${part}"]`);
    if (!wrap) return;
    wrap.innerHTML = "";
    options.forEach((o) => {
      const b = document.createElement("button");
      b.className = "chip" + (state.avatar[part] === o.id ? " selected" : "");
      b.textContent = o.label;
      b.addEventListener("click", () => {
        state.avatar[part] = o.id;
        save();
        renderAvatar();
      });
      wrap.appendChild(b);
    });
  }

  /* ============================================================
     RIDDLE ENGINE
     ============================================================ */
  const riddles = window.RIDDLES || [];

  function isSolved(id) { return state.solved.indexOf(id) !== -1; }
  function rescuedCount() { return state.solved.length; }
  function allDone() { return rescuedCount() >= riddles.length; }

  function currentRiddle() {
    return riddles.find((r) => !isSolved(r.id)) || null;
  }

  // Build 3 tappable choices: the right answer + 2 others, shuffled.
  // We pick the wrong choices from other riddles' answers so they're always
  // real, kid-friendly words. Stored on `currentChoices` so they stay put.
  let currentChoices = [];
  function buildChoices(r) {
    const others = riddles
      .filter((x) => x.id !== r.id)
      .map((x) => x.answer)
      .filter((a) => a.toLowerCase() !== r.answer.toLowerCase());
    // shuffle the distractor pool and take two unique ones
    for (let i = others.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [others[i], others[j]] = [others[j], others[i]];
    }
    const wrongs = [];
    for (const w of others) {
      if (wrongs.length >= 2) break;
      if (!wrongs.some((x) => x.toLowerCase() === w.toLowerCase())) wrongs.push(w);
    }
    const choices = [{ text: r.answer, correct: true }]
      .concat(wrongs.map((w) => ({ text: w, correct: false })));
    // shuffle the final three
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    return choices;
  }

  function renderRiddle() {
    const r = currentRiddle();
    const fb = document.getElementById("answer-feedback");
    const hint = document.getElementById("hint-text");
    const optionsEl = document.getElementById("answer-options");

    renderAvatarInto(document.getElementById("game-avatar"));
    fb.textContent = "";
    fb.className = "feedback";
    hint.textContent = "";
    hint.classList.remove("show");
    optionsEl.innerHTML = "";

    if (!r) {
      // Everything solved — go celebrate the ending.
      show("ending");
      return;
    }
    document.getElementById("riddle-progress").textContent =
      `Clue ${rescuedCount() + 1} of ${riddles.length}`;
    document.getElementById("riddle-text").textContent = r.riddleText;
    document.getElementById("btn-hint").textContent = "Need a hint? 🔎";

    // Build the three tap-to-answer buttons.
    currentChoices = buildChoices(r);
    currentChoices.forEach((c) => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = cap(c.text);
      btn.addEventListener("click", () => chooseAnswer(r, c, btn));
      optionsEl.appendChild(btn);
    });
  }

  function chooseAnswer(r, choice, btn) {
    const fb = document.getElementById("answer-feedback");
    if (choice.correct) {
      state.solved.push(r.id);
      save();
      celebrate(r);
    } else {
      // Gently mark the wrong choice and let them try another.
      btn.classList.add("wrong");
      btn.disabled = true;
      fb.textContent = pick(["Not quite — try again! 💪", "Oops, try another!", "Hmm, pick a different one!"]);
      fb.className = "feedback try";
    }
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* ============================================================
     CELEBRATION POPUP
     ============================================================ */
  const celebrateEl = document.getElementById("celebrate");

  function celebrate(r) {
    document.getElementById("celebrate-emoji").textContent = r.emoji;
    document.getElementById("celebrate-title").textContent = pick(["Correct! 🎉", "Hooray! 🎉", "You got it! ⭐"]);
    document.getElementById("celebrate-text").textContent = `You rescued the ${r.animal}!`;
    document.getElementById("celebrate-badge").textContent = "🏅 " + r.badge;
    const nextBtn = document.getElementById("btn-celebrate-next");
    nextBtn.textContent = allDone() ? "See the big surprise →" : "Next clue →";
    celebrateEl.classList.remove("hidden");
    updateRescueCount();
  }

  document.getElementById("btn-celebrate-next").addEventListener("click", () => {
    celebrateEl.classList.add("hidden");
    if (allDone()) show("ending");
    else { show("game"); }
  });

  /* ============================================================
     MAP
     ============================================================ */
  function renderMap() {
    const grid = document.getElementById("map-grid");
    grid.innerHTML = "";
    riddles.forEach((r) => {
      const done = isSolved(r.id);
      const spot = document.createElement("div");
      spot.className = "map-spot " + (done ? "found" : "locked");
      spot.innerHTML = `
        <span class="spot-emoji">${done ? r.emoji : "❓"}</span>
        <div class="spot-name">${done ? cap(r.location) : "???"}</div>
        <div class="spot-status">${done ? "Rescued!" : "Locked"}</div>`;
      grid.appendChild(spot);
    });
  }

  /* ============================================================
     BADGES
     ============================================================ */
  function renderBadges() {
    const grid = document.getElementById("badge-grid");
    grid.innerHTML = "";
    riddles.forEach((r) => {
      const done = isSolved(r.id);
      const card = document.createElement("div");
      card.className = "badge-card" + (done ? "" : " empty");
      card.innerHTML = `
        <span class="badge-emoji">${done ? r.emoji : "🔒"}</span>
        <div class="badge-name">${done ? r.badge : "???"}</div>`;
      grid.appendChild(card);
    });
  }

  /* ============================================================
     ENDING
     ============================================================ */
  function runEnding() {
    const parade = document.getElementById("ending-parade");
    parade.textContent = riddles.map((r) => r.emoji).join(" ");
    confetti();
  }

  function confetti() {
    const layer = document.getElementById("confetti");
    if (!layer) return;
    layer.innerHTML = "";
    const colors = ["#ffd93b", "#ff8fb1", "#b58cff", "#5bd1c0", "#ff9f4a", "#6fc36b"];
    for (let i = 0; i < 80; i++) {
      const c = document.createElement("div");
      c.className = "confetti";
      c.style.left = Math.random() * 100 + "vw";
      c.style.background = colors[i % colors.length];
      c.style.animationDuration = (2 + Math.random() * 2.5) + "s";
      c.style.animationDelay = (Math.random() * 1.5) + "s";
      layer.appendChild(c);
    }
  }

  /* ============================================================
     HELPERS + WIRING
     ============================================================ */
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function updateRescueCount() {
    const el = document.getElementById("rescue-count");
    if (el) el.textContent = `${rescuedCount()} / ${riddles.length} rescued`;
  }

  // Title screen buttons
  document.getElementById("btn-start").addEventListener("click", () => {
    state.started = true;
    save();
    // First time with no progress → meet the avatar maker; otherwise back to the game.
    show(state.solved.length ? "game" : "avatar");
  });

  document.getElementById("btn-reset").addEventListener("click", () => {
    if (confirm("Start the whole adventure over? Your badges will be cleared.")) {
      state = defaultState();
      save();
      show("title");
    }
  });

  document.getElementById("btn-avatar-done").addEventListener("click", () => show("game"));

  document.getElementById("btn-hint").addEventListener("click", () => {
    const r = currentRiddle();
    if (!r) return;
    const hint = document.getElementById("hint-text");
    hint.textContent = "🐱 Detective Whiskers says: " + r.hint;
    hint.classList.add("show");
  });

  const playAgain = document.getElementById("btn-play-again");
  if (playAgain) playAgain.addEventListener("click", () => {
    state.solved = [];
    save();
    show("game");
  });

  /* ---------- Start where the player left off ---------- */
  function boot() {
    renderAvatarInto(document.getElementById("avatar-preview"), true);
    if (!state.started) show("title");
    else if (allDone()) show("ending");
    else show("game");
    updateRescueCount();
  }

  boot();
})();
