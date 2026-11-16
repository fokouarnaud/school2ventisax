// Figure interactive (skill anatomy) : le manodétendeur, à explorer puis en séries de situations.
// Partie 4, module 5 (imprimé 24), section « Les manodétendeurs ». Décisions Q92, Q93.
// Bouteille, détendeur à deux manomètres (HP amont, BP aval), vis de détente moletée, flexible. Les aiguilles et les
// graduations sont posées par le script à partir de la géométrie des cadrans calculée ici. Rien n'est enregistré.
// Usage : node figures/manodetendeur/build.mjs
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../_kit/iso-kit.mjs";
import * as G from "../_kit/lathe.mjs";
import * as TB from "../_kit/tube.mjs";
import { bench, CONTROLS_CSS, LIVE_HEAD, LIVE_WATCH, writeFigure } from "../_kit/acad-bench.mjs";
import { namespaced } from "../_kit/bundle.mjs";
import { FITTINGS_CSS, waitingButtons } from "../_kit/raccords-live.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const NAME = "manodetendeur";
const AZ = 30, WIDTH = 470, HEIGHT = 400;
const PLATE = { x: -52, y: -62, w: 110, d: 124, r: 8 };
const P = k.fitProjection([...k.boxCorners(PLATE, -15, 0), [6, 40, 120], [6, -40, 120]], WIDTH, HEIGHT, { pad: 6, azimuth: AZ, elevation: 22 });
const MODULE = namespaced(join(HERE, "..", "_data", "manodetendeurs.mjs"), "MD");

const rad = (d) => (d * Math.PI) / 180;
const N = [Math.cos(rad(AZ)), Math.sin(rad(AZ)), 0]; // vers l'observateur
const U = [Math.sin(rad(AZ)), -Math.cos(rad(AZ)), 0]; // vers la droite de l'écran
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const BODY = [6, 0, 96];
const DIALS = { amont: add(BODY, add(mul(U, -30), mul(N, 4))), aval: add(BODY, add(mul(U, 30), mul(N, 4))) };
const DIAL_R = 23;
// Une aiguille ou une graduation à la fraction t du cadran : de 225° (zéro, en bas à gauche) à -45° (plein cadran).
const onDial = (c, t, r) => { const a = rad(225 - 270 * t); return add(add(c, mul(N, 2.6)), add(mul(U, r * Math.cos(a)), [0, 0, r * Math.sin(a)])); };

