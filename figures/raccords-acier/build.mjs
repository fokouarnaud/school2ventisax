// Figure interactive (skill anatomy) : les 7 raccords acier à visser, vus seuls puis montés, comparés, reconnus.
// Partie 4, module 2 (imprimé 21), section « Acier, PVC, mixtes ». Décisions Q101 à Q103.
// Dessin : figures/_kit/raccords-acier-draw.mjs ; fiches et situations : figures/_data/raccords-acier.mjs ;
// figure assemblée par figures/_kit/fittings-cards.mjs. Rien n'est enregistré (Q73).
// Usage : node figures/raccords-acier/build.mjs
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../_kit/iso-kit.mjs";
import { buildCardFigure } from "../_kit/fittings-cards.mjs";
import * as data from "../_data/raccords-acier.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const AZ = 120, WIDTH = 680, HEIGHT = 360;
const PLATE = { x: -70, y: -38, w: 140, d: 76, r: 8 };
const P = k.fitProjection([...k.boxCorners(PLATE, -15, 0), [-62, 0, 48], [62, 0, 48], [0, 34, 48], [0, -20, 48]], WIDTH, HEIGHT, { pad: 14, azimuth: AZ, elevation: 30 });

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
    notes: { union: "1 et 3 : embouts ; 2 : écrou libre." },
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
    notes: { union: "1 and 3: tailpieces; 2: loose nut." },
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

buildCardFigure({
  here: HERE, name: "raccords-acier", fig: "Fig 2b", P, PLATE, WIDTH, HEIGHT, TEXT, data,
  drawFile: join(HERE, "..", "_kit", "raccords-acier-draw.mjs"),
  dataFile: join(HERE, "..", "_data", "raccords-acier.mjs"),
});
