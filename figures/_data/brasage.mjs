// Situations de la figure `brasage` (Partie 4, module 6, « Soudo-brasage et brasage » ; Q97, Q98).
// Étapes recopiées mot pour mot des 8 conditions de la section « Brasage » (fr et en) ; gestes dangereux tirés du même
// texte ; procédés classés avec les seuils du module (450 °C, cuivre 1085 °C). Rien en base (Q73).

const L = (fr, en) => ({ fr, en });

export const STEPS = [
  { id: "nettoyer", label: L("Nettoyer la surface des joints à abraser, à l'aide du tissu à polir ou de brosses spéciales.", "Clean the joint surfaces to be abraded, with polishing cloth or special brushes."), short: L("Nettoyer les surfaces", "Clean the surfaces") },
  { id: "ebavurer", label: L("Ébavurer la coupe pour arrondir les arêtes.", "Deburr the cut to round the edges."), short: L("Ébavurer la coupe", "Deburr the cut") },
  { id: "emboutir", label: L("Pour des pièces de même diamètre, effectuer un évasement cylindrique sur l'un des deux tubes, en fonction du sens de passage du fluide.", "For parts of the same diameter, swage (<span lang=\"fr\">emboutir</span>) one of the two tubes, according to the direction of flow."), short: L("Évaser l'un des tubes", "Swage one tube") },
  { id: "decapant", label: L("Enduire les parties à assembler avec le décapant correspondant à l'alliage, en quantité juste suffisante.", "Coat the parts to be joined with the flux that suits the alloy, in just enough quantity."), short: L("Enduire de décapant", "Coat with flux") },
  { id: "placer", label: L("Placer les pièces dans leur position définitive.", "Place the parts in their final position."), short: L("Placer les pièces", "Place the parts") },
  { id: "chauffer", label: L("Régler la flamme et chauffer la pièce.", "Adjust the flame and heat the part."), short: L("Régler la flamme, chauffer", "Adjust the flame, heat") },
  { id: "braser", label: L("Dès la fusion du décapant, poser aussitôt la pointe de la baguette (brasure) sur le joint. La brasure fondue est aspirée par capillarité dans le jeu entre les pièces : la flamme chauffe le joint et non la baguette.", "As soon as the flux melts, touch the tip of the filler rod to the joint. The molten filler is drawn by capillary action into the gap between the parts: the flame heats the joint, not the rod."), short: L("Poser la baguette sur le joint", "Touch the rod to the joint") },
  { id: "laver", label: L("Éliminer les résidus de décapant par un lavage à l'eau, chaude de préférence, afin d'éviter un refroidissement trop rapide.", "Remove flux residue by washing with water, preferably hot, to avoid cooling too quickly."), short: L("Laver à l'eau chaude", "Wash with hot water") },
];

export const ERRORS = [
  { id: "sous-pression", step: "chauffer", action: L("Chauffer une conduite qui contient du fluide frigorigène sous pression", "Heat a line that contains refrigerant under pressure"), why: L("Il ne faut jamais chauffer une conduite contenant du fluide frigorigène sous pression : risque d'explosion et de décomposition du fluide.", "Never heat a line containing refrigerant under pressure: risk of explosion and of decomposition of the refrigerant.") },
  { id: "chauffer-baguette", step: "braser", action: L("Chauffer la baguette pour la faire couler sur le joint", "Heat the rod to make it run onto the joint"), why: L("La flamme chauffe le joint et non la baguette : c'est le joint chaud qui aspire la brasure par capillarité.", "The flame heats the joint, not the rod: the hot joint draws the filler in by capillary action.") },
  { id: "trop-tot", step: "braser", action: L("Poser la baguette avant que le décapant ait fondu", "Touch the rod before the flux has melted"), why: L("La baguette se pose dès la fusion du décapant, pas avant : le joint n'est pas encore à température.", "The rod is applied as soon as the flux melts, not before: the joint is not yet hot enough.") },
  { id: "trop-decapant", step: "decapant", action: L("Enduire largement de décapant, pour être sûr", "Coat generously with flux, to be safe"), why: L("Le décapant s'applique en quantité juste suffisante.", "Flux is applied in just enough quantity.") },
  { id: "eau-froide", step: "laver", action: L("Refroidir le joint brusquement à l'eau froide", "Cool the joint suddenly with cold water"), why: L("Le lavage se fait à l'eau, chaude de préférence, pour éviter un refroidissement trop rapide.", "Washing is done with water, preferably hot, to avoid cooling too quickly.") },
  { id: "sans-ebavurer", step: "ebavurer", action: L("Assembler la coupe telle quelle, sans l'ébavurer", "Join the cut as it is, without deburring"), why: L("La coupe s'ébavure pour arrondir les arêtes.", "The cut is deburred to round the edges.") },
  { id: "sans-nettoyer", step: "nettoyer", action: L("Braser sans nettoyer les surfaces", "Braze without cleaning the surfaces"), why: L("Les surfaces des joints se nettoient au tissu à polir ou à la brosse avant tout.", "The joint surfaces are cleaned with polishing cloth or brushes first.") },
];

export const THRESHOLDS = { tendre: 450, cuivre: 1085 };

const rotate = (list, n) => [...list.slice(n % list.length), ...list.slice(0, n % list.length)];

export function buildBrazing() {
  const out = [];
  const push = (kind, level, rest) => out.push({ key: `${kind}|${JSON.stringify(rest)}`, level, kind, ...rest });
  const procs = ["tendre", "fort", "soudo", "soudage"];
  for (let filler = 150; filler <= 1050; filler += 20) {
    if (filler === THRESHOLDS.tendre) continue;
    if (filler < THRESHOLDS.tendre) {
      push("procede", 1, { filler, parts_melt: false, capillary: true, edges: false, answer: "tendre", options: procs });
    } else {
      push("procede", 1, { filler, parts_melt: false, capillary: true, edges: false, answer: "fort", options: procs });
      push("procede", 2, { filler, parts_melt: false, capillary: false, edges: true, answer: "soudo", options: procs });
      push("procede", 2, { filler, parts_melt: true, capillary: false, edges: true, answer: "soudage", options: procs });
    }
  }
  const ids = STEPS.map((s) => s.id);
  ids.forEach((id, i) => {
    const others = (exclude) => rotate(ids.filter((x) => !exclude.includes(x)), i).slice(0, 3);
    if (i < ids.length - 1) push("suivante", 1, { from: id, answer: ids[i + 1], options: [ids[i + 1], ...others([id, ids[i + 1]])].sort() });
    if (i > 0) push("precedente", 2, { from: id, answer: ids[i - 1], options: [ids[i - 1], ...others([id, ids[i - 1]])].sort() });
  });
  ERRORS.forEach((e, i) => {
    const others = rotate(ERRORS.filter((x) => x.id !== e.id), i).slice(0, 3).map((x) => x.id);
    push("erreur", 3, { error: e.id, answer: e.id, options: [e.id, ...others].sort() });
  });
  return { steps: STEPS, errors: ERRORS, thresholds: THRESHOLDS, situations: out };
}
