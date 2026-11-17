// Figure interactive (skill anatomy) : calculer pas à pas la longueur développée d'un tube cintré.
// Partie 4, module 4 (imprimé 23), section « Calcul des longueurs ». Décisions Q89, Q90.
// Le tube est tracé sur l'établi à l'échelle de ses cotes ; chaque étape éclaire la droite ou l'arc à calculer ;
// à la fin, le tube se montre déroulé à plat. Situations : figures/_data/longueurs.mjs. Rien n'est enregistré.
// Usage : node figures/longueur-developpee/build.mjs
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../_kit/iso-kit.mjs";
import { bench, CONTROLS_CSS, LIVE_HEAD, LIVE_WATCH, writeFigure } from "../_kit/acad-bench.mjs";
import { namespaced } from "../_kit/bundle.mjs";
import { FITTINGS_CSS, waitingButtons } from "../_kit/raccords-live.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const NAME = "longueur-developpee";
const AZ = 62, WIDTH = 680, HEIGHT = 400;
const PLATE = { x: -115, y: -78, w: 230, d: 156, r: 8 };
const P = k.fitProjection([...k.boxCorners(PLATE, -15, 0), [0, 0, 24]], WIDTH, HEIGHT, { pad: 14, azimuth: AZ, elevation: 34 });
const MODULES = namespaced(join(HERE, "..", "_kit", "lathe.mjs"), "G") + namespaced(join(HERE, "..", "_kit", "tube.mjs"), "TB") + namespaced(join(HERE, "..", "_data", "longueurs.mjs"), "LG");

