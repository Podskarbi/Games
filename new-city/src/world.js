/* ============================================================
   world.js — the 3D voxel world.
   Sets up Three.js, a friendly orbit camera that works with
   mouse, trackpad and touch, the day/night cycle, voxel block
   helpers, raycasting (tap-to-pick), poof particles, stars and
   streetlights. Game logic lives in game.js and talks to this.
   ============================================================ */

window.World = (function () {
  const D = window.GameData;

  let renderer, scene, camera;
  let sun, hemi, ambient;
  let stars;
  let nightLights = [];   // window/streetlight meshes that glow at night
  let particles = [];     // active poof particles
  let updateCb = null;

  // orbit state
  const target = new THREE.Vector3(0, 0.6, 0);
  let radius = 15, theta = 0.7, phi = 1.0;

  // day/night
  const CYCLE = 150;      // seconds for a full sun→night→sun loop
  let clockT = 0.18;      // start mid-morning
  let daylight = 1;

  const DAY_SKY = new THREE.Color(0x8fd0ff);
  const SUNSET_SKY = new THREE.Color(0xffb27a);
  const NIGHT_SKY = new THREE.Color(0x141a33);
  const tmpColor = new THREE.Color();

  let tapHandler = null;
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  function init(canvas) {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    scene = new THREE.Scene();
    scene.background = DAY_SKY.clone();
    scene.fog = new THREE.Fog(DAY_SKY.clone(), 30, 70);

    camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);

    // lights
    hemi = new THREE.HemisphereLight(0xffffff, 0x88aa77, 0.7);
    scene.add(hemi);
    ambient = new THREE.AmbientLight(0xffffff, 0.25);
    scene.add(ambient);
    sun = new THREE.DirectionalLight(0xfff3da, 1.1);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -20; sun.shadow.camera.right = 20;
    sun.shadow.camera.top = 20; sun.shadow.camera.bottom = -20;
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 80;
    scene.add(sun);
    scene.add(sun.target);

    // ground — a big cheerful grass plane
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x86c361 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    ground.userData.ground = true;
    scene.add(ground);

    // a soft road running through the lots
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x6f7b86 });
    const road = new THREE.Mesh(new THREE.PlaneGeometry(200, 4), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.02, 6.5);
    road.receiveShadow = true;
    scene.add(road);

    makeStars();
    setupControls(canvas);
    window.addEventListener('resize', resize);
    resize();
  }

  function makeStars() {
    const N = 400;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const u = Math.random(), v = Math.random();
      const tt = u * Math.PI * 2;
      const ph = Math.acos(2 * v - 1);
      const r = 80;
      pos[i * 3] = r * Math.sin(ph) * Math.cos(tt);
      pos[i * 3 + 1] = Math.abs(r * Math.cos(ph)) + 5;
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(tt);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7, transparent: true, opacity: 0 });
    stars = new THREE.Points(geo, mat);
    scene.add(stars);
  }

  /* ---------------- camera / orbit controls ---------------- */
  function setupControls(canvas) {
    const pointers = new Map();
    let lastX = 0, lastY = 0, downX = 0, downY = 0, downTime = 0, moved = false;
    let pinchDist = 0;

    canvas.addEventListener('pointerdown', (e) => {
      canvas.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      lastX = e.clientX; lastY = e.clientY;
      downX = e.clientX; downY = e.clientY; downTime = performance.now();
      moved = false;
      if (pointers.size === 2) {
        const pts = [...pointers.values()];
        pinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      }
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size === 2) {
        const pts = [...pointers.values()];
        const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (pinchDist) radius = clamp(radius * (pinchDist / d), 6, 34);
        pinchDist = d;
        moved = true;
        return;
      }

      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      if (Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 6) moved = true;
      theta -= dx * 0.008;
      phi = clamp(phi - dy * 0.008, 0.25, 1.45);
    });

    function up(e) {
      const wasMoved = moved;
      const dt = performance.now() - downTime;
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchDist = 0;
      if (!wasMoved && dt < 400 && pointers.size === 0 && tapHandler) {
        tapHandler(e);
      }
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', (e) => pointers.delete(e.pointerId));

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      radius = clamp(radius + Math.sign(e.deltaY) * 1.2, 6, 34);
    }, { passive: false });
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function updateCamera() {
    camera.position.set(
      target.x + radius * Math.sin(phi) * Math.sin(theta),
      target.y + radius * Math.cos(phi),
      target.z + radius * Math.sin(phi) * Math.cos(theta)
    );
    camera.lookAt(target);
  }

  function focusOn(x, z, r) {
    target.set(x, 0.6, z);
    if (r) radius = r;
  }

  /* ---------------- day / night ---------------- */
  function updateDayNight(dt) {
    clockT = (clockT + dt / CYCLE) % 1;
    const ang = clockT * Math.PI * 2;          // 0 = sunrise-ish
    const height = Math.sin(ang);              // -1..1
    daylight = clamp((height + 0.2) / 1.0, 0, 1);

    // sun position rides an arc across the sky
    sun.position.set(Math.cos(ang) * 25, Math.max(2, height * 30), 12);
    sun.intensity = 0.25 + daylight * 1.0;
    sun.color.setHSL(0.1, 0.4, 0.6 + daylight * 0.2);

    hemi.intensity = 0.2 + daylight * 0.6;
    ambient.intensity = 0.15 + daylight * 0.15;

    // sky colour: night → sunset → day blend
    if (daylight > 0.5) tmpColor.copy(SUNSET_SKY).lerp(DAY_SKY, (daylight - 0.5) / 0.5);
    else tmpColor.copy(NIGHT_SKY).lerp(SUNSET_SKY, daylight / 0.5);
    scene.background.copy(tmpColor);
    scene.fog.color.copy(tmpColor);

    stars.material.opacity = clamp(1 - daylight * 1.6, 0, 1);

    // window + streetlight glow grows as it gets dark
    const glow = clamp(1 - daylight * 1.4, 0, 1);
    for (const m of nightLights) {
      if (m.material && m.material.emissive) m.material.emissiveIntensity = glow * (m.userData.glowMax || 1);
      if (m.userData.lamp) m.userData.lamp.intensity = glow * 1.2;
    }
  }

  function getDaylight() { return daylight; }
  function setClock(t) { clockT = t; }

  /* ---------------- voxel helpers ---------------- */
  // A single voxel cube. opts: { glow, emissiveMax, opacity }
  function makeBlock(size, hex, opts) {
    opts = opts || {};
    const geo = new THREE.BoxGeometry(size, size, size);
    const mat = new THREE.MeshLambertMaterial({ color: D.hexToColor(hex) });
    if (opts.opacity != null && opts.opacity < 1) { mat.transparent = true; mat.opacity = opts.opacity; }
    if (opts.glow) {
      mat.emissive = new THREE.Color(D.hexToColor(hex));
      mat.emissiveIntensity = 0;
      mat.userData = mat.userData || {};
    }
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function makeBox(w, h, d, hex) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshLambertMaterial({ color: D.hexToColor(hex) })
    );
    mesh.castShadow = true; mesh.receiveShadow = true;
    return mesh;
  }

  /* ---------------- decorated structure blocks ----------------
     A build cell that actually looks like what it is: a door has a
     panel + handle, a window has a framed glass cross, a roof is a
     little peaked tile. Walls and floors stay simple cubes.
     Each returns a Group whose root carries the block; raycasting is
     recursive so taps on a child resolve to the column via game.js. */
  function makeStructureBlock(kind, hex) {
    if (kind === 'door') return makeDoorBlock(hex);
    if (kind === 'window') return makeWindowBlock(hex);
    if (kind === 'roof') return makeRoofBlock(hex);
    if (kind === 'floor') return makeFloorBlock(hex);
    return makeBlock(1, hex);   // wall
  }

  function makeDoorBlock(hex) {
    const g = new THREE.Group();
    const body = makeBox(1, 1, 1, hex);
    g.add(body);
    // a recessed darker door slab + gold knob on the front and back faces
    [0.5, -0.5].forEach((fz) => {
      const slab = makeBox(0.62, 0.86, 0.08, '#73421f');
      slab.position.set(0, -0.06, fz);
      g.add(slab);
      const knob = makeBox(0.1, 0.1, 0.1, '#ffd34d');
      knob.position.set(fz > 0 ? 0.18 : -0.18, -0.06, fz > 0 ? 0.56 : -0.56);
      g.add(knob);
    });
    return g;
  }

  function makeWindowBlock(hex) {
    const g = new THREE.Group();
    const frame = makeBox(1, 1, 1, '#f2f2f6');   // white frame cube
    g.add(frame);
    // glass pane + white cross on all four side faces
    const faces = [
      { axis: 'z', s: 0.5 }, { axis: 'z', s: -0.5 },
      { axis: 'x', s: 0.5 }, { axis: 'x', s: -0.5 },
    ];
    faces.forEach(({ axis, s }) => {
      const wide = axis === 'z';
      const glass = makeBox(wide ? 0.74 : 0.08, 0.74, wide ? 0.08 : 0.74, hex);
      glass.position[axis] = s + (s > 0 ? 0.01 : -0.01);
      glass.userData.glass = true;
      g.add(glass);
      // muntins (cross bars)
      const vBar = makeBox(wide ? 0.08 : 0.1, 0.74, wide ? 0.1 : 0.08, '#f2f2f6');
      vBar.position[axis] = s + (s > 0 ? 0.02 : -0.02);
      g.add(vBar);
      const hBar = makeBox(wide ? 0.74 : 0.1, 0.08, wide ? 0.1 : 0.74, '#f2f2f6');
      hBar.position[axis] = s + (s > 0 ? 0.02 : -0.02);
      g.add(hBar);
    });
    return g;
  }

  function makeRoofBlock(hex) {
    const g = new THREE.Group();
    const base = makeBox(1, 0.2, 1, hex);
    base.position.y = -0.4;
    g.add(base);
    const peak = new THREE.Mesh(
      new THREE.ConeGeometry(0.72, 0.95, 4),
      new THREE.MeshLambertMaterial({ color: D.hexToColor(hex) })
    );
    peak.rotation.y = Math.PI / 4;   // align the 4 sides with the cell
    peak.position.y = 0.05;
    peak.castShadow = true; peak.receiveShadow = true;
    g.add(peak);
    return g;
  }

  function makeFloorBlock(hex) {
    const g = new THREE.Group();
    const body = makeBox(1, 1, 1, hex);
    g.add(body);
    // a couple of plank grooves on the top face so floors read as floors
    const dark = '#00000022';
    for (const gx of [-0.28, 0.28]) {
      const groove = makeBox(0.04, 0.02, 0.92, '#8a5a2c');
      groove.position.set(gx, 0.5, 0);
      g.add(groove);
    }
    return g;
  }

  function add(obj) { scene.add(obj); return obj; }
  function remove(obj) {
    scene.remove(obj);
    nightLights = nightLights.filter((m) => m !== obj);
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) obj.material.dispose && obj.material.dispose();
  }

  function registerNightLight(mesh, glowMax) {
    if (!mesh.material.emissive) mesh.material.emissive = new THREE.Color(0xffe9a8);
    mesh.userData.glowMax = glowMax || 1;
    nightLights.push(mesh);
  }

  // Register a stand-alone PointLight (e.g. an interior lamp) to glow at night.
  function registerLamp(light) {
    const holder = new THREE.Object3D();
    holder.userData.lamp = light;
    nightLights.push(holder);
  }

  // A streetlight: pole + glowing lamp head that turns on at night.
  function addStreetLight(x, z) {
    const g = new THREE.Group();
    const pole = makeBox(0.12, 2.2, 0.12, '#444c55'); pole.position.y = 1.1; g.add(pole);
    const head = makeBox(0.4, 0.25, 0.4, '#ffe9a8'); head.position.y = 2.25;
    head.material.emissive = new THREE.Color(0xffe9a8); head.material.emissiveIntensity = 0;
    const lamp = new THREE.PointLight(0xffe2a0, 0, 7); lamp.position.set(0, 2.2, 0);
    head.userData.lamp = lamp;
    g.add(head); g.add(lamp);
    g.position.set(x, 0, z);
    scene.add(g);
    nightLights.push(head);
    return g;
  }

  /* ---------------- poof particles ---------------- */
  function poof(pos, hex, count) {
    count = count || 10;
    for (let i = 0; i < count; i++) {
      const m = makeBlock(0.12 + Math.random() * 0.1, hex);
      m.castShadow = false;
      m.position.copy(pos);
      m.userData.vel = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        2 + Math.random() * 3,
        (Math.random() - 0.5) * 4
      );
      m.userData.life = 0.6 + Math.random() * 0.3;
      scene.add(m);
      particles.push(m);
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.userData.life -= dt;
      p.userData.vel.y -= 9 * dt;
      p.position.addScaledVector(p.userData.vel, dt);
      p.rotation.x += dt * 6; p.rotation.y += dt * 5;
      const s = Math.max(0.01, p.userData.life);
      p.scale.setScalar(s + 0.2);
      if (p.userData.life <= 0 || p.position.y < 0) {
        scene.remove(p); p.geometry.dispose(); p.material.dispose();
        particles.splice(i, 1);
      }
    }
  }

  /* ---------------- raycasting ---------------- */
  function intersect(ev, objects, recursive) {
    const rect = renderer.domElement.getBoundingClientRect();
    ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    ray.setFromCamera(ndc, camera);
    return ray.intersectObjects(objects, recursive !== false);
  }
  function setTapHandler(fn) { tapHandler = fn; }

  /* ---------------- main loop ---------------- */
  let last = performance.now();
  function start(cb) {
    updateCb = cb;
    last = performance.now();
    requestAnimationFrame(loop);
  }
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    updateDayNight(dt);
    updateParticles(dt);
    if (updateCb) updateCb(dt);
    updateCamera();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }

  return {
    init, start, focusOn,
    makeBlock, makeBox, makeStructureBlock, add, remove, poof,
    registerNightLight, registerLamp, addStreetLight,
    intersect, setTapHandler,
    getDaylight, setClock,
    get scene() { return scene; },
    get camera() { return camera; },
  };
})();
