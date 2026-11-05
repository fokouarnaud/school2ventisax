// Figure interactive (skill anatomy) : le relais statique (SSR), optocoupleur + triac.
// Partie 3, module 2 « Appareillages électriques industriels », section « Commande », § Les relais statiques.
// Usage : node figures/relais-statique/build.mjs   (fr + en, sombre + clair)
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../_kit/iso-kit.mjs";
import { publish } from "../_kit/publish.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const KIT_SOURCE = readFileSync(join(HERE, "..", "_kit", "iso-kit.mjs"), "utf8").replace(/^export /gm, "");

// ---------------------------------------------------------------- modèle
const MODEL = {
  inVolts: 24, // commande continue sur 3 (+) / 4 (−)
  mainsVolts: 230,
  mainsHz: 50,
  slow: 50, // l'oscilloscope et le triac sont montrés 50 fois ralentis (1 période par seconde)
  triacDrop: "1 à 1,5 V",
};

// ---------------------------------------------------------------- textes
const TEXT = {
  fr: {
    title: "Relais statique",
    pageTitle: "Relais statique (SSR) : optocoupleur et triac",
    hint: "Maintenir S1 appuyé",
    keys: [
      { mark: "lit", label: "Optocoupleur et triac : ce qui conduit quand S1 est appuyé (aucune pièce ne bouge)" },
      { mark: "raised", label: "Boîtier ouvert, circuit imprimé et dissipateur" },
      { mark: "dashed", label: "Fil parcouru par un courant" },
    ],
    caption: `Relais statique (SSR) ouvert sur son dissipateur à ailettes. Commande : S1 envoie le ${MODEL.inVolts} V ⎓ sur les bornes 3 (+) et 4 (−) ; quelques milliampères traversent la résistance et la diode infrarouge de l'optocoupleur (sa lumière, invisible à l'œil, est figurée ici). Elle franchit la fente d'isolement du circuit imprimé et déclenche le phototriac, qui amorce le triac de puissance : le courant passe de la borne 1 à la borne 2 et le voyant H1 s'allume. Aucune pièce ne bouge, et la commande n'a aucune liaison électrique avec le ${MODEL.mainsVolts} V. Ce modèle commute au passage par zéro de la tension : l'oscilloscope, ralenti ${MODEL.slow} fois, montre que le triac attend le prochain zéro pour conduire, et qu'il ne se bloque qu'au zéro de courant qui suit le relâchement de S1. Le triac chauffe (${MODEL.triacDrop} à ses bornes quand il conduit) : il est vissé sur la semelle, posée sur le dissipateur.`,
    stageLabel: "Relais statique câblé sur une platine d'essai : maintenez la figure appuyée, ou la touche Espace, pour fermer S1 et commander le relais.",
    svgLabel: `Platine d'essai : alimentation ${MODEL.inVolts} V continu, bouton poussoir S1, relais statique ouvert sur un dissipateur (bornes 3 et 4 de commande, optocoupleur à cheval sur la fente d'isolement, triac de puissance, bornes 1 et 2), goulotte, bornier L et N, voyant H1 et oscilloscope branché aux bornes du voyant.`,
  },
  en: {
    title: "Solid-state relay",
    pageTitle: "Solid-state relay (SSR): optocoupler and triac",
    hint: "Hold S1 down",
    keys: [
      { mark: "lit", label: "Optocoupler and triac: what conducts while S1 is held (nothing moves)" },
      { mark: "raised", label: "Open housing, circuit board and heatsink" },
      { mark: "dashed", label: "Wire carrying a current" },
    ],
    caption: `Solid-state relay (SSR) with its cover off, on a finned heatsink. Control: S1 applies ${MODEL.inVolts} V DC to terminals 3 (+) and 4 (−); a few milliamperes flow through the resistor and the infrared LED of the optocoupler (its light, invisible to the eye, is shown here). The light crosses the isolation slot in the circuit board and triggers the phototriac, which fires the power triac: current flows from terminal 1 to terminal 2 and pilot light H1 comes on. Nothing moves, and the control side has no electrical connection to the ${MODEL.mainsVolts} V side. This model switches at the zero crossing of the voltage: the oscilloscope, slowed ${MODEL.slow} times, shows the triac waiting for the next zero to conduct, and turning off only at the current zero that follows the release of S1. The triac heats up (1 to 1.5 V across it while it conducts), so it is screwed to the base plate, which sits on the heatsink.`,
    stageLabel: "Solid-state relay wired on a training board: press and hold the figure, or hold Space, to close S1 and switch the relay on.",
    svgLabel: `Training board: ${MODEL.inVolts} V DC supply, push button S1, open solid-state relay on a heatsink (control terminals 3 and 4, optocoupler straddling the isolation slot, power triac, terminals 1 and 2), trunking, L and N terminal block, pilot light H1 and an oscilloscope across the light.`,
  },
};

// ---------------------------------------------------------------- géométrie (az 28° : on regarde depuis +x +y)
const AZ = 28;
const WIDTH = 680;
const HEIGHT = 440;
const PLATE = { x: -184, y: -68, w: 346, d: 130, r: 8 };
const PLATE_H = 10;
const FOOT_H = 5;

// commande
const PSU = { x: 112, y: -58, w: 34, d: 38, r: 3 };
const PSU_H = 26;
const LEDGE = { x: 116, y: -20, w: 26, d: 8, r: 1.2 };
const LEDGE_H = 7;
const PSU_PLUS = [136, -16];
const PSU_MINUS = [122, -16];
const S1_BOX = { x: 106, y: 14, w: 22, d: 22, r: 2.5 };
const S1_H = 12;
const S1_C = [117, 25];
const S1_LEDGE = { x: 128, y: 15, w: 7, d: 20, r: 1 };
const S1_LEDGE_H = 5;
const S1_IN = [131.5, 19];
const S1_OUT = [131.5, 30];
const S1_TRAVEL = 2;

// dissipateur et relais statique
const HS = { x: -78, y: -40, w: 156, d: 80, r: 2 };
const FIN_H = 16;
const HS_TOP = 20;
const Z0 = HS_TOP; // dessous de la semelle du relais
const SOLE = { x: -72, y: -30, w: 144, d: 60, r: 2 };
const SOLE_T = 3;
const ZS = Z0 + SOLE_T; // dessus de la semelle
const OUT_BLK = { x: -72, y: -24, w: 16, d: 48, r: 1.5 };
const IN_BLK = { x: 56, y: -24, w: 16, d: 48, r: 1.5 };
const BLK_TOP = ZS + 15;
const T1 = [-64, -10];
const T2 = [-64, 10];
const T3 = [64, 10]; // + commande
const T4 = [64, -10]; // − commande
const PCB = { x: -24, y: -26, w: 78, d: 52, r: 1 };
const PCB_T = 1.6;
const ZP = ZS + PCB_T + 1.4; // dessus du circuit imprimé (sur entretoises)
const SLOT = { x: -2, y: -20, w: 4, d: 40, r: 2 }; // fente d'isolement
const OPTO = { x: -11, y: -7, w: 22, d: 14, r: 1 };
const OPTO_H = 5;
const TAB = { x: -52, y: -11, w: 22, d: 22, r: 1.2 };
const TRIAC = { x: -45, y: -9, w: 15, d: 18, r: 0.8 };
const TRIAC_H = 4.6;
const CAP = { x: -20, y: 14, w: 12, d: 9, r: 1.6 };
const LED_IND = [46, 18];

