// Figure interactive (skill anatomy) : fonctionnement du démarrage fractionné (part winding).
// Partie 3, module 6, section « Principe et rôle » : 1er temps (K1, premier bobinage), 2e temps après ≤ 1 s (K2, second bobinage).
// Un coffret (K1, temporisation K1T, K2, relais thermiques F1 et F2, ampèremètre, enregistreur de courant) alimente un
// compresseur à deux bobinages indépendants. On compare au démarrage direct et on voit les deux erreurs du cours :
// moteur laissé sur le seul enroulement de démarrage, second bobinage câblé dans l'autre sens.
// Usage : node figures/fractionne/build.mjs   (fr + en, sombre + clair)
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../_kit/iso-kit.mjs";
import * as G from "../_kit/lathe.mjs";
import { publish } from "../_kit/publish.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const KIT_SOURCE = readFileSync(join(HERE, "..", "_kit", "iso-kit.mjs"), "utf8").replace(/^export /gm, "");

// ---------------------------------------------------------------- modèle (courants en multiples de In, temps réel en s)
// Démarrage direct : courant d'appel 6 × In (le cours donne 3 à 8 × In). Un seul bobinage (moitié du moteur) : environ
// 60 % de ce courant et un couple réduit de moitié environ ; le moteur ne prend qu'une partie de sa vitesse en 1 s.
// À la fermeture de K2, le moteur complet repart de la vitesse atteinte : le 2e pic est plus faible que le pic direct.
const MODEL = {
  ilr: 6, // courant à rotor bloqué du moteur complet
  half: 0.6, // part du courant d'appel absorbée par un seul bobinage
  rate: 3.2, // accélération du moteur complet (1/s)
  halfRate: 0.45, // couple relatif d'un seul bobinage
  halfTop: 0.9, // vitesse atteinte sur un seul bobinage, en charge
  delay: 1, // temporisation K1T : 1 s au maximum
  slow: 4, // la figure montre le démarrage 4 fois ralenti
  window: 4, // l'enregistreur trace les 4 premières secondes
  trip: { k2fail: 5, k2rev: 2.4 }, // déclenchement du relais thermique (temps raccourci dans la figure)
};