function scene(lang) {
  const S = (paths, style) => k.solidSvg(paths, style);
  const L = (d, style) => k.lineSvg(d, style);
  const o = [bench(P, PLATE)];
  // flexible de sortie, derrière la bouteille (dessiné avant elle)
  const out = add(add(BODY, mul(N, -7)), [0, 0, -6]);
  const hose = TB.tubePieces(G.fillet([out, add(out, mul(N, -10)), [out[0] - 10 * N[0], out[1] - 10 * N[1], 4], [out[0] - 10 * N[0], -52, 4]], 7, 8), 2.4, P);
  o.push(`<g class="md-hose">${hose.sort((a, b) => k.depthOf(a.mid, P) - k.depthOf(b.mid, P)).map((p) => TB.tubeSvg(p)).join("")}</g>`);
  // bouteille, ogive, robinet
  const BF = G.frameAlong([-20, 0, 0], [0, 0, 1]);
  o.push(`<g class="md-bottle">${S(G.solidOf([[0, 20], [52, 20], [58, 17, 1], [64, 9, 1], [68, 6]], BF, P, { steps: 40 }), { tone: "hi", inner: L(G.arcOf(BF, 10, 20, P) + G.arcOf(BF, 44, 20, P), { tone: "faint" }) })}</g>`);
  o.push(S(k.cylinder(-20, 0, 4.2, 68, 9, P, 24, 0.3), { tone: "mid" }));
  o.push(S(k.cylinder(-20, 0, 6.5, 72, 2.4, P, 28, 0.3), { tone: "lo" }));
  // raccord d'entrée jusqu'au corps
  o.push(TB.tubePieces(G.fillet([[-20, 0, 77], [-20, 0, 88], [-6, 0, 96], BODY], 5, 6), 2.6, P).map((p) => TB.tubeSvg(p, { tone: "mid" })).join(""));
  // corps du détendeur, horizontal, et ses deux manomètres face à l'observateur
  const bodyF = G.frameAlong(add(BODY, mul(U, -26)), U);
  o.push(S(G.solidOf([[0, 7.5], [1, 9, 1], [51, 9, 1], [52, 7.5]], bodyF, P, { steps: 32 }), { tone: "mid", inner: L(G.arcOf(bodyF, 18, 9, P) + G.arcOf(bodyF, 34, 9, P), { tone: "faint" }) }));
  for (const [name, c] of Object.entries(DIALS)) {
    const F = G.frameAlong(add(c, mul(N, -4)), N);
    o.push(`<g class="md-dial" data-dial="${name}">${S(G.solidOf([[0, 5], [3.5, 5], [3.6, DIAL_R + 1.4], [6.4, DIAL_R + 1.4, 1], [6.6, DIAL_R]], F, P, { steps: 40 }), { tone: "mid" })}`);
    const face = Array.from({ length: 48 }, (_, i) => k.iso(add(add(c, mul(N, 2.6)), add(mul(U, DIAL_R * Math.cos((i / 48) * 2 * Math.PI)), [0, 0, DIAL_R * Math.sin((i / 48) * 2 * Math.PI)])), P));
    o.push(`<path class="md-face" d="${k.pathOf(face, true)}"/>`);
    let minor = "", major = "";
    for (let i = 0; i <= 50; i++) { const big = i % 10 === 0; const seg = k.pathOf([onDial(c, i / 50, DIAL_R - (big ? 3.4 : 1.8)), onDial(c, i / 50, DIAL_R - 0.6)].map((p) => k.iso(p, P))); if (big) major += seg; else minor += seg; }
    o.push(L(minor, { tone: "lo" }) + L(major, { tone: "mid" }));
    for (let i = 0; i <= 4; i++) { const at = k.iso(onDial(c, i / 4, DIAL_R - 8.5), P); o.push(`<text class="md-num" data-dial="${name}" data-i="${i}" x="${at[0].toFixed(1)}" y="${(at[1] + 1.4).toFixed(1)}" text-anchor="middle"></text>`); }
    const tag = k.iso(onDial(c, 0.5, -DIAL_R * 0.45), P);
    o.push(`<text class="md-unit" x="${tag[0].toFixed(1)}" y="${(tag[1] + 1).toFixed(1)}" text-anchor="middle">${name === "amont" ? "HP" : "BP"} · bar</text>`);
    const hub = k.iso(add(c, mul(N, 2.8)), P);
    o.push(`<path class="md-needle" data-dial="${name}" d=""/><circle class="md-hub" cx="${hub[0].toFixed(1)}" cy="${hub[1].toFixed(1)}" r="1.4"/></g>`);
  }
  // vis de détente moletée, vers l'observateur, sous le corps
  const knobF = G.frameAlong(add(BODY, add(mul(N, 8), [0, 0, -1])), N);
  o.push(`<g class="md-knob">${S(G.solidOf([[0, 4], [5, 4], [5, 7.5], [6, 8.2, 1], [15, 8.2, 1], [16, 7]], knobF, P, { steps: 28 }), { tone: "hi", inner: L(G.ribsOf(knobF, 6.5, 14.5, 8.2, 24, P, { seams: true }), { tone: "faint" }) })}</g>`);
  return o.join("");
}

// Géométrie projetée des cadrans pour le script : centre, axes U et vertical à l'écran.
const DIAL_GEOM = Object.fromEntries(Object.entries(DIALS).map(([name, c]) => {
  const c0 = add(c, mul(N, 2.8));
  const p0 = k.iso(c0, P), pu = k.iso(add(c0, U), P), pz = k.iso(add(c0, [0, 0, 1]), P);
  return [name, { c: p0, u: [pu[0] - p0[0], pu[1] - p0[1]], z: [pz[0] - p0[0], pz[1] - p0[1]], r: DIAL_R }];
}));

