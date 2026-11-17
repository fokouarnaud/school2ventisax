// Figure interactive (skill anatomy) : mettre en service puis hors service un poste oxyacétylénique.
// Partie 4, module 5 (imprimé 24), section « Mise en service et hors service ». Décisions Q94, Q95.
// Poste dessiné une fois (bouteilles arrimées, détendeurs, tuyaux bleu et rouge, chalumeau) ; le script allume les
// organes manipulés et la flamme. Procédures et erreurs : figures/_data/mise-en-service.mjs. Rien n'est enregistré.
// Usage : node figures/mise-en-service/build.mjs
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../_kit/iso-kit.mjs";
import * as G from "../_kit/lathe.mjs";
import * as TB from "../_kit/tube.mjs";
import { bench, CONTROLS_CSS, LIVE_HEAD, LIVE_WATCH, writeFigure } from "../_kit/acad-bench.mjs";
import { namespaced } from "../_kit/bundle.mjs";
import { FITTINGS_CSS, waitingButtons } from "../_kit/raccords-live.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const NAME = "mise-en-service";
const AZ = 32, WIDTH = 520, HEIGHT = 400;
const PLATE = { x: -70, y: -70, w: 150, d: 140, r: 8 };
const P = k.fitProjection([...k.boxCorners(PLATE, -15, 0), [-30, 30, 112], [-30, -30, 112]], WIDTH, HEIGHT, { pad: 8, azimuth: AZ, elevation: 24 });
const MODULE = namespaced(join(HERE, "..", "_data", "mise-en-service.mjs"), "MS");

const BOTTLES = { oxygene: [-35, 22], acetylene: [-35, -22] };
const TORCH = { from: [20, 0, 6], to: [62, 0, 6] };

function scene() {
  const S = (paths, style) => k.solidSvg(paths, style);
  const L = (d, style) => k.lineSvg(d, style);
  const o = [bench(P, PLATE)];
  // chariot : sangle d'arrimage commune aux deux bouteilles
  const parts = [];
  for (const [gas, [x, y]] of Object.entries(BOTTLES)) {
    const F = G.frameAlong([x, y, 0], [0, 0, 1]);
    const top = 78;
    const bottle = S(G.solidOf([[0, 15], [top - 14, 15], [top - 8, 12, 1], [top - 2, 6, 1], [top, 4.5]], F, P, { steps: 32 }), { tone: "hi", inner: L(G.arcOf(F, 44, 15, P) + G.arcOf(F, 50, 15, P), { tone: "mid" }) });
    const valve = S(k.cylinder(x, y, 4.6, top, 3.4, P, 20, 0.3), { tone: "mid" });
    const reg = S(k.cylinder(x, y, 6.4, top + 3.4, 9, P, 24, 0.4), { tone: "mid" });
    const dial = S(k.cylinder(x + 5, y, 4.6, top + 12.4, 1.6, P, 20, 0.2), { tone: "lo" });
    const screwF = G.frameAlong([x + 6.4, y, top + 8], [1, 0, 0]);
    const screw = S(G.solidOf([[0, 2.4], [5, 2.4], [5, 3.6], [9, 3.6]], screwF, P, { steps: 18 }), { tone: "hi" });
    parts.push({ at: [x, y, 0], svg: `<g class="ms-bottle" data-gas="${gas}">${bottle}</g><g class="ms-part" data-part="bouteille-${gas}">${valve}</g>${reg}${dial}<g class="ms-part" data-part="vis-${gas}">${screw}</g>` });
    // tuyau du détendeur au chalumeau
    const start = [x + 6.4, y, top + 4];
    const end = [TORCH.from[0], y * 0.12, TORCH.from[2]];
    const route = G.fillet([start, [x + 14, y, top + 4], [x + 22, y, 3], [6, y * 0.5, 3], end], 6, 8);
    parts.push({ at: [x + 20, y, 30], svg: `<g class="ms-hose" data-gas="${gas}">${TB.tubePieces(route, 1.6, P).map((p) => TB.tubeSvg(p)).join("")}</g>` });
  }
  // chalumeau : poignée, deux robinets, lance, buse
  const TF = G.frameAlong(TORCH.from, [1, 0, 0]);
  const torch = S(G.solidOf([[0, 3.2], [16, 3.6], [18, 2.4], [40, 1.6], [42, 1.2]], TF, P, { steps: 20 }), { tone: "hi", inner: L(G.arcOf(TF, 5, 3.3, P) + G.arcOf(TF, 10, 3.5, P), { tone: "faint" }) });
  const knob = (gas, yOff) => `<g class="ms-part" data-part="chalumeau-${gas}">${S(k.cylinder(TORCH.from[0] + 14, yOff, 2.2, TORCH.from[2] + 2.6, 3, P, 16, 0.2), { tone: "mid" })}</g>`;
  parts.push({ at: [40, 0, 6], svg: torch + knob("acetylene", -3.4) + knob("oxygene", 3.4) });
  // flamme au bout de la lance : dard et panache, cachés tant que le chalumeau n'est pas allumé
  const tip = TORCH.to;
  const cone = (len, w) => k.pathOf([0, 0.5, 1].flatMap((s) => []).concat([[tip[0], tip[1] - w, tip[2]], [tip[0] + len, tip[1], tip[2]], [tip[0], tip[1] + w, tip[2]], [tip[0], tip[1], tip[2] + w]].map((p) => k.iso(p, P))), true);
  parts.push({ at: [70, 0, 6], svg: `<g class="ms-flame" hidden><path class="ms-plume" d="${cone(28, 5)}"/><path class="ms-dart" d="${cone(8, 2)}"/></g>` });
  parts.sort((a, b) => k.depthOf(a.at, P) - k.depthOf(b.at, P));
  return o.concat(parts.map((p) => p.svg)).join("");
}