const TEXT = {
  fr: {
    title: "Longueur développée",
    pageTitle: "Calculer la longueur développée d'un tube cintré : exercice",
    hint: "Droites, arcs, puis longueur développée",
    buttons: { again: "Étape suivante", series: "Nouvelle série" },
    next: "Situation suivante",
    keys: [
      { mark: "raised", label: "Tube cintré, droites D et arcs A repérés" },
      { mark: "lit", label: "Partie à calculer à cette étape" },
    ],
    caption: "Chaque cote va du bout du tube, ou d'un coude, jusqu'au sommet du coude suivant. La longueur droite est la cote moins le retrait de chaque coude qu'elle touche : R × tan(α/2), soit R pour un coude à 90°. L'arc vaut 2 × π × R × α / 360. La longueur développée (LD) est la somme des droites et des arcs. Le rayon R est celui de la cintreuse : abaque du support pour l'acier, valeurs courantes pour le cuivre. Chaque série tire 10 tubes parmi plus de 3 000 ; rien n'est enregistré.",
    stageLabel: "Tube cintré posé sur un établi, ses longueurs droites et ses arcs repérés. Les questions et les réponses sont sous le dessin.",
    svgLabel: "Établi et tube cintré, avec ses droites et ses arcs repérés, puis déroulé à plat.",
    tube: (t) => (t.material === "acier" ? `acier ${t.size}` : `cuivre ${t.size}`),
    intro: (tube, R, cotes, angles) => `Tube ${tube}, rayon de cintrage R = ${R} mm. Cotes : ${cotes} mm. Coude${angles.length > 1 ? "s" : ""} : ${angles}°.`,
    ask: { droite: (i) => `Étape : longueur droite D${i + 1} ?`, arc: (i) => `Étape : longueur de l'arc A${i + 1} ?`, ld: () => "Étape : longueur développée LD ?" },
    why: {
      droite: (i, cote, backs, v) => `D${i + 1} = ${cote} − ${backs} = ${v} mm (retrait R × tan(α/2) de chaque coude touché).`,
      arc: (i, R, a, v) => `A${i + 1} = 2 × π × ${R} × ${a} / 360 = ${v} mm.`,
      ld: (parts, v) => `LD = ${parts} = ${v} mm.`,
    },
    hint2: {
      cote: "Vous avez pris la cote entière : il faut retirer le retrait du coude.",
      radius: "C'est le rayon de cintrage, pas la longueur de l'arc.",
      cotes: "La somme des cotes compte deux fois les coins : additionnez les droites et les arcs.",
    },
    right: "Juste.",
    wrong: (a) => `Non : la bonne réponse est ${a}.`,
    done: (g, t) => `Série terminée : ${g} étapes justes sur ${t}. Lancez une nouvelle série pour d'autres tubes.`,
    score: (g, t, i, n) => `Score : ${g} / ${t} étapes · tube ${i} / ${n}`,
    marks: { right: "Bonne réponse", wrong: "Votre réponse, fausse" },
    mm: (v) => `${String(v).replace(".", ",")} mm`,
    num: (v) => String(v).replace(".", ","),
  },
  en: {
    title: "Developed length",
    pageTitle: "Working out the developed length of a bent tube: an exercise",
    hint: "Straights, arcs, then the developed length",
    buttons: { again: "Next step", series: "New series" },
    next: "Next situation",
    keys: [
      { mark: "raised", label: "Bent tube, straights D and arcs A marked" },
      { mark: "lit", label: "Part to work out at this step" },
    ],
    caption: "Each dimension runs from the tube end, or from a bend, to the apex of the next bend. The straight length is the dimension minus the setback of each bend it touches: R × tan(α/2), so R for a 90° bend. The arc is 2 × π × R × α / 360. The developed length (LD) is the sum of the straights and the arcs. R is the bender radius: the handout's chart for steel, common values for copper. Each series draws 10 tubes out of more than 3,000; nothing is recorded.",
    stageLabel: "Bent tube on a workbench, its straight lengths and arcs marked. The questions and answers are below the drawing.",
    svgLabel: "Workbench and bent tube, with its straights and arcs marked, then laid out flat.",
    tube: (t) => (t.material === "acier" ? `steel ${t.size}` : `copper ${t.size}`),
    intro: (tube, R, cotes, angles) => `Tube ${tube}, bend radius R = ${R} mm. Dimensions: ${cotes} mm. Bend${angles.length > 1 ? "s" : ""}: ${angles}°.`,
    ask: { droite: (i) => `Step: straight length D${i + 1}?`, arc: (i) => `Step: length of arc A${i + 1}?`, ld: () => "Step: developed length LD?" },
    why: {
      droite: (i, cote, backs, v) => `D${i + 1} = ${cote} − ${backs} = ${v} mm (setback R × tan(α/2) of each bend it touches).`,
      arc: (i, R, a, v) => `A${i + 1} = 2 × π × ${R} × ${a} / 360 = ${v} mm.`,
      ld: (parts, v) => `LD = ${parts} = ${v} mm.`,
    },
    hint2: {
      cote: "You took the whole dimension: the bend setback must be taken off.",
      radius: "That is the bend radius, not the arc length.",
      cotes: "Adding the dimensions counts the corners twice: add the straights and the arcs.",
    },
    right: "Correct.",
    wrong: (a) => `No: the right answer is ${a}.`,
    done: (g, t) => `Series finished: ${g} steps right out of ${t}. Start a new series for other tubes.`,
    score: (g, t, i, n) => `Score: ${g} / ${t} steps · tube ${i} / ${n}`,
    marks: { right: "Right answer", wrong: "Your answer, wrong" },
    mm: (v) => `${v} mm`,
    num: (v) => String(v),
  },
};

