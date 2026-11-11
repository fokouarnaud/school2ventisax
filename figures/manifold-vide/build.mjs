// Figure interactive d'évaluation (skill anatomy) : tirage au vide et diagnostic de la tenue du vide.
// Partie 4, module 15 (imprimé 34), section « Mode opératoire du tirage au vide ».
// Usage : node figures/manifold-vide/build.mjs   (fr + en, sombre + clair)
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../_kit/iso-kit.mjs";
import * as G from "../_kit/lathe.mjs";
import { publish } from "../_kit/publish.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const KIT_SOURCE = readFileSync(join(HERE, "..", "_kit", "iso-kit.mjs"), "utf8").replace(/^export /gm, "");

// ---------------------------------------------------------------- modèle : la règle du cours, en temps accéléré
const MODEL = {
  atm: 1013, // mbar absolus
  target: 1, // valeur visée au vacuomètre
  floor: 0.5, // vide limite de la pompe
  scenarios: {
    dry: { tau: 0.8, holdTo: 0.15, holdTau: 2 }, // étanche et sec : presque aucune remontée
    wet: { tau: 1.1, holdTo: 6, holdTau: 1.4 }, // humidité : monte puis se stabilise
    leak: { tau: 0.9, holdRate: 4 }, // fuite : monte sans s'arrêter
  },
};

