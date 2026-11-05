// Figures interactives (skill anatomy) : les 4 relais à bobine et contacts, SPST, SPDT, DPST, DPDT.
// Partie 3, module 2 « Appareillages électriques industriels », section « Commande ».
// Usage : node figures/relais/build.mjs            (fr + en, sombre + clair, 4 types + page groupée)
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../_kit/iso-kit.mjs";
import { publish } from "../_kit/publish.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const KIT_SOURCE = readFileSync(join(HERE, "..", "_kit", "iso-kit.mjs"), "utf8").replace(/^export /gm, "");

// ---------------------------------------------------------------- modèle (une seule source pour le dessin, le mouvement et la lecture)
const MODEL = {
  coilVolts: 24, // tension de commande continue
  coilOhms: 1440, // résistance de bobine du relais d'exemple
  mainsVolts: 230, // circuit de puissance (voyants 230 V)
  travel: 4, // course de la palette = écart des contacts ouverts
  pullIn: 0.5, // fraction de course où la palette est « collée » (force magnétique > ressort)
};
const COIL_MA = (MODEL.coilVolts / MODEL.coilOhms) * 1000; // 16,7 mA

const TYPES = {
  spst: { poles: 1, throws: 1, name: "SPST" },
  spdt: { poles: 1, throws: 2, name: "SPDT" },
  dpst: { poles: 2, throws: 1, name: "DPST" },
  dpdt: { poles: 2, throws: 2, name: "DPDT" },
};

// ---------------------------------------------------------------- textes
const TEXT = {
  fr: {
    lang: "fr",
    hint: "Maintenir S1 appuyé",
    figTitle: (t) => `Relais ${t}`,
    pageTitle: "Relais à bobine et contacts : SPST, SPDT, DPST, DPDT",
    meaning: { spst: "Single Pole Single Throw", spdt: "Single Pole Double Throw", dpst: "Double Pole Single Throw", dpdt: "Double Pole Double Throw" },
    contacts: {
      spst: "1 contact simple (à fermeture, 11-14)",
      spdt: "1 contact inverseur (11-12 repos, 11-14 travail)",
      dpst: "2 contacts simples commandés ensemble (11-14 et 21-24)",
      dpdt: "2 contacts inverseurs commandés ensemble (11-12/14 et 21-22/24)",
    },
    keys: [
      { mark: "lit", label: "Palette et lames mobiles : ce qui bouge quand la bobine est alimentée" },
      { mark: "raised", label: "Bobine A1-A2, culasse et contacts fixes" },
      { mark: "dashed", label: "Fil parcouru par un courant" },
    ],
    caption: {
      spst: `Relais SPST (Single Pole Single Throw) : un seul contact, ici à fermeture. Commande : l'alimentation ${MODEL.coilVolts} V ⎓ passe par le bouton S1 et arrive sur la bobine A1-A2 (${(MODEL.coilOhms / 1000).toLocaleString("fr")} kΩ, soit ${COIL_MA.toLocaleString("fr", { maximumFractionDigits: 1 })} mA). Bobine alimentée, le noyau attire la palette, la lame mobile descend et ferme 11-14 : la phase L arrive au voyant H1, qui s'allume. S1 relâché, le ressort de rappel remonte la palette et H1 s'éteint. Les fils passent par la goulotte, où ils se croisent sans être vus.`,
      spdt: `Relais SPDT (Single Pole Double Throw) : un contact inverseur. Au repos, la lame mobile (commun 11) touche le contact de repos 12 et le voyant H2 est allumé. Bobine A1-A2 alimentée en ${MODEL.coilVolts} V ⎓ par S1, la palette descend : la lame quitte 12 avant de toucher 14 (coupure avant fermeture), H2 s'éteint et H1 s'allume. Un seul commun commute la phase L vers l'un ou l'autre voyant.`,
      dpst: `Relais DPST (Double Pole Single Throw) : deux contacts à fermeture, 11-14 et 21-24, portés par la même palette. La phase L arrive sur 11 et le neutre N sur 21 : bobine alimentée par S1, les deux lames descendent ensemble et le voyant H1 reçoit L par 14 et N par 24. Relais au repos, le voyant est séparé des deux conducteurs, ce qui est plus sûr qu'une coupure de la seule phase.`,
      dpdt: `Relais DPDT (Double Pole Double Throw) : deux contacts inverseurs commandés ensemble. Au repos, les communs 11 (phase L) et 21 (neutre N) touchent 12 et 22 : le voyant H2 est alimenté. Bobine A1-A2 alimentée par S1, les deux lames basculent en même temps sur 14 et 24 : H2 s'éteint et H1 s'allume. C'est le relais des inversions (choix entre deux circuits, sens de marche).`,
    },
    stageLabel: (t) => `Relais ${t} câblé sur une platine d'essai : maintenez la figure appuyée, ou la touche Espace, pour fermer S1 et alimenter la bobine.`,
    svgLabel: (t, desc) => `Platine d'essai : alimentation ${MODEL.coilVolts} V continu, bouton poussoir S1, relais ${t} ouvert sur le dessus (${desc}), goulotte de câblage, bornier L et N et voyants. La bobine attire la palette, qui déplace les lames de contact.`,
    groupIntro: "Les 4 types de relais à bobine et contacts. Maintenez S1 appuyé sur chaque platine pour alimenter la bobine et voir les contacts changer d'état.",
  },
  en: {
    lang: "en",
    hint: "Hold S1 down",
    figTitle: (t) => `${t} relay`,
    pageTitle: "Coil-and-contact relays: SPST, SPDT, DPST, DPDT",
    meaning: { spst: "Single Pole Single Throw", spdt: "Single Pole Double Throw", dpst: "Double Pole Single Throw", dpdt: "Double Pole Double Throw" },
    contacts: {
      spst: "1 simple contact (make, 11-14)",
      spdt: "1 changeover contact (11-12 rest, 11-14 operate)",
      dpst: "2 simple contacts switched together (11-14 and 21-24)",
      dpdt: "2 changeover contacts switched together (11-12/14 and 21-22/24)",
    },
    keys: [
      { mark: "lit", label: "Armature and moving blades: what moves when the coil is energised" },
      { mark: "raised", label: "Coil A1-A2, yoke and fixed contacts" },
      { mark: "dashed", label: "Wire carrying a current" },
    ],
    caption: {
      spst: `SPST relay (Single Pole Single Throw): a single contact, here a make (normally open) contact. Control: the ${MODEL.coilVolts} V DC supply goes through push button S1 to coil A1-A2 (${(MODEL.coilOhms / 1000).toLocaleString("en")} kΩ, so ${COIL_MA.toFixed(1)} mA). With the coil energised, the core pulls the armature down, the moving blade closes 11-14 and line L reaches pilot light H1, which comes on. Release S1 and the return spring lifts the armature: H1 goes out. The wires run through the trunking, where they cross out of sight.`,
      spdt: `SPDT relay (Single Pole Double Throw): one changeover contact. At rest the moving blade (common 11) rests on the break contact 12 and pilot light H2 is on. With coil A1-A2 fed ${MODEL.coilVolts} V DC through S1, the armature moves down: the blade leaves 12 before it touches 14 (break before make), H2 goes out and H1 comes on. One common switches line L to one light or the other.`,
      dpst: `DPST relay (Double Pole Single Throw): two make contacts, 11-14 and 21-24, carried by the same armature. Line L arrives on 11 and neutral N on 21: with the coil energised through S1, both blades move down together and pilot light H1 gets L through 14 and N through 24. At rest the light is cut off from both conductors, which is safer than breaking the line alone.`,
      dpdt: `DPDT relay (Double Pole Double Throw): two changeover contacts switched together. At rest the commons 11 (line L) and 21 (neutral N) rest on 12 and 22: pilot light H2 is fed. With coil A1-A2 energised through S1, both blades change over together to 14 and 24: H2 goes out and H1 comes on. This is the relay for changeovers (choosing between two circuits, reversing).`,
    },
    stageLabel: (t) => `${t} relay wired on a training board: press and hold the figure, or hold Space, to close S1 and energise the coil.`,
    svgLabel: (t, desc) => `Training board: ${MODEL.coilVolts} V DC supply, push button S1, open-top ${t} relay (${desc}), wiring trunking, L and N terminal block and pilot lights. The coil pulls the armature, which moves the contact blades.`,
    groupIntro: "The 4 types of coil-and-contact relay. Hold S1 down on each board to energise the coil and watch the contacts change over.",
  },
};