const LIVE = LIVE_HEAD(NAME) + `
const live = svg.querySelector(".rc-live");
const prompt = scope.querySelector(".rc-prompt");
const optionsBox = scope.querySelector(".rc-options");
const all = LG.buildLengths().situations;
const pool = { 1: [], 2: [], 3: [], 4: [] };
all.forEach((s) => pool[s.level].push(s));
const PLAN = [1, 1, 1, 2, 2, 2, 3, 3, 4, 4];
const OD = { acier: { '3/8"': 17.2, '1/2"': 21.3, '3/4"': 26.9, '1"': 33.7, '1 1/4"': 42.4, '1 1/2"': 48.3, '2"': 60.3 }, cuivre: { "1/4": 6.35, "5/16": 7.94, "3/8": 9.53, "1/2": 12.7, "5/8": 15.88, "3/4": 19.05, "7/8": 22.23 } };
let list = [], at = 0, stepAt = 0, good = 0, total = 0, answered = false;
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const rad = (d) => (d * Math.PI) / 180;
const turnOf = (s) => (s.angles.length === 2 && s.angles[0] === 45 ? [1, -1] : [1, 1]);
function shape(s) {
  // Sommets de la ligne brisée (cotes jusqu'aux sommets), en mm, puis mise à l'échelle et centrage sur l'établi.
  let dir = 0, p = [0, 0, 0];
  const pts = [p];
  const turns = turnOf(s);
  s.cotes.forEach((c, i) => {
    p = add(p, [c * Math.cos(rad(dir)), c * Math.sin(rad(dir)), 0]);
    pts.push(p);
    if (i < s.angles.length) dir += turns[i] * s.angles[i];
  });
  const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
  const w = Math.max(...xs) - Math.min(...xs), d = Math.max(...ys) - Math.min(...ys);
  const sc = Math.min(190 / Math.max(w, 1), 80 / Math.max(d, 1), 0.6);
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  return { sc, pts: pts.map((q) => [(q[0] - cx) * sc, (q[1] - cy) * sc - 12, 0]) };
}
function tag(p3, text, lit) {
  const xy = iso(p3, PROJ);
  // Repères lisibles à 390 px : la carte réduit le dessin de moitié environ, le texte fait donc 16 unités.
  const w = 14 + text.length * 9.6;
  return '<g class="rc-tag ld-tag' + (lit ? ' rc-tag-lit' : '') + '"><rect x="' + (xy[0] - w / 2).toFixed(1) + '" y="' + (xy[1] - 13).toFixed(1) + '" width="' + w.toFixed(1) + '" height="24" rx="12"/><text x="' + xy[0].toFixed(1) + '" y="' + (xy[1] + 4.5).toFixed(1) + '" text-anchor="middle">' + text + '</text></g>';
}
function paint(s, highlight, unrolled) {
  const { sc, pts } = shape(s);
  const r = Math.max(2.2, (OD[s.tube.material][s.tube.size] * sc) / 2);
  const z = r + 1;
  const lifted = pts.map((q) => [q[0], q[1], z]);
  const route = G.fillet(lifted, s.radius * sc, 12);
  const tint = s.tube.material === "acier" ? "acier" : "cuivre";
  let out = '<path class="iso-halo rc-halo" d="' + haloOf({ x: -100, y: -60, w: 200, d: 104, r: 10 }, 0, 0.3, PROJ) + '"/>';
  out += '<g data-tint="' + tint + '">' + TB.tubePieces(route, r, PROJ, { maxLength: 18 }).sort((a, b) => depthOf(a.mid, PROJ) - depthOf(b.mid, PROJ)).map((q) => TB.tubeSvg(q)).join("") + '</g>';
  // Repères : droites au milieu de chaque segment utile, arcs au sommet de chaque coude.
  const backs = s.angles.map((a) => s.radius * Math.tan(rad(a) / 2) * sc);
  let tags = "";
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L, 0];
    const from = i === 0 ? 0 : backs[i - 1], to = i === pts.length - 2 ? 0 : backs[i];
    const mid = add(a, mul(u, from + (L - from - to) / 2));
    tags += tag(add(mid, [0, 0, z + r + 8]), "D" + (i + 1) + " · " + TX.num(s.cotes[i]), highlight === "droite" + i);
  }
  s.angles.forEach((angle, i) => tags += tag(add(pts[i + 1], [0, 0, z + r + 8]), "A" + (i + 1) + " · " + angle + "°", highlight === "arc" + i));
  if (unrolled) {
    // Tube déroulé à plat devant l'établi : même échelle, une bague à chaque passage droite / arc.
    const ld = s.steps[s.steps.length - 1].answer, scale = Math.min(sc, 200 / ld);
    const y = 58, x0 = -(ld * scale) / 2;
    const flat = TB.tubePieces([[x0, y, z], [x0 + ld * scale, y, z]], r, PROJ, { maxLength: 400 });
    out += '<g data-tint="' + tint + '">' + flat.map((q) => TB.tubeSvg(q, { tone: "lo" })).join("") + '</g>';
    let x = x0, seams = "";
    const parts = s.steps.filter((t) => t.kind !== "ld");
    const order = [];
    const straights = parts.filter((t) => t.kind === "droite"), arcs = parts.filter((t) => t.kind === "arc");
    straights.forEach((t, i) => { order.push(t); if (arcs[i]) order.push(arcs[i]); });
    order.slice(0, -1).forEach((t) => { x += t.answer * scale; seams += pathOf([iso([x, y, z + r], PROJ), iso([x, y, z - r], PROJ)]); });
    out += lineSvg(seams, { tone: "hi" }) + tag([0, y, z + r + 9], "LD · " + TX.num(ld) + " mm", true);
  }
  live.innerHTML = out + tags;
}
function step() { return list[at].steps[stepAt]; }
function partsText(s) { return s.steps.filter((t) => t.kind !== "ld").map((t) => TX.num(t.answer)).join(" + "); }
function show() {
  answered = false;
  const s = list[at], t = step();
  const highlight = t.kind === "ld" ? "" : t.kind + t.index;
  paint(s, highlight, false);
  prompt.textContent = TX.intro(TX.tube(s.tube), TX.num(s.radius), s.cotes.join(" ; "), s.angles.join(" ; ")) + " " + TX.ask[t.kind](t.index);
  optionsBox.replaceChildren(...t.options.map((o) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = TX.mm(o);
    b.addEventListener("click", () => answer(o));
    b._v = o;
    return b;
  }));
  feedback.textContent = "";
  buttons.again.disabled = true;
  buttons.again.textContent = TX.buttons.again;
  scoreEl.textContent = TX.score(good, total, at + 1, list.length);
}
function explain(s, t) {
  if (t.kind === "droite") {
    const touching = [s.angles[t.index - 1], s.angles[t.index]].filter((a) => a !== undefined);
    const backs = touching.map((a) => TX.num(Math.round(s.radius * Math.tan(rad(a) / 2) * 10) / 10)).join(" − ");
    return TX.why.droite(t.index, TX.num(s.cotes[t.index]), backs, TX.num(t.answer));
  }
  if (t.kind === "arc") return TX.why.arc(t.index, TX.num(s.radius), s.angles[t.index], TX.num(t.answer));
  return TX.why.ld(partsText(s), TX.num(t.answer));
}
function hintFor(s, t, o) {
  if (t.kind === "droite" && o === s.cotes[t.index]) return TX.hint2.cote;
  if (t.kind === "arc" && o === s.radius) return TX.hint2.radius;
  if (t.kind === "ld" && Math.abs(o - s.cotes.reduce((x, y) => x + y, 0)) < 0.05) return TX.hint2.cotes;
  return "";
}
function answer(o) {
  if (answered) return;
  answered = true;
  const s = list[at], t = step(), ok = o === t.answer;
  total++; if (ok) good++;
  for (const b of optionsBox.children) {
    b.disabled = true;
    if (b._v === t.answer) { b.dataset.state = "right"; b.prepend("✓ "); b.setAttribute("aria-label", TX.marks.right + " : " + b.textContent.slice(2)); }
    else if (b._v === o) { b.dataset.state = "wrong"; b.prepend("✗ "); b.setAttribute("aria-label", TX.marks.wrong + " : " + b.textContent.slice(2)); }
  }
  const lastStep = stepAt === s.steps.length - 1, lastTube = at === list.length - 1;
  if (lastStep) paint(s, "", true);
  feedback.textContent = [ok ? TX.right : TX.wrong(TX.mm(t.answer)), ok ? "" : hintFor(s, t, o), explain(s, t), lastStep && lastTube ? TX.done(good, total) : ""].filter(Boolean).join(" ");
  buttons.again.textContent = lastStep ? TX.next : TX.buttons.again;
  buttons.again.disabled = lastStep && lastTube;
  scoreEl.textContent = TX.score(good, total, at + 1, list.length);
}
function start() {
  list = PLAN.map((level) => { const p = pool[level]; let s; for (let i = 0; i < 40; i++) { s = p[Math.floor(Math.random() * p.length)]; if (!list.includes(s)) break; } return s; });
  at = 0; stepAt = 0; good = 0; total = 0;
  show();
}
buttons.again.addEventListener("click", () => {
  if (stepAt < list[at].steps.length - 1) stepAt++;
  else if (at < list.length - 1) { at++; stepAt = 0; }
  else return;
  show();
});
buttons.series.addEventListener("click", start);
for (const b of scope.querySelectorAll(".mv-controls button")) b.disabled = false;
const run = () => {};
window.__ld = { start, answer: (i) => answer(step().options[i]), state: () => ({ at, stepAt, good, total, s: list[at] }) };
start();
` + LIVE_WATCH;

