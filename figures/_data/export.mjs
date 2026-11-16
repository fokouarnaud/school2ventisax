// Affiche l'export JSON d'un catalogue de figures, lu par les tests :
//   node figures/_data/export.mjs            catalogue des raccords (courses/tests/test_fittings.py)
//   node figures/_data/export.mjs longueurs  situations de la longueur développée (courses/tests/test_lengths.py)
//   node figures/_data/export.mjs manodetendeurs  situations du manodétendeur (courses/tests/test_regulator.py)
// Une situation par ligne, pour des sorties comparables. Aucun fichier n'est écrit.
import { buildCatalogue } from "./raccords.mjs";
import { buildLengths } from "./longueurs.mjs";
import { buildRegulators } from "./manodetendeurs.mjs";

const which = process.argv[2] || "raccords";
const build = { longueurs: buildLengths, manodetendeurs: buildRegulators }[which] || buildCatalogue;
const { situations, ...rest } = build();
const head = JSON.stringify(rest).slice(0, -1);
const lines = (list) => `[\n${list.map((s) => JSON.stringify(s)).join(",\n")}\n]`;
const body = Array.isArray(situations)
  ? lines(situations)
  : `{\n${Object.entries(situations).map(([name, list]) => `${JSON.stringify(name)}:${lines(list)}`).join(",\n")}\n}`;
process.stdout.write(`${head},"situations":${body}}\n`);
