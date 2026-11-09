(() => {
const FIG = {"P":{"origin":[310.07357447781146,320.0033786719489],"scale":1.2201381598792598,"azimuth":28,"elevation":38},"F":{"o":[0,18,38],"a":[0,1,0],"u":[1,0,0],"v":[0,0,1]},"markS":118,"dial":{"x":-38.8,"y":-176,"z":98,"r":13,"max":8},"rec":{"x":-38.8,"y0":-48,"y1":-154,"z0":82,"z1":114,"max":8},"plungerMove":-2,"flagMove":2.4,"btnMove":-1,"model":{"ilr":6,"half":0.6,"rate":3.2,"halfRate":0.45,"halfTop":0.9,"delay":1,"slow":4,"window":4,"trip":{"k2fail":5,"k2rev":2.4}}};
const TX = {dec:",",modes:{"pw":"Fractionné (K1 puis K2)","dol":"Direct (comparaison)","k2fail":"Erreur : K2 ne colle pas","k2rev":"Erreur : K2 câblé à l'envers"},steps:{"t0":"arrêt","t1":"1er temps : K1","t2":"2e temps : K1 + K2","dol":"direct : K1 + K2","rev":"K2 à l'envers","trip":"déclenché"},readOff:(mode) => `arrêt · ${mode}`,readRun:(s) => `${s.step} · t = ${s.t} s · I = ${s.i} × In${s.extra}`,perWinding:(a, b) => ` (bobinage 1 : ${a} · bobinage 2 : ${b})`,peaks:(p1, p2) => `Pics relevés : ${p1} × In${p2 ? ` puis ${p2} × In` : ""}.`,feedback:{idle:"Appuyez sur « Marche S1 » : K1 se ferme, la temporisation K1T démarre. L'enregistreur garde le tracé précédent en pâle pour comparer.",pw:(p) => `Démarrage fractionné réussi. ${p} Le premier bobinage limite le premier appel ; K2 arrive après 1 s, sur un moteur déjà lancé. En régime, chaque bobinage porte la moitié du courant.`,dol:(p) => `Démarrage direct : les deux bobinages ensemble. ${p} C'est ce gros appel unique que le démarrage fractionné partage en deux marches.`,k2fail:"K2 n'est jamais alimenté : le moteur tourne sur le seul enroulement de démarrage. Ce bobinage, prévu pour la moitié du courant, en porte le double : il chauffe et F1 déclenche. Fonctionner sur le 1er temps seul endommage le moteur.",k2rev:"Le second bobinage est câblé dans l'autre ordre des phases : il crée un champ qui tourne en sens contraire. Le moteur freine, le courant reste proche du courant à rotor bloqué et le relais thermique déclenche. Les deux départs doivent garder le même ordre des phases.",stopped:"Arrêt : K1 et K2 retombent."}};

const still = matchMedia("(prefers-reduced-motion: reduce)");
const C = FIG, T = TX, P = C.P, M = C.model;
const scope = document.querySelector('.live-figure[data-figure="fractionne"]') || document;
const root = scope.querySelector(".iso-plate");
const stage = root.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const readout = root.querySelector("[data-readout]");
const feedback = scope.querySelector(".pw-feedback");
const buttons = Object.fromEntries([...scope.querySelectorAll(".pw-controls button")].map((b) => [b.dataset.act, b]));
const needle = svg.querySelector(".pw-needle");
const trace = svg.querySelector(".pw-trace");
const traceOld = svg.querySelector(".pw-trace-old");
const mark = svg.querySelector(".pw-mark");
const led = svg.querySelector(".pw-led .iso-solid");
const plunger = Object.fromEntries([...svg.querySelectorAll(".pw-plunger")].map((g) => [g.dataset.k, g]));
const flags = Object.fromEntries([...svg.querySelectorAll(".pw-flag")].map((g) => [g.dataset.f, g]));
const btns = Object.fromEntries([...svg.querySelectorAll(".pw-btn")].map((g) => [g.dataset.b, g]));
const wires = [...svg.querySelectorAll(".pw-wire")];
const fmt = (v, d = 1) => v.toFixed(d).replace(".", T.dec);
// état du modèle (temps réel du moteur, la figure le montre ralenti M.slow fois)
let mode = "pw", running = false, t = 0, w = 0, current = 0, shown = 0, k1 = 0, k2 = 0, k1At = 0, k2At = 0, tripped = null, flagAt = { F1: 0, F2: 0 };
let samples = [], old = "", peaks = [], angle = 0, press = { S1: 0, S0: 0 }, frame = 0, last = 0, visible = false, done = false;
const full = (x) => 1 + (M.ilr - 1) * (1 - x * x);
function step(dt) {
  if (running) {
    t += dt;
    const k2Due = mode === "dol" || ((mode === "pw" || mode === "k2rev") && t >= M.delay);
    k1 = 1; k2 = k2Due ? 1 : 0;
    if (M.trip[mode] && t >= M.trip[mode]) { running = false; tripped = mode === "k2fail" ? "F1" : "F2"; k1 = 0; k2 = 0; finish(); }
  } else { k1 = 0; k2 = 0; }
  if (k1 && k2 && mode === "k2rev") { w += (-2.2 * w) * dt; current = M.ilr * 1.08; }
  else if (k1 && k2) { w += M.rate * (1.04 - w) * dt; current = full(Math.min(w, 1)); }
  else if (k1) { w += M.rate * M.halfRate * (M.halfTop - w) * dt; current = M.half * full(w); }
  else { w += -4 * w * dt; current = 0; } // compresseur : la contre-pression l'arrête en moins d'une seconde
  if (w < 0) w = 0;
}
function finish() {
  if (done) return; done = true;
  const p = peaks.map((v) => fmt(v));
  if (mode === "pw") feedback.textContent = T.feedback.pw(T.peaks(p[0], p[1]));
  else if (mode === "dol") feedback.textContent = T.feedback.dol(T.peaks(p[0]));
  else feedback.textContent = T.feedback[mode];
  sync();
}
function record() {
  if (t > M.window || (!running && !tripped)) return;
  samples.push([t, current]);
  // pics : maximum local avant une baisse nette, un par fermeture de contacteur
  const n = peaks.length;
  const phaseIdx = mode === "pw" && t >= M.delay ? 1 : 0;
  if (n <= phaseIdx) peaks.push(current); else if (current > peaks[phaseIdx]) peaks[phaseIdx] = current;
}
function recPath(list) {
  const R = C.rec;
  return list.length < 2 ? "" : pathOf(list.map(([s, i]) => iso([R.x, R.y0 - (R.y0 - R.y1) * Math.min(s, M.window) / M.window, R.z0 + (R.z1 - R.z0) * Math.min(i, R.max) / R.max], P)));
}
function start() {
  if (running) return;
  if (samples.length > 1) old = recPath(samples);
  running = true; done = false; t = 0; tripped = null; samples = [[0, 0]]; peaks = []; press.S1 = 1;
  feedback.textContent = T.feedback.idle;
  svg.removeAttribute("data-heat");
  sync(); run();
}
function stop() {
  press.S0 = 1;
  if (running) { running = false; if (!done) { done = true; feedback.textContent = T.feedback.stopped; } }
  sync(); run();
}
function setMode(m) {
  if (running) return;
  mode = m; tripped = null; svg.removeAttribute("data-heat");
  feedback.textContent = T.feedback.idle;
  sync(); run();
}
function sync() {
  for (const m of ["pw", "dol", "k2fail", "k2rev"]) { buttons[m].setAttribute("aria-pressed", mode === m ? "true" : "false"); buttons[m].disabled = running; }
  buttons.start.disabled = running || w > 0.02;
}
function readText() {
  if (tripped) return T.readRun({ step: T.steps.trip + " " + tripped, t: fmt(Math.min(t, 99)), i: fmt(shown), extra: "" });
  if (!running) return T.readOff(T.modes[mode]);
  const step = mode === "dol" ? T.steps.dol : mode === "k2rev" && k2 ? T.steps.rev : k2 ? T.steps.t2 : T.steps.t1;
  const extra = k1 && k2 && mode !== "k2rev" ? T.perWinding(fmt(shown / 2), fmt(shown / 2)) : k1 && !k2 ? T.perWinding(fmt(shown), "0") : "";
  return T.readRun({ step, t: fmt(t), i: fmt(shown), extra });
}
function draw() {
  const F = C.F, s = C.markS;
  const p = (r) => [F.o[0] + r * Math.cos(angle), F.o[1] + s, F.o[2] + r * Math.sin(angle)];
  mark.setAttribute("d", pathOf([iso(p(2.5), P), iso(p(11), P)]));
  const a = Math.PI * (1.25 - 1.5 * Math.min(shown, C.dial.max) / C.dial.max);
  const dp = (r) => iso([C.dial.x, C.dial.y - Math.cos(a) * r, C.dial.z + Math.sin(a) * r], P);
  needle.setAttribute("d", pathOf([dp(-2), dp(C.dial.r - 2)]));
  trace.setAttribute("d", recPath(samples));
  traceOld.setAttribute("d", old);
  plunger.K1.setAttribute("transform", translateAlong(P, [C.plungerMove * k1At, 0, 0]));
  plunger.K2.setAttribute("transform", translateAlong(P, [C.plungerMove * k2At, 0, 0]));
  for (const [kname, v] of [["K1", k1At], ["K2", k2At]]) { const s = plunger[kname].querySelector(".iso-solid"); if (v > 0.5) s.setAttribute("data-lit", ""); else s.removeAttribute("data-lit"); }
  for (const f of ["F1", "F2"]) flags[f].setAttribute("transform", translateAlong(P, [C.flagMove * flagAt[f], 0, 0]));
  for (const b of ["S1", "S0"]) btns[b].setAttribute("transform", translateAlong(P, [C.btnMove * press[b], 0, 0]));
  const timing = running && mode !== "dol" && t < M.delay;
  if (timing) led.setAttribute("data-lit", ""); else led.removeAttribute("data-lit");
  for (const g of wires) {
    const on = g.dataset.w === "1" ? k1 : k2;
    if (on) g.setAttribute("data-live", g.dataset.w === "2" && mode === "k2rev" ? "rev" : "1"); else g.removeAttribute("data-live");
  }
  readout.textContent = readText();
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  const sim = calm ? 0.25 : dt / M.slow;
  // pas fins : le courant varie vite à la fermeture des contacteurs
  const n = calm ? 50 : 4;
  for (let i = 0; i < n; i++) { step(sim / n); if (!calm) record(); }
  if (calm) record();
  const ease = (v, to, tau) => (calm ? to : v + (to - v) * (1 - Math.exp(-dt / tau)));
  shown = ease(shown, current, 0.12);
  k1At = ease(k1At, k1, 0.06); k2At = ease(k2At, k2, 0.06);
  for (const f of ["F1", "F2"]) flagAt[f] = ease(flagAt[f], tripped === f ? 1 : 0, 0.08);
  for (const b of ["S1", "S0"]) press[b] = ease(press[b], 0, 0.12);
  angle += w * dt * 2 * Math.PI * 0.9;
  if ((mode === "k2fail" || mode === "k2rev") && running && t > M.delay * 1.2) svg.setAttribute("data-heat", "1");
  if (running && t > M.window && (mode === "pw" || mode === "dol")) finish();
  if (!running && buttons.start.disabled && w <= 0.02) sync();
  draw();
  const settled = !running && w < 1e-3 && Math.abs(shown) < 1e-3 && k1At < 1e-3 && k2At < 1e-3 && press.S1 < 1e-3 && press.S0 < 1e-3 && Math.abs(flagAt.F1 - (tripped === "F1" ? 1 : 0)) < 1e-3 && Math.abs(flagAt.F2 - (tripped === "F2" ? 1 : 0)) < 1e-3;
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
function run() { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } }
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
for (const m of ["pw", "dol", "k2fail", "k2rev"]) buttons[m].addEventListener("click", () => setMode(m));
buttons.start.addEventListener("click", start);
buttons.stop.addEventListener("click", stop);
window.__pw = { start, stop, setMode, state: () => ({ mode, running, t, w, current, peaks: [...peaks], tripped }) };
feedback.textContent = T.feedback.idle;
sync();
draw();

})();
