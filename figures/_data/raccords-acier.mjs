// Raccords acier à visser de la figure `raccords-acier` (Partie 4, module 2, section « Acier, PVC, mixtes » ; Q101).
// Les 7 raccords que cite la section : forme, filetages (mâle M à l'extérieur, femelle F à l'intérieur), fonction,
// particularité ; puis les situations du mode « Reconnaître ». Filetages de tuyauteries d'eau ou d'acier galvanisé,
// jamais du circuit frigorifique (section « Sans flamme »). Rien en base (Q73).

const L = (fr, en) => ({ fr, en });

export const FUNCTIONS = {
  prolonger: L("Prolonger en ligne droite", "Extend in a straight line"),
  "relier-femelles": L("Relier deux entrées femelles", "Join two female ports"),
  "changer-diametre": L("Changer de diamètre", "Change diameter"),
  "changer-direction": L("Changer de direction", "Change direction"),
  demonter: L("Raccorder en restant démontable", "Join and stay removable"),
  deriver: L("Créer une dérivation", "Make a branch"),
  fermer: L("Fermer une conduite", "Close a line"),
};

export const FITTINGS = {
  manchon: {
    name: L("Manchon", "Coupling (socket)"),
    threads: ["F/F"], threadsLabel: L("Femelle / femelle", "Female / female"),
    function: "prolonger", ways: 2,
    feature: L("Relie deux tubes ou embouts mâles de même diamètre", "Joins two male tubes or ends of the same diameter"),
    detail: L("Cylindre creux taraudé aux deux bouts, de même diamètre : on y visse deux tubes filetés bout à bout.", "Hollow cylinder threaded inside at both ends, same diameter: two threaded tubes screw into it end to end."),
  },
  mamelon: {
    name: L("Mamelon", "Nipple (hex)"),
    threads: ["M/M"], threadsLabel: L("Mâle / mâle", "Male / male"),
    function: "relier-femelles", ways: 2,
    feature: L("Six pans au milieu pour la clé", "Hexagon in the middle for the spanner"),
    detail: L("L'inverse du manchon : fileté à l'extérieur aux deux bouts, avec un six pans central ; il assemble deux raccords ou appareils femelles.", "The opposite of the coupling: threaded outside at both ends, with a central hexagon; it joins two female fittings or appliances."),
  },
  reduction: {
    name: L("Réduction", "Reducer (bush)"),
    threads: ["M/F", "F/F"], threadsLabel: L("Mâle / femelle (ou femelle / femelle)", "Male / female (or female / female)"),
    function: "changer-diametre", ways: 2,
    feature: L("Deux diamètres différents, souvent mâle grand et femelle petit", "Two different diameters, often large male and small female"),
    detail: L("Le côté mâle, le plus gros, se visse dans un raccord femelle plus grand ; le côté femelle, plus petit, reçoit le tube réduit, sans rallonger la ligne.", "The larger male side screws into a larger female fitting; the smaller female side takes the reduced pipe, without lengthening the line."),
  },
  coude: {
    name: L("Coude", "Elbow"),
    threads: ["M/M", "M/F", "F/F"], threadsLabel: L("Mâle / mâle, mâle / femelle ou femelle / femelle", "Male / male, male / female or female / female"),
    function: "changer-direction", ways: 2,
    feature: L("Forme un angle, le plus souvent 90° ou 45°", "Forms an angle, usually 90° or 45°"),
    detail: L("Il change l'axe de la tuyauterie sans cintrer le tube.", "It changes the axis of the pipework without bending the pipe."),
  },
  union: {
    name: L("Union (3 pièces)", "Union (3-piece)"),
    threads: ["3 pièces"], threadsLabel: L("Trois pièces : deux embouts et un écrou libre", "Three pieces: two tailpieces and a loose nut"),
    function: "demonter", ways: 2,
    feature: L("Démonte un appareil sans tourner les tuyaux", "Removes an appliance without turning the pipes"),
    detail: L("Chaque embout se visse sur son tube, puis l'écrou central les serre l'un contre l'autre : on démonte une pompe ou une vanne sans couper ni vriller la tuyauterie. À ne pas confondre avec le raccord union dudgeon mâle/mâle du frigoriste.", "Each tailpiece screws onto its pipe, then the central nut pulls them together: a pump or valve comes out without cutting or twisting the pipework. Not to be confused with the refrigeration male/male flare union."),
  },
  te: {
    name: L("Té", "Tee"),
    threads: ["F/F/F", "M/M/M"], threadsLabel: L("Trois voies, femelles (ou mâles)", "Three ways, female (or male)"),
    function: "deriver", ways: 3,
    feature: L("Trois ouvertures en T, la dérivation à 90°", "Three openings in a T, the branch at 90°"),
    detail: L("Deux voies dans l'alignement et une piquée à 90° : dérivation vers un autre circuit, ou pose d'un manomètre, d'un purgeur, d'une sonde ; égal ou réduit (piquage plus petit).", "Two ways in line and one branch at 90°: a branch to another circuit, or a place for a gauge, a vent or a sensor; equal or reducing (smaller branch)."),
  },
  bouchon: {
    name: L("Bouchon (ou capuchon)", "Plug (or cap)"),
    threads: ["M", "F"], threadsLabel: L("Mâle seul (bouchon) ou femelle seul (capuchon)", "Male only (plug) or female only (cap)"),
    function: "fermer", ways: 1,
    feature: L("Une seule ouverture, fond plein", "One opening only, solid end"),
    detail: L("Il obture de façon étanche un bout de tube ou une sortie inutilisée : le bouchon mâle se visse dans un femelle, le capuchon femelle coiffe un filetage mâle.", "It seals a pipe end or an unused outlet: the male plug screws into a female thread, the female cap goes over a male thread."),
  },
};

