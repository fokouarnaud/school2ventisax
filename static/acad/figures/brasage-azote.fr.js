(() => {
const FIG = {"lang":"fr","model":{"purgeSeconds":3,"heatRate":260,"coolRate":130,"brazeTemp":700,"oxideFrom":200,"oxideRate":26,"safeTemp":150}};
const TX = {buttons:{"n2On":"Ouvrir l'azote","n2Off":"Couper l'azote","lightOn":"Allumer et braser","lightOff":"Éteindre le chalumeau","check":"Couper le joint et contrôler","again":"Recommencer"},read:(n2, temp, oxide) => `azote ${n2 ? "ouvert" : "fermé"} · joint ${Math.round(temp)} °C · calamine ${Math.round(oxide)} %`,score:(good, total) => `Score : ${good} / ${total}`,feedback:{start:"Préparez le balayage, puis brasez. Regardez la fenêtre sur l'intérieur du tube.",purging:"Azote ouvert : l'air est en train d'être chassé du tube. Laissez-le passer avant de chauffer.",tooEarly:"L'azote n'a pas encore chassé l'air : le cuivre commence à s'oxyder. Il fallait patienter avant de chauffer.",noN2:"Vous chauffez sans azote : la calamine se forme à l'intérieur du tube.",brazing:"Brasage sous balayage d'azote. Éteignez une fois le joint réalisé, sans couper l'azote.",cooling:"Chalumeau éteint. Gardez l'azote ouvert jusqu'au refroidissement du joint.",cutHot:"Azote coupé alors que le joint est encore chaud : la calamine se forme au refroidissement.",notCool:"Le joint est encore trop chaud pour être contrôlé.",notBrazed:"Brasez d'abord le joint avant de le contrôler.",good:"Joint propre : le balayage a été lancé avant la chauffe et maintenu jusqu'au refroidissement.",bad:(o) => `Calamine à l'intérieur du tube (${Math.round(o)} %) : ce joint partirait en particules dans le circuit. Recommencez.`}};

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
window.__bz = { reset, toggleN2, toggleTorch, check, state: () => ({ n2, lit, purge, temp, oxide, brazed, done, good, total }) };
reset();
draw();

})();
