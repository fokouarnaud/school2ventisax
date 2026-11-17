// Situations du mode « S'entraîner » de la figure `flamme` (Partie 4, module 5, « Chalumeau et flamme » ; Q96).
// Tout est tiré de la section : repères 1 à 9 du chalumeau, aspect des trois flammes, plages de réglage, injecteur et
// lance, décollement, température. Les flammes à reconnaître sont tirées dans le modèle de la figure (bande du mélange
// neutre 0,96 à 1,08 ; décollement au-dessus de 4,5), loin des bords de la bande. Rien en base (Q73).

const L = (fr, en) => ({ fr, en });
const NEUTRAL = [0.96, 1.08];
const LIFT_ABOVE = 4.5;

export const MARKS = {
  1: L("Raccord du tuyau de gaz combustible", "Fuel gas hose connection"),
  2: L("Raccord du tuyau d'oxygène", "Oxygen hose connection"),
  3: L("Manche", "Handle"),
  4: L("Robinet de gaz combustible", "Fuel gas valve"),
  5: L("Robinet d'oxygène", "Oxygen valve"),
  6: L("Écrou d'accouplement à serrage manuel", "Hand-tightened coupling nut"),
  7: L("Injecteur", "Injector"),
  8: L("Tube de mélange", "Mixing tube"),
  9: L("Buse de soudage (de chauffage)", "Welding (heating) nozzle"),
};

export const ASPECTS = {
  neutral: L("La flamme normalement utilisée pour le soudage. Le dard est de couleur blanc brillant et de forme très nette en sortie de buse", "The flame normally used for welding. The inner cone (<span lang=\"fr\">dard</span>) is brilliant white and very sharp at the nozzle"),
  oxy: L("Excès d'oxygène : le panache et le dard sont raccourcis, la flamme émet un sifflement", "Excess oxygen: envelope and cone are shortened, the flame hisses"),
  carb: L("Excès d'acétylène : le panache et le dard sont allongés, avec des formes irrégulières", "Excess acetylene: envelope and cone are lengthened, with irregular shapes"),
};

export const RANGES = { oxygene: [0.5, 1.5], acetylene: [0.2, 0.5] };
export const TEMPERATURE = 3100;

// Réponses textuelles (injecteur, lance, décollement) : la bonne d'abord, les leurres ensuite.
export const TEXTS = {
  aspire: [
    L("La dépression créée par l'oxygène à la sortie de l'injecteur", "The depression created by the oxygen at the injector outlet"),
    L("La pression plus forte de l'acétylène", "The higher acetylene pressure"),
    L("Une pompe logée dans le manche", "A pump inside the handle"),
    L("Le tirage de la flamme", "The draught of the flame"),
  ],
  lance: [
    L("L'injecteur, la base de mélange, le tube de mélange et la buse", "The injector, mixing base, mixing tube and nozzle"),
    L("Le manche et les deux robinets", "The handle and the two valves"),
    L("Les deux tuyaux et leurs raccords", "The two hoses and their connections"),
    L("Le manodétendeur d'oxygène", "The oxygen regulator"),
  ],
  decolle: [
    L("Réduire l'acétylène jusqu'à ce que la flamme recolle à la buse", "Reduce the acetylene until the flame comes back to the nozzle"),
    L("Ouvrir davantage l'oxygène", "Open the oxygen further"),
    L("Ouvrir davantage l'acétylène", "Open the acetylene further"),
    L("Changer de buse", "Change the nozzle"),
  ],
  recolle: [
    L("Régler l'oxygène jusqu'à obtenir la flamme souhaitée", "Adjust the oxygen until the desired flame is obtained"),
    L("Fermer l'acétylène", "Close the acetylene"),
    L("Rallumer la flamme", "Relight the flame"),
    L("Ouvrir l'acétylène au maximum", "Open the acetylene fully"),
  ],
};

const kindOf = (r) => (r < NEUTRAL[0] ? "carb" : r > NEUTRAL[1] ? "oxy" : "neutral");

export function buildTorch() {
  const out = [];
  const push = (kind, level, rest) => out.push({ key: `${kind}|${JSON.stringify(rest)}`, level, kind, ...rest });
  // Flammes à reconnaître : débit d'acétylène sous le seuil de décollement, rapports loin des bords de la bande.
  const ratios = { neutral: [1.01, 1.03], oxy: [1.3, 1.5], carb: [0.6, 0.75] };
  for (let a = 1.5; a <= LIFT_ABOVE + 1e-9; a += 0.5) {
    for (const [kind, list] of Object.entries(ratios)) {
      for (const r of list) {
        const o = Math.round(a * r * 100) / 100;
        if (kindOf(o / a) === kind) push("flamme", 1, { a, o, answer: kind, options: ["neutral", "oxy", "carb"] });
      }
    }
  }
  for (const kind of Object.keys(ASPECTS)) push("aspect", 1, { flame: kind, answer: kind, options: ["neutral", "oxy", "carb"] });
  for (const gas of Object.keys(RANGES)) push("plage", 2, { gas, answer: RANGES[gas].join("-"), options: ["0.2-0.5", "0.5-1.5", "1.5-3", "0-10"] });
  push("temperature", 2, { answer: "3100", options: ["1100", "2000", "3100", "5000"] });
  for (const which of ["decolle", "recolle"]) push("decollement", 2, { which, answer: 0, options: [0, 1, 2, 3] });
  for (const n of Object.keys(MARKS)) {
    const others = Object.keys(MARKS).filter((m) => m !== n);
    const start = Number(n) % others.length;
    push("repere", 3, { mark: n, answer: n, options: [n, ...[...others.slice(start), ...others.slice(0, start)].slice(0, 3)].sort() });
  }
  for (const which of ["aspire", "lance"]) push("injecteur", 3, { which, answer: 0, options: [0, 1, 2, 3] });
  return { marks: MARKS, aspects: ASPECTS, ranges: RANGES, temperature: TEMPERATURE, texts: TEXTS, situations: out };
}
