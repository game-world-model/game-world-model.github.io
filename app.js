(() => {
"use strict";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const RM = matchMedia("(prefers-reduced-motion: reduce)");
const reduce = () => RM.matches || new URLSearchParams(location.search).get("motion") === "reduce";
const narrowMQ = matchMedia("(max-width: 819px)");
const saveData = !!(navigator.connection && navigator.connection.saveData);
const play = v => { if (v && v.getAttribute("src") && v.paused) { const p = v.play(); if (p) p.catch(() => {}); } };
const setSrc = (v, src) => { if (v.getAttribute("src") !== src) { v.setAttribute("src", src); v.load(); } };
const seek = (v, t) => { try { v.currentTime = t; } catch (e) { /* metadata not ready */ } };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const raf2 = fn => requestAnimationFrame(() => requestAnimationFrame(fn));
const capture = (node, id) => { try { node.setPointerCapture(id); } catch (e) { /* pointer already released */ } };
const PDF = "https://arxiv.org/abs/2611.19247";
const CLIP = 5.167;

const CH = {
  fire:    { name: "Fire mage",        cast: "Black flame",           ranged: "fireball",    melee: "flaming fist",     r: "h3" },
  ice:     { name: "Ice mage",         cast: "Ice arrow rain",        ranged: "ice shard",   melee: "frost staff",      r: "h3" },
  rifle:   { name: "Rifle soldier",    cast: "Tactical rifle",        ranged: "rifle burst", melee: "rifle butt",       r: "h3" },
  dart:    { name: "Dart fighter",     cast: "Red-lightning saber",   ranged: "steel darts", melee: "palm strike",      r: "h3" },
  vampire: { name: "Vampire",          cast: "Moon blades",           ranged: "blood bolt",  melee: "blood claws",      r: "seedance" },
  thunder: { name: "Thunder warrior",  cast: "Violet thunder hammer", ranged: "lightning",   melee: "lightning hammer", r: "h3" },
  forest:  { name: "Forest druid",     cast: "Vine thrust",           ranged: "thorn bolt",  melee: "thorn staff",      r: "h3" },
  arcane:  { name: "Arcane sorceress", cast: "Stone spell",           ranged: "arcane bolt", melee: "arcane palm",      r: "h3" },
};
const KEYS = Object.keys(CH);
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
// The vampire's signature clip comes from Seedance, a third-party model: never label it GameWM output.
const RENDER = {
  h3: { kicker: "Generated from the proxy · GameWM-H3-33B", tag: "GameWM", note: "Rendered by GameWM-H3-33B from its own proxy (inset)." },
  seedance: { kicker: "Reference render · Seedance (third-party)", tag: "Seedance · third-party", note: "Rendered by Seedance, a third-party model, not GameWM." },
};

// Keep one or more follower videos on the leader's clock.
function follow(lead, followers, threshold = 0.18) {
  let last = 0;
  const tick = () => {
    const t = lead.currentTime;
    const looped = t + 0.5 < last;
    followers.forEach(v => {
      if (!v.getAttribute("src") || v.readyState < 1) return;
      if (looped) seek(v, t);
      else if (!v.paused && Math.abs(v.currentTime - t) > threshold && t < (v.duration || Infinity)) seek(v, t);
    });
    last = t;
  };
  lead.addEventListener("timeupdate", tick);
  lead.addEventListener("seeked", () => followers.forEach(v => seek(v, lead.currentTime)));
  lead.addEventListener("play", () => followers.forEach(play));
  lead.addEventListener("pause", () => followers.forEach(v => v.pause()));
}

// Lazy-loaded, visibility-played group of videos sharing one clock.
function group(container, leadSel) {
  const vids = $$("video", container);
  if (!vids.length) return null;
  const lead = (leadSel && $(leadSel, container)) || vids[0];
  let loaded = false;
  const load = () => { if (loaded) return; loaded = true; vids.forEach(v => { if (v.dataset.src && !v.getAttribute("src")) v.setAttribute("src", v.dataset.src); }); };
  new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) load(); }), { rootMargin: "700px 0px" }).observe(container);
  new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { load(); vids.forEach(play); } else vids.forEach(v => v.pause());
  }), { threshold: 0.12 }).observe(container);
  follow(lead, vids.filter(v => v !== lead));
  return { vids, lead, load };
}

/* ================= nav ================= */
(() => {
  const nav = $("#nav"), bar = $("#nav-progress"), cover = $("#cover"), menu = $("#nav-menu"), links = $("#nav-links");
  const anchors = $$("a", links);
  const secs = anchors.map(a => $(a.getAttribute("href"))).filter(Boolean);
  let ticking = false;
  function paint() {
    ticking = false;
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle("solid", y > cover.offsetHeight - nav.offsetHeight - 8);
    bar.style.setProperty("--p", h > 0 ? (y / h).toFixed(4) : 0);
    const probe = y + innerHeight * 0.32;
    let cur = null;
    secs.forEach(s => { if (s.offsetTop <= probe) cur = s; });
    anchors.forEach(a => a.classList.toggle("on", !!cur && a.getAttribute("href") === "#" + cur.id));
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }, { passive: true });
  addEventListener("resize", paint);
  menu.addEventListener("click", () => { const open = links.classList.toggle("open"); menu.setAttribute("aria-expanded", String(open)); });
  anchors.forEach(a => a.addEventListener("click", () => { links.classList.remove("open"); menu.setAttribute("aria-expanded", "false"); }));
  paint();
})();

/* ================= reveal ================= */
(() => {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
  $$("[data-reveal]").forEach(n => io.observe(n));
})();

