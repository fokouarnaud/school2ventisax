// Figure interactive (skill anatomy) : les raccords frigorifiques dudgeon, vus seuls puis montés, comparés, reconnus.
// Partie 4, module 2 (imprimé 21), section « Cuivre et laiton ». Décisions Q104 à Q106.
// Dessin : figures/_kit/raccords-flare-draw.mjs ; fiches et situations : figures/_data/raccords-flare.mjs ;
// figure assemblée par figures/_kit/fittings-cards.mjs. Rien n'est enregistré (Q73).
// Usage : node figures/raccords-flare/build.mjs
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../_kit/iso-kit.mjs";
import { buildCardFigure } from "../_kit/fittings-cards.mjs";
import * as data from "../_data/raccords-flare.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const AZ = 120, WIDTH = 680, HEIGHT = 360;
const PLATE = { x: -60, y: -32, w: 120, d: 64, r: 8 };
const P = k.fitProjection([...k.boxCorners(PLATE, -15, 0), [-52, 0, 44], [52, 0, 44], [0, 30, 44], [0, -18, 44]], WIDTH, HEIGHT, { pad: 14, azimuth: AZ, elevation: 30 });

const TEXT = {
  fr: {
    title: "Raccords dudgeon",
    pageTitle: "Les raccords frigorifiques dudgeon : différences, montage et reconnaissance",
    hint: "Voir chaque raccord seul puis monté, comparer, puis reconnaître",
    buttons: { explore: "Explorer", compare: "Comparer", quiz: "Reconnaître", prev: "Précédent", next: "Suivant", mounted: "Voir monté", alone: "Voir seul", again: "Situation suivante", series: "Nouvelle série" },
    keys: [{ mark: "raised", label: "Raccord en laiton : cônes filetés, six pans, écrous" }, { mark: "lit", label: "Repères : M cône mâle, F écrou femelle, V valve à obus" }],
    caption: "Raccord dudgeon : le tube de cuivre est évasé, l'écrou (femelle) plaque la surface évasée sur le cône fileté (mâle). L'étanchéité vient du contact des deux cônes, jamais d'un ruban ou de filasse. L'écrou s'enfile avant d'évaser ; on serre avec deux clés, l'une en contre-clé. Le té de prise de pression porte une valve à obus que le flexible du manifold ouvre en se vissant ; un bouchon à joint la referme. Rien n'est enregistré.",
    stageLabel: "Raccord frigorifique dudgeon dessiné en perspective sur un établi, seul avec ses repères, ou monté sur ses tubes évasés. Les explications et les questions sont sous le dessin.",
    svgLabel: "Établi et raccord frigorifique dudgeon dessiné en perspective.",
    compareTitle: "Les 5 raccords côte à côte : touchez-en un pour le voir.",
    labels: { threads: "Filetage", function: "Fonction", feature: "Particularité" },
    tour: (i, n, view) => `raccord ${i} / ${n} · ${view}`,
    views: { alone: "seul, repères", mounted: "monté" },
    notes: { te: "V : valve à obus, ici fermée par son bouchon." },
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
    title: "Flare fittings",
    pageTitle: "Refrigeration flare fittings: differences, fitting and recognition",
    hint: "See each fitting alone then fitted, compare, then recognise",
    buttons: { explore: "Explore", compare: "Compare", quiz: "Recognise", prev: "Previous", next: "Next", mounted: "Show fitted", alone: "Show alone", again: "Next situation", series: "New series" },
    keys: [{ mark: "raised", label: "Brass fitting: threaded cones, hexagons, nuts" }, { mark: "lit", label: "Marks: M male cone, F female nut, V valve core" }],
    caption: "Flare fitting (<span lang=\"fr\">dudgeon</span>): the copper tube is flared, and the nut (female) presses the flared face onto the threaded cone (male). The seal comes from the two cones in contact, never from tape or hemp. The nut goes on before flaring; tighten with two spanners, one as a backup. The access tee carries a valve core that the manifold hose opens as it is screwed on; a sealed cap closes it again. Nothing is recorded.",
    stageLabel: "Refrigeration flare fitting drawn in perspective on a workbench, alone with its marks, or fitted on its flared tubes. The explanations and questions are below the drawing.",
    svgLabel: "Workbench and refrigeration flare fitting drawn in perspective.",
    compareTitle: "The 5 fittings side by side: tap one to see it.",
    labels: { threads: "Thread", function: "Function", feature: "Key feature" },
    tour: (i, n, view) => `fitting ${i} / ${n} · ${view}`,
    views: { alone: "alone, marks", mounted: "fitted" },
    notes: { te: "V: valve core, closed here by its cap." },
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
  here: HERE, name: "raccords-flare", fig: "Fig 2a", P, PLATE, WIDTH, HEIGHT, TEXT, data,
  drawFile: join(HERE, "..", "_kit", "raccords-flare-draw.mjs"),
  dataFile: join(HERE, "..", "_data", "raccords-flare.mjs"),
  css: `
.iso g[data-tint="laiton"]{filter:sepia(.9) saturate(1.7) hue-rotate(8deg) brightness(2.3)}
.iso g[data-tint="flexible"]{filter:sepia(1) saturate(3) hue-rotate(185deg) brightness(1.6)}
.iso[data-theme="light"] g[data-tint="flexible"]{filter:sepia(1) saturate(4) hue-rotate(185deg) brightness(.9)}
`,
});
