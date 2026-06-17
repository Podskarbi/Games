/* ============================================================
   avatar.js — the K-pop demon-hunter idol creator.
   Two jobs:
     1. A dress-up UI with a live 2D (SVG) preview.
     2. buildVoxel() turns the chosen outfit into a blocky 3D
        character used in the game world.
   All styling is original "inspired by", never copied.
   ============================================================ */

window.Avatar = (function () {
  const D = window.GameData;
  const W = D.WARDROBE;

  // ---- helpers to look up the chosen colour for a slot -------------------
  function colorOf(catKey, id, fallback) {
    const cat = W[catKey];
    const found = (cat.colors || []).find((c) => c.id === id);
    return found ? found.hex : fallback;
  }
  function hairHex(id) {
    const c = D.HAIR_COLORS.find((h) => h.id === id) || D.HAIR_COLORS[0];
    return c;
  }
  function skinHex(id) {
    const c = D.SKIN_TONES.find((s) => s.id === id) || D.SKIN_TONES[1];
    return c.hex;
  }
  function eyeHex(id) {
    const c = D.EYE_COLORS.find((e) => e.id === id) || D.EYE_COLORS[0];
    return c.hex;
  }
  function auraHex(id) {
    const c = W.aura.styles.find((a) => a.id === id) || W.aura.styles[0];
    return c.hex;
  }

  /* =========================================================
     1) 2D PREVIEW (SVG)
     A cute, layered idol drawn entirely from shapes.
     ========================================================= */
  function renderSVG(a) {
    const hair = hairHex(a.hair.color);
    const hair2 = hair.hex2 || hair.hex;
    const top = colorOf('top', a.top.color, '#23232b');
    const bot = colorOf('bottoms', a.bottoms.color, '#3a6dff');
    const boot = colorOf('boots', a.boots.color, '#1f1f27');
    const prop = colorOf('prop', a.prop.color, '#43e8ff');
    const skin = skinHex(a.face.skin);
    const eye = eyeHex(a.face.eyes);
    const aura = a.aura !== 'none' ? auraHex(a.aura) : null;
    const sparkle = a.top.style === 'jacket'; // sequin shimmer

    const parts = [];

    // --- aura glow behind everything ---
    if (aura) {
      parts.push(`<defs>
        <radialGradient id="auraG" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stop-color="${aura}" stop-opacity="0.85"/>
          <stop offset="60%" stop-color="${aura}" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="${aura}" stop-opacity="0"/>
        </radialGradient>
      </defs>`);
      parts.push(`<ellipse cx="130" cy="200" rx="120" ry="180" fill="url(#auraG)"/>`);
      // sparkle dots
      for (let i = 0; i < 10; i++) {
        const ang = (i / 10) * Math.PI * 2;
        const rx = 130 + Math.cos(ang) * (95 + (i % 3) * 8);
        const ry = 195 + Math.sin(ang) * (150 + (i % 2) * 10);
        parts.push(`<g transform="translate(${rx.toFixed(0)},${ry.toFixed(0)})">
          <path d="M0,-6 L1.6,-1.6 L6,0 L1.6,1.6 L0,6 L-1.6,1.6 L-6,0 L-1.6,-1.6 Z" fill="${aura}" opacity="0.9"/>
        </g>`);
      }
    }

    // hair ombre gradient
    parts.push(`<defs><linearGradient id="hairG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${hair.hex}"/>
      <stop offset="100%" stop-color="${hair2}"/>
    </linearGradient></defs>`);
    const HAIR = a.hair.color === 'ombre' ? 'url(#hairG)' : hair.hex;

    // --- BACK hair (behind head/body for long styles) ---
    if (a.hair.style === 'long' || a.hair.style === 'braids') {
      parts.push(`<path d="M86 96 Q70 200 96 300 L164 300 Q190 200 174 96 Z" fill="${HAIR}"/>`);
    } else if (a.hair.style === 'ponytail') {
      parts.push(`<path d="M150 70 Q210 120 188 230 Q170 250 168 210 Q180 130 140 96 Z" fill="${HAIR}"/>`);
    }

    // --- legs (skin) ---
    parts.push(`<rect x="112" y="250" width="16" height="80" rx="8" fill="${skin}"/>`);
    parts.push(`<rect x="132" y="250" width="16" height="80" rx="8" fill="${skin}"/>`);

    // --- boots ---
    const bootTop = a.boots.style === 'knee' ? 250 : a.boots.style === 'combat' ? 285 : 300;
    parts.push(`<rect x="108" y="${bootTop}" width="24" height="${336 - bootTop}" rx="8" fill="${boot}"/>`);
    parts.push(`<rect x="128" y="${bootTop}" width="24" height="${336 - bootTop}" rx="8" fill="${boot}"/>`);

    // --- bottoms ---
    if (a.bottoms.style === 'pants') {
      parts.push(`<path d="M104 218 L156 218 L150 296 L132 296 L130 250 L128 296 L110 296 Z" fill="${bot}"/>`);
    } else {
      // skirt-like flare
      parts.push(`<path d="M102 214 L158 214 L172 270 L88 270 Z" fill="${bot}"/>`);
      if (a.bottoms.style === 'layered') parts.push(`<path d="M96 250 L164 250 L176 286 L84 286 Z" fill="${bot}" opacity="0.7"/>`);
      if (a.bottoms.style === 'skirt') parts.push(`<path d="M92 264 L168 264 L168 270 L92 270 Z" fill="#d4d4dc"/>`); // chain trim
    }

    // --- torso / top ---
    parts.push(`<path d="M100 150 Q130 138 160 150 L168 224 Q130 236 92 224 Z" fill="${top}"/>`);
    if (a.top.style === 'jacket') {
      // shoulder epaulettes + gold trim
      parts.push(`<rect x="96" y="150" width="22" height="14" rx="6" fill="#e8b13a"/>`);
      parts.push(`<rect x="142" y="150" width="22" height="14" rx="6" fill="#e8b13a"/>`);
      parts.push(`<rect x="126" y="150" width="8" height="74" fill="#e8b13a" opacity="0.85"/>`);
    }
    if (sparkle) {
      for (let i = 0; i < 14; i++) {
        const sx = 102 + Math.random() * 56;
        const sy = 156 + Math.random() * 64;
        parts.push(`<circle cx="${sx.toFixed(0)}" cy="${sy.toFixed(0)}" r="1.6" fill="#fff" opacity="0.8"/>`);
      }
    }

    // --- arms ---
    const handY = 222;
    parts.push(`<rect x="86" y="156" width="14" height="68" rx="7" fill="${skin}"/>`);
    parts.push(`<rect x="160" y="156" width="14" height="68" rx="7" fill="${skin}"/>`);
    // soft inner-arm shading for a rounder look
    parts.push(`<rect x="95" y="156" width="5" height="68" rx="2" fill="${shade(skin, -18)}" opacity="0.5"/>`);
    parts.push(`<rect x="160" y="156" width="5" height="68" rx="2" fill="${shade(skin, -18)}" opacity="0.5"/>`);
    if (a.accessories.gloves) {
      parts.push(`<rect x="86" y="${handY - 18}" width="14" height="18" rx="6" fill="#23232b"/>`);
      parts.push(`<rect x="160" y="${handY - 18}" width="14" height="18" rx="6" fill="#23232b"/>`);
    } else {
      // bare hands
      parts.push(`<circle cx="93" cy="${handY + 2}" r="8" fill="${skin}"/>`);
      parts.push(`<circle cx="167" cy="${handY + 2}" r="8" fill="${skin}"/>`);
    }
    if (a.accessories.armbands) {
      parts.push(`<rect x="84" y="176" width="18" height="6" fill="${aura || '#ff5fb0'}"/>`);
      parts.push(`<rect x="158" y="176" width="18" height="6" fill="${aura || '#ff5fb0'}"/>`);
    }

    // --- prop in right hand ---
    if (a.prop.style === 'wand') {
      parts.push(`<line x1="174" y1="220" x2="196" y2="180" stroke="#e8e2cf" stroke-width="4"/>`);
      parts.push(`<path d="M196 168 l4 10 l10 2 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -2 Z" fill="${prop}"/>`);
    } else if (a.prop.style === 'blade') {
      parts.push(`<rect x="176" y="150" width="6" height="70" rx="3" fill="${prop}"/>`);
      parts.push(`<rect x="172" y="216" width="14" height="8" rx="3" fill="#5a5a66"/>`);
    } else if (a.prop.style === 'baton') {
      parts.push(`<rect x="176" y="170" width="6" height="52" rx="3" fill="${prop}"/>`);
      parts.push(`<circle cx="179" cy="168" r="6" fill="${prop}" opacity="0.9"/>`);
    }

    // --- neck + head ---
    parts.push(`<rect x="124" y="120" width="12" height="18" fill="${skin}"/>`);
    parts.push(`<rect x="124" y="120" width="12" height="5" fill="${shade(skin, -22)}" opacity="0.5"/>`); // neck shadow
    parts.push(`<circle cx="130" cy="104" r="30" fill="${skin}"/>`);
    parts.push(`<path d="M150 90 a30 30 0 0 1 -2 34 q14 -18 2 -34 Z" fill="${shade(skin, -16)}" opacity="0.45"/>`); // cheek shading
    parts.push(`<ellipse cx="118" cy="98" rx="9" ry="11" fill="#fff" opacity="0.12"/>`); // forehead highlight

    // --- accessories: choker / earrings ---
    if (a.accessories.choker) parts.push(`<rect x="116" y="128" width="28" height="6" rx="3" fill="#23232b"/>`);
    if (a.accessories.earrings) {
      parts.push(`<circle cx="102" cy="110" r="3.5" fill="#e8b13a"/>`);
      parts.push(`<circle cx="158" cy="110" r="3.5" fill="#e8b13a"/>`);
    }
    if (a.accessories.belt) parts.push(`<rect x="100" y="212" width="60" height="7" rx="3" fill="#23232b"/>`);

    // --- face ---
    const brow = shade(hair.hex, -25);
    // eyebrows
    parts.push(`<path d="M113 94 q7 -3 14 0" stroke="${brow}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`);
    parts.push(`<path d="M133 94 q7 -3 14 0" stroke="${brow}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`);
    // left eye (open) with lashes + highlight
    parts.push(`<ellipse cx="120" cy="104" rx="4.4" ry="5" fill="#fff"/>`);
    parts.push(`<circle cx="120" cy="104" r="2.6" fill="${eye}"/>`);
    parts.push(`<circle cx="120" cy="104" r="1.1" fill="#1a1a1f"/>`);
    parts.push(`<circle cx="118.7" cy="102.6" r="0.9" fill="#fff"/>`);
    parts.push(`<path d="M114 100 q6 -3 12 -1" stroke="#2b2b33" stroke-width="1.6" fill="none" stroke-linecap="round"/>`);
    if (a.face.expression === 'wink') {
      parts.push(`<path d="M134 105 q6 -4 12 0" stroke="#2b2b33" stroke-width="2.6" fill="none" stroke-linecap="round"/>`);
    } else {
      parts.push(`<ellipse cx="140" cy="104" rx="4.4" ry="5" fill="#fff"/>`);
      parts.push(`<circle cx="140" cy="104" r="2.6" fill="${eye}"/>`);
      parts.push(`<circle cx="140" cy="104" r="1.1" fill="#1a1a1f"/>`);
      parts.push(`<circle cx="138.7" cy="102.6" r="0.9" fill="#fff"/>`);
      parts.push(`<path d="M134 100 q6 -3 12 -1" stroke="#2b2b33" stroke-width="1.6" fill="none" stroke-linecap="round"/>`);
    }
    // nose
    parts.push(`<path d="M130 106 l-2.5 6 q2.5 2 5 0 Z" fill="${shade(skin, -20)}" opacity="0.55"/>`);
    // blush
    parts.push(`<circle cx="111" cy="114" r="4" fill="#ff9bbd" opacity="0.5"/>`);
    parts.push(`<circle cx="149" cy="114" r="4" fill="#ff9bbd" opacity="0.5"/>`);
    // mouth by expression
    if (a.face.expression === 'cool') parts.push(`<rect x="124" y="116" width="12" height="3" rx="1.5" fill="#b34a55"/>`);
    else parts.push(`<path d="M122 115 q8 8 16 0" stroke="#b34a55" stroke-width="2.6" fill="none" stroke-linecap="round"/>`);
    // face gem
    if (a.face.gem === 'star') parts.push(`<path d="M130 86 l2 5 l5 1 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -1 Z" fill="#ffe14d"/>`);
    else if (a.face.gem === 'gem') parts.push(`<circle cx="130" cy="88" r="3" fill="#43e8ff"/>`);

    // --- FRONT hair (bangs / shape over head) ---
    if (a.hair.style === 'bob') {
      parts.push(`<path d="M98 104 Q98 64 130 62 Q162 64 162 104 L162 132 L150 110 Q150 86 130 84 Q110 86 110 110 L98 132 Z" fill="${HAIR}"/>`);
    } else if (a.hair.style === 'buns') {
      parts.push(`<circle cx="100" cy="78" r="16" fill="${HAIR}"/>`);
      parts.push(`<circle cx="160" cy="78" r="16" fill="${HAIR}"/>`);
      parts.push(`<path d="M100 92 Q100 66 130 64 Q160 66 160 92 L150 96 Q150 80 130 80 Q110 80 110 96 Z" fill="${HAIR}"/>`);
    } else if (a.hair.style === 'halfup') {
      parts.push(`<path d="M100 100 Q100 64 130 62 Q160 64 160 100 L156 96 Q150 78 130 78 Q110 78 104 96 Z" fill="${HAIR}"/>`);
      parts.push(`<path d="M104 86 q12 14 8 30 l-8 0 Z" fill="${HAIR}"/>`);
      parts.push(`<path d="M156 86 q-12 14 -8 30 l8 0 Z" fill="${HAIR}"/>`);
    } else {
      // long / ponytail / braids share a swooped fringe
      parts.push(`<path d="M100 102 Q100 62 130 60 Q160 62 160 102 L154 92 Q146 76 130 76 Q116 76 108 92 Z" fill="${HAIR}"/>`);
      parts.push(`<path d="M104 84 q-4 24 2 40 l10 -2 Q108 100 116 86 Z" fill="${HAIR}"/>`);
    }
    if (a.hair.style === 'braids') {
      parts.push(`<path d="M104 118 q-6 60 0 110" stroke="${HAIR}" stroke-width="12" fill="none" stroke-linecap="round"/>`);
      parts.push(`<path d="M156 118 q6 60 0 110" stroke="${HAIR}" stroke-width="12" fill="none" stroke-linecap="round"/>`);
    }

    return `<svg viewBox="0 0 260 360" xmlns="http://www.w3.org/2000/svg" class="avatar-svg">${parts.join('')}</svg>`;
  }

  /* =========================================================
     2) 3D VOXEL AVATAR
     A blocky idol built from cubes, coloured by the outfit.
     ========================================================= */
  function box(w, h, d, hex, emissive) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshLambertMaterial({ color: D.hexToColor(hex) });
    if (emissive) { mat.emissive = new THREE.Color(D.hexToColor(hex)); mat.emissiveIntensity = 0.6; }
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  // slightly nudge a colour lighter/darker for shading accents
  function shade(hex, amt) {
    const n = parseInt(hex.replace('#', ''), 16);
    const cl = (v) => Math.max(0, Math.min(255, v));
    const r = cl(((n >> 16) & 255) + amt), gg = cl(((n >> 8) & 255) + amt), b = cl((n & 255) + amt);
    return '#' + ((1 << 24) + (r << 16) + (gg << 8) + b).toString(16).slice(1);
  }

  // Returns a THREE.Group standing with feet at y=0, ~1.95 units tall.
  // Far more detailed than a plain blocky doll: clothing, hair and
  // accessories all change with the chosen outfit.
  function buildVoxel(a) {
    const g = new THREE.Group();
    const skin = skinHex(a.face.skin);
    const hairC = hairHex(a.hair.color);
    const hair = hairC.hex;
    const hair2 = hairC.hex2 || hair;
    const top = colorOf('top', a.top.color, '#23232b');
    const bot = colorOf('bottoms', a.bottoms.color, '#3a6dff');
    const boot = colorOf('boots', a.boots.color, '#1f1f27');
    const prop = colorOf('prop', a.prop.color, '#43e8ff');
    const eye = eyeHex(a.face.eyes);
    const accent = a.aura !== 'none' ? auraHex(a.aura) : '#ff5fb0';
    const add = (m) => g.add(m);

    /* ---------------- boots ---------------- */
    const bs = a.boots.style;
    const bootH = bs === 'knee' ? 0.6 : bs === 'combat' ? 0.4 : 0.26;
    [-0.18, 0.18].forEach((x) => {
      const b = box(0.27, bootH, 0.38, boot); b.position.set(x, bootH / 2, 0.03); add(b);
      if (bs === 'sneakers') {
        const sole = box(0.3, 0.08, 0.42, '#f3f3f3'); sole.position.set(x, 0.04, 0.05); add(sole);
        const swoosh = box(0.04, 0.16, 0.02, accent); swoosh.position.set(x, bootH * 0.6, 0.2); add(swoosh);
      }
      if (bs === 'combat') {
        for (let k = 0; k < 3; k++) { const lace = box(0.18, 0.03, 0.02, shade(boot, 60)); lace.position.set(x, 0.12 + k * 0.1, 0.2); add(lace); }
      }
      if (bs === 'knee') { const cuff = box(0.29, 0.06, 0.4, shade(boot, -25)); cuff.position.set(x, bootH - 0.03, 0.03); add(cuff); }
    });

    /* ---------------- legs (skin) ---------------- */
    const hipY = 0.92;
    [-0.18, 0.18].forEach((x) => {
      const h = hipY - bootH;
      const leg = box(0.21, h, 0.27, skin); leg.position.set(x, bootH + h / 2, 0); add(leg);
    });

    /* ---------------- bottoms ---------------- */
    const bt = a.bottoms.style;
    if (bt === 'pants' || bt === 'shorts') {
      const len = bt === 'shorts' ? 0.3 : hipY - bootH + 0.02;
      [-0.18, 0.18].forEach((x) => {
        const p = box(0.25, len, 0.3, bot); p.position.set(x, hipY - len / 2, 0); add(p);
      });
      const waist = box(0.58, 0.18, 0.34, bot); waist.position.set(0, hipY, 0); add(waist);
      if (bt === 'pants') { // printed seam lines
        [-0.18, 0.18].forEach((x) => { const seam = box(0.03, len, 0.02, shade(bot, 40)); seam.position.set(x, hipY - len / 2, 0.16); add(seam); });
      }
    } else { // skirts: stacked flares
      const w1 = box(0.6, 0.18, 0.36, bot); w1.position.set(0, hipY, 0); add(w1);
      const w2 = box(0.8, 0.24, 0.48, bot); w2.position.set(0, hipY - 0.16, 0); add(w2);
      if (bt === 'layered') { const w3 = box(0.92, 0.16, 0.56, shade(bot, 30)); w3.position.set(0, hipY - 0.3, 0); add(w3); }
      if (bt === 'skirt') { const chain = box(0.82, 0.05, 0.5, '#d4d4dc'); chain.position.set(0, hipY - 0.27, 0); add(chain); }
    }
    if (a.accessories.belt) {
      const belt = box(0.6, 0.09, 0.38, '#23232b'); belt.position.set(0, hipY + 0.02, 0); add(belt);
      const buckle = box(0.12, 0.1, 0.04, '#e8b13a'); buckle.position.set(0, hipY + 0.02, 0.2); add(buckle);
    }

    /* ---------------- torso / top ---------------- */
    const tp = a.top.style;
    const torso = box(0.6, 0.62, 0.36, top); torso.position.set(0, 1.2, 0);
    if (tp === 'blouse') { torso.material.emissive = new THREE.Color(D.hexToColor(top)); torso.material.emissiveIntensity = 0.15; }
    add(torso);
    if (tp === 'jacket') {
      const ep = box(0.66, 0.12, 0.4, '#e8b13a'); ep.position.set(0, 1.46, 0); add(ep);
      const trim = box(0.07, 0.62, 0.02, '#e8b13a'); trim.position.set(0, 1.2, 0.19); add(trim);
      const collarL = box(0.16, 0.16, 0.04, shade(top, 30)); collarL.position.set(-0.14, 1.44, 0.19); add(collarL);
      const collarR = box(0.16, 0.16, 0.04, shade(top, 30)); collarR.position.set(0.14, 1.44, 0.19); add(collarR);
    } else if (tp === 'strappy') {
      const shoulders = box(0.62, 0.14, 0.38, skin); shoulders.position.set(0, 1.46, 0); add(shoulders);
      [-0.16, 0.16].forEach((x) => { const strap = box(0.06, 0.18, 0.38, top); strap.position.set(x, 1.42, 0); add(strap); });
    } else if (tp === 'tee') {
      const collar = box(0.26, 0.07, 0.38, '#f4f4f8'); collar.position.set(0, 1.48, 0.02); add(collar);
      const motif = box(0.18, 0.18, 0.02, accent); motif.position.set(0, 1.2, 0.19); add(motif);
    } else if (tp === 'blouse') {
      const frill = box(0.5, 0.08, 0.38, shade(top, 40)); frill.position.set(0, 1.48, 0); add(frill);
    }

    /* ---------------- arms + hands ---------------- */
    const gloveOn = a.accessories.gloves;
    const sleeved = (tp === 'jacket' || tp === 'tee' || tp === 'blouse');
    // left arm (static)
    const la = box(0.16, 0.5, 0.18, skin); la.position.set(-0.4, 1.22, 0); add(la);
    const lh = box(0.17, 0.13, 0.2, gloveOn ? '#23232b' : skin); lh.position.set(-0.4, 0.93, 0); add(lh);
    if (sleeved) { const sl = box(0.19, 0.24, 0.21, top); sl.position.set(-0.4, 1.38, 0); add(sl); }
    if (a.accessories.armbands) { const ab = box(0.19, 0.06, 0.21, accent); ab.position.set(-0.4, 1.08, 0); add(ab); }
    // right arm (group so it can wave)
    const ra = new THREE.Group();
    const raMesh = box(0.16, 0.5, 0.18, skin); raMesh.position.set(0, -0.25, 0); ra.add(raMesh);
    const rh = box(0.17, 0.13, 0.2, gloveOn ? '#23232b' : skin); rh.position.set(0, -0.54, 0); ra.add(rh);
    if (sleeved) { const sr = box(0.19, 0.24, 0.21, top); sr.position.set(0, -0.09, 0); ra.add(sr); }
    if (a.accessories.armbands) { const abr = box(0.19, 0.06, 0.21, accent); abr.position.set(0, -0.39, 0); ra.add(abr); }
    ra.position.set(0.4, 1.47, 0); add(ra);

    /* ---------------- neck + head ---------------- */
    const neck = box(0.17, 0.1, 0.17, skin); neck.position.set(0, 1.52, 0); add(neck);
    const head = box(0.44, 0.46, 0.42, skin); head.position.set(0, 1.76, 0); add(head);
    const ear1 = box(0.05, 0.1, 0.08, skin); ear1.position.set(-0.23, 1.74, 0.02); add(ear1);
    const ear2 = box(0.05, 0.1, 0.08, skin); ear2.position.set(0.23, 1.74, 0.02); add(ear2);

    /* ---------------- accessories on the head/neck ---------------- */
    if (a.accessories.choker) {
      const ch = box(0.46, 0.06, 0.44, '#23232b'); ch.position.set(0, 1.56, 0); add(ch);
      const gem = box(0.06, 0.06, 0.04, '#43e8ff'); gem.position.set(0, 1.56, 0.23); add(gem);
    }
    if (a.accessories.earrings) {
      [-0.25, 0.25].forEach((x) => { const ear = box(0.04, 0.11, 0.04, '#e8b13a'); ear.position.set(x, 1.67, 0.06); add(ear); });
    }

    /* ---------------- face ---------------- */
    const fz = 0.215;
    [-0.1, 0.1].forEach((x, i) => {
      const winkRight = (a.face.expression === 'wink' && i === 1);
      if (winkRight) { const lid = box(0.11, 0.025, 0.02, shade(skin, -40)); lid.position.set(x, 1.78, fz); add(lid); return; }
      const white = box(0.1, 0.11, 0.02, '#ffffff'); white.position.set(x, 1.79, fz); add(white);
      const iris = box(0.06, 0.07, 0.02, eye); iris.position.set(x, 1.785, fz + 0.005); add(iris);
      const pup = box(0.025, 0.03, 0.02, '#1a1a1f'); pup.position.set(x, 1.785, fz + 0.01); add(pup);
      const brow = box(0.12, 0.02, 0.02, shade(hair, -20)); brow.position.set(x, 1.88, fz); add(brow);
    });
    // nose
    const nose = box(0.05, 0.06, 0.04, shade(skin, -18)); nose.position.set(0, 1.72, fz + 0.01); add(nose);
    // mouth varies by expression
    if (a.face.expression === 'cool') {
      const m = box(0.14, 0.025, 0.02, '#b34a55'); m.position.set(0, 1.65, fz); add(m);
    } else {
      const m = box(0.12, 0.04, 0.02, '#d05a66'); m.position.set(0, 1.65, fz); add(m);
      const lip = box(0.08, 0.02, 0.02, '#b34a55'); lip.position.set(0, 1.63, fz); add(lip);
    }
    // blush
    [-0.16, 0.16].forEach((x) => {
      const bl = box(0.07, 0.05, 0.02, '#ff9bbd'); bl.material.transparent = true; bl.material.opacity = 0.6;
      bl.position.set(x, 1.69, fz); add(bl);
    });
    // face gem
    if (a.face.gem === 'star') { const s = box(0.08, 0.08, 0.03, '#ffe14d', true); s.position.set(0, 1.95, fz - 0.02); add(s); }
    else if (a.face.gem === 'gem') { const s = box(0.06, 0.06, 0.03, '#43e8ff', true); s.position.set(0, 1.95, fz - 0.02); add(s); }

    /* ---------------- hair (per style) ---------------- */
    const cap = box(0.5, 0.2, 0.48, hair); cap.position.set(0, 2.0, 0); add(cap);
    const bang = box(0.5, 0.14, 0.1, hair); bang.position.set(0, 1.92, 0.2); add(bang);
    const back = box(0.5, 0.44, 0.16, hair); back.position.set(0, 1.74, -0.23); add(back);
    const hs = a.hair.style;
    if (hs === 'long' || hs === 'braids') {
      const lng = box(0.5, 0.85, 0.14, hair); lng.position.set(0, 1.34, -0.25); add(lng);
      const tip = box(0.5, 0.18, 0.14, hair2); tip.position.set(0, 0.94, -0.25); add(tip);
      if (hs === 'braids') {
        [-0.28, 0.28].forEach((x) => {
          for (let k = 0; k < 4; k++) { const seg = box(0.12, 0.16, 0.12, k % 2 ? shade(hair, -18) : hair); seg.position.set(x, 1.6 - k * 0.16, 0.04); add(seg); }
        });
      }
    } else if (hs === 'ponytail') {
      const tie = box(0.16, 0.1, 0.16, accent); tie.position.set(0, 1.92, -0.26); add(tie);
      const tail = box(0.2, 0.7, 0.2, hair); tail.position.set(0, 1.55, -0.36); add(tail);
      const tailTip = box(0.2, 0.16, 0.2, hair2); tailTip.position.set(0, 1.18, -0.36); add(tailTip);
    } else if (hs === 'buns') {
      [-0.3, 0.3].forEach((x) => {
        const bun = box(0.22, 0.22, 0.22, hair); bun.position.set(x, 2.06, 0); add(bun);
        const wrap = box(0.24, 0.06, 0.24, shade(hair, -20)); wrap.position.set(x, 2.06, 0); add(wrap);
      });
    } else if (hs === 'bob') {
      [-0.25, 0.25].forEach((x) => { const side = box(0.12, 0.42, 0.44, hair); side.position.set(x, 1.66, 0); add(side); });
    } else if (hs === 'halfup') {
      const knot = box(0.2, 0.18, 0.2, hair); knot.position.set(0, 2.06, -0.16); add(knot);
      [-0.26, 0.26].forEach((x) => { const strand = box(0.1, 0.4, 0.18, hair); strand.position.set(x, 1.6, 0.04); add(strand); });
    }

    /* ---------------- prop in right hand (glows) ---------------- */
    if (a.prop.style !== 'none') {
      if (a.prop.style === 'wand') {
        const stick = box(0.07, 0.5, 0.07, '#e8e2cf'); stick.position.set(0, -0.5, 0.05); ra.add(stick);
        const star = box(0.2, 0.2, 0.08, prop, true); star.position.set(0, -0.8, 0.05); ra.add(star);
      } else if (a.prop.style === 'blade') {
        const hilt = box(0.1, 0.16, 0.1, '#5a5a66'); hilt.position.set(0, -0.5, 0.05); ra.add(hilt);
        const blade = box(0.08, 0.6, 0.08, prop, true); blade.position.set(0, -0.92, 0.05); ra.add(blade);
      } else if (a.prop.style === 'baton') {
        const rod = box(0.07, 0.5, 0.07, prop, true); rod.position.set(0, -0.62, 0.05); ra.add(rod);
        const tipB = box(0.12, 0.12, 0.12, prop, true); tipB.position.set(0, -0.9, 0.05); ra.add(tipB);
      }
    }

    /* ---------------- aura: glow light + faint shell ---------------- */
    if (a.aura !== 'none') {
      const aHex = auraHex(a.aura);
      const light = new THREE.PointLight(D.hexToColor(aHex), 0.8, 4);
      light.position.set(0, 1.2, 0); add(light);
      const shellMat = new THREE.MeshBasicMaterial({
        color: D.hexToColor(aHex), transparent: true, opacity: 0.12,
      });
      const shell = new THREE.Mesh(new THREE.SphereGeometry(1.15, 12, 12), shellMat);
      shell.position.set(0, 1.1, 0); add(shell);
      g.userData.auraShell = shell;
    }

    g.userData.waveArm = ra;     // animate this to wave
    g.userData.baseArmRot = 0;
    return g;
  }

  // A random outfit — used for NPC neighbours so the city is full of idols.
  function random() {
    const r = (arr) => D.pick(arr).id;
    return {
      name: '',
      hair: { style: r(W.hair.styles), color: r(W.hair.colors) },
      top: { style: r(W.top.styles), color: r(W.top.colors) },
      bottoms: { style: r(W.bottoms.styles), color: r(W.bottoms.colors) },
      boots: { style: r(W.boots.styles), color: r(W.boots.colors) },
      prop: { style: r(W.prop.styles), color: r(W.prop.colors) },
      face: {
        skin: r(D.SKIN_TONES), eyes: r(D.EYE_COLORS),
        expression: D.pick(W.face.expressions).id, gem: D.pick(W.face.gems).id,
      },
      accessories: {
        armbands: Math.random() < 0.5, gloves: Math.random() < 0.5,
        choker: Math.random() < 0.6, earrings: Math.random() < 0.6, belt: Math.random() < 0.4,
      },
      aura: D.pick(W.aura.styles).id,
    };
  }

  /* =========================================================
     3) CREATOR UI
     Builds the dress-up screen into a root element.
     ========================================================= */
  function mountCreator(root, onDone) {
    const a = D.defaultAvatar();

    root.innerHTML = `
      <div class="creator-header">
        <h1>${D.t('creatorTitle')}</h1>
        <p>${D.t('creatorSub')}</p>
        <button id="lang-toggle-title" class="icon-btn lang-toggle" type="button" title="${D.t('langTitle')}">${D.t('langShort')}</button>
      </div>
      <div class="creator">
        <div class="creator-preview">
          <div id="avatarPreview"></div>
          <input id="idolName" class="name-input" maxlength="16" placeholder="${D.t('namePlaceholder')}" />
        </div>
        <div class="creator-panel">
          <div class="tabs" id="tabs"></div>
          <div class="tab-body" id="tabBody"></div>
          <div class="creator-actions">
            <button class="btn btn-surprise" id="surpriseBtn">${D.t('surprise')}</button>
            <button class="btn btn-done" id="doneBtn">${D.t('done')}</button>
          </div>
        </div>
      </div>`;

    const preview = root.querySelector('#avatarPreview');
    const tabsEl = root.querySelector('#tabs');
    const bodyEl = root.querySelector('#tabBody');
    const nameInput = root.querySelector('#idolName');

    const tabs = [
      { key: 'hair' },
      { key: 'top' },
      { key: 'bottoms' },
      { key: 'boots' },
      { key: 'prop' },
      { key: 'face' },
      { key: 'extras' },
      { key: 'aura' },
    ];
    let active = 'hair';

    function refreshPreview() { preview.innerHTML = renderSVG(a); }

    function swatch(hex, selected, onClick, label) {
      const b = document.createElement('button');
      b.className = 'swatch' + (selected ? ' sel' : '');
      b.style.background = hex;
      if (label) b.title = label;
      b.onclick = () => { Sound.play('pick'); onClick(); };
      return b;
    }
    function chip(text, selected, onClick) {
      const b = document.createElement('button');
      b.className = 'chip' + (selected ? ' sel' : '');
      b.textContent = text;
      b.onclick = () => { Sound.play('pick'); onClick(); };
      return b;
    }
    function row(title) {
      const d = document.createElement('div');
      d.className = 'opt-row';
      if (title) { const h = document.createElement('div'); h.className = 'opt-title'; h.textContent = title; d.appendChild(h); }
      return d;
    }

    function renderTabBody() {
      bodyEl.innerHTML = '';
      const cat = W[active];

      if (active === 'face') {
        const r1 = row(D.t('skinTone'));
        D.SKIN_TONES.forEach((s) => r1.appendChild(swatch(s.hex, a.face.skin === s.id, () => { a.face.skin = s.id; redraw(); })));
        bodyEl.appendChild(r1);
        const r2 = row(D.t('eyes'));
        D.EYE_COLORS.forEach((e) => r2.appendChild(swatch(e.hex, a.face.eyes === e.id, () => { a.face.eyes = e.id; redraw(); })));
        bodyEl.appendChild(r2);
        const r3 = row(D.t('expression'));
        W.face.expressions.forEach((e) => r3.appendChild(chip(D.name(e), a.face.expression === e.id, () => { a.face.expression = e.id; redraw(); })));
        bodyEl.appendChild(r3);
        const r4 = row(D.t('faceGem'));
        W.face.gems.forEach((e) => r4.appendChild(chip(D.name(e), a.face.gem === e.id, () => { a.face.gem = e.id; redraw(); })));
        bodyEl.appendChild(r4);
        return;
      }

      if (active === 'extras') {
        const items = [
          ['armbands', D.lang() === 'pl' ? 'Opaski' : 'Arm bands'], ['gloves', D.lang() === 'pl' ? 'Rękawiczki' : 'Gloves'],
          ['choker', D.lang() === 'pl' ? 'Choker' : 'Choker'], ['earrings', D.lang() === 'pl' ? 'Kolczyki' : 'Earrings'], ['belt', D.lang() === 'pl' ? 'Pasek' : 'Belt'],
        ];
        const r = row(D.t('accessories'));
        items.forEach(([k, lbl]) => r.appendChild(chip(lbl, a.accessories[k], () => { a.accessories[k] = !a.accessories[k]; redraw(); })));
        bodyEl.appendChild(r);
        return;
      }

      if (active === 'aura') {
        const r = row(D.t('chooseAura'));
        W.aura.styles.forEach((s) => {
          const c = chip(D.name(s), a.aura === s.id, () => { a.aura = s.id; Sound.play('sparkle'); redraw(); });
          if (s.id !== 'none') { c.style.borderColor = s.hex; }
          r.appendChild(c);
        });
        bodyEl.appendChild(r);
        return;
      }

      // generic style + colour categories (hair, top, bottoms, boots, prop)
      const styleRow = row(D.t('style'));
      cat.styles.forEach((s) => styleRow.appendChild(chip(D.name(s), a[active].style === s.id, () => { a[active].style = s.id; redraw(); })));
      bodyEl.appendChild(styleRow);
      if (cat.colors) {
        const colRow = row(D.t('colour'));
        cat.colors.forEach((c) => colRow.appendChild(swatch(c.hex2 ? `linear-gradient(${c.hex},${c.hex2})` : c.hex, a[active].color === c.id, () => { a[active].color = c.id; redraw(); }, D.name(c))));
        bodyEl.appendChild(colRow);
      }
    }

    function renderTabs() {
      tabsEl.innerHTML = '';
      tabs.forEach((t) => {
        const b = document.createElement('button');
        b.className = 'tab' + (active === t.key ? ' sel' : '');
        b.textContent = D.t(`tabs.${t.key}`);
        b.onclick = () => { active = t.key; Sound.play('tab'); renderTabs(); renderTabBody(); };
        tabsEl.appendChild(b);
      });
    }

    function redraw() { refreshPreview(); renderTabBody(); }

    nameInput.oninput = () => { a.name = nameInput.value; };
    root.querySelector('#surpriseBtn').onclick = () => {
      const r = random();
      Object.assign(a, r); a.name = nameInput.value;
      Sound.play('sparkle');
      renderTabs(); renderTabBody(); refreshPreview();
    };
    root.querySelector('#doneBtn').onclick = () => {
      a.name = (nameInput.value || '').trim() || D.t('defaultName');
      Sound.play('done');
      onDone(JSON.parse(JSON.stringify(a)));
    };

    renderTabs();
    renderTabBody();
    refreshPreview();

    window.addEventListener('kids-language-change', () => {
      nameInput.placeholder = D.t('namePlaceholder');
      root.querySelector('#surpriseBtn').textContent = D.t('surprise');
      root.querySelector('#doneBtn').textContent = D.t('done');
      renderTabs();
      renderTabBody();
    });
  }

  return { renderSVG, buildVoxel, random, mountCreator };
})();
