// Figure interactive (skill anatomy) : braser deux tubes de cuivre, puis classer les procédés d'assemblage.
// Partie 4, module 6 (imprimé 25), section « Brasage ». Décisions Q97, Q98.
// Deux tubes sur des vés, l'un évasé ; chaque étape fait apparaître ou allume l'organe concerné (décapant, flamme,
// baguette, brasure aspirée dans le jeu). Étapes et situations : figures/_data/brasage.mjs. Rien n'est enregistré.
// Usage : node figures/brasage/build.mjs
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../_kit/iso-kit.mjs";
import * as G from "../_kit/lathe.mjs";
import * as TB from "../_kit/tube.mjs";
import { bench, CONTROLS_CSS, LIVE_HEAD, LIVE_WATCH, writeFigure } from "../_kit/acad-bench.mjs";
import { namespaced } from "../_kit/bundle.mjs";
import { FITTINGS_CSS, waitingButtons } from "../_kit/raccords-live.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const NAME = "brasage";
const AZ = 28, WIDTH = 560, HEIGHT = 340;
const PLATE = { x: -80, y: -40, w: 160, d: 80, r: 8 };
const P = k.fitProjection([...k.boxCorners(PLATE, -15, 0), [-20, -30, 50], [58, 44, 20]], WIDTH, HEIGHT, { pad: 8, azimuth: AZ, elevation: 26 });
const MODULE = namespaced(join(HERE, "..", "_data", "brasage.mjs"), "BR");
const Z = 16;

function scene() {
  const S = (paths, style) => k.solidSvg(paths, style);
  const o = [bench(P, PLATE)];
  const items = [];
  // vés de maintien
  for (const x of [-48, 48]) items.push({ at: [x, 0, 0], svg: S(k.slabOf({ x: x - 7, y: -9, w: 14, d: 18, r: 1 }, 0, Z - 6, P, 3, 0.6), { tone: "lo" }) });
  // tube gauche, emboîté dans l'évasement du tube droit (jeu de brasage)
  const FA = G.frameAlong([-72, 0, Z], [1, 0, 0]);
  items.push({ at: [-35, 0, Z], svg: `<g class="br-part" data-part="tubes">${S(G.solidOf([[0, 6], [80, 6]], FA, P, { steps: 28 }), { tone: "hi" })}</g>` });
  const FB = G.frameAlong([0, 0, Z], [1, 0, 0]);
  items.push({ at: [36, 0, Z], svg: `<g class="br-part" data-part="emboiture">${S(G.solidOf([[0, 7.3], [12, 7.3], [13.5, 6, 1], [72, 6]], FB, P, { steps: 28 }), { tone: "hi" })}</g>` });
  // décapant autour du joint, puis brasure aspirée dans le jeu
  const FJ = G.frameAlong([-7, 0, Z], [1, 0, 0]);
  items.push({ at: [2, 0, Z + 1], svg: `<g class="br-flux" hidden>${S(G.solidOf([[0, 6.6], [7, 6.6], [7, 7.9], [21, 7.9]], FJ, P, { steps: 28 }), { tone: "mid" })}</g>` });
  const FR = G.frameAlong([-1.2, 0, Z], [1, 0, 0]);
  items.push({ at: [0, 0, Z + 2], svg: `<g class="br-fill" hidden>${S(G.solidOf([[0, 6.4], [1.2, 7.6, 1], [2.4, 6.4]], FR, P, { steps: 28 }), { tone: "hi", lit: true })}</g>` });
  // baguette posée sur le joint, côté opposé à la flamme
  const rod = TB.tubePieces([[0, -7.4, Z + 2], [-14, -26, Z + 30]], 0.9, P, { caps: [true, true] });
  items.push({ at: [-6, -16, Z + 16], svg: `<g class="br-rod" hidden>${rod.map((p) => TB.tubeSvg(p, { tone: "mid" })).join("")}</g>` });
  // chalumeau et flamme dirigée sur le joint
  const tip = [6, 11, Z + 2];
  const base = [54, 40, Z + 4];
  const FT = G.frameAlong(base, [tip[0] - base[0], tip[1] - base[1], tip[2] - base[2]]);
  items.push({ at: [28, 16, Z + 10], svg: `<g class="br-torch" hidden>${S(G.solidOf([[0, 4.2], [30, 4.2], [33, 2.6], [50, 1.9], [56, 1.5]], FT, P, { steps: 18 }), { tone: "hi" })}</g>`, front: true });
  const d = [tip[0] - base[0], tip[1] - base[1], tip[2] - base[2]];
  const n = Math.hypot(...d), u = d.map((v) => v / n);
  const at = (s, w) => k.iso([tip[0] + u[0] * s + w * 0.7, tip[1] + u[1] * s - w * 0.7, tip[2] + u[2] * s], P);
  const cone = (len, w) => k.pathOf([at(0, -w), at(len * 0.5, -w * 1.2), at(len, 0), at(len * 0.5, w * 1.2), at(0, w)], true);
  items.push({ at: [6, 16, Z + 8], front: true, svg: `<g class="br-flame" hidden><path class="br-plume" d="${cone(16, 3.6)}"/><path class="br-dart" d="${cone(6, 1.5)}"/></g>` });
  items.sort((a, b) => (a.front ? 1 : 0) - (b.front ? 1 : 0) || k.depthOf(a.at, P) - k.depthOf(b.at, P));
  return o.concat(items.map((i) => i.svg)).join("");
}

