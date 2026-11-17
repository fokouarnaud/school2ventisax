// Figure interactive d'évaluation (skill anatomy) : régler une flamme oxyacétylénique.
// Partie 4, module 5 (imprimé 24), section « Chalumeau mélangeur et réglage de la flamme ».
// Usage : node figures/flamme/build.mjs   (fr + en, sombre + clair)
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../_kit/iso-kit.mjs";
import * as G from "../_kit/lathe.mjs";
import { publish } from "../_kit/publish.mjs";
import { namespaced } from "../_kit/bundle.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const KIT_SOURCE = readFileSync(join(HERE, "..", "_kit", "iso-kit.mjs"), "utf8").replace(/^export /gm, "");
// Mode « S'entraîner » (Q96) : situations tirées de la section, catalogue figures/_data/chalumeau.mjs.
const PRACTICE_MODULE = namespaced(join(HERE, "..", "_data", "chalumeau.mjs"), "CH");
const PRACTICE = {
  fr: {
    modes: { tune: "Régler", practice: "S'entraîner", again: "Situation suivante", series: "Nouvelle série" },
    ask: { flamme: "Quelle est cette flamme ?", aspect: (d) => `Quelle flamme correspond à cet aspect : « ${d} » ?`, plage: (g) => `Plage de réglage du manodétendeur ${g === "oxygene" ? "d'oxygène" : "d'acétylène"} ?`, temperature: "Température atteinte à la pointe du dard ?", decolle: "Après l'allumage, la flamme est décollée de la buse : que faire ?", recolle: "La flamme a recollé à la buse : que faire ensuite ?", repere: (n) => `Sur la coupe du chalumeau, quel élément porte le repère ${n} ?`, aspire: "Dans un chalumeau à injection, qu'est-ce qui aspire le gaz combustible ?", lance: "Qu'appelle-t-on la lance du chalumeau ?" },
    flames: { neutral: "Flamme neutre", oxy: "Flamme oxydante", carb: "Flamme carburante" },
    bars: { "0.2-0.5": "0,2 à 0,5 bar", "0.5-1.5": "0,5 à 1,5 bar", "1.5-3": "1,5 à 3 bar", "0-10": "0 à 10 bar" },
    degrees: (v) => `Environ ${v} °C`,
    right: "Juste.",
    wrong: (a) => `Non : la bonne réponse est « ${a} ».`,
    done: (g, t) => `Série terminée : ${g} / ${t}. Lancez une nouvelle série pour d'autres situations.`,
    step: (i, n) => `situation ${i} / ${n}`,
    score: (g, t) => `Score de la série : ${g} / ${t}`,
    marks: { right: "Bonne réponse", wrong: "Votre réponse, fausse" },
  },
  en: {
    modes: { tune: "Adjust", practice: "Practise", again: "Next situation", series: "New series" },
    ask: { flamme: "What flame is this?", aspect: (d) => `Which flame matches this appearance: "${d}"?`, plage: (g) => `Setting range of the ${g === "oxygene" ? "oxygen" : "acetylene"} regulator?`, temperature: "Temperature reached at the tip of the inner cone?", decolle: "After lighting, the flame has lifted off the nozzle: what should be done?", recolle: "The flame is back on the nozzle: what comes next?", repere: (n) => `On the torch cross-section, which part carries mark ${n}?`, aspire: "In an injection torch, what draws in the fuel gas?", lance: "What is called the torch shank?" },
    flames: { neutral: "Neutral flame", oxy: "Oxidising flame", carb: "Carburising flame" },
    bars: { "0.2-0.5": "0.2 to 0.5 bar", "0.5-1.5": "0.5 to 1.5 bar", "1.5-3": "1.5 to 3 bar", "0-10": "0 to 10 bar" },
    degrees: (v) => `About ${v} °C`,
    right: "Correct.",
    wrong: (a) => `No: the right answer is "${a}".`,
    done: (g, t) => `Series finished: ${g} / ${t}. Start a new series for other situations.`,
    step: (i, n) => `situation ${i} / ${n}`,
    score: (g, t) => `Series score: ${g} / ${t}`,
    marks: { right: "Right answer", wrong: "Your answer, wrong" },
  },
};

// ---------------------------------------------------------------- modèle : rapport oxygène / acétylène
const MODEL = {
  neutral: [0.96, 1.08], // rapport du mélange pour une flamme neutre
  acetyleneStart: 6, // débit d'acétylène à l'allumage, flamme décollée
  liftAbove: 4.5, // au-dessus de ce débit d'acétylène, la flamme décolle
  steps: 0.5,
};
const kindOf = (ratio) => (ratio < MODEL.neutral[0] ? "carb" : ratio > MODEL.neutral[1] ? "oxy" : "neutral");

