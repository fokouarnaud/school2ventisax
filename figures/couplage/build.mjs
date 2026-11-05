// Figure interactive d'évaluation (skill anatomy) : choisir le couplage étoile Y ou triangle Δ d'un moteur asynchrone triphasé.
// Partie 3, module 1, section « Principe et couplage » (barrettes de la plaque à bornes, plaque signalétique, réseau).
// Usage : node figures/couplage/build.mjs   (fr + en, sombre + clair)
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../_kit/iso-kit.mjs";
import * as G from "../_kit/lathe.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const KIT_SOURCE = readFileSync(join(HERE, "..", "_kit", "iso-kit.mjs"), "utf8").replace(/^export /gm, "");

// ---------------------------------------------------------------- modèle : la règle du cours, rien d'autre
// Plaque « a/b V » : a = tension nominale d'un enroulement. Étoile : enroulement = U/√3 ; triangle : enroulement = U.
const NETWORKS = [
  { id: "n400", v: 230, u: 400 },
  { id: "n690", v: 400, u: 690 },
];
const MOTORS = [
  { id: "m230", lo: 230, hi: 400, kw: "4", rpm: 1440, amps: "14,8/8,5", ampsEn: "14.8/8.5" },
  { id: "m400", lo: 400, hi: 690, kw: "4", rpm: 1440, amps: "8,5/4,9", ampsEn: "8.5/4.9" },
];
const SCENARIOS = [];
for (const m of MOTORS) for (const n of NETWORKS) SCENARIOS.push({ m: m.id, n: n.id });
const winding = (u, coupling) => (coupling === "Y" ? u / Math.sqrt(3) : u);
// réponse attendue : le couplage qui donne à l'enroulement sa tension nominale (± 5 %), sinon « aucun »
function expected(m, n) {
  for (const c of ["Y", "D"]) if (Math.abs(winding(n.u, c) - m.lo) / m.lo < 0.05) return c;
  return "none";
}

