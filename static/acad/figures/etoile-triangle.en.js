(() => {
const FIG = {"P":{"origin":[312.8191181037003,291.74618796810034],"scale":1.108198879156392,"azimuth":28,"elevation":38},"F":{"o":[0,18,38]},"markS":118,"dial":{"x":-38.8,"y":-176,"z":98,"r":13,"max":8},"timerFace":{"x":-28.55,"y":-82,"z":65.5,"r":3.8},"plungerMove":-2,"flagMove":2.4,"btnMove":-1};
const NAME = "etoile-triangle";
const TX = {dec:".",read:(st, v) => ({
      rest: "off · Q closed",
      press: "S1 pressed · KM1 coil energised",
      pull: `KM1 + KM2 · star · I ≈ ${v.i} × In`,
      star: `star · timer ${v.t} / ${v.delay} s · I ≈ ${v.i} × In`,
      switch: "star → delta changeover · I = 0",
      delta: `delta · I ≈ ${v.i} × In`,
      stop: "stopped by S0",
      trip: "F tripped · stopped",
    })[st],stages:{"rest":"Off: the circuit is live and the switch-disconnector Q is closed. Contacts are drawn at rest: 55-56 (normally closed) is closed, 67-68 (normally open) is open. Press “Start S1”.","press":"Press on S1: current flows through F (95-96), S0 and S1 and energises the KM1 coil.","pull":"KM1 pulls in: its poles bring L1, L2, L3 to U1, V1, W1, and its 13-14 contact closes. Through 55-56, still closed, and KM3 21-22, the KM2 coil is energised: KM2 joins U2, V2, W2.","star":"S1 is released: KM1 stays energised through its 13-14 contact (hold-in). First step, star connection: each winding is at 230 V and the current is about three times lower than direct-on-line. The KM1 timer block is timing.","switch":"Timer runs out: 55-56 opens, the KM2 coil is no longer energised and KM2 drops out; its 21-22 contact closes again. 67-68 has closed: the KM3 coil is energised as soon as KM2 is open (electrical interlock).","delta":"Second step: KM3 pulls in and connects U2 to V1, V2 to W1, W2 to U1: delta connection, each winding at 400 V. The KM3 21-22 contact, now open, prevents KM2 from pulling in again.","stop":"Stopped by S0: the head of the circuit is broken, all coils drop out and 13-14 opens. A new start begins in star again.","trip":"Overload: the 95-96 contact of the thermal overload relay F opens and all coils drop out. S1 has no effect until F is reset."},fault:"Overload (F)",reset:"Reset F",fault2:"",reset2:""};
const BLADE = {"noOpen":-26,"noClosed":0,"ncClosed":28,"ncOpen":-18};
const FAULTS = ["F"];
const CABLES = {"1":[21,22,23],"2":[27,28,29]};
const STAGE = (s, p) => {
  if (!s.contactors.some(p)) return s.pos.S1 > 0 && !s.st_trip ? "press" : "rest";
  if (p("KM1") && s.pos.S1 > 0 && !p("KM3") && s.mode === "star") return "pull";
  if (s.mode === "star") return "star";
  if (s.mode === "delta") return "delta";
  if (p("KM1")) return "switch";
  return "rest";
};
const LAMPS = (leds, s) => { leds.Y.toggleAttribute("data-on", s.mode === "star"); leds["Δ"].toggleAttribute("data-on", s.mode === "delta"); };
const D = (() => {
// Schémas et logique des démarreurs animés (Partie 3) : étoile-triangle (p3/m5/03) et fractionné (p3/m6/02).
// Une seule description sert au dessin (figures/_kit/ladder.mjs), au script des figures et aux tests
// (`node figures/_data/export.mjs demarreurs`, lu par courses/tests/test_starter_schematics.py).
//
// Un schéma = des arêtes entre nœuds nommés. Chaque arête porte ses points de dessin (`pts`, coordonnées du schéma)
// et sa nature : fil, contact (no : à fermeture, nc : à ouverture), bobine, fusible, élément thermique, enroulement.
// Un contact est commandé par un organe (`by`) : bouton, contacteur, bloc temporisé, relais thermique, module.
// La logique est générique : un nœud est sous tension s'il est relié à une source par des éléments conducteurs ;
// une bobine est alimentée si ses deux bornes sont reliées l'une à L1, l'autre à N ; une arête est parcourue par un
// courant si elle est sur un chemin entre deux bornes d'alimentation (les branches en cul-de-sac sont élaguées).

// ---------------------------------------------------------------- constructeurs d'arêtes
const W = (a, b, pts) => ({ kind: "wire", a, b, pts });
const C = (kind, a, b, x, y0, y1, by, extra = {}) => ({ kind, a, b, pts: [[x, y0], [x, y1]], by, ...extra });
const COIL = (a, b, x, y0, name, extra = {}) => ({ kind: "coil", a, b, pts: [[x, y0], [x, y0 + 22]], coil: name, ...extra });

// ---------------------------------------------------------------- étoile-triangle, circuit de commande (410 × 470)
// Repris de content/froid/p3/m5/img/etoile-triangle-commande.svg : F 95-96, S0, S1 // KM1 13-14, puis trois branches :
// bobine KM1 ; 55-56 (temporisé, s'ouvre au travail) + KM3 21-22 + bobine KM2 ; 67-68 (temporisé, se ferme au
// travail) + KM2 21-22 + bobine KM3.
const ET_CONTROL = {
  view: [410, 470],
  sources: { L1: [[40, 34], [380, 34]], N: [[40, 450], [380, 450]] },
  edges: [
    W("L1", "a1", [[80, 34], [80, 50]]),
    C("nc", "a1", "a2", 80, 50, 80, "F", { op: "thermal", name: "F", nums: ["95", "96"] }),
    W("a2", "a3", [[80, 80], [80, 96]]),
    C("nc", "a3", "a4", 80, 96, 126, "S0", { op: "push", name: "S0" }),
    W("a4", "a5", [[80, 126], [80, 142]]),
    W("a5", "a6", [[80, 142], [80, 158]]),
    W("a5", "a7", [[80, 142], [140, 142], [140, 158]]),
    C("no", "a6", "a8", 80, 158, 188, "S1", { op: "push", name: "S1" }),
    C("no", "a7", "a9", 140, 158, 188, "KM1", { name: "KM1", side: "right", nums: ["13", "14"], role: "hold" }),
    W("a8", "a10", [[80, 188], [80, 204]]),
    W("a9", "a10", [[140, 188], [140, 204], [80, 204]]),
    W("a10", "a11", [[80, 204], [80, 220]]),
    W("a11", "c1", [[80, 220], [80, 384]]),
    COIL("c1", "n1", 80, 384, "KM1", { side: "right" }),
    W("n1", "N", [[80, 406], [80, 450]]),
    W("a11", "a12", [[80, 220], [210, 220]]),
    W("a12", "b1", [[210, 220], [210, 244]]),
    C("nc", "b1", "b2", 210, 244, 274, "KM1T", { op: "delay", name: "KM1", nums: ["55", "56"], numsAt: "tag" }),
    W("b2", "b3", [[210, 274], [210, 296]]),
    C("nc", "b3", "b4", 210, 296, 326, "KM3", { name: "KM3", nums: ["21", "22"], role: "interlock" }),
    W("b4", "c2", [[210, 326], [210, 384]]),
    COIL("c2", "n2", 210, 384, "KM2", { side: "left" }),
    W("n2", "N", [[210, 406], [210, 450]]),
    W("a12", "d1", [[210, 220], [330, 220], [330, 244]]),
    C("no", "d1", "d2", 330, 244, 274, "KM1T", { op: "delay", name: "KM1", nums: ["67", "68"], numsAt: "tag" }),
    W("d2", "d3", [[330, 274], [330, 296]]),
    C("nc", "d3", "d4", 330, 296, 326, "KM2", { name: "KM2", nums: ["21", "22"], role: "interlock" }),
    W("d4", "c3", [[330, 326], [330, 384]]),
    COIL("c3", "n3", 330, 384, "KM3", { side: "left" }),
    W("n3", "N", [[330, 406], [330, 450]]),
  ],
  dots: [[80, 142], [80, 204], [80, 220], [210, 220]],
  interlock: [[228, 372], [312, 372]], // verrouillage mécanique KM2 ▽ KM3
};

// ---------------------------------------------------------------- étoile-triangle, circuit de puissance (410 × 450)
// Repris de etoile-triangle-puissance.svg : Q, fusibles, KM1 vers U1, V1, W1 ; U2, V2, W2 par F vers KM2 (point
// étoile) et vers KM3 (U2 → V1, V2 → W1, W2 → U1).
function etPower() {
  const edges = [];
  const X = [70, 110, 150];
  const J = [172, 184, 196]; // dérivations vers KM3 sur U1, V1, W1
  const TERM1 = [[92, 264], [110, 260], [128, 264]];
  const TERM2 = [[92, 316], [110, 318], [128, 316]];
  const PH = ["1", "2", "3"];
  X.forEach((x, i) => {
    const p = PH[i];
    edges.push(W(`L${p}`, `q${p}`, [[x, 26], [x, 40]]));
    edges.push(C("no", `q${p}`, `f${p}`, x, 40, 70, "Q", { pole: i, name: i === 0 ? "Q" : "" }));
    edges.push(W(`f${p}`, `g${p}`, [[x, 70], [x, 80]]));
    edges.push({ kind: "fuse", a: `g${p}`, b: `h${p}`, pts: [[x, 80], [x, 104]] });
    edges.push(W(`h${p}`, `k${p}`, [[x, 104], [x, 120]]));
    edges.push(C("no", `k${p}`, `m${p}`, x, 120, 150, "KM1", { pole: i, name: i === 0 ? "KM1" : "" }));
    edges.push(W(`m${p}`, `j${p}`, [[x, 150], [x, J[i]]]));
  });
  // vers les bornes du moteur
  edges.push(W("j1", "U1", [[70, 172], [70, 246], [92, 246], [92, 264]]));
  edges.push(W("j2", "V1", [[110, 184], [110, 260]]));
  edges.push(W("j3", "W1", [[150, 196], [150, 246], [128, 246], [128, 264]]));
  // enroulements (dessinés dans le cercle du moteur)
  ["U", "V", "W"].forEach((n, i) => edges.push({ kind: "winding", a: `${n}1`, b: `${n}2`, pts: [TERM1[i], TERM2[i]], winding: n }));
  // sorties U2, V2, W2 par le relais thermique F
  edges.push(W("U2", "fu", [[92, 316], [92, 330], [70, 330], [70, 348]]));
  edges.push(W("V2", "fv", [[110, 318], [110, 348]]));
  edges.push(W("W2", "fw", [[128, 316], [128, 330], [150, 330], [150, 348]]));
  for (const [n, x] of [["u", 70], ["v", 110], ["w", 150]]) edges.push({ kind: "heater", a: `f${n}`, b: `e${n}`, pts: [[x, 348], [x, 372]] });
  // retours vers KM3 (triangle) et KM2 (étoile)
  const back = [["u", 70, 392, 220, 340], ["v", 110, 406, 250, 365], ["w", 150, 420, 280, 390]];
  for (const [n, x, y, x3, x2] of back) {
    edges.push(W(`e${n}`, `t${n}`, [[x, 372], [x, y], [x3, y]]));
    edges.push(W(`t${n}`, `y${n}`, [[x3, y], [x2, y], [x2, 306]]));
    edges.push(W(`t${n}`, `d${n}`, [[x3, y], [x3, 306]]));
  }
  // KM3 : U2 → V1, V2 → W1, W2 → U1
  [["u", 220, "j2", 184, 110], ["v", 250, "j3", 196, 150], ["w", 280, "j1", 172, 70]].forEach(([n, x, j, jy, jx], i) => {
    edges.push(C("no", `d${n}`, `r${n}`, x, 306, 276, "KM3", { pole: i, name: i === 0 ? "KM3" : "", flip: true }));
    edges.push(W(`r${n}`, j, [[x, 276], [x, jy], [jx, jy]]));
  });
  // KM2 : point étoile
  [["u", 340], ["v", 365], ["w", 390]].forEach(([n, x], i) => {
    edges.push(C("no", `y${n}`, `s${n}`, x, 306, 276, "KM2", { pole: i, name: i === 0 ? "KM2" : "", flip: true }));
  });
  edges.push(W("su", "star", [[340, 276], [340, 262], [365, 262]]));
  edges.push(W("sw", "star", [[390, 276], [390, 262], [365, 262]]));
  edges.push(W("sv", "star", [[365, 276], [365, 262]]));
  return {
    view: [410, 450],
    sources: { L1: [[70, 26]], L2: [[110, 26]], L3: [[150, 26]] },
    edges,
    dots: [[70, 172], [110, 184], [150, 196], [220, 392], [250, 406], [280, 420], [365, 262]],
    motor: { c: [110, 290], r: 28, name: "M1", terms: [["U1", 66, 190], ["V1", 106, 202], ["W1", 146, 214], ["U2", 66, 389], ["V2", 106, 389], ["W2", 146, 389]] },
    heaterBox: { x: 58, y: 342, w: 104, h: 36, name: "F", at: [30, 366] },
    poles: { Q: [[64, 57], [144, 57], [30, 60]], KM1: [[64, 137], [144, 137], [30, 142]], KM3: [[214, 293], [274, 293], [188, 296]], KM2: [[334, 293], [384, 293], [365, 250]] },
    interlock: [[288, 316], [330, 316]],
    coupling: [30, 300],
  };
}

// ---------------------------------------------------------------- fractionné, circuit de commande (400 × 470)
// Repris de content/froid/p3/m6/img/fractionne-commande.svg : B1, F1 95-96, F2 95-96, S0, S1 // K1 13-14, puis
// bobine K1, bobine K1T (temporisateur), contact temporisé de K1T et bobine K2.
const PW_CONTROL = {
  view: [400, 470],
  sources: { L1: [[40, 34], [370, 34]], N: [[40, 450], [370, 450]] },
  edges: [
    W("L1", "a1", [[80, 34], [80, 48]]),
    C("no", "a1", "a2", 80, 48, 78, "B1", { op: "module", name: "B1" }),
    W("a2", "a3", [[80, 78], [80, 92]]),
    C("nc", "a3", "a4", 80, 92, 122, "F1", { op: "thermal", name: "F1", nums: ["95", "96"] }),
    W("a4", "a5", [[80, 122], [80, 136]]),
    C("nc", "a5", "a6", 80, 136, 166, "F2", { op: "thermal", name: "F2" }),
    W("a6", "a7", [[80, 166], [80, 180]]),
    C("nc", "a7", "a8", 80, 180, 210, "S0", { op: "push", name: "S0" }),
    W("a8", "a9", [[80, 210], [80, 226]]),
    W("a9", "a10", [[80, 226], [80, 242]]),
    W("a9", "a11", [[80, 226], [140, 226], [140, 242]]),
    C("no", "a10", "a12", 80, 242, 272, "S1", { op: "push", name: "S1" }),
    C("no", "a11", "a13", 140, 242, 272, "K1", { name: "K1", side: "right", nums: ["13", "14"], role: "hold" }),
    W("a12", "a14", [[80, 272], [80, 288]]),
    W("a13", "a14", [[140, 272], [140, 288], [80, 288]]),
    W("a14", "a15", [[80, 288], [80, 300]]),
    W("a15", "c1", [[80, 300], [80, 384]]),
    COIL("c1", "n1", 80, 384, "K1", { side: "right" }),
    W("n1", "N", [[80, 406], [80, 450]]),
    W("a15", "a16", [[80, 300], [210, 300]]),
    W("a16", "c2", [[210, 300], [210, 384]]),
    COIL("c2", "n2", 210, 384, "K1T", { side: "right", timer: true }),
    W("n2", "N", [[210, 406], [210, 450]]),
    W("a16", "b1", [[210, 300], [330, 300], [330, 330]]),
    C("no", "b1", "b2", 330, 330, 360, "K1T", { op: "delay", name: "K1T" }),
    W("b2", "c3", [[330, 360], [330, 384]]),
    COIL("c3", "n3", 330, 384, "K2", { side: "left" }),
    W("n3", "N", [[330, 406], [330, 450]]),
  ],
  dots: [[80, 226], [80, 288], [80, 300], [210, 300]],
};

// ---------------------------------------------------------------- fractionné, circuit de puissance (380 × 380)
function pwPower() {
  const edges = [];
  const A = [70, 105, 140];
  const B = [240, 275, 310];
  const TAP = [50, 64, 78];
  const T1 = [[160, 296], [166, 288], [174, 282]];
  const T2 = [[220, 296], [214, 288], [206, 282]];
  const LEG1 = [[[70, 220], [70, 256], [160, 296]], [[105, 220], [105, 250], [166, 288]], [[140, 220], [140, 244], [174, 282]]];
  const LEG2 = [[[240, 220], [240, 244], [206, 282]], [[275, 220], [275, 250], [214, 288]], [[310, 220], [310, 256], [220, 296]]];
  ["1", "2", "3"].forEach((p, i) => {
    const x = A[i];
    edges.push(W(`L${p}`, `t${p}`, [[x, 26], [x, TAP[i]]]));
    edges.push(W(`t${p}`, `a${p}`, [[x, TAP[i]], [x, 110]]));
    edges.push(C("no", `a${p}`, `b${p}`, x, 110, 140, "K1", { pole: i, name: "" }));
    edges.push(W(`b${p}`, `c${p}`, [[x, 140], [x, 160]]));
    edges.push({ kind: "heater", a: `c${p}`, b: `d${p}`, pts: [[x, 160], [x, 184]] });
    edges.push(W(`d${p}`, `e${p}`, [[x, 184], ...LEG1[i]]));
    edges.push({ kind: "winding", a: `e${p}`, b: "star1", pts: [T1[i], [180, 314]], winding: "1" });
    const y = B[i];
    edges.push(W(`t${p}`, `A${p}`, [[x, TAP[i]], [y, TAP[i]], [y, 110]]));
    edges.push(C("no", `A${p}`, `B${p}`, y, 110, 140, "K2", { pole: i, name: "" }));
    edges.push(W(`B${p}`, `C${p}`, [[y, 140], [y, 160]]));
    edges.push({ kind: "heater", a: `C${p}`, b: `D${p}`, pts: [[y, 160], [y, 184]] });
    edges.push(W(`D${p}`, `E${p}`, [[y, 184], ...LEG2[i]]));
    // même ordre des phases sur les deux bobinages : L1, L2, L3 → 2U, 2V, 2W comme 1U, 1V, 1W
    edges.push({ kind: "winding", a: `E${p}`, b: "star2", pts: [T2[2 - i], [200, 314]], winding: "2" });
  });
  return {
    view: [380, 380],
    sources: { L1: [[70, 26]], L2: [[105, 26]], L3: [[140, 26]] },
    edges,
    dots: [[70, 50], [105, 64], [140, 78]],
    motor: { c: [190, 312], r: 36, name: "M1", terms: [] },
    heaterBox: [{ x: 58, y: 154, w: 94, h: 36, name: "F1", at: [36, 180] }, { x: 228, y: 154, w: 94, h: 36, name: "F2", at: [346, 180] }],
    poles: { K1: [[64, 127], [134, 127], [36, 130]], K2: [[234, 127], [304, 127], [346, 130]] },
  };
}

const STARTERS = {
  "etoile-triangle": {
    control: ET_CONTROL,
    power: etPower(),
    // organes : contacteurs (bobine → armature), bloc temporisé monté sur KM1 (compte quand KM1 est fermé)
    contactors: ["KM1", "KM2", "KM3"],
    timer: { name: "KM1T", runsWhen: "KM1", delay: 5 }, // réglage d'exemple : 5 s
    slow: 1,
    faults: ["F"],
  },
  fractionne: {
    control: PW_CONTROL,
    power: pwPower(),
    contactors: ["K1", "K2"],
    timer: { name: "K1T", runsWhen: "coil:K1T", delay: 1 }, // 1 s au maximum (cours)
    slow: 4, // montré 4 fois ralenti
    faults: ["F1", "F2", "B1"],
  },
};

// ---------------------------------------------------------------- résolution d'un schéma
// closed(edge) → booléen pour les contacts ; les autres arêtes conduisent toujours (les bobines servent de charge).
function solve(schema, closed, energised = () => true) {
  const conducts = (e) => (e.kind === "no" || e.kind === "nc" ? closed(e) : e.kind === "coil" ? false : true);
  const adj = new Map();
  const link = (n, i) => (adj.get(n) || adj.set(n, []).get(n)).push(i);
  schema.edges.forEach((e, i) => { link(e.a, i); link(e.b, i); });
  const flood = (starts, pass) => {
    const seen = new Set(starts);
    const todo = [...starts];
    while (todo.length) {
      const n = todo.pop();
      for (const i of adj.get(n) || []) {
        const e = schema.edges[i];
        if (!pass(e)) continue;
        const m = e.a === n ? e.b : e.a;
        if (!seen.has(m)) { seen.add(m); todo.push(m); }
      }
    }
    return seen;
  };
  const phases = Object.keys(schema.sources).filter((s) => s !== "N");
  const live = flood(phases, conducts);
  const neutral = schema.sources.N ? flood(["N"], conducts) : new Set();
  const coils = {};
  for (const e of schema.edges) if (e.kind === "coil") coils[e.coil] = (live.has(e.a) && neutral.has(e.b)) || (live.has(e.b) && neutral.has(e.a));
  // courant : sous-graphe conducteur (bobines alimentées comprises), culs-de-sac élagués
  const keep = schema.edges.map((e, i) => (e.kind === "coil" ? coils[e.coil] && energised(e.coil) : conducts(e)) ? i : -1).filter((i) => i >= 0);
  const terminals = new Set([...phases, ...(schema.sources.N ? ["N"] : [])]);
  const reach = (n) => live.has(n) || neutral.has(n);
  let set = new Set(keep.filter((i) => reach(schema.edges[i].a) && reach(schema.edges[i].b)));
  for (;;) {
    const degree = new Map();
    for (const i of set) for (const n of [schema.edges[i].a, schema.edges[i].b]) degree.set(n, (degree.get(n) || 0) + 1);
    const drop = [...set].filter((i) => [schema.edges[i].a, schema.edges[i].b].some((n) => !terminals.has(n) && degree.get(n) === 1));
    if (!drop.length) break;
    for (const i of drop) set.delete(i);
  }
  // une source de phase seule ne fait pas circuler de courant : il faut au moins deux bornes atteintes
  const reached = new Set();
  for (const i of set) for (const n of [schema.edges[i].a, schema.edges[i].b]) if (terminals.has(n)) reached.add(n);
  if (reached.size < 2) set = new Set();
  return { live, coils, flow: set };
}

// ---------------------------------------------------------------- simulation dans le temps
// Les armatures se déplacent en ARMATURE secondes (montré ralenti) ; un contact « no » se ferme en fin de course,
// un « nc » s'ouvre dès le début de course (coupure avant fermeture). Un bouton tapé reste enfoncé PRESS secondes.
const TIMING = { armature: 0.3, button: 0.08, press: 1, delayContact: 0.15 };

function createStarter(name) {
  const def = STARTERS[name];
  const pos = { S0: 0, S1: 0, F: 0, F1: 0, F2: 0, B1: 1, Q: 1 };
  for (const c of def.contactors) pos[c] = 0;
  pos[def.timer.name] = 0;
  const target = { ...pos };
  const coilOn = {};
  const st = { t: 0, timerRun: 0, held: { S1: 0, S0: 0 }, tripped: {}, speed: 0, current: 0, mode: "off" };
  const closedOf = (e) => {
    const p = pos[e.by] ?? 0;
    return e.kind === "no" ? p >= 0.999 : p <= 0.001;
  };
  const control = () => solve(def.control, closedOf);
  const press = (b, hold = TIMING.press) => { st.held[b] = Math.max(st.held[b] || 0, hold); };
  const trip = (f, on = true) => { st.tripped[f] = on; };
  function coupling() {
    const p = (n) => pos[n] >= 0.999;
    if (name === "etoile-triangle") return p("KM1") && p("KM2") ? "star" : p("KM1") && p("KM3") ? "delta" : p("KM1") ? "open" : "off";
    return p("K1") && p("K2") ? "full" : p("K1") ? "half" : p("K2") ? "second" : "off";
  }
  function step(dt) {
    st.t += dt;
    for (const b of ["S1", "S0"]) { st.held[b] = Math.max(0, (st.held[b] || 0) - dt); target[b] = st.held[b] > 0 ? 1 : 0; }
    for (const f of def.faults) target[f] = f === "B1" ? (st.tripped.B1 ? 0 : 1) : st.tripped[f] ? 1 : 0;
    const s = control();
    for (const c of [...def.contactors, def.timer.name]) coilOn[c] = !!s.coils[c];
    for (const c of def.contactors) target[c] = coilOn[c] ? 1 : 0;
    // temporisation
    const tm = def.timer;
    const running = tm.runsWhen.startsWith("coil:") ? coilOn[tm.runsWhen.slice(5)] : pos[tm.runsWhen] >= 0.999;
    st.timerRun = running ? st.timerRun + dt / def.slow : 0;
    target[tm.name] = running && st.timerRun >= tm.delay ? 1 : 0;
    for (const k of Object.keys(target)) {
      const speed = k === "S1" || k === "S0" || def.faults.includes(k) ? TIMING.button : k === tm.name ? TIMING.delayContact : TIMING.armature;
      const d = target[k] - pos[k];
      pos[k] = Math.abs(d) <= dt / speed ? target[k] : pos[k] + Math.sign(d) * (dt / speed);
    }
    // moteur : vitesse relative 0..1 et courant en multiples de In (démarrage direct : 6 × In)
    const m = coupling();
    st.mode = m;
    const direct = (w) => 1 + 5 * Math.pow(Math.max(0, 1 - w), 0.8);
    const rt = dt / def.slow;
    let top = 0, rate = 0, current = 0;
    if (m === "star") { top = 0.85; rate = 0.5; current = direct(st.speed) / 3; }
    else if (m === "delta" || m === "full") { top = 0.97; rate = 1.6; current = direct(st.speed); }
    else if (m === "half") { top = 0.9; rate = 0.45 * 3.2; current = 0.6 * direct(st.speed) * (st.speed > 0.85 ? 1.2 : 1); }
    if (rate) st.speed += (top - st.speed) * Math.min(1, rt * rate);
    else st.speed = Math.max(0, st.speed - rt * 0.12);
    if (name === "fractionne" && m === "half") st.speed = Math.min(st.speed, 0.9);
    st.current = current;
    return s;
  }
  const snapshot = () => ({ t: st.t, pos: { ...pos }, coils: { ...coilOn }, timer: st.timerRun, mode: st.mode, speed: st.speed, current: st.current });
  return { def, step, press, trip, snapshot, solveControl: control, solvePower: () => solve(def.power, closedOf), pos, st };
}

// ---------------------------------------------------------------- scénarios (tests)
// Chaque scénario joue des actions à des instants donnés et relève les changements d'état des organes.
const SCENARIOS = {
  "etoile-triangle": [
    { id: "marche", actions: [[0.2, "press", "S1"]], until: 9 },
    { id: "arret-en-triangle", actions: [[0.2, "press", "S1"], [7.5, "press", "S0"]], until: 9 },
    { id: "arret-en-etoile", actions: [[0.2, "press", "S1"], [2.5, "press", "S0"]], until: 5 },
    { id: "surcharge", actions: [[0.2, "press", "S1"], [7.5, "trip", "F"]], until: 9 },
    { id: "marche-impossible-f-declenche", actions: [[0, "trip", "F"], [0.2, "press", "S1"]], until: 3 },
  ],
  fractionne: [
    { id: "marche", actions: [[0.2, "press", "S1"]], until: 9 },
    { id: "arret", actions: [[0.2, "press", "S1"], [7, "press", "S0"]], until: 9 },
    { id: "surcharge-f2", actions: [[0.2, "press", "S1"], [7, "trip", "F2"]], until: 9 },
    { id: "surchauffe-b1", actions: [[0.2, "press", "S1"], [7, "trip", "B1"]], until: 9 },
  ],
};

function runScenario(name, { actions, until }, dt = 0.01) {
  const s = createStarter(name);
  const events = [];
  const watch = [...s.def.contactors, s.def.timer.name, "S1", "S0", ...s.def.faults];
  const was = Object.fromEntries(watch.map((k) => [k, s.pos[k] >= 0.999]));
  const together = [];
  const todo = [...actions].sort((a, b) => a[0] - b[0]);
  const round = (v) => Math.round(v * 100) / 100;
  for (let t = 0; t <= until; t = round(t + dt)) {
    while (todo.length && todo[0][0] <= t + 1e-9) {
      const [, act, who, hold] = todo.shift();
      if (act === "press") s.press(who, hold);
      else s.trip(who);
    }
    s.step(dt);
    for (const k of watch) {
      const now = s.pos[k] >= 0.999;
      if (now !== was[k]) { events.push({ t: round(s.st.t / s.def.slow), who: k, closed: now }); was[k] = now; }
    }
    const on = s.def.contactors.filter((c) => s.pos[c] > 0);
    together.push(on.join("+"));
  }
  const snap = s.snapshot();
  return { events, combos: [...new Set(together)], end: { mode: snap.mode, coils: snap.coils } };
}

function build() {
  const situations = {};
  for (const [name, list] of Object.entries(SCENARIOS)) situations[name] = list.map((sc) => ({ id: sc.id, ...runScenario(name, sc) }));
  const meta = {};
  for (const [name, d] of Object.entries(STARTERS)) {
    meta[name] = {
      contactors: d.contactors,
      timer: d.timer,
      slow: d.slow,
      control: d.control.edges.filter((e) => e.kind !== "wire").map(({ kind, by, coil, nums, name: n, op }) => ({ kind, by, coil, nums, name: n, op })),
      power: d.power.edges.filter((e) => e.kind !== "wire").map(({ kind, by, a, b, winding }) => ({ kind, by, a, b, winding })),
    };
  }
  return { starters: meta, situations };
}

return { STARTERS, solve, TIMING, createStarter, runScenario, build };
})();

function ladder(svgEl, schema) {
  const groups = [...svgEl.querySelectorAll(".ld-e")];
  const blades = [...svgEl.querySelectorAll(".ld-blade")];
  const coils = [...svgEl.querySelectorAll(".ld-coil")];
  const acts = [...svgEl.querySelectorAll(".ld-act")];
  const winds = [...svgEl.querySelectorAll(".ld-wind, .ld-wind-line")];
  const NS = "http://www.w3.org/2000/svg";
  // tirets du courant : copie de chaque fil, ajoutée ici pour ne pas alourdir le fragment
  for (const g of groups) for (const p of g.querySelectorAll(".ld-w")) { const d = document.createElementNS(NS, "path"); d.setAttribute("class", "ld-dash"); d.setAttribute("d", p.getAttribute("d")); g.appendChild(d); }
  const angles = blades.map(() => null);
  return function apply(res, pos) {
    groups.forEach((g, i) => {
      const e = schema.edges[i];
      const live = res.live.has(e.a) && res.live.has(e.b);
      g.toggleAttribute("data-live", live);
      g.toggleAttribute("data-flow", res.flow.has(i));
    });
    blades.forEach((b, j) => {
      const e = schema.edges[+b.dataset.e];
      const p = Math.max(0, Math.min(1, pos[e.by] ?? 0));
      const a = e.kind === "no" ? BLADE.noOpen + (BLADE.noClosed - BLADE.noOpen) * Math.min(1, p / 0.999)
        : BLADE.ncClosed + (BLADE.ncOpen - BLADE.ncClosed) * Math.min(1, p / 0.3);
      if (angles[j] === null || Math.abs(angles[j] - a) > 0.05) { angles[j] = a; b.setAttribute("transform", "rotate(" + a.toFixed(2) + " " + b.dataset.px + " " + b.dataset.py + ")"); }
    });
    for (const c of coils) c.toggleAttribute("data-on", !!res.coils[c.dataset.coil]);
    for (const a of acts) a.setAttribute("transform", "translate(" + (5 * Math.max(0, Math.min(1, pos[a.dataset.by] || 0))).toFixed(2) + " 0)");
    for (const w of winds) w.toggleAttribute("data-on", res.flow.has(+w.closest(".ld-e").dataset.e));
  };
}

const still = matchMedia("(prefers-reduced-motion: reduce)");
const C = FIG, T = TX, P = C.P;
const scope = document.querySelector('.live-figure[data-figure="etoile-triangle"]') || document;
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

})();
