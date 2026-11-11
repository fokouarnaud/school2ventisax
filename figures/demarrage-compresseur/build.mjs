// Figure interactive d'évaluation (skill anatomy) : démarrage d'un moto-compresseur monophasé par relais d'intensité, et diagnostic.
// Partie 4, module 10 (imprimé 29), section « Démarrage par CTP et par condensateurs ».
// Usage : node figures/demarrage-compresseur/build.mjs
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../_kit/iso-kit.mjs";
import * as G from "../_kit/lathe.mjs";
import { bench, buttonsHtml, CONTROLS_CSS, LIVE_HEAD, LIVE_WATCH, writeFigure } from "../_kit/acad-bench.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

// Modèle (temps accéléré) : courant nominal In, courant rotor bloqué 6 × In, le protecteur coupe une surintensité prolongée.
const MODEL = { In: 1.2, lockedRatio: 6, auxExtra: 0.8, accel: 1.4, release: 0.8, tripLocked: 2.5, tripAux: 4 };

const TEXT = {
  fr: {
    title: "Démarrage par relais",
    pageTitle: "Démarrage d'un moto-compresseur par relais d'intensité : diagnostic",
    hint: "Mettre sous tension, observer le courant, diagnostiquer",
    power: "Mettre sous tension",
    diag: { ok: "Démarrage normal", open: "Contact du relais qui ne ferme pas", stuck: "Contact du relais resté fermé" },
    next: "Autre compresseur",
    keys: [
      { mark: "lit", label: "Voyant du contact K du relais (allumé = fermé)" },
      { mark: "raised", label: "Compresseur, boîtier du relais et pince ampèremétrique" },
      { mark: "dashed", label: "Câble d'alimentation sous tension" },
    ],
    caption: "À la mise sous tension, le courant du rotor bloqué traverse la bobine du relais, qui ferme le contact K : l'enroulement auxiliaire démarre le moteur. Dès que le moteur prend sa vitesse, le courant baisse et K s'ouvre ; il reste le courant nominal. Si K ne ferme pas, le moteur grogne sans démarrer, le courant reste très élevé et le protecteur thermique coupe. Si K reste fermé, le moteur tourne mais l'auxiliaire reste alimenté : le courant reste au-dessus du nominal et le protecteur finit par couper. Le temps de la figure est accéléré.",
    stageLabel: "Compresseur hermétique sur un banc, son boîtier de relais de démarrage avec un voyant et une pince ampèremétrique sur le câble. Mettez sous tension, observez le courant et le voyant, puis donnez votre diagnostic.",
    svgLabel: "Compresseur hermétique, boîtier de relais avec voyant, câble d'alimentation et pince ampèremétrique à affichage.",
    read: (amps, k, run, tripped) => `${amps} A · K ${k ? "fermé" : "ouvert"} · ${tripped ? "protecteur déclenché" : run ? "moteur en marche" : "moteur à l'arrêt"}`,
    good: { ok: "Juste : pointe de courant, K se ferme puis s'ouvre, il reste le courant nominal.", open: "Juste : K ne ferme pas, le moteur grogne au courant de rotor bloqué et le protecteur coupe.", stuck: "Juste : K reste fermé, le courant reste au-dessus du nominal et le protecteur finit par couper." },
    bad: (right) => `Non : il s'agissait de « ${right} ». Regardez le courant après le démarrage et le voyant de K.`,
    powerFirst: "Mettez d'abord sous tension et observez.",
    start: "Mettez le compresseur sous tension et observez la pince et le voyant du relais.",
    score: (g, t) => `Score : ${g} / ${t}`,
  },
  en: {
    title: "Starting with a relay",
    pageTitle: "Starting a motor-compressor with a current relay: diagnosis",
    hint: "Switch on, watch the current, diagnose",
    power: "Switch on",
    diag: { ok: "Normal start", open: "Relay contact does not close", stuck: "Relay contact stays closed" },
    next: "Another compressor",
    keys: [
      { mark: "lit", label: "Relay contact K indicator (lit = closed)" },
      { mark: "raised", label: "Compressor, relay box and current clamp" },
      { mark: "dashed", label: "Live supply cable" },
    ],
    caption: "On switching on, the locked-rotor current flows through the relay coil, which closes contact K: the auxiliary winding starts the motor. As the motor gains speed, the current falls and K opens; the rated current remains. If K does not close, the motor hums without starting, the current stays very high and the thermal protector trips. If K stays closed, the motor runs but the auxiliary stays energised: the current stays above rated and the protector eventually trips. Time in the figure is speeded up.",
    stageLabel: "Hermetic compressor on a bench, its start relay box with an indicator and a current clamp on the cable. Switch on, watch the current and indicator, then give your diagnosis.",
    svgLabel: "Hermetic compressor, relay box with indicator, supply cable and current clamp with display.",
    read: (amps, k, run, tripped) => `${amps} A · K ${k ? "closed" : "open"} · ${tripped ? "protector tripped" : run ? "motor running" : "motor stopped"}`,
    good: { ok: "Correct: current peak, K closes then opens, rated current remains.", open: "Correct: K does not close, the motor hums at locked-rotor current and the protector trips.", stuck: "Correct: K stays closed, the current stays above rated and the protector eventually trips." },
    bad: (right) => `No: it was « ${right} ». Watch the current after starting and the K indicator.`,
    powerFirst: "First switch on and watch.",
    start: "Switch on the compressor and watch the clamp and the relay indicator.",
    score: (g, t) => `Score: ${g} / ${t}`,
  },
};