// ---------------------------------------------------------------- géométrie partagée (unités monde arbitraires, relais dessiné à l'échelle RS)
// Caméra : azimut 40°, l'observateur regarde depuis +x +y. Les contacts sont donc placés du côté −x du relais,
// devant leurs piliers, pour que les lames restent visibles ; puissance à gauche, commande à droite.
const AZ = Number(process.env.AZ ?? 28);
const WIDTH = 680;
const HEIGHT = 440;
const RS = 1.35; // échelle du relais : il est dessiné plus grand que les périphériques, avec la même caméra
const PLATE = { x: -184, y: -68, w: 346, d: 130, r: 8 };
const PLATE_H = 10;
const FOOT_H = 5;

// commande : alimentation 24 V ⎓ (arrière droite) et bouton S1 (avant droite)
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

// relais (socle sur rail DIN)
const BASE = { x: -68, y: -36, w: 134, d: 72, r: 3 };
const BASE_H = 8;
const A1 = [59, 18];
const A2 = [59, -18];
const COIL = [20, 0];
const COIL_R = 12;
const FLANGE_R = 14;
const YOKE_FOOT = { x: 4, y: -22, w: 32, d: 36, r: 1 };
const YOKE = { x: 6, y: -22, w: 28, d: 6, r: 0.8 };
const POLE_TOP = 44;
const ARM_Z = 48; // dessous de la palette au repos
const ARM_T = 3;
const ARM = { x: -8, y: -22, w: 44, d: 34, r: 1.5 };
const ROD = [-3, 0];
const ROD_TOP = 57;
const CARRIER = (halfW) => ({ x: -17, y: -halfW, w: 9, d: halfW * 2, r: 1 });
const BLADE_X0 = -40; // bout des lames mobiles
const BLADE_X1 = -17; // racine (dans le porte-contacts)
const RIVET_X = -35;
const BLADE_Z = 49; // dessous de la lame mobile
const BLADE_T = 1.2;
const RIVET_T = 1.2;
const PILLAR = { x0: -54, w: 8 };
const STUD_X = -24;
const TERM_X = -60;
const DUCT = { x: -118, y: -60, w: 12, d: 114, r: 1 };
const DUCT_H = 14;

// puissance : bornier L N N (arrière gauche) et voyants H1 H2 (gauche)
const BORNIER = { x: -174, y: -62, w: 42, d: 12, r: 1.5 };
const BORNIER_H = 10;
const B_Y = -56;
const B_L = -140;
const B_N = -152;
const B_N2 = -164;
const LAMP_BASES = { H1: { x: -168, y: -14, w: 34, d: 14, r: 2 }, H2: { x: -168, y: 22, w: 34, d: 14, r: 2 } };
const LAMP_TERMS = [-139, -161]; // borne a (proche de la goulotte), borne b
const LAMP_H = 5;

const ZB = BLADE_Z;
const NO_TOP = ZB - RIVET_T - MODEL.travel; // haut du rivet fixe de travail (écart = course)
const NC_BOTTOM = ZB + BLADE_T + RIVET_T; // bas du rivet fixe de repos (touché au repos)

function polesOf(type) {
  return TYPES[type].poles === 1 ? [{ n: 1, y: 0 }] : [{ n: 1, y: -13 }, { n: 2, y: 13 }];
}