// ---------------------------------------------------------------- textes
const TEXT = {
  fr: {
    title: "Choix du couplage",
    pageTitle: "Couplage étoile ou triangle : exercice sur la plaque à bornes",
    hint: "Choisir le couplage, puis mettre sous tension",
    buttons: { Y: "Étoile Y", D: "Triangle Δ", none: "Aucun : moteur incompatible", test: "Mettre sous tension", next: "Nouvel exercice" },
    keys: [
      { mark: "lit", label: "Barrettes de couplage : ce que vous déplacez" },
      { mark: "raised", label: "Moteur, boîte à bornes (U1 V1 W1 en haut, W2 U2 V2 en bas) et coffret du réseau" },
      { mark: "dashed", label: "Câble sous tension" },
    ],
    caption: "La plus petite tension de la plaque signalétique est la tension d'un enroulement. Couplage triangle Δ : chaque enroulement reçoit la tension entre phases du réseau ; on le choisit quand celle-ci est égale à la plus petite tension de la plaque (moteur 400/690 V sur réseau 230/400 V : 400 V par enroulement). Couplage étoile Y : chaque enroulement reçoit la tension entre phases divisée par √3 ; on le choisit quand celle-ci est égale à la plus grande tension de la plaque (moteur 230/400 V sur réseau 230/400 V : 400 / √3 = 230 V). Si aucune des deux tensions de la plaque n'est celle du réseau, le moteur ne peut pas y être branché. Rappel : 3 barrettes = triangle, 1 barrette sur la rangée du bas = étoile.",
    stageLabel: "Exercice de couplage : un moteur asynchrone triphasé, sa boîte à bornes ouverte et le coffret du réseau. Lisez la plaque du moteur et la tension du réseau, posez les barrettes en étoile ou en triangle, ou déclarez le moteur incompatible, puis mettez sous tension.",
    svgLabel: "Moteur asynchrone triphasé sur un banc, boîte à bornes ouverte avec six bornes U1 V1 W1 et W2 U2 V2, bac de barrettes, coffret du réseau avec voltmètre, relais thermique et voyant de marche.",
    plate: (m) => `3~ ${m.lo}/${m.hi} V`,
    plate2: (m) => `${m.kw} kW · ${m.rpm} tr/min`,
    net: (n) => `Réseau ${n.v}/${n.u} V`,
    readIdle: (m, n, c) => `plaque ${m.lo}/${m.hi} V · réseau ${n.v}/${n.u} V · ${c === "Y" ? "étoile" : c === "D" ? "triangle" : c === "none" ? "aucun couplage" : "barrettes à poser"}`,
    readRun: (w, m, verdict) => `enroulement ${Math.round(w / 10) * 10} V pour ${m.lo} V · ${verdict}`,
    verdict: { ok: "marche normale ✓", over: "surtension ×√3 : déclenchement", under: "sous-tension ÷√3 : couple ÷3", noneOk: "bonne réponse ✓", noneBad: "mauvaise réponse ✗", noCoupling: "posez les barrettes ou déclarez le moteur incompatible" },
    feedback: {
      ok: (m, n, c) => `Juste. ${c === "Y" ? `Étoile : chaque enroulement reçoit ${n.u} / √3 ≈ ${Math.round(n.u / Math.sqrt(3) / 10) * 10} V` : `Triangle : chaque enroulement reçoit ${n.u} V`}, la plus petite tension de la plaque (${m.lo} V). Le moteur tourne normalement.`,
      over: (m, n, c) => `Faux. ${c === "Y" ? `En étoile, chaque enroulement reçoit environ ${Math.round(n.u / Math.sqrt(3) / 10) * 10} V` : `En triangle, chaque enroulement reçoit ${n.u} V`} alors qu'il est prévu pour ${m.lo} V : les enroulements chauffent et le relais thermique déclenche. ${expected(m, n) === "none" ? "Aucun couplage ne convient : ce moteur est incompatible avec ce réseau." : `Il fallait le couplage ${expected(m, n) === "Y" ? "étoile" : "triangle"}.`}`,
      under: (m, n) => `Faux. En étoile, chaque enroulement ne reçoit qu'environ ${Math.round(n.u / Math.sqrt(3) / 10) * 10} V au lieu de ${m.lo} V : le couple est divisé par 3, le moteur peine, chauffe et le relais thermique finit par déclencher. Il fallait le couplage triangle.`,
      noneOk: (m, n) => `Juste. Plaque ${m.lo}/${m.hi} V, réseau ${n.v}/${n.u} V : même en étoile, chaque enroulement recevrait environ ${Math.round(n.u / Math.sqrt(3) / 10) * 10} V au lieu de ${m.lo} V. Ce moteur ne se branche pas sur ce réseau.`,
      noneBad: (m, n) => `Faux. Ce moteur convient à ce réseau : il fallait le couplage ${expected(m, n) === "Y" ? `étoile (${n.u} / √3 ≈ ${Math.round(n.u / Math.sqrt(3) / 10) * 10} V par enroulement)` : `triangle (${n.u} V par enroulement)`}.`,
      noCoupling: "Posez d'abord les barrettes (étoile ou triangle), ou déclarez le moteur incompatible.",
    },
    score: (good, total) => `Score : ${good} / ${total}`,
    start: "Lisez la plaque du moteur (sur la boîte à bornes) et la tension du réseau (sur le coffret), puis choisissez.",
  },
  en: {
    title: "Choosing the connection",
    pageTitle: "Star or delta connection: a terminal board exercise",
    hint: "Choose the connection, then switch on",
    buttons: { Y: "Star Y", D: "Delta Δ", none: "None: motor unsuitable", test: "Switch on", next: "New exercise" },
    keys: [
      { mark: "lit", label: "Connection links: what you move" },
      { mark: "raised", label: "Motor, terminal box (U1 V1 W1 top, W2 U2 V2 bottom) and supply cabinet" },
      { mark: "dashed", label: "Live cable" },
    ],
    caption: "The lower voltage on the rating plate is the voltage of one winding. Delta Δ connection: each winding gets the line voltage of the supply; choose it when that equals the lower plate voltage (400/690 V motor on a 230/400 V supply: 400 V per winding). Star Y connection: each winding gets the line voltage divided by √3; choose it when the line voltage equals the higher plate voltage (230/400 V motor on a 230/400 V supply: 400 / √3 = 230 V). If neither plate voltage is the supply's line voltage, the motor cannot be connected to it. Remember: 3 links = delta, 1 link across the bottom row = star.",
    stageLabel: "Connection exercise: a three-phase induction motor, its open terminal box and the supply cabinet. Read the motor's rating plate and the supply voltage, fit the links in star or delta, or declare the motor unsuitable, then switch on.",
    svgLabel: "Three-phase induction motor on a bench, open terminal box with six terminals U1 V1 W1 and W2 U2 V2, link tray, supply cabinet with voltmeter, thermal overload relay and run light.",
    plate: (m) => `3~ ${m.lo}/${m.hi} V`,
    plate2: (m) => `${m.kw} kW · ${m.rpm} rpm`,
    net: (n) => `Supply ${n.v}/${n.u} V`,
    readIdle: (m, n, c) => `plate ${m.lo}/${m.hi} V · supply ${n.v}/${n.u} V · ${c === "Y" ? "star" : c === "D" ? "delta" : c === "none" ? "no connection" : "fit the links"}`,
    readRun: (w, m, verdict) => `winding ${Math.round(w / 10) * 10} V for ${m.lo} V · ${verdict}`,
    verdict: { ok: "normal running ✓", over: "overvoltage ×√3: tripped", under: "undervoltage ÷√3: torque ÷3", noneOk: "correct ✓", noneBad: "wrong ✗", noCoupling: "fit the links or declare the motor unsuitable" },
    feedback: {
      ok: (m, n, c) => `Correct. ${c === "Y" ? `Star: each winding gets ${n.u} / √3 ≈ ${Math.round(n.u / Math.sqrt(3) / 10) * 10} V` : `Delta: each winding gets ${n.u} V`}, the lower plate voltage (${m.lo} V). The motor runs normally.`,
      over: (m, n, c) => `Wrong. ${c === "Y" ? `In star each winding gets about ${Math.round(n.u / Math.sqrt(3) / 10) * 10} V` : `In delta each winding gets ${n.u} V`}, but it is rated ${m.lo} V: the windings overheat and the thermal overload relay trips. ${expected(m, n) === "none" ? "No connection fits: this motor is unsuitable for this supply." : `The right answer was ${expected(m, n) === "Y" ? "star" : "delta"}.`}`,
      under: (m, n) => `Wrong. In star each winding only gets about ${Math.round(n.u / Math.sqrt(3) / 10) * 10} V instead of ${m.lo} V: torque drops to a third, the motor struggles, heats up and the thermal overload relay ends up tripping. The right answer was delta.`,
      noneOk: (m, n) => `Correct. Plate ${m.lo}/${m.hi} V, supply ${n.v}/${n.u} V: even in star each winding would get about ${Math.round(n.u / Math.sqrt(3) / 10) * 10} V instead of ${m.lo} V. This motor must not be connected to this supply.`,
      noneBad: (m, n) => `Wrong. This motor suits this supply: the right answer was ${expected(m, n) === "Y" ? `star (${n.u} / √3 ≈ ${Math.round(n.u / Math.sqrt(3) / 10) * 10} V per winding)` : `delta (${n.u} V per winding)`}.`,
      noCoupling: "First fit the links (star or delta), or declare the motor unsuitable.",
    },
    score: (good, total) => `Score: ${good} / ${total}`,
    start: "Read the motor's rating plate (on the terminal box) and the supply voltage (on the cabinet), then choose.",
  },
};

