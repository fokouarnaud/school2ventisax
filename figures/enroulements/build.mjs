// Figure interactive d'évaluation (skill anatomy) : identifier C, A et P d'un compresseur monophasé à l'ohmmètre.
// Partie 4, module 9 (imprimé 28), section « Moteurs monophasés : principe et bornier ».
// Usage : node figures/enroulements/build.mjs
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../_kit/iso-kit.mjs";
import * as G from "../_kit/lathe.mjs";
import { bench, buttonsHtml, CONTROLS_CSS, LIVE_HEAD, LIVE_WATCH, writeFigure } from "../_kit/acad-bench.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

// Modèle : résistances (Ω) du principal et de l'auxiliaire ; le commun est câblé sur une des trois bornes.
const MOTORS = [{ p: 3, a: 11 }, { p: 2.4, a: 9.6 }, { p: 4.5, a: 14.5 }, { p: 1.8, a: 6.2 }];

const TEXT = {
  fr: {
    title: "Bornier du compresseur",
    pageTitle: "Identifier les enroulements d'un compresseur monophasé",
    hint: "Mesurer les trois couples de bornes, puis désigner le commun",
    pairs: { p12: "Mesurer 1-2", p13: "Mesurer 1-3", p23: "Mesurer 2-3" },
    common: (n) => `Commun = ${n}`,
    next: "Autre compresseur",
    keys: [
      { mark: "lit", label: "Pointes de touche de l'ohmmètre" },
      { mark: "raised", label: "Compresseur hermétique, bornier 1, 2, 3 et ohmmètre" },
      { mark: "dashed", label: "Cordons de mesure" },
    ],
    caption: "Hors tension et fils débranchés, on mesure les trois couples de bornes sur un petit calibre. La plus forte résistance est mesurée entre l'auxiliaire et le principal : la borne qui n'y participe pas est le commun C. La plus faible relie le commun au principal P, la moyenne le commun à l'auxiliaire A. Contrôle : la plus forte valeur est la somme des deux autres.",
    stageLabel: "Compresseur hermétique sur un banc, son bornier à trois bornes et un ohmmètre dont les pointes se posent sur deux bornes. Mesurez les trois couples, puis désignez le commun.",
    svgLabel: "Compresseur hermétique, bornier à trois bornes numérotées et ohmmètre à deux cordons.",
    read: (pair, ohm) => (pair ? `bornes ${pair} : ${ohm} Ω` : "ohmmètre en attente"),
    good: (c, a, p) => `Juste : commun ${c}, auxiliaire ${a}, principal ${p}.`,
    bad: (c) => `Non : le commun est la borne ${c}, celle qui ne participe pas à la plus forte résistance.`,
    measureFirst: "Mesurez d'abord les trois couples de bornes.",
    start: "Posez les pointes sur chaque couple de bornes et notez les résistances.",
    score: (g, t) => `Score : ${g} / ${t}`,
  },
  en: {
    title: "Compressor terminals",
    pageTitle: "Identifying the windings of a single-phase compressor",
    hint: "Measure the three pairs of terminals, then pick the common",
    pairs: { p12: "Measure 1-2", p13: "Measure 1-3", p23: "Measure 2-3" },
    common: (n) => `Common = ${n}`,
    next: "Another compressor",
    keys: [
      { mark: "lit", label: "Ohmmeter test probes" },
      { mark: "raised", label: "Hermetic compressor, terminals 1, 2, 3 and ohmmeter" },
      { mark: "dashed", label: "Test leads" },
    ],
    caption: "With the power off and wires disconnected, measure the three pairs of terminals on a low range. The highest resistance is between auxiliary and main: the terminal not involved is the common C. The lowest joins common to main P, the middle one common to auxiliary A. Check: the highest value is the sum of the other two.",
    stageLabel: "Hermetic compressor on a bench, its three-terminal board and an ohmmeter whose probes touch two terminals. Measure the three pairs, then pick the common.",
    svgLabel: "Hermetic compressor, board with three numbered terminals and a two-lead ohmmeter.",
    read: (pair, ohm) => (pair ? `terminals ${pair}: ${ohm} Ω` : "ohmmeter waiting"),
    good: (c, a, p) => `Correct: common ${c}, auxiliary ${a}, main ${p}.`,
    bad: (c) => `No: the common is terminal ${c}, the one not involved in the highest resistance.`,
    measureFirst: "First measure the three pairs of terminals.",
    start: "Put the probes on each pair of terminals and note the resistances.",
    score: (g, t) => `Score: ${g} / ${t}`,
  },
};

const AZ = 30, WIDTH = 680, HEIGHT = 420;
const PLATE = { x: -90, y: -170, w: 180, d: 300, r: 8 };
const CX = -10, CY = 30, R = 46, H = 92;
const TERM = { 1: [CX + R + 2, CY - 12, 58], 2: [CX + R + 2, CY + 6, 50], 3: [CX + R + 2, CY + 6, 66] };
const METER = { x: 30, y: -150, w: 44, d: 60 };

