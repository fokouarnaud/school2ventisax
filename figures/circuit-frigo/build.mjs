// Figure interactive d'évaluation (skill anatomy) : état du fluide en chaque point du circuit frigorifique.
// Partie 4, module 8 (imprimé 27), section « État du fluide sur chaque partie du circuit ».
// Usage : node figures/circuit-frigo/build.mjs
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../_kit/iso-kit.mjs";
import * as G from "../_kit/lathe.mjs";
import { bench, buttonsHtml, CONTROLS_CSS, LIVE_HEAD, LIVE_WATCH, writeFigure } from "../_kit/acad-bench.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

// Modèle : le cours, point par point. state : vap (vapeur surchauffée), mix (mélange), liq (liquide sous-refroidi).
const POINTS = [
  { n: 1, state: "vap", side: "BP" }, { n: 2, state: "vap", side: "HP" }, { n: 3, state: "vap", side: "HP" },
  { n: 4, state: "mix", side: "HP" }, { n: 5, state: "liq", side: "HP" }, { n: 6, state: "liq", side: "HP" },
  { n: 7, state: "liq", side: "HP" }, { n: 8, state: "mix", side: "BP" }, { n: 9, state: "vap", side: "BP" },
];

const TEXT = {
  fr: {
    title: "État du fluide",
    pageTitle: "Circuit frigorifique : état du fluide en chaque point",
    hint: "Lire le point repéré, choisir l'état du fluide",
    states: { vap: "Vapeur surchauffée", mix: "Mélange liquide et vapeur", liq: "Liquide sous-refroidi" },
    next: "Point suivant",
    keys: [
      { mark: "lit", label: "Point du circuit à identifier" },
      { mark: "raised", label: "Compresseur, condenseur, détendeur et évaporateur" },
      { mark: "dashed", label: "Sens de circulation du fluide" },
    ],
    caption: "Le compresseur aspire la vapeur surchauffée basse pression venant de l'évaporateur (point 1) et la refoule en vapeur chaude haute pression (point 2). Dans le condenseur, elle se désurchauffe (3), se condense en mélange (4) puis se sous-refroidit (5, 6). Le liquide sous-refroidi arrive au détendeur (7), qui fait chuter la pression : une partie s'évapore aussitôt (8). Dans l'évaporateur, le liquide s'évapore en absorbant la chaleur du milieu à refroidir, jusqu'à la vapeur surchauffée (9).",
    stageLabel: "Banc portant un circuit frigorifique : compresseur, condenseur à ailettes, détendeur et évaporateur à ailettes, reliés par des tubes. Un point du circuit est repéré : choisissez l'état du fluide à cet endroit.",
    svgLabel: "Circuit frigorifique sur un banc, avec le compresseur, le condenseur, le détendeur, l'évaporateur et un repère lumineux sur un point du circuit.",
    read: (p, side) => `point ${p} · côté ${side}`,
    good: (p, s) => `Juste : au point ${p}, ${s.toLowerCase()}.`,
    bad: (p, s) => `Pas tout à fait : au point ${p}, le fluide est en ${s.toLowerCase()}.`,
    start: "Un point du circuit est repéré. Quel est l'état du fluide à cet endroit ?",
    score: (g, t) => `Score : ${g} / ${t}`,
  },
  en: {
    title: "State of the refrigerant",
    pageTitle: "Refrigeration circuit: state of the refrigerant at each point",
    hint: "Read the marked point, choose the refrigerant's state",
    states: { vap: "Superheated vapour", mix: "Liquid and vapour mixture", liq: "Subcooled liquid" },
    next: "Next point",
    keys: [
      { mark: "lit", label: "Point of the circuit to identify" },
      { mark: "raised", label: "Compressor, condenser, expansion valve and evaporator" },
      { mark: "dashed", label: "Direction of refrigerant flow" },
    ],
    caption: "The compressor draws in low-pressure superheated vapour from the evaporator (point 1) and discharges it as hot high-pressure vapour (point 2). In the condenser it loses its superheat (3), condenses as a mixture (4) then is subcooled (5, 6). The subcooled liquid reaches the expansion valve (7), which drops the pressure: part of it flashes off at once (8). In the evaporator the liquid boils by absorbing heat from the space being cooled, up to superheated vapour (9).",
    stageLabel: "Bench with a refrigeration circuit: compressor, finned condenser, expansion valve and finned evaporator, joined by tubes. One point of the circuit is marked: choose the state of the refrigerant there.",
    svgLabel: "Refrigeration circuit on a bench, with compressor, condenser, expansion valve, evaporator and a light marking one point of the circuit.",
    read: (p, side) => `point ${p} · ${side} side`,
    good: (p, s) => `Correct: at point ${p}, ${s.toLowerCase()}.`,
    bad: (p, s) => `Not quite: at point ${p}, the refrigerant is ${s.toLowerCase()}.`,
    start: "One point of the circuit is marked. What state is the refrigerant in there?",
    score: (g, t) => `Score: ${g} / ${t}`,
  },
};