// ---------------------------------------------------------------- textes
const TEXT = {
  fr: {
    title: "Tenue du vide",
    pageTitle: "Tirage au vide et tenue du vide : exercice au vacuomètre",
    hint: "Tirer jusqu'au repère, isoler, puis diagnostiquer",
    buttons: { pumpOn: "Démarrer la pompe", pumpOff: "Arrêter la pompe", open: "Ouvrir les bypass", close: "Refermer les bypass", dry: "Sec et étanche", wet: "Humidité", leak: "Fuite", next: "Nouveau circuit" },
    keys: [
      { mark: "lit", label: "Aiguille repère du vacuomètre : 1 mbar, la valeur visée" },
      { mark: "raised", label: "Jeu de manifolds (BP, Vac, HP), pompe à vide et circuit" },
      { mark: "dashed", label: "Flexible en dépression" },
    ],
    caption: "Le manomètre de manifold indique une pression relative : dès que le circuit est proche du vide, son aiguille reste à -1 bar, que la pression absolue soit de 50 mbar ou de 1 mbar. Seul le vacuomètre, en pression absolue et à échelle logarithmique, montre le vide réellement atteint. Une fois sous l'aiguille repère, on referme les bypass et on observe : la pression presque immobile indique un circuit sec et étanche ; une montée qui se stabilise indique de l'humidité, il faut poursuivre le tirage ; une montée sans arrêt indique une fuite, il faut la rechercher. Le temps de la figure est très accéléré.",
    stageLabel: "Banc de tirage au vide : un jeu de manifolds avec manomètres BP et HP et vacuomètre, une pompe à vide et un circuit frigorifique reliés par des flexibles. Démarrez la pompe, ouvrez les bypass, tirez jusqu'à l'aiguille repère, refermez les bypass, puis diagnostiquez la tenue du vide.",
    svgLabel: "Jeu de manifolds à trois cadrans et trois boutons, pompe à vide avec voyant d'huile, bouteille de circuit frigorifique et ses vannes, reliés par trois flexibles.",
    read: (rel, p) => `manifold ${fmt(rel, 1)} bar · vacuomètre ${fmt(p)} mbar abs`,
    feedback: {
      start: "Démarrez la pompe, puis ouvrez les bypass. Regardez les deux instruments : le manifold arrive vite à -1 bar, le vacuomètre continue de descendre.",
      needPump: "La pompe est à l'arrêt : démarrez-la avant d'ouvrir les bypass.",
      pulling: "Tirage en cours. Le manifold est vite à -1 bar, mais seul le vacuomètre dit si l'aiguille repère est atteinte.",
      backflow: "Il fallait refermer les bypass avant d'arrêter la pompe : le circuit reprend de l'air par la pompe.",
      tooSoon: (p) => `Le vacuomètre indique ${fmt(p)} mbar, au-dessus du repère de 1 mbar : rouvrez les bypass et poursuivez le tirage, même si le manifold est à -1 bar.`,
      hold: "Bypass refermés, pompe isolée. Observez le vacuomètre quelques secondes, puis donnez votre diagnostic.",
      noHold: "Tirez d'abord sous l'aiguille repère, puis refermez les bypass pour observer la tenue du vide.",
      good: { dry: "Juste. La pression bouge à peine : le circuit est sec et étanche, on peut réaliser la charge.", wet: "Juste. La pression monte puis se stabilise : il reste de l'humidité, on poursuit le tirage, avec une casse à l'azote si possible.", leak: "Juste. La pression monte sans s'arrêter : il y a une fuite, on la recherche avant de continuer." },
      bad: { dry: "Faux. Ce circuit était sec et étanche : la pression ne bougeait presque pas.", wet: "Faux. La pression montait puis se stabilisait : c'est de l'humidité restante.", leak: "Faux. La pression montait sans s'arrêter : c'est une fuite." },
    },
    score: (good, total) => `Score : ${good} / ${total}`,
  },
  en: {
    title: "Vacuum hold",
    pageTitle: "Evacuation and vacuum hold: a vacuum gauge exercise",
    hint: "Pull down to the reference, isolate, then diagnose",
    buttons: { pumpOn: "Start the pump", pumpOff: "Stop the pump", open: "Open the bypass valves", close: "Close the bypass valves", dry: "Dry and tight", wet: "Moisture", leak: "Leak", next: "New circuit" },
    keys: [
      { mark: "lit", label: "Vacuum gauge reference needle: 1 mbar, the target value" },
      { mark: "raised", label: "Manifold gauge set (BP, Vac, HP), vacuum pump and circuit" },
      { mark: "dashed", label: "Hose under vacuum" },
    ],
    caption: "A manifold gauge shows relative pressure: once the circuit is close to vacuum its needle stays at -1 bar, whether the absolute pressure is 50 mbar or 1 mbar. Only the vacuum gauge, in absolute pressure on a logarithmic scale, shows the vacuum really reached. Once below the reference needle, close the bypass valves and watch: a pressure that hardly moves means a dry, tight circuit; a rise that settles means moisture, so continue the evacuation; a rise that never stops means a leak, which must be found. Time in the figure is greatly speeded up.",
    stageLabel: "Evacuation bench: a manifold gauge set with BP and HP gauges and a vacuum gauge, a vacuum pump and a refrigeration circuit joined by hoses. Start the pump, open the bypass valves, pull down to the reference needle, close the bypass valves, then diagnose the vacuum hold.",
    svgLabel: "Three-dial manifold gauge set with three knobs, vacuum pump with oil sight glass, refrigeration circuit receiver and its valves, joined by three hoses.",
    read: (rel, p) => `manifold ${fmt(rel, 1)} bar · vacuum gauge ${fmt(p)} mbar abs`,
    feedback: {
      start: "Start the pump, then open the bypass valves. Watch both instruments: the manifold quickly reaches -1 bar, the vacuum gauge keeps falling.",
      needPump: "The pump is stopped: start it before opening the bypass valves.",
      pulling: "Evacuation in progress. The manifold is soon at -1 bar, but only the vacuum gauge shows whether the reference needle is reached.",
      backflow: "The bypass valves had to be closed before stopping the pump: the circuit is drawing air back through the pump.",
      tooSoon: (p) => `The vacuum gauge reads ${fmt(p)} mbar, above the 1 mbar reference: reopen the bypass valves and continue the evacuation, even if the manifold shows -1 bar.`,
      hold: "Bypass valves closed, pump isolated. Watch the vacuum gauge for a few seconds, then give your diagnosis.",
      noHold: "First pull down below the reference needle, then close the bypass valves to watch the vacuum hold.",
      good: { dry: "Correct. The pressure hardly moves: the circuit is dry and tight, and can be charged.", wet: "Correct. The pressure rises then settles: moisture remains, so continue the evacuation, with a nitrogen break if possible.", leak: "Correct. The pressure keeps rising: there is a leak, which must be found before continuing." },
      bad: { dry: "Wrong. This circuit was dry and tight: the pressure hardly moved.", wet: "Wrong. The pressure rose then settled: that is remaining moisture.", leak: "Wrong. The pressure kept rising: that is a leak." },
    },
    score: (good, total) => `Score: ${good} / ${total}`,
  },
};