const DUCT = { x: -118, y: -60, w: 12, d: 72, r: 1 };
const DUCT_H = 14;
const BORNIER = { x: -174, y: -62, w: 42, d: 12, r: 1.5 };
const BORNIER_H = 10;
const B_Y = -56;
const B_L = -140;
const B_N = -152;
const B_N2 = -164;
const LAMP = { x: -168, y: -14, w: 34, d: 14, r: 2 };
const LAMP_TERMS = [-139, -161];
const LAMP_H = 5;

// oscilloscope (écran sur la face +x, la mieux vue)
const SCOPE = { x: -172, y: 22, w: 44, d: 36, r: 2.5 };
const SCOPE_H = 38;
const FX = SCOPE.x + SCOPE.w; // plan de la face avant
const SCREEN = { y0: 25.5, y1: 54.5, z0: 13, z1: 33 }; // y grand = à gauche à l'écran
const BNC = [{ y: 34, name: "probe" }, { y: 26, name: "ground" }];

function buildFigure(lang) {
  const T = TEXT[lang];
  const P = k.fitProjection([...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [0, 0, BLK_TOP + 8], [SCOPE.x, SCOPE.y, SCOPE_H + 4], [PSU.x, PSU.y, PSU_H]], WIDTH, HEIGHT, { pad: 14, azimuth: AZ });
  const at = (p) => k.iso(p, P);
  const S = (paths, style) => k.solidSvg(paths, style);
  const L = (d, style) => k.lineSvg(d, style);
  const D = (pts, style) => k.dotsSvg(pts, style);
  const depth = (x, y, z = 0) => k.depthOf([x, y, z], P);
  const text = (x, y, z, s, size = 3.2, tone = "mid") => k.faceTextSvg(k.topMatrix([x, y], z, P, "x"), s, { size, tone });
  const screw = (x, y, z, r = 2) => L(k.ring(x, y, r, z, P, 16), { tone: "mid" }) + D([at([x, y, z])], { size: 0.55 }) + L(k.lineOnTop([x - r * 0.55, y - r * 0.55], [x + r * 0.55, y + r * 0.55], z, P), { tone: "lo" });
  const pathD = (pts) => k.pathOf(pts.map(at));
  const onFace = (y, z) => at([FX, y, z]);

  // ---- fils, coupés en morceaux peints à leur place
  const pieces = [];
  const piece = (id, layer, pts, dotAt) => pieces.push({ id, layer, d: pathD(pts), dot: dotAt ? at(dotAt) : null });
  const down = (x, y, z) => [[x, y, z + 0.4], [x, y, 0.4]];
  {
    const pe = LEDGE.y + LEDGE.d + 1.2;
    const se = S1_LEDGE.x + S1_LEDGE.w + 1.2;
    const be = HS.x + HS.w + 1.2; // le fil descend la face +x du dissipateur
    const ie = IN_BLK.x + IN_BLK.w + 1.2;
    piece("ctl-plus", "psu", [[...PSU_PLUS, LEDGE_H], ...down(PSU_PLUS[0], pe, LEDGE_H)], [...PSU_PLUS, LEDGE_H]);
    piece("ctl-plus", "floorRight", [[PSU_PLUS[0], pe, 0.4], [146, pe, 0.4], [146, S1_IN[1], 0.4], [se, S1_IN[1], 0.4]]);
    piece("ctl-plus", "s1", [...down(se, S1_IN[1], S1_LEDGE_H).reverse(), [...S1_IN, S1_LEDGE_H]], [...S1_IN, S1_LEDGE_H]);
    piece("ctl-in3", "s1", [[...S1_OUT, S1_LEDGE_H], ...down(se, S1_OUT[1], S1_LEDGE_H)], [...S1_OUT, S1_LEDGE_H]);
    piece("ctl-in3", "floorRight", [[se, S1_OUT[1], 0.4], [151, S1_OUT[1], 0.4], [151, 46, 0.4], [97, 46, 0.4], [97, T3[1], 0.4], [be, T3[1], 0.4]]);
    piece("ctl-in3", "ssrFront", [[be, T3[1], 0.4], [be, T3[1], HS_TOP + 0.4], [ie, T3[1], BLK_TOP + 0.4], [...T3, BLK_TOP]], [...T3, BLK_TOP]);
    piece("ctl-in4", "ssrFront", [[...T4, BLK_TOP], [ie, T4[1], BLK_TOP + 0.4], [be, T4[1], HS_TOP + 0.4], [be, T4[1], 0.4]], [...T4, BLK_TOP]);
    piece("ctl-in4", "floorRight", [[be, T4[1], 0.4], [100, T4[1], 0.4], [100, -6, 0.4], [PSU_MINUS[0], -6, 0.4], [PSU_MINUS[0], pe, 0.4]]);
    piece("ctl-in4", "psu", [...down(PSU_MINUS[0], pe, LEDGE_H).reverse(), [...PSU_MINUS, LEDGE_H]], [...PSU_MINUS, LEDGE_H]);
  }
  {
    // puissance : 1 et 2 → goulotte (face +x visible) ; goulotte (face −x cachée) → bornier et voyant
    const ox = OUT_BLK.x - 1.2;
    const hx = HS.x - 1.2;
    const dx = DUCT.x + DUCT.w;
    for (const [id, t, slot] of [["pw-1", T1, -12], ["pw-2", T2, 6]]) {
      piece(id, "ssrTop", [[...t, BLK_TOP], [ox, t[1], BLK_TOP + 0.4]], [...t, BLK_TOP]);
      piece(id, "gap", [[ox, t[1], BLK_TOP + 0.4], [hx, t[1], HS_TOP + 0.4], [hx, t[1], 0.4], [hx - 4, t[1], 0.4], [hx - 8, slot, 0.4], [dx + 2.5, slot, 0.4], [dx, slot, 1.6]]);
    }
    const out = {
      "pw-L": { slot: -42, to: [B_L, B_Y], z: BORNIER_H, edgeY: BORNIER.y + BORNIER.d + 1.5 },
      "pw-N": { slot: -36, to: [B_N, B_Y], z: BORNIER_H, edgeY: BORNIER.y + BORNIER.d + 1.5 },
      "pw-H1a": { slot: -18, to: [LAMP_TERMS[0], LAMP.y + 3], z: LAMP_H, edgeY: LAMP.y - 1.5, hidden: true },
      "pw-H1b": { slot: -24, to: [LAMP_TERMS[1], LAMP.y + 3], z: LAMP_H, edgeY: LAMP.y - 1.5, hidden: true },
    };
    for (const [id, r] of Object.entries(out)) {
      const floor = [[DUCT.x, r.slot, 3.2], [DUCT.x - 2.5, r.slot, 0.4], [r.to[0], r.slot, 0.4], [r.to[0], r.edgeY, 0.4]];
      const top = [r.to[0], r.edgeY, r.z + 0.4];
      const end = [r.to[0], r.to[1], r.z];
      if (r.hidden) {
        piece(id, "floorLeft", [...floor, top]);
        piece(id, "lamp", [top, end], end);
      } else {
        piece(id, "floorLeft", floor);
        piece(id, "bornier", [floor[3], top, end], end);
      }
    }
    // sondes de l'oscilloscope : face avant → dessus du voyant, aux bornes a et b
    const front = LAMP.y + LAMP.d + 1.4;
    for (const [id, bnc, x, via] of [["probe", BNC[0], LAMP_TERMS[0], -122], ["ground", BNC[1], LAMP_TERMS[1], -126]]) {
      const lift = [FX, bnc.y, 6];
      const ys = id === "probe" ? 5 : 9;
      piece(id, "probesFloor", [lift, [FX + 2.4, bnc.y, 3.4], [via, bnc.y, 0.4], [via, ys, 0.4], [x, ys, 0.4], [x, front, 0.4], [x, front, LAMP_H + 0.4]], lift);
      piece(id, "lampTop", [[x, front, LAMP_H + 0.4], [x, LAMP.y + 5.2, LAMP_H + 0.4]], [x, LAMP.y + 5.2, LAMP_H]);
    }
  }
  const wiresOn = (layer, tone = "mid") =>
    pieces
      .filter((w) => w.layer === layer)
      .map((w) => `<g class="rl-wire" data-wire="${w.id}">${L(w.d, { tone })}${w.dot ? `<circle class="iso-wire-end" cx="${w.dot[0].toFixed(1)}" cy="${w.dot[1].toFixed(1)}" r="1.1"/>` : ""}</g>`)
      .join("");

  // ---- platine
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
    const strip = { x: -116, y: PLATE.y + PLATE.d - 13, w: 100, d: 6, r: 1 };
    o.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
    const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [1.8, 3.4], P);
    o.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
    const label = { x: 2, y: PLATE.y + PLATE.d - 15, w: 76, d: 10, r: 1.2 };
    o.push(S(k.slabOf(label, 0, 0.8, P, 3), { tone: "mid", crease: "none" }));
    o.push(L(k.planOutline(k.insetPlan(label, 1.4), 0.8, P, 3), { tone: "faint" }));
    o.push(text(label.x + 5, label.y + 6.6, 0.8, `K1 · SSR · 3-32 V ⎓ · ${MODEL.mainsVolts} V ~`, 3, "lo"));
    o.push(D([at([label.x + 2.6, label.y + 5, 0.8]), at([label.x + label.w - 2.6, label.y + 5, 0.8])], { size: 0.4 }));
    return o.join("");
  }

  // ---- commande : alimentation et S1 (mêmes pièces que les figures des relais)
  function psuBox() {
    const o = [`<path class="iso-halo" d="${k.haloOf(PSU, 0, PSU_H, P)}"/>`];
    o.push(S(k.slabOf(PSU, 0, PSU_H, P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(PSU, 6, P, 4), { tone: "faint" }) }));
    for (let i = 0; i < 6; i++) o.push(L(k.planOutline({ x: PSU.x + 14, y: PSU.y + 7 + i * 4.4, w: 16, d: 1.6, r: 0.8 }, PSU_H, P, 3), { tone: "lo" }));
    o.push(text(PSU.x + 5, PSU.y + PSU.d - 6, PSU_H, `${MODEL.inVolts} V ⎓`, 4, "mid"));
    o.push(D(k.corners(PSU, 2.6).map(([x, y]) => at([x, y, PSU_H])), { size: 0.45 }));
    o.push(S(k.slabOf(LEDGE, 0, LEDGE_H, P, 3, 0.4), { tone: "lo" }));
    o.push(screw(...PSU_PLUS, LEDGE_H) + screw(...PSU_MINUS, LEDGE_H));
    o.push(text(PSU_PLUS[0] + 3.4, PSU_PLUS[1] + 1.2, LEDGE_H, "+", 3.4) + text(PSU_MINUS[0] + 3.4, PSU_MINUS[1] + 1.2, LEDGE_H, "−", 3.4));
    return o.join("");
  }
  function s1() {
    const o = [`<path class="iso-halo" d="${k.haloOf(S1_BOX, 0, S1_H, P)}"/>`];
    o.push(S(k.slabOf(S1_BOX, 0, S1_H, P, 4, 0.6), { tone: "mid", inner: L(k.sideSeam(S1_BOX, 3, P, 4), { tone: "faint" }) }));
    o.push(D(k.corners(S1_BOX, 2.4).map(([x, y]) => at([x, y, S1_H])), { size: 0.45 }));
    o.push(S(k.cylinder(S1_C[0], S1_C[1], 7.5, S1_H, 2, P, 40, 0.5), { tone: "mid" }));
    o.push(L(k.knurl(S1_C[0], S1_C[1], 7.5, S1_H + 0.3, S1_H + 1.7, 40, P, 0.3), { tone: "lo" }));
    o.push(text(S1_BOX.x + 2.6, S1_BOX.y + S1_BOX.d - 2.6, S1_H, "S1", 3.2, "lo"));
    o.push(S(k.slabOf(S1_LEDGE, 0, S1_LEDGE_H, P, 3, 0.4), { tone: "lo" }) + screw(...S1_IN, S1_LEDGE_H, 1.8) + screw(...S1_OUT, S1_LEDGE_H, 1.8));
    return o.join("");
  }
  const s1Cap = () => `<g data-move="s1">${S(k.cylinder(S1_C[0], S1_C[1], 5, S1_H + 2, 4, P, 36, 0.8), { tone: "hi", lit: true })}${L(k.ring(S1_C[0], S1_C[1], 3.4, S1_H + 6, P, 28), { tone: "faint" })}</g>`;

  // ---- dissipateur à ailettes : ailettes le long de x, empilées en y, sous une semelle
  function heatsink() {
    const o = [`<path class="iso-halo" d="${k.haloOf(HS, 0, HS_TOP, P)}"/>`];
    const fins = [];
    for (let y = HS.y; y <= HS.y + HS.d - 2.4 + 1e-6; y += (HS.d - 2.4) / 12) fins.push(y);
    for (const y of fins) o.push(S(k.slabOf({ x: HS.x, y, w: HS.w, d: 2.4, r: 0.6 }, 0, FIN_H, P, 2), { tone: "lo", crease: "none" }));
    o.push(S(k.slabOf(HS, FIN_H, HS_TOP - FIN_H, P, 2, 0.6), { tone: "mid", inner: L(k.sideSeam(HS, FIN_H + 1.6, P, 2), { tone: "faint" }) }));
    return o.join("");
  }

  // ---- relais statique, couvercle retiré
  function ssr() {
    const o = [];
    o.push(S(k.slabOf(SOLE, Z0, SOLE_T, P, 2, 0.5), { tone: "mid" }));
    o.push(D(k.corners(SOLE, 3).map(([x, y]) => at([x, y, ZS])), { size: 0.5 }));
    // paroi arrière du boîtier (le couvercle et la paroi avant sont retirés)
    const back = { x: -56, y: -30, w: 112, d: 3, r: 0.6 };
    o.push(S(k.slabOf(back, ZS, 17, P, 2, 0.4), { tone: "lo" }));
    // blocs de bornes
    for (const [blk, terms, names] of [[OUT_BLK, [T1, T2], ["1", "2"]], [IN_BLK, [T4, T3], ["4 −", "3 +"]]]) {
      o.push(S(k.slabOf(blk, ZS, BLK_TOP - ZS, P, 3, 0.5), { tone: "lo", inner: L(k.sideSeam(blk, ZS + 4, P, 3), { tone: "faint" }) }));
      terms.forEach((t, i) => {
        o.push(L(k.planOutline({ x: t[0] - 5, y: t[1] - 5, w: 10, d: 10, r: 1.2 }, BLK_TOP, P, 3), { tone: "faint" }));
        o.push(screw(t[0], t[1], BLK_TOP, 3));
        o.push(text(t[0] - 5, t[1] + 9, BLK_TOP, names[i], 3, "mid"));
      });
    }
    // entretoises et circuit imprimé (côté commande)
    o.push(...k.corners(PCB, 3).map(([x, y]) => S(k.cylinder(x, y, 1.6, ZS, 1.4, P, 14), { tone: "lo" })));
    o.push(S(k.slabOf(PCB, ZS + 1.4, PCB_T, P, 2, 0.3), { tone: "mid", crease: "none" }));
    o.push(L(k.planOutline(SLOT, ZP, P, 4), { tone: "mid" }));
    // pistes (commande à droite de la fente, sortie à gauche)
    const tr = [
      [[IN_BLK.x - 0.5, T3[1]], [44, T3[1]], [44, 7.8], [40, 7.8]],
      [[28, 7.8], [18, 7.8], [18, 3.5], [OPTO.x + OPTO.w + 1.6, 3.5]],
      [[IN_BLK.x - 0.5, T4[1]], [24, T4[1]], [24, -3.5], [OPTO.x + OPTO.w + 1.6, -3.5]],
      [[44, 7.8], [44, LED_IND[1] - 2]],
      [[OPTO.x - 1.6, 3.5], [-8, 3.5]],
      [[OPTO.x - 1.6, -3.5], [-14, -3.5], [-14, -8], [-17, -8], [-17, 0], [PCB.x + 2.2, 0]],
      [[PCB.x + 3, -14], [PCB.x + 5, -14], [PCB.x + 5, -5], [PCB.x + 2.2, -5]],
      [[PCB.x + 3, 14], [PCB.x + 5, 14], [PCB.x + 5, 5], [PCB.x + 2.2, 5]],
    ];
    o.push(L(tr.map((p) => k.onTop(p, ZP, P)).join(""), { tone: "faint" }));
    o.push(D([...tr.flatMap((p) => [p[0], p[p.length - 1]])].map(([x, y]) => at([x, y, ZP])), { size: 0.45, tone: "lo" }));
    // résistance d'entrée R1 (bagues) et diode de protection
    const r1 = { x: 28, y: 6, w: 12, d: 3.6, r: 1.6 };
    o.push(S(k.slabOf(r1, ZP, 3.2, P, 3), { tone: "mid", inner: L([2.4, 4.2, 6, 9.6].map((dx) => k.segment([r1.x + dx, r1.y + r1.d, ZP], [r1.x + dx, r1.y + r1.d, ZP + 3.2], P) + k.segment([r1.x + dx, r1.y + r1.d, ZP + 3.2], [r1.x + dx, r1.y, ZP + 3.2], P)).join(""), { tone: "lo" }) }));
    const d1 = { x: 30, y: -14, w: 9, d: 3, r: 1.4 };
    o.push(S(k.slabOf(d1, ZP, 2.8, P, 3), { tone: "lo", inner: L(k.segment([d1.x + 7, d1.y + d1.d, ZP], [d1.x + 7, d1.y + d1.d, ZP + 2.8], P) + k.segment([d1.x + 7, d1.y + d1.d, ZP + 2.8], [d1.x + 7, d1.y, ZP + 2.8], P), { tone: "hi" }) }));
    // condensateur et résistance d'amortissement (snubber), en parallèle sur la sortie
    o.push(S(k.slabOf(CAP, ZP, 9, P, 4, 0.5), { tone: "mid", inner: L(k.sideSeam(CAP, ZP + 6, P, 4), { tone: "faint" }) }));
    o.push(S(k.slabOf({ x: -20, y: -22, w: 10, d: 3.4, r: 1.5 }, ZP, 3, P, 3), { tone: "mid" }));
    return o.join("");
  }
  // embase métallique du triac (sur la semelle, hors circuit imprimé) et triac
  function triac() {
    const o = [];
    o.push(S(k.slabOf(TAB, ZS, 1.4, P, 2, 0.3), { tone: "mid" }));
    o.push(L(k.ring(TAB.x + 3.6, 0, 2.2, ZS + 1.4, P, 16), { tone: "mid" }), D([at([TAB.x + 3.6, 0, ZS + 1.4])], { size: 0.55 }));
    o.push(`<g class="sr-triac">${S(k.slabOf(TRIAC, ZS + 1.4, TRIAC_H, P, 2, 0.4), { tone: "hi", inner: L(k.planOutline(k.insetPlan(TRIAC, 2), ZS + 1.4 + TRIAC_H, P, 2), { tone: "faint" }) })}</g>`);
    // trois pattes vers le circuit imprimé : A1, G, A2
    for (const y of [-5, 0, 5]) o.push(S(k.slabOf({ x: TRIAC.x + TRIAC.w, y: y - 0.8, w: PCB.x - TRIAC.x - TRIAC.w + 3, d: 1.6, r: 0.3 }, ZP - 0.2, 0.8, P, 2), { tone: "mid", crease: "none" }));
    o.push(D([-5, 0, 5].map((y) => at([PCB.x + 2.2, y, ZP + 0.6])), { size: 0.45 }));
    return o.join("");
  }
  // optocoupleur à cheval sur la fente : diode IR (côté commande), phototriac à détection de zéro (côté sortie)
  function opto() {
    const o = [];
    for (const x of [OPTO.x - 1.6, OPTO.x + OPTO.w]) for (const y of [-3.5, 0, 3.5]) o.push(S(k.slabOf({ x, y: y - 0.6, w: 1.6, d: 1.2, r: 0.2 }, ZP, 3, P, 2), { tone: "mid", crease: "none" }));
    o.push(S(k.slabOf(OPTO, ZP + 0.6, OPTO_H, P, 2, 0.4), { tone: "lo" }));
    const zt = ZP + 0.6 + OPTO_H;
    const win = { x: OPTO.x + 2, y: OPTO.y + 2.4, w: OPTO.w - 4, d: OPTO.d - 4.8, r: 1.4 };
    o.push(`<path class="sr-window" d="${k.pathOf(k.ringOf(win, 4).map(([x, y]) => at([x, y, zt])), true)}"/>`);
    o.push(L(k.planOutline(win, zt, P, 4), { tone: "mid" }));
    // repère de broche 1
    o.push(L(k.ring(OPTO.x + OPTO.w - 1.4, OPTO.y + 1.4, 0.7, zt, P, 10), { tone: "lo" }));
    return o.join("");
  }
  function optoDies() {
    const zt = ZP + 0.6 + OPTO_H;
    const led = at([5.5, 0, zt + 1.4]);
    const pt = at([-5.5, 0, zt + 0.8]);
    const beam = [at([4.2, -1.6, zt + 1.2]), at([-4.4, -1.6, zt + 1]), at([-4.4, 1.6, zt + 1]), at([4.2, 1.6, zt + 1.2])];
    return [
      `<path class="sr-beam" d="${k.pathOf(beam, true)}"/>`,
      `<circle class="sr-ir-glow" cx="${led[0].toFixed(1)}" cy="${led[1].toFixed(1)}" r="${(P.scale * 7).toFixed(1)}" fill="url(#sr-ir)"/>`,
      `<g class="sr-led">${S(k.cylinder(5.5, 0, 1.6, zt, 1.4, P, 16), { tone: "hi" })}</g>`,
      `<g class="sr-photo">${S(k.slabOf({ x: -7.2, y: -1.8, w: 3.4, d: 3.6, r: 0.3 }, zt, 0.8, P, 2), { tone: "hi" })}</g>`,
      D([pt], { size: 0.4, tone: "lo" }),
    ].join("");
  }
  function indicator() {
    const [x, y] = LED_IND;
    const c = at([x, y, ZP + 3]);
    return `<circle class="sr-ind-glow" cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="${(P.scale * 9).toFixed(1)}" fill="url(#sr-ind)"/><g class="sr-ind">${S(k.cylinder(x, y, 1.8, ZP, 2.6, P, 16), { tone: "hi" })}</g>`;
  }
  // liaisons de puissance internes : bornes 1 et 2 → pattes du triac (cuivre souple)
  function busbars() {
    const curve = (a, b, lift) => {
      const pts = [];
      for (let i = 0; i <= 16; i++) {
        const t = i / 16;
        pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t + lift * 4 * t * (1 - t)]);
      }
      return pts;
    };
    const runs = [
      ["int-1", curve([OUT_BLK.x + OUT_BLK.w, -14, ZS + 6], [PCB.x + 3, -14, ZP], 2)],
      ["int-2", curve([OUT_BLK.x + OUT_BLK.w, 14, ZS + 6], [PCB.x + 3, 14, ZP], 2)],
    ];
    return runs.map(([id, pts]) => `<g class="rl-wire" data-wire="${id}">${L(pathD(pts), { tone: "mid" })}<circle class="iso-wire-end" cx="${at(pts[16])[0].toFixed(1)}" cy="${at(pts[16])[1].toFixed(1)}" r="0.9"/><circle class="iso-wire-end" cx="${at(pts[0])[0].toFixed(1)}" cy="${at(pts[0])[1].toFixed(1)}" r="1.1"/></g>`).join("");
  }

  // ---- goulotte, bornier, voyant
  function duct() {
    const o = [S(k.slabOf(DUCT, 0, DUCT_H, P, 2, 0.4), { tone: "lo" })];
    const fx = DUCT.x + DUCT.w;
    const slots = [];
    for (let y = DUCT.y + 6; y <= DUCT.y + DUCT.d - 6; y += 6) slots.push(k.pathOf([[fx, y - 1.1, 1.6], [fx, y + 1.1, 1.6], [fx, y + 1.1, DUCT_H - 1.6], [fx, y - 1.1, DUCT_H - 1.6]].map(at), true));
    o.push(L(slots.join(""), { tone: "faint" }));
    o.push(S(k.slabOf(k.insetPlan(DUCT, -0.8), DUCT_H, 1.6, P, 2, 0.4), { tone: "mid" }));
    o.push(D([at([DUCT.x + DUCT.w / 2, DUCT.y + 6, DUCT_H + 1.6]), at([DUCT.x + DUCT.w / 2, DUCT.y + DUCT.d - 6, DUCT_H + 1.6])], { size: 0.45 }));
    return o.join("");
  }
  function bornier() {
    const o = [S(k.slabOf(BORNIER, 0, BORNIER_H, P, 3, 0.5), { tone: "mid" })];
    const seams = [B_L - 6.5, B_N - 6.5].map((x) => k.segment([x, BORNIER.y, BORNIER_H], [x, BORNIER.y + BORNIER.d, BORNIER_H], P) + k.segment([x, BORNIER.y + BORNIER.d, BORNIER_H], [x, BORNIER.y + BORNIER.d, 0], P));
    o.push(L(seams.join(""), { tone: "faint" }));
    o.push(screw(B_L, B_Y, BORNIER_H, 2.2) + screw(B_N, B_Y, BORNIER_H, 2.2) + screw(B_N2, B_Y, BORNIER_H, 2.2));
    o.push(S(k.slabOf({ x: B_N2 - 1, y: BORNIER.y + 1.2, w: B_N - B_N2 + 2, d: 2.6, r: 0.8 }, BORNIER_H, 0.8, P, 2), { tone: "hi", crease: "none" }));
    o.push(text(B_L - 1.2, BORNIER.y + BORNIER.d - 1.6, BORNIER_H, "L") + text(B_N - 1.2, BORNIER.y + BORNIER.d - 1.6, BORNIER_H, "N") + text(B_N2 - 1.2, BORNIER.y + BORNIER.d - 1.6, BORNIER_H, "N"));
    return o.join("");
  }
  function lamp() {
    const b = LAMP;
    const cx = b.x + b.w / 2;
    const cy = b.y + b.d / 2 + 1;
    const o = [S(k.slabOf(b, 0, LAMP_H, P, 3, 0.5), { tone: "mid" })];
    o.push(screw(LAMP_TERMS[0], b.y + 3, LAMP_H, 1.8) + screw(LAMP_TERMS[1], b.y + 3, LAMP_H, 1.8));
    o.push(text(b.x + 2.4, b.y + b.d - 2, LAMP_H, "H1", 3, "lo"));
    o.push(wiresOn("lamp"), wiresOn("lampTop", "lo"));
    o.push(S(k.cylinder(cx, cy, 6.4, LAMP_H, 2, P, 40, 0.4), { tone: "lo" }));
    o.push(S(k.cylinder(cx, cy, 5.2, LAMP_H + 2, 5, P, 40), { tone: "mid", inner: L(k.sideArc(cx, cy, 5.2, LAMP_H + 4.5, P, 24), { tone: "faint" }) }));
    const c = at([cx, cy, LAMP_H + 12]);
    const r = P.scale * 5.4;
    o.push(`<circle class="rl-glow" cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="${(P.scale * 26).toFixed(1)}" fill="url(#sr-lamp)"/><g class="rl-lens"><circle class="rl-glass" cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="${r.toFixed(1)}"/><path class="iso-line" data-tone="faint" data-free="both" d="M${(c[0] - r * 0.55).toFixed(1)} ${(c[1] - r * 0.3).toFixed(1)}Q${(c[0] - r * 0.4).toFixed(1)} ${(c[1] - r * 0.7).toFixed(1)} ${(c[0] - r * 0.02).toFixed(1)} ${(c[1] - r * 0.72).toFixed(1)}"/></g>`);
    return o.join("");
  }

  // ---- oscilloscope : écran dans le plan de la face +x
  function scope() {
    const o = [`<path class="iso-halo" d="${k.haloOf(SCOPE, 0, SCOPE_H, P)}"/>`];
    o.push(S(k.slabOf(SCOPE, 0, SCOPE_H, P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(SCOPE, 4, P, 4), { tone: "faint" }) }));
    // poignée sur le dessus, boutons et grille d'aération
    o.push(S(k.slabOf({ x: SCOPE.x + 6, y: SCOPE.y + 4, w: 4, d: SCOPE.d - 8, r: 1.6 }, SCOPE_H, 2, P, 3), { tone: "lo" }));
    for (const [y, r] of [[SCOPE.y + 8, 3], [SCOPE.y + 17, 3], [SCOPE.y + 27, 2.4]]) {
      const x = SCOPE.x + SCOPE.w - 7;
      o.push(S(k.cylinder(x, y, r, SCOPE_H, 3, P, 28, 0.4), { tone: "mid" }) + L(k.knurl(x, y, r, SCOPE_H + 0.3, SCOPE_H + 2.7, 24, P, 0.3), { tone: "lo" }) + L(k.lineOnTop([x, y], [x + r - 0.6, y], SCOPE_H + 3, P), { tone: "hi" }));
    }
    for (let i = 0; i < 5; i++) o.push(L(k.planOutline({ x: SCOPE.x + 14 + i * 3.4, y: SCOPE.y + 6, w: 1.6, d: SCOPE.d - 12, r: 0.8 }, SCOPE_H, P, 3), { tone: "lo" }));
    // lunette, écran, graticule
    const rect = (y0, y1, z0, z1) => k.pathOf([onFace(y0, z0), onFace(y1, z0), onFace(y1, z1), onFace(y0, z1)], true);
    o.push(L(rect(SCREEN.y0 - 1.6, SCREEN.y1 + 1.6, SCREEN.z0 - 1.6, SCREEN.z1 + 1.6), { tone: "lo" }));
    o.push(`<path class="sr-screen" d="${rect(SCREEN.y0, SCREEN.y1, SCREEN.z0, SCREEN.z1)}"/>`);
    const grid = [];
    for (let i = 1; i < 8; i++) {
      const y = SCREEN.y0 + ((SCREEN.y1 - SCREEN.y0) * i) / 8;
      grid.push(k.pathOf([onFace(y, SCREEN.z0), onFace(y, SCREEN.z1)]));
    }
    for (let i = 1; i < 6; i++) {
      const z = SCREEN.z0 + ((SCREEN.z1 - SCREEN.z0) * i) / 6;
      grid.push(k.pathOf([onFace(SCREEN.y0, z), onFace(SCREEN.y1, z)]));
    }
    o.push(`<g class="sr-grid">${L(grid.join(""), { tone: "faint" })}</g>`);
    o.push(L(rect(SCREEN.y0, SCREEN.y1, SCREEN.z0, SCREEN.z1), { tone: "mid" }));
    o.push(`<path class="iso-line sr-mains" data-tone="lo" data-free="both" d=""/><path class="iso-line sr-trace" data-tone="lit" data-free="both" d=""/>`);
    // prises BNC sous l'écran
    for (const b of BNC) {
      o.push(L(k.sideRing([FX, b.y, 6], 2.2, "x", P) + k.sideRing([FX, b.y, 6], 1.1, "x", P), { tone: "mid" }));
    }
    o.push(D([onFace(SCREEN.y1 - 2, 6), onFace(SCREEN.y1 - 6, 6)], { size: 0.5, tone: "mid" }));
    return o.join("");
  }

  // ---- assemblage, de l'arrière vers l'avant
  const body = [
    `<defs><radialGradient id="sr-lamp"><stop offset="0" class="rl-stop-0"/><stop offset=".4" class="rl-stop-1"/><stop offset="1" class="rl-stop-2"/></radialGradient><radialGradient id="sr-ir"><stop offset="0" class="sr-ir-0"/><stop offset=".45" class="sr-ir-1"/><stop offset="1" class="sr-ir-2"/></radialGradient><radialGradient id="sr-ind"><stop offset="0" class="sr-ind-0"/><stop offset=".4" class="sr-ind-1"/><stop offset="1" class="sr-ind-2"/></radialGradient></defs>`,
    plate(),
    wiresOn("floorLeft"),
    bornier(),
    wiresOn("bornier"),
    lamp(),
    duct(),
    wiresOn("gap"),
    scope(),
    wiresOn("probesFloor", "lo"),
    heatsink(),
    ssr(),
    wiresOn("ssrTop"),
    triac(),
    busbars(),
    opto(),
    optoDies(),
    indicator(),
    wiresOn("ssrFront"),
    wiresOn("floorRight"),
    psuBox(),
    wiresOn("psu"),
    s1(),
    wiresOn("s1"),
    s1Cap(),
  ];
  const svg = k.figureSvg({ width: WIDTH, height: HEIGHT, label: T.svgLabel, body });
  const face = (y, z) => onFace(y, z);
  const config = {
    lang,
    P,
    s1Travel: S1_TRAVEL,
    slow: MODEL.slow,
    hz: MODEL.mainsHz,
    // écran : quatre coins projetés (y0,z0) (y1,z0) (y0,z1) pour interpoler la trace dans le plan de la face
    screen: { o: face(SCREEN.y1, (SCREEN.z0 + SCREEN.z1) / 2), u: face(SCREEN.y0, (SCREEN.z0 + SCREEN.z1) / 2), v: face(SCREEN.y1, SCREEN.z1) },
    ctlWires: ["ctl-plus", "ctl-in3", "ctl-in4"],
    powerWires: ["pw-1", "pw-2", "pw-L", "pw-N", "pw-H1a", "pw-H1b", "int-1", "int-2"],
  };
  return { svg, config };
}