// ---------------------------------------------------------------- géométrie (az 28° : l'axe y est horizontal à l'écran)
const AZ = 28;
const WIDTH = 680;
const HEIGHT = 440;
const PLATE = { x: -62, y: -182, w: 152, d: 268, r: 8 };
const PLATE_H = 10;
const FOOT_H = 5;

const R = 33; // carcasse
const CZ = 46; // axe du moteur
const Y0 = -66; // flasque arrière (côté ventilateur)
const LEN = 104;
const F = G.frameOf([0, Y0, CZ], [0, 1, 0], [1, 0, 0], [0, 0, 1]);

const BOX = { x: -24, y: -20, w: 48, d: 56, r: 2.5 };
const BOX_Z = CZ + R - 2; // dessous de la boîte (posée sur la carcasse)
const BOX_H = 10;
const BOARD = { x: -20.5, y: -15, w: 41, d: 46, r: 1.8 };
const BOARD_Z = BOX_Z + BOX_H;
const BOARD_T = 3;
const ZB = BOARD_Z + BOARD_T; // dessus de la plaque à bornes
const ROW_TOP = -9; // x des bornes U1 V1 W1
const ROW_BOT = 9; // x des bornes W2 U2 V2
const COLS = [22, 8, -6]; // y des colonnes U, V, W (y grand = à gauche à l'écran)
const TOP = ["U1", "V1", "W1"];
const BOT = ["W2", "U2", "V2"];
const BAR_T = 1.6;

const TRAY = { x: 46, y: -10, w: 34, d: 46, r: 2 };
const TRAY_H = 4;

const CAB = { x: -46, y: -176, w: 40, d: 44, r: 3 };
const CAB_H = 96;
const CFX = CAB.x + CAB.w; // face avant du coffret
const DIAL = { y: -154, z: 70, r: 11 };
const RELAY = { y: -170, z: 42 };
const LAMP = { y: -138, z: 42 };