// ---------------------------------------------------------------- construction d'une figure
function buildFigure(type, lang) {
  const T = TEXT[lang];
  const spec = TYPES[type];
  const poles = polesOf(type);
  const changeover = spec.throws === 2;
  const halfW = spec.poles === 1 ? 8 : 21;

  const wr = ([x, y, z = 0]) => [x * RS, y * RS, z * RS]; // repère du relais → monde
  const P = k.fitProjection([...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), wr([PILLAR.x0, -20, 60]), wr([ROD[0], 0, ROD_TOP + 2]), [PSU.x, PSU.y, PSU_H]], WIDTH, HEIGHT, { pad: 14, azimuth: AZ });
  const PR = { ...P, scale: P.scale * RS }; // même origine : iso(p, PR) = iso(RS·p, P)
  const tools = (proj) => {
    const at = (p) => k.iso(p, proj);
    const L = (d, style) => k.lineSvg(d, style);
    const D = (pts, style) => k.dotsSvg(pts, style);
    return {
      at,
      L,
      D,
      S: (paths, style) => k.solidSvg(paths, style),
      depth: (x, y, z = 0) => k.depthOf([x, y, z], proj),
      text: (x, y, z, s, size = 3.2, tone = "mid") => k.faceTextSvg(k.topMatrix([x, y], z, proj, "x"), s, { size, tone }),
      screw: (x, y, z, r = 2) => L(k.ring(x, y, r, z, proj, 16), { tone: "mid" }) + D([at([x, y, z])], { size: 0.55 }) + L(k.lineOnTop([x - r * 0.55, y - r * 0.55], [x + r * 0.55, y + r * 0.55], z, proj), { tone: "lo" }),
      pathD: (pts) => k.pathOf(pts.map(at)),
    };
  };
  const W = tools(P);
  const R = tools(PR);
  const { at, S, L, D, depth, text, screw, pathD } = W;

  // ---- bornes de contacts : 12 (repos) derrière, 11 (commun), 14 (travail) devant
  const relayTerms = {};
  for (const pole of poles) {
    relayTerms[`${pole.n}1`] = pole.y;
    relayTerms[`${pole.n}4`] = pole.y + 7;
    if (changeover) relayTerms[`${pole.n}2`] = pole.y - 7;
  }
  const lamps = changeover ? ["H1", "H2"] : ["H1"];
  // sorties de la goulotte côté puissance (face −x, cachée) : fente, borne d'arrivée, bord d'approche
  const out = {
    L: { slot: -42, to: [B_L, B_Y], z: BORNIER_H, edgeY: BORNIER.y + BORNIER.d + 1.5 },
    N: { slot: -36, to: [B_N, B_Y], z: BORNIER_H, edgeY: BORNIER.y + BORNIER.d + 1.5 },
    N2: { slot: -30, to: [B_N2, B_Y], z: BORNIER_H, edgeY: BORNIER.y + BORNIER.d + 1.5 },
    H1a: { slot: -18, to: [LAMP_TERMS[0], LAMP_BASES.H1.y + 3], z: LAMP_H, edgeY: LAMP_BASES.H1.y - 1.5, hidden: true, owner: "H1" },
    H1b: { slot: -24, to: [LAMP_TERMS[1], LAMP_BASES.H1.y + 3], z: LAMP_H, edgeY: LAMP_BASES.H1.y - 1.5, hidden: true, owner: "H1" },
    H2a: { slot: 12, to: [LAMP_TERMS[0], LAMP_BASES.H2.y + 3], z: LAMP_H, edgeY: LAMP_BASES.H2.y - 1.5, hidden: true, owner: "H2" },
    H2b: { slot: 6, to: [LAMP_TERMS[1], LAMP_BASES.H2.y + 3], z: LAMP_H, edgeY: LAMP_BASES.H2.y - 1.5, hidden: true, owner: "H2" },
  };
  const NETS = {
    spst: { links: ["11", "14"], outs: ["L", "N", "H1a", "H1b"] },
    spdt: { links: ["11", "14", "12"], outs: ["L", "N", "N2", "H1a", "H1b", "H2a", "H2b"] },
    dpst: { links: ["11", "21", "14", "24"], outs: ["L", "N", "H1a", "H1b"] },
    dpdt: { links: ["11", "21", "14", "24", "12", "22"], outs: ["L", "N", "H1a", "H1b", "H2a", "H2b"] },
  }[type];

  // ---- fils : chaque fil est coupé en morceaux peints à leur place (sol, dessus d'un objet, face cachée)
  const wirePieces = [];
  const piece = (id, group, layer, pts, dotAt) => wirePieces.push({ id, group, layer, d: pathD(pts), dot: dotAt ? at(dotAt) : null });

  // commande (côté droit) : PSU + → S1 → A1 ; A2 → PSU −. Gradins de bornes sur les faces visibles (+y, +x).
  {
    const g = "ctl";
    const pe = LEDGE.y + LEDGE.d + 1.2; // bord avant du gradin de l'alimentation
    const se = S1_LEDGE.x + S1_LEDGE.w + 1.2; // bord +x du gradin de S1
    const be = (BASE.x + BASE.w) * RS + 1.2; // bord +x du socle du relais
    const A1w = wr(A1).slice(0, 2);
    const A2w = wr(A2).slice(0, 2);
    const BH = BASE_H * RS;
    const down = (x, y, z) => [[x, y, z + 0.4], [x, y, 0.4]];
    piece("ctl-plus", g, "psu", [[...PSU_PLUS, LEDGE_H], ...down(PSU_PLUS[0], pe, LEDGE_H)], [...PSU_PLUS, LEDGE_H]);
    piece("ctl-plus", g, "floorRight", [[PSU_PLUS[0], pe, 0.4], [146, pe, 0.4], [146, S1_IN[1], 0.4], [se, S1_IN[1], 0.4]]);
    piece("ctl-plus", g, "s1", [...down(se, S1_IN[1], S1_LEDGE_H).reverse(), [...S1_IN, S1_LEDGE_H]], [...S1_IN, S1_LEDGE_H]);
    piece("ctl-a1", g, "s1", [[...S1_OUT, S1_LEDGE_H], ...down(se, S1_OUT[1], S1_LEDGE_H)], [...S1_OUT, S1_LEDGE_H]);
    piece("ctl-a1", g, "floorRight", [[se, S1_OUT[1], 0.4], [151, S1_OUT[1], 0.4], [151, 46, 0.4], [97, 46, 0.4], [97, A1w[1], 0.4], [be, A1w[1], 0.4]]);
    piece("ctl-a1", g, "relayFront", [...down(be, A1w[1], BH).reverse(), [...A1w, BH]], [...A1w, BH]);
    piece("ctl-a2", g, "relayFront", [[...A2w, BH], ...down(be, A2w[1], BH)], [...A2w, BH]);
    piece("ctl-a2", g, "floorRight", [[be, A2w[1], 0.4], [100, A2w[1], 0.4], [100, -6, 0.4], [PSU_MINUS[0], -6, 0.4], [PSU_MINUS[0], pe, 0.4]]);
    piece("ctl-a2", g, "psu", [...down(PSU_MINUS[0], pe, LEDGE_H).reverse(), [...PSU_MINUS, LEDGE_H]], [...PSU_MINUS, LEDGE_H]);
  }
  // puissance : bornes du relais → goulotte (face +x visible)
  const bx = BASE.x * RS - 1.2;
  const dx = DUCT.x + DUCT.w;
  const slotOf = (y) => Math.round((y - (DUCT.y + 6)) / 6) * 6 + DUCT.y + 6; // fente la plus proche
  for (const term of NETS.links) {
    const y = relayTerms[term] * RS;
    const tz = BASE_H * RS;
    const sy = slotOf(y);
    piece(`pw-${term}`, "power", "relayTop", [[TERM_X * RS, y, tz], [bx, y, tz + 0.4]], [TERM_X * RS, y, tz]);
    piece(`pw-${term}`, "power", "gap", [[bx, y, tz + 0.4], [bx, y, 0.4], [bx - 5, y, 0.4], [bx - 8, sy, 0.4], [dx + 2.5, sy, 0.4], [dx, sy, 1.6]]);
  }
  // goulotte (face −x cachée) → bornier et voyants
  const ox = DUCT.x;
  for (const name of NETS.outs) {
    const r = out[name];
    const floor = [[ox, r.slot, 3.2], [ox - 2.5, r.slot, 0.4], [r.to[0], r.slot, 0.4], [r.to[0], r.edgeY, 0.4]];
    const top = [r.to[0], r.edgeY, r.z + 0.4];
    const end = [r.to[0], r.to[1], r.z];
    if (r.hidden) {
      piece(`pw-${name}`, "power", "floorLeft", [...floor, top]);
      piece(`pw-${name}`, "power", r.owner, [top, end], end);
    } else {
      piece(`pw-${name}`, "power", "floorLeft", floor);
      piece(`pw-${name}`, "power", "bornier", [floor[3], top, end], end);
    }
  }
  const wiresOn = (layer) =>
    wirePieces
      .filter((w) => w.layer === layer)
      .map((w) => `<g class="rl-wire" data-wire="${w.id}">${L(w.d, { tone: "mid", className: "rl-cable" })}${w.dot ? `<circle class="iso-wire-end" cx="${w.dot[0].toFixed(1)}" cy="${w.dot[1].toFixed(1)}" r="1.1"/>` : ""}</g>`)
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
    // règle graduée le long du bord avant
    const strip = { x: -172, y: PLATE.y + PLATE.d - 13, w: 150, d: 6, r: 1 };
    o.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
    const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [1.8, 3.4], P);
    o.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
    // plaque signalétique
    const label = { x: 2, y: PLATE.y + PLATE.d - 15, w: 76, d: 10, r: 1.2 };
    o.push(S(k.slabOf(label, 0, 0.8, P, 3), { tone: "mid", crease: "none" }));
    o.push(L(k.planOutline(k.insetPlan(label, 1.4), 0.8, P, 3), { tone: "faint" }));
    o.push(text(label.x + 5, label.y + 6.6, 0.8, `K1 · ${spec.name} · ${MODEL.coilVolts} V ⎓ · ${MODEL.mainsVolts} V ~`, 3, "lo"));
    o.push(D([at([label.x + 2.6, label.y + 5, 0.8]), at([label.x + label.w - 2.6, label.y + 5, 0.8])], { size: 0.4 }));
    // rail DIN sous le relais
    const rail = { x: -96, y: -11, w: 192, d: 22, r: 0.6 };
    o.push(S(k.slabOf(rail, 0, 1.2, P, 2), { tone: "lo", crease: "none" }));
    o.push(L(k.planOutline({ x: rail.x + 4, y: -1.5, w: 10, d: 3, r: 1.5 }, 1.2, P, 3) + k.planOutline({ x: rail.x + rail.w - 14, y: -1.5, w: 10, d: 3, r: 1.5 }, 1.2, P, 3), { tone: "faint" }));
    return o.join("");
  }

  // ---- alimentation 24 V ⎓
  function psu() {
    const o = [];
    o.push(`<path class="iso-halo" d="${k.haloOf(PSU, 0, PSU_H, P)}"/>`);
    o.push(S(k.slabOf(LEDGE, 0, LEDGE_H, P, 3, 0.4), { tone: "lo" }));
    o.push(screw(...PSU_PLUS, LEDGE_H) + screw(...PSU_MINUS, LEDGE_H));
    o.push(text(PSU_PLUS[0] + 3.4, PSU_PLUS[1] + 1.2, LEDGE_H, "+", 3.4) + text(PSU_MINUS[0] + 3.4, PSU_MINUS[1] + 1.2, LEDGE_H, "−", 3.4));
    return o.join("");
  }
  function psuBox() {
    const o = [];
    o.push(S(k.slabOf(PSU, 0, PSU_H, P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(PSU, 6, P, 4), { tone: "faint" }) }));
    for (let i = 0; i < 6; i++) o.push(L(k.planOutline({ x: PSU.x + 14, y: PSU.y + 7 + i * 4.4, w: 18, d: 1.6, r: 0.8 }, PSU_H, P, 3), { tone: "lo" }));
    o.push(text(PSU.x + 6, PSU.y + PSU.d - 6, PSU_H, `${MODEL.coilVolts} V ⎓`, 4, "mid"));
    o.push(D(k.corners(PSU, 2.6).map(([x, y]) => at([x, y, PSU_H])), { size: 0.45 }));
    o.push(`<g class="rl-led">${S(k.cylinder(PSU.x + 31, PSU.y + PSU.d - 8, 1.8, PSU_H, 0.8, P, 16), { tone: "hi", lit: true })}</g>`);
    return o.join("");
  }

  // ---- bouton poussoir S1
  function s1Ledge() {
    return S(k.slabOf(S1_LEDGE, 0, S1_LEDGE_H, P, 3, 0.4), { tone: "lo" }) + screw(...S1_IN, S1_LEDGE_H, 1.8) + screw(...S1_OUT, S1_LEDGE_H, 1.8);
  }
  function s1Box() {
    const o = [];
    o.push(`<path class="iso-halo" d="${k.haloOf(S1_BOX, 0, S1_H, P)}"/>`);
    o.push(S(k.slabOf(S1_BOX, 0, S1_H, P, 4, 0.6), { tone: "mid", inner: L(k.sideSeam(S1_BOX, 3, P, 4), { tone: "faint" }) }));
    o.push(D(k.corners(S1_BOX, 2.4).map(([x, y]) => at([x, y, S1_H])), { size: 0.45 }));
    o.push(S(k.cylinder(S1_C[0], S1_C[1], 7.5, S1_H, 2, P, 40, 0.5), { tone: "mid" }));
    o.push(L(k.knurl(S1_C[0], S1_C[1], 7.5, S1_H + 0.3, S1_H + 1.7, 40, P, 0.3), { tone: "lo" }));
    o.push(text(S1_BOX.x + 2.6, S1_BOX.y + S1_BOX.d - 2.6, S1_H, "S1", 3.2, "lo"));
    return o.join("");
  }
  function s1Cap() {
    const z = S1_H + 2;
    return `<g data-move="s1">${S(k.cylinder(S1_C[0], S1_C[1], 5, z, 4, P, 36, 0.8), { tone: "hi", lit: true })}${L(k.ring(S1_C[0], S1_C[1], 3.4, z + 4, P, 28), { tone: "faint" })}</g>`;
  }

  // ---- relais : dessiné dans son propre repère avec la projection PR (échelle RS, même caméra)
  const { relayBase, pillars, noContacts, ncContacts, comStuds, coil, springD, rodLower, BRAID, braidD, armature } = (() => {
    const P = PR;
    const { at, S, L, D, depth, text, screw, pathD } = R;
  function relayBase() {
    const o = [];
    o.push(`<path class="iso-halo" d="${k.haloOf(BASE, 0, BASE_H, P)}"/>`);
    o.push(S(k.slabOf(BASE, 0, BASE_H, P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(BASE, 3, P, 4), { tone: "faint" }) }));
    // pistes internes visibles sur le dessus : goujon du commun → borne 11 / 21
    const tr = poles.map((pole) => k.onTop([[STUD_X - 1.8, pole.y], [-30, pole.y], [-30, pole.y + 3], [TERM_X + 4, pole.y + 3], [TERM_X + 1.6, pole.y + 1]], BASE_H, P)).join("");
    o.push(L(tr, { tone: "faint" }));
    // bornes de bobine A1 A2 et fils de bobine
    o.push(screw(...A1, BASE_H) + screw(...A2, BASE_H));
    o.push(text(A1[0] - 3, A1[1] + 7, BASE_H, "A1") + text(A2[0] - 3, A2[1] - 3.4, BASE_H, "A2"));
    o.push(L(k.onTop([[COIL[0] + 9, 10], [40, 16], [A1[0] - 2, A1[1]]], BASE_H + 0.2, P) + k.onTop([[COIL[0] + 11, -7], [40, -16], [A2[0] - 2, A2[1]]], BASE_H + 0.2, P), { tone: "mid" }));
    // bornes des contacts et repères gravés
    for (const [name, y] of Object.entries(relayTerms)) {
      o.push(screw(TERM_X, y, BASE_H, 2));
      o.push(text(TERM_X - 7.6, y + 1.2, BASE_H, name, 2.8));
    }
    o.push(D([at([BASE.x + BASE.w - 3.4, 0, BASE_H]), at([-12, 30, BASE_H])], { size: 0.5 }));
    o.push(S(k.slabOf(YOKE_FOOT, BASE_H, 2, P, 2, 0.4), { tone: "lo" }));
    return o.join("");
  }

  function pillars() {
    const top = changeover ? NC_BOTTOM + RIVET_T + BLADE_T + 2.4 : NO_TOP + 3;
    return [...poles]
      .sort((a, b) => depth(PILLAR.x0, a.y) - depth(PILLAR.x0, b.y))
      .map((pole) => {
        const pl = { x: PILLAR.x0, y: pole.y - 5, w: PILLAR.w, d: 10, r: 1 };
        return S(k.slabOf(pl, BASE_H, top - BASE_H, P, 2, 0.4), { tone: "lo", inner: L(k.sideSeam(pl, BASE_H + 6, P, 2), { tone: "faint" }) }) + D([at([PILLAR.x0 + 4, pole.y - 2.4, top]), at([PILLAR.x0 + 4, pole.y + 2.4, top])], { size: 0.45 });
      })
      .join("");
  }
  const fixedBlade = (pole, z) => S(k.slabOf({ x: PILLAR.x0 + PILLAR.w - 0.5, y: pole.y - 3, w: RIVET_X + 4.5 - PILLAR.x0 - PILLAR.w, d: 6, r: 1.4 }, z, BLADE_T, P, 3, 0.3), { tone: "mid" });
  const noContacts = () => poles.map((pole) => fixedBlade(pole, NO_TOP - RIVET_T - BLADE_T) + S(k.cylinder(RIVET_X, pole.y, 2, NO_TOP - RIVET_T, RIVET_T, P, 20), { tone: "mid" })).join("");
  const ncContacts = () => (changeover ? poles.map((pole) => S(k.cylinder(RIVET_X, pole.y, 2, NC_BOTTOM, RIVET_T, P, 20), { tone: "mid" }) + fixedBlade(pole, NC_BOTTOM + RIVET_T)).join("") : "");
  const comStuds = () => poles.map((pole) => S(k.cylinder(STUD_X, pole.y, 1.8, BASE_H, 3, P, 18), { tone: "mid" }) + L(k.ring(STUD_X, pole.y, 1, BASE_H + 3, P, 12), { tone: "lo" })).join("");

  function coil() {
    const [cx, cy] = COIL;
    const o = [];
    o.push(S(k.slabOf(YOKE, BASE_H + 2, POLE_TOP - BASE_H - 2, P, 2, 0.5), { tone: "lo", inner: L(k.sideSeam(YOKE, 26, P, 2), { tone: "faint" }) }));
    o.push(S(k.cylinder(cx, cy, FLANGE_R, BASE_H + 2, 2, P, 56, 0.4), { tone: "lo" }));
    const zw0 = BASE_H + 4;
    const zw1 = POLE_TOP - 4;
    const turns = [];
    for (let z = zw0 + 1; z < zw1 - 0.5; z += 1.4) turns.push(k.sideArc(cx, cy, COIL_R, z, P, 40));
    o.push(`<g class="rl-coil">${S(k.cylinder(cx, cy, COIL_R, zw0, zw1 - zw0, P, 56), { tone: "mid", inner: L(turns.join(""), { tone: "faint", className: "rl-turns" }) })}</g>`);
    o.push(S(k.cylinder(cx, cy, FLANGE_R, zw1, 2, P, 56, 0.4), { tone: "lo" }));
    o.push(L(k.ring(cx, cy, 8.5, zw1 + 2, P, 40), { tone: "faint" }));
    o.push(S(k.cylinder(cx, cy, 5, zw1 + 2, POLE_TOP - zw1 - 2, P, 32, 0.4), { tone: "mid" }));
    return o.join("");
  }

  const springD = (bottomOfArm) => {
    let d = "";
    const from = BASE_H + 1.4 + 0.6;
    const to = bottomOfArm - 0.6;
    for (let i = 0; i < 11; i++) d += k.ring(ROD[0], ROD[1], 3.4, from + ((to - from) * (i + 0.5)) / 11, P, 24);
    return d;
  };
  const rodLower = () => S(k.cylinder(ROD[0], ROD[1], 4.4, BASE_H, 1.4, P, 28), { tone: "lo" }) + S(k.cylinder(ROD[0], ROD[1], 1.1, BASE_H + 1.4, ARM_Z - BASE_H - 1.4, P, 16), { tone: "mid", crease: "none" });

  const BRAID = { root: BLADE_X1 - 3, stud: STUD_X, zb: ZB, top: BASE_H + 3 };
  const braidD = (dz, pole) => {
    const a = [BRAID.root, pole.y, BRAID.zb + dz];
    const b = [BRAID.stud + 1, pole.y, BRAID.top];
    const c1 = [a[0] + 2, a[1], a[2] - 14];
    const c2 = [b[0] + 5, b[1], b[2] + 10];
    const pts = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      const u = 1 - t;
      pts.push([0, 1, 2].map((j) => u * u * u * a[j] + 3 * u * u * t * c1[j] + 3 * u * t * t * c2[j] + t * t * t * b[j]));
    }
    return pathD(pts);
  };

  function armature() {
    const o = [];
    const carrier = CARRIER(halfW);
    // lames mobiles (cuivre) d'abord : elles partent du porte-contacts vers −x
    for (const pole of [...poles].sort((a, b) => a.y - b.y)) {
      o.push(S(k.cylinder(RIVET_X, pole.y, 2, ZB - RIVET_T, RIVET_T, P, 20), { tone: "hi", lit: true }));
      o.push(S(k.slabOf({ x: BLADE_X0, y: pole.y - 3, w: BLADE_X1 + 2 - BLADE_X0, d: 6, r: 1.4 }, ZB, BLADE_T, P, 3, 0.3), { tone: "hi", lit: true }));
      if (changeover) o.push(S(k.cylinder(RIVET_X, pole.y, 2, ZB + BLADE_T, RIVET_T, P, 20), { tone: "hi", lit: true }));
    }
    o.push(S(k.slabOf(carrier, ARM_Z - 3, 8, P, 2, 0.5), { tone: "mid" }));
    o.push(D(poles.map((pole) => at([carrier.x + 4.5, pole.y, ARM_Z + 5])), { size: 0.45 }));
    o.push(S(k.slabOf(ARM, ARM_Z, ARM_T, P, 2, 0.5), { tone: "hi", lit: true }));
    o.push(L(k.ring(ROD[0], ROD[1], 1.8, ARM_Z + ARM_T, P, 16), { tone: "lo" }));
    o.push(D([at([ARM.x + ARM.w - 4, -18, ARM_Z + ARM_T]), at([ARM.x + ARM.w - 4, 8, ARM_Z + ARM_T])], { size: 0.45 }));
    return o.join("");
  }

    return { relayBase, pillars, noContacts, ncContacts, comStuds, coil, springD, rodLower, BRAID, braidD, armature };
  })();

  // ---- goulotte de câblage (fentes sur la face +x visible)
  function duct() {
    const o = [];
    o.push(S(k.slabOf(DUCT, 0, DUCT_H, P, 2, 0.4), { tone: "lo" }));
    const fx = DUCT.x + DUCT.w;
    const slots = [];
    for (let y = DUCT.y + 6; y <= DUCT.y + DUCT.d - 6; y += 6) {
      const r = [[fx, y - 1.1, 1.6], [fx, y + 1.1, 1.6], [fx, y + 1.1, DUCT_H - 1.6], [fx, y - 1.1, DUCT_H - 1.6]];
      slots.push(k.pathOf(r.map(at), true));
    }
    o.push(L(slots.join(""), { tone: "faint" }));
    o.push(S(k.slabOf(k.insetPlan(DUCT, -0.8), DUCT_H, 1.6, P, 2, 0.4), { tone: "mid" }));
    o.push(D([at([DUCT.x + DUCT.w / 2, DUCT.y + 6, DUCT_H + 1.6]), at([DUCT.x + DUCT.w / 2, DUCT.y + DUCT.d - 6, DUCT_H + 1.6])], { size: 0.45 }));
    return o.join("");
  }

  // ---- bornier L N N
  function bornier() {
    const o = [];
    o.push(S(k.slabOf(BORNIER, 0, BORNIER_H, P, 3, 0.5), { tone: "mid" }));
    const seams = [B_L - 6.5, B_N - 6.5].map((x) => k.segment([x, BORNIER.y, BORNIER_H], [x, BORNIER.y + BORNIER.d, BORNIER_H], P) + k.segment([x, BORNIER.y + BORNIER.d, BORNIER_H], [x, BORNIER.y + BORNIER.d, 0], P));
    o.push(L(seams.join(""), { tone: "faint" }));
    o.push(screw(B_L, B_Y, BORNIER_H, 2.2) + screw(B_N, B_Y, BORNIER_H, 2.2) + screw(B_N2, B_Y, BORNIER_H, 2.2));
    o.push(S(k.slabOf({ x: B_N2 - 1, y: BORNIER.y + 1.2, w: B_N - B_N2 + 2, d: 2.6, r: 0.8 }, BORNIER_H, 0.8, P, 2), { tone: "hi", crease: "none" }));
    o.push(text(B_L - 1.2, BORNIER.y + BORNIER.d - 1.6, BORNIER_H, "L") + text(B_N - 1.2, BORNIER.y + BORNIER.d - 1.6, BORNIER_H, "N") + text(B_N2 - 1.2, BORNIER.y + BORNIER.d - 1.6, BORNIER_H, "N"));
    return o.join("");
  }

  // ---- voyants H1 H2
  function lampBase(name) {
    const b = LAMP_BASES[name];
    const cx = b.x + b.w / 2;
    const cy = b.y + b.d / 2 + 1;
    const o = [];
    o.push(S(k.slabOf(b, 0, LAMP_H, P, 3, 0.5), { tone: "mid" }));
    o.push(screw(LAMP_TERMS[0], b.y + 3, LAMP_H, 1.8) + screw(LAMP_TERMS[1], b.y + 3, LAMP_H, 1.8));
    o.push(text(b.x + 2.4, b.y + b.d - 2, LAMP_H, name, 3, "lo"));
    o.push(wiresOn(name));
    o.push(S(k.cylinder(cx, cy, 6.4, LAMP_H, 2, P, 40, 0.4), { tone: "lo" }));
    o.push(S(k.cylinder(cx, cy, 5.2, LAMP_H + 2, 5, P, 40), { tone: "mid", inner: L(k.sideArc(cx, cy, 5.2, LAMP_H + 4.5, P, 24), { tone: "faint" }) }));
    return o.join("");
  }
  function lampGlass(name) {
    const b = LAMP_BASES[name];
    const c = at([b.x + b.w / 2, b.y + b.d / 2 + 1, LAMP_H + 12]);
    const r = P.scale * 5.4;
    return `<circle class="rl-glow" data-lamp="${name}" cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="${(P.scale * 26).toFixed(1)}" fill="url(#rl-glow-${type})"/><g class="rl-lens" data-lamp="${name}"><circle class="rl-glass" cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="${r.toFixed(1)}"/><path class="iso-line" data-tone="faint" data-free="both" d="M${(c[0] - r * 0.55).toFixed(1)} ${(c[1] - r * 0.3).toFixed(1)}Q${(c[0] - r * 0.4).toFixed(1)} ${(c[1] - r * 0.7).toFixed(1)} ${(c[0] - r * 0.02).toFixed(1)} ${(c[1] - r * 0.72).toFixed(1)}"/></g>`;
  }

  // ---- assemblage : de l'arrière (−x, −y) vers l'avant (+x, +y)
  const lampsOrdered = [...lamps].sort((a, b) => depth(LAMP_BASES[a].x, LAMP_BASES[a].y) - depth(LAMP_BASES[b].x, LAMP_BASES[b].y));
  const body = [
    `<defs><radialGradient id="rl-glow-${type}"><stop offset="0" class="rl-stop-0"/><stop offset=".4" class="rl-stop-1"/><stop offset="1" class="rl-stop-2"/></radialGradient></defs>`,
    plate(),
    wiresOn("floorLeft"),
    bornier(),
    wiresOn("bornier"),
    ...lampsOrdered.map((name) => lampBase(name) + lampGlass(name)),
    duct(),
    wiresOn("gap"),
    relayBase(),
    wiresOn("relayTop"),
    pillars(),
    noContacts(),
    comStuds(),
    ...poles.map((pole) => `<path class="iso-line rl-braid" data-pole="${pole.n}" data-tone="mid" d="${braidD(0, pole)}"/>`),
    rodLower(),
    `<path class="iso-line rl-spring" data-tone="mid" d="${springD(ARM_Z)}"/>`,
    coil(),
    `<g data-move="arm">${armature()}</g>`,
    `<g class="rl-rod-top"></g>`,
    ncContacts(),
    wiresOn("relayFront"),
    wiresOn("floorRight"),
    psuBox(),
    psu(),
    wiresOn("psu"),
    s1Box(),
    s1Ledge(),
    wiresOn("s1"),
    s1Cap(),
  ];

  const svg = k.figureSvg({ width: WIDTH, height: HEIGHT, label: T.svgLabel(spec.name, T.contacts[type]), body });

  const config = {
    type,
    lang,
    P,
    PR,
    travel: MODEL.travel,
    armZ: ARM_Z,
    armT: ARM_T,
    rod: ROD,
    rodTop: ROD_TOP,
    baseH: BASE_H,
    s1Travel: S1_TRAVEL,
    poles,
    braid: BRAID,
    changeover,
    lamps,
    ctlWires: ["ctl-plus", "ctl-a1", "ctl-a2"],
    powerOn: { work: wiresFor(type, true), rest: wiresFor(type, false) },
  };
  return { svg, config, spec };
}

