// Figure interactive (skill anatomy) : démarrage fractionné (part winding), schémas et fonctionnement.
// Partie 3, module 6, section « Repérage et schémas » (p3/m6/02-reperage), après les schémas du cours.
// Le coffret (module de protection B1, K1, temporisateur K1T, K2, relais thermiques F1 et F2, S1, S0, ampèremètre)
// et le compresseur à deux bobinages s'animent en même temps que les schémas de commande et de puissance :
// impulsion sur S1, K1 et K1T alimentés, auto-maintien par K1 13-14, 1er temps sur le premier bobinage, contact de
// K1T qui se ferme au bout de 1 s au maximum, K2 et le second bobinage ; arrêt par S0, par F1 ou F2, ou par B1.
// Usage : node figures/fractionne-schemas/build.mjs
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildStarterFigure } from "../_kit/starter-figure.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

const STAGE = `(s, p) => {
  if (!s.contactors.some(p)) return s.pos.S1 > 0 ? "press" : "rest";
  if (p("K1") && p("K2")) return "full";
  if (p("K1") && s.pos.K1T > 0) return "timeout";
  if (p("K1") && s.pos.S1 > 0) return "pull";
  if (p("K1")) return "half";
  return "rest";
}`;
const LAMPS = `(leds, s) => { leds["1"].toggleAttribute("data-on", s.pos.K1 >= 0.999); leds["2"].toggleAttribute("data-on", s.pos.K2 >= 0.999); }`;

