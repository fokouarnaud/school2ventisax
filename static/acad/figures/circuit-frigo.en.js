(() => {
const FIG = [{"n":1,"state":"vap","side":"BP"},{"n":2,"state":"vap","side":"HP"},{"n":3,"state":"vap","side":"HP"},{"n":4,"state":"mix","side":"HP"},{"n":5,"state":"liq","side":"HP"},{"n":6,"state":"liq","side":"HP"},{"n":7,"state":"liq","side":"HP"},{"n":8,"state":"mix","side":"BP"},{"n":9,"state":"vap","side":"BP"}];
const TX = {states:{"vap":"Superheated vapour","mix":"Liquid and vapour mixture","liq":"Subcooled liquid"},read:(p, side) => `point ${p} · ${side} side`,good:(p, s) => `Correct: at point ${p}, ${s.toLowerCase()}.`,bad:(p, s) => `Not quite: at point ${p}, the refrigerant is ${s.toLowerCase()}.`,start:"One point of the circuit is marked. What state is the refrigerant in there?",score:(g, t) => `Score: ${g} / ${t}`};

const still = matchMedia("(prefers-reduced-motion: reduce)");
const scope = document.querySelector('.live-figure[data-figure="circuit-frigo"]') || document;
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

const T = TX, PTS = FIG;
const marks = Object.fromEntries([...svg.querySelectorAll(".cf-mark")].map((m) => [m.dataset.point, m]));
let i = 0, good = 0, total = 0, answered = false;
const order = [...PTS.keys()].sort(() => Math.random() - 0.5);
function show() {
  const p = PTS[order[i % order.length]];
  for (const [n, m] of Object.entries(marks)) m.toggleAttribute("data-on", Number(n) === p.n);
  readout.textContent = T.read(p.n, p.side);
  for (const s of ["vap", "mix", "liq"]) buttons[s].disabled = answered;
  scoreEl.textContent = T.score(good, total);
}
function answer(s) {
  if (answered) return;
  const p = PTS[order[i % order.length]];
  answered = true; total++;
  if (s === p.state) { good++; feedback.textContent = T.good(p.n, T.states[s]); } else feedback.textContent = T.bad(p.n, T.states[p.state]);
  show();
}
function next() { i++; answered = false; feedback.textContent = T.start; show(); }
const run = () => {};
for (const s of ["vap", "mix", "liq"]) buttons[s].addEventListener("click", () => answer(s));
buttons.next.addEventListener("click", next);
window.__cf = { answer, next, state: () => ({ point: PTS[order[i % order.length]], good, total }) };
feedback.textContent = T.start;
show();
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);

})();