function wiresFor(type, work) {
  const w = (...ids) => ids.map((id) => `pw-${id}`);
  if (type === "spst") return work ? w("11", "L", "14", "H1a", "H1b", "N") : [];
  if (type === "spdt") return work ? w("11", "L", "14", "H1a", "H1b", "N") : w("11", "L", "12", "H2a", "H2b", "N2");
  if (type === "dpst") return work ? w("11", "L", "21", "N", "14", "H1a", "24", "H1b") : [];
  return work ? w("11", "L", "21", "N", "14", "H1a", "24", "H1b") : w("11", "L", "21", "N", "12", "H2a", "22", "H2b");
}

// ---------------------------------------------------------------- styles propres à la figure
const CSS = `
.rl-glass{fill:var(--anatomy-paper);fill-opacity:.6;stroke:var(--anatomy-hi);stroke-width:var(--anatomy-weight);vector-effect:non-scaling-stroke}
.rl-glow{opacity:0;pointer-events:none;mix-blend-mode:var(--rl-blend,screen)}
.rl-stop-0{stop-color:var(--rl-glow-0)}.rl-stop-1{stop-color:var(--rl-glow-1)}.rl-stop-2{stop-color:var(--rl-glow-2)}
.iso{--rl-glow-0:#ffd98a;--rl-glow-1:#ffb84a55;--rl-glow-2:#ff9d2a00;--rl-hot:#ffd98a}
.iso[data-theme="light"]{--rl-glow-0:#ffcf6a;--rl-glow-1:#ffb84a40;--rl-glow-2:#ff9d2a00;--rl-hot:#c77a0a;--rl-blend:multiply}
.rl-lens[data-on] .rl-glass{fill:var(--rl-glow-0);fill-opacity:.55;stroke:var(--rl-hot)}
.rl-wire[data-live] .iso-line{stroke:var(--anatomy-lit);stroke-dasharray:2 4;animation:iso-flow 1600ms linear infinite}
.rl-wire[data-live] .iso-wire-end{stroke:var(--anatomy-lit)}
.rl-coil[data-on] .rl-turns{stroke:var(--anatomy-hi)}
.rl-led .iso-edge{stroke:var(--anatomy-hi)}
.iso-stage{cursor:pointer;touch-action:manipulation;outline-offset:6px;-webkit-user-select:none;user-select:none}
.iso-stage:focus-visible{outline:2px solid var(--anatomy-hi)}
.rl-intro{color:var(--anatomy-text);max-width:62ch}
.rl-intro h1{color:var(--anatomy-strong);font-size:20px;font-weight:600;margin:0 0 8px}
.rl-table{border-collapse:collapse;margin:14px 0 6px;font-size:13px;width:100%}
.rl-table th,.rl-table td{border-bottom:1px solid var(--anatomy-faint);padding:5px 8px;text-align:left}
.rl-table th{color:var(--anatomy-strong);font-weight:600}
@media (prefers-reduced-motion:reduce){.rl-wire[data-live] .iso-line{animation:none}}
@media (max-width:560px){.iso-plate-corner[data-corner="readout"]{white-space:normal;left:0;text-align:right;line-height:1.4}.iso-plate-corner[data-corner="hint"]{bottom:auto;top:16px}.iso-plate{padding:56px 12px 64px}}
`;

