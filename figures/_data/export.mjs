// Affiche l'export JSON du catalogue des raccords (lu par courses/tests/test_fittings.py).
// Une situation par ligne, pour des sorties comparables. Aucun fichier n'est écrit.
import { buildCatalogue } from "./raccords.mjs";

const { situations, ...rest } = buildCatalogue();
const head = JSON.stringify(rest).slice(0, -1);
const blocks = Object.entries(situations).map(
  ([name, list]) => `${JSON.stringify(name)}:[\n${list.map((s) => JSON.stringify(s)).join(",\n")}\n]`,
);
process.stdout.write(`${head},"situations":{\n${blocks.join(",\n")}\n}}\n`);
