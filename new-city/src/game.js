/* ============================================================
   game.js — the heart of New City.
   Runs the friendly loop for every lot:
     ask permission → smash → sweep → build → decorate → move in
   Talks to World (3D), Avatar (player + neighbours) and Sound.
   There are no fail states: everything is undoable and cheerful.
   ============================================================ */

(function () {
  const D = window.GameData;

  const LOT_SPACING = 10;     // distance between lots along X
  const GRID = 5;             // build grid is GRID x GRID columns
  const MAX_H = 4;            // tallest column you can stack

  const state = {
    phase: 'avatar',
    avatar: null,
    player: null,             // player's 3D group
    lot: 0,
    lotX: 0,
    house: null,              // { group, blocks:[] } currently being demolished
    rubble: [],               // active rubble meshes
    rubbleTotal: 0,
    baseTiles: [],            // tappable build-grid tiles
    heights: [],              // heights[i][j]
    buildBlocks: [],          // placed structure cubes
    selectedBlock: 'wall',
    decorItems: [],
    room: 'kitchen',
    paintMode: 'item',
    itemColor: '#d9c7a8',
    selectedItem: null,
    npc: null,                // neighbour idol for this lot
    finishedHouses: 0,
    anims: [],                // active little tweens
  };

  // ---- DOM refs ----------------------------------------------------------
  let elCreator, elGameUI, elToolbar, elStatus, elProgress, elProgressFill,
      elDialog, elHelpTip, elConfetti, elCelebrate, elDayIcon, elHouseCount;

  function $(id) { return document.getElementById(id); }

  function init() {
    elCreator = $('creatorScreen');
    elGameUI = $('gameUI');
    elToolbar = $('toolbar');
    elStatus = $('phaseLabel');
    elProgress = $('progressWrap');
    elProgressFill = $('progressFill');
    elDialog = $('dialog');
    elHelpTip = $('helpTip');
    elConfetti = $('confetti');
    elCelebrate = $('celebrate');
    elDayIcon = $('dayIcon');
    elHouseCount = $('houseCount');

    World.init($('scene'));
    World.setTapHandler(onTap);
    World.start(update);

    // wire up persistent buttons
    $('muteBtn').onclick = () => {
      const m = Sound.toggle();
      $('muteBtn').textContent = m ? '🔇' : '🔊';
    };
    $('helpBtn').onclick = showHelp;

    // start on the avatar creator
    Avatar.mountCreator(elCreator, onAvatarDone);
  }

  /* ================= AVATAR → GAME ================= */
  function onAvatarDone(avatar) {
    state.avatar = avatar;
    elCreator.classList.add('hidden');
    elGameUI.classList.remove('hidden');

    state.player = Avatar.buildVoxel(avatar);
    World.add(state.player);

    // streetlights down the road
    for (let i = -1; i < 6; i++) World.addStreetLight(i * LOT_SPACING + 4, 6.5);

    startLot(0);
  }

  /* ================= LOT LIFECYCLE ================= */
  function startLot(index) {
    state.lot = index;
    state.lotX = index * LOT_SPACING;
    World.focusOn(state.lotX, 0, 15);
    placePlayerNear(state.lotX);

    if (index === 0) {
      // the player's own starter house — smash it right away
      spawnHouse(state.lotX, 0);
      enterDemolish(false);
    } else {
      // a neighbour's house — ask first
      spawnHouse(state.lotX, 0);
      spawnNeighbour(state.lotX);
      enterPermission();
    }
  }

  function placePlayerNear(lotX) {
    state.player.position.set(lotX + 3.2, 0, 3.4);
    state.player.rotation.y = -0.6;
  }

  // Build a smashable voxel house at a lot centre.
  function spawnHouse(cx, cz) {
    const group = new THREE.Group();
    const blocks = [];
    const wall = '#e8dccb', roof = '#c98a5a', win = '#aee3ff', door = '#9a5b32', floor = '#cdb083';
    const offs = [-1.5, -0.5, 0.5, 1.5];

    function put(x, y, z, hex) {
      const b = World.makeBlock(1, hex);
      b.position.set(cx + x, y + 0.5, cz + z);
      b.userData.smashable = true;
      group.add(b); blocks.push(b);
      return b;
    }

    // floor
    offs.forEach((x) => offs.forEach((z) => put(x, 0, z, floor)));
    // walls (perimeter) up to height 3, leave a doorway at front-centre
    for (let h = 1; h <= 3; h++) {
      offs.forEach((x) => offs.forEach((z) => {
        const edge = (x === -1.5 || x === 1.5 || z === -1.5 || z === 1.5);
        if (!edge) return;
        const isDoor = (z === 1.5 && (x === -0.5) && h <= 2);
        const isWin = (h === 2 && ((x === 1.5 && z === -0.5) || (z === -1.5 && x === 0.5)));
        put(x, h, z, isDoor ? door : isWin ? win : wall);
      }));
    }
    // roof cap
    offs.forEach((x) => offs.forEach((z) => put(x, 4, z, roof)));

    group.userData.cx = cx;
    World.add(group);
    state.house = { group, blocks };
  }

  function spawnNeighbour(lotX) {
    const npc = Avatar.buildVoxel(Avatar.random());
    npc.position.set(lotX - 3, 0, 4.5);
    npc.rotation.y = 0.5;
    npc.scale.setScalar(0.95);
    World.add(npc);
    state.npc = npc;
  }

  /* ================= PHASE: PERMISSION ================= */
  function enterPermission() {
    state.phase = 'permission';
    setStatus('Ask the neighbour');
    renderToolbar();
    showDialog(
      `Can I rebuild your old house and make it fancy?`,
      [{ label: '🙏 Ask nicely', cls: 'btn-done', onClick: grantPermission }]
    );
  }

  function grantPermission() {
    Sound.play('permission');
    hideDialog();
    showDialog(`Yes please! I can't wait to live in a brand-new home! 💖`, [
      { label: 'Smash time! 💪', cls: 'btn-done', onClick: () => { hideDialog(); enterDemolish(true); } },
    ]);
    // little happy hop
    bounce(state.npc);
  }

  /* ================= PHASE: DEMOLISH ================= */
  function enterDemolish() {
    state.phase = 'demolish';
    setStatus('Smash the house!');
    renderToolbar();
    flashHelp(D.HELP.demolish);
  }

  function smashBlock(mesh) {
    Sound.play('smash');
    World.poof(mesh.position, '#' + mesh.material.color.getHexString(), 10);
    state.house.group.remove(mesh);
    World.remove(mesh);
    state.house.blocks = state.house.blocks.filter((b) => b !== mesh);
    if (state.house.blocks.length === 0) {
      World.remove(state.house.group);
      enterClean();
    }
  }

  /* ================= PHASE: CLEAN ================= */
  function enterClean() {
    state.phase = 'clean';
    setStatus('Sweep the rubble');
    renderToolbar();
    flashHelp(D.HELP.clean);

    // scatter rubble across the lot
    state.rubble = [];
    const colors = ['#b9a07e', '#9a8568', '#cdb083', '#8a8f95'];
    const N = 16;
    for (let i = 0; i < N; i++) {
      const r = World.makeBlock(0.4 + Math.random() * 0.25, D.pick(colors));
      r.position.set(
        state.lotX + (Math.random() - 0.5) * 4.5,
        0.25,
        (Math.random() - 0.5) * 4.5
      );
      r.rotation.y = Math.random() * Math.PI;
      r.userData.rubble = true;
      World.add(r);
      state.rubble.push(r);
    }
    state.rubbleTotal = N;
    showProgress(0);
  }

  function sweepRubble(mesh) {
    Sound.play('sweep');
    World.poof(mesh.position, '#cdb083', 5);
    World.remove(mesh);
    state.rubble = state.rubble.filter((r) => r !== mesh);
    const done = state.rubbleTotal - state.rubble.length;
    showProgress(done / state.rubbleTotal);
    if (state.rubble.length === 0) {
      setTimeout(enterBuild, 350);
    }
  }

  /* ================= PHASE: BUILD ================= */
  function enterBuild() {
    state.phase = 'build';
    setStatus('Build a new house');
    hideProgress();
    flashHelp(D.HELP.build);

    // a fresh green buildable platform
    const plat = World.makeBox(GRID + 0.4, 0.1, GRID + 0.4, '#8ad06a');
    plat.position.set(state.lotX, 0.05, 0);
    plat.userData.platform = true;
    World.add(plat);
    state.platform = plat;

    // grid bookkeeping + tappable tiles
    state.heights = [];
    state.baseTiles = [];
    state.buildBlocks = [];
    for (let i = 0; i < GRID; i++) {
      state.heights[i] = [];
      for (let j = 0; j < GRID; j++) {
        state.heights[i][j] = 0;
        const tile = new THREE.Mesh(
          new THREE.PlaneGeometry(0.92, 0.92),
          new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 })
        );
        tile.rotation.x = -Math.PI / 2;
        tile.position.set(state.lotX + (i - 2), 0.12, j - 2);
        tile.userData.col = { i, j };
        World.add(tile);
        state.baseTiles.push(tile);
      }
    }
    renderToolbar();
  }

  function colWorld(i, j) { return { x: state.lotX + (i - 2), z: j - 2 }; }

  function placeBlock(i, j) {
    const h = state.heights[i][j];
    if (h >= MAX_H) return;
    const def = D.BLOCKS.find((b) => b.id === state.selectedBlock);
    const b = World.makeBlock(1, def.hex);
    const w = colWorld(i, j);
    b.position.set(w.x, h + 0.5 + 0.1, w.z);
    b.userData.col = { i, j };
    b.userData.kind = def.kind;
    World.add(b);
    state.buildBlocks.push(b);
    state.heights[i][j] = h + 1;
    Sound.play('place');
  }

  function removeTopOfColumn(i, j) {
    const h = state.heights[i][j];
    if (h <= 0) return;
    // find the block at top of this column
    const top = state.buildBlocks
      .filter((b) => b.userData.col.i === i && b.userData.col.j === j)
      .sort((a, b) => b.position.y - a.position.y)[0];
    if (!top) return;
    World.poof(top.position, '#' + top.material.color.getHexString(), 4);
    World.remove(top);
    state.buildBlocks = state.buildBlocks.filter((b) => b !== top);
    state.heights[i][j] = h - 1;
    Sound.play('remove');
  }

  // a cosy preset house for kids who'd rather not place every block
  function quickHouse() {
    const wasMuted = Sound.isMuted();
    Sound.setMuted(true);   // hush the dozens of individual place sounds
    // clear anything placed first
    state.buildBlocks.slice().forEach((b) => World.remove(b));
    state.buildBlocks = [];
    for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) state.heights[i][j] = 0;

    const setSel = (id) => { state.selectedBlock = id; };
    // floor
    setSel('floor');
    for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) placeBlock(i, j);
    // walls 2 high around the edge
    for (let h = 0; h < 2; h++) {
      for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) {
        const edge = (i === 0 || i === GRID - 1 || j === 0 || j === GRID - 1);
        if (!edge) continue;
        const isDoor = (j === GRID - 1 && i === 2 && h === 0);
        const isWin = (h === 1 && ((i === 0 && j === 2) || (i === GRID - 1 && j === 2)));
        setSel(isDoor ? 'door' : isWin ? 'window' : 'wall');
        placeBlock(i, j);
      }
    }
    // roof
    setSel('roof');
    for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) placeBlock(i, j);
    setSel('wall');
    Sound.setMuted(wasMuted);
    Sound.play('done');
    renderToolbar();
  }

  /* ================= PHASE: DECORATE ================= */
  function enterDecorate() {
    state.phase = 'decorate';
    setStatus('Decorate the rooms');
    flashHelp(D.HELP.decorate);
    // clear the build grid tiles but keep them for furniture placement
    state.room = 'kitchen';
    state.selectedItem = D.ROOMS.kitchen.items[0];
    state.itemColor = state.selectedItem.hex;
    state.paintMode = 'item';
    renderToolbar();
  }

  function placeFurniture(i, j) {
    if (!state.selectedItem) return;
    const it = state.selectedItem;
    const w = colWorld(i, j);
    const m = World.makeBox(it.size[0], it.size[1], it.size[2], state.itemColor);
    m.position.set(w.x, it.size[1] / 2 + 0.12, w.z);
    m.userData.furniture = true;
    World.add(m);
    state.decorItems.push(m);
    Sound.play('place');
  }

  function removeFurniture(mesh) {
    World.remove(mesh);
    state.decorItems = state.decorItems.filter((d) => d !== mesh);
    Sound.play('remove');
  }

  function paintShell(kind, hex) {
    state.buildBlocks.forEach((b) => {
      if (b.userData.kind === kind) b.material.color.set(D.hexToColor(hex));
    });
    Sound.play('pick');
  }

  /* ================= PHASE: MOVE-IN ================= */
  function enterMoveIn() {
    state.phase = 'movein';
    setStatus('Moving in!');
    renderToolbar();
    flashHelp(D.HELP.movein);

    // tidy the build helpers
    state.baseTiles.forEach((t) => World.remove(t));
    state.baseTiles = [];

    // register window blocks + an interior lamp so the home glows at night
    state.buildBlocks.forEach((b) => {
      if (b.userData.kind === 'window') World.registerNightLight(b, 1.2);
    });
    const lamp = new THREE.PointLight(0xffe6a8, 0, 6);
    lamp.position.set(state.lotX, 1.4, 0);
    World.add(lamp);
    World.registerLamp(lamp);

    // the neighbour walks to the door, then waves
    const npc = state.npc || Avatar.buildVoxel(Avatar.random());
    if (!state.npc) { npc.position.set(state.lotX - 3, 0, 5); World.add(npc); }
    const fromX = npc.position.x, fromZ = npc.position.z;
    const toX = state.lotX - 0.5, toZ = 2.2;
    npc.rotation.y = Math.PI;
    addAnim((t) => {
      const k = Math.min(1, t / 1.6);
      npc.position.x = fromX + (toX - fromX) * k;
      npc.position.z = fromZ + (toZ - fromZ) * k;
      npc.position.y = Math.abs(Math.sin(k * 14)) * 0.12; // walk bob
      if (k >= 1) { npc.position.y = 0; startWave(npc); celebrate(); return true; }
      return false;
    });
  }

  function startWave(npc) {
    const arm = npc.userData.waveArm;
    addAnim((t) => {
      if (arm) arm.rotation.z = -1.2 + Math.sin(t * 9) * 0.4;
      return t > 2.4;
    });
  }

  function celebrate() {
    state.finishedHouses++;
    elHouseCount.textContent = state.finishedHouses;
    Sound.play('movein');
    confettiBurst();
    showCelebrate(`🎉 Welcome home! 🎉`, `${state.avatar.name}'s city has ${state.finishedHouses} home${state.finishedHouses > 1 ? 's' : ''}!`);
    state.npc = null;
    renderToolbar();
  }

  function nextLot() {
    hideCelebrate();
    startLot(state.lot + 1);
  }

  /* ================= TAP DISPATCH ================= */
  function onTap(ev) {
    switch (state.phase) {
      case 'demolish': {
        const hit = World.intersect(ev, state.house ? state.house.blocks : []);
        if (hit.length) smashBlock(hit[0].object);
        break;
      }
      case 'clean': {
        const hit = World.intersect(ev, state.rubble);
        if (hit.length) sweepRubble(hit[0].object);
        break;
      }
      case 'build': {
        const blockHit = World.intersect(ev, state.buildBlocks);
        if (blockHit.length) { const c = blockHit[0].object.userData.col; removeTopOfColumn(c.i, c.j); break; }
        const tileHit = World.intersect(ev, state.baseTiles);
        if (tileHit.length) { const c = tileHit[0].object.userData.col; placeBlock(c.i, c.j); }
        break;
      }
      case 'decorate': {
        const fHit = World.intersect(ev, state.decorItems);
        if (fHit.length) { removeFurniture(fHit[0].object); break; }
        const tileHit = World.intersect(ev, state.baseTiles);
        if (tileHit.length) { const c = tileHit[0].object.userData.col; placeFurniture(c.i, c.j); }
        break;
      }
    }
  }

  /* ================= TOOLBAR (per phase) ================= */
  function renderToolbar() {
    elToolbar.innerHTML = '';
    if (state.phase === 'demolish') {
      addTip('Tap the house blocks to smash them! 💪');
    } else if (state.phase === 'permission') {
      addTip('Ask your neighbour for permission first.');
    } else if (state.phase === 'clean') {
      addTip('Tap the rubble to sweep it up. 🧹');
    } else if (state.phase === 'build') {
      D.BLOCKS.forEach((b) => {
        const chip = mkChip(b.name, state.selectedBlock === b.id, () => {
          state.selectedBlock = b.id; Sound.play('pick'); renderToolbar();
        });
        chip.style.setProperty('--dot', b.hex);
        chip.classList.add('with-dot');
        elToolbar.appendChild(chip);
      });
      elToolbar.appendChild(mkBtn('🏠 Quick House', 'btn-soft', quickHouse));
      elToolbar.appendChild(mkBtn('Done →', 'btn-done', () => { Sound.play('done'); enterDecorate(); }));
    } else if (state.phase === 'decorate') {
      // room tabs
      Object.keys(D.ROOMS).forEach((key) => {
        const r = D.ROOMS[key];
        elToolbar.appendChild(mkChip(r.label, state.room === key, () => {
          state.room = key; state.selectedItem = r.items[0]; state.itemColor = r.items[0].hex;
          Sound.play('tab'); renderToolbar();
        }));
      });
      elToolbar.appendChild(sep());
      // items for the active room
      D.ROOMS[state.room].items.forEach((it) => {
        elToolbar.appendChild(mkChip(it.name, state.selectedItem && state.selectedItem.id === it.id, () => {
          state.selectedItem = it; state.itemColor = it.hex; Sound.play('pick'); renderToolbar();
        }));
      });
      elToolbar.appendChild(sep());
      // paint target
      ['item', 'wall', 'floor'].forEach((mode) => {
        const label = mode === 'item' ? 'Paint item' : mode === 'wall' ? 'Paint walls' : 'Paint floor';
        elToolbar.appendChild(mkChip(label, state.paintMode === mode, () => {
          state.paintMode = mode; Sound.play('tab'); renderToolbar();
        }));
      });
      // colour swatches
      D.MATERIALS.forEach((m) => {
        const s = document.createElement('button');
        s.className = 'swatch';
        s.style.background = m.hex; s.title = m.name;
        s.onclick = () => {
          if (state.paintMode === 'item') { state.itemColor = m.hex; Sound.play('pick'); }
          else paintShell(state.paintMode, m.hex);
        };
        elToolbar.appendChild(s);
      });
      elToolbar.appendChild(mkBtn('Move in! →', 'btn-done', () => { Sound.play('done'); enterMoveIn(); }));
    } else if (state.phase === 'movein') {
      addTip('Give your new neighbour a warm welcome! 👋');
      elToolbar.appendChild(mkBtn('Next lot →', 'btn-done', nextLot));
    }
  }

  /* ================= small UI helpers ================= */
  function mkChip(text, sel, onClick) {
    const b = document.createElement('button');
    b.className = 'chip' + (sel ? ' sel' : '');
    b.textContent = text;
    b.onclick = onClick;
    return b;
  }
  function mkBtn(text, cls, onClick) {
    const b = document.createElement('button');
    b.className = 'btn ' + cls;
    b.textContent = text;
    b.onclick = onClick;
    return b;
  }
  function sep() { const s = document.createElement('span'); s.className = 'tb-sep'; return s; }
  function addTip(txt) { const d = document.createElement('div'); d.className = 'tb-tip'; d.textContent = txt; elToolbar.appendChild(d); }

  function setStatus(txt) { elStatus.textContent = txt; }

  function showProgress(p) {
    elProgress.classList.remove('hidden');
    elProgressFill.style.width = Math.round(p * 100) + '%';
    elProgress.querySelector('.progress-label').textContent =
      p >= 1 ? 'All clean! ✨' : `Clean: ${Math.round(p * 100)}%`;
  }
  function hideProgress() { elProgress.classList.add('hidden'); }

  function showDialog(text, buttons) {
    elDialog.querySelector('.dialog-text').textContent = text;
    const row = elDialog.querySelector('.dialog-buttons');
    row.innerHTML = '';
    buttons.forEach((b) => row.appendChild(mkBtn(b.label, b.cls || 'btn-soft', b.onClick)));
    elDialog.classList.remove('hidden');
  }
  function hideDialog() { elDialog.classList.add('hidden'); }

  function showCelebrate(title, sub) {
    elCelebrate.querySelector('.celebrate-title').textContent = title;
    elCelebrate.querySelector('.celebrate-sub').textContent = sub;
    elCelebrate.classList.remove('hidden');
  }
  function hideCelebrate() { elCelebrate.classList.add('hidden'); }

  let helpTimer = null;
  function flashHelp(txt) {
    elHelpTip.textContent = '💡 ' + txt;
    elHelpTip.classList.remove('hidden');
    clearTimeout(helpTimer);
    helpTimer = setTimeout(() => elHelpTip.classList.add('hidden'), 4200);
  }
  function showHelp() {
    const map = {
      permission: D.HELP.permission, demolish: D.HELP.demolish, clean: D.HELP.clean,
      build: D.HELP.build, decorate: D.HELP.decorate, movein: D.HELP.movein,
    };
    flashHelp(map[state.phase] || 'Tap around and have fun!');
  }

  function confettiBurst() {
    const colors = ['#ff5fb0', '#ffd34d', '#43e8ff', '#7a4cff', '#5dff9b', '#ff8a3a'];
    for (let i = 0; i < 80; i++) {
      const p = document.createElement('div');
      p.className = 'confetti-piece';
      p.style.left = Math.random() * 100 + 'vw';
      p.style.background = D.pick(colors);
      p.style.animationDelay = (Math.random() * 0.5) + 's';
      p.style.transform = `rotate(${Math.random() * 360}deg)`;
      elConfetti.appendChild(p);
      setTimeout(() => p.remove(), 3000);
    }
  }

  /* ================= tiny animation system ================= */
  function addAnim(fn) { state.anims.push({ fn, t: 0 }); }
  function bounce(obj) {
    if (!obj) return;
    addAnim((t) => { obj.position.y = Math.abs(Math.sin(t * 10)) * 0.25 * Math.max(0, 1 - t); return t > 1; });
  }

  function update(dt) {
    // run little tweens
    for (let i = state.anims.length - 1; i >= 0; i--) {
      const a = state.anims[i];
      a.t += dt;
      if (a.fn(a.t)) state.anims.splice(i, 1);
    }
    // idle bob + aura pulse for the player
    if (state.player) {
      const tt = performance.now() / 1000;
      state.player.position.y = Math.sin(tt * 2) * 0.04;
      const shell = state.player.userData.auraShell;
      if (shell) shell.scale.setScalar(1 + Math.sin(tt * 3) * 0.06);
    }
    // day/night icon
    if (elDayIcon) elDayIcon.textContent = World.getDaylight() > 0.4 ? '☀️' : '🌙';
  }

  window.addEventListener('DOMContentLoaded', init);
})();
