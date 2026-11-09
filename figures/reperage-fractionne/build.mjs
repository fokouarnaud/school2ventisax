// Figure interactive d'évaluation (skill anatomy) : repérage d'un moteur à démarrage fractionné à l'ohmmètre, hors tension.
// Partie 3, module 6, section « Repérage et schémas » : 50 % / 50 % (plaque E), 66 % / 33 % (plaque F),
// plaques à bornes G (trois barrettes, démarrage direct) et H (sans barrette, K1 sur 1-2-3, K2 sur 4-5-6).
// L'ohmmètre résout le vrai réseau de résistances (deux étoiles indépendantes, barrettes éventuelles).
// Usage : node figures/reperage-fractionne/build.mjs   (fr + en, sombre + clair)
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../_kit/iso-kit.mjs";
import * as G from "../_kit/lathe.mjs";
import { publish } from "../_kit/publish.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const KIT_SOURCE = readFileSync(join(HERE, "..", "_kit", "iso-kit.mjs"), "utf8").replace(/^export /gm, "");

// ---------------------------------------------------------------- modèle
// Chaque bobinage est câblé en étoile : entre deux de ses bornes, on mesure deux résistances de phase en série.
// À tension égale, un bobinage deux fois plus puissant a une résistance deux fois plus faible.
const MOTORS = [
  { id: "m50", r1: 0.9, r2: 0.9, plate: "E" }, // 1,80 Ω entre deux bornes de chaque bobinage
  { id: "m66", r1: 0.675, r2: 1.35, plate: "F" }, // 1,35 Ω (66 %) et 2,70 Ω (33 %)
];

