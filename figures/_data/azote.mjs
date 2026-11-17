// Situations du mode « S'entraîner » de la figure `brasage-azote` (Partie 4, module 7, « Brasage sous azote » ; Q99).
// Étapes recopiées mot pour mot du mode opératoire (fr et en) ; plages, débit et notions tirés des sections
// « Rappels » et « Mise en œuvre ». Chaque notion porte la phrase source (`source`) qui justifie la bonne réponse,
// vérifiée par courses/tests/test_nitrogen.py. Bonne réponse en premier dans `options`. Rien en base (Q73).

const L = (fr, en) => ({ fr, en });

export const STEPS = [
  { id: "preparer", label: L("Préparer et assembler les éléments à braser.", "Prepare and assemble the parts to be brazed."), short: L("Préparer et assembler", "Prepare and assemble") },
  { id: "voies", label: L("Disposer d'une voie d'entrée et de sortie de l'azote sur la maquette à braser.", "Provide a nitrogen inlet and outlet on the assembly."), short: L("Prévoir l'entrée et la sortie d'azote", "Provide nitrogen inlet and outlet") },
  { id: "flexible", label: L("Connecter le flexible de la bouteille d'azote, équipée d'un manodétendeur, à l'entrée prévue sur la maquette.", "Connect the hose from the nitrogen cylinder, fitted with a regulator (<span lang=\"fr\">manodétendeur</span>), to the inlet on the assembly."), short: L("Brancher le flexible d'azote", "Connect the nitrogen hose") },
  { id: "regler-azote", label: L("Régler le manodétendeur à basse pression, entre 0,2 et 0,5 bar, pour obtenir le débit prévu.", "Set the regulator to a low pressure, between 0.2 and 0.5 bar, to obtain the planned flow."), short: L("Régler l'azote à basse pression", "Set the nitrogen to low pressure") },
  { id: "balayer", label: L("Faire passer l'azote dans la tuyauterie avant toute chauffe, le temps de chasser l'air.", "Pass nitrogen through the pipework before any heating, long enough to drive out the air."), short: L("Balayer pour chasser l'air", "Purge to drive out the air") },
  { id: "acetylene", label: L("Ouvrir et régler le manodétendeur de l'acétylène (entre 0,2 et 0,5 bar).", "Open and set the acetylene regulator (between 0.2 and 0.5 bar)."), short: L("Régler l'acétylène", "Set the acetylene") },
  { id: "oxygene", label: L("Ouvrir et régler le manodétendeur de l'oxygène (entre 0,5 et 1,5 bar).", "Open and set the oxygen regulator (between 0.5 and 1.5 bar)."), short: L("Régler l'oxygène", "Set the oxygen") },
  { id: "allumer", label: L("Allumer le chalumeau et régler la flamme.", "Light the torch and adjust the flame."), short: L("Allumer, régler la flamme", "Light, adjust the flame") },
  { id: "braser", label: L("Braser.", "Braze."), short: L("Braser", "Braze") },
  { id: "refroidir", label: L("Maintenir le balayage d'azote pendant le refroidissement du joint.", "Keep up the oxygen-free nitrogen purge while the joint cools."), short: L("Maintenir l'azote au refroidissement", "Keep the nitrogen on while cooling") },
];

export const RANGES = { azote: [0.2, 0.5], acetylene: [0.2, 0.5], oxygene: [0.5, 1.5] };

