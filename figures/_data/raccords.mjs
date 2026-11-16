// Catalogue des raccords et des tubes du frigoriste (Partie 4, modules 2 à 4 ; décisions Q73 à Q80).
// Seule source des situations d'entraînement des figures `raccords`, `choix-raccord` et `tailles-tuyaux`.
// Toutes les situations sont énumérées ici, de façon déterministe ; la figure les tire au hasard dans le
// navigateur, rien n'est enregistré (Q73). `node figures/_data/export.mjs --stdout` en donne l'export JSON,
// lu par `courses/tests/test_fittings.py` (aucun fichier versionné). Aucune marque (Q62). Usages par taille : valeurs à confirmer (CORRECTIONS.md).

const L = (fr, en) => ({ fr, en });
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

function inchLabel(n) {
  const whole = Math.floor(n / 16);
  const rest = n % 16;
  const g = gcd(rest, 16);
  const frac = rest ? `${rest / g}/${16 / g}` : "";
  return [whole || "", frac].filter(Boolean).join(" ");
}

// ------------------------------------------------------------------ usages (Q74, Q77)
export const USAGES = {
  "menager-liaisons": L("Petites liaisons du froid ménager (réfrigérateur, congélateur)", "Small lines in domestic refrigeration (fridge, freezer)"),
  "liquide-split": L("Ligne liquide d'un split", "Liquid line of a split system"),
  "aspiration-menager": L("Aspiration du froid ménager et des petits groupes", "Suction line of domestic appliances and small units"),
  "aspiration-petit-split": L("Aspiration d'un petit split (2,5 à 3,5 kW environ)", "Suction line of a small split (about 2.5 to 3.5 kW)"),
  "aspiration-split-5kw": L("Aspiration d'un split d'environ 5 kW", "Suction line of a split of about 5 kW"),
  "aspiration-split-7-10kw": L("Aspiration d'un split de 7 à 10 kW environ", "Suction line of a split of about 7 to 10 kW"),
  "aspiration-gros-groupe": L("Aspiration des gros splits et des groupes de chambre froide", "Suction line of large splits and cold room units"),
  "collecteur-commercial": L("Collecteurs et aspirations des installations commerciales", "Headers and suction lines of commercial systems"),
  "collecteur-centrale": L("Collecteurs des grosses installations (centrales frigorifiques)", "Headers of large systems (refrigeration packs)"),
  "condensats-split": L("Évacuation des condensats d'un split", "Condensate drain of a split system"),
  "condensats-collectif": L("Évacuation des condensats de plusieurs unités", "Condensate drain shared by several units"),
  "evacuation-appareils": L("Évacuation d'appareils (évier, lave-mains, bac de dégivrage)", "Drain of appliances (sink, hand basin, defrost tray)"),
  "evacuation-collecteur": L("Collecteur d'évacuation d'un local", "Drain header of a room"),
  "evacuation-chute": L("Chute et collecteur principal d'évacuation", "Soil stack and main drain"),
  "gaine-liaison": L("Câble de liaison et de commande entre unités intérieure et extérieure", "Interconnecting and control cable between indoor and outdoor units"),
  "gaine-alimentation": L("Alimentation électrique d'une unité (câble 3 × 2,5 mm²)", "Power supply of a unit (3 × 2.5 mm² cable)"),
  "gaine-forte-section": L("Alimentation de forte section (unité triphasée, groupe)", "Large-section supply (three-phase unit, condensing unit)"),
  "eau-uniquement": L("Eau sanitaire ou de chauffage uniquement, jamais de fluide frigorigène", "Domestic or heating water only, never refrigerant"),
};

const INCH_USAGE = {
  3: "menager-liaisons", 4: "liquide-split", 5: "aspiration-menager", 6: "aspiration-petit-split", 8: "aspiration-split-5kw",
  10: "aspiration-split-7-10kw", 12: "aspiration-gros-groupe", 14: "collecteur-commercial", 18: "collecteur-centrale",
};
const PVC_USAGE = {
  16: "condensats-split", 20: "condensats-split", 32: "condensats-collectif", 40: "evacuation-appareils",
  50: "evacuation-appareils", 63: "evacuation-collecteur", 100: "evacuation-chute",
};
const SHEATH_USAGE = { 16: "gaine-liaison", 20: "gaine-alimentation", 25: "gaine-forte-section" };