// ---------------------------------------------------------------- textes
const TEXT = {
  fr: {
    title: "Repérage à l'ohmmètre",
    pageTitle: "Démarrage fractionné : repérage des bobinages et plaques à bornes",
    hint: "Toucher deux bornes pour mesurer, puis répondre",
    modes: { test: "Exercice : 50/50 ou 66/33 ?", G: "Plaque G : direct", H: "Plaque H : fractionné" },
    answers: { m50: "50 % / 50 % (plaque E)", m66: "66 % / 33 % (plaque F)", next: "Nouveau moteur" },
    terms: "Pointe sur la borne",
    keys: [
      { mark: "lit", label: "Pointes de touche et barrettes : ce que vous déplacez" },
      { mark: "raised", label: "Bornier 1 à 6 : bobinage n° 1 sur 1-2-3 (U1 V1 W1), bobinage n° 2 sur 4-5-6 (U2 V2 W2)" },
    ],
    caption: "Hors tension, l'ohmmètre mesure entre deux bornes d'un même bobinage deux enroulements en série, puisque chaque bobinage est câblé en étoile. Entre une borne du bobinage n° 1 (1, 2, 3) et une borne du bobinage n° 2 (4, 5, 6), il affiche OL : les deux bobinages sont électriquement indépendants. Plaque E, 50 % / 50 % : 1-2, 2-3, 3-1, 4-5, 5-6 et 6-4 donnent la même valeur. Plaque F, 66 % / 33 % : 1-2, 2-3, 3-1 sont identiques et inférieures à 4-5, 5-6, 6-4, car plus un enroulement est puissant, plus sa résistance est faible. Plaque G : trois barrettes relient 1 à 4, 2 à 5 et 3 à 6, les deux bobinages sont en parallèle et démarrent ensemble sur un seul contacteur (démarrage direct). Plaque H : aucune barrette, les bornes 1, 2, 3 vont au contacteur K1 et les bornes 4, 5, 6 au contacteur K2 (démarrage fractionné). Valeurs de l'exercice : 1,80 Ω pour un 50/50, 1,35 Ω et 2,70 Ω pour un 66/33.",
    stageLabel: "Repérage d'un moteur à deux bobinages : boîte à bornes ouverte numérotée de 1 à 6, ohmmètre et ses deux pointes de touche, bac de barrettes et boîte de raccordement vers K1 et K2. Mesurez entre deux bornes, puis dites si le moteur est 50/50 ou 66/33, ou affichez les plaques G et H.",
    svgLabel: "Moteur à deux bobinages, bornier 1 à 6, ohmmètre numérique avec deux pointes de touche, barrettes et boîte de raccordement K1 K2.",
    plateHidden: "3~ 400 V · PW ? / ?",
    plate: { m50: "3~ 400 V · PW 50/50", m66: "3~ 400 V · PW 66/33" },
    plate2: "1-2-3 : n° 1 · 4-5-6 : n° 2",
    off: "HORS TENSION",
    ohm: (v) => (v === null ? "OL" : `${v.toFixed(2).replace(".", ",")} Ω`),
    pair: (a, b) => `${a}-${b}`,
    readNone: (mode) => `${mode} · touchez deux bornes`,
    readOne: (a) => `pointe sur ${a} · touchez une 2e borne`,
    read: (p, v) => `${p} : ${v}`,
    log: "Mesures : ",
    feedback: {
      start: "Moteur inconnu, hors tension. Touchez deux bornes pour placer les pointes de l'ohmmètre (ou utilisez les boutons 1 à 6), comparez les bobinages 1-2-3 et 4-5-6, puis répondez.",
      need: "Mesurez d'abord au moins une paire de bornes dans chaque bobinage, par exemple 1-2 puis 4-5.",
      ok50: (v) => `Juste. 1-2, 2-3, 3-1 et 4-5, 5-6, 6-4 donnent toutes ${v} : les deux bobinages sont identiques, c'est un 50 % / 50 % (plaque E).`,
      ok66: (a, b) => `Juste. Le bobinage 1-2-3 donne ${a}, moins que le bobinage 4-5-6 (${b}) : 1-2-3 est le bobinage n° 1, le plus puissant (66 %), car plus un enroulement est puissant, plus sa résistance est faible (plaque F).`,
      bad50: (a, b) => `Faux. Le bobinage 1-2-3 donne ${a} et le bobinage 4-5-6 ${b} : les résistances diffèrent, c'est un 66 % / 33 % (plaque F). Le bobinage le moins résistant est le plus puissant.`,
      bad66: (v) => `Faux. Les deux bobinages donnent la même valeur (${v}) : c'est un 50 % / 50 % (plaque E).`,
      cross: "OL entre une borne de 1-2-3 et une borne de 4-5-6 : les deux bobinages sont indépendants, aucun courant ne passe de l'un à l'autre.",
      G: "Plaque G : trois barrettes relient 1 à 4, 2 à 5 et 3 à 6. Les deux bobinages sont en parallèle et alimentés ensemble par un seul contacteur : démarrage direct en 400 V. L'ohmmètre lit maintenant 0 Ω entre 1 et 4, et entre 1 et 2 la mise en parallèle des deux bobinages.",
      H: "Plaque H : aucune barrette. Les bornes 1, 2, 3 vont au contacteur K1 (1er temps), les bornes 4, 5, 6 au contacteur K2 (2e temps). Gardez le même ordre des phases sur les deux départs pour que les bobinages tournent dans le même sens.",
    },
    score: (g, t) => `Score : ${g} / ${t}`,
    box: "vers coffret",
  },
  en: {
    title: "Identifying with an ohmmeter",
    pageTitle: "Part-winding starting: identifying the windings and terminal boards",
    hint: "Touch two terminals to measure, then answer",
    modes: { test: "Exercise: 50/50 or 66/33?", G: "Board G: direct-on-line", H: "Board H: part winding" },
    answers: { m50: "50 % / 50 % (board E)", m66: "66 % / 33 % (board F)", next: "New motor" },
    terms: "Probe on terminal",
    keys: [
      { mark: "lit", label: "Test probes and links: what you move" },
      { mark: "raised", label: "Terminals 1 to 6: winding 1 on 1-2-3 (U1 V1 W1), winding 2 on 4-5-6 (U2 V2 W2)" },
    ],
    caption: "With the supply off, the ohmmeter reads, between two terminals of the same winding, two coils in series, since each winding is connected in star. Between a terminal of winding 1 (1, 2, 3) and a terminal of winding 2 (4, 5, 6) it reads OL: the two windings are electrically independent. Board E, 50 % / 50 %: 1-2, 2-3, 3-1, 4-5, 5-6 and 6-4 read the same value. Board F, 66 % / 33 %: 1-2, 2-3, 3-1 are equal and lower than 4-5, 5-6, 6-4, because the more powerful a winding, the lower its resistance. Board G: three links join 1 to 4, 2 to 5 and 3 to 6; the two windings are in parallel and start together on one contactor (direct-on-line). Board H: no link; terminals 1, 2, 3 go to contactor K1 and terminals 4, 5, 6 to contactor K2 (part-winding starting). Exercise values: 1.80 Ω for a 50/50, 1.35 Ω and 2.70 Ω for a 66/33.",
    stageLabel: "Identifying a two-winding motor: open terminal box numbered 1 to 6, ohmmeter with two test probes, link tray and junction box to K1 and K2. Measure between two terminals, then say whether the motor is 50/50 or 66/33, or show boards G and H.",
    svgLabel: "Two-winding motor, terminals 1 to 6, digital ohmmeter with two test probes, links and K1 K2 junction box.",
    plateHidden: "3~ 400 V · PW ? / ?",
    plate: { m50: "3~ 400 V · PW 50/50", m66: "3~ 400 V · PW 66/33" },
    plate2: "1-2-3: no. 1 · 4-5-6: no. 2",
    off: "ISOLATED",
    ohm: (v) => (v === null ? "OL" : `${v.toFixed(2)} Ω`),
    pair: (a, b) => `${a}-${b}`,
    readNone: (mode) => `${mode} · touch two terminals`,
    readOne: (a) => `probe on ${a} · touch a second terminal`,
    read: (p, v) => `${p}: ${v}`,
    log: "Readings: ",
    feedback: {
      start: "Unknown motor, supply off. Touch two terminals to place the ohmmeter probes (or use buttons 1 to 6), compare windings 1-2-3 and 4-5-6, then answer.",
      need: "First measure at least one pair of terminals in each winding, for example 1-2 then 4-5.",
      ok50: (v) => `Correct. 1-2, 2-3, 3-1 and 4-5, 5-6, 6-4 all read ${v}: the two windings are identical, this is a 50 % / 50 % motor (board E).`,
      ok66: (a, b) => `Correct. Winding 1-2-3 reads ${a}, less than winding 4-5-6 (${b}): 1-2-3 is winding 1, the more powerful one (66 %), because the more powerful a winding, the lower its resistance (board F).`,
      bad50: (a, b) => `Wrong. Winding 1-2-3 reads ${a} and winding 4-5-6 reads ${b}: the resistances differ, this is a 66 % / 33 % motor (board F). The lower-resistance winding is the more powerful one.`,
      bad66: (v) => `Wrong. Both windings read the same value (${v}): this is a 50 % / 50 % motor (board E).`,
      cross: "OL between a terminal of 1-2-3 and a terminal of 4-5-6: the two windings are independent, no current flows from one to the other.",
      G: "Board G: three links join 1 to 4, 2 to 5 and 3 to 6. The two windings are in parallel and fed together by one contactor: direct-on-line starting at 400 V. The ohmmeter now reads 0 Ω between 1 and 4, and between 1 and 2 the two windings in parallel.",
      H: "Board H: no link. Terminals 1, 2, 3 go to contactor K1 (first step), terminals 4, 5, 6 to contactor K2 (second step). Keep the same phase order on both feeds so that the windings turn the same way.",
    },
    score: (g, t) => `Score: ${g} / ${t}`,
    box: "to panel",
  },
};