/* ================= 00 · cover ================= */
// Figure 1 strips → zoom into the chosen character → play its skill (ported from the original opening).
(() => {
  const root = $("#cover");
  if (!root) return;
  const stage = $(".cover-stage", root), canvas = $(".cover-canvas", root);
  const strips = $$(".strip", root), player = $(".cover-player", root), panel = $(".cover-panel", root);
  const video = $(".cover-video", root), proxy = $(".cover-proxy", root);
  const rail = $$("[data-pick]", root), sheet = $("[data-sheet]", root), status = $("[data-status]", root);
  const kicker = $("[data-kicker]", root), note = $("[data-note]", root);
  const state = { k: "fire", timers: [] };
  const later = (fn, ms) => state.timers.push(setTimeout(fn, ms));
  const clearTimers = () => { state.timers.forEach(clearTimeout); state.timers = []; };
  follow(video, [proxy]);

  function stripPolygon(strip) {
    const raw = getComputedStyle(strip).getPropertyValue("--poly");
    return [...raw.matchAll(/([\d.]+)%\s+([\d.]+)%/g)].map(m => [Number(m[1]) / 100, Number(m[2]) / 100]);
  }
  function zoomGeometry(strip) {
    // Measured without reading transforms, so an in-flight zoom never skews the maths.
    const narrow = narrowMQ.matches;
    const width = canvas.offsetWidth, height = canvas.offsetHeight;
    const box = { left: canvas.offsetLeft - (narrow ? 0 : width / 2), top: canvas.offsetTop - (narrow ? 0 : height / 2), width, height };
    const points = stripPolygon(strip);
    const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
    const scale = narrow ? 2.1 : 2.4;
    const origin = [cx * box.width, box.height / 2];
    const viewW = stage.clientWidth, viewH = narrow ? box.height : stage.clientHeight;
    const target = [viewW / 2 - box.left, viewH / 2 - box.top];
    const shift = [target[0] - origin[0], target[1] - origin[1]];
    const project = ([x, y]) => {
      const local = [x * box.width, y * box.height];
      return [origin[0] + shift[0] + scale * (local[0] - origin[0]) + box.left, origin[1] + shift[1] + scale * (local[1] - origin[1]) + box.top];
    };
    return { origin, shift, scale, polygon: points.map(project) };
  }
  const polygonCss = pts => "polygon(" + pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(",") + ")";
  const fullPolygon = () => polygonCss([[0, 0], [player.clientWidth, 0], [player.clientWidth, player.clientHeight], [0, player.clientHeight]]);

  function labels(announce) {
    const c = CH[state.k], r = RENDER[c.r];
    $("[data-name]", root).textContent = c.name;
    $("[data-skill]", root).textContent = c.cast;
    kicker.textContent = r.kicker;
    note.textContent = r.note;
    sheet.src = `a/img/sheet-${state.k}.jpg`;
    sheet.alt = `${c.name} identity sheet`;
    rail.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.pick === state.k)));
    strips.forEach(s => s.classList.toggle("is-selected", s.dataset.k === state.k));
    video.setAttribute("aria-label", `${c.name}: ${c.cast}`);
    if (announce) status.textContent = `Playing ${c.name}: ${c.cast}.`;
  }
  function loadClip() {
    setSrc(video, `a/video/teaser-effect-${state.k}.mp4`);
    setSrc(proxy, `a/video/teaser-capsule-${state.k}.mp4`);
    video.poster = `a/video/teaser-effect-${state.k}.jpg`;
    proxy.poster = `a/video/teaser-capsule-${state.k}.jpg`;
    seek(video, 0); seek(proxy, 0);
    const start = () => { if (root.dataset.state === "zoom" || root.dataset.state === "playing") play(video); };
    if (video.readyState >= 3) start(); else video.addEventListener("canplay", start, { once: true });
  }
  function prefetch(k) {
    const href = `a/video/teaser-effect-${k}.mp4`;
    if (document.head.querySelector(`link[href="${href}"]`)) return;
    const l = document.createElement("link"); l.rel = "prefetch"; l.href = href; document.head.append(l);
  }

  // Hover only brings the strip into focus and names it; nothing plays until the click.
  const entries = strips.map(strip => ({ strip, v: $(".strip-video", strip) }));
  const pv = { timer: 0, active: null };
  let hovering = false, inView = true, sweepT = 0;
  function collapseStrips() {
    canvas.classList.remove("is-expanding");
    strips.forEach(s => s.classList.remove("is-pushed-left", "is-pushed-right"));
  }
  function expandAround(entry) {
    if (reduce() || narrowMQ.matches) return;
    const i = strips.indexOf(entry.strip);
    canvas.classList.add("is-expanding");
    strips.forEach((s, j) => {
      s.classList.toggle("is-pushed-left", j < i);
      s.classList.toggle("is-pushed-right", j > i);
    });
  }
  const frame = $("#cover-frame"), framePoly = frame && $("polygon", frame);
  function stopPreview() {
    clearTimeout(pv.timer);
    if (!pv.active) return;
    pv.active.strip.classList.remove("is-previewing");
    pv.active = null;
    if (frame) frame.classList.remove("on");
    collapseStrips();
  }
  function startPreview(entry) {
    if (root.dataset.state !== "overview" || reduce()) return;
    if (pv.active && pv.active !== entry) pv.active.strip.classList.remove("is-previewing");
    pv.active = entry;
    entry.strip.classList.add("is-previewing");
    if (!frame) return;
    framePoly.setAttribute("points", stripPolygon(entry.strip).map(([x, y]) => `${(x * 100).toFixed(3)},${(y * 100).toFixed(3)}`).join(" "));
    frame.classList.add("on");
  }
  function arm(entry) {
    if (root.dataset.state !== "overview") return;
    stopSweep();
    if (reduce()) return;
    clearTimeout(pv.timer);
    pv.timer = setTimeout(() => startPreview(entry), 120);
  }
  // The resting cover is a blurred backdrop: no unattended motion, the clip plays on click.
  function stopSweep() { clearTimeout(sweepT); }
  function scheduleSweep() {}

  function open(k, focusRail) {
    clearTimers(); stopSweep(); stopPreview();
    state.k = k;
    const strip = strips.find(s => s.dataset.k === k);
    labels(true);
    loadClip();
    player.setAttribute("aria-hidden", "false");
    panel.setAttribute("aria-hidden", "false");
    if (reduce()) {
      root.style.setProperty("--player-clip", "inset(0)");
      root.dataset.state = "playing";
    } else {
      const g = zoomGeometry(strip);
      root.style.setProperty("--player-clip", polygonCss(g.polygon));
      canvas.style.transformOrigin = `${g.origin[0]}px ${g.origin[1]}px`;
      void player.offsetWidth;
      root.dataset.state = "zoom";
      canvas.style.transform = `translate(${g.shift[0]}px, ${g.shift[1]}px) scale(${g.scale})`;
      requestAnimationFrame(() => root.style.setProperty("--player-clip", fullPolygon()));
      later(() => { root.dataset.state = "playing"; root.style.setProperty("--player-clip", "inset(0)"); }, 1050);
    }
    later(() => {
      const t = focusRail ? rail.find(b => b.dataset.pick === k) : $(".cover-zoomout", root);
      if (t) t.focus({ preventScroll: true });
    }, reduce() ? 0 : 1100);
  }
  function switchTo(k) {
    if (k === state.k) return;
    state.k = k;
    root.classList.add("is-switching");
    setTimeout(() => { labels(true); loadClip(); requestAnimationFrame(() => root.classList.remove("is-switching")); }, reduce() ? 0 : 150);
  }
  function close() {
    if (root.dataset.state === "overview" || root.dataset.state === "leaving") return;
    clearTimers();
    const strip = strips.find(s => s.dataset.k === state.k);
    panel.setAttribute("aria-hidden", "true");
    if (reduce()) {
      root.dataset.state = "overview";
      video.pause();
    } else {
      root.style.setProperty("--player-clip", fullPolygon());
      const g = zoomGeometry(strip);
      canvas.style.transformOrigin = `${g.origin[0]}px ${g.origin[1]}px`;
      canvas.style.transform = `translate(${g.shift[0]}px, ${g.shift[1]}px) scale(${g.scale})`;
      void player.offsetWidth;
      root.dataset.state = "leaving";
      requestAnimationFrame(() => { root.style.setProperty("--player-clip", polygonCss(g.polygon)); canvas.style.transform = "none"; });
      later(() => { root.dataset.state = "overview"; video.pause(); }, 700);
    }
    player.setAttribute("aria-hidden", "true");
    later(() => strip.focus({ preventScroll: true }), reduce() ? 0 : 720);
  }

  entries.forEach(entry => {
    const { strip } = entry;
    strip.addEventListener("click", () => { if (root.dataset.state === "overview") open(strip.dataset.k); });
    strip.addEventListener("pointerenter", e => { prefetch(strip.dataset.k); if (e.pointerType === "touch") return; arm(entry); });
    strip.addEventListener("pointerleave", () => { clearTimeout(pv.timer); if (root.dataset.state === "overview") stopPreview(); });
    strip.addEventListener("focus", () => { prefetch(strip.dataset.k); arm(entry); });
    strip.addEventListener("blur", () => { clearTimeout(pv.timer); stopPreview(); });
  });
  canvas.addEventListener("pointerenter", e => { if (e.pointerType === "touch") return; hovering = true; stopSweep(); });
  canvas.addEventListener("pointerleave", e => { if (e.pointerType === "touch") return; hovering = false; });
  rail.forEach((b, i) => {
    b.addEventListener("click", () => switchTo(b.dataset.pick));
    b.addEventListener("keydown", e => {
      const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      const next = rail[(i + step + rail.length) % rail.length];
      next.focus(); switchTo(next.dataset.pick);
    });
  });
  // Each clip plays once, then the rail advances; the run holds on the last frame after the eighth.
  const order = rail.map(b => b.dataset.pick);
  video.addEventListener("ended", () => {
    if (root.dataset.state !== "playing") return;
    const next = order[order.indexOf(state.k) + 1];
    if (next) switchTo(next); else proxy.pause();
  });
  $("[data-replay]", root).addEventListener("click", () => { seek(video, 0); seek(proxy, 0); play(video); });
  $$("[data-back]", root).forEach(b => b.addEventListener("click", close));
  player.addEventListener("click", () => { if (root.dataset.state === "playing") close(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && root.dataset.state === "playing") close(); });
  new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    if (!inView) { video.pause(); stopSweep(); stopPreview(); }
    else if (root.dataset.state === "playing" && !video.ended) play(video);
  }, { threshold: 0.15 }).observe(root);
  addEventListener("resize", () => { if (root.dataset.state === "playing") root.style.setProperty("--player-clip", "inset(0)"); });
  root.classList.toggle("reduced", reduce());
  labels(false);
  raf2(() => root.classList.add("is-entered"));
})();