function buildFigure(lang) {
  const T = TEXT[lang];
  const P = k.fitProjection([...k.boxCorners(PLATE, -15, 0), [CX, CY, H + 8]], WIDTH, HEIGHT, { pad: 14, azimuth: AZ, elevation: 34 });
  const at = (p) => k.iso(p, P);
  const S = (paths, style) => k.solidSvg(paths, style);
  const L = (d, style) => k.lineSvg(d, style);
  const F = G.frameOf([CX, CY, 6], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  const o = [bench(P, PLATE)];
  o.push(S(k.slabOf({ x: CX - 40, y: CY - 40, w: 80, d: 80, r: 4 }, 0, 6, P, 3, 0.6), { tone: "lo" }));
  o.push(S(G.solidOf([[0, 0], [0, R], [H - 30, R], [H - 14, R - 8, 1], [H - 4, R - 24, 1], [H, 0]], F, P), { tone: "hi", inner: L(G.arcOf(F, H - 34, R, P), { tone: "faint" }) }));
  // capot du bornier, sur la face +x
  const BF = G.frameOf([CX + R - 4, CY - 3, 58], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  o.push(S(G.disc(0, 5, 18, BF, P, { steps: 40, bevel: 0.6 }), { tone: "mid" }));
  for (const [n, [x, y, z]] of Object.entries(TERM)) {
    const TF = G.frameOf([x + 1, y, z], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
    o.push(S(G.disc(0, 4, 3, TF, P, { steps: 20 }), { tone: "hi" }));
    const c = at([x + 6, y, z + 6]);
    o.push(`<text class="ew-num" x="${c[0].toFixed(1)}" y="${c[1].toFixed(1)}">${n}</text>`);
  }
  // ohmmètre
  o.push(S(k.slabOf({ ...METER, r: 4 }, 0, 14, P, 3, 0.8), { tone: "mid", inner: L(k.sideSeam({ ...METER, r: 4 }, 4, P, 3), { tone: "faint" }) }));
  const scr = { x: METER.x + 8, y: METER.y + 8, w: 28, d: 26 };
  o.push(`<path class="ew-screen" d="${k.pathOf([[scr.x, scr.y, 14.1], [scr.x + scr.w, scr.y, 14.1], [scr.x + scr.w, scr.y + scr.d, 14.1], [scr.x, scr.y + scr.d, 14.1]].map(at), true)}"/>`);
  o.push(k.faceTextSvg(k.topMatrix([scr.x + scr.w / 2, scr.y + scr.d / 2], 14.2, P, "y"), "", { size: 7, tone: "hi", anchor: "middle" }).replace("<text ", '<text data-text="ohm" '));
  o.push(S(k.cylinder(METER.x + 22, METER.y + 48, 6, 14, 3, P, 24, 0.4), { tone: "lo" }));
  o.push(`<g class="ew-leads"><path class="ew-lead" data-lead="a" d=""/><path class="ew-lead" data-lead="b" d=""/></g>`);
  return k.figureSvg({ width: WIDTH, height: HEIGHT, label: T.svgLabel, body: o });
}

const CONFIG = { motors: MOTORS, term: TERM, jackA: [METER.x + 34, METER.y + 52, 14], jackB: [METER.x + 40, METER.y + 52, 14] };

const CSS = CONTROLS_CSS + `
.ew-screen{fill:var(--anatomy-top);stroke:var(--anatomy-mid);stroke-width:.8}
.ew-num{font:11px/1 var(--anatomy-mono);fill:var(--anatomy-strong);font-weight:700}
.ew-lead{fill:none;stroke-width:1.6;stroke-linecap:round}
.ew-lead[data-lead="a"]{stroke:#b3261e}.ew-lead[data-lead="b"]{stroke:var(--anatomy-strong)}
`;

const LIVE = LIVE_HEAD("enroulements") + `
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
` + LIVE_WATCH;

const langs = {};
for (const lang of ["fr", "en"]) {
  const T = TEXT[lang];
  const svg = buildFigure(lang);
  const P = k.fitProjection([...k.boxCorners(PLATE, -15, 0), [CX, CY, H + 8]], WIDTH, HEIGHT, { pad: 14, azimuth: AZ, elevation: 34 });
  const controls = buttonsHtml(lang === "fr" ? "Mesures et réponse" : "Measurements and answer", [["p12", T.pairs.p12], ["p13", T.pairs.p13], ["p23", T.pairs.p23], ["c1", T.common(1)], ["c2", T.common(2)], ["c3", T.common(3)], ["next", T.next]]);
  const plate = k.plateHtml({ fig: "Fig 13", title: T.title, hint: T.hint, readout: "", keys: T.keys, caption: T.caption, body: `<div class="iso-stage" role="img" aria-label="${T.stageLabel}">${svg}</div>${controls}` });
  const TX = `{read:${T.read},good:${T.good},bad:${T.bad},measureFirst:${JSON.stringify(T.measureFirst)},start:${JSON.stringify(T.start)},score:${T.score}}`;
  langs[lang] = { plate, title: T.pageTitle, script: `const FIG = ${JSON.stringify(CONFIG)};\nconst PROJ = ${JSON.stringify(P)};\nconst LANG = "${lang}";\nconst TX = ${TX};\n` + LIVE };
}
writeFigure(HERE, "enroulements", langs, CSS);