// ---------------------------------------------------------------- géométrie (az 28° : y horizontal à l'écran, y grand à gauche)
const AZ = 28;
const WIDTH = 680;
const HEIGHT = 440;
const PLATE = { x: -62, y: -128, w: 146, d: 240, r: 8 };
const PLATE_H = 10;
const FOOT_H = 5;

const R = 33;
const CZ = 46;
const Y0 = -40;
const LEN = 104;
const F = G.frameOf([0, Y0, CZ], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
const BOX = { x: -24, y: -14, w: 48, d: 56, r: 2.5 };
const BOX_Z = CZ + R - 2;
const BOX_H = 12;
const BOARD = { x: -20.5, y: -9, w: 41, d: 46, r: 1.8 };
const BOARD_Z = BOX_Z + BOX_H;
const ZB = BOARD_Z + 3;
const ROW1 = -9; // bornes 1 2 3 (bobinage n° 1)
const ROW2 = 9; // bornes 4 5 6 (bobinage n° 2)
const COLS = [28, 14, 0];
const BAR_T = 1.6;
const TERM = {};
COLS.forEach((y, i) => { TERM[i + 1] = [ROW1, y]; TERM[i + 4] = [ROW2, y]; });

const METER = { x: 34, y: -114, w: 34, d: 52, r: 4 };
const METER_H = 9;
const TRAY = { x: 52, y: 34, w: 30, d: 44, r: 2 };
const TRAY_H = 4;
const JBOX = { x: -56, y: -120, w: 26, d: 36, r: 2 };
const JBOX_H = 22;

function buildFigure(lang) {
  const T = TEXT[lang];
  const P = k.fitProjection([...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [0, 10, ZB + 34], [0, Y0 + LEN + 30, CZ + 14], [JBOX.x, JBOX.y, JBOX_H]], WIDTH, HEIGHT, { pad: 12, azimuth: AZ, elevation: 40 });
  const at = (p) => k.iso(p, P);
  const S = (paths, style) => k.solidSvg(paths, style);
  const L = (d, style) => k.lineSvg(d, style);
  const D = (pts, style) => k.dotsSvg(pts, style);
  const depth = (x, y, z = 0) => k.depthOf([x, y, z], P);
  const pathD = (pts) => k.pathOf(pts.map(at));

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
    const strip = { x: PLATE.x + PLATE.w - 12, y: -50, w: 6, d: 80, r: 1 };
    o.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
    const t = k.topTicks(strip.y + 4, strip.y + strip.d - 4, 4, 5, strip.x + 0.8, 0.6, [1.8, 3.4], P, "y");
    o.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
    for (const y of [Y0 + 8, Y0 + LEN - 22]) {
      const rail = { x: -40, y, w: 80, d: 14, r: 1 };
      o.push(S(k.slabOf(rail, 0, 4, P, 2, 0.4), { tone: "lo" }));
      o.push(L(k.planOutline({ x: -34, y: y + 5, w: 18, d: 4, r: 2 }, 4, P, 3) + k.planOutline({ x: 16, y: y + 5, w: 18, d: 4, r: 2 }, 4, P, 3), { tone: "faint" }));
    }
    return o.join("");
  }

  // ---- boîte de raccordement (vers le coffret K1 / K2), à l'arrière
  function jbox() {
    const o = [`<path class="iso-halo" d="${k.haloOf(JBOX, 0, JBOX_H, P)}"/>`];
    o.push(S(k.slabOf(JBOX, 0, JBOX_H, P, 3, 0.8), { tone: "mid", inner: L(k.sideSeam(JBOX, 5, P, 3), { tone: "faint" }) }));
    o.push(D(k.corners(JBOX, 3).map(([x, y]) => at([x, y, JBOX_H])), { size: 0.5 }));
    const fx = JBOX.x + JBOX.w + 0.1;
    for (const [y, name] of [[JBOX.y + 26, "K1"], [JBOX.y + 10, "K2"]]) {
      o.push(S(G.disc(0, 3, 3.6, G.frameOf([fx - 0.1, y, 10], [1, 0, 0], [0, 1, 0], [0, 0, 1]), P, { steps: 20, bevel: 0.3 }), { tone: "lo" }));
      o.push(k.faceTextSvg(k.sideMatrix([fx, y], 18.5, P, "right"), name, { size: 3, tone: "hi", anchor: "middle" }));
    }
    o.push(k.faceTextSvg(k.topMatrix([JBOX.x + 13, JBOX.y + 18], JBOX_H, P, "y"), T.box, { size: 2.6, tone: "mid", anchor: "middle" }));
    return o.join("");
  }

  function motor() {
    const o = [];
    for (const y of [Y0 + 10, Y0 + LEN - 20]) {
      o.push(S(k.slabOf({ x: -30, y, w: 60, d: 10, r: 1 }, 4, CZ - R + 6 - 4, P, 2, 0.5), { tone: "lo" }));
      for (const x of [-25, 25]) o.push(L(k.ring(x, y + 5, 2.2, CZ - R + 6, P, 16), { tone: "mid" }) + D([at([x, y + 5, CZ - R + 6])], { size: 0.55 }));
    }
    o.push(S(G.solidOf([[-26, 0], [-26, 27, 1], [-22, 29], [0, 29]], F, P), { tone: "mid", inner: L(G.arcOf(F, -12, 29, P), { tone: "faint" }) }));
    const body = G.solidOf([[0, 0], [0, 27], [5, R], [LEN - 5, R], [LEN, 27], [LEN, 0]], F, P);
    o.push(S(body, { tone: "mid", inner: k.fadedSvg(G.ribsOf(F, 6, LEN - 6, R + 0.2, 36, P, { fade: [0.06, 0.4], seams: true }), { tone: "lo" }) }));
    o.push(S(G.solidOf([[LEN, 0], [LEN, 16], [LEN + 6, 13], [LEN + 6, 0]], F, P), { tone: "lo" }));
    o.push(D(G.dotsOf(F, LEN, 22, 4, P, { all: true, phase: Math.PI / 4 }), { size: 0.6, tone: "mid" }));
    o.push(S(G.solidOf([[LEN + 6, 0], [LEN + 6, 5], [LEN + 24, 5], [LEN + 24, 0]], F, P), { tone: "hi" }));
    o.push(S(G.disc(LEN + 24, LEN + 30, 12, F, P, { steps: 48, bevel: 0.4 }), { tone: "mid" }));
    o.push(D(G.dotsOf(F, LEN + 30, 8, 6, P, { all: true }), { size: 0.5, tone: "lo" }));
    return o.join("");
  }

  // câbles vers la boîte de raccordement : K1 (presse-étoupe arrière, bornes 1-2-3), K2 (avant, bornes 4-5-6)
  function cables() {
    const o = [];
    [[-10, JBOX.y + 26, "K1"], [10, JBOX.y + 10, "K2"]].forEach(([gx, jy, name]) => {
      const a = [gx, BOX.y - 4, BOX_Z + 5];
      const b = [JBOX.x + JBOX.w + 3, jy, 10];
      const pts = [];
      for (let i = 0; i <= 28; i++) {
        const t = i / 28;
        pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t + 10 * Math.sin(Math.PI * t)]);
      }
      o.push(`<g class="rf-cable rf-outer" data-c="${name}">${L(pathD(pts), { tone: "mid" })}<circle class="iso-wire-end" cx="${at(b)[0].toFixed(1)}" cy="${at(b)[1].toFixed(1)}" r="1.6"/></g>`);
    });
    return o.join("");
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
    o.push(`<path class="rf-plate" d="${quad}"/>`, L(quad, { tone: "mid" }));
    o.push(k.faceTextSvg(k.sideMatrix([fx, pl.y1 - 2.8], pl.z1 - 2.8, P, "right"), "", { size: 3.2, tone: "hi" }).replace("<text ", '<text data-text="plate" '));
    o.push(k.faceTextSvg(k.sideMatrix([fx, pl.y1 - 2.8], pl.z0 + 2.4, P, "right"), T.plate2, { size: 2.2, tone: "mid" }));
    o.push(D([at([fx, pl.y1 - 0.8, (pl.z0 + pl.z1) / 2]), at([fx, pl.y0 + 0.8, (pl.z0 + pl.z1) / 2])], { size: 0.4 }));
    o.push(S(k.slabOf(BOARD, BOARD_Z, 3, P, 2, 0.4), { tone: "lo" }));
    COLS.forEach((y, i) => {
      o.push(k.faceTextSvg(k.topMatrix([ROW1 - 8.8, y], ZB, P, "y"), String(i + 1), { size: 3.6, tone: "hi", anchor: "middle" }));
      o.push(k.faceTextSvg(k.topMatrix([ROW2 + 8.6, y], ZB, P, "y"), String(i + 4), { size: 3.6, tone: "hi", anchor: "middle" }));
    });
    return o.join("");
  }
  // conducteurs d'arrivée (plaques G et H) : presse-étoupe → bornes
  function leads() {
    const o = [];
    for (const [row, gx, name] of [[ROW1, -10, "K1"], [ROW2, 10, "K2"]]) {
      const g = COLS.map((y, i) => {
        const x0 = gx + (i - 1) * 2.6;
        const xr = row + (row < 0 ? -4.6 : 4.6);
        return L(pathD([[x0, BOARD.y + 0.6, ZB + 0.6], [x0, BOARD.y + 3 + i * 2.2, ZB + 0.6], [xr, BOARD.y + 3 + i * 2.2, ZB + 0.6], [xr, y, ZB + 0.6], [row + (row < 0 ? -2 : 2), y, ZB + 0.6]]), { tone: "mid" });
      });
      o.push(`<g class="rf-cable" data-c="${name}">${g.join("")}</g>`);
    }
    return o.join("");
  }
  const studs = () => {
    const o = [];
    for (const x of [ROW1, ROW2]) for (const y of COLS) o.push(S(k.cylinder(x, y, 2, ZB, BAR_T + 0.2, P, 16), { tone: "mid", crease: "none" }));
    return o.join("");
  };
  const nuts = () => {
    const o = [];
    for (let n = 1; n <= 6; n++) {
      const [x, y] = TERM[n];
      o.push(`<g class="rf-term" data-term="${n}">${S(k.cylinder(x, y, 3.2, ZB + BAR_T, 2.4, P, 6, 0.3), { tone: "hi" })}${L(k.ring(x, y, 1.3, ZB + BAR_T + 2.4, P, 12), { tone: "lo" })}<path class="iso-line rf-sel" data-tone="lit" d="${k.ring(x, y, 4.6, ZB + BAR_T + 2.4, P, 24)}"/><path class="rf-hit" d="${k.ring(x, y, 6, ZB + BAR_T + 2.4, P, 16)}"/></g>`);
    }
    return o.join("");
  };
  // barrettes de la plaque G : 1-4, 2-5, 3-6 (de la rangée du haut à celle du bas)
  const bar = (plan) => S(k.slabOf(plan, ZB, BAR_T, P, 3, 0.3), { tone: "hi", lit: true });
  const links = () => `<g class="rf-bars">${COLS.map((y) => bar({ x: ROW1 - 3.6, y: y - 3.6, w: ROW2 - ROW1 + 7.2, d: 7.2, r: 3.2 })).join("")}</g>`;

  function tray() {
    const o = [S(k.slabOf(TRAY, 0, TRAY_H, P, 3, 0.5), { tone: "lo" })];
    o.push(L(k.planOutline(k.insetPlan(TRAY, 2.4), TRAY_H, P, 3), { tone: "faint" }));
    const lid = { x: 36, y: -56, w: 34, d: 44, r: 2.5 };
    o.push(S(k.slabOf(lid, 0, 3, P, 3, 0.6), { tone: "mid" }) + D(k.corners(lid, 2.4).map(([x, y]) => at([x, y, 3])), { size: 0.5 }));
    return o.join("");
  }

  // ---- ohmmètre numérique : coque, afficheur, commutateur sur Ω, douilles COM et Ω, étiquette de consignation
  function meter() {
    const o = [`<path class="iso-halo" d="${k.haloOf(METER, 0, METER_H, P)}"/>`];
    o.push(S(k.slabOf(METER, 0, METER_H, P, 4, 1.2), { tone: "mid", inner: L(k.sideSeam(METER, 3, P, 4), { tone: "faint" }) }));
    const lcd = { x: METER.x + 5, y: METER.y + 22, w: 24, d: 26, r: 1.4 };
    o.push(S(k.slabOf(lcd, METER_H, 0.5, P, 2), { tone: "lo", crease: "none" }));
    o.push(`<path class="rf-lcd" d="${k.pathOf(k.ringOf(k.insetPlan(lcd, 1.6), 2).map(([x, y]) => at([x, y, METER_H + 0.5])), true)}"/>`);
    o.push(k.faceTextSvg(k.topMatrix([lcd.x + 15.5, lcd.y + 13], METER_H + 0.5, P, "y"), "", { size: 6.4, tone: "hi", anchor: "middle" }).replace("<text ", '<text data-text="lcd" '));
    o.push(k.faceTextSvg(k.topMatrix([lcd.x + 6.2, lcd.y + 13], METER_H + 0.5, P, "y"), T.off, { size: 2.2, tone: "mid", anchor: "middle" }));
    // commutateur rotatif
    const kc = [METER.x + 17, METER.y + 12];
    o.push(S(k.cylinder(kc[0], kc[1], 6.4, METER_H, 0.6, P, 36), { tone: "lo" }));
    o.push(S(k.cylinder(kc[0], kc[1], 4.6, METER_H + 0.6, 2.6, P, 28, 0.3), { tone: "mid", inner: L(k.knurl(kc[0], kc[1], 4.6, METER_H + 0.6, METER_H + 3.2, 24, P), { tone: "faint" }) }));
    const pos = [];
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (0.15 + i * 0.12);
      pos.push(k.pathOf([at([kc[0] + Math.cos(a) * 7, kc[1] + Math.sin(a) * 7, METER_H]), at([kc[0] + Math.cos(a) * 8.6, kc[1] + Math.sin(a) * 8.6, METER_H])]));
    }
    o.push(L(pos.join(""), { tone: "lo" }));
    const aOhm = Math.PI * (0.15 + 3 * 0.12);
    o.push(L(k.pathOf([at([kc[0], kc[1], METER_H + 3.2]), at([kc[0] + Math.cos(aOhm) * 4, kc[1] + Math.sin(aOhm) * 4, METER_H + 3.2])]), { tone: "hi" }));
    o.push(D([at([kc[0], kc[1], METER_H + 3.2])], { size: 0.7, tone: "hi" }));
    o.push(k.faceTextSvg(k.topMatrix([kc[0] + Math.cos(aOhm) * 11, kc[1] + Math.sin(aOhm) * 11], METER_H, P, "y"), "Ω", { size: 3.2, tone: "hi", anchor: "middle" }));
    // douilles
    for (const [y, name] of [[METER.y + 4, "COM"], [METER.y + 12, "Ω"]].map(([y, n]) => [y, n])) {
      o.push(S(k.cylinder(METER.x + 5, y, 2.2, METER_H, 0.8, P, 20), { tone: "lo" }) + L(k.ring(METER.x + 5, y, 1, METER_H + 0.8, P, 12), { tone: "hi" }));
      o.push(k.faceTextSvg(k.topMatrix([METER.x + 10, y], METER_H, P, "y"), name, { size: 2, tone: "lo", anchor: "middle" }));
    }
    return o.join("");
  }
  // pointes de touche : poignée et fil, recalculées à chaque image
  const probes = () => ["a", "b"].map((p) => `<g class="rf-probe" data-p="${p}"><path class="rf-lead" data-tone="${p === "a" ? "lit" : "mid"}" d=""/><path class="rf-handle" data-tone="${p === "a" ? "lit" : "mid"}" d=""/><path class="rf-tip" d=""/></g>`).join("");

  const body = [plate(), jbox(), tray(), meter(), motor(), cables(), box(), leads(), studs(), links(), nuts(), probes()];
  const svg = k.figureSvg({ width: WIDTH, height: HEIGHT, label: T.svgLabel, body });
  const config = {
    P,
    terms: Object.fromEntries(Object.entries(TERM).map(([n, [x, y]]) => [n, [x, y, ZB + BAR_T + 2.4]])),
    jacks: { a: [METER.x + 5, METER.y + 12, METER_H + 0.8], b: [METER.x + 5, METER.y + 4, METER_H + 0.8] },
    rest: { a: [METER.x - 5, METER.y + 44, 0.6], b: [METER.x - 12, METER.y + 34, 0.6] },
    barOffset: [TRAY.x + 18 - ROW1, TRAY.y + 22 - COLS[1], TRAY_H - ZB],
    lift: 36,
    motors: MOTORS,
  };
  return { svg, config };
}