// Méthode des moitiés : 1 pouce = 25,4 mm, puis on coupe en deux (12,7 ; 6,35 ; 3,2 ; 1,6). Chaque taille de la série
// est une ou deux de ces fractions, ajoutées ou retirées (3/8 = 1/4 + 1/8 ; 7/8 = 1 - 1/8).
export const LADDER = { 1: 25.4, "1/2": 12.7, "1/4": 6.35, "1/8": 3.175, "1/16": 1.5875 };
const HALVES = {
  3: [["+", "1/8"], ["+", "1/16"]], 4: [["+", "1/4"]], 5: [["+", "1/4"], ["+", "1/16"]], 6: [["+", "1/4"], ["+", "1/8"]],
  8: [["+", "1/2"]], 10: [["+", "1/2"], ["+", "1/8"]], 12: [["+", "1/2"], ["+", "1/4"]], 14: [["+", "1"], ["-", "1/8"]],
  18: [["+", "1"], ["+", "1/8"]],
};

// ------------------------------------------------------------------ matériaux et séries de diamètres (Q74, Q77)
const metric = (od, di) => ({ id: String(od), od, label: L(`${di} × ${od} mm`, `${di} × ${od} mm`) });

export const MATERIALS = {
  "cuivre-pouce": {
    label: L("Cuivre frigorifique, série pouce", "Refrigeration copper, inch series"),
    fluid: "frigorigene",
    sizes: [3, 4, 5, 6, 8, 10, 12, 14, 18].map((n) => ({
      id: inchLabel(n), sixteenths: n, od: (n * 254) / 160, usage: INCH_USAGE[n], halves: HALVES[n],
    })),
  },
  "cuivre-metrique": {
    label: L("Cuivre, série métrique", "Copper, metric series"),
    fluid: "frigorigene",
    sizes: [[6, 4], [8, 6], [10, 8], [12, 10], [14, 12], [16, 14], [20, 18], [22, 20], [28, 26], [36, 34]].map(([od, di]) => metric(od, di)),
  },
  acier: {
    label: L("Acier fileté (série gaz)", "Threaded steel (gas series)"),
    fluid: "frigorigene",
    sizes: [["DN8", '1/4"', 13.5], ["DN10", '3/8"', 17.2], ["DN15", '1/2"', 21.3], ["DN20", '3/4"', 26.9], ["DN25", '1"', 33.7]].map(
      ([id, thread, od]) => ({ id, od, label: L(`${thread} gaz (${id})`, `${thread} BSP (${id})`) }),
    ),
  },
  pvc: {
    label: L("PVC d'évacuation", "PVC drain pipe"),
    fluid: "eau",
    sizes: [16, 20, 32, 40, 50, 63, 100].map((od) => ({ id: String(od), od, usage: PVC_USAGE[od] })),
  },
  gaine: {
    label: L("Gaine électrique ICTA", "Flexible electrical conduit (ICTA)"),
    fluid: "aucun",
    sizes: [16, 20, 25].map((od) => ({ id: String(od), od, usage: SHEATH_USAGE[od] })),
  },
  multicouche: {
    label: L("Multicouche", "Multilayer pipe"),
    fluid: "eau",
    sizes: [16, 20, 26].map((od) => ({ id: String(od), od, usage: "eau-uniquement" })),
  },
};

export const MODES = {
  braser: L("Braser (à souder)", "Brazing (solder fitting)"),
  sertir: L("Sertir sans flamme", "Flameless press fitting"),
  dudgeon: L("Visser sur tube évasé (dudgeon)", "Flare fitting"),
  filete: L("Visser (fileté)", "Threaded"),
  coller: L("Coller", "Solvent welding"),
  emboiter: L("Emboîter", "Push fit"),
};
export const TYPES = {
  manchon: L("Manchon", "Coupling"),
  reduction: L("Réduction", "Reducer"),
  coude: L("Coude", "Elbow"),
  te: L("Té", "Tee"),
};
export const FUNCTIONS = {
  prolonger: L("Prolonger un tube", "Extend a pipe"),
  "changer-diametre": L("Passer d'un diamètre à un autre", "Change from one diameter to another"),
  "changer-direction": L("Changer de direction", "Change direction"),
  deriver: L("Créer une dérivation", "Create a branch"),
};
const FUNCTION_OF = { manchon: "prolonger", reduction: "changer-diametre", coude: "changer-direction", te: "deriver" };

