// Partie commune aux figures raccords, choix-raccord et tailles-tuyaux : modules embarqués, dessin, séries de 10.
// Une série tire 10 situations du catalogue, de difficulté croissante (niveaux 1 à 4), au hasard dans le navigateur ;
// la réponse se donne au toucher parmi 3 ou 4 propositions, la correction est immédiate. Rien n'est enregistré (Q73).
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { namespaced } from "./bundle.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const MODULES =
  namespaced(join(HERE, "lathe.mjs"), "G") +
  namespaced(join(HERE, "tube.mjs"), "TB") +
  namespaced(join(HERE, "..", "_data", "raccords.mjs"), "R") +
  namespaced(join(HERE, "raccords-text.mjs"), "XT") +
  namespaced(join(HERE, "raccords-draw.mjs"), "D");

// Fragment : boutons désactivés jusqu'à ce que le script de la figure appelle ready().
export const waitingButtons = (html) => html.replace(/<button type="button"/g, '<button type="button" disabled');

export const fittingsScript = ({ lang, P, TX, extra = {} }) =>
  `${MODULES}const FIG = ${JSON.stringify(extra)};\nconst LANG = "${lang}";\nconst PROJ = ${JSON.stringify(P)};\nconst TX = ${TX};\n`;

export const FITTINGS_CSS = `
.rc-hole{fill:var(--anatomy-page);stroke:var(--anatomy-mid);stroke-width:.5}
.rc-halo{opacity:.7}
g[data-tint="cuivre"]{filter:sepia(.8) saturate(2.4) hue-rotate(-14deg) brightness(1.9)}
g[data-tint="laiton"]{filter:sepia(.9) saturate(1.7) hue-rotate(8deg) brightness(2)}
g[data-tint="acier"]{filter:brightness(1.5)}
g[data-tint="pvc"]{filter:brightness(2.1)}
g[data-tint="gaine"]{filter:sepia(.7) saturate(2.6) hue-rotate(-30deg) brightness(1.8)}
[data-theme="light"] g[data-tint="cuivre"]{filter:sepia(1) saturate(4) hue-rotate(-38deg) brightness(.78)}
[data-theme="light"] g[data-tint="laiton"]{filter:sepia(1) saturate(2.2) hue-rotate(6deg) brightness(.85)}
[data-theme="light"] g[data-tint="acier"],[data-theme="light"] g[data-tint="pvc"]{filter:none}
[data-theme="light"] g[data-tint="gaine"]{filter:sepia(1) saturate(3) hue-rotate(-32deg) brightness(.85)}
.rc-tag circle{fill:var(--anatomy-card);stroke:var(--anatomy-mid);stroke-width:.8}
.rc-tag text{font:600 9px/1 var(--anatomy-mono);fill:var(--anatomy-strong)}
.rc-prompt{margin:16px 0 0;min-height:1.6em;color:var(--anatomy-strong);font-weight:600;line-height:1.45}
.rc-quiz[hidden],.mv-controls button[hidden]{display:none}
.rc-options{flex-direction:column}
.rc-options button{text-align:left;border-radius:14px}
.rc-options button[data-state="right"]{border-color:var(--anatomy-lit);box-shadow:inset 0 0 0 1px var(--anatomy-lit)}
.rc-options button[data-state="wrong"]{border-style:dashed}
.rc-options button:disabled{opacity:1;cursor:default}
`;

export const FITTINGS_LIVE = `
const K = { iso, pathOf, depthOf, solidSvg, lineSvg, haloOf, cylinder };
const draw = D.makeDraw(K, G, TB);
const X = XT.makeText(R, LANG);
const CAT = R.buildCatalogue();
const live = svg.querySelector(".rc-live");
const prompt = scope.querySelector(".rc-prompt");
const quizBox = scope.querySelector(".rc-quiz");
const optionsBox = scope.querySelector(".rc-options");
const odOf = (material, id) => R.MATERIALS[material].sizes.find((s) => s.id === id).od;
function paint(f, options) { live.innerHTML = draw.scene(f, f.sizes.map((s) => odOf(f.material, s)), PROJ, options); }
function byLevel(list) { const out = { 1: [], 2: [], 3: [], 4: [] }; list.forEach((s) => out[s.level].push(s)); return out; }
const PLAN = [1, 1, 1, 2, 2, 2, 3, 3, 4, 4];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// Les boutons du fragment partent désactivés : un toucher avant la fin du chargement ne se perd pas.
function ready() { for (const b of scope.querySelectorAll(".mv-controls button")) b.disabled = false; }
function makeSeries(pool, hooks) {
  let list = [], i = 0, good = 0, answered = false;
  function pick(level) {
    const choices = pool[level];
    for (let tries = 0; tries < 40; tries++) { const s = choices[Math.floor(Math.random() * choices.length)]; if (!list.includes(s)) return s; }
    return choices[0];
  }
  function start() { list = []; for (const level of PLAN) list.push(pick(level)); i = 0; good = 0; show(); }
  function show() {
    answered = false;
    const s = list[i];
    hooks.show(s);
    feedback.textContent = "";
    const shuffled = s.options.slice().sort(() => Math.random() - 0.5);
    optionsBox.replaceChildren(...shuffled.map((o) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = hooks.label(s, o);
      b.addEventListener("click", () => answer(s, o));
      b._option = o;
      return b;
    }));
    buttons.again.disabled = true;
    scoreEl.textContent = TX.score(good, i) + " · " + TX.step(i + 1, list.length);
  }
  function answer(s, o) {
    if (answered) return;
    answered = true;
    const ok = same(o, s.answer);
    if (ok) good++;
    for (const b of optionsBox.children) {
      b.disabled = true;
      if (same(b._option, s.answer)) { b.dataset.state = "right"; b.prepend("✓ "); b.setAttribute("aria-label", TX.marks.right + " : " + b.textContent.slice(2)); }
      else if (same(b._option, o)) { b.dataset.state = "wrong"; b.prepend("✗ "); b.setAttribute("aria-label", TX.marks.wrong + " : " + b.textContent.slice(2)); }
    }
    let message = (ok ? TX.right : TX.wrong(hooks.label(s, s.answer))) + " " + (hooks.explain ? hooks.explain(s, o, ok) : "");
    if (hooks.after) hooks.after(s, o, ok);
    const last = i === list.length - 1;
    if (last) message += " " + TX.done(good, list.length);
    feedback.textContent = message;
    buttons.again.disabled = last;
    scoreEl.textContent = TX.score(good, i + 1) + " · " + TX.step(i + 1, list.length);
  }
  buttons.again.addEventListener("click", () => { if (i < list.length - 1) { i++; show(); } });
  buttons.series.addEventListener("click", start);
  return { start, answer: (index) => answer(list[i], list[i].options[index]), current: () => list[i], state: () => ({ i, good, total: list.length }) };
}
`;