const TEXT = {
  fr: {
    title: "Brasage",
    pageTitle: "Braser deux tubes de cuivre et classer les procédés : exercice",
    hint: "Réaliser le brasage dans l'ordre, puis s'entraîner",
    buttons: { do: "Réaliser", quiz: "S'entraîner", restart: "Recommencer", again: "Situation suivante", series: "Nouvelle série" },
    keys: [{ mark: "raised", label: "Tubes sur vés, évasement, décapant, baguette, chalumeau" }, { mark: "lit", label: "Brasure aspirée dans le jeu" }],
    caption: "Brasage : seul le métal d'apport fond ; tendre sous 450 °C, fort au-dessus ; la brasure est aspirée par capillarité dans le jeu, la flamme chauffe le joint et non la baguette. Soudo-brasage : apport au-dessus de 450 °C, bords préparés, joint rempli de proche en proche sans capillarité. Si les pièces fondent, c'est un soudage. Le cuivre fond à 1085 °C. Jamais de flamme sur une conduite contenant du fluide sous pression. Rien n'est enregistré.",
    stageLabel: "Deux tubes de cuivre sur des vés, l'un évasé pour recevoir l'autre ; décapant, baguette et chalumeau apparaissent au fil des étapes. Les actions et les questions sont sous le dessin.",
    svgLabel: "Deux tubes de cuivre emboîtés sur des vés, avec décapant, baguette de brasure, chalumeau et flamme.",
    doPrompt: (n, total) => `Brasage : touchez l'action suivante (étape ${n} sur ${total}).`,
    done: "Joint brasé, décapant lavé à l'eau chaude.",
    stepOk: (label) => `Juste : ${label}`,
    notYet: (label) => `Pas encore : l'étape attendue est « ${label} »`,
    danger: (why) => `Action refusée, dangereuse : ${why}`,
    ask: {
      procede: (t, melt, cap) => `Métal d'apport fondant à ${t} °C, pièces ${melt ? "fondues" : "non fondues"}, ${cap ? "brasure aspirée par capillarité dans le jeu" : "joint rempli de proche en proche, bords préparés"} : quel procédé ?`,
      suivante: (step) => `Après « ${step} », que fait-on ?`,
      precedente: (step) => `Quelle étape vient juste avant « ${step} » ?`,
      erreur: (action) => `Pourquoi est-ce une erreur : « ${action} » ?`,
    },
    procs: { tendre: "Brasage tendre", fort: "Brasage fort", soudo: "Soudo-brasage", soudage: "Soudage" },
    procWhy: "Pièces fondues : soudage. Sinon, apport sous 450 °C : brasage tendre ; au-dessus, avec capillarité : brasage fort ; bords préparés et remplissage de proche en proche : soudo-brasage.",
    right: "Juste.",
    wrong: (a) => `Non : la bonne réponse est « ${a} ».`,
    seriesDone: (g, t) => `Série terminée : ${g} / ${t}. Lancez une nouvelle série pour d'autres situations.`,
    step: (i, n) => `situation ${i} / ${n}`,
    score: (g, t) => `Score de la série : ${g} / ${t}`,
    marks: { right: "Bonne réponse", wrong: "Votre réponse, fausse" },
  },
  en: {
    title: "Brazing",
    pageTitle: "Brazing two copper tubes and classifying joining processes: an exercise",
    hint: "Carry out the brazing in order, then practise",
    buttons: { do: "Carry out", quiz: "Practise", restart: "Start again", again: "Next situation", series: "New series" },
    keys: [{ mark: "raised", label: "Tubes on V-blocks, swaged end, flux, filler rod, torch" }, { mark: "lit", label: "Filler drawn into the gap" }],
    caption: "Brazing: only the filler melts; soft soldering below 450 °C, brazing above; the filler is drawn into the gap by capillary action, and the flame heats the joint, not the rod. Braze welding: filler above 450 °C, prepared edges, joint filled bit by bit without capillary action. If the parts melt, it is welding. Copper melts at 1085 °C. Never a flame on a line containing refrigerant under pressure. Nothing is recorded.",
    stageLabel: "Two copper tubes on V-blocks, one swaged to take the other; flux, filler rod and torch appear step by step. The actions and questions are below the drawing.",
    svgLabel: "Two copper tubes joined on V-blocks, with flux, filler rod, torch and flame.",
    doPrompt: (n, total) => `Brazing: tap the next action (step ${n} of ${total}).`,
    done: "Joint brazed, flux washed off with hot water.",
    stepOk: (label) => `Correct: ${label}`,
    notYet: (label) => `Not yet: the expected step is "${label}"`,
    danger: (why) => `Action refused, dangerous: ${why}`,
    ask: {
      procede: (t, melt, cap) => `Filler melting at ${t} °C, parts ${melt ? "melted" : "not melted"}, ${cap ? "filler drawn into the gap by capillary action" : "joint filled bit by bit, edges prepared"}: which process?`,
      suivante: (step) => `After "${step}", what comes next?`,
      precedente: (step) => `Which step comes just before "${step}"?`,
      erreur: (action) => `Why is this a mistake: "${action}"?`,
    },
    procs: { tendre: "Soft soldering", fort: "Brazing", soudo: "Braze welding", soudage: "Welding" },
    procWhy: "Parts melted: welding. Otherwise, filler below 450 °C: soft soldering; above, with capillary action: brazing; prepared edges and filling bit by bit: braze welding.",
    right: "Correct.",
    wrong: (a) => `No: the right answer is "${a}".`,
    seriesDone: (g, t) => `Series finished: ${g} / ${t}. Start a new series for other situations.`,
    step: (i, n) => `situation ${i} / ${n}`,
    score: (g, t) => `Series score: ${g} / ${t}`,
    marks: { right: "Right answer", wrong: "Your answer, wrong" },
  },
};

