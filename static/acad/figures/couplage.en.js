(() => {
const FIG = {"lang":"en","P":{"origin":[254.9434852891998,277.270495895503],"scale":1.3735948132826241,"azimuth":28,"elevation":38},"F":{"o":[0,-66,46],"a":[0,1,0],"u":[1,0,0],"v":[0,0,1]},"markS":68,"dial":{"x":-6,"y":-154,"z":70,"r":11,"max":800},"knob":{"x":-1,"y":-152,"z":22,"a0":2.827433388230814,"step":-0.5026548245743669},"meters":["L1-L2","L2-L3","L3-L1","L1-N","L2-N","L3-N"],"flagMove":3,"trayOffset":{"Y":[45,6,-88],"D":[75,6,-88]},"lift":40,"networks":[{"id":"n400","v":230,"u":400},{"id":"n690","v":400,"u":690}],"motors":[{"id":"m230","lo":230,"hi":400,"kw":"4","rpm":1440,"amps":"14,8/8,5","ampsEn":"14.8/8.5"},{"id":"m400","lo":400,"hi":690,"kw":"4","rpm":1440,"amps":"8,5/4,9","ampsEn":"8.5/4.9"}],"scenarios":[{"m":"m230","n":"n400"},{"m":"m230","n":"n690"},{"m":"m400","n":"n400"},{"m":"m400","n":"n690"}]};
const winding0 = (u, c) => (c === "Y" ? u / Math.sqrt(3) : u);
function expected(m, n) { for (const c of ["Y", "D"]) if (Math.abs(winding0(n.u, c) - m.lo) / m.lo < 0.05) return c; return "none"; }
const TX = {plate:(m) => `3~ ${m.lo}/${m.hi} V`,plate2:(m) => `${m.kw} kW · ${m.rpm} rpm`,net:(n) => `${n.v}/${n.u} V`,meterBtn:(pos) => `Voltmeter: ${pos.replace("-", "‑")}`,readIdle:(m, n, c, pos, val) => `plate ${m.lo}/${m.hi} V · voltmeter ${pos}: ${val} V · ${c === "Y" ? "star" : c === "D" ? "delta" : c === "none" ? "no connection" : "fit the links"}`,readRun:(w, m, verdict) => `winding ${Math.round(w / 10) * 10} V for ${m.lo} V · ${verdict}`,verdict:{"ok":"normal running ✓","over":"overvoltage ×√3: tripped","under":"undervoltage ÷√3: torque ÷3","noneOk":"correct ✓","noneBad":"wrong ✗","noCoupling":"fit the links or declare the motor unsuitable"},feedback:{ok:(m, n, c) => `Correct. ${c === "Y" ? `Star: each winding gets ${n.u} / √3 ≈ ${Math.round(n.u / Math.sqrt(3) / 10) * 10} V` : `Delta: each winding gets ${n.u} V`}, the lower plate voltage (${m.lo} V). The motor runs normally.`,over:(m, n, c) => `Wrong. ${c === "Y" ? `In star each winding gets about ${Math.round(n.u / Math.sqrt(3) / 10) * 10} V` : `In delta each winding gets ${n.u} V`}, but it is rated ${m.lo} V: the windings overheat and the thermal overload relay trips. ${expected(m, n) === "none" ? "No connection fits: this motor is unsuitable for this supply." : `The right answer was ${expected(m, n) === "Y" ? "star" : "delta"}.`}`,under:(m, n) => `Wrong. In star each winding only gets about ${Math.round(n.u / Math.sqrt(3) / 10) * 10} V instead of ${m.lo} V: torque drops to a third, the motor struggles, heats up and the thermal overload relay ends up tripping. The right answer was delta.`,noneOk:(m, n) => `Correct. Plate ${m.lo}/${m.hi} V, supply ${n.v}/${n.u} V: even in star each winding would get about ${Math.round(n.u / Math.sqrt(3) / 10) * 10} V instead of ${m.lo} V. This motor must not be connected to this supply.`,noneBad:(m, n) => `Wrong. This motor suits this supply: the right answer was ${expected(m, n) === "Y" ? `star (${n.u} / √3 ≈ ${Math.round(n.u / Math.sqrt(3) / 10) * 10} V per winding)` : `delta (${n.u} V per winding)`}.`,noCoupling:"First fit the links (star or delta), or declare the motor unsuitable."},score:(good, total) => `Score: ${good} / ${total}`,start:(n) => `Read the motor's rating plate (on the terminal box) and the supply voltage (on the cabinet). A ${n.v}/${n.u} V supply gives ${n.v} V between one phase and neutral and ${n.u} V between two phases; they are not added up. The line voltage (${n.u} V) is what you compare with the plate. The Voltmeter button changes the measurement.`};

const still = matchMedia("(prefers-reduced-motion: reduce)");
const C = FIG, T = TX, P = C.P;
// dans le site, la figure vit dans son emplacement ; seule dans une page, dans le document
const scope = document.querySelector('.live-figure[data-figure="couplage"]') || document;
const root = scope.querySelector(".iso-plate");
const stage = root.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const readout = root.querySelector("[data-readout]");
const feedback = scope.querySelector(".cp-feedback");
const scoreEl = scope.querySelector(".cp-score");
const buttons = Object.fromEntries([...scope.querySelectorAll(".cp-controls button")].map((b) => [b.dataset.act, b]));
const sets = Object.fromEntries([...svg.querySelectorAll(".cp-bars")].map((g) => [g.dataset.set, g]));
const needle = svg.querySelector(".cp-needle");
const mark = svg.querySelector(".cp-mark");
const knob = svg.querySelector(".cp-knob");
const flag = svg.querySelector(".cp-flag");
const runGlow = svg.querySelector(".cp-run-glow");
const runLamp = svg.querySelector(".cp-run");
const live = [...svg.querySelectorAll(".rl-wire")];
const txt = (name) => svg.querySelector('[data-text="' + name + '"]');
const winding = (u, c) => (c === "Y" ? u / Math.sqrt(3) : u);
let sc = 0, choice = null, phase = "idle", verdict = null, good = 0, total = 0, answered = false;
const place = { Y: 0, D: 0 }; // 1 = sur les bornes, 0 = dans le bac
let meter = 0;
const meterValue = () => (C.meters[meter].endsWith("N") ? net().v : net().u);
let angle = 0, speed = 0, targetSpeed = 0, volts = 0, flagAt = 0, runAt = 0, runTimer = 0, frame = 0, last = 0, visible = false;
const scen = () => C.scenarios[sc];
const motor = () => C.motors.find((m) => m.id === scen().m);
const net = () => C.networks.find((n) => n.id === scen().n);
function setScenario(i) {
  sc = i; choice = null; phase = "idle"; verdict = null; answered = false; targetSpeed = 0;
  txt("plate").textContent = T.plate(motor());
  txt("plate2").textContent = T.plate2(motor());
  txt("net").textContent = T.net(net());
  meter = 0;
  feedback.textContent = T.start(net());
  svg.removeAttribute("data-heat"); svg.removeAttribute("data-smoke");
  sync(); run();
}
function sync() {
  for (const k of ["Y", "D", "none"]) buttons[k].setAttribute("aria-pressed", choice === k ? "true" : "false");
  for (const k of ["Y", "D", "none"]) buttons[k].disabled = phase === "running";
  buttons.test.disabled = phase === "running";
  scoreEl.textContent = T.score(good, total);
  txt("meter").textContent = C.meters[meter];
  buttons.meter.textContent = T.meterBtn(C.meters[meter]);
  readout.textContent = phase === "idle" ? T.readIdle(motor(), net(), choice, C.meters[meter], meterValue()) : readout.textContent;
}
function choose(c) {
  if (phase === "running") return;
  choice = c; phase = "idle"; verdict = null; targetSpeed = 0;
  svg.removeAttribute("data-heat"); svg.removeAttribute("data-smoke");
  sync(); run();
}
function test() {
  if (phase === "running") return;
  const m = motor(), n = net(), exp = expected(m, n);
  if (!choice) { feedback.textContent = T.feedback.noCoupling; readout.textContent = T.verdict.noCoupling; return; }
  const first = !answered; answered = true;
  if (choice === "none") {
    const ok = exp === "none";
    if (first) { total++; if (ok) good++; }
    feedback.textContent = ok ? T.feedback.noneOk(m, n) : T.feedback.noneBad(m, n);
    readout.textContent = ok ? T.verdict.noneOk : T.verdict.noneBad;
    sync(); return;
  }
  const w = winding(n.u, choice);
  verdict = Math.abs(w - m.lo) / m.lo < 0.05 ? "ok" : w > m.lo ? "over" : "under";
  if (first) { total++; if (verdict === "ok") good++; }
  phase = "running";
  feedback.textContent = T.feedback[verdict](m, n, choice);
  readout.textContent = T.readRun(w, m, T.verdict[verdict]);
  targetSpeed = verdict === "ok" ? 1 : verdict === "under" ? 0.35 : 0.8;
  flagAt = 0;
  if (verdict !== "ok") {
    svg.setAttribute("data-heat", "1");
    if (verdict === "over") svg.setAttribute("data-smoke", "");
    clearTimeout(runTimer);
    runTimer = setTimeout(() => { phase = "tripped"; targetSpeed = 0; sync(); run(); }, verdict === "over" ? 1600 : 3200);
  } else {
    clearTimeout(runTimer);
    runTimer = setTimeout(() => { phase = "idle-ok"; sync(); }, 2400);
  }
  sync(); run();
}
function nextScenario() {
  clearTimeout(runTimer);
  let i = sc;
  while (C.scenarios.length > 1 && i === sc) i = Math.floor(Math.random() * C.scenarios.length);
  setScenario(i);
}
function draw() {
  for (const k of ["Y", "D"]) {
    const t = place[k];
    const [ox, oy, oz] = C.trayOffset[k];
    const lift = C.lift * 4 * t * (1 - t);
    sets[k].setAttribute("transform", translateAlong(P, [ox * (1 - t), oy * (1 - t), oz * (1 - t) + lift]));
  }
  // repère de l'accouplement
  const F = C.F, s = C.markS, r0 = 2.5, r1 = 11;
  const p = (r) => [F.o[0] + r * Math.cos(angle), F.o[1] + s, F.o[2] + r * Math.sin(angle)];
  mark.setAttribute("d", pathOf([iso(p(r0), P), iso(p(r1), P)]));
  // voltmètre : tension entre phases
  const a = Math.PI * (1.25 - 1.5 * Math.min(volts, C.dial.max) / C.dial.max);
  const dp = (r) => iso([C.dial.x + 0.2, C.dial.y - Math.cos(a) * r, C.dial.z + Math.sin(a) * r], P);
  needle.setAttribute("d", pathOf([dp(-2), dp(C.dial.r - 2)]));
  const ka = C.knob.a0 + meter * C.knob.step;
  const kp = (r) => iso([C.knob.x, C.knob.y - Math.cos(ka) * r, C.knob.z + Math.sin(ka) * r], P);
  knob.setAttribute("d", pathOf([kp(0.6), kp(4)]));
  flag.setAttribute("transform", translateAlong(P, [C.flagMove * flagAt, 0, 0]));
  runGlow.style.opacity = runAt.toFixed(3);
  if (runAt > 0.5) runLamp.setAttribute("data-lit", ""); else runLamp.removeAttribute("data-lit");
  const powered = phase === "running" || phase === "idle-ok";
  for (const w of live) { if (powered) w.setAttribute("data-live", ""); else w.removeAttribute("data-live"); }
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  const ease = (v, to, tau) => (calm ? to : v + (to - v) * (1 - Math.exp(-dt / tau)));
  for (const k of ["Y", "D"]) place[k] = ease(place[k], choice === k ? 1 : 0, 0.22);
  const powered = phase === "running" || phase === "idle-ok";
  speed = ease(speed, powered ? targetSpeed : 0, powered ? 0.5 : 0.9);
  angle += speed * dt * 2 * Math.PI * 0.8; // 1440 tr/min montrés très ralentis
  volts = ease(volts, meterValue(), 0.4);
  flagAt = ease(flagAt, phase === "tripped" ? 1 : 0, 0.08);
  runAt = ease(runAt, powered ? 1 : 0, 0.1);
  if (phase === "tripped") { svg.removeAttribute("data-smoke"); readout.textContent = T.readRun(winding(net().u, choice), motor(), T.verdict[verdict]); }
  draw();
  const settled = !powered && speed < 1e-3 && ["Y", "D"].every((k) => Math.abs(place[k] - (choice === k ? 1 : 0)) < 1e-3) && Math.abs(volts - meterValue()) < 0.5 && Math.abs(flagAt - (phase === "tripped" ? 1 : 0)) < 1e-3 && runAt < 1e-3;
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
function run() { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } }
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
buttons.Y.addEventListener("click", () => choose("Y"));
buttons.D.addEventListener("click", () => choose("D"));
buttons.none.addEventListener("click", () => choose("none"));
buttons.test.addEventListener("click", test);
buttons.next.addEventListener("click", nextScenario);
buttons.meter.addEventListener("click", () => { meter = (meter + 1) % C.meters.length; sync(); run(); });
window.__cp = { choose, test, setScenario, state: () => ({ sc, choice, phase, verdict, good, total }) };
setScenario(Math.floor(Math.random() * C.scenarios.length));
draw();

})();
