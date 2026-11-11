(() => {
const FIG = {"lang":"fr","P":{"origin":[322.7967433191474,209.2654746395984],"scale":1.2168355443333043,"azimuth":28,"elevation":34},"model":{"neutral":[0.96,1.08],"acetyleneStart":6,"liftAbove":4.5,"steps":0.5},"tip":{"x":0,"y":-36,"z":44},"knobs":{"a":{"x":0,"y":54,"z":67},"o":{"x":0,"y":88,"z":67}}};
const TX = {read:(a, o, kind, lit) => (lit ? `acétylène ${a} · oxygène ${o} · ${kind}` : "chalumeau éteint"),kinds:{"off":"éteint","lifted":"flamme décollée","carb":"flamme carburante","neutral":"flamme neutre","oxy":"flamme oxydante"},target:{"neutral":"flamme neutre","oxy":"flamme oxydante","carb":"flamme carburante"},score:(good, total) => `Score : ${good} / ${total}`,feedback:{start:(goal) => `Objectif : ${goal}. Allumez l'acétylène, puis réduisez-le jusqu'à ce que la flamme recolle.`,lit:"La flamme est décollée : le débit d'acétylène est trop important. Réduisez l'acétylène jusqu'à ce qu'elle recolle.",attached:"La flamme a recollé. Ouvrez maintenant l'oxygène jusqu'à la flamme demandée.",needLight:"Allumez d'abord l'acétylène.",oxygenFirst:"L'oxygène ne s'ouvre qu'une fois la flamme recollée à la buse.",lifted:"La flamme est encore décollée : réduisez l'acétylène.",good:(goal) => `Juste : ${goal}.`,bad:(goal, seen) => `Pas encore : vous avez une ${seen}, l'objectif est une ${goal}.`}};

const still = matchMedia("(prefers-reduced-motion: reduce)");
const C = FIG, P = C.P, M = C.model, T = TX, GOALS = ["neutral", "oxy", "carb"];
const scope = document.querySelector('.live-figure[data-figure="flamme"]') || document;
const root = scope.querySelector(".iso-plate");
const stage = root.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const readout = root.querySelector("[data-readout]");
const feedback = scope.querySelector(".mv-feedback");
const scoreEl = scope.querySelector(".mv-score");
const buttons = Object.fromEntries([...scope.querySelectorAll(".mv-controls button")].map((b) => [b.dataset.act, b]));
const flame = svg.querySelector(".fl-flame"), plume = svg.querySelector(".fl-plume"), cone = svg.querySelector(".fl-cone");
const knobs = Object.fromEntries([...svg.querySelectorAll(".fl-knob")].map((n) => [n.dataset.knob, n]));
let lit = false, a = 0, o = 0, goal = "neutral", good = 0, total = 0, answered = false, shown = { len: 0, cone: 0, lift: 0 }, frame = 0, last = 0, visible = false, t0 = 0;
const lifted = () => lit && a > M.liftAbove;
const kindOf = (r) => (r < M.neutral[0] ? "carb" : r > M.neutral[1] ? "oxy" : "neutral");
const kind = () => (!lit ? "off" : lifted() ? "lifted" : kindOf(a > 0 ? o / a : 0));
function targetShape() {
  const k = kind();
  if (k === "off") return { len: 0, cone: 0, lift: 0 };
  if (k === "lifted") return { len: 110, cone: 0, lift: 14 };
  const base = 40 + a * 18;
  if (k === "neutral") return { len: base * 1.5, cone: 22, lift: 0 };
  if (k === "oxy") return { len: base * 1.15, cone: 11, lift: 0 };
  return { len: base * 1.75, cone: 40, lift: 0 };
}
function setGoal(id) {
  goal = id; lit = false; a = 0; o = 0; answered = false;
  feedback.textContent = T.feedback.start(T.target[goal]);
  sync(); run();
}
function sync() {
  scoreEl.textContent = T.score(good, total);
  buttons.check.disabled = answered;
  const nb = (v) => (C.lang === "fr" ? v.toFixed(1).replace(".", ",") : v.toFixed(1));
  readout.textContent = T.read(nb(a), nb(o), T.kinds[kind()], lit);
  flame.toggleAttribute("data-off", !lit);
}
function light() {
  if (lit) return;
  lit = true; a = M.acetyleneStart; o = 0;
  feedback.textContent = T.feedback.lit;
  sync(); run();
}
function adjust(which, d) {
  if (!lit) { feedback.textContent = T.feedback.needLight; return; }
  if (which === "o" && lifted()) { feedback.textContent = T.feedback.oxygenFirst; return; }
  const wasLifted = lifted();
  if (which === "a") a = Math.max(1, Math.min(8, a + d)); else o = Math.max(0, Math.min(8, o + d));
  if (wasLifted && !lifted()) feedback.textContent = T.feedback.attached;
  sync(); run();
}
function check() {
  if (!lit) { feedback.textContent = T.feedback.needLight; return; }
  if (lifted()) { feedback.textContent = T.feedback.lifted; return; }
  if (answered) return;
  const k = kind();
  if (k === goal) { answered = true; total++; good++; feedback.textContent = T.feedback.good(T.target[goal]); }
  else { feedback.textContent = T.feedback.bad(T.target[goal], T.target[k]); }
  sync();
}
function nextGoal() { let id = goal; while (id === goal) id = GOALS[Math.floor(Math.random() * GOALS.length)]; setGoal(id); }
function shape(len, width, lift, wob) {
  const tip = C.tip;
  const pt = (s, w) => iso([tip.x + w, tip.y - lift - s, tip.z + (w * 0.15)], P);
  const steps = 18, up = [], down = [];
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const w = width * Math.sin(Math.PI * Math.pow(u, 0.6)) * (1 + wob * Math.sin(u * 22 + t0 * 8) * 0.05);
    up.push(pt(u * len, w)); down.unshift(pt(u * len, -w));
  }
  return pathOf([...up, ...down], true);
}
function draw() {
  const k = kind();
  plume.setAttribute("d", shape(Math.max(shown.len, 1), 7 + shown.len * 0.05, shown.lift, k === "carb" ? 2.4 : 1));
  cone.setAttribute("d", shape(Math.max(shown.cone, 0.5), 2.4, shown.lift, k === "carb" ? 1.6 : 0));
  cone.style.opacity = shown.cone > 1 ? 1 : 0;
  for (const [key, val, ax] of [["a", a, C.knobs.a], ["o", o, C.knobs.o]]) {
    const ang = val * 0.7;
    knobs[key].setAttribute("d", pathOf([iso([ax.x + Math.cos(ang) * 0.8, ax.y + Math.sin(ang) * 0.8, ax.z], P), iso([ax.x + Math.cos(ang) * 4.2, ax.y + Math.sin(ang) * 4.2, ax.z], P)]));
  }
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60; last = now; t0 += dt;
  const calm = still.matches, to = targetShape();
  const ease = (v, g, tau) => (calm ? g : v + (g - v) * (1 - Math.exp(-dt / tau)));
  for (const key of ["len", "cone", "lift"]) shown[key] = ease(shown[key], to[key], 0.12);
  draw();
  const moving = lit || Math.abs(shown.len - to.len) > 0.1;
  frame = visible && moving && !calm ? requestAnimationFrame(tick) : 0;
}
function run() { if (still.matches) { const g = targetShape(); shown = g; draw(); } if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } }
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
buttons.light.addEventListener("click", light);
buttons.aMinus.addEventListener("click", () => adjust("a", -M.steps));
buttons.aPlus.addEventListener("click", () => adjust("a", M.steps));
buttons.oMinus.addEventListener("click", () => adjust("o", -M.steps));
buttons.oPlus.addEventListener("click", () => adjust("o", M.steps));
buttons.check.addEventListener("click", check);
buttons.next.addEventListener("click", nextGoal);
window.__fl = { setGoal, light, adjust, check, state: () => ({ lit, a, o, kind: kind(), goal, good, total }) };
setGoal(GOALS[Math.floor(Math.random() * GOALS.length)]);
draw();

})();