// ---------------------------------------------------------------- comportement (un script pour toutes les figures de la page)
const LIVE = `
const still = matchMedia("(prefers-reduced-motion: reduce)");
for (const stage of document.querySelectorAll(".iso-stage[data-relay]")) {
  const C = FIGS[stage.dataset.relay];
  if (!C || stage.dataset.ready) continue;
  stage.dataset.ready = "1";
  const P = C.PR; // pièces du relais (échelle RS)
  const svg = stage.querySelector("svg");
  const readout = stage.closest(".iso-plate").querySelector("[data-readout]");
  const arm = svg.querySelector('[data-move="arm"]');
  const cap = svg.querySelector('[data-move="s1"]');
  const spring = svg.querySelector(".rl-spring");
  const braids = [...svg.querySelectorAll(".rl-braid")];
  const rodTop = svg.querySelector(".rl-rod-top");
  const coilG = svg.querySelector(".rl-coil");
  const wires = [...svg.querySelectorAll(".rl-wire")];
  const lenses = Object.fromEntries([...svg.querySelectorAll(".rl-lens")].map((g) => [g.dataset.lamp, g]));
  const glows = Object.fromEntries([...svg.querySelectorAll(".rl-glow")].map((g) => [g.dataset.lamp, g]));
  const at = (p) => iso(p, P);
  let pressed = false, pos = 0, rate = 0, capPos = 0, frame = 0, last = 0, clock = 0, visible = false, idle = 0;
  let touring = !still.matches;
  const glowAt = Object.fromEntries(C.lamps.map((n) => [n, 0]));
  const springD = (bottom) => { let d = ""; const from = C.baseH + 2, to = bottom - 0.6; for (let i = 0; i < 11; i++) d += ring(C.rod[0], C.rod[1], 3.4, from + ((to - from) * (i + 0.5)) / 11, P, 24); return d; };
  const braidD = (dz, pole) => {
    const B = C.braid, a = [B.root, pole.y, B.zb + dz], b = [B.stud + 1, pole.y, B.top];
    const c1 = [a[0] + 2, a[1], a[2] - 14], c2 = [b[0] + 5, b[1], b[2] + 10];
    const pts = [];
    for (let i = 0; i <= 14; i++) { const t = i / 14, u = 1 - t; pts.push([0, 1, 2].map((j) => u * u * u * a[j] + 3 * u * u * t * c1[j] + 3 * u * t * t * c2[j] + t * t * t * b[j])); }
    return pathOf(pts.map(at));
  };
  const rodTopSvg = (z) => solidSvg(cylinder(C.rod[0], C.rod[1], 1.1, z, C.rodTop - 2 - z, P, 16), { tone: "mid", crease: "none" }) + solidSvg(cylinder(C.rod[0], C.rod[1], 2.6, C.rodTop - 2, 2, P, 24, 0.3), { tone: "mid" });
  function state() {
    const coil = pressed && capPos > 0.95;
    const work = pos > 0.995;          // lames sur 14 / 24
    const rest = pos < 0.005;          // lames sur 12 / 22
    return { coil, work, rest };
  }
  function draw() {
    const dz = -C.travel * pos;
    arm.setAttribute("transform", translateAlong(P, [0, 0, dz]));
    cap.setAttribute("transform", translateAlong(C.P, [0, 0, -C.s1Travel * capPos]));
    spring.setAttribute("d", springD(C.armZ + dz));
    for (const b of braids) b.setAttribute("d", braidD(dz, C.poles.find((p) => String(p.n) === b.dataset.pole)));
    rodTop.innerHTML = rodTopSvg(C.armZ + C.armT + dz);
    const s = state();
    const live = new Set();
    if (s.coil) for (const id of C.ctlWires) live.add(id);
    if (s.work) for (const id of C.powerOn.work) live.add(id);
    if (s.rest && C.changeover) for (const id of C.powerOn.rest) live.add(id);
    for (const w of wires) { if (live.has(w.dataset.wire)) w.setAttribute("data-live", ""); else w.removeAttribute("data-live"); }
    if (s.coil) coilG.setAttribute("data-on", ""); else coilG.removeAttribute("data-on");
    const lampOn = { H1: s.work, H2: C.changeover && s.rest };
    for (const n of C.lamps) {
      if (lampOn[n]) lenses[n].setAttribute("data-on", ""); else lenses[n].removeAttribute("data-on");
      glows[n].style.opacity = glowAt[n].toFixed(3);
    }
    const txt = READOUT[C.lang](C, s, lampOn);
    if (readout.textContent !== txt) readout.textContent = txt;
    stage.setAttribute("aria-pressed", pressed ? "true" : "false");
    stage.dataset.pos = pos.toFixed(3);
  }
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
    last = now;
    const calm = still.matches;
    if (touring) { clock += dt; pressed = clock % 4.2 > 1.4 && clock % 4.2 < 3.2; }
    // bouton S1 : ressort rapide
    const capTarget = pressed ? 1 : 0;
    capPos = calm ? capTarget : capPos + (capTarget - capPos) * (1 - Math.exp(-dt / 0.04));
    // palette : force magnétique (bobine alimentée) contre ressort de rappel
    const coil = pressed && capPos > 0.95;
    if (calm) { pos = coil ? 1 : 0; rate = 0; }
    else {
      for (let i = 0; i < 4; i++) {
        const h = dt / 4;
        // la force d'attraction croît quand l'entrefer diminue ; le ressort ramène vers 0
        const gap = 1.15 - pos;
        const pull = coil ? 260 / (gap * gap) : 0;
        const acc = pull - 420 * (pos + 0.25) - 26 * rate;
        // butées : palette collée sur le noyau (1) ou sur la bague d'arrêt (0) tant que la force l'y pousse
        if (pos >= 1 && acc > 0 && rate > -0.5) { pos = 1; rate = 0; continue; }
        if (pos <= 0 && acc < 0 && rate < 0.5) { pos = 0; rate = 0; continue; }
        rate += acc * h;
        pos += rate * h;
        if (pos > 1) { pos = 1; rate = -rate * 0.12; }
        if (pos < 0) { pos = 0; rate = -rate * 0.2; }
      }
    }
    const s = state();
    const want = { H1: s.work ? 1 : 0, H2: C.changeover && s.rest ? 1 : 0 };
    for (const n of C.lamps) glowAt[n] = calm ? want[n] : glowAt[n] + (want[n] - glowAt[n]) * (1 - Math.exp(-dt / (want[n] ? 0.06 : 0.2)));
    draw();
    const settled = !touring && Math.abs(capTarget - capPos) < 1e-3 && Math.abs(rate) < 1e-3 && (pos < 1e-4 || pos > 1 - 1e-4) && C.lamps.every((n) => Math.abs(glowAt[n] - want[n]) < 1e-3);
    frame = visible && !settled ? requestAnimationFrame(tick) : 0;
  }
  const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
  const press = (down) => { touring = false; pressed = down; clearTimeout(idle); if (!down) idle = setTimeout(() => { touring = !still.matches; clock = 0; run(); }, 5000); run(); };
  new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
  stage.addEventListener("pointerdown", (e) => { stage.setPointerCapture?.(e.pointerId); press(true); });
  stage.addEventListener("pointerup", () => press(false));
  stage.addEventListener("pointercancel", () => press(false));
  stage.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); if (!e.repeat) press(true); } });
  stage.addEventListener("keyup", (e) => { if (e.key === " " || e.key === "Enter") press(false); });
  stage.addEventListener("blur", () => { if (pressed && !touring) press(false); });
  draw();
}
`;

