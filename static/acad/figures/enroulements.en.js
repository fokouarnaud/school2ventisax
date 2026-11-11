(() => {
const FIG = {"motors":[{"p":3,"a":11},{"p":2.4,"a":9.6},{"p":4.5,"a":14.5},{"p":1.8,"a":6.2}],"term":{"1":[38,18,58],"2":[38,36,50],"3":[38,36,66]},"jackA":[64,-98,14],"jackB":[70,-98,14]};
const PROJ = {"origin":[307.71662312931676,208.83348453689916],"scale":1.473527812042811,"azimuth":30,"elevation":34};
const LANG = "en";
const TX = {read:(pair, ohm) => (pair ? `terminals ${pair}: ${ohm} Ω` : "ohmmeter waiting"),good:(c, a, p) => `Correct: common ${c}, auxiliary ${a}, main ${p}.`,bad:(c) => `No: the common is terminal ${c}, the one not involved in the highest resistance.`,measureFirst:"First measure the three pairs of terminals.",start:"Put the probes on each pair of terminals and note the resistances.",score:(g, t) => `Score: ${g} / ${t}`};

const still = matchMedia("(prefers-reduced-motion: reduce)");
const scope = document.querySelector('.live-figure[data-figure="enroulements"]') || document;
const root = scope.querySelector(".iso-plate");
const stage = root.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const readout = root.querySelector("[data-readout]");
const feedback = scope.querySelector(".mv-feedback");
const scoreEl = scope.querySelector(".mv-score");
const buttons = Object.fromEntries([...scope.querySelectorAll(".mv-controls button")].map((b) => [b.dataset.act, b]));
let frame = 0, last = 0, visible = false;
function loop(step, busy) {
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60; last = now;
    step(still.matches ? dt * 6 : dt);
    frame = visible && busy() ? requestAnimationFrame(tick) : 0;
  }
  return () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
}

const T = TX, C = FIG;
const leads = Object.fromEntries([...svg.querySelectorAll(".ew-lead")].map((l) => [l.dataset.lead, l]));
const screen = svg.querySelector('[data-text="ohm"]');
let m, common, seen, pair = null, good = 0, total = 0, answered = false;
const P = PROJ;
function setup() {
  m = C.motors[Math.floor(Math.random() * C.motors.length)];
  common = 1 + Math.floor(Math.random() * 3);
  const others = [1, 2, 3].filter((n) => n !== common);
  if (Math.random() < 0.5) others.reverse();
  m.main = others[0]; m.aux = others[1];
  seen = new Set(); pair = null; answered = false;
  feedback.textContent = T.start;
  draw(); sync();
}
const fmt = (v) => (LANG === "fr" ? String(v).replace(".", ",") : String(v));
function ohms(a, b) {
  const s = new Set([a, b]);
  if (s.has(common) && s.has(m.main)) return m.p;
  if (s.has(common) && s.has(m.aux)) return m.a;
  return Math.round((m.p + m.a) * 10) / 10;
}
function measure(a, b) { pair = [a, b]; seen.add(a + "-" + b); draw(); sync(); }
function choose(n) {
  if (answered) return;
  if (seen.size < 3) { feedback.textContent = T.measureFirst; return; }
  answered = true; total++;
  if (n === common) { good++; feedback.textContent = T.good(common, m.aux, m.main); } else feedback.textContent = T.bad(common);
  sync();
}
function lead(el, from, to) {
  const pts = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    pts.push(iso([from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t, from[2] + (to[2] - from[2]) * t + 18 * Math.sin(Math.PI * t)], P));
  }
  el.setAttribute("d", pathOf(pts));
}
function draw() {
  const rest = (j) => [j[0] + 10, j[1] + 14, 2];
  lead(leads.a, C.jackA, pair ? C.term[pair[0]].map((v, i) => v + (i === 0 ? 4 : 0)) : rest(C.jackA));
  lead(leads.b, C.jackB, pair ? C.term[pair[1]].map((v, i) => v + (i === 0 ? 4 : 0)) : rest(C.jackB));
  screen.textContent = pair ? fmt(ohms(pair[0], pair[1])) : "- - -";
  readout.textContent = T.read(pair ? pair.join("-") : null, pair ? fmt(ohms(pair[0], pair[1])) : "");
}
function sync() { scoreEl.textContent = T.score(good, total); for (const n of [1, 2, 3]) buttons["c" + n].disabled = answered; }
const run = () => {};
buttons.p12.addEventListener("click", () => measure(1, 2));
buttons.p13.addEventListener("click", () => measure(1, 3));
buttons.p23.addEventListener("click", () => measure(2, 3));
for (const n of [1, 2, 3]) buttons["c" + n].addEventListener("click", () => choose(n));
buttons.next.addEventListener("click", setup);
window.__ew = { measure, choose, setup, state: () => ({ common, main: m.main, aux: m.aux, good, total }) };
setup();
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);

})();
