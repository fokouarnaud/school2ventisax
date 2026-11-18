// Figure commune des démarreurs animés (skill anatomy) : un coffret de démarrage sur un banc, relié par deux câbles
// au moteur, et, dessous, les schémas de commande et de puissance qui s'animent en même temps que le coffret.
// Utilisée par figures/etoile-triangle/build.mjs et figures/fractionne-schemas/build.mjs.
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./iso-kit.mjs";
import * as G from "./lathe.mjs";
import { CONTROLS_CSS, writeFigure } from "./acad-bench.mjs";
import { namespaced } from "./bundle.mjs";
import { LADDER_CSS, LADDER_LIVE, BLADE, schematicSvg } from "./ladder.mjs";
import { STARTERS } from "../_data/demarreurs.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = join(HERE, "..", "_data", "demarreurs.mjs");

// ---------------------------------------------------------------- géométrie (az 28° : y horizontal à l'écran)
const AZ = 28;
const WIDTH = 680;
const HEIGHT = 420;
const PLATE = { x: -84, y: -214, w: 134, d: 366, r: 8 };
const PLATE_H = 10;
const FOOT_H = 5;
const CAB = { x: -76, y: -204, w: 34, d: 166, r: 3 };
const CAB_H = 126;
const PFX = CAB.x + CAB.w;
const DEV = 11;
const SBTN = { y: -58, z1: 62, z0: 46 };
const DIAL = { y: -176, z: 98, r: 13 };
const R = 27;
const CZ = 38;
const Y0 = 18;
const LEN = 88;
const BOX = { x: -24, y: Y0 + 20, w: 48, d: 50, r: 2.5 };
const BOX_Z = CZ + R - 2;
const BOX_H = 12;
const BOARD = { x: -20.5, y: BOX.y + 4, w: 41, d: 42, r: 1.8 };
const BOARD_Z = BOX_Z + BOX_H;
const ZB = BOARD_Z + 3;
const ROW1 = -9;
const ROW2 = 9;
const COLS = [BOX.y + 40, BOX.y + 27, BOX.y + 14];