// lecture : construite côté navigateur à partir des mêmes états
const READOUT_SRC = `
const READOUT = {
  fr: (C, s, lamp) => {
    const parts = [s.coil ? "bobine ${MODEL.coilVolts} V · ${COIL_MA.toLocaleString("fr", { maximumFractionDigits: 1 })} mA" : "bobine 0 V"];
    for (const p of C.poles) {
      if (C.changeover) parts.push(s.work ? p.n + "1-" + p.n + "4 fermé" : s.rest ? p.n + "1-" + p.n + "2 fermé" : p.n + "1 en mouvement");
      else parts.push(s.work ? p.n + "1-" + p.n + "4 fermé" : p.n + "1-" + p.n + "4 ouvert");
    }
    parts.push(C.lamps.filter((n) => lamp[n]).map((n) => n + " allumé").join(", ") || "voyants éteints");
    return parts.join(" · ");
  },
  en: (C, s, lamp) => {
    const parts = [s.coil ? "coil ${MODEL.coilVolts} V · ${COIL_MA.toFixed(1)} mA" : "coil 0 V"];
    for (const p of C.poles) {
      if (C.changeover) parts.push(s.work ? p.n + "1-" + p.n + "4 closed" : s.rest ? p.n + "1-" + p.n + "2 closed" : p.n + "1 moving");
      else parts.push(s.work ? p.n + "1-" + p.n + "4 closed" : p.n + "1-" + p.n + "4 open");
    }
    parts.push(C.lamps.filter((n) => lamp[n]).map((n) => n + " on").join(", ") || "lights off");
    return parts.join(" · ");
  },
};
`;

