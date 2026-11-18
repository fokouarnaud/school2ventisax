// Figure interactive (skill anatomy) : démarrage étoile-triangle, schémas et fonctionnement.
// Partie 3, module 5, section « Schémas et fonctionnement » (p3/m5/03-schemas).
// Le coffret (Q, KM1 et son bloc temporisé, KM2, KM3, verrouillage mécanique, F, S1, S0, ampèremètre) et le moteur
// s'animent en même temps que les schémas de commande et de puissance du cours : impulsion sur S1, KM1 qui colle,
// auto-maintien par 13-14, KM2 (étoile) par 55-56, temporisation, 55-56 qui s'ouvre au travail, KM2 qui retombe,
// 67-68 qui se ferme, KM3 (triangle) ; arrêt par S0 ou par F.
// Usage : node figures/etoile-triangle/build.mjs   (fr + en, sombre + clair, puis publication dans le site)
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildStarterFigure } from "../_kit/starter-figure.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

const STAGE = `(s, p) => {
  if (!s.contactors.some(p)) return s.pos.S1 > 0 && !s.st_trip ? "press" : "rest";
  if (p("KM1") && s.pos.S1 > 0 && !p("KM3") && s.mode === "star") return "pull";
  if (s.mode === "star") return "star";
  if (s.mode === "delta") return "delta";
  if (p("KM1")) return "switch";
  return "rest";
}`;
const LAMPS = `(leds, s) => { leds.Y.toggleAttribute("data-on", s.mode === "star"); leds["Δ"].toggleAttribute("data-on", s.mode === "delta"); }`;

