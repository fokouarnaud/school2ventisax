(() => {
const BR = (() => {
// Situations de la figure `brasage` (Partie 4, module 6, « Soudo-brasage et brasage » ; Q97, Q98).
// Étapes recopiées mot pour mot des 8 conditions de la section « Brasage » (fr et en) ; gestes dangereux tirés du même
// texte ; procédés classés avec les seuils du module (450 °C, cuivre 1085 °C). Rien en base (Q73).

const L = (fr, en) => ({ fr, en });

const STEPS = [
  { id: "nettoyer", label: L("Nettoyer la surface des joints à abraser, à l'aide du tissu à polir ou de brosses spéciales.", "Clean the joint surfaces to be abraded, with polishing cloth or special brushes."), short: L("Nettoyer les surfaces", "Clean the surfaces") },
  { id: "ebavurer", label: L("Ébavurer la coupe pour arrondir les arêtes.", "Deburr the cut to round the edges."), short: L("Ébavurer la coupe", "Deburr the cut") },
  { id: "emboutir", label: L("Pour des pièces de même diamètre, effectuer un évasement cylindrique sur l'un des deux tubes, en fonction du sens de passage du fluide.", "For parts of the same diameter, swage (<span lang=\"fr\">emboutir</span>) one of the two tubes, according to the direction of flow."), short: L("Évaser l'un des tubes", "Swage one tube") },
  { id: "decapant", label: L("Enduire les parties à assembler avec le décapant correspondant à l'alliage, en quantité juste suffisante.", "Coat the parts to be joined with the flux that suits the alloy, in just enough quantity."), short: L("Enduire de décapant", "Coat with flux") },
  { id: "placer", label: L("Placer les pièces dans leur position définitive.", "Place the parts in their final position."), short: L("Placer les pièces", "Place the parts") },
  { id: "chauffer", label: L("Régler la flamme et chauffer la pièce.", "Adjust the flame and heat the part."), short: L("Régler la flamme, chauffer", "Adjust the flame, heat") },
  { id: "braser", label: L("Dès la fusion du décapant, poser aussitôt la pointe de la baguette (brasure) sur le joint. La brasure fondue est aspirée par capillarité dans le jeu entre les pièces : la flamme chauffe le joint et non la baguette.", "As soon as the flux melts, touch the tip of the filler rod to the joint. The molten filler is drawn by capillary action into the gap between the parts: the flame heats the joint, not the rod."), short: L("Poser la baguette sur le joint", "Touch the rod to the joint") },
  { id: "laver", label: L("Éliminer les résidus de décapant par un lavage à l'eau, chaude de préférence, afin d'éviter un refroidissement trop rapide.", "Remove flux residue by washing with water, preferably hot, to avoid cooling too quickly."), short: L("Laver à l'eau chaude", "Wash with hot water") },
];

const ERRORS = [
  { id: "sous-pression", step: "chauffer", action: L("Chauffer une conduite qui contient du fluide frigorigène sous pression", "Heat a line that contains refrigerant under pressure"), why: L("Il ne faut jamais chauffer une conduite contenant du fluide frigorigène sous pression : risque d'explosion et de décomposition du fluide.", "Never heat a line containing refrigerant under pressure: risk of explosion and of decomposition of the refrigerant.") },
  { id: "chauffer-baguette", step: "braser", action: L("Chauffer la baguette pour la faire couler sur le joint", "Heat the rod to make it run onto the joint"), why: L("La flamme chauffe le joint et non la baguette : c'est le joint chaud qui aspire la brasure par capillarité.", "The flame heats the joint, not the rod: the hot joint draws the filler in by capillary action.") },
  { id: "trop-tot", step: "braser", action: L("Poser la baguette avant que le décapant ait fondu", "Touch the rod before the flux has melted"), why: L("La baguette se pose dès la fusion du décapant, pas avant : le joint n'est pas encore à température.", "The rod is applied as soon as the flux melts, not before: the joint is not yet hot enough.") },
  { id: "trop-decapant", step: "decapant", action: L("Enduire largement de décapant, pour être sûr", "Coat generously with flux, to be safe"), why: L("Le décapant s'applique en quantité juste suffisante.", "Flux is applied in just enough quantity.") },
  { id: "eau-froide", step: "laver", action: L("Refroidir le joint brusquement à l'eau froide", "Cool the joint suddenly with cold water"), why: L("Le lavage se fait à l'eau, chaude de préférence, pour éviter un refroidissement trop rapide.", "Washing is done with water, preferably hot, to avoid cooling too quickly.") },
  { id: "sans-ebavurer", step: "ebavurer", action: L("Assembler la coupe telle quelle, sans l'ébavurer", "Join the cut as it is, without deburring"), why: L("La coupe s'ébavure pour arrondir les arêtes.", "The cut is deburred to round the edges.") },
  { id: "sans-nettoyer", step: "nettoyer", action: L("Braser sans nettoyer les surfaces", "Braze without cleaning the surfaces"), why: L("Les surfaces des joints se nettoient au tissu à polir ou à la brosse avant tout.", "The joint surfaces are cleaned with polishing cloth or brushes first.") },
];

const THRESHOLDS = { tendre: 450, cuivre: 1085 };

const rotate = (list, n) => [...list.slice(n % list.length), ...list.slice(0, n % list.length)];

function buildBrazing() {
  const out = [];
  const push = (kind, level, rest) => out.push({ key: `${kind}|${JSON.stringify(rest)}`, level, kind, ...rest });
  const procs = ["tendre", "fort", "soudo", "soudage"];
  for (let filler = 150; filler <= 1050; filler += 20) {
    if (filler === THRESHOLDS.tendre) continue;
    if (filler < THRESHOLDS.tendre) {
      push("procede", 1, { filler, parts_melt: false, capillary: true, edges: false, answer: "tendre", options: procs });
    } else {
      push("procede", 1, { filler, parts_melt: false, capillary: true, edges: false, answer: "fort", options: procs });
      push("procede", 2, { filler, parts_melt: false, capillary: false, edges: true, answer: "soudo", options: procs });
      push("procede", 2, { filler, parts_melt: true, capillary: false, edges: true, answer: "soudage", options: procs });
    }
  }
  const ids = STEPS.map((s) => s.id);
  ids.forEach((id, i) => {
    const others = (exclude) => rotate(ids.filter((x) => !exclude.includes(x)), i).slice(0, 3);
    if (i < ids.length - 1) push("suivante", 1, { from: id, answer: ids[i + 1], options: [ids[i + 1], ...others([id, ids[i + 1]])].sort() });
    if (i > 0) push("precedente", 2, { from: id, answer: ids[i - 1], options: [ids[i - 1], ...others([id, ids[i - 1]])].sort() });
  });
  ERRORS.forEach((e, i) => {
    const others = rotate(ERRORS.filter((x) => x.id !== e.id), i).slice(0, 3).map((x) => x.id);
    push("erreur", 3, { error: e.id, answer: e.id, options: [e.id, ...others].sort() });
  });
  return { steps: STEPS, errors: ERRORS, thresholds: THRESHOLDS, situations: out };
}

return { STEPS, ERRORS, THRESHOLDS, buildBrazing };
})();
const LANG = "fr";
const TX = {doPrompt:(n, total) => `Brasage : touchez l'action suivante (étape ${n} sur ${total}).`,done:"Joint brasé, décapant lavé à l'eau chaude.",stepOk:(label) => `Juste : ${label}`,notYet:(label) => `Pas encore : l'étape attendue est « ${label} »`,danger:(why) => `Action refusée, dangereuse : ${why}`,ask:{"procede":(t, melt, cap) => `Métal d'apport fondant à ${t} °C, pièces ${melt ? "fondues" : "non fondues"}, ${cap ? "brasure aspirée par capillarité dans le jeu" : "joint rempli de proche en proche, bords préparés"} : quel procédé ?`,"suivante":(step) => `Après « ${step} », que fait-on ?`,"precedente":(step) => `Quelle étape vient juste avant « ${step} » ?`,"erreur":(action) => `Pourquoi est-ce une erreur : « ${action} » ?`},procs:{"tendre":"Brasage tendre","fort":"Brasage fort","soudo":"Soudo-brasage","soudage":"Soudage"},procWhy:"Pièces fondues : soudage. Sinon, apport sous 450 °C : brasage tendre ; au-dessus, avec capillarité : brasage fort ; bords préparés et remplissage de proche en proche : soudo-brasage.",right:"Juste.",wrong:(a) => `Non : la bonne réponse est « ${a} ».`,seriesDone:(g, t) => `Série terminée : ${g} / ${t}. Lancez une nouvelle série pour d'autres situations.`,step:(i, n) => `situation ${i} / ${n}`,score:(g, t) => `Score de la série : ${g} / ${t}`,marks:{"right":"Bonne réponse","wrong":"Votre réponse, fausse"}};

const still = matchMedia("(prefers-reduced-motion: reduce)");
const scope = document.querySelector('.live-figure[data-figure="brasage"]') || document;
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

const CAT = BR.buildBrazing();
const prompt = scope.querySelector(".rc-prompt");
const quizBox = scope.querySelector(".rc-quiz");
const doBox = scope.querySelector(".ms-do");
const actionsBox = scope.querySelector(".ms-actions");
// Les réponses vont dans la liste du mode « S'entraîner », pas dans celle des actions de « Réaliser ».
const optionsBox = scope.querySelector(".rc-quiz .rc-options");
// Un élément SVG n'a pas de propriété hidden : l'attribut se pose et se retire à la main.
const show = (cls, on) => svg.querySelector(cls).toggleAttribute("hidden", !on);
const stepOf = (id) => CAT.steps.find((s) => s.id === id);
const strip = (s) => s.replace(/<[^>]+>/g, "");
const LIT = { nettoyer: "tubes", ebavurer: "tubes", emboutir: "emboiture", placer: "tubes" };
function light(part) { for (const g of svg.querySelectorAll(".br-part")) g.toggleAttribute("data-lit", g.dataset.part === part); }
function reset() { for (const c of [".br-flux", ".br-fill", ".br-rod", ".br-torch", ".br-flame"]) show(c, false); light(null); }
// Dessin après l'étape d : ce qui a été fait reste visible.
function drawStep(d) {
  reset();
  const done = CAT.steps.slice(0, d).map((s) => s.id);
  if (done.includes("decapant") && !done.includes("laver")) show(".br-flux", true);
  if (done.includes("chauffer") && !done.includes("laver")) { show(".br-torch", true); show(".br-flame", true); }
  if (done.includes("braser")) { show(".br-fill", true); if (!done.includes("laver")) show(".br-rod", true); }
  const last = done[done.length - 1];
  if (LIT[last]) light(LIT[last]);
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// ---------------------------------------------------------------- Réaliser
let at = 0;
const pickFrom = (list, n) => list.slice().sort(() => Math.random() - 0.5).slice(0, n);
function actionsFor() {
  const expected = CAT.steps[at];
  const others = pickFrom(CAT.steps.filter((s) => s.id !== expected.id), 2).map((s) => ({ kind: "step", id: s.id, label: s.short[LANG] }));
  const errs = pickFrom(CAT.errors, 1).map((e) => ({ kind: "error", id: e.id, label: e.action[LANG] }));
  return [{ kind: "step", id: expected.id, label: expected.short[LANG] }, ...others, ...errs].sort(() => Math.random() - 0.5);
}
function renderDo() {
  if (at >= CAT.steps.length) { prompt.textContent = TX.done; actionsBox.replaceChildren(); buttons.restart.hidden = false; return; }
  prompt.textContent = TX.doPrompt(at + 1, CAT.steps.length);
  actionsBox.replaceChildren(...actionsFor().map((a) => {
    const b = document.createElement("button"); b.type = "button"; b.textContent = a.label;
    b.addEventListener("click", () => act(a)); return b;
  }));
}
function act(a) {
  const expected = CAT.steps[at];
  if (a.kind === "error") { feedback.textContent = TX.danger(CAT.errors.find((e) => e.id === a.id).why[LANG]); return; }
  if (a.id !== expected.id) { feedback.textContent = TX.notYet(expected.short[LANG]); return; }
  feedback.textContent = TX.stepOk(strip(expected.label[LANG]));
  at++;
  drawStep(at);
  renderDo();
}
function restart() { at = 0; drawStep(0); feedback.textContent = ""; buttons.restart.hidden = true; renderDo(); }
// ---------------------------------------------------------------- S'entraîner
const pool = { 1: [], 2: [], 3: [] };
CAT.situations.forEach((s) => pool[s.level].push(s));
const PLAN = [1, 1, 1, 1, 2, 2, 2, 3, 3, 3];
let list = [], qi = 0, good = 0, answered = false;
function label(s, o) {
  if (s.kind === "procede") return TX.procs[o];
  if (s.kind === "erreur") return CAT.errors.find((e) => e.id === o).why[LANG];
  return stepOf(o).short[LANG];
}
function ask(s) {
  if (s.kind === "procede") return TX.ask.procede(s.filler, s.parts_melt, s.capillary);
  if (s.kind === "erreur") return TX.ask.erreur(CAT.errors.find((e) => e.id === s.error).action[LANG]);
  return TX.ask[s.kind](stepOf(s.from).short[LANG]);
}
function qshow() {
  answered = false;
  const s = list[qi];
  drawStep(s.kind === "procede" ? (s.capillary ? 7 : 0) : s.kind === "erreur" ? 0 : CAT.steps.findIndex((x) => x.id === s.from) + 1);
  prompt.textContent = ask(s);
  optionsBox.replaceChildren(...s.options.slice().sort(() => Math.random() - 0.5).map((o) => {
    const b = document.createElement("button"); b.type = "button"; b.textContent = label(s, o); b._o = o;
    b.addEventListener("click", () => answer(o)); return b;
  }));
  feedback.textContent = "";
  buttons.again.disabled = true;
  scoreEl.textContent = TX.score(good, qi) + " · " + TX.step(qi + 1, list.length);
}
function answer(o) {
  if (answered) return;
  answered = true;
  const s = list[qi], ok = same(o, s.answer);
  if (ok) good++;
  for (const b of optionsBox.children) {
    b.disabled = true;
    if (same(b._o, s.answer)) { b.dataset.state = "right"; b.prepend("✓ "); b.setAttribute("aria-label", TX.marks.right + " : " + b.textContent.slice(2)); }
    else if (same(b._o, o)) { b.dataset.state = "wrong"; b.prepend("✗ "); b.setAttribute("aria-label", TX.marks.wrong + " : " + b.textContent.slice(2)); }
  }
  const why = s.kind === "procede" ? TX.procWhy : s.kind === "erreur" ? "" : strip(stepOf(s.answer).label[LANG]);
  const last = qi === list.length - 1;
  feedback.textContent = [ok ? TX.right : TX.wrong(label(s, s.answer)), why, last ? TX.seriesDone(good, list.length) : ""].filter(Boolean).join(" ");
  buttons.again.disabled = last;
  scoreEl.textContent = TX.score(good, qi + 1) + " · " + TX.step(qi + 1, list.length);
}
function start() {
  list = [];
  for (const level of PLAN) {
    const kinds = {};
    pool[level].forEach((x) => (kinds[x.kind] ||= []).push(x));
    const groups = Object.values(kinds);
    let s;
    for (let i = 0; i < 40; i++) { const g = groups[Math.floor(Math.random() * groups.length)]; s = g[Math.floor(Math.random() * g.length)]; if (!list.includes(s)) break; }
    list.push(s);
  }
  qi = 0; good = 0; qshow();
}
buttons.again.addEventListener("click", () => { if (qi < list.length - 1) { qi++; qshow(); } });
buttons.series.addEventListener("click", start);
buttons.restart.addEventListener("click", restart);
function setMode(m) {
  buttons.do.setAttribute("aria-pressed", m === "do");
  buttons.quiz.setAttribute("aria-pressed", m === "quiz");
  doBox.hidden = m !== "do"; quizBox.hidden = m !== "quiz";
  feedback.textContent = ""; scoreEl.textContent = "";
  if (m === "do") restart(); else start();
}
buttons.do.addEventListener("click", () => setMode("do"));
buttons.quiz.addEventListener("click", () => setMode("quiz"));
for (const b of scope.querySelectorAll(".mv-controls button")) b.disabled = false;
buttons.restart.hidden = true;
const run = () => {};
window.__br = { setMode, answer: (i) => answer(list[qi].options[i]), current: () => list[qi], act: (id) => act(stepOf(id) ? { kind: "step", id } : { kind: "error", id }), state: () => ({ at }) };
setMode("do");
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);

})();