// Outils réglés sur le diamètre du tube (mode « outil », Q84).
const inchIds = (...ns) => ns.map(inchLabel);
export const TOOLS = {
  dudgeonniere: { label: L("Trou de la dudgeonnière", "Flaring bar hole"), sizes: { "cuivre-pouce": inchIds(3, 4, 5, 6, 8, 10, 12) } },
  ecrou: { label: L("Écrou dudgeon", "Flare nut"), sizes: { "cuivre-pouce": inchIds(4, 5, 6, 8, 10, 12) } },
  cintreuse: {
    label: L("Matrice de la cintreuse", "Bender former"),
    sizes: { "cuivre-pouce": inchIds(4, 5, 6, 8, 10, 12, 14), "cuivre-metrique": ["6", "8", "10", "12", "14", "16", "20", "22"] },
  },
  elargisseur: {
    label: L("Tête de l'élargisseur", "Swaging tool head"),
    sizes: { "cuivre-pouce": inchIds(4, 5, 6, 8, 10, 12, 14), "cuivre-metrique": ["8", "10", "12", "14", "16", "20", "22"] },
  },
};

// ------------------------------------------------------------------ règles d'atelier
const MATERIAL_MODES = {
  "cuivre-pouce": ["braser", "sertir", "dudgeon"],
  "cuivre-metrique": ["braser", "sertir"],
  acier: ["filete"],
  pvc: ["coller"],
  gaine: ["emboiter"],
};
const ANGLES = { braser: [45, 90, 180], sertir: [45, 90, 180], coller: [45, 90], filete: [45, 90], dudgeon: [90, 135] };
const THREADED = new Set(["dudgeon", "filete"]);
const CONSTRAINTS = {
  braser: "permanent", sertir: "sans-flamme", dudgeon: "demontable", coller: "colle", emboiter: "emboite", filete: "filete",
};
const PRESENTS = { dudgeon: ["tube-evase", "port-male", "port-femelle"], filete: ["tube-filete", "port-femelle"] };
const NEEDS = { tube: "F", "tube-evase": "M", "port-male": "F", "port-femelle": "M", "tube-filete": "F" };

const ids = (material) => MATERIALS[material].sizes.map((s) => s.id);
const sizeOf = (material, id) => MATERIALS[material].sizes.find((s) => s.id === id);
const idx = (material, id) => ids(material).indexOf(id);

function inRange(material, mode, id) {
  if (material === "cuivre-pouce") {
    const n = sizeOf(material, id).sixteenths;
    if (mode === "dudgeon") return n >= 4 && n <= 12;
    if (mode === "sertir") return n >= 4 && n <= 18;
  }
  if (material === "cuivre-metrique" && mode === "sertir") return sizeOf(material, id).od <= 28;
  return true;
}

export function isValid(f) {
  const { material, mode, type, sizes, ends, angle } = f;
  if (!(MATERIAL_MODES[material] || []).includes(mode)) return false;
  if (!sizes.every((s) => idx(material, s) >= 0 && inRange(material, mode, s))) return false;
  if (material === "gaine" && type !== "manchon") return false;
  if (ends.length !== sizes.length) return false;
  if (type === "manchon" || type === "coude") {
    if (sizes.length !== 2 || sizes[0] !== sizes[1]) return false;
  } else if (type === "reduction") {
    const d = Math.abs(idx(material, sizes[0]) - idx(material, sizes[1]));
    if (sizes.length !== 2 || d < 1 || d > 3) return false;
  } else if (type === "te") {
    const d = idx(material, sizes[0]) - idx(material, sizes[2]);
    if (sizes.length !== 3 || sizes[0] !== sizes[1] || d < 0 || d > 2) return false;
  } else return false;
  if (type === "coude") {
    if (!(ANGLES[mode] || []).includes(angle)) return false;
    if (angle === 135 && (sizes[0] !== "1/4" || ends.join("") !== "MM")) return false;
  } else if (angle !== null) return false;
  const e = ends.join("");
  if (!THREADED.has(mode)) return /^F+$/.test(e);
  if (mode === "dudgeon") {
    if (type === "coude" && e === "FF") return false;
    if (type === "te" && e !== "MMM" && e !== "MMF") return false;
  }
  if (mode === "filete") {
    if (type === "coude" && e === "MM") return false;
    if (type === "te" && e !== "FFF") return false;
  }
  return /^[MF]+$/.test(e);
}