const TEXT = {
  fr: {
    title: "Mise en service",
    pageTitle: "Mettre en service et hors service un poste oxyacétylénique : exercice",
    hint: "Réaliser la procédure dans l'ordre, puis s'entraîner",
    buttons: { do: "Réaliser", quiz: "S'entraîner", restart: "Recommencer", again: "Situation suivante", series: "Nouvelle série" },
    keys: [{ mark: "raised", label: "Bouteilles arrimées, détendeurs, tuyaux bleu (oxygène) et rouge (acétylène), chalumeau" }, { mark: "lit", label: "Organe manipulé" }],
    caption: "Mise en service : vis de détente desserrées, raccorder ; ouvrir lentement les bouteilles ; régler l'oxygène, puis l'acétylène sans dépasser ses limites ; purger chaque tuyau loin de toute flamme ; ouvrir l'acétylène du chalumeau, allumer, puis l'oxygène. Mise hors service : fermer l'acétylène du chalumeau, puis l'oxygène, fermer les bouteilles, purger et desserrer les vis. En mode « Réaliser », touchez les actions dans l'ordre ; une action hors ordre ou dangereuse est refusée et expliquée. Rien n'est enregistré.",
    stageLabel: "Poste oxyacétylénique : bouteilles d'oxygène et d'acétylène arrimées, détendeurs, tuyaux bleu et rouge, chalumeau. Les actions et les questions sont sous le dessin.",
    svgLabel: "Poste oxyacétylénique avec ses deux bouteilles, ses détendeurs, ses tuyaux et son chalumeau.",
    phase: { start: "Mise en service", stop: "Mise hors service" },
    doPrompt: (phase, n, total) => `${phase} : touchez l'action suivante (étape ${n} sur ${total}).`,
    doneStart: "Poste en service, flamme allumée. Passez à la mise hors service.",
    doneStop: "Poste hors service : chalumeau fermé, bouteilles fermées, tuyaux purgés, vis desserrées.",
    stepOk: (label) => `Juste : ${label}`,
    notYet: (label) => `Pas encore : l'étape attendue est « ${label} »`,
    danger: (why) => `Action refusée, dangereuse : ${why}`,
    ask: {
      suivante: (phase, step) => `${phase} : après « ${step} », que fait-on ?`,
      precedente: (phase, step) => `${phase} : quelle étape vient juste avant « ${step} » ?`,
      erreur: (action) => `Pourquoi est-ce une erreur : « ${action} » ?`,
      tuyau: (gas) => `De quelle couleur est le tuyau ${gas === "oxygene" ? "de l'oxygène" : "de l'acétylène"} ?`,
      tenue: (what) => ({ soudage: "Inclinaison du chalumeau par rapport à la pièce, dans le sens de soudage ?", inverse: "Inclinaison du chalumeau pour la soudure en position inverse ?", apport: "Inclinaison du métal d'apport ?" })[what],
    },
    colours: { bleu: "Bleu", rouge: "Rouge", vert: "Vert", jaune: "Jaune" },
    angles: { "30": "Environ 30°", "45": "Environ 45°", "50-70": "50° à 70°", "90": "90°" },
    hoseWhy: "Tuyau bleu pour l'oxygène, rouge pour l'acétylène.",
    angleWhy: "Chalumeau à 50° à 70° dans le sens de soudage, environ 45° en position inverse, métal d'apport à environ 45°.",
    right: "Juste.",
    wrong: (a) => `Non : la bonne réponse est « ${a} ».`,
    done: (g, t) => `Série terminée : ${g} / ${t}. Lancez une nouvelle série pour d'autres situations.`,
    step: (i, n) => `situation ${i} / ${n}`,
    score: (g, t) => `Score de la série : ${g} / ${t}`,
    marks: { right: "Bonne réponse", wrong: "Votre réponse, fausse" },
  },
  en: {
    title: "Starting up",
    pageTitle: "Starting up and shutting down an oxy-acetylene set: an exercise",
    hint: "Carry out the procedure in order, then practise",
    buttons: { do: "Carry out", quiz: "Practise", restart: "Start again", again: "Next situation", series: "New series" },
    keys: [{ mark: "raised", label: "Secured cylinders, regulators, blue (oxygen) and red (acetylene) hoses, torch" }, { mark: "lit", label: "Part being handled" }],
    caption: "Start-up: screws backed off, connect; open the cylinders slowly; set the oxygen, then the acetylene within its limits; purge each hose away from any flame; open the torch acetylene, light, then the oxygen. Shut-down: close the torch acetylene, then the oxygen, close the cylinders, purge and back off the screws. In Carry out mode, tap the actions in order; an action out of order or a dangerous one is refused and explained. Nothing is recorded.",
    stageLabel: "Oxy-acetylene set: secured oxygen and acetylene cylinders, regulators, blue and red hoses, torch. The actions and questions are below the drawing.",
    svgLabel: "Oxy-acetylene set with its two cylinders, regulators, hoses and torch.",
    phase: { start: "Start-up", stop: "Shut-down" },
    doPrompt: (phase, n, total) => `${phase}: tap the next action (step ${n} of ${total}).`,
    doneStart: "Set started, flame lit. Now shut it down.",
    doneStop: "Set shut down: torch closed, cylinders closed, hoses purged, screws backed off.",
    stepOk: (label) => `Correct: ${label}`,
    notYet: (label) => `Not yet: the expected step is "${label}"`,
    danger: (why) => `Action refused, dangerous: ${why}`,
    ask: {
      suivante: (phase, step) => `${phase}: after "${step}", what comes next?`,
      precedente: (phase, step) => `${phase}: which step comes just before "${step}"?`,
      erreur: (action) => `Why is this a mistake: "${action}"?`,
      tuyau: (gas) => `What colour is the ${gas === "oxygene" ? "oxygen" : "acetylene"} hose?`,
      tenue: (what) => ({ soudage: "Angle of the torch to the work, in the welding direction?", inverse: "Angle of the torch when welding the other way?", apport: "Angle of the filler rod?" })[what],
    },
    colours: { bleu: "Blue", rouge: "Red", vert: "Green", jaune: "Yellow" },
    angles: { "30": "About 30°", "45": "About 45°", "50-70": "50° to 70°", "90": "90°" },
    hoseWhy: "Blue hose for oxygen, red for acetylene.",
    angleWhy: "Torch at 50° to 70° in the welding direction, about 45° when welding the other way, filler rod at about 45°.",
    right: "Correct.",
    wrong: (a) => `No: the right answer is "${a}".`,
    done: (g, t) => `Series finished: ${g} / ${t}. Start a new series for other situations.`,
    step: (i, n) => `situation ${i} / ${n}`,
    score: (g, t) => `Series score: ${g} / ${t}`,
    marks: { right: "Right answer", wrong: "Your answer, wrong" },
  },
};

