// Embarque un module ES dans le script d'une figure, sous un espace de noms : `const G = (() => { ... })();`.
// Les `import` sont retirés : les fonctions du kit iso sont globales dans la page (kit.js), et un module qui
// importe `* as G` retrouve l'espace de noms G déclaré avant lui.
import { readFileSync } from "node:fs";

export function namespaced(file, name) {
  let source = readFileSync(file, "utf8").replace(/^import .*$/gm, "");
  const names = [...source.matchAll(/^export (?:async )?(?:function\*?|const|let|class) ([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
  source = source.replace(/^export /gm, "");
  return `const ${name} = (() => {\n${source}\nreturn { ${names.join(", ")} };\n})();\n`;
}
