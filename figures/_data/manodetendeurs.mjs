// Situations de la figure `manodetendeur` (Partie 4, module 5, « Les manodétendeurs » ; décisions Q92, Q93).
// Valeurs du tableau « Manodétendeurs à un étage compact » du support ; ordre de mise en service et hors service
// de la section « Mise en service ». Toutes les situations sont énumérées ici ; la figure les tire au hasard,
// rien n'est enregistré (Q73).

const L = (fr, en) => ({ fr, en });
const r2 = (x) => Math.round(x * 100) / 100;

// feed : alimentation max (bar) ; detent : détente max ; low : cadran aval (basse pression) ; high : cadran amont.
export const GASES = {
  acetylene: { label: L("Acétylène", "Acetylene"), feed: 25, detent: 1.5, low: 2.5, high: 40 },
  propane: { label: L("Propane", "Propane"), feed: 25, detent: 4, low: 6, high: 40 },
  oxygene: { label: L("Oxygène", "Oxygen"), feed: 230, detent: 10, low: 16, high: 315 },
  azote: { label: L("Azote", "Nitrogen"), feed: 230, detent: 10, low: 16, high: 315 },
  co2: { label: L("CO2", "CO2"), feed: 230, detent: 10, low: 16, high: 315 },
};

export const START = [
  { id: "vis-desserrees", label: L("Vis de détente desserrées, raccorder les manodétendeurs", "Pressure-adjusting screws backed off, fit the regulators") },
  { id: "ouvrir-bouteilles", label: L("Ouvrir lentement les robinets des bouteilles", "Open the cylinder valves slowly") },
  { id: "regler-oxygene", label: L("Régler la pression de service de l'oxygène", "Set the oxygen working pressure") },
  { id: "regler-acetylene", label: L("Régler la pression de service de l'acétylène, sans dépasser les limites", "Set the acetylene working pressure, within the limits") },
  { id: "purger", label: L("Purger séparément chaque tuyau, loin de toute flamme", "Purge each hose separately, away from any flame") },
  { id: "allumer", label: L("Ouvrir l'acétylène du chalumeau, allumer, puis ouvrir l'oxygène", "Open the torch acetylene, light, then open the oxygen") },
];
export const STOP = [
  { id: "fermer-acetylene", label: L("Fermer le robinet d'acétylène du chalumeau", "Close the torch acetylene valve") },
  { id: "fermer-oxygene", label: L("Fermer le robinet d'oxygène du chalumeau", "Close the torch oxygen valve") },
  { id: "fermer-bouteilles", label: L("Fermer les robinets des bouteilles", "Close the cylinder valves") },
  { id: "purger-desserrer", label: L("Purger les tuyaux, puis desserrer les vis de détente", "Purge the hoses, then back off the adjusting screws") },
];

const steps = (from, to, step) => Array.from({ length: Math.round((to - from) / step) + 1 }, (_, i) => r2(from + i * step));
// Pas de lecture de chaque cadran (demi-graduation).
const READ_STEP = { 315: 2.5, 40: 0.5, 16: 0.25, 6: 0.1, 2.5: 0.05 };

function around(answer, step, span) {
  const out = [answer];
  // Leurres écartés d'au moins une grande graduation (span / 10 = 5 demi-graduations), lisibles sur un téléphone.
  for (const d of [step * 5, -step * 5, step * 10, -step * 10, step * 15, -step * 15]) {
    const v = r2(answer + d);
    if (out.length < 4 && v > 0 && v <= span && !out.includes(v)) out.push(v);
  }
  return out.sort((a, b) => a - b);
}

export function buildRegulators() {
  const out = [];
  const push = (kind, level, rest) => out.push({ key: `${kind}|${JSON.stringify(rest)}`, level, kind, ...rest });
  for (const [gas, g] of Object.entries(GASES)) {
    for (const reads of ["bouteille", "service"]) {
      push("manometre", 1, { gas, reads, answer: reads === "bouteille" ? "amont" : "aval", options: ["amont", "aval", "vis"] });
    }
    push("detente", 1, { gas, answer: g.detent, options: [1.5, 4, 10, 16] });
    for (const gauge of ["aval", "amont"]) {
      const span = gauge === "amont" ? g.high : g.low;
      const step = READ_STEP[span];
      for (const v of steps(step, span - step, step)) {
        push("lecture", gauge === "aval" ? 2 : 3, { gas, gauge, needle: v, answer: v, options: around(v, step, span) });
      }
    }
    const grid = g.low === 2.5 ? steps(0.1, 3, 0.1) : g.low === 6 ? steps(0.2, 7, 0.2) : steps(0.5, 18, 0.5);
    for (const v of grid) {
      push("reglage", 4, { gas, value: v, answer: v <= g.detent ? "admis" : v <= g.low ? "trop-haut" : "hors-cadran", options: ["admis", "trop-haut", "hors-cadran"] });
    }
    const types = [{ feed: 25, low: 2.5, high: 40 }, { feed: 25, low: 6, high: 40 }, { feed: 230, low: 16, high: 315 }];
    push("detendeur", 4, { gas, answer: { feed: g.feed, low: g.low, high: g.high }, options: types });
  }
  for (const [procedure, list] of [["start", START], ["stop", STOP]]) {
    for (let after = 0; after < list.length - 1; after++) {
      const answer = list[after + 1].id;
      const others = list.filter((_, i) => i !== after + 1 && i !== after).map((s) => s.id);
      const options = [answer, ...others.slice(0, 3)].sort();
      push("ordre", 4, { procedure, after, answer, options });
    }
  }
  return { gases: GASES, start: START, stop: STOP, situations: out };
}