function buildIso(spec, T) {
  const F = G.frameOf([0, Y0, CZ], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  const P = k.fitProjection([...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [CAB.x, CAB.y, CAB_H], [CAB.x, CAB.y + CAB.d, CAB_H], [0, Y0 + LEN + 30, CZ + 14], [0, 40, ZB + 10]], WIDTH, HEIGHT, { pad: 12, azimuth: AZ, elevation: 38 });
  const at = (p) => k.iso(p, P);
  const S = (paths, style) => k.solidSvg(paths, style);
  const L = (d, style) => k.lineSvg(d, style);
  const D = (pts, style) => k.dotsSvg(pts, style);
  const depth = (x, y, z = 0) => k.depthOf([x, y, z], P);
  const pathD = (pts) => k.pathOf(pts.map(at));
  const faceText = (x, y, z, s, size, tone, anchor = "middle") => k.faceTextSvg(k.sideMatrix([x, y], z, P, "right"), s, { size, tone, anchor });
  const onFace = (x, y, z) => at([x, y, z]);
  const box3 = (y0, y1, z0, z1, x0, dx, tone, bevel = 0.4, extra = {}) => S(k.slabOf({ x: x0, y: y1, w: dx, d: y0 - y1, r: 0.8 }, z0, z1 - z0, P, 2, bevel), { tone, ...extra });
  const faceDisc = (x, y, z, a, b, r, steps = 20, bevel = 0.2) => G.disc(a, b, r, G.frameOf([x, y, z], [1, 0, 0], [0, 1, 0], [0, 0, 1]), P, { steps, bevel });

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
    const strip = { x: PLATE.x + PLATE.w - 12, y: 0, w: 6, d: 150, r: 1 };
    o.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
    const t = k.topTicks(strip.y + 4, strip.y + strip.d - 4, 4, 5, strip.x + 0.8, 0.6, [1.8, 3.4], P, "y");
    o.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
    for (const y of [Y0 + 10, Y0 + LEN - 20]) for (const x of [-25, 25]) o.push(S(k.cylinder(x, y + 5, 6, 0, 3, P, 24, 0.4), { tone: "lo" }));
    return o.join("");
  }

  function cabinet() {
    const o = [`<path class="iso-halo" d="${k.haloOf(CAB, 0, CAB_H, P)}"/>`];
    o.push(S(k.slabOf(CAB, 0, CAB_H, P, 4, 1), { tone: "mid", inner: L(k.sideSeam(CAB, 10, P, 4) + k.sideSeam(CAB, CAB_H - 8, P, 4), { tone: "faint" }) }));
    o.push(L(k.planOutline(k.insetPlan(CAB, 3), CAB_H, P, 3), { tone: "faint" }));
    o.push(D(k.corners(CAB, 6).map(([x, y]) => at([x, y, CAB_H])), { size: 0.5 }));
    for (const z of [59, 27]) o.push(box3(-66, -192, z - 3.5, z + 3.5, PFX, 1.6, "lo", 0.2));
    o.push(box3(-62, -192, 3, 10, PFX, 6, "lo", 0.4, { inner: L(Array.from({ length: 15 }, (_, i) => k.pathOf([onFace(PFX + 6, -66 - i * 8.6, 10), onFace(PFX + 6, -66 - i * 8.6, 6)])).join(""), { tone: "faint" }) }));
    for (const [z, x] of [[70, -50], [70, -62]]) o.push(S(G.disc(0, 4, 4, G.frameOf([x, CAB.y + CAB.d, z], [0, 1, 0], [1, 0, 0], [0, 0, 1]), P, { steps: 24, bevel: 0.3 }), { tone: "lo" }));
    return o.join("");
  }

  // ---- appareils de la face
  const parts = [];
  const contactor = (c) => {
    const o = [box3(c.y + 8, c.y - 8, c.z - 13, c.z + 13, PFX, DEV, "mid", 0.6)];
    const xf = PFX + DEV;
    for (const z of [c.z + 9.5, c.z - 9.5]) o.push(D([-5, 0, 5].map((dy) => onFace(xf, c.y + dy, z)), { size: 0.55, tone: "mid" }) + L([-5, 0, 5].map((dy) => k.sideRing([xf, c.y + dy, z], 1.6, "x", P, 12)).join(""), { tone: "lo" }));
    o.push(box3(c.y + 4, c.y - 4, c.z - 4, c.z + 4, xf, 0.6, "lo", 0.2));
    o.push(`<g class="st-plunger" data-k="${c.name}">${box3(c.y + 2.6, c.y - 2.6, c.z - 2.6, c.z + 2.6, xf + 0.6, 2.4, "hi", 0.2)}</g>`);
    o.push(faceText(xf + 0.1, c.y, c.z - 7.4, c.name, 3, "hi"));
    if (c.block) {
      // bloc temporisé travail clipsé sur le dessus : boîtier, bouton de réglage gradué, index qui tourne
      const bz = c.z + 13;
      o.push(box3(c.y + 7, c.y - 7, bz, bz + 13, PFX + 2, DEV - 1, "mid", 0.5));
      const xb = PFX + DEV + 1;
      const cz = bz + 6.5;
      o.push(S(faceDisc(xb, c.y, cz, 0, 1.4, 4.4, 28), { tone: "lo" }));
      const ticks = [];
      for (let i = 0; i <= 10; i++) {
        const a = Math.PI * (1.25 - (1.5 * i) / 10);
        const r0 = i % 5 === 0 ? 4.6 : 5.1;
        ticks.push(k.pathOf([onFace(xb + 0.05, c.y - Math.cos(a) * r0, cz + Math.sin(a) * r0), onFace(xb + 0.05, c.y - Math.cos(a) * 5.8, cz + Math.sin(a) * 5.8)]));
      }
      o.push(L(ticks.join(""), { tone: "mid" }));
      o.push(`<path class="iso-line st-timer-needle" data-tone="lit" data-free="both" d=""/>`);
      o.push(D([onFace(xb + 1.4, c.y, cz)], { size: 0.6, tone: "hi" }));
      parts.timerFace = { x: xb + 1.45, y: c.y, z: cz, r: 3.8 };
    }
    return { d: depth(xf, c.y, c.z), s: o.join("") };
  };
  const relay = (c) => {
    const o = [box3(c.y + 8, c.y - 8, c.z - 9, c.z + 9, PFX, DEV - 2, "lo", 0.5)];
    const xf = PFX + DEV - 2;
    o.push(S(faceDisc(xf, c.y + 3.5, c.z + 3, 0, 1.4, 3, 20), { tone: "mid" }));
    o.push(L(k.pathOf([at([xf + 1.5, c.y + 3.5, c.z + 3.6]), at([xf + 1.5, c.y + 3.5, c.z + 5.6])]), { tone: "hi" }));
    o.push(S(faceDisc(xf, c.y - 3.5, c.z + 3, 0, 1.6, 2, 16, 0), { tone: "hi" }));
    o.push(`<g class="st-flag" data-f="${c.name}">${box3(c.y + 1.5, c.y - 5, c.z - 6, c.z - 3.4, xf, 1.2, "hi", 0.2)}</g>`);
    o.push(faceText(xf + 0.1, c.y + 4, c.z - 3.6, c.name, 2.6, "mid"));
    return { d: depth(xf, c.y, c.z), s: o.join("") };
  };
  const timer = (c) => {
    const o = [box3(c.y + 5, c.y - 5, c.z - 13, c.z + 13, PFX, DEV - 1, "mid", 0.5)];
    const xf = PFX + DEV - 1;
    o.push(S(faceDisc(xf, c.y, c.z + 3, 0, 1.8, 3.4, 24), { tone: "mid" }));
    const ticks = [];
    for (let i = 0; i <= 6; i++) {
      const a = Math.PI * (1.25 - (1.5 * i) / 6);
      ticks.push(k.pathOf([onFace(xf + 0.05, c.y - Math.cos(a) * 3.8, c.z + 3 + Math.sin(a) * 3.8), onFace(xf + 0.05, c.y - Math.cos(a) * 4.6, c.z + 3 + Math.sin(a) * 4.6)]));
    }
    o.push(L(ticks.join(""), { tone: "lo" }));
    o.push(`<path class="iso-line st-timer-needle" data-tone="lit" data-free="both" d=""/>`);
    parts.timerFace = { x: xf + 1.85, y: c.y, z: c.z + 3, r: 2.8 };
    o.push(S(faceDisc(xf, c.y, c.z + 9, 0, 1, 1.4, 14, 0), { tone: "lo" }));
    o.push(`<g class="st-led" data-led="timer">${S(faceDisc(xf, c.y, c.z + 9, 1, 1.6, 1, 14, 0), { tone: "hi" })}</g>`);
    o.push(faceText(xf + 0.1, c.y, c.z - 7, c.name, 2.6, "hi"));
    return { d: depth(xf, c.y, c.z), s: o.join("") };
  };
  const module = (c) => {
    const o = [box3(c.y + 9, c.y - 9, c.z - 11, c.z + 11, PFX, DEV - 3, "lo", 0.5)];
    const xf = PFX + DEV - 3;
    for (const z of [c.z + 8, c.z - 8]) o.push(D([-4, 0, 4].map((dy) => onFace(xf, c.y + dy, z)), { size: 0.5, tone: "mid" }));
    o.push(S(faceDisc(xf, c.y - 4, c.z + 2, 0, 1, 1.6, 14, 0), { tone: "lo" }));
    o.push(`<g class="st-led" data-led="module">${S(faceDisc(xf, c.y - 4, c.z + 2, 1, 1.6, 1.1, 14, 0), { tone: "hi" })}</g>`);
    o.push(faceText(xf + 0.1, c.y + 3, c.z + 0.8, "PTC", 2.2, "mid"));
    o.push(faceText(xf + 0.1, c.y, c.z - 5, c.name, 2.8, "hi"));
    return { d: depth(xf, c.y, c.z), s: o.join("") };
  };
  // sectionneur porte-fusibles : boîtier, trois porte-fusibles, poignée rotative en position fermée (I)
  const isolator = (c) => {
    const o = [box3(c.y + 13, c.y - 13, c.z - 15, c.z + 15, PFX, DEV - 2, "lo", 0.6)];
    const xf = PFX + DEV - 2;
    for (const dy of [-8, 0, 8]) o.push(box3(c.y + dy + 2.6, c.y + dy - 2.6, c.z - 12, c.z - 1, xf, 1.2, "mid", 0.2));
    o.push(S(faceDisc(xf, c.y, c.z + 7, 0, 1.2, 5, 28), { tone: "mid" }));
    o.push(box3(c.y + 1.4, c.y - 1.4, c.z + 2.2, c.z + 11.8, xf + 1.2, 2.2, "hi", 0.3));
    o.push(faceText(xf + 0.1, c.y - 9, c.z + 11, "I", 2.6, "hi"));
    o.push(faceText(xf + 0.1, c.y + 9, c.z + 6, "O", 2.6, "mid"));
    o.push(faceText(xf + 0.1, c.y, c.z - 14.5 + 0.6, c.name, 2.4, "mid"));
    return { d: depth(xf, c.y, c.z), s: o.join("") };
  };
  const interlock = (c) => {
    const o = [box3(c.y + 4, c.y - 4, c.z - 8, c.z + 8, PFX, DEV - 3, "lo", 0.4)];
    const xf = PFX + DEV - 3;
    o.push(L(k.pathOf([onFace(xf + 0.05, c.y + 2.4, c.z + 2), onFace(xf + 0.05, c.y - 2.4, c.z + 2), onFace(xf + 0.05, c.y, c.z - 2.2)], true), { tone: "hi" }));
    return { d: depth(xf, c.y, c.z), s: o.join("") };
  };
  const buttons = () => {
    const o = [box3(SBTN.y + 7, SBTN.y - 7, SBTN.z0 - 8, SBTN.z1 + 8, PFX, 4, "lo", 0.5)];
    const xf = PFX + 4;
    for (const [z, name, r, h] of [[SBTN.z1, "S1", 3.2, 1.4], [SBTN.z0, "S0", 4, 3.2]]) {
      const BF = G.frameOf([xf, SBTN.y, z], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
      o.push(S(G.disc(0, 1, r + 1.2, BF, P, { steps: 24 }), { tone: "mid" }));
      o.push(`<g class="st-btn" data-b="${name}">${S(G.disc(1, 1 + h, r, BF, P, { steps: 24, bevel: 0.4 }), { tone: "hi" })}</g>`);
      o.push(faceText(xf + 0.1, SBTN.y, z - r - 2.6, name, 2.4, "mid"));
    }
    return { d: depth(xf, SBTN.y, SBTN.z0), s: o.join("") };
  };
  const ammeter = () => {
    const o = [box3(DIAL.y + 16, DIAL.y - 16, DIAL.z - 16, DIAL.z + 16, PFX, 3, "lo", 0.5)];
    const xf = PFX + 3;
    const ring = (r) => k.sideRing([xf, DIAL.y, DIAL.z], r, "x", P, 48);
    o.push(`<path class="st-dial" d="${ring(DIAL.r)}"/>`);
    o.push(L(ring(DIAL.r) + ring(DIAL.r + 1.6), { tone: "mid" }));
    const minor = [], major = [];
    for (let i = 0; i <= 16; i++) {
      const a = Math.PI * (1.25 - (1.5 * i) / 16);
      const r0 = DIAL.r - (i % 2 === 0 ? 3.2 : 1.8);
      (i % 2 === 0 ? major : minor).push(k.pathOf([onFace(xf, DIAL.y - Math.cos(a) * r0, DIAL.z + Math.sin(a) * r0), onFace(xf, DIAL.y - Math.cos(a) * DIAL.r, DIAL.z + Math.sin(a) * DIAL.r)]));
    }
    o.push(L(minor.join(""), { tone: "lo" }), L(major.join(""), { tone: "mid" }));
    for (const v of [0, 2, 4, 6, 8]) {
      const a = Math.PI * (1.25 - (1.5 * v) / 8);
      const r = DIAL.r - 5.8;
      o.push(faceText(xf + 0.1, DIAL.y - Math.cos(a) * r, DIAL.z + Math.sin(a) * r - 0.9, String(v), 2.3, "lo"));
    }
    o.push(faceText(xf + 0.1, DIAL.y, DIAL.z + 5.2, "× In", 2.4, "mid"));
    o.push(`<path class="iso-line st-needle" data-tone="lit" data-free="both" d=""/>`);
    o.push(D([onFace(xf, DIAL.y, DIAL.z)], { size: 0.9, tone: "hi" }));
    o.push(D([[DIAL.y + 13, DIAL.z + 13], [DIAL.y - 13, DIAL.z + 13], [DIAL.y + 13, DIAL.z - 13], [DIAL.y - 13, DIAL.z - 13]].map(([y, z]) => onFace(xf, y, z)), { size: 0.5 }));
    return { d: depth(xf, DIAL.y, DIAL.z), s: o.join("") };
  };
  // plaque de repérage gravée et voyants de couplage (1er temps, 2e temps)
  const panel = () => {
    const xf = PFX + 0.6;
    const o = [box3(-62, -150, 86, 112, PFX, 0.6, "mid", 0.1)];
    o.push(L([92, 97].map((z, i) => k.pathOf([onFace(xf, -66, z), onFace(xf, i ? -96 : -108, z)])).join(""), { tone: "lo", free: true }));
    o.push(D([[-64, 110], [-148, 110], [-64, 88], [-148, 88]].map(([y, z]) => onFace(xf, y, z)), { size: 0.4 }));
    spec.lamps.forEach((name, i) => {
      const y = -118 - i * 16;
      o.push(S(faceDisc(xf, y, 100, 0, 1, 4.2, 24, 0), { tone: "lo" }));
      o.push(`<g class="st-led" data-led="${name}">${S(faceDisc(xf, y, 100, 1, 2.4, 3.2, 24, 0.3), { tone: "hi" })}</g>`);
      o.push(faceText(xf + 0.1, y, 91.5, name, 2.6, "mid"));
    });
    o.push(faceText(xf + 0.1, -66, 104.5, T.panel, 3, "hi", "start"));
    return { d: depth(xf, -100, 100), s: o.join("") };
  };
  const build = { contactor, relay, timer, module, isolator, interlock };
  const devices = [...spec.devices.map((d) => build[d.type](d)), buttons(), ammeter(), panel()].sort((a, b) => a.d - b.d).map((p) => p.s).join("");

  function motor() {
    const o = [];
    for (const y of [Y0 + 10, Y0 + LEN - 20]) {
      o.push(S(k.slabOf({ x: -30, y, w: 60, d: 10, r: 1 }, 3, CZ - R + 6 - 3, P, 2, 0.5), { tone: "lo" }));
      for (const x of [-25, 25]) o.push(L(k.ring(x, y + 5, 2.2, CZ - R + 6, P, 16), { tone: "mid" }) + D([at([x, y + 5, CZ - R + 6])], { size: 0.55 }));
    }
    o.push(S(G.solidOf([[-22, 0], [-22, 22, 1], [-18, 24], [0, 24]], F, P), { tone: "mid", inner: L(G.arcOf(F, -12, 24, P), { tone: "faint" }) }));
    const body = G.solidOf([[0, 0], [0, 22], [5, R], [LEN - 5, R], [LEN, 22], [LEN, 0]], F, P);
    o.push(S(body, { tone: "mid", inner: k.fadedSvg(G.ribsOf(F, 6, LEN - 6, R + 0.2, 36, P, { fade: [0.06, 0.4], seams: true }), { tone: "lo" }) }));
    o.push(S(G.solidOf([[LEN, 0], [LEN, 14], [LEN + 6, 11], [LEN + 6, 0]], F, P), { tone: "lo" }));
    o.push(D(G.dotsOf(F, LEN, 18, 4, P, { all: true, phase: Math.PI / 4 }), { size: 0.6, tone: "mid" }));
    o.push(S(G.solidOf([[LEN + 6, 0], [LEN + 6, 5], [LEN + 24, 5], [LEN + 24, 0]], F, P), { tone: "hi" }));
    o.push(S(G.disc(LEN + 24, LEN + 30, 12, F, P, { steps: 48, bevel: 0.4 }), { tone: "mid" }));
    o.push(D(G.dotsOf(F, LEN + 30, 8, 6, P, { all: true }), { size: 0.5, tone: "lo" }));
    o.push(`<path class="iso-line st-mark" data-tone="lit" data-free="both" d=""/>`);
    return o.join("");
  }

  const glandAt = (x) => [x, BOX.y - 4, BOX_Z + 5];
  function cables() {
    return [[-62, -10, "1"], [-50, 10, "2"]].map(([cx, gx, w]) => {
      const a = [cx, CAB.y + CAB.d + 4, 70];
      const b = glandAt(gx);
      const pts = [];
      for (let i = 0; i <= 28; i++) {
        const t = i / 28;
        pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t + 18 * Math.sin(Math.PI * t)]);
      }
      return `<g class="st-wire st-cable" data-w="${w}">${L(pathD(pts), { tone: "mid" })}<circle class="iso-wire-end" cx="${at(a)[0].toFixed(1)}" cy="${at(a)[1].toFixed(1)}" r="1.6"/></g>`;
    }).join("");
  }

  function box() {
    const o = [];
    o.push(S(k.slabOf(k.insetPlan(BOX, 3), BOX_Z - 4, 4, P, 2), { tone: "lo" }));
    o.push(S(k.slabOf(BOX, BOX_Z, BOX_H, P, 3, 0.6), { tone: "mid", inner: L(k.sideSeam(BOX, BOX_Z + 3, P, 3), { tone: "faint" }) }));
    o.push(L(k.planOutline(k.insetPlan(BOX, 1.6), BOARD_Z, P, 3), { tone: "lo" }));
    o.push(D(k.corners(BOX, 2.4).map(([x, y]) => at([x, y, BOARD_Z])), { size: 0.5 }));
    for (const x of [-10, 10]) o.push(S(G.disc(0, 4, 4, G.frameOf([x, BOX.y, BOX_Z + 5], [0, -1, 0], [1, 0, 0], [0, 0, 1]), P, { steps: 24 }), { tone: "lo" }));
    const pl = { y0: BOX.y + 4, y1: BOX.y + BOX.d - 4, z0: BOX_Z + 1.4, z1: BOX_Z + BOX_H - 1.4 };
    const fx = BOX.x + BOX.w + 0.2;
    const quad = k.pathOf([[fx, pl.y0, pl.z0], [fx, pl.y1, pl.z0], [fx, pl.y1, pl.z1], [fx, pl.y0, pl.z1]].map(at), true);
    o.push(`<path class="st-dial" d="${quad}"/>`, L(quad, { tone: "mid" }));
    o.push(faceText(fx, pl.y1 - 2.8, pl.z1 - 2.8, T.plate, 3.2, "hi", "start"));
    o.push(faceText(fx, pl.y1 - 2.8, pl.z0 + 2.4, T.plate2, 2.2, "mid", "start"));
    o.push(S(k.slabOf(BOARD, BOARD_Z, 3, P, 2, 0.4), { tone: "lo" }));
    COLS.forEach((y, i) => {
      o.push(k.faceTextSvg(k.topMatrix([ROW1 - 8.8, y], ZB, P, "y"), spec.terms[0][i], { size: 2.8, tone: "hi", anchor: "middle" }));
      o.push(k.faceTextSvg(k.topMatrix([ROW2 + 8.4, y], ZB, P, "y"), spec.terms[1][i], { size: 2.8, tone: "hi", anchor: "middle" }));
    });
    return o.join("");
  }
  function leads() {
    return [[ROW1, -10, "1"], [ROW2, 10, "2"]].map(([row, gx, w]) => {
      const g = COLS.map((y, i) => {
        const x0 = gx + (i - 1) * 2.6;
        const xr = row + (row < 0 ? -4.4 : 4.4);
        return L(pathD([[x0, BOARD.y + 0.6, ZB + 0.6], [x0, BOARD.y + 3 + i * 2.2, ZB + 0.6], [xr, BOARD.y + 3 + i * 2.2, ZB + 0.6], [xr, y, ZB + 0.6], [row + (row < 0 ? -2 : 2), y, ZB + 0.6]]), { tone: "mid" });
      });
      return `<g class="st-wire" data-w="${w}">${g.join("")}</g>`;
    }).join("");
  }
  const terminals = () => {
    const o = [];
    for (const x of [ROW1, ROW2]) for (const y of COLS) o.push(S(k.cylinder(x, y, 2, ZB, 1.8, P, 16), { tone: "mid", crease: "none" }));
    for (const x of [ROW1, ROW2]) for (const y of COLS) o.push(S(k.cylinder(x, y, 3.2, ZB + 1.6, 2.4, P, 6, 0.3), { tone: "hi" }) + L(k.ring(x, y, 1.3, ZB + 4, P, 12), { tone: "lo" }));
    return o.join("");
  };

  const body = [plate(), cabinet(), devices, motor(), cables(), box(), leads(), terminals()];
  const svg = k.figureSvg({ width: WIDTH, height: HEIGHT, label: T.svgLabel, body });
  const config = { P, F: { o: F.o }, markS: LEN + 30, dial: { x: PFX + 3.2, ...DIAL, max: 8 }, timerFace: parts.timerFace, plungerMove: -2, flagMove: 2.4, btnMove: -1 };
  return { svg, config };
}