export const NOTIONS = {
  calamine: {
    level: 1,
    ask: L("Qu'est-ce que la calamine ?", "What is scale?"),
    source: L("La calamine** est une couche d'oxyde produite à la surface des métaux soumis à de hautes températures.", "Scale** (<span lang=\"fr\">calamine</span>) is an oxide layer produced on metals at high temperatures."),
    options: [L("Une couche d'oxyde formée à haute température", "An oxide layer formed at high temperature"), L("Un dépôt de brasure en excès", "A deposit of excess filler"), L("Un résidu de décapant brûlé", "Burnt flux residue"), L("Un alliage d'apport à bas point de fusion", "A low-melting filler alloy")],
  },
  cause: {
    level: 2,
    ask: L("D'où vient la calamine à l'intérieur du tube ?", "Where does the scale inside the tube come from?"),
    source: L("Elle résulte de l'oxydation du métal par l'oxygène présent dans la tuyauterie pendant le brasage.", "It results from oxidation of the metal by the oxygen in the pipe during brazing."),
    options: [L("De l'oxygène présent dans la tuyauterie pendant le brasage", "From the oxygen in the pipe during brazing"), L("De l'azote introduit dans le tube", "From the nitrogen let into the tube"), L("De l'acétylène de la flamme", "From the acetylene of the flame"), L("De l'eau de lavage du décapant", "From the water used to wash off the flux")],
  },
  flux: {
    level: 1,
    ask: L("Quel est le rôle du flux décapant ?", "What does the flux do?"),
    source: L("Les flux décapants** sont des produits qui ont pour rôle de former pendant le brasage une couche continue sur la surface du joint, afin d'éviter l'oxydation.", "Fluxes** form a continuous layer on the joint surface during brazing, to prevent oxidation."),
    options: [L("Former une couche sur le joint pour éviter l'oxydation", "Form a layer on the joint to prevent oxidation"), L("Abaisser le point de fusion du cuivre", "Lower the melting point of copper"), L("Remplacer le balayage d'azote", "Replace the nitrogen purge"), L("Refroidir le joint après le brasage", "Cool the joint after brazing")],
  },
  brasures: {
    level: 3,
    ask: L("Quelles brasures utilise l'industrie frigorifique ?", "Which fillers does refrigeration use?"),
    source: L("On distingue dans l'industrie frigorifique la brasure à l'argent, la brasure au phosphore (cuivre-phosphore) et la brasure des métaux blancs, ou brasure tendre (étain-argent, étain-plomb, etc.).", "Refrigeration uses silver brazing alloy, copper-phosphorus alloy and soft solder (tin-silver, tin-lead, etc.)."),
    options: [L("À l'argent, cuivre-phosphore, métaux blancs (étain)", "Silver, copper-phosphorus, soft solder (tin)"), L("Acier, fonte, aluminium", "Steel, cast iron, aluminium"), L("Cuivre pur seulement", "Pure copper only"), L("Zinc et magnésium", "Zinc and magnesium")],
  },
  debit: {
    level: 2,
    ask: L("Comment se fait le balayage d'azote ?", "How is the nitrogen purge done?"),
    source: L("Il s'agit d'un balayage à faible débit, environ 6 l/min, et non d'une mise en pression.", "This is a low-flow purge, about 6 l/min, not a pressurisation."),
    options: [L("À faible débit, environ 6 l/min, sans mise en pression", "At low flow, about 6 l/min, without pressurising"), L("En mettant le tube sous 10 bar", "By putting the tube under 10 bar"), L("À plein débit de la bouteille", "At the cylinder's full flow"), L("Par impulsions d'azote entre deux chauffes", "In bursts of nitrogen between heatings")],
  },
  ouvert: {
    level: 1,
    ask: L("Pendant le balayage, l'autre extrémité du tube est :", "During the purge, the other end of the tube is:"),
    source: L("L'azote est introduit d'un côté du tube tandis que l'autre côté reste ouvert : il suffit d'un filet d'azote pour que l'oxygène du tuyau à souder soit chassé, empêchant ainsi la calamine de se former.", "Nitrogen enters at one end of the tube while the other end stays open: a trickle of nitrogen is enough to drive out the oxygen in the pipe, so preventing scale."),
    options: [L("Ouverte, pour que l'air soit chassé", "Open, so the air is driven out"), L("Bouchée, pour garder la pression", "Plugged, to keep the pressure"), L("Reliée à la pompe à vide", "Connected to the vacuum pump"), L("Reliée à la bouteille d'oxygène", "Connected to the oxygen cylinder")],
  },
  quand: {
    level: 2,
    ask: L("Quand l'azote doit-il circuler ?", "When must the nitrogen flow?"),
    source: L("Maintenir le balayage d'azote pendant le refroidissement du joint.", "Keep up the oxygen-free nitrogen purge while the joint cools."),
    options: [L("Avant toute chauffe et jusqu'au refroidissement du joint", "Before any heating and until the joint has cooled"), L("Seulement pendant la chauffe", "Only while heating"), L("Seulement après le brasage", "Only after brazing"), L("Seulement avant d'allumer le chalumeau", "Only before lighting the torch")],
  },
  pourquoi: {
    level: 3,
    ask: L("Pourquoi éviter la calamine dans une tuyauterie frigorifique ?", "Why avoid scale in refrigeration pipework?"),
    source: L("La calamine est préjudiciable au bon fonctionnement de certains éléments comme les détendeurs mécaniques et électroniques.", "Scale harms certain components such as mechanical and electronic expansion valves."),
    options: [L("Elle nuit aux détendeurs mécaniques et électroniques", "It harms mechanical and electronic expansion valves"), L("Elle colore le tube", "It discolours the tube"), L("Elle empêche la brasure de fondre", "It stops the filler melting"), L("Elle augmente la pression de l'azote", "It raises the nitrogen pressure")],
  },
  bouteilles: {
    level: 3,
    ask: L("Comment placer les bouteilles d'azote, d'oxygène et d'acétylène ?", "How should the nitrogen, oxygen and acetylene cylinders be placed?"),
    source: L("Bien enchaîner les bouteilles sur un poteau ou sur un support solidement fixé au sol, et à l'abri du soleil.", "Chain cylinders to a post or to a support firmly fixed to the floor, out of the sun."),
    options: [L("Enchaînées à un support fixé au sol, à l'abri du soleil", "Chained to a support fixed to the floor, out of the sun"), L("Couchées au sol près du poste", "Lying on the floor near the station"), L("Au soleil pour garder la pression", "In the sun to keep the pressure"), L("Libres, pour pouvoir les déplacer vite", "Free-standing, to move them quickly")],
  },
};

const rotate = (list, n) => [...list.slice(n % list.length), ...list.slice(0, n % list.length)];

export function buildNitrogen() {
  const out = [];
  const push = (kind, level, rest) => out.push({ key: `${kind}|${JSON.stringify(rest)}`, level, kind, ...rest });
  const ids = STEPS.map((s) => s.id);
  ids.forEach((id, i) => {
    const others = (exclude) => rotate(ids.filter((x) => !exclude.includes(x)), i).slice(0, 3);
    if (i < ids.length - 1) push("suivante", 1, { from: id, answer: ids[i + 1], options: [ids[i + 1], ...others([id, ids[i + 1]])].sort() });
    if (i > 0) push("precedente", 2, { from: id, answer: ids[i - 1], options: [ids[i - 1], ...others([id, ids[i - 1]])].sort() });
  });
  for (const gas of Object.keys(RANGES)) push("reglage", 2, { gas, answer: RANGES[gas].join("-"), options: ["0.2-0.5", "0.5-1.5", "1.5-3", "4-10"] });
  for (const [which, n] of Object.entries(NOTIONS)) push("notion", n.level, { which, answer: 0, options: [0, 1, 2, 3] });
  return { steps: STEPS, ranges: RANGES, notions: NOTIONS, situations: out };
}
