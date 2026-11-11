(() => {
const FIG = {"cylinder":13.6,"liquidRate":0.12,"vapourRate":0.04,"tolerance":0.02,"jobs":[{"fluid":"R134a","kind":"pure","target":0.85},{"fluid":"R407C","kind":"zeo","target":1.6},{"fluid":"R404A","kind":"zeo","target":2.2},{"fluid":"R22","kind":"pure","target":1.1}]};
const LANG = "en";
const TX = {buttons:{"tare":"Zero the scales","flip":"Turn the cylinder over","open":"Open the valve","close":"Close the valve","check":"Finish charging","next":"Another system"},plate:(j) => `${j.fluid} · ${j.target.toFixed(2)} kg`,read:(charged, target, phase) => `charged ${charged} / ${target} kg · ${phase}`,phase:{"liquid":"liquid","vapour":"vapour"},score:(g, t) => `Score: ${g} / ${t}`,feedback:{noTare:"First zero the scales with the cylinder on them: otherwise the charged mass cannot be read.",closeFirst:"Close the valve before turning the cylinder over.",zeoVapour:"Careful: a zeotropic blend charged as vapour does not keep its composition. Close, turn the cylinder upright and charge as liquid.",badPhase:"The mass is right, but this zeotrope was charged as vapour: its composition has changed. It would have to be recovered and recharged as liquid.",stillOpen:"Close the valve first.",start:(j) => `Plate: ${j.fluid}, ${j.target.toFixed(2)} kg. Zero the scales before opening the valve.`,good:(c) => `Correct: ${c} kg charged, within tolerance, in the right phase.`,under:(c, t) => `Not enough: ${c} kg out of ${t} kg. Reopen the valve and top up.`,over:(c, t) => `Too much refrigerant: ${c} kg for ${t} kg planned. In practice the excess would have to be recovered.`}};

const still = matchMedia("(prefers-reduced-motion: reduce)");
const scope = document.querySelector('.live-figure[data-figure="manifold-charge"]') || document;
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

const T = TX, M = FIG;
const upright = svg.querySelector(".mc-upright"), inverted = svg.querySelector(".mc-inverted");
const hoses = [...svg.querySelectorAll(".mc-hose")];
const kgText = svg.querySelector('[data-text="kg"]'), plateText = svg.querySelector('[data-text="plate"]');
let job, mass, tare, open, inv, vapourCharged, done, good = 0, total = 0;
const nb = (v) => (LANG === "fr" ? v.toFixed(2).replace(".", ",") : v.toFixed(2));
function setup() {
  job = M.jobs[Math.floor(Math.random() * M.jobs.length)];
  mass = M.cylinder; tare = null; open = false; inv = false; vapourCharged = 0; done = false;
  plateText.textContent = T.plate(job);
  feedback.textContent = T.feedback.start(job);
  sync(); draw();
}
const charged = () => (tare === null ? 0 : tare - mass);
function sync() {
  buttons.valve.textContent = open ? T.buttons.close : T.buttons.open;
  buttons.valve.setAttribute("aria-pressed", open ? "true" : "false");
  upright.hidden = inv; inverted.hidden = !inv;
  for (const h of hoses) { h.hidden = (h.dataset.for === "inverted") !== inv; h.toggleAttribute("data-live", open); }
  buttons.check.disabled = done;
  scoreEl.textContent = T.score(good, total);
}
function draw() {
  const shown = tare === null ? mass : mass - tare;
  kgText.textContent = (shown < 0 ? "-" : "") + nb(Math.abs(shown));
  readout.textContent = T.read(nb(Math.max(0, charged())), nb(job.target), T.phase[inv ? "vapour" : "liquid"]);
}
function doTare() { if (open) { feedback.textContent = T.feedback.stillOpen; return; } tare = mass; draw(); }
function flip() { if (open) { feedback.textContent = T.feedback.closeFirst; return; } inv = !inv; sync(); draw(); }
function valve() {
  if (done) return;
  if (!open && tare === null) { feedback.textContent = T.feedback.noTare; return; }
  open = !open;
  if (open && inv && job.kind === "zeo") feedback.textContent = T.feedback.zeoVapour;
  sync(); run();
}
function check() {
  if (done) return;
  if (open) { feedback.textContent = T.feedback.stillOpen; return; }
  if (tare === null) { feedback.textContent = T.feedback.noTare; return; }
  const c = charged(), err = (c - job.target) / job.target;
  if (err < -M.tolerance) { feedback.textContent = T.feedback.under(nb(c), nb(job.target)); return; }
  done = true; total++;
  if (err > M.tolerance) feedback.textContent = T.feedback.over(nb(c), nb(job.target));
  else if (job.kind === "zeo" && vapourCharged > 0.001) feedback.textContent = T.feedback.badPhase;
  else { good++; feedback.textContent = T.feedback.good(nb(c)); }
  sync();
}
function step(dt) {
  if (open) { const q = (inv ? M.vapourRate : M.liquidRate) * dt; mass -= q; if (inv) vapourCharged += q; }
  draw();
}
const run = loop(step, () => open);
buttons.tare.addEventListener("click", doTare);
buttons.flip.addEventListener("click", flip);
buttons.valve.addEventListener("click", valve);
buttons.check.addEventListener("click", check);
buttons.next.addEventListener("click", setup);
window.__mc = { setup, doTare, flip, valve, check, set: (i) => { setup(); job = M.jobs[i]; plateText.textContent = T.plate(job); }, state: () => ({ job, charged: charged(), inv, open, done, good, total }) };
setup();
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);

})();