function buildFigure(lang) {
  const T = TEXT[lang];
  const P = k.fitProjection([...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [0, 0, ZB + 8], [CAB.x, CAB.y, CAB_H], [0, Y0 + LEN + 30, CZ + 14]], WIDTH, HEIGHT, { pad: 14, azimuth: AZ, elevation: 38 });
  const at = (p) => k.iso(p, P);
  const S = (paths, style) => k.solidSvg(paths, style);
  const L = (d, style) => k.lineSvg(d, style);
  const D = (pts, style) => k.dotsSvg(pts, style);
  const depth = (x, y, z = 0) => k.depthOf([x, y, z], P);
  const text = (x, y, z, s, size = 3.2, tone = "mid", cls = "") => k.faceTextSvg(k.topMatrix([x, y], z, P, "x"), s, { size, tone }).replace("<text ", `<text${cls ? ` data-text="${cls}"` : ""} `);
  const sideText = (x, y, z, s, size, tone, cls) => k.faceTextSvg(k.sideMatrix([x, y], z, P, "right"), s, { size, tone }).replace("<text ", `<text${cls ? ` data-text="${cls}"` : ""} `);
  const pathD = (pts) => k.pathOf(pts.map(at));
  const onCab = (y, z) => at([CFX, y, z]);

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
    const strip = { x: PLATE.x + PLATE.w - 13, y: -174, w: 6, d: 86, r: 1 };
    o.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
    const t = k.topTicks(strip.y + 4, strip.y + strip.d - 4, 4, 5, strip.x + 0.8, 0.6, [1.8, 3.4], P, "y");
    o.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
    // rails du moteur
    for (const y of [Y0 + 8, Y0 + LEN - 22]) {
      const rail = { x: -40, y, w: 80, d: 14, r: 1 };
      o.push(S(k.slabOf(rail, 0, 4, P, 2, 0.4), { tone: "lo" }));
      o.push(L(k.planOutline({ x: -34, y: y + 5, w: 18, d: 4, r: 2 }, 4, P, 3) + k.planOutline({ x: 16, y: y + 5, w: 18, d: 4, r: 2 }, 4, P, 3), { tone: "faint" }));
    }
    return o.join("");
  }

  // ---- coffret du réseau (face avant +x) : étiquette, voltmètre, relais thermique, voyant, interrupteur
  function cabinet() {
    const o = [`<path class="iso-halo" d="${k.haloOf(CAB, 0, CAB_H, P)}"/>`];
    o.push(S(k.slabOf(CAB, 0, CAB_H, P, 4, 1), { tone: "mid", inner: L(k.sideSeam(CAB, 10, P, 4) + k.sideSeam(CAB, CAB_H - 8, P, 4), { tone: "faint" }) }));
    o.push(D(k.corners(CAB, 3).map(([x, y]) => at([x, y, CAB_H])), { size: 0.5 }));
    // étiquette du réseau sur le dessus
    const lab = { x: CAB.x + 6, y: CAB.y + 6, w: 28, d: 32, r: 1.5 };
    o.push(S(k.slabOf(lab, CAB_H, 0.8, P, 3), { tone: "mid", crease: "none" }));
    o.push(k.faceTextSvg(k.topMatrix([CAB.x + 17, CAB.y + 34], CAB_H + 0.8, P, "y"), "", { size: 4.4, tone: "hi" }).replace("<text ", '<text data-text="net" '));
    o.push(k.faceTextSvg(k.topMatrix([CAB.x + 26, CAB.y + 34], CAB_H + 0.8, P, "y"), "3~ 50 Hz", { size: 3.2, tone: "lo" }));
    // voltmètre (cadran dans le plan de la face avant)
    const ring = (r) => k.sideRing([CFX, DIAL.y, DIAL.z], r, "x", P, 48);
    o.push(`<path class="cp-dial" d="${ring(DIAL.r)}"/>`);
    o.push(L(ring(DIAL.r) + ring(DIAL.r + 2), { tone: "mid" }));
    const ticks = [];
    for (let i = 0; i <= 16; i++) {
      const a = Math.PI * (1.25 - (1.5 * i) / 16);
      const r0 = DIAL.r - (i % 4 === 0 ? 3.2 : 1.8);
      ticks.push(k.pathOf([onCab(DIAL.y - Math.cos(a) * r0, DIAL.z + Math.sin(a) * r0), onCab(DIAL.y - Math.cos(a) * DIAL.r, DIAL.z + Math.sin(a) * DIAL.r)]));
    }
    o.push(L(ticks.join(""), { tone: "lo" }));
    o.push(`<path class="iso-line cp-needle" data-tone="lit" data-free="both" d=""/>`);
    o.push(D([onCab(DIAL.y, DIAL.z)], { size: 0.9, tone: "hi" }));
    // relais thermique : boîtier, voyant de déclenchement (drapeau) et bouton de réarmement
    const relay = { y0: RELAY.y - 8, y1: RELAY.y + 8, z0: RELAY.z - 10, z1: RELAY.z + 10 };
    o.push(S(k.slabOf({ x: CFX, y: relay.y0, w: 3, d: relay.y1 - relay.y0, r: 0.8 }, relay.z0, relay.z1 - relay.z0, P, 2, 0.4), { tone: "lo" }));
    o.push(`<g class="cp-flag">${S(k.slabOf({ x: CFX + 3, y: RELAY.y - 3, w: 1.6, d: 6, r: 0.4 }, RELAY.z + 2, 5, P, 2), { tone: "hi" })}</g>`);
    o.push(S(G.disc(0, 2, 2.2, G.frameOf([CFX + 3, RELAY.y, RELAY.z - 5], [1, 0, 0], [0, 1, 0], [0, 0, 1]), P, { steps: 20 }), { tone: "mid" }));
    // voyant de marche
    o.push(S(G.disc(0, 2.4, 3.2, G.frameOf([CFX, LAMP.y, LAMP.z], [1, 0, 0], [0, 1, 0], [0, 0, 1]), P, { steps: 24 }), { tone: "mid" }));
    const lc = at([CFX + 2.4, LAMP.y, LAMP.z]);
    o.push(`<circle class="cp-run-glow" cx="${lc[0].toFixed(1)}" cy="${lc[1].toFixed(1)}" r="${(P.scale * 14).toFixed(1)}" fill="url(#cp-run)"/>`);
    o.push(`<g class="cp-run">${S(G.disc(2.4, 3.4, 2.2, G.frameOf([CFX, LAMP.y, LAMP.z], [1, 0, 0], [0, 1, 0], [0, 0, 1]), P, { steps: 20 }), { tone: "hi" })}</g>`);
    // interrupteur rotatif
    const KF = G.frameOf([CFX, -144, 20], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
    o.push(S(G.disc(0, 2, 7, KF, P, { steps: 36 }), { tone: "lo" }) + S(G.disc(2, 6, 4.2, KF, P, { steps: 28 }), { tone: "mid" }));
    o.push(S(k.slabOf({ x: CFX + 6, y: -153, w: 3, d: 18, r: 1.2 }, 18.4, 3.2, P, 3), { tone: "hi" }));
    return o.join("");
  }

  // ---- moteur : capot de ventilateur, carcasse à ailettes, flasques, arbre, accouplement
  function motor() {
    const o = [];
    // pattes
    for (const y of [Y0 + 10, Y0 + LEN - 20]) {
      o.push(S(k.slabOf({ x: -30, y, w: 60, d: 10, r: 1 }, 4, CZ - R + 6 - 4, P, 2, 0.5), { tone: "lo" }));
      for (const x of [-25, 25]) o.push(L(k.ring(x, y + 5, 2.2, CZ - R + 6, P, 16), { tone: "mid" }) + D([at([x, y + 5, CZ - R + 6])], { size: 0.55 }));
    }
    // capot de ventilateur (grille sur la face arrière, cachée) et carcasse
    o.push(S(G.solidOf([[-26, 0], [-26, 27, 1], [-22, 29], [0, 29]], F, P), { tone: "mid", inner: L(G.arcOf(F, -12, 29, P), { tone: "faint" }) }));
    const body = G.solidOf([[0, 0], [0, 27], [5, R], [LEN - 5, R], [LEN, 27], [LEN, 0]], F, P);
    o.push(S(body, { tone: "mid", inner: `<g class="cp-hot">${k.fadedSvg(G.ribsOf(F, 6, LEN - 6, R + 0.2, 36, P, { fade: [0.06, 0.4], seams: true }), { tone: "lo" })}</g>` }));
    // flasque avant, roulement, arbre et clavette
    o.push(S(G.solidOf([[LEN, 0], [LEN, 16], [LEN + 6, 13], [LEN + 6, 0]], F, P), { tone: "lo" }));
    o.push(D(G.dotsOf(F, LEN, 22, 4, P, { all: true, phase: Math.PI / 4 }), { size: 0.6, tone: "mid" }));
    o.push(S(G.solidOf([[LEN + 6, 0], [LEN + 6, 5], [LEN + 24, 5], [LEN + 24, 0]], F, P), { tone: "hi" }));
    // accouplement : un plateau qui tourne (repère redessiné à chaque image)
    o.push(S(G.disc(LEN + 24, LEN + 30, 12, F, P, { steps: 48, bevel: 0.4 }), { tone: "mid" }));
    o.push(D(G.dotsOf(F, LEN + 30, 8, 6, P, { all: true }), { size: 0.5, tone: "lo" }));
    o.push(`<path class="iso-line cp-mark" data-tone="lit" data-free="both" d=""/>`);
    return o.join("");
  }

  // ---- boîte à bornes ouverte, plaque signalétique sur la face avant
  function box() {
    const o = [];
    o.push(S(k.slabOf(k.insetPlan(BOX, 3), BOX_Z - 4, 4, P, 2), { tone: "lo" }));
    o.push(S(k.slabOf(BOX, BOX_Z, BOX_H, P, 3, 0.6), { tone: "mid", inner: L(k.sideSeam(BOX, BOX_Z + 3, P, 3), { tone: "faint" }) }));
    o.push(L(k.planOutline(k.insetPlan(BOX, 1.6), BOARD_Z, P, 3), { tone: "lo" }));
    o.push(D(k.corners(BOX, 2.4).map(([x, y]) => at([x, y, BOARD_Z])), { size: 0.5 }));
    // presse-étoupe sur la face −y (côté coffret)
    o.push(S(G.disc(0, 5, 4.6, G.frameOf([0, BOX.y, BOX_Z + 5], [0, -1, 0], [1, 0, 0], [0, 0, 1]), P, { steps: 24 }), { tone: "lo" }));
    // plaque signalétique (sur la face +x de la boîte)
    const pl = { y0: BOX.y + 4, y1: BOX.y + BOX.d - 4, z0: BOX_Z + 1.4, z1: BOX_Z + BOX_H - 1.4 };
    const fx = BOX.x + BOX.w + 0.2;
    o.push(`<path class="cp-plate" d="${k.pathOf([[fx, pl.y0, pl.z0], [fx, pl.y1, pl.z0], [fx, pl.y1, pl.z1], [fx, pl.y0, pl.z1]].map(at), true)}"/>`);
    o.push(L(k.pathOf([[fx, pl.y0, pl.z0], [fx, pl.y1, pl.z0], [fx, pl.y1, pl.z1], [fx, pl.y0, pl.z1]].map(at), true), { tone: "mid" }));
    o.push(sideText(fx, pl.y1 - 1.6, pl.z1 - 2.8, "", 3.4, "hi", "plate"));
    o.push(sideText(fx, pl.y1 - 1.6, pl.z0 + 2.4, "", 2.2, "mid", "plate2"));
    o.push(D([at([fx, pl.y1 - 0.8, (pl.z0 + pl.z1) / 2]), at([fx, pl.y0 + 0.8, (pl.z0 + pl.z1) / 2])], { size: 0.4 }));
    // plaque à bornes
    o.push(S(k.slabOf(BOARD, BOARD_Z, BOARD_T, P, 2, 0.4), { tone: "lo" }));
    // repères gravés
    COLS.forEach((y, i) => {
      o.push(k.faceTextSvg(k.topMatrix([ROW_TOP - 9.6, y], ZB, P, "y"), TOP[i], { size: 3.4, tone: "hi", anchor: "middle" }));
      o.push(k.faceTextSvg(k.topMatrix([ROW_BOT + 8.4, y], ZB, P, "y"), BOT[i], { size: 3.4, tone: "hi", anchor: "middle" }));
    });
    return o.join("");
  }
  // câbles L1 L2 L3 : du presse-étoupe aux bornes du haut
  function leads() {
    return COLS.map((y, i) => {
      const pts = [[-4 + i * 4, BOARD.y + 0.8, ZB + 0.6], [-4 + i * 4, BOARD.y + 3 + i * 2, ZB + 0.6], [ROW_TOP - 4.5 + i * 0, BOARD.y + 3 + i * 2, ZB + 0.6], [ROW_TOP - 4.5, y, ZB + 0.6], [ROW_TOP - 2, y, ZB + 0.6]];
      return `<g class="rl-wire" data-wire="lead">${L(pathD(pts), { tone: "mid" })}</g>`;
    }).join("");
  }
  const studs = () => {
    const o = [];
    for (const x of [ROW_TOP, ROW_BOT]) for (const y of COLS) o.push(S(k.cylinder(x, y, 2, ZB, BAR_T + 0.2, P, 16), { tone: "mid", crease: "none" }));
    return o.join("");
  };
  const nuts = () => {
    const o = [];
    for (const x of [ROW_TOP, ROW_BOT]) for (const y of COLS) o.push(S(k.cylinder(x, y, 3.2, ZB + BAR_T, 2.4, P, 6, 0.3), { tone: "hi" }) + L(k.ring(x, y, 1.3, ZB + BAR_T + 2.4, P, 12), { tone: "lo" }));
    return o.join("");
  };
  // barrettes : construites en place sur les bornes, déplacées depuis le bac par translation
  const bar = (plan) => S(k.slabOf(plan, ZB, BAR_T, P, 3, 0.3), { tone: "hi", lit: true }) + L(plan.w > plan.d ? k.ring(plan.x + plan.w / 2, plan.y + plan.d / 2, 1.6, ZB + BAR_T, P, 12) : k.ring(plan.x + plan.w / 2, plan.y + plan.d / 2, 1.6, ZB + BAR_T, P, 12), { tone: "lo" });
  const starBar = () => `<g class="cp-bars" data-set="Y">${bar({ x: ROW_BOT - 3.6, y: COLS[2] - 3.6, w: 7.2, d: COLS[0] - COLS[2] + 7.2, r: 3.2 })}</g>`;
  const deltaBars = () => `<g class="cp-bars" data-set="D">${COLS.map((y) => bar({ x: ROW_TOP - 3.6, y: y - 3.6, w: ROW_BOT - ROW_TOP + 7.2, d: 7.2, r: 3.2 })).join("")}</g>`;

  function tray() {
    const o = [S(k.slabOf(TRAY, 0, TRAY_H, P, 3, 0.5), { tone: "lo" })];
    o.push(L(k.planOutline(k.insetPlan(TRAY, 2.4), TRAY_H, P, 3), { tone: "faint" }));
    // couvercle de la boîte, posé à côté du bac
    const lid = { x: 36, y: -78, w: 46, d: 52, r: 2.5 };
    o.push(S(k.slabOf(lid, 0, 3, P, 3, 0.6), { tone: "mid" }) + D(k.corners(lid, 2.4).map(([x, y]) => at([x, y, 3])), { size: 0.5 }));
    return o.join("");
  }

  // câble d'alimentation : coffret → presse-étoupe, au-dessus du capot
  const cable = () => {
    const a = [0, BOX.y - 5, BOX_Z + 5];
    const b = [CFX - 20, CAB.y + CAB.d, 84];
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t - 6 * 4 * t * (1 - t)]);
    }
    return `<g class="rl-wire cp-cable" data-wire="cable">${L(pathD(pts), { tone: "mid" })}<circle class="iso-wire-end" cx="${at(b)[0].toFixed(1)}" cy="${at(b)[1].toFixed(1)}" r="1.6"/></g>`;
  };

  // fumée (surtension) : volutes au-dessus de la boîte
  const smoke = () => {
    const c = at([0, 8, ZB + 6]);
    return `<g class="cp-smoke">${[0, 1, 2].map((i) => `<path class="cp-wisp" style="--i:${i}" d="M${(c[0] - 6 + i * 6).toFixed(1)} ${c[1].toFixed(1)}q-4 -8 0 -16t0 -16"/>`).join("")}</g>`;
  };

  const trayOffset = { Y: [TRAY.x + 8 - ROW_BOT, TRAY.y + 10 - COLS[2], TRAY_H - ZB], D: [TRAY.x + 20 - ROW_TOP, TRAY.y + 10 - COLS[2], TRAY_H - ZB] };
  const body = [
    `<defs><radialGradient id="cp-run"><stop offset="0" class="cp-run-0"/><stop offset=".4" class="cp-run-1"/><stop offset="1" class="cp-run-2"/></radialGradient></defs>`,
    plate(),
    cabinet(),
    motor(),
    cable(),
    box(),
    leads(),
    studs(),
    tray(),
    starBar(),
    deltaBars(),
    nuts(),
    smoke(),
  ];
  const svg = k.figureSvg({ width: WIDTH, height: HEIGHT, label: T.svgLabel, body });
  const config = {
    lang,
    P,
    F,
    markS: Y0 + LEN + 30,
    dial: { x: CFX, ...DIAL, max: 800 },
    flagMove: 3,
    trayOffset,
    lift: 40,
    networks: NETWORKS,
    motors: MOTORS,
    scenarios: SCENARIOS,
  };
  return { svg, config };
}