// ---------------------------------------------------------------- styles
const CSS = `
.rl-glass{fill:var(--anatomy-paper);fill-opacity:.6;stroke:var(--anatomy-hi);stroke-width:var(--anatomy-weight);vector-effect:non-scaling-stroke}
.rl-glow,.sr-ir-glow,.sr-ind-glow{opacity:0;pointer-events:none;mix-blend-mode:var(--rl-blend,screen)}
.rl-stop-0{stop-color:var(--rl-glow-0)}.rl-stop-1{stop-color:var(--rl-glow-1)}.rl-stop-2{stop-color:var(--rl-glow-2)}
.sr-ir-0{stop-color:var(--sr-ir-0)}.sr-ir-1{stop-color:var(--sr-ir-1)}.sr-ir-2{stop-color:var(--sr-ir-2)}
.sr-ind-0{stop-color:var(--sr-ind-0)}.sr-ind-1{stop-color:var(--sr-ind-1)}.sr-ind-2{stop-color:var(--sr-ind-2)}
.iso{--rl-glow-0:#ffd98a;--rl-glow-1:#ffb84a55;--rl-glow-2:#ff9d2a00;--rl-hot:#ffd98a;--sr-ir-0:#ff6a5a;--sr-ir-1:#d0303055;--sr-ir-2:#a0101000;--sr-ind-0:#9dffb0;--sr-ind-1:#40d06a55;--sr-ind-2:#20a04000;--sr-screen:#0a120d;--sr-beam:#ff5a4a}
.iso[data-theme="light"]{--rl-glow-0:#ffcf6a;--rl-glow-1:#ffb84a40;--rl-glow-2:#ff9d2a00;--rl-hot:#c77a0a;--rl-blend:multiply;--sr-ir-0:#ff7a6a;--sr-ir-1:#e0404040;--sr-ir-2:#c0202000;--sr-ind-0:#7ee69a;--sr-ind-1:#30b05a40;--sr-ind-2:#20904000;--sr-screen:#eef3ef;--sr-beam:#e0483a}
.rl-lens[data-on] .rl-glass{fill:var(--rl-glow-0);fill-opacity:.55;stroke:var(--rl-hot)}
.rl-wire[data-live] .iso-line{stroke:var(--anatomy-lit);stroke-dasharray:2 4;animation:iso-flow 1600ms linear infinite}
.rl-wire[data-live] .iso-wire-end{stroke:var(--anatomy-lit)}
.sr-screen{fill:var(--sr-screen);stroke:none}
.sr-window{fill:var(--anatomy-paper);stroke:none}
.sr-beam{fill:var(--sr-beam);opacity:0;stroke:none;mix-blend-mode:var(--rl-blend,screen)}
.sr-trace{stroke-width:1.1}
[data-on] .sr-led .iso-edge,[data-on] .sr-photo .iso-edge,.sr-triac[data-on] .iso-edge,[data-on] .sr-ind .iso-edge{stroke:var(--anatomy-lit)}
.sr-triac[data-on] .iso-top{fill:var(--anatomy-lit-top)}
.iso-stage{cursor:pointer;touch-action:manipulation;outline-offset:6px;-webkit-user-select:none;user-select:none}
.iso-stage:focus-visible{outline:2px solid var(--anatomy-hi)}
@media (prefers-reduced-motion:reduce){.rl-wire[data-live] .iso-line{animation:none}}
@media (max-width:560px){.iso-plate-corner[data-corner="readout"]{white-space:normal;left:0;text-align:right;line-height:1.4}.iso-plate-corner[data-corner="hint"]{bottom:auto;top:16px}.iso-plate{padding:56px 12px 64px}}
`;