const langs = {};
for (const lang of ["fr", "en"]) {
  const T = TEXT[lang], B = T.buttons;
  const svg = k.figureSvg({ width: WIDTH, height: HEIGHT, label: T.svgLabel, body: [bench(P, PLATE), `<g class="rc-live"></g>`] });
  const quiz = `<div class="rc-quiz"><div class="mv-controls rc-options" role="group" aria-label="${lang === "fr" ? "Longueurs proposées" : "Lengths offered"}"></div><div class="mv-controls"><button type="button" data-act="again">${B.again}</button><button type="button" data-act="series">${B.series}</button></div></div>`;
  const body = `<div class="iso-stage" role="img" aria-label="${T.stageLabel}">${svg}</div><p class="rc-prompt" aria-live="polite"></p>${quiz}<p class="mv-feedback" aria-live="polite"></p><p class="mv-score" aria-live="polite"></p>`;
  const plate = waitingButtons(k.plateHtml({ fig: "Fig 5", title: T.title, hint: T.hint, readout: "", keys: T.keys, caption: T.caption, body }));
  const fns = (o) => `{${Object.entries(o).map(([key, f]) => `${JSON.stringify(key)}:${typeof f === "function" ? f : JSON.stringify(f)}`).join(",")}}`;
  const TX = `{buttons:${JSON.stringify(B)},next:${JSON.stringify(T.next)},tube:${T.tube},intro:${T.intro},ask:${fns(T.ask)},why:${fns(T.why)},hint2:${JSON.stringify(T.hint2)},right:${JSON.stringify(T.right)},wrong:${T.wrong},done:${T.done},score:${T.score},marks:${JSON.stringify(T.marks)},mm:${T.mm},num:${T.num}}`;
  langs[lang] = { plate, title: T.pageTitle, script: `${MODULES}const LANG = "${lang}";\nconst PROJ = ${JSON.stringify(P)};\nconst TX = ${TX};\n` + LIVE };
}
writeFigure(HERE, NAME, langs, CONTROLS_CSS + FITTINGS_CSS + `
.rc-tag rect{fill:var(--anatomy-card);stroke:var(--anatomy-mid);stroke-width:.8}
.rc-tag-lit rect{stroke:var(--anatomy-lit);stroke-width:1.6}
.ld-tag text{font-size:16px}
.rc-halo{opacity:.28}
`);
