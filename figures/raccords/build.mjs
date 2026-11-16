// Figure interactive (skill anatomy) : les raccords du frigoriste, à explorer puis à reconnaître.
// Partie 4, module 2 (imprimé 21), section « Cuivre et laiton ». Décisions Q73 à Q79, Q85.
// Chaque raccord est dessiné dans le navigateur à partir du catalogue figures/_data/raccords.mjs (aucune donnée en base).
// Usage : node figures/raccords/build.mjs
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../_kit/iso-kit.mjs";
import { bench, CONTROLS_CSS, LIVE_HEAD, LIVE_WATCH, writeFigure } from "../_kit/acad-bench.mjs";
import { FITTINGS_CSS, FITTINGS_LIVE, fittingsScript } from "../_kit/raccords-live.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const NAME = "raccords";
const AZ = 32, WIDTH = 680, HEIGHT = 400;
const PLATE = { x: -85, y: -62, w: 170, d: 140, r: 8 };
const P = k.fitProjection([...k.boxCorners(PLATE, -15, 0), [-40, -40, 58], [40, 40, 58], [-40, 40, 58], [40, -40, 58]], WIDTH, HEIGHT, { pad: 16, azimuth: AZ, elevation: 30 });

// Raccords de la visite guidée (mode « Explorer ») : un exemple réel de chaque forme et de chaque assemblage.
const TOUR = [
  { material: "cuivre-pouce", mode: "braser", type: "manchon", sizes: ["1/2", "1/2"], ends: ["F", "F"], angle: null },
  { material: "cuivre-pouce", mode: "braser", type: "reduction", sizes: ["1/2", "1/4"], ends: ["F", "F"], angle: null },
  { material: "cuivre-pouce", mode: "braser", type: "coude", sizes: ["3/8", "3/8"], ends: ["F", "F"], angle: 90 },
  { material: "cuivre-pouce", mode: "sertir", type: "coude", sizes: ["5/8", "5/8"], ends: ["F", "F"], angle: 45 },
  { material: "cuivre-pouce", mode: "braser", type: "coude", sizes: ["3/8", "3/8"], ends: ["F", "F"], angle: 180 },
  { material: "cuivre-pouce", mode: "braser", type: "te", sizes: ["5/8", "5/8", "3/8"], ends: ["F", "F", "F"], angle: null },
  { material: "cuivre-pouce", mode: "dudgeon", type: "manchon", sizes: ["3/8", "3/8"], ends: ["M", "M"], angle: null },
  { material: "cuivre-pouce", mode: "dudgeon", type: "coude", sizes: ["1/4", "1/4"], ends: ["M", "F"], angle: 90 },
  { material: "cuivre-pouce", mode: "dudgeon", type: "coude", sizes: ["1/4", "1/4"], ends: ["M", "M"], angle: 135 },
  { material: "cuivre-pouce", mode: "dudgeon", type: "te", sizes: ["1/4", "1/4", "1/4"], ends: ["M", "M", "F"], angle: null },
  { material: "acier", mode: "filete", type: "coude", sizes: ["DN20", "DN20"], ends: ["M", "F"], angle: 90 },
  { material: "pvc", mode: "coller", type: "te", sizes: ["32", "32", "20"], ends: ["F", "F", "F"], angle: null },
  { material: "gaine", mode: "emboiter", type: "manchon", sizes: ["20", "20"], ends: ["F", "F"], angle: null },
];