/* ================= 01 · overview reel: 3D glass frames ================= */
// Each slide plays its lead video `data-loops` times, then hands over; `data-own` slides drive their own media.
(() => {
  const reel = $("#reel");
  if (!reel) return;
  const stage = $(".reel-stage", reel), slides = $$(".reel-slide", stage), n = slides.length;
  const dotsBox = $(".reel-dots", reel), count = $(".reel-count", reel);
  if (n < 2) $(".reel-controls", reel).hidden = true;
  const pad = i => String(i).padStart(2, "0");
  const lead = s => $("video[data-lead]", s) || $("video", s);
  const own = s => s.hasAttribute("data-own");
  let cur = 0, vis = false, hold = false, pending = false, wraps = 0, last = 0, ticking = false, since = 0;
  $$("video", stage).forEach(v => { v.loop = true; });
  const dots = slides.map((s, i) => {
    const b = el("button", "", "<i></i>");
    b.type = "button";
    b.setAttribute("aria-label", `Film ${i + 1}`);
    b.addEventListener("click", () => go(i));
    dotsBox.appendChild(b);
    return b;
  });
  function place() {
    slides.forEach((s, i) => {
      let off = (i - cur + n) % n;
      if (off > n / 2) off -= n;
      const was = s.dataset.off == null ? off : +s.dataset.off;
      const cls = off === 0 ? "is-active" : off === -1 ? "is-prev" : off === 1 ? "is-next" : "";
      if (cls && Math.abs(off - was) > 1) s.classList.add("is-warp");
      s.classList.remove("is-active", "is-prev", "is-next", "tilting");
      if (cls) s.classList.add(cls);
      s.dataset.off = off;
      s.setAttribute("aria-hidden", String(off !== 0));
      $$("video", s).forEach(v => { v.tabIndex = -1; });
    });
    raf2(() => $$(".is-warp", stage).forEach(s => s.classList.remove("is-warp")));
    dots.forEach((d, i) => { if (i === cur) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current"); d.style.setProperty("--p", i < cur ? 1 : 0); });
    count.textContent = `${pad(cur + 1)} / ${pad(n)}`;
  }
  function enter(fresh) {
    const s = slides[cur];
    wraps = 0; last = 0; pending = false; since = performance.now();
    if (own(s)) { s.dispatchEvent(new CustomEvent("reel:enter", { detail: { fresh } })); }
    else {
      $$("video[data-src]", s).forEach(v => { if (!v.getAttribute("src")) v.setAttribute("src", v.dataset.src); });
      if (fresh) $$("video", s).forEach(v => seek(v, 0));
      $$("video", s).forEach(play);
    }
    if (!ticking) { ticking = true; requestAnimationFrame(tick); }
  }
  function setSound(s, on) {
    const b = $("[data-sound]", s), v = lead(s);
    if (!b || !v) return;
    v.muted = !on;
    b.setAttribute("aria-pressed", String(on));
    b.textContent = on ? "Sound off" : "Sound on";
  }
  function leave(s) {
    setSound(s, false);
    if (own(s)) s.dispatchEvent(new CustomEvent("reel:leave"));
    else $$("video", s).forEach(v => v.pause());
  }
  $$("[data-sound]", stage).forEach(b => b.addEventListener("click", e => {
    e.stopPropagation();
    const s = b.closest(".reel-slide");
    setSound(s, b.getAttribute("aria-pressed") !== "true");
    play(lead(s));
  }));
  $$("[data-full]", stage).forEach(b => b.addEventListener("click", e => {
    e.stopPropagation();
    const v = lead(b.closest(".reel-slide"));
    if (v.requestFullscreen) v.requestFullscreen().catch(() => {});
    else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
  }));
  function go(i) {
    i = (i + n) % n;
    if (i === cur) return;
    leave(slides[cur]);
    cur = i;
    place();
    if (vis) enter(true);
  }
  function tick() {
    if (!vis) { ticking = false; return; }
    const s = slides[cur], v = lead(s), loops = +(s.dataset.loops || 1);
    let p = -1;
    if (v && v.duration && v.readyState >= 1) {
      const t = v.currentTime;
      if (t + 0.5 < last) wraps++;
      last = t;
      p = (wraps + t / v.duration) / loops;
    } else if (!v) p = (performance.now() - since) / +(s.dataset.dwell || 6000);
    if (p >= 0) {
      dots[cur].style.setProperty("--p", Math.min(1, p).toFixed(4));
      if (p >= 1 && !reduce()) {
        if (hold) pending = true;
        else go(cur + 1);
      }
    }
    requestAnimationFrame(tick);
  }
  $("[data-reel-prev]", reel).addEventListener("click", () => go(cur - 1));
  $("[data-reel-next]", reel).addEventListener("click", () => go(cur + 1));
  reel.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") { e.preventDefault(); go(cur - 1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); go(cur + 1); }
  });
  let downX = null, swiped = false;
  stage.addEventListener("pointerdown", e => { downX = e.clientX; swiped = false; });
  stage.addEventListener("pointerup", e => {
    if (downX == null) return;
    const dx = e.clientX - downX;
    downX = null;
    if (Math.abs(dx) > 48) { swiped = true; go(cur + (dx < 0 ? 1 : -1)); }
  });
  slides.forEach((s, i) => {
    s.addEventListener("click", () => { if (!swiped && i !== cur) go(i); });
    const glass = $(".glass", s);
    s.addEventListener("pointerenter", () => { if (i === cur) hold = true; });
    s.addEventListener("pointermove", e => {
      if (i !== cur || e.pointerType !== "mouse" || reduce()) return;
      const r = glass.getBoundingClientRect();
      const x = clamp((e.clientX - r.left) / r.width, 0, 1), y = clamp((e.clientY - r.top) / r.height, 0, 1);
      s.classList.add("tilting");
      s.style.setProperty("--ry", ((x - 0.5) * 7).toFixed(2) + "deg");
      s.style.setProperty("--rx", ((0.5 - y) * 5).toFixed(2) + "deg");
      glass.style.setProperty("--gx", (8 + x * 44).toFixed(1) + "%");
    });
    s.addEventListener("pointerleave", () => {
      s.classList.remove("tilting");
      s.style.removeProperty("--ry"); s.style.removeProperty("--rx"); glass.style.removeProperty("--gx");
      if (i !== cur) return;
      hold = false;
      if (pending) go(cur + 1);
    });
  });
  place();
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting === vis) return;
    vis = e.isIntersecting;
    if (vis) enter(false); else leave(slides[cur]);
  }, { threshold: 0.3 }).observe(stage);
})();

/* ================= numbers: count up once ================= */
(() => {
  const nums = $$("[data-count]");
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    const n = e.target, to = Number(n.dataset.count), dec = Number(n.dataset.dec || 0);
    if (reduce()) { n.textContent = to.toFixed(dec); return; }
    const t0 = performance.now(), dur = 1300;
    const step = now => {
      const p = clamp((now - t0) / dur, 0, 1), k = 1 - Math.pow(1 - p, 3);
      n.textContent = (to * k).toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }), { threshold: 0.6 });
  nums.forEach(n => io.observe(n));
})();