// ---------------------------------------------------------------- comportement
const LIVE = `
const still = matchMedia("(prefers-reduced-motion: reduce)");
const READ = {
  fr: (s) => [s.ctl ? "entrée ${MODEL.inVolts} V ⎓ · LED IR allumée" : "entrée 0 V", s.on ? (s.ctl ? "triac conducteur · H1 allumé" : "conduit jusqu'au zéro de courant · H1 allumé") : s.ctl ? "attente du zéro de tension" : "triac bloqué", "ralenti ×${MODEL.slow}"].join(" · "),
  en: (s) => [s.ctl ? "input ${MODEL.inVolts} V DC · IR LED on" : "input 0 V", s.on ? (s.ctl ? "triac conducting · H1 on" : "conducting until current zero · H1 on") : s.ctl ? "waiting for voltage zero" : "triac off", "slowed ×${MODEL.slow}"].join(" · "),
};
for (const stage of document.querySelectorAll(".iso-stage[data-ssr]")) {
  const C = FIG;
  if (stage.dataset.ready) continue;
  stage.dataset.ready = "1";
  const svg = stage.querySelector("svg");
  const readout = stage.closest(".iso-plate").querySelector("[data-readout]");
  const cap = svg.querySelector('[data-move="s1"]');
  const wires = [...svg.querySelectorAll(".rl-wire")];
  const trace = svg.querySelector(".sr-trace");
  const mains = svg.querySelector(".sr-mains");
  const lens = svg.querySelector(".rl-lens");
  const glow = svg.querySelector(".rl-glow");
  const irGlow = svg.querySelector(".sr-ir-glow");
  const beam = svg.querySelector(".sr-beam");
  const indGlow = svg.querySelector(".sr-ind-glow");
  const marks = [svg.querySelector(".sr-led"), svg.querySelector(".sr-photo"), svg.querySelector(".sr-ind")];
  const triac = svg.querySelector(".sr-triac");
  const f = 1; // fréquence montrée (50 Hz ralentis 50 fois)
  const WINDOW = 2; // périodes affichées
  const N = 160;
  const hist = []; // [phase, v, vLoad]
  let pressed = false, capPos = 0, led = 0, on = false, wasOn = false, lampAt = 0, phase = 0, lastV = 0;
  let frame = 0, last = 0, clock = 0, visible = false, idle = 0, touring = !still.matches;
  const S = C.screen;
  const pt = (u, v) => [S.o[0] + (S.u[0] - S.o[0]) * u + (S.v[0] - S.o[0]) * v, S.o[1] + (S.u[1] - S.o[1]) * u + (S.v[1] - S.o[1]) * v];
  const poly = (k) => { let d = ""; hist.forEach((h, i) => { const p = pt(i / (N - 1), h[k] * 0.82); d += (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }); return d; };
  function step(dt, calm) {
    if (touring) { clock += dt; pressed = clock % 5 > 1.2 && clock % 5 < 3.4; }
    const capTarget = pressed ? 1 : 0;
    capPos = calm ? capTarget : capPos + (capTarget - capPos) * (1 - Math.exp(-dt / 0.04));
    const ctl = pressed && capPos > 0.95;
    led = calm ? +ctl : led + (+ctl - led) * (1 - Math.exp(-dt / 0.03));
    if (calm) {
      on = ctl; wasOn = false;
      hist.length = 0;
      for (let i = 0; i < N; i++) { const v = Math.sin(2 * Math.PI * WINDOW * i / (N - 1)); hist.push([0, v, on ? v : 0]); }
    } else {
      // le temps de l'oscilloscope avance par petits pas : le triac n'est amorcé (ou bloqué) qu'au passage par zéro
      const sub = Math.max(1, Math.ceil(dt * N / WINDOW / f));
      for (let i = 0; i < sub; i++) {
        phase += (2 * Math.PI * f * dt) / sub;
        const v = Math.sin(phase);
        const crossed = (lastV <= 0 && v > 0) || (lastV >= 0 && v < 0);
        if (crossed) {
          if (!on && ctl) on = true;            // zéro de tension : amorçage
          else if (on && !ctl) on = false;      // zéro de courant (charge résistive) : blocage
        }
        if (on) wasOn = true;
        if (!on && !ctl) wasOn = false;
        lastV = v;
        hist.push([phase, v, on ? v : 0]);
      }
      while (hist.length > N) hist.shift();
      if (on && !ctl) wasOn = true;
    }
    const want = on ? 1 : 0;
    lampAt = calm ? want : lampAt + (want - lampAt) * (1 - Math.exp(-dt / (want ? 0.08 : 0.25)));
    return ctl;
  }
  function draw(ctl) {
    cap.setAttribute("transform", translateAlong(C.P, [0, 0, -C.s1Travel * capPos]));
    mains.setAttribute("d", poly(1));
    trace.setAttribute("d", poly(2));
    const live = new Set();
    if (ctl) for (const id of C.ctlWires) live.add(id);
    if (on) for (const id of C.powerWires) live.add(id);
    for (const w of wires) { if (live.has(w.dataset.wire)) w.setAttribute("data-live", ""); else w.removeAttribute("data-live"); }
    for (const m of marks) { if (led > 0.5) m.setAttribute("data-on", ""); else m.removeAttribute("data-on"); }
    if (on) triac.setAttribute("data-on", ""); else triac.removeAttribute("data-on");
    if (lampAt > 0.5) lens.setAttribute("data-on", ""); else lens.removeAttribute("data-on");
    glow.style.opacity = lampAt.toFixed(3);
    irGlow.style.opacity = (0.9 * led).toFixed(3);
    beam.style.opacity = (0.55 * led).toFixed(3);
    indGlow.style.opacity = led.toFixed(3);
    const txt = READ[C.lang]({ ctl, on, wasOn: wasOn && !on });
    if (readout.textContent !== txt) readout.textContent = txt;
    stage.setAttribute("aria-pressed", pressed ? "true" : "false");
    stage.dataset.state = (ctl ? "ctl " : "") + (on ? "on" : "off");
  }
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
    last = now;
    const calm = still.matches;
    draw(step(dt, calm));
    frame = visible && !(calm && !touring) ? requestAnimationFrame(tick) : 0;
  }
  const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
  const press = (down) => { touring = false; pressed = down; clearTimeout(idle); if (!down) idle = setTimeout(() => { touring = !still.matches; clock = 0; run(); }, 6000); run(); };
  new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); else { cancelAnimationFrame(frame); frame = 0; } }, { rootMargin: "120px 0px" }).observe(stage);
  stage.addEventListener("pointerdown", (e) => { stage.setPointerCapture?.(e.pointerId); press(true); });
  stage.addEventListener("pointerup", () => press(false));
  stage.addEventListener("pointercancel", () => press(false));
  stage.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); if (!e.repeat) press(true); } });
  stage.addEventListener("keyup", (e) => { if (e.key === " " || e.key === "Enter") press(false); });
  stage.addEventListener("blur", () => { if (pressed && !touring) press(false); });
  for (let i = 0; i < N; i++) { phase += 2 * Math.PI * WINDOW / N; lastV = Math.sin(phase); hist.push([phase, lastV, 0]); }
  draw(false);
}
`;