const CSS = `
.rf-plate,.rf-lcd{fill:var(--anatomy-top)}
.rf-sel{opacity:0;transition:opacity .2s}
.rf-term[data-on] .rf-sel{opacity:1}
.rf-hit{fill:transparent;stroke:none;cursor:pointer;pointer-events:all}
.rf-term:hover .rf-sel{opacity:.5}
.rf-lead{fill:none;stroke-width:1.5;stroke-linecap:round}
.rf-handle{fill:none;stroke-width:4.2;stroke-linecap:round}
.rf-lead[data-tone="lit"],.rf-handle[data-tone="lit"]{stroke:var(--anatomy-lit)}
.rf-lead[data-tone="mid"],.rf-handle[data-tone="mid"]{stroke:var(--anatomy-mid)}
.rf-tip{fill:none;stroke:var(--anatomy-hi);stroke-width:1;stroke-linecap:round}
.rf-cable{transition:opacity .4s}
.rf-cable[data-off]{opacity:0}
.rf-cable .iso-line{stroke-width:1.2}
.rf-cable.rf-outer .iso-line{stroke-width:2.4}
.iso-stage{touch-action:manipulation}
.iso-plate-corner[data-corner="hint"]{top:20px;bottom:auto;right:0;white-space:normal;line-height:1.35}
.iso-plate-corner[data-corner="readout"]{left:0;white-space:normal;text-align:right;line-height:1.4}
.iso-plate{padding-top:80px}
.rf-controls{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px;align-items:center}
.rf-controls button{font:12px/1.2 var(--anatomy-mono);letter-spacing:.04em;color:var(--anatomy-strong);background:var(--anatomy-card);border:1px solid var(--anatomy-mid);border-radius:999px;padding:10px 14px;min-height:44px;min-width:44px;cursor:pointer}
.rf-controls button[aria-pressed="true"]{border-color:var(--anatomy-lit);box-shadow:inset 0 0 0 1px var(--anatomy-lit)}
.rf-controls button:focus-visible{outline:2px solid var(--anatomy-hi);outline-offset:2px}
.rf-controls button:disabled{opacity:.45;cursor:default}
.rf-controls .rf-label{font:11px/1.2 var(--anatomy-mono);color:var(--anatomy-muted);width:100%}
.rf-controls[hidden]{display:none}
.rf-feedback{margin:12px 0 0;min-height:3em;color:var(--anatomy-text);font-size:13px;line-height:1.55}
.rf-log,.rf-score{color:var(--anatomy-muted);font:11px/1.5 var(--anatomy-mono);margin:6px 0 0}
@media (max-width:560px){.iso-plate{padding:76px 12px 64px}.rf-controls button{flex:1 1 40%}.rf-controls .rf-term-btn{flex:1 1 12%}}
`;

