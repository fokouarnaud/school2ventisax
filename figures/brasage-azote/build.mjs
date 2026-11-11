// Figure interactive d'évaluation (skill anatomy) : balayage d'azote pendant le brasage, et calamine à l'intérieur du tube.
// Partie 4, module 7 (imprimé 26), section « Brasage sous azote : mise en œuvre ».
// Usage : node figures/brasage-azote/build.mjs   (fr + en, sombre + clair)
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../_kit/iso-kit.mjs";
import * as G from "../_kit/lathe.mjs";
import { publish } from "../_kit/publish.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const KIT_SOURCE = readFileSync(join(HERE, "..", "_kit", "iso-kit.mjs"), "utf8").replace(/^export /gm, "");

// ---------------------------------------------------------------- modèle : en temps accéléré
const MODEL = {
  purgeSeconds: 3, // temps de balayage pour chasser l'air
  heatRate: 260, // °C/s
  coolRate: 130, // °C/s
  brazeTemp: 700, // °C, température de brasage
  oxideFrom: 200, // °C, le cuivre s'oxyde au-dessus de cette température
  oxideRate: 26, // % par seconde, sans azote
  safeTemp: 150, // °C, on peut contrôler le joint
};

const TEXT = {
  fr: {
    title: "Balayage d'azote",
    pageTitle: "Brasage sous azote : exercice sur le balayage",
    hint: "Azote d'abord, braser, azote jusqu'au refroidissement",
    buttons: { n2On: "Ouvrir l'azote", n2Off: "Couper l'azote", lightOn: "Allumer et braser", lightOff: "Éteindre le chalumeau", check: "Couper le joint et contrôler", again: "Recommencer" },
    keys: [
      { mark: "lit", label: "Intérieur du tube, vu par la fenêtre de coupe" },
      { mark: "raised", label: "Bouteille d'azote, manodétendeur, tube et chalumeau" },
      { mark: "dashed", label: "Azote qui balaye le tube" },
    ],
    caption: "Le filet d'azote chasse l'oxygène du tube. Il faut le lancer avant toute chauffe, le temps que l'air soit chassé, et le maintenir jusqu'au refroidissement du joint. L'extrémité du tube reste ouverte : c'est un balayage à faible débit, environ 6 l/min, et non une mise en pression. Si le cuivre dépasse quelques centaines de degrés en présence d'oxygène, une couche noire de calamine se forme à l'intérieur ; elle se détache ensuite et perturbe les détendeurs. Le temps de la figure est accéléré.",
    stageLabel: "Bouteille d'azote avec manodétendeur, flexible, tube à braser ouvert à son autre extrémité, avec une fenêtre sur l'intérieur du tube, et chalumeau. Lancez l'azote, brasez, éteignez, laissez refroidir, puis contrôlez le joint.",
    svgLabel: "Banc de brasage : bouteille d'azote, manodétendeur, flexible, tube sur supports avec fenêtre de coupe, chalumeau.",
    read: (n2, temp, oxide) => `azote ${n2 ? "ouvert" : "fermé"} · joint ${Math.round(temp)} °C · calamine ${Math.round(oxide)} %`,
    feedback: {
      start: "Préparez le balayage, puis brasez. Regardez la fenêtre sur l'intérieur du tube.",
      purging: "Azote ouvert : l'air est en train d'être chassé du tube. Laissez-le passer avant de chauffer.",
      tooEarly: "L'azote n'a pas encore chassé l'air : le cuivre commence à s'oxyder. Il fallait patienter avant de chauffer.",
      noN2: "Vous chauffez sans azote : la calamine se forme à l'intérieur du tube.",
      brazing: "Brasage sous balayage d'azote. Éteignez une fois le joint réalisé, sans couper l'azote.",
      cooling: "Chalumeau éteint. Gardez l'azote ouvert jusqu'au refroidissement du joint.",
      cutHot: "Azote coupé alors que le joint est encore chaud : la calamine se forme au refroidissement.",
      notCool: "Le joint est encore trop chaud pour être contrôlé.",
      notBrazed: "Brasez d'abord le joint avant de le contrôler.",
      good: "Joint propre : le balayage a été lancé avant la chauffe et maintenu jusqu'au refroidissement.",
      bad: (o) => `Calamine à l'intérieur du tube (${Math.round(o)} %) : ce joint partirait en particules dans le circuit. Recommencez.`,
    },
    score: (good, total) => `Score : ${good} / ${total}`,
  },
  en: {
    title: "Nitrogen purge",
    pageTitle: "Brazing under nitrogen: a purge exercise",
    hint: "Nitrogen first, braze, nitrogen until cool",
    buttons: { n2On: "Open the nitrogen", n2Off: "Shut the nitrogen", lightOn: "Light and braze", lightOff: "Put out the torch", check: "Cut the joint and check", again: "Start again" },
    keys: [
      { mark: "lit", label: "Inside of the tube, seen through the cutaway window" },
      { mark: "raised", label: "Nitrogen cylinder, regulator, tube and torch" },
      { mark: "dashed", label: "Nitrogen purging the tube" },
    ],
    caption: "The trickle of nitrogen drives oxygen out of the tube. It must be started before any heating, long enough to drive out the air, and kept up until the joint has cooled. The end of the tube stays open: this is a low-flow purge, about 6 l/min, not a pressurisation. If the copper goes above a few hundred degrees with oxygen present, a black layer of scale forms inside; it later comes off and disturbs expansion valves. Time in the figure is speeded up.",
    stageLabel: "Nitrogen cylinder with regulator, hose, tube to be brazed open at its far end with a window showing the inside of the tube, and a torch. Start the nitrogen, braze, put out the torch, let it cool, then check the joint.",
    svgLabel: "Brazing bench: nitrogen cylinder, regulator, hose, tube on stands with a cutaway window, torch.",
    read: (n2, temp, oxide) => `nitrogen ${n2 ? "open" : "shut"} · joint ${Math.round(temp)} °C · scale ${Math.round(oxide)} %`,
    feedback: {
      start: "Set up the purge, then braze. Watch the window on the inside of the tube.",
      purging: "Nitrogen open: the air is being driven out of the tube. Let it flow before heating.",
      tooEarly: "The nitrogen has not yet driven out the air: the copper is starting to oxidise. You should have waited before heating.",
      noN2: "You are heating without nitrogen: scale is forming inside the tube.",
      brazing: "Brazing under a nitrogen purge. Put out the torch once the joint is made, without shutting the nitrogen.",
      cooling: "Torch out. Keep the nitrogen open until the joint has cooled.",
      cutHot: "Nitrogen shut while the joint is still hot: scale forms as it cools.",
      notCool: "The joint is still too hot to check.",
      notBrazed: "Braze the joint before checking it.",
      good: "Clean joint: the purge was started before heating and kept up until the joint cooled.",
      bad: (o) => `Scale inside the tube (${Math.round(o)} %): this joint would shed particles into the circuit. Start again.`,
    },
    score: (good, total) => `Score: ${good} / ${total}`,
  },
};

