// Figure interactive d'évaluation (skill anatomy) : charge d'une installation à la balance, en phase liquide ou vapeur.
// Partie 4, module 17 (imprimé 36), section « Charge en phase liquide et en phase vapeur ».
// Usage : node figures/manifold-charge/build.mjs
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../_kit/iso-kit.mjs";
import * as G from "../_kit/lathe.mjs";
import { bench, buttonsHtml, CONTROLS_CSS, LIVE_HEAD, LIVE_WATCH, writeFigure } from "../_kit/acad-bench.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

// Modèle : débit de charge (kg/s en temps accéléré) selon la phase ; tolérance de ± 2 % sur la masse de la plaque.
const MODEL = {
  cylinder: 13.6, // kg, bouteille pleine sur la balance
  liquidRate: 0.12,
  vapourRate: 0.04,
  tolerance: 0.02,
  jobs: [
    { fluid: "R134a", kind: "pure", target: 0.85 },
    { fluid: "R407C", kind: "zeo", target: 1.6 },
    { fluid: "R404A", kind: "zeo", target: 2.2 },
    { fluid: "R22", kind: "pure", target: 1.1 },
  ],
};

const TEXT = {
  fr: {
    title: "Charge à la balance",
    pageTitle: "Charge d'une installation à la balance : exercice",
    hint: "Faire le zéro, choisir la phase, charger jusqu'à la masse de la plaque",
    buttons: { tare: "Faire le zéro", flip: "Retourner la bouteille", open: "Ouvrir la vanne", close: "Fermer la vanne", check: "Terminer la charge", next: "Autre installation" },
    keys: [
      { mark: "lit", label: "Affichage de la balance" },
      { mark: "raised", label: "Bouteille à tube plongeur, balance, flexible et unité à charger" },
      { mark: "dashed", label: "Fluide en cours de transfert" },
    ],
    caption: "La charge par la masse est la plus sûre : on lit la masse sur la plaque de l'installation, on pose la bouteille sur la balance et on fait le zéro, puis on charge jusqu'à ce que la balance affiche la masse prévue, en négatif puisque la bouteille se vide. Une bouteille à tube plongeur debout donne du liquide ; retournée, elle donne de la vapeur. Un mélange zéotrope (R404A, R407C) se charge toujours en liquide, sinon sa composition change. Un fluide pur peut se charger en vapeur, plus lentement. Le temps de la figure est accéléré.",
    stageLabel: "Bouteille de fluide à tube plongeur posée sur une balance électronique, reliée par un flexible à une unité frigorifique. Lisez la plaque, faites le zéro, choisissez la phase, chargez jusqu'à la masse prévue, puis terminez.",
    svgLabel: "Balance électronique avec affichage, bouteille de fluide à tube plongeur, flexible et unité frigorifique avec sa plaque.",
    plate: (j) => `${j.fluid} · ${j.target.toFixed(2).replace(".", ",")} kg`,
    read: (charged, target, phase) => `chargé ${charged} / ${target} kg · ${phase}`,
    phase: { liquid: "liquide", vapour: "vapeur" },
    feedback: {
      start: (j) => `Plaque : ${j.fluid}, ${j.target.toFixed(2).replace(".", ",")} kg. Faites le zéro de la balance avant d'ouvrir la vanne.`,
      noTare: "Faites d'abord le zéro de la balance, bouteille posée : sinon la masse chargée ne se lit pas.",
      closeFirst: "Fermez la vanne avant de retourner la bouteille.",
      zeoVapour: "Attention : un mélange zéotrope chargé en vapeur ne garde pas sa composition. Fermez, retournez la bouteille et chargez en liquide.",
      good: (c) => `Juste : ${c} kg chargés, dans la tolérance, et dans la bonne phase.`,
      under: (c, t) => `Pas assez : ${c} kg sur ${t} kg. Rouvrez la vanne et complétez.`,
      over: (c, t) => `Trop de fluide : ${c} kg pour ${t} kg prévus. En pratique, il faudrait récupérer l'excédent.`,
      badPhase: "La masse est juste, mais ce zéotrope a été chargé en vapeur : sa composition a changé. Il faudrait récupérer et recharger en liquide.",
      stillOpen: "Fermez d'abord la vanne.",
    },
    score: (g, t) => `Score : ${g} / ${t}`,
  },
  en: {
    title: "Charging on scales",
    pageTitle: "Charging a system on scales: an exercise",
    hint: "Zero the scales, choose the phase, charge to the plate mass",
    buttons: { tare: "Zero the scales", flip: "Turn the cylinder over", open: "Open the valve", close: "Close the valve", check: "Finish charging", next: "Another system" },
    keys: [
      { mark: "lit", label: "Scales display" },
      { mark: "raised", label: "Dip-tube cylinder, scales, hose and unit being charged" },
      { mark: "dashed", label: "Refrigerant being transferred" },
    ],
    caption: "Charging by mass is the most reliable method: read the mass on the system's plate, stand the cylinder on the scales and zero them, then charge until the scales show the planned mass, as a negative value since the cylinder empties. A dip-tube cylinder standing upright gives liquid; turned over, it gives vapour. A zeotropic blend (R404A, R407C) is always charged as liquid, otherwise its composition changes. A single refrigerant may be charged as vapour, more slowly. Time in the figure is speeded up.",
    stageLabel: "Dip-tube refrigerant cylinder on electronic scales, connected by a hose to a refrigeration unit. Read the plate, zero the scales, choose the phase, charge to the planned mass, then finish.",
    svgLabel: "Electronic scales with a display, dip-tube refrigerant cylinder, hose and refrigeration unit with its plate.",
    plate: (j) => `${j.fluid} · ${j.target.toFixed(2)} kg`,
    read: (charged, target, phase) => `charged ${charged} / ${target} kg · ${phase}`,
    phase: { liquid: "liquid", vapour: "vapour" },
    feedback: {
      start: (j) => `Plate: ${j.fluid}, ${j.target.toFixed(2)} kg. Zero the scales before opening the valve.`,
      noTare: "First zero the scales with the cylinder on them: otherwise the charged mass cannot be read.",
      closeFirst: "Close the valve before turning the cylinder over.",
      zeoVapour: "Careful: a zeotropic blend charged as vapour does not keep its composition. Close, turn the cylinder upright and charge as liquid.",
      good: (c) => `Correct: ${c} kg charged, within tolerance, in the right phase.`,
      under: (c, t) => `Not enough: ${c} kg out of ${t} kg. Reopen the valve and top up.`,
      over: (c, t) => `Too much refrigerant: ${c} kg for ${t} kg planned. In practice the excess would have to be recovered.`,
      badPhase: "The mass is right, but this zeotrope was charged as vapour: its composition has changed. It would have to be recovered and recharged as liquid.",
      stillOpen: "Close the valve first.",
    },
    score: (g, t) => `Score: ${g} / ${t}`,
  },
};