const CSS = CONTROLS_CSS + LADDER_CSS + `
.st-dial{fill:var(--anatomy-top)}
.st-needle,.st-timer-needle{stroke-width:1.1}
.st-wire[data-live] .iso-line{stroke:var(--anatomy-lit);stroke-dasharray:2 4;animation:iso-flow 1600ms linear infinite}
.st-cable .iso-line{stroke-width:2.4}
.st-led{opacity:.25;transition:opacity .15s}
.st-led[data-on]{opacity:1}
.st-led[data-on] .iso-fill,.st-led[data-on] .iso-top,.st-led[data-on] .iso-shade{fill:var(--anatomy-lit)}
.mv-controls .st-go{background:var(--anatomy-strong);color:var(--anatomy-card);border-color:var(--anatomy-strong)}
.st-steps{margin:14px 0 0;padding:0 0 0 1.4em;color:var(--anatomy-muted);font-size:13px;line-height:1.5}
.st-steps li{padding:3px 0}
.st-steps li[data-on]{color:var(--anatomy-strong);font-weight:600}
.st-steps li[data-done]{color:var(--anatomy-text)}
@media (prefers-reduced-motion:reduce){.st-wire[data-live] .iso-line{animation:none}}
`;

// ---------------------------------------------------------------- script de la figure
const LIVE = (name) => `
const still = matchMedia("(prefers-reduced-motion: reduce)");
const C = FIG, T = TX, P = C.P;
const scope = document.querySelector('.live-figure[data-figure="${name}"]') || document;
const root = scope.querySelector(".iso-plate");
const stage = root.querySelector(".iso-stage");
const svg = stage.querySelector(".iso-svg");
const readout = root.querySelector("[data-readout]");
const feedback = scope.querySelector(".mv-feedback");
const steps = [...scope.querySelectorAll(".st-steps li")];
const buttons = Object.fromEntries([...scope.querySelectorAll(".mv-controls button")].map((b) => [b.dataset.act, b]));
const ctrl = ladder(scope.querySelector('.ld-svg[data-schema="control"]'), D.STARTERS[NAME].control);
const pwr = ladder(scope.querySelector('.ld-svg[data-schema="power"]'), D.STARTERS[NAME].power);
const coupling = scope.querySelector(".ld-coupling");
const needle = svg.querySelector(".st-needle");
const tNeedle = svg.querySelector(".st-timer-needle");
const mark = svg.querySelector(".st-mark");
const plunger = Object.fromEntries([...svg.querySelectorAll(".st-plunger")].map((g) => [g.dataset.k, g]));
const flags = Object.fromEntries([...svg.querySelectorAll(".st-flag")].map((g) => [g.dataset.f, g]));
const btns = Object.fromEntries([...svg.querySelectorAll(".st-btn")].map((g) => [g.dataset.b, g]));
const leds = Object.fromEntries([...svg.querySelectorAll(".st-led")].map((g) => [g.dataset.led, g]));
const wires = [...svg.querySelectorAll(".st-wire")];
const fmt = (v, d = 1) => v.toFixed(d).replace(".", T.dec);
let sim, shown = 0, angle = 0, frame = 0, last = 0, visible = false, ended = null, stage0 = "rest";
const power = D.STARTERS[NAME].power;
const CABLE = CABLES;
function reset() { sim = D.createStarter(NAME); ended = null; }
reset();
function stageOf(s) {
  const p = (k) => s.pos[k] >= 0.999;
  if (ended && !Object.keys(s.coils).some((c) => s.coils[c]) && !s.contactors.some(p)) return ended;
  return STAGE(s, p);
}
function readText(s, st) {
  return T.read(st, { t: fmt(s.timer, 1), i: fmt(shown), delay: fmt(s.def.timer.delay, 0) });
}
function draw() {
  const s = { ...sim.snapshot(), def: sim.def, contactors: sim.def.contactors };
  const cr = sim.solveControl(), pr = sim.solvePower();
  ctrl(cr, sim.pos); pwr(pr, sim.pos);
  for (const c of sim.def.contactors) {
    const v = Math.min(1, sim.pos[c]);
    plunger[c].setAttribute("transform", translateAlong(P, [C.plungerMove * v, 0, 0]));
    plunger[c].querySelector(".iso-solid").toggleAttribute("data-lit", v > 0.5);
  }
  for (const f of Object.keys(flags)) flags[f].setAttribute("transform", translateAlong(P, [C.flagMove * (sim.pos[f] || 0), 0, 0]));
  for (const b of ["S1", "S0"]) btns[b].setAttribute("transform", translateAlong(P, [C.btnMove * sim.pos[b], 0, 0]));
  const tf = C.timerFace, frac = Math.min(1, s.timer / s.def.timer.delay);
  const a = Math.PI * (1.25 - 1.5 * frac);
  const tp = (r) => iso([tf.x, tf.y - Math.cos(a) * r, tf.z + Math.sin(a) * r], P);
  tNeedle.setAttribute("d", pathOf([tp(0), tp(tf.r)]));
  if (leds.timer) leds.timer.toggleAttribute("data-on", s.coils[s.def.timer.name] && s.timer < s.def.timer.delay);
  if (leds.module) leds.module.toggleAttribute("data-on", sim.pos.B1 > 0.5);
  LAMPS(leds, s);
  const F = C.F;
  const mp = (r) => [F.o[0] + r * Math.cos(angle), F.o[1] + C.markS, F.o[2] + r * Math.sin(angle)];
  mark.setAttribute("d", pathOf([iso(mp(2.5), P), iso(mp(11), P)]));
  const na = Math.PI * (1.25 - 1.5 * Math.min(shown, C.dial.max) / C.dial.max);
  const dp = (r) => iso([C.dial.x, C.dial.y - Math.cos(na) * r, C.dial.z + Math.sin(na) * r], P);
  needle.setAttribute("d", pathOf([dp(-2), dp(C.dial.r - 2)]));
  for (const g of wires) g.toggleAttribute("data-live", CABLE[g.dataset.w].some((i) => pr.flow.has(i)));
  if (coupling) coupling.textContent = s.mode === "star" ? "Y" : s.mode === "delta" ? "Δ" : "";
  const st = stageOf(s);
  if (st !== stage0 || !feedback.textContent) { stage0 = st; feedback.textContent = T.stages[st]; }
  const order = Object.keys(T.stages);
  const idx = steps.findIndex((li) => li.dataset.stage === st);
  steps.forEach((li, i) => { li.toggleAttribute("data-on", i === idx); li.toggleAttribute("data-done", idx >= 0 && i < idx && !["stop", "trip", "trip2"].includes(st)); });
  readout.textContent = readText(s, st);
  const f0 = !!sim.st.tripped[FAULTS[0]];
  buttons.fault.textContent = f0 ? T.reset : T.fault;
  buttons.fault.setAttribute("aria-pressed", f0 ? "true" : "false");
  if (buttons.fault2) { buttons.fault2.textContent = sim.st.tripped.B1 ? T.reset2 : T.fault2; buttons.fault2.setAttribute("aria-pressed", sim.st.tripped.B1 ? "true" : "false"); }
}
function step(dt) {
  const n = 6;
  for (let i = 0; i < n; i++) sim.step(dt / n);
  shown += (sim.st.current - shown) * Math.min(1, dt / 0.12);
  angle += sim.st.speed * dt * 2 * Math.PI * 0.9 / sim.def.slow;
}
function busy() {
  const moving = Object.keys(sim.pos).some((k) => sim.pos[k] > 0 && sim.pos[k] < 1);
  return moving || sim.st.speed > 0.002 || Math.abs(shown - sim.st.current) > 0.01 || Object.values(sim.st.held).some((v) => v > 0) || sim.def.contactors.some((c) => sim.pos[c] > 0);
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  step(still.matches ? dt * 3 : dt);
  draw();
  frame = visible && busy() ? requestAnimationFrame(tick) : 0;
  if (!frame) last = 0;
}
function run() { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } }
function start() { ended = null; sim.press("S1"); run(); }
function stop() { if (sim.def.contactors.some((c) => sim.pos[c] > 0)) ended = "stop"; sim.press("S0"); run(); }
function fault(f, tag) {
  const on = !sim.st.tripped[f];
  sim.trip(f, on);
  if (on) ended = tag; else if (ended === tag) ended = null;
  run(); draw();
}
buttons.start.addEventListener("click", start);
buttons.stop.addEventListener("click", stop);
buttons.fault.addEventListener("click", () => fault(FAULTS[0], "trip"));
if (buttons.fault2) buttons.fault2.addEventListener("click", () => fault(FAULTS[1], "trip2"));
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
window.__st = { start, stop, fault, sim: () => sim, state: () => ({ ...sim.snapshot(), stage: stageOf({ ...sim.snapshot(), def: sim.def, contactors: sim.def.contactors }) }) };
draw();
`;

