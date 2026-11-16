// Figure interactive (skill anatomy) : choisir le raccord qui relie les bouts de tube donnés.
// Partie 4, module 2 (imprimé 21), Complément « Choisir un raccord ». Décisions Q76, Q78, Q79, Q85.
// Les tubes présentés sont dessinés, numérotés ; après la réponse, le bon raccord se monte entre eux.
// Usage : node figures/choix-raccord/build.mjs
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../_kit/iso-kit.mjs";
import { bench, CONTROLS_CSS, LIVE_HEAD, LIVE_WATCH, writeFigure } from "../_kit/acad-bench.mjs";
import { FITTINGS_CSS, FITTINGS_LIVE, fittingsScript, waitingButtons } from "../_kit/raccords-live.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const NAME = "choix-raccord";
const AZ = 32, WIDTH = 680, HEIGHT = 420;
const PLATE = { x: -112, y: -100, w: 224, d: 200, r: 8 };
const P = k.fitProjection([...k.boxCorners(PLATE, -15, 0), [-60, -60, 56], [60, 60, 56], [-60, 60, 56], [60, -60, 56]], WIDTH, HEIGHT, { pad: 14, azimuth: AZ, elevation: 30 });

const TEXT = {
  fr: {
    title: "Choisir un raccord",
    pageTitle: "Choisir un raccord : exercice",
    hint: "Lire les bouts de tube et la contrainte, choisir le raccord",
    buttons: { again: "Situation suivante", series: "Nouvelle série" },
    keys: [
      { mark: "raised", label: "Bouts de tube ou orifices de vanne, numérotés" },
      { mark: "lit", label: "Raccord monté après la réponse" },
    ],
    caption: "Partir des bouts à relier : leur matériau et leur diamètre donnent le raccord ; leur extrémité donne le genre (un tube évasé porte un écrou femelle et demande un raccord mâle, un orifice mâle demande un raccord femelle) ; la contrainte donne le mode d'assemblage (permanent : braser ; flamme interdite : sertir ; démontable : dudgeon). Chaque série tire 10 situations réelles, de la plus simple à la plus difficile, parmi plus de 1 000 ; rien n'est enregistré.",
    stageLabel: "Bouts de tube numérotés posés au-dessus d'un établi, à relier par un raccord. La question et les réponses sont sous le dessin.",
    svgLabel: "Établi, bouts de tube à relier et, après la réponse, le raccord monté.",
    ask: (constraint, ends, geometry) => `Contrainte : ${constraint}. Relier ${ends}, ${geometry}. Quel raccord ?`,
    end: (i, tube, present) => `bout ${i} (${tube}, ${present})`,
    join: (list) => list.slice(0, -1).join(", ") + " et " + list.at(-1),
    right: "Juste.",
    wrong: (answer) => `Non : il faut « ${answer} ».`,
    why: {
      material: (m) => `Le raccord doit être du même matériau et de la même série que les tubes : ${m}.`,
      mode: (c, m) => `La contrainte (${c}) impose le mode d'assemblage : ${m}.`,
      shape: (g) => `La forme ne convient pas : les bouts se relient ${g}.`,
      size: (s) => `Les diamètres ne correspondent pas : il faut ${s}.`,
      gender: "Les genres sont inversés : on assemble toujours un mâle avec un femelle.",
    },
    done: (g, t) => `Série terminée : ${g} / ${t}. Lancez une nouvelle série pour d'autres situations.`,
    step: (i, n) => `situation ${i} / ${n}`,
    score: (g, t) => `Score de la série : ${g} / ${t}`,
    marks: { right: "Bonne réponse", wrong: "Votre réponse, fausse" },
  },
  en: {
    title: "Choosing a fitting",
    pageTitle: "Choosing a fitting: an exercise",
    hint: "Read the pipe ends and the constraint, choose the fitting",
    buttons: { again: "Next situation", series: "New series" },
    keys: [
      { mark: "raised", label: "Pipe ends or valve ports, numbered" },
      { mark: "lit", label: "Fitting fitted after the answer" },
    ],
    caption: "Start from the ends to be joined: their material and diameter give the fitting; their end gives the gender (a flared pipe carries a female nut and needs a male fitting, a male port needs a female fitting); the constraint gives the joining method (permanent: brazing; no flame: press fitting; removable: flare). Each series draws 10 real situations, from the simplest to the hardest, out of more than 1,000; nothing is recorded.",
    stageLabel: "Numbered pipe ends above a workbench, to be joined by a fitting. The question and the answers are below the drawing.",
    svgLabel: "Workbench, pipe ends to be joined and, after the answer, the fitting in place.",
    ask: (constraint, ends, geometry) => `Constraint: ${constraint}. Join ${ends}, ${geometry}. Which fitting?`,
    end: (i, tube, present) => `end ${i} (${tube}, ${present})`,
    join: (list) => list.slice(0, -1).join(", ") + " and " + list.at(-1),
    right: "Correct.",
    wrong: (answer) => `No: it takes "${answer}".`,
    why: {
      material: (m) => `The fitting must be the same material and series as the pipes: ${m}.`,
      mode: (c, m) => `The constraint (${c}) sets the joining method: ${m}.`,
      shape: (g) => `The shape does not fit: the ends are joined ${g}.`,
      size: (s) => `The diameters do not match: it takes ${s}.`,
      gender: "The genders are the wrong way round: a male always goes with a female.",
    },
    done: (g, t) => `Series finished: ${g} / ${t}. Start a new series for other situations.`,
    step: (i, n) => `situation ${i} / ${n}`,
    score: (g, t) => `Series score: ${g} / ${t}`,
    marks: { right: "Right answer", wrong: "Your answer, wrong" },
  },
};