const LIVE = `
const still = matchMedia("(prefers-reduced-motion: reduce)");
const C = FIG, T = TX, P = C.P;
const scope = document.querySelector('.live-figure[data-figure="reperage-fractionne"]') || document;
const root = scope.querySelector(".iso-plate");
const stage = root.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const readout = root.querySelector("[data-readout]");
const feedback = scope.querySelector(".rf-feedback");
const logEl = scope.querySelector(".rf-log");
const scoreEl = scope.querySelector(".rf-score");
const answerRow = scope.querySelector(".rf-answers");
const buttons = Object.fromEntries([...scope.querySelectorAll(".rf-controls button[data-act]")].map((b) => [b.dataset.act, b]));
const termButtons = [...scope.querySelectorAll(".rf-term-btn")];
const terms = Object.fromEntries([...svg.querySelectorAll(".rf-term")].map((g) => [g.dataset.term, g]));
const bars = svg.querySelector(".rf-bars");
const cables = [...svg.querySelectorAll(".rf-cable")];
const probe = Object.fromEntries([...svg.querySelectorAll(".rf-probe")].map((g) => [g.dataset.p, { lead: g.querySelector(".rf-lead"), handle: g.querySelector(".rf-handle"), tip: g.querySelector(".rf-tip") }]));
const txt = (name) => svg.querySelector('[data-text="' + name + '"]');
// ---- réseau de résistances : deux étoiles (points neutres 7 et 8), barrettes de la plaque G
function resistance(a, b) {
  const m = motor(), edges = [];
  for (const t of [1, 2, 3]) edges.push([t, 7, m.r1]);
  for (const t of [4, 5, 6]) edges.push([t, 8, m.r2]);
  if (mode === "G") for (const [x, y] of [[1, 4], [2, 5], [3, 6]]) edges.push([x, y, 0.001]);
  // composante connexe
  const seen = new Set([a]), stack = [a];
  while (stack.length) { const n = stack.pop(); for (const [x, y] of edges) { const o = x === n ? y : y === n ? x : null; if (o !== null && !seen.has(o)) { seen.add(o); stack.push(o); } } }
  if (!seen.has(b)) return null;
  // potentiels : nœud a à 1 V, nœud b à 0 V (Gauss-Seidel sur 8 nœuds)
  const v = Array(9).fill(0.5); v[a] = 1; v[b] = 0;
  for (let it = 0; it < 4000; it++) for (const n of seen) {
    if (n === a || n === b) continue;
    let g = 0, s = 0;
    for (const [x, y, r] of edges) { const o = x === n ? y : y === n ? x : null; if (o !== null) { g += 1 / r; s += v[o] / r; } }
    v[n] = s / g;
  }
  let i = 0;
  for (const [x, y, r] of edges) { if (x === a) i += (1 - v[y]) / r; else if (y === a) i += (1 - v[x]) / r; }
  return 1 / i;
}
let mode = "test", sc = 0, sel = [], log = [], answered = false, good = 0, total = 0, place = 0, frame = 0, last = 0, visible = false;
const tips = { a: [...C.rest.a], b: [...C.rest.b] };
const motor = () => C.motors[sc];
const target = (p) => { const i = p === "a" ? 0 : 1; return sel[i] ? C.terms[sel[i]] : C.rest[p]; };
function measure() {
  if (sel.length < 2) return null;
  return { pair: T.pair(Math.min(sel[0], sel[1]), Math.max(sel[0], sel[1])), r: resistance(sel[0], sel[1]) };
}
function touch(n) {
  n = Number(n);
  if (sel.includes(n)) sel = sel.filter((x) => x !== n);
  else if (sel.length < 2) sel.push(n);
  else sel = [n]; // une 3e borne commence une nouvelle mesure
  const m = measure();
  if (m && mode === "test") {
    log = log.filter((e) => e.pair !== m.pair); log.push(m); if (log.length > 6) log.shift();
    if (m.r === null) feedback.textContent = T.feedback.cross;
  }
  sync(); run();
}
function winding(t) { return t <= 3 ? 1 : 2; }
function answer(id) {
  if (mode !== "test") return;
  const ws = new Set(log.filter((e) => e.r !== null).map((e) => winding(Number(e.pair[0]))));
  if (!(ws.has(1) && ws.has(2))) { feedback.textContent = T.feedback.need; return; }
  const m = motor(), ok = id === m.id;
  if (!answered) { total++; if (ok) good++; answered = true; }
  const a = T.ohm(2 * m.r1), b = T.ohm(2 * m.r2);
  feedback.textContent = m.id === "m50" ? (ok ? T.feedback.ok50(a) : T.feedback.bad66(a)) : ok ? T.feedback.ok66(a, b) : T.feedback.bad50(a, b);
  sync();
}
function setMode(m) {
  mode = m; sel = [];
  feedback.textContent = m === "test" ? T.feedback.start : T.feedback[m];
  sync(); run();
}
function nextMotor() {
  sc = Math.floor(Math.random() * C.motors.length);
  sel = []; log = []; answered = false; mode = "test";
  feedback.textContent = T.feedback.start;
  sync(); run();
}
function sync() {
  for (const m of ["test", "G", "H"]) buttons[m].setAttribute("aria-pressed", mode === m ? "true" : "false");
  answerRow.hidden = mode !== "test";
  for (const id of ["m50", "m66"]) buttons[id].disabled = answered;
  txt("plate").textContent = answered || mode !== "test" ? T.plate[motor().id] : T.plateHidden;
  for (const [n, g] of Object.entries(terms)) { if (sel.includes(Number(n))) g.setAttribute("data-on", ""); else g.removeAttribute("data-on"); }
  for (const b of termButtons) b.setAttribute("aria-pressed", sel.includes(Number(b.dataset.term)) ? "true" : "false");
  for (const c of cables) {
    const show = mode === "H" || (mode === "G" && c.dataset.c === "K1");
    if (show) c.removeAttribute("data-off"); else c.setAttribute("data-off", "");
  }
  const m = measure();
  txt("lcd").textContent = m ? T.ohm(m.r) : "- - -";
  readout.textContent = m ? T.read(m.pair, T.ohm(m.r)) : sel.length === 1 ? T.readOne(sel[0]) : T.readNone(T.modes[mode]);
  logEl.textContent = mode === "test" && log.length ? T.log + log.map((e) => T.read(e.pair, T.ohm(e.r))).join(" · ") : "";
  scoreEl.textContent = T.score(good, total);
}
function leadPath(jack, tip) {
  const hz = tip[2] + 14;
  const top = [tip[0] - 2, tip[1] + 3, hz];
  const pts = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    pts.push(iso([jack[0] + (top[0] - jack[0]) * t, jack[1] + (top[1] - jack[1]) * t, jack[2] + (top[2] - jack[2]) * t + 16 * Math.sin(Math.PI * t) - 4 * t], P));
  }
  return { lead: pathOf(pts), handle: pathOf([iso([tip[0] - 0.6, tip[1] + 0.9, tip[2] + 4], P), iso(top, P)]), tip: pathOf([iso(tip, P), iso([tip[0] - 0.6, tip[1] + 0.9, tip[2] + 4], P)]) };
}
function draw() {
  for (const p of ["a", "b"]) {
    const d = leadPath(C.jacks[p], tips[p]);
    probe[p].lead.setAttribute("d", d.lead); probe[p].handle.setAttribute("d", d.handle); probe[p].tip.setAttribute("d", d.tip);
  }
  const t = place, [ox, oy, oz] = C.barOffset;
  bars.setAttribute("transform", translateAlong(P, [ox * (1 - t), oy * (1 - t), oz * (1 - t) + C.lift * 4 * t * (1 - t)]));
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  const ease = (v, to, tau) => (calm ? to : v + (to - v) * (1 - Math.exp(-dt / tau)));
  let moving = false;
  for (const p of ["a", "b"]) {
    const to = target(p);
    for (let i = 0; i < 3; i++) { tips[p][i] = ease(tips[p][i], to[i], 0.14); if (Math.abs(tips[p][i] - to[i]) > 0.02) moving = true; }
  }
  // en vol, la pointe passe au-dessus du bornier
  place = ease(place, mode === "G" ? 1 : 0, 0.24);
  draw();
  frame = visible && (moving || Math.abs(place - (mode === "G" ? 1 : 0)) > 1e-3) ? requestAnimationFrame(tick) : 0;
}
function run() { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } }
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
for (const [n, g] of Object.entries(terms)) g.addEventListener("click", () => touch(n));
for (const b of termButtons) b.addEventListener("click", () => touch(b.dataset.term));
for (const m of ["test", "G", "H"]) buttons[m].addEventListener("click", () => setMode(m));
buttons.m50.addEventListener("click", () => answer("m50"));
buttons.m66.addEventListener("click", () => answer("m66"));
buttons.next.addEventListener("click", nextMotor);
window.__rf = { touch, answer, setMode, nextMotor, resistance, state: () => ({ mode, sc, sel: [...sel], log: log.map((e) => [e.pair, e.r]), good, total }) };
nextMotor();
draw();
`;