const AZ = 30, WIDTH = 680, HEIGHT = 420;
const PLATE = { x: -90, y: -180, w: 180, d: 340, r: 8 };
const SCALE = { x: -30, y: 40, w: 70, d: 70 };
const CYL = { x: 5, y: 75, r: 20, h: 100, z: 10 };
const UNIT = { x: -60, y: -160, w: 90, d: 110 };

function buildFigure(lang) {
  const T = TEXT[lang];
  const P = k.fitProjection([...k.boxCorners(PLATE, -15, 0), [CYL.x, CYL.y, CYL.z + CYL.h + 26]], WIDTH, HEIGHT, { pad: 14, azimuth: AZ, elevation: 34 });
  const at = (p) => k.iso(p, P);
  const S = (paths, style) => k.solidSvg(paths, style);
  const L = (d, style) => k.lineSvg(d, style);
  const o = [bench(P, PLATE)];
  // unité frigorifique et sa plaque
  o.push(S(k.slabOf({ ...UNIT, r: 4 }, 0, 64, P, 3, 1), { tone: "mid", inner: L(k.sideSeam({ ...UNIT, r: 4 }, 8, P, 3), { tone: "faint" }) }));
  const ft = k.topTicks(UNIT.y + 6, UNIT.y + UNIT.d - 6, 3, 5, UNIT.x, 64, [UNIT.w, UNIT.w], P, "y");
  o.push(L(ft.minor, { tone: "faint" }), L(ft.major, { tone: "faint" }));
  const fx = UNIT.x + UNIT.w + 0.2;
  const pl = { y0: UNIT.y + 50, y1: UNIT.y + 100, z0: 16, z1: 34 };
  o.push(`<path class="mc-plate" d="${k.pathOf([[fx, pl.y0, pl.z0], [fx, pl.y1, pl.z0], [fx, pl.y1, pl.z1], [fx, pl.y0, pl.z1]].map(at), true)}"/>`);
  o.push(k.faceTextSvg(k.sideMatrix([fx + 0.1, pl.y1 - 3], pl.z1 - 7, P, "right"), "", { size: 5, tone: "hi" }).replace("<text ", '<text data-text="plate" '));
  // vanne de charge sur le dessus de l'unité
  o.push(S(k.cylinder(UNIT.x + UNIT.w - 14, UNIT.y + 24, 4, 64, 10, P, 18, 0.3), { tone: "hi" }));
  // balance
  o.push(S(k.slabOf({ ...SCALE, r: 4 }, 0, 8, P, 3, 0.8), { tone: "lo" }));
  o.push(S(k.slabOf({ x: SCALE.x + 6, y: SCALE.y + 6, w: SCALE.w - 12, d: SCALE.d - 12, r: 3 }, 8, 2, P, 3, 0.4), { tone: "mid" }));
  const dsp = { x: SCALE.x + SCALE.w + 0.2, y0: SCALE.y + 12, y1: SCALE.y + 58, z0: 1.5, z1: 6.5 };
  o.push(`<path class="mc-screen" d="${k.pathOf([[dsp.x, dsp.y0, dsp.z0], [dsp.x, dsp.y1, dsp.z0], [dsp.x, dsp.y1, dsp.z1], [dsp.x, dsp.y0, dsp.z1]].map(at), true)}"/>`);
  o.push(k.faceTextSvg(k.sideMatrix([dsp.x + 0.1, dsp.y1 - 4], 2.6, P, "right"), "", { size: 3.8, tone: "hi" }).replace("<text ", '<text data-text="kg" '));
  // bouteille : deux dessins, debout et retournée
  const F = G.frameOf([CYL.x, CYL.y, CYL.z], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  const bottle = S(G.solidOf([[0, 0], [0, CYL.r - 4, 1], [6, CYL.r], [CYL.h - 14, CYL.r], [CYL.h - 4, CYL.r - 8, 1], [CYL.h, 6, 1], [CYL.h, 0]], F, P), { tone: "hi", inner: L(G.arcOf(F, 20, CYL.r, P) + G.arcOf(F, CYL.h - 22, CYL.r, P), { tone: "faint" }) });
  const valveTop = S(k.cylinder(CYL.x, CYL.y, 5, CYL.z + CYL.h, 10, P, 20, 0.4), { tone: "lo" });
  const valveBottom = S(k.cylinder(CYL.x + CYL.r + 3, CYL.y, 5, CYL.z + 6, 8, P, 20, 0.4), { tone: "lo" });
  o.push(`<g class="mc-upright">${bottle}${valveTop}</g>`);
  o.push(`<g class="mc-inverted" hidden>${bottle}${valveBottom}</g>`);
  // flexible
  const hose = (a, b) => { const pts = []; for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t + 30 * Math.sin(Math.PI * t)]); } return k.pathOf(pts.map(at)); };
  const end = (p) => { const e = at(p); return `<circle class="iso-wire-end" cx="${e[0].toFixed(1)}" cy="${e[1].toFixed(1)}" r="1.6"/>`; };
  const port = [UNIT.x + UNIT.w - 14, UNIT.y + 24, 74];
  o.push(`<g class="mc-hose" data-for="upright">${L(hose([CYL.x, CYL.y, CYL.z + CYL.h + 10], port), { tone: "mid" })}${end([CYL.x, CYL.y, CYL.z + CYL.h + 10])}</g>`);
  o.push(`<g class="mc-hose" data-for="inverted" hidden>${L(hose([CYL.x + CYL.r + 3, CYL.y, CYL.z + 14], port), { tone: "mid" })}${end([CYL.x + CYL.r + 3, CYL.y, CYL.z + 14])}</g>`);
  return k.figureSvg({ width: WIDTH, height: HEIGHT, label: T.svgLabel, body: o });
}