const AZ = 28, WIDTH = 680, HEIGHT = 420;
const PLATE = { x: -74, y: -196, w: 158, d: 392, r: 8 };
const PLATE_H = 10, FOOT_H = 5;
const CYL = { x: -36, y: 138, r: 24, h: 142 };
const TUBE_Z = 46, TUBE_R = 9, TUBE_Y0 = 62, TUBE_Y1 = -160, TUBE_X = 18;
const JOINT_Y = -30;
const WIN = { y0: -70, y1: 6 };
const AXIS_TUBE = G.frameOf([TUBE_X, TUBE_Y0, TUBE_Z], [0, -1, 0], [1, 0, 0], [0, 0, 1]);

function buildFigure(lang) {
  const T = TEXT[lang];
  const P = k.fitProjection([...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [CYL.x, CYL.y, CYL.h + 30], [TUBE_X, TUBE_Y1, TUBE_Z + 40]], WIDTH, HEIGHT, { pad: 14, azimuth: AZ, elevation: 34 });
  const at = (p) => k.iso(p, P);
  const S = (paths, style) => k.solidSvg(paths, style);
  const L = (d, style) => k.lineSvg(d, style);
  const D = (pts, style) => k.dotsSvg(pts, style);
  const depth = (x, y, z = 0) => k.depthOf([x, y, z], P);

  function plate() {
    const o = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
    for (const [x, y] of k.corners(PLATE, 24).sort((a, b) => depth(...a) - depth(...b))) {
      o.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
      o.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
    }
    o.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid", inner: L(k.sideSeam(PLATE, -4, P, 8), { tone: "faint" }) }));
    o.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
    const screws = k.corners(PLATE, 10);
    o.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
    o.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
    return o.join("");
  }

  function cylinder() {
    const c = { x: CYL.x - CYL.r, y: CYL.y - CYL.r, w: CYL.r * 2, d: CYL.r * 2, r: CYL.r };
    const o = [`<path class="iso-halo" d="${k.haloOf(c, 0, CYL.h, P)}"/>`];
    const F = G.frameOf([CYL.x, CYL.y, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
    o.push(S(G.solidOf([[0, 0], [0, CYL.r, 1], [3, CYL.r], [CYL.h - 20, CYL.r], [CYL.h - 6, 16, 1], [CYL.h, 9, 1], [CYL.h, 0]], F, P), { tone: "hi", inner: L(G.arcOf(F, 16, CYL.r, P) + G.arcOf(F, CYL.h - 26, CYL.r, P), { tone: "faint" }) }));
    o.push(S(k.cylinder(CYL.x, CYL.y, 5, CYL.h, 8, P, 20, 0.3), { tone: "mid" }));
    // manodétendeur
    o.push(S(k.cylinder(CYL.x, CYL.y, 9, CYL.h + 8, 10, P, 28, 0.6), { tone: "lo" }));
    o.push(S(k.cylinder(CYL.x, CYL.y, 6, CYL.h + 18, 6, P, 24, 0.4), { tone: "mid" }));
    o.push(L(k.ring(CYL.x, CYL.y, 3, CYL.h + 24, P, 16), { tone: "lo" }));
    o.push(`<g class="bz-tap" data-closed>${S(k.cylinder(CYL.x, CYL.y, 2.2, CYL.h + 24, 2, P, 14), { tone: "hi", lit: true })}</g>`);
    return o.join("");
  }

  const bezier = (a, b, c, d, n = 30) => Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n, u = 1 - t;
    return [0, 1, 2].map((j) => u * u * u * a[j] + 3 * u * u * t * b[j] + 3 * u * t * t * c[j] + t * t * t * d[j]);
  });

  function hose() {
    const a = [CYL.x + 9, CYL.y, CYL.h + 13], d = [TUBE_X, TUBE_Y0 + 0.5, TUBE_Z];
    const pts = bezier(a, [a[0] + 30, a[1], a[2] - 20], [d[0], d[1] + 50, d[2] - 34], d);
    const e = at(a);
    return `<g class="bz-hose">${L(k.pathOf(pts.map(at)), { tone: "mid" })}<circle class="iso-wire-end" cx="${e[0].toFixed(1)}" cy="${e[1].toFixed(1)}" r="1.6"/></g>`;
  }

  function tube() {
    const o = [];
    for (const y of [TUBE_Y0 - 20, TUBE_Y1 + 26]) {
      o.push(S(k.slabOf({ x: TUBE_X - 15, y: y - 6, w: 30, d: 12, r: 2 }, 0, 4, P, 2, 0.5), { tone: "lo" }));
      o.push(S(k.slabOf({ x: TUBE_X - 4, y: y - 3, w: 8, d: 6, r: 1 }, 4, TUBE_Z - TUBE_R - 4, P, 2, 0.4), { tone: "mid" }));
    }
    const len = TUBE_Y0 - TUBE_Y1;
    o.push(S(G.solidOf([[0, 0], [0, TUBE_R], [len, TUBE_R], [len, 0]], AXIS_TUBE, P), { tone: "hi", inner: L(G.arcOf(AXIS_TUBE, TUBE_Y0 - JOINT_Y - 14, TUBE_R, P) + G.arcOf(AXIS_TUBE, TUBE_Y0 - JOINT_Y + 14, TUBE_R, P), { tone: "lo" }) }));
    // manchon et fenêtre de coupe, sur le dessus du tube
    const ring = (s) => G.arcOf(AXIS_TUBE, s, TUBE_R + 0.1, P);
    o.push(S(G.solidOf([[TUBE_Y0 - JOINT_Y - 12, 0], [TUBE_Y0 - JOINT_Y - 12, TUBE_R + 2.6], [TUBE_Y0 - JOINT_Y + 12, TUBE_R + 2.6], [TUBE_Y0 - JOINT_Y + 12, 0]], AXIS_TUBE, P), { tone: "mid" }));
    void ring;
    const windowD = k.pathOf([[TUBE_X + TUBE_R, WIN.y1, TUBE_Z - 5], [TUBE_X + TUBE_R, WIN.y0, TUBE_Z - 5], [TUBE_X + TUBE_R, WIN.y0, TUBE_Z + 5], [TUBE_X + TUBE_R, WIN.y1, TUBE_Z + 5]].map(at), true);
    o.push(`<path class="bz-inside" d="${windowD}"/>`);
    o.push(`<path class="bz-oxide" d="${windowD}"/>`);
    o.push(L(windowD, { tone: "mid" }));
    // sortie ouverte
    const s = at([TUBE_X, TUBE_Y1 - 2, TUBE_Z]);
    o.push(`<g class="bz-gas">${[0, 1, 2].map((i) => `<circle cx="${(s[0] + 8 + i * 9).toFixed(1)}" cy="${(s[1] + 3 + i * 4).toFixed(1)}" r="${2.2 - i * 0.5}"/>`).join("")}</g>`);
    return o.join("");
  }

  // support arrière du chalumeau, dessiné avant le tube
  const POST = { x: -44, y: JOINT_Y - 7, w: 12, d: 14, r: 2 };
  const ARM_Z = 104;
  function post() {
    return S(k.slabOf({ x: POST.x - 6, y: POST.y - 6, w: 24, d: 26, r: 2 }, 0, 4, P, 2, 0.5), { tone: "lo" }) +
      S(k.slabOf(POST, 4, ARM_Z - 4, P, 2, 0.6), { tone: "mid" });
  }
  function torch() {
    const o = [];
    const x = TUBE_X + 3, top = TUBE_Z + TUBE_R + 22;
    o.push(S(k.slabOf({ x: POST.x, y: JOINT_Y - 4, w: x - POST.x + 6, d: 8, r: 1 }, ARM_Z, 6, P, 2, 0.4), { tone: "lo" }));
    o.push(S(k.cylinder(x, JOINT_Y, 2, top - 6, ARM_Z - top + 6, P, 16, 0.2), { tone: "hi" }));
    o.push(S(k.cylinder(x, JOINT_Y, 4, top + 18, 26, P, 24, 0.5), { tone: "mid" }));
    const b = [x, JOINT_Y, top - 6];
    o.push(`<g class="bz-torch" data-off><path class="bz-flame" d="${k.pathOf([b, [b[0] - 3, b[1], b[2] - 7], [b[0], b[1], b[2] - 12], [b[0] + 3, b[1], b[2] - 7]].map(at), true)}"/></g>`);
    return o.join("");
  }

  const body = [plate(), cylinder(), post(), hose(), tube(), torch()];
  const svg = k.figureSvg({ width: WIDTH, height: HEIGHT, label: T.svgLabel, body });
  return { svg, config: { lang, model: MODEL } };
}