const TEXT = {
  fr: {
    title: "Démarrage fractionné",
    pageTitle: "Démarrage fractionné (part winding) : schémas et fonctionnement",
    hint: "Appuyer sur Marche S1, suivre les deux schémas",
    group: "Commande du démarreur",
    stepMode: "Pas à pas",
    next: "Continuer",
    logTitle: "Contacts qui basculent",
    ev: `{coil: (k, on) => "bobine " + k + (on ? " alimentée" : " n'est plus alimentée"), poles: (k, c) => "pôles de " + k + (c ? " fermés" : " ouverts"), timed: " (temporisé)", push: "", contact: (w, c, nc) => w + (c ? " se ferme" : " s'ouvre") + (nc ? " (contact à ouverture)" : " (contact à fermeture)")}`,
    start: "Marche S1",
    stop: "Arrêt S0",
    fault: "Surcharge (F2)",
    reset: "Réarmer F2",
    fault2: "Surchauffe (B1)",
    reset2: "Sondes refroidies",
    panel: "BOBINAGES",
    plate: "3~ 400 V · 2 × 50 %",
    plate2: "K1 : 1-2-3 · K2 : 4-5-6",
    controlTitle: "Circuit de commande",
    powerTitle: "Circuit de puissance",
    controlLabel: "Circuit de commande du démarrage fractionné entre L1 et N : contact du module B1, F1 et F2 95-96, S0, S1 avec auto-maintien K1 13-14 ; bobine K1 ; bobine du temporisateur K1T ; contact temporisé de K1T et bobine K2. Les conducteurs parcourus par un courant s'allument et les contacts basculent.",
    powerLabel: "Circuit de puissance du démarrage fractionné : L1, L2, L3 alimentent le premier bobinage par K1 et F1, le second par K2 et F2, dans le même ordre des phases ; chaque bobinage est câblé en étoile.",
    keys: [
      { mark: "lit", label: "Conducteur parcouru par un courant (tirets qui avancent), bobine alimentée (pleine)" },
      { mark: "raised", label: "Coffret : B1, K1, temporisateur K1T, K2, F1, F2, S1, S0" },
      { mark: "dashed", label: "Câbles vers les bornes 1-2-3 (K1, 1er bobinage) et 4-5-6 (K2, 2e bobinage)" },
    ],
    caption: "Le compresseur possède deux bobinages indépendants, câblés chacun en étoile. L'impulsion sur S1 traverse le contact du module de protection B1, les contacts 95-96 de F1 et de F2 et S0, puis alimente la bobine de K1 et celle du temporisateur K1T ; K1 s'auto-maintient par 13-14. 1er temps : K1 alimente le premier bobinage (bornes 1, 2, 3), qui n'absorbe qu'environ 60 % du courant d'appel du démarrage direct. 2e temps : au bout de la temporisation (1 s au maximum), le contact de K1T se ferme et alimente K2, qui met le second bobinage (bornes 4, 5, 6) sous tension, dans le même ordre des phases. Un défaut thermique sur F1 ou F2, ou une surchauffe signalée par les sondes PTC à B1, arrête tout le moteur. Valeurs typiques ; démarrage montré 4 fois ralenti.",
    stageLabel: "Coffret de démarrage fractionné sur un banc, relié par deux câbles au bornier 1 à 6 d'un compresseur à deux bobinages. Les schémas de commande et de puissance, sous le dessin, s'animent en même temps.",
    svgLabel: "Coffret avec module de protection B1, contacteurs K1 et K2, temporisateur K1T, relais thermiques F1 et F2, boutons S1 et S0, ampèremètre, voyants des bobinages 1 et 2 ; compresseur à bornier 1 à 6.",
    read: (st, v) => ({
      rest: "repos · B1 fermé",
      press: "S1 enfoncé · bobines K1 et K1T alimentées",
      pull: `1er temps · I ≈ ${v.i} × In`,
      half: `1er temps · tempo ${v.t} / ${v.delay} s · I ≈ ${v.i} × In`,
      timeout: "fin de tempo · K1T ferme son contact",
      full: `2e temps · K1 + K2 · I ≈ ${v.i} × In`,
      stop: "arrêt par S0",
      trip: "F2 déclenché · arrêt",
      trip2: "B1 ouvert · arrêt",
    })[st],
    stages: {
      rest: "Repos : le circuit est sous tension. Le module B1 surveille les sondes PTC des bobinages : tant qu'elles sont froides, son contact est fermé. Appuyez sur « Marche S1 ».",
      press: "Impulsion sur S1 : le courant passe par B1, F1 (95-96), F2 (95-96), S0 et S1, et alimente la bobine de K1 et celle du temporisateur K1T.",
      pull: "K1 colle : ses pôles alimentent le premier bobinage (bornes 1, 2, 3) par F1, et son contact 13-14 se ferme. La temporisation de K1T a commencé.",
      half: "S1 est relâché : K1 et K1T restent alimentés par 13-14 (auto-maintien). 1er temps : un seul bobinage, environ 60 % du courant d'appel du démarrage direct. Ce régime ne doit pas durer : 1 s au maximum.",
      timeout: "Fin de la temporisation : le contact temporisé de K1T se ferme au travail et alimente la bobine de K2.",
      full: "2e temps : K2 colle et alimente le second bobinage (bornes 4, 5, 6) par F2, dans le même ordre des phases : les deux bobinages tournent dans le même sens. Le moteur, déjà lancé, ne produit qu'un second pic plus faible.",
      stop: "Arrêt par S0 : la tête du circuit est coupée, K1, K1T et K2 retombent.",
      trip: "Défaut thermique sur le second bobinage : le contact 95-96 de F2 s'ouvre, toutes les bobines retombent. Tout le moteur s'arrête, pas seulement le bobinage en défaut.",
      trip2: "Surchauffe détectée par les sondes PTC : le contact du module B1 s'ouvre en tête du circuit, toutes les bobines retombent.",
    },
    short: {
      rest: "Repos : sous tension, B1 fermé",
      press: "S1 : bobines K1 et K1T alimentées",
      pull: "K1 colle : 13-14 se ferme, 1er bobinage alimenté",
      half: "Auto-maintien, 1er temps, temporisation ≤ 1 s",
      timeout: "Le contact de K1T se ferme : K2 alimenté",
      full: "K2 colle : 2e temps, les deux bobinages",
    },
    offList: ["stop", "trip", "trip2"],
  },
  en: {
    title: "Part-winding starting",
    pageTitle: "Part-winding starting: diagrams and operation",
    hint: "Press Start S1 and follow both diagrams",
    group: "Starter control",
    stepMode: "Step by step",
    next: "Continue",
    logTitle: "Contacts switching over",
    ev: `{coil: (k, on) => k + " coil " + (on ? "energised" : "de-energised"), poles: (k, c) => k + " poles " + (c ? "closed" : "open"), timed: " (timed)", push: "", contact: (w, c, nc) => w + (c ? " closes" : " opens") + (nc ? " (NC contact)" : " (NO contact)")}`,
    start: "Start S1",
    stop: "Stop S0",
    fault: "Overload (F2)",
    reset: "Reset F2",
    fault2: "Overheating (B1)",
    reset2: "Sensors cooled",
    panel: "WINDINGS",
    plate: "3~ 400 V · 2 × 50 %",
    plate2: "K1: 1-2-3 · K2: 4-5-6",
    controlTitle: "Control circuit",
    powerTitle: "Power circuit",
    controlLabel: "Part-winding control circuit between L1 and N: protection module B1 contact, F1 and F2 95-96, S0, S1 with K1 13-14 hold-in contact; K1 coil; on-delay timer K1T coil; K1T timed contact and K2 coil. Conductors carrying current light up and the contacts switch over.",
    powerLabel: "Part-winding power circuit: L1, L2, L3 feed the first winding through K1 and F1, the second through K2 and F2, in the same phase order; each winding is star-connected.",
    keys: [
      { mark: "lit", label: "Conductor carrying current (moving dashes), energised coil (filled)" },
      { mark: "raised", label: "Panel: B1, K1, on-delay timer K1T, K2, F1, F2, S1, S0" },
      { mark: "dashed", label: "Cables to terminals 1-2-3 (K1, first winding) and 4-5-6 (K2, second winding)" },
    ],
    caption: "The compressor has two independent windings, each star-connected. The press on S1 passes through the protection module B1 contact, the 95-96 contacts of F1 and F2 and S0, then energises the K1 coil and the on-delay timer K1T coil; K1 holds itself in through 13-14. First step: K1 feeds the first winding (terminals 1, 2, 3), which draws only about 60 % of the direct-on-line inrush current. Second step: when the timer runs out (1 s at most), the K1T contact closes and energises K2, which feeds the second winding (terminals 4, 5, 6) in the same phase order. A thermal fault on F1 or F2, or overheating reported to B1 by the PTC sensors, stops the whole motor. Typical values; start shown 4 times slower.",
    stageLabel: "Part-winding starter panel on a bench, connected by two cables to terminals 1 to 6 of a two-winding compressor. The control and power diagrams below the drawing move at the same time.",
    svgLabel: "Panel with protection module B1, contactors K1 and K2, on-delay timer K1T, thermal overload relays F1 and F2, push buttons S1 and S0, ammeter, winding 1 and 2 indicator lamps; compressor with terminals 1 to 6.",
    read: (st, v) => ({
      rest: "off · B1 closed",
      press: "S1 pressed · K1 and K1T coils energised",
      pull: `first step · I ≈ ${v.i} × In`,
      half: `first step · timer ${v.t} / ${v.delay} s · I ≈ ${v.i} × In`,
      timeout: "timer out · K1T closes its contact",
      full: `second step · K1 + K2 · I ≈ ${v.i} × In`,
      stop: "stopped by S0",
      trip: "F2 tripped · stopped",
      trip2: "B1 open · stopped",
    })[st],
    stages: {
      rest: "Off: the circuit is live. Module B1 monitors the PTC sensors of the windings: while they are cool, its contact is closed. Press “Start S1”.",
      press: "Press on S1: current flows through B1, F1 (95-96), F2 (95-96), S0 and S1, and energises the K1 coil and the on-delay timer K1T coil.",
      pull: "K1 pulls in: its poles feed the first winding (terminals 1, 2, 3) through F1, and its 13-14 contact closes. K1T has started timing.",
      half: "S1 is released: K1 and K1T stay energised through 13-14 (hold-in). First step: a single winding, about 60 % of the direct-on-line inrush current. This must not last: 1 s at most.",
      timeout: "Timer runs out: the K1T timed contact closes and energises the K2 coil.",
      full: "Second step: K2 pulls in and feeds the second winding (terminals 4, 5, 6) through F2, in the same phase order: both windings turn the same way. The motor is already turning, so the second peak is lower.",
      stop: "Stopped by S0: the head of the circuit is broken; K1, K1T and K2 drop out.",
      trip: "Thermal fault on the second winding: the 95-96 contact of F2 opens and all coils drop out. The whole motor stops, not only the faulty winding.",
      trip2: "Overheating detected by the PTC sensors: the module B1 contact at the head of the circuit opens and all coils drop out.",
    },
    short: {
      rest: "Off: live, B1 closed",
      press: "S1: K1 and K1T coils energised",
      pull: "K1 pulls in: 13-14 closes, first winding fed",
      half: "Hold-in, first step, timing ≤ 1 s",
      timeout: "K1T contact closes: K2 energised",
      full: "K2 pulls in: second step, both windings",
    },
    offList: ["stop", "trip", "trip2"],
  },
};

buildStarterFigure(HERE, {
  figure: "fractionne-schemas",
  name: "fractionne",
  fig: "Fig 9",
  devices: [
    { type: "module", name: "B1", y: -176, z: 44 },
    { type: "contactor", name: "K1", y: -82, z: 46 },
    { type: "timer", name: "K1T", y: -106, z: 46 },
    { type: "contactor", name: "K2", y: -130, z: 46 },
    { type: "relay", name: "F1", y: -82, z: 18 },
    { type: "relay", name: "F2", y: -130, z: 18 },
  ],
  lamps: ["1", "2"],
  terms: [["1", "2", "3"], ["4", "5", "6"]],
  faults: ["F2", "B1"],
  cables: { 1: (e) => e.winding === "1", 2: (e) => e.winding === "2" },
  stage: STAGE,
  lampsLive: LAMPS,
  text: TEXT,
});