const CSS = CONTROLS_CSS + `
.mc-plate,.mc-screen{fill:var(--anatomy-top);stroke:var(--anatomy-mid);stroke-width:.8}
.mc-hose .iso-line{stroke-width:2.6;stroke:#8a6a10}
.mc-upright[hidden],.mc-inverted[hidden],.mc-hose[hidden]{display:none}
.mc-hose[data-live] .iso-line{stroke-dasharray:3 4;animation:iso-flow 1600ms linear infinite}
@media (prefers-reduced-motion:reduce){.mc-hose[data-live] .iso-line{animation:none}}
`;

const LIVE = LIVE_HEAD("manifold-charge") + `
const T = TX, M = FIG;
const upright = svg.querySelector(".mc-upright"), inverted = svg.querySelector(".mc-inverted");
const hoses = [...svg.querySelectorAll(".mc-hose")];
const kgText = svg.querySelector('[data-text="kg"]'), plateText = svg.querySelector('[data-text="plate"]');
let job, mass, tare, open, inv, vapourCharged, done, good = 0, total = 0;
const nb = (v) => (LANG === "fr" ? v.toFixed(2).replace(".", ",") : v.toFixed(2));
function setup() {
  job = M.jobs[Math.floor(Math.random() * M.jobs.length)];
  mass = M.cylinder; tare = null; open = false; inv = false; vapourCharged = 0; done = false;
  plateText.textContent = T.plate(job);
  feedback.textContent = T.feedback.start(job);
  sync(); draw();
}
const charged = () => (tare === null ? 0 : tare - mass);
function sync() {
  buttons.valve.textContent = open ? T.buttons.close : T.buttons.open;
  buttons.valve.setAttribute("aria-pressed", open ? "true" : "false");
  upright.hidden = inv; inverted.hidden = !inv;
  for (const h of hoses) { h.hidden = (h.dataset.for === "inverted") !== inv; h.toggleAttribute("data-live", open); }
  buttons.check.disabled = done;
  scoreEl.textContent = T.score(good, total);
}
function draw() {
  const shown = tare === null ? mass : mass - tare;
  kgText.textContent = (shown < 0 ? "-" : "") + nb(Math.abs(shown));
  readout.textContent = T.read(nb(Math.max(0, charged())), nb(job.target), T.phase[inv ? "vapour" : "liquid"]);
}
function doTare() { if (open) { feedback.textContent = T.feedback.stillOpen; return; } tare = mass; draw(); }
function flip() { if (open) { feedback.textContent = T.feedback.closeFirst; return; } inv = !inv; sync(); draw(); }
function valve() {
  if (done) return;
  if (!open && tare === null) { feedback.textContent = T.feedback.noTare; return; }
  open = !open;
  if (open && inv && job.kind === "zeo") feedback.textContent = T.feedback.zeoVapour;
  sync(); run();
}
function check() {
  if (done) return;
  if (open) { feedback.textContent = T.feedback.stillOpen; return; }
  if (tare === null) { feedback.textContent = T.feedback.noTare; return; }
  const c = charged(), err = (c - job.target) / job.target;
  if (err < -M.tolerance) { feedback.textContent = T.feedback.under(nb(c), nb(job.target)); return; }
  done = true; total++;
  if (err > M.tolerance) feedback.textContent = T.feedback.over(nb(c), nb(job.target));
  else if (job.kind === "zeo" && vapourCharged > 0.001) feedback.textContent = T.feedback.badPhase;
  else { good++; feedback.textContent = T.feedback.good(nb(c)); }
  sync();
}
function step(dt) {
  if (open) { const q = (inv ? M.vapourRate : M.liquidRate) * dt; mass -= q; if (inv) vapourCharged += q; }
  draw();
}
const run = loop(step, () => open);
buttons.tare.addEventListener("click", doTare);
buttons.flip.addEventListener("click", flip);
buttons.valve.addEventListener("click", valve);
buttons.check.addEventListener("click", check);
buttons.next.addEventListener("click", setup);
window.__mc = { setup, doTare, flip, valve, check, set: (i) => { setup(); job = M.jobs[i]; plateText.textContent = T.plate(job); }, state: () => ({ job, charged: charged(), inv, open, done, good, total }) };
setup();
` + LIVE_WATCH;