// spec : { name, fig, devices, lamps, terms, faults, cables, stage, lamps (fonction), text: { fr, en } }
export function buildStarterFigure(here, spec) {
  const def = STARTERS[spec.name];
  const cables = Object.fromEntries(Object.entries(spec.cables).map(([w, test]) => [w, def.power.edges.map((e, i) => (test(e) ? i : -1)).filter((i) => i >= 0)]));
  const bundle = namespaced(DATA, "D");
  const langs = {};
  for (const lang of ["fr", "en"]) {
    const T = spec.text[lang];
    const { svg, config } = buildIso(spec, T);
    const ctrlSvg = schematicSvg(def.control, { label: T.controlLabel, title: T.controlTitle }).replace('class="ld-svg"', 'class="ld-svg" data-schema="control"');
    const pwrSvg = schematicSvg(def.power, { label: T.powerLabel, title: T.powerTitle }).replace('class="ld-svg"', 'class="ld-svg" data-schema="power"');
    const list = [["start", T.start, "st-go"], ["stop", T.stop], ["fault", T.fault], ...(T.fault2 ? [["fault2", T.fault2]] : [])];
    const controls = `<div class="mv-controls" role="group" aria-label="${T.group}">${list.map(([act, label, cls]) => `<button type="button" data-act="${act}"${cls ? ` class="${cls}"` : ""}${act.startsWith("fault") ? ' aria-pressed="false"' : ""}>${label}</button>`).join("")}</div><p class="mv-feedback" aria-live="polite"></p>`;
    const stepsHtml = `<ol class="st-steps">${Object.entries(T.stages).filter(([id]) => !T.offList.includes(id)).map(([id, s]) => `<li data-stage="${id}">${T.short[id]}</li>`).join("")}</ol>`;
    const plate = k.plateHtml({ fig: spec.fig, title: T.title, hint: T.hint, readout: "", keys: T.keys, caption: T.caption, body: `<div class="iso-stage" role="img" aria-label="${T.stageLabel}">${svg}</div>${controls}<div class="ld-grid">${ctrlSvg}${pwrSvg}</div>${stepsHtml}` });
    const TX = `{dec:${JSON.stringify(lang === "fr" ? "," : ".")},read:${T.read},stages:${JSON.stringify(T.stages)},fault:${JSON.stringify(T.fault)},reset:${JSON.stringify(T.reset)},fault2:${JSON.stringify(T.fault2 || "")},reset2:${JSON.stringify(T.reset2 || "")}}`;
    const script = `const FIG = ${JSON.stringify(config)};\nconst NAME = ${JSON.stringify(spec.name)};\nconst TX = ${TX};\nconst BLADE = ${JSON.stringify(BLADE)};\nconst FAULTS = ${JSON.stringify(spec.faults)};\nconst CABLES = ${JSON.stringify(cables)};\nconst STAGE = ${spec.stage};\nconst LAMPS = ${spec.lampsLive};\n${bundle}${LADDER_LIVE}${LIVE(spec.figure)}`;
    langs[lang] = { plate, script, title: T.pageTitle };
  }
  writeFigure(here, spec.figure, langs, CSS);
}
