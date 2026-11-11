(() => {
const FIG = {"In":1.2,"lockedRatio":6,"auxExtra":0.8,"accel":1.4,"release":0.8,"tripLocked":2.5,"tripAux":4};
const LANG = "fr";
const TX = {read:(amps, k, run, tripped) => `${amps} A · K ${k ? "fermé" : "ouvert"} · ${tripped ? "protecteur déclenché" : run ? "moteur en marche" : "moteur à l'arrêt"}`,diag:{"ok":"Démarrage normal","open":"Contact du relais qui ne ferme pas","stuck":"Contact du relais resté fermé"},good:{"ok":"Juste : pointe de courant, K se ferme puis s'ouvre, il reste le courant nominal.","open":"Juste : K ne ferme pas, le moteur grogne au courant de rotor bloqué et le protecteur coupe.","stuck":"Juste : K reste fermé, le courant reste au-dessus du nominal et le protecteur finit par couper."},bad:(right) => `Non : il s'agissait de « ${right} ». Regardez le courant après le démarrage et le voyant de K.`,powerFirst:"Mettez d'abord sous tension et observez.",start:"Mettez le compresseur sous tension et observez la pince et le voyant du relais.",score:(g, t) => `Score : ${g} / ${t}`};

const still = matchMedia("(prefers-reduced-motion: reduce)");
const scope = document.querySelector('.live-figure[data-figure="demarrage-compresseur"]') || document;
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

const T = TX, M = FIG, IDS = ["ok", "open", "stuck"];
const kLamp = svg.querySelector(".dc-k"), cable = svg.querySelector(".dc-cable"), body = svg.querySelector(".dc-body"), screen = svg.querySelector('[data-text="amps"]');
let fault = "ok", on = false, speed = 0, t = 0, kClosed = false, tripped = false, amps = 0, shown = 0, good = 0, total = 0, answered = false, used = false;
const fmt = (v) => (LANG === "fr" ? v.toFixed(1).replace(".", ",") : v.toFixed(1));
function setup() {
  fault = IDS[Math.floor(Math.random() * IDS.length)];
  on = false; speed = 0; t = 0; kClosed = false; tripped = false; amps = 0; shown = 0; answered = false; used = false;
  feedback.textContent = T.start; sync(); draw();
}
function power() { if (on) return; on = true; used = true; t = 0; run(); sync(); }
function step(dt) {
  if (on && !tripped) {
    t += dt;
    if (fault !== "open") kClosed = fault === "stuck" ? true : speed < M.release;
    else kClosed = false;
    if (kClosed || speed > 0.05) speed = Math.min(1, speed + dt * M.accel * (kClosed ? 1 : 0.4));
    const locked = speed < 0.05;
    amps = locked ? M.In * M.lockedRatio : M.In * (1 + (M.lockedRatio - 1) * Math.max(0, M.release - speed) / M.release) + (kClosed && speed >= M.release ? M.In * M.auxExtra : 0);
    if ((fault === "open" && t > M.tripLocked) || (fault === "stuck" && t > M.tripAux)) { tripped = true; on = false; kClosed = false; amps = 0; sync(); }
  } else { speed = Math.max(0, speed - dt * 0.8); amps = 0; }
  shown += (amps - shown) * Math.min(1, dt / 0.06);
  draw();
}
function draw() {
  screen.textContent = fmt(Math.max(0, shown));
  kLamp.toggleAttribute("data-on", kClosed);
  cable.toggleAttribute("data-live", on);
  body.toggleAttribute("data-hum", on && speed < 0.05);
  readout.textContent = T.read(fmt(Math.max(0, shown)), kClosed, on && speed > 0.05, tripped);
}
function sync() { scoreEl.textContent = T.score(good, total); for (const id of IDS) buttons[id].disabled = answered; }
function diagnose(id) {
  if (answered) return;
  if (!used) { feedback.textContent = T.powerFirst; return; }
  answered = true; total++;
  if (id === fault) { good++; feedback.textContent = T.good[fault]; } else feedback.textContent = T.bad(T.diag[fault]);
  sync();
}
const run = loop(step, () => on || speed > 0 || Math.abs(shown - amps) > 0.01);
buttons.power.addEventListener("click", power);
for (const id of IDS) buttons[id].addEventListener("click", () => diagnose(id));
buttons.next.addEventListener("click", setup);
window.__dc = { setup, power, diagnose, set: (f) => { setup(); fault = f; }, state: () => ({ fault, on, speed, kClosed, tripped, amps, good, total }) };
setup();
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);

})();
