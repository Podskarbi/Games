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
      gender: "boy",
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
  const GENDERS = [{ id: "boy", label: "🧒 Boy" }, { id: "girl", label: "👧 Girl" }];
  const SKINS = ["#ffe0bd", "#f3c39a", "#e0ac82", "#c68642", "#8d5524", "#5c3a1e"];
  const HAIR_COLORS = ["#2b2b2b", "#5a3a2a", "#a8642a", "#e3b34d", "#d94f8a", "#5b8cff", "#e8e8e8"];
  const SHIRTS = ["#ff8fb1", "#b58cff", "#ff9f4a", "#5bd1c0", "#6fc36b", "#ffd93b", "#ff5a5a", "#4aa6f5"];
  const HAIR_STYLES = [
    { id: "short", label: "Short" },
    { id: "swoosh", label: "Swoosh" },
    { id: "curly", label: "Curly" },
    { id: "ponytail", label: "Ponytail" },
    { id: "bun", label: "Bun" },
    { id: "long", label: "Long" },
    { id: "none", label: "Bald" },
  ];
  const FACES = [
    { id: "happy", label: "😊" },
    { id: "grin", label: "😁" },
    { id: "cool", label: "😎" },
  ];

  // Darken/lighten a #rrggbb hex by amt (used for shading).
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, Math.min(255, (n >> 16) + amt));
    const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
    const b = Math.max(0, Math.min(255, (n & 255) + amt));
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

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
    const skin = a.skin, hair = a.hairColor, top = a.shirt;
    const girl = a.gender === "girl";
    const cool = a.face === "cool";
    const skinSh = shade(skin, -26), hairSh = shade(hair, -28), topSh = shade(top, -30);
    const pants = "#46507a", shoe = "#2c2f47";

    // ---- back hair (behind head, over shoulders) ----
    let backHair = "";
    if (a.hairStyle === "long")
      backHair = `<path d="M27 46 Q27 22 50 22 Q73 22 73 46 L77 98 Q71 92 66 96 L66 50 Q50 41 34 50 L34 96 Q29 92 23 98 Z" fill="${hairSh}"/>`;
    else if (a.hairStyle === "ponytail")
      backHair = `<path d="M68 34 Q90 42 86 72 Q84 88 74 90 Q84 72 80 56 Q75 42 64 40 Z" fill="${hairSh}"/><circle cx="69" cy="37" r="6.5" fill="${hair}"/>`;
    else if (a.hairStyle === "bun")
      backHair = `<circle cx="50" cy="19" r="12" fill="${hairSh}"/><ellipse cx="50" cy="19" rx="12" ry="12" fill="none" stroke="${shade(hair,-40)}" stroke-width="1.5"/>`;
    else if (a.hairStyle === "curly")
      backHair = `<g fill="${hairSh}"><circle cx="29" cy="36" r="12"/><circle cx="71" cy="36" r="12"/><circle cx="28" cy="54" r="11"/><circle cx="72" cy="54" r="11"/></g>`;

    // ---- body: dress (girl) or shirt + pants (boy) ----
    let body;
    if (girl) {
      body = `
        <rect x="44" y="100" width="5.6" height="15" rx="2.8" fill="${skin}"/>
        <rect x="50.4" y="100" width="5.6" height="15" rx="2.8" fill="${skin}"/>
        <ellipse cx="46" cy="116" rx="6" ry="3.4" fill="${shoe}"/><ellipse cx="54" cy="116" rx="6" ry="3.4" fill="${shoe}"/>
        <path d="M37 80 Q34 73 50 73 Q66 73 63 80 L73 105 Q50 112 27 105 Z" fill="${top}"/>
        <path d="M27 105 Q50 112 73 105" stroke="${topSh}" stroke-width="2.2" fill="none"/>
        <g class="avx-arm avx-arm-l"><rect x="25.5" y="80" width="7.5" height="17" rx="3.7" fill="${top}"/><circle cx="29" cy="98" r="4.4" fill="${skin}"/></g>
        <g class="avx-arm avx-arm-r"><rect x="67" y="80" width="7.5" height="17" rx="3.7" fill="${top}"/><circle cx="71" cy="98" r="4.4" fill="${skin}"/></g>`;
    } else {
      body = `
        <rect x="43" y="95" width="6.6" height="21" rx="3.2" fill="${pants}"/>
        <rect x="50.4" y="95" width="6.6" height="21" rx="3.2" fill="${pants}"/>
        <ellipse cx="46.3" cy="117" rx="6.4" ry="3.6" fill="${shoe}"/><ellipse cx="53.7" cy="117" rx="6.4" ry="3.6" fill="${shoe}"/>
        <path d="M33 97 Q31 74 50 74 Q69 74 67 97 Q50 103 33 97 Z" fill="${top}"/>
        <path d="M44 75 Q50 80 56 75" stroke="${topSh}" stroke-width="2" fill="none"/>
        <g class="avx-arm avx-arm-l"><rect x="25" y="80" width="8" height="22" rx="4" fill="${top}"/><circle cx="29" cy="103" r="4.6" fill="${skin}"/></g>
        <g class="avx-arm avx-arm-r"><rect x="67" y="80" width="8" height="22" rx="4" fill="${top}"/><circle cx="71" cy="103" r="4.6" fill="${skin}"/></g>`;
    }

    // ---- face ----
    const cheeks = `<circle cx="37" cy="55" r="3.6" fill="#ff8a9a" opacity="0.4"/><circle cx="63" cy="55" r="3.6" fill="#ff8a9a" opacity="0.4"/>`;
    const brows = cool ? "" :
      `<path d="M37 41 Q41 39 45 41" stroke="${hairSh}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
       <path d="M55 41 Q59 39 63 41" stroke="${hairSh}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    const eyes = cool ? "" : `
      <ellipse cx="42" cy="49" rx="4" ry="5" fill="#fff"/><ellipse cx="58" cy="49" rx="4" ry="5" fill="#fff"/>
      <circle cx="42.6" cy="50" r="2.5" fill="#3a2a2a"/><circle cx="58.6" cy="50" r="2.5" fill="#3a2a2a"/>
      <circle cx="43.5" cy="49" r="0.9" fill="#fff"/><circle cx="59.5" cy="49" r="0.9" fill="#fff"/>
      ${girl ? '<path d="M37.6 46.5 L35.4 45 M38 49 L35.8 49" stroke="#3a2a2a" stroke-width="1.2" stroke-linecap="round"/><path d="M62.4 46.5 L64.6 45 M62 49 L64.2 49" stroke="#3a2a2a" stroke-width="1.2" stroke-linecap="round"/>' : ''}`;
    const sunglasses = cool ?
      `<rect x="34" y="44" width="13" height="10" rx="3.5" fill="#222"/><rect x="53" y="44" width="13" height="10" rx="3.5" fill="#222"/>
       <rect x="47" y="47" width="6" height="2.6" fill="#222"/>
       <path d="M37 47 Q40 49 44 47" stroke="#5a6172" stroke-width="1.2" fill="none"/>` : "";
    const nose = `<path d="M49 53 Q50 56 51.5 53.5" stroke="${skinSh}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
    const lip = girl ? "#e06b80" : "#b85c5c";
    const mouths = {
      happy: `<path d="M44 60 Q50 65 56 60" stroke="${lip}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
      grin: `<path d="M44.5 60 Q50 67 55.5 60 Z" fill="#fff" stroke="${lip}" stroke-width="2" stroke-linejoin="round"/>`,
      cool: `<path d="M45 61 Q50 64.5 55 61" stroke="${lip}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
    };

    // ---- front hair (top / fringe) ----
    let frontHair = "";
    if (a.hairStyle === "short")
      frontHair = `<path d="M28 50 Q28 24 50 24 Q72 24 72 50 Q70 39 61 35 Q56 39 50 37 Q44 39 39 35 Q30 39 28 50 Z" fill="${hair}"/>`;
    else if (a.hairStyle === "swoosh")
      frontHair = `<path d="M28 50 Q28 24 50 24 Q72 24 72 46 Q65 33 47 35 Q39 36 36 43 Q33 39 28 50 Z" fill="${hair}"/>`;
    else if (a.hairStyle === "curly")
      frontHair = `<g fill="${hair}"><circle cx="37" cy="30" r="10"/><circle cx="51" cy="27" r="11"/><circle cx="64" cy="31" r="9.5"/></g>`;
    else if (a.hairStyle === "ponytail" || a.hairStyle === "bun" || a.hairStyle === "long")
      frontHair = `<path d="M28 50 Q28 24 50 24 Q72 24 72 50 Q70 38 50 38 Q43 38 39 43 Q34 39 28 50 Z" fill="${hair}"/>
        <path d="M50 25 L50 38" stroke="${hairSh}" stroke-width="1.4"/>`;
    // none = no hair

    return `
      <svg viewBox="0 0 100 130" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="125" rx="25" ry="4.5" fill="rgba(0,0,0,0.12)"/>
        ${body}
        ${backHair}
        <rect x="46" y="66" width="8" height="11" rx="3" fill="${skin}"/>
        <circle cx="50" cy="48" r="22" fill="${skin}"/>
        <path d="M31 53 Q50 68 69 53 Q66 64 50 65 Q34 64 31 53 Z" fill="${skinSh}" opacity="0.22"/>
        <circle cx="29.5" cy="50" r="4.4" fill="${skin}"/><circle cx="70.5" cy="50" r="4.4" fill="${skin}"/>
        ${cheeks}${brows}${eyes}${sunglasses}${nose}${mouths[a.face] || mouths.happy}
        ${frontHair}
      </svg>`;
  }

  function renderAvatarInto(el, big) {
    if (el) el.innerHTML = avatarSVG(state.avatar, { big: big });
  }

  function renderAvatar() {
    renderAvatarInto(document.getElementById("avatar-preview"), true);

    buildChips("gender", GENDERS);
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

  /* ============================================================
     ANIMATED CITY SCENE + DETECTIVE WHISKERS (drawn art)
     ============================================================ */
  const SCENE_TYPES = ["street", "park", "plaza"];
  function buildScene(type) {
    const W = 800, H = 240, horizon = 176;
    let rays = "";
    for (let a = 0; a < 12; a++) rays += `<rect x="697" y="14" width="6" height="16" rx="3" fill="#ffe06b" transform="rotate(${a * 30} 700 46)"/>`;
    let content;
    if (type === "park") content = scenePark(W, H, horizon);
    else if (type === "plaza") content = scenePlaza(W, H, horizon);
    else content = sceneStreet(W, H, horizon);
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="csky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#79c2ff"/><stop offset="0.65" stop-color="#bce6ff"/><stop offset="1" stop-color="#e6f6ff"/>
      </linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#csky)"/>
      <g class="cs-rays">${rays}</g>
      <circle cx="700" cy="46" r="28" fill="#ffe06b"/>
      ${content}
    </svg>`;
  }
  function windowsGrid(x, by, w, bottom) {
    let s = "";
    for (let wy = by + 20; wy < bottom - 14; wy += 26)
      for (let wx = x + 12; wx < x + w - 14; wx += 24)
        s += `<rect x="${wx}" y="${wy}" width="13" height="16" rx="2" fill="${(wx + wy) % 3 === 0 ? "#fff4b8" : "#dcecff"}"/>`;
    return s;
  }
  function parkHouse(x, baseY, color) {
    return `<g transform="translate(${x},${baseY})">
      <rect x="-26" y="-46" width="52" height="46" rx="3" fill="${color}"/>
      <polygon points="-32,-46 0,-70 32,-46" fill="#c96a52"/>
      <rect x="-8" y="-22" width="16" height="22" rx="2" fill="#7a5a3a"/>
      <rect x="-20" y="-38" width="12" height="12" rx="2" fill="#fff3b0"/><rect x="8" y="-38" width="12" height="12" rx="2" fill="#fff3b0"/></g>`;
  }
  function parkBench(x, y) {
    return `<g transform="translate(${x},${y})">
      <rect x="-22" y="-6" width="44" height="6" rx="2" fill="#b9742e"/><rect x="-22" y="-17" width="44" height="6" rx="2" fill="#cf8a3e"/>
      <rect x="-18" y="-6" width="4" height="12" fill="#7a4a22"/><rect x="14" y="-6" width="4" height="12" fill="#7a4a22"/></g>`;
  }
  function fountain(x, y) {
    return `<g transform="translate(${x},${y})">
      <ellipse cx="0" cy="2" rx="46" ry="13" fill="#9fd8ef"/><ellipse cx="0" cy="2" rx="46" ry="13" fill="none" stroke="#cfeaf6" stroke-width="3"/>
      <rect x="-7" y="-30" width="14" height="32" rx="3" fill="#cdd6e0"/><ellipse cx="0" cy="-30" rx="18" ry="6" fill="#bcd6e8"/>
      <g stroke="#bfe6f7" stroke-width="2.5" fill="none"><path d="M0 -34 Q-14 -48 -20 -30"/><path d="M0 -34 Q14 -48 20 -30"/><path d="M0 -37 L0 -30"/></g></g>`;
  }

  function sceneStreet(W, H, horizon) {
    const roadY = 206;
    let far = "", x = 0, i = 0; const farCols = ["#c4d9ef", "#cfe1f3"];
    while (x < W) { const w = 46 + (i * 37) % 44, h = 50 + (i * 53) % 70; far += `<rect x="${x}" y="${horizon - h}" width="${w}" height="${h}" rx="3" fill="${farCols[i % 2]}"/>`; x += w + 7; i++; }
    let mid = "", bx = 14, bi = 0; const cols = ["#eab0c3", "#a9c8f0", "#f4c98a", "#bfe3a8", "#d3b6ef", "#9fd8d0"];
    while (bx < W - 30) {
      const bw = 78 + (bi * 29) % 46, bh = 78 + (bi * 61) % 62, by = horizon - bh, col = cols[bi % cols.length];
      mid += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="6" fill="${col}"/><rect x="${bx}" y="${by}" width="${bw}" height="12" rx="6" fill="rgba(0,0,0,0.10)"/>${windowsGrid(bx, by, bw, horizon)}`;
      bx += bw + 16; bi++;
    }
    let fg = "";
    for (const tx of [70, 250, 430, 610, 770]) fg += sceneTree(tx, horizon + 6, 1);
    for (const lx of [160, 360, 560, 720]) fg += lamp(lx, horizon + 4);
    return `${far}
      <rect x="0" y="${horizon - 2}" width="${W}" height="14" fill="#cdeec4"/>
      ${mid}
      <rect x="0" y="${horizon}" width="${W}" height="${H - horizon}" fill="#8ddf6e"/>
      <rect x="0" y="${roadY}" width="${W}" height="${H - roadY}" fill="#9aa4b2"/>
      <rect x="0" y="${roadY}" width="${W}" height="4" fill="#838d9c"/>
      ${dashLine(roadY + 20, W)}
      ${fg}`;
  }

  function scenePark(W, H, horizon) {
    let houses = "";
    for (const h of [[80, "#f4b3c4"], [210, "#a9c8f0"], [620, "#bfe3a8"], [730, "#f4c98a"]]) houses += parkHouse(h[0], horizon - 2, h[1]);
    const pond = `<ellipse cx="560" cy="216" rx="125" ry="24" fill="#7fc8e8"/><ellipse cx="560" cy="216" rx="125" ry="24" fill="none" stroke="#bfe9f6" stroke-width="3"/>
      <ellipse cx="510" cy="212" rx="11" ry="4" fill="#6fbf63"/><ellipse cx="600" cy="220" rx="9" ry="3.5" fill="#6fbf63"/>`;
    let trees = "";
    for (const t of [[60, 200, 1.15], [150, 192, 0.9], [330, 202, 1.2], [420, 190, 0.85], [700, 200, 1.1], [770, 192, 0.9]]) trees += sceneTree(t[0], t[1], t[2]);
    let flowers = "";
    for (const fx of [180, 300, 360, 250, 690]) flowers += `<g transform="translate(${fx},${horizon + 36})"><circle r="3" fill="#ff7eb6"/><circle cx="-4" cy="-3" r="3" fill="#ffd93b"/><circle cx="4" cy="-3" r="3" fill="#b58cff"/><rect x="-0.6" y="0" width="1.2" height="6" fill="#4e9c46"/></g>`;
    return `${houses}
      <rect x="0" y="${horizon - 2}" width="${W}" height="${H - horizon + 2}" fill="#8ddf6e"/>
      <ellipse cx="220" cy="214" rx="180" ry="44" fill="#9be07a" opacity="0.55"/>
      ${pond}
      ${flowers}
      ${parkBench(420, horizon + 36)}
      ${trees}`;
  }

  function scenePlaza(W, H, horizon) {
    const bL = `<rect x="-20" y="36" width="168" height="${horizon - 36}" rx="6" fill="#a9c8f0"/><rect x="-20" y="36" width="168" height="12" fill="rgba(0,0,0,0.1)"/>${windowsGrid(-20, 36, 168, horizon)}`;
    const bR = `<rect x="${W - 148}" y="28" width="168" height="${horizon - 28}" rx="6" fill="#d3b6ef"/><rect x="${W - 148}" y="28" width="168" height="12" fill="rgba(0,0,0,0.1)"/>${windowsGrid(W - 148, 28, 168, horizon)}`;
    let mid = "", bx = 168, bi = 0; const cols = ["#eab0c3", "#f4c98a", "#bfe3a8", "#9fd8d0"];
    while (bx < W - 168) { const bw = 84, bh = 66 + (bi * 53) % 50, by = horizon - bh, col = cols[bi % cols.length]; mid += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="5" fill="${col}"/>${windowsGrid(bx, by, bw, horizon)}`; bx += bw + 14; bi++; }
    let banner = `<path d="M150 62 Q400 84 650 62" stroke="#ffb3c6" stroke-width="2.5" fill="none"/>`;
    for (let k = 0; k < 9; k++) { const fx = 165 + k * 58, dy = (k % 2) * 3, c = ["#ff8fb1", "#ffd93b", "#5bd1c0", "#b58cff"][k % 4]; banner += `<polygon points="${fx},${66 + dy} ${fx + 11},${66 + dy} ${fx + 5.5},${77 + dy}" fill="${c}"/>`; }
    const ground = `<rect x="0" y="${horizon}" width="${W}" height="${H - horizon}" fill="#c8c1b4"/><rect x="0" y="${horizon}" width="${W}" height="4" fill="#b3ac9e"/>`;
    let tiles = "";
    for (let tx = 0; tx < W; tx += 60) tiles += `<rect x="${tx}" y="${horizon}" width="2" height="${H - horizon}" fill="rgba(0,0,0,0.06)"/>`;
    const props = fountain(400, horizon + 32) + parkBench(150, horizon + 32) + parkBench(650, horizon + 32) + sceneTree(60, horizon + 8, 0.85) + sceneTree(740, horizon + 8, 0.85);
    return `${bL}${bR}${mid}${banner}${ground}${tiles}${props}`;
  }
  function sceneTree(x, y, s) {
    return `<g transform="translate(${x},${y}) scale(${s})">
      <rect x="-5" y="-26" width="10" height="28" rx="4" fill="#8a5a35"/>
      <circle cx="0" cy="-40" r="22" fill="#5fb85a"/>
      <circle cx="-16" cy="-30" r="15" fill="#6cc466"/>
      <circle cx="16" cy="-30" r="15" fill="#54ad50"/></g>`;
  }
  function lamp(x, y) {
    return `<g transform="translate(${x},${y})">
      <rect x="-2.5" y="-44" width="5" height="46" rx="2" fill="#5a6172"/>
      <circle cx="0" cy="-48" r="6" fill="#ffe78a"/></g>`;
  }
  function dashLine(y, W) {
    let s = "";
    for (let x = 10; x < W; x += 46) s += `<rect x="${x}" y="${y}" width="24" height="5" rx="2.5" fill="#ffd93b"/>`;
    return s;
  }

  // Detective Whiskers — modelled on Hania's fluffy cream-and-white cat:
  // big amber eyes, white face blaze + chest ruff, tufted ears, long whiskers.
  function buildDetective() {
    return `<svg viewBox="0 0 120 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs><radialGradient id="whiskEye" cx="0.45" cy="0.4" r="0.6">
        <stop offset="0" stop-color="#f7d264"/><stop offset="0.55" stop-color="#e6a82c"/><stop offset="1" stop-color="#bb7c1a"/>
      </radialGradient></defs>
      <ellipse cx="60" cy="115" rx="30" ry="5" fill="rgba(0,0,0,0.12)"/>

      <!-- fluffy tail: cream with a white tip -->
      <path class="cat-tail" d="M80 105 Q109 101 102 73" stroke="#ecd6b6" stroke-width="11" fill="none" stroke-linecap="round"/>
      <path class="cat-tail" d="M103 82 Q107 73 102 69" stroke="#fdfaf4" stroke-width="8" fill="none" stroke-linecap="round"/>

      <!-- body: cream sides + big white fluffy chest ruff -->
      <path d="M38 115 Q36 80 60 78 Q84 80 82 115 Z" fill="#ecd6b6"/>
      <path d="M46 115 Q44 84 60 82 Q76 84 74 115 L70 110 L66 114 L62 109 L58 114 L54 110 L50 114 Z" fill="#fdfaf4"/>

      <!-- ears: cream/apricot, pink inner, white furnishing tufts -->
      <path d="M40 41 Q33 16 38 14 Q51 22 57 35 Z" fill="#eecfa0"/>
      <path d="M80 41 Q87 16 82 14 Q69 22 63 35 Z" fill="#eecfa0"/>
      <path d="M42 36 Q40 23 43 22 Q49 27 52 34 Z" fill="#f3b9c6"/>
      <path d="M78 36 Q80 23 77 22 Q71 27 68 34 Z" fill="#f3b9c6"/>
      <g stroke="#fdfaf4" stroke-width="1.3" stroke-linecap="round">
        <line x1="44" y1="33" x2="42" y2="24"/><line x1="47" y1="34" x2="46" y2="26"/>
        <line x1="76" y1="33" x2="78" y2="24"/><line x1="73" y1="34" x2="74" y2="26"/>
      </g>

      <!-- head: cream base with an apricot top -->
      <circle cx="60" cy="56" r="26" fill="#efdcc0"/>
      <path d="M36 52 Q60 30 84 52 Q60 42 36 52 Z" fill="#f1c99a" opacity="0.7"/>
      <!-- fluffy white cheek floof -->
      <path d="M37 58 Q29 66 34 77 Q41 72 43 63 Z" fill="#fdfaf4"/>
      <path d="M83 58 Q91 66 86 77 Q79 72 77 63 Z" fill="#fdfaf4"/>
      <!-- white blaze + muzzle -->
      <path d="M55 34 Q60 30 65 34 L63 58 Q60 62 57 58 Z" fill="#fdfaf4"/>
      <ellipse cx="60" cy="65" rx="17" ry="13" fill="#fdfaf4"/>

      <!-- deerstalker detective hat -->
      <path d="M34 42 Q60 13 86 42 Q86 31 60 27 Q34 31 34 42 Z" fill="#7a5230"/>
      <ellipse cx="60" cy="42" rx="28" ry="7" fill="#5f3f22"/>
      <circle cx="60" cy="25" r="5" fill="#8a5e38"/>

      <!-- big round amber eyes -->
      <circle cx="50" cy="55" r="7.2" fill="url(#whiskEye)" stroke="#a86a16" stroke-width="1"/>
      <circle cx="70" cy="55" r="7.2" fill="url(#whiskEye)" stroke="#a86a16" stroke-width="1"/>
      <ellipse cx="50" cy="55" rx="2.6" ry="4.8" fill="#3a2410"/>
      <ellipse cx="70" cy="55" rx="2.6" ry="4.8" fill="#3a2410"/>
      <circle cx="52" cy="52.4" r="1.6" fill="#fff"/><circle cx="72" cy="52.4" r="1.6" fill="#fff"/>

      <!-- pink nose + mouth -->
      <path d="M57 62 L63 62 L60 66 Z" fill="#ec8ca2"/>
      <path d="M60 66 Q56 70 53 68 M60 66 Q64 70 67 68" stroke="#c79c76" stroke-width="1.4" fill="none" stroke-linecap="round"/>

      <!-- long white whiskers -->
      <g stroke="#ffffff" stroke-width="1.4" stroke-linecap="round">
        <line x1="47" y1="63" x2="20" y2="57"/><line x1="47" y1="66" x2="19" y2="67"/><line x1="47" y1="69" x2="22" y2="78"/>
        <line x1="73" y1="63" x2="100" y2="57"/><line x1="73" y1="66" x2="101" y2="67"/><line x1="73" y1="69" x2="98" y2="78"/>
      </g>

      <!-- magnifying glass -->
      <g class="cat-glass">
        <line x1="84" y1="94" x2="98" y2="108" stroke="#7a5230" stroke-width="5" stroke-linecap="round"/>
        <circle cx="80" cy="88" r="13" fill="rgba(180,225,255,0.5)" stroke="#5a6172" stroke-width="4"/>
      </g>
    </svg>`;
  }

  function updateLocationStrip() {
    const el = document.getElementById("loc-now");
    if (!el) return;
    const total = riddles.length, done = rescuedCount();
    if (done === 0) el.textContent = "Detective Whiskers picks up the first trail…";
    else if (done >= total) el.textContent = "Every animal is home — hooray!";
    else el.textContent = `Searching Karandas — ${done} of ${total} animals rescued`;
  }

  function renderRiddle() {
    const r = currentRiddle();
    const fb = document.getElementById("answer-feedback");
    const hint = document.getElementById("hint-text");
    const optionsEl = document.getElementById("answer-options");

    renderAvatarInto(document.getElementById("game-avatar"));
    updateLocationStrip();
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
    // Vary the backdrop each clue so the city feels alive (street → park → plaza).
    document.getElementById("city-art").innerHTML = buildScene(SCENE_TYPES[rescuedCount() % SCENE_TYPES.length]);

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
  // Where each location sits on the city map + its landmark emoji.
  const LOC_LAYOUT = {
    park:      { x: 150, y: 120, emoji: "🌳" },
    bakery:    { x: 365, y: 95,  emoji: "🥐" },
    fountain:  { x: 590, y: 120, emoji: "⛲" },
    library:   { x: 690, y: 300, emoji: "📚" },
    market:    { x: 470, y: 285, emoji: "🎪" },
    treehouse: { x: 225, y: 300, emoji: "🛖" },
    garden:    { x: 360, y: 455, emoji: "🌷" },
    pond:      { x: 600, y: 455, emoji: "🪷" },
    forest:    { x: 130, y: 470, emoji: "🌲" },
    hill:      { x: 690, y: 500, emoji: "⛰️" },
  };
  const ROAD_EDGES = [
    ["park", "bakery"], ["bakery", "fountain"], ["fountain", "library"],
    ["park", "treehouse"], ["bakery", "market"], ["fountain", "market"],
    ["treehouse", "market"], ["treehouse", "forest"], ["market", "garden"],
    ["market", "library"], ["garden", "pond"], ["pond", "library"],
    ["garden", "forest"], ["pond", "hill"], ["library", "hill"],
  ];
  const DECO_TREES = [
    [60, 220, 1], [280, 175, 0.8], [500, 200, 0.9], [760, 180, 0.8],
    [70, 360, 0.9], [430, 380, 0.8], [770, 400, 0.9], [300, 540, 0.85],
    [520, 560, 0.8], [180, 560, 0.7], [660, 200, 0.7],
  ];
  const DECO_HOUSES = [
    [480, 150, "#f4b3c4"], [250, 210, "#a9c8f0"], [560, 350, "#f4c98a"],
    [150, 400, "#bfe3a8"], [430, 520, "#d6b8f0"],
  ];

  function mapTree(x, y, s) {
    return `<g transform="translate(${x},${y}) scale(${s})">
      <ellipse cx="0" cy="6" rx="20" ry="6" fill="rgba(0,0,0,0.08)"/>
      <rect x="-4" y="-16" width="8" height="20" rx="3" fill="#8a5a35"/>
      <circle cx="0" cy="-30" r="20" fill="#5fb85a"/>
      <circle cx="-14" cy="-22" r="14" fill="#6cc466"/>
      <circle cx="14" cy="-22" r="14" fill="#54ad50"/></g>`;
  }
  function mapHouse(x, y, color) {
    return `<g transform="translate(${x},${y})">
      <ellipse cx="0" cy="20" rx="26" ry="6" fill="rgba(0,0,0,0.08)"/>
      <rect x="-22" y="-6" width="44" height="26" rx="3" fill="${color}"/>
      <polygon points="-26,-6 0,-26 26,-6" fill="#c96a52"/>
      <rect x="-6" y="4" width="12" height="16" rx="2" fill="#7a5a3a"/>
      <rect x="-18" y="0" width="9" height="9" rx="1.5" fill="#fff3b0"/>
      <rect x="9" y="0" width="9" height="9" rx="1.5" fill="#fff3b0"/></g>`;
  }

  function drawMapNode(L, r, done, isCur) {
    const w = 94, h = 78, x0 = L.x - w / 2, y0 = L.y - h / 2 - 6;
    if (done) {
      return `<g>
        <rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="15" fill="#ffffff" stroke="#7ec77a" stroke-width="3"/>
        <rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="15" fill="#eafce3" opacity="0.6"/>
        <text x="${L.x - 6}" y="${L.y + 4}" font-size="40" text-anchor="middle">${L.emoji}</text>
        <text class="map-bounce" x="${L.x + 30}" y="${L.y - 14}" font-size="28" text-anchor="middle">${r.emoji}</text>
        <text x="${L.x}" y="${y0 + h + 17}" font-size="15" font-weight="800" text-anchor="middle" fill="#2c6e2c">${cap(L_name(r))}</text>
        <circle cx="${x0 + 16}" cy="${y0 + 16}" r="11" fill="#2bbe4e"/>
        <text x="${x0 + 16}" y="${y0 + 21}" font-size="15" fill="#fff" text-anchor="middle" font-weight="800">✓</text>
      </g>`;
    }
    if (isCur) {
      return `<g>
        <circle class="map-pulse" cx="${L.x}" cy="${L.y - 6}" r="40" fill="#ffd93b"/>
        <rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="15" fill="#fffdf2" stroke="#ffb02e" stroke-width="4"/>
        <text x="${L.x}" y="${L.y + 8}" font-size="40" text-anchor="middle">🔎</text>
        <text x="${L.x}" y="${y0 + h + 17}" font-size="14" font-weight="800" text-anchor="middle" fill="#c77b00">Searching…</text>
      </g>`;
    }
    return `<g opacity="0.92">
      <rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="15" fill="#d9d4cb" stroke="#b9b3a8" stroke-width="3"/>
      <text x="${L.x}" y="${L.y + 14}" font-size="42" text-anchor="middle" fill="#9a948a" font-weight="800">?</text>
    </g>`;
  }

  // Show the place name only once it's rescued (don't spoil the riddle).
  function L_name(r) { return r.location; }

  function buildCityMap() {
    let roads = "", roadsDash = "";
    ROAD_EDGES.forEach(([a, b]) => {
      const A = LOC_LAYOUT[a], B = LOC_LAYOUT[b];
      if (!A || !B) return;
      roads += `<line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" stroke="#c7b79a" stroke-width="18" stroke-linecap="round"/>`;
      roadsDash += `<line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" stroke="#f6ecd4" stroke-width="3.5" stroke-dasharray="11 13" stroke-linecap="round"/>`;
    });
    let deco = "";
    DECO_HOUSES.forEach(([x, y, c]) => { deco += mapHouse(x, y, c); });
    DECO_TREES.forEach(([x, y, s]) => { deco += mapTree(x, y, s); });

    const cur = currentRiddle();
    let nodes = "";
    riddles.forEach((r) => {
      const L = LOC_LAYOUT[r.location];
      if (!L) return;
      nodes += drawMapNode(L, r, isSolved(r.id), cur && cur.id === r.id);
    });

    return `<svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#aee68a"/><stop offset="1" stop-color="#8ed46b"/>
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#grass)"/>
      <ellipse cx="200" cy="200" rx="150" ry="90" fill="#9bdd78" opacity="0.5"/>
      <ellipse cx="600" cy="380" rx="170" ry="100" fill="#9bdd78" opacity="0.45"/>
      <ellipse cx="420" cy="540" rx="160" ry="70" fill="#9bdd78" opacity="0.4"/>
      <path d="M -20 250 Q 150 300 250 400 T 520 540 L 540 600 L -20 600 Z" fill="#7fc8e8" opacity="0.55"/>
      <ellipse cx="600" cy="455" rx="58" ry="30" fill="#7fc8e8"/>
      <ellipse cx="600" cy="455" rx="58" ry="30" fill="none" stroke="#bfe9f6" stroke-width="3"/>
      ${roads}${roadsDash}
      ${deco}
      ${nodes}
    </svg>`;
  }

  function renderMap() {
    document.getElementById("city-map").innerHTML = buildCityMap();
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
    document.getElementById("city-art").innerHTML = buildScene("street");
    document.getElementById("detective-art").innerHTML = buildDetective();
    if (!state.started) show("title");
    else if (allDone()) show("ending");
    else show("game");
    updateRescueCount();
  }

  boot();
})();
