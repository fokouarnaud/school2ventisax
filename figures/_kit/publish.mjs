// Publie une figure dans le site Django : static/acad/figures/<nom>.<lang>.html (fragment sans script),
// <nom>.<lang>.js (script autonome, sans module), <nom>.css, plus le kit et sa feuille, communs à toutes les figures.
// Le chargeur static/acad/js/figures.js les télécharge à la demande (voir courses/figures.py).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ISO_CSS } from "./iso-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
export const STATIC = join(HERE, "..", "..", "static", "acad", "figures");
const KIT = readFileSync(join(HERE, "iso-kit.mjs"), "utf8").replace(/^export /gm, "");

// Dans le site, la carte de la figure prend la largeur de la colonne de lecture.
const SITE_CSS = `
.live-figure .iso{color:var(--anatomy-text);font:14px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
.live-figure .iso-figure{margin:0}
.live-figure .iso-legend{margin-bottom:0}
.live-figure .iso-plate-corner[data-corner="hint"]{top:20px;bottom:auto;left:0;right:0;white-space:normal;line-height:1.35}
.live-figure .iso-plate-corner[data-corner="readout"]{left:0;right:0;white-space:normal;text-align:right;line-height:1.4}
`;

export function publish(name, { fragments, scripts, css }) {
  mkdirSync(STATIC, { recursive: true });
  writeFileSync(join(STATIC, "kit.js"), `/* Kit isométrique (skill anatomy, licence MIT, figures/_kit/LICENSE) */\n${KIT}`);
  writeFileSync(join(STATIC, "iso.css"), ISO_CSS + SITE_CSS);
  writeFileSync(join(STATIC, `${name}.css`), css);
  const written = [];
  for (const lang of Object.keys(fragments)) {
    if (/<script/i.test(fragments[lang])) throw new Error(`${name}.${lang}.html : un fragment ne contient jamais de script`);
    writeFileSync(join(STATIC, `${name}.${lang}.html`), `<div class="iso" data-theme="light" lang="${lang}">${fragments[lang]}</div>\n`);
    // Une figure peut être chargée à côté d'une autre : son code reste dans sa propre portée.
    writeFileSync(join(STATIC, `${name}.${lang}.js`), `(() => {\n${scripts[lang]}\n})();\n`);
    written.push(`${name}.${lang}.html`, `${name}.${lang}.js`);
  }
  return written;
}
