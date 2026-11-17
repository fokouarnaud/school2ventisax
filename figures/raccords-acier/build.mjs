// Figure interactive (skill anatomy) : les 7 raccords acier à visser, vus seuls puis montés, comparés, reconnus.
// Partie 4, module 2 (imprimé 21), section « Acier, PVC, mixtes ». Décisions Q101 à Q103.
// Les raccords sont dessinés dans le navigateur (kit lathe, tube, raccords-draw, raccords-acier-draw) à partir du
// catalogue figures/_data/raccords-acier.mjs. Rien n'est enregistré (Q73).
// Usage : node figures/raccords-acier/build.mjs
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../_kit/iso-kit.mjs";
import { bench, CONTROLS_CSS, LIVE_HEAD, LIVE_WATCH, writeFigure } from "../_kit/acad-bench.mjs";
import { namespaced } from "../_kit/bundle.mjs";
import { FITTINGS_CSS, waitingButtons } from "../_kit/raccords-live.mjs";
import { FITTINGS, ORDER, FUNCTIONS } from "../_data/raccords-acier.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const NAME = "raccords-acier";
const KIT = join(HERE, "..", "_kit");
const AZ = 120, WIDTH = 680, HEIGHT = 360;
const PLATE = { x: -70, y: -38, w: 140, d: 76, r: 8 };
const P = k.fitProjection([...k.boxCorners(PLATE, -15, 0), [-62, 0, 48], [62, 0, 48], [0, 34, 48], [0, -20, 48]], WIDTH, HEIGHT, { pad: 14, azimuth: AZ, elevation: 30 });
const MODULES =
  namespaced(join(KIT, "lathe.mjs"), "G") +
  namespaced(join(KIT, "tube.mjs"), "TB") +
  namespaced(join(KIT, "raccords-draw.mjs"), "D") +
  namespaced(join(KIT, "raccords-acier-draw.mjs"), "SA") +
  namespaced(join(HERE, "..", "_data", "raccords-acier.mjs"), "AC");

