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

export const STARTERS = {
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
export function solve(schema, closed, energised = () => true) {
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
export const TIMING = { armature: 0.3, button: 0.08, press: 1, delayContact: 0.15 };

export function createStarter(name) {
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

export function runScenario(name, { actions, until }, dt = 0.01) {
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

export function build() {
  const situations = {};
  for (const [name, list] of Object.entries(SCENARIOS)) situations[name] = list.map((sc) => ({ id: sc.id, ...runScenario(name, sc) }));
  const meta = {};
  for (const [name, d] of Object.entries(STARTERS)) {
    meta[name] = {
      contactors: d.contactors,
      timer: d.timer,
      slow: d.slow,
      control: d.control.edges.map(({ kind, a, b, by, coil, nums, name: n, op, timer }) => ({ kind, a, b, by, coil, nums, name: n, op, timer })),
      power: d.power.edges.map(({ kind, a, b, by, winding }) => ({ kind, a, b, by, winding })),
    };
  }
  return { starters: meta, situations };
}
