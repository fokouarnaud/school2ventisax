(() => {
const CH = (() => {
// Situations du mode « S'entraîner » de la figure `flamme` (Partie 4, module 5, « Chalumeau et flamme » ; Q96).
// Tout est tiré de la section : repères 1 à 9 du chalumeau, aspect des trois flammes, plages de réglage, injecteur et
// lance, décollement, température. Les flammes à reconnaître sont tirées dans le modèle de la figure (bande du mélange
// neutre 0,96 à 1,08 ; décollement au-dessus de 4,5), loin des bords de la bande. Rien en base (Q73).

const L = (fr, en) => ({ fr, en });
const NEUTRAL = [0.96, 1.08];
const LIFT_ABOVE = 4.5;

const MARKS = {
  1: L("Raccord du tuyau de gaz combustible", "Fuel gas hose connection"),
  2: L("Raccord du tuyau d'oxygène", "Oxygen hose connection"),
  3: L("Manche", "Handle"),
  4: L("Robinet de gaz combustible", "Fuel gas valve"),
  5: L("Robinet d'oxygène", "Oxygen valve"),
  6: L("Écrou d'accouplement à serrage manuel", "Hand-tightened coupling nut"),
  7: L("Injecteur", "Injector"),
  8: L("Tube de mélange", "Mixing tube"),
  9: L("Buse de soudage (de chauffage)", "Welding (heating) nozzle"),
};

const ASPECTS = {
  neutral: L("La flamme normalement utilisée pour le soudage. Le dard est de couleur blanc brillant et de forme très nette en sortie de buse", "The flame normally used for welding. The inner cone (<span lang=\"fr\">dard</span>) is brilliant white and very sharp at the nozzle"),
  oxy: L("Excès d'oxygène : le panache et le dard sont raccourcis, la flamme émet un sifflement", "Excess oxygen: envelope and cone are shortened, the flame hisses"),
  carb: L("Excès d'acétylène : le panache et le dard sont allongés, avec des formes irrégulières", "Excess acetylene: envelope and cone are lengthened, with irregular shapes"),
};

const RANGES = { oxygene: [0.5, 1.5], acetylene: [0.2, 0.5] };
const TEMPERATURE = 3100;

// Réponses textuelles (injecteur, lance, décollement) : la bonne d'abord, les leurres ensuite.
const TEXTS = {
  aspire: [
    L("La dépression créée par l'oxygène à la sortie de l'injecteur", "The depression created by the oxygen at the injector outlet"),
    L("La pression plus forte de l'acétylène", "The higher acetylene pressure"),
    L("Une pompe logée dans le manche", "A pump inside the handle"),
    L("Le tirage de la flamme", "The draught of the flame"),
  ],
  lance: [
    L("L'injecteur, la base de mélange, le tube de mélange et la buse", "The injector, mixing base, mixing tube and nozzle"),
    L("Le manche et les deux robinets", "The handle and the two valves"),
    L("Les deux tuyaux et leurs raccords", "The two hoses and their connections"),
    L("Le manodétendeur d'oxygène", "The oxygen regulator"),
  ],
  decolle: [
    L("Réduire l'acétylène jusqu'à ce que la flamme recolle à la buse", "Reduce the acetylene until the flame comes back to the nozzle"),
    L("Ouvrir davantage l'oxygène", "Open the oxygen further"),
    L("Ouvrir davantage l'acétylène", "Open the acetylene further"),
    L("Changer de buse", "Change the nozzle"),
  ],
  recolle: [
    L("Régler l'oxygène jusqu'à obtenir la flamme souhaitée", "Adjust the oxygen until the desired flame is obtained"),
    L("Fermer l'acétylène", "Close the acetylene"),
    L("Rallumer la flamme", "Relight the flame"),
    L("Ouvrir l'acétylène au maximum", "Open the acetylene fully"),
  ],
};

const kindOf = (r) => (r < NEUTRAL[0] ? "carb" : r > NEUTRAL[1] ? "oxy" : "neutral");

function buildTorch() {
  const out = [];
  const push = (kind, level, rest) => out.push({ key: `${kind}|${JSON.stringify(rest)}`, level, kind, ...rest });
  // Flammes à reconnaître : débit d'acétylène sous le seuil de décollement, rapports loin des bords de la bande.
  const ratios = { neutral: [1.01, 1.03], oxy: [1.3, 1.5], carb: [0.6, 0.75] };
  for (let a = 1.5; a <= LIFT_ABOVE + 1e-9; a += 0.5) {
    for (const [kind, list] of Object.entries(ratios)) {
      for (const r of list) {
        const o = Math.round(a * r * 100) / 100;
        if (kindOf(o / a) === kind) push("flamme", 1, { a, o, answer: kind, options: ["neutral", "oxy", "carb"] });
      }
    }
  }
  for (const kind of Object.keys(ASPECTS)) push("aspect", 1, { flame: kind, answer: kind, options: ["neutral", "oxy", "carb"] });
  for (const gas of Object.keys(RANGES)) push("plage", 2, { gas, answer: RANGES[gas].join("-"), options: ["0.2-0.5", "0.5-1.5", "1.5-3", "0-10"] });
  push("temperature", 2, { answer: "3100", options: ["1100", "2000", "3100", "5000"] });
  for (const which of ["decolle", "recolle"]) push("decollement", 2, { which, answer: 0, options: [0, 1, 2, 3] });
  for (const n of Object.keys(MARKS)) {
    const others = Object.keys(MARKS).filter((m) => m !== n);
    const start = Number(n) % others.length;
    push("repere", 3, { mark: n, answer: n, options: [n, ...[...others.slice(start), ...others.slice(0, start)].slice(0, 3)].sort() });
  }
  for (const which of ["aspire", "lance"]) push("injecteur", 3, { which, answer: 0, options: [0, 1, 2, 3] });
  return { marks: MARKS, aspects: ASPECTS, ranges: RANGES, temperature: TEMPERATURE, texts: TEXTS, situations: out };
}

return { MARKS, ASPECTS, RANGES, TEMPERATURE, TEXTS, buildTorch };
})();
const FIG = {"lang":"en","P":{"origin":[322.7967433191474,209.2654746395984],"scale":1.2168355443333043,"azimuth":28,"elevation":34},"model":{"neutral":[0.96,1.08],"acetyleneStart":6,"liftAbove":4.5,"steps":0.5},"tip":{"x":0,"y":-36,"z":44},"knobs":{"a":{"x":0,"y":54,"z":67},"o":{"x":0,"y":88,"z":67}}};
const TX = {read:(a, o, kind, lit) => (lit ? `acetylene ${a} · oxygen ${o} · ${kind}` : "torch out"),kinds:{"off":"out","lifted":"lifted flame","carb":"carburising flame","neutral":"neutral flame","oxy":"oxidising flame"},target:{"neutral":"neutral flame","oxy":"oxidising flame","carb":"carburising flame"},score:(good, total) => `Score: ${good} / ${total}`,feedback:{start:(goal) => `Target: ${goal}. Light the acetylene, then reduce it until the flame comes back.`,lit:"The flame has lifted off: the acetylene flow is too high. Reduce the acetylene until it comes back.",attached:"The flame has come back. Now open the oxygen until the flame is as required.",needLight:"Light the acetylene first.",oxygenFirst:"Oxygen is only opened once the flame is back at the nozzle.",lifted:"The flame is still lifted off: reduce the acetylene.",good:(goal) => `Correct: ${goal}.`,bad:(goal, seen) => `Not yet: you have a ${seen}, the target is a ${goal}.`}};
const PT = {ask:{"flamme":"What flame is this?","aspect":(d) => `Which flame matches this appearance: "${d}"?`,"plage":(g) => `Setting range of the ${g === "oxygene" ? "oxygen" : "acetylene"} regulator?`,"temperature":"Temperature reached at the tip of the inner cone?","decolle":"After lighting, the flame has lifted off the nozzle: what should be done?","recolle":"The flame is back on the nozzle: what comes next?","repere":(n) => `On the torch cross-section, which part carries mark ${n}?`,"aspire":"In an injection torch, what draws in the fuel gas?","lance":"What is called the torch shank?"},flames:{"neutral":"Neutral flame","oxy":"Oxidising flame","carb":"Carburising flame"},bars:{"0.2-0.5":"0.2 to 0.5 bar","0.5-1.5":"0.5 to 1.5 bar","1.5-3":"1.5 to 3 bar","0-10":"0 to 10 bar"},degrees:(v) => `About ${v} °C`,right:"Correct.",wrong:(a) => `No: the right answer is "${a}".`,done:(g, t) => `Series finished: ${g} / ${t}. Start a new series for other situations.`,step:(i, n) => `situation ${i} / ${n}`,score:(g, t) => `Series score: ${g} / ${t}`,marks:{"right":"Right answer","wrong":"Your answer, wrong"}};

const still = matchMedia("(prefers-reduced-motion: reduce)");
const C = FIG, P = C.P, M = C.model, T = TX, GOALS = ["neutral", "oxy", "carb"];
const scope = document.querySelector('.live-figure[data-figure="flamme"]') || document;
const root = scope.querySelector(".iso-plate");
const stage = root.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const readout = root.querySelector("[data-readout]");
const feedback = scope.querySelector(".mv-feedback");
const scoreEl = scope.querySelector(".mv-score");
const buttons = Object.fromEntries([...scope.querySelectorAll(".mv-controls button")].map((b) => [b.dataset.act, b]));
const flame = svg.querySelector(".fl-flame"), plume = svg.querySelector(".fl-plume"), cone = svg.querySelector(".fl-cone");
const knobs = Object.fromEntries([...svg.querySelectorAll(".fl-knob")].map((n) => [n.dataset.knob, n]));
let lit = false, a = 0, o = 0, goal = "neutral", good = 0, total = 0, answered = false, shown = { len: 0, cone: 0, lift: 0 }, frame = 0, last = 0, visible = false, t0 = 0;
const lifted = () => lit && a > M.liftAbove;
const kindOf = (r) => (r < M.neutral[0] ? "carb" : r > M.neutral[1] ? "oxy" : "neutral");
const kind = () => (!lit ? "off" : lifted() ? "lifted" : kindOf(a > 0 ? o / a : 0));
function targetShape() {
  const k = kind();
  if (k === "off") return { len: 0, cone: 0, lift: 0 };
  if (k === "lifted") return { len: 110, cone: 0, lift: 14 };
  const base = 40 + a * 18;
  if (k === "neutral") return { len: base * 1.5, cone: 22, lift: 0 };
  if (k === "oxy") return { len: base * 1.15, cone: 11, lift: 0 };
  return { len: base * 1.75, cone: 40, lift: 0 };
}
function setGoal(id) {
  goal = id; lit = false; a = 0; o = 0; answered = false;
  feedback.textContent = T.feedback.start(T.target[goal]);
  sync(); run();
}
function sync() {
  scoreEl.textContent = T.score(good, total);
  buttons.check.disabled = answered;
  const nb = (v) => (C.lang === "fr" ? v.toFixed(1).replace(".", ",") : v.toFixed(1));
  readout.textContent = T.read(nb(a), nb(o), T.kinds[kind()], lit);
  flame.toggleAttribute("data-off", !lit);
}
function light() {
  if (lit) return;
  lit = true; a = M.acetyleneStart; o = 0;
  feedback.textContent = T.feedback.lit;
  sync(); run();
}
function adjust(which, d) {
  if (!lit) { feedback.textContent = T.feedback.needLight; return; }
  if (which === "o" && lifted()) { feedback.textContent = T.feedback.oxygenFirst; return; }
  const wasLifted = lifted();
  if (which === "a") a = Math.max(1, Math.min(8, a + d)); else o = Math.max(0, Math.min(8, o + d));
  if (wasLifted && !lifted()) feedback.textContent = T.feedback.attached;
  sync(); run();
}
function check() {
  if (!lit) { feedback.textContent = T.feedback.needLight; return; }
  if (lifted()) { feedback.textContent = T.feedback.lifted; return; }
  if (answered) return;
  const k = kind();
  if (k === goal) { answered = true; total++; good++; feedback.textContent = T.feedback.good(T.target[goal]); }
  else { feedback.textContent = T.feedback.bad(T.target[goal], T.target[k]); }
  sync();
}
function nextGoal() { let id = goal; while (id === goal) id = GOALS[Math.floor(Math.random() * GOALS.length)]; setGoal(id); }
function shape(len, width, lift, wob) {
  const tip = C.tip;
  const pt = (s, w) => iso([tip.x + w, tip.y - lift - s, tip.z + (w * 0.15)], P);
  const steps = 18, up = [], down = [];
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const w = width * Math.sin(Math.PI * Math.pow(u, 0.6)) * (1 + wob * Math.sin(u * 22 + t0 * 8) * 0.05);
    up.push(pt(u * len, w)); down.unshift(pt(u * len, -w));
  }
  return pathOf([...up, ...down], true);
}
function draw() {
  const k = kind();
  plume.setAttribute("d", shape(Math.max(shown.len, 1), 7 + shown.len * 0.05, shown.lift, k === "carb" ? 2.4 : 1));
  cone.setAttribute("d", shape(Math.max(shown.cone, 0.5), 2.4, shown.lift, k === "carb" ? 1.6 : 0));
  cone.style.opacity = shown.cone > 1 ? 1 : 0;
  for (const [key, val, ax] of [["a", a, C.knobs.a], ["o", o, C.knobs.o]]) {
    const ang = val * 0.7;
    knobs[key].setAttribute("d", pathOf([iso([ax.x + Math.cos(ang) * 0.8, ax.y + Math.sin(ang) * 0.8, ax.z], P), iso([ax.x + Math.cos(ang) * 4.2, ax.y + Math.sin(ang) * 4.2, ax.z], P)]));
  }
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60; last = now; t0 += dt;
  const calm = still.matches, to = targetShape();
  const ease = (v, g, tau) => (calm ? g : v + (g - v) * (1 - Math.exp(-dt / tau)));
  for (const key of ["len", "cone", "lift"]) shown[key] = ease(shown[key], to[key], 0.12);
  draw();
  const moving = lit || Math.abs(shown.len - to.len) > 0.1;
  frame = visible && moving && !calm ? requestAnimationFrame(tick) : 0;
}
function run() { if (still.matches) { const g = targetShape(); shown = g; draw(); } if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } }
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
buttons.light.addEventListener("click", light);
buttons.aMinus.addEventListener("click", () => adjust("a", -M.steps));
buttons.aPlus.addEventListener("click", () => adjust("a", M.steps));
buttons.oMinus.addEventListener("click", () => adjust("o", -M.steps));
buttons.oPlus.addEventListener("click", () => adjust("o", M.steps));
buttons.check.addEventListener("click", check);
buttons.next.addEventListener("click", nextGoal);
// ---------------------------------------------------------------- S'entraîner (Q96)
const PX = PT, CAT = CH.buildTorch(), LANG = C.lang;
const tuneBox = scope.querySelector(".fl-tune"), quizBox = scope.querySelector(".fl-quiz");
const promptEl = scope.querySelector(".rc-prompt");
// Les réponses vont dans la liste du mode « S'entraîner », jamais dans les commandes du mode « Régler ».
const optionsBox = scope.querySelector(".fl-quiz .rc-options");
const qpool = { 1: [], 2: [], 3: [] };
CAT.situations.forEach((s) => qpool[s.level].push(s));
const PLAN = [1, 1, 1, 1, 2, 2, 2, 3, 3, 3];
let qlist = [], qi = 0, qgood = 0, qanswered = false;
const same = (x, y) => JSON.stringify(x) === JSON.stringify(y);
const strip = (s) => s.replace(/<[^>]+>/g, "");
function qlabel(s, opt) {
  if (s.kind === "flamme" || s.kind === "aspect") return PX.flames[opt];
  if (s.kind === "plage") return PX.bars[opt];
  if (s.kind === "temperature") return PX.degrees(opt);
  if (s.kind === "repere") return CAT.marks[opt][LANG];
  return CAT.texts[s.which][opt][LANG];
}
function qask(s) {
  const A = PX.ask;
  if (s.kind === "aspect") return A.aspect(strip(CAT.aspects[s.flame][LANG]));
  if (s.kind === "plage") return A.plage(s.gas);
  if (s.kind === "repere") return A.repere(s.mark);
  if (s.kind === "decollement" || s.kind === "injecteur") return A[s.which];
  return A[s.kind];
}
function qshow() {
  qanswered = false;
  const s = qlist[qi];
  // Une flamme à reconnaître est allumée avec les débits de la situation ; sinon le chalumeau reste éteint.
  if (s.kind === "flamme") { lit = true; a = s.a; o = s.o; } else { lit = false; a = 0; o = 0; }
  sync(); run();
  readout.textContent = "";
  promptEl.textContent = qask(s);
  optionsBox.replaceChildren(...s.options.slice().sort(() => Math.random() - 0.5).map((opt) => {
    const b = document.createElement("button"); b.type = "button"; b.textContent = qlabel(s, opt); b._o = opt;
    b.addEventListener("click", () => qanswer(opt)); return b;
  }));
  feedback.textContent = "";
  buttons.again.disabled = true;
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
  const why = s.kind === "flamme" || s.kind === "aspect" ? strip(CAT.aspects[s.answer][LANG]) + "." : "";
  const last = qi === qlist.length - 1;
  feedback.textContent = [ok ? PX.right : PX.wrong(qlabel(s, s.answer)), why, last ? PX.done(qgood, qlist.length) : ""].filter(Boolean).join(" ");
  buttons.again.disabled = last;
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
buttons.again.addEventListener("click", () => { if (qi < qlist.length - 1) { qi++; qshow(); } });
buttons.series.addEventListener("click", qstart);
function setMode(m) {
  buttons.tune.setAttribute("aria-pressed", m === "tune");
  buttons.practice.setAttribute("aria-pressed", m === "practice");
  tuneBox.hidden = m !== "tune"; quizBox.hidden = m !== "practice";
  promptEl.textContent = "";
  if (m === "tune") setGoal(GOALS[Math.floor(Math.random() * GOALS.length)]); else qstart();
}
buttons.tune.addEventListener("click", () => setMode("tune"));
buttons.practice.addEventListener("click", () => setMode("practice"));
window.__fl = { setGoal, light, adjust, check, setMode, answer: (i) => qanswer(qlist[qi].options[i]), current: () => qlist[qi], state: () => ({ lit, a, o, kind: kind(), goal, good, total }) };
setMode("tune");
draw();

})();