const TEXT = {
  fr: {
    title: "Raccords acier à visser",
    pageTitle: "Les 7 raccords acier à visser : différences, montage et reconnaissance",
    hint: "Voir chaque raccord seul puis monté, comparer, puis reconnaître",
    buttons: { explore: "Explorer", compare: "Comparer", quiz: "Reconnaître", prev: "Précédent", next: "Suivant", mounted: "Voir monté", alone: "Voir seul", again: "Situation suivante", series: "Nouvelle série" },
    keys: [{ mark: "raised", label: "Raccord en acier : corps, filetages, six pans" }, { mark: "lit", label: "Repères : M mâle (filet extérieur), F femelle (filet intérieur)" }],
    caption: "Mâle : filetage à l'extérieur ; femelle : filetage à l'intérieur ; on assemble toujours un mâle avec un femelle. Manchon F/F pour prolonger, mamelon M/M pour relier deux femelles, réduction pour changer de diamètre, coude pour changer de direction, union 3 pièces pour pouvoir démonter, té pour dériver, bouchon ou capuchon pour fermer. Ces raccords filetés servent aux tuyauteries d'eau ou d'acier galvanisé, jamais au circuit frigorifique. Rien n'est enregistré.",
    stageLabel: "Raccord acier dessiné en perspective sur un établi, seul avec ses repères mâle et femelle, ou monté sur ses tubes. Les explications et les questions sont sous le dessin.",
    svgLabel: "Établi et raccord acier à visser dessiné en perspective.",
    compareTitle: "Les 7 raccords côte à côte : touchez-en un pour le voir.",
    labels: { threads: "Filetage", function: "Fonction", feature: "Particularité" },
    tour: (i, n, view) => `raccord ${i} / ${n} · ${view}`,
    views: { alone: "seul, repères M et F", mounted: "monté" },
    unionKey: "1 et 3 : embouts ; 2 : écrou libre.",
    ask: {
      nom: "Comment s'appelle ce raccord ?",
      fonction: (fn) => `Quel raccord sert à : ${fn.toLowerCase()} ?`,
      filetage: "Quels filetages a ce raccord ?",
      particularite: (f) => `Quel raccord se reconnaît à ceci : ${f.toLowerCase()} ?`,
      situation: (c) => `${c} Quel raccord ?`,
    },
    right: "Juste.",
    wrong: (a) => `Non : la bonne réponse est « ${a} ».`,
    done: (g, t) => `Série terminée : ${g} / ${t}. Lancez une nouvelle série pour d'autres situations.`,
    step: (i, n) => `situation ${i} / ${n}`,
    score: (g, t) => `Score de la série : ${g} / ${t}`,
    marks: { right: "Bonne réponse", wrong: "Votre réponse, fausse" },
  },
  en: {
    title: "Threaded steel fittings",
    pageTitle: "The 7 threaded steel fittings: differences, fitting and recognition",
    hint: "See each fitting alone then fitted, compare, then recognise",
    buttons: { explore: "Explore", compare: "Compare", quiz: "Recognise", prev: "Previous", next: "Next", mounted: "Show fitted", alone: "Show alone", again: "Next situation", series: "New series" },
    keys: [{ mark: "raised", label: "Steel fitting: body, threads, hexagon" }, { mark: "lit", label: "Marks: M male (outside thread), F female (inside thread)" }],
    caption: "Male: thread on the outside; female: thread on the inside; a male always goes into a female. Coupling F/F to extend, hex nipple M/M to join two female ports, reducer (bush) to change diameter, elbow to change direction, 3-piece union to stay removable, tee to branch, plug or cap to close. These threaded fittings are for water or galvanised steel pipework, never for the refrigerant circuit. Nothing is recorded.",
    stageLabel: "Steel fitting drawn in perspective on a workbench, alone with its male and female marks, or fitted on its pipes. The explanations and questions are below the drawing.",
    svgLabel: "Workbench and threaded steel fitting drawn in perspective.",
    compareTitle: "The 7 fittings side by side: tap one to see it.",
    labels: { threads: "Thread", function: "Function", feature: "Key feature" },
    tour: (i, n, view) => `fitting ${i} / ${n} · ${view}`,
    views: { alone: "alone, M and F marks", mounted: "fitted" },
    unionKey: "1 and 3: tailpieces; 2: loose nut.",
    ask: {
      nom: "What is this fitting called?",
      fonction: (fn) => `Which fitting is used to: ${fn.toLowerCase()}?`,
      filetage: "What threads does this fitting have?",
      particularite: (f) => `Which fitting is recognised by this: ${f.toLowerCase()}?`,
      situation: (c) => `${c} Which fitting?`,
    },
    right: "Correct.",
    wrong: (a) => `No: the right answer is "${a}".`,
    done: (g, t) => `Series finished: ${g} / ${t}. Start a new series for other situations.`,
    step: (i, n) => `situation ${i} / ${n}`,
    score: (g, t) => `Series score: ${g} / ${t}`,
    marks: { right: "Right answer", wrong: "Your answer, wrong" },
  },
};