const CSS = `
.iso{--bz-inside:#d98b5a;--bz-oxide:#1a1a1a;--bz-flame:#6aa8f0}
.iso[data-theme="light"]{--bz-inside:#d98b5a;--bz-oxide:#232323;--bz-flame:#1f5fae}
.bz-inside{fill:var(--bz-inside)}
.bz-oxide{fill:var(--bz-oxide);opacity:0}
.bz-flame{fill:var(--bz-flame);opacity:.8}
.bz-torch[data-off]{opacity:0}
.bz-tap[data-closed]{opacity:.25}
.bz-hose .iso-line{stroke-width:2.6;stroke:var(--anatomy-mid)}
.bz-hose[data-live] .iso-line{stroke-dasharray:3 4;animation:iso-flow 1600ms linear infinite}
.bz-gas{fill:var(--anatomy-mid);opacity:0}
.bz-gas[data-live]{opacity:.6}
.iso-stage{touch-action:manipulation}
.iso-plate-corner[data-corner="hint"]{top:20px;bottom:auto;right:0;white-space:normal;line-height:1.35}
.iso-plate-corner[data-corner="readout"]{left:0;white-space:normal;text-align:right;line-height:1.4}
.iso-plate{padding-top:80px}
.mv-controls{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}
.mv-controls button{font:12px/1.2 var(--anatomy-mono);letter-spacing:.04em;color:var(--anatomy-strong);background:var(--anatomy-card);border:1px solid var(--anatomy-mid);border-radius:999px;padding:12px 14px;min-height:44px;cursor:pointer}
.mv-controls button:focus-visible{outline:2px solid var(--anatomy-hi);outline-offset:2px}
.mv-controls button:disabled{opacity:.45;cursor:default}
.mv-feedback{margin:12px 0 0;min-height:3em;color:var(--anatomy-text);font-size:13px;line-height:1.55}
.mv-score{color:var(--anatomy-muted);font:11px/1 var(--anatomy-mono);margin-top:6px}
@media (prefers-reduced-motion:reduce){.bz-hose[data-live] .iso-line{animation:none}}
@media (max-width:560px){.iso-plate{padding:76px 12px 64px}.mv-controls button{flex:1 1 40%}}
`;