const TEXT = {
  fr: {
    title: "Démarrage étoile-triangle",
    pageTitle: "Démarrage étoile-triangle : schémas et fonctionnement",
    hint: "Appuyer sur Marche S1, suivre les deux schémas",
    group: "Commande du démarreur",
    stepMode: "Pas à pas",
    next: "Continuer",
    logTitle: "Contacts qui basculent",
    ev: `{coil: (k, on) => "bobine " + k + (on ? " alimentée" : " n'est plus alimentée"), poles: (k, c) => "pôles de " + k + (c ? " fermés" : " ouverts"), timed: " (temporisé)", push: "", contact: (w, c, nc) => w + (c ? " se ferme" : " s'ouvre") + (nc ? " (contact à ouverture)" : " (contact à fermeture)")}`,
    start: "Marche S1",
    stop: "Arrêt S0",
    fault: "Surcharge (F)",
    reset: "Réarmer F",
    panel: "COUPLAGE",
    plate: "Δ 400 V · Y 690 V",
    plate2: "barrettes retirées",
    controlTitle: "Circuit de commande",
    powerTitle: "Circuit de puissance",
    controlLabel: "Circuit de commande du démarrage étoile-triangle entre L1 et N : F 95-96, S0, S1 avec auto-maintien KM1 13-14 ; bobine KM1 ; contact temporisé 55-56, KM3 21-22 et bobine KM2 ; contact temporisé 67-68, KM2 21-22 et bobine KM3. Les conducteurs parcourus par un courant s'allument et les contacts basculent.",
    powerLabel: "Circuit de puissance du démarrage étoile-triangle : Q, fusibles, KM1 vers U1, V1, W1 ; U2, V2, W2 par le relais thermique F vers KM2 (point étoile) et vers KM3 (U2 vers V1, V2 vers W1, W2 vers U1).",
    keys: [
      { mark: "lit", label: "Conducteur parcouru par un courant (tirets qui avancent), bobine alimentée (pleine)" },
      { mark: "raised", label: "Coffret : Q, KM1 et son bloc temporisé, KM2, KM3, verrouillage, F, S1, S0" },
      { mark: "dashed", label: "Câbles vers U1, V1, W1 (KM1) et vers U2, V2, W2 (F, puis KM2 ou KM3)" },
    ],
    caption: "Le moteur, couplé en triangle sous 400 V, a ses barrettes retirées : les couplages se font par les contacteurs. 1er temps : l'impulsion sur S1 alimente KM1, qui s'auto-maintient par 13-14 ; le contact temporisé 55-56, encore fermé, et le contact 21-22 de KM3 alimentent KM2, qui réunit U2, V2, W2 : couplage étoile, chaque enroulement sous 400 / √3 ≈ 230 V, courant de démarrage divisé par 3 environ. 2e temps : à la fin de la temporisation du bloc monté sur KM1, 55-56 s'ouvre au travail et KM2 retombe ; son contact 21-22 se referme et 67-68, fermé au travail, alimente KM3 : U2 → V1, V2 → W1, W2 → U1, couplage triangle. KM2 et KM3 ne sont jamais fermés ensemble (verrouillages électrique et mécanique). Temporisation réglée ici à 5 s (valeur d'exemple) ; courant en multiples de In, valeurs typiques ; mouvement des contacteurs ralenti.",
    stageLabel: "Coffret de démarrage étoile-triangle sur un banc, relié par deux câbles à la boîte à bornes d'un moteur. Les schémas de commande et de puissance, sous le dessin, s'animent en même temps.",
    svgLabel: "Coffret avec sectionneur Q, contacteurs KM1 (bloc temporisé), KM2 et KM3, verrouillage mécanique, relais thermique F, boutons S1 et S0, ampèremètre, voyants Y et Δ ; moteur à six bornes U1, V1, W1, U2, V2, W2.",
    read: (st, v) => ({
      rest: "repos · Q fermé",
      press: "S1 enfoncé · bobine KM1 alimentée",
      pull: `KM1 + KM2 · étoile · I ≈ ${v.i} × In`,
      star: `étoile · tempo ${v.t} / ${v.delay} s · I ≈ ${v.i} × In`,
      switch: "passage étoile → triangle · I = 0",
      delta: `triangle · I ≈ ${v.i} × In`,
      stop: "arrêt par S0",
      trip: "F déclenché · arrêt",
    })[st],
    stages: {
      rest: "Repos : le circuit est sous tension, le sectionneur Q est fermé. Les contacts sont dessinés au repos : 55-56 (à ouverture) est fermé, 67-68 (à fermeture) est ouvert. Appuyez sur « Marche S1 ».",
      press: "Impulsion sur S1 : le courant passe par F (95-96), S0 et S1 et alimente la bobine de KM1.",
      pull: "KM1 colle : ses pôles amènent L1, L2, L3 sur U1, V1, W1, et son contact 13-14 se ferme. Par 55-56, encore fermé, et par 21-22 de KM3, la bobine de KM2 est alimentée : KM2 réunit U2, V2, W2.",
      star: "S1 est relâché : KM1 reste alimenté par son contact 13-14 (auto-maintien). 1er temps, couplage étoile : chaque enroulement est sous 230 V, le courant est environ trois fois plus faible qu'en direct. Le bloc temporisé de KM1 compte.",
      switch: "Fin de la temporisation : 55-56 s'ouvre au travail, la bobine de KM2 n'est plus alimentée et KM2 retombe ; son contact 21-22 se referme. 67-68 s'est fermé : la bobine de KM3 sera alimentée dès que KM2 est ouvert (verrouillage électrique).",
      delta: "2e temps : KM3 colle et relie U2 à V1, V2 à W1, W2 à U1 : couplage triangle, chaque enroulement sous 400 V. Le contact 21-22 de KM3, désormais ouvert, empêche KM2 de recoller.",
      stop: "Arrêt par S0 : la tête du circuit est coupée, toutes les bobines retombent et 13-14 s'ouvre. Un nouveau démarrage repart en étoile.",
      trip: "Surcharge : le contact 95-96 du relais thermique F s'ouvre, toutes les bobines retombent. S1 reste sans effet tant que F n'est pas réarmé.",
    },
    short: {
      rest: "Repos : sous tension, Q fermé",
      press: "S1 : la bobine KM1 est alimentée",
      pull: "KM1 colle : 13-14 se ferme, KM2 alimenté par 55-56",
      star: "Auto-maintien, étoile, temporisation",
      switch: "55-56 s'ouvre au travail : KM2 retombe, 67-68 fermé",
      delta: "KM3 colle : triangle, KM2 verrouillé",
    },
    offList: ["stop", "trip"],
  },
  en: {
    title: "Star-delta starting",
    pageTitle: "Star-delta starting: diagrams and operation",
    hint: "Press Start S1 and follow both diagrams",
    group: "Starter control",
    stepMode: "Step by step",
    next: "Continue",
    logTitle: "Contacts switching over",
    ev: `{coil: (k, on) => k + " coil " + (on ? "energised" : "de-energised"), poles: (k, c) => k + " poles " + (c ? "closed" : "open"), timed: " (timed)", push: "", contact: (w, c, nc) => w + (c ? " closes" : " opens") + (nc ? " (NC contact)" : " (NO contact)")}`,
    start: "Start S1",
    stop: "Stop S0",
    fault: "Overload (F)",
    reset: "Reset F",
    panel: "CONNECTION",
    plate: "Δ 400 V · Y 690 V",
    plate2: "links removed",
    controlTitle: "Control circuit",
    powerTitle: "Power circuit",
    controlLabel: "Star-delta control circuit between L1 and N: F 95-96, S0, S1 with KM1 13-14 hold-in contact; KM1 coil; on-delay contact 55-56, KM3 21-22 and KM2 coil; on-delay contact 67-68, KM2 21-22 and KM3 coil. Conductors carrying current light up and the contacts switch over.",
    powerLabel: "Star-delta power circuit: Q, fuses, KM1 to U1, V1, W1; U2, V2, W2 through the thermal overload relay F to KM2 (star point) and to KM3 (U2 to V1, V2 to W1, W2 to U1).",
    keys: [
      { mark: "lit", label: "Conductor carrying current (moving dashes), energised coil (filled)" },
      { mark: "raised", label: "Panel: Q, KM1 with its timer block, KM2, KM3, interlock, F, S1, S0" },
      { mark: "dashed", label: "Cables to U1, V1, W1 (KM1) and to U2, V2, W2 (F, then KM2 or KM3)" },
    ],
    caption: "The motor, delta-connected for 400 V, has its terminal links removed: the connections are made by the contactors. First step: the press on S1 energises KM1, which holds itself in through 13-14; the on-delay contact 55-56, still closed, and the KM3 21-22 contact energise KM2, which joins U2, V2, W2: star connection, each winding at 400 / √3 ≈ 230 V, starting current divided by about 3. Second step: when the timer block fitted on KM1 times out, 55-56 opens and KM2 drops out; its 21-22 contact closes again and 67-68, now closed, energises KM3: U2 → V1, V2 → W1, W2 → U1, delta connection. KM2 and KM3 are never closed together (electrical and mechanical interlocks). Timer set here to 5 s (example value); current in multiples of In, typical values; contactor movement slowed down.",
    stageLabel: "Star-delta starter panel on a bench, connected by two cables to the terminal box of a motor. The control and power diagrams below the drawing move at the same time.",
    svgLabel: "Panel with switch-disconnector Q, contactors KM1 (timer block), KM2 and KM3, mechanical interlock, thermal overload relay F, push buttons S1 and S0, ammeter, Y and Δ indicator lamps; motor with six terminals U1, V1, W1, U2, V2, W2.",
    read: (st, v) => ({
      rest: "off · Q closed",
      press: "S1 pressed · KM1 coil energised",
      pull: `KM1 + KM2 · star · I ≈ ${v.i} × In`,
      star: `star · timer ${v.t} / ${v.delay} s · I ≈ ${v.i} × In`,
      switch: "star → delta changeover · I = 0",
      delta: `delta · I ≈ ${v.i} × In`,
      stop: "stopped by S0",
      trip: "F tripped · stopped",
    })[st],
    stages: {
      rest: "Off: the circuit is live and the switch-disconnector Q is closed. Contacts are drawn at rest: 55-56 (normally closed) is closed, 67-68 (normally open) is open. Press “Start S1”.",
      press: "Press on S1: current flows through F (95-96), S0 and S1 and energises the KM1 coil.",
      pull: "KM1 pulls in: its poles bring L1, L2, L3 to U1, V1, W1, and its 13-14 contact closes. Through 55-56, still closed, and KM3 21-22, the KM2 coil is energised: KM2 joins U2, V2, W2.",
      star: "S1 is released: KM1 stays energised through its 13-14 contact (hold-in). First step, star connection: each winding is at 230 V and the current is about three times lower than direct-on-line. The KM1 timer block is timing.",
      switch: "Timer runs out: 55-56 opens, the KM2 coil is no longer energised and KM2 drops out; its 21-22 contact closes again. 67-68 has closed: the KM3 coil is energised as soon as KM2 is open (electrical interlock).",
      delta: "Second step: KM3 pulls in and connects U2 to V1, V2 to W1, W2 to U1: delta connection, each winding at 400 V. The KM3 21-22 contact, now open, prevents KM2 from pulling in again.",
      stop: "Stopped by S0: the head of the circuit is broken, all coils drop out and 13-14 opens. A new start begins in star again.",
      trip: "Overload: the 95-96 contact of the thermal overload relay F opens and all coils drop out. S1 has no effect until F is reset.",
    },
    short: {
      rest: "Off: live, Q closed",
      press: "S1: KM1 coil energised",
      pull: "KM1 pulls in: 13-14 closes, KM2 fed through 55-56",
      star: "Hold-in, star, timing",
      switch: "55-56 opens on timing: KM2 drops out, 67-68 closed",
      delta: "KM3 pulls in: delta, KM2 locked out",
    },
    offList: ["stop", "trip"],
  },
};

buildStarterFigure(HERE, {
  figure: "etoile-triangle",
  name: "etoile-triangle",
  fig: "Fig 6",
  devices: [
    { type: "isolator", name: "Q", y: -176, z: 44 },
    { type: "contactor", name: "KM1", y: -82, z: 46, block: true },
    { type: "contactor", name: "KM2", y: -112, z: 46 },
    { type: "interlock", name: "", y: -127, z: 46 },
    { type: "contactor", name: "KM3", y: -142, z: 46 },
    { type: "relay", name: "F", y: -112, z: 18 },
  ],
  lamps: ["Y", "Δ"],
  terms: [["U1", "V1", "W1"], ["W2", "U2", "V2"]],
  faults: ["F"],
  cables: { 1: (e) => e.kind === "wire" && ["U1", "V1", "W1"].includes(e.b), 2: (e) => e.kind === "wire" && ["U2", "V2", "W2"].includes(e.a) },
  stage: STAGE,
  lampsLive: LAMPS,
  text: TEXT,
});