const LIVE = LIVE_HEAD(NAME) + `
const K = { iso, pathOf, depthOf, solidSvg, lineSvg, haloOf, cylinder };
const SD = SA.makeSteelDraw(K, G, TB, D);
const CAT = AC.buildSteelFittings();
const F = CAT.fittings;
const live = svg.querySelector(".rc-live");
const prompt = scope.querySelector(".rc-prompt");
const quizBox = scope.querySelector(".rc-quiz");
const compareBox = scope.querySelector(".ra-compare");
// Les réponses vont dans la liste du mode « Reconnaître ».
const optionsBox = scope.querySelector(".rc-quiz .rc-options");
let mode = "explore", at = 0, mounted = false;
function paint(key, asMounted) { live.innerHTML = key ? SD.scene(key, PROJ, { mounted: asMounted }) : ""; }
function card(key) {
  const f = F[key];
  return [f.name[LANG] + ".", f.threadsLabel[LANG] + ".", f.functionLabel[LANG] + ".", f.detail[LANG], key === "union" && !mounted ? TX.unionKey : ""].filter(Boolean).join(" ");
}
function showTour() {
  const key = CAT.order[at];
  paint(key, mounted);
  prompt.textContent = TX.tour(at + 1, CAT.order.length, mounted ? TX.views.mounted : TX.views.alone);
  readout.textContent = F[key].name[LANG];
  feedback.textContent = card(key);
  buttons.mounted.textContent = mounted ? TX.buttons.alone : TX.buttons.mounted;
  buttons.mounted.setAttribute("aria-pressed", mounted);
}
// ---------------------------------------------------------------- Reconnaître
const pool = { 1: [], 2: [], 3: [] };
CAT.situations.forEach((s) => pool[s.level].push(s));
const PLAN = [1, 1, 1, 1, 2, 2, 2, 3, 3, 3];
let list = [], qi = 0, good = 0, answered = false;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const label = (s, o) => (s.kind === "filetage" ? F[o].threadsLabel[LANG] : F[o].name[LANG]);
function ask(s) {
  const f = F[s.fitting || s.answer];
  if (s.kind === "fonction") return TX.ask.fonction(f.functionLabel[LANG]);
  if (s.kind === "particularite") return TX.ask.particularite(f.feature[LANG]);
  if (s.kind === "situation") return TX.ask.situation(CAT.cases[s.case].ask[LANG]);
  return TX.ask[s.kind];
}
function qshow() {
  answered = false;
  const s = list[qi];
  // Nom et filetage : le raccord est dessiné ; sinon il n'apparaît qu'à la correction.
  paint(s.kind === "nom" || s.kind === "filetage" ? s.fitting : null, false);
  readout.textContent = "";
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
  // Correction dessinée : le bon raccord, monté pour une situation d'atelier.
  paint(s.answer, s.kind === "situation");
  readout.textContent = F[s.answer].name[LANG];
  const last = qi === list.length - 1;
  feedback.textContent = [ok ? TX.right : TX.wrong(label(s, s.answer)), F[s.answer].name[LANG] + ". " + F[s.answer].detail[LANG], last ? TX.done(good, list.length) : ""].filter(Boolean).join(" ");
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
// ---------------------------------------------------------------- Comparer
for (const b of compareBox.querySelectorAll("button[data-fit]")) b.addEventListener("click", () => {
  for (const o of compareBox.querySelectorAll("button[data-fit]")) o.setAttribute("aria-pressed", o === b);
  paint(b.dataset.fit, false);
  readout.textContent = F[b.dataset.fit].name[LANG];
  feedback.textContent = card(b.dataset.fit);
});
function setMode(next) {
  mode = next;
  for (const m of ["explore", "compare", "quiz"]) buttons[m].setAttribute("aria-pressed", m === mode);
  for (const act of ["prev", "next", "mounted"]) buttons[act].hidden = mode !== "explore";
  quizBox.hidden = mode !== "quiz";
  compareBox.hidden = mode !== "compare";
  scoreEl.textContent = ""; feedback.textContent = ""; prompt.textContent = "";
  if (mode === "explore") showTour();
  else if (mode === "compare") compareBox.querySelector("button[data-fit]").click();
  else start();
}
buttons.explore.addEventListener("click", () => setMode("explore"));
buttons.compare.addEventListener("click", () => setMode("compare"));
buttons.quiz.addEventListener("click", () => setMode("quiz"));
buttons.prev.addEventListener("click", () => { at = (at + CAT.order.length - 1) % CAT.order.length; showTour(); });
buttons.next.addEventListener("click", () => { at = (at + 1) % CAT.order.length; showTour(); });
buttons.mounted.addEventListener("click", () => { mounted = !mounted; showTour(); });
for (const b of scope.querySelectorAll(".mv-controls button, .ra-compare button")) b.disabled = false;
const run = () => {};
window.__ra = { setMode, show: (i, m) => { at = i; mounted = !!m; showTour(); }, answer: (i) => answer(list[qi].options[i]), current: () => list[qi] };
setMode("explore");
` + LIVE_WATCH;

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const langs = {};
for (const lang of ["fr", "en"]) {
  const T = TEXT[lang], B = T.buttons;
  const svg = k.figureSvg({ width: WIDTH, height: HEIGHT, label: T.svgLabel, body: [bench(P, PLATE), `<g class="rc-live"></g>`] });
  const controls = `<div class="mv-controls" role="group" aria-label="${lang === "fr" ? "Mode de la figure" : "Figure mode"}"><button type="button" data-act="explore">${B.explore}</button><button type="button" data-act="compare">${B.compare}</button><button type="button" data-act="quiz">${B.quiz}</button><button type="button" data-act="prev">${B.prev}</button><button type="button" data-act="next">${B.next}</button><button type="button" data-act="mounted" aria-pressed="false">${B.mounted}</button></div>`;
  const cards = ORDER.map((key) => {
    const f = FITTINGS[key];
    return `<li><button type="button" data-fit="${key}" aria-pressed="false"><strong>${esc(f.name[lang])}</strong><span><em>${T.labels.threads}</em> ${esc(f.threadsLabel[lang])}</span><span><em>${T.labels.function}</em> ${esc(FUNCTIONS[f.function][lang])}</span><span><em>${T.labels.feature}</em> ${esc(f.feature[lang])}</span></button></li>`;
  }).join("");
  const compare = `<div class="ra-compare" hidden><p>${T.compareTitle}</p><ul>${cards}</ul></div>`;
  const quiz = `<div class="rc-quiz" hidden><div class="mv-controls rc-options" role="group" aria-label="${lang === "fr" ? "Réponses proposées" : "Possible answers"}"></div><div class="mv-controls"><button type="button" data-act="again">${B.again}</button><button type="button" data-act="series">${B.series}</button></div></div>`;
  const body = `<div class="iso-stage" role="img" aria-label="${T.stageLabel}">${svg}</div>${controls}<p class="rc-prompt" aria-live="polite"></p>${compare}${quiz}<p class="mv-feedback" aria-live="polite"></p><p class="mv-score" aria-live="polite"></p>`;
  const plate = waitingButtons(k.plateHtml({ fig: "Fig 2b", title: T.title, hint: T.hint, readout: "", keys: T.keys, caption: T.caption, body }));
  const fns = (o) => `{${Object.entries(o).map(([key, f]) => `${JSON.stringify(key)}:${typeof f === "function" ? f : JSON.stringify(f)}`).join(",")}}`;
  const TX = `{buttons:${JSON.stringify(B)},tour:${T.tour},views:${JSON.stringify(T.views)},unionKey:${JSON.stringify(T.unionKey)},ask:${fns(T.ask)},right:${JSON.stringify(T.right)},wrong:${T.wrong},done:${T.done},step:${T.step},score:${T.score},marks:${JSON.stringify(T.marks)}}`;
  langs[lang] = { plate, title: T.pageTitle, script: `${MODULES}const LANG = "${lang}";\nconst PROJ = ${JSON.stringify(P)};\nconst TX = ${TX};\n` + LIVE };
}
writeFigure(HERE, NAME, langs, CONTROLS_CSS + FITTINGS_CSS + `
.ra-compare[hidden]{display:none}
.iso g[data-tint="acier"]{filter:brightness(2.4)}
.iso[data-theme="light"] g[data-tint="acier"]{filter:brightness(1.15)}
.ra-compare p{margin:14px 0 8px;color:var(--anatomy-muted);font-size:13px}
.ra-compare ul{list-style:none;margin:0;padding:0;display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(210px,1fr))}
.ra-compare button{width:100%;text-align:left;display:flex;flex-direction:column;gap:4px;padding:10px 12px;min-height:44px;border-radius:14px;border:1px solid var(--anatomy-mid);background:var(--anatomy-card);color:var(--anatomy-text);font:12px/1.4 var(--anatomy-sans,system-ui);cursor:pointer}
.ra-compare button[aria-pressed="true"]{border-color:var(--anatomy-lit);box-shadow:inset 0 0 0 1px var(--anatomy-lit)}
.ra-compare button:focus-visible{outline:2px solid var(--anatomy-hi);outline-offset:2px}
.ra-compare strong{color:var(--anatomy-strong);font-size:13px}
.ra-compare em{font-style:normal;color:var(--anatomy-muted);font:10px/1 var(--anatomy-mono);text-transform:uppercase;letter-spacing:.05em;margin-right:4px}
`);