// ---------------------------------------------------------------- pages
function plateOf(type, lang, n) {
  const T = TEXT[lang];
  const { svg, config, spec } = buildFigure(type, lang);
  const html = k.plateHtml({
    fig: `Fig ${n}`,
    title: T.figTitle(spec.name),
    hint: T.hint,
    readout: "",
    keys: T.keys,
    caption: T.caption[type],
    body: `<div class="iso-stage" data-relay="${type}" tabindex="0" role="button" aria-pressed="false" aria-label="${T.stageLabel(spec.name)}">${svg}</div>`,
  });
  return { html, config };
}

function page(types, lang, theme, intro) {
  const plates = types.map((type, i) => plateOf(type, lang, types.length === 1 ? Object.keys(TYPES).indexOf(type) + 1 : i + 1));
  const figs = Object.fromEntries(plates.map((p) => [p.config.type, p.config]));
  const script = KIT_SOURCE + READOUT_SRC + `const FIGS = ${JSON.stringify(figs)};` + LIVE;
  const title = types.length === 1 ? TEXT[lang].figTitle(TYPES[types[0]].name) : TEXT[lang].pageTitle;
  const body = `<style>${CSS}</style>${intro ?? ""}${plates.map((p) => p.html).join("")}`;
  return k.pageHtml({ title, theme, body, script, width: 760 }).replace('<html lang="en">', `<html lang="${lang}">`);
}