const CSS = `
.cp-dial{fill:var(--anatomy-top)}
.cp-plate{fill:var(--anatomy-top)}
.cp-needle{stroke-width:1}
.cp-run-glow{opacity:0;pointer-events:none;mix-blend-mode:var(--cp-blend,screen)}
.cp-run-0{stop-color:var(--cp-run-0)}.cp-run-1{stop-color:var(--cp-run-1)}.cp-run-2{stop-color:var(--cp-run-2)}
.iso{--cp-run-0:#9dffb0;--cp-run-1:#40d06a55;--cp-run-2:#20a04000;--cp-hot:#ff6a3a}
.iso[data-theme="light"]{--cp-run-0:#7ee69a;--cp-run-1:#30b05a40;--cp-run-2:#20904000;--cp-blend:multiply;--cp-hot:#d9481a}
.cp-hot .iso-line{transition:stroke .6s}
[data-heat="1"] .cp-hot .iso-line{stroke:var(--cp-hot)}
.cp-wisp{fill:none;stroke:var(--anatomy-mid);stroke-width:1.4;stroke-linecap:round;opacity:0}
[data-smoke] .cp-wisp{animation:cp-wisp 1.8s ease-out infinite;animation-delay:calc(var(--i) * .6s)}
@keyframes cp-wisp{0%{opacity:0;transform:translateY(4px)}30%{opacity:.7}100%{opacity:0;transform:translateY(-14px)}}
.rl-wire[data-live] .iso-line{stroke:var(--anatomy-lit);stroke-dasharray:2 4;animation:iso-flow 1600ms linear infinite}
.cp-cable .iso-line{stroke-width:2.4}
.iso-stage{touch-action:manipulation}
.cp-controls{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}
.cp-controls button{font:12px/1 var(--anatomy-mono);letter-spacing:.04em;color:var(--anatomy-strong);background:var(--anatomy-card);border:1px solid var(--anatomy-mid);border-radius:999px;padding:10px 14px;min-height:44px;cursor:pointer}
.cp-controls button[aria-pressed="true"]{border-color:var(--anatomy-lit);box-shadow:inset 0 0 0 1px var(--anatomy-lit)}
.cp-controls button:focus-visible{outline:2px solid var(--anatomy-hi);outline-offset:2px}
.cp-controls button:disabled{opacity:.45;cursor:default}
.cp-controls .cp-go{background:var(--anatomy-strong);color:var(--anatomy-card);border-color:var(--anatomy-strong)}
.cp-feedback{margin:12px 0 0;min-height:3em;color:var(--anatomy-text);font-size:13px;line-height:1.55}
.cp-score{color:var(--anatomy-muted);font:11px/1 var(--anatomy-mono);margin-top:6px}
@media (prefers-reduced-motion:reduce){.rl-wire[data-live] .iso-line,[data-smoke] .cp-wisp{animation:none}[data-smoke] .cp-wisp{opacity:.5}}
@media (max-width:560px){.iso-plate-corner[data-corner="readout"]{white-space:normal;left:0;text-align:right;line-height:1.4}.iso-plate-corner[data-corner="hint"]{bottom:auto;top:16px}.iso-plate{padding:56px 12px 64px}.cp-controls button{flex:1 1 40%}}
`;

