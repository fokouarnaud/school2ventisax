// Figure interactive (skill anatomy) : retenir les tailles de tubes (seizièmes de pouce, mm, usages, outils).
// Partie 4, module 3 (imprimé 22), Complément « Retenir les tailles de tubes », et module 4, « Évasements »
// (mode outil). Décisions Q74, Q77, Q79, Q84, Q85. Tubes dessinés debout, à l'échelle, sur une règle en mm.
// Usage : node figures/tailles-tuyaux/build.mjs
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../_kit/iso-kit.mjs";
import { bench, CONTROLS_CSS, LIVE_HEAD, LIVE_WATCH, writeFigure } from "../_kit/acad-bench.mjs";
import { FITTINGS_CSS, FITTINGS_LIVE, fittingsScript, waitingButtons } from "../_kit/raccords-live.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const NAME = "tailles-tuyaux";
const AZ = 70, WIDTH = 680, HEIGHT = 380;
const PLATE = { x: -108, y: -48, w: 216, d: 96, r: 8 };
const P = k.fitProjection([...k.boxCorners(PLATE, -15, 0), [-90, -20, 48], [90, -20, 48]], WIDTH, HEIGHT, { pad: 14, azimuth: AZ, elevation: 28 });

const TEXT = {
  fr: {
    title: "Tailles de tubes",
    pageTitle: "Retenir les tailles de tubes : exercice",
    hint: "Seizièmes de pouce, millimètres, usages et outils",
    buttons: { sizes: "Tailles et usages", tools: "Outils", memo: "Mémo", again: "Situation suivante", series: "Nouvelle série" },
    memo: "<p><strong>1 pouce = 25,4 mm</strong>, puis on coupe en deux : 1/2 = 12,7 ; 1/4 = 6,35 ; 1/8 = 3,2 ; 1/16 = 1,6.</p><p>3/16 = 3,2 + 1,6 · 5/16 = 6,35 + 1,6 · 3/8 = 6,35 + 3,2 · 5/8 = 12,7 + 3,2 · 3/4 = 12,7 + 6,35 · 7/8 = 25,4 − 3,2</p><p>Diamètre extérieur : mesuré au pied à coulisse, par-dessus la paroi.</p>",
    keys: [
      { mark: "raised", label: "Tubes debout, à l'échelle, sur une règle en mm" },
      { mark: "lit", label: "Bonne réponse après le choix" },
    ],
    caption: "Un seizième de pouce vaut 1,5875 mm, soit 1,6 mm environ : le nombre de seizièmes multiplié par 1,6 donne le diamètre extérieur à quelques dixièmes près (5/16 ≈ 8 mm ; exact : 7,9375 mm). Le cuivre frigorifique se désigne en pouces, le cuivre métrique, le PVC, la gaine et le multicouche en mm ; l'acier fileté par la taille de son filetage gaz. Les outils (dudgeonnière, écrou, cintreuse, élargisseur) portent la taille du tube. Les usages sont des repères : la notice du constructeur prime. Chaque série tire 10 situations parmi plus de 1 500 ; rien n'est enregistré.",
    stageLabel: "Tubes debout sur un établi, à l'échelle, devant une règle graduée en millimètres ; en mode outil, une barre percée aux tailles proposées. La question et les réponses sont sous le dessin.",
    svgLabel: "Établi, tubes à l'échelle et règle graduée en millimètres.",
    ask: {
      seiziemes: (t) => `Combien de seizièmes de pouce fait un tube ${t} ?`,
      "pouce-mm": (t) => `Quel est le diamètre extérieur d'un tube ${t} ?`,
      "mm-pouce": (mm) => `Au pied à coulisse, par-dessus la paroi, un tube de cuivre frigorifique mesure ${mm} mm (diamètre extérieur). Quelle est sa désignation ?`,
      regle: (m) => `Lisez la règle : quel est ce tube (${m}) ?`,
      usage: (t) => `À quoi sert le tube ${t} ?`,
      "tube-pour-usage": (u) => `Quel tube pour : ${u.toLowerCase()} ?`,
      "plus-gros": () => "Lequel de ces trois tubes a le plus gros diamètre extérieur ?",
      "plus-petit": () => "Lequel de ces trois tubes a le plus petit diamètre extérieur ?",
      outil: (tool, mm) => `Au pied à coulisse, le tube de cuivre mesure ${mm} mm. ${tool} : quelle taille choisir ?`,
    },
    sixteenths: (id, parts, sum, n, od) => `${id} = ${parts} ≈ ${sum} mm ; en seizièmes : ${n}/16 ; valeur exacte : ${od} mm.`,
    measured: (t, od) => `${t} : ${od} mm de diamètre extérieur.`,
    use: (t, u) => `${t} : ${u.toLowerCase()}.`,
    tool: (mm, t) => `${mm} mm, c'est un tube ${t} : l'outil porte la taille du tube.`,
    metric: (mm) => `${mm} mm, c'est un tube de la série métrique : l'outil porte la même taille.`,
    confuse: (o, omm) => ` Ne pas confondre avec ${o} (${omm} mm) : les deux séries ne se mélangent pas.`,
    single: { "1/2": "la moitié du pouce", "1/4": "le quart du pouce" },
    mm: (v) => `${v} mm`,
    right: "Juste.",
    wrong: (answer) => `Non : la bonne réponse est « ${answer} ».`,
    done: (g, t) => `Série terminée : ${g} / ${t}. Lancez une nouvelle série pour d'autres situations.`,
    step: (i, n) => `situation ${i} / ${n}`,
    score: (g, t) => `Score de la série : ${g} / ${t}`,
    marks: { right: "Bonne réponse", wrong: "Votre réponse, fausse" },
  },
  en: {
    title: "Tube sizes",
    pageTitle: "Remembering tube sizes: an exercise",
    hint: "Sixteenths of an inch, millimetres, uses and tools",
    buttons: { sizes: "Sizes and uses", tools: "Tools", memo: "Memo", again: "Next situation", series: "New series" },
    memo: "<p><strong>1 inch = 25.4 mm</strong>, then halve: 1/2 = 12.7; 1/4 = 6.35; 1/8 = 3.2; 1/16 = 1.6.</p><p>3/16 = 3.2 + 1.6 · 5/16 = 6.35 + 1.6 · 3/8 = 6.35 + 3.2 · 5/8 = 12.7 + 3.2 · 3/4 = 12.7 + 6.35 · 7/8 = 25.4 − 3.2</p><p>Outside diameter: measured with a caliper, over the wall.</p>",
    keys: [
      { mark: "raised", label: "Tubes standing, to scale, on a mm rule" },
      { mark: "lit", label: "Right answer after the choice" },
    ],
    caption: "One sixteenth of an inch is 1.5875 mm, about 1.6 mm: the number of sixteenths multiplied by 1.6 gives the outside diameter to within a few tenths (5/16 ≈ 8 mm; exact: 7.9375 mm). Refrigeration copper is named in inches; metric copper, PVC, conduit and multilayer pipe in mm; threaded steel by its BSP thread size. Tools (flaring bar, flare nut, bender, swaging tool) carry the tube size. Uses are guides: the manufacturer's instructions come first. Each series draws 10 situations out of more than 1,500; nothing is recorded.",
    stageLabel: "Tubes standing on a workbench, to scale, in front of a rule graduated in millimetres; in tool mode, a bar drilled to the sizes offered. The question and the answers are below the drawing.",
    svgLabel: "Workbench, tubes to scale and a rule graduated in millimetres.",
    ask: {
      seiziemes: (t) => `How many sixteenths of an inch is a ${t} tube?`,
      "pouce-mm": (t) => `What is the outside diameter of a ${t} tube?`,
      "mm-pouce": (mm) => `Measured with a caliper over the wall, a refrigeration copper tube is ${mm} mm (outside diameter). What is its size?`,
      regle: (m) => `Read the rule: which tube is this (${m})?`,
      usage: (t) => `What is the ${t} tube used for?`,
      "tube-pour-usage": (u) => `Which tube for: ${u.toLowerCase()}?`,
      "plus-gros": () => "Which of these three tubes has the largest outside diameter?",
      "plus-petit": () => "Which of these three tubes has the smallest outside diameter?",
      outil: (tool, mm) => `With a caliper, the copper tube measures ${mm} mm. ${tool}: which size?`,
    },
    sixteenths: (id, parts, sum, n, od) => `${id} = ${parts} ≈ ${sum} mm; in sixteenths: ${n}/16; exact value: ${od} mm.`,
    measured: (t, od) => `${t}: ${od} mm outside diameter.`,
    use: (t, u) => `${t}: ${u.toLowerCase()}.`,
    tool: (mm, t) => `${mm} mm is a ${t} tube: the tool carries the tube size.`,
    metric: (mm) => `${mm} mm is a metric-series tube: the tool carries the same size.`,
    confuse: (o, omm) => ` Do not confuse it with ${o} (${omm} mm): the two series do not mix.`,
    single: { "1/2": "half an inch", "1/4": "a quarter of an inch" },
    mm: (v) => `${v} mm`,
    right: "Correct.",
    wrong: (answer) => `No: the right answer is "${answer}".`,
    done: (g, t) => `Series finished: ${g} / ${t}. Start a new series for other situations.`,
    step: (i, n) => `situation ${i} / ${n}`,
    score: (g, t) => `Series score: ${g} / ${t}`,
    marks: { right: "Right answer", wrong: "Your answer, wrong" },
  },
};

