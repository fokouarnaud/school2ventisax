(() => {
const FIG = {"P":{"origin":[312.7203473752003,220.60338395203436],"scale":1.7637281910646958,"azimuth":28,"elevation":40},"terms":{"1":[-9,28,96],"2":[-9,14,96],"3":[-9,0,96],"4":[9,28,96],"5":[9,14,96],"6":[9,0,96]},"jacks":{"a":[39,-102,9.8],"b":[39,-110,9.8]},"rest":{"a":[29,-70,0.6],"b":[22,-80,0.6]},"barOffset":[79,42,-88],"lift":36,"motors":[{"id":"m50","r1":0.9,"r2":0.9,"plate":"E"},{"id":"m66","r1":0.675,"r2":1.35,"plate":"F"}]};
const TX = {modes:{"test":"Exercise: 50/50 or 66/33?","G":"Board G: direct-on-line","H":"Board H: part winding"},plate:{"m50":"3~ 400 V · PW 50/50","m66":"3~ 400 V · PW 66/33"},plateHidden:"3~ 400 V · PW ? / ?",ohm:(v) => (v === null ? "OL" : `${v.toFixed(2)} Ω`),pair:(a, b) => `${a}-${b}`,readNone:(mode) => `${mode} · touch two terminals`,readOne:(a) => `probe on ${a} · touch a second terminal`,read:(p, v) => `${p}: ${v}`,log:"Readings: ",score:(g, t) => `Score: ${g} / ${t}`,feedback:{start:"Unknown motor, supply off. Touch two terminals to place the ohmmeter probes (or use buttons 1 to 6), compare windings 1-2-3 and 4-5-6, then answer.",need:"First measure at least one pair of terminals in each winding, for example 1-2 then 4-5.",cross:"OL between a terminal of 1-2-3 and a terminal of 4-5-6: the two windings are independent, no current flows from one to the other.",G:"Board G: three links join 1 to 4, 2 to 5 and 3 to 6. The two windings are in parallel and fed together by one contactor: direct-on-line starting at 400 V. The ohmmeter now reads 0 Ω between 1 and 4, and between 1 and 2 the two windings in parallel.",H:"Board H: no link. Terminals 1, 2, 3 go to contactor K1 (first step), terminals 4, 5, 6 to contactor K2 (second step). Keep the same phase order on both feeds so that the windings turn the same way.",ok50:(v) => `Correct. 1-2, 2-3, 3-1 and 4-5, 5-6, 6-4 all read ${v}: the two windings are identical, this is a 50 % / 50 % motor (board E).`,ok66:(a, b) => `Correct. Winding 1-2-3 reads ${a}, less than winding 4-5-6 (${b}): 1-2-3 is winding 1, the more powerful one (66 %), because the more powerful a winding, the lower its resistance (board F).`,bad50:(a, b) => `Wrong. Winding 1-2-3 reads ${a} and winding 4-5-6 reads ${b}: the resistances differ, this is a 66 % / 33 % motor (board F). The lower-resistance winding is the more powerful one.`,bad66:(v) => `Wrong. Both windings read the same value (${v}): this is a 50 % / 50 % motor (board E).`}};

const still = matchMedia("(prefers-reduced-motion: reduce)");
const C = FIG, T = TX, P = C.P;
const scope = document.querySelector('.live-figure[data-figure="reperage-fractionne"]') || document;
const root = scope.querySelector(".iso-plate");
const stage = root.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const readout = root.querySelector("[data-readout]");
const feedback = scope.querySelector(".rf-feedback");
const logEl = scope.querySelector(".rf-log");
const scoreEl = scope.querySelector(".rf-score");
const answerRow = scope.querySelector(".rf-answers");
const buttons = Object.fromEntries([...scope.querySelectorAll(".rf-controls button[data-act]")].map((b) => [b.dataset.act, b]));
const termButtons = [...scope.querySelectorAll(".rf-term-btn")];
const terms = Object.fromEntries([...svg.querySelectorAll(".rf-term")].map((g) => [g.dataset.term, g]));
const bars = svg.querySelector(".rf-bars");
const cables = [...svg.querySelectorAll(".rf-cable")];
const probe = Object.fromEntries([...svg.querySelectorAll(".rf-probe")].map((g) => [g.dataset.p, { lead: g.querySelector(".rf-lead"), handle: g.querySelector(".rf-handle"), tip: g.querySelector(".rf-tip") }]));
const txt = (name) => svg.querySelector('[data-text="' + name + '"]');
// ---- réseau de résistances : deux étoiles (points neutres 7 et 8), barrettes de la plaque G
function resistance(a, b) {
  const m = motor(), edges = [];
  for (const t of [1, 2, 3]) edges.push([t, 7, m.r1]);
  for (const t of [4, 5, 6]) edges.push([t, 8, m.r2]);
  if (mode === "G") for (const [x, y] of [[1, 4], [2, 5], [3, 6]]) edges.push([x, y, 0.001]);
  // composante connexe
  const seen = new Set([a]), stack = [a];
  while (stack.length) { const n = stack.pop(); for (const [x, y] of edges) { const o = x === n ? y : y === n ? x : null; if (o !== null && !seen.has(o)) { seen.add(o); stack.push(o); } } }
  if (!seen.has(b)) return null;
  // potentiels : nœud a à 1 V, nœud b à 0 V (Gauss-Seidel sur 8 nœuds)
  const v = Array(9).fill(0.5); v[a] = 1; v[b] = 0;
  for (let it = 0; it < 4000; it++) for (const n of seen) {
    if (n === a || n === b) continue;
    let g = 0, s = 0;
    for (const [x, y, r] of edges) { const o = x === n ? y : y === n ? x : null; if (o !== null) { g += 1 / r; s += v[o] / r; } }
    v[n] = s / g;
  }
  let i = 0;
  for (const [x, y, r] of edges) { if (x === a) i += (1 - v[y]) / r; else if (y === a) i += (1 - v[x]) / r; }
  return 1 / i;
}
let mode = "test", sc = 0, sel = [], log = [], answered = false, good = 0, total = 0, place = 0, frame = 0, last = 0, visible = false;
const tips = { a: [...C.rest.a], b: [...C.rest.b] };
const motor = () => C.motors[sc];
const target = (p) => { const i = p === "a" ? 0 : 1; return sel[i] ? C.terms[sel[i]] : C.rest[p]; };
function measure() {
  if (sel.length < 2) return null;
  return { pair: T.pair(Math.min(sel[0], sel[1]), Math.max(sel[0], sel[1])), r: resistance(sel[0], sel[1]) };
}
function touch(n) {
  n = Number(n);
  if (sel.includes(n)) sel = sel.filter((x) => x !== n);
  else if (sel.length < 2) sel.push(n);
  else sel = [n]; // une 3e borne commence une nouvelle mesure
  const m = measure();
  if (m && mode === "test") {
    log = log.filter((e) => e.pair !== m.pair); log.push(m); if (log.length > 6) log.shift();
    if (m.r === null) feedback.textContent = T.feedback.cross;
  }
  sync(); run();
}
function winding(t) { return t <= 3 ? 1 : 2; }
function answer(id) {
  if (mode !== "test") return;
  const ws = new Set(log.filter((e) => e.r !== null).map((e) => winding(Number(e.pair[0]))));
  if (!(ws.has(1) && ws.has(2))) { feedback.textContent = T.feedback.need; return; }
  const m = motor(), ok = id === m.id;
  if (!answered) { total++; if (ok) good++; answered = true; }
  const a = T.ohm(2 * m.r1), b = T.ohm(2 * m.r2);
  feedback.textContent = m.id === "m50" ? (ok ? T.feedback.ok50(a) : T.feedback.bad66(a)) : ok ? T.feedback.ok66(a, b) : T.feedback.bad50(a, b);
  sync();
}
function setMode(m) {
  mode = m; sel = [];
  feedback.textContent = m === "test" ? T.feedback.start : T.feedback[m];
  sync(); run();
}
function nextMotor() {
  sc = Math.floor(Math.random() * C.motors.length);
  sel = []; log = []; answered = false; mode = "test";
  feedback.textContent = T.feedback.start;
  sync(); run();
}
function sync() {
  for (const m of ["test", "G", "H"]) buttons[m].setAttribute("aria-pressed", mode === m ? "true" : "false");
  answerRow.hidden = mode !== "test";
  for (const id of ["m50", "m66"]) buttons[id].disabled = answered;
  txt("plate").textContent = answered || mode !== "test" ? T.plate[motor().id] : T.plateHidden;
  for (const [n, g] of Object.entries(terms)) { if (sel.includes(Number(n))) g.setAttribute("data-on", ""); else g.removeAttribute("data-on"); }
  for (const b of termButtons) b.setAttribute("aria-pressed", sel.includes(Number(b.dataset.term)) ? "true" : "false");
  for (const c of cables) {
    const show = mode === "H" || (mode === "G" && c.dataset.c === "K1");
    if (show) c.removeAttribute("data-off"); else c.setAttribute("data-off", "");
  }
  const m = measure();
  txt("lcd").textContent = m ? T.ohm(m.r) : "- - -";
  readout.textContent = m ? T.read(m.pair, T.ohm(m.r)) : sel.length === 1 ? T.readOne(sel[0]) : T.readNone(T.modes[mode]);
  logEl.textContent = mode === "test" && log.length ? T.log + log.map((e) => T.read(e.pair, T.ohm(e.r))).join(" · ") : "";
  scoreEl.textContent = T.score(good, total);
}
function leadPath(jack, tip) {
  const hz = tip[2] + 14;
  const top = [tip[0] - 2, tip[1] + 3, hz];
  const pts = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    pts.push(iso([jack[0] + (top[0] - jack[0]) * t, jack[1] + (top[1] - jack[1]) * t, jack[2] + (top[2] - jack[2]) * t + 16 * Math.sin(Math.PI * t) - 4 * t], P));
  }
  return { lead: pathOf(pts), handle: pathOf([iso([tip[0] - 0.6, tip[1] + 0.9, tip[2] + 4], P), iso(top, P)]), tip: pathOf([iso(tip, P), iso([tip[0] - 0.6, tip[1] + 0.9, tip[2] + 4], P)]) };
}
function draw() {
  for (const p of ["a", "b"]) {
    const d = leadPath(C.jacks[p], tips[p]);
    probe[p].lead.setAttribute("d", d.lead); probe[p].handle.setAttribute("d", d.handle); probe[p].tip.setAttribute("d", d.tip);
  }
  const t = place, [ox, oy, oz] = C.barOffset;
  bars.setAttribute("transform", translateAlong(P, [ox * (1 - t), oy * (1 - t), oz * (1 - t) + C.lift * 4 * t * (1 - t)]));
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  const ease = (v, to, tau) => (calm ? to : v + (to - v) * (1 - Math.exp(-dt / tau)));
  let moving = false;
  for (const p of ["a", "b"]) {
    const to = target(p);
    for (let i = 0; i < 3; i++) { tips[p][i] = ease(tips[p][i], to[i], 0.14); if (Math.abs(tips[p][i] - to[i]) > 0.02) moving = true; }
  }
  // en vol, la pointe passe au-dessus du bornier
  place = ease(place, mode === "G" ? 1 : 0, 0.24);
  draw();
  frame = visible && (moving || Math.abs(place - (mode === "G" ? 1 : 0)) > 1e-3) ? requestAnimationFrame(tick) : 0;
}
function run() { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } }
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
for (const [n, g] of Object.entries(terms)) g.addEventListener("click", () => touch(n));
for (const b of termButtons) b.addEventListener("click", () => touch(b.dataset.term));
for (const m of ["test", "G", "H"]) buttons[m].addEventListener("click", () => setMode(m));
buttons.m50.addEventListener("click", () => answer("m50"));
buttons.m66.addEventListener("click", () => answer("m66"));
buttons.next.addEventListener("click", nextMotor);
window.__rf = { touch, answer, setMode, nextMotor, resistance, state: () => ({ mode, sc, sel: [...sel], log: log.map((e) => [e.pair, e.r]), good, total }) };
nextMotor();
draw();

})();