const fitting = (material, mode, type, sizes, ends, angle = null) => ({ material, mode, type, sizes, ends, angle });
const keyOf = (o) => JSON.stringify(o);
const product = (lists) => lists.reduce((acc, list) => acc.flatMap((a) => list.map((x) => [...a, x])), [[]]);

// Raccord voisin : seules les variantes qui existent en atelier servent de leurres.
function variants(f) {
  const out = [];
  const { material, mode, type, sizes, ends, angle } = f;
  const series = ids(material);
  const shift = (id, d) => series[series.indexOf(id) + d];
  if (type === "coude") {
    (ANGLES[mode] || []).filter((a) => a !== angle).forEach((a) => out.push({ ...f, angle: a }));
    out.push({ ...f, type: "manchon", angle: null });
  } else if (type === "te") {
    out.push({ ...f, type: "coude", angle: 90, sizes: sizes.slice(0, 2), ends: ends.slice(0, 2) });
  } else {
    out.push({ ...f, type: "coude", angle: 90, sizes: [sizes[0], sizes[0]], ends: [ends[0], ends[0]] });
  }
  for (const d of [1, -1]) {
    if (type === "te") out.push({ ...f, sizes: [sizes[0], sizes[1], shift(sizes[2], d)] });
    else if (type === "reduction" || type === "manchon") {
      const b = shift(sizes[1], d);
      out.push({ ...f, type: b === sizes[0] ? "manchon" : "reduction", sizes: [sizes[0], b] });
    } else out.push({ ...f, sizes: sizes.map((s) => shift(s, d)) });
  }
  if (THREADED.has(mode)) ends.forEach((_, i) => out.push({ ...f, ends: ends.map((e, j) => (j === i ? (e === "M" ? "F" : "M") : e)) }));
  for (const other of MATERIAL_MODES[material].filter((m) => m !== mode)) {
    out.push({ ...f, mode: other, ends: ends.map(() => (THREADED.has(other) ? "M" : "F")) });
  }
  for (const d of [1, -1]) out.push({ ...f, sizes: sizes.map((s) => shift(s, d)) });
  // Matériau voisin, au diamètre le plus proche : 3/8 ↔ 10 mm, gaine 16 ↔ PVC 16.
  const twin = { "cuivre-pouce": "cuivre-metrique", "cuivre-metrique": "cuivre-pouce", gaine: "pvc", pvc: "gaine" }[material];
  if (twin) {
    const near = (id) => {
      const od = sizeOf(material, id).od;
      return MATERIALS[twin].sizes.reduce((a, b) => (Math.abs(b.od - od) < Math.abs(a.od - od) ? b : a)).id;
    };
    const twinMode = MATERIAL_MODES[twin].includes(mode) ? mode : MATERIAL_MODES[twin][0];
    out.push({ ...f, material: twin, mode: twinMode, sizes: sizes.map(near) });
  }
  // Repli : les autres formes du même diamètre et du même mode (manchon, coudes, té), genres usuels.
  const a = sizes[0];
  const usual = (n) => Array(n).fill(mode === "dudgeon" ? "M" : "F");
  out.push(fitting(material, mode, "manchon", [a, a], usual(2)));
  (ANGLES[mode] || []).forEach((angle) => out.push(fitting(material, mode, "coude", [a, a], usual(2), angle)));
  out.push(fitting(material, mode, "te", [a, a, a], usual(3)));
  [shift(a, 1), shift(a, -1)].forEach((b) => b && out.push(fitting(material, mode, "reduction", [a, b], usual(2))));
  return out.filter((v) => v.sizes.every(Boolean) && isValid(v));
}