const LIVE = LIVE_HEAD(NAME) + FITTINGS_LIVE + `
const pool = byLevel(CAT.situations["choix-raccord"]);
const tags = ["1", "2", "3"];
const presentsOf = (s) => s.ends.map((e) => e.present);
function reason(s, o) {
  const a = s.answer;
  if (o.material !== a.material) return TX.why.material(R.MATERIALS[a.material].label[LANG]);
  if (o.mode !== a.mode) return TX.why.mode(X.CONSTRAINT[s.constraint], R.MODES[a.mode][LANG]);
  if (o.type !== a.type || o.angle !== a.angle) return TX.why.shape(X.GEOMETRY[s.geometry]);
  if (!same(o.sizes, a.sizes)) return TX.why.size(X.sizesLabel(a.material, a.sizes));
  return TX.why.gender;
}
const series = makeSeries(pool, {
  show(s) {
    paint(s.answer, { fitting: false, presents: presentsOf(s), tags });
    const ends = s.ends.map((e, i) => TX.end(i + 1, X.tubeLabel(e), X.PRESENT[e.present]));
    prompt.textContent = TX.ask(X.CONSTRAINT[s.constraint], TX.join(ends), X.GEOMETRY[s.geometry]);
    readout.textContent = X.CONSTRAINT[s.constraint];
  },
  label: (s, o) => X.fittingLabel(o),
  explain: (s, o, ok) => (ok ? "" : reason(s, o)),
  after(s) { paint(s.answer, { fitting: true, presents: presentsOf(s), tags }); },
});
const run = () => {};
window.__cr = { series };
quizBox.hidden = false;
ready();
series.start();
` + LIVE_WATCH;

const langs = {};
for (const lang of ["fr", "en"]) {
  const T = TEXT[lang], B = T.buttons;
  const svg = k.figureSvg({ width: WIDTH, height: HEIGHT, label: T.svgLabel, body: [bench(P, PLATE), `<g class="rc-live"></g>`] });
  const quiz = `<div class="rc-quiz"><div class="mv-controls rc-options" role="group" aria-label="${lang === "fr" ? "Raccords proposés" : "Fittings offered"}"></div><div class="mv-controls"><button type="button" data-act="again">${B.again}</button><button type="button" data-act="series">${B.series}</button></div></div>`;
  const body = `<div class="iso-stage" role="img" aria-label="${T.stageLabel}">${svg}</div><p class="rc-prompt" aria-live="polite"></p>${quiz}<p class="mv-feedback" aria-live="polite"></p><p class="mv-score" aria-live="polite"></p>`;
  const plate = k.plateHtml({ fig: "Fig 3", title: T.title, hint: T.hint, readout: "", keys: T.keys, caption: T.caption, body });
  const why = T.why;
  const TX = `{ask:${T.ask},end:${T.end},join:${T.join},right:${JSON.stringify(T.right)},wrong:${T.wrong},why:{material:${why.material},mode:${why.mode},shape:${why.shape},size:${why.size},gender:${JSON.stringify(why.gender)}},done:${T.done},step:${T.step},score:${T.score},marks:${JSON.stringify(T.marks)}}`;
  langs[lang] = { plate: waitingButtons(plate), title: T.pageTitle, script: fittingsScript({ lang, P, TX }) + LIVE };
}
writeFigure(HERE, NAME, langs, CONTROLS_CSS + FITTINGS_CSS);