// ---------------------------------------------------------------- textes
const TEXT = {
  fr: {
    title: "Démarrage fractionné",
    pageTitle: "Démarrage fractionné (part winding) : 1er temps, 2e temps",
    hint: "Choisir un cas, puis appuyer sur Marche",
    modes: { pw: "Fractionné (K1 puis K2)", dol: "Direct (comparaison)", k2fail: "Erreur : K2 ne colle pas", k2rev: "Erreur : K2 câblé à l'envers" },
    start: "Marche S1",
    stop: "Arrêt S0",
    keys: [
      { mark: "lit", label: "Courant : aiguille de l'ampèremètre et tracé de l'enregistreur" },
      { mark: "raised", label: "Coffret : K1, temporisation K1T, K2, relais thermiques F1 et F2" },
      { mark: "dashed", label: "Bobinage sous tension (câble K1 → bornes 1-2-3, câble K2 → bornes 4-5-6)" },
    ],
    caption: "Le compresseur possède deux bobinages indépendants, câblés chacun en étoile. 1er temps : S1 ferme K1, qui alimente le premier bobinage (bornes 1, 2, 3) ; un seul bobinage n'absorbe qu'environ 60 % du courant d'appel du démarrage direct. 2e temps : après la temporisation K1T (1 s au maximum), K2 alimente le second bobinage (bornes 4, 5, 6) ; le moteur, déjà lancé, ne produit qu'un second pic, lui aussi bien plus faible que l'appel direct. Le réseau voit deux marches de courant au lieu d'un seul gros appel. Si K2 ne se ferme pas, le premier bobinage porte seul la charge et chauffe : F1 déclenche. Si le second bobinage est câblé dans l'autre ordre des phases, les deux bobinages tirent en sens contraire : le moteur freine, le courant reste très fort et le relais thermique déclenche. Valeurs typiques (6 × In en direct) ; démarrage montré 4 fois ralenti, déclenchements accélérés.",
    stageLabel: "Démarrage fractionné : un coffret avec ampèremètre, enregistreur de courant, contacteurs K1 et K2, temporisation K1T et relais thermiques F1 et F2, relié par deux câbles aux deux bobinages d'un compresseur. Choisissez un cas, appuyez sur Marche et observez le courant.",
    svgLabel: "Coffret de démarrage fractionné et compresseur à deux bobinages, bornier 1 à 6.",
    readOff: (mode) => `arrêt · ${mode}`,
    readRun: (s) => `${s.step} · t = ${s.t} s · I = ${s.i} × In${s.extra}`,
    steps: { t0: "arrêt", t1: "1er temps : K1", t2: "2e temps : K1 + K2", dol: "direct : K1 + K2", rev: "K2 à l'envers", trip: "déclenché" },
    perWinding: (a, b) => ` (bobinage 1 : ${a} · bobinage 2 : ${b})`,
    peaks: (p1, p2) => `Pics relevés : ${p1} × In${p2 ? ` puis ${p2} × In` : ""}.`,
    feedback: {
      idle: "Appuyez sur « Marche S1 » : K1 se ferme, la temporisation K1T démarre. L'enregistreur garde le tracé précédent en pâle pour comparer.",
      pw: (p) => `Démarrage fractionné réussi. ${p} Le premier bobinage limite le premier appel ; K2 arrive après 1 s, sur un moteur déjà lancé. En régime, chaque bobinage porte la moitié du courant.`,
      dol: (p) => `Démarrage direct : les deux bobinages ensemble. ${p} C'est ce gros appel unique que le démarrage fractionné partage en deux marches.`,
      k2fail: "K2 n'est jamais alimenté : le moteur tourne sur le seul enroulement de démarrage. Ce bobinage, prévu pour la moitié du courant, en porte le double : il chauffe et F1 déclenche. Fonctionner sur le 1er temps seul endommage le moteur.",
      k2rev: "Le second bobinage est câblé dans l'autre ordre des phases : il crée un champ qui tourne en sens contraire. Le moteur freine, le courant reste proche du courant à rotor bloqué et le relais thermique déclenche. Les deux départs doivent garder le même ordre des phases.",
      stopped: "Arrêt : K1 et K2 retombent.",
    },
    plate: "3~ 400 V · 2 × 50 %",
    plate2: "K1 : 1-2-3 · K2 : 4-5-6",
    recTitle: "I / In",
    recTime: "0  1  2  3  4 s",
  },
  en: {
    title: "Part-winding starting",
    pageTitle: "Part-winding starting: first step, second step",
    hint: "Choose a case, then press Start",
    modes: { pw: "Part winding (K1 then K2)", dol: "Direct-on-line (to compare)", k2fail: "Fault: K2 does not pull in", k2rev: "Fault: K2 wired the wrong way" },
    start: "Start S1",
    stop: "Stop S0",
    keys: [
      { mark: "lit", label: "Current: ammeter needle and recorder trace" },
      { mark: "raised", label: "Panel: K1, on-delay timer K1T, K2, thermal overload relays F1 and F2" },
      { mark: "dashed", label: "Live winding (cable K1 → terminals 1-2-3, cable K2 → terminals 4-5-6)" },
    ],
    caption: "The compressor has two independent windings, each connected in star. First step: S1 closes K1, which feeds the first winding (terminals 1, 2, 3); a single winding draws only about 60 % of the direct-on-line inrush current. Second step: after the on-delay timer K1T (1 s at most), K2 feeds the second winding (terminals 4, 5, 6); the motor is already turning, so the second peak is also well below the direct-on-line inrush. The supply sees two steps of current instead of one large inrush. If K2 does not close, the first winding carries the whole load and overheats: F1 trips. If the second winding is wired with the phase order reversed, the two windings pull in opposite directions: the motor brakes, the current stays very high and the thermal overload relay trips. Typical values (6 × In direct-on-line); start shown 4 times slower, trips speeded up.",
    stageLabel: "Part-winding starting: a panel with ammeter, current recorder, contactors K1 and K2, on-delay timer K1T and thermal overload relays F1 and F2, connected by two cables to the two windings of a compressor. Choose a case, press Start and watch the current.",
    svgLabel: "Part-winding starter panel and two-winding compressor, terminals 1 to 6.",
    readOff: (mode) => `off · ${mode}`,
    readRun: (s) => `${s.step} · t = ${s.t} s · I = ${s.i} × In${s.extra}`,
    steps: { t0: "off", t1: "first step: K1", t2: "second step: K1 + K2", dol: "direct: K1 + K2", rev: "K2 reversed", trip: "tripped" },
    perWinding: (a, b) => ` (winding 1: ${a} · winding 2: ${b})`,
    peaks: (p1, p2) => `Peaks recorded: ${p1} × In${p2 ? ` then ${p2} × In` : ""}.`,
    feedback: {
      idle: "Press “Start S1”: K1 closes and the on-delay timer K1T starts. The recorder keeps the previous trace, faint, for comparison.",
      pw: (p) => `Part-winding start completed. ${p} The first winding limits the first inrush; K2 follows after 1 s, on a motor that is already turning. Once running, each winding carries half the current.`,
      dol: (p) => `Direct-on-line start: both windings together. ${p} Part-winding starting splits this single large inrush into two steps.`,
      k2fail: "K2 is never energised: the motor runs on the starting winding alone. That winding, rated for half the current, carries twice as much: it overheats and F1 trips. Running on the first step alone damages the motor.",
      k2rev: "The second winding is wired with the phase order reversed: its field rotates the other way. The motor brakes, the current stays close to the locked-rotor current and the thermal overload relay trips. Both outgoing feeds must keep the same phase order.",
      stopped: "Stop: K1 and K2 drop out.",
    },
    plate: "3~ 400 V · 2 × 50 %",
    plate2: "K1: 1-2-3 · K2: 4-5-6",
    recTitle: "I / In",
    recTime: "0  1  2  3  4 s",
  },
};

// ---------------------------------------------------------------- géométrie (az 28° : y horizontal à l'écran, y grand à gauche)
const AZ = 28;
const WIDTH = 680;
const HEIGHT = 460;
const PLATE = { x: -84, y: -214, w: 134, d: 366, r: 8 };
const PLATE_H = 10;
const FOOT_H = 5;

// coffret : face avant en x = PFX, de y = -200 à -40, de z = 0 à 124
const CAB = { x: -76, y: -204, w: 34, d: 166, r: 3 };
const CAB_H = 126;
const PFX = CAB.x + CAB.w;
const DEV = 11; // profondeur des appareils

// appareils sur la face (y0 > y1 : y0 à gauche)
const K1 = { y: -82, z: 46 };
const KT = { y: -106, z: 46 };
const K2 = { y: -130, z: 46 };
const F1 = { y: -82, z: 18 };
const F2 = { y: -130, z: 18 };
const SBTN = { y: -58, z1: 62, z0: 46 };
const DIAL = { y: -176, z: 98, r: 13 };
const REC = { y0: -48, y1: -154, z0: 82, z1: 114 };