// ---------------------------------------------------------------- pages
const written = [];
const site = { fragments: {}, scripts: {} };
for (const lang of ["fr", "en"]) {
  const T = TEXT[lang];
  const { svg, config } = buildFigure(lang);
  const plate = k.plateHtml({
    fig: "Fig 5",
    title: T.title,
    hint: T.hint,
    readout: "",
    keys: T.keys,
    caption: T.caption,
    body: `<div class="iso-stage" data-ssr tabindex="0" role="button" aria-pressed="false" aria-label="${T.stageLabel}">${svg}</div>`,
  });
  site.fragments[lang] = plate;
  site.scripts[lang] = `const FIG = ${JSON.stringify(config)};` + LIVE;
  for (const theme of ["dark", "light"]) {
    const name = `relais-statique.${lang}${theme === "light" ? "-light" : ""}.html`;
    const html = k.pageHtml({ title: T.pageTitle, theme, body: `<style>${CSS}</style>${plate}`, script: KIT_SOURCE + `const FIG = ${JSON.stringify(config)};` + LIVE, width: 760 }).replace('<html lang="en">', `<html lang="${lang}">`);
    writeFileSync(join(HERE, name), html);
    written.push(name);
  }
}
written.push(...publish("relais-statique", { ...site, css: CSS }));
console.log("wrote", written.join(", "));
