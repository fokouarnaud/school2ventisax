// Situations de la figure `mise-en-service` (Partie 4, module 5, « Mise en service et hors service » ; Q94, Q95).
// Procédures recopiées mot pour mot de la section (fr et en) ; erreurs dangereuses, couleurs des tuyaux et tenue du
// chalumeau tirées du même texte. La procédure n'a que 10 étapes : pas de seuil de 1 000 situations. Rien en base (Q73).

const L = (fr, en) => ({ fr, en });

export const PROCEDURES = {
  start: [
    { id: "raccorder", label: L("Vis de détente desserrées, raccorder les manodétendeurs.", "With the regulating screws backed off, connect the regulators."), short: L("Raccorder, vis desserrées", "Connect, screws backed off") },
    { id: "ouvrir-bouteilles", label: L("Ouvrir lentement les robinets des bouteilles de gaz.", "Open the cylinder valves slowly."), short: L("Ouvrir lentement les bouteilles", "Open the cylinders slowly") },
    { id: "regler-oxygene", label: L("Régler la pression de service de l'oxygène.", "Set the oxygen working pressure."), short: L("Régler l'oxygène", "Set the oxygen") },
    { id: "regler-acetylene", label: L("Régler la pression de service de l'acétylène, selon les prescriptions, sans dépasser les valeurs limites.", "Set the acetylene working pressure, as prescribed, without exceeding the limit values."), short: L("Régler l'acétylène", "Set the acetylene") },
    { id: "purger", label: L("Purger séparément chaque tuyau, à l'air libre et loin de toute flamme.", "Purge each hose separately, in the open air and away from any flame."), short: L("Purger chaque tuyau", "Purge each hose") },
    { id: "allumer", label: L("Ouvrir le robinet d'acétylène du chalumeau, allumer, puis ouvrir le robinet d'oxygène.", "Open the acetylene valve on the torch, light it, then open the oxygen valve."), short: L("Acétylène, allumer, oxygène", "Acetylene, light, oxygen") },
  ],
  stop: [
    { id: "fermer-acetylene", label: L("Fermer le robinet d'acétylène du chalumeau.", "Close the acetylene valve on the torch."), short: L("Fermer l'acétylène du chalumeau", "Close the torch acetylene") },
    { id: "fermer-oxygene", label: L("Fermer le robinet d'oxygène du chalumeau.", "Close the oxygen valve on the torch."), short: L("Fermer l'oxygène du chalumeau", "Close the torch oxygen") },
    { id: "fermer-bouteilles", label: L("Fermer les robinets des bouteilles.", "Close the cylinder valves."), short: L("Fermer les bouteilles", "Close the cylinders") },
    { id: "purger-desserrer", label: L("Purger les tuyaux, puis desserrer les vis de détente.", "Purge the hoses, then back off the regulating screws."), short: L("Purger, desserrer les vis", "Purge, back off the screws") },
  ],
};