// moteur (compresseur) : axe selon y
const R = 27;
const CZ = 38;
const Y0 = 18;
const LEN = 88;
const F = G.frameOf([0, Y0, CZ], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
const BOX = { x: -24, y: Y0 + 20, w: 48, d: 50, r: 2.5 };
const BOX_Z = CZ + R - 2;
const BOX_H = 12;
const BOARD = { x: -20.5, y: BOX.y + 4, w: 41, d: 42, r: 1.8 };
const BOARD_Z = BOX_Z + BOX_H;
const ZB = BOARD_Z + 3;
const ROW1 = -9; // bornes 1 2 3
const ROW2 = 9; // bornes 4 5 6
const COLS = [BOX.y + 40, BOX.y + 27, BOX.y + 14];

function buildFigure(lang) {
  const T = TEXT[lang];
  const P = k.fitProjection([...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [CAB.x, CAB.y, CAB_H], [CAB.x, CAB.y + CAB.d, CAB_H], [0, Y0 + LEN + 30, CZ + 14], [0, 40, ZB + 10]], WIDTH, HEIGHT, { pad: 12, azimuth: AZ, elevation: 38 });
  const at = (p) => k.iso(p, P);
  const S = (paths, style) => k.solidSvg(paths, style);
  const L = (d, style) => k.lineSvg(d, style);
  const D = (pts, style) => k.dotsSvg(pts, style);
  const depth = (x, y, z = 0) => k.depthOf([x, y, z], P);
  const pathD = (pts) => k.pathOf(pts.map(at));
  const faceText = (x, y, z, s, size, tone, name, anchor = "middle") => k.faceTextSvg(k.sideMatrix([x, y], z, P, "right"), s, { size, tone, anchor }).replace("<text ", `<text${name ? ` data-text="${name}"` : ""} `);
  const onFace = (x, y, z) => at([x, y, z]);
  const box3 = (y0, y1, z0, z1, x0, dx, tone, bevel = 0.4, extra = {}) => S(k.slabOf({ x: x0, y: y1, w: dx, d: y0 - y1, r: 0.8 }, z0, z1 - z0, P, 2, bevel), { tone, ...extra });

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
    // réglette graduée le long du bord avant
    const strip = { x: PLATE.x + PLATE.w - 12, y: 0, w: 6, d: 150, r: 1 };
    o.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
    const t = k.topTicks(strip.y + 4, strip.y + strip.d - 4, 4, 5, strip.x + 0.8, 0.6, [1.8, 3.4], P, "y");
    o.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
    // plot antivibratile sous chaque patte du compresseur
    for (const y of [Y0 + 10, Y0 + LEN - 20]) for (const x of [-25, 25]) {
      o.push(S(k.cylinder(x, y + 5, 6, 0, 3, P, 24, 0.4), { tone: "lo" }));
    }
    return o.join("");
  }

  // ---- coffret et ses appareils
  function cabinet() {
    const o = [`<path class="iso-halo" d="${k.haloOf(CAB, 0, CAB_H, P)}"/>`];
    o.push(S(k.slabOf(CAB, 0, CAB_H, P, 4, 1), { tone: "mid", inner: L(k.sideSeam(CAB, 10, P, 4) + k.sideSeam(CAB, CAB_H - 8, P, 4), { tone: "faint" }) }));
    o.push(L(k.planOutline(k.insetPlan(CAB, 3), CAB_H, P, 3), { tone: "faint" }));
    o.push(D(k.corners(CAB, 6).map(([x, y]) => at([x, y, CAB_H])), { size: 0.5 }));
    // fond de coffret : rails DIN et goulotte
    for (const z of [K1.z + 13, F1.z + 9]) o.push(box3(-66, -148, z - 3.5, z + 3.5, PFX, 1.6, "lo", 0.2));
    o.push(box3(-62, -152, 3, 10, PFX, 6, "lo", 0.4, { inner: L(Array.from({ length: 11 }, (_, i) => k.pathOf([onFace(PFX + 6, -66 - i * 8, 10), onFace(PFX + 6, -66 - i * 8, 6)])).join(""), { tone: "faint" }) }));
    // presse-étoupes sur le flanc +y (sorties des deux câbles)
    for (const [z, x] of [[70, -50], [70, -62]]) o.push(S(G.disc(0, 4, 4, G.frameOf([x, CAB.y + CAB.d, z], [0, 1, 0], [1, 0, 0], [0, 0, 1]), P, { steps: 24, bevel: 0.3 }), { tone: "lo" }));
    return o.join("");
  }

  const devices = () => {
    const parts = [];
    // contacteur : boîtier, vis de bornes, fenêtre, indicateur (poussoir) qui rentre quand le contacteur est fermé
    const contactor = (c, name) => {
      const o = [box3(c.y + 8, c.y - 8, c.z - 13, c.z + 13, PFX, DEV, "mid", 0.6)];
      const xf = PFX + DEV;
      for (const z of [c.z + 9.5, c.z - 9.5]) o.push(D([-5, 0, 5].map((dy) => onFace(xf, c.y + dy, z)), { size: 0.55, tone: "mid" }) + L([-5, 0, 5].map((dy) => k.sideRing([xf, c.y + dy, z], 1.6, "x", P, 12)).join(""), { tone: "lo" }));
      o.push(box3(c.y + 4, c.y - 4, c.z - 4, c.z + 4, xf, 0.6, "lo", 0.2));
      o.push(`<g class="pw-plunger" data-k="${name}">${box3(c.y + 2.6, c.y - 2.6, c.z - 2.6, c.z + 2.6, xf + 0.6, 2.4, "hi", 0.2)}</g>`);
      o.push(faceText(xf + 0.1, c.y, c.z - 5.6, name, 3, "hi"));
      return { d: depth(xf, c.y, c.z), s: o.join("") };
    };
    // relais thermique : boîtier, molette de réglage, bouton de réarmement, drapeau de déclenchement
    const relay = (c, name) => {
      const o = [box3(c.y + 8, c.y - 8, c.z - 9, c.z + 9, PFX, DEV - 2, "lo", 0.5)];
      const xf = PFX + DEV - 2;
      const KF = G.frameOf([xf, c.y + 3.5, c.z + 3], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
      o.push(S(G.disc(0, 1.4, 3, KF, P, { steps: 20, bevel: 0.2 }), { tone: "mid" }));
      o.push(L(k.pathOf([at([xf + 1.5, c.y + 3.5, c.z + 3.6]), at([xf + 1.5, c.y + 3.5, c.z + 5.6])]), { tone: "hi" }));
      o.push(S(G.disc(0, 1.6, 2, G.frameOf([xf, c.y - 3.5, c.z + 3], [1, 0, 0], [0, 1, 0], [0, 0, 1]), P, { steps: 16 }), { tone: "hi" }));
      o.push(`<g class="pw-flag" data-f="${name}">${box3(c.y + 1.5, c.y - 5, c.z - 6, c.z - 3.4, xf, 1.2, "hi", 0.2)}</g>`);
      o.push(faceText(xf + 0.1, c.y + 4, c.z - 3.6, name, 2.6, "mid"));
      return { d: depth(xf, c.y, c.z), s: o.join("") };
    };
    // temporisation K1T : boîtier étroit, bouton de réglage (index sur 1 s), voyant de temporisation
    const timer = (c) => {
      const o = [box3(c.y + 5, c.y - 5, c.z - 13, c.z + 13, PFX, DEV - 1, "mid", 0.5)];
      const xf = PFX + DEV - 1;
      const KF = G.frameOf([xf, c.y, c.z + 3], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
      o.push(S(G.disc(0, 1.8, 3.4, KF, P, { steps: 24, bevel: 0.2 }), { tone: "mid" }));
      const ticks = [];
      for (let i = 0; i <= 6; i++) {
        const a = Math.PI * (1.2 - (1.4 * i) / 6);
        ticks.push(k.pathOf([onFace(xf + 0.05, c.y - Math.cos(a) * 3.8, c.z + 3 + Math.sin(a) * 3.8), onFace(xf + 0.05, c.y - Math.cos(a) * 4.6, c.z + 3 + Math.sin(a) * 4.6)]));
      }
      o.push(L(ticks.join(""), { tone: "lo" }));
      const a = Math.PI * (1.2 - 1.4 * 0.25); // index sur 1 s (échelle 0,1 à 3 s)
      o.push(L(k.pathOf([onFace(xf + 1.9, c.y, c.z + 3), onFace(xf + 1.9, c.y - Math.cos(a) * 2.8, c.z + 3 + Math.sin(a) * 2.8)]), { tone: "hi" }));
      o.push(S(G.disc(0, 1, 1.4, G.frameOf([xf, c.y, c.z + 9], [1, 0, 0], [0, 1, 0], [0, 0, 1]), P, { steps: 14 }), { tone: "lo" }));
      o.push(`<g class="pw-led">${S(G.disc(1, 1.6, 1, G.frameOf([xf, c.y, c.z + 9], [1, 0, 0], [0, 1, 0], [0, 0, 1]), P, { steps: 14 }), { tone: "hi" })}</g>`);
      o.push(faceText(xf + 0.1, c.y, c.z - 7, "K1T", 2.6, "hi"));
      o.push(faceText(xf + 0.1, c.y, c.z - 10.4, "1 s", 2.2, "mid"));
      return { d: depth(xf, c.y, c.z), s: o.join("") };
    };
    // boutons S1 (marche, affleurant) et S0 (arrêt, coup-de-poing)
    const buttons = () => {
      const o = [box3(SBTN.y + 7, SBTN.y - 7, SBTN.z0 - 8, SBTN.z1 + 8, PFX, 4, "lo", 0.5)];
      const xf = PFX + 4;
      for (const [z, name, r, h] of [[SBTN.z1, "S1", 3.2, 1.4], [SBTN.z0, "S0", 4, 3.2]]) {
        const BF = G.frameOf([xf, SBTN.y, z], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
        o.push(S(G.disc(0, 1, r + 1.2, BF, P, { steps: 24 }), { tone: "mid" }));
        o.push(`<g class="pw-btn" data-b="${name}">${S(G.disc(1, 1 + h, r, BF, P, { steps: 24, bevel: 0.4 }), { tone: "hi" })}</g>`);
        o.push(faceText(xf + 0.1, SBTN.y, z - r - 2.6, name, 2.4, "mid"));
      }
      return { d: depth(xf, SBTN.y, SBTN.z0), s: o.join("") };
    };
    // ampèremètre (cadran dans le plan de la face)
    const ammeter = () => {
      const o = [box3(DIAL.y + 16, DIAL.y - 16, DIAL.z - 16, DIAL.z + 16, PFX, 3, "lo", 0.5)];
      const xf = PFX + 3;
      const ring = (r) => k.sideRing([xf, DIAL.y, DIAL.z], r, "x", P, 48);
      o.push(`<path class="pw-dial" d="${ring(DIAL.r)}"/>`);
      o.push(L(ring(DIAL.r) + ring(DIAL.r + 1.6), { tone: "mid" }));
      const ticks = [];
      const major = [];
      for (let i = 0; i <= 16; i++) {
        const a = Math.PI * (1.25 - (1.5 * i) / 16);
        const r0 = DIAL.r - (i % 2 === 0 ? 3.2 : 1.8);
        (i % 2 === 0 ? major : ticks).push(k.pathOf([onFace(xf, DIAL.y - Math.cos(a) * r0, DIAL.z + Math.sin(a) * r0), onFace(xf, DIAL.y - Math.cos(a) * DIAL.r, DIAL.z + Math.sin(a) * DIAL.r)]));
      }
      o.push(L(ticks.join(""), { tone: "lo" }), L(major.join(""), { tone: "mid" }));
      for (const v of [0, 2, 4, 6, 8]) {
        const a = Math.PI * (1.25 - (1.5 * v) / 8);
        const r = DIAL.r - 5.8;
        o.push(faceText(xf + 0.1, DIAL.y - Math.cos(a) * r, DIAL.z + Math.sin(a) * r - 0.9, String(v), 2.3, "lo"));
      }
      o.push(faceText(xf + 0.1, DIAL.y, DIAL.z + 5.2, "× In", 2.4, "mid"));
      o.push(`<path class="iso-line pw-needle" data-tone="lit" data-free="both" d=""/>`);
      o.push(D([onFace(xf, DIAL.y, DIAL.z)], { size: 0.9, tone: "hi" }));
      o.push(D([[DIAL.y + 13, DIAL.z + 13], [DIAL.y - 13, DIAL.z + 13], [DIAL.y + 13, DIAL.z - 13], [DIAL.y - 13, DIAL.z - 13]].map(([y, z]) => onFace(xf, y, z)), { size: 0.5 }));
      return { d: depth(xf, DIAL.y, DIAL.z), s: o.join("") };
    };
    // enregistreur de courant : écran dans le plan de la face, quadrillage, tracés
    const recorder = () => {
      const o = [box3(REC.y0 + 4, REC.y1 - 4, REC.z0 - 4, REC.z1 + 4, PFX, 3, "lo", 0.5)];
      const xf = PFX + 3.05;
      const corners = [[REC.y0, REC.z0], [REC.y1, REC.z0], [REC.y1, REC.z1], [REC.y0, REC.z1]].map(([y, z]) => onFace(xf, y, z));
      o.push(`<path class="pw-screen" d="${k.pathOf(corners, true)}"/>`);
      const grid = [];
      for (let s = 1; s < MODEL.window; s++) {
        const y = REC.y0 - ((REC.y0 - REC.y1) * s) / MODEL.window;
        grid.push(k.pathOf([onFace(xf, y, REC.z0), onFace(xf, y, REC.z1)]));
      }
      for (const v of [2, 4, 6]) {
        const z = REC.z0 + ((REC.z1 - REC.z0) * v) / 8;
        grid.push(k.pathOf([onFace(xf, REC.y0, z), onFace(xf, REC.y1, z)]));
      }
      o.push(L(grid.join(""), { tone: "faint" }));
      // marque de la temporisation (1 s)
      const y1s = REC.y0 - ((REC.y0 - REC.y1) * MODEL.delay) / MODEL.window;
      o.push(L(k.pathOf([onFace(xf, y1s, REC.z0), onFace(xf, y1s, REC.z0 + 3)]), { tone: "hi" }));
      o.push(L(k.pathOf(corners, true), { tone: "mid" }));
      for (const v of [0, 2, 4, 6, 8]) o.push(faceText(xf, REC.y0 + 1.2, REC.z0 + ((REC.z1 - REC.z0) * v) / 8 - 0.8, String(v), 2, "lo", "", "end"));
      for (let s = 0; s <= MODEL.window; s++) o.push(faceText(xf, REC.y0 - ((REC.y0 - REC.y1) * s) / MODEL.window, REC.z0 - 3, `${s}${s === MODEL.window ? " s" : ""}`, 2, "lo"));
      o.push(faceText(xf, REC.y0 - 2, REC.z1 - 3.6, T.recTitle, 2.4, "mid", "", "start"));
      o.push(`<path class="iso-line pw-trace-old" data-tone="lo" data-free="both" d=""/>`);
      o.push(`<path class="iso-line pw-trace" data-tone="lit" data-free="both" d=""/>`);
      o.push(D([[REC.y0 + 2, REC.z1 + 2], [REC.y1 - 2, REC.z1 + 2], [REC.y0 + 2, REC.z0 - 2], [REC.y1 - 2, REC.z0 - 2]].map(([y, z]) => onFace(PFX + 3, y, z)), { size: 0.45 }));
      return { d: depth(xf, REC.y0, REC.z0), s: o.join("") };
    };
    // étiquette du coffret (lignes de texte gravées)
    const label = () => {
      const xf = PFX + 0.6;
      const o = [box3(-160, -196, 20, 40, PFX, 0.6, "mid", 0.1)];
      o.push(L([24, 29, 34].map((z, i) => k.pathOf([onFace(xf, -164, z), onFace(xf, i === 2 ? -184 : -192, z)])).join(""), { tone: "lo", free: true }));
      o.push(D([[-162, 38], [-194, 38], [-162, 22], [-194, 22]].map(([y, z]) => onFace(xf, y, z)), { size: 0.4 }));
      return { d: depth(xf, -178, 30), s: o.join("") };
    };
    parts.push(contactor(K1, "K1"), contactor(K2, "K2"), timer(KT), relay(F1, "F1"), relay(F2, "F2"), buttons(), ammeter(), recorder(), label());
    return parts.sort((a, b) => a.d - b.d).map((p) => p.s).join("");
  };

  // ---- compresseur : pattes, carcasse à ailettes, flasques, arbre, accouplement
  function motor() {
    const o = [];
    for (const y of [Y0 + 10, Y0 + LEN - 20]) {
      o.push(S(k.slabOf({ x: -30, y, w: 60, d: 10, r: 1 }, 3, CZ - R + 6 - 3, P, 2, 0.5), { tone: "lo" }));
      for (const x of [-25, 25]) o.push(L(k.ring(x, y + 5, 2.2, CZ - R + 6, P, 16), { tone: "mid" }) + D([at([x, y + 5, CZ - R + 6])], { size: 0.55 }));
    }
    o.push(S(G.solidOf([[-22, 0], [-22, 22, 1], [-18, 24], [0, 24]], F, P), { tone: "mid", inner: L(G.arcOf(F, -12, 24, P), { tone: "faint" }) }));
    const body = G.solidOf([[0, 0], [0, 22], [5, R], [LEN - 5, R], [LEN, 22], [LEN, 0]], F, P);
    o.push(S(body, { tone: "mid", inner: `<g class="pw-hot">${k.fadedSvg(G.ribsOf(F, 6, LEN - 6, R + 0.2, 36, P, { fade: [0.06, 0.4], seams: true }), { tone: "lo" })}</g>` }));
    o.push(S(G.solidOf([[LEN, 0], [LEN, 14], [LEN + 6, 11], [LEN + 6, 0]], F, P), { tone: "lo" }));
    o.push(D(G.dotsOf(F, LEN, 18, 4, P, { all: true, phase: Math.PI / 4 }), { size: 0.6, tone: "mid" }));
    o.push(S(G.solidOf([[LEN + 6, 0], [LEN + 6, 5], [LEN + 24, 5], [LEN + 24, 0]], F, P), { tone: "hi" }));
    o.push(S(G.disc(LEN + 24, LEN + 30, 12, F, P, { steps: 48, bevel: 0.4 }), { tone: "mid" }));
    o.push(D(G.dotsOf(F, LEN + 30, 8, 6, P, { all: true }), { size: 0.5, tone: "lo" }));
    o.push(`<path class="iso-line pw-mark" data-tone="lit" data-free="both" d=""/>`);
    return o.join("");
  }

  // ---- câbles du coffret au bornier : K1 → presse-étoupe arrière, K2 → presse-étoupe avant
  const glandAt = (x) => [x, BOX.y - 4, BOX_Z + 5];
  function cables() {
    const o = [];
    [[-62, -10, "1"], [-50, 10, "2"]].forEach(([cx, gx, w]) => {
      const a = [cx, CAB.y + CAB.d + 4, 70];
      const b = glandAt(gx);
      const pts = [];
      for (let i = 0; i <= 28; i++) {
        const t = i / 28;
        pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t + 18 * Math.sin(Math.PI * t)]);
      }
      o.push(`<g class="pw-wire pw-cable" data-w="${w}">${L(pathD(pts), { tone: "mid" })}<circle class="iso-wire-end" cx="${at(a)[0].toFixed(1)}" cy="${at(a)[1].toFixed(1)}" r="1.6"/></g>`);
    });
    return o.join("");
  }

  // ---- boîte à bornes ouverte : plaque signalétique, presse-étoupes, bornier 1 à 6
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
    o.push(`<path class="pw-dial" d="${quad}"/>`, L(quad, { tone: "mid" }));
    o.push(faceText(fx, pl.y1 - 2.8, pl.z1 - 2.8, T.plate, 3.2, "hi", "", "start"));
    o.push(faceText(fx, pl.y1 - 2.8, pl.z0 + 2.4, T.plate2, 2.2, "mid", "", "start"));
    o.push(S(k.slabOf(BOARD, BOARD_Z, 3, P, 2, 0.4), { tone: "lo" }));
    COLS.forEach((y, i) => {
      o.push(k.faceTextSvg(k.topMatrix([ROW1 - 8.8, y], ZB, P, "y"), String(i + 1), { size: 3.4, tone: "hi", anchor: "middle" }));
      o.push(k.faceTextSvg(k.topMatrix([ROW2 + 8.4, y], ZB, P, "y"), String(i + 4), { size: 3.4, tone: "hi", anchor: "middle" }));
    });
    return o.join("");
  }
  // conducteurs internes : presse-étoupe 1 → bornes 1-2-3, presse-étoupe 2 → bornes 4-5-6
  function leads() {
    const o = [];
    for (const [row, gx, w] of [[ROW1, -10, "1"], [ROW2, 10, "2"]]) {
      const g = COLS.map((y, i) => {
        const x0 = gx + (i - 1) * 2.6;
        const xr = row + (row < 0 ? -4.4 : 4.4);
        return L(pathD([[x0, BOARD.y + 0.6, ZB + 0.6], [x0, BOARD.y + 3 + i * 2.2, ZB + 0.6], [xr, BOARD.y + 3 + i * 2.2, ZB + 0.6], [xr, y, ZB + 0.6], [row + (row < 0 ? -2 : 2), y, ZB + 0.6]]), { tone: "mid" });
      });
      o.push(`<g class="pw-wire" data-w="${w}">${g.join("")}</g>`);
    }
    return o.join("");
  }
  const terminals = () => {
    const o = [];
    for (const x of [ROW1, ROW2]) for (const y of COLS) o.push(S(k.cylinder(x, y, 2, ZB, 1.8, P, 16), { tone: "mid", crease: "none" }));
    for (const x of [ROW1, ROW2]) for (const y of COLS) o.push(S(k.cylinder(x, y, 3.2, ZB + 1.6, 2.4, P, 6, 0.3), { tone: "hi" }) + L(k.ring(x, y, 1.3, ZB + 4, P, 12), { tone: "lo" }));
    return o.join("");
  };

  const body = [plate(), cabinet(), devices(), motor(), cables(), box(), leads(), terminals()];
  const svg = k.figureSvg({ width: WIDTH, height: HEIGHT, label: T.svgLabel, body });
  const config = {
    P,
    F,
    markS: LEN + 30,
    dial: { x: PFX + 3.2, ...DIAL, max: 8 },
    rec: { x: PFX + 3.2, ...REC, max: 8 },
    plungerMove: -2,
    flagMove: 2.4,
    btnMove: -1,
    model: MODEL,
  };
  return { svg, config };
}

