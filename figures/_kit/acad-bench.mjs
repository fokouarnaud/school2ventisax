// Éléments communs aux figures de la Partie 4 : banc, styles de commandes, page et publication.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./iso-kit.mjs";
import { publish } from "./publish.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const KIT_SOURCE = readFileSync(join(HERE, "iso-kit.mjs"), "utf8").replace(/^export /gm, "");

// Plaque de banc sur pieds, vis d'angle et réglette graduée.
export function bench(P, PLATE, { height = 10, foot = 5, strip = null } = {}) {
  const S = (paths, style) => k.solidSvg(paths, style);
  const L = (d, style) => k.lineSvg(d, style);
  const depth = (x, y) => k.depthOf([x, y, 0], P);
  const o = [`<path class="iso-halo" d="${k.haloOf(PLATE, -height - foot, height, P)}"/>`];
  for (const [x, y] of k.corners(PLATE, 24).sort((a, b) => depth(...a) - depth(...b))) {
    o.push(S(k.cylinder(x, y, 7, -height - foot, 1.6, P, 28), { tone: "lo" }));
    o.push(S(k.cylinder(x, y, 5.4, -height - foot + 1.6, foot - 1.6, P, 28), { tone: "mid" }));
  }
  o.push(S(k.slabOf(PLATE, -height, height, P, 8, 1.6), { tone: "mid", inner: L(k.sideSeam(PLATE, -4, P, 8), { tone: "faint" }) }));
  o.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  o.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  o.push(k.dotsSvg(screws.map(([x, y]) => k.iso([x, y, 0], P)), { size: 0.5 }));
  if (strip) {
    o.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
    const t = k.topTicks(strip.y + 4, strip.y + strip.d - 4, 4, 5, strip.x + 0.8, 0.6, [1.8, 3.4], P, "y");
    o.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  }
  return o.join("");
}

export const CONTROLS_CSS = `
.iso-stage{touch-action:manipulation}
.iso-plate-corner[data-corner="hint"]{top:20px;bottom:auto;right:0;white-space:normal;line-height:1.35}
.iso-plate-corner[data-corner="readout"]{left:0;white-space:normal;text-align:right;line-height:1.4}
.iso-plate{padding-top:80px}
.mv-controls{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}
.mv-controls button{font:12px/1.2 var(--anatomy-mono);letter-spacing:.04em;color:var(--anatomy-strong);background:var(--anatomy-card);border:1px solid var(--anatomy-mid);border-radius:999px;padding:12px 14px;min-height:44px;cursor:pointer}
.mv-controls button[aria-pressed="true"]{border-color:var(--anatomy-lit);box-shadow:inset 0 0 0 1px var(--anatomy-lit)}
.mv-controls button:focus-visible{outline:2px solid var(--anatomy-hi);outline-offset:2px}
.mv-controls button:disabled{opacity:.45;cursor:default}
.mv-feedback{margin:12px 0 0;min-height:3em;color:var(--anatomy-text);font-size:13px;line-height:1.55}
.mv-score{color:var(--anatomy-muted);font:11px/1 var(--anatomy-mono);margin-top:6px}
@media (max-width:560px){.iso-plate{padding:76px 12px 64px}.mv-controls button{flex:1 1 40%}}
`;

export const buttonsHtml = (label, list) =>
  `<div class="mv-controls" role="group" aria-label="${label}">${list.map(([act, text]) => `<button type="button" data-act="${act}">${text}</button>`).join("")}</div><p class="mv-feedback" aria-live="polite"></p><p class="mv-score" aria-live="polite"></p>`;

// Écrit les pages autonomes (fr/en, sombre/clair) à côté du script, puis publie dans le site.
export function writeFigure(here, name, langs, css) {
  const site = { fragments: {}, scripts: {} };
  const written = [];
  for (const [lang, { plate, script, title }] of Object.entries(langs)) {
    site.fragments[lang] = plate;
    site.scripts[lang] = script;
    for (const theme of ["dark", "light"]) {
      const file = `${name}.${lang}${theme === "light" ? "-light" : ""}.html`;
      writeFileSync(join(here, file), k.pageHtml({ title, theme, body: `<style>${css}</style>${plate}`, script: KIT_SOURCE + script, width: 760 }).replace('<html lang="en">', `<html lang="${lang}">`));
      written.push(file);
    }
  }
  written.push(...publish(name, { ...site, css }));
  console.log("wrote", written.join(", "));
}

// Script commun : portée de la figure, éléments, boutons, et boucle d'animation à la demande.
export const LIVE_HEAD = (name) => `
const still = matchMedia("(prefers-reduced-motion: reduce)");
const scope = document.querySelector('.live-figure[data-figure="${name}"]') || document;
const root = scope.querySelector(".iso-plate");
const stage = root.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const readout = root.querySelector("[data-readout]");
const feedback = scope.querySelector(".mv-feedback");
const scoreEl = scope.querySelector(".mv-score");
const buttons = Object.fromEntries([...scope.querySelectorAll(".mv-controls button")].map((b) => [b.dataset.act, b]));
let frame = 0, last = 0, visible = false;
function loop(step, busy) {
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60; last = now;
    step(still.matches ? dt * 6 : dt);
    frame = visible && busy() ? requestAnimationFrame(tick) : 0;
  }
  return () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
}
`;
export const LIVE_WATCH = `new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);\n`;
