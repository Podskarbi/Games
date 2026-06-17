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
  const MIN_GRID = 4;         // smallest house footprint you can pick
  const MAX_GRID = 20;        // biggest house footprint you can pick
  const DEFAULT_GRID = 5;     // starting build grid (GRID x GRID columns)
  const MAX_H = 12;           // tallest column you can stack (several floors)

  const state = {
    phase: 'avatar',
    avatar: null,
    player: null,             // player's 3D group
    lot: 0,
    lotX: 0,
    house: null,              // { group, blocks:[] } currently being demolished
    falling: [],              // demolition bricks tumbling under gravity
    rubble: [],               // active rubble meshes
    rubbleTotal: 0,
    gridSize: DEFAULT_GRID,   // current build grid is gridSize x gridSize
    buildTool: 'place',       // 'place' to stack blocks, 'erase' to remove
    platform: null,           // green buildable platform mesh
    baseTiles: [],            // tappable build-grid tiles
    heights: [],              // heights[i][j]
    buildBlocks: [],          // placed structure cubes
    selectedBlock: 'wall',
    decorItems: [],
    room: 'kitchen',
    roomView: 'all',          // 'all' = whole house, or a room key to focus one room
    insideView: false,        // peek inside the house while decorating
    paintMode: 'item',
    itemColor: '#d9c7a8',
    selectedItem: null,
    npc: null,                // neighbour idol for this lot
    finishedHouses: 0,
    anims: [],                // active little tweens
  };

  // ---- DOM refs ----------------------------------------------------------
  let elCreator, elGameUI, elToolbar, elStatus, elProgress, elProgressFill,
      elDialog, elHowto, elConfetti, elCelebrate, elDayIcon, elHouseCount;

  function $(id) { return document.getElementById(id); }

  function init() {
    elCreator = $('creatorScreen');
    elGameUI = $('gameUI');
    elToolbar = $('toolbar');
    elStatus = $('phaseLabel');
    elProgress = $('progressWrap');
    elProgressFill = $('progressFill');
    elDialog = $('dialog');
    elHowto = $('howto');
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
    $('lang-toggle').onclick = toggleLanguage;

    // start on the avatar creator
    Avatar.mountCreator(elCreator, onAvatarDone);
    $('lang-toggle-title').onclick = toggleLanguage;
    applyLanguage();
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
      b.userData.gx = x; b.userData.gy = y; b.userData.gz = z;   // grid coords for physics
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

    // record which bricks actually rested on something at build time — only
    // those collapse when their support is smashed (so the roof cap, built
    // floating over the open interior, isn't yanked down the moment you start).
    const present = new Set(blocks.map(brickKey));
    blocks.forEach((b) => {
      b.userData.hadSupport = (b.userData.gy === 0) ||
        present.has(b.userData.gx + ',' + (b.userData.gy - 1) + ',' + b.userData.gz);
    });

    state.falling = [];
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
    setStatus(D.t('statuses.permission'));
    setInstruction('permission');
    renderToolbar();
    showDialog(
      D.t('askDialog'),
      [{ label: D.t('askNicely'), cls: 'btn-done', onClick: grantPermission }]
    );
  }

  function grantPermission() {
    Sound.play('permission');
    hideDialog();
    showDialog(D.t('yesDialog'), [
      { label: D.t('smashTime'), cls: 'btn-done', onClick: () => { hideDialog(); enterDemolish(true); } },
    ]);
    // little happy hop
    bounce(state.npc);
  }

  /* ================= PHASE: DEMOLISH ================= */
  function enterDemolish() {
    state.phase = 'demolish';
    setStatus(D.t('statuses.demolish'));
    setInstruction('demolish');
    renderToolbar();
  }

  function smashBlock(mesh) {
    Sound.play('smash');
    World.poof(mesh.position, '#' + mesh.material.color.getHexString(), 10);
    state.house.group.remove(mesh);
    World.remove(mesh);
    state.house.blocks = state.house.blocks.filter((b) => b !== mesh);
    state.falling = state.falling.filter((b) => b !== mesh);
    if (state.house.blocks.length === 0) {
      World.remove(state.house.group);
      enterClean();
      return;
    }
    settleHouse();   // anything left unsupported now tumbles down
  }

  function brickKey(b) { return b.userData.gx + ',' + b.userData.gy + ',' + b.userData.gz; }

  // Mark every brick that lost the brick directly beneath it as falling.
  // Iterates so a collapsing column cascades upward.
  function settleHouse() {
    if (!state.house) return;
    const present = new Set();
    state.house.blocks.forEach((b) => { if (!b.userData.falling) present.add(brickKey(b)); });
    let changed = true;
    while (changed) {
      changed = false;
      state.house.blocks.forEach((b) => {
        if (b.userData.falling || b.userData.gy <= 0 || !b.userData.hadSupport) return;
        const below = b.userData.gx + ',' + (b.userData.gy - 1) + ',' + b.userData.gz;
        if (!present.has(below)) {
          b.userData.falling = true;
          b.userData.vy = 0;
          present.delete(brickKey(b));
          state.falling.push(b);
          changed = true;
        }
      });
    }
  }

  // Gravity step for tumbling bricks; they shatter when they hit the highest
  // brick still standing in their column, or the ground.
  function updateFalling(dt) {
    if (!state.house || state.falling.length === 0) return;
    for (let i = state.falling.length - 1; i >= 0; i--) {
      const b = state.falling[i];
      b.userData.vy -= 16 * dt;
      b.position.y += b.userData.vy * dt;
      b.rotation.x += dt * 3; b.rotation.z += dt * 2;
      let restY = 0.5;   // ground
      state.house.blocks.forEach((o) => {
        if (o === b || o.userData.falling) return;
        if (o.userData.gx === b.userData.gx && o.userData.gz === b.userData.gz && o.position.y < b.position.y) {
          restY = Math.max(restY, o.position.y + 1);
        }
      });
      if (b.position.y <= restY) {
        // shatter on impact instead of piling up
        b.position.y = restY;
        World.poof(b.position, '#' + b.material.color.getHexString(), 8);
        Sound.play('smash');
        state.house.group.remove(b);
        World.remove(b);
        state.house.blocks = state.house.blocks.filter((x) => x !== b);
        state.falling.splice(i, 1);
        if (state.house.blocks.length === 0) {
          World.remove(state.house.group);
          enterClean();
          return;
        }
      }
    }
  }

  /* ================= PHASE: CLEAN ================= */
  function enterClean() {
    state.phase = 'clean';
    setStatus(D.t('statuses.clean'));
    setInstruction('clean');
    renderToolbar();

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
    state.buildTool = 'place';
    setStatus(D.t('statuses.build'));
    hideProgress();
    setInstruction('build');
    // fresh lot: orphan the previous (finished) house, don't delete it
    state.platform = null;
    state.baseTiles = [];
    state.buildBlocks = [];
    setupBuildGrid(false);
    renderToolbar();
  }

  // (Re)create the green platform + tappable tiles for the current grid size.
  // When clearPrev is true (grid-size change) the current in-progress build is
  // removed first; on a fresh lot the caller has already orphaned the old house.
  function setupBuildGrid(clearPrev) {
    const G = state.gridSize;
    const off = gridOffset();

    if (clearPrev) {
      if (state.platform) World.remove(state.platform);
      state.baseTiles.forEach((t) => World.remove(t));
      state.buildBlocks.forEach((b) => World.remove(b));
    }
    state.platform = null;

    // a fresh green buildable platform
    const plat = World.makeBox(G + 0.4, 0.1, G + 0.4, '#8ad06a');
    plat.position.set(state.lotX, 0.05, 0);
    plat.userData.platform = true;
    World.add(plat);
    state.platform = plat;

    // grid bookkeeping + tappable tiles
    state.heights = [];
    state.baseTiles = [];
    state.buildBlocks = [];
    for (let i = 0; i < G; i++) {
      state.heights[i] = [];
      for (let j = 0; j < G; j++) {
        state.heights[i][j] = 0;
        const tile = new THREE.Mesh(
          new THREE.PlaneGeometry(0.92, 0.92),
          new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 })
        );
        tile.rotation.x = -Math.PI / 2;
        tile.position.set(state.lotX + (i - off), 0.12, j - off);
        tile.userData.col = { i, j };
        World.add(tile);
        state.baseTiles.push(tile);
      }
    }
  }

  // Centre offset so the grid stays centred on the lot for any size.
  function gridOffset() { return (state.gridSize - 1) / 2; }

  // Change the house footprint (clamped 4..20). Rebuilds the empty grid.
  function setGridSize(n) {
    const next = Math.max(MIN_GRID, Math.min(MAX_GRID, n));
    if (next === state.gridSize) return;
    state.gridSize = next;
    setupBuildGrid(true);
    Sound.play('tab');
    renderToolbar();
  }

  function colWorld(i, j) { const off = gridOffset(); return { x: state.lotX + (i - off), z: j - off }; }

  function placeBlock(i, j) {
    const h = state.heights[i][j];
    if (h >= MAX_H) return;
    const def = D.BLOCKS.find((b) => b.id === state.selectedBlock);
    const b = World.makeStructureBlock(def.kind, def.hex);
    const w = colWorld(i, j);
    b.position.set(w.x, h + 0.5 + 0.1, w.z);
    b.userData.col = { i, j };
    b.userData.kind = def.kind;
    b.userData.hex = def.hex;
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
    World.poof(top.position, top.userData.hex || '#cdb083', 4);
    World.remove(top);
    state.buildBlocks = state.buildBlocks.filter((b) => b !== top);
    state.heights[i][j] = h - 1;
    Sound.play('remove');
  }

  // a cosy preset house for kids who'd rather not place every block
  function quickHouse() {
    const wasMuted = Sound.isMuted();
    Sound.setMuted(true);   // hush the dozens of individual place sounds
    const G = state.gridSize;
    const mid = Math.floor(G / 2);   // door / window column for any size
    // clear anything placed first
    state.buildBlocks.slice().forEach((b) => World.remove(b));
    state.buildBlocks = [];
    for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) state.heights[i][j] = 0;

    const setSel = (id) => { state.selectedBlock = id; };
    // floor
    setSel('floor');
    for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) placeBlock(i, j);
    // walls 2 high around the edge
    for (let h = 0; h < 2; h++) {
      for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
        const edge = (i === 0 || i === G - 1 || j === 0 || j === G - 1);
        if (!edge) continue;
        const isDoor = (j === G - 1 && i === mid && h === 0);
        const isWin = (h === 1 && ((i === 0 && j === mid) || (i === G - 1 && j === mid)));
        setSel(isDoor ? 'door' : isWin ? 'window' : 'wall');
        placeBlock(i, j);
      }
    }
    // roof
    setSel('roof');
    for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) placeBlock(i, j);
    setSel('wall');
    Sound.setMuted(wasMuted);
    Sound.play('done');
    renderToolbar();
  }

  /* ================= PHASE: DECORATE ================= */
  // Reveal the interior: hide the roof and fade the walls so furniture shows.
  function applyInsideView(on) {
    state.insideView = on;
    state.buildBlocks.forEach((b) => {
      const kind = b.userData.kind;
      if (kind === 'roof') {
        b.visible = !on;
      } else if (kind === 'wall' || kind === 'window' || kind === 'door') {
        eachMesh(b, (m) => {
          m.material.transparent = on;
          m.material.opacity = on ? 0.22 : 1;
          m.material.depthWrite = !on;
          m.material.needsUpdate = true;
        });
      }
    });
  }

  // Run fn over every Mesh in an object (a plain block or a decorated group).
  function eachMesh(obj, fn) {
    obj.traverse((c) => { if (c.isMesh) fn(c); });
  }

  // Climb from a raycast hit (possibly a child mesh) to the block root
  // that carries userData.col.
  function blockColumn(obj) {
    while (obj && !(obj.userData && obj.userData.col)) obj = obj.parent;
    return obj ? obj.userData.col : null;
  }

  function enterDecorate() {
    state.phase = 'decorate';
    setStatus(D.t('statuses.decorate'));
    // clear the build grid tiles but keep them for furniture placement
    state.room = 'kitchen';
    state.selectedItem = D.ROOMS.kitchen.items[0];
    state.itemColor = state.selectedItem.hex;
    state.paintMode = 'item';
    setRoomView('all');        // start looking at the whole house from inside
    setInstruction('decorate');
    renderToolbar();
  }

  /* ---- room views: split the grid into four quadrants, one per room ---- */
  function quadrantOf(key) {
    const G = state.gridSize;
    const mid = Math.ceil(G / 2);
    const idx = Object.keys(D.ROOMS).indexOf(key);
    const right = (idx === 1 || idx === 3);   // bathroom / living sit on +i
    const far = (idx === 2 || idx === 3);     // bedroom / living sit on +j
    return {
      i0: right ? mid : 0, i1: right ? G : mid,
      j0: far ? mid : 0, j1: far ? G : mid,
    };
  }
  function inQuadrant(q, i, j) { return i >= q.i0 && i < q.i1 && j >= q.j0 && j < q.j1; }

  // Switch between the whole-house view and a single room (camera + tappable tiles).
  function setRoomView(key) {
    state.roomView = key;
    applyInsideView(true);     // always look inside while decorating
    applyRoomVisibility();     // hide the other rooms when focused on one
    if (key === 'all') {
      state.baseTiles.forEach((t) => { t.visible = true; t.material.opacity = 0.18; });
      World.focusOn(state.lotX, 0, state.gridSize + 7);
      return;
    }
    // focus a single room: show only its tiles and zoom the camera in
    const q = quadrantOf(key);
    state.baseTiles.forEach((t) => {
      const c = t.userData.col;
      t.visible = inQuadrant(q, c.i, c.j);
      t.material.opacity = 0.4;
    });
    const w = colWorld((q.i0 + q.i1 - 1) / 2, (q.j0 + q.j1 - 1) / 2);
    World.focusOn(w.x, w.z, Math.max(5.5, state.gridSize * 0.42 + 3.5));
    // match the furniture palette to the room being decorated
    state.room = key;
    state.selectedItem = D.ROOMS[key].items[0];
    state.itemColor = state.selectedItem.hex;
  }

  // Show only the focused room's blocks + furniture (whole house shows all).
  function applyRoomVisibility() {
    const all = state.roomView === 'all';
    const q = all ? null : quadrantOf(state.roomView);
    state.buildBlocks.forEach((b) => {
      if (b.userData.kind === 'roof') { b.visible = false; return; }  // inside view while decorating
      const show = all || inQuadrant(q, b.userData.col.i, b.userData.col.j);
      b.visible = show;
      // frame the focused room a little more solidly than the whole-house fade
      if (show && !all && (b.userData.kind === 'wall' || b.userData.kind === 'window' || b.userData.kind === 'door')) {
        eachMesh(b, (m) => { m.material.opacity = 0.5; });
      }
    });
    state.decorItems.forEach((d) => {
      d.visible = all || (d.userData.col && inQuadrant(q, d.userData.col.i, d.userData.col.j));
    });
  }

  function placeFurniture(i, j) {
    if (!state.selectedItem) return;
    // when focused on one room, keep furniture inside that room
    if (state.roomView !== 'all' && !inQuadrant(quadrantOf(state.roomView), i, j)) return;
    const it = state.selectedItem;
    const w = colWorld(i, j);
    const m = World.makeFurniture(it.id, state.itemColor);
    // models stand on y=0, so place the group on the floor surface
    m.position.set(w.x, floorTopAt(i, j), w.z);
    m.userData.furniture = true;
    m.userData.col = { i, j };
    World.add(m);
    state.decorItems.push(m);
    Sound.play('place');
  }

  // Top Y of the floor in a column (so furniture sits on it). Falls back to the
  // platform surface when no floor block was placed there.
  function floorTopAt(i, j) {
    let top = 0.1;   // platform top
    state.buildBlocks.forEach((b) => {
      if (b.userData.kind === 'floor' && b.userData.col.i === i && b.userData.col.j === j) {
        top = Math.max(top, b.position.y + 0.5);
      }
    });
    return top;
  }

  // Climb from a raycast hit (a child cube) to the furniture group in decorItems.
  function furnitureRoot(obj) {
    while (obj && state.decorItems.indexOf(obj) === -1) obj = obj.parent;
    return obj;
  }

  function removeFurniture(group) {
    World.remove(group);
    state.decorItems = state.decorItems.filter((d) => d !== group);
    Sound.play('remove');
  }

  function paintShell(kind, hex) {
    state.buildBlocks.forEach((b) => {
      if (b.userData.kind === kind) eachMesh(b, (m) => m.material.color.set(D.hexToColor(hex)));
    });
    Sound.play('pick');
  }

  /* ================= PHASE: MOVE-IN ================= */
  function enterMoveIn() {
    state.phase = 'movein';
    setStatus(D.t('statuses.movein'));
    // make sure nothing stayed hidden from a single-room view
    state.buildBlocks.forEach((b) => { b.visible = true; });
    state.decorItems.forEach((d) => { d.visible = true; });
    applyInsideView(false);    // close the house back up so it looks finished
    state.roomView = 'all';
    World.focusOn(state.lotX, 0, state.gridSize + 8);   // pull back to admire the whole house
    setInstruction('movein');
    renderToolbar();

    // tidy the build helpers
    state.baseTiles.forEach((t) => World.remove(t));
    state.baseTiles = [];

    // register window glass + an interior lamp so the home glows at night
    state.buildBlocks.forEach((b) => {
      if (b.userData.kind !== 'window') return;
      const panes = [];
      eachMesh(b, (m) => { if (m.userData.glass) panes.push(m); });
      if (panes.length) panes.forEach((m) => World.registerNightLight(m, 1.2));
      else World.registerNightLight(b, 1.2);
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
    showCelebrate(D.t('welcomeHome'), D.t('cityHomes', state.avatar.name, state.finishedHouses));
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
        // find the tapped column from a placed block (stack) or an empty tile
        let col = null;
        const blockHit = World.intersect(ev, state.buildBlocks);
        if (blockHit.length) col = blockColumn(blockHit[0].object);
        if (!col) {
          const tileHit = World.intersect(ev, state.baseTiles);
          if (tileHit.length) col = tileHit[0].object.userData.col;
        }
        if (!col) break;
        if (state.buildTool === 'erase') removeTopOfColumn(col.i, col.j);
        else placeBlock(col.i, col.j);     // builds up: stacks on top of the column
        break;
      }
      case 'decorate': {
        const fHit = World.intersect(ev, state.decorItems);
        if (fHit.length) { const root = furnitureRoot(fHit[0].object); if (root) { removeFurniture(root); break; } }
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
      addTip(D.t('instruct.demolish'));
    } else if (state.phase === 'permission') {
      addTip(D.t('instruct.permission'));
    } else if (state.phase === 'clean') {
      addTip(D.t('instruct.clean'));
    } else if (state.phase === 'build') {
      // house-size stepper (4×4 … 20×20)
      elToolbar.appendChild(gridStepper());
      elToolbar.appendChild(sep());
      D.BLOCKS.forEach((b) => {
        const chip = mkChip(D.name(b), state.selectedBlock === b.id, () => {
          state.selectedBlock = b.id; Sound.play('pick'); renderToolbar();
        });
        chip.style.setProperty('--dot', b.hex);
        chip.classList.add('with-dot');
        elToolbar.appendChild(chip);
      });
      // eraser: tap a column to remove its top block instead of stacking
      elToolbar.appendChild(mkChip(D.t('eraser'), state.buildTool === 'erase', () => {
        state.buildTool = state.buildTool === 'erase' ? 'place' : 'erase';
        Sound.play('tab'); renderToolbar();
      }));
      elToolbar.appendChild(mkBtn(D.t('quickHouse'), 'btn-soft', quickHouse));
      elToolbar.appendChild(mkBtn(D.t('done'), 'btn-done', () => { Sound.play('done'); enterDecorate(); }));
    } else if (state.phase === 'decorate') {
      // view switch: whole house or zoom into one room to decorate it
      elToolbar.appendChild(mkChip('🏠 ' + D.t('wholeHouse'), state.roomView === 'all', () => {
        setRoomView('all'); Sound.play('tab'); renderToolbar();
      }));
      Object.keys(D.ROOMS).forEach((key) => {
        const r = D.ROOMS[key];
        elToolbar.appendChild(mkChip(D.name({ id: key, name: r.label }), state.roomView === key, () => {
          setRoomView(key); Sound.play('tab'); renderToolbar();
        }));
      });
      elToolbar.appendChild(sep());
      // items for the active room
      D.ROOMS[state.room].items.forEach((it) => {
        elToolbar.appendChild(mkChip(D.name(it), state.selectedItem && state.selectedItem.id === it.id, () => {
          state.selectedItem = it; state.itemColor = it.hex; Sound.play('pick'); renderToolbar();
        }));
      });
      elToolbar.appendChild(sep());
      // paint target
      ['item', 'wall', 'floor'].forEach((mode) => {
        const label = mode === 'item' ? D.t('paintItem') : mode === 'wall' ? D.t('paintWalls') : D.t('paintFloor');
        elToolbar.appendChild(mkChip(label, state.paintMode === mode, () => {
          state.paintMode = mode; Sound.play('tab'); renderToolbar();
        }));
      });
      // colour swatches
      D.MATERIALS.forEach((m) => {
        const s = document.createElement('button');
        s.className = 'swatch';
        s.style.background = m.hex; s.title = D.name(m);
        s.onclick = () => {
          if (state.paintMode === 'item') { state.itemColor = m.hex; Sound.play('pick'); }
          else paintShell(state.paintMode, m.hex);
        };
        elToolbar.appendChild(s);
      });
      elToolbar.appendChild(mkBtn(D.t('moveIn'), 'btn-done', () => { Sound.play('done'); enterMoveIn(); }));
    } else if (state.phase === 'movein') {
      addTip(D.t('welcomeTip'));
      elToolbar.appendChild(mkBtn(D.t('nextLot'), 'btn-done', nextLot));
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

  // A compact "House size: ➖ 5×5 ➕" control for the build toolbar.
  function gridStepper() {
    const wrap = document.createElement('div');
    wrap.className = 'grid-stepper';
    const label = document.createElement('span');
    label.className = 'gs-label';
    label.textContent = D.t('houseSize');
    const minus = mkBtn(D.t('smaller'), 'btn-soft gs-btn', () => setGridSize(state.gridSize - 1));
    const value = document.createElement('span');
    value.className = 'gs-value';
    value.textContent = `${state.gridSize}×${state.gridSize}`;
    const plus = mkBtn(D.t('bigger'), 'btn-soft gs-btn', () => setGridSize(state.gridSize + 1));
    minus.disabled = state.gridSize <= MIN_GRID;
    plus.disabled = state.gridSize >= MAX_GRID;
    wrap.append(label, minus, value, plus);
    return wrap;
  }
  function addTip(txt) { const d = document.createElement('div'); d.className = 'tb-tip'; d.textContent = txt; elToolbar.appendChild(d); }

  function setStatus(txt) { elStatus.textContent = txt; }

  function showProgress(p) {
    elProgress.classList.remove('hidden');
    elProgressFill.style.width = Math.round(p * 100) + '%';
    elProgress.querySelector('.progress-label').textContent =
      p >= 1 ? D.t('cleanDone') : D.t('cleanPct', Math.round(p * 100));
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

  // Persistent instructions bar: shows what to do in the current phase,
  // plus a steady reminder of the camera controls.
  function setInstruction(phaseKey) {
    const step = D.t(`instruct.${phaseKey}`) || D.t('instruct.fallback');
    elHowto.innerHTML =
      `<span class="howto-step">💡 ${step}</span>` +
      `<span class="howto-controls">${D.t('controls')}</span>`;
    elHowto.classList.remove('hidden');
  }
  // The ❓ button simply shows/hides the instructions bar.
  function showHelp() {
    elHowto.classList.toggle('hidden');
    Sound.play('tab');
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
    updateFalling(dt);   // demolition bricks tumbling under gravity
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

  function applyLanguage() {
    document.documentElement.lang = D.lang();
    const creatorTitle = document.querySelector('.creator-header h1');
    const creatorSub = document.querySelector('.creator-header p');
    if (creatorTitle) creatorTitle.textContent = D.t('creatorTitle');
    if (creatorSub) creatorSub.textContent = D.t('creatorSub');
    ['lang-toggle', 'lang-toggle-title'].forEach((id) => {
      const b = $(id);
      if (b) {
        b.textContent = D.t('langShort');
        b.title = D.t('langTitle');
      }
    });
    $('helpBtn').title = D.t('helpTitle');
    $('muteBtn').title = D.t('soundTitle');
    if (state.phase !== 'avatar') {
      setStatus(D.t(`statuses.${state.phase}`));
      setInstruction(state.phase);
      renderToolbar();
      const wasProgressHidden = elProgress.classList.contains('hidden');
      const progress = parseFloat(elProgressFill.style.width || '0') / 100;
      if (!wasProgressHidden) showProgress(progress);
    }
  }

  function toggleLanguage() {
    D.setLang(D.lang() === 'pl' ? 'en' : 'pl');
    window.dispatchEvent(new Event('kids-language-change'));
    applyLanguage();
  }

  window.addEventListener('DOMContentLoaded', init);
})();