const LIVE = LIVE_HEAD(NAME) + FITTINGS_LIVE + `
const all = CAT.situations["tailles-tuyaux"];
const isTool = (s) => s.kind.startsWith("outil-");
const pools = { sizes: byLevel(all.filter((s) => !isTool(s))), tools: byLevel(all.filter(isTool)) };
for (const level of [1, 2, 3, 4]) if (!pools.tools[level].length) pools.tools[level] = pools.tools[3];
const mm = (v) => TX.mm(X.num(+v.toFixed(4)));
const od = (t) => odOf(t.material, t.size);
const TY = -14, RY = 4;
function tubeSvg(t, cx, s, label, lit, y = TY) {
  const r = (od(t) * s) / 2, h = 30;
  const tint = draw.tintOf(t.material, "");
  const body = solidSvg(cylinder(cx, y, r, 0, h, PROJ, 48), { tone: lit ? "hi" : "mid", lit });
  const hole = '<path class="rc-hole" d="' + ring(cx, y, r * (t.material === "gaine" ? 0.8 : 0.86), h, PROJ, 40) + '"/>';
  const edges = lineSvg((y < RY ? lineOnTop([cx - r, y], [cx - r, RY], 0, PROJ) + lineOnTop([cx + r, y], [cx + r, RY], 0, PROJ) : ""), { tone: "faint" });
  const at = iso([cx, y, h + 9], PROJ);
  const tag = '<g class="rc-tag' + (lit ? ' rc-tag-lit' : '') + '"><rect x="' + (at[0] - 22).toFixed(1) + '" y="' + (at[1] - 8).toFixed(1) + '" width="44" height="14" rx="7"/><text x="' + at[0].toFixed(1) + '" y="' + (at[1] + 2.5).toFixed(1) + '" text-anchor="middle">' + label + '</text></g>';
  return { at: [cx, y, 0], svg: edges + '<g data-tint="' + tint + '">' + body + hole + '</g>' + tag };
}
function rule(x0, x1, s) {
  const stepMm = s >= 2.2 ? 1 : s * 5 >= 2.2 ? 5 : 10;
  const plan = { x: x0 - 6, y: RY, w: x1 - x0 + 12, d: 12, r: 1 };
  let out = solidSvg(slabOf(plan, 0, 0.8, PROJ, 3), { tone: "lo", crease: "none" });
  const ticks = topTicks(x0, x1 + 0.01, stepMm * s, 10 / stepMm >= 2 ? 10 / stepMm : 2, RY + 0.4, 0.8, [2, 4], PROJ, "x");
  out += lineSvg(ticks.minor, { tone: "lo" }) + lineSvg(ticks.major, { tone: "mid" });
  const every = stepMm * (10 / stepMm >= 2 ? 10 / stepMm : 2);
  for (let v = 0; v * s <= x1 - x0 + 0.01; v += every) out += faceTextSvg(topMatrix([x0 + v * s, RY + 9], 0.8, PROJ, "x"), String(v), { size: 5, tone: "mid", anchor: "middle" });
  return out;
}
// Pied à coulisse : règle derrière le tube, deux becs qui touchent le tube par-dessus la paroi (diamètre extérieur).
function caliper(xl, xr, y, h) {
  const z = h * 0.55, front = y + (xr - xl) / 2 + 10;
  const S = (plan, z0, hh, tone) => solidSvg(slabOf(plan, z0, hh, PROJ, 3, 0.3), { tone });
  return S({ x: xl - 3.4, y, w: 3, d: front - y + 5, r: 0.5 }, z, 4, "lo")
    + S({ x: xr + 0.4, y, w: 3, d: front - y + 5, r: 0.5 }, z, 4, "hi")
    + S({ x: xl - 10, y: front, w: xr - xl + 34, d: 5, r: 0.8 }, z, 5, "mid");
}
function tubesScene(tubes, labels, litIndex = -1) {
  const sum = tubes.reduce((a, t) => a + od(t), 0), most = Math.max(...tubes.map(od));
  const gap = 0.35 * most;
  const s = Math.min(4, 56 / most, 170 / (sum + gap * (tubes.length - 1)));
  let x = -((sum + gap * (tubes.length - 1)) * s) / 2;
  const x0 = x;
  const items = tubes.map((t, i) => { const cx = x + (od(t) * s) / 2; x += (od(t) + gap) * s; return tubeSvg(t, cx, s, labels[i], i === litIndex); });
  const jaws = tubes.length === 1 ? caliper(x0, x0 + od(tubes[0]) * s, TY, 30) : "";
  live.innerHTML = rule(x0, x, s) + items.sort((a, b) => depthOf(a.at, PROJ) - depthOf(b.at, PROJ)).map((i) => i.svg).join("") + jaws;
}
function toolScene(s, lit) {
  const tube = s.tube, sizes = s.options;
  const most = Math.max(...sizes.map((o) => od(o)), od(tube));
  const sc = Math.min(4, 24 / most);
  const bar = { x: -100, y: -36, w: 152, d: 32, r: 3 };
  let out = solidSvg(slabOf(bar, 0, 9, PROJ, 4, 0.8), { tone: "mid" });
  sizes.forEach((o, i) => {
    const cx = bar.x + 19 + i * 38, r = (od(o) * sc) / 2;
    out += '<path class="' + (lit && same(o, s.answer) ? 'rc-hole rc-hole-lit' : 'rc-hole') + '" d="' + ring(cx, bar.y + 13, r, 9, PROJ, 40) + '"/>';
    out += faceTextSvg(topMatrix([cx, bar.y + 26], 9, PROJ, "x"), X.sizeLabel(o.material, o.size), { size: 6, tone: "hi", anchor: "middle" });
  });
  const t = tubeSvg(tube, 80, sc, lit ? X.sizeLabel(tube.material, tube.size) : X.num(s.measured) + " mm", false, 10);
  live.innerHTML = out + t.svg;
}
function show(s, answered) {
  const k2 = s.kind;
  if (isTool(s)) return toolScene(s, answered);
  if (["seiziemes", "pouce-mm", "mm-pouce"].includes(k2)) {
    const t = { material: "cuivre-pouce", size: s.size };
    return tubesScene([t], [k2 === "mm-pouce" && !answered ? "?" : s.size], answered ? 0 : -1);
  }
  if (k2 === "regle" || k2 === "usage") return tubesScene([s.tube], [k2 === "regle" && !answered ? "?" : X.sizeLabel(s.tube.material, s.tube.size)], answered ? 0 : -1);
  const tubes = k2 === "tube-pour-usage" ? s.options : s.tubes;
  const labels = tubes.map((t) => X.sizeLabel(t.material, t.size));
  tubesScene(tubes, labels, answered ? tubes.findIndex((t) => same(t, s.answer)) : -1);
}
function ask(s) {
  const A = TX.ask;
  if (isTool(s)) return A.outil(R.TOOLS[s.kind.slice(6)].label[LANG], X.num(s.measured));
  if (s.kind === "mm-pouce") return A["mm-pouce"](X.num(Math.round(odOf("cuivre-pouce", s.size) * 100) / 100));
  if (s.kind === "seiziemes" || s.kind === "pouce-mm") return A[s.kind](s.size);
  if (s.kind === "regle") return A.regle(R.MATERIALS[s.tube.material].label[LANG]);
  if (s.kind === "usage") return A.usage(X.tubeLabel(s.tube));
  if (s.kind === "tube-pour-usage") return A["tube-pour-usage"](R.USAGES[s.usage][LANG]);
  return A[s.kind]();
}
function label(s, o) {
  if (isTool(s)) return X.sizeLabel(o.material, o.size);
  if (s.kind === "seiziemes" || s.kind === "mm-pouce") return o;
  if (s.kind === "pouce-mm") return mm(o);
  if (s.kind === "usage") return R.USAGES[o][LANG];
  return X.tubeLabel(o);
}
function explain(s) {
  if (isTool(s)) {
    const a = s.answer, other = s.options.find((o) => o.material !== a.material);
    const base = a.material === "cuivre-pouce" ? TX.tool(X.num(s.measured), a.size) : TX.metric(X.num(s.measured));
    return base + (other ? TX.confuse(X.sizeLabel(other.material, other.size), X.num(Math.round(od(other) * 100) / 100)) : "");
  }
  if (["seiziemes", "pouce-mm", "mm-pouce"].includes(s.kind)) {
    const ref = R.MATERIALS["cuivre-pouce"].sizes.find((x) => x.id === s.size);
    const short = (f) => X.num(+R.LADDER[f].toFixed(f === "1/4" || f === "1/2" ? 2 : 1));
    const fr = ref.halves.map(([sign, f], i) => (i ? " " + (sign === "+" ? "+" : "−") + " " : "") + f).join("");
    const mm = ref.halves.map(([sign, f], i) => (i ? " " + (sign === "+" ? "+" : "−") + " " : "") + short(f)).join("");
    const sum = ref.halves.reduce((a, [sign, f]) => a + (sign === "+" ? 1 : -1) * R.LADDER[f], 0);
    const parts = ref.halves.length > 1 ? fr + " = " + mm : TX.single[ref.halves[0][1]];
    return TX.sixteenths(ref.id, parts, X.num(Math.round(sum * 100 + 1e-6) / 100), ref.sixteenths, X.num(ref.od));
  }
  if (s.kind === "regle") return TX.measured(X.tubeLabel(s.tube), X.num(od(s.tube)));
  if (s.kind === "usage") return TX.use(X.tubeLabel(s.tube), R.USAGES[s.answer][LANG]);
  if (s.kind === "tube-pour-usage") return TX.use(X.tubeLabel(s.answer), R.USAGES[s.usage][LANG]);
  return s.tubes.map((t) => TX.measured(X.tubeLabel(t), X.num(od(t)))).join(" ");
}
const active = { 1: [], 2: [], 3: [], 4: [] };
const hooks = { show(s) { show(s, false); prompt.textContent = ask(s); readout.textContent = ""; }, label, explain, after(s) { show(s, true); } };
const series = makeSeries(active, hooks);
function setMode(next) {
  for (const level of [1, 2, 3, 4]) active[level] = pools[next][level];
  buttons.sizes.setAttribute("aria-pressed", next === "sizes");
  buttons.tools.setAttribute("aria-pressed", next === "tools");
  series.start();
}
buttons.sizes.addEventListener("click", () => setMode("sizes"));
const memo = scope.querySelector(".tt-memo");
buttons.memo.addEventListener("click", () => { memo.hidden = !memo.hidden; buttons.memo.setAttribute("aria-expanded", String(!memo.hidden)); });
buttons.tools.addEventListener("click", () => setMode("tools"));
const run = () => {};
window.__tt = { series, setMode };
quizBox.hidden = false;
const wanted = (scope.dataset && scope.dataset.mode) || new URLSearchParams(location.search).get("mode");
ready();
setMode(wanted === "outils" ? "tools" : "sizes");
` + LIVE_WATCH;