// ---------------------------------------------------------------- géométrie (az 28° : l'axe y est horizontal à l'écran, y grand à gauche)
const AZ = 28;
const WIDTH = 680;
const HEIGHT = 470;
const PLATE = { x: -96, y: -176, w: 220, d: 352, r: 8 };
const PLATE_H = 10;
const FOOT_H = 5;

const PANEL = { x: -84, y: -116, w: 18, d: 232, r: 3 };
const PANEL_H = 112;
const FX = PANEL.x + PANEL.w; // face avant du jeu de manifolds
const DIAL_Z = 76;
const DIAL_R = 25;
const KNOB_Z = 32;
const PORT_Z = 12;
const COLS = { bp: 74, vac: 0, hp: -74 }; // bp à gauche à l'écran

const CZ = 30; // axe de la pompe et de la bouteille
const AX = 58; // x des axes
const RES = { x: 36, y: -158, w: 44, d: 44, r: 4 }; // réservoir d'huile de la pompe
const RES_Z = 6;
const RES_H = 46;
const INLET = { x: AX, y: -136 };
const MOTOR_Y = -112;
const MOTOR_L = 60;
const MOTOR_R = 22;
const TANK_Y = 52;
const TANK_L = 92;
const TANK_R = 18;
const VALVES = { hp: 74, bp: 122 };
const VALVE_Z = CZ + TANK_R + 16;