const TEXT = {
  fr: {
    title: "Réglage de la flamme",
    pageTitle: "Réglage de la flamme oxyacétylénique : exercice",
    hint: "Allumer, recoller, puis régler l'oxygène",
    buttons: { light: "Allumer l'acétylène", aMinus: "Acétylène -", aPlus: "Acétylène +", oMinus: "Oxygène -", oPlus: "Oxygène +", check: "Valider la flamme", next: "Nouvel objectif" },
    target: { neutral: "flamme neutre", oxy: "flamme oxydante", carb: "flamme carburante" },
    keys: [
      { mark: "lit", label: "Dard de la flamme" },
      { mark: "raised", label: "Chalumeau, robinets d'acétylène et d'oxygène, buse" },
      { mark: "dashed", label: "Panache" },
    ],
    caption: "Le réglage suit toujours le même ordre : ouvrir l'acétylène et l'enflammer, réduire l'acétylène jusqu'à ce que la flamme recolle à la buse, puis ouvrir l'oxygène jusqu'à la flamme voulue. Flamme carburante : excès d'acétylène, dard et panache allongés, de forme irrégulière. Flamme neutre : dard blanc brillant, de forme très nette en sortie de buse. Flamme oxydante : excès d'oxygène, dard et panache raccourcis, sifflement. Les débits sont indiqués en unités relatives.",
    stageLabel: "Chalumeau sur un banc, ses robinets d'acétylène et d'oxygène et sa buse, avec la flamme au bout. Allumez l'acétylène, recollez la flamme, réglez l'oxygène jusqu'à la flamme demandée, puis validez.",
    svgLabel: "Chalumeau sur son support, deux robinets moletés et buse d'où sort une flamme avec son dard et son panache.",
    read: (a, o, kind, lit) => (lit ? `acétylène ${a} · oxygène ${o} · ${kind}` : "chalumeau éteint"),
    kinds: { off: "éteint", lifted: "flamme décollée", carb: "flamme carburante", neutral: "flamme neutre", oxy: "flamme oxydante" },
    feedback: {
      start: (goal) => `Objectif : ${goal}. Allumez l'acétylène, puis réduisez-le jusqu'à ce que la flamme recolle.`,
      lit: "La flamme est décollée : le débit d'acétylène est trop important. Réduisez l'acétylène jusqu'à ce qu'elle recolle.",
      attached: "La flamme a recollé. Ouvrez maintenant l'oxygène jusqu'à la flamme demandée.",
      needLight: "Allumez d'abord l'acétylène.",
      oxygenFirst: "L'oxygène ne s'ouvre qu'une fois la flamme recollée à la buse.",
      good: (goal) => `Juste : ${goal}.`,
      bad: (goal, seen) => `Pas encore : vous avez une ${seen}, l'objectif est une ${goal}.`,
      lifted: "La flamme est encore décollée : réduisez l'acétylène.",
    },
    score: (good, total) => `Score : ${good} / ${total}`,
  },
  en: {
    title: "Adjusting the flame",
    pageTitle: "Adjusting the oxy-acetylene flame: an exercise",
    hint: "Light up, bring back, then set the oxygen",
    buttons: { light: "Light the acetylene", aMinus: "Acetylene -", aPlus: "Acetylene +", oMinus: "Oxygen -", oPlus: "Oxygen +", check: "Check the flame", next: "New target" },
    target: { neutral: "neutral flame", oxy: "oxidising flame", carb: "carburising flame" },
    keys: [
      { mark: "lit", label: "Inner cone of the flame" },
      { mark: "raised", label: "Torch, acetylene and oxygen valves, nozzle" },
      { mark: "dashed", label: "Outer envelope" },
    ],
    caption: "Adjustment always follows the same order: open the acetylene and light it, reduce the acetylene until the flame comes back to the nozzle, then open the oxygen until the flame is as required. Carburising flame: excess acetylene, lengthened cone and envelope, irregular shape. Neutral flame: brilliant white cone, very sharp at the nozzle. Oxidising flame: excess oxygen, shortened cone and envelope, hissing. Flow rates are in relative units.",
    stageLabel: "A torch on a bench, with its acetylene and oxygen valves and nozzle, and the flame at the end. Light the acetylene, bring the flame back, set the oxygen to the required flame, then check it.",
    svgLabel: "Torch on its stand, two knurled valves and a nozzle with a flame showing its inner cone and outer envelope.",
    read: (a, o, kind, lit) => (lit ? `acetylene ${a} · oxygen ${o} · ${kind}` : "torch out"),
    kinds: { off: "out", lifted: "lifted flame", carb: "carburising flame", neutral: "neutral flame", oxy: "oxidising flame" },
    feedback: {
      start: (goal) => `Target: ${goal}. Light the acetylene, then reduce it until the flame comes back.`,
      lit: "The flame has lifted off: the acetylene flow is too high. Reduce the acetylene until it comes back.",
      attached: "The flame has come back. Now open the oxygen until the flame is as required.",
      needLight: "Light the acetylene first.",
      oxygenFirst: "Oxygen is only opened once the flame is back at the nozzle.",
      good: (goal) => `Correct: ${goal}.`,
      bad: (goal, seen) => `Not yet: you have a ${seen}, the target is a ${goal}.`,
      lifted: "The flame is still lifted off: reduce the acetylene.",
    },
    score: (good, total) => `Score: ${good} / ${total}`,
  },
};