const AZ = 30, WIDTH = 680, HEIGHT = 420;
const PLATE = { x: -90, y: -170, w: 180, d: 300, r: 8 };
const CX = -10, CY = 40, R = 46, H = 92;
const BOX = { x: CX + R - 6, y: CY - 30, w: 22, d: 34 };
const CLAMP = { x: 40, y: -140, w: 40, d: 54 };

function buildFigure(lang) {
  const T = TEXT[lang];
  const P = k.fitProjection([...k.boxCorners(PLATE, -15, 0), [CX, CY, H + 8]], WIDTH, HEIGHT, { pad: 14, azimuth: AZ, elevation: 34 });
  const at = (p) => k.iso(p, P);
  const S = (paths, style) => k.solidSvg(paths, style);
  const L = (d, style) => k.lineSvg(d, style);
  const F = G.frameOf([CX, CY, 6], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  const o = [bench(P, PLATE)];
  o.push(S(k.slabOf({ x: CX - 40, y: CY - 40, w: 80, d: 80, r: 4 }, 0, 6, P, 3, 0.6), { tone: "lo" }));
  o.push(`<g class="dc-body">${S(G.solidOf([[0, 0], [0, R], [H - 30, R], [H - 14, R - 8, 1], [H - 4, R - 24, 1], [H, 0]], F, P), { tone: "hi", inner: L(G.arcOf(F, H - 34, R, P), { tone: "faint" }) })}</g>`);
  // boîtier du relais, accroché sur la face +x
  o.push(S(k.slabOf({ ...BOX, r: 2 }, 34, 30, P, 2, 0.6), { tone: "mid", inner: L(k.sideSeam({ ...BOX, r: 2 }, 40, P, 2), { tone: "faint" }) }));
  const LF = G.frameOf([BOX.x + BOX.w, BOX.y + 10, 56], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  o.push(S(G.disc(0, 1.2, 3.6, LF, P, { steps: 20 }), { tone: "lo" }));
  o.push(`<g class="dc-k">${S(G.disc(1.2, 2.2, 2.6, LF, P, { steps: 18 }), { tone: "hi", lit: true })}</g>`);
  // câble vers la pince
  const a = [BOX.x + BOX.w, BOX.y + 26, 40], b = [CLAMP.x + 6, CLAMP.y + CLAMP.d - 4, 3];
  const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t - 10 * Math.sin(Math.PI * t)]); }
  o.push(`<g class="dc-cable">${L(k.pathOf(pts.map(at)), { tone: "mid" })}</g>`);
  // pince ampèremétrique posée à plat
  o.push(S(k.slabOf({ ...CLAMP, r: 6 }, 0, 10, P, 3, 0.8), { tone: "mid", inner: L(k.sideSeam({ ...CLAMP, r: 6 }, 3, P, 3), { tone: "faint" }) }));
  const scr = { x: CLAMP.x + 8, y: CLAMP.y + 6, w: 24, d: 24 };
  o.push(`<path class="dc-screen" d="${k.pathOf([[scr.x, scr.y, 10.1], [scr.x + scr.w, scr.y, 10.1], [scr.x + scr.w, scr.y + scr.d, 10.1], [scr.x, scr.y + scr.d, 10.1]].map(at), true)}"/>`);
  o.push(k.faceTextSvg(k.topMatrix([scr.x + scr.w / 2, scr.y + scr.d / 2], 10.2, P, "y"), "", { size: 6.5, tone: "hi", anchor: "middle" }).replace("<text ", '<text data-text="amps" '));
  o.push(L(k.ring(CLAMP.x + 20, CLAMP.y + 42, 8, 10, P, 28), { tone: "lo" }));
  return k.figureSvg({ width: WIDTH, height: HEIGHT, label: T.svgLabel, body: o });
}

const CSS = CONTROLS_CSS + `
.dc-screen{fill:var(--anatomy-top);stroke:var(--anatomy-mid);stroke-width:.8}
.dc-k{opacity:.2;transition:opacity .15s}
.dc-k[data-on]{opacity:1}
.dc-cable .iso-line{stroke-width:2.4}
.dc-cable[data-live] .iso-line{stroke-dasharray:3 4;animation:iso-flow 1600ms linear infinite}
.dc-body[data-hum]{animation:dc-hum .08s linear infinite}
@keyframes dc-hum{50%{transform:translateX(.6px)}}
@media (prefers-reduced-motion:reduce){.dc-cable[data-live] .iso-line,.dc-body[data-hum]{animation:none}}
`;

const LIVE = LIVE_HEAD("demarrage-compresseur") + `
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
` + LIVE_WATCH;

const langs = {};
for (const lang of ["fr", "en"]) {
  const T = TEXT[lang];
  const svg = buildFigure(lang);
  const controls = buttonsHtml(lang === "fr" ? "Commande et diagnostic" : "Control and diagnosis", [["power", T.power], ["ok", T.diag.ok], ["open", T.diag.open], ["stuck", T.diag.stuck], ["next", T.next]]);
  const plate = k.plateHtml({ fig: "Fig 14", title: T.title, hint: T.hint, readout: "", keys: T.keys, caption: T.caption, body: `<div class="iso-stage" role="img" aria-label="${T.stageLabel}">${svg}</div>${controls}` });
  const TX = `{read:${T.read},diag:${JSON.stringify(T.diag)},good:${JSON.stringify(T.good)},bad:${T.bad},powerFirst:${JSON.stringify(T.powerFirst)},start:${JSON.stringify(T.start)},score:${T.score}}`;
  langs[lang] = { plate, title: T.pageTitle, script: `const FIG = ${JSON.stringify(MODEL)};\nconst LANG = "${lang}";\nconst TX = ${TX};\n` + LIVE };
}
writeFigure(HERE, "demarrage-compresseur", langs, CSS);
