(() => {
const FIG = {"lang":"en","model":{"purgeSeconds":3,"heatRate":260,"coolRate":130,"brazeTemp":700,"oxideFrom":200,"oxideRate":26,"safeTemp":150}};
const TX = {buttons:{"n2On":"Open the nitrogen","n2Off":"Shut the nitrogen","lightOn":"Light and braze","lightOff":"Put out the torch","check":"Cut the joint and check","again":"Start again"},read:(n2, temp, oxide) => `nitrogen ${n2 ? "open" : "shut"} · joint ${Math.round(temp)} °C · scale ${Math.round(oxide)} %`,score:(good, total) => `Score: ${good} / ${total}`,feedback:{start:"Set up the purge, then braze. Watch the window on the inside of the tube.",purging:"Nitrogen open: the air is being driven out of the tube. Let it flow before heating.",tooEarly:"The nitrogen has not yet driven out the air: the copper is starting to oxidise. You should have waited before heating.",noN2:"You are heating without nitrogen: scale is forming inside the tube.",brazing:"Brazing under a nitrogen purge. Put out the torch once the joint is made, without shutting the nitrogen.",cooling:"Torch out. Keep the nitrogen open until the joint has cooled.",cutHot:"Nitrogen shut while the joint is still hot: scale forms as it cools.",notCool:"The joint is still too hot to check.",notBrazed:"Braze the joint before checking it.",good:"Clean joint: the purge was started before heating and kept up until the joint cooled.",bad:(o) => `Scale inside the tube (${Math.round(o)} %): this joint would shed particles into the circuit. Start again.`}};

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