const CSS = `
.pw-dial,.pw-screen{fill:var(--anatomy-top)}
.pw-needle,.pw-trace{stroke-width:1.1}
.pw-trace-old{stroke-width:.8}
.pw-hot .iso-line{transition:stroke .6s}
.iso{--pw-hot:#ff6a3a}.iso[data-theme="light"]{--pw-hot:#d9481a}
[data-heat="1"] .pw-hot .iso-line{stroke:var(--pw-hot)}
.pw-wire[data-live] .iso-line{stroke:var(--anatomy-lit);stroke-dasharray:2 4;animation:iso-flow 1600ms linear infinite}
.pw-wire[data-live="rev"] .iso-line{animation-direction:reverse}
.pw-cable .iso-line{stroke-width:2.4}
.iso-stage{touch-action:manipulation}
.iso-plate-corner[data-corner="hint"]{top:20px;bottom:auto;right:0;white-space:normal;line-height:1.35}
.iso-plate-corner[data-corner="readout"]{left:0;white-space:normal;text-align:right;line-height:1.4}
.iso-plate{padding-top:80px}
.pw-controls{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}
.pw-controls button{font:12px/1.2 var(--anatomy-mono);letter-spacing:.04em;color:var(--anatomy-strong);background:var(--anatomy-card);border:1px solid var(--anatomy-mid);border-radius:999px;padding:10px 14px;min-height:44px;cursor:pointer}
.pw-controls button[aria-pressed="true"]{border-color:var(--anatomy-lit);box-shadow:inset 0 0 0 1px var(--anatomy-lit)}
.pw-controls button:focus-visible{outline:2px solid var(--anatomy-hi);outline-offset:2px}
.pw-controls button:disabled{opacity:.45;cursor:default}
.pw-controls .pw-go{background:var(--anatomy-strong);color:var(--anatomy-card);border-color:var(--anatomy-strong)}
.pw-feedback{margin:12px 0 0;min-height:3em;color:var(--anatomy-text);font-size:13px;line-height:1.55}
@media (prefers-reduced-motion:reduce){.pw-wire[data-live] .iso-line{animation:none}}
@media (max-width:560px){.iso-plate{padding:76px 12px 64px}.pw-controls button{flex:1 1 40%}}
`;