// Erreurs dangereuses : chacune vise une étape de la procédure et dit, d'après la section, ce qui ne va pas.
export const ERRORS = [
  { id: "vis-serree", step: "raccorder", action: L("Raccorder et ouvrir avec la vis de détente serrée", "Connect and open with the regulating screw turned in"), why: L("La vis doit être desserrée : sinon la pression de la bouteille passe d'un coup dans le détendeur et le tuyau.", "The screw must be backed off: otherwise the cylinder pressure rushes into the regulator and the hose.") },
  { id: "ouverture-brusque", step: "ouvrir-bouteilles", action: L("Ouvrir le robinet de la bouteille d'un coup", "Open the cylinder valve all at once"), why: L("Le robinet s'ouvre lentement, pour que le détendeur monte en pression sans choc.", "The valve is opened slowly, so the regulator takes the pressure without a shock.") },
  { id: "acetylene-trop-haut", step: "regler-acetylene", action: L("Régler l'acétylène au-delà de la valeur limite", "Set the acetylene above the limit value"), why: L("L'acétylène se règle selon les prescriptions, sans dépasser les valeurs limites.", "Acetylene is set as prescribed, without exceeding the limit values.") },
  { id: "purge-flamme", step: "purger", action: L("Purger les tuyaux près d'une flamme", "Purge the hoses near a flame"), why: L("La purge se fait à l'air libre et loin de toute flamme.", "Purging is done in the open air, away from any flame.") },
  { id: "purge-ensemble", step: "purger", action: L("Purger les deux tuyaux en même temps", "Purge both hoses at the same time"), why: L("Chaque tuyau se purge séparément.", "Each hose is purged separately.") },
  { id: "oxygene-premier", step: "allumer", action: L("Ouvrir l'oxygène du chalumeau avant d'allumer", "Open the torch oxygen before lighting"), why: L("On ouvre l'acétylène, on allume, puis seulement on ouvre l'oxygène.", "Open the acetylene, light it, and only then open the oxygen.") },
  { id: "arret-oxygene", step: "fermer-acetylene", action: L("À l'arrêt, fermer d'abord l'oxygène du chalumeau", "When shutting down, close the torch oxygen first"), why: L("À l'arrêt, on ferme d'abord l'acétylène du chalumeau, puis l'oxygène.", "When shutting down, close the torch acetylene first, then the oxygen.") },
  { id: "bouteilles-ouvertes", step: "fermer-bouteilles", action: L("Laisser les bouteilles ouvertes en fin de travail", "Leave the cylinders open after work"), why: L("Les robinets des bouteilles se ferment avant de purger les tuyaux.", "The cylinder valves are closed before purging the hoses.") },
  { id: "vis-restees", step: "purger-desserrer", action: L("Ranger le poste sans desserrer les vis de détente", "Put the set away without backing off the screws"), why: L("Après la purge, les vis de détente sont desserrées, prêtes pour la prochaine mise en service.", "After purging, the regulating screws are backed off, ready for the next start-up.") },
  { id: "tuyau-inverse", step: "raccorder", action: L("Raccorder le tuyau rouge sur l'oxygène", "Connect the red hose to the oxygen"), why: L("Le tuyau bleu est celui de l'oxygène, le rouge celui de l'acétylène.", "The blue hose is for oxygen, the red one for acetylene.") },
];

export const FACTS = { hoses: { oxygene: "bleu", acetylene: "rouge" }, angles: { soudage: "50-70", inverse: "45", apport: "45" } };

const rotate = (list, n) => [...list.slice(n % list.length), ...list.slice(0, n % list.length)];

export function buildStartup() {
  const out = [];
  const push = (kind, level, rest) => out.push({ key: `${kind}|${JSON.stringify(rest)}`, level, kind, ...rest });
  for (const [procedure, list] of Object.entries(PROCEDURES)) {
    const ids = list.map((s) => s.id);
    ids.forEach((id, i) => {
      const others = (exclude) => rotate(ids.filter((x) => !exclude.includes(x)), i).slice(0, 3);
      if (i < ids.length - 1) push("suivante", 1, { procedure, from: id, answer: ids[i + 1], options: [ids[i + 1], ...others([id, ids[i + 1]])].sort() });
      if (i > 0) push("precedente", 2, { procedure, from: id, answer: ids[i - 1], options: [ids[i - 1], ...others([id, ids[i - 1]])].sort() });
    });
  }
  ERRORS.forEach((e, i) => {
    const others = rotate(ERRORS.filter((x) => x.id !== e.id), i).slice(0, 3).map((x) => x.id);
    push("erreur", 3, { error: e.id, answer: e.id, options: [e.id, ...others].sort() });
  });
  for (const [gas, colour] of Object.entries(FACTS.hoses)) {
    push("tuyau", 1, { gas, answer: colour, options: ["bleu", "rouge", "vert", "jaune"] });
  }
  for (const [kind, angle] of Object.entries(FACTS.angles)) {
    push("tenue", 2, { what: kind, answer: angle, options: ["30", "45", "50-70", "90"] });
  }
  return { procedures: PROCEDURES, errors: ERRORS, facts: FACTS, situations: out };
}