// ---------------------------------------------------------------- géométrie : l'axe y est horizontal à l'écran, y grand à gauche
const AZ = 28, WIDTH = 680, HEIGHT = 400;
const PLATE = { x: -70, y: -210, w: 150, d: 400, r: 8 };
const PLATE_H = 10, FOOT_H = 5;
const Z = 44; // axe du chalumeau
const X = 0;
const HANDLE_Y = 150;
const HANDLE_L = 110; // du manche vers le mélangeur (y décroissant)
const TIP_Y = -36; // sortie de la buse
const AXIS = (y) => G.frameOf([X, y, Z], [0, -1, 0], [1, 0, 0], [0, 0, 1]);

function buildFigure(lang) {
  const T = TEXT[lang];
  const P = k.fitProjection([...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [X, HANDLE_Y, Z + 26], [X, -200, Z + 30]], WIDTH, HEIGHT, { pad: 14, azimuth: AZ, elevation: 34 });
  const at = (p) => k.iso(p, P);
  const S = (paths, style) => k.solidSvg(paths, style);
  const L = (d, style) => k.lineSvg(d, style);
  const D = (pts, style) => k.dotsSvg(pts, style);
  const depth = (x, y, z = 0) => k.depthOf([x, y, z], P);

  function plate() {
    const o = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
    for (const [x, y] of k.corners(PLATE, 24).sort((a, b) => depth(...a) - depth(...b))) {
      o.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
      o.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
    }
    o.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid", inner: L(k.sideSeam(PLATE, -4, P, 8), { tone: "faint" }) }));
    o.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
    const screws = k.corners(PLATE, 10);
    o.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
    o.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
    const strip = { x: PLATE.x + PLATE.w - 13, y: -190, w: 6, d: 150, r: 1 };
    o.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
    const t = k.topTicks(strip.y + 4, strip.y + strip.d - 4, 4, 5, strip.x + 0.8, 0.6, [1.8, 3.4], P, "y");
    o.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
    return o.join("");
  }

  const stand = (y) => S(k.slabOf({ x: X - 16, y: y - 7, w: 32, d: 14, r: 2 }, 0, 4, P, 2, 0.5), { tone: "lo" }) +
    S(k.slabOf({ x: X - 5, y: y - 4, w: 10, d: 8, r: 1 }, 4, Z - 14 - 4, P, 2, 0.4), { tone: "mid" });

  function torch() {
    const F = AXIS(HANDLE_Y);
    const o = [stand(HANDLE_Y - 30), stand(HANDLE_Y - 90)];
    // manche strié et tête
    o.push(S(G.solidOf([[0, 0], [0, 9, 1], [4, 12], [HANDLE_L, 12], [HANDLE_L + 6, 9, 1], [HANDLE_L + 6, 0]], F, P), { tone: "hi", inner: k.fadedSvg(G.ribsOf(F, 10, HANDLE_L - 8, 12.2, 26, P, { fade: [0.06, 0.4], seams: true }), { tone: "lo" }) }));
    // raccords de tuyaux à l'arrière
    for (const dx of [-5, 5]) o.push(S(k.cylinder(X + dx, HANDLE_Y + 6, 3.2, Z - 2, 5, P, 18, 0.3), { tone: "mid" }));
    // tube de mélange et buse : du manche à la sortie, sur le même axe
    const end = HANDLE_Y - TIP_Y;
    o.push(S(G.solidOf([[HANDLE_L + 6, 0], [HANDLE_L + 6, 4.4], [end - 28, 4.4], [end - 26, 6.4], [end - 16, 6.4], [end - 14, 4], [end, 3], [end, 0]], F, P), { tone: "mid", inner: L(G.arcOf(F, end - 21, 6.4, P), { tone: "faint" }) }));
    // robinets : un de chaque côté, sur le dessus de la tête
    for (const [key, y, r] of [["a", HANDLE_Y - 96, 7], ["o", HANDLE_Y - 62, 7]]) {
      o.push(S(k.cylinder(X, y, 4.4, Z + 11.4, 4, P, 20, 0.3), { tone: "mid" }));
      o.push(S(k.cylinder(X, y, r, Z + 15.4, 7, P, 36, 0.5), { tone: "lo", inner: L(k.knurl(X, y, r, Z + 16, Z + 21.6, 20, P), { tone: "faint" }) }));
      o.push(S(k.cylinder(X, y, r - 2.6, Z + 22.4, 0.6, P, 24), { tone: "hi", crease: "none" }));
      o.push(`<path class="iso-line fl-knob" data-tone="hi" data-free="both" data-knob="${key}" d=""/>`);
    }
    return o.join("");
  }

  const flame = `<g class="fl-flame" data-off><path class="fl-plume" d=""/><path class="fl-cone" d=""/></g>`;
  const body = [plate(), torch(), flame];
  const svg = k.figureSvg({ width: WIDTH, height: HEIGHT, label: T.svgLabel, body });
  const config = { lang, P, model: MODEL, tip: { x: X, y: TIP_Y, z: Z }, knobs: { a: { x: X, y: HANDLE_Y - 96, z: Z + 23 }, o: { x: X, y: HANDLE_Y - 62, z: Z + 23 } } };
  return { svg, config };
}

