  import * as THREE from "three";

  // ---- The six cards -------------------------------------------------------
  // Placeholders for now. To put a real screen on a card later, set its `src`
  // to the image (a URL or data: URI, shaped 768 x 1670) — nothing else changes.
  const CARDS = [
    { app: "xBill", n: 1, hue: "#8f7cf5", src: null },
    { app: "xBill", n: 2, hue: "#8f7cf5", src: null },
    { app: "xBill", n: 3, hue: "#8f7cf5", src: null },
    { app: "The Shady Spade", n: 1, hue: "#c9a23f", src: null },
    { app: "The Shady Spade", n: 2, hue: "#c9a23f", src: null },
    { app: "The Shady Spade", n: 3, hue: "#c9a23f", src: null },
  ];

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const A = window.anime;
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const smooth = (t) => t * t * (3 - 2 * t);
  const band = (s, a, b) => smooth(clamp01((s - a) / (b - a)));
  const lerp = (a, b, t) => a + (b - a) * t;

  // ---- Renderer ------------------------------------------------------------
  const canvas = document.getElementById("gl");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 5.4);

  const CW = 0.66, CH = CW * 1670 / 768;

  // ---- A placeholder card, drawn once ------------------------------------
  function cardCanvas(card) {
    const c = document.createElement("canvas");
    c.width = 768; c.height = 1670;
    const g = c.getContext("2d");
    const R = 64;
    g.beginPath(); g.roundRect(0, 0, 768, 1670, R); g.clip();
    const bg = g.createLinearGradient(0, 0, 0, 1670);
    bg.addColorStop(0, "#1b1b21"); bg.addColorStop(1, "#101014");
    g.fillStyle = bg; g.fillRect(0, 0, 768, 1670);
    // A faint drafting grid: the card reads as a slot waiting for a screen.
    g.strokeStyle = "rgba(244,243,239,0.05)"; g.lineWidth = 2;
    for (let x = 64; x < 768; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 1670); g.stroke(); }
    for (let y = 64; y < 1670; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(768, y); g.stroke(); }
    const glow = g.createRadialGradient(384, 0, 0, 384, 0, 900);
    glow.addColorStop(0, card.hue + "55"); glow.addColorStop(1, card.hue + "00");
    g.fillStyle = glow; g.fillRect(0, 0, 768, 1670);
    g.fillStyle = "rgba(244,243,239,0.55)";
    g.font = "600 34px ui-monospace, Menlo, monospace";
    g.fillText(card.app.toUpperCase(), 64, 140);
    g.fillStyle = card.hue;
    g.font = "800 300px Inter, -apple-system, sans-serif";
    g.fillText(String(card.n).padStart(2, "0"), 52, 930);
    g.fillStyle = "rgba(244,243,239,0.75)";
    g.font = "600 44px Inter, -apple-system, sans-serif";
    g.fillText("Screen", 64, 1010);
    g.fillStyle = "rgba(244,243,239,0.4)";
    g.font = "500 30px ui-monospace, Menlo, monospace";
    g.fillText("PLACEHOLDER · 768 × 1670", 64, 1580);
    g.strokeStyle = card.hue + "aa"; g.lineWidth = 6;
    g.beginPath(); g.roundRect(3, 3, 762, 1664, R - 2); g.stroke();
    return c;
  }

  function cardTexture(card) {
    const t = new THREE.CanvasTexture(cardCanvas(card));
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    if (card.src) {
      // A real screen replaces the placeholder, clipped to the same corners.
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas"); c.width = 768; c.height = 1670;
        const g = c.getContext("2d"); g.beginPath(); g.roundRect(0, 0, 768, 1670, 64); g.clip();
        g.drawImage(img, 0, 0, 768, 1670);
        t.image = c; t.needsUpdate = true;
      };
      img.src = card.src;
    }
    return t;
  }

  const lineMat = new THREE.LineBasicMaterial({ color: 0x26262b, transparent: true, opacity: 0 });
  const cards = CARDS.map((card) => {
    const mat = new THREE.MeshBasicMaterial({ map: cardTexture(card), transparent: true, toneMapped: false, depthWrite: false, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(CW, CH), mat);
    const outline = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), lineMat);
    outline.visible = false;  // opacity 0 alone still drew hard outlines
    mesh.add(outline);
    mesh.userData = { mat, outline };
    scene.add(mesh);
    return mesh;
  });
  // Inter may arrive after the first draw; redraw the placeholders once it has.
  document.fonts?.ready.then(() => cards.forEach((m, i) => {
    if (!CARDS[i].src) { m.userData.mat.map.image = cardCanvas(CARDS[i]); m.userData.mat.map.needsUpdate = true; }
  }));

  // ---- Poses: each a pure function of where the story is -----------------
  // A pose is [x, y, z, rx, ry, rz, scale, opacity].
  const N = CARDS.length, mid = (N - 1) / 2;
  let mobile = false;

  const deck = (i) => [0.02 * (i - mid), -0.012 * (i - mid), -0.05 * i, 0.32, -0.55, 0.04, 1, 1];
  const fan = (i, spread = 1) => {
    const a = (i - mid) * 0.17 * spread, r = 2.2;
    return [Math.sin(a) * r, Math.cos(a) * r - r + 0.05, -Math.abs(i - mid) * 0.08, 0.12, -0.18, -a, 0.92, 1];
  };
  // A carousel around a continuous focus F: the card at F faces you, the rest
  // step back and turn away the further they are from it.
  const carousel = (i, F) => {
    const d = i - F, ad = Math.min(Math.abs(d), 3);
    const step = mobile ? 0.48 : 0.82;
    return [
      Math.sign(d) * Math.min(ad, 2.2) * step * (1 - ad * 0.08),
      0,
      0.75 - ad * 0.55,
      0.04,
      -Math.max(-1.4, Math.min(1.4, d)) * 0.55,
      0,
      1.12 - Math.min(ad, 1) * 0.3,
      1 - clamp01(ad - 1.6) * 0.8,
    ];
  };
  // Shifted left on wide screens: spread to the right it ran off the edge.
  const paper = (i) => [(i - mid) * 0.34 - (mobile ? 0 : 0.6), -(i - mid) * 0.05, (i - mid) * 0.5, 0.5, -0.85, -0.05, 0.92, 1];
  const mix = (a, b, t) => a.map((v, k) => lerp(v, b[k], t));

  /** Focus with a hold on each card, so each one rests before the next comes. */
  function holdAt(u, count) {
    const x = clamp01(u) * (count - 1);
    const k = Math.min(count - 2, Math.floor(x));
    return k + smooth(clamp01((x - k - 0.25) / 0.5));
  }
  function focus(s) {
    if (s < 1.95) return holdAt((s - 1.1) / 0.8, 3);          // xBill: 0 → 2
    if (s < 2.15) return lerp(2, 3, band(s, 1.95, 2.15));     // hand over
    return 3 + holdAt((s - 2.15) / 0.7, 3);                   // Shady Spade: 3 → 5
  }

  function poseFor(i, s) {
    let p = mix(deck(i), fan(i), band(s, 0.15, 0.85));
    p = mix(p, carousel(i, focus(s)), band(s, 0.9, 1.15));
    p = mix(p, paper(i), band(s, 2.95, 3.35));
    p = mix(p, fan(i, 0.8), band(s, 3.7, 4.2));
    return p;
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
  let view = { w: 1, h: 1 };
  function fit() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    view = { w, h };
    mobile = w <= 760;
    const r = Math.min(mobile ? w * 0.4 : h * 0.42, 380);
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
    const half = innerHeight / 2;
    for (let i = 0; i < sections.length; i++) {
      const r = sections[i].getBoundingClientRect();
      if (r.bottom > half || i === sections.length - 1) {
        const travel = Math.max(1, r.height - innerHeight);
        return i + clamp01(-r.top / travel);
      }
    }
    return 0;
  }

  // ---- The loop ------------------------------------------------------------
  // The scene follows the scroll rather than snapping to it: `shown` eases
  // toward the scroll position, settling over about half a second, so a
  // thumb flick becomes a glide instead of a jump.
  const anchor = new THREE.Vector3();
  let shown = progress(), last = performance.now(), current = -1;
  function frame(now) {
    const target = progress();
    const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
    last = now;
    shown = reduced ? target : shown + (target - shown) * (1 - Math.exp(-dt * 5.5));
    if (Math.abs(target - shown) < 0.0004) shown = target;

    const idx = Math.min(sections.length - 1, Math.floor(target));
    if (idx !== current) {
      current = idx;
      document.body.classList.toggle("light", sections[idx].dataset.theme === "light");
      document.getElementById("chapter").textContent = `0${idx + 1} / 0${sections.length}`;
      arrive(idx);
    }

    const t = reduced ? 0 : now / 1000;
    const drawn = band(shown, 2.95, 3.35) * (1 - band(shown, 3.7, 4.2));
    const baseX = mobile ? 0 : camera.aspect * 0.62;
    const baseY = mobile ? -0.62 : 0;
    const k = mobile ? 0.66 : 1;
    cards.forEach((m, i) => {
      const [x, y, z, rx, ry, rz, sc, op] = poseFor(i, shown);
      const breathe = reduced ? 0 : Math.sin(t * 0.7 + i * 0.9) * 0.012;
      m.position.set(baseX + x * k, baseY + (y + breathe) * k, z * k);
      m.rotation.set(rx, ry, rz);
      m.scale.setScalar(sc * k);
      m.renderOrder = Math.round(z * 100);
      m.userData.mat.opacity = op * (1 - drawn * 0.85);
      m.userData.outline.visible = drawn > 0.005;
    });
    lineMat.opacity = drawn * 0.9;

    anchor.set(baseX, baseY, 0).project(camera);
    dial.style.transform = `translate(${(anchor.x * 0.5 + 0.5) * view.w}px, ${(-anchor.y * 0.5 + 0.5) * view.h}px)`;
    dial.style.color = document.body.classList.contains("light") ? "#141417" : "#f4f3ef";
    const local = target - idx;
    arcs.forEach((a, i) => {
      const c = Number(a.dataset.c);
      const fill = i === Math.min(idx, 3) ? 0.12 + local * 0.13 : i < Math.min(idx, 3) ? 0.25 : 0.04;
      a.setAttribute("stroke-dashoffset", String(c * (1 - fill)));
    });
    const on = Math.round((target / sections.length) * (rulerTicks.length - 1));
    rulerTicks.forEach((el, i) => el.classList.toggle("on", i === on));

    renderer.render(scene, camera);
    if (!reduced) requestAnimationFrame(frame);
  }
  if (reduced) {
    addEventListener("scroll", () => requestAnimationFrame(frame), { passive: true });
    addEventListener("resize", () => requestAnimationFrame(frame), { passive: true });
  }
  requestAnimationFrame(frame);