const AXIS = (y, z = CZ) => G.frameOf([AX, y, z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
const FRONT = (y, z) => G.frameOf([FX, y, z], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
const angleOf = (f) => Math.PI * (1.25 - 1.5 * f);
const fRel = (bar) => Math.min(1, Math.max(0, (bar + 1) / 4)); // manifold : de -1 à +3 bar relatifs
const fVac = (p) => Math.min(1, Math.max(0, (Math.log10(Math.max(p, 0.1)) + 1) / 4)); // vacuomètre : de 0,1 à 1000 mbar

function buildFigure(lang) {
  const T = TEXT[lang];
  const P = k.fitProjection(
    [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [PANEL.x, PANEL.y, PANEL_H], [PANEL.x, PANEL.y + PANEL.d, PANEL_H], [AX, VALVES.bp, VALVE_Z + 16]],
    WIDTH, HEIGHT, { pad: 14, azimuth: AZ, elevation: 38 },
  );
  const at = (p) => k.iso(p, P);
  const S = (paths, style) => k.solidSvg(paths, style);
  const L = (d, style) => k.lineSvg(d, style);
  const D = (pts, style) => k.dotsSvg(pts, style);
  const depth = (x, y, z = 0) => k.depthOf([x, y, z], P);
  const onFace = (y, z) => at([FX, y, z]);
  const faceText = (y, z, s, size, tone) => k.faceTextSvg(k.sideMatrix([FX + 0.1, y], z, P, "right"), s, { size, tone, anchor: "middle" });

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
    const strip = { x: PLATE.x + PLATE.w - 13, y: -92, w: 6, d: 184, r: 1 };
    o.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
    const t = k.topTicks(strip.y + 4, strip.y + strip.d - 4, 4, 5, strip.x + 0.8, 0.6, [1.8, 3.4], P, "y");
    o.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
    return o.join("");
  }

  function dial(key, y, ticksText) {
    const o = [];
    const ring = (r) => k.sideRing([FX, y, DIAL_Z], r, "x", P, 56);
    o.push(`<path class="mv-face" d="${ring(DIAL_R)}"/>`);
    o.push(L(ring(DIAL_R) + ring(DIAL_R + 2.4), { tone: "mid" }));
    const pt = (a, r) => onFace(y - Math.cos(a) * r, DIAL_Z + Math.sin(a) * r);
    const ticks = [];
    for (let i = 0; i <= 20; i++) {
      const a = angleOf(i / 20);
      ticks.push(k.pathOf([pt(a, DIAL_R - (i % 5 === 0 ? 4 : 2.2)), pt(a, DIAL_R)]));
    }
    o.push(L(ticks.join(""), { tone: "lo" }));
    for (const [label, f] of ticksText) {
      const a = angleOf(f);
      const r = DIAL_R - 8;
      o.push(faceText(y - Math.cos(a) * r, DIAL_Z + Math.sin(a) * r - 1, label, 3, "lo"));
    }
    o.push(faceText(y, DIAL_Z - 12, key === "vac" ? "Vac" : key.toUpperCase(), 4.6, "hi"));
    o.push(faceText(y, DIAL_Z - 18, key === "vac" ? "mbar" : "bar", 2.8, "lo"));
    if (key === "vac") {
      const a = angleOf(fVac(MODEL.target));
      o.push(`<path class="iso-line" data-tone="lit" data-free="both" d="${k.pathOf([pt(a, 7), pt(a, DIAL_R - 1.5)])}"/>`);
    }
    o.push(`<path class="iso-line mv-needle" data-tone="hi" data-free="both" data-dial="${key}" d=""/>`);
    o.push(D([onFace(y, DIAL_Z)], { size: 1, tone: "hi" }));
    return o.join("");
  }

  function knob(key, y) {
    const F = FRONT(y, KNOB_Z);
    const o = [S(G.disc(0, 1.8, 9.5, F, P, { steps: 40 }), { tone: "lo" }) + S(G.disc(1.8, 7, 6.2, F, P, { steps: 28, bevel: 0.4 }), { tone: "mid" })];
    o.push(D(G.dotsOf(F, 1.8, 8, 6, P, { all: true }), { size: 0.5, tone: "mid" }));
    o.push(`<path class="iso-line mv-knob" data-tone="hi" data-free="both" data-knob="${key}" d=""/>`);
    return o.join("");
  }

  function panel() {
    const o = [`<path class="iso-halo" d="${k.haloOf(PANEL, 0, PANEL_H, P)}"/>`];
    o.push(S(k.slabOf(PANEL, 0, PANEL_H, P, 4, 1), { tone: "mid", inner: L(k.sideSeam(PANEL, 8, P, 4) + k.sideSeam(PANEL, PANEL_H - 8, P, 4), { tone: "faint" }) }));
    o.push(D(k.corners(PANEL, 3).map(([x, y]) => at([x, y, PANEL_H])), { size: 0.5 }));
    const rel = [["-1", 0], ["0", 0.25], ["1", 0.5], ["3", 1]];
    const vac = [[lang === "fr" ? "0,1" : "0.1", 0], ["1", 0.25], ["10", 0.5], ["100", 0.75], ["1000", 1]];
    o.push(dial("bp", COLS.bp, rel), dial("vac", COLS.vac, vac), dial("hp", COLS.hp, rel));
    for (const key of ["bp", "vac", "hp"]) o.push(knob(key, COLS[key]));
    // raccords de flexibles, sur la face avant
    for (const key of ["bp", "vac", "hp"]) {
      o.push(S(G.disc(0, 5, 3.4, FRONT(COLS[key], PORT_Z), P, { steps: 20 }), { tone: "hi" }));
    }
    return o.join("");
  }

  function pump() {
    const o = [`<path class="iso-halo" d="${k.haloOf({ x: AX - 26, y: RES.y, w: 52, d: 112, r: 6 }, 0, 40, P)}"/>`];
    // patin et réservoir d'huile
    o.push(S(k.slabOf({ x: AX - 26, y: RES.y - 2, w: 52, d: 116, r: 3 }, 0, RES_Z, P, 3, 0.6), { tone: "lo" }));
    o.push(S(k.slabOf(RES, RES_Z, RES_H, P, 3, 1), { tone: "mid", inner: L(k.sideSeam(RES, RES_Z + 6, P, 3), { tone: "faint" }) }));
    o.push(D(k.corners(RES, 3).map(([x, y]) => at([x, y, RES_Z + RES_H])), { size: 0.5 }));
    // voyant d'huile (face +x) et voyant de marche
    const fx = RES.x + RES.w + 0.2;
    const rect = (y0, y1, z0, z1) => k.pathOf([[fx, y0, z0], [fx, y1, z0], [fx, y1, z1], [fx, y0, z1]].map(at), true);
    o.push(`<path class="mv-face" d="${rect(-150, -130, 12, 32)}"/>`);
    o.push(`<path class="mv-oil" d="${rect(-150, -130, 12, 22)}"/>`);
    o.push(L(rect(-150, -130, 12, 32), { tone: "mid" }));
    o.push(L(k.pathOf([[fx, -150, 22], [fx, -130, 22]].map(at)), { tone: "lo" }));
    const LF = G.frameOf([fx - 0.2, -122, 42], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
    o.push(S(G.disc(0, 1.6, 4.2, LF, P, { steps: 24 }), { tone: "lo" }));
    o.push(`<g class="mv-lamp">${S(G.disc(1.6, 2.6, 3, LF, P, { steps: 20 }), { tone: "hi", lit: true })}</g>`);
    // orifice d'aspiration
    o.push(S(k.cylinder(INLET.x, INLET.y, 8, RES_Z + RES_H, 3, P, 24, 0.4), { tone: "lo" }));
    o.push(S(k.cylinder(INLET.x, INLET.y, 4.6, RES_Z + RES_H + 3, 8, P, 20, 0.3), { tone: "hi" }));
    // moteur : berceau, carcasse à ailettes, flasques, capot de ventilateur
    for (const y of [MOTOR_Y + 8, MOTOR_Y + MOTOR_L - 16]) {
      o.push(S(k.slabOf({ x: AX - 16, y, w: 32, d: 8, r: 1 }, RES_Z, CZ - MOTOR_R + 4 - RES_Z, P, 2, 0.5), { tone: "lo" }));
    }
    const F = AXIS(MOTOR_Y);
    const body = G.solidOf([[0, 0], [0, 18], [4, MOTOR_R], [MOTOR_L - 4, MOTOR_R], [MOTOR_L, 18], [MOTOR_L, 0]], F, P);
    o.push(S(body, { tone: "mid", inner: k.fadedSvg(G.ribsOf(F, 6, MOTOR_L - 6, MOTOR_R + 0.2, 30, P, { fade: [0.06, 0.4], seams: true }), { tone: "lo" }) }));
    o.push(S(G.solidOf([[MOTOR_L, 0], [MOTOR_L, 19, 1], [MOTOR_L + 12, 19], [MOTOR_L + 12, 0]], F, P), { tone: "lo" }));
    o.push(S(G.disc(MOTOR_L + 12, MOTOR_L + 15, 14, F, P, { steps: 44, bevel: 0.4 }), { tone: "mid" }));
    o.push(D(G.dotsOf(F, MOTOR_L + 15, 11, 6, P, { all: true }), { size: 0.5, tone: "lo" }));
    o.push(`<path class="iso-line mv-mark" data-tone="lit" data-free="both" d=""/>`);
    return o.join("");
  }

  function circuit() {
    const o = [`<path class="iso-halo" d="${k.haloOf({ x: AX - 24, y: TANK_Y, w: 48, d: TANK_L, r: 6 }, 0, 30, P)}"/>`];
    // échangeur à ailettes, derrière la bouteille
    const coil = { x: 6, y: TANK_Y + 6, w: 14, d: TANK_L - 12, r: 1.5 };
    o.push(S(k.slabOf(coil, 0, 58, P, 3, 0.6), { tone: "lo" }));
    const ft = k.topTicks(coil.y + 2, coil.y + coil.d - 2, 3, 5, coil.x, 58, [14, 14], P, "y");
    o.push(L(ft.minor, { tone: "faint" }), L(ft.major, { tone: "faint" }));
    // berceaux et bouteille
    for (const y of [TANK_Y + 14, TANK_Y + TANK_L - 22]) {
      o.push(S(k.slabOf({ x: AX - 15, y, w: 30, d: 8, r: 1 }, 0, CZ - TANK_R + 6, P, 2, 0.5), { tone: "lo" }));
    }
    const F = AXIS(TANK_Y);
    const L0 = TANK_L;
    o.push(S(G.solidOf([[0, 0], [0, 9, 1], [3, 15, 1], [8, TANK_R], [L0 - 8, TANK_R], [L0 - 3, 15, 1], [L0, 9, 1], [L0, 0]], F, P), { tone: "hi", inner: L(G.arcOf(F, 12, TANK_R, P) + G.arcOf(F, L0 - 12, TANK_R, P), { tone: "faint" }) }));
    // vannes de service sur le dessus
    for (const key of ["hp", "bp"]) {
      const y = VALVES[key];
      o.push(S(k.cylinder(AX, y, 6, CZ + TANK_R - 1, 3, P, 24, 0.4), { tone: "lo" }));
      o.push(S(k.cylinder(AX, y, 3.6, CZ + TANK_R + 2, 10, P, 20, 0.3), { tone: "mid" }));
      o.push(S(k.cylinder(AX, y, 6.4, VALVE_Z - 4, 4, P, 28, 0.4) , { tone: "mid" }));
      o.push(S(k.cylinder(AX, y, 3.4, VALVE_Z, 5, P, 20, 0.3), { tone: "hi" }));
    }
    return o.join("");
  }

  const bezier = (a, b, c, d, n = 32) => Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n, u = 1 - t;
    return [0, 1, 2].map((j) => u * u * u * a[j] + 3 * u * u * t * b[j] + 3 * u * t * t * c[j] + t * t * t * d[j]);
  });
  function hose(key, end, reach) {
    const a = [FX + 5, COLS[key], PORT_Z];
    const pts = bezier(a, [a[0] + reach, a[1], 6], [end[0] - 4, end[1], end[2] + 26], end);
    const dp = at(end);
    return `<g class="mv-hose" data-hose="${key}">${L(k.pathOf(pts.map(at)), { tone: "mid" })}<circle class="iso-wire-end" cx="${dp[0].toFixed(1)}" cy="${dp[1].toFixed(1)}" r="1.6"/></g>`;
  }

  const body = [
    plate(),
    panel(),
    circuit(),
    pump(),
    hose("hp", [AX, VALVES.hp, VALVE_Z], 70),
    hose("bp", [AX, VALVES.bp, VALVE_Z], 50),
    hose("vac", [INLET.x, INLET.y, RES_Z + RES_H + 11], 60),
  ];
  const svg = k.figureSvg({ width: WIDTH, height: HEIGHT, label: T.svgLabel, body });
  const config = {
    lang, P, model: MODEL, face: FX, knobX: FX + 7, dialZ: DIAL_Z, dialR: DIAL_R, knobZ: KNOB_Z, cols: COLS,
    mark: { x: AX, y: MOTOR_Y + MOTOR_L + 15, z: CZ, r0: 2.5, r1: 13 },
  };
  return { svg, config };
}

const CSS = `
.mv-face{fill:var(--anatomy-top)}
.mv-oil{fill:var(--mv-oil)}
.iso{--mv-oil:#c9962f;--mv-bp:#6aa8f0;--mv-hp:#f07a6a;--mv-vac:#e6c35a}
.iso[data-theme="light"]{--mv-oil:#c08a1e;--mv-bp:#1f5fae;--mv-hp:#b3261e;--mv-vac:#8a6a10}
.mv-needle{stroke-width:1.1}
.mv-lamp{opacity:.25;transition:opacity .25s}
.mv-lamp[data-lit]{opacity:1}
.mv-hose .iso-line{stroke-width:2.6}
.mv-hose[data-hose="bp"] .iso-line{stroke:var(--mv-bp)}
.mv-hose[data-hose="hp"] .iso-line{stroke:var(--mv-hp)}
.mv-hose[data-hose="vac"] .iso-line{stroke:var(--mv-vac)}
.mv-hose[data-live] .iso-line{stroke-dasharray:3 4;animation:iso-flow 1600ms linear infinite}
.iso-stage{touch-action:manipulation}
.iso-plate-corner[data-corner="hint"]{top:20px;bottom:auto;right:0;white-space:normal;line-height:1.35}
.iso-plate-corner[data-corner="readout"]{left:0;white-space:normal;text-align:right;line-height:1.4}
.iso-plate{padding-top:80px}
.mv-controls{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}
.mv-controls button{font:12px/1.2 var(--anatomy-mono);letter-spacing:.04em;color:var(--anatomy-strong);background:var(--anatomy-card);border:1px solid var(--anatomy-mid);border-radius:999px;padding:12px 14px;min-height:44px;cursor:pointer}
.mv-controls button[aria-pressed="true"]{border-color:var(--anatomy-lit);box-shadow:inset 0 0 0 1px var(--anatomy-lit)}
.mv-controls button:focus-visible{outline:2px solid var(--anatomy-hi);outline-offset:2px}
.mv-controls button:disabled{opacity:.45;cursor:default}
.mv-feedback{margin:12px 0 0;min-height:3em;color:var(--anatomy-text);font-size:13px;line-height:1.55}
.mv-score{color:var(--anatomy-muted);font:11px/1 var(--anatomy-mono);margin-top:6px}
@media (prefers-reduced-motion:reduce){.mv-hose[data-live] .iso-line{animation:none}}
@media (max-width:560px){.iso-plate{padding:76px 12px 64px}.mv-controls button{flex:1 1 40%}}
`;

const LIVE = `
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
`;

const written = [];
const site = { fragments: {}, scripts: {} };
for (const lang of ["fr", "en"]) {
  const T = TEXT[lang];
  const { svg, config } = buildFigure(lang);
  const B = T.buttons;
  const aria = lang === "fr" ? "Commandes et diagnostic" : "Controls and diagnosis";
  const controls = `<div class="mv-controls" role="group" aria-label="${aria}"><button type="button" data-act="pump" aria-pressed="false">${B.pumpOn}</button><button type="button" data-act="bypass" aria-pressed="false">${B.open}</button><button type="button" data-act="dry">${B.dry}</button><button type="button" data-act="wet">${B.wet}</button><button type="button" data-act="leak">${B.leak}</button><button type="button" data-act="next">${B.next}</button></div><p class="mv-feedback" aria-live="polite"></p><p class="mv-score" aria-live="polite"></p>`;
  const plate = k.plateHtml({ fig: "Fig 9", title: T.title, hint: T.hint, readout: "", keys: T.keys, caption: T.caption, body: `<div class="iso-stage" role="img" aria-label="${T.stageLabel}">${svg}</div>${controls}` });
  const f = T.feedback;
  const TX = `{buttons:${JSON.stringify(T.buttons)},read:${T.read},score:${T.score},feedback:{start:${JSON.stringify(f.start)},needPump:${JSON.stringify(f.needPump)},pulling:${JSON.stringify(f.pulling)},backflow:${JSON.stringify(f.backflow)},tooSoon:${f.tooSoon},hold:${JSON.stringify(f.hold)},noHold:${JSON.stringify(f.noHold)},good:${JSON.stringify(f.good)},bad:${JSON.stringify(f.bad)}}}`;
  const pageScript = `const FIG = ${JSON.stringify(config)};\nconst TX = ${TX};\n` + LIVE;
  site.fragments[lang] = plate;
  site.scripts[lang] = pageScript;
  for (const theme of ["dark", "light"]) {
    const name = `manifold-vide.${lang}${theme === "light" ? "-light" : ""}.html`;
    writeFileSync(join(HERE, name), k.pageHtml({ title: T.pageTitle, theme, body: `<style>${CSS}</style>${plate}`, script: KIT_SOURCE + pageScript, width: 760 }).replace('<html lang="en">', `<html lang="${lang}">`));
    written.push(name);
  }
}
written.push(...publish("manifold-vide", { ...site, css: CSS }));
console.log("wrote", written.join(", "));