function introHtml(lang) {
  const T = TEXT[lang];
  const head = lang === "fr" ? ["Type", "Signification", "Contacts"] : ["Type", "Meaning", "Contacts"];
  const rows = Object.keys(TYPES).map((t) => `<tr><td>${TYPES[t].name}</td><td>${T.meaning[t]}</td><td>${T.contacts[t]}</td></tr>`).join("");
  return `<section class="rl-intro"><h1>${T.pageTitle}</h1><p>${T.groupIntro}</p><table class="rl-table"><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></section>`;
}

const written = [];
for (const lang of ["fr", "en"]) {
  for (const theme of ["dark", "light"]) {
    const suffix = theme === "light" ? "-light" : "";
    for (const type of Object.keys(TYPES)) {
      const name = `relais-${type}.${lang}${suffix}.html`;
      writeFileSync(join(HERE, name), page([type], lang, theme));
      written.push(name);
    }
    const name = `relais.${lang}${suffix}.html`;
    writeFileSync(join(HERE, name), page(Object.keys(TYPES), lang, theme, introHtml(lang)));
    written.push(name);
  }
}
// publication dans le site : les 4 figures ensemble, dans la section « Commande » du module 2 de la Partie 3
const site = { fragments: {}, scripts: {} };
for (const lang of ["fr", "en"]) {
  const plates = Object.keys(TYPES).map((type, i) => plateOf(type, lang, i + 1));
  site.fragments[lang] = plates.map((p) => p.html).join("");
  site.scripts[lang] = READOUT_SRC + `const FIGS = ${JSON.stringify(Object.fromEntries(plates.map((p) => [p.config.type, p.config])))};` + LIVE;
}
written.push(...publish("relais", { ...site, css: CSS }));
console.log("wrote", written.length, "files:", written.join(", "));