/* ================= 02 · studio: swap the hero, swap the magic ================= */
(() => {
  const root = $("#idea");
  if (!root) return;
  const tabs = $$("#c-tab button"), modeBar = $("#c-mode"), picker = $("#c-picker"), pickLabel = $("#c-picklabel");
  const slotProxy = $("#c-proxy"), refSlot = $("#c-ref"), sheetImg = $("#c-sheet"), refText = $("#c-reftext"), refCap = $("#c-refcap");
  const promptEl = $("#c-prompt"), gen = $("#c-gen"), genLabel = $("#c-gen-label"), statusEl = $("#c-status"), stext = $("#c-stext"), sbar = $("#c-bar");
  const metaEl = $("#c-meta"), modelEl = $("#c-model"), dotsEl = $("#c-dots"), vtext = $("#c-vtext");
  const flow = $("#flow"), cards = $("#flow-cards"), live = $("#live"), lp = $("#live-proxy"), lo = $("#live-out");
  const lhK = $("#lh-k"), lhStep = $("#lh-step"), lhN = $("#lh-n"), lKick = $("#live-kicker"), lName = $("#live-name"), lSkill = $("#live-skill"), lTag = $("#live-gtag");
  const timeEl = $("#c-time"), track = $("#ct-track"), head = $("#ct-head"), links = $("#ct-links"), framesEl = $("#ct-frames"), notes = $("#c-notes");

  const MODES = { chars: [["signature", "Ranged"], ["melee", "Melee"]], magic: [["spells", "Spells"], ["weapons", "Weapons"]] };
  const SPELLS = [["ancient-sigil", "Ancient sigil"], ["frost-lance", "Frost lance"], ["gravity-collapse", "Gravity collapse"], ["star-comet", "Star comet"], ["seal-chains", "Seal chains"]];
  const WEAPONS = [["moonfrost", "Moonfrost greatsword"], ["starblade", "Starblade"], ["thunder-hammer", "Thunder hammer"], ["molten-axe", "Molten axe"], ["ghost-dual", "Ghostflame twin blades"]];
  // Event times and caption templates as printed in Figure 9.
  const EV = {
    ranged: { ticks: [[3.5, "Shot"], [4.0, "Down"]], frames: [[0, "Start"], [2.75, "Approach"], [3.5, "Shot"], [4.0, "Down"]], ev: [2, 3] },
    melee: { ticks: [[2.42, "Strike"], [3.25, "Down"]], frames: [[0, "Start"], [2.42, "Strike"], [2.75, "After strike"], [3.25, "Down"]], ev: [1, 3] },
  };
  // Hit and down times read off each signature clip (24 fps); the keyframe before the hit is the cast.
  const SIG = { fire: [2.5, 5.0], ice: [2.0, 4.5], rifle: [3.0, 5.0], dart: [2.9, 6.0], vampire: [2.5, 4.5], thunder: [3.8, 5.0], forest: [3.0, 5.5], arcane: [3.5, 5.5] };
  const sigEv = k => { const [hit, down] = SIG[k]; return { ticks: [[hit, "Hit"], [down, "Down"]], frames: [[0, "Start"], [+(hit - 0.8).toFixed(1), "Cast"], [hit, "Hit"], [down, "Down"]], ev: [2, 3] }; };
  const TPL = {
    ranged: s => `Hero turns and casts <mark>⟨${s}⟩</mark>; the opponent falls.`,
    melee: s => `Hero steps in with <mark>⟨${s}⟩</mark>; the opponent falls.`,
  };
  const NOTE_RESULTS = `<p>Unseen skills, never in the training data.</p>`;
  const NOTE_STORED = "";
  const S = { tab: "chars", mode: "signature", i: KEYS.indexOf("ice"), phase: "idle", timer: 0, list: [], seen: new Set(), vis: false, first: true, drag: null };

  function items() {
    if (S.tab === "chars") {
      const m = S.mode;
      return KEYS.map((k, n) => {
        const c = CH[k];
        if (m === "signature") {
          const r = RENDER[c.r], e = sigEv(k);
          return { id: k, n, label: c.name, skill: c.cast, thumb: `a/img/concept-${k}.jpg`, card: `a/thumbs/teaser-effect-${k}.jpg`,
            out: `a/video/teaser-effect-${k}.mp4`, poster: `a/video/teaser-effect-${k}.jpg`,
            proxy: `a/video/teaser-capsule-${k}.mp4`, proxyPoster: `a/video/teaser-capsule-${k}.jpg`,
            ref: `a/img/sheet-${k}.jpg`, refCap: "Identity sheet",
            prompt: `Hero unleashes <mark>⟨${c.cast.toLowerCase()}⟩</mark>; the opponent falls.`,
            model: c.r === "seedance" ? "Seedance" : "GameWM-H3", meta: c.r === "seedance" ? "Reference render · third-party" : "Ranged · GameWM-H3-33B",
            kicker: r.kicker, tag: r.tag, frameTag: c.r === "seedance" ? "Seedance" : "GameWM", steps: 0, notes: `<p>${r.note}</p>${NOTE_STORED}`, seenKey: `${k}:${m}`,
            ev: e, dur: 6.7, frames: e.frames.map(([t, l], i) => ({ t, l, ev: e.ev.includes(i), p: `a/frames/proxy-signature-${k}-${i}.jpg`, o: `a/frames/${k}-signature-${i}.jpg` })) };
        }
        const e = EV[m];
        return { id: k, n, label: c.name, skill: cap(c[m]), thumb: `a/img/concept-${k}.jpg`, card: `a/frames/${k}-${m}-${e.ev[0]}.jpg`,
          out: `a/video/attack-${m}-${k}.mp4`, poster: `a/video/attack-${m}-${k}.jpg`,
          proxy: `a/video/proxy-${m}.mp4`, proxyPoster: `a/video/proxy-${m}.jpg`,
          ref: `a/img/sheet-${k}.jpg`, refCap: "Identity sheet", prompt: TPL[m](c[m]),
          model: "BD-Sheet", meta: "BD-Sheet · 30 steps", kicker: "Generated from the proxy · BD-Sheet", tag: "GameWM", steps: 30,
          notes: NOTE_RESULTS + NOTE_STORED, seenKey: `${k}:${m}`,
          ev: e, frames: e.frames.map(([t, l], i) => ({ t, l, ev: e.ev.includes(i), p: `a/frames/proxy-${m}-${i}.jpg`, o: `a/frames/${k}-${m}-${i}.jpg` })) };
      });
    }
    const g = S.mode === "spells" ? "magic" : "melee";
    const set = S.mode === "spells" ? SPELLS : WEAPONS;
    return set.map(([slug, label], n) => ({ id: slug, n, label, skill: S.mode === "spells" ? "Ranged spell" : "Melee weapon",
      thumb: `a/thumbs/souls-${g}-${slug}.jpg`, card: `a/thumbs/souls-${g}-${slug}.jpg`, out: `a/video/souls-${g}-${slug}.mp4`, poster: `a/video/souls-${g}-${slug}.jpg`,
      proxy: `a/video/proxy-effects-${g === "melee" ? "melee" : "ranged"}.mp4`, proxyPoster: `a/video/proxy-effects-${g === "melee" ? "melee" : "ranged"}.jpg`,
      ref: null, refText: label, refCap: "Effect text",
      prompt: `Effect: <mark>⟨${label.toLowerCase()}⟩</mark>.`,
      model: "", meta: `${S.mode === "spells" ? "Ranged · 5 spells" : "Melee · 5 weapons"} · data engine`,
      kicker: "Same motion · swap only the effect", tag: "Base model · data engine", steps: 0,
      notes: "", ev: null }));
  }

  function buildMode() {
    modeBar.innerHTML = "";
    MODES[S.tab].forEach(([id, label]) => {
      const b = el("button", "", label);
      b.type = "button"; b.setAttribute("aria-pressed", String(id === S.mode));
      b.addEventListener("click", () => setMode(id));
      modeBar.appendChild(b);
    });
  }
  function buildPicker() {
    picker.className = "c-picker" + (S.tab === "magic" ? " magic" : "");
    picker.innerHTML = "";
    S.list.forEach((it, i) => {
      const b = el("button", "pk", `<img src="${it.thumb}" alt="" loading="lazy"><b>${String(i + 1).padStart(2, "0")}</b><span>${it.label}</span>`);
      b.type = "button"; b.setAttribute("aria-label", it.label);
      b.addEventListener("click", () => go(i, true));
      picker.appendChild(b);
    });
    pickLabel.textContent = S.tab === "chars" ? "Pick a hero" : (S.mode === "spells" ? "Pick a spell" : "Pick a weapon");
  }
  function buildCards() {
    cards.innerHTML = "";
    S.list.forEach((it, i) => {
      const c = el("button", "fc", `<img src="${it.card || it.poster}" alt="" loading="lazy"><span>${it.label}</span>`);
      c.type = "button"; c.tabIndex = -1; c.setAttribute("aria-label", it.label);
      c.addEventListener("click", () => { if (i !== S.i) go(i, true); });
      cards.appendChild(c);
    });
  }
  function layout() {
    const n = S.list.length;
    $$(".fc", cards).forEach((c, i) => {
      let d = i - S.i;
      if (d > n / 2) d -= n;
      if (d < -n / 2) d += n;
      const a = Math.abs(d);
      c.style.setProperty("--d", d); c.style.setProperty("--a", a);
      c.dataset.a = a;
      c.style.zIndex = 20 - a;
      c.style.opacity = a > 2 ? 0 : 1;
      c.style.pointerEvents = a > 2 || a === 0 ? "none" : "auto";
    });
    $$(".pk", picker).forEach((b, i) => b.setAttribute("aria-pressed", String(i === S.i)));
  }
  function dots() {
    const order = MODES.chars.flatMap(([m]) => KEYS.map(k => `${k}:${m}`));
    if (!dotsEl.children.length) order.forEach(() => dotsEl.appendChild(el("i")));
    order.forEach((key, i) => dotsEl.children[i].classList.toggle("on", S.seen.has(key)));
    vtext.textContent = S.seen.size >= order.length ? `All ${order.length} viewed ✓` : `${S.seen.size} / ${order.length} viewed`;
  }
  function timeline(it) {
    $$(".ct-tick", track).forEach(t => t.remove());
    framesEl.innerHTML = ""; links.innerHTML = "";
    const has = !!it.ev;
    framesEl.hidden = !has; links.style.display = has ? "" : "none";
    if (!has) return;
    it.ev.ticks.forEach(([t, l]) => { const x = el("i", "ct-tick", `<span>${l}</span>`); x.style.left = (t / (it.dur || CLIP) * 100) + "%"; track.appendChild(x); });
    it.frames.forEach(f => {
      const b = el("button", "ctf" + (f.ev ? " ev" : ""), `<p>${f.t.toFixed(2)} s<span>${f.l}</span></p><div class="ims"><img src="${f.o}" alt="${it.label} generated output at ${f.t.toFixed(2)} seconds" loading="lazy"><img src="${f.p}" alt="Proxy at ${f.t.toFixed(2)} seconds" loading="lazy"></div><small><b>${it.frameTag || "GameWM"}</b><span>hover · proxy</span></small>`);
      b.type = "button";
      b.addEventListener("click", () => jump(f.t, b));
      framesEl.appendChild(b);
    });
    requestAnimationFrame(drawLinks);
  }
  function drawLinks() {
    const it = S.list[S.i];
    if (!it || !it.ev || narrowMQ.matches) return;
    const box = timeEl.getBoundingClientRect(), w = track.getBoundingClientRect().width;
    links.setAttribute("viewBox", `0 0 ${w} 26`);
    links.innerHTML = $$(".ctf", framesEl).map((b, i) => {
      const f = it.frames[i], r = b.getBoundingClientRect();
      const x1 = f.t / (it.dur || CLIP) * w, x2 = r.left + r.width / 2 - box.left - 6;
      return `<path class="${f.ev ? "ev" : ""}" d="M${x1.toFixed(1)} 0 C${x1.toFixed(1)} 14, ${x2.toFixed(1)} 10, ${x2.toFixed(1)} 26"/>`;
    }).join("");
  }
  function jump(t, btn) {
    if (S.phase !== "done") finish(true);
    [lp, lo].forEach(v => { v.pause(); seek(v, t); });
    $$(".ctf", framesEl).forEach(b => b.classList.toggle("on", b === btn));
    statusText("done", `Paused at ${t.toFixed(2)} s · click the clip to resume`, 100);
  }
  function inputs(it) {
    setSrc(slotProxy, it.proxy); slotProxy.poster = it.proxyPoster;
    if (it.ref) { refSlot.classList.remove("text"); sheetImg.src = it.ref; sheetImg.alt = `${it.label} identity sheet`; }
    else { refSlot.classList.add("text"); refText.textContent = it.refText; sheetImg.removeAttribute("src"); }
    refCap.innerHTML = `<i class="dot gold-dot"></i>${it.refCap}`;
    promptEl.innerHTML = it.prompt;
    modelEl.textContent = it.model;
    metaEl.textContent = it.meta;
    notes.innerHTML = it.notes;
    lKick.textContent = it.kicker; lName.textContent = it.label; lSkill.textContent = it.skill; lTag.textContent = it.tag;
    lhK.textContent = it.model ? `Generating · ${it.model}` : "Generating";
    timeline(it);
    if (S.vis) play(slotProxy);
  }
  function mount(it) {
    setSrc(lp, it.proxy); lp.poster = it.proxyPoster;
    setSrc(lo, it.out); lo.poster = it.poster;
  }
  function setSplit(v) { live.style.setProperty("--split", v + "%"); }
  function statusText(s, text, pct) {
    statusEl.dataset.s = s; stext.textContent = text; sbar.style.width = pct + "%";
    genLabel.textContent = s === "running" ? "Generating…" : (s === "done" ? "Generate again" : "Generate");
    gen.classList.toggle("busy", s === "running");
  }
  function reset() {
    clearInterval(S.timer);
    S.phase = "idle"; live.dataset.phase = "idle";
    live.classList.remove("comparing", "sweep"); setSplit(106);
    lo.pause();
    statusText("idle", "Ready", 0);
    if (S.vis) play(lp);
  }
  function generate() {
    if (S.phase === "running") { finish(); return; }
    clearInterval(S.timer);
    const it = S.list[S.i];
    S.phase = "running"; live.dataset.phase = "running";
    live.classList.remove("comparing", "sweep"); setSplit(106);
    lo.pause(); seek(lp, 0); play(lp);
    $$(".ctf", framesEl).forEach(b => b.classList.remove("on"));
    let p = 0;
    statusText("running", "Queued", 2); lhStep.textContent = "Queued"; lhN.textContent = it.steps ? `step 0 / ${it.steps}` : "0%";
    S.timer = setInterval(() => {
      p += 4 + Math.random() * 5;
      if (p >= 100) { finish(); return; }
      const name = p < 8 ? "Queued" : p < 20 ? "Reading proxy" : p < 34 ? "Encoding references" : p < 90 ? "Denoising" : "Decoding";
      const n = it.steps ? (p < 34 ? 0 : p >= 90 ? it.steps : Math.round((p - 34) / 56 * it.steps)) : 0;
      lhStep.textContent = name;
      lhN.textContent = it.steps ? `step ${n} / ${it.steps}` : `${Math.round(p)}%`;
      statusText("running", name === "Denoising" && it.steps ? `Denoising ${n}/${it.steps}` : name, p);
    }, reduce() ? 25 : 105);
  }
  function finish(hold) {
    clearInterval(S.timer);
    S.phase = "done";
    statusText("done", "Done · stored result", 100);
    seek(lp, 0); seek(lo, 0);
    if (!hold) { play(lp); play(lo); }
    live.dataset.phase = "done";
    if (reduce() || hold) { live.classList.remove("sweep"); setSplit(-6); }
    else {
      live.classList.remove("sweep"); setSplit(106);
      void live.offsetWidth;
      live.classList.add("sweep");
      requestAnimationFrame(() => setSplit(-6));
      setTimeout(() => live.classList.remove("sweep"), 1260);
    }
    const it = S.list[S.i];
    if (it.seenKey) { S.seen.add(it.seenKey); dots(); }
  }
  function go(i, auto) {
    const n = S.list.length;
    S.i = (i + n) % n;
    layout();
    const it = S.list[S.i];
    clearInterval(S.timer);
    live.classList.add("swapping");
    setTimeout(() => {
      mount(it); inputs(it); reset();
      live.classList.remove("swapping");
      if (auto) setTimeout(generate, 140);
    }, reduce() ? 0 : 230);
  }
  function rebuild(keepIndex) {
    S.list = items();
    if (!keepIndex) S.i = S.tab === "chars" ? KEYS.indexOf("ice") : 0;
    S.i = clamp(S.i, 0, S.list.length - 1);
    root.dataset.tab = S.tab; root.dataset.mode = S.mode;
    $$(".sw-chars", root).forEach(n => n.setAttribute("aria-hidden", String(S.tab !== "chars")));
    $$(".sw-magic", root).forEach(n => n.setAttribute("aria-hidden", String(S.tab !== "magic")));
    buildPicker(); buildCards(); layout();
  }
  function setMode(id) {
    if (id === S.mode) return;
    S.mode = id;
    $$("button", modeBar).forEach((b, i) => b.setAttribute("aria-pressed", String(MODES[S.tab][i][0] === id)));
    rebuild(S.tab === "chars");
    go(S.i, true);
  }
  tabs.forEach(b => b.addEventListener("click", () => {
    if (b.dataset.t === S.tab) return;
    S.tab = b.dataset.t; S.mode = MODES[S.tab][0][0];
    tabs.forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    buildMode(); rebuild(false); go(0, true);
  }));
  gen.addEventListener("click", generate);
  $("#flow-prev").addEventListener("click", () => go(S.i - 1, true));
  $("#flow-next").addEventListener("click", () => go(S.i + 1, true));
  // Drag on the generated clip to compare it with the proxy along the GameWM slash.
  live.addEventListener("pointerdown", e => {
    if (S.phase !== "done") return;
    S.drag = { x: e.clientX, id: e.pointerId, moved: false };
  });
  live.addEventListener("pointermove", e => {
    if (!S.drag) return;
    if (!S.drag.moved && Math.abs(e.clientX - S.drag.x) < 5) return;
    if (!S.drag.moved) { S.drag.moved = true; capture(live, S.drag.id); live.classList.add("comparing"); live.classList.remove("sweep"); }
    const r = live.getBoundingClientRect();
    setSplit(clamp((e.clientX - r.left) / r.width * 100, 0, 100).toFixed(2));
  });
  const endDrag = () => {
    if (S.drag && !S.drag.moved && S.phase === "done") { if (lo.paused) { play(lp); play(lo); statusText("done", "Done · stored result", 100); $$(".ctf", framesEl).forEach(b => b.classList.remove("on")); } else { lo.pause(); lp.pause(); } }
    S.drag = null;
  };
  live.addEventListener("pointerup", endDrag);
  live.addEventListener("pointercancel", () => { S.drag = null; });
  live.addEventListener("dblclick", () => { live.classList.remove("comparing"); setSplit(-6); });
  // Swipe the deck on touch screens.
  let sw = null;
  cards.addEventListener("pointerdown", e => { sw = { x: e.clientX, t: performance.now() }; });
  cards.addEventListener("pointerup", e => { if (!sw) return; const dx = e.clientX - sw.x; if (Math.abs(dx) > 50 && performance.now() - sw.t < 600) go(S.i + (dx < 0 ? 1 : -1), true); sw = null; });
  document.addEventListener("keydown", e => {
    if (!S.vis || e.target.closest("input,textarea,select,[contenteditable]")) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      if (e.target.closest(".cover,.graph,.stage,[role=slider]")) return;
      e.preventDefault(); go(S.i + (e.key === "ArrowRight" ? 1 : -1), true);
    } else if (e.key === "Enter" && (e.target === document.body || e.target === gen)) {
      if (e.target === document.body) { e.preventDefault(); generate(); }
    }
  });
  const paintHead = () => {
    if (!S.vis) return;
    const v = S.phase === "done" ? lo : lp;
    head.style.left = clamp(v.currentTime / (v.duration || CLIP) * 100, 0, 100).toFixed(2) + "%";
    requestAnimationFrame(paintHead);
  };
  new ResizeObserver(() => requestAnimationFrame(drawLinks)).observe(timeEl);
  new IntersectionObserver(es => es.forEach(e => {
    S.vis = e.isIntersecting;
    if (S.vis) {
      play(slotProxy); requestAnimationFrame(paintHead);
      if (S.first) { S.first = false; mount(S.list[S.i]); inputs(S.list[S.i]); reset(); setTimeout(generate, 500); }
      else { play(lp); if (S.phase === "done") play(lo); }
    } else { [lp, lo, slotProxy].forEach(v => v.pause()); }
  }), { threshold: 0.3 }).observe($("#console"));
  buildMode(); rebuild(false); dots();
  inputs(S.list[S.i]);
})();