export const ORDER = ["manchon", "mamelon", "reduction", "coude", "union", "te", "bouchon"];

// Situations d'atelier : la fonction attendue désigne un seul raccord.
const CASES = [
  { function: "demonter", ask: L("Il faudra pouvoir déposer la pompe sans tourner les tuyaux.", "The pump must come out without turning the pipes.") },
  { function: "fermer", ask: L("Une sortie d'un té reste inutilisée : il faut la condamner.", "One outlet of a tee is not used: it must be sealed.") },
  { function: "fermer", ask: L("Un tube fileté mâle attend une extension future : on le coiffe.", "A male threaded pipe awaits a future extension: it is capped.") },
  { function: "relier-femelles", ask: L("Visser une vanne femelle directement dans un raccord femelle.", "Screw a female valve straight into a female fitting.") },
  { function: "changer-diametre", ask: L("Passer d'une sortie femelle 3/4\" à un tube 1/2\" sans rallonger la ligne.", "Go from a 3/4\" female outlet to a 1/2\" pipe without lengthening the line.") },
  { function: "deriver", ask: L("Poser un manomètre sur la conduite.", "Fit a pressure gauge on the line.") },
  { function: "deriver", ask: L("Alimenter un second circuit à partir de la conduite.", "Feed a second circuit from the line.") },
  { function: "changer-direction", ask: L("Longer un mur puis tourner à 90°, sans cintrer.", "Run along a wall then turn 90°, without bending.") },
  { function: "prolonger", ask: L("Rabouter deux tubes filetés mâles du même diamètre.", "Join two male threaded pipes of the same diameter end to end.") },
];

const rotate = (list, n) => [...list.slice(n % list.length), ...list.slice(0, n % list.length)];
const keyOf = (fn) => ORDER.find((k) => FITTINGS[k].function === fn);

export function build() {
  const out = [];
  const push = (kind, level, rest) => out.push({ key: `${kind}|${JSON.stringify(rest)}`, level, kind, ...rest });
  ORDER.forEach((key, i) => {
    const others = rotate(ORDER.filter((x) => x !== key), i).slice(0, 3);
    const options = [key, ...others].sort();
    push("nom", 1, { fitting: key, answer: key, options });
    push("fonction", 1, { fitting: key, answer: key, options });
    // Filetage : aucun leurre ne partage un filetage avec la bonne réponse (un coude F/F rendrait juste le manchon).
    const apart = ORDER.filter((x) => x !== key && !FITTINGS[x].threads.some((t) => FITTINGS[key].threads.includes(t)));
    push("filetage", 2, { fitting: key, answer: key, options: [key, ...rotate(apart, i).slice(0, 3)].sort() });
    push("particularite", 2, { fitting: key, answer: key, options });
  });
  CASES.forEach((c, i) => {
    const key = keyOf(c.function);
    const others = rotate(ORDER.filter((x) => x !== key), i + 2).slice(0, 3);
    push("situation", 3, { case: i, function: c.function, answer: key, options: [key, ...others].sort() });
  });
  const fittings = Object.fromEntries(ORDER.map((key) => [key, { ...FITTINGS[key], functionLabel: FUNCTIONS[FITTINGS[key].function] }]));
  return { functions: FUNCTIONS, fittings, order: ORDER, cases: CASES, situations: out };
}

export const buildSteelFittings = build;