const TEXT = {
  fr: {
    title: "Le manodétendeur",
    pageTitle: "Le manodétendeur : explorer et s'entraîner",
    hint: "Explorer le détendeur, puis s'entraîner à lire et régler",
    buttons: { explore: "Explorer", quiz: "S'entraîner", gas: "Changer de gaz", open: "Ouvrir la bouteille", close: "Fermer la bouteille", plus: "Vis : serrer", minus: "Vis : desserrer", again: "Situation suivante", series: "Nouvelle série" },
    keys: [{ mark: "raised", label: "Bouteille, détendeur, manomètres HP et BP, vis de détente, flexible" }, { mark: "lit", label: "Manomètre à lire" }],
    caption: "Le manomètre amont (HP) lit la pression dans la bouteille ; le manomètre aval (BP) lit la pression de service envoyée au chalumeau, réglée par la vis de détente : on la serre pour augmenter, on la desserre pour diminuer. Détente maximale (support) : acétylène 1,5 bar, propane 4 bar, oxygène, azote et CO2 10 bar. Avant d'ouvrir la bouteille, la vis est desserrée. Les pressions de bouteille du mode Explorer sont des ordres de grandeur. Chaque série tire 10 situations parmi plus de 1 000 ; rien n'est enregistré.",
    stageLabel: "Bouteille de gaz équipée d'un manodétendeur à deux manomètres et d'une vis de détente. Les commandes et les questions sont sous le dessin.",
    svgLabel: "Bouteille, manodétendeur avec manomètres haute et basse pression, vis de détente et flexible.",
    gas: (g) => ({ Propane: "Détendeur de propane", CO2: "Détendeur de CO2" })[g] || `Détendeur d'${g.toLowerCase()}`,
    explore: (gas, open, hp, bp, warn) => `${gas} · bouteille ${open ? "ouverte" : "fermée"} · HP ${hp} bar · BP ${bp} bar${warn ? " · trop haut !" : ""}`,
    warn: (max) => `Attention : la détente dépasse ${max} bar, la valeur maximale de ce gaz. Desserrez la vis.`,
    closedScrew: "Vis serrée à l'ouverture : la pression arrive d'un coup au chalumeau. Desserrez la vis avant d'ouvrir la bouteille.",
    ask: {
      manometre: (g, reads) => `${g} : quel manomètre indique ${reads === "bouteille" ? "la pression dans la bouteille" : "la pression de service envoyée au chalumeau"} ?`,
      lecture: (g, gauge) => `${g} : que lit-on sur le manomètre ${gauge === "amont" ? "amont (HP)" : "aval (BP)"} ?`,
      detente: (g) => `${g} : quelle est la pression de détente maximale ?`,
      detendeur: (gas) => `Quel détendeur compact convient pour : ${gas.toLowerCase()} ?`,
      reglage: (g, v) => `${g}, réglé à ${v} bar : ce réglage est-il admis ?`,
      ordre: (proc, step) => `${proc === "start" ? "Mise en service" : "Mise hors service"} : après « ${step} », que fait-on ?`,
    },
    gauges: { amont: "Le manomètre HP (amont)", aval: "Le manomètre BP (aval)", vis: "La vis de détente" },
    reglage: { admis: "Admis", "trop-haut": "Trop haut : au-delà de la détente maximale", "hors-cadran": "Hors cadran : au-delà du manomètre aval" },
    regulator: (t) => `Alimentation ${t.feed} bar, cadrans 0 à ${String(t.low).replace(".", ",")} et 0 à ${t.high} bar`,
    bar: (v) => `${String(v).replace(".", ",")} bar`,
    why: (g) => `${g.label.fr} : alimentation ${g.feed} bar, détente 0 à ${String(g.detent).replace(".", ",")} bar, manomètre aval 0 à ${String(g.low).replace(".", ",")}, amont 0 à ${g.high} bar.`,
    right: "Juste.",
    wrong: (a) => `Non : la bonne réponse est « ${a} ».`,
    done: (g, t) => `Série terminée : ${g} / ${t}. Lancez une nouvelle série pour d'autres situations.`,
    step: (i, n) => `situation ${i} / ${n}`,
    score: (g, t) => `Score de la série : ${g} / ${t}`,
    marks: { right: "Bonne réponse", wrong: "Votre réponse, fausse" },
  },
  en: {
    title: "The pressure regulator",
    pageTitle: "The pressure regulator: explore and practise",
    hint: "Explore the regulator, then practise reading and setting it",
    buttons: { explore: "Explore", quiz: "Practise", gas: "Change gas", open: "Open the cylinder", close: "Close the cylinder", plus: "Screw: turn in", minus: "Screw: back off", again: "Next situation", series: "New series" },
    keys: [{ mark: "raised", label: "Cylinder, regulator, HP and LP gauges, adjusting screw, hose" }, { mark: "lit", label: "Gauge to read" }],
    caption: "The inlet gauge (HP) reads the cylinder pressure; the outlet gauge (LP) reads the working pressure sent to the torch, set with the adjusting screw: turn it in to raise, back it off to lower. Maximum working pressure (handout): acetylene 1.5 bar, propane 4 bar, oxygen, nitrogen and CO2 10 bar. The screw is backed off before opening the cylinder. Cylinder pressures in Explore mode are orders of magnitude. Each series draws 10 situations out of more than 1,000; nothing is recorded.",
    stageLabel: "Gas cylinder fitted with a pressure regulator with two gauges and an adjusting screw. Controls and questions are below the drawing.",
    svgLabel: "Cylinder, pressure regulator with high and low-pressure gauges, adjusting screw and hose.",
    gas: (g) => `${g} regulator`,
    explore: (gas, open, hp, bp, warn) => `${gas} · cylinder ${open ? "open" : "closed"} · HP ${hp} bar · LP ${bp} bar${warn ? " · too high!" : ""}`,
    warn: (max) => `Careful: the working pressure is above ${max} bar, the maximum for this gas. Back off the screw.`,
    closedScrew: "Screw turned in when opening: the pressure reaches the torch all at once. Back off the screw before opening the cylinder.",
    ask: {
      manometre: (g, reads) => `${g}: which gauge shows ${reads === "bouteille" ? "the pressure in the cylinder" : "the working pressure sent to the torch"}?`,
      lecture: (g, gauge) => `${g}: what does the ${gauge === "amont" ? "inlet (HP)" : "outlet (LP)"} gauge read?`,
      detente: (g) => `${g}: what is the maximum working pressure?`,
      detendeur: (gas) => `Which compact regulator suits: ${gas.toLowerCase()}?`,
      reglage: (g, v) => `${g}, set to ${v} bar: is this setting allowed?`,
      ordre: (proc, step) => `${proc === "start" ? "Start-up" : "Shut-down"}: after "${step}", what comes next?`,
    },
    gauges: { amont: "The HP (inlet) gauge", aval: "The LP (outlet) gauge", vis: "The adjusting screw" },
    reglage: { admis: "Allowed", "trop-haut": "Too high: above the maximum working pressure", "hors-cadran": "Off the dial: above the outlet gauge" },
    regulator: (t) => `Inlet ${t.feed} bar, dials 0 to ${t.low} and 0 to ${t.high} bar`,
    bar: (v) => `${v} bar`,
    why: (g) => `${g.label.en}: inlet ${g.feed} bar, working pressure 0 to ${g.detent} bar, outlet gauge 0 to ${g.low}, inlet gauge 0 to ${g.high} bar.`,
    right: "Correct.",
    wrong: (a) => `No: the right answer is "${a}".`,
    done: (g, t) => `Series finished: ${g} / ${t}. Start a new series for other situations.`,
    step: (i, n) => `situation ${i} / ${n}`,
    score: (g, t) => `Series score: ${g} / ${t}`,
    marks: { right: "Right answer", wrong: "Your answer, wrong" },
  },
};