/* ================= 03 · across scenes ================= */
(() => {
  const bar = $("#sc-chars"), grid = $("#sc-grid"), promptEl = $("#sc-prompt");
  if (!bar) return;
  const chars = ["ice", "thunder", "arcane", "fire"];
  const SC = [["road", "Road", "Ranged attack"], ["downtown", "Downtown", "Ranged attack"], ["night", "Night square", "Ranged attack"]];
  let cur = "ice", vis = false, near = false;
  chars.forEach(k => {
    const b = el("button", "scc", `<img src="a/img/concept-${k}.jpg" alt="" loading="lazy">${CH[k].name}`);
    b.type = "button"; b.setAttribute("aria-pressed", String(k === cur));
    b.addEventListener("click", () => { if (k === cur) return; cur = k; $$(".scc", bar).forEach(x => x.setAttribute("aria-pressed", String(x === b))); swap(); });
    bar.appendChild(b);
  });
  SC.forEach(([s, name, kind]) => {
    const f = el("figure", "sc-card", `<div class="media"><video muted playsinline loop preload="none" aria-label="${name}, ${kind}"></video></div><figcaption><strong>${name}</strong><span>${kind}</span></figcaption>`);
    f.dataset.s = s;
    grid.appendChild(f);
  });
  const vids = $$("video", grid);
  follow(vids[0], vids.slice(1, 3));
  function apply() {
    promptEl.innerHTML = `Hero walks down the road, turns side-on and casts <mark>⟨${CH[cur].ranged}⟩</mark>; the opponent collapses and stays down.`;
    $$(".sc-card", grid).forEach(f => {
      const v = $("video", f), s = f.dataset.s;
      v.poster = `a/video/scene-${s}-${cur}.jpg`;
      if (near) setSrc(v, `a/video/scene-${s}-${cur}.mp4`);
      if (vis) play(v);
    });
  }
  function swap() {
    grid.classList.add("fading");
    setTimeout(() => { apply(); grid.classList.remove("fading"); }, reduce() ? 0 : 200);
  }
  new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && !near) { near = true; apply(); } }), { rootMargin: "700px 0px" }).observe(grid);
  new IntersectionObserver(es => es.forEach(e => { vis = e.isIntersecting; vids.forEach(v => vis ? play(v) : v.pause()); }), { threshold: 0.2 }).observe(grid);
  apply();
})();

