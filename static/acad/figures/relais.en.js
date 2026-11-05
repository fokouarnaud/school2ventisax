(() => {

const READOUT = {
  fr: (C, s, lamp) => {
    const parts = [s.coil ? "bobine 24 V · 16,7 mA" : "bobine 0 V"];
    for (const p of C.poles) {
      if (C.changeover) parts.push(s.work ? p.n + "1-" + p.n + "4 fermé" : s.rest ? p.n + "1-" + p.n + "2 fermé" : p.n + "1 en mouvement");
      else parts.push(s.work ? p.n + "1-" + p.n + "4 fermé" : p.n + "1-" + p.n + "4 ouvert");
    }
    parts.push(C.lamps.filter((n) => lamp[n]).map((n) => n + " allumé").join(", ") || "voyants éteints");
    return parts.join(" · ");
  },
  en: (C, s, lamp) => {
    const parts = [s.coil ? "coil 24 V · 16.7 mA" : "coil 0 V"];
    for (const p of C.poles) {
      if (C.changeover) parts.push(s.work ? p.n + "1-" + p.n + "4 closed" : s.rest ? p.n + "1-" + p.n + "2 closed" : p.n + "1 moving");
      else parts.push(s.work ? p.n + "1-" + p.n + "4 closed" : p.n + "1-" + p.n + "4 open");
    }
    parts.push(C.lamps.filter((n) => lamp[n]).map((n) => n + " on").join(", ") || "lights off");
    return parts.join(" · ");
  },
};
const FIGS = {"spst":{"type":"spst","lang":"en","P":{"origin":[344.9887417858524,229.52650692764902],"scale":1.5679549315454735,"azimuth":28,"elevation":30},"PR":{"origin":[344.9887417858524,229.52650692764902],"scale":2.116739157586389,"azimuth":28,"elevation":30},"travel":4,"armZ":48,"armT":3,"rod":[-3,0],"rodTop":57,"baseH":8,"s1Travel":2,"poles":[{"n":1,"y":0}],"braid":{"root":-20,"stud":-24,"zb":49,"top":11},"changeover":false,"lamps":["H1"],"ctlWires":["ctl-plus","ctl-a1","ctl-a2"],"powerOn":{"work":["pw-11","pw-L","pw-14","pw-H1a","pw-H1b","pw-N"],"rest":[]}},"spdt":{"type":"spdt","lang":"en","P":{"origin":[344.9887417858524,229.52650692764902],"scale":1.5679549315454735,"azimuth":28,"elevation":30},"PR":{"origin":[344.9887417858524,229.52650692764902],"scale":2.116739157586389,"azimuth":28,"elevation":30},"travel":4,"armZ":48,"armT":3,"rod":[-3,0],"rodTop":57,"baseH":8,"s1Travel":2,"poles":[{"n":1,"y":0}],"braid":{"root":-20,"stud":-24,"zb":49,"top":11},"changeover":true,"lamps":["H1","H2"],"ctlWires":["ctl-plus","ctl-a1","ctl-a2"],"powerOn":{"work":["pw-11","pw-L","pw-14","pw-H1a","pw-H1b","pw-N"],"rest":["pw-11","pw-L","pw-12","pw-H2a","pw-H2b","pw-N2"]}},"dpst":{"type":"dpst","lang":"en","P":{"origin":[344.9887417858524,229.52650692764902],"scale":1.5679549315454735,"azimuth":28,"elevation":30},"PR":{"origin":[344.9887417858524,229.52650692764902],"scale":2.116739157586389,"azimuth":28,"elevation":30},"travel":4,"armZ":48,"armT":3,"rod":[-3,0],"rodTop":57,"baseH":8,"s1Travel":2,"poles":[{"n":1,"y":-13},{"n":2,"y":13}],"braid":{"root":-20,"stud":-24,"zb":49,"top":11},"changeover":false,"lamps":["H1"],"ctlWires":["ctl-plus","ctl-a1","ctl-a2"],"powerOn":{"work":["pw-11","pw-L","pw-21","pw-N","pw-14","pw-H1a","pw-24","pw-H1b"],"rest":[]}},"dpdt":{"type":"dpdt","lang":"en","P":{"origin":[344.9887417858524,229.52650692764902],"scale":1.5679549315454735,"azimuth":28,"elevation":30},"PR":{"origin":[344.9887417858524,229.52650692764902],"scale":2.116739157586389,"azimuth":28,"elevation":30},"travel":4,"armZ":48,"armT":3,"rod":[-3,0],"rodTop":57,"baseH":8,"s1Travel":2,"poles":[{"n":1,"y":-13},{"n":2,"y":13}],"braid":{"root":-20,"stud":-24,"zb":49,"top":11},"changeover":true,"lamps":["H1","H2"],"ctlWires":["ctl-plus","ctl-a1","ctl-a2"],"powerOn":{"work":["pw-11","pw-L","pw-21","pw-N","pw-14","pw-H1a","pw-24","pw-H1b"],"rest":["pw-11","pw-L","pw-21","pw-N","pw-12","pw-H2a","pw-22","pw-H2b"]}}};
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

})();