const CSS = `
.iso{--fl-plume:#6aa8f0;--fl-plume-fill:#6aa8f033;--fl-cone:#ffffff;--fl-cone-line:#cfe3ff}
.iso[data-theme="light"]{--fl-plume:#1f5fae;--fl-plume-fill:#1f5fae22;--fl-cone:#ffffff;--fl-cone-line:#1f5fae}
.fl-plume{fill:var(--fl-plume-fill);stroke:var(--fl-plume);stroke-width:1.2}
.fl-cone{fill:var(--fl-cone);stroke:var(--fl-cone-line);stroke-width:1}
.fl-flame[data-off]{opacity:0}
.iso-stage{touch-action:manipulation}
.iso-plate-corner[data-corner="hint"]{top:20px;bottom:auto;right:0;white-space:normal;line-height:1.35}
.iso-plate-corner[data-corner="readout"]{left:0;white-space:normal;text-align:right;line-height:1.4}
.iso-plate{padding-top:80px}
.mv-controls{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}
.mv-controls button{font:12px/1.2 var(--anatomy-mono);letter-spacing:.04em;color:var(--anatomy-strong);background:var(--anatomy-card);border:1px solid var(--anatomy-mid);border-radius:999px;padding:12px 14px;min-height:44px;cursor:pointer}
.mv-controls button:focus-visible{outline:2px solid var(--anatomy-hi);outline-offset:2px}
.mv-controls button:disabled{opacity:.45;cursor:default}
.mv-feedback{margin:12px 0 0;min-height:3em;color:var(--anatomy-text);font-size:13px;line-height:1.55}
.mv-score{color:var(--anatomy-muted);font:11px/1 var(--anatomy-mono);margin-top:6px}
@media (max-width:560px){.iso-plate{padding:76px 12px 64px}.mv-controls button{flex:1 1 40%}}
.fl-tune[hidden],.fl-quiz[hidden]{display:none}
.rc-prompt{margin:16px 0 0;min-height:1.6em;color:var(--anatomy-strong);font-weight:600;line-height:1.45}
.fl-quiz .rc-options{flex-direction:column}
.fl-quiz .rc-options button{text-align:left;border-radius:14px}
.fl-quiz .rc-options button[data-state="right"]{border-color:var(--anatomy-lit);box-shadow:inset 0 0 0 1px var(--anatomy-lit)}
.fl-quiz .rc-options button[data-state="wrong"]{border-style:dashed}
.fl-quiz .rc-options button:disabled{opacity:1;cursor:default}
`;