const LIVE = `
const still = matchMedia("(prefers-reduced-motion: reduce)");
const C = FIG, T = TX, P = C.P;
const root = document.querySelector(".iso-plate");
const stage = root.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const readout = root.querySelector("[data-readout]");
const feedback = document.querySelector(".cp-feedback");
const scoreEl = document.querySelector(".cp-score");
const buttons = Object.fromEntries([...document.querySelectorAll(".cp-controls button")].map((b) => [b.dataset.act, b]));
const sets = Object.fromEntries([...svg.querySelectorAll(".cp-bars")].map((g) => [g.dataset.set, g]));
const needle = svg.querySelector(".cp-needle");
const mark = svg.querySelector(".cp-mark");
const flag = svg.querySelector(".cp-flag");
const runGlow = svg.querySelector(".cp-run-glow");
const runLamp = svg.querySelector(".cp-run");
const live = [...svg.querySelectorAll(".rl-wire")];
const txt = (name) => svg.querySelector('[data-text="' + name + '"]');
const winding = (u, c) => (c === "Y" ? u / Math.sqrt(3) : u);
const expected = (m, n) => { for (const c of ["Y", "D"]) if (Math.abs(winding(n.u, c) - m.lo) / m.lo < 0.05) return c; return "none"; };
let sc = 0, choice = null, phase = "idle", verdict = null, good = 0, total = 0, answered = false;
const place = { Y: 0, D: 0 }; // 1 = sur les bornes, 0 = dans le bac
let angle = 0, speed = 0, targetSpeed = 0, volts = 0, flagAt = 0, runAt = 0, runTimer = 0, frame = 0, last = 0, visible = false;
const scen = () => C.scenarios[sc];
const motor = () => C.motors.find((m) => m.id === scen().m);
const net = () => C.networks.find((n) => n.id === scen().n);
function setScenario(i) {
  sc = i; choice = null; phase = "idle"; verdict = null; answered = false; targetSpeed = 0;
  txt("plate").textContent = T.plate(motor());
  txt("plate2").textContent = T.plate2(motor());
  txt("net").textContent = T.net(net());
  feedback.textContent = T.start;
  svg.removeAttribute("data-heat"); svg.removeAttribute("data-smoke");
  sync(); run();
}
function sync() {
  for (const k of ["Y", "D", "none"]) buttons[k].setAttribute("aria-pressed", choice === k ? "true" : "false");
  for (const k of ["Y", "D", "none"]) buttons[k].disabled = phase === "running";
  buttons.test.disabled = phase === "running";
  scoreEl.textContent = T.score(good, total);
  readout.textContent = phase === "idle" ? T.readIdle(motor(), net(), choice) : readout.textContent;
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
  volts = ease(volts, net().u, 0.4);
  flagAt = ease(flagAt, phase === "tripped" ? 1 : 0, 0.08);
  runAt = ease(runAt, powered ? 1 : 0, 0.1);
  if (phase === "tripped") { svg.removeAttribute("data-smoke"); readout.textContent = T.readRun(winding(net().u, choice), motor(), T.verdict[verdict]); }
  draw();
  const settled = !powered && speed < 1e-3 && ["Y", "D"].every((k) => Math.abs(place[k] - (choice === k ? 1 : 0)) < 1e-3) && Math.abs(volts - net().u) < 0.5 && Math.abs(flagAt - (phase === "tripped" ? 1 : 0)) < 1e-3 && runAt < 1e-3;
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
function run() { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } }
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
buttons.Y.addEventListener("click", () => choose("Y"));
buttons.D.addEventListener("click", () => choose("D"));
buttons.none.addEventListener("click", () => choose("none"));
buttons.test.addEventListener("click", test);
buttons.next.addEventListener("click", nextScenario);
window.__cp = { choose, test, setScenario, state: () => ({ sc, choice, phase, verdict, good, total }) };
setScenario(Math.floor(Math.random() * C.scenarios.length));
draw();
`;