const LIVE = `
const still = matchMedia("(prefers-reduced-motion: reduce)");
const C = FIG, T = TX, P = C.P, M = C.model;
const scope = document.querySelector('.live-figure[data-figure="fractionne"]') || document;
const root = scope.querySelector(".iso-plate");
const stage = root.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const readout = root.querySelector("[data-readout]");
const feedback = scope.querySelector(".pw-feedback");
const buttons = Object.fromEntries([...scope.querySelectorAll(".pw-controls button")].map((b) => [b.dataset.act, b]));
const needle = svg.querySelector(".pw-needle");
const trace = svg.querySelector(".pw-trace");
const traceOld = svg.querySelector(".pw-trace-old");
const mark = svg.querySelector(".pw-mark");
const led = svg.querySelector(".pw-led .iso-solid");
const plunger = Object.fromEntries([...svg.querySelectorAll(".pw-plunger")].map((g) => [g.dataset.k, g]));
const flags = Object.fromEntries([...svg.querySelectorAll(".pw-flag")].map((g) => [g.dataset.f, g]));
const btns = Object.fromEntries([...svg.querySelectorAll(".pw-btn")].map((g) => [g.dataset.b, g]));
const wires = [...svg.querySelectorAll(".pw-wire")];
const fmt = (v, d = 1) => v.toFixed(d).replace(".", T.dec);
// état du modèle (temps réel du moteur, la figure le montre ralenti M.slow fois)
let mode = "pw", running = false, t = 0, w = 0, current = 0, shown = 0, k1 = 0, k2 = 0, k1At = 0, k2At = 0, tripped = null, flagAt = { F1: 0, F2: 0 };
let samples = [], old = "", peaks = [], angle = 0, press = { S1: 0, S0: 0 }, frame = 0, last = 0, visible = false, done = false;
const full = (x) => 1 + (M.ilr - 1) * (1 - x * x);
function step(dt) {
  if (running) {
    t += dt;
    const k2Due = mode === "dol" || ((mode === "pw" || mode === "k2rev") && t >= M.delay);
    k1 = 1; k2 = k2Due ? 1 : 0;
    if (M.trip[mode] && t >= M.trip[mode]) { running = false; tripped = mode === "k2fail" ? "F1" : "F2"; k1 = 0; k2 = 0; finish(); }
  } else { k1 = 0; k2 = 0; }
  if (k1 && k2 && mode === "k2rev") { w += (-2.2 * w) * dt; current = M.ilr * 1.08; }
  else if (k1 && k2) { w += M.rate * (1.04 - w) * dt; current = full(Math.min(w, 1)); }
  else if (k1) { w += M.rate * M.halfRate * (M.halfTop - w) * dt; current = M.half * full(w); }
  else { w += -4 * w * dt; current = 0; } // compresseur : la contre-pression l'arrête en moins d'une seconde
  if (w < 0) w = 0;
}
function finish() {
  if (done) return; done = true;
  const p = peaks.map((v) => fmt(v));
  if (mode === "pw") feedback.textContent = T.feedback.pw(T.peaks(p[0], p[1]));
  else if (mode === "dol") feedback.textContent = T.feedback.dol(T.peaks(p[0]));
  else feedback.textContent = T.feedback[mode];
  sync();
}
function record() {
  if (t > M.window || (!running && !tripped)) return;
  samples.push([t, current]);
  // pics : maximum local avant une baisse nette, un par fermeture de contacteur
  const n = peaks.length;
  const phaseIdx = mode === "pw" && t >= M.delay ? 1 : 0;
  if (n <= phaseIdx) peaks.push(current); else if (current > peaks[phaseIdx]) peaks[phaseIdx] = current;
}
function recPath(list) {
  const R = C.rec;
  return list.length < 2 ? "" : pathOf(list.map(([s, i]) => iso([R.x, R.y0 - (R.y0 - R.y1) * Math.min(s, M.window) / M.window, R.z0 + (R.z1 - R.z0) * Math.min(i, R.max) / R.max], P)));
}
function start() {
  if (running) return;
  if (samples.length > 1) old = recPath(samples);
  running = true; done = false; t = 0; tripped = null; samples = [[0, 0]]; peaks = []; press.S1 = 1;
  feedback.textContent = T.feedback.idle;
  svg.removeAttribute("data-heat");
  sync(); run();
}
function stop() {
  press.S0 = 1;
  if (running) { running = false; if (!done) { done = true; feedback.textContent = T.feedback.stopped; } }
  sync(); run();
}
function setMode(m) {
  if (running) return;
  mode = m; tripped = null; svg.removeAttribute("data-heat");
  feedback.textContent = T.feedback.idle;
  sync(); run();
}
function sync() {
  for (const m of ["pw", "dol", "k2fail", "k2rev"]) { buttons[m].setAttribute("aria-pressed", mode === m ? "true" : "false"); buttons[m].disabled = running; }
  buttons.start.disabled = running || w > 0.02;
}
function readText() {
  if (tripped) return T.readRun({ step: T.steps.trip + " " + tripped, t: fmt(Math.min(t, 99)), i: fmt(shown), extra: "" });
  if (!running) return T.readOff(T.modes[mode]);
  const step = mode === "dol" ? T.steps.dol : mode === "k2rev" && k2 ? T.steps.rev : k2 ? T.steps.t2 : T.steps.t1;
  const extra = k1 && k2 && mode !== "k2rev" ? T.perWinding(fmt(shown / 2), fmt(shown / 2)) : k1 && !k2 ? T.perWinding(fmt(shown), "0") : "";
  return T.readRun({ step, t: fmt(t), i: fmt(shown), extra });
}
function draw() {
  const F = C.F, s = C.markS;
  const p = (r) => [F.o[0] + r * Math.cos(angle), F.o[1] + s, F.o[2] + r * Math.sin(angle)];
  mark.setAttribute("d", pathOf([iso(p(2.5), P), iso(p(11), P)]));
  const a = Math.PI * (1.25 - 1.5 * Math.min(shown, C.dial.max) / C.dial.max);
  const dp = (r) => iso([C.dial.x, C.dial.y - Math.cos(a) * r, C.dial.z + Math.sin(a) * r], P);
  needle.setAttribute("d", pathOf([dp(-2), dp(C.dial.r - 2)]));
  trace.setAttribute("d", recPath(samples));
  traceOld.setAttribute("d", old);
  plunger.K1.setAttribute("transform", translateAlong(P, [C.plungerMove * k1At, 0, 0]));
  plunger.K2.setAttribute("transform", translateAlong(P, [C.plungerMove * k2At, 0, 0]));
  for (const [kname, v] of [["K1", k1At], ["K2", k2At]]) { const s = plunger[kname].querySelector(".iso-solid"); if (v > 0.5) s.setAttribute("data-lit", ""); else s.removeAttribute("data-lit"); }
  for (const f of ["F1", "F2"]) flags[f].setAttribute("transform", translateAlong(P, [C.flagMove * flagAt[f], 0, 0]));
  for (const b of ["S1", "S0"]) btns[b].setAttribute("transform", translateAlong(P, [C.btnMove * press[b], 0, 0]));
  const timing = running && mode !== "dol" && t < M.delay;
  if (timing) led.setAttribute("data-lit", ""); else led.removeAttribute("data-lit");
  for (const g of wires) {
    const on = g.dataset.w === "1" ? k1 : k2;
    if (on) g.setAttribute("data-live", g.dataset.w === "2" && mode === "k2rev" ? "rev" : "1"); else g.removeAttribute("data-live");
  }
  readout.textContent = readText();
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  const sim = calm ? 0.25 : dt / M.slow;
  // pas fins : le courant varie vite à la fermeture des contacteurs
  const n = calm ? 50 : 4;
  for (let i = 0; i < n; i++) { step(sim / n); if (!calm) record(); }
  if (calm) record();
  const ease = (v, to, tau) => (calm ? to : v + (to - v) * (1 - Math.exp(-dt / tau)));
  shown = ease(shown, current, 0.12);
  k1At = ease(k1At, k1, 0.06); k2At = ease(k2At, k2, 0.06);
  for (const f of ["F1", "F2"]) flagAt[f] = ease(flagAt[f], tripped === f ? 1 : 0, 0.08);
  for (const b of ["S1", "S0"]) press[b] = ease(press[b], 0, 0.12);
  angle += w * dt * 2 * Math.PI * 0.9;
  if ((mode === "k2fail" || mode === "k2rev") && running && t > M.delay * 1.2) svg.setAttribute("data-heat", "1");
  if (running && t > M.window && (mode === "pw" || mode === "dol")) finish();
  if (!running && buttons.start.disabled && w <= 0.02) sync();
  draw();
  const settled = !running && w < 1e-3 && Math.abs(shown) < 1e-3 && k1At < 1e-3 && k2At < 1e-3 && press.S1 < 1e-3 && press.S0 < 1e-3 && Math.abs(flagAt.F1 - (tripped === "F1" ? 1 : 0)) < 1e-3 && Math.abs(flagAt.F2 - (tripped === "F2" ? 1 : 0)) < 1e-3;
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
function run() { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } }
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
for (const m of ["pw", "dol", "k2fail", "k2rev"]) buttons[m].addEventListener("click", () => setMode(m));
buttons.start.addEventListener("click", start);
buttons.stop.addEventListener("click", stop);
window.__pw = { start, stop, setMode, state: () => ({ mode, running, t, w, current, peaks: [...peaks], tripped }) };
feedback.textContent = T.feedback.idle;
sync();
draw();
`;