const TEXT = {
  fr: {
    title: "Les raccords",
    pageTitle: "Les raccords du frigoriste : explorer et reconnaître",
    hint: "Explorer la gamme, puis reconnaître le raccord dessiné",
    buttons: { explore: "Explorer", quiz: "Reconnaître", prev: "Précédent", next: "Suivant", again: "Situation suivante", series: "Nouvelle série" },
    prompts: { nom: "Comment s'appelle ce raccord ?", fonction: "À quoi sert ce raccord ?", assemblage: "Comment ce raccord s'assemble-t-il ?", materiau: "En quel matériau est ce raccord ?" },
    keys: [
      { mark: "raised", label: "Raccord : corps, emboîtures, filetages, écrous" },
      { mark: "lit", label: "Repère gravé : diamètres du raccord" },
    ],
    caption: "Un raccord se reconnaît à sa forme (manchon, réduction, coude, té), à ses extrémités (emboîture à braser, à sertir ou à coller, filetage mâle, écrou ou taraudage femelle) et à son matériau. Les coudes courants sont à 45°, 90° et 180° ; le laiton à visser existe aussi à 135°. En mode « Reconnaître », chaque série tire 10 raccords réels, du plus simple au plus difficile, parmi plus de 3 000 situations ; rien n'est enregistré.",
    stageLabel: "Raccord dessiné en perspective au-dessus d'un établi. Explorez la gamme ou répondez à la question posée sous le dessin.",
    svgLabel: "Établi et raccord du frigoriste dessiné en perspective.",
    mark: (s) => `repère ${s}`,
    explain: (name, fn, mode, mat) => `${name} : ${fn.toLowerCase()}. ${mode}. ${mat}.`,
    right: "Juste.",
    wrong: (answer) => `Non : la bonne réponse est « ${answer} ».`,
    done: (g, t) => `Série terminée : ${g} / ${t}. Lancez une nouvelle série pour d'autres raccords.`,
    step: (i, n) => `situation ${i} / ${n}`,
    score: (g, t) => `Score de la série : ${g} / ${t}`,
    tour: (i, n) => `raccord ${i} / ${n}`,
    marks: { right: "Bonne réponse", wrong: "Votre réponse, fausse" },
  },
  en: {
    title: "Fittings",
    pageTitle: "Refrigeration fittings: explore and recognise",
    hint: "Explore the range, then recognise the fitting drawn",
    buttons: { explore: "Explore", quiz: "Recognise", prev: "Previous", next: "Next", again: "Next situation", series: "New series" },
    prompts: { nom: "What is this fitting called?", fonction: "What is this fitting for?", assemblage: "How is this fitting joined?", materiau: "What material is this fitting?" },
    keys: [
      { mark: "raised", label: "Fitting: body, sockets, threads, nuts" },
      { mark: "lit", label: "Engraved mark: diameters of the fitting" },
    ],
    caption: "A fitting is recognised by its shape (coupling, reducer, elbow, tee), its ends (brazed, press or solvent-weld socket, male thread, female nut or thread) and its material. Common elbows are 45°, 90° and 180°; threaded brass also comes at 135°. In Recognise mode, each series draws 10 real fittings, from the simplest to the hardest, out of more than 3,000 situations; nothing is recorded.",
    stageLabel: "Fitting drawn in perspective above a workbench. Explore the range or answer the question below the drawing.",
    svgLabel: "Workbench and refrigeration fitting drawn in perspective.",
    mark: (s) => `mark ${s}`,
    explain: (name, fn, mode, mat) => `${name}: ${fn.toLowerCase()}. ${mode}. ${mat}.`,
    right: "Correct.",
    wrong: (answer) => `No: the right answer is "${answer}".`,
    done: (g, t) => `Series finished: ${g} / ${t}. Start a new series for other fittings.`,
    step: (i, n) => `situation ${i} / ${n}`,
    score: (g, t) => `Series score: ${g} / ${t}`,
    tour: (i, n) => `fitting ${i} / ${n}`,
    marks: { right: "Right answer", wrong: "Your answer, wrong" },
  },
};

function buildFigure(lang) {
  const o = [bench(P, PLATE), `<g class="rc-live"></g>`];
  return k.figureSvg({ width: WIDTH, height: HEIGHT, label: TEXT[lang].svgLabel, body: o });
}