const LIVE = LIVE_HEAD(NAME) + `
const CAT = MD.buildRegulators();
const GAS_IDS = Object.keys(CAT.gases);
const BOTTLE = { acetylene: 15, propane: 7, oxygene: 200, azote: 200, co2: 57 };
const scene = svg.querySelector(".md-scene");
const prompt = scope.querySelector(".rc-prompt");
const quizBox = scope.querySelector(".rc-quiz");
const exploreBox = scope.querySelector(".md-explore");
const optionsBox = scope.querySelector(".rc-options");
const gasName = (id) => CAT.gases[id].label[LANG];
function setGas(id) {
  scene.dataset.gas = id;
  const g = CAT.gases[id];
  for (const t of svg.querySelectorAll(".md-num")) {
    const span = t.dataset.dial === "amont" ? g.high : g.low;
    t.textContent = String(Math.round((span * +t.dataset.i / 4) * 100) / 100).replace(".", LANG === "fr" ? "," : ".");
  }
}
function needle(dial, value, span) {
  const d = DIALS[dial], t = Math.max(0, Math.min(1.02, value / span)), a = (225 - 270 * t) * Math.PI / 180;
  const at = (r) => [d.c[0] + r * (Math.cos(a) * d.u[0] + Math.sin(a) * d.z[0]), d.c[1] + r * (Math.cos(a) * d.u[1] + Math.sin(a) * d.z[1])];
  const tip = at(d.r - 2.2), tail = at(-3);
  svg.querySelector('.md-needle[data-dial="' + dial + '"]').setAttribute("d", "M" + tail[0].toFixed(1) + " " + tail[1].toFixed(1) + "L" + tip[0].toFixed(1) + " " + tip[1].toFixed(1));
}
function lit(dial) { for (const g of svg.querySelectorAll(".md-dial")) g.toggleAttribute("data-lit", g.dataset.dial === dial); }
// ---------------------------------------------------------------- Explorer
let gi = 2, open = false, screw = 0, hp = 0, warned = false;
function drawExplore() {
  if (!quizBox.hidden) return;
  const id = GAS_IDS[gi], g = CAT.gases[id];
  setGas(id);
  const bp = open ? Math.min(screw, hp) : 0;
  needle("amont", open ? hp : 0, g.high); needle("aval", bp, g.low); lit(null);
  const warn = bp > g.detent + 1e-9;
  readout.textContent = TX.explore(gasName(id), open, X(open ? hp : 0, 0), X(bp, 2), warn);
  if (warn && !warned) { feedback.textContent = TX.warn(X(g.detent, 1)); warned = true; }
  if (!warn) warned = false;
  buttons.open.textContent = open ? TX.buttons.close : TX.buttons.open;
}
const X = (v, d) => String(Math.round(v * 10 ** d) / 10 ** d).replace(".", LANG === "fr" ? "," : ".");
function step(dt) { const g = CAT.gases[GAS_IDS[gi]]; if (open && screw > 0 && hp > 0) hp = Math.max(0, hp - dt * screw * g.high / 900); drawExplore(); }
const run = loop(step, () => open && screw > 0);
buttons.gas.addEventListener("click", () => { gi = (gi + 1) % GAS_IDS.length; open = false; screw = 0; hp = BOTTLE[GAS_IDS[gi]]; feedback.textContent = ""; drawExplore(); });
buttons.open.addEventListener("click", () => {
  if (!open && screw > 0) feedback.textContent = TX.closedScrew; else if (!open) feedback.textContent = "";
  open = !open; if (open && hp <= 0) hp = BOTTLE[GAS_IDS[gi]]; drawExplore(); run();
});
buttons.plus.addEventListener("click", () => { const g = CAT.gases[GAS_IDS[gi]]; screw = Math.min(g.low, Math.round((screw + g.low / 10) * 100) / 100); drawExplore(); run(); });
buttons.minus.addEventListener("click", () => { const g = CAT.gases[GAS_IDS[gi]]; screw = Math.max(0, Math.round((screw - g.low / 10) * 100) / 100); drawExplore(); });
// ---------------------------------------------------------------- Séries
const pool = { 1: [], 2: [], 3: [], 4: [] };
CAT.situations.forEach((s) => pool[s.level].push(s));
const PLAN = [1, 1, 1, 2, 2, 2, 3, 3, 4, 4];
let list = [], at = 0, good = 0, answered = false;
const stepsOf = (p) => CAT[p];
function label(s, o) {
  if (s.kind === "manometre") return TX.gauges[o];
  if (s.kind === "lecture" || s.kind === "detente") return TX.bar(o);
  if (s.kind === "detendeur") return TX.regulator(o);
  if (s.kind === "reglage") return TX.reglage[o];
  return stepsOf(s.procedure).find((x) => x.id === o).label[LANG];
}
function showSituation(s) {
  const g = s.gas ? CAT.gases[s.gas] : null;
  if (s.gas) setGas(s.gas);
  needle("amont", s.kind === "lecture" && s.gauge === "amont" ? s.needle : g ? g.high * 0.6 : 0, g ? g.high : 1);
  needle("aval", s.kind === "lecture" && s.gauge === "aval" ? s.needle : s.kind === "reglage" ? s.value : g ? g.detent * 0.5 : 0, g ? g.low : 1);
  lit(s.kind === "lecture" ? s.gauge : null);
  const name = s.gas ? TX.gas(gasName(s.gas)) : "";
  const A = TX.ask;
  prompt.textContent = s.kind === "manometre" ? A.manometre(name, s.reads) : s.kind === "lecture" ? A.lecture(name, s.gauge) : s.kind === "detente" ? A.detente(name)
    : s.kind === "detendeur" ? A.detendeur(gasName(s.gas)) : s.kind === "reglage" ? A.reglage(name, X(s.value, 2)) : A.ordre(s.procedure, stepsOf(s.procedure)[s.after].label[LANG]);
  readout.textContent = "";
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function show() {
  answered = false;
  const s = list[at];
  showSituation(s);
  optionsBox.replaceChildren(...s.options.slice().sort(() => Math.random() - 0.5).map((o) => {
    const b = document.createElement("button"); b.type = "button"; b.textContent = label(s, o); b._o = o;
    b.addEventListener("click", () => answer(o)); return b;
  }));
  feedback.textContent = "";
  buttons.again.disabled = true;
  scoreEl.textContent = TX.score(good, at) + " · " + TX.step(at + 1, list.length);
}
function answer(o) {
  if (answered) return;
  answered = true;
  const s = list[at], ok = same(o, s.answer);
  if (ok) good++;
  for (const b of optionsBox.children) {
    b.disabled = true;
    if (same(b._o, s.answer)) { b.dataset.state = "right"; b.prepend("✓ "); b.setAttribute("aria-label", TX.marks.right + " : " + b.textContent.slice(2)); }
    else if (same(b._o, o)) { b.dataset.state = "wrong"; b.prepend("✗ "); b.setAttribute("aria-label", TX.marks.wrong + " : " + b.textContent.slice(2)); }
  }
  const last = at === list.length - 1;
  feedback.textContent = (ok ? TX.right : TX.wrong(label(s, s.answer))) + (s.gas ? " " + TX.why(CAT.gases[s.gas]) : "") + (last ? " " + TX.done(good, list.length) : "");
  if (s.kind === "manometre") lit(s.answer === "vis" ? null : s.answer);
  buttons.again.disabled = last;
  scoreEl.textContent = TX.score(good, at + 1) + " · " + TX.step(at + 1, list.length);
}
function start() {
  list = [];
  for (const level of PLAN) { const p = pool[level]; let s; for (let i = 0; i < 40; i++) { s = p[Math.floor(Math.random() * p.length)]; if (!list.includes(s)) break; } list.push(s); }
  at = 0; good = 0; show();
}
buttons.again.addEventListener("click", () => { if (at < list.length - 1) { at++; show(); } });
buttons.series.addEventListener("click", start);
function setMode(m) {
  buttons.explore.setAttribute("aria-pressed", m === "explore");
  buttons.quiz.setAttribute("aria-pressed", m === "quiz");
  exploreBox.hidden = m !== "explore"; quizBox.hidden = m !== "quiz";
  if (m === "explore") { prompt.textContent = ""; scoreEl.textContent = ""; feedback.textContent = ""; hp = BOTTLE[GAS_IDS[gi]]; drawExplore(); }
  else { open = false; screw = 0; start(); }
}
buttons.explore.addEventListener("click", () => setMode("explore"));
buttons.quiz.addEventListener("click", () => setMode("quiz"));
for (const b of scope.querySelectorAll(".mv-controls button")) b.disabled = false;
window.__md = { setMode, answer: (i) => answer(list[at].options[i]), current: () => list[at] };
setMode("explore");
` + LIVE_WATCH;