const langs = {};
for (const lang of ["fr", "en"]) {
  const T = TEXT[lang], B = T.buttons;
  const svg = k.figureSvg({ width: WIDTH, height: HEIGHT, label: T.svgLabel, body: [bench(P, PLATE), `<g class="rc-live"></g>`] });
  const modes = `<div class="mv-controls" role="group" aria-label="${lang === "fr" ? "Thème des situations" : "Situation theme"}"><button type="button" data-act="sizes">${B.sizes}</button><button type="button" data-act="tools">${B.tools}</button><button type="button" data-act="memo" aria-expanded="false">${B.memo}</button></div><div class="tt-memo" hidden>${T.memo}</div>`;
  const quiz = `<div class="rc-quiz"><div class="mv-controls rc-options" role="group" aria-label="${lang === "fr" ? "Réponses proposées" : "Possible answers"}"></div><div class="mv-controls"><button type="button" data-act="again">${B.again}</button><button type="button" data-act="series">${B.series}</button></div></div>`;
  const body = `<div class="iso-stage" role="img" aria-label="${T.stageLabel}">${svg}</div>${modes}<p class="rc-prompt" aria-live="polite"></p>${quiz}<p class="mv-feedback" aria-live="polite"></p><p class="mv-score" aria-live="polite"></p>`;
  const plate = k.plateHtml({ fig: "Fig 4", title: T.title, hint: T.hint, readout: "", keys: T.keys, caption: T.caption, body });
  const fns = (o) => `{${Object.entries(o).map(([key, f]) => `${JSON.stringify(key)}:${f}`).join(",")}}`;
  const TX = `{ask:${fns(T.ask)},sixteenths:${T.sixteenths},measured:${T.measured},use:${T.use},tool:${T.tool},metric:${T.metric},confuse:${T.confuse},single:${JSON.stringify(T.single)},mm:${T.mm},right:${JSON.stringify(T.right)},wrong:${T.wrong},done:${T.done},step:${T.step},score:${T.score},marks:${JSON.stringify(T.marks)}}`;
  langs[lang] = { plate: waitingButtons(plate), title: T.pageTitle, script: fittingsScript({ lang, P, TX }) + LIVE };
}
writeFigure(HERE, NAME, langs, CONTROLS_CSS + FITTINGS_CSS + `
.rc-tag rect{fill:var(--anatomy-card);stroke:var(--anatomy-mid);stroke-width:.8}
.rc-tag-lit rect{stroke:var(--anatomy-lit);stroke-width:1.4}
.rc-hole-lit{stroke:var(--anatomy-lit);stroke-width:1.6}
.tt-memo{margin:12px 0 0;padding:10px 14px;border:1px solid var(--anatomy-mid);border-radius:14px;font-size:13px;line-height:1.55;color:var(--anatomy-text)}
.tt-memo[hidden]{display:none}
.tt-memo p{margin:4px 0}
`);