const written = [];
for (const lang of ["fr", "en"]) {
  const T = TEXT[lang];
  const { svg, config } = buildFigure(lang);
  const B = T.buttons;
  const controls = `<div class="cp-controls" role="group" aria-label="${lang === "fr" ? "Votre réponse" : "Your answer"}"><button type="button" data-act="Y" aria-pressed="false">${B.Y}</button><button type="button" data-act="D" aria-pressed="false">${B.D}</button><button type="button" data-act="none" aria-pressed="false">${B.none}</button><button type="button" class="cp-go" data-act="test">${B.test}</button><button type="button" data-act="next">${B.next}</button></div><p class="cp-feedback" aria-live="polite"></p><p class="cp-score" aria-live="polite"></p>`;
  const plate = k.plateHtml({ fig: "Fig 6", title: T.title, hint: T.hint, readout: "", keys: T.keys, caption: T.caption, body: `<div class="iso-stage" role="img" aria-label="${T.stageLabel}">${svg}</div>${controls}` });
  // fonctions de texte sérialisées pour le navigateur
  const TX = `{plate:${T.plate},plate2:${T.plate2},net:${T.net},readIdle:${T.readIdle},readRun:${T.readRun},verdict:${JSON.stringify(T.verdict)},feedback:{ok:${T.feedback.ok},over:${T.feedback.over},under:${T.feedback.under},noneOk:${T.feedback.noneOk},noneBad:${T.feedback.noneBad},noCoupling:${JSON.stringify(T.feedback.noCoupling)}},score:${T.score},start:${JSON.stringify(T.start)}}`;
  for (const theme of ["dark", "light"]) {
    const name = `couplage.${lang}${theme === "light" ? "-light" : ""}.html`;
    const script = KIT_SOURCE + `const FIG = ${JSON.stringify(config)};\nconst winding0 = (u, c) => (c === "Y" ? u / Math.sqrt(3) : u);\nfunction expected(m, n) { for (const c of ["Y", "D"]) if (Math.abs(winding0(n.u, c) - m.lo) / m.lo < 0.05) return c; return "none"; }\nconst TX = ${TX};\n` + LIVE.replace("const expected = (m, n) => { for (const c of [\"Y\", \"D\"]) if (Math.abs(winding(n.u, c) - m.lo) / m.lo < 0.05) return c; return \"none\"; };\n", "");
    writeFileSync(join(HERE, name), k.pageHtml({ title: T.pageTitle, theme, body: `<style>${CSS}</style>${plate}`, script, width: 760 }).replace('<html lang="en">', `<html lang="${lang}">`));
    written.push(name);
  }
}
console.log("wrote", written.join(", "));