const LIVE = `
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
`;

const site = { fragments: {}, scripts: {} };
const written = [];
for (const lang of ["fr", "en"]) {
  const T = TEXT[lang], B = T.buttons;
  const { svg, config } = buildFigure(lang);
  const controls = `<div class="mv-controls" role="group" aria-label="${lang === "fr" ? "Commandes du brasage" : "Brazing controls"}"><button type="button" data-act="n2" aria-pressed="false">${B.n2On}</button><button type="button" data-act="torch" aria-pressed="false">${B.lightOn}</button><button type="button" data-act="check">${B.check}</button><button type="button" data-act="again">${B.again}</button></div><p class="mv-feedback" aria-live="polite"></p><p class="mv-score" aria-live="polite"></p>`;
  const plate = k.plateHtml({ fig: "Fig 11", title: T.title, hint: T.hint, readout: "", keys: T.keys, caption: T.caption, body: `<div class="iso-stage" role="img" aria-label="${T.stageLabel}">${svg}</div>${controls}` });
  const f = T.feedback;
  const plain = ["start", "purging", "tooEarly", "noN2", "brazing", "cooling", "cutHot", "notCool", "notBrazed", "good"].map((key) => `${key}:${JSON.stringify(f[key])}`).join(",");
  const TX = `{buttons:${JSON.stringify(T.buttons)},read:${T.read},score:${T.score},feedback:{${plain},bad:${f.bad}}}`;
  const pageScript = `const FIG = ${JSON.stringify(config)};\nconst TX = ${TX};\n` + LIVE;
  site.fragments[lang] = plate; site.scripts[lang] = pageScript;
  for (const theme of ["dark", "light"]) {
    const name = `brasage-azote.${lang}${theme === "light" ? "-light" : ""}.html`;
    writeFileSync(join(HERE, name), k.pageHtml({ title: T.pageTitle, theme, body: `<style>${CSS}</style>${plate}`, script: KIT_SOURCE + pageScript, width: 760 }).replace('<html lang="en">', `<html lang="${lang}">`));
    written.push(name);
  }
}
written.push(...publish("brasage-azote", { ...site, css: CSS }));
console.log("wrote", written.join(", "));