const LIVE = LIVE_HEAD(NAME) + `
const CAT = MS.buildStartup();
const prompt = scope.querySelector(".rc-prompt");
const quizBox = scope.querySelector(".rc-quiz");
const doBox = scope.querySelector(".ms-do");
const actionsBox = scope.querySelector(".ms-actions");
// Les réponses vont dans la liste du mode « S'entraîner », pas dans celle des actions de « Réaliser ».
const optionsBox = scope.querySelector(".rc-quiz .rc-options");
const flame = svg.querySelector(".ms-flame");
// Un élément SVG n'a pas de propriété hidden : l'attribut se pose et se retire à la main.
const showFlame = (on) => flame.toggleAttribute("hidden", !on);
const stepOf = (id) => [...CAT.procedures.start, ...CAT.procedures.stop].find((s) => s.id === id);
// Organes allumés à chaque étape.
const PARTS = {
  raccorder: ["vis-oxygene", "vis-acetylene"], "ouvrir-bouteilles": ["bouteille-oxygene", "bouteille-acetylene"],
  "regler-oxygene": ["vis-oxygene"], "regler-acetylene": ["vis-acetylene"], purger: ["chalumeau-oxygene", "chalumeau-acetylene"],
  allumer: ["chalumeau-acetylene", "chalumeau-oxygene"], "fermer-acetylene": ["chalumeau-acetylene"], "fermer-oxygene": ["chalumeau-oxygene"],
  "fermer-bouteilles": ["bouteille-oxygene", "bouteille-acetylene"], "purger-desserrer": ["vis-oxygene", "vis-acetylene"],
};
function light(ids) { for (const g of svg.querySelectorAll(".ms-part")) g.toggleAttribute("data-lit", ids.includes(g.dataset.part)); }
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// ---------------------------------------------------------------- Réaliser
let phase = "start", at = 0;
// Quatre actions à la fois, lisibles sur un téléphone : l'étape attendue, deux autres étapes de la procédure et une
// action dangereuse liée à cette phase.
const pickFrom = (list, n) => list.slice().sort(() => Math.random() - 0.5).slice(0, n);
function actionsFor() {
  const list = CAT.procedures[phase];
  const expected = list[at];
  const others = pickFrom(list.filter((s) => s.id !== expected.id), 2).map((s) => ({ kind: "step", id: s.id, label: s.short[LANG] }));
  const errs = pickFrom(CAT.errors.filter((e) => list.some((s) => s.id === e.step)), 1).map((e) => ({ kind: "error", id: e.id, label: e.action[LANG] }));
  return [{ kind: "step", id: expected.id, label: expected.short[LANG] }, ...others, ...errs].sort(() => Math.random() - 0.5);
}
function renderDo() {
  const list = CAT.procedures[phase];
  if (at >= list.length) {
    prompt.textContent = phase === "start" ? TX.doneStart : TX.doneStop;
    showFlame(phase === "start");
    if (phase === "start") { phase = "stop"; at = 0; setTimeout(renderDo, 900); }
    else { actionsBox.replaceChildren(); buttons.restart.hidden = false; }
    return;
  }
  prompt.textContent = TX.doPrompt(TX.phase[phase], at + 1, list.length);
  actionsBox.replaceChildren(...actionsFor().map((a) => {
    const b = document.createElement("button"); b.type = "button"; b.textContent = a.label;
    b.addEventListener("click", () => act(a)); return b;
  }));
}
function act(a) {
  const list = CAT.procedures[phase];
  const expected = list[at];
  if (a.kind === "error") { feedback.textContent = TX.danger(CAT.errors.find((e) => e.id === a.id).why[LANG]); return; }
  if (a.id !== expected.id) { feedback.textContent = TX.notYet(expected.short[LANG]); return; }
  feedback.textContent = TX.stepOk(expected.label[LANG]);
  light(PARTS[expected.id] || []);
  if (expected.id === "allumer") showFlame(true);
  if (expected.id === "fermer-acetylene") showFlame(false);
  at++;
  renderDo();
}
function restart() { phase = "start"; at = 0; showFlame(false); light([]); feedback.textContent = ""; buttons.restart.hidden = true; renderDo(); }
// ---------------------------------------------------------------- S'entraîner
const pool = { 1: [], 2: [], 3: [] };
CAT.situations.forEach((s) => pool[s.level].push(s));
const PLAN = [1, 1, 1, 1, 2, 2, 2, 3, 3, 3];
let list = [], qi = 0, good = 0, answered = false;
function label(s, o) {
  if (s.kind === "suivante" || s.kind === "precedente") return stepOf(o).short[LANG];
  if (s.kind === "erreur") return CAT.errors.find((e) => e.id === o).why[LANG];
  if (s.kind === "tuyau") return TX.colours[o];
  return TX.angles[o];
}
function ask(s) {
  if (s.kind === "suivante" || s.kind === "precedente") return TX.ask[s.kind](TX.phase[s.procedure], stepOf(s.from).short[LANG]);
  if (s.kind === "erreur") return TX.ask.erreur(CAT.errors.find((e) => e.id === s.error).action[LANG]);
  if (s.kind === "tuyau") return TX.ask.tuyau(s.gas);
  return TX.ask.tenue(s.what);
}
function explain(s) {
  if (s.kind === "suivante" || s.kind === "precedente") return stepOf(s.answer).label[LANG];
  if (s.kind === "tuyau") return TX.hoseWhy;
  if (s.kind === "tenue") return TX.angleWhy;
  return "";
}
function show() {
  answered = false;
  const s = list[qi];
  showFlame(false);
  light(s.kind === "suivante" || s.kind === "precedente" ? PARTS[s.from] || [] : s.kind === "erreur" ? PARTS[CAT.errors.find((e) => e.id === s.error).step] || [] : []);
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
  if (s.kind === "suivante" || s.kind === "precedente") light(PARTS[s.answer] || []);
  const last = qi === list.length - 1;
  feedback.textContent = [ok ? TX.right : TX.wrong(label(s, s.answer)), explain(s), last ? TX.done(good, list.length) : ""].filter(Boolean).join(" ");
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
  qi = 0; good = 0; show();
}
buttons.again.addEventListener("click", () => { if (qi < list.length - 1) { qi++; show(); } });
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
window.__ms = { setMode, answer: (i) => answer(list[qi].options[i]), current: () => list[qi], act: (id) => { const s = stepOf(id); if (s) act({ kind: "step", id }); else act({ kind: "error", id }); }, state: () => ({ phase, at }) };
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
  const plate = waitingButtons(k.plateHtml({ fig: "Fig 7", title: T.title, hint: T.hint, readout: "", keys: T.keys, caption: T.caption, body }));
  const fns = (o) => `{${Object.entries(o).map(([key, f]) => `${JSON.stringify(key)}:${typeof f === "function" ? f : JSON.stringify(f)}`).join(",")}}`;
  const TX = `{phase:${JSON.stringify(T.phase)},doPrompt:${T.doPrompt},doneStart:${JSON.stringify(T.doneStart)},doneStop:${JSON.stringify(T.doneStop)},stepOk:${T.stepOk},notYet:${T.notYet},danger:${T.danger},ask:${fns(T.ask)},colours:${JSON.stringify(T.colours)},angles:${JSON.stringify(T.angles)},hoseWhy:${JSON.stringify(T.hoseWhy)},angleWhy:${JSON.stringify(T.angleWhy)},right:${JSON.stringify(T.right)},wrong:${T.wrong},done:${T.done},step:${T.step},score:${T.score},marks:${JSON.stringify(T.marks)}}`;
  langs[lang] = { plate, title: T.pageTitle, script: `${MODULE}const LANG = "${lang}";\nconst TX = ${TX};\n` + LIVE };
}
writeFigure(HERE, NAME, langs, CONTROLS_CSS + FITTINGS_CSS + `
.ms-do[hidden],.rc-quiz[hidden],.mv-controls button[hidden]{display:none}
.ms-part[data-lit] .iso-edge{stroke:var(--anatomy-lit);stroke-width:1.6}
.ms-hose[data-gas="oxygene"]{filter:sepia(1) saturate(4) hue-rotate(170deg)}
.ms-hose[data-gas="acetylene"]{filter:sepia(1) saturate(5) hue-rotate(-50deg)}
.ms-bottle[data-gas="oxygene"]{filter:brightness(1.1)}
.ms-bottle[data-gas="acetylene"]{filter:sepia(1) saturate(3) hue-rotate(-50deg) brightness(.85)}
.ms-flame[hidden]{display:none}
.ms-plume{fill:#3d8bff;opacity:.85}
.ms-dart{fill:#ffffff;stroke:#3d8bff;stroke-width:.4}
`);
