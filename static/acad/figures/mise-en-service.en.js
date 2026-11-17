(() => {
const MS = (() => {
// Situations de la figure `mise-en-service` (Partie 4, module 5, « Mise en service et hors service » ; Q94, Q95).
// Procédures recopiées mot pour mot de la section (fr et en) ; erreurs dangereuses, couleurs des tuyaux et tenue du
// chalumeau tirées du même texte. La procédure n'a que 10 étapes : pas de seuil de 1 000 situations. Rien en base (Q73).

const L = (fr, en) => ({ fr, en });

const PROCEDURES = {
  start: [
    { id: "raccorder", label: L("Vis de détente desserrées, raccorder les manodétendeurs.", "With the regulating screws backed off, connect the regulators."), short: L("Raccorder, vis desserrées", "Connect, screws backed off") },
    { id: "ouvrir-bouteilles", label: L("Ouvrir lentement les robinets des bouteilles de gaz.", "Open the cylinder valves slowly."), short: L("Ouvrir lentement les bouteilles", "Open the cylinders slowly") },
    { id: "regler-oxygene", label: L("Régler la pression de service de l'oxygène.", "Set the oxygen working pressure."), short: L("Régler l'oxygène", "Set the oxygen") },
    { id: "regler-acetylene", label: L("Régler la pression de service de l'acétylène, selon les prescriptions, sans dépasser les valeurs limites.", "Set the acetylene working pressure, as prescribed, without exceeding the limit values."), short: L("Régler l'acétylène", "Set the acetylene") },
    { id: "purger", label: L("Purger séparément chaque tuyau, à l'air libre et loin de toute flamme.", "Purge each hose separately, in the open air and away from any flame."), short: L("Purger chaque tuyau", "Purge each hose") },
    { id: "allumer", label: L("Ouvrir le robinet d'acétylène du chalumeau, allumer, puis ouvrir le robinet d'oxygène.", "Open the acetylene valve on the torch, light it, then open the oxygen valve."), short: L("Acétylène, allumer, oxygène", "Acetylene, light, oxygen") },
  ],
  stop: [
    { id: "fermer-acetylene", label: L("Fermer le robinet d'acétylène du chalumeau.", "Close the acetylene valve on the torch."), short: L("Fermer l'acétylène du chalumeau", "Close the torch acetylene") },
    { id: "fermer-oxygene", label: L("Fermer le robinet d'oxygène du chalumeau.", "Close the oxygen valve on the torch."), short: L("Fermer l'oxygène du chalumeau", "Close the torch oxygen") },
    { id: "fermer-bouteilles", label: L("Fermer les robinets des bouteilles.", "Close the cylinder valves."), short: L("Fermer les bouteilles", "Close the cylinders") },
    { id: "purger-desserrer", label: L("Purger les tuyaux, puis desserrer les vis de détente.", "Purge the hoses, then back off the regulating screws."), short: L("Purger, desserrer les vis", "Purge, back off the screws") },
  ],
};

// Erreurs dangereuses : chacune vise une étape de la procédure et dit, d'après la section, ce qui ne va pas.
const ERRORS = [
  { id: "vis-serree", step: "raccorder", action: L("Raccorder et ouvrir avec la vis de détente serrée", "Connect and open with the regulating screw turned in"), why: L("La vis doit être desserrée : sinon la pression de la bouteille passe d'un coup dans le détendeur et le tuyau.", "The screw must be backed off: otherwise the cylinder pressure rushes into the regulator and the hose.") },
  { id: "ouverture-brusque", step: "ouvrir-bouteilles", action: L("Ouvrir le robinet de la bouteille d'un coup", "Open the cylinder valve all at once"), why: L("Le robinet s'ouvre lentement, pour que le détendeur monte en pression sans choc.", "The valve is opened slowly, so the regulator takes the pressure without a shock.") },
  { id: "acetylene-trop-haut", step: "regler-acetylene", action: L("Régler l'acétylène au-delà de la valeur limite", "Set the acetylene above the limit value"), why: L("L'acétylène se règle selon les prescriptions, sans dépasser les valeurs limites.", "Acetylene is set as prescribed, without exceeding the limit values.") },
  { id: "purge-flamme", step: "purger", action: L("Purger les tuyaux près d'une flamme", "Purge the hoses near a flame"), why: L("La purge se fait à l'air libre et loin de toute flamme.", "Purging is done in the open air, away from any flame.") },
  { id: "purge-ensemble", step: "purger", action: L("Purger les deux tuyaux en même temps", "Purge both hoses at the same time"), why: L("Chaque tuyau se purge séparément.", "Each hose is purged separately.") },
  { id: "oxygene-premier", step: "allumer", action: L("Ouvrir l'oxygène du chalumeau avant d'allumer", "Open the torch oxygen before lighting"), why: L("On ouvre l'acétylène, on allume, puis seulement on ouvre l'oxygène.", "Open the acetylene, light it, and only then open the oxygen.") },
  { id: "arret-oxygene", step: "fermer-acetylene", action: L("À l'arrêt, fermer d'abord l'oxygène du chalumeau", "When shutting down, close the torch oxygen first"), why: L("À l'arrêt, on ferme d'abord l'acétylène du chalumeau, puis l'oxygène.", "When shutting down, close the torch acetylene first, then the oxygen.") },
  { id: "bouteilles-ouvertes", step: "fermer-bouteilles", action: L("Laisser les bouteilles ouvertes en fin de travail", "Leave the cylinders open after work"), why: L("Les robinets des bouteilles se ferment avant de purger les tuyaux.", "The cylinder valves are closed before purging the hoses.") },
  { id: "vis-restees", step: "purger-desserrer", action: L("Ranger le poste sans desserrer les vis de détente", "Put the set away without backing off the screws"), why: L("Après la purge, les vis de détente sont desserrées, prêtes pour la prochaine mise en service.", "After purging, the regulating screws are backed off, ready for the next start-up.") },
  { id: "tuyau-inverse", step: "raccorder", action: L("Raccorder le tuyau rouge sur l'oxygène", "Connect the red hose to the oxygen"), why: L("Le tuyau bleu est celui de l'oxygène, le rouge celui de l'acétylène.", "The blue hose is for oxygen, the red one for acetylene.") },
];

const FACTS = { hoses: { oxygene: "bleu", acetylene: "rouge" }, angles: { soudage: "50-70", inverse: "45", apport: "45" } };

const rotate = (list, n) => [...list.slice(n % list.length), ...list.slice(0, n % list.length)];

function buildStartup() {
  const out = [];
  const push = (kind, level, rest) => out.push({ key: `${kind}|${JSON.stringify(rest)}`, level, kind, ...rest });
  for (const [procedure, list] of Object.entries(PROCEDURES)) {
    const ids = list.map((s) => s.id);
    ids.forEach((id, i) => {
      const others = (exclude) => rotate(ids.filter((x) => !exclude.includes(x)), i).slice(0, 3);
      if (i < ids.length - 1) push("suivante", 1, { procedure, from: id, answer: ids[i + 1], options: [ids[i + 1], ...others([id, ids[i + 1]])].sort() });
      if (i > 0) push("precedente", 2, { procedure, from: id, answer: ids[i - 1], options: [ids[i - 1], ...others([id, ids[i - 1]])].sort() });
    });
  }
  ERRORS.forEach((e, i) => {
    const others = rotate(ERRORS.filter((x) => x.id !== e.id), i).slice(0, 3).map((x) => x.id);
    push("erreur", 3, { error: e.id, answer: e.id, options: [e.id, ...others].sort() });
  });
  for (const [gas, colour] of Object.entries(FACTS.hoses)) {
    push("tuyau", 1, { gas, answer: colour, options: ["bleu", "rouge", "vert", "jaune"] });
  }
  for (const [kind, angle] of Object.entries(FACTS.angles)) {
    push("tenue", 2, { what: kind, answer: angle, options: ["30", "45", "50-70", "90"] });
  }
  return { procedures: PROCEDURES, errors: ERRORS, facts: FACTS, situations: out };
}

return { PROCEDURES, ERRORS, FACTS, buildStartup };
})();
const LANG = "en";
const TX = {phase:{"start":"Start-up","stop":"Shut-down"},doPrompt:(phase, n, total) => `${phase}: tap the next action (step ${n} of ${total}).`,doneStart:"Set started, flame lit. Now shut it down.",doneStop:"Set shut down: torch closed, cylinders closed, hoses purged, screws backed off.",stepOk:(label) => `Correct: ${label}`,notYet:(label) => `Not yet: the expected step is "${label}"`,danger:(why) => `Action refused, dangerous: ${why}`,ask:{"suivante":(phase, step) => `${phase}: after "${step}", what comes next?`,"precedente":(phase, step) => `${phase}: which step comes just before "${step}"?`,"erreur":(action) => `Why is this a mistake: "${action}"?`,"tuyau":(gas) => `What colour is the ${gas === "oxygene" ? "oxygen" : "acetylene"} hose?`,"tenue":(what) => ({ soudage: "Angle of the torch to the work, in the welding direction?", inverse: "Angle of the torch when welding the other way?", apport: "Angle of the filler rod?" })[what]},colours:{"bleu":"Blue","rouge":"Red","vert":"Green","jaune":"Yellow"},angles:{"30":"About 30°","45":"About 45°","90":"90°","50-70":"50° to 70°"},hoseWhy:"Blue hose for oxygen, red for acetylene.",angleWhy:"Torch at 50° to 70° in the welding direction, about 45° when welding the other way, filler rod at about 45°.",right:"Correct.",wrong:(a) => `No: the right answer is "${a}".`,done:(g, t) => `Series finished: ${g} / ${t}. Start a new series for other situations.`,step:(i, n) => `situation ${i} / ${n}`,score:(g, t) => `Series score: ${g} / ${t}`,marks:{"right":"Right answer","wrong":"Your answer, wrong"}};

const still = matchMedia("(prefers-reduced-motion: reduce)");
const scope = document.querySelector('.live-figure[data-figure="mise-en-service"]') || document;
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

const CAT = MS.buildStartup();
const prompt = scope.querySelector(".rc-prompt");
const quizBox = scope.querySelector(".rc-quiz");
const doBox = scope.querySelector(".ms-do");
const actionsBox = scope.querySelector(".ms-actions");
const optionsBox = scope.querySelector(".rc-options");
const flame = svg.querySelector(".ms-flame");
// Un élément SVG n'a pas de propriété hidden : l'attribut se pose et se retire à la main.
const showFlame = (on) => flame.toggleAttribute("hidden", !on);
const stepOf = (id) => [...CAT.procedures.start, ...CAT.procedures.stop].find((s) => s.id === id);
// Organes allumés à chaque étape.
const PARTS = {
  raccorder: ["vis-oxygene", "vis-acetylene"], "ouvrir-bouteilles": ["bouteille-oxygene", "bouteille-acetylene"],
  "regler-oxygene": ["vis-oxygene"], "regler-acetylene": ["vis-acetylene"], purger: ["chalumeau-oxygene", "chalumeau-acetylene"],
  allumer: ["chalumeau-acetylene", "chalumeau-oxygene"], "fermer-acetylene": ["chalumeau-acetylene"], "fermer-oxygene": ["chalumeau-oxygene"],
  "fermer-bouteilles": ["bouteille-oxygene", "bouteille-acetylene"], "purger-desserrer": ["vis-oxygene", "vis-acetylene"],
};
function light(ids) { for (const g of svg.querySelectorAll(".ms-part")) g.toggleAttribute("data-lit", ids.includes(g.dataset.part)); }
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// ---------------------------------------------------------------- Réaliser
let phase = "start", at = 0;
// Quatre actions à la fois, lisibles sur un téléphone : l'étape attendue, deux autres étapes de la procédure et une
// action dangereuse liée à cette phase.
const pickFrom = (list, n) => list.slice().sort(() => Math.random() - 0.5).slice(0, n);
function actionsFor() {
  const list = CAT.procedures[phase];
  const expected = list[at];
  const others = pickFrom(list.filter((s) => s.id !== expected.id), 2).map((s) => ({ kind: "step", id: s.id, label: s.short[LANG] }));
  const errs = pickFrom(CAT.errors.filter((e) => list.some((s) => s.id === e.step)), 1).map((e) => ({ kind: "error", id: e.id, label: e.action[LANG] }));
  return [{ kind: "step", id: expected.id, label: expected.short[LANG] }, ...others, ...errs].sort(() => Math.random() - 0.5);
}
function renderDo() {
  const list = CAT.procedures[phase];
  if (at >= list.length) {
    prompt.textContent = phase === "start" ? TX.doneStart : TX.doneStop;
    showFlame(phase === "start");
    if (phase === "start") { phase = "stop"; at = 0; setTimeout(renderDo, 900); }
    else { actionsBox.replaceChildren(); buttons.restart.hidden = false; }
    return;
  }
  prompt.textContent = TX.doPrompt(TX.phase[phase], at + 1, list.length);
  actionsBox.replaceChildren(...actionsFor().map((a) => {
    const b = document.createElement("button"); b.type = "button"; b.textContent = a.label;
    b.addEventListener("click", () => act(a)); return b;
  }));
}
function act(a) {
  const list = CAT.procedures[phase];
  const expected = list[at];
  if (a.kind === "error") { feedback.textContent = TX.danger(CAT.errors.find((e) => e.id === a.id).why[LANG]); return; }
  if (a.id !== expected.id) { feedback.textContent = TX.notYet(expected.short[LANG]); return; }
  feedback.textContent = TX.stepOk(expected.label[LANG]);
  light(PARTS[expected.id] || []);
  if (expected.id === "allumer") showFlame(true);
  if (expected.id === "fermer-acetylene") showFlame(false);
  at++;
  renderDo();
}
function restart() { phase = "start"; at = 0; showFlame(false); light([]); feedback.textContent = ""; buttons.restart.hidden = true; renderDo(); }
// ---------------------------------------------------------------- S'entraîner
const pool = { 1: [], 2: [], 3: [] };
CAT.situations.forEach((s) => pool[s.level].push(s));
const PLAN = [1, 1, 1, 1, 2, 2, 2, 3, 3, 3];
let list = [], qi = 0, good = 0, answered = false;
function label(s, o) {
  if (s.kind === "suivante" || s.kind === "precedente") return stepOf(o).short[LANG];
  if (s.kind === "erreur") return CAT.errors.find((e) => e.id === o).why[LANG];
  if (s.kind === "tuyau") return TX.colours[o];
  return TX.angles[o];
}
function ask(s) {
  if (s.kind === "suivante" || s.kind === "precedente") return TX.ask[s.kind](TX.phase[s.procedure], stepOf(s.from).short[LANG]);
  if (s.kind === "erreur") return TX.ask.erreur(CAT.errors.find((e) => e.id === s.error).action[LANG]);
  if (s.kind === "tuyau") return TX.ask.tuyau(s.gas);
  return TX.ask.tenue(s.what);
}
function explain(s) {
  if (s.kind === "suivante" || s.kind === "precedente") return stepOf(s.answer).label[LANG];
  if (s.kind === "tuyau") return TX.hoseWhy;
  if (s.kind === "tenue") return TX.angleWhy;
  return "";
}
function show() {
  answered = false;
  const s = list[qi];
  showFlame(false);
  light(s.kind === "suivante" || s.kind === "precedente" ? PARTS[s.from] || [] : s.kind === "erreur" ? PARTS[CAT.errors.find((e) => e.id === s.error).step] || [] : []);
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
  if (s.kind === "suivante" || s.kind === "precedente") light(PARTS[s.answer] || []);
  const last = qi === list.length - 1;
  feedback.textContent = [ok ? TX.right : TX.wrong(label(s, s.answer)), explain(s), last ? TX.done(good, list.length) : ""].filter(Boolean).join(" ");
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
  qi = 0; good = 0; show();
}
buttons.again.addEventListener("click", () => { if (qi < list.length - 1) { qi++; show(); } });
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
window.__ms = { setMode, answer: (i) => answer(list[qi].options[i]), current: () => list[qi], act: (id) => { const s = stepOf(id); if (s) act({ kind: "step", id }); else act({ kind: "error", id }); }, state: () => ({ phase, at }) };
setMode("do");
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);

})();