const LIVE = LIVE_HEAD(NAME) + FITTINGS_LIVE + `
const tour = FIG.tour;
let mode = "explore", at = 0;
const pool = byLevel(CAT.situations.raccords);
const optionLabel = (s, o) => ({
  nom: () => X.nameLabel(o, s.fitting.mode),
  fonction: () => R.FUNCTIONS[o][LANG],
  assemblage: () => R.MODES[o][LANG],
  materiau: () => R.MATERIALS[o].label[LANG],
})[s.kind]();
function explain(f) {
  const name = X.nameLabel(f, f.mode);
  const fn = R.FUNCTIONS[{ manchon: "prolonger", reduction: "changer-diametre", coude: "changer-direction", te: "deriver" }[f.type]][LANG];
  return TX.explain(name, fn, R.MODES[f.mode][LANG], R.MATERIALS[f.material].label[LANG]);
}
function showFitting(f) {
  paint(f, { fitting: true });
  readout.textContent = TX.mark(X.sizesLabel(f.material, f.sizes));
}
function showTour() {
  const f = tour[at];
  showFitting(f);
  prompt.textContent = TX.tour(at + 1, tour.length);
  feedback.textContent = explain(f);
}
const series = makeSeries(pool, {
  show(s) { showFitting(s.fitting); prompt.textContent = TX.prompts[s.kind]; },
  label: optionLabel,
  explain: (s) => explain(s.fitting),
});
function setMode(next) {
  mode = next;
  buttons.explore.setAttribute("aria-pressed", mode === "explore");
  buttons.quiz.setAttribute("aria-pressed", mode === "quiz");
  for (const act of ["prev", "next"]) buttons[act].hidden = mode !== "explore";
  quizBox.hidden = mode !== "quiz";
  if (mode === "explore") { scoreEl.textContent = ""; showTour(); } else series.start();
}
buttons.explore.addEventListener("click", () => setMode("explore"));
buttons.quiz.addEventListener("click", () => setMode("quiz"));
buttons.prev.addEventListener("click", () => { at = (at + tour.length - 1) % tour.length; showTour(); });
buttons.next.addEventListener("click", () => { at = (at + 1) % tour.length; showTour(); });
const run = () => {};
window.__rc = { setMode, series, show: (i) => { at = i; showTour(); } };
setMode("explore");
` + LIVE_WATCH;

const langs = {};
for (const lang of ["fr", "en"]) {
  const T = TEXT[lang], B = T.buttons;
  const controls = `<div class="mv-controls" role="group" aria-label="${lang === "fr" ? "Mode de la figure" : "Figure mode"}"><button type="button" data-act="explore">${B.explore}</button><button type="button" data-act="quiz">${B.quiz}</button><button type="button" data-act="prev">${B.prev}</button><button type="button" data-act="next">${B.next}</button></div>`;
  const quiz = `<div class="rc-quiz" hidden><div class="mv-controls rc-options" role="group" aria-label="${lang === "fr" ? "Réponses proposées" : "Possible answers"}"></div><div class="mv-controls"><button type="button" data-act="again">${B.again}</button><button type="button" data-act="series">${B.series}</button></div></div>`;
  const body = `<div class="iso-stage" role="img" aria-label="${T.stageLabel}">${buildFigure(lang)}</div><p class="rc-prompt" aria-live="polite"></p>${controls}${quiz}<p class="mv-feedback" aria-live="polite"></p><p class="mv-score" aria-live="polite"></p>`;
  const plate = k.plateHtml({ fig: "Fig 2", title: T.title, hint: T.hint, readout: "", keys: T.keys, caption: T.caption, body });
  const TX = `{prompts:${JSON.stringify(T.prompts)},mark:${T.mark},explain:${T.explain},right:${JSON.stringify(T.right)},wrong:${T.wrong},done:${T.done},step:${T.step},score:${T.score},tour:${T.tour},marks:${JSON.stringify(T.marks)}}`;
  langs[lang] = { plate, title: T.pageTitle, script: fittingsScript({ lang, P, TX, extra: { tour: TOUR } }) + LIVE };
}
writeFigure(HERE, NAME, langs, CONTROLS_CSS + FITTINGS_CSS);