/* ================= 04 · vehicle entry ================= */
(() => {
  const box = $("#vh");
  if (!box) return;
  const g = group(box, ".vh-lead");
  const headEl = $("#vt-head"), moments = $("#vt-moments");
  const M = [[0, ""], [1, ""], [2, "Entry starts"], [2.5, ""], [3, ""], [3.79, "Seated"], [5, ""]];
  M.forEach(([t, l]) => {
    const b = el("button", "vtm" + (l ? " ev" : ""), `${t.toFixed(2)} s${l ? `<span>${l}</span>` : ""}`);
    b.type = "button"; b.style.left = (t / CLIP * 100) + "%";
    b.addEventListener("click", () => { g.load(); g.vids.forEach(v => { v.pause(); seek(v, t); }); $$(".vtm", moments).forEach(x => x.classList.toggle("on", x === b)); });
    moments.appendChild(b);
  });
  box.addEventListener("click", () => { if (g.lead.paused) { g.vids.forEach(play); $$(".vtm", moments).forEach(x => x.classList.remove("on")); } else g.vids.forEach(v => v.pause()); });
  let vis = false;
  const paint = () => { if (!vis) return; headEl.style.left = clamp(g.lead.currentTime / (g.lead.duration || CLIP) * 100, 0, 100).toFixed(2) + "%"; requestAnimationFrame(paint); };
  new IntersectionObserver(es => es.forEach(e => { vis = e.isIntersecting; if (vis) requestAnimationFrame(paint); }), { threshold: 0.1 }).observe(box);
})();