const LIVE = `
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
// ---------------------------------------------------------------- S'entraîner (Q96)
const PX = PT, CAT = CH.buildTorch(), LANG = C.lang;
const tuneBox = scope.querySelector(".fl-tune"), quizBox = scope.querySelector(".fl-quiz");
const promptEl = scope.querySelector(".rc-prompt");
// Les réponses vont dans la liste du mode « S'entraîner », jamais dans les commandes du mode « Régler ».
const optionsBox = scope.querySelector(".fl-quiz .rc-options");
const qpool = { 1: [], 2: [], 3: [] };
CAT.situations.forEach((s) => qpool[s.level].push(s));
const PLAN = [1, 1, 1, 1, 2, 2, 2, 3, 3, 3];
let qlist = [], qi = 0, qgood = 0, qanswered = false;
const same = (x, y) => JSON.stringify(x) === JSON.stringify(y);
const strip = (s) => s.replace(/<[^>]+>/g, "");
function qlabel(s, opt) {
  if (s.kind === "flamme" || s.kind === "aspect") return PX.flames[opt];
  if (s.kind === "plage") return PX.bars[opt];
  if (s.kind === "temperature") return PX.degrees(opt);
  if (s.kind === "repere") return CAT.marks[opt][LANG];
  return CAT.texts[s.which][opt][LANG];
}
function qask(s) {
  const A = PX.ask;
  if (s.kind === "aspect") return A.aspect(strip(CAT.aspects[s.flame][LANG]));
  if (s.kind === "plage") return A.plage(s.gas);
  if (s.kind === "repere") return A.repere(s.mark);
  if (s.kind === "decollement" || s.kind === "injecteur") return A[s.which];
  return A[s.kind];
}
function qshow() {
  qanswered = false;
  const s = qlist[qi];
  // Une flamme à reconnaître est allumée avec les débits de la situation ; sinon le chalumeau reste éteint.
  if (s.kind === "flamme") { lit = true; a = s.a; o = s.o; } else { lit = false; a = 0; o = 0; }
  sync(); run();
  readout.textContent = "";
  promptEl.textContent = qask(s);
  optionsBox.replaceChildren(...s.options.slice().sort(() => Math.random() - 0.5).map((opt) => {
    const b = document.createElement("button"); b.type = "button"; b.textContent = qlabel(s, opt); b._o = opt;
    b.addEventListener("click", () => qanswer(opt)); return b;
  }));
  feedback.textContent = "";
  buttons.again.disabled = true;
  scoreEl.textContent = PX.score(qgood, qi) + " · " + PX.step(qi + 1, qlist.length);
}
function qanswer(opt) {
  if (qanswered) return;
  qanswered = true;
  const s = qlist[qi], ok = same(opt, s.answer);
  if (ok) qgood++;
  for (const b of optionsBox.children) {
    b.disabled = true;
    if (same(b._o, s.answer)) { b.dataset.state = "right"; b.prepend("✓ "); b.setAttribute("aria-label", PX.marks.right + " : " + b.textContent.slice(2)); }
    else if (same(b._o, opt)) { b.dataset.state = "wrong"; b.prepend("✗ "); b.setAttribute("aria-label", PX.marks.wrong + " : " + b.textContent.slice(2)); }
  }
  const why = s.kind === "flamme" || s.kind === "aspect" ? strip(CAT.aspects[s.answer][LANG]) + "." : "";
  const last = qi === qlist.length - 1;
  feedback.textContent = [ok ? PX.right : PX.wrong(qlabel(s, s.answer)), why, last ? PX.done(qgood, qlist.length) : ""].filter(Boolean).join(" ");
  buttons.again.disabled = last;
  scoreEl.textContent = PX.score(qgood, qi + 1) + " · " + PX.step(qi + 1, qlist.length);
}
function qstart() {
  qlist = [];
  for (const level of PLAN) {
    const kinds = {};
    qpool[level].forEach((x) => (kinds[x.kind] ||= []).push(x));
    const groups = Object.values(kinds);
    let s;
    for (let i = 0; i < 40; i++) { const g = groups[Math.floor(Math.random() * groups.length)]; s = g[Math.floor(Math.random() * g.length)]; if (!qlist.includes(s)) break; }
    qlist.push(s);
  }
  qi = 0; qgood = 0; qshow();
}
buttons.again.addEventListener("click", () => { if (qi < qlist.length - 1) { qi++; qshow(); } });
buttons.series.addEventListener("click", qstart);
function setMode(m) {
  buttons.tune.setAttribute("aria-pressed", m === "tune");
  buttons.practice.setAttribute("aria-pressed", m === "practice");
  tuneBox.hidden = m !== "tune"; quizBox.hidden = m !== "practice";
  promptEl.textContent = "";
  if (m === "tune") setGoal(GOALS[Math.floor(Math.random() * GOALS.length)]); else qstart();
}
buttons.tune.addEventListener("click", () => setMode("tune"));
buttons.practice.addEventListener("click", () => setMode("practice"));
window.__fl = { setGoal, light, adjust, check, setMode, answer: (i) => qanswer(qlist[qi].options[i]), current: () => qlist[qi], state: () => ({ lit, a, o, kind: kind(), goal, good, total }) };
setMode("tune");
draw();
`;