const langs = {};
for (const lang of ["fr", "en"]) {
  const T = TEXT[lang], B = T.buttons;
  const svg = k.figureSvg({ width: WIDTH, height: HEIGHT, label: T.svgLabel, body: [`<g class="md-scene" data-gas="oxygene">${scene(lang)}</g>`] });
  const modes = `<div class="mv-controls" role="group" aria-label="${lang === "fr" ? "Mode de la figure" : "Figure mode"}"><button type="button" data-act="explore">${B.explore}</button><button type="button" data-act="quiz">${B.quiz}</button></div>`;
  const explore = `<div class="md-explore"><div class="mv-controls" role="group" aria-label="${lang === "fr" ? "Commandes du détendeur" : "Regulator controls"}"><button type="button" data-act="gas">${B.gas}</button><button type="button" data-act="open">${B.open}</button><button type="button" data-act="minus">${B.minus}</button><button type="button" data-act="plus">${B.plus}</button></div></div>`;
  const quiz = `<div class="rc-quiz" hidden><div class="mv-controls rc-options" role="group" aria-label="${lang === "fr" ? "Réponses proposées" : "Possible answers"}"></div><div class="mv-controls"><button type="button" data-act="again">${B.again}</button><button type="button" data-act="series">${B.series}</button></div></div>`;
  const body = `<div class="iso-stage" role="img" aria-label="${T.stageLabel}">${svg}</div>${modes}${explore}<p class="rc-prompt" aria-live="polite"></p>${quiz}<p class="mv-feedback" aria-live="polite"></p><p class="mv-score" aria-live="polite"></p>`;
  const plate = waitingButtons(k.plateHtml({ fig: "Fig 6", title: T.title, hint: T.hint, readout: "", keys: T.keys, caption: T.caption, body }));
  const fns = (o) => `{${Object.entries(o).map(([key, f]) => `${JSON.stringify(key)}:${typeof f === "function" ? f : JSON.stringify(f)}`).join(",")}}`;
  const TX = `{buttons:${JSON.stringify(B)},gas:${T.gas},explore:${T.explore},warn:${T.warn},closedScrew:${JSON.stringify(T.closedScrew)},ask:${fns(T.ask)},gauges:${JSON.stringify(T.gauges)},reglage:${JSON.stringify(T.reglage)},regulator:${T.regulator},bar:${T.bar},why:${T.why},right:${JSON.stringify(T.right)},wrong:${T.wrong},done:${T.done},step:${T.step},score:${T.score},marks:${JSON.stringify(T.marks)}}`;
  langs[lang] = { plate, title: T.pageTitle, script: `${MODULE}const LANG = "${lang}";\nconst DIALS = ${JSON.stringify(DIAL_GEOM)};\nconst TX = ${TX};\n` + LIVE };
}
writeFigure(HERE, NAME, langs, CONTROLS_CSS + FITTINGS_CSS + `
.md-face{fill:var(--anatomy-card);stroke:var(--anatomy-mid);stroke-width:.6}
.md-num{font:600 6px/1 var(--anatomy-mono);fill:var(--anatomy-strong)}
.md-unit{font:3.8px/1 var(--anatomy-mono);fill:var(--anatomy-muted);letter-spacing:.04em}
.md-needle{stroke:var(--anatomy-lit);stroke-width:1.1;stroke-linecap:round;transition:d .4s ease}
.md-hub{fill:var(--anatomy-lit)}
.md-dial[data-lit] .md-face{stroke:var(--anatomy-lit);stroke-width:1.4}
.md-explore[hidden],.rc-quiz[hidden]{display:none}
.md-scene[data-gas="acetylene"] .md-bottle,.md-scene[data-gas="acetylene"] .md-hose{filter:sepia(1) saturate(4) hue-rotate(-50deg) brightness(.9)}
.md-scene[data-gas="propane"] .md-bottle{filter:sepia(1) saturate(3) hue-rotate(-20deg)}
.md-scene[data-gas="oxygene"] .md-hose{filter:sepia(1) saturate(4) hue-rotate(170deg)}
.md-scene[data-gas="azote"] .md-bottle{filter:brightness(.7)}
.md-scene[data-gas="co2"] .md-bottle{filter:brightness(.85)}
@media (prefers-reduced-motion:reduce){.md-needle{transition:none}}
`);