const langs = {};
for (const lang of ["fr", "en"]) {
  const T = TEXT[lang], B = T.buttons;
  const svg = buildFigure(lang);
  const controls = buttonsHtml(lang === "fr" ? "Commandes de charge" : "Charging controls", [["tare", B.tare], ["flip", B.flip], ["valve", B.open], ["check", B.check], ["next", B.next]]);
  const plate = k.plateHtml({ fig: "Fig 15", title: T.title, hint: T.hint, readout: "", keys: T.keys, caption: T.caption, body: `<div class="iso-stage" role="img" aria-label="${T.stageLabel}">${svg}</div>${controls}` });
  const f = T.feedback;
  const plain = ["noTare", "closeFirst", "zeoVapour", "badPhase", "stillOpen"].map((key) => `${key}:${JSON.stringify(f[key])}`).join(",");
  const TX = `{buttons:${JSON.stringify(T.buttons)},plate:${T.plate},read:${T.read},phase:${JSON.stringify(T.phase)},score:${T.score},feedback:{${plain},start:${f.start},good:${f.good},under:${f.under},over:${f.over}}}`;
  langs[lang] = { plate, title: T.pageTitle, script: `const FIG = ${JSON.stringify(MODEL)};\nconst LANG = "${lang}";\nconst TX = ${TX};\n` + LIVE };
}
writeFigure(HERE, "manifold-charge", langs, CSS);
