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
    if (a.accessories.gloves) {
      parts.push(`<rect x="86" y="${handY - 18}" width="14" height="18" rx="6" fill="#23232b"/>`);
      parts.push(`<rect x="160" y="${handY - 18}" width="14" height="18" rx="6" fill="#23232b"/>`);
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
    parts.push(`<circle cx="130" cy="104" r="30" fill="${skin}"/>`);

    // --- accessories: choker / earrings ---
    if (a.accessories.choker) parts.push(`<rect x="116" y="128" width="28" height="6" rx="3" fill="#23232b"/>`);
    if (a.accessories.earrings) {
      parts.push(`<circle cx="102" cy="110" r="3.5" fill="#e8b13a"/>`);
      parts.push(`<circle cx="158" cy="110" r="3.5" fill="#e8b13a"/>`);
    }
    if (a.accessories.belt) parts.push(`<rect x="100" y="212" width="60" height="7" rx="3" fill="#23232b"/>`);

    // --- face ---
    parts.push(`<circle cx="120" cy="104" r="4" fill="#fff"/>`);
    parts.push(`<circle cx="120" cy="104" r="2.4" fill="${eye}"/>`);
    if (a.face.expression === 'wink') {
      parts.push(`<path d="M134 104 q6 -4 12 0" stroke="#2b2b33" stroke-width="2.4" fill="none"/>`);
    } else {
      parts.push(`<circle cx="140" cy="104" r="4" fill="#fff"/>`);
      parts.push(`<circle cx="140" cy="104" r="2.4" fill="${eye}"/>`);
    }
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
    return new THREE.Mesh(geo, mat);
  }

  // Returns a THREE.Group standing with feet at y=0, ~1.9 units tall.
  function buildVoxel(a) {
    const g = new THREE.Group();
    const skin = skinHex(a.face.skin);
    const hair = hairHex(a.hair.color).hex;
    const top = colorOf('top', a.top.color, '#23232b');
    const bot = colorOf('bottoms', a.bottoms.color, '#3a6dff');
    const boot = colorOf('boots', a.boots.color, '#1f1f27');
    const prop = colorOf('prop', a.prop.color, '#43e8ff');

    // boots
    const lb = box(0.26, 0.3, 0.34, boot); lb.position.set(-0.18, 0.15, 0); g.add(lb);
    const rb = box(0.26, 0.3, 0.34, boot); rb.position.set(0.18, 0.15, 0); g.add(rb);
    // legs (bottoms)
    const ll = box(0.24, 0.55, 0.28, bot); ll.position.set(-0.18, 0.57, 0); g.add(ll);
    const rl = box(0.24, 0.55, 0.28, bot); rl.position.set(0.18, 0.57, 0); g.add(rl);
    // torso (top)
    const torso = box(0.6, 0.6, 0.34, top); torso.position.set(0, 1.15, 0); g.add(torso);
    // shoulder trim for the sequin jacket
    if (a.top.style === 'jacket') {
      const ep = box(0.66, 0.12, 0.4, '#e8b13a'); ep.position.set(0, 1.42, 0); g.add(ep);
    }
    // arms (skin) — keep a reference to the right arm so it can wave
    const la = box(0.16, 0.55, 0.18, skin); la.position.set(-0.4, 1.18, 0); g.add(la);
    const ra = new THREE.Group();
    const raMesh = box(0.16, 0.55, 0.18, skin); raMesh.position.set(0, -0.27, 0); ra.add(raMesh);
    ra.position.set(0.4, 1.42, 0); g.add(ra);
    // head + hair
    const head = box(0.44, 0.44, 0.4, skin); head.position.set(0, 1.72, 0); g.add(head);
    const hairTop = box(0.5, 0.18, 0.46, hair); hairTop.position.set(0, 1.95, 0); g.add(hairTop);
    const hairBack = box(0.5, 0.4, 0.16, hair); hairBack.position.set(0, 1.74, -0.2); g.add(hairBack);
    if (a.hair.style === 'long' || a.hair.style === 'braids') {
      const longHair = box(0.46, 0.7, 0.14, hair); longHair.position.set(0, 1.4, -0.22); g.add(longHair);
    }
    if (a.hair.style === 'buns') {
      const b1 = box(0.18, 0.18, 0.18, hair); b1.position.set(-0.28, 2.02, 0); g.add(b1);
      const b2 = box(0.18, 0.18, 0.18, hair); b2.position.set(0.28, 2.02, 0); g.add(b2);
    }
    // tiny dark eyes on the front face
    const eyeL = box(0.06, 0.06, 0.02, '#2b2b33'); eyeL.position.set(-0.1, 1.74, 0.21); g.add(eyeL);
    const eyeR = box(0.06, 0.06, 0.02, '#2b2b33'); eyeR.position.set(0.1, 1.74, 0.21); g.add(eyeR);

    // prop held in right hand (glows)
    if (a.prop.style !== 'none') {
      const p = box(0.08, 0.5, 0.08, prop, true); p.position.set(0, -0.5, 0); ra.add(p);
      if (a.prop.style === 'wand') {
        const star = box(0.18, 0.18, 0.08, prop, true); star.position.set(0, -0.78, 0); ra.add(star);
      }
    }

    // aura: a soft glowing point light + faint shell
    if (a.aura !== 'none') {
      const aHex = auraHex(a.aura);
      const light = new THREE.PointLight(D.hexToColor(aHex), 0.8, 4);
      light.position.set(0, 1.2, 0); g.add(light);
      const shellMat = new THREE.MeshBasicMaterial({
        color: D.hexToColor(aHex), transparent: true, opacity: 0.12,
      });
      const shell = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 12), shellMat);
      shell.position.set(0, 1.05, 0); g.add(shell);
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
      <div class="creator">
        <div class="creator-preview">
          <div id="avatarPreview"></div>
          <input id="idolName" class="name-input" maxlength="16" placeholder="Your idol name…" />
        </div>
        <div class="creator-panel">
          <div class="tabs" id="tabs"></div>
          <div class="tab-body" id="tabBody"></div>
          <div class="creator-actions">
            <button class="btn btn-surprise" id="surpriseBtn">✨ Surprise Me!</button>
            <button class="btn btn-done" id="doneBtn">Done →</button>
          </div>
        </div>
      </div>`;

    const preview = root.querySelector('#avatarPreview');
    const tabsEl = root.querySelector('#tabs');
    const bodyEl = root.querySelector('#tabBody');
    const nameInput = root.querySelector('#idolName');

    const tabs = [
      { key: 'hair', label: 'Hair' },
      { key: 'top', label: 'Jacket' },
      { key: 'bottoms', label: 'Bottoms' },
      { key: 'boots', label: 'Boots' },
      { key: 'prop', label: 'Prop' },
      { key: 'face', label: 'Face' },
      { key: 'extras', label: 'Extras' },
      { key: 'aura', label: 'Aura' },
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
        const r1 = row('Skin tone');
        D.SKIN_TONES.forEach((s) => r1.appendChild(swatch(s.hex, a.face.skin === s.id, () => { a.face.skin = s.id; redraw(); })));
        bodyEl.appendChild(r1);
        const r2 = row('Eyes');
        D.EYE_COLORS.forEach((e) => r2.appendChild(swatch(e.hex, a.face.eyes === e.id, () => { a.face.eyes = e.id; redraw(); })));
        bodyEl.appendChild(r2);
        const r3 = row('Expression');
        W.face.expressions.forEach((e) => r3.appendChild(chip(e.name, a.face.expression === e.id, () => { a.face.expression = e.id; redraw(); })));
        bodyEl.appendChild(r3);
        const r4 = row('Face gem');
        W.face.gems.forEach((e) => r4.appendChild(chip(e.name, a.face.gem === e.id, () => { a.face.gem = e.id; redraw(); })));
        bodyEl.appendChild(r4);
        return;
      }

      if (active === 'extras') {
        const items = [
          ['armbands', 'Arm bands'], ['gloves', 'Gloves'],
          ['choker', 'Choker'], ['earrings', 'Earrings'], ['belt', 'Belt'],
        ];
        const r = row('Accessories (pick as many as you like)');
        items.forEach(([k, lbl]) => r.appendChild(chip(lbl, a.accessories[k], () => { a.accessories[k] = !a.accessories[k]; redraw(); })));
        bodyEl.appendChild(r);
        return;
      }

      if (active === 'aura') {
        const r = row('Choose your aura');
        W.aura.styles.forEach((s) => {
          const c = chip(s.name, a.aura === s.id, () => { a.aura = s.id; Sound.play('sparkle'); redraw(); });
          if (s.id !== 'none') { c.style.borderColor = s.hex; }
          r.appendChild(c);
        });
        bodyEl.appendChild(r);
        return;
      }

      // generic style + colour categories (hair, top, bottoms, boots, prop)
      const styleRow = row('Style');
      cat.styles.forEach((s) => styleRow.appendChild(chip(s.name, a[active].style === s.id, () => { a[active].style = s.id; redraw(); })));
      bodyEl.appendChild(styleRow);
      if (cat.colors) {
        const colRow = row('Colour');
        cat.colors.forEach((c) => colRow.appendChild(swatch(c.hex2 ? `linear-gradient(${c.hex},${c.hex2})` : c.hex, a[active].color === c.id, () => { a[active].color = c.id; redraw(); }, c.name)));
        bodyEl.appendChild(colRow);
      }
    }

    function renderTabs() {
      tabsEl.innerHTML = '';
      tabs.forEach((t) => {
        const b = document.createElement('button');
        b.className = 'tab' + (active === t.key ? ' sel' : '');
        b.textContent = t.label;
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
      a.name = (nameInput.value || '').trim() || 'Star';
      Sound.play('done');
      onDone(JSON.parse(JSON.stringify(a)));
    };

    renderTabs();
    renderTabBody();
    refreshPreview();
  }

  return { renderSVG, buildVoxel, random, mountCreator };
})();
