// Situations de la figure `longueur-developpee` (Partie 4, module 4, « Calcul des longueurs » ; décisions Q89, Q90).
// Un tube cintré une ou deux fois, avec ses cotes mesurées jusqu'au sommet de chaque coude. Chaque situation se fait
// pas à pas : chaque longueur droite (cote moins le retrait R × tan(α/2) de chaque coude qu'elle touche), chaque arc
// (2 × π × R × α / 360), puis LD. Les leurres reprennent les erreurs courantes. Rien n'est enregistré (Q73).
// Rayons : acier = abaque du support ; cuivre = pratique courante, à confirmer (p4/CORRECTIONS.md).

export const RADII = {
  acier: { '3/8"': 46.5, '1/2"': 55.5, '3/4"': 71, '1"': 94, '1 1/4"': 150, '1 1/2"': 163, '2"': 220 },
  cuivre: { "1/4": 14.3, "5/16": 17.5, "3/8": 23.8, "1/2": 38.1, "5/8": 47.6, "3/4": 57.2, "7/8": 66.7 },
};

const r1 = (x) => Math.round(x * 10) / 10;
const rad = (deg) => (deg * Math.PI) / 180;
const backOf = (R, a) => R * Math.tan(rad(a) / 2);

function geometry(R, angles, cotes) {
  const back = angles.map((a) => backOf(R, a));
  const straights = [cotes[0] - back[0]];
  for (let i = 1; i < angles.length; i++) straights.push(cotes[i] - back[i - 1] - back[i]);
  straights.push(cotes[cotes.length - 1] - back[back.length - 1]);
  const arcs = angles.map((a) => (2 * Math.PI * R * a) / 360);
  return { back, straights, arcs, ld: straights.reduce((x, y) => x + y, 0) + arcs.reduce((x, y) => x + y, 0) };
}

// Garde la réponse et jusqu'à 3 leurres positifs, à 0,5 mm au moins de la réponse et entre eux.
function optionsOf(answer, candidates) {
  const picked = [answer];
  const add = (v) => {
    const x = r1(v);
    if (x > 0 && picked.every((p) => Math.abs(p - x) >= 0.5)) picked.push(x);
  };
  candidates.forEach((v) => picked.length < 4 && add(v));
  [10, -10, 25, -25].forEach((d) => picked.length < 3 && add(answer + d));
  return picked.sort((a, b) => a - b);
}

function stepsOf(R, angles, cotes) {
  const { back, straights, arcs, ld } = geometry(R, angles, cotes);
  const steps = straights.map((v, i) => {
    const touching = [back[i - 1], back[i]].filter((b) => b !== undefined);
    const cote = cotes[i];
    return {
      kind: "droite",
      index: i,
      answer: r1(v),
      options: optionsOf(r1(v), [cote, cote - touching.length * R, cote - 2 * touching.reduce((x, y) => x + y, 0), cote + touching[0]]),
    };
  });
  arcs.forEach((v, i) =>
    steps.push({ kind: "arc", index: i, answer: r1(v), options: optionsOf(r1(v), [R, (Math.PI * R) / 2, 2 * v, v / 2]) }),
  );
  const sumCotes = cotes.reduce((x, y) => x + y, 0);
  const sumStraights = straights.reduce((x, y) => x + y, 0);
  steps.push({ kind: "ld", index: 0, answer: r1(ld), options: optionsOf(r1(ld), [sumCotes, sumStraights, sumStraights + angles.length * R, ld + arcs[0]]) });
  return steps;
}

const range = (from, to, step) => Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);

export function buildLengths() {
  const out = [];
  const add = (level, material, size, angles, cotes) => {
    const R = RADII[material][size];
    const { straights } = geometry(R, angles, cotes);
    if (Math.min(...straights) < 20) return;
    const key = JSON.stringify({ material, size, angles, cotes });
    out.push({ key, level, tube: { material, size }, radius: R, angles, cotes, steps: stepsOf(R, angles, cotes) });
  };
  const grid = range(120, 390, 30);
  const tubes = (material) => Object.keys(RADII[material]);
  for (const size of tubes("acier")) for (const a of grid) for (const b of grid) add(1, "acier", size, [90], [a, b]);
  for (const size of tubes("cuivre")) for (const a of grid) for (const b of grid) add(2, "cuivre", size, [90], [a, b]);
  const coarse = range(120, 360, 60);
  for (const material of ["acier", "cuivre"]) {
    for (const size of tubes(material)) {
      for (const angle of [30, 45, 60, 120, 135]) for (const a of coarse) for (const b of coarse) add(3, material, size, [angle], [a, b]);
      for (const angles of [[90, 90], [45, 45]]) for (const a of [150, 250, 350]) for (const b of [200, 300, 400]) for (const c of [150, 250, 350]) add(4, material, size, angles, [a, b, c]);
    }
  }
  return { radii: RADII, situations: out };
}