const AZ = 34, WIDTH = 680, HEIGHT = 420;
const PLATE = { x: -110, y: -170, w: 220, d: 340, r: 8 };
const Z = 14; // hauteur des tubes
const COMP = { x: -60, y: 0 }, COND = { x: 20, y: -120, w: 46, d: 70 }, EVAP = { x: 20, y: 50, w: 46, d: 70 }, XV = { x: 70, y: 0 };

// Tracé du circuit (dans le plan z = Z), avec la position de chaque point repéré.
const PATH = [
  [COMP.x, COMP.y - 18], [COMP.x, -85], [COND.x, -85], // refoulement vers le condenseur
  [COND.x + COND.w, -85], [XV.x + 20, -85], [XV.x + 20, XV.y], // sortie condenseur vers le détendeur
  [XV.x + 20, 85], [EVAP.x + EVAP.w, 85], [EVAP.x, 85], [COMP.x, 85], [COMP.x, COMP.y + 18], // évaporateur puis aspiration
];
const MARKS = {
  1: [COMP.x, 50], 2: [COMP.x, -50], 3: [COND.x + 4, -85], 4: [COND.x + COND.w / 2, -85], 5: [COND.x + COND.w - 4, -85],
  6: [XV.x + 20, -60], 7: [XV.x + 20, -16], 8: [XV.x + 20, 30], 9: [EVAP.x - 10, 85],
};