const LIVE = LIVE_HEAD(NAME) + `
const CAT = BR.buildBrazing();
const prompt = scope.querySelector(".rc-prompt");
const quizBox = scope.querySelector(".rc-quiz");
const doBox = scope.querySelector(".ms-do");
const actionsBox = scope.querySelector(".ms-actions");
// Les réponses vont dans la liste du mode « S'entraîner », pas dans celle des actions de « Réaliser ».
const optionsBox = scope.querySelector(".rc-quiz .rc-options");
// Un élément SVG n'a pas de propriété hidden : l'attribut se pose et se retire à la main.
const show = (cls, on) => svg.querySelector(cls).toggleAttribute("hidden", !on);
const stepOf = (id) => CAT.steps.find((s) => s.id === id);
const strip = (s) => s.replace(/<[^>]+>/g, "");
const LIT = { nettoyer: "tubes", ebavurer: "tubes", emboutir: "emboiture", placer: "tubes" };
function light(part) { for (const g of svg.querySelectorAll(".br-part")) g.toggleAttribute("data-lit", g.dataset.part === part); }
function reset() { for (const c of [".br-flux", ".br-fill", ".br-rod", ".br-torch", ".br-flame"]) show(c, false); light(null); }
// Dessin après l'étape d : ce qui a été fait reste visible.
function drawStep(d) {
  reset();
  const done = CAT.steps.slice(0, d).map((s) => s.id);
  if (done.includes("decapant") && !done.includes("laver")) show(".br-flux", true);
  if (done.includes("chauffer") && !done.includes("laver")) { show(".br-torch", true); show(".br-flame", true); }
  if (done.includes("braser")) { show(".br-fill", true); if (!done.includes("laver")) show(".br-rod", true); }
  const last = done[done.length - 1];
  if (LIT[last]) light(LIT[last]);
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// ---------------------------------------------------------------- Réaliser
let at = 0;
const pickFrom = (list, n) => list.slice().sort(() => Math.random() - 0.5).slice(0, n);
function actionsFor() {
  const expected = CAT.steps[at];
  const others = pickFrom(CAT.steps.filter((s) => s.id !== expected.id), 2).map((s) => ({ kind: "step", id: s.id, label: s.short[LANG] }));
  const errs = pickFrom(CAT.errors, 1).map((e) => ({ kind: "error", id: e.id, label: e.action[LANG] }));
  return [{ kind: "step", id: expected.id, label: expected.short[LANG] }, ...others, ...errs].sort(() => Math.random() - 0.5);
}
function renderDo() {
  if (at >= CAT.steps.length) { prompt.textContent = TX.done; actionsBox.replaceChildren(); buttons.restart.hidden = false; return; }
  prompt.textContent = TX.doPrompt(at + 1, CAT.steps.length);
  actionsBox.replaceChildren(...actionsFor().map((a) => {
    const b = document.createElement("button"); b.type = "button"; b.textContent = a.label;
    b.addEventListener("click", () => act(a)); return b;
  }));
}
function act(a) {
  const expected = CAT.steps[at];
  if (a.kind === "error") { feedback.textContent = TX.danger(CAT.errors.find((e) => e.id === a.id).why[LANG]); return; }
  if (a.id !== expected.id) { feedback.textContent = TX.notYet(expected.short[LANG]); return; }
  feedback.textContent = TX.stepOk(strip(expected.label[LANG]));
  at++;
  drawStep(at);
  renderDo();
}
function restart() { at = 0; drawStep(0); feedback.textContent = ""; buttons.restart.hidden = true; renderDo(); }
// ---------------------------------------------------------------- S'entraîner
const pool = { 1: [], 2: [], 3: [] };
CAT.situations.forEach((s) => pool[s.level].push(s));
const PLAN = [1, 1, 1, 1, 2, 2, 2, 3, 3, 3];
let list = [], qi = 0, good = 0, answered = false;
function label(s, o) {
  if (s.kind === "procede") return TX.procs[o];
  if (s.kind === "erreur") return CAT.errors.find((e) => e.id === o).why[LANG];
  return stepOf(o).short[LANG];
}
function ask(s) {
  if (s.kind === "procede") return TX.ask.procede(s.filler, s.parts_melt, s.capillary);
  if (s.kind === "erreur") return TX.ask.erreur(CAT.errors.find((e) => e.id === s.error).action[LANG]);
  return TX.ask[s.kind](stepOf(s.from).short[LANG]);
}
function qshow() {
  answered = false;
  const s = list[qi];
  drawStep(s.kind === "procede" ? (s.capillary ? 7 : 0) : s.kind === "erreur" ? 0 : CAT.steps.findIndex((x) => x.id === s.from) + 1);
  prompt.textContent = ask(s);
  optionsBox.replaceChildren(...s.options.slice().sort(() => Math.random() - 0.5).map((o) => {
    const b = document.createElement("button"); b.type = "button"; b.textContent = label(s, o); b._o = o;
    b.addEventListener("click", () => answer(o)); return b;
  }));
  feedback.textContent = "";
  buttons.again.disabled = true;
  scoreEl.textContent = TX.score(good, qi) + " · " + TX.step(qi + 1, list.length);
}
function answer(o) {
  if (answered) return;
  answered = true;
  const s = list[qi], ok = same(o, s.answer);
  if (ok) good++;
  for (const b of optionsBox.children) {
    b.disabled = true;
    if (same(b._o, s.answer)) { b.dataset.state = "right"; b.prepend("✓ "); b.setAttribute("aria-label", TX.marks.right + " : " + b.textContent.slice(2)); }
    else if (same(b._o, o)) { b.dataset.state = "wrong"; b.prepend("✗ "); b.setAttribute("aria-label", TX.marks.wrong + " : " + b.textContent.slice(2)); }
  }
  const why = s.kind === "procede" ? TX.procWhy : s.kind === "erreur" ? "" : strip(stepOf(s.answer).label[LANG]);
  const last = qi === list.length - 1;
  feedback.textContent = [ok ? TX.right : TX.wrong(label(s, s.answer)), why, last ? TX.seriesDone(good, list.length) : ""].filter(Boolean).join(" ");
  buttons.again.disabled = last;
  scoreEl.textContent = TX.score(good, qi + 1) + " · " + TX.step(qi + 1, list.length);
}
function start() {
  list = [];
  for (const level of PLAN) {
    const kinds = {};
    pool[level].forEach((x) => (kinds[x.kind] ||= []).push(x));
    const groups = Object.values(kinds);
    let s;
    for (let i = 0; i < 40; i++) { const g = groups[Math.floor(Math.random() * groups.length)]; s = g[Math.floor(Math.random() * g.length)]; if (!list.includes(s)) break; }
    list.push(s);
  }
  qi = 0; good = 0; qshow();
}
buttons.again.addEventListener("click", () => { if (qi < list.length - 1) { qi++; qshow(); } });
buttons.series.addEventListener("click", start);
buttons.restart.addEventListener("click", restart);
function setMode(m) {
  buttons.do.setAttribute("aria-pressed", m === "do");
  buttons.quiz.setAttribute("aria-pressed", m === "quiz");
  doBox.hidden = m !== "do"; quizBox.hidden = m !== "quiz";
  feedback.textContent = ""; scoreEl.textContent = "";
  if (m === "do") restart(); else start();
}
buttons.do.addEventListener("click", () => setMode("do"));
buttons.quiz.addEventListener("click", () => setMode("quiz"));
for (const b of scope.querySelectorAll(".mv-controls button")) b.disabled = false;
buttons.restart.hidden = true;
const run = () => {};
window.__br = { setMode, answer: (i) => answer(list[qi].options[i]), current: () => list[qi], act: (id) => act(stepOf(id) ? { kind: "step", id } : { kind: "error", id }), state: () => ({ at }) };
setMode("do");
` + LIVE_WATCH;