function options(answer, candidates, seed, count = 3) {
  const seen = new Set([keyOf(answer)]);
  const unique = candidates.filter((c) => !seen.has(keyOf(c)) && seen.add(keyOf(c)));
  const start = unique.length ? seed % unique.length : 0;
  const picked = [...unique.slice(start), ...unique.slice(0, start)].slice(0, count);
  return [answer, ...picked].sort((a, b) => (keyOf(a) < keyOf(b) ? -1 : 1));
}

// ------------------------------------------------------------------ figure `choix-raccord` (Q76, Q79)
function choiceSituations() {
  const out = [];
  for (const [material, modes] of Object.entries(MATERIAL_MODES)) {
    for (const mode of modes) {
      const sizes = ids(material).filter((s) => inRange(material, mode, s));
      const presents = PRESENTS[mode] || ["tube"];
      const constraint = CONSTRAINTS[mode];
      const add = (geometry, endSizes, type, angle) => {
        for (const combo of product(endSizes.map(() => presents))) {
          const answer = fitting(material, mode, type, endSizes, combo.map((p) => NEEDS[p]), angle);
          if (!isValid(answer)) continue;
          const ends = endSizes.map((size, i) => ({ material, size, present: combo[i] }));
          const complex = type === "reduction" || type === "te" || angle === 135;
          const level = THREADED.has(mode) ? (complex ? 4 : 3) : complex ? 2 : 1;
          out.push({ answer, ends, geometry, constraint, level });
        }
      };
      for (const a of sizes) {
        for (const b of sizes) {
          if (Math.abs(sizes.indexOf(a) - sizes.indexOf(b)) <= 3) add("droit", [a, b], a === b ? "manchon" : "reduction", null);
        }
        for (const angle of ANGLES[mode] || []) add(String(angle), [a, a], "coude", angle);
        for (const c of sizes.slice(Math.max(0, sizes.indexOf(a) - 2), sizes.indexOf(a) + 1)) add("derivation", [a, a, c], "te", null);
      }
    }
  }
  return out.map((s, i) => ({
    key: keyOf({ ends: s.ends, geometry: s.geometry, constraint: s.constraint }),
    level: s.level,
    ends: s.ends,
    geometry: s.geometry,
    constraint: s.constraint,
    answer: s.answer,
    options: options(s.answer, variants(s.answer), i),
  }));
}

// ------------------------------------------------------------------ figure `raccords` (reconnaître, Q78)
function recognitionSituations(fittings) {
  const modes = Object.keys(MODES);
  const materials = Object.keys(MATERIAL_MODES);
  const nameOf = (f) => ({ type: f.type, angle: f.angle, ends: f.ends });
  const out = [];
  fittings.forEach((f, i) => {
    const kinds = {
      fonction: [1, FUNCTION_OF[f.type], Object.keys(FUNCTIONS)],
      materiau: [2, f.material, materials],
      assemblage: [3, f.mode, modes],
      nom: [4, nameOf(f), variants(f).map(nameOf).concat(Object.keys(TYPES).map((type) => ({ type, angle: null, ends: f.ends })))],
    };
    for (const [kind, [level, answer, pool]] of Object.entries(kinds)) {
      out.push({ key: `${kind}|${keyOf(f)}`, level, kind, fitting: f, answer, options: options(answer, pool, i) });
    }
  });
  return out;
}

// ------------------------------------------------------------------ figure `tailles-tuyaux` (Q77, Q84)
function neighbours(list, value, seed) {
  const i = list.findIndex((x) => keyOf(x) === keyOf(value));
  const around = [list[i - 1], list[i + 1], list[i - 2], list[i + 2], list[i - 3], list[i + 3]].filter((x) => x !== undefined);
  return options(value, around, seed % 2);
}