/* ================= 05 · method: four steps on one rail ================= */
(() => {
  const root = $("#msteps");
  const playBtn = $("#g-play"), stateEl = $("#g-state");
  if (!root || !playBtn || !stateEl) return;
  const stackMQ = matchMedia("(max-width: 980px)");
  const glide = () => ({ behavior: reduce() ? "auto" : "smooth", block: "center" });
  const setState = (txt, run) => { stateEl.textContent = txt; stateEl.classList.toggle("run", !!run); };
  const SK = {
    fireball: { label: "Fireball", mechLabel: "Ranged", time: 3.5,
      clip: "a/video/attack-ranged-fire-v3.mp4", clipPoster: "a/video/attack-ranged-fire-v3.jpg",
      proxy: "a/video/proxy-ranged.mp4", proxyPoster: "a/video/proxy-ranged.jpg",
      wipe: "a/video/wipe-ranged-fire-v3.mp4", wipePoster: "a/video/wipe-ranged-fire-v3.jpg",
      anchor: "a/img/story-anchor-v3.jpg", pstill: "a/img/story-proxy.jpg" },
    flame: { label: "Flame Fist", mechLabel: "Melee", time: 2.8,
      clip: "a/video/attack-melee-fire-v3.mp4", clipPoster: "a/video/attack-melee-fire-v3.jpg",
      proxy: "a/video/proxy-melee.mp4", proxyPoster: "a/video/proxy-melee.jpg",
      wipe: "a/video/wipe-melee-fire-v3.mp4", wipePoster: "a/video/wipe-melee-fire-v3.jpg",
      anchor: "a/img/fire-melee-first-frame-v3.jpg", pstill: "a/img/proxy-melee-first-frame.jpg" },
  };
  const SHEET = "a/img/story-sheet.jpg";
  let skill = "fireball", view = "place", active = 0, tour = null, mediaNear = false, visible = false, raf = 0, lastT = 0;
  const s = () => SK[skill];
  const STEPS = [
    { title: "Draw the character once", text: "One picture of the place, one sheet of the mage, and one skill. Every clip starts here.", pass: "the pictures and the skill", via: "Pictures and skill" },
    { title: "The engine plays the attack", text: "It aims the camera and decides who is hit, and when. You only see a gray proxy video.", pass: "the proxy video", via: "Proxy video" },
    { title: "The model paints the picture", text: "It follows that proxy video and paints the mage, the fire, and the place.", pass: "the painted video", via: "Painted video" },
    { title: "Watch the finished clip", text: "Same mage. Same hit. The picture is new." },
  ];
  const foot = i => {
    const k = s();
    if (i === 0) {
      if (view === "mage") return "The same mage, from the front, the side, and the back.";
      if (view === "skill") return k.mechLabel + ": " + k.label + ".";
      return "The place, the light, and the camera.";
    }
    if (i === 1) return "The hit lands at " + k.time.toFixed(1) + " s. Clothes and fire come later.";
    if (i === 2) return "Gray on top. Painted below.";
    return "The hit stays where the engine put it.";
  };
  const still = () => view === "mage" ? SHEET : view === "skill" ? s().pstill : s().anchor;
  const stillAlt = () => view === "mage" ? "The mage from three sides" : view === "skill" ? s().label : "The place";
  const VIEWS = [["place", "Place"], ["mage", "Mage"], ["skill", "Skill"]];
  const vid = (src, poster, label) => `<video muted playsinline loop preload="none" poster="${poster}" data-src="${src}" aria-label="${label}"></video>`;
  const timeline = `<div class="mstep-time" aria-hidden="true"><i></i><b></b></div>`;

  root.innerHTML = STEPS.map((st, i) => {
    const k = s();
    const media = i === 0 ? `<div class="mstep-media"><img alt="" loading="lazy"></div>`
      : i === 1 ? `<div class="mstep-media">${vid(k.proxy, k.proxyPoster, "Proxy video of the attack")}</div>`
      : i === 2 ? `<div class="mstep-stack"><div class="mstep-half">${vid(k.wipe, k.wipePoster, "Proxy video")}</div><div class="mstep-half paint">${vid(k.wipe, k.wipePoster, "Painted attack")}</div></div>`
      : `<div class="mstep-media">${vid(k.clip, k.clipPoster, "Finished clip")}</div>`;
    const ctl = i === 0
      ? `<div class="seg seg-full" role="group" aria-label="Which picture">${VIEWS.map(([v, l]) => `<button type="button" data-view="${v}" aria-pressed="${v === view}">${l}</button>`).join("")}</div>`
      : timeline;
    const via = st.via ? `<span class="mstep-wire" aria-hidden="true"><i></i></span><span class="mstep-via">${st.via}</span>` : "";
    return `<article class="mstep" data-part="${i}"><button type="button" class="mstep-node" aria-label="Step ${i + 1}: ${st.title}">0${i + 1}</button>${via}<h3>${st.title}</h3><p class="mstep-text">${st.text}</p><div class="mstep-body">${media}${ctl}<p class="mstep-line"></p></div></article>`;
  }).join("");
  const lane = el("span", "mlane");
  lane.setAttribute("aria-hidden", "true");
  root.prepend(lane);

  const cards = $$(".mstep", root);
  const img = $(".mstep-media img", cards[0]);
  const halves = $$(".mstep-half video", cards[2]);
  if (halves[0] && halves[1]) follow(halves[0], [halves[1]], 0.12);
  const skillBtns = $$("#method [data-skill]");

  function syncButtons() {
    skillBtns.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.skill === skill)));
    $$("[data-view]", root).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.view === view)));
  }
  function syncCopy() {
    cards.forEach((c, i) => { $(".mstep-line", c).textContent = foot(i); });
    const at = (s().time / CLIP * 100).toFixed(1) + "%";
    $$(".mstep-time b", root).forEach(b => { b.style.left = at; });
  }
  function setImg(fade) {
    const src = still();
    img.alt = stillAlt();
    const prev = img.getAttribute("src");
    if (prev === src) return;
    if (fade && prev) img.parentElement.style.backgroundImage = `url("${prev}")`;
    img.src = src;
    if (fade) { img.classList.remove("mswap"); void img.offsetWidth; img.classList.add("mswap"); }
  }
  function arm(v) {
    if (v.dataset.src && v.getAttribute("src") !== v.dataset.src) v.setAttribute("src", v.dataset.src);
  }
  function playActive(restart) {
    $$("video", root).forEach(v => {
      if (mediaNear) arm(v);
      const on = v.closest(".mstep").classList.contains("on");
      if (on && restart) seek(v, 0);
      if (on && visible) play(v); else v.pause();
    });
    lastT = 0;
  }

  // The lane is one highlight that slides to the active step, so it never has to match uneven column heights.
  let laneReady = false;
  function placeLane() {
    const c = cards[active], h = $("h3", c);
    if (!c.offsetWidth) return;
    const gap = parseFloat(getComputedStyle(root).columnGap) || 24;
    const px = Math.max(6, Math.min(16, gap / 2 - 2));
    const top = c.offsetTop + h.offsetTop - 14;
    lane.style.width = (c.offsetWidth + px * 2) + "px";
    lane.style.height = Math.max(0, root.clientHeight - top - 12) + "px";
    lane.style.transform = `translate(${c.offsetLeft - px}px,${top}px)`;
    if (!laneReady) { laneReady = true; void lane.offsetWidth; lane.classList.add("ready"); }
  }
  function paint(cur, flowing) {
    active = cur;
    cards.forEach((c, j) => {
      c.classList.toggle("on", j === cur);
      c.classList.toggle("done", !!tour && j < cur);
      c.classList.toggle("passing", !!flowing && j === cur);
      c.classList.toggle("dim", !!tour && j > cur + (flowing ? 1 : 0));
      if (j !== cur) { const f = $(".mstep-time i", c); if (f) f.style.width = "0%"; }
    });
    placeLane();
  }
  function show(i) {
    paint(i, false);
    setState(STEPS[i].title, false);
    playActive(true);
  }
  function setView(v) {
    view = v;
    syncButtons();
    syncCopy();
    setImg(true);
  }
  function setSkill(k) {
    if (k === skill) return;
    skill = k;
    const sk = s();
    [[1, sk.proxy, sk.proxyPoster], [2, sk.wipe, sk.wipePoster], [3, sk.clip, sk.clipPoster]].forEach(([i, src, poster]) => {
      $$("video", cards[i]).forEach(v => {
        v.dataset.src = src;
        v.poster = poster;
        if (mediaNear) { v.setAttribute("src", src); v.load(); }
      });
    });
    syncButtons();
    syncCopy();
    setImg(true);
  }

  const TOUR = [
    { part: 0, d: 6300 },
    { pass: 0, d: 1400 },
    { part: 1, d: 5400 },
    { pass: 1, d: 1400 },
    { part: 2, d: 5400 },
    { pass: 2, d: 1400 },
    { part: 3, d: 5600 },
  ];
  const idleLabel = () => { playBtn.innerHTML = 'Play the steps <span aria-hidden="true">▶</span>'; };
  function halt() {
    if (!tour) return false;
    clearTimeout(tour.t);
    tour.subs.forEach(clearTimeout);
    tour = null;
    idleLabel();
    return true;
  }
  function stopTour() { if (halt()) show(active); }
  function finish() {
    tour = null;
    idleLabel();
    cards.forEach((c, j) => { c.classList.toggle("done", j < cards.length - 1); c.classList.remove("dim", "passing"); });
    setState("Done. Same mage, same hit, new picture.", false);
  }
  function step(i) {
    if (!tour) return;
    tour.subs.forEach(clearTimeout);
    tour.subs = [];
    if (i >= TOUR.length) { finish(); return; }
    const st = TOUR[i];
    if (st.pass != null) {
      paint(st.pass, true);
      setState("Passes on " + STEPS[st.pass].pass + ".", true);
    } else {
      paint(st.part, false);
      playActive(true);
      if (stackMQ.matches) {
        const r = cards[st.part].getBoundingClientRect();
        if (r.top < 60 || r.bottom > innerHeight) cards[st.part].scrollIntoView(glide());
      }
      setState("Step " + (st.part + 1) + " of 4. " + STEPS[st.part].title + ".", true);
      if (st.part === 0) {
        ["place", "mage", "skill"].forEach((v, n) => {
          const go = () => { if (tour) setView(v); };
          if (n === 0) go(); else tour.subs.push(setTimeout(go, n * (st.d / 3)));
        });
      } else if (st.part === 1) setView("place");
    }
    tour.t = setTimeout(() => step(i + 1), reduce() ? 800 : st.d);
  }

  root.addEventListener("click", e => {
    const vb = e.target.closest("[data-view]");
    if (vb) { halt(); setView(vb.dataset.view); show(0); return; }
    const card = e.target.closest(".mstep");
    if (!card) return;
    halt();
    show(Number(card.dataset.part));
  });
  skillBtns.forEach(b => b.addEventListener("click", () => { halt(); setSkill(b.dataset.skill); show(active); }));
  playBtn.addEventListener("click", () => {
    if (tour) { stopTour(); return; }
    tour = { t: 0, subs: [] };
    playBtn.innerHTML = 'Stop <span aria-hidden="true">■</span>';
    cards.forEach(c => c.classList.remove("done", "passing"));
    const box = root.getBoundingClientRect();
    if (!stackMQ.matches && (box.top < 0 || box.bottom > innerHeight)) root.scrollIntoView(glide());
    step(0);
  });

  // Only the active step's clip runs; its bar follows playback and flashes as the hit passes.
  function tick() {
    raf = 0;
    if (!visible) return;
    const c = cards[active], v = $("video", c), bar = $(".mstep-time", c);
    if (v && bar && v.duration) {
      const t = v.currentTime;
      $("i", bar).style.width = (t / v.duration * 100).toFixed(2) + "%";
      const hit = s().time;
      if (lastT < hit && t >= hit) { bar.classList.add("hit"); setTimeout(() => bar.classList.remove("hit"), 480); }
      lastT = t;
    }
    raf = requestAnimationFrame(tick);
  }
  new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting || mediaNear) return;
    mediaNear = true;
    $$("video", root).forEach(arm);
    [SK.fireball.anchor, SK.flame.anchor, SHEET, SK.fireball.pstill, SK.flame.pstill].forEach(u => { const im = new Image(); im.src = u; });
  }), { rootMargin: "700px 0px" }).observe(root);
  new IntersectionObserver(es => es.forEach(e => {
    visible = e.isIntersecting;
    if (!visible && tour) stopTour();
    playActive(false);
    if (visible && !raf) raf = requestAnimationFrame(tick);
  }), { threshold: 0.15 }).observe(root);
  new ResizeObserver(() => placeLane()).observe(root);

  setImg(false);
  syncButtons();
  syncCopy();
  paint(0, false);
  setState("Press play, or pick a step.", false);
})();

