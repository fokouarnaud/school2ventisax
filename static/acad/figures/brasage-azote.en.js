(() => {
const AZ = (() => {
// Situations du mode « S'entraîner » de la figure `brasage-azote` (Partie 4, module 7, « Brasage sous azote » ; Q99).
// Étapes recopiées mot pour mot du mode opératoire (fr et en) ; plages, débit et notions tirés des sections
// « Rappels » et « Mise en œuvre ». Chaque notion porte la phrase source (`source`) qui justifie la bonne réponse,
// vérifiée par courses/tests/test_nitrogen.py. Bonne réponse en premier dans `options`. Rien en base (Q73).

const L = (fr, en) => ({ fr, en });

const STEPS = [
  { id: "preparer", label: L("Préparer et assembler les éléments à braser.", "Prepare and assemble the parts to be brazed."), short: L("Préparer et assembler", "Prepare and assemble") },
  { id: "voies", label: L("Disposer d'une voie d'entrée et de sortie de l'azote sur la maquette à braser.", "Provide a nitrogen inlet and outlet on the assembly."), short: L("Prévoir l'entrée et la sortie d'azote", "Provide nitrogen inlet and outlet") },
  { id: "flexible", label: L("Connecter le flexible de la bouteille d'azote, équipée d'un manodétendeur, à l'entrée prévue sur la maquette.", "Connect the hose from the nitrogen cylinder, fitted with a regulator (<span lang=\"fr\">manodétendeur</span>), to the inlet on the assembly."), short: L("Brancher le flexible d'azote", "Connect the nitrogen hose") },
  { id: "regler-azote", label: L("Régler le manodétendeur à basse pression, entre 0,2 et 0,5 bar, pour obtenir le débit prévu.", "Set the regulator to a low pressure, between 0.2 and 0.5 bar, to obtain the planned flow."), short: L("Régler l'azote à basse pression", "Set the nitrogen to low pressure") },
  { id: "balayer", label: L("Faire passer l'azote dans la tuyauterie avant toute chauffe, le temps de chasser l'air.", "Pass nitrogen through the pipework before any heating, long enough to drive out the air."), short: L("Balayer pour chasser l'air", "Purge to drive out the air") },
  { id: "acetylene", label: L("Ouvrir et régler le manodétendeur de l'acétylène (entre 0,2 et 0,5 bar).", "Open and set the acetylene regulator (between 0.2 and 0.5 bar)."), short: L("Régler l'acétylène", "Set the acetylene") },
  { id: "oxygene", label: L("Ouvrir et régler le manodétendeur de l'oxygène (entre 0,5 et 1,5 bar).", "Open and set the oxygen regulator (between 0.5 and 1.5 bar)."), short: L("Régler l'oxygène", "Set the oxygen") },
  { id: "allumer", label: L("Allumer le chalumeau et régler la flamme.", "Light the torch and adjust the flame."), short: L("Allumer, régler la flamme", "Light, adjust the flame") },
  { id: "braser", label: L("Braser.", "Braze."), short: L("Braser", "Braze") },
  { id: "refroidir", label: L("Maintenir le balayage d'azote pendant le refroidissement du joint.", "Keep up the oxygen-free nitrogen purge while the joint cools."), short: L("Maintenir l'azote au refroidissement", "Keep the nitrogen on while cooling") },
];

const RANGES = { azote: [0.2, 0.5], acetylene: [0.2, 0.5], oxygene: [0.5, 1.5] };

const NOTIONS = {
  calamine: {
    level: 1,
    ask: L("Qu'est-ce que la calamine ?", "What is scale?"),
    source: L("La calamine** est une couche d'oxyde produite à la surface des métaux soumis à de hautes températures.", "Scale** (<span lang=\"fr\">calamine</span>) is an oxide layer produced on metals at high temperatures."),
    options: [L("Une couche d'oxyde formée à haute température", "An oxide layer formed at high temperature"), L("Un dépôt de brasure en excès", "A deposit of excess filler"), L("Un résidu de décapant brûlé", "Burnt flux residue"), L("Un alliage d'apport à bas point de fusion", "A low-melting filler alloy")],
  },
  cause: {
    level: 2,
    ask: L("D'où vient la calamine à l'intérieur du tube ?", "Where does the scale inside the tube come from?"),
    source: L("Elle résulte de l'oxydation du métal par l'oxygène présent dans la tuyauterie pendant le brasage.", "It results from oxidation of the metal by the oxygen in the pipe during brazing."),
    options: [L("De l'oxygène présent dans la tuyauterie pendant le brasage", "From the oxygen in the pipe during brazing"), L("De l'azote introduit dans le tube", "From the nitrogen let into the tube"), L("De l'acétylène de la flamme", "From the acetylene of the flame"), L("De l'eau de lavage du décapant", "From the water used to wash off the flux")],
  },
  flux: {
    level: 1,
    ask: L("Quel est le rôle du flux décapant ?", "What does the flux do?"),
    source: L("Les flux décapants** sont des produits qui ont pour rôle de former pendant le brasage une couche continue sur la surface du joint, afin d'éviter l'oxydation.", "Fluxes** form a continuous layer on the joint surface during brazing, to prevent oxidation."),
    options: [L("Former une couche sur le joint pour éviter l'oxydation", "Form a layer on the joint to prevent oxidation"), L("Abaisser le point de fusion du cuivre", "Lower the melting point of copper"), L("Remplacer le balayage d'azote", "Replace the nitrogen purge"), L("Refroidir le joint après le brasage", "Cool the joint after brazing")],
  },
  brasures: {
    level: 3,
    ask: L("Quelles brasures utilise l'industrie frigorifique ?", "Which fillers does refrigeration use?"),
    source: L("On distingue dans l'industrie frigorifique la brasure à l'argent, la brasure au phosphore (cuivre-phosphore) et la brasure des métaux blancs, ou brasure tendre (étain-argent, étain-plomb, etc.).", "Refrigeration uses silver brazing alloy, copper-phosphorus alloy and soft solder (tin-silver, tin-lead, etc.)."),
    options: [L("À l'argent, cuivre-phosphore, métaux blancs (étain)", "Silver, copper-phosphorus, soft solder (tin)"), L("Acier, fonte, aluminium", "Steel, cast iron, aluminium"), L("Cuivre pur seulement", "Pure copper only"), L("Zinc et magnésium", "Zinc and magnesium")],
  },
  debit: {
    level: 2,
    ask: L("Comment se fait le balayage d'azote ?", "How is the nitrogen purge done?"),
    source: L("Il s'agit d'un balayage à faible débit, environ 6 l/min, et non d'une mise en pression.", "This is a low-flow purge, about 6 l/min, not a pressurisation."),
    options: [L("À faible débit, environ 6 l/min, sans mise en pression", "At low flow, about 6 l/min, without pressurising"), L("En mettant le tube sous 10 bar", "By putting the tube under 10 bar"), L("À plein débit de la bouteille", "At the cylinder's full flow"), L("Par impulsions d'azote entre deux chauffes", "In bursts of nitrogen between heatings")],
  },
  ouvert: {
    level: 1,
    ask: L("Pendant le balayage, l'autre extrémité du tube est :", "During the purge, the other end of the tube is:"),
    source: L("L'azote est introduit d'un côté du tube tandis que l'autre côté reste ouvert : il suffit d'un filet d'azote pour que l'oxygène du tuyau à souder soit chassé, empêchant ainsi la calamine de se former.", "Nitrogen enters at one end of the tube while the other end stays open: a trickle of nitrogen is enough to drive out the oxygen in the pipe, so preventing scale."),
    options: [L("Ouverte, pour que l'air soit chassé", "Open, so the air is driven out"), L("Bouchée, pour garder la pression", "Plugged, to keep the pressure"), L("Reliée à la pompe à vide", "Connected to the vacuum pump"), L("Reliée à la bouteille d'oxygène", "Connected to the oxygen cylinder")],
  },
  quand: {
    level: 2,
    ask: L("Quand l'azote doit-il circuler ?", "When must the nitrogen flow?"),
    source: L("Maintenir le balayage d'azote pendant le refroidissement du joint.", "Keep up the oxygen-free nitrogen purge while the joint cools."),
    options: [L("Avant toute chauffe et jusqu'au refroidissement du joint", "Before any heating and until the joint has cooled"), L("Seulement pendant la chauffe", "Only while heating"), L("Seulement après le brasage", "Only after brazing"), L("Seulement avant d'allumer le chalumeau", "Only before lighting the torch")],
  },
  pourquoi: {
    level: 3,
    ask: L("Pourquoi éviter la calamine dans une tuyauterie frigorifique ?", "Why avoid scale in refrigeration pipework?"),
    source: L("La calamine est préjudiciable au bon fonctionnement de certains éléments comme les détendeurs mécaniques et électroniques.", "Scale harms certain components such as mechanical and electronic expansion valves."),
    options: [L("Elle nuit aux détendeurs mécaniques et électroniques", "It harms mechanical and electronic expansion valves"), L("Elle colore le tube", "It discolours the tube"), L("Elle empêche la brasure de fondre", "It stops the filler melting"), L("Elle augmente la pression de l'azote", "It raises the nitrogen pressure")],
  },
  bouteilles: {
    level: 3,
    ask: L("Comment placer les bouteilles d'azote, d'oxygène et d'acétylène ?", "How should the nitrogen, oxygen and acetylene cylinders be placed?"),
    source: L("Bien enchaîner les bouteilles sur un poteau ou sur un support solidement fixé au sol, et à l'abri du soleil.", "Chain cylinders to a post or to a support firmly fixed to the floor, out of the sun."),
    options: [L("Enchaînées à un support fixé au sol, à l'abri du soleil", "Chained to a support fixed to the floor, out of the sun"), L("Couchées au sol près du poste", "Lying on the floor near the station"), L("Au soleil pour garder la pression", "In the sun to keep the pressure"), L("Libres, pour pouvoir les déplacer vite", "Free-standing, to move them quickly")],
  },
};

const rotate = (list, n) => [...list.slice(n % list.length), ...list.slice(0, n % list.length)];

function buildNitrogen() {
  const out = [];
  const push = (kind, level, rest) => out.push({ key: `${kind}|${JSON.stringify(rest)}`, level, kind, ...rest });
  const ids = STEPS.map((s) => s.id);
  ids.forEach((id, i) => {
    const others = (exclude) => rotate(ids.filter((x) => !exclude.includes(x)), i).slice(0, 3);
    if (i < ids.length - 1) push("suivante", 1, { from: id, answer: ids[i + 1], options: [ids[i + 1], ...others([id, ids[i + 1]])].sort() });
    if (i > 0) push("precedente", 2, { from: id, answer: ids[i - 1], options: [ids[i - 1], ...others([id, ids[i - 1]])].sort() });
  });
  for (const gas of Object.keys(RANGES)) push("reglage", 2, { gas, answer: RANGES[gas].join("-"), options: ["0.2-0.5", "0.5-1.5", "1.5-3", "4-10"] });
  for (const [which, n] of Object.entries(NOTIONS)) push("notion", n.level, { which, answer: 0, options: [0, 1, 2, 3] });
  return { steps: STEPS, ranges: RANGES, notions: NOTIONS, situations: out };
}

return { STEPS, RANGES, NOTIONS, buildNitrogen };
})();
const FIG = {"lang":"en","model":{"purgeSeconds":3,"heatRate":260,"coolRate":130,"brazeTemp":700,"oxideFrom":200,"oxideRate":26,"safeTemp":150}};
const TX = {buttons:{"n2On":"Open the nitrogen","n2Off":"Shut the nitrogen","lightOn":"Light and braze","lightOff":"Put out the torch","check":"Cut the joint and check","again":"Start again"},read:(n2, temp, oxide) => `nitrogen ${n2 ? "open" : "shut"} · joint ${Math.round(temp)} °C · scale ${Math.round(oxide)} %`,score:(good, total) => `Score: ${good} / ${total}`,feedback:{start:"Set up the purge, then braze. Watch the window on the inside of the tube.",purging:"Nitrogen open: the air is being driven out of the tube. Let it flow before heating.",tooEarly:"The nitrogen has not yet driven out the air: the copper is starting to oxidise. You should have waited before heating.",noN2:"You are heating without nitrogen: scale is forming inside the tube.",brazing:"Brazing under a nitrogen purge. Put out the torch once the joint is made, without shutting the nitrogen.",cooling:"Torch out. Keep the nitrogen open until the joint has cooled.",cutHot:"Nitrogen shut while the joint is still hot: scale forms as it cools.",notCool:"The joint is still too hot to check.",notBrazed:"Braze the joint before checking it.",good:"Clean joint: the purge was started before heating and kept up until the joint cooled.",bad:(o) => `Scale inside the tube (${Math.round(o)} %): this joint would shed particles into the circuit. Start again.`}};
const PT = {ask:{"suivante":(s) => `Procedure: after "${s}", what comes next?`,"precedente":(s) => `Procedure: which step comes just before "${s}"?`,"reglage":(g) => `Between which pressures is the ${{ azote: "nitrogen", acetylene: "acetylene", oxygene: "oxygen" }[g]} regulator set?`},bars:{"0.2-0.5":"0.2 to 0.5 bar","0.5-1.5":"0.5 to 1.5 bar","1.5-3":"1.5 to 3 bar","4-10":"4 to 10 bar"},right:"Correct.",wrong:(a) => `No: the right answer is "${a}".`,done:(g, t) => `Series finished: ${g} / ${t}. Start a new series for other situations.`,step:(i, n) => `situation ${i} / ${n}`,score:(g, t) => `Series score: ${g} / ${t}`,marks:{"right":"Right answer","wrong":"Your answer, wrong"}};

const still = matchMedia("(prefers-reduced-motion: reduce)");
const M = FIG.model, T = TX;
const scope = document.querySelector('.live-figure[data-figure="brasage-azote"]') || document;
const root = scope.querySelector(".iso-plate");
const stage = root.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const readout = root.querySelector("[data-readout]");
const feedback = scope.querySelector(".mv-feedback");
const scoreEl = scope.querySelector(".mv-score");
const buttons = Object.fromEntries([...scope.querySelectorAll(".mv-controls button")].map((b) => [b.dataset.act, b]));
const tap = svg.querySelector(".bz-tap"), torchG = svg.querySelector(".bz-torch"), oxideEl = svg.querySelector(".bz-oxide"), hose = svg.querySelector(".bz-hose"), gas = svg.querySelector(".bz-gas");
let n2 = false, lit = false, purge = 0, temp = 25, oxide = 0, brazed = false, done = false, good = 0, total = 0, warned = false, frame = 0, last = 0, visible = false;
function reset() {
  n2 = false; lit = false; purge = 0; temp = 25; oxide = 0; brazed = false; done = false; warned = false;
  feedback.textContent = T.feedback.start;
  sync(); run();
}
function sync() {
  buttons.n2.textContent = n2 ? T.buttons.n2Off : T.buttons.n2On;
  buttons.n2.setAttribute("aria-pressed", n2 ? "true" : "false");
  buttons.torch.textContent = lit ? T.buttons.lightOff : T.buttons.lightOn;
  buttons.torch.setAttribute("aria-pressed", lit ? "true" : "false");
  buttons.check.disabled = done;
  scoreEl.textContent = T.score(good, total);
  tap.toggleAttribute("data-closed", !n2);
  torchG.toggleAttribute("data-off", !lit);
  hose.toggleAttribute("data-live", n2);
  gas.toggleAttribute("data-live", n2);
}
function toggleN2() {
  if (done) return;
  n2 = !n2;
  if (n2) feedback.textContent = T.feedback.purging;
  else { purge = 0; if (temp > M.oxideFrom) feedback.textContent = T.feedback.cutHot; }
  sync(); run();
}
function toggleTorch() {
  if (done) return;
  lit = !lit;
  if (lit) {
    if (!n2) feedback.textContent = T.feedback.noN2;
    else if (purge < M.purgeSeconds) feedback.textContent = T.feedback.tooEarly;
    else feedback.textContent = T.feedback.brazing;
  } else if (temp >= M.brazeTemp * 0.95) { brazed = true; feedback.textContent = T.feedback.cooling; }
  sync(); run();
}
function check() {
  if (done) return;
  if (!brazed) { feedback.textContent = T.feedback.notBrazed; return; }
  if (temp > M.safeTemp || lit) { feedback.textContent = T.feedback.notCool; return; }
  done = true; total++;
  if (oxide < 4) { good++; feedback.textContent = T.feedback.good; } else feedback.textContent = T.feedback.bad(oxide);
  sync();
}
function step(dt) {
  if (n2) purge += dt;
  temp = lit ? Math.min(M.brazeTemp, temp + M.heatRate * dt) : Math.max(25, temp - M.coolRate * dt);
  if (temp > M.oxideFrom) {
    const shielded = n2 && purge >= M.purgeSeconds;
    if (!shielded) oxide = Math.min(100, oxide + M.oxideRate * dt);
  }
  if (lit && temp >= M.brazeTemp) brazed = true;
}
function draw() {
  oxideEl.style.opacity = (oxide / 100 * 0.95).toFixed(3);
  readout.textContent = T.read(n2, temp, oxide);
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60; last = now;
  step(still.matches ? dt * 4 : dt);
  draw();
  const moving = !done && (n2 || lit || temp > 26);
  frame = visible && moving ? requestAnimationFrame(tick) : 0;
}
function run() { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } }
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
buttons.n2.addEventListener("click", toggleN2);
buttons.torch.addEventListener("click", toggleTorch);
buttons.check.addEventListener("click", check);
buttons.again.addEventListener("click", reset);
// ---------------------------------------------------------------- S'entraîner (Q99)
const PX = PT, CAT = AZ.buildNitrogen(), LANG = FIG.lang;
const brazeBox = scope.querySelector(".bz-braze"), quizBox = scope.querySelector(".bz-quiz");
const promptEl = scope.querySelector(".rc-prompt");
// Les réponses vont dans la liste du mode « S'entraîner », jamais dans les commandes du mode « Braser ».
const optionsBox = scope.querySelector(".bz-quiz .rc-options");
const qpool = { 1: [], 2: [], 3: [] };
CAT.situations.forEach((s) => qpool[s.level].push(s));
const PLAN = [1, 1, 1, 1, 2, 2, 2, 3, 3, 3];
let qlist = [], qi = 0, qgood = 0, qanswered = false;
const same = (x, y) => JSON.stringify(x) === JSON.stringify(y);
const strip = (s) => s.replace(/<[^>]+>/g, "");
const stepOf = (id) => CAT.steps.find((s) => s.id === id);
function qlabel(s, opt) {
  if (s.kind === "reglage") return PX.bars[opt];
  if (s.kind === "notion") return CAT.notions[s.which].options[opt][LANG];
  return stepOf(opt).short[LANG];
}
function qask(s) {
  if (s.kind === "reglage") return PX.ask.reglage(s.gas);
  if (s.kind === "notion") return CAT.notions[s.which].ask[LANG];
  return PX.ask[s.kind](stepOf(s.from).short[LANG]);
}
function qshow() {
  qanswered = false;
  const s = qlist[qi];
  promptEl.textContent = qask(s);
  optionsBox.replaceChildren(...s.options.slice().sort(() => Math.random() - 0.5).map((opt) => {
    const b = document.createElement("button"); b.type = "button"; b.textContent = qlabel(s, opt); b._o = opt;
    b.addEventListener("click", () => qanswer(opt)); return b;
  }));
  feedback.textContent = "";
  buttons.next.disabled = true;
  scoreEl.textContent = PX.score(qgood, qi) + " · " + PX.step(qi + 1, qlist.length);
}
function qanswer(opt) {
  if (qanswered) return;
  qanswered = true;
  const s = qlist[qi], ok = same(opt, s.answer);
  if (ok) qgood++;
  for (const b of optionsBox.children) {
    b.disabled = true;
    if (same(b._o, s.answer)) { b.dataset.state = "right"; b.prepend("✓ "); b.setAttribute("aria-label", PX.marks.right + " : " + b.textContent.slice(2)); }
    else if (same(b._o, opt)) { b.dataset.state = "wrong"; b.prepend("✗ "); b.setAttribute("aria-label", PX.marks.wrong + " : " + b.textContent.slice(2)); }
  }
  const why = s.kind === "notion" ? strip(CAT.notions[s.which].source[LANG]).replaceAll("*", "") : s.kind === "reglage" ? "" : strip(stepOf(s.answer).label[LANG]);
  const last = qi === qlist.length - 1;
  feedback.textContent = [ok ? PX.right : PX.wrong(qlabel(s, s.answer)), why, last ? PX.done(qgood, qlist.length) : ""].filter(Boolean).join(" ");
  buttons.next.disabled = last;
  scoreEl.textContent = PX.score(qgood, qi + 1) + " · " + PX.step(qi + 1, qlist.length);
}
function qstart() {
  qlist = [];
  for (const level of PLAN) {
    const kinds = {};
    qpool[level].forEach((x) => (kinds[x.kind] ||= []).push(x));
    const groups = Object.values(kinds);
    let s;
    for (let i = 0; i < 40; i++) { const g = groups[Math.floor(Math.random() * groups.length)]; s = g[Math.floor(Math.random() * g.length)]; if (!qlist.includes(s)) break; }
    qlist.push(s);
  }
  qi = 0; qgood = 0; qshow();
}
buttons.next.addEventListener("click", () => { if (qi < qlist.length - 1) { qi++; qshow(); } });
buttons.series.addEventListener("click", qstart);
function setMode(m) {
  buttons.braze.setAttribute("aria-pressed", m === "braze");
  buttons.practice.setAttribute("aria-pressed", m === "practice");
  brazeBox.hidden = m !== "braze"; quizBox.hidden = m !== "practice";
  promptEl.textContent = "";
  reset();
  if (m === "practice") qstart();
}
buttons.braze.addEventListener("click", () => setMode("braze"));
buttons.practice.addEventListener("click", () => setMode("practice"));
window.__bz = { reset, toggleN2, toggleTorch, check, setMode, answer: (i) => qanswer(qlist[qi].options[i]), current: () => qlist[qi], state: () => ({ n2, lit, purge, temp, oxide, brazed, done, good, total }) };
setMode("braze");
draw();

})();