function buildFigure(lang) {
  const T = TEXT[lang];
  const P = k.fitProjection([...k.boxCorners(PLATE, -15, 0), [COMP.x, COMP.y, 60]], WIDTH, HEIGHT, { pad: 14, azimuth: AZ, elevation: 40 });
  const at = (p) => k.iso(p, P);
  const S = (paths, style) => k.solidSvg(paths, style);
  const L = (d, style) => k.lineSvg(d, style);

  const fins = (box, label) => {
    const o = [S(k.slabOf({ ...box, r: 2 }, 0, 10, P, 3, 0.6), { tone: "mid", inner: L(k.sideSeam({ ...box, r: 2 }, 4, P, 3), { tone: "faint" }) })];
    const t = k.topTicks(box.y + 3, box.y + box.d - 3, 3, 5, box.x, 10, [box.w, box.w], P, "y");
    o.push(L(t.minor, { tone: "faint" }), L(t.major, { tone: "faint" }));
    o.push(k.faceTextSvg(k.topMatrix([box.x + box.w / 2, box.y + (label === "Cd" ? 14 : box.d - 14)], 10.2, P, "y"), label, { size: 7, tone: "hi", anchor: "middle" }));
    return o.join("");
  };
  const compressor = () => {
    const F = G.frameOf([COMP.x, COMP.y, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
    return S(k.cylinder(COMP.x, COMP.y, 26, 0, 3, P, 32, 0.4), { tone: "lo" }) + S(G.solidOf([[0, 0], [0, 22], [30, 22], [38, 18, 1], [44, 10, 1], [46, 0]], F, P), { tone: "hi", inner: L(G.arcOf(F, 30, 22, P), { tone: "faint" }) });
  };
  const valve = S(k.slabOf({ x: XV.x + 12, y: XV.y - 8, w: 16, d: 16, r: 2 }, 6, 14, P, 2, 0.5), { tone: "lo" }) +
    S(k.cylinder(XV.x + 20, XV.y, 5, 20, 10, P, 20, 0.4), { tone: "mid" });

  const pipe = k.pathOf(PATH.map(([x, y]) => at([x, y, Z])));
  const marks = Object.entries(MARKS).map(([n, [x, y]]) => {
    const c = at([x, y, Z]);
    return `<g class="cf-mark" data-point="${n}"><circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="5"/><text x="${(c[0] + 8).toFixed(1)}" y="${(c[1] - 7).toFixed(1)}">${n}</text></g>`;
  }).join("");

  const body = [
    bench(P, PLATE),
    fins(COND, "Cd"),
    `<g class="cf-pipe">${L(pipe, { tone: "mid" })}</g>`,
    `<g class="cf-flow">${L(pipe, { tone: "lit" })}</g>`,
    compressor(),
    valve,
    fins(EVAP, "Ev"),
    marks,
  ];
  return k.figureSvg({ width: WIDTH, height: HEIGHT, label: T.svgLabel, body });
}

const CSS = CONTROLS_CSS + `
.cf-pipe .iso-line{stroke-width:3.2}
.cf-flow .iso-line{stroke-width:1.2;stroke-dasharray:4 8;animation:iso-flow 2400ms linear infinite}
.cf-mark circle{fill:var(--anatomy-card);stroke:var(--anatomy-mid);stroke-width:1.2}
.cf-mark text{font:10px/1 var(--anatomy-mono);fill:var(--anatomy-muted)}
.cf-mark[data-on] circle{fill:var(--anatomy-lit);stroke:var(--anatomy-lit)}
.cf-mark[data-on] text{fill:var(--anatomy-strong);font-weight:700}
@media (prefers-reduced-motion:reduce){.cf-flow .iso-line{animation:none}}
`;

const LIVE = LIVE_HEAD("circuit-frigo") + `
const T = TX, PTS = FIG;
const marks = Object.fromEntries([...svg.querySelectorAll(".cf-mark")].map((m) => [m.dataset.point, m]));
let i = 0, good = 0, total = 0, answered = false;
const order = [...PTS.keys()].sort(() => Math.random() - 0.5);
function show() {
  const p = PTS[order[i % order.length]];
  for (const [n, m] of Object.entries(marks)) m.toggleAttribute("data-on", Number(n) === p.n);
  readout.textContent = T.read(p.n, p.side);
  for (const s of ["vap", "mix", "liq"]) buttons[s].disabled = answered;
  scoreEl.textContent = T.score(good, total);
}
function answer(s) {
  if (answered) return;
  const p = PTS[order[i % order.length]];
  answered = true; total++;
  if (s === p.state) { good++; feedback.textContent = T.good(p.n, T.states[s]); } else feedback.textContent = T.bad(p.n, T.states[p.state]);
  show();
}
function next() { i++; answered = false; feedback.textContent = T.start; show(); }
const run = () => {};
for (const s of ["vap", "mix", "liq"]) buttons[s].addEventListener("click", () => answer(s));
buttons.next.addEventListener("click", next);
window.__cf = { answer, next, state: () => ({ point: PTS[order[i % order.length]], good, total }) };
feedback.textContent = T.start;
show();
` + LIVE_WATCH;

const langs = {};
for (const lang of ["fr", "en"]) {
  const T = TEXT[lang];
  const svg = buildFigure(lang);
  const controls = buttonsHtml(lang === "fr" ? "État du fluide" : "Refrigerant state", [["vap", T.states.vap], ["mix", T.states.mix], ["liq", T.states.liq], ["next", T.next]]);
  const plate = k.plateHtml({ fig: "Fig 12", title: T.title, hint: T.hint, readout: "", keys: T.keys, caption: T.caption, body: `<div class="iso-stage" role="img" aria-label="${T.stageLabel}">${svg}</div>${controls}` });
  const TX = `{states:${JSON.stringify(T.states)},read:${T.read},good:${T.good},bad:${T.bad},start:${JSON.stringify(T.start)},score:${T.score}}`;
  langs[lang] = { plate, title: T.pageTitle, script: `const FIG = ${JSON.stringify(POINTS)};\nconst TX = ${TX};\n` + LIVE };
}
writeFigure(HERE, "circuit-frigo", langs, CSS);