const written = [];
const site = { fragments: {}, scripts: {} };
for (const lang of ["fr", "en"]) {
  const T = TEXT[lang];
  const { svg, config } = buildFigure(lang);
  const modeRow = `<div class="rf-controls" role="group" aria-label="${lang === "fr" ? "Plaque à bornes" : "Terminal board"}">${Object.entries(T.modes).map(([id, label]) => `<button type="button" data-act="${id}" aria-pressed="${id === "test"}">${label}</button>`).join("")}</div>`;
  const termRow = `<div class="rf-controls" role="group" aria-label="${T.terms}"><span class="rf-label">${T.terms}</span>${[1, 2, 3, 4, 5, 6].map((n) => `<button type="button" class="rf-term-btn" data-term="${n}" aria-pressed="false">${n}</button>`).join("")}</div>`;
  const answerRow = `<div class="rf-controls rf-answers" role="group" aria-label="${lang === "fr" ? "Votre réponse" : "Your answer"}"><button type="button" data-act="m50">${T.answers.m50}</button><button type="button" data-act="m66">${T.answers.m66}</button><button type="button" data-act="next">${T.answers.next}</button></div>`;
  const controls = `${modeRow}${termRow}${answerRow}<p class="rf-feedback" aria-live="polite"></p><p class="rf-log" aria-live="polite"></p><p class="rf-score" aria-live="polite"></p>`;
  const plate = k.plateHtml({ fig: "Fig 8", title: T.title, hint: T.hint, readout: "", keys: T.keys, caption: T.caption, body: `<div class="iso-stage" role="img" aria-label="${T.stageLabel}">${svg}</div>${controls}` });
  const TX = `{modes:${JSON.stringify(T.modes)},plate:${JSON.stringify(T.plate)},plateHidden:${JSON.stringify(T.plateHidden)},ohm:${T.ohm},pair:${T.pair},readNone:${T.readNone},readOne:${T.readOne},read:${T.read},log:${JSON.stringify(T.log)},score:${T.score},feedback:{start:${JSON.stringify(T.feedback.start)},need:${JSON.stringify(T.feedback.need)},cross:${JSON.stringify(T.feedback.cross)},G:${JSON.stringify(T.feedback.G)},H:${JSON.stringify(T.feedback.H)},ok50:${T.feedback.ok50},ok66:${T.feedback.ok66},bad50:${T.feedback.bad50},bad66:${T.feedback.bad66}}}`;
  const pageScript = `const FIG = ${JSON.stringify(config)};\nconst TX = ${TX};\n${LIVE}`;
  site.fragments[lang] = plate;
  site.scripts[lang] = pageScript;
  for (const theme of ["dark", "light"]) {
    const name = `reperage-fractionne.${lang}${theme === "light" ? "-light" : ""}.html`;
    writeFileSync(join(HERE, name), k.pageHtml({ title: T.pageTitle, theme, body: `<style>${CSS}</style>${plate}`, script: KIT_SOURCE + pageScript, width: 760 }).replace('<html lang="en">', `<html lang="${lang}">`));
    written.push(name);
  }
}
written.push(...publish("reperage-fractionne", { ...site, css: CSS }));
console.log("wrote", written.join(", "));