/* ================= 06 · data engine + generic groups ================= */
(() => {
  $$(".data .ds:not(.ds-wipe)").forEach(g => group(g, ".ds-lead"));
  const looks = $("#looks");
  if (looks) group(looks, ".looks-lead");
})();

/* ================= 06 · recording | training-data wipe ================= */
// Each video stores the recording (left half) and one processed look of the same clip (right half),
// so a canvas can cut both at the split and they never drift apart. Only looks that scored 4/4 in review.
(() => {
  const LOOK = { capsule: "Capsule", lowpoly: "Low-poly", primitives: "Primitives", voxel: "Voxel", "maple-clan": "Maple clan", "rice-noon": "Rice noon",
    "atomic-marble": "Atomic marble", "sky-columbia": "Sky Columbia", "jungle-ruin": "Jungle ruin", "knight-campaign": "Knight campaign", "koi-noon": "Koi noon",
    "arabian-nights": "Arabian nights", "clock-garden": "Clock garden", "nile-noon": "Nile noon", "salt-flat": "Salt flat", desert: "Desert",
    "fabric-kingdom": "Fabric kingdom", "macro-yard": "Macro yard", "pop-crossing": "Pop crossing" };
  const CLIPS = {
    melee: { looks: ["capsule", "lowpoly", "maple-clan", "rice-noon"], start: "capsule" },
    enter: { looks: ["primitives", "capsule", "atomic-marble", "sky-columbia"], start: "primitives" },
    exit: { looks: ["voxel", "capsule", "lowpoly", "primitives"], start: "voxel" },
    drive: { looks: ["capsule", "lowpoly", "voxel", "knight-campaign", "jungle-ruin"], start: "knight-campaign" },
    "moto-mount": { looks: ["capsule", "lowpoly", "primitives", "voxel", "arabian-nights"], start: "lowpoly" },
    crash: { looks: ["capsule", "lowpoly", "desert", "fabric-kingdom", "macro-yard", "pop-crossing"], start: "fabric-kingdom" },
  };
  $$(".dsw").forEach(card => {
    const k = card.dataset.k, clip = CLIPS[k];
    if (!clip) return;
    const media = $(".media", card), cv = $("canvas", media), v = $("video", media), ctx = cv.getContext("2d");
    const tag = $(".dsw-tag.r", media), bar = $(".dsw-styles", card);
    const W = cv.width, H = cv.height;
    let split = 0.5, vis = false, raf = 0, drag = null, look = clip.start;
    const poster = new Image();
    poster.onload = () => { if (v.readyState < 2) paint(poster); };
    function paint(src) {
      const x = Math.round(split * W);
      ctx.drawImage(src, 0, 0, W, H, 0, 0, W, H);
      if (x < W) ctx.drawImage(src, W + x, 0, W - x, H, x, 0, W - x, H);
    }
    function setLook(id) {
      look = id;
      const base = `a/video/dsp-${k}-${id}`, t = v.currentTime || 0, wasLoaded = !!v.getAttribute("src");
      tag.textContent = `Training data · ${LOOK[id]}`;
      $$("button", bar).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.look === id)));
      poster.src = base + ".jpg";
      if (wasLoaded || vis) {
        v.setAttribute("src", base + ".mp4");
        v.addEventListener("loadedmetadata", () => { try { v.currentTime = t; } catch (e) { /* not seekable yet */ } }, { once: true });
        if (vis) play(v); else v.load();
      } else v.dataset.src = base + ".mp4";
    }
    clip.looks.forEach(id => {
      const b = el("button", "", LOOK[id]);
      b.type = "button"; b.dataset.look = id;
      b.addEventListener("click", () => { if (id !== look) setLook(id); });
      bar.appendChild(b);
    });
    setLook(look);
    const loop = () => { if (!vis) return; if (v.readyState >= 2) paint(v); raf = requestAnimationFrame(loop); };
    const setSplit = clientX => {
      const r = media.getBoundingClientRect();
      split = clamp((clientX - r.left) / r.width, 0, 1);
      media.style.setProperty("--split", (split * 100).toFixed(2) + "%");
      if (v.readyState >= 2) paint(v); else if (poster.complete) paint(poster);
    };
    media.addEventListener("pointerdown", e => { drag = e.pointerId; capture(media, e.pointerId); setSplit(e.clientX); });
    media.addEventListener("pointermove", e => { if (drag === e.pointerId) setSplit(e.clientX); });
    const end = () => { drag = null; };
    media.addEventListener("pointerup", end);
    media.addEventListener("pointercancel", end);
    new IntersectionObserver(es => es.forEach(e => {
      vis = e.isIntersecting;
      if (vis) {
        if (!v.getAttribute("src")) v.setAttribute("src", v.dataset.src);
        play(v); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
      } else { v.pause(); cancelAnimationFrame(raf); }
    }), { rootMargin: "200px 0px" }).observe(media);
  });
})();

/* ================= 08 · showcase ================= */
(() => {
  const lib = $("#lib");
  if (!lib) return;
  const SCENES = [
    { id: "reed-bridge", name: "Reed Bridge Duel", cat: "Archery duel" },
    { id: "canyon-ambush", name: "Canyon Ambush", cat: "Archery duel" },
    { id: "fishing", name: "Reef Fishing", cat: "Interaction" },
    { id: "gold", name: "Gold Miner", cat: "Mining" },
    { id: "valley", name: "Valley", cat: "Exploration" },
    { id: "beach", name: "Beach", cat: "Exploration" },
  ];
  SCENES.forEach(sc => {
    const c = el("figure", "lc", `<div class="m"><video class="lc-gen" muted loop playsinline preload="none" poster="media/poster/${sc.id}.jpg" data-src="media/gallery/${sc.id}.mp4" aria-label="${sc.name}, generated"></video><video class="lc-proxy" muted loop playsinline preload="none" poster="media/poster/${sc.id}-proxy.jpg" data-src="media/gallery/${sc.id}-proxy.mp4" aria-hidden="true"></video><span class="tag tag-proxy tag-tl lc-ptag"><i></i>Proxy</span></div><figcaption class="t"><span>${sc.cat}</span><h4>${sc.name}</h4></figcaption>`);
    const [g, p] = $$("video", c);
    follow(g, [p]);
    const proxyOn = on => { if (on && !p.getAttribute("src")) p.setAttribute("src", p.dataset.src); c.classList.toggle("show-proxy", on); if (on) { seek(p, g.currentTime); play(p); } else p.pause(); };
    c.addEventListener("pointerenter", e => { if (e.pointerType !== "touch") proxyOn(true); });
    c.addEventListener("pointerleave", () => proxyOn(false));
    c.addEventListener("click", () => proxyOn(!c.classList.contains("show-proxy")));
    new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { if (!g.getAttribute("src")) g.setAttribute("src", g.dataset.src); play(g); }
      else { g.pause(); p.pause(); }
    }), { rootMargin: "200px 0px", threshold: 0.1 }).observe(c);
    lib.appendChild(c);
  });
})();

/* ================= lightbox + citation ================= */
(() => {
  const dlg = $("#lb");
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-lightbox]");
    if (!b) return;
    $("#lb-img").src = b.dataset.lightbox; $("#lb-img").alt = b.dataset.cap || ""; $("#lb-cap").textContent = b.dataset.cap || "";
    dlg.showModal();
  });
  $("#lb-close").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
  const btn = $("#copy-bib");
  btn.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText($("#bibtex").textContent); btn.textContent = "Copied ✓"; }
    catch (err) { const r = document.createRange(); r.selectNodeContents($("#bibtex")); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); btn.textContent = "Selected · press ⌘C"; }
    setTimeout(() => { btn.innerHTML = 'Copy citation <span aria-hidden="true">⧉</span>'; }, 1800);
  });
})();
})();
