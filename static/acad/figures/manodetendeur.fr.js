(() => {
const MD = (() => {
// Situations de la figure `manodetendeur` (Partie 4, module 5, « Les manodétendeurs » ; décisions Q92, Q93).
// Valeurs du tableau « Manodétendeurs à un étage compact » du support ; ordre de mise en service et hors service
// de la section « Mise en service ». Toutes les situations sont énumérées ici ; la figure les tire au hasard,
// rien n'est enregistré (Q73).

const L = (fr, en) => ({ fr, en });
const r2 = (x) => Math.round(x * 100) / 100;

// feed : alimentation max (bar) ; detent : détente max ; low : cadran aval (basse pression) ; high : cadran amont.
const GASES = {
  acetylene: { label: L("Acétylène", "Acetylene"), feed: 25, detent: 1.5, low: 2.5, high: 40 },
  propane: { label: L("Propane", "Propane"), feed: 25, detent: 4, low: 6, high: 40 },
  oxygene: { label: L("Oxygène", "Oxygen"), feed: 230, detent: 10, low: 16, high: 315 },
  azote: { label: L("Azote", "Nitrogen"), feed: 230, detent: 10, low: 16, high: 315 },
  co2: { label: L("CO2", "CO2"), feed: 230, detent: 10, low: 16, high: 315 },
};

const START = [
  { id: "vis-desserrees", label: L("Vis de détente desserrées, raccorder les manodétendeurs", "Pressure-adjusting screws backed off, fit the regulators") },
  { id: "ouvrir-bouteilles", label: L("Ouvrir lentement les robinets des bouteilles", "Open the cylinder valves slowly") },
  { id: "regler-oxygene", label: L("Régler la pression de service de l'oxygène", "Set the oxygen working pressure") },
  { id: "regler-acetylene", label: L("Régler la pression de service de l'acétylène, sans dépasser les limites", "Set the acetylene working pressure, within the limits") },
  { id: "purger", label: L("Purger séparément chaque tuyau, loin de toute flamme", "Purge each hose separately, away from any flame") },
  { id: "allumer", label: L("Ouvrir l'acétylène du chalumeau, allumer, puis ouvrir l'oxygène", "Open the torch acetylene, light, then open the oxygen") },
];
const STOP = [
  { id: "fermer-acetylene", label: L("Fermer le robinet d'acétylène du chalumeau", "Close the torch acetylene valve") },
  { id: "fermer-oxygene", label: L("Fermer le robinet d'oxygène du chalumeau", "Close the torch oxygen valve") },
  { id: "fermer-bouteilles", label: L("Fermer les robinets des bouteilles", "Close the cylinder valves") },
  { id: "purger-desserrer", label: L("Purger les tuyaux, puis desserrer les vis de détente", "Purge the hoses, then back off the adjusting screws") },
];

const steps = (from, to, step) => Array.from({ length: Math.round((to - from) / step) + 1 }, (_, i) => r2(from + i * step));
// Pas de lecture de chaque cadran (demi-graduation).
const READ_STEP = { 315: 2.5, 40: 0.5, 16: 0.25, 6: 0.1, 2.5: 0.05 };

function around(answer, step, span) {
  const out = [answer];
  // Leurres écartés d'au moins une grande graduation (span / 10 = 5 demi-graduations), lisibles sur un téléphone.
  for (const d of [step * 5, -step * 5, step * 10, -step * 10, step * 15, -step * 15]) {
    const v = r2(answer + d);
    if (out.length < 4 && v > 0 && v <= span && !out.includes(v)) out.push(v);
  }
  return out.sort((a, b) => a - b);
}

function buildRegulators() {
  const out = [];
  const push = (kind, level, rest) => out.push({ key: `${kind}|${JSON.stringify(rest)}`, level, kind, ...rest });
  for (const [gas, g] of Object.entries(GASES)) {
    for (const reads of ["bouteille", "service"]) {
      push("manometre", 1, { gas, reads, answer: reads === "bouteille" ? "amont" : "aval", options: ["amont", "aval", "vis"] });
    }
    push("detente", 1, { gas, answer: g.detent, options: [1.5, 4, 10, 16] });
    for (const gauge of ["aval", "amont"]) {
      const span = gauge === "amont" ? g.high : g.low;
      const step = READ_STEP[span];
      for (const v of steps(step, span - step, step)) {
        push("lecture", gauge === "aval" ? 2 : 3, { gas, gauge, needle: v, answer: v, options: around(v, step, span) });
      }
    }
    const grid = g.low === 2.5 ? steps(0.1, 3, 0.1) : g.low === 6 ? steps(0.2, 7, 0.2) : steps(0.5, 18, 0.5);
    for (const v of grid) {
      push("reglage", 4, { gas, value: v, answer: v <= g.detent ? "admis" : v <= g.low ? "trop-haut" : "hors-cadran", options: ["admis", "trop-haut", "hors-cadran"] });
    }
    const types = [{ feed: 25, low: 2.5, high: 40 }, { feed: 25, low: 6, high: 40 }, { feed: 230, low: 16, high: 315 }];
    push("detendeur", 4, { gas, answer: { feed: g.feed, low: g.low, high: g.high }, options: types });
  }
  for (const [procedure, list] of [["start", START], ["stop", STOP]]) {
    for (let after = 0; after < list.length - 1; after++) {
      const answer = list[after + 1].id;
      const others = list.filter((_, i) => i !== after + 1 && i !== after).map((s) => s.id);
      const options = [answer, ...others.slice(0, 3)].sort();
      push("ordre", 4, { procedure, after, answer, options });
    }
  }
  return { gases: GASES, start: START, stop: STOP, situations: out };
}

return { GASES, START, STOP, buildRegulators };
})();
const LANG = "fr";
const DIALS = {"amont":{"c":[166.37837433420543,83.75159863836944],"u":[2.4077763391507006,0],"z":[0,-2.232451347068462],"r":23},"aval":{"c":[310.8449546832466,83.75159863836944],"u":[2.4077763391507006,0],"z":[0,-2.232451347068462],"r":23}};
const TX = {buttons:{"explore":"Explorer","quiz":"S'entraîner","gas":"Changer de gaz","open":"Ouvrir la bouteille","close":"Fermer la bouteille","plus":"Vis : serrer","minus":"Vis : desserrer","again":"Situation suivante","series":"Nouvelle série"},gas:(g) => ({ Propane: "Détendeur de propane", CO2: "Détendeur de CO2" })[g] || `Détendeur d'${g.toLowerCase()}`,explore:(gas, open, hp, bp, warn) => `${gas} · bouteille ${open ? "ouverte" : "fermée"} · HP ${hp} bar · BP ${bp} bar${warn ? " · trop haut !" : ""}`,warn:(max) => `Attention : la détente dépasse ${max} bar, la valeur maximale de ce gaz. Desserrez la vis.`,closedScrew:"Vis serrée à l'ouverture : la pression arrive d'un coup au chalumeau. Desserrez la vis avant d'ouvrir la bouteille.",ask:{"manometre":(g, reads) => `${g} : quel manomètre indique ${reads === "bouteille" ? "la pression dans la bouteille" : "la pression de service envoyée au chalumeau"} ?`,"lecture":(g, gauge) => `${g} : que lit-on sur le manomètre ${gauge === "amont" ? "amont (HP)" : "aval (BP)"} ?`,"detente":(g) => `${g} : quelle est la pression de détente maximale ?`,"detendeur":(gas) => `Quel détendeur compact convient pour : ${gas.toLowerCase()} ?`,"reglage":(g, v) => `${g}, réglé à ${v} bar : ce réglage est-il admis ?`,"ordre":(proc, step) => `${proc === "start" ? "Mise en service" : "Mise hors service"} : après « ${step} », que fait-on ?`},gauges:{"amont":"Le manomètre HP (amont)","aval":"Le manomètre BP (aval)","vis":"La vis de détente"},reglage:{"admis":"Admis","trop-haut":"Trop haut : au-delà de la détente maximale","hors-cadran":"Hors cadran : au-delà du manomètre aval"},regulator:(t) => `Alimentation ${t.feed} bar, cadrans 0 à ${String(t.low).replace(".", ",")} et 0 à ${t.high} bar`,bar:(v) => `${String(v).replace(".", ",")} bar`,why:(g) => `${g.label.fr} : alimentation ${g.feed} bar, détente 0 à ${String(g.detent).replace(".", ",")} bar, manomètre aval 0 à ${String(g.low).replace(".", ",")}, amont 0 à ${g.high} bar.`,right:"Juste.",wrong:(a) => `Non : la bonne réponse est « ${a} ».`,done:(g, t) => `Série terminée : ${g} / ${t}. Lancez une nouvelle série pour d'autres situations.`,step:(i, n) => `situation ${i} / ${n}`,score:(g, t) => `Score de la série : ${g} / ${t}`,marks:{"right":"Bonne réponse","wrong":"Votre réponse, fausse"}};

const still = matchMedia("(prefers-reduced-motion: reduce)");
const scope = document.querySelector('.live-figure[data-figure="manodetendeur"]') || document;
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
  feedback.textContent = [ok ? TX.right : TX.wrong(label(s, s.answer)), s.gas ? TX.why(CAT.gases[s.gas]) : "", last ? TX.done(good, list.length) : ""].filter(Boolean).join(" ");
  if (s.kind === "manometre") lit(s.answer === "vis" ? null : s.answer);
  buttons.again.disabled = last;
  scoreEl.textContent = TX.score(good, at + 1) + " · " + TX.step(at + 1, list.length);
}
function start() {
  list = [];
  // Dans un niveau, on tire d'abord le type de situation : les 173 réglages n'écrasent pas l'ordre ni le choix du détendeur.
  for (const level of PLAN) {
    const kinds = {};
    pool[level].forEach((x) => (kinds[x.kind] ||= []).push(x));
    const groups = Object.values(kinds);
    let s;
    for (let i = 0; i < 40; i++) { const g = groups[Math.floor(Math.random() * groups.length)]; s = g[Math.floor(Math.random() * g.length)]; if (!list.includes(s)) break; }
    list.push(s);
  }
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
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);

})();