const written = [];
const site = { fragments: {}, scripts: {} };
for (const lang of ["fr", "en"]) {
  const T = TEXT[lang];
  const { svg, config } = buildFigure(lang);
  const modeButtons = Object.entries(T.modes).map(([id, label]) => `<button type="button" data-act="${id}" aria-pressed="${id === "pw"}">${label}</button>`).join("");
  const controls = `<div class="pw-controls" role="group" aria-label="${lang === "fr" ? "Cas de démarrage" : "Starting case"}">${modeButtons}</div><div class="pw-controls" role="group" aria-label="${lang === "fr" ? "Commande" : "Control"}"><button type="button" class="pw-go" data-act="start">${T.start}</button><button type="button" data-act="stop">${T.stop}</button></div><p class="pw-feedback" aria-live="polite"></p>`;
  const plate = k.plateHtml({ fig: "Fig 7", title: T.title, hint: T.hint, readout: "", keys: T.keys, caption: T.caption, body: `<div class="iso-stage" role="img" aria-label="${T.stageLabel}">${svg}</div>${controls}` });
  const TX = `{dec:${JSON.stringify(lang === "fr" ? "," : ".")},modes:${JSON.stringify(T.modes)},steps:${JSON.stringify(T.steps)},readOff:${T.readOff},readRun:${T.readRun},perWinding:${T.perWinding},peaks:${T.peaks},feedback:{idle:${JSON.stringify(T.feedback.idle)},pw:${T.feedback.pw},dol:${T.feedback.dol},k2fail:${JSON.stringify(T.feedback.k2fail)},k2rev:${JSON.stringify(T.feedback.k2rev)},stopped:${JSON.stringify(T.feedback.stopped)}}}`;
  const pageScript = `const FIG = ${JSON.stringify(config)};\nconst TX = ${TX};\n${LIVE}`;
  site.fragments[lang] = plate;
  site.scripts[lang] = pageScript;
  for (const theme of ["dark", "light"]) {
    const name = `fractionne.${lang}${theme === "light" ? "-light" : ""}.html`;
    writeFileSync(join(HERE, name), k.pageHtml({ title: T.pageTitle, theme, body: `<style>${CSS}</style>${plate}`, script: KIT_SOURCE + pageScript, width: 760 }).replace('<html lang="en">', `<html lang="${lang}">`));
    written.push(name);
  }
}
written.push(...publish("fractionne", { ...site, css: CSS }));
console.log("wrote", written.join(", "));