const site = { fragments: {}, scripts: {} };
const written = [];
for (const lang of ["fr", "en"]) {
  const T = TEXT[lang], B = T.buttons;
  const { svg, config } = buildFigure(lang);
  const btn = (act, label) => `<button type="button" data-act="${act}">${label}</button>`;
  const X = PRACTICE[lang].modes;
  const modes = `<div class="mv-controls" role="group" aria-label="${lang === "fr" ? "Mode de la figure" : "Figure mode"}">${btn("tune", X.tune)}${btn("practice", X.practice)}</div>`;
  const tune = `<div class="fl-tune"><div class="mv-controls" role="group" aria-label="${lang === "fr" ? "Commandes du chalumeau" : "Torch controls"}">${btn("light", B.light)}${btn("aMinus", B.aMinus)}${btn("aPlus", B.aPlus)}${btn("oMinus", B.oMinus)}${btn("oPlus", B.oPlus)}${btn("check", B.check)}${btn("next", B.next)}</div></div>`;
  const quiz = `<div class="fl-quiz" hidden><div class="mv-controls rc-options" role="group" aria-label="${lang === "fr" ? "Réponses proposées" : "Possible answers"}"></div><div class="mv-controls">${btn("again", X.again)}${btn("series", X.series)}</div></div>`;
  const controls = `${modes}<p class="rc-prompt" aria-live="polite"></p>${tune}${quiz}<p class="mv-feedback" aria-live="polite"></p><p class="mv-score" aria-live="polite"></p>`;
  const plate = k.plateHtml({ fig: "Fig 10", title: T.title, hint: T.hint, readout: "", keys: T.keys, caption: T.caption, body: `<div class="iso-stage" role="img" aria-label="${T.stageLabel}">${svg}</div>${controls}` });
  const f = T.feedback;
  const TX = `{read:${T.read},kinds:${JSON.stringify(T.kinds)},target:${JSON.stringify(T.target)},score:${T.score},feedback:{start:${f.start},lit:${JSON.stringify(f.lit)},attached:${JSON.stringify(f.attached)},needLight:${JSON.stringify(f.needLight)},oxygenFirst:${JSON.stringify(f.oxygenFirst)},lifted:${JSON.stringify(f.lifted)},good:${f.good},bad:${f.bad}}}`;
  const PXT = PRACTICE[lang];
  const fns = (o) => `{${Object.entries(o).map(([key, f]) => `${JSON.stringify(key)}:${typeof f === "function" ? f : JSON.stringify(f)}`).join(",")}}`;
  const PT = `{ask:${fns(PXT.ask)},flames:${JSON.stringify(PXT.flames)},bars:${JSON.stringify(PXT.bars)},degrees:${PXT.degrees},right:${JSON.stringify(PXT.right)},wrong:${PXT.wrong},done:${PXT.done},step:${PXT.step},score:${PXT.score},marks:${JSON.stringify(PXT.marks)}}`;
  const pageScript = `${PRACTICE_MODULE}const FIG = ${JSON.stringify(config)};\nconst TX = ${TX};\nconst PT = ${PT};\n` + LIVE;
  site.fragments[lang] = plate; site.scripts[lang] = pageScript;
  for (const theme of ["dark", "light"]) {
    const name = `flamme.${lang}${theme === "light" ? "-light" : ""}.html`;
    writeFileSync(join(HERE, name), k.pageHtml({ title: T.pageTitle, theme, body: `<style>${CSS}</style>${plate}`, script: KIT_SOURCE + pageScript, width: 760 }).replace('<html lang="en">', `<html lang="${lang}">`));
    written.push(name);
  }
}
written.push(...publish("flamme", { ...site, css: CSS }));
console.log("wrote", written.join(", "));