function sizeSituations() {
  const out = [];
  const push = (kind, level, rest) => out.push({ key: `${kind}|${keyOf(rest)}`, level, kind, ...rest });
  const inch = MATERIALS["cuivre-pouce"].sizes;
  inch.forEach((s, i) => {
    push("seiziemes", 1, { size: s.id, answer: `${s.sixteenths}/16`, options: neighbours([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((n) => `${n}/16`), `${s.sixteenths}/16`, i) });
    // Une mesure au pied à coulisse se lit au centième : 7,94 mm et non 7,9375 mm.
    const hundredth = (v) => Math.round(v * 100) / 100;
    push("pouce-mm", 2, { size: s.id, answer: hundredth(s.od), options: neighbours(inch.map((x) => hundredth(x.od)), hundredth(s.od), i) });
    push("mm-pouce", 1, { size: s.id, answer: s.id, options: neighbours(inch.map((x) => x.id), s.id, i) });
  });
  const tubes = Object.entries(MATERIALS).flatMap(([material, m]) => m.sizes.map((s) => ({ material, size: s.id, od: s.od, usage: s.usage })));
  const plain = ({ material, size }) => ({ material, size });
  tubes.forEach((t, i) => {
    const same = tubes.filter((x) => x.material === t.material).map(plain);
    push("regle", 2, { tube: plain(t), answer: plain(t), options: neighbours(same, plain(t), i) });
    if (t.usage) {
      const others = [...new Set(tubes.filter((x) => x.usage && x.usage !== t.usage).map((x) => x.usage))];
      push("usage", 3, { tube: plain(t), answer: t.usage, options: options(t.usage, others, i) });
      const pool = tubes.filter((x) => x.usage && x.usage !== t.usage).sort((a, b) => Math.abs(a.od - t.od) - Math.abs(b.od - t.od));
      push("tube-pour-usage", 3, { usage: t.usage, answer: plain(t), options: options(plain(t), pool.map(plain), i) });
    }
  });
  for (let a = 0; a < tubes.length; a++) {
    for (let b = a + 1; b < tubes.length; b++) {
      for (let c = b + 1; c < tubes.length; c++) {
        const trio = [tubes[a], tubes[b], tubes[c]];
        const ods = trio.map((t) => t.od);
        if (new Set(ods).size < 3 || Math.max(...ods) / Math.min(...ods) > 1.5) continue;
        const sorted = [...trio].sort((x, y) => x.od - y.od);
        const level = Math.max(...ods) / Math.min(...ods) <= 1.25 ? 4 : 3;
        const shown = trio.map(plain);
        push("plus-gros", level, { tubes: shown, answer: plain(sorted[2]), options: shown });
        push("plus-petit", level, { tubes: shown, answer: plain(sorted[0]), options: shown });
      }
    }
  }
  // Outils : l'énoncé donne la mesure du tube au pied à coulisse, jamais sa désignation. Quand l'outil existe dans les
  // deux séries, la taille la plus proche de l'autre série est proposée aussi (3/8 = 9,53 mm, à ne pas confondre avec 10 mm).
  for (const [tool, { sizes }] of Object.entries(TOOLS)) {
    for (const [material, list] of Object.entries(sizes)) {
      list.forEach((id, i) => {
        const od = sizeOf(material, id).od;
        const tube = { material, size: id };
        const same = neighbours(list, id, i).filter((x) => x !== id).map((size) => ({ material, size }));
        const other = Object.entries(sizes).filter(([m]) => m !== material).map(([m, ids]) => ({ material: m, size: ids.reduce((a, b) => (Math.abs(sizeOf(m, b).od - od) < Math.abs(sizeOf(m, a).od - od) ? b : a)) }));
        const options = [tube, ...other, ...same].slice(0, 4).sort((a, b) => sizeOf(a.material, a.size).od - sizeOf(b.material, b.size).od);
        push(`outil-${tool}`, 3, { measured: Math.round(od * 100) / 100, tube, answer: tube, options });
      });
    }
  }
  return out;
}

export function buildCatalogue() {
  const choice = choiceSituations();
  const seen = new Set();
  const fittings = choice.flatMap((s) => [s.answer, ...s.options]).filter((f) => !seen.has(keyOf(f)) && seen.add(keyOf(f)));
  return {
    materials: MATERIALS,
    modes: MODES,
    types: TYPES,
    functions: FUNCTIONS,
    usages: USAGES,
    tools: TOOLS,
    situations: { raccords: recognitionSituations(fittings), "choix-raccord": choice, "tailles-tuyaux": sizeSituations() },
  };
}
