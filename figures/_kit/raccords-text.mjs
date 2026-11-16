// Libellés fr/en des raccords et des tubes, communs aux figures raccords, choix-raccord et tailles-tuyaux.
// `R` = catalogue (figures/_data/raccords.mjs).

export function makeText(R, lang) {
  const fr = lang === "fr";
  const THREADED = ["dudgeon", "filete"];
  const gender = { M: fr ? "mâle" : "male", F: fr ? "femelle" : "female" };
  const MODE = fr
    ? { braser: "à braser", sertir: "à sertir", dudgeon: "dudgeon", filete: "fileté", coller: "à coller", emboiter: "à emboîter" }
    : { braser: "brazed", sertir: "press", dudgeon: "flare", filete: "threaded", coller: "solvent-weld", emboiter: "push-fit" };
  const MATERIAL = fr
    ? { "cuivre-pouce": "cuivre", "cuivre-metrique": "cuivre", acier: "acier", pvc: "PVC", gaine: "gaine", multicouche: "multicouche" }
    : { "cuivre-pouce": "copper", "cuivre-metrique": "copper", acier: "steel", pvc: "PVC", gaine: "conduit", multicouche: "multilayer" };
  const num = (v) => (fr ? String(v).replace(".", ",") : String(v));

  function sizeLabel(material, id) {
    if (material === "cuivre-pouce") return id;
    if (material === "acier") return R.MATERIALS.acier.sizes.find((s) => s.id === id).label[lang].split(" (")[0];
    return `${num(id)} mm`;
  }
  const sizesLabel = (material, sizes) => [...new Set(sizes)].map((s) => sizeLabel(material, s)).join(" × ");

  function nameLabel({ type, angle, ends }, mode) {
    let name = R.TYPES[type][lang];
    if (type === "coude") name += ` ${angle}°`;
    if (THREADED.includes(mode) || ends.includes("M")) name += ` ${ends.map((e) => gender[e]).join("/")}`;
    return name;
  }
  const fittingLabel = (f) => `${nameLabel(f, f.mode)} ${sizesLabel(f.material, f.sizes)}, ${MODE[f.mode]}, ${MATERIAL[f.material]}`;
  const tubeLabel = ({ material, size }) => `${MATERIAL[material]} ${sizeLabel(material, size)}`;

  const PRESENT = fr
    ? { tube: "tube lisse", "tube-evase": "tube évasé avec son écrou", "port-male": "orifice mâle d'une vanne", "port-femelle": "orifice femelle d'une vanne", "tube-filete": "tube fileté" }
    : { tube: "plain pipe", "tube-evase": "flared pipe with its nut", "port-male": "male valve port", "port-femelle": "female valve port", "tube-filete": "threaded pipe" };
  const CONSTRAINT = fr
    ? { permanent: "assemblage permanent, flamme autorisée", "sans-flamme": "flamme interdite dans le local", demontable: "assemblage démontable", colle: "évacuation en PVC", emboite: "gaine électrique", filete: "tuyauterie en acier filetée" }
    : { permanent: "permanent joint, flame allowed", "sans-flamme": "no flame allowed in the room", demontable: "removable joint", colle: "PVC drain", emboite: "electrical conduit", filete: "threaded steel pipework" };
  const GEOMETRY = fr
    ? { droit: "dans l'axe", 45: "avec un changement de direction de 45°", 90: "avec un changement de direction de 90°", 135: "avec un changement de direction de 135°", 180: "en retour (180°)", derivation: "avec une dérivation sur le bout 3" }
    : { droit: "in line", 45: "with a 45° change of direction", 90: "with a 90° change of direction", 135: "with a 135° change of direction", 180: "as a return (180°)", derivation: "with a branch to end 3" };

  return { fr, num, MODE, MATERIAL, PRESENT, CONSTRAINT, GEOMETRY, sizeLabel, sizesLabel, nameLabel, fittingLabel, tubeLabel };
}
