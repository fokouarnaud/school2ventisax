(() => {
const FIG = {"lang":"en","P":{"origin":[330.2364317707085,262.7423922695234],"scale":1.1743870336059392,"azimuth":28,"elevation":38},"model":{"atm":1013,"target":1,"floor":0.5,"scenarios":{"dry":{"tau":0.8,"holdTo":0.15,"holdTau":2},"wet":{"tau":1.1,"holdTo":6,"holdTau":1.4},"leak":{"tau":0.9,"holdRate":4}}},"face":-66,"knobX":-59,"dialZ":76,"dialR":25,"knobZ":32,"cols":{"bp":74,"vac":0,"hp":-74},"mark":{"x":58,"y":-37,"z":30,"r0":2.5,"r1":13}};
const TX = {buttons:{"pumpOn":"Start the pump","pumpOff":"Stop the pump","open":"Open the bypass valves","close":"Close the bypass valves","dry":"Dry and tight","wet":"Moisture","leak":"Leak","next":"New circuit"},read:(rel, p) => `manifold ${fmt(rel, 1)} bar · vacuum gauge ${fmt(p)} mbar abs`,score:(good, total) => `Score: ${good} / ${total}`,feedback:{start:"Start the pump, then open the bypass valves. Watch both instruments: the manifold quickly reaches -1 bar, the vacuum gauge keeps falling.",needPump:"The pump is stopped: start it before opening the bypass valves.",pulling:"Evacuation in progress. The manifold is soon at -1 bar, but only the vacuum gauge shows whether the reference needle is reached.",backflow:"The bypass valves had to be closed before stopping the pump: the circuit is drawing air back through the pump.",tooSoon:(p) => `The vacuum gauge reads ${fmt(p)} mbar, above the 1 mbar reference: reopen the bypass valves and continue the evacuation, even if the manifold shows -1 bar.`,hold:"Bypass valves closed, pump isolated. Watch the vacuum gauge for a few seconds, then give your diagnosis.",noHold:"First pull down below the reference needle, then close the bypass valves to watch the vacuum hold.",good:{"dry":"Correct. The pressure hardly moves: the circuit is dry and tight, and can be charged.","wet":"Correct. The pressure rises then settles: moisture remains, so continue the evacuation, with a nitrogen break if possible.","leak":"Correct. The pressure keeps rising: there is a leak, which must be found before continuing."},bad:{"dry":"Wrong. This circuit was dry and tight: the pressure hardly moved.","wet":"Wrong. The pressure rose then settled: that is remaining moisture.","leak":"Wrong. The pressure kept rising: that is a leak."}}};

const still = matchMedia("(prefers-reduced-motion: reduce)");
const C = FIG, P = C.P, M = C.model, IDS = ["dry", "wet", "leak"];
const fmt = (v, d) => {
  const n = d !== undefined ? v.toFixed(d) : v >= 10 ? String(Math.round(v)) : v.toFixed(1);
  return C.lang === "fr" ? n.replace(".", ",") : n;
};
const T = TX;
const scope = document.querySelector('.live-figure[data-figure="manifold-vide"]') || document;
const root = scope.querySelector(".iso-plate");
const stage = root.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const readout = root.querySelector("[data-readout]");
const feedback = scope.querySelector(".mv-feedback");
const scoreEl = scope.querySelector(".mv-score");
const buttons = Object.fromEntries([...scope.querySelectorAll(".mv-controls button")].map((b) => [b.dataset.act, b]));
const needles = Object.fromEntries([...svg.querySelectorAll(".mv-needle")].map((n) => [n.dataset.dial, n]));
const knobs = Object.fromEntries([...svg.querySelectorAll(".mv-knob")].map((n) => [n.dataset.knob, n]));
const hoses = [...svg.querySelectorAll(".mv-hose")];
const mark = svg.querySelector(".mv-mark");
const lamp = svg.querySelector(".mv-lamp");
const angleOf = (f) => Math.PI * (1.25 - 1.5 * f);
const fRel = (bar) => Math.min(1, Math.max(0, (bar + 1) / 4));
const fVac = (p) => Math.min(1, Math.max(0, (Math.log10(Math.max(p, 0.1)) + 1) / 4));
let scenario = "dry", pump = false, open = false, p = M.atm, shown = M.atm, phase = "idle", holdFrom = 0;
let good = 0, total = 0, answered = false, knobAt = 0, spin = 0, speed = 0, frame = 0, last = 0, visible = false;
const rel = () => (shown - M.atm) / 1000;
function setScenario(id) {
  scenario = id; pump = false; open = false; p = M.atm; shown = M.atm; phase = "idle"; answered = false;
  feedback.textContent = T.feedback.start;
  sync(); run();
}
function sync() {
  buttons.pump.textContent = pump ? T.buttons.pumpOff : T.buttons.pumpOn;
  buttons.pump.setAttribute("aria-pressed", pump ? "true" : "false");
  buttons.bypass.textContent = open ? T.buttons.close : T.buttons.open;
  buttons.bypass.setAttribute("aria-pressed", open ? "true" : "false");
  for (const id of IDS) buttons[id].disabled = answered;
  scoreEl.textContent = T.score(good, total);
  if (pump) lamp.setAttribute("data-lit", ""); else lamp.removeAttribute("data-lit");
  for (const h of hoses) { if (pump && open) h.setAttribute("data-live", ""); else h.removeAttribute("data-live"); }
}
function togglePump() {
  if (pump && open) { pump = false; phase = "backflow"; feedback.textContent = T.feedback.backflow; }
  else { pump = !pump; }
  sync(); run();
}
function toggleBypass() {
  if (!open && !pump) { feedback.textContent = T.feedback.needPump; return; }
  open = !open;
  if (open) { phase = "evac"; feedback.textContent = T.feedback.pulling; }
  else if (p <= M.target) { phase = "hold"; holdFrom = p; feedback.textContent = T.feedback.hold; }
  else { phase = "idle"; feedback.textContent = T.feedback.tooSoon(p); }
  sync(); run();
}
function diagnose(id) {
  if (phase !== "hold") { feedback.textContent = T.feedback.noHold; return; }
  if (answered) return;
  answered = true; total++;
  if (id === scenario) { good++; feedback.textContent = T.feedback.good[scenario]; }
  else feedback.textContent = T.feedback.bad[scenario];
  sync();
}
function nextScenario() {
  let id = scenario;
  while (id === scenario) id = IDS[Math.floor(Math.random() * IDS.length)];
  setScenario(id);
}
function step(dt) {
  const s = M.scenarios[scenario];
  if (open && pump) p = M.floor + (p - M.floor) * Math.exp(-dt / s.tau);
  else if (open && !pump) p += (M.atm - p) * (1 - Math.exp(-dt / 0.7));
  else if (phase === "hold") {
    if (s.holdRate) p = Math.min(M.atm, p + s.holdRate * dt);
    else p += (holdFrom + s.holdTo - p) * (1 - Math.exp(-dt / s.holdTau));
  }
}
function needle(key, f) {
  const a = angleOf(f), y = C.cols[key], z = C.dialZ;
  const pt = (r) => iso([C.face + 0.2, y - Math.cos(a) * r, z + Math.sin(a) * r], P);
  needles[key].setAttribute("d", pathOf([pt(-3), pt(C.dialR - 3)]));
}
function draw() {
  const r = rel();
  needle("bp", fRel(r)); needle("hp", fRel(r)); needle("vac", fVac(shown));
  const ka = Math.PI / 2 - knobAt * Math.PI / 2;
  for (const key of ["bp", "vac", "hp"]) {
    const y = C.cols[key], z = C.knobZ;
    const pt = (q) => iso([C.knobX, y - Math.cos(ka) * q, z + Math.sin(ka) * q], P);
    knobs[key].setAttribute("d", pathOf([pt(0.6), pt(5.4)]));
  }
  const m = C.mark;
  const q = (v) => iso([m.x + v * Math.cos(spin), m.y, m.z + v * Math.sin(spin)], P);
  mark.setAttribute("d", pathOf([q(m.r0), q(m.r1)]));
  readout.textContent = T.read(r, shown);
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  step(calm ? dt * 6 : dt);
  const ease = (v, to, tau) => (calm ? to : v + (to - v) * (1 - Math.exp(-dt / tau)));
  shown = ease(shown, p, 0.08);
  knobAt = ease(knobAt, open ? 1 : 0, 0.15);
  speed = ease(speed, pump ? 1 : 0, 0.5);
  spin += speed * dt * 12;
  draw();
  const moving = pump || open || phase === "hold" || speed > 1e-3 || Math.abs(shown - p) > 1e-3 || Math.abs(knobAt - (open ? 1 : 0)) > 1e-3;
  frame = visible && moving ? requestAnimationFrame(tick) : 0;
}
function run() { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } }
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
buttons.pump.addEventListener("click", togglePump);
buttons.bypass.addEventListener("click", toggleBypass);
for (const id of IDS) buttons[id].addEventListener("click", () => diagnose(id));
buttons.next.addEventListener("click", nextScenario);
window.__mv = { setScenario, togglePump, toggleBypass, diagnose, state: () => ({ scenario, pump, open, p, phase, good, total }) };
setScenario(IDS[Math.floor(Math.random() * IDS.length)]);
draw();

})();
