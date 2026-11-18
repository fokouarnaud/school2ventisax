(() => {
const FIG = {"P":{"origin":[312.81912,291.74619],"scale":1.1082,"azimuth":28,"elevation":38},"F":{"o":[0,18,38]},"markS":118,"dial":{"x":-38.8,"y":-176,"z":98,"r":13,"max":8},"timerFace":{"x":-30.15,"y":-106,"z":49,"r":2.8},"plungerMove":-2,"flagMove":2.4,"btnMove":-1};
const NAME = "fractionne";
const TX = {dec:".",read:(st, v) => ({
      rest: "off · B1 closed",
      press: "S1 pressed · K1 and K1T coils energised",
      pull: `first step · I ≈ ${v.i} × In`,
      half: `first step · timer ${v.t} / ${v.delay} s · I ≈ ${v.i} × In`,
      timeout: "timer out · K1T closes its contact",
      full: `second step · K1 + K2 · I ≈ ${v.i} × In`,
      stop: "stopped by S0",
      trip: "F2 tripped · stopped",
      trip2: "B1 open · stopped",
    })[st],stages:{"rest":"Off: the circuit is live. Module B1 monitors the PTC sensors of the windings: while they are cool, its contact is closed. Press “Start S1”.","press":"Press on S1: current flows through B1, F1 (95-96), F2 (95-96), S0 and S1, and energises the K1 coil and the on-delay timer K1T coil.","pull":"K1 pulls in: its poles feed the first winding (terminals 1, 2, 3) through F1, and its 13-14 contact closes. K1T has started timing.","half":"S1 is released: K1 and K1T stay energised through 13-14 (hold-in). First step: a single winding, about 60 % of the direct-on-line inrush current. This must not last: 1 s at most.","timeout":"Timer runs out: the K1T timed contact closes and energises the K2 coil.","full":"Second step: K2 pulls in and feeds the second winding (terminals 4, 5, 6) through F2, in the same phase order: both windings turn the same way. The motor is already turning, so the second peak is lower.","stop":"Stopped by S0: the head of the circuit is broken; K1, K1T and K2 drop out.","trip":"Thermal fault on the second winding: the 95-96 contact of F2 opens and all coils drop out. The whole motor stops, not only the faulty winding.","trip2":"Overheating detected by the PTC sensors: the module B1 contact at the head of the circuit opens and all coils drop out."},fault:"Overload (F2)",reset:"Reset F2",fault2:"Overheating (B1)",reset2:"Sensors cooled",ev:{coil: (k, on) => k + " coil " + (on ? "energised" : "de-energised"), poles: (k, c) => k + " poles " + (c ? "closed" : "open"), timed: " (timed)", push: "", contact: (w, c, nc) => w + (c ? " closes" : " opens") + (nc ? " (NC contact)" : " (NO contact)")}};
const BLADE = {"noOpen":-26,"noClosed":0,"ncClosed":28,"ncOpen":-18};
const FAULTS = ["F2","B1"];
const CABLES = {"1":[6,19,32],"2":[12,25,38]};
const STAGE = (s, p) => {
  if (!s.contactors.some(p)) return s.pos.S1 > 0 ? "press" : "rest";
  if (p("K1") && p("K2")) return "full";
  if (p("K1") && s.pos.K1T > 0) return "timeout";
  if (p("K1") && s.pos.S1 > 0) return "pull";
  if (p("K1")) return "half";
  return "rest";
};
const LAMPS = (leds, s) => { leds["1"].toggleAttribute("data-on", s.pos.K1 >= 0.999); leds["2"].toggleAttribute("data-on", s.pos.K2 >= 0.999); };
const D = (() => {
const STARTERS = {"fractionne":{"control":{"view":[400,470],"sources":{"L1":[[40,34],[370,34]],"N":[[40,450],[370,450]]},"edges":[{"kind":"wire","a":"L1","b":"a1","pts":[[80,34],[80,48]]},{"kind":"no","a":"a1","b":"a2","pts":[[80,48],[80,78]],"by":"B1","op":"module","name":"B1"},{"kind":"wire","a":"a2","b":"a3","pts":[[80,78],[80,92]]},{"kind":"nc","a":"a3","b":"a4","pts":[[80,92],[80,122]],"by":"F1","op":"thermal","name":"F1","nums":["95","96"]},{"kind":"wire","a":"a4","b":"a5","pts":[[80,122],[80,136]]},{"kind":"nc","a":"a5","b":"a6","pts":[[80,136],[80,166]],"by":"F2","op":"thermal","name":"F2"},{"kind":"wire","a":"a6","b":"a7","pts":[[80,166],[80,180]]},{"kind":"nc","a":"a7","b":"a8","pts":[[80,180],[80,210]],"by":"S0","op":"push","name":"S0"},{"kind":"wire","a":"a8","b":"a9","pts":[[80,210],[80,226]]},{"kind":"wire","a":"a9","b":"a10","pts":[[80,226],[80,242]]},{"kind":"wire","a":"a9","b":"a11","pts":[[80,226],[140,226],[140,242]]},{"kind":"no","a":"a10","b":"a12","pts":[[80,242],[80,272]],"by":"S1","op":"push","name":"S1"},{"kind":"no","a":"a11","b":"a13","pts":[[140,242],[140,272]],"by":"K1","name":"K1","side":"right","nums":["13","14"],"role":"hold"},{"kind":"wire","a":"a12","b":"a14","pts":[[80,272],[80,288]]},{"kind":"wire","a":"a13","b":"a14","pts":[[140,272],[140,288],[80,288]]},{"kind":"wire","a":"a14","b":"a15","pts":[[80,288],[80,300]]},{"kind":"wire","a":"a15","b":"c1","pts":[[80,300],[80,384]]},{"kind":"coil","a":"c1","b":"n1","pts":[[80,384],[80,406]],"coil":"K1","side":"right"},{"kind":"wire","a":"n1","b":"N","pts":[[80,406],[80,450]]},{"kind":"wire","a":"a15","b":"a16","pts":[[80,300],[210,300]]},{"kind":"wire","a":"a16","b":"c2","pts":[[210,300],[210,384]]},{"kind":"coil","a":"c2","b":"n2","pts":[[210,384],[210,406]],"coil":"K1T","side":"right","timer":true},{"kind":"wire","a":"n2","b":"N","pts":[[210,406],[210,450]]},{"kind":"wire","a":"a16","b":"b1","pts":[[210,300],[330,300],[330,330]]},{"kind":"no","a":"b1","b":"b2","pts":[[330,330],[330,360]],"by":"K1T","op":"delay","name":"K1T"},{"kind":"wire","a":"b2","b":"c3","pts":[[330,360],[330,384]]},{"kind":"coil","a":"c3","b":"n3","pts":[[330,384],[330,406]],"coil":"K2","side":"left"},{"kind":"wire","a":"n3","b":"N","pts":[[330,406],[330,450]]}],"dots":[[80,226],[80,288],[80,300],[210,300]],"timerAt":[262,318]},"power":{"view":[380,380],"sources":{"L1":[[70,26]],"L2":[[105,26]],"L3":[[140,26]]},"edges":[{"kind":"wire","a":"L1","b":"t1","pts":[[70,26],[70,50]]},{"kind":"wire","a":"t1","b":"a1","pts":[[70,50],[70,110]]},{"kind":"no","a":"a1","b":"b1","pts":[[70,110],[70,140]],"by":"K1","pole":0},{"kind":"wire","a":"b1","b":"c1","pts":[[70,140],[70,160]]},{"kind":"heater","a":"c1","b":"d1","pts":[[70,160],[70,184]]},{"kind":"wire","a":"d1","b":"e1","pts":[[70,184],[70,220],[70,256],[160,296]]},{"kind":"winding","a":"e1","b":"star1","pts":[[160,296],[180,314]],"winding":"1"},{"kind":"wire","a":"t1","b":"A1","pts":[[70,50],[240,50],[240,110]]},{"kind":"no","a":"A1","b":"B1","pts":[[240,110],[240,140]],"by":"K2","pole":0},{"kind":"wire","a":"B1","b":"C1","pts":[[240,140],[240,160]]},{"kind":"heater","a":"C1","b":"D1","pts":[[240,160],[240,184]]},{"kind":"wire","a":"D1","b":"E1","pts":[[240,184],[240,220],[240,244],[206,282]]},{"kind":"winding","a":"E1","b":"star2","pts":[[206,282],[200,314]],"winding":"2"},{"kind":"wire","a":"L2","b":"t2","pts":[[105,26],[105,64]]},{"kind":"wire","a":"t2","b":"a2","pts":[[105,64],[105,110]]},{"kind":"no","a":"a2","b":"b2","pts":[[105,110],[105,140]],"by":"K1","pole":1},{"kind":"wire","a":"b2","b":"c2","pts":[[105,140],[105,160]]},{"kind":"heater","a":"c2","b":"d2","pts":[[105,160],[105,184]]},{"kind":"wire","a":"d2","b":"e2","pts":[[105,184],[105,220],[105,250],[166,288]]},{"kind":"winding","a":"e2","b":"star1","pts":[[166,288],[180,314]],"winding":"1"},{"kind":"wire","a":"t2","b":"A2","pts":[[105,64],[275,64],[275,110]]},{"kind":"no","a":"A2","b":"B2","pts":[[275,110],[275,140]],"by":"K2","pole":1},{"kind":"wire","a":"B2","b":"C2","pts":[[275,140],[275,160]]},{"kind":"heater","a":"C2","b":"D2","pts":[[275,160],[275,184]]},{"kind":"wire","a":"D2","b":"E2","pts":[[275,184],[275,220],[275,250],[214,288]]},{"kind":"winding","a":"E2","b":"star2","pts":[[214,288],[200,314]],"winding":"2"},{"kind":"wire","a":"L3","b":"t3","pts":[[140,26],[140,78]]},{"kind":"wire","a":"t3","b":"a3","pts":[[140,78],[140,110]]},{"kind":"no","a":"a3","b":"b3","pts":[[140,110],[140,140]],"by":"K1","pole":2},{"kind":"wire","a":"b3","b":"c3","pts":[[140,140],[140,160]]},{"kind":"heater","a":"c3","b":"d3","pts":[[140,160],[140,184]]},{"kind":"wire","a":"d3","b":"e3","pts":[[140,184],[140,220],[140,244],[174,282]]},{"kind":"winding","a":"e3","b":"star1","pts":[[174,282],[180,314]],"winding":"1"},{"kind":"wire","a":"t3","b":"A3","pts":[[140,78],[310,78],[310,110]]},{"kind":"no","a":"A3","b":"B3","pts":[[310,110],[310,140]],"by":"K2","pole":2},{"kind":"wire","a":"B3","b":"C3","pts":[[310,140],[310,160]]},{"kind":"heater","a":"C3","b":"D3","pts":[[310,160],[310,184]]},{"kind":"wire","a":"D3","b":"E3","pts":[[310,184],[310,220],[310,256],[220,296]]},{"kind":"winding","a":"E3","b":"star2","pts":[[220,296],[200,314]],"winding":"2"}],"dots":[[70,50],[105,64],[140,78]],"motor":{"c":[190,312],"r":36,"name":"M1","terms":[]},"heaterBox":[{"x":58,"y":154,"w":94,"h":36,"name":"F1","at":[36,180]},{"x":228,"y":154,"w":94,"h":36,"name":"F2","at":[346,180]}],"poles":{"K1":[[64,127],[134,127],[36,130]],"K2":[[234,127],[304,127],[346,130]]}},"contactors":["K1","K2"],"timer":{"name":"K1T","runsWhen":"coil:K1T","delay":1},"slow":4,"faults":["F1","F2","B1"]}};
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
const reached = new Set();
for (const i of set) for (const n of [schema.edges[i].a, schema.edges[i].b]) if (terminals.has(n)) reached.add(n);
if (reached.size < 2) set = new Set();
return { live, coils, flow: set };
}
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
const tm = def.timer;
const running = tm.runsWhen.startsWith("coil:") ? coilOn[tm.runsWhen.slice(5)] : pos[tm.runsWhen] >= 0.999;
st.timerRun = running ? st.timerRun + dt / def.slow : 0;
target[tm.name] = running && st.timerRun >= tm.delay ? 1 : 0;
for (const k of Object.keys(target)) {
const speed = k === "S1" || k === "S0" || def.faults.includes(k) ? TIMING.button : k === tm.name ? TIMING.delayContact : TIMING.armature;
const d = target[k] - pos[k];
pos[k] = Math.abs(d) <= dt / speed ? target[k] : pos[k] + Math.sign(d) * (dt / speed);
}
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
return { STARTERS, solve, TIMING, createStarter };
})();
const Ld = (() => {
const f = (v) => (Math.round(v * 10) / 10).toString();
const P = (pts) => pts.map(([x, y], i) => `${i ? "L" : "M"}${f(x)} ${f(y)}`).join("");
const text = (x, y, s, { size = 14, anchor = "middle", cls = "", weight } = {}) =>
`<text class="ld-t${cls ? ` ${cls}` : ""}" x="${f(x)}" y="${f(y)}" font-size="${size}" text-anchor="${anchor}"${weight ? ` font-weight="${weight}"` : ""}>${s}</text>`;
const path = (d, cls = "ld-s") => `<path class="${cls}" d="${d}"/>`;
const BLADE = { noOpen: -26, noClosed: 0, ncClosed: 28, ncOpen: -18 };
function contact(e, i) {
const [[x, ya], [, yb]] = e.pts;
const top = Math.min(ya, yb), bot = Math.max(ya, yb), mid = (top + bot) / 2;
const o = [`<circle class="ld-halo" cx="${x}" cy="${mid}" r="19"/>`];
if (e.kind === "nc") o.push(path(`M${x} ${top}H${x + 13}`));
const rest = e.kind === "no" ? BLADE.noOpen : BLADE.ncClosed;
o.push(`<path class="ld-s ld-blade" data-e="${i}" data-px="${x}" data-py="${bot}" d="M${x} ${bot}V${top}" transform="rotate(${rest} ${x} ${bot})"/>`);
o.push(`<circle class="ld-pin" cx="${x}" cy="${top}" r="2.2"/><circle class="ld-pin" cx="${x}" cy="${bot}" r="2.2"/>`);
const deco = [];
if (e.op === "push") {
const from = e.kind === "nc" ? x + 7 : x - 6;
deco.push(path(`M${from} ${mid + 2}H${x - 24}`, "ld-s ld-link"), path(`M${x - 24} ${mid - 5}V${mid + 9}M${x - 24} ${mid - 5}H${x - 29}M${x - 24} ${mid + 9}H${x - 29}`, "ld-s ld-thin"));
o.push(`<g class="ld-act" data-by="${e.by}">${deco.join("")}</g>`);
o.push(text(x - 32, mid + 7, e.name, { anchor: "end" }));
} else if (e.op === "thermal") {
o.push(path(`M${x + 7} ${mid + 2}H${x - 22}`, "ld-s ld-link"), path(`M${x - 22} ${mid + 8}V${mid - 4}H${x - 32}V${mid + 8}`, "ld-s ld-thin"));
o.push(text(x - 36, mid + 7, e.name, { anchor: "end" }));
} else if (e.op === "module") {
o.push(path(`M${x - 6} ${mid + 2}H${x - 26}`, "ld-s ld-link"), `<rect class="ld-s ld-thin ld-box" x="${x - 44}" y="${mid - 7}" width="18" height="18"/>`);
o.push(text(x - 50, mid + 7, e.name, { anchor: "end" }));
} else if (e.op === "delay") {
const from = e.kind === "nc" ? x + 7 : x - 6;
o.push(path(`M${from} ${mid + 2}H${x + 26}`, "ld-s ld-link"), path(`M${x + 30} ${mid - 6}A9 9 0 0 0 ${x + 30} ${mid + 10}`, "ld-s ld-thin"));
o.push(text(x - 16, mid + 5, e.name, { anchor: "end" }));
if (e.nums) o.push(text(x + 30, top - 6, e.nums.join("-"), { size: 12, weight: "normal", anchor: "middle" }));
} else if (e.name || e.nums) {
if (e.side === "right") {
if (e.name) o.push(text(x + 20, mid + 1, e.name, { anchor: "start" }));
} else if (e.name && e.pole === undefined) o.push(text(x - 16, mid + 5, e.name, { anchor: "end" }));
}
if (e.nums && e.op !== "delay") {
const nx = e.kind === "nc" ? x + 17 : x + 9;
o.push(text(nx, top + 6, e.nums[0], { size: 12, weight: "normal", anchor: "start" }), text(nx, bot + 4, e.nums[1], { size: 12, weight: "normal", anchor: "start" }));
}
return o.join("");
}
function coil(e, i) {
const [[x, y]] = e.pts;
const o = [`<rect class="ld-s ld-coil" data-coil="${e.coil}" x="${x - 17}" y="${y}" width="34" height="22"/>`];
if (e.timer) o.push(path(`M${x - 17} ${y}L${x + 17} ${y + 22}M${x + 17} ${y}L${x - 17} ${y + 22}`, "ld-s ld-thin"));
o.push(e.side === "left" ? text(x - 24, y + 16, e.coil, { anchor: "end" }) : text(x + 22, y + 16, e.coil, { anchor: "start" }));
return o.join("");
}
function element(e, i) {
let inner;
if (e.kind === "wire") inner = path(P(e.pts), "ld-s ld-w");
else if (e.kind === "no" || e.kind === "nc") inner = contact(e, i);
else if (e.kind === "coil") inner = coil(e, i);
else if (e.kind === "fuse") {
const [[x, y0], [, y1]] = e.pts;
inner = `<rect class="ld-s ld-thin ld-box" x="${x - 6}" y="${y0}" width="12" height="${y1 - y0}"/>` + path(`M${x} ${y0}V${y1}`, "ld-s ld-thin ld-w");
} else if (e.kind === "heater") {
const [[x, y0], [, y1]] = e.pts;
inner = `<rect class="ld-s ld-thin ld-box" x="${x - 8}" y="${y0}" width="16" height="${y1 - y0}"/>` + path(`M${x - 4} ${y0 + 17}V${y0 + 8}H${x + 4}V${y0 + 17}`, "ld-s ld-thin ld-w");
} else if (e.kind === "winding") {
const [[x0, y0], [x1, y1]] = e.pts;
if (x0 === x1) {
const m = (y0 + y1) / 2;
inner = path(`M${x0} ${y0}V${m - 11}M${x0} ${m + 11}V${y1}`, "ld-s ld-w") + `<rect class="ld-s ld-thin ld-wind" x="${x0 - 4}" y="${m - 11}" width="8" height="22"/>`;
} else inner = path(P(e.pts), "ld-s ld-w ld-wind-line");
}
return `<g class="ld-e" data-e="${i}" data-k="${e.kind}">${inner}</g>`;
}
function schematicBody(schema) {
const [w, h] = schema.view;
const o = [`<rect class="ld-paper" width="${w}" height="${h}" rx="10"/>`];
for (const [name, pts] of Object.entries(schema.sources)) {
if (pts.length === 2) {
o.push(`<g class="ld-rail" data-src="${name}">${path(P(pts), `ld-s ld-w ld-rail-${name === "N" ? "n" : "l"}`)}</g>`);
o.push(text(pts[0][0] - 6, pts[0][1] + 5, name, { anchor: "end" }));
} else o.push(text(pts[0][0], pts[0][1] - 8, name));
}
if (schema.motor) {
const { c: [cx, cy], r, name, terms } = schema.motor;
o.push(`<circle class="ld-s ld-motor" cx="${cx}" cy="${cy}" r="${r}"/>`);
for (const [t, x, y] of terms) o.push(text(x, y, t, { size: 13, weight: "normal", anchor: "end" }));
}
schema.edges.forEach((e, i) => o.push(element(e, i)));
for (const [x, y] of schema.dots || []) o.push(`<circle class="ld-dot" cx="${x}" cy="${y}" r="3.5"/>`);
if (schema.motor && schema.motor.terms.length) {
o.push(text(schema.coupling[0], schema.coupling[1] - 16, schema.motor.name));
o.push(text(schema.coupling[0], schema.coupling[1] + 8, "", { size: 18, cls: "ld-coupling" }));
}
if (schema.edges.some((e) => e.winding === "1")) {
o.push(`<circle class="ld-dot ld-star" cx="180" cy="314" r="2.6"/><circle class="ld-dot ld-star" cx="200" cy="314" r="2.6"/>`);
o.push(text(146, 326, "M1", { anchor: "end" }), text(190, 340, "3~", { size: 12, weight: "normal" }));
}
const boxes = schema.heaterBox ? [].concat(schema.heaterBox) : [];
for (const b of boxes) o.push(`<rect class="ld-s ld-group" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}"/>`, text(b.at[0], b.at[1], b.name));
for (const [name, [a, b, at]] of Object.entries(schema.poles || {})) {
o.push(path(`M${a[0]} ${a[1]}H${b[0]}`, "ld-s ld-link"));
o.push(text(at[0], at[1], name));
}
if (schema.timerAt) {
const [tx, ty] = schema.timerAt;
o.push(`<g class="ld-timerbox"><rect class="ld-track" x="${tx - 34}" y="${ty + 4}" width="68" height="5" rx="2.5"/><rect class="ld-bar" x="${tx - 34}" y="${ty + 4}" width="0" height="5" rx="2.5"/>${text(tx, ty, "", { size: 12, cls: "ld-timer" })}</g>`);
}
if (schema.interlock) {
const [[x0, y], [x1]] = schema.interlock;
const m = (x0 + x1) / 2;
o.push(path(`M${x0} ${y}H${x1}`, "ld-s ld-link"), `<path class="ld-s ld-thin ld-box" d="M${m - 7} ${y - 6}H${m + 7}L${m} ${y + 6}Z"/>`);
}
return o.join("");
}
return { BLADE, schematicBody };
})();

function ladder(svgEl, schema) {
svgEl.innerHTML = Ld.schematicBody(schema);
const groups = [...svgEl.querySelectorAll(".ld-e")];
const blades = [...svgEl.querySelectorAll(".ld-blade")];
const coils = [...svgEl.querySelectorAll(".ld-coil")];
const acts = [...svgEl.querySelectorAll(".ld-act")];
const winds = [...svgEl.querySelectorAll(".ld-wind, .ld-wind-line")];
const NS = "http://www.w3.org/2000/svg";
// tirets du courant : copie de chaque fil, ajoutée ici pour ne pas alourdir le fragment
for (const g of groups) for (const p of g.querySelectorAll(".ld-w")) { const d = document.createElementNS(NS, "path"); d.setAttribute("class", "ld-dash"); d.setAttribute("d", p.getAttribute("d")); g.appendChild(d); }
const angles = blades.map(() => null);
// état de chaque contact et de chaque bobine : un changement est mis en relief et rapporté (journal, pas à pas)
const was = new Map(), until = new Map();
const closedOf = (e, p) => (e.kind === "no" ? p >= 0.999 : p <= 0.001);
return function apply(res, pos, now) {
const events = [];
groups.forEach((g, i) => {
const e = schema.edges[i];
const live = res.live.has(e.a) && res.live.has(e.b);
g.toggleAttribute("data-live", live);
g.toggleAttribute("data-flow", res.flow.has(i));
let state = null;
if (e.kind === "no" || e.kind === "nc") state = closedOf(e, pos[e.by] ?? 0);
else if (e.kind === "coil") state = !!res.coils[e.coil];
if (state === null) return;
if (was.has(i) && was.get(i) !== state) { until.set(i, now + 1.6); events.push({ e, closed: state }); }
was.set(i, state);
g.toggleAttribute("data-changed", (until.get(i) || 0) > now);
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
return events;
};
}

const still = matchMedia("(prefers-reduced-motion: reduce)");
const C = FIG, T = TX, P = C.P;
const scope = document.querySelector('.live-figure[data-figure="fractionne-schemas"]') || document;
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
let sim, shown = 0, angle = 0, frame = 0, last = 0, visible = false, ended = null, stage0 = "rest", stepMode = false, paused = false;
const log = scope.querySelector(".st-log");
const timerText = scope.querySelector(".ld-timer");
const timerBar = scope.querySelector(".ld-bar");
// une ligne par contact qui bascule ou bobine qui change d'état : « KM1 13-14 se ferme », « KM1 55-56 (temporisé) s'ouvre »
function evText(e, closed) {
if (e.kind === "coil") return T.ev.coil(e.coil, closed);
if (e.pole !== undefined) return T.ev.poles(e.by, closed);
const who = (e.name || e.by) + (e.nums ? " " + e.nums.join("-") : "") + (e.op === "delay" ? T.ev.timed : "") + (e.op === "push" ? T.ev.push : "");
return T.ev.contact(who, closed, e.kind === "nc");
}
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
const now = sim.st.t;
const evs = [...ctrl(cr, sim.pos, now), ...pwr(pr, sim.pos, now).filter((v) => v.e.pole === 0 && v.e.by !== "Q")];
if (evs.length) {
for (const v of evs) {
const li = document.createElement("li");
li.textContent = "t = " + fmt(now / sim.def.slow, 2) + " s · " + evText(v.e, v.closed);
log.appendChild(li);
}
while (log.children.length > 8) log.firstElementChild.remove();
log.hidden = false;
if (stepMode && !paused) { paused = true; buttons.next.disabled = false; }
}
if (timerText) {
const tt = Math.min(s.timer, s.def.timer.delay);
timerText.textContent = s.timer > 0 ? s.def.timer.name + " : " + fmt(tt, 1) + " / " + fmt(s.def.timer.delay, 0) + " s" : "";
timerBar.setAttribute("width", (68 * tt / s.def.timer.delay).toFixed(1));
}
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
// pas fins, arrêtés au premier basculement : chaque contact qui change est montré seul, dans l'ordre réel
const n = 12;
const sig = () => Object.keys(sim.pos).map((k) => (sim.pos[k] >= 0.999 ? 2 : sim.pos[k] <= 0.001 ? 0 : 1)).join("") + JSON.stringify(sim.snapshot().coils);
const before = sig();
for (let i = 0; i < n; i++) { sim.step(dt / n); if (sig() !== before) break; }
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
if (!paused) step(still.matches ? dt * 3 : dt);
draw();
frame = visible && !paused && busy() ? requestAnimationFrame(tick) : 0;
if (!frame) last = 0;
}
function run() { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } }
function start() { if (!sim.def.contactors.some((c) => sim.pos[c] > 0)) { log.textContent = ""; log.hidden = true; } ended = null; sim.press("S1"); run(); }
function resume() { paused = false; buttons.next.disabled = true; run(); }
function toggleStep() {
stepMode = !stepMode;
buttons.step.setAttribute("aria-pressed", stepMode ? "true" : "false");
if (!stepMode && paused) resume();
}
function stop() { if (sim.def.contactors.some((c) => sim.pos[c] > 0)) ended = "stop"; sim.press("S0"); run(); }
function fault(f, tag) {
const on = !sim.st.tripped[f];
sim.trip(f, on);
if (on) ended = tag; else if (ended === tag) ended = null;
run(); draw();
}
buttons.start.addEventListener("click", start);
buttons.step.addEventListener("click", toggleStep);
buttons.next.addEventListener("click", resume);
buttons.stop.addEventListener("click", stop);
buttons.fault.addEventListener("click", () => fault(FAULTS[0], "trip"));
if (buttons.fault2) buttons.fault2.addEventListener("click", () => fault(FAULTS[1], "trip2"));
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
window.__st = { start, stop, fault, toggleStep, resume, paused: () => paused, sim: () => sim, state: () => ({ ...sim.snapshot(), stage: stageOf({ ...sim.snapshot(), def: sim.def, contactors: sim.def.contactors }) }) };
draw();

})();