const langs = {};
for (const lang of ["fr", "en"]) {
  const T = TEXT[lang], B = T.buttons;
  const svg = k.figureSvg({ width: WIDTH, height: HEIGHT, label: T.svgLabel, body: [scene()] });
  const modes = `<div class="mv-controls" role="group" aria-label="${lang === "fr" ? "Mode de la figure" : "Figure mode"}"><button type="button" data-act="do">${B.do}</button><button type="button" data-act="quiz">${B.quiz}</button></div>`;
  const doBox = `<div class="ms-do"><div class="mv-controls rc-options ms-actions" role="group" aria-label="${lang === "fr" ? "Actions possibles" : "Possible actions"}"></div><div class="mv-controls"><button type="button" data-act="restart">${B.restart}</button></div></div>`;
  const quiz = `<div class="rc-quiz" hidden><div class="mv-controls rc-options" role="group" aria-label="${lang === "fr" ? "Réponses proposées" : "Possible answers"}"></div><div class="mv-controls"><button type="button" data-act="again">${B.again}</button><button type="button" data-act="series">${B.series}</button></div></div>`;
  const body = `<div class="iso-stage" role="img" aria-label="${T.stageLabel}">${svg}</div>${modes}<p class="rc-prompt" aria-live="polite"></p>${doBox}${quiz}<p class="mv-feedback" aria-live="polite"></p><p class="mv-score" aria-live="polite"></p>`;
  const plate = waitingButtons(k.plateHtml({ fig: "Fig 11", title: T.title, hint: T.hint, readout: "", keys: T.keys, caption: T.caption, body }));
  const fns = (o) => `{${Object.entries(o).map(([key, f]) => `${JSON.stringify(key)}:${typeof f === "function" ? f : JSON.stringify(f)}`).join(",")}}`;
  const TX = `{doPrompt:${T.doPrompt},done:${JSON.stringify(T.done)},stepOk:${T.stepOk},notYet:${T.notYet},danger:${T.danger},ask:${fns(T.ask)},procs:${JSON.stringify(T.procs)},procWhy:${JSON.stringify(T.procWhy)},right:${JSON.stringify(T.right)},wrong:${T.wrong},seriesDone:${T.seriesDone},step:${T.step},score:${T.score},marks:${JSON.stringify(T.marks)}}`;
  langs[lang] = { plate, title: T.pageTitle, script: `${MODULE}const LANG = "${lang}";\nconst TX = ${TX};\n` + LIVE };
}
writeFigure(HERE, NAME, langs, CONTROLS_CSS + FITTINGS_CSS + `
.ms-do[hidden],.rc-quiz[hidden],.mv-controls button[hidden]{display:none}
.br-part{filter:sepia(.8) saturate(2.4) hue-rotate(-14deg) brightness(1.7)}
[data-theme="light"] .br-part{filter:sepia(1) saturate(4) hue-rotate(-38deg) brightness(.78)}
.br-part[data-lit] .iso-edge{stroke:var(--anatomy-lit);stroke-width:1.6}
.br-flux[hidden],.br-fill[hidden],.br-rod[hidden],.br-torch[hidden],.br-flame[hidden]{display:none}
.br-flux{opacity:.7;filter:sepia(1) saturate(3) brightness(1.6)}
.br-fill{filter:sepia(.6) saturate(1.6) brightness(1.9)}
.br-rod{filter:sepia(.5) saturate(1.4) brightness(1.6)}
.br-torch{filter:sepia(.4) brightness(1.3)}
.br-plume{fill:#3d8bff;opacity:.85}
.br-dart{fill:#ffffff;stroke:#3d8bff;stroke-width:.4}
`);
