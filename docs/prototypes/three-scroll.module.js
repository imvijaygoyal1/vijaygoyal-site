  import * as THREE from "three";

  const SRC = { xbill: "__XBILL__", spade: "__SPADE__" };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const A = window.anime;

  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const smooth = (t) => t * t * (3 - 2 * t);
  const band = (s, a, b) => smooth(clamp01((s - a) / (b - a)));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  // ---- The parts, measured in each capture's own 768 x 1670 pixels --------
  // r: [x, y, w, h], rad: corner radius, tier: how far forward it floats,
  // lift: read in turn while its section is on screen, kids: parts cut out of it.
  const PARTS = {
    xbill: [
      { r: [20, 118, 728, 84], rad: 0, tier: 1, lift: true },
      { r: [30, 290, 708, 100], rad: 34, tier: 2, lift: true },
      { r: [56, 440, 310, 48], rad: 0, tier: 1 },
      { r: [30, 500, 708, 150], rad: 40, tier: 1, kids: [
        { r: [60, 532, 240, 84], rad: 42, tier: 3, lift: true },
        { r: [316, 532, 170, 84], rad: 42, tier: 3 },
      ] },
      { r: [30, 716, 708, 196], rad: 40, tier: 2, lift: true, kids: [
        { r: [60, 782, 648, 100], rad: 22, tier: 3 },
      ] },
      { r: [56, 966, 150, 48], rad: 0, tier: 1 },
      { r: [30, 1040, 708, 172], rad: 0, tier: 2, lift: true, kids: [
        { r: [186, 1096, 176, 56], rad: 28, tier: 4 },
        { r: [62, 1152, 462, 46], rad: 22, tier: 4, lift: true },
      ] },
      { r: [30, 1252, 708, 172], rad: 0, tier: 2, kids: [
        { r: [186, 1308, 176, 56], rad: 28, tier: 4 },
        { r: [62, 1362, 462, 46], rad: 22, tier: 4 },
      ] },
      { r: [30, 1462, 708, 172], rad: 0, tier: 2, lift: true, kids: [
        { r: [186, 1518, 176, 56], rad: 28, tier: 4 },
        { r: [62, 1574, 462, 46], rad: 22, tier: 4 },
      ] },
    ],
    spade: [
      ...[32, 150, 268, 386, 504, 622].map((x, i) => ({ r: [x, 84, 114, 152], rad: 12, tier: 2 + (i % 2), lift: i === 0 })),
      { r: [22, 274, 236, 84], rad: 14, tier: 3, lift: true },
      { r: [266, 274, 238, 84], rad: 14, tier: 3, lift: true },
      { r: [512, 274, 232, 84], rad: 14, tier: 3, lift: true },
      { r: [22, 380, 722, 374], rad: 26, tier: 1, kids: [
        { r: [70, 478, 152, 214], rad: 14, tier: 4, lift: true },
      ] },
      { r: [22, 776, 722, 286], rad: 26, tier: 1, kids: [
        { r: [96, 842, 116, 146], rad: 10, tier: 3 },
        { r: [326, 842, 116, 146], rad: 10, tier: 4 },
        { r: [556, 842, 116, 146], rad: 10, tier: 5, lift: true },
      ] },
      { r: [22, 1082, 722, 280], rad: 26, tier: 1, kids: [
        { r: [284, 1084, 200, 60], rad: 30, tier: 3 },
        ...[50, 134, 216, 300, 382, 466, 548, 630].map((x, i) => ({ r: [x, 1158, 84, 120], rad: 8, tier: 3 + (i % 3), lift: i === 7 })),
      ] },
    ],
  };

  // ---- Renderer ------------------------------------------------------------
  const canvas = document.getElementById("gl");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 5.2);

  const SH = 1.75, K = SH / 1670;  // world units per capture pixel
  const loadImage = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
  }

  /** A part's own picture: its crop, with its children's places filled in. */
  function partTexture(img, pick, part, isBase) {
    const [x, y, w, h] = part.r;
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const g = c.getContext("2d");
    roundRect(g, 0, 0, w, h, isBase ? 46 : part.rad);
    g.clip();
    g.drawImage(img, x, y, w, h, 0, 0, w, h);
    for (const k of part.kids ?? []) {
      const [kx, ky, kw, kh] = k.r;
      // The colour just outside the child, so the hole reads as the surface beneath it.
      g.fillStyle = pick(Math.max(0, kx - 6), Math.max(0, ky + kh / 2));
      roundRect(g, kx - x - 1, ky - y - 1, kw + 2, kh + 2, k.rad);
      g.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }

  const lineMat = new THREE.LineBasicMaterial({ color: 0x26262b, transparent: true, opacity: 0 });
  // Hidden outright outside the paper section: at opacity 0 they still showed
  // as hard outlines around the assembled parts.
  const outlines = [];

  async function buildScreen(key) {
    const img = await loadImage(SRC[key]);
    const full = document.createElement("canvas");
    full.width = 768; full.height = 1670;
    const fg = full.getContext("2d", { willReadFrequently: true });
    fg.drawImage(img, 0, 0);
    const pick = (px, py) => { const d = fg.getImageData(px | 0, py | 0, 1, 1).data; return `rgb(${d[0]},${d[1]},${d[2]})`; };

    const group = new THREE.Group();
    const parts = [];
    let n = 0;
    function add(part, isBase) {
      const [x, y, w, h] = part.r;
      const mat = new THREE.MeshBasicMaterial({ map: partTexture(img, pick, part, isBase), transparent: true, toneMapped: false, depthWrite: false });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w * K, h * K), mat);
      const home = new THREE.Vector3((x + w / 2 - 384) * K, (835 - (y + h / 2)) * K, isBase ? 0 : 0.002 * part.tier);
      const i = n++;
      // Where it floats when the screen comes apart: forward by its tier,
      // outward from the centre, turned a little.
      const away = new THREE.Vector3(home.x * 0.55 + (rand(i) - 0.5) * 0.5, home.y * 0.35 + (rand(i + 9) - 0.5) * 0.4, isBase ? -0.35 : 0.25 + part.tier * 0.32 + rand(i + 3) * 0.25);
      mesh.renderOrder = isBase ? 0 : part.tier;
      const outline = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), lineMat);
      outline.visible = false;
      outlines.push(outline);
      mesh.add(outline);
      mesh.userData = { home, away, spin: new THREE.Vector3((rand(i + 1) - 0.5) * 0.5, (rand(i + 2) - 0.5) * 0.6, (rand(i + 4) - 0.5) * 0.35), order: i, lift: !!part.lift, isBase, mat };
      group.add(mesh);
      parts.push(mesh);
      for (const kid of part.kids ?? []) add(kid, false);
    }
    add({ r: [0, 0, 768, 1670], rad: 46, tier: 0, kids: PARTS[key] }, true);
    // Assembly order: the base first, then the big panels, then the small parts.
    const movers = parts.filter((p) => !p.userData.isBase);
    movers.forEach((m, i) => (m.userData.seq = i / Math.max(1, movers.length - 1)));
    const lifters = movers.filter((m) => m.userData.lift);
    lifters.forEach((m, i) => (m.userData.liftSlot = i / lifters.length));
    group.userData = { parts, lifters: lifters.length };
    scene.add(group);
    return group;
  }

  /**
   * Places one screen. `together` 0 = apart, 1 = assembled, with each part
   * keeping its own staggered window so they slot in one after another.
   * `read` 0..1 walks the lifting parts in turn. `shown` fades the screen.
   */
  function pose(group, together, read, shown, drawn, t) {
    for (const m of group.userData.parts) {
      const u = m.userData;
      const start = u.isBase ? 0 : u.seq * 0.55;
      const e = u.isBase ? smooth(clamp01(together * 1.6)) : band(together, start, start + 0.45);
      const apart = 1 - e;
      const drift = reduced ? 0 : Math.sin(t * 0.8 + u.order) * 0.03 * apart;
      m.position.set(lerp(u.home.x, u.home.x + u.away.x, apart), lerp(u.home.y, u.home.y + u.away.y, apart) + drift, lerp(u.home.z, u.away.z, apart));
      m.rotation.set(u.spin.x * apart, u.spin.y * apart, u.spin.z * apart);
      // Reading: one part at a time lifts out of the screen and drops back.
      if (u.lift && read > 0 && read < 1) {
        const n = group.userData.lifters;
        const local = clamp01((read - u.liftSlot) * n);
        const bump = Math.sin(Math.PI * local) * (local > 0 && local < 1 ? 1 : 0);
        m.position.z += 0.32 * bump;
        m.scale.setScalar(1 + 0.06 * bump);
      } else {
        m.scale.setScalar(1);
      }
      u.mat.opacity = shown * (1 - drawn * 0.82);
    }
    group.visible = shown > 0.001;
  }

  // ---- Dial and ruler (2D, pinned) ---------------------------------------
  const dial = document.getElementById("dial");
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  dial.append(svg);
  const tickEls = [];
  for (let i = 0; i < 120; i++) {
    const l = document.createElementNS(NS, "line");
    l.setAttribute("class", "tick");
    svg.append(l);
    tickEls.push(l);
  }
  const arcs = ["#ec5a3f", "#8f7cf5", "#c9a23f", "#f4f3ef"].map((c) => {
    const a = document.createElementNS(NS, "circle");
    a.setAttribute("class", "arc");
    a.setAttribute("stroke", c);
    svg.append(a);
    return a;
  });
  const ruler = document.getElementById("ruler");
  const rulerTicks = Array.from({ length: 30 }, () => { const i = document.createElement("i"); ruler.append(i); return i; });

  // ---- Words arrive with anime.js -----------------------------------------
  const sections = [...document.querySelectorAll("main > section")];
  for (const h of document.querySelectorAll("[data-words]")) {
    h.innerHTML = h.textContent.split(" ").map((w) => `<span class="word">${w}</span>`).join(" ");
  }
  const arrived = new Set();
  function arrive(i) {
    if (arrived.has(i) || !A || reduced) return;
    arrived.add(i);
    A.animate(sections[i].querySelectorAll(".word"), { opacity: [0, 1], y: ["0.5em", "0em"], duration: 700, ease: "outExpo", delay: A.stagger(55) });
  }

  // ---- Layout ------------------------------------------------------------
  let view = { w: 1, h: 1, mobile: false };
  function fit() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    view = { w, h, mobile: w <= 760 };
    const r = Math.min(view.mobile ? w * 0.4 : h * 0.42, 380);
    svg.setAttribute("width", r * 2 + 20);
    svg.setAttribute("height", r * 2 + 20);
    svg.setAttribute("viewBox", `${-r - 10} ${-r - 10} ${r * 2 + 20} ${r * 2 + 20}`);
    tickEls.forEach((l, i) => {
      const a = (i / tickEls.length) * Math.PI * 2, long = i % 10 === 0 ? 14 : 7;
      l.setAttribute("x1", Math.cos(a) * r); l.setAttribute("y1", Math.sin(a) * r);
      l.setAttribute("x2", Math.cos(a) * (r - long)); l.setAttribute("y2", Math.sin(a) * (r - long));
    });
    arcs.forEach((a, i) => {
      const rr = r + 6;
      a.setAttribute("r", rr);
      a.dataset.c = String(2 * Math.PI * rr);
      a.setAttribute("stroke-dasharray", `${a.dataset.c} ${a.dataset.c}`);
      a.setAttribute("transform", `rotate(${i * 90 - 90})`);
    });
  }
  addEventListener("resize", fit, { passive: true });
  fit();

  function progress() {
    const mid = innerHeight / 2;
    for (let i = 0; i < sections.length; i++) {
      const r = sections[i].getBoundingClientRect();
      if (r.bottom > mid || i === sections.length - 1) {
        const travel = Math.max(1, r.height - innerHeight);
        return i + clamp01(-r.top / travel);
      }
    }
    return 0;
  }

  const [xbill, spade] = await Promise.all([buildScreen("xbill"), buildScreen("spade")]);
  const rig = new THREE.Group();
  scene.add(rig);
  rig.add(xbill, spade);

  const v3 = new THREE.Vector3();
  let current = -1;
  function frame(now) {
    const s = progress();
    const idx = Math.min(sections.length - 1, Math.floor(s));
    if (idx !== current) {
      current = idx;
      document.body.classList.toggle("light", sections[idx].dataset.theme === "light");
      document.getElementById("chapter").textContent = `0${idx + 1} / 0${sections.length}`;
      arrive(idx);
    }
    const t = reduced ? 0 : now / 1000;

    // xBill: apart at the opening, assembled through its section, flies apart
    // as The Shady Spade assembles; the Shady Spade comes apart again on paper
    // and settles at the end.
    const paper = band(s, 2.9, 3.3) * (1 - band(s, 3.7, 4.15));
    const xTogether = reduced ? 1 : band(s, 0.2, 1.05) * (1 - band(s, 1.85, 2.3));
    const xShown = reduced ? (s < 2 ? 1 : 0) : 1 - band(s, 2.15, 2.4);
    const sTogether = reduced ? 1 : band(s, 2.05, 2.55) * (1 - paper * 0.9);
    const sShown = reduced ? (s >= 2 ? 1 : 0) : band(s, 1.95, 2.15);
    pose(xbill, xTogether, reduced ? 0 : (s - 1.12) / 0.75, xShown, 0, t);
    pose(spade, sTogether, reduced ? 0 : (s - 2.55) / 0.35, sShown, paper, t);
    lineMat.opacity = paper * 0.9;
    for (const o of outlines) o.visible = paper > 0.005;

    const apartish = Math.max(1 - xTogether, paper);
    const idle = reduced ? 0 : Math.sin(t * 0.5) * 0.05;
    rig.rotation.set(
      lerp(0.08, 0.32, apartish) + paper * 0.18 + (reduced ? 0 : Math.cos(t * 0.4) * 0.02),
      lerp(-0.12, -0.62, apartish) - paper * 0.2 + idle,
      paper * -0.08,
    );
    rig.position.set(view.mobile ? 0 : camera.aspect * 0.6, view.mobile ? -0.72 : 0, 0);
    rig.scale.setScalar((view.mobile ? 0.6 : 1) * lerp(1, 0.88, band(s, 4.3, 4.9)));

    v3.copy(rig.position).project(camera);
    dial.style.transform = `translate(${(v3.x * 0.5 + 0.5) * view.w}px, ${(-v3.y * 0.5 + 0.5) * view.h}px)`;
    dial.style.color = document.body.classList.contains("light") ? "#141417" : "#f4f3ef";
    const local = s - idx;
    arcs.forEach((a, i) => {
      const c = Number(a.dataset.c);
      const fill = i === Math.min(idx, 3) ? 0.12 + local * 0.13 : i < Math.min(idx, 3) ? 0.25 : 0.04;
      a.setAttribute("stroke-dashoffset", String(c * (1 - fill)));
    });
    const on = Math.round((s / sections.length) * (rulerTicks.length - 1));
    rulerTicks.forEach((el, i) => el.classList.toggle("on", i === on));

    renderer.render(scene, camera);
    if (!reduced) requestAnimationFrame(frame);
  }
  if (reduced) {
    addEventListener("scroll", () => requestAnimationFrame(frame), { passive: true });
    addEventListener("resize", () => requestAnimationFrame(frame), { passive: true });
  }
  requestAnimationFrame(frame);
