/* 造島工坊：Three.js 即時群島預覽（示意）——跟著島型、風格、字體、配色、功能一起變
   生活感模式：會走動的居民（點了會聊天、交易）、鳥群、雲、帆船、日夜循環與夜燈 */
(function () {
  const stage = document.getElementById('stage');
  const canvas = document.getElementById('canvas');
  const labelLayer = document.getElementById('labels');
  let renderer, scene, camera, group, sea, seaPos, seaBase, sun, hemi, sky, stars, sunGlow, moonGlow, plazaLight;
  let yaw = 0.6, pitch = 0.82, dist = 40, auto = true;
  let baseDist = 40, zoomed = false;
  let labels = [], movers = [], clouds = [], waves = [], birds = [], npcs = [], glows = [], boats = [], foams = [], shells = [], flies = null;
  let lastKey = '';
  let hot = -1;
  let style = 'lowpoly';
  let life = true, theme = { bg: '#f6f0e4' }, dark = false;
  let wasDark = false, tod = 0.40, todMode = 'auto', night = 0, visible = true;
  let autoBg = null, autoSlot = -1;   /* 2026-10-30：底色跟著時段 [白天, 黃昏, 夜晚] */
  let cloudMat, birdMat, glowTex;
  const bag = { '🐚': 3 };
  let talk = null;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let hud, clockEl, bagEl, bubble;
  let shape = 'sea', detail = 3, bridges = [], tints = [];
  const DENS = { 1: .5, 2: 1, 3: 1.5, 4: 2.2 };

  function ok() {
    try {
      if (!window.THREE) return false;
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      return true;
    } catch (e) { return false; }
  }
  function lum(hex) {
    const c = new THREE.Color(hex);
    return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  }
  function mix(a, b, t) { return new THREE.Color(a).lerp(new THREE.Color(b), t); }
  /* 固定亂數：同一份資料每次長得一樣，不會一改字就整片重洗 */
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function hash(str) { let h = 2166136261; for (const ch of String(str)) h = Math.imul(h ^ ch.codePointAt(0), 16777619); return h >>> 0; }

  /* 風格：顏色處理與材質 */
  const STYLE = {
    lowpoly:      { tint: null, k: 0, flat: true },
    illustration: { tint: '#ffe2b8', k: .18 },
    watercolor:   { tint: '#ffffff', k: .38 },
    toy:          { tint: null, k: 0, shiny: true, sat: .25 },
    scifi:        { tint: '#1b2a4a', k: .25, glow: true },
    paper:        { tint: '#e8d8b6', k: .45, flat: true },
    cartoon:      { tint: null, k: 0, outline: true, sat: .2 },
    ocean:        { tint: '#bfe8f0', k: .12, waves: true },
    cloud:        { tint: '#f4f6ff', k: .22, clouds: true }
  };
  function col(c) {
    const st = STYLE[style];
    let out = new THREE.Color(c);
    if (st.sat) { const h = {}; out.getHSL(h); out.setHSL(h.h, Math.min(1, h.s + st.sat), h.l); }
    if (st.tint) out = out.lerp(new THREE.Color(st.tint), st.k);
    return out;
  }
  function mat(c) {
    const st = STYLE[style];
    if (st.shiny) return new THREE.MeshPhongMaterial({ color: col(c), shininess: 70, flatShading: true });
    return new THREE.MeshLambertMaterial({ color: col(c), flatShading: !!st.flat });
  }
  function deco(mesh) {
    const st = STYLE[style];
    if (st.outline || st.glow) {
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 30),
        new THREE.LineBasicMaterial({ color: st.glow ? IF_ACCENT : 0x222222, transparent: true, opacity: st.glow ? .9 : .7 }));
      mesh.add(e);
    }
    return mesh;
  }
  let IF_ACCENT = 0xffb65c;
  /* 幾何小積木 */
  function box(w, h, d, c, x = 0, y = 0, z = 0) { const m = deco(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c))); m.position.set(x, y + h / 2, z); return m; }
  function cyl(rt, rb, h, c, seg = 8, x = 0, y = 0, z = 0) { const m = deco(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(c))); m.position.set(x, y + h / 2, z); return m; }
  function cone(r, h, c, seg = 6, x = 0, y = 0, z = 0) { const m = deco(new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat(c))); m.position.set(x, y + h / 2, z); return m; }
  function ball(r, c, x = 0, y = 0, z = 0, seg = 10) { const m = deco(new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(6, seg - 2)), mat(c))); m.position.set(x, y, z); return m; }
  function grp(...a) { const g = new THREE.Group(); a.forEach(o => g.add(o)); return g; }

  /* 各島型的地標（s = 大小倍率；p = 主色、a = 強調色） */
  const LAND = {
    course: (s, p, a) => grp(box(1.6 * s, .35 * s, 1.1 * s, p), box(1.5 * s, .35 * s, 1.05 * s, a, 0, .35 * s), box(1.4 * s, .35 * s, 1 * s, '#fffaf1', 0, .7 * s), cone(.5 * s, .7 * s, a, 4, 0, 1.05 * s)),
    life: (s, p, a) => grp(box(1.3 * s, 1 * s, 1.1 * s, '#fffaf1'), cone(1.05 * s, .8 * s, a, 4, 0, 1 * s), box(.3 * s, .5 * s, .05 * s, p, 0, 0, .56 * s), cyl(.12 * s, .12 * s, 1.2 * s, '#8a5a2b', 6, .9 * s), ball(.45 * s, p, .9 * s, 1.4 * s)),
    treasure: (s, p, a) => {
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(.45 * s, .45 * s, 1.4 * s, 10, 1, false, 0, Math.PI), mat(a));
      deco(lid); lid.rotation.z = Math.PI / 2; lid.position.y = .75 * s;
      return grp(box(1.4 * s, .75 * s, .9 * s, p), lid, box(.3 * s, .35 * s, .1 * s, '#f7d36b', 0, .35 * s, .46 * s));
    },
    local: (s, p, a) => grp(box(1.6 * s, .08 * s, 1.2 * s, p), cyl(.06 * s, .06 * s, .9 * s, '#555', 6), ball(.42 * s, a, 0, 1.25 * s), cone(.3 * s, .5 * s, a, 8, 0, .62 * s).rotateX(Math.PI)),
    expo: (s, p, a) => grp(cyl(.9 * s, .9 * s, .9 * s, '#fffaf1', 10), cone(1.15 * s, .9 * s, a, 10, 0, .9 * s), cyl(.04 * s, .04 * s, .6 * s, '#555', 4, 0, 1.8 * s), box(.4 * s, .25 * s, .02 * s, p, .2 * s, 2.15 * s)),
    science: (s, p, a) => { const g = grp(cyl(.15 * s, .35 * s, .5 * s, '#8a8a8a', 8), ball(.85 * s, p, 0, 1.4 * s, 0, 14)); const ring = new THREE.Mesh(new THREE.TorusGeometry(1.25 * s, .07 * s, 6, 28), mat(a)); ring.position.y = 1.4 * s; ring.rotation.x = 1.2; g.add(ring); g.userData.spin = ring; return g; },
    live: (s, p, a) => grp(cyl(.08 * s, .08 * s, 1 * s, '#666', 6, -.6 * s), cyl(.08 * s, .08 * s, 1 * s, '#666', 6, .6 * s), box(1.7 * s, 1 * s, .15 * s, p, 0, .9 * s), box(1.4 * s, .7 * s, .05 * s, '#1b2a3a', 0, 1.05 * s, .09 * s), ball(.16 * s, a, .75 * s, 2.05 * s)),
    runner: (s, p, a) => grp(box(.3 * s, 1.5 * s, .3 * s, p, -.8 * s), box(.3 * s, 1.5 * s, .3 * s, p, .8 * s), box(1.9 * s, .3 * s, .35 * s, a, 0, 1.5 * s), box(.35 * s, .02 * s, 1.6 * s, '#fffaf1', -.4 * s), box(.35 * s, .02 * s, 1.6 * s, '#fffaf1', .4 * s)),
    empathy: (s, p, a) => grp(cyl(.28 * s, .35 * s, .9 * s, p, 8, -.45 * s), ball(.3 * s, '#f1c9a5', -.45 * s, 1.2 * s), cyl(.28 * s, .35 * s, .9 * s, a, 8, .45 * s), ball(.3 * s, '#f1c9a5', .45 * s, 1.2 * s), ball(.25 * s, '#e06a7a', 0, 1.75 * s)),
    literature: (s, p, a) => grp(box(.7 * s, .9 * s, .7 * s, '#fffaf1', -.5 * s), cone(.6 * s, .5 * s, p, 4, -.5 * s, .9 * s), box(.7 * s, 1.3 * s, .7 * s, '#f3e2c4', .45 * s), cone(.6 * s, .5 * s, a, 4, .45 * s, 1.3 * s)),
    portfolio: (s, p, a) => grp(box(1.2 * s, .08 * s, 1 * s, '#fffaf1'), box(1.2 * s, .9 * s, .08 * s, p, 0, .08 * s, -.46 * s), box(.08 * s, .9 * s, 1 * s, p, -.56 * s, .08 * s), box(.5 * s, .3 * s, .35 * s, '#c9a27a', .1 * s, .08 * s, -.1 * s), cyl(.12 * s, .16 * s, .4 * s, a, 6, .1 * s, .38 * s, .3 * s), ball(.13 * s, '#f1c9a5', .1 * s, .9 * s, .3 * s), box(.06 * s, .5 * s, .06 * s, '#555', .5 * s, .08 * s, .4 * s), box(.5 * s, .22 * s, .03 * s, a, .5 * s, .66 * s, .4 * s)),
    quest: (s, p, a) => grp(cyl(.55 * s, .65 * s, 1.6 * s, '#d8d0c0', 8), cone(.7 * s, .8 * s, p, 8, 0, 1.6 * s), cyl(.03 * s, .03 * s, .6 * s, '#555', 4, 0, 2.4 * s), box(.4 * s, .25 * s, .02 * s, a, .2 * s, 2.75 * s))
  };

  /* ---------- 天色：0＝午夜、0.25＝日出、0.5＝正午、0.75＝日落 ---------- */
  const SKY = [
    { t: 0,    top: '#0a1230', hor: '#1c2a52', sun: .12, hemi: .30, sc: '#8fa6ff', n: 1 },
    { t: .21,  top: '#24356a', hor: '#e9977a', sun: .25, hemi: .40, sc: '#ffb27a', n: .55 },
    { t: .29,  top: '#68ade6', hor: '#ffe2bc', sun: .75, hemi: .55, sc: '#ffe7c4', n: 0 },
    { t: .5,   top: '#4f9fe6', hor: '#d3ecf8', sun: .95, hemi: .62, sc: '#ffffff', n: 0 },
    { t: .69,  top: '#689dd6', hor: '#ffdcae', sun: .80, hemi: .55, sc: '#fff0d8', n: 0 },
    { t: .77,  top: '#394d8c', hor: '#ff8d5c', sun: .38, hemi: .42, sc: '#ff9a5c', n: .35 },
    { t: .85,  top: '#121b40', hor: '#3a3566', sun: .14, hemi: .32, sc: '#9fb0ff', n: .9 },
    { t: 1,    top: '#0a1230', hor: '#1c2a52', sun: .12, hemi: .30, sc: '#8fa6ff', n: 1 }
  ];
  const TOD = { day: .42, dusk: .735, night: .94 };
  function skyAt(t) {
    let i = 0;
    while (i < SKY.length - 2 && SKY[i + 1].t <= t) i++;
    const a = SKY[i], b = SKY[i + 1], k = (t - a.t) / (b.t - a.t || 1);
    const sm = k * k * (3 - 2 * k);
    return {
      top: mix(a.top, b.top, sm), hor: mix(a.hor, b.hor, sm), sc: mix(a.sc, b.sc, sm),
      sun: a.sun + (b.sun - a.sun) * sm, hemi: a.hemi + (b.hemi - a.hemi) * sm, n: a.n + (b.n - a.n) * sm
    };
  }
  function makeGlowTex() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(.25, 'rgba(255,255,255,.75)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }
  function glow(color, size) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    s.scale.setScalar(size);
    return s;
  }

  function init() {
    if (!ok()) { document.getElementById('noWebgl').hidden = false; return false; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(40, 1, 0.1, 400);
    glowTex = makeGlowTex();
    hemi = new THREE.HemisphereLight(0xffffff, 0x6f8585, 0.55);
    scene.add(hemi);
    sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(10, 20, 8);
    sun.castShadow = true;
    const sz = innerWidth < 700 ? 1024 : 2048;
    sun.shadow.mapSize.set(sz, sz);
    Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 90 });
    sun.shadow.bias = -0.0008;
    scene.add(sun);
    plazaLight = new THREE.PointLight(0xffc27a, 0, 16, 2);
    plazaLight.position.set(0, 4, 0);
    scene.add(plazaLight);

    /* 天空穹頂：上下漸層 */
    sky = new THREE.Mesh(new THREE.SphereGeometry(180, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color('#4f9fe6') }, hor: { value: new THREE.Color('#d3ecf8') } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 hor; varying vec3 vP; void main(){ float h = max(vP.y, 0.0); gl_FragColor = vec4(mix(hor, top, pow(h, 0.55)), 1.0); }'
    }));
    scene.add(sky);
    /* 星星 */
    const sp = [], R = rng(7);
    for (let k = 0; k < 500; k++) {
      const th = R() * Math.PI * 2, ph = Math.acos(1 - R() * .95);
      sp.push(Math.sin(ph) * Math.cos(th) * 170, Math.cos(ph) * 170, Math.sin(ph) * Math.sin(th) * 170);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
    scene.add(stars);
    sunGlow = glow(0xffe6b0, 34); scene.add(sunGlow);
    moonGlow = glow(0xdfe8ff, 16); scene.add(moonGlow);

    /* 海面：會起伏的低多邊形波浪 */
    const sgeo = new THREE.PlaneGeometry(240, 240, 72, 72);
    sgeo.rotateX(-Math.PI / 2);
    seaPos = sgeo.attributes.position;
    seaBase = Float32Array.from(seaPos.array);
    sea = new THREE.Mesh(sgeo, new THREE.MeshPhongMaterial({ color: 0x8fc9c2, flatShading: true, shininess: 60, specular: 0x9fd7e0, transparent: true, opacity: .96 }));
    sea.receiveShadow = true;
    scene.add(sea);
    group = new THREE.Group();
    scene.add(group);
    cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true, transparent: true, opacity: .94 });
    birdMat = new THREE.MeshLambertMaterial({ color: 0xfafafa, side: THREE.DoubleSide, flatShading: true });
    buildHud();
    bindDrag();
    new ResizeObserver(resize).observe(stage);
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(stage);
    resize();
    loop();
    return true;
  }
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  /* ---------- 畫面上的小工具：時鐘、時段、背包、對話泡泡 ---------- */
  function stop(el) { el.addEventListener('pointerdown', e => e.stopPropagation()); el.addEventListener('wheel', e => e.stopPropagation()); }
  function buildHud() {
    hud = document.createElement('div');
    hud.className = 'stage-hud';
    hud.innerHTML = '<span class="tod-clock" aria-live="off"></span><span class="tod-btns" role="group" aria-label="預覽時段">' +
      [['auto', '⏱', '時間自動流動'], ['day', '☀️', '白天'], ['dusk', '🌇', '黃昏'], ['night', '🌙', '夜晚']]
        .map(([k, i, t]) => `<button type="button" data-tod="${k}" title="${t}" aria-label="${t}"${k === 'auto' ? ' class="on"' : ''}>${i}</button>`).join('') + '</span>';
    clockEl = hud.querySelector('.tod-clock');
    hud.querySelectorAll('[data-tod]').forEach(b => b.addEventListener('click', () => setTod(b.dataset.tod)));
    stop(hud);
    stage.appendChild(hud);
    bagEl = document.createElement('div');
    bagEl.className = 'stage-bag';
    bagEl.title = '背包：點沙灘上的貝殼撿起來，再跟居民交換東西';
    stop(bagEl);
    stage.appendChild(bagEl);
    bubble = document.createElement('div');
    bubble.className = 'npc-bubble';
    bubble.hidden = true;
    bubble.setAttribute('role', 'dialog');
    stop(bubble);
    stage.appendChild(bubble);
    addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      if (talk) closeTalk(); else if (cine && cine.kind === 'intro') skipCine(); else if (focus) backToOverview();
    });
    renderBag();
  }
  function setTod(mode) {
    todMode = mode;
    hud.querySelectorAll('[data-tod]').forEach(b => b.classList.toggle('on', b.dataset.tod === mode));
  }
  function renderBag() {
    const items = Object.entries(bag).filter(([, n]) => n > 0);
    bagEl.innerHTML = '<b>🎒</b>' + (items.length ? items.map(([k, n]) => `<span>${k}×${n}</span>`).join('') : '<span class="empty">空空的</span>');
    bagEl.hidden = !life;
  }

  function bindDrag() {
    let down = null;
    stage.addEventListener('pointerdown', e => {
      if (cine && cine.kind === 'intro') { skipCine(); return; }
      down = { x: e.clientX, y: e.clientY, yaw, pitch, moved: false }; stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener('pointermove', e => {
      if (!down) return;
      if (Math.abs(e.clientX - down.x) + Math.abs(e.clientY - down.y) > 6) { if (!down.moved && focus) backToOverview(); down.moved = true; auto = false; }
      if (!down.moved || cine) return;
      yaw = down.yaw - (e.clientX - down.x) * 0.008;
      pitch = Math.min(1.35, Math.max(0.3, down.pitch + (e.clientY - down.y) * 0.006));
    });
    const up = e => {
      if (down && !down.moved && e.type === 'pointerup') pick(e);
      down = null;
    };
    stage.addEventListener('pointerup', up);
    stage.addEventListener('pointercancel', up);
    stage.addEventListener('wheel', e => { e.preventDefault(); if (focus) { backToOverview(); return; } if (cine) return; zoomed = true; dist = Math.min(80, Math.max(14, dist + e.deltaY * 0.03)); }, { passive: false });
  }
  const ray = new THREE.Raycaster();
  function pick(e) {
    if (cine && cine.kind === 'intro') { skipCine(); return; }
    const pool = life ? npcs : npcs.filter(n => n.animal);
    if (!pool.length) return;
    const r = stage.getBoundingClientRect();
    const p = new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(p, camera);
    const targets = pool.map(n => n.hit).concat(life ? shells.filter(s => s.obj.visible).map(s => s.obj) : []);
    const hit = ray.intersectObjects(targets, true)[0];
    if (!hit) {
      /* 手機手指比較粗：找螢幕上最近的居民 */
      let best = null, bd = innerWidth < 700 ? 34 : 22;
      pool.forEach(n => {
        const v = n.obj.getWorldPosition(new THREE.Vector3()); v.y += 1; v.project(camera);
        const d = Math.hypot((v.x + 1) / 2 * r.width - (e.clientX - r.left), (1 - v.y) / 2 * r.height - (e.clientY - r.top));
        if (d < bd && v.z < 1) { bd = d; best = n; }
      });
      if (best) openTalk(best); else if (talk) closeTalk();
      return;
    }
    let o = hit.object;
    while (o && !o.userData.npc && !o.userData.shell) o = o.parent;
    if (!o) return;
    if (o.userData.shell) collect(o.userData.shell);
    else openTalk(o.userData.npc);
  }
  function collect(s) {
    s.obj.visible = false;
    bag['🐚'] = (bag['🐚'] || 0) + 1;
    renderBag();
    bagEl.classList.remove('pop'); void bagEl.offsetWidth; bagEl.classList.add('pop');
    setTimeout(() => { s.obj.visible = true; }, 20000);
  }

  /* ---------- 居民 ---------- */
  const NAMES = ['阿海', '小葵', '阿木', '米米', '阿樂', '小晴', '阿德', '露露', '阿星', '小穗', '阿布', '圓圓', '阿翔', '小芽', '阿柚', '朵朵'];
  const JOBS = ['漁夫', '花農', '麵包師', '郵差', '園丁', '畫家', '書僮', '水手', '果農', '燈塔守', '木匠', '茶師'];
  const SKIN = ['#f1c9a5', '#e5b48c', '#c98e66', '#f6d7bd', '#a8714f'];
  const CLOTH = ['#e46a5e', '#4f8fd6', '#f2b33d', '#5aa36b', '#9b6ad6', '#e58ab2', '#3fa7a0', '#f08a3c'];
  const GOODS = [['🐚', '🍎'], ['🐚', '🐟'], ['🍎', '🌸'], ['🐟', '📜'], ['🐚', '🍞'], ['🌸', '⭐'], ['🍞', '🧭'], ['📜', '💎']];
  function villager(R) {
    const skin = SKIN[Math.floor(R() * SKIN.length)], cloth = CLOTH[Math.floor(R() * CLOTH.length)], pants = ['#3b4a6b', '#5a4636', '#2f3a3a', '#6b5a8a'][Math.floor(R() * 4)];
    const legL = grp(box(.08, .26, .09, pants, 0, -.26)), legR = grp(box(.08, .26, .09, pants, 0, -.26));
    legL.position.set(-.06, .26, 0); legR.position.set(.06, .26, 0);
    const armL = grp(box(.06, .24, .07, cloth, 0, -.24)), armR = grp(box(.06, .24, .07, cloth, 0, -.24));
    armL.position.set(-.17, .56, 0); armR.position.set(.17, .56, 0);
    const hat = R() < .5 ? cone(.17, .14, ['#d9b46a', '#e46a5e', '#ffffff', '#3b4a6b'][Math.floor(R() * 4)], 8, 0, .86) : ball(.15, ['#3a2a1e', '#6b4a2b', '#1e1e1e', '#c98e3a'][Math.floor(R() * 4)], 0, .8, -.02, 8);
    const g = grp(legL, legR, cyl(.13, .16, .34, cloth, 8, 0, .24), armL, armR, ball(.14, skin, 0, .73, 0, 10), ball(.025, '#222', -.05, .75, .13, 5), ball(.025, '#222', .05, .75, .13, 5), hat);
    g.userData.parts = { legL, legR, armL, armR };
    g.scale.setScalar(1.5);
    return g;
  }
  function addNpc(spec) {
    const R = rng(spec.seed);
    const obj = spec.obj || villager(R);
    obj.traverse(o => { o.userData.npc = null; });
    const n = Object.assign({ obj, hit: obj, R, t: 0, wait: R() * 2, phase: R() * 6, speed: .9 + R() * .5, talking: false }, spec);
    obj.userData.npc = n;
    if (spec.crate) { n.box = box(.32, .24, .32, '#c9a27a', 0, .98, 0); n.box.add(box(.34, .04, .06, '#8a5a35', 0, .1, 0)); obj.add(n.box); }
    obj.position.set(spec.x, spec.y, spec.z);
    if (n.kind === 'wander') { const a0 = R() * Math.PI * 2, d0 = (n.rin + n.rout) / 2; obj.position.set(n.cx + Math.cos(a0) * d0, n.y, n.cz + Math.sin(a0) * d0); }
    group.add(obj);
    npcs.push(n);
    return n;
  }
  function lineFor(n) {
    if (n.animal) return n.lines.concat([night > .6 ? '呼…好睏，晚上要早點睡。' : '今天天氣真好，要不要一起散步？']);
    const tip = night > .6 ? '天黑了，路燈和窗戶都亮起來，好有氣氛。' : tod > .7 && tod < .82 ? '夕陽好漂亮，等一下要回家吃飯了。' : '今天天氣真好，海風吹起來好舒服。';
    return n.lines.concat([tip]);
  }
  function openTalk(n) {
    if (talk && talk !== n) talk.talking = false;
    talk = n; n.talking = true; n.li = (n.li ?? -1) + 1;
    const lines = lineFor(n);
    if (!n.trade) {
      bubble.innerHTML = `<button type="button" class="x" aria-label="關閉">✕</button><b>${esc(n.title)}</b><p>${esc(lines[n.li % lines.length])}</p><div class="acts"><button type="button" data-a="talk">💬 再聊聊</button></div>`;
      bubble.hidden = false;
      bubble.querySelector('.x').onclick = closeTalk;
      bubble.querySelector('[data-a="talk"]').onclick = () => openTalk(n);
      n.hop = .5;
      return;
    }
    const [give, get] = n.trade;
    const have = bag[give] || 0;
    bubble.innerHTML = `<button type="button" class="x" aria-label="關閉">✕</button><b>${n.title}</b><p>${esc(lines[n.li % lines.length])}</p>` +
      `<div class="acts"><button type="button" data-a="talk">💬 再聊聊</button><button type="button" data-a="trade"${have ? '' : ' disabled'}>🔁 用 ${give} 換 ${get}</button></div>` +
      (have ? '' : `<small>${give === '🐚' ? '背包沒有貝殼了：點沙灘上的白色貝殼可以撿。' : `還沒有 ${give}，先跟別的居民換換看。`}</small>`);
    bubble.hidden = false;
    bubble.querySelector('.x').onclick = closeTalk;
    bubble.querySelector('[data-a="talk"]').onclick = () => openTalk(n);
    bubble.querySelector('[data-a="trade"]').onclick = () => {
      bag[give]--; bag[get] = (bag[get] || 0) + 1; renderBag();
      bubble.querySelector('p').textContent = `成交！${give} 給你換了一個 ${get}，謝謝光顧～`;
      bubble.querySelector('[data-a="trade"]').disabled = !(bag[give] > 0);
      n.wave = 1.6;
      bagEl.classList.remove('pop'); void bagEl.offsetWidth; bagEl.classList.add('pop');
    };
    n.wave = 1.6;
  }
  function closeTalk() { if (talk) talk.talking = false; talk = null; bubble.hidden = true; }
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  /* ---------- 島嶼：起伏的海岸、沙灘、草地、岩石、花、樹 ---------- */
  function wobble(geo, seed, amp) {
    const p = geo.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const x = p.getX(k), z = p.getZ(k), a = Math.atan2(z, x);
      const f = 1 + amp * (Math.sin(3 * a + seed) * .6 + Math.sin(5 * a + seed * 2.3) * .4);
      p.setX(k, x * f); p.setZ(k, z * f);
    }
    geo.computeVertexNormals();
    return geo;
  }
  /* 2026-10-30 新島形：岩壁、沙灘、草地顏色與樹種 */
  const SHAPE_LOOK = {
    volcano: { cliff: '#5b4a42', beach: '#4a4542', top: c => mix(c, '#6b7a3a', .5) },
    snow: { cliff: '#a9b9c6', beach: '#e3edf3', top: () => new THREE.Color('#f3f7fa') },
    desert: { cliff: '#c48d55', beach: '#f1dca6', top: () => new THREE.Color('#e7c784') },
    jungle: { cliff: '#7d6a4a', beach: '#e2cf98', top: c => mix(c, '#2f7a3a', .55), trees: 2.2 },
    mushroom: { cliff: '#b89a78', beach: '#efdcae', top: c => mix(c, '#7ccf5a', .5) }
  };
  function isle(radius, color, height, seed) {
    const m = (geo, c) => deco(new THREE.Mesh(geo, mat(c)));
    const SL = SHAPE_LOOK[shape] || {};
    if (SL.top) color = SL.top(color);
    const cliff = m(wobble(new THREE.CylinderGeometry(radius * 1.02, radius * .72, height, 14, 2), seed, .09), SL.cliff || (shape === 'float' ? '#b08a5e' : '#cdb58a'));
    cliff.position.y = height * .5 - .35;
    const top = m(wobble(new THREE.CylinderGeometry(radius * .98, radius * 1.02, .3, 14), seed, .09), color);
    top.position.y = height - .15;
    const g = grp(cliff, top);
    if (shape === 'float') {
      /* 浮空島：倒錐形岩層，分兩層色階 */
      const rock = m(wobble(new THREE.ConeGeometry(radius * .74, radius * 1.9, 12, 2), seed + 2, .12), '#9a7552');
      rock.rotation.x = Math.PI; rock.position.y = -.35 - radius * .95;
      const tip = m(wobble(new THREE.ConeGeometry(radius * .32, radius * .9, 8), seed + 3, .15), '#7d5d40');
      tip.rotation.x = Math.PI; tip.position.y = -.35 - radius * 1.9 - radius * .3;
      g.add(rock, tip);
    } else {
      const beach = m(wobble(new THREE.CylinderGeometry(radius * 1.14, radius * 1.2, .3, 16), seed + 1, .08), SL.beach || '#ecd9a8');
      beach.position.y = .05;
      g.add(beach);
    }
    if (shape === 'terrace') {
      /* 層疊台地：兩階梯田，外緣土石、上緣草地 */
      [[1.2, .42], [1.1, .74]].forEach(([rf, hf], k) => {
        const h = height * hf;
        const earth = m(wobble(new THREE.CylinderGeometry(radius * rf, radius * (rf + .03), h, 16), seed + 4 + k, .08), k ? '#c4a06e' : '#b38c5c');
        earth.position.y = h / 2 - .1;
        const grass = m(wobble(new THREE.CylinderGeometry(radius * (rf - .01), radius * rf, .1, 16), seed + 4 + k, .08), mix(color, '#6fae4f', .3 + k * .1));
        grass.position.y = h - .08;
        g.add(earth, grass);
      });
    }
    g.userData.top = height;
    g.userData.r = radius;
    return g;
  }
  function pine(s) { return grp(cyl(.07 * s, .09 * s, .35 * s, '#7a4f2a', 5), cone(.42 * s, .6 * s, '#3f8a4f', 7, 0, .3 * s), cone(.32 * s, .5 * s, '#4f9f5a', 7, 0, .6 * s), cone(.2 * s, .4 * s, '#62b26a', 7, 0, .88 * s)); }
  function roundTree(s, c) { return grp(cyl(.07 * s, .1 * s, .5 * s, '#7a4f2a', 5), ball(.42 * s, c, 0, .8 * s, 0, 7), ball(.28 * s, c, .22 * s, .62 * s, .1 * s, 6)); }
  function palm(s) {
    const g = grp(cyl(.05 * s, .08 * s, 1.1 * s, '#9a6a3a', 5));
    for (let k = 0; k < 5; k++) { const l = box(.12 * s, .02 * s, .6 * s, '#4caf62', 0, 0, .3 * s); const p = grp(l); p.position.y = 1.1 * s; p.rotation.set(-.5, k / 5 * Math.PI * 2, 0); g.add(p); }
    return g;
  }
  function cactus(s) { const c = '#4f9a4a'; return grp(cyl(.1 * s, .12 * s, .9 * s, c, 7), cyl(.06 * s, .06 * s, .35 * s, c, 6, .2 * s, .35 * s, 0), cyl(.06 * s, .06 * s, .3 * s, c, 6, -.19 * s, .45 * s, 0), box(.2 * s, .06 * s, .07 * s, c, .1 * s, .33 * s, 0), box(.2 * s, .06 * s, .07 * s, c, -.1 * s, .43 * s, 0)); }
  function shroom(s, c) {
    const cap = ball(.38 * s, c, 0, .55 * s, 0, 10); cap.scale.y = .62;
    const g = grp(cyl(.09 * s, .13 * s, .55 * s, '#f6efe2', 7), cap);
    for (let k = 0; k < 5; k++) { const a = k / 5 * 6.28; g.add(ball(.06 * s, '#ffffff', Math.cos(a) * .25 * s, .7 * s, Math.sin(a) * .25 * s, 5)); }
    return g;
  }
  function treeFor(R, s) {
    const s2 = s * (.8 + R() * .4);
    if (shape === 'snow') { const g = pine(s2); g.add(cone(.24 * s2, .22 * s2, '#ffffff', 7, 0, 1.0 * s2), cone(.36 * s2, .12 * s2, '#ffffff', 7, 0, .72 * s2)); return g; }
    if (shape === 'desert') return R() < .6 ? cactus(s2) : palm(s);
    if (shape === 'mushroom') return R() < .75 ? shroom(s * (.9 + R() * .7), ['#e2463a', '#f08a3a', '#9b6ad6', '#e2463a'][Math.floor(R() * 4)]) : roundTree(s2, '#6ab04c');
    if (shape === 'jungle') return R() < .45 ? palm(s * (1.1 + R() * .4)) : roundTree(s * (1.05 + R() * .45), ['#2f7a3a', '#3f8a4f', '#4f9f5a', '#5a9a3a'][Math.floor(R() * 4)]);
    const pick = shape === 'atoll' && R() < .5 ? .9 : R();
    return pick < .4 ? pine(s2) : pick < .8 ? roundTree(s2, ['#4f9f5a', '#6ab04c', '#8cc152', '#e8a3b8'][Math.floor(R() * 4)]) : palm(s);
  }
  function decorate(g, seed, avoid, kind, s) {
    const R = rng(seed), r = g.userData.r, top = g.userData.top;
    const free = a => avoid.every(b => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))) > .55);
    const spot = (r0, r1) => { for (let k = 0; k < 20; k++) { const a = R() * Math.PI * 2; if (free(a)) { const d = r0 + R() * (r1 - r0); return [Math.cos(a) * d, Math.sin(a) * d, a]; } } return [r0, 0, 0]; };
    const D = DENS[detail] || 1;
    const nTree = Math.max(1, Math.round((kind === 'center' ? 6 : 2 + Math.floor(R() * 2)) * D * ((SHAPE_LOOK[shape] || {}).trees || 1)));
    for (let k = 0; k < nTree; k++) {
      const [x, z] = spot(r * .62, r * .86);
      const t = treeFor(R, s);
      t.position.set(x, top, z);
      t.rotation.y = R() * 6;
      g.add(t);
    }
    for (let k = 0; k < Math.round((kind === 'center' ? 10 : 5) * D); k++) {
      const [x, z] = spot(r * .45, r * .9);
      g.add(ball(.07 * s, ['#ff8fb1', '#ffd95a', '#ffffff', '#b58cff', '#ff7a59'][Math.floor(R() * 5)], x, top + .08, z, 5));
    }
    for (let k = 0; k < Math.max(1, Math.round(3 * D)); k++) {
      const [x, z] = spot(r * 1.02, r * 1.12);
      const rock = deco(new THREE.Mesh(new THREE.DodecahedronGeometry(.18 * s + R() * .15), mat('#9aa0a6')));
      rock.position.set(x, shape === 'float' ? -.6 - R() * 2.5 : .2, z); rock.rotation.set(R() * 3, R() * 3, 0);
      if (shape === 'float') movers.push({ bob: rock, base: rock.position.y, ph: R() * 6 });
      g.add(rock);
    }
    if (shape === 'desert' && kind !== 'center') {
      const [x, z] = spot(r * .25, r * .4);
      const pond = cyl(.55, .55, .05, '#4fc3c8', 14, x, top, z); pond.material.transparent = true; pond.material.opacity = .9;
      g.add(cyl(.72, .72, .03, '#7cbf5a', 14, x, top - .01, z), pond);
    }
    /* 小房子：窗戶晚上會亮 */
    const nHouse = detail === 1 ? 1 : kind === 'center' ? 3 : 1 + Math.floor(R() * (detail >= 3 ? 2.6 : 2));
    for (let k = 0; k < nHouse; k++) {
      const [x, z, a] = spot(r * .58, r * .78);
      g.add(cottage(s * (.8 + R() * .3), ['#e46a5e', '#4f8fd6', '#f2b33d', '#5aa36b', '#9b6ad6', '#c45a2c'][Math.floor(R() * 6)], x, top, z, -a + Math.PI / 2));
    }
    if (kind !== 'center' && shape !== 'float') {
      /* 碼頭＋小船（朝外海） */
      const da = avoid[0] + Math.PI + (R() - .5) * .8;
      const dock = grp(box(1.6, .08, .55, '#a77b4b', .8, 0, 0), cyl(.05, .05, .5, '#6b4a2b', 5, 1.55, -.4, .22), cyl(.05, .05, .5, '#6b4a2b', 5, 1.55, -.4, -.22));
      dock.position.set(Math.cos(da) * r * 1.05, .3, Math.sin(da) * r * 1.05);
      dock.rotation.y = -da;
      const skiff = grp(box(.9, .22, .38, ['#e46a5e', '#4f8fd6', '#f2b33d'][Math.floor(R() * 3)]), box(.7, .04, .3, '#f3e2c4', 0, .2));
      skiff.position.set(1.2, -.25, .55);
      dock.add(skiff);
      g.add(dock);
    }
    if (life) {
      /* 貝殼：點了可以撿 */
      const onTop = shape === 'float' || shape === 'terrace';
      const [x, z] = onTop ? spot(r * .8, r * .9) : spot(r * 1.08, r * 1.14);
      const sh = grp(cone(.13, .1, '#fff4ea', 7), ball(.06, '#ffc9b5', 0, .06, 0, 6));
      sh.position.set(x, onTop ? top + .02 : .2, z);
      g.add(sh);
      const rec = { obj: sh };
      sh.userData.shell = rec;
      shells.push(rec);
    }
  }
  function cottage(s, roof, x, y, z, ry) {
    const pane = new THREE.MeshBasicMaterial({ color: 0x3a4658 });
    const w1 = new THREE.Mesh(new THREE.BoxGeometry(.16 * s, .16 * s, .02), pane); w1.position.set(-.16 * s, .3 * s, .3 * s + .01);
    const w2 = new THREE.Mesh(new THREE.BoxGeometry(.16 * s, .16 * s, .02), pane); w2.position.set(.16 * s, .3 * s, .3 * s + .01);
    const rf = cone(.58 * s, .4 * s, roof, 4, 0, .55 * s); rf.rotation.y = Math.PI / 4;
    const h = grp(box(.7 * s, .55 * s, .6 * s, '#fbf3e4'), rf, box(.14 * s, .26 * s, .02, '#7a5532', 0, 0, .3 * s + .01), w1, w2, box(.1 * s, .25 * s, .1 * s, '#9a8f86', .2 * s, .62 * s, -.1 * s));
    h.position.set(x, y, z); h.rotation.y = ry;
    glows.push({ win: w1, base: pane.color.clone(), pane: true });
    h.userData.pane = pane;
    return h;
  }
  /* 遠景：外海一圈山林，讓畫面有框 */
  function backdrop(seed) {
    if (shape === 'float') { cloudSea(seed); return; }
    const R = rng(seed + 55), g = new THREE.Group();
    for (let k = 0; k < 46; k++) {
      const a = k / 46 * Math.PI * 2 + R() * .1, d = 78 + R() * 14, h = 6 + R() * 12;
      const m = new THREE.Mesh(new THREE.ConeGeometry(h * .9, h, 6), mat(['#5f8f6a', '#4f7f63', '#6f9a72', '#7c9a86'][Math.floor(R() * 4)]));
      m.position.set(Math.cos(a) * d, h / 2 - 1, Math.sin(a) * d);
      g.add(m);
      for (let t = 0; t < 3; t++) {
        const tr = new THREE.Mesh(new THREE.ConeGeometry(1.2, 3.4, 5), mat('#2f6b45'));
        const td = d - h * .55 - R() * 3, ta = a + (R() - .5) * .12;
        tr.position.set(Math.cos(ta) * td, 1.2, Math.sin(ta) * td);
        g.add(tr);
      }
    }
    group.add(g);
  }
  /* 路燈：白天是燈桿，晚上燈泡和光暈亮起 */
  function lamp(parent, x, y, z) {
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), new THREE.MeshBasicMaterial({ color: 0x8a8a7a }));
    bulb.position.set(x, y + 1.15, z);
    parent.add(cyl(.035, .05, 1.1, '#3d3d46', 6, x, y, z), cone(.16, .12, '#3d3d46', 6, x, y + 1.22, z), bulb);
    const gl = glow(0xffc46b, 2.6);
    gl.position.copy(bulb.position);
    parent.add(gl);
    glows.push({ bulb, gl, size: 2.6 });
  }
  /* 窗戶：夜晚亮成暖黃色 */
  function windowsOn(mark) {
    const list = [];
    mark.traverse(o => { if (o.isMesh && o.geometry.type === 'BoxGeometry' && o.material.color && lum('#' + o.material.color.getHexString()) > .8) list.push(o); });
    list.slice(0, 2).forEach(o => glows.push({ win: o, base: o.material.color.clone() }));
  }

  function clear() {
    closeTalk();
    while (group.children.length) {
      const c = group.children.pop();
      c.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material !== cloudMat && o.material !== birdMat) { if (o.material.map === glowTex) o.material.map = null; o.material.dispose(); } });
    }
    labelLayer.textContent = '';
    bridges = []; tints = []; focus = null;
    labels = []; movers = []; clouds = []; waves = []; birds = []; npcs = []; glows = []; boats = []; foams = []; shells = []; flies = null;
  }
  function addLabel(text, obj, y, center, idx) {
    const el = document.createElement('button');
    el.type = 'button';
    el.textContent = text;
    el.tabIndex = -1;
    if (center) el.className = 'center';
    else {
      el.title = '跳到這座島的欄位';
      el.addEventListener('pointerdown', e => e.stopPropagation());
      el.addEventListener('click', () => { const l = labels.find(x => x.el === el); flyTo(l, () => { if (IF.preview.onPick) IF.preview.onPick(idx); }); });
      if (idx === hot) el.classList.add('hot');
    }
    labelLayer.appendChild(el);
    labels.push({ el, obj, y, idx });
  }
  function highlight(idx) {
    hot = idx;
    labels.forEach(l => l.el.classList.toggle('hot', l.idx === idx && idx >= 0));
  }
  function resetView() { yaw = 0.6; pitch = 0.82; dist = baseDist; auto = true; zoomed = false; if (focus) backToOverview(); }

  /* data: { title, center, islands:[{name,row,intro,point}], primary, accent, bg, type, style, font, features, rpg, life } */
  function update(data) {
    if (!renderer) return;
    const key = JSON.stringify(data);
    if (key === lastKey) return;
    lastKey = key;
    style = STYLE[data.style] ? data.style : 'lowpoly';
    life = data.life !== false;
    const shapeChanged = shape !== (data.shape || 'sea');
    shape = data.shape || 'sea';
    detail = Number(data.detail) || 3;
    const cineChanged = cinema !== (data.cinema || 'smooth');
    cinema = data.cinema || 'smooth';
    sea.visible = shape !== 'float';
    sun.castShadow = detail > 1;
    IF_ACCENT = new THREE.Color(data.accent).getHex();
    const st = STYLE[style];
    dark = lum(data.bg) < 0.35 || style === 'scifi';
    theme = { bg: data.bg };
    autoBg = data.autoBg || null; autoSlot = -1;
    /* 深色底色或科幻風：預設夜晚；其他維持目前時段（底色自動時由時段決定底色，不反過來改時段） */
    if (!autoBg && dark !== wasDark) { tod = dark ? TOD.night : TOD.day; wasDark = dark; }
    labelLayer.style.fontFamily = (IF.FONTS[data.font] || IF.FONTS.gothic)[2];
    clear();
    renderBag();
    hud.hidden = !life;

    const land = mix(data.primary, '#8fcf6f', dark ? 0.45 : 0.62);
    const build = LAND[data.type] || LAND.course;
    const n = data.islands.length;
    const angles = data.islands.map((_, idx) => (idx / Math.max(n, 1)) * Math.PI * 2);
    const seed0 = hash(data.title + data.type);
    const centerIsle = isle(4.4, land, 1.6, seed0 % 7);
    const mark = build(1.6, data.primary, data.accent);
    mark.position.y = centerIsle.userData.top;
    centerIsle.add(mark);
    if (mark.userData.spin) movers.push({ spin: mark.userData.spin });
    windowsOn(mark);
    const ca = angles.length ? angles[0] + Math.PI / Math.max(n, 1) : .5;
    decorate(centerIsle, seed0, angles.concat([ca]), 'center', 1.1);
    refine(centerIsle, seed0, ca + Math.PI * .5, detail, 1.1);
    const isleList = [];
    group.add(centerIsle);
    backdrop(seed0);
    addLabel(data.center || data.title || '中央島', centerIsle, 5.2, true);

    const ring = n <= 6 ? 11 : 13;
    tourR = ring; tourN = n;
    baseDist = n <= 6 ? 40 : 52;
    if (!zoomed) dist = baseDist;
    const people = data.features.includes('people');
    const stops = [];
    data.islands.forEach((isl, idx) => {
      const a = angles[idx];
      const r = ring + (n > 6 && idx % 2 ? 3 : 0);
      const tint = mix(land, idx % 2 ? data.accent : data.primary, 0.18);
      const h = 1 + (idx % 3) * 0.25;
      const g = isle(2.2, tint, h, idx * 1.7 + 1);
      g.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      const m = build(0.85, idx % 2 ? data.accent : data.primary, idx % 2 ? data.primary : data.accent);
      m.position.y = g.userData.top;
      m.rotation.y = -a + Math.PI / 2;
      g.add(m);
      if (m.userData.spin) movers.push({ spin: m.userData.spin });
      windowsOn(m);
      decorate(g, seed0 + idx * 97, [a + Math.PI], 'isle', .85);
      refine(g, seed0 + idx * 97, a + Math.PI, detail, .85);
      group.add(g);
      isleList.push({ g, a, r: 2.2, x: g.position.x, z: g.position.z, top: g.userData.top, name: isl.name });

      /* 木橋：橋面、欄杆、兩端路燈 */
      const len = r - 6.6, mid = r / 2 + 1.1;
      const bridge = grp(box(len, 0.12, 0.8, '#b98a55'), box(len, .05, .05, '#7a5532', 0, .32, .38), box(len, .05, .05, '#7a5532', 0, .32, -.38));
      for (let k = -2; k <= 2; k++) bridge.add(box(.06, .32, .06, '#7a5532', k * len / 4.4, 0, .38), box(.06, .32, .06, '#7a5532', k * len / 4.4, 0, -.38));
      if (shape === 'float') {
        /* 吊橋：繩索與下垂的橋面 */
        bridge.add(box(len, .03, .03, '#e8dcc0', 0, .6, .4), box(len, .03, .03, '#e8dcc0', 0, .6, -.4));
        bridge.children[0].scale.y = 1.4;
      }
      bridge.position.set(Math.cos(a) * mid, 0.82, Math.sin(a) * mid);
      bridge.rotation.y = -a;
      group.add(bridge);
      bridges.push({ obj: bridge, len });
      if (life) lamp(group, Math.cos(a) * (r - 1.6) + Math.cos(a + 1.57) * .75, h, Math.sin(a) * (r - 1.6) + Math.sin(a + 1.57) * .75);

      const name = isl.name || '未命名';
      if (life) {
        /* 每座島一位島民：在島上散步，點了會聊天、交易 */
        const R = rng(seed0 + idx * 31);
        const who = NAMES[(idx * 5 + seed0) % NAMES.length], job = JOBS[(idx * 7 + seed0) % JOBS.length];
        const lines = [`歡迎來到「${name}」！我是${job}${who}。`];
        if (isl.intro) lines.push(`這裡是${isl.intro.replace(/[。.]$/, '')}。`);
        if (isl.point) lines.push(`想知道重點嗎？${isl.point.replace(/[。.]$/, '')}。`);
        if (!isl.intro && !isl.point) lines.push('島主還沒填這座島的介紹，填好之後我就會跟你說這裡的故事。');
        addNpc({ seed: seed0 + idx * 13, kind: 'wander', home: g, x: g.position.x, y: g.userData.top, z: g.position.z, cx: g.position.x, cz: g.position.z,
          rin: 1.0, rout: 1.75, title: `${job}${who}・${String(idx + 1).padStart(2, '0')} ${name}`, lines, trade: GOODS[(idx + seed0) % GOODS.length], R });
        if (n <= 10) {
          const who2 = NAMES[(idx * 5 + seed0 + 8) % NAMES.length], job2 = JOBS[(idx * 7 + seed0 + 5) % JOBS.length];
          addNpc({ seed: seed0 + idx * 13 + 501, kind: 'wander', x: g.position.x, y: g.userData.top, z: g.position.z, cx: g.position.x, cz: g.position.z,
            rin: 1.0, rout: 1.8, title: `${job2}${who2}・${String(idx + 1).padStart(2, '0')} ${name}`, trade: GOODS[(idx + seed0 + 4) % GOODS.length],
            lines: [`我住在「${name}」好多年了，最喜歡傍晚在碼頭看船。`, isl.point ? `島上大家最常聊的是：${isl.point.replace(/[。.]$/, '')}。` : '有空常回來走走，島上每天都有新鮮事。'] });
        }
      }
      if ((people || life) && idx % 2 === 0) {
        /* 往來中央島的旅人 */
        const who = NAMES[(idx * 3 + 7) % NAMES.length];
        addNpc({ seed: seed0 + idx * 71, kind: 'travel', a, from: 3.6, to: r - 1.4, cTop: centerIsle.userData.top, iTop: h, r,
          x: 0, y: 0, z: 0, k: Math.random(), dir: 1, title: `送貨員${who}`, trade: GOODS[(idx + 3) % GOODS.length], crate: true,
          lines: [`我負責把中央市集的貨送到「${name}」，送到就交給島上的居民。`, '回程空手比較輕鬆，可以邊走邊看海上的帆船。'] });
      }
      addLabel(String(idx + 1).padStart(2, '0') + ' ' + name, g, 3.6, false, isl.row);
      stops.push({ a, r, top: g.userData.top });
      if (data.rpg) {
        /* 島章：每座島上空一枚金色章 */
        const stamp = deco(new THREE.Mesh(new THREE.OctahedronGeometry(.42), mat('#f2c230')));
        stamp.position.set(-1.25, g.userData.top + 1.1, 0.9);
        g.add(stamp);
        movers.push({ stamp, base: stamp.position.y, ph: idx });
      }
      if (life && shape !== 'float') foams.push(foam(g.position.x, g.position.z, 2.2 * (shape === 'terrace' ? 1.35 : 1.25), idx));
    });
    if (life) {
      if (shape !== 'float') foams.push(foam(0, 0, 4.4 * (shape === 'terrace' ? 1.33 : 1.24), 99));
      /* 中央島：市集攤位＋商人、四盞路燈 */
      const sx = Math.cos(ca) * 2.6, sz = Math.sin(ca) * 2.6, ct = centerIsle.userData.top;
      const stall = grp(box(1.3, .5, .7, '#b98a55'), box(.06, 1.1, .06, '#7a5532', -.6, 0, .32), box(.06, 1.1, .06, '#7a5532', .6, 0, .32), box(.06, 1.1, .06, '#7a5532', -.6, 0, -.32), box(.06, 1.1, .06, '#7a5532', .6, 0, -.32));
      const awn = new THREE.Mesh(new THREE.ConeGeometry(1.05, .45, 4), mat(data.accent)); awn.rotation.y = Math.PI / 4; awn.scale.set(1, 1, .62); awn.position.y = 1.3;
      stall.add(awn, ball(.1, '#e84a3a', -.35, .58, .1, 6), ball(.1, '#f2c230', -.1, .58, .15, 6), ball(.1, '#5aa36b', .2, .58, .1, 6), cone(.1, .12, '#fff4ea', 7, .42, .5, .12));
      stall.position.set(sx, ct, sz);
      stall.rotation.y = -ca + Math.PI / 2;
      group.add(stall);
      addNpc({ seed: seed0 + 5, kind: 'stay', x: sx + Math.cos(ca) * .75, y: ct, z: sz + Math.sin(ca) * .75, face: ca, title: '港口商人・中央市集',
        trade: ['🐚', '🍞'], lines: [`歡迎光臨「${data.center || data.title || '中央島'}」市集！貝殼可以跟我換麵包喔。`, '每座島的居民想要的東西都不一樣，多聊聊就知道。', '晚上市集的燈會亮起來，記得回來看看。'] });
      for (let k = 0; k < 4; k++) { const la = k / 4 * Math.PI * 2 + Math.PI / 4 + .3; lamp(centerIsle, Math.cos(la) * 3.5, ct, Math.sin(la) * 3.5); }
      for (let k = 0; k < 2; k++) {
        const R = rng(seed0 + 300 + k);
        addNpc({ seed: seed0 + 300 + k, kind: 'wander', home: centerIsle, x: 0, y: ct, z: 0, cx: 0, cz: 0, rin: 2.2, rout: 3.6,
          title: `${JOBS[(k * 5 + 3) % JOBS.length]}${NAMES[(k * 9 + 4) % NAMES.length]}・中央島`, trade: GOODS[(k * 3 + 2) % GOODS.length],
          lines: [`這裡是「${data.center || data.title || '中央島'}」，從這裡可以走橋到每一座島。`, '你看天上，鳥群又飛過去了！'] });
        R();
      }
      buildSkyLife(st, ring, seed0);
    } else if (st.clouds) buildSkyLife(st, ring, seed0, true);

    if (shape === 'volcano') {
      /* 火山：放在中央島地標的對面，火山口有岩漿光、冒煙 */
      const va = ca + Math.PI, vx = Math.cos(va) * 2.7, vz = Math.sin(va) * 2.7, vt = centerIsle.userData.top;
      const mt = deco(new THREE.Mesh(wobble(new THREE.CylinderGeometry(.6, 1.9, 3.3, 9, 2), seed0, .1), mat('#5b4a42')));
      mt.position.set(vx, vt + 1.65, vz);
      const lava = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .08, 9), new THREE.MeshBasicMaterial({ color: 0xff6a2a }));
      lava.position.set(vx, vt + 3.28, vz);
      const lg = glow(0xff7a3a, 2.6); lg.position.set(vx, vt + 3.5, vz);
      centerIsle.add(mt, lava, lg);
      const puffs = [];
      for (let k = 0; k < 4; k++) { const pf = new THREE.Mesh(new THREE.IcosahedronGeometry(.35, 0), new THREE.MeshLambertMaterial({ color: 0xd9d4cf, transparent: true, opacity: .6, depthWrite: false })); centerIsle.add(pf); puffs.push(pf); }
      movers.push({ tick: tt => puffs.forEach((pf, k) => { const q = (tt * .22 + k / 4) % 1; pf.position.set(vx + Math.sin(q * 5 + k) * .3, vt + 3.5 + q * 3, vz); pf.scale.setScalar(.6 + q * 1.6); pf.material.opacity = .6 * (1 - q); }) });
      movers.push({ tick: tt => { lg.material.opacity = .75 + Math.sin(tt * 3) * .2; } });
    }
    if (shape === 'snow') {
      /* 冰雪群島：外海漂著小冰山 */
      const R = rng(seed0 + 61);
      for (let k = 0; k < 9; k++) {
        const a = k / 9 * 6.28 + R() * .4, d = ring + 6 + R() * 12, s = .5 + R() * .9;
        const ice = grp(deco(new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), mat('#f4f9fc'))), deco(new THREE.Mesh(new THREE.DodecahedronGeometry(s * .7, 0), mat('#cfe6f2'))));
        ice.children[1].position.set(s * .5, -s * .2, s * .2);
        ice.position.set(Math.cos(a) * d, s * .25, Math.sin(a) * d); ice.rotation.y = R() * 6;
        group.add(ice);
        movers.push({ bob: ice, base: ice.position.y, ph: R() * 6 });
      }
    }
    if (shape === 'atoll') {
      /* 環礁潟湖：淺藍綠色潟湖＋白色沙洲圈 */
      const lag = new THREE.Mesh(new THREE.RingGeometry(5.2, ring + 4.2, 72), new THREE.MeshPhongMaterial({ color: 0x7fe0d6, transparent: true, opacity: .78, shininess: 90, depthWrite: false }));
      lag.rotation.x = -Math.PI / 2; lag.position.y = .3;
      const bar = new THREE.Mesh(new THREE.RingGeometry(ring + 4.2, ring + 5.4, 72), mat('#f1e2b8'));
      bar.rotation.x = -Math.PI / 2; bar.position.y = .32;
      group.add(lag, bar);
      tints.push({ m: lag.material, day: '#7fe0d6', night: '#1f4f6a' });
      const R = rng(seed0 + 88);
      for (let k = 0; k < 10; k++) { const a = k / 10 * 6.28 + R() * .3, d = ring + 4.8; const t = palm(.8); t.position.set(Math.cos(a) * d, .32, Math.sin(a) * d); group.add(t); }
    }
    if (data.animals && data.animals.length && isleList.length) addAnimals(data.animals, isleList, ring, seed0);
    addExtras(data.extras || [], isleList, centerIsle, ca, data);

    if (data.rpg && stops.length) {
      /* RPG 模式：冒險者從中央島沿橋輪流拜訪各島 */
      const hero = grp(
        cyl(.16, .22, .6, data.accent, 7),
        ball(.2, '#f1c9a5', 0, .82, 0, 10),
        cone(.24, .26, data.primary, 7, 0, .92, 0),
        box(.05, .7, .05, '#e8e8e8', .3, .1, 0),
        cone(.06, .14, '#f2c230', 4, 0, 1.42, 0)
      );
      hero.scale.setScalar(2);
      hero.position.set(Math.cos(stops[0].a) * 2.4, centerIsle.userData.top, Math.sin(stops[0].a) * 2.4);
      group.add(hero);
      movers.push({ hero, stops, cTop: centerIsle.userData.top, k: 0, t: 0 });
    }

    if (st.waves) {
      for (let k = 0; k < 3; k++) {
        const w = new THREE.Mesh(new THREE.RingGeometry(1, 1.25, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .35, side: THREE.DoubleSide }));
        w.rotation.x = -Math.PI / 2; w.position.y = 0.3;
        group.add(w);
        waves.push({ obj: w, t: k / 3 });
      }
    }
    group.traverse(o => { if (o.isMesh && !o.material.transparent && !o.userData.noShadow) { o.castShadow = true; o.receiveShadow = true; } });
    applySky(true);
    document.getElementById('btnCine') && (document.getElementById('btnCine').hidden = cinema === 'off');
    if (!introDone || cineChanged) playIntro(); else if (shapeChanged) playIntro(false, true);
  }
  function foam(x, z, r, k) {
    const f = new THREE.Mesh(new THREE.RingGeometry(r * .96, r * 1.08, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .4, depthWrite: false }));
    f.rotation.x = -Math.PI / 2;
    f.position.set(x, .26, z);
    group.add(f);
    return { obj: f, ph: k };
  }
  /* 雲、鳥群、帆船、螢火蟲 */
  function buildSkyLife(st, ring, seed, cloudsOnly) {
    const R = rng(seed + 9);
    const nc = st.clouds ? 12 : 8;
    for (let k = 0; k < nc; k++) {
      const c = new THREE.Group();
      const puffs = 3 + Math.floor(R() * 3);
      for (let p = 0; p < puffs; p++) {
        const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1 + R() * .9, 1), cloudMat);
        m.position.set((p - puffs / 2) * 1.3 + R() * .5, R() * .6, R() * 1.2 - .6);
        m.scale.y = .7;
        c.add(m);
      }
      const y = st.clouds ? 5 + R() * 3 : 9 + R() * 5;
      c.scale.setScalar(.9 + R() * .8);
      group.add(c);
      /* 雲繞著外圈慢慢飄，不擋住鏡頭前的島 */
      const ca0 = R() * Math.PI * 2;
      clouds.push({ obj: c, a: ca0, r: (st.clouds ? 24 : 34) + R() * 22, y, v: .006 + R() * .008 });
      c.position.set(Math.cos(ca0) * clouds[clouds.length - 1].r, y, Math.sin(ca0) * clouds[clouds.length - 1].r);
    }
    if (cloudsOnly) return;
    for (let f = 0; f < 3; f++) {
      const flock = new THREE.Group();
      const list = [];
      for (let b = 0; b < 5 + f; b++) {
        const wingGeo = new THREE.BufferGeometry();
        wingGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -.18, 0, 0, .18, .75, 0, 0], 3));
        wingGeo.computeVertexNormals();
        const wl = new THREE.Mesh(wingGeo, birdMat), wr = new THREE.Mesh(wingGeo, birdMat);
        wr.rotation.y = Math.PI;
        const body = new THREE.Mesh(new THREE.ConeGeometry(.1, .5, 5), new THREE.MeshLambertMaterial({ color: 0xe8e8e8 }));
        body.rotation.x = Math.PI / 2;
        const bird = grp(body, wl, wr);
        const side = b % 2 ? 1 : -1, row = Math.ceil(b / 2);
        bird.position.set(side * row * .9, R() * .3, -row * .9);
        flock.add(bird);
        list.push({ wl, wr, ph: R() * 6 });
      }
      group.add(flock);
      birds.push({ obj: flock, list, a: R() * 6, r: ring + 6 + f * 6, h: 8 + f * 2.2, v: (.09 + R() * .05) * (f % 2 ? -1 : 1) });
    }
    for (let k = 0; k < (shape === 'float' ? 0 : 2); k++) {
      const sail = new THREE.Mesh(new THREE.ConeGeometry(.7, 1.6, 3), mat(k ? '#ffffff' : '#ffe2b8'));
      sail.position.set(0, 1.2, 0); sail.scale.z = .15;
      const boat = grp(box(1.6, .35, .6, '#8a5a35'), box(1.2, .06, .5, '#c9a27a', 0, .35), cyl(.04, .04, 1.9, '#5a3a22', 5, .1, .35), sail);
      group.add(boat);
      boats.push({ obj: boat, a: k * Math.PI + .7, r: ring + 7 + k * 3, v: .035 + k * .015 });
    }
    const fp = [];
    for (let k = 0; k < 60; k++) { const a = R() * 6.28, d = 2 + R() * (ring + 2); fp.push(Math.cos(a) * d, 1.6 + R() * 2, Math.sin(a) * d); }
    const fg = new THREE.BufferGeometry();
    fg.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3));
    flies = new THREE.Points(fg, new THREE.PointsMaterial({ color: 0xfff1a0, size: 4, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    flies.userData.base = Float32Array.from(fp);
    group.add(flies);
  }

  /* 依時段套用天空、陽光、海色、夜燈 */
  function applySky() {
    const t = life || autoBg ? tod : (dark ? TOD.night : TOD.day);
    const s = skyAt(t);
    const bg = new THREE.Color(theme.bg);
    const top = s.top.clone().lerp(bg, .18), hor = s.hor.clone().lerp(bg, .3);
    if (style === 'scifi') { top.lerp(new THREE.Color('#0d1630'), .6); hor.lerp(new THREE.Color('#1b2a4a'), .5); }
    sky.material.uniforms.top.value.copy(top);
    sky.material.uniforms.hor.value.copy(hor);
    scene.background = hor;
    scene.fog = scene.fog || new THREE.Fog(hor, 50, 118);
    scene.fog.color.copy(hor);
    night = style === 'scifi' ? Math.max(s.n, .55) : s.n;
    const ang = (t - .25) * Math.PI * 2;
    const sunDir = new THREE.Vector3(Math.cos(ang), Math.sin(ang), .35).normalize();
    const up = sunDir.y > -.05;
    const lightDir = up ? sunDir : sunDir.clone().negate();
    sun.position.copy(lightDir).multiplyScalar(40);
    sun.color.copy(s.sc);
    sun.intensity = s.sun * (STYLE[style].flat ? 1.05 : .95);
    hemi.intensity = s.hemi;
    hemi.color.copy(mix('#ffffff', '#8fa0d8', night));
    hemi.groundColor.copy(mix('#6f8585', '#1c2438', night));
    sunGlow.position.copy(sunDir).multiplyScalar(160);
    sunGlow.material.opacity = up ? 1 : 0;
    sunGlow.material.color.copy(s.sc).lerp(new THREE.Color('#ffffff'), .3);
    moonGlow.position.copy(sunDir).negate().multiplyScalar(160);
    moonGlow.material.opacity = sunDir.y < .1 ? .9 : 0;
    stars.material.opacity = night * .95;
    const seaDay = style === 'ocean' ? '#2f9fc4' : '#3f9aa8';
    sea.material.color.copy(mix(seaDay, '#0e2c58', night * .9).lerp(hor, .22));
    sea.material.specular.copy(mix('#9fd7e0', '#5a6fa8', night));
    cloudMat.color.copy(mix('#ffffff', s.sc, .25).lerp(new THREE.Color('#6f7ba8'), night * .7));
    cloudMat.opacity = .94 - night * .4;
    plazaLight.intensity = night * 1.6;
    glows.forEach(g => {
      if (g.bulb) {
        g.bulb.material.color.copy(mix('#8a8a7a', '#ffe0a0', night));
        g.gl.material.opacity = night;
        g.gl.scale.setScalar(g.size * (.4 + night * .8));
      } else if (g.win) {
        g.win.material.color.copy(g.base).lerp(new THREE.Color(g.pane ? '#ffd27a' : '#ffc65c'), night * (g.pane ? 1 : .55));
        if (g.win.material.emissive) g.win.material.emissive.copy(mix('#000000', '#6a4a10', night));
      }
    });
    tints.forEach(x => x.m.color.copy(mix(x.day, x.night, night * .85)));
    if (flies) flies.material.opacity = Math.max(0, night - .3) * 1.2;
    birds.forEach(b => { b.obj.visible = night < .6; });
    if (clockEl) {
      const mins = Math.floor(t * 24 * 60), hh = Math.floor(mins / 60) % 24, mm = mins % 60;
      const tag = hh < 5 ? '深夜' : hh < 7 ? '清晨' : hh < 11 ? '上午' : hh < 13 ? '中午' : hh < 17 ? '下午' : hh < 19 ? '黃昏' : '晚上';
      clockEl.textContent = `${tag} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    }
  }

  const v = () => new THREE.Vector3();
  const clock = new THREE.Clock();
  let time = 0;
  function walkPose(n, dt, moving) {
    const p = n.obj.userData.parts;
    if (!p) return;
    n.phase += dt * (moving ? 9 : 2);
    const sw = moving ? Math.sin(n.phase) * .7 : 0;
    p.legL.rotation.x = sw; p.legR.rotation.x = -sw;
    p.armL.rotation.x = -sw * .8;
    if (n.wave > 0) { n.wave -= dt; p.armR.rotation.x = 0; p.armR.rotation.z = 2.4 + Math.sin(n.wave * 14) * .4; }
    else { p.armR.rotation.z = 0; p.armR.rotation.x = sw * .8; }
    if (n.box && n.box.visible) { p.armL.rotation.x = p.armR.rotation.x = -2.9; p.armR.rotation.z = 0; }
  }
  function animalPose(n, dt, moving) {
    const p = n.obj.userData.critter;
    if (!p) return;
    n.phase += dt * (moving ? 12 : 1.5);
    if (p.legs) p.legs.forEach((l, k) => { l.rotation.x = moving ? Math.sin(n.phase + (k % 3 ? Math.PI : 0)) * .6 : 0; });
    if (p.wl) { const f = Math.sin(time * 18 + n.seed) * .9; p.wl.rotation.z = f; p.wr.rotation.z = -f; }
  }
  function faceTo(n, x, z) { n.obj.rotation.y = Math.atan2(x - n.obj.position.x, z - n.obj.position.z); }
  function stepNpc(n, dt) {
    const o = n.obj;
    const pose = n.animal ? animalPose : walkPose;
    if (n.hop > 0) n.hop -= dt;
    const hopY = n.hop > 0 ? Math.sin((.5 - n.hop) / .5 * Math.PI) * .35 : 0;
    if (n.talking) {
      if (n.kind !== 'swim') faceTo(n, camera.position.x, camera.position.z);
      if (n.kind === 'wander') o.position.y = n.y + hopY;
      pose(n, dt, false);
      return;
    }
    if (n.kind === 'swim') {
      n.a += n.v * dt;
      const jump = n.jump ? Math.max(0, Math.sin(time * .9 + n.seed)) : 0;
      const jy = jump > .8 ? (jump - .8) * 9 : 0;
      o.position.set(Math.cos(n.a) * n.r, n.lowY + jy + Math.sin(time * 2 + n.seed) * .05, Math.sin(n.a) * n.r);
      o.rotation.set(n.jump ? -Math.cos(time * .9 + n.seed) * (jump > .8 ? .9 : 0) : 0, -n.a + (n.v > 0 ? 0 : Math.PI), 0);
      return;
    }
    if (n.kind === 'fly') {
      n.a += n.v * dt;
      o.position.set(n.cx + Math.cos(n.a) * n.rr, n.y + Math.sin(time * 2.3 + n.seed) * .25, n.cz + Math.sin(n.a) * n.rr);
      o.rotation.y = -n.a + (n.v > 0 ? 0 : Math.PI);
      o.visible = n.owl ? (night > .45 || !life) : night < .7;
      pose(n, dt, true);
      return;
    }
    if (n.animal && night > .6) { pose(n, dt, false); return; }
    if (n.kind === 'stay') { o.rotation.y = Math.PI / 2 - n.face + Math.sin(time * .6 + n.phase) * .4; walkPose(n, dt, false); return; }
    if (n.kind === 'wander') {
      if (n.wait > 0) { n.wait -= dt; pose(n, dt, false); o.position.y = n.y + hopY; return; }
      if (!n.tx) {
        const cur = Math.atan2(o.position.z - n.cz, o.position.x - n.cx);
        const a = cur + (n.R() - .5) * 2.4, d = n.rin + n.R() * (n.rout - n.rin);
        n.tx = n.cx + Math.cos(a) * d; n.tz = n.cz + Math.sin(a) * d;
      }
      const dx = n.tx - o.position.x, dz = n.tz - o.position.z, d = Math.hypot(dx, dz);
      if (d < .08) { n.tx = null; n.wait = 1 + n.R() * 3.5; if (n.R() < .25) n.wave = 1.2; return; }
      const sp = Math.min(d, n.speed * dt);
      o.position.x += dx / d * sp; o.position.z += dz / d * sp;
      faceTo(n, n.tx, n.tz);
      o.position.y = n.y + Math.abs(Math.sin(n.phase)) * .04 + hopY;
      pose(n, dt, true);
      return;
    }
    if (n.kind === 'travel') {
      if (n.wait > 0) { n.wait -= dt; walkPose(n, dt, false); return; }
      const len = n.to - n.from;
      n.k += n.dir * n.speed * dt / len;
      if (n.k >= 1 || n.k <= 0) { n.k = Math.min(1, Math.max(0, n.k)); n.dir *= -1; n.wait = 1.5 + n.R() * 2; n.wave = 1.2; }
      if (n.box) n.box.visible = n.dir > 0;
      const d = n.from + len * n.k;
      const y = d < 4.2 ? n.cTop : d > n.r - 2.3 ? n.iTop : 0.94;
      o.position.set(Math.cos(n.a) * d, y + Math.abs(Math.sin(n.phase)) * .04, Math.sin(n.a) * d);
      o.rotation.y = Math.PI / 2 - n.a + (n.dir > 0 ? 0 : Math.PI);
      walkPose(n, dt, true);
    }
  }
  function loop() {
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), .05);
    if (!stage.isConnected || !visible || document.hidden) return;
    const move = !reduced;
    time += move ? dt : 0;
    if (life) {
      if (todMode === 'auto') { if (move) tod = (tod + dt / 150) % 1; }
      else {
        const target = TOD[todMode];
        let diff = (target - tod + 1) % 1;
        if (diff > .002 && diff < .998) tod = (tod + Math.min(diff, dt * (reduced ? 10 : .35))) % 1;
      }
    }
    if (autoBg) {
      if (!life && move) tod = (tod + dt / 150) % 1;   /* 沒開生活感也讓預覽跑一圈，看得到底色變化 */
      const slot = tod >= .30 && tod < .68 ? 0 : (tod >= .68 && tod < .82) || (tod >= .20 && tod < .30) ? 1 : 2;
      if (slot !== autoSlot) { autoSlot = slot; theme.bg = autoBg[slot]; dark = lum(theme.bg) < 0.35 || style === 'scifi'; if (IF.preview.onAutoTheme) IF.preview.onAutoTheme(slot); }
    }
    applySky();
    if (auto && move && !cine && !focus) yaw += (cinema === 'orbit' ? 0.45 : 0.15) * dt;   /* 環繞巡航轉快一點 */
    if (move) {
      const f = dt * 60;
      movers.forEach(m => {
        if (m.tick) m.tick(time, dt);
        if (m.spin) m.spin.rotation.z += 0.01 * f * (m.k || 1);
        if (m.bob) m.bob.position.y = m.base + Math.sin(time * .8 + m.ph) * .15;
        if (m.fall) m.fall.forEach((d, k) => { d.position.y -= (.06 + k % 3 * .02) * f; if (d.position.y < -m.h) d.position.y = 0; });
        if (m.balloon) { m.a += m.v * dt; m.balloon.position.set(Math.cos(m.a) * m.r, m.y + Math.sin(time * .5 + m.r) * .6, Math.sin(m.a) * m.r); }
        if (m.jets) m.jets.forEach(j => { const k = (time * .9 + j.ph) % 1; const ang = j.ph * 6.28; j.d.position.set(m.fx + Math.cos(ang) * k * .45, m.t + .9 + Math.sin(k * Math.PI) * .5 - k * .4, m.fz + Math.sin(ang) * k * .45); });
        if (m.flag) { const pa = m.flag.geometry.attributes.position; for (let k = 0; k < pa.count; k++) pa.setZ(k, Math.sin(time * 5 + m.base[k * 3] * 8) * .05 * (m.base[k * 3] + .23)); pa.needsUpdate = true; }
        if (m.stamp) { m.stamp.rotation.y += 0.03 * f; m.stamp.position.y = m.base + Math.sin(time * 2 + m.ph) * .12; }
        if (m.hero) {
          /* t：0→1 出發、1→1.4 在島上停留、1.4→2.4 走回中央島 */
          const s = m.stops[m.k % m.stops.length];
          m.t += 0.004 * f;
          if (m.t >= 2.4) { m.t = 0; m.k++; }
          const k = m.t < 1 ? m.t : m.t < 1.4 ? 1 : 2.4 - m.t;
          const far = s.r - 1.5;
          const d = 2.6 + (far - 2.6) * k;
          const y = d < 4.3 ? m.cTop : d > s.r - 2.3 ? s.top : 0.94;
          m.hero.position.set(Math.cos(s.a) * d, y + Math.abs(Math.sin(m.t * 45)) * 0.07, Math.sin(s.a) * d);
          m.hero.rotation.y = -s.a + (m.t < 1.4 ? Math.PI / 2 : -Math.PI / 2);
        }
      });
      npcs.forEach(nn => stepNpc(nn, dt));
      clouds.forEach(c => { c.a += c.v * dt; c.obj.position.set(Math.cos(c.a) * c.r, c.y, Math.sin(c.a) * c.r); });
      birds.forEach(b => {
        b.a += b.v * dt;
        b.obj.position.set(Math.cos(b.a) * b.r, b.h + Math.sin(time * .7 + b.r) * .6, Math.sin(b.a) * b.r);
        b.obj.rotation.y = -b.a + (b.v > 0 ? 0 : Math.PI);
        b.list.forEach(w => { const fl = Math.sin(time * 9 + w.ph) * .6; w.wl.rotation.z = fl; w.wr.rotation.z = fl; });
      });
      boats.forEach(b => {
        b.a += b.v * dt;
        b.obj.position.set(Math.cos(b.a) * b.r, .15 + Math.sin(time * 1.6 + b.r) * .08, Math.sin(b.a) * b.r);
        b.obj.rotation.set(Math.sin(time * 1.3 + b.r) * .06, -b.a - Math.PI / 2, Math.cos(time * 1.1) * .05);
      });
      foams.forEach(fm => { fm.obj.material.opacity = .25 + Math.sin(time * 1.4 + fm.ph) * .15; const s = 1 + Math.sin(time * 1.4 + fm.ph) * .025; fm.obj.scale.set(s, s, 1); });
      waves.forEach(w => {
        w.t = (w.t + 0.003 * f) % 1;
        const s = 6 + w.t * 22;
        w.obj.scale.set(s, s, s);
        w.obj.material.opacity = .35 * (1 - w.t);
      });
      if (flies && flies.material.opacity > 0) {
        const p = flies.geometry.attributes.position, b = flies.userData.base;
        for (let k = 0; k < p.count; k++) { p.setY(k, b[k * 3 + 1] + Math.sin(time * 1.5 + k) * .3); p.setX(k, b[k * 3] + Math.sin(time * .7 + k * 2) * .3); }
        p.needsUpdate = true;
      }
      /* 海浪起伏 */
      const arr = seaPos.array;
      for (let k = 0; k < arr.length; k += 3) {
        const x = seaBase[k], z = seaBase[k + 2];
        arr[k + 1] = Math.sin(x * .22 + time * 1.1) * .13 + Math.cos(z * .27 + time * .9) * .11;
      }
      seaPos.needsUpdate = true;
      sea.geometry.computeVertexNormals();
    }
    stepCamera(dt);
    renderer.render(scene, camera);
    const w = stage.clientWidth, h = stage.clientHeight;
    labels.forEach(l => {
      const p = v();
      l.obj.getWorldPosition(p);
      p.y += l.y;
      p.project(camera);
      l.el.style.display = p.z > 1 ? 'none' : '';
      l.el.style.left = ((p.x + 1) / 2 * w) + 'px';
      l.el.style.top = ((1 - p.y) / 2 * h) + 'px';
    });
    if (talk) {
      const p = v();
      talk.obj.getWorldPosition(p);
      p.y += 1.6;
      p.project(camera);
      const bx = Math.min(w - 120, Math.max(120, (p.x + 1) / 2 * w));
      bubble.style.left = bx + 'px';
      bubble.style.top = Math.max(150, (1 - p.y) / 2 * h) + 'px';
      labelLayer.classList.add('dim');
    } else labelLayer.classList.remove('dim');
  }


  /* ---------- 動物（原創低多邊形，正面朝 +z） ---------- */
  function legs4(c, w, l, h) {
    const list = [];
    [[-w, l], [w, l], [-w, -l], [w, -l]].forEach(([x, z]) => { const g = grp(box(.06, h, .06, c, 0, -h)); g.position.set(x, h, z); list.push(g); });
    return list;
  }
  function critter(kind) {
    let g, parts = {};
    const quad = (body, head, legC, extra) => {
      const L = legs4(legC, .1, .14, .16);
      const b = ball(.2, body, 0, .3, 0, 8); b.scale.set(1, .85, 1.35);
      const h = ball(.14, head, 0, .44, .26, 8);
      g = grp(b, h, ...L, ball(.022, '#222', -.06, .47, .38, 5), ball(.022, '#222', .06, .47, .38, 5), ...extra);
      parts.legs = L;
    };
    switch (kind) {
      case 'squirrel': {
        const tail = ball(.17, '#b9773e', 0, .5, -.24, 7); tail.scale.set(.8, 1.5, .8);
        quad('#b9773e', '#c98a50', '#8a5a2b', [cone(.05, .1, '#8a5a2b', 5, -.07, .55, .24), cone(.05, .1, '#8a5a2b', 5, .07, .55, .24), tail, ball(.05, '#f3e2c4', 0, .38, .37, 5)]);
        g.scale.setScalar(.8); break;
      }
      case 'cat': quad('#f0a04b', '#f0a04b', '#d98a3a', [cone(.05, .1, '#d98a3a', 4, -.07, .55, .25), cone(.05, .1, '#d98a3a', 4, .07, .55, .25), cyl(.025, .02, .35, '#d98a3a', 5, 0, .35, -.3).rotateX(-.5), ball(.035, '#ffb3b3', 0, .42, .39, 5)]); break;
      case 'dog': quad('#d8b07a', '#e6c494', '#a8814f', [box(.06, .14, .1, '#8a5a35', -.13, .36, .26), box(.06, .14, .1, '#8a5a35', .13, .36, .26), cyl(.03, .02, .22, '#a8814f', 5, 0, .36, -.3).rotateX(-.9), ball(.04, '#222', 0, .43, .4, 5)]); break;
      case 'rabbit': quad('#f7f3ee', '#ffffff', '#e8dccd', [box(.05, .26, .04, '#ffffff', -.05, .54, .22), box(.05, .26, .04, '#ffffff', .05, .54, .22), ball(.07, '#ffffff', 0, .32, -.3, 6), ball(.03, '#ff9fb0', 0, .43, .39, 5)]); g.scale.setScalar(.75); break;
      case 'deer': {
        const L = legs4('#8a5a35', .1, .16, .3);
        const b = ball(.22, '#b9773e', 0, .48, 0, 8); b.scale.set(1, .85, 1.45);
        g = grp(b, cyl(.06, .07, .22, '#b9773e', 6, 0, .55, .26), ball(.12, '#c98a50', 0, .8, .32, 8), cyl(.015, .015, .18, '#6b4a2b', 4, -.06, .88, .3), cyl(.015, .015, .18, '#6b4a2b', 4, .06, .88, .3),
          ball(.03, '#fff', -.12, .55, .05, 4), ball(.03, '#fff', .1, .58, -.08, 4), ball(.02, '#222', -.05, .83, .43, 5), ball(.02, '#222', .05, .83, .43, 5), ...L);
        parts.legs = L; break;
      }
      case 'sheep': {
        const L = legs4('#333', .1, .14, .16);
        g = grp(ball(.2, '#fbfbf6', 0, .34, 0, 7), ball(.15, '#fbfbf6', .1, .38, .12, 6), ball(.15, '#fbfbf6', -.1, .38, -.1, 6), ball(.14, '#fbfbf6', -.08, .4, .12, 6), ball(.11, '#3a3a3a', 0, .42, .27, 7), ...L);
        parts.legs = L; break;
      }
      case 'cow': quad('#fafafa', '#fafafa', '#555', [ball(.08, '#222', .12, .38, 0, 5), ball(.07, '#222', -.1, .33, -.12, 5), cone(.025, .08, '#e8dcc0', 4, -.1, .54, .25), cone(.025, .08, '#e8dcc0', 4, .1, .54, .25), box(.12, .07, .06, '#f2b8b8', 0, .38, .38)]); g.scale.setScalar(1.25); break;
      case 'duck': {
        const b = ball(.16, '#ffffff', 0, .18, 0, 8); b.scale.set(1, .8, 1.3);
        g = grp(b, ball(.1, '#3f8a4f', 0, .36, .14, 8), cone(.04, .1, '#f2a33b', 5, 0, .31, .26).rotateX(Math.PI / 2), ball(.018, '#222', -.05, .39, .2, 4), ball(.018, '#222', .05, .39, .2, 4), cone(.06, .1, '#ffffff', 4, 0, .18, -.22).rotateX(-1.2));
        g.scale.setScalar(.9); break;
      }
      case 'penguin': {
        const b = cyl(.12, .16, .4, '#2b2f3a', 8); const belly = ball(.12, '#ffffff', 0, .2, .07, 7); belly.scale.set(.9, 1.4, .6);
        g = grp(b, belly, ball(.12, '#2b2f3a', 0, .46, 0, 8), cone(.03, .08, '#f2a33b', 5, 0, .42, .14).rotateX(Math.PI / 2), ball(.02, '#fff', -.05, .5, .1, 4), ball(.02, '#fff', .05, .5, .1, 4), box(.03, .2, .08, '#2b2f3a', -.15, .12), box(.03, .2, .08, '#2b2f3a', .15, .12));
        g.scale.setScalar(.95); break;
      }
      case 'turtle': {
        const shell = ball(.3, '#3f8a4f', 0, 0, 0, 8); shell.scale.set(1, .45, 1.2);
        g = grp(shell, ball(.1, '#8cc152', 0, .02, .38, 6), box(.25, .03, .08, '#8cc152', -.28, -.02, .15), box(.25, .03, .08, '#8cc152', .28, -.02, .15), box(.12, .03, .06, '#8cc152', -.18, -.02, -.28), box(.12, .03, .06, '#8cc152', .18, -.02, -.28));
        break;
      }
      case 'dolphin': {
        const b = ball(.22, '#6f9fc4', 0, 0, 0, 8); b.scale.set(.8, .75, 2.6);
        const fin = cone(.1, .25, '#5a88ad', 4, 0, .12, -.05);
        g = grp(b, fin, cone(.06, .3, '#cfe3f0', 5, 0, -.05, .62).rotateX(Math.PI / 2), box(.4, .03, .12, '#5a88ad', 0, 0, -.6), ball(.025, '#222', -.11, .06, .38, 4), ball(.025, '#222', .11, .06, .38, 4));
        break;
      }
      case 'butterfly': {
        const wc = ['#ff8fb1', '#ffd95a', '#8fc7ff', '#b58cff'][Math.floor(Math.random() * 4)];
        const geo = new THREE.CircleGeometry(.16, 6);
        const wl = grp(), wr = grp();
        const ml = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: col(wc), side: THREE.DoubleSide })); ml.rotation.x = -Math.PI / 2; ml.position.x = -.15; wl.add(ml);
        const mr = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: col(wc), side: THREE.DoubleSide })); mr.rotation.x = -Math.PI / 2; mr.position.x = .15; wr.add(mr);
        g = grp(cyl(.02, .02, .22, '#333', 4, 0, -.11).rotateX(Math.PI / 2), wl, wr);
        parts.wl = wl; parts.wr = wr; break;
      }
      /* 2026-10-30 新增動物（原創低多邊形） */
      case 'fox': {
        const tail = ball(.12, '#e8742e', 0, .36, -.36, 7); tail.scale.set(.7, .7, 1.6);
        quad('#e8742e', '#ef8a45', '#3a2a22', [cone(.05, .12, '#e8742e', 4, -.07, .55, .25), cone(.05, .12, '#e8742e', 4, .07, .55, .25), tail, ball(.06, '#ffffff', 0, .36, -.54, 5), ball(.05, '#ffffff', 0, .4, .37, 5)]); break;
      }
      case 'panda': quad('#f7f7f2', '#f7f7f2', '#222', [ball(.05, '#222', -.1, .56, .24, 5), ball(.05, '#222', .1, .56, .24, 5), ball(.035, '#222', -.06, .47, .36, 5), ball(.035, '#222', .06, .47, .36, 5), box(.36, .1, .26, '#222', 0, .24, .02)]); g.scale.setScalar(1.15); break;
      case 'pig': quad('#f6b6c0', '#f8c3cb', '#e79aa8', [cyl(.05, .05, .04, '#f08ea0', 8, 0, .42, .38).rotateX(Math.PI / 2), cone(.04, .07, '#f08ea0', 4, -.08, .55, .25), cone(.04, .07, '#f08ea0', 4, .08, .55, .25)]); break;
      case 'chick': {
        const b = ball(.12, '#ffd84a', 0, .14, 0, 8);
        g = grp(b, ball(.08, '#ffd84a', 0, .27, .06, 8), cone(.025, .06, '#f29a2e', 4, 0, .24, .15).rotateX(Math.PI / 2), ball(.014, '#222', -.035, .29, .12, 4), ball(.014, '#222', .035, .29, .12, 4));
        g.scale.setScalar(.9); break;
      }
      case 'hedgehog': {
        const b = ball(.18, '#7a5a3e', 0, .17, 0, 8); b.scale.set(1, .75, 1.2);
        const sp = [];
        for (let k = 0; k < 10; k++) sp.push(cone(.04, .12, '#5a3e2a', 4, (k % 5 - 2) * .07, .22, (Math.floor(k / 5) - .5) * .16));
        g = grp(b, ball(.08, '#e8cfa8', 0, .15, .22, 6), ball(.02, '#222', 0, .16, .3, 4), ...sp); break;
      }
      case 'frog': {
        const b = ball(.14, '#5cb85c', 0, .12, 0, 8); b.scale.set(1.2, .7, 1);
        g = grp(b, ball(.05, '#5cb85c', -.07, .22, .07, 6), ball(.05, '#5cb85c', .07, .22, .07, 6), ball(.025, '#222', -.07, .25, .11, 4), ball(.025, '#222', .07, .25, .11, 4), box(.06, .03, .12, '#4a9a4a', -.15, 0, .02), box(.06, .03, .12, '#4a9a4a', .15, 0, .02)); break;
      }
      case 'crab': {
        const b = ball(.16, '#e2553a', 0, .12, 0, 8); b.scale.set(1.3, .55, 1);
        const L = [];
        [-1, 1].forEach(sd => { for (let k = 0; k < 3; k++) { const lg = grp(box(.14, .02, .03, '#c94a32', sd * .07, 0, 0)); lg.position.set(sd * .15, .08, -.08 + k * .08); L.push(lg); } });
        g = grp(b, ball(.06, '#e2553a', -.2, .14, .16, 6), ball(.06, '#e2553a', .2, .14, .16, 6), cyl(.012, .012, .08, '#c94a32', 4, -.05, .16, .1), cyl(.012, .012, .08, '#c94a32', 4, .05, .16, .1), ball(.022, '#222', -.05, .25, .1, 4), ball(.022, '#222', .05, .25, .1, 4), ...L);
        parts.legs = L; break;
      }
      case 'flamingo': {
        const L = [-.04, .04].map(x => { const lg = grp(box(.02, .45, .02, '#f07a9a', 0, -.45)); lg.position.set(x, .45, 0); return lg; });
        const b = ball(.14, '#f58fb0', 0, .55, 0, 8); b.scale.set(1, .8, 1.4);
        g = grp(b, cyl(.025, .025, .35, '#f58fb0', 5, 0, .62, .14), ball(.06, '#f58fb0', 0, 1.0, .16, 7), cone(.025, .08, '#333', 4, 0, .96, .24).rotateX(Math.PI / 2), ball(.015, '#222', -.035, 1.02, .2, 4), ball(.015, '#222', .035, 1.02, .2, 4), ...L);
        parts.legs = L; break;
      }
      case 'seal': {
        const b = ball(.16, '#8a8f98', 0, .13, 0, 8); b.scale.set(.9, .75, 1.7);
        g = grp(b, ball(.1, '#9aa0a8', 0, .24, .24, 8), ball(.025, '#222', 0, .24, .34, 4), ball(.018, '#222', -.04, .28, .31, 4), ball(.018, '#222', .04, .28, .31, 4), box(.18, .02, .07, '#7a7f88', -.15, .02, .08), box(.18, .02, .07, '#7a7f88', .15, .02, .08), box(.16, .02, .06, '#7a7f88', 0, .03, -.3)); break;
      }
      case 'whale': {
        const b = ball(.6, '#4f7fb3', 0, 0, 0, 10); b.scale.set(.9, .7, 2);
        const belly = ball(.5, '#dfe9f2', 0, -.18, .2, 8); belly.scale.set(.8, .4, 1.6);
        g = grp(b, belly, box(.9, .05, .3, '#4f7fb3', 0, 0, -1.25), ball(.05, '#222', -.42, .08, .7, 5), ball(.05, '#222', .42, .08, .7, 5), ball(.12, '#e8f4ff', 0, .62, .3, 6), ball(.09, '#e8f4ff', -.1, .78, .3, 6), ball(.09, '#e8f4ff', .1, .78, .3, 6));
        g.scale.setScalar(.85); break;
      }
      case 'seagull': {
        const b = ball(.08, '#ffffff', 0, 0, 0, 7); b.scale.set(1, .8, 1.8);
        const wl = grp(box(.32, .015, .12, '#dfe6ea', -.17, 0, 0)), wr = grp(box(.32, .015, .12, '#dfe6ea', .17, 0, 0));
        g = grp(b, ball(.06, '#ffffff', 0, .05, .14, 6), cone(.02, .06, '#f2b33d', 4, 0, .02, .22).rotateX(Math.PI / 2), wl, wr);
        parts.wl = wl; parts.wr = wr; break;
      }
      case 'owl': {
        const b = ball(.13, '#8a6a4a', 0, 0, 0, 8); b.scale.set(1, 1.2, 1);
        const face = ball(.09, '#e8d6b8', 0, .06, .08, 7); face.scale.z = .5;
        const wl = grp(box(.2, .02, .12, '#6b4f35', -.12, 0, 0)), wr = grp(box(.2, .02, .12, '#6b4f35', .12, 0, 0));
        g = grp(b, face, ball(.035, '#ffffff', -.04, .08, .12, 5), ball(.035, '#ffffff', .04, .08, .12, 5), ball(.018, '#222', -.04, .08, .15, 4), ball(.018, '#222', .04, .08, .15, 4), cone(.03, .07, '#6b4f35', 4, -.07, .15, 0), cone(.03, .07, '#6b4f35', 4, .07, .15, 0), wl, wr);
        parts.wl = wl; parts.wr = wr; break;
      }
    }
    g.userData.critter = parts;
    return g;
  }
  function addAnimals(list, isles, ring, seed0) {
    const R = rng(seed0 + 777);
    const lowY = shape === 'float' ? -3.4 : .1;
    list.forEach((k, ai) => {
      const def = IF.ANIMALS[k];
      if (!def) return;
      const [icon, name, where, line] = def;
      const count = where === 'air' ? 3 : 2;
      for (let c = 0; c < count; c++) {
        const isl = isles[(ai * 2 + c * 3) % isles.length];
        const obj = critter(k);
        const base = { seed: seed0 + ai * 41 + c * 7, obj, animal: true, title: `${icon} ${name}`, trade: null,
          lines: [line, isl.name ? `這裡是「${isl.name}」，是我最喜歡的地方。` : '這座島好舒服喔。'] };
        if (where === 'sea') {
          addNpc({ ...base, kind: 'swim', x: 0, y: lowY, z: 0, a: R() * 6.28, r: ring + 3 + c * 2.5 + ai % 3, v: (.05 + R() * .04) * (c % 2 ? -1 : 1), jump: k === 'dolphin', lowY });
        } else if (where === 'air') {
          const high = k === 'seagull' || k === 'owl';
          addNpc({ ...base, kind: 'fly', owl: k === 'owl', x: isl.x, y: isl.top + (high ? 2.6 : 1.1), z: isl.z, cx: isl.x, cz: isl.z, a: R() * 6.28, rr: high ? 2.2 + R() * 1.2 : .8 + R() * .8, v: high ? .5 + R() * .3 : .7 + R() * .5 });
        } else {
          const onTop = where === 'land' || shape === 'float' || shape === 'terrace';
          addNpc({ ...base, kind: 'wander', x: isl.x, y: onTop ? isl.top : .24, z: isl.z, cx: isl.x, cz: isl.z,
            rin: onTop ? .7 : isl.r * 1.03, rout: onTop ? isl.r * .82 : isl.r * 1.13, speed: .45 + R() * .3 });
        }
      }
    });
  }

  /* ---------- 地景點綴 ---------- */
  function addExtras(list, isles, center, ca, data) {
    const has = k => list.includes(k);
    const local = (isl, a, d) => [Math.cos(a) * isl.r * d, Math.sin(a) * isl.r * d];
    /* 2026-10-30 新增點綴 */
    if (has('lighthouse') && isles.length) {
      const isl = isles[Math.floor(isles.length / 2)];
      const [x, z] = local(isl, isl.a, .72);
      const beam = new THREE.Mesh(new THREE.ConeGeometry(.9, 7, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: .22, depthWrite: false, side: THREE.DoubleSide }));
      beam.rotation.z = Math.PI / 2; beam.position.x = 3.5;
      const rot = grp(beam); rot.position.y = 1.95;
      const lampRoom = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .3, 8), new THREE.MeshBasicMaterial({ color: 0xfff1b8 })); lampRoom.position.y = 1.95;
      const lh = grp(cyl(.26, .34, 1.8, '#ffffff', 10), cyl(.3, .33, .28, '#e2463a', 10, 0, .45), cyl(.27, .3, .28, '#e2463a', 10, 0, 1.15), lampRoom, cone(.3, .35, '#e2463a', 8, 0, 2.1), rot);
      lh.position.set(x, isl.top, z); isl.g.add(lh);
      movers.push({ tick: tt => { rot.rotation.y = tt * 1.1; beam.visible = night > .35 || dark; } });
    }
    if (has('ferris') && isles.length) {
      const isl = isles[0], a = isl.a - 1.3;
      const [x, z] = local(isl, a, .5);
      const wheel = grp(new THREE.Mesh(new THREE.TorusGeometry(.95, .045, 6, 28), mat(data.accent)));
      const cabs = ['#e46a5e', '#4f8fd6', '#f2b33d', '#5aa36b', '#9b6ad6', '#ff8fb1'];
      for (let k = 0; k < 6; k++) { const q = k / 6 * 6.28; const sp = box(.03, .95, .03, '#fffaf1', 0, 0, 0); sp.position.set(Math.cos(q) * .47, Math.sin(q) * .47, 0); sp.rotation.z = q - Math.PI / 2; wheel.add(sp, box(.2, .18, .16, cabs[k], Math.cos(q) * .95, Math.sin(q) * .95 - .09, 0)); }
      wheel.position.y = 1.25;
      const legA = box(.06, 1.35, .06, '#8a8f98', -.35, 0, 0); legA.rotation.z = -.28;
      const legB = box(.06, 1.35, .06, '#8a8f98', .35, 0, 0); legB.rotation.z = .28;
      const fw = grp(legA, legB, wheel); fw.position.set(x, isl.top, z); fw.rotation.y = -a + Math.PI / 2;
      isl.g.add(fw);
      movers.push({ spin: wheel, k: .5 });
    }
    if (has('sakura')) {
      isles.forEach((isl, i) => {
        const [x, z] = local(isl, isl.a + 2.3 + i * .2, .6);
        const t = roundTree(.95, '#f5a9c4'); t.position.set(x, isl.top, z); isl.g.add(t);
      });
    }
    if (has('campfire')) {
      isles.filter((_, i) => i % 2 === 1).slice(0, 3).forEach((isl, i) => {
        const [x, z] = local(isl, isl.a - 2.4, .45);
        const fire = grp();
        for (let k = 0; k < 7; k++) { const q = k / 7 * 6.28; fire.add(ball(.07, '#9aa0a6', Math.cos(q) * .26, .04, Math.sin(q) * .26, 5)); }
        const l1 = box(.42, .06, .07, '#7a4f2a', 0, .02, 0); l1.rotation.y = .6;
        const l2 = box(.42, .06, .07, '#7a4f2a', 0, .02, 0); l2.rotation.y = -.6;
        const flame = grp(cone(.13, .38, '#ff7a2a', 6, 0, .06), cone(.07, .24, '#ffd84a', 6, 0, .08));
        const fg = glow(0xff9a3a, 1.4); fg.position.y = .3;
        fire.add(l1, l2, flame, fg); fire.position.set(x, isl.top, z); isl.g.add(fire);
        movers.push({ tick: tt => { flame.scale.set(1, 1 + Math.sin(tt * 9 + i) * .22, 1); fg.material.opacity = .55 + night * .45; } });
      });
    }
    if (has('treehouse') && isles.length) {
      const isl = isles[1 % isles.length];
      const [x, z] = local(isl, isl.a + 1.9, .55);
      const rf = cone(.6, .38, data.accent, 4, 0, 1.92); rf.rotation.y = Math.PI / 4;
      const th = grp(cyl(.16, .22, 1.6, '#7a4f2a', 7), ball(.75, '#4f9f5a', 0, 2.55, 0, 8), ball(.5, '#62b26a', .45, 2.35, .3, 7),
        box(.75, .5, .65, '#c98a50', 0, 1.42, 0), rf, box(.95, .05, .85, '#a77b4b', 0, 1.38, 0),
        box(.04, 1.4, .04, '#6b4a2b', .32, 0, .5), box(.04, 1.4, .04, '#6b4a2b', .52, 0, .5));
      for (let k = 0; k < 5; k++) th.add(box(.24, .03, .03, '#6b4a2b', .42, .2 + k * .26, .5));
      th.position.set(x, isl.top, z); isl.g.add(th);
    }
    if (has('hotspring') && isles.length) {
      isles.filter((_, i) => i % 3 === 2 || isles.length < 3).slice(0, 2).forEach((isl, i) => {
        const [x, z] = local(isl, isl.a - .9, .62);
        const pool = cyl(.5, .5, .05, '#9fe3ea', 14, 0, .02); pool.material.transparent = true; pool.material.opacity = .9;
        const sp = grp(pool);
        for (let k = 0; k < 9; k++) { const q = k / 9 * 6.28; sp.add(ball(.09, '#8a8f98', Math.cos(q) * .55, .05, Math.sin(q) * .55, 5)); }
        const steam = [];
        for (let k = 0; k < 4; k++) { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(.16, 0), new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: .5, depthWrite: false })); sp.add(s); steam.push(s); }
        sp.position.set(x, isl.top, z); isl.g.add(sp);
        movers.push({ tick: tt => steam.forEach((s, k) => { const q = (tt * .3 + k / 4 + i * .3) % 1; s.position.set(Math.sin(k * 2 + q * 3) * .2, .1 + q * 1.2, Math.cos(k * 2) * .2); s.scale.setScalar(.6 + q * 1.3); s.material.opacity = .5 * (1 - q); }) });
      });
    }
    if (has('rainbow')) {
      const R0 = ((isles.length ? Math.hypot(isles[0].x, isles[0].z) : 11) + 2) * .55;
      const arcs = grp();
      ['#e8483a', '#f29a2e', '#f2d23a', '#5cb85c', '#4f8fd6', '#8a5ad6'].forEach((c, k) => {
        const arc = new THREE.Mesh(new THREE.TorusGeometry(R0 - k * .32, .16, 5, 48, Math.PI), new THREE.MeshBasicMaterial({ color: col(c), transparent: true, opacity: .38, depthWrite: false }));
        arcs.add(arc);
      });
      arcs.position.set(Math.cos(ca + Math.PI) * R0 * 1.5, -.5, Math.sin(ca + Math.PI) * R0 * 1.5); arcs.rotation.y = -(ca + Math.PI) + Math.PI / 2;
      group.add(arcs);
      movers.push({ tick: () => arcs.children.forEach(m => { m.material.opacity = .38 * (1 - Math.min(1, night * 1.4)); }) });
    }
    if (has('kites') && isles.length) {
      isles.filter((_, i) => i % 2 === 0).slice(0, 3).forEach((isl, i) => {
        const kc = [data.accent, '#e46a5e', '#4f8fd6'][i % 3];
        const sail = new THREE.Mesh(new THREE.CircleGeometry(.45, 4), new THREE.MeshLambertMaterial({ color: col(kc), side: THREE.DoubleSide }));
        sail.scale.y = 1.4;
        const kite = grp(sail, box(.04, .04, .04, '#fff', 0, -.75, 0), box(.12, .05, .02, '#fffaf1', .04, -.95, 0), box(.12, .05, .02, '#fffaf1', -.04, -1.15, 0));
        group.add(kite);
        movers.push({ tick: tt => { kite.position.set(isl.x + Math.sin(tt * .6 + i) * .8, isl.top + 4.5 + Math.sin(tt * 1.3 + i) * .4, isl.z + Math.cos(tt * .5 + i) * .8); kite.rotation.set(0, tt * .2 + i, Math.sin(tt * 1.7 + i) * .3); } });
      });
    }
    if (has('windmill')) {
      isles.filter((_, i) => i % 3 === 1).slice(0, 3).forEach(isl => {
        const blades = grp();
        for (let k = 0; k < 4; k++) { const b = box(.14, .9, .03, '#fffaf1', 0, .1, 0); const p = grp(b); p.rotation.z = k * Math.PI / 2; blades.add(p); }
        blades.position.set(0, 1.55, .36);
        const mill = grp(cyl(.22, .34, 1.5, '#f3e2c4', 8), cone(.32, .35, data.accent, 8, 0, 1.5), blades);
        const a = isl.a + 1.1;
        mill.position.set(Math.cos(a) * isl.r * .55, isl.top, Math.sin(a) * isl.r * .55);
        mill.rotation.y = -a;
        isl.g.add(mill);
        movers.push({ spin: blades, k: 2 });
      });
    }
    if (has('waterfall')) {
      const bottom = shape === 'float' ? -5.5 : .2;
      isles.filter((_, i) => i % 2 === 0).slice(0, 4).forEach(isl => {
        const a = isl.a + .5, edge = isl.r * (shape === 'terrace' ? 1.2 : 1.0);
        const h = isl.top - bottom;
        const sheet = new THREE.Mesh(new THREE.PlaneGeometry(.55, h), new THREE.MeshBasicMaterial({ color: 0x9fdcf5, transparent: true, opacity: .7, side: THREE.DoubleSide, depthWrite: false }));
        const wf = grp(sheet);
        sheet.position.y = -h / 2;
        const drops = [];
        for (let k = 0; k < 8; k++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.07, 5, 4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .85 })); d.position.set((Math.random() - .5) * .45, -Math.random() * h, .03); wf.add(d); drops.push(d); }
        const splash = ball(.35, '#ffffff', 0, -h + .1, 0, 6); splash.material.transparent = true; splash.material.opacity = .6; splash.scale.y = .4; wf.add(splash);
        wf.position.set(isl.x + Math.cos(a) * edge, isl.top - .05, isl.z + Math.sin(a) * edge);
        wf.rotation.y = -a + Math.PI / 2;
        group.add(wf);
        movers.push({ fall: drops, h });
      });
    }
    if (has('balloon')) {
      const cols = [[data.primary, '#fffaf1'], [data.accent, '#f2c230'], ['#e46a5e', '#4f8fd6']];
      for (let k = 0; k < 3; k++) {
        const env = ball(1, cols[k][0], 0, 0, 0, 12); env.scale.set(1, 1.15, 1);
        const band = new THREE.Mesh(new THREE.TorusGeometry(1.01, .12, 6, 24), mat(cols[k][1])); band.rotation.x = Math.PI / 2;
        const b = grp(env, band, cone(.55, .7, cols[k][0], 10, 0, -1.35).rotateX(Math.PI), box(.45, .35, .45, '#a77b4b', 0, -2.15),
          cyl(.015, .015, .7, '#5a3a22', 3, -.2, -1.9, 0), cyl(.015, .015, .7, '#5a3a22', 3, .2, -1.9, 0));
        b.scale.setScalar(.7);
        b.traverse(o => { o.userData.noShadow = true; });
        group.add(b);
        movers.push({ balloon: b, a: k * 2.1 + .4, r: 26 + k * 5, y: 9 + k * 1.8, v: .02 + k * .008 });
      }
    }
    if (has('flowers')) {
      const palette = ['#ff8fb1', '#ffd95a', '#ffffff', '#b58cff', '#ff7a59', '#e85d8a'];
      isles.forEach((isl, i) => {
        const a = isl.a - 1.2, d = isl.r * .5, cx = Math.cos(a) * d, cz = Math.sin(a) * d;
        const c = palette[i % palette.length], c2 = palette[(i + 2) % palette.length];
        const bed = box(.9, .04, .6, '#6b8f3a', cx, isl.top, cz); bed.rotation.y = -a; isl.g.add(bed);
        for (let r = 0; r < 3; r++) for (let q = 0; q < 5; q++) {
          const lx = -.36 + q * .18, lz = -.2 + r * .2;
          const x = cx + Math.cos(-a) * lx - Math.sin(-a) * lz, z = cz + Math.sin(-a) * lx + Math.cos(-a) * lz;
          isl.g.add(ball(.055, r % 2 ? c2 : c, x, isl.top + .1, z, 5));
        }
      });
    }
    if (has('bunting')) {
      bridges.forEach(br => {
        const n = Math.max(6, Math.floor(br.len / .5));
        for (let k = 0; k <= n; k++) {
          const x = -br.len / 2 + k * br.len / n, sag = Math.sin(k / n * Math.PI) * .18;
          const f = cone(.07, .16, ['#e46a5e', '#f2c230', '#4f8fd6', '#5aa36b', '#e58ab2'][k % 5], 3, x, .72 - sag, 0);
          f.rotation.x = Math.PI;
          br.obj.add(f);
        }
      });
    }
    if (has('fountain')) {
      const fa = ca + Math.PI, fx = Math.cos(fa) * 2.5, fz = Math.sin(fa) * 2.5, t = center.userData.top;
      const water = new THREE.Mesh(new THREE.CylinderGeometry(.62, .62, .06, 16), new THREE.MeshPhongMaterial({ color: 0x7fd3e8, shininess: 80 }));
      water.position.set(fx, t + .22, fz);
      const jets = [];
      for (let k = 0; k < 6; k++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.06, 5, 4), new THREE.MeshBasicMaterial({ color: 0xdff6ff, transparent: true, opacity: .9 })); center.add(d); jets.push({ d, ph: k / 6 }); }
      center.add(cyl(.72, .78, .25, '#d8d0c0', 14, fx, t, fz), water, cyl(.08, .1, .55, '#d8d0c0', 8, fx, t + .2, fz), ball(.16, '#7fd3e8', fx, t + .8, fz, 8));
      movers.push({ jets, fx, fz, t });
    }
  }

  /* ---------- 精緻度：小路、圍籬、長椅、旗子 ---------- */
  function refine(g, seed, avoidA, level, s) {
    if (level < 3) return;
    const R = rng(seed + 5), r = g.userData.r, top = g.userData.top;
    for (let k = 0; k < 6; k++) {
      const d = r * (.3 + k * .11);
      const st = cyl(.13, .14, .04, '#d8cdb8', 7, Math.cos(avoidA) * d + (R() - .5) * .12, top, Math.sin(avoidA) * d + (R() - .5) * .12);
      g.add(st);
    }
    const fa = avoidA + 2.2, fd = r * .72;
    for (let k = -2; k <= 2; k++) {
      const a = fa + k * .16;
      g.add(box(.05, .26, .05, '#a77b4b', Math.cos(a) * fd, top, Math.sin(a) * fd));
      if (k < 2) { const rail = box(.32, .04, .03, '#c9a27a', Math.cos(a + .08) * fd, top + .17, Math.sin(a + .08) * fd); rail.rotation.y = -(a + .08) + Math.PI / 2; g.add(rail); }
    }
    const ba = avoidA - 1.6, bx = Math.cos(ba) * r * .62, bz = Math.sin(ba) * r * .62;
    const bench = grp(box(.5, .05, .18, '#b98a55', 0, .16), box(.5, .16, .04, '#b98a55', 0, .22, -.08), box(.04, .16, .14, '#6b4a2b', -.2), box(.04, .16, .14, '#6b4a2b', .2));
    bench.position.set(bx, top, bz); bench.rotation.y = -ba - Math.PI / 2; g.add(bench);
    g.add(box(.22, .2, .22, '#c9a27a', Math.cos(ba + .5) * r * .7, top, Math.sin(ba + .5) * r * .7));
    for (let k = 0; k < 8; k++) { const a = R() * 6.28, d = r * (.85 + R() * .1); g.add(cone(.07, .18, '#5a9f4a', 4, Math.cos(a) * d, top, Math.sin(a) * d)); }
    if (level >= 4) {
      const fa2 = avoidA + Math.PI * .8, fx = Math.cos(fa2) * r * .8, fz = Math.sin(fa2) * r * .8;
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(.45, .28, 4, 1), new THREE.MeshLambertMaterial({ color: col(['#e46a5e', '#f2c230', '#4f8fd6'][Math.floor(R() * 3)]), side: THREE.DoubleSide }));
      flag.position.set(.24, 1.05, 0);
      const pole = grp(cyl(.025, .025, 1.2, '#5a5a5a', 5), flag);
      pole.position.set(fx, top, fz);
      g.add(pole);
      movers.push({ flag, base: Float32Array.from(flag.geometry.attributes.position.array) });
      for (let k = 0; k < 10; k++) { const a = R() * 6.28, d = r * (.35 + R() * .5); if (free2(a, avoidA)) g.add(ball(.05, ['#ff8fb1', '#ffd95a', '#fff'][k % 3], Math.cos(a) * d, top + .06, Math.sin(a) * d, 4)); }
    }
  }
  function free2(a, b) { return Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))) > .4; }

  /* ---------- 浮空島：雲海與遠方的小浮島 ---------- */
  function cloudSea(seed) {
    const R = rng(seed + 31);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(200, 32), cloudMat);
    floor.rotation.x = -Math.PI / 2; floor.position.y = -6.5;
    group.add(floor);
    for (let k = 0; k < 46; k++) {
      const c = new THREE.Group();
      const puffs = 3 + Math.floor(R() * 3);
      for (let p = 0; p < puffs; p++) {
        const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6 + R() * 1.4, 1), cloudMat);
        m.position.set((p - puffs / 2) * 2, R() * .6, R() * 2 - 1); m.scale.y = .55; c.add(m);
      }
      const a = R() * 6.28, r = 4 + R() * 80;
      c.position.set(Math.cos(a) * r, -5.6 + R() * 1.2, Math.sin(a) * r);
      group.add(c);
      clouds.push({ obj: c, a, r, y: c.position.y, v: .004 + R() * .006 });
    }
    for (let k = 0; k < 16; k++) {
      const a = k / 16 * 6.28 + R() * .2, d = 62 + R() * 30, y = -2 + R() * 10, s = 1.5 + R() * 2.5;
      const islet = grp(cone(s, s * 2.2, '#9a7552', 7, 0, -s * 2.2).rotateX(Math.PI), cyl(s * 1.02, s, .4, '#7fbf6a', 9, 0, -.4), cone(s * .35, s * .9, '#3f8a4f', 6, s * .2, 0, 0));
      islet.children[0].position.y = -s * 1.1 - .4;
      islet.position.set(Math.cos(a) * d, y, Math.sin(a) * d);
      group.add(islet);
    }
  }

  /* ---------- 鏡頭運鏡 ---------- */
  let cine = null, focus = null, cinema = 'smooth', introDone = false;
  let tourR = 12, tourN = 6;   /* 空拍導覽用：群島半徑、島數 */
  const ease = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  function orbitPos(y0, p0, d0) { return new THREE.Vector3(Math.sin(y0) * Math.cos(p0) * d0, Math.sin(p0) * d0, Math.cos(y0) * Math.cos(p0) * d0); }
  function playIntro(force, quick) {
    if (!renderer) return;
    focus = null;
    if (cinema === 'off' || reduced) { cine = null; resetView(); return; }
    const mobile = innerWidth < 700;
    const y1 = 0.6, p1 = 0.82, d1 = baseDist;
    if (cinema === 'epic' && !quick) {
      const dur = mobile ? 4 : 5.6;
      cine = { t: 0, dur, kind: 'intro', fn: k => {
        /* 從雲端高空繞半圈俯衝，貼近群島後再拉遠成全景 */
        const e = ease(k);
        const yaw0 = y1 - Math.PI * 1.15 + Math.PI * 1.15 * e;
        const dd = k < .68 ? 150 + (d1 * .42 - 150) * ease(k / .68) : d1 * .42 + (d1 - d1 * .42) * ease((k - .68) / .32);
        const pp = k < .68 ? 1.42 + (.32 - 1.42) * ease(k / .68) : .32 + (p1 - .32) * ease((k - .68) / .32);
        return { pos: orbitPos(yaw0, pp, dd), look: new THREE.Vector3(0, k < .68 ? 2 * (1 - k / .68) : 0, 0) };
      } };
    } else if (cinema === 'topdown' && !quick) {
      /* 上帝視角：正上方往下看，一邊旋轉一邊斜下來 */
      cine = { t: 0, dur: mobile ? 2.6 : 3.6, kind: 'intro', fn: k => { const e = ease(k); return { pos: orbitPos(y1 - Math.PI * (1 - e), 1.5 + (p1 - 1.5) * e, 105 + (d1 - 105) * e), look: new THREE.Vector3() }; } };
    } else if (cinema === 'crane' && !quick) {
      /* 升降搖臂：貼近海面看中央島，再升高拉遠 */
      cine = { t: 0, dur: mobile ? 2.6 : 3.6, kind: 'intro', fn: k => { const e = ease(k); return { pos: orbitPos(y1 + .35 * (1 - e), .05 + (p1 - .05) * e, d1 * .5 + d1 * .5 * e), look: new THREE.Vector3(0, 2 * (1 - e), 0) }; } };
    } else if (cinema === 'drone' && !quick) {
      /* 空拍導覽：沿群島外圈低空飛一圈，經過每座島，最後拉高成全景 */
      const dur = Math.min(12, 2 * Math.max(3, tourN)) * (mobile ? .8 : 1);
      const fly = kk => { const ang = y1 + Math.PI * 2 * kk, la = ang + .55; return { pos: new THREE.Vector3(Math.sin(ang) * (tourR + 7), 3.6 + Math.sin(kk * Math.PI * tourN) * .7, Math.cos(ang) * (tourR + 7)), look: new THREE.Vector3(Math.sin(la) * tourR, 1, Math.cos(la) * tourR) }; };
      cine = { t: 0, dur, kind: 'intro', fn: k => {
        if (k < .82) return fly(k / .82);
        const e = ease((k - .82) / .18), a = fly(1);
        return { pos: a.pos.lerp(orbitPos(y1, p1, d1), e), look: a.look.lerp(new THREE.Vector3(), e) };
      } };
    } else {
      cine = { t: 0, dur: mobile ? 1.8 : 2.6, kind: 'intro', fn: k => { const e = ease(k); return { pos: orbitPos(y1 + .9 * (1 - e), 1.35 + (p1 - 1.35) * e, 95 + (d1 - 95) * e), look: new THREE.Vector3() }; } };
    }
    cine.end = () => { yaw = y1; pitch = p1; dist = d1; zoomed = false; auto = true; };
    introDone = true;
    if (force) stage.focus && stage.focus({ preventScroll: true });
  }
  function camNow() { return { pos: camera.position.clone(), look: (focus ? focus.look.clone() : new THREE.Vector3()) }; }
  function flyTo(label, done) {
    const p = new THREE.Vector3();
    label.obj.getWorldPosition(p);
    p.y = label.obj.userData.top || 1.5;
    const a = Math.atan2(p.z, p.x);
    const endLook = p.clone();
    const endPos = new THREE.Vector3(Math.cos(a) * (Math.hypot(p.x, p.z) + 8.5), p.y + 6.5, Math.sin(a) * (Math.hypot(p.x, p.z) + 8.5));
    const from = camNow();
    if (cinema === 'off' || reduced) { camera.position.copy(endPos); focus = { pos: endPos, look: endLook }; cine = null; if (done) done(); return; }
    const epic = cinema === 'epic';
    const r0 = Math.hypot(from.pos.x, from.pos.z), a0 = Math.atan2(from.pos.z, from.pos.x), h0 = from.pos.y;
    const r1 = Math.hypot(endPos.x, endPos.z), h1 = endPos.y;
    let da = Math.atan2(Math.sin(a - a0), Math.cos(a - a0));
    if (epic && Math.abs(da) < 1.2) da += da >= 0 ? -Math.PI * .9 : Math.PI * .9; /* 史詩：多繞一段弧線再推近 */
    cine = { t: 0, dur: (epic ? 2.3 : 1.3) * (innerWidth < 700 ? .75 : 1), kind: 'fly', fn: k => {
      const e = ease(k);
      const ang = a0 + da * e, rr = r0 + (r1 - r0) * e + (epic ? Math.sin(k * Math.PI) * 10 : 0), hh = h0 + (h1 - h0) * e + Math.sin(k * Math.PI) * (epic ? 14 : 4);
      return { pos: new THREE.Vector3(Math.cos(ang) * rr, hh, Math.sin(ang) * rr), look: from.look.clone().lerp(endLook, ease(Math.min(1, k * 1.3))) };
    } };
    cine.end = () => { focus = { pos: endPos, look: endLook }; if (done) done(); };
  }
  function backToOverview() {
    if (!focus) return;
    const from = camNow(), to = orbitPos(yaw, pitch, dist);
    focus = null;
    if (cinema === 'off' || reduced) { cine = null; return; }
    cine = { t: 0, dur: .9, kind: 'back', fn: k => { const e = ease(k); return { pos: from.pos.clone().lerp(to, e).add(new THREE.Vector3(0, Math.sin(k * Math.PI) * 3, 0)), look: from.look.clone().lerp(new THREE.Vector3(), e) }; } };
    cine.end = () => {};
  }
  function skipCine() { if (cine && cine.kind === 'intro') { cine.t = cine.dur; } }
  function stepCamera(dt) {
    if (cine) {
      cine.t += dt;
      const k = Math.min(1, cine.t / cine.dur);
      const f = cine.fn(k);
      camera.position.copy(f.pos); camera.lookAt(f.look);
      if (k >= 1) { const end = cine.end; cine = null; end(); }
      return;
    }
    if (focus) { camera.position.copy(focus.pos); camera.lookAt(focus.look); return; }
    camera.position.copy(orbitPos(yaw, pitch, dist));
    camera.lookAt(0, 0, 0);
  }

  IF.preview = { init, update, highlight, resetView, setTod, playIntro, onPick: null };
})();
