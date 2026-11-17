// Raccords frigorifiques dudgeon de la figure `raccords-flare` (Partie 4, module 2, section « Cuivre et laiton » ; Q104).
// Le tube de cuivre est évasé ; un écrou (femelle) plaque la surface évasée sur un cône fileté (mâle). L'étanchéité vient
// du contact des deux cônes, sans ruban ni filasse (section « Sans flamme »). Aucun nom de fabricant (Q62). Rien en base (Q73).

const L = (fr, en) => ({ fr, en });

export const FUNCTIONS = {
  plaquer: L("Plaquer le tube évasé sur un cône mâle", "Press the flared tube onto a male cone"),
  "relier-evases": L("Relier deux tubes évasés en restant démontable", "Join two flared tubes and stay removable"),
  "changer-diametre": L("Changer de diamètre", "Change diameter"),
  "prise-pression": L("Donner une prise de pression sur le circuit", "Provide a pressure access point on the circuit"),
  fermer: L("Fermer une sortie ou une prise", "Close an outlet or an access point"),
};

export const FITTINGS = {
  ecrou: {
    name: L("Écrou dudgeon", "Flare nut"),
    threads: ["F"], threadsLabel: L("Femelle (taraudé), ouvert des deux côtés", "Female (threaded inside), open at both ends"),
    function: "plaquer", ways: 1,
    feature: L("S'enfile sur le tube avant l'évasement", "Goes onto the tube before flaring"),
    detail: L("On l'enfile sur le tube avant de l'évaser ; vissé sur un raccord mâle conique, il plaque la surface évasée sur le cône. L'étanchéité vient du contact des deux cônes, sans ruban ni filasse.", "It goes onto the tube before the tube is flared; screwed onto a male flare fitting, it presses the flared face onto the cone. The seal comes from the two cones in contact, with no tape or hemp."),
  },
  union: {
    name: L("Union double (mâle / mâle)", "Flare union (male / male)"),
    threads: ["M/M"], threadsLabel: L("Mâle / mâle : deux cônes filetés", "Male / male: two threaded cones"),
    function: "relier-evases", ways: 2,
    feature: L("Deux cônes mâles et un six pans au milieu", "Two male cones and a hexagon in the middle"),
    detail: L("Chaque tube évasé, avec son écrou, se visse sur l'un des deux cônes ; on serre avec deux clés, l'une tenant le six pans central en contre-clé, pour ne pas vriller le tube.", "Each flared tube, with its nut, screws onto one of the two cones; it is tightened with two spanners, one holding the central hexagon as a backup, so the tube is not twisted."),
  },
  reduction: {
    name: L("Réduction dudgeon", "Flare reducer"),
    threads: ["F/M"], threadsLabel: L("Écrou femelle (gros côté) / cône mâle (petit côté)", "Female nut (large side) / male cone (small side)"),
    function: "changer-diametre", ways: 2,
    feature: L("Un écrou d'un côté, un cône plus petit de l'autre", "A nut on one side, a smaller cone on the other"),
    detail: L("Elle se visse par son écrou sur un raccord mâle, par exemple 3/8, et présente un cône mâle plus petit, 1/4, qui reçoit le tube évasé et son écrou.", "It screws by its nut onto a male fitting, for example 3/8, and offers a smaller male cone, 1/4, that takes the flared tube and its nut."),
  },
  te: {
    name: L("Té de prise de pression", "Access tee"),
    threads: ["M/M/M"], threadsLabel: L("Trois cônes mâles, dont la prise à valve", "Three male cones, one of them the valve access"),
    function: "prise-pression", ways: 3,
    feature: L("Une voie munie d'une valve à obus et d'un bouchon", "One way fitted with a valve core and a cap"),
    detail: L("Monté sur la ligne, il offre une prise munie d'une valve à obus : le flexible du manifold, équipé d'un poussoir, ouvre la valve en se vissant. Hors intervention, le bouchon à joint ferme la prise.", "Fitted in the line, it offers an access point with a valve core: the manifold hose, with its depressor, opens the valve as it is screwed on. Between jobs, the sealed cap closes the access point."),
  },
  bouchon: {
    name: L("Bouchon dudgeon (capuchon conique)", "Flare cap (bonnet)"),
    threads: ["F-plein"], threadsLabel: L("Femelle, fond plein", "Female, solid end"),
    function: "fermer", ways: 1,
    feature: L("Un écrou fermé, sans passage", "A closed nut, with no way through"),
    detail: L("Il se visse sur un cône mâle pour fermer une sortie inutilisée ou une prise de pression ; son fond plein appuie sur le cône et fait l'étanchéité.", "It screws onto a male cone to close an unused outlet or an access point; its solid end bears on the cone and makes the seal."),
  },
};

export const ORDER = ["ecrou", "union", "reduction", "te", "bouchon"];

const CASES = [
  { function: "relier-evases", ask: L("Relier deux tubes évasés 3/8 qu'il faudra pouvoir démonter.", "Join two 3/8 flared tubes that must stay removable.") },
  { function: "prise-pression", ask: L("Lire la pression d'aspiration sur une ligne qui n'a pas de vanne de service.", "Read the suction pressure on a line that has no service valve.") },
  { function: "fermer", ask: L("Fermer la prise de pression à la fin de l'intervention.", "Close the access point at the end of the job.") },
  { function: "fermer", ask: L("Condamner une sortie mâle conique inutilisée.", "Seal an unused male flare outlet.") },
  { function: "changer-diametre", ask: L("Passer d'une vanne à sortie mâle 3/8 à un tube évasé 1/4.", "Go from a valve with a 3/8 male outlet to a 1/4 flared tube.") },
  { function: "plaquer", ask: L("Pièce à enfiler sur le tube avant de l'évaser.", "Part to slide onto the tube before flaring it.") },
  { function: "plaquer", ask: L("Raccorder un tube évasé sur l'orifice mâle d'une vanne.", "Connect a flared tube to the male port of a valve.") },
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
    // Filetage : aucun leurre ne partage un filetage avec la bonne réponse.
    const apart = ORDER.filter((x) => x !== key && !FITTINGS[x].threads.some((t) => FITTINGS[key].threads.includes(t)));
    push("filetage", 2, { fitting: key, answer: key, options: [key, ...rotate(apart, i).slice(0, 3)].sort() });
    push("particularite", 2, { fitting: key, answer: key, options });
  });
  CASES.forEach((c, i) => {
    const key = keyOf(c.function);
    const others = rotate(ORDER.filter((x) => x !== key), i + 1).slice(0, 3);
    push("situation", 3, { case: i, function: c.function, answer: key, options: [key, ...others].sort() });
  });
  const fittings = Object.fromEntries(ORDER.map((key) => [key, { ...FITTINGS[key], functionLabel: FUNCTIONS[FITTINGS[key].function] }]));
  return { functions: FUNCTIONS, fittings, order: ORDER, cases: CASES, situations: out };
}
