(() => {
const FIG = {"lang":"fr","P":{"origin":[345.025684431069,228.07158084395874],"scale":1.5795659559757067,"azimuth":28,"elevation":30},"s1Travel":2,"slow":50,"hz":50,"screen":{"o":[128.8149714702993,100.92992357608618],"u":[179.9749885789495,87.3287917657702],"v":[128.8149714702993,83.62664547298405]},"ctlWires":["ctl-plus","ctl-in3","ctl-in4"],"powerWires":["pw-1","pw-2","pw-L","pw-N","pw-H1a","pw-H1b","int-1","int-2"]};
const still = matchMedia("(prefers-reduced-motion: reduce)");
const READ = {
  fr: (s) => [s.ctl ? "entrée 24 V ⎓ · LED IR allumée" : "entrée 0 V", s.on ? (s.ctl ? "triac conducteur · H1 allumé" : "conduit jusqu'au zéro de courant · H1 allumé") : s.ctl ? "attente du zéro de tension" : "triac bloqué", "ralenti ×50"].join(" · "),
  en: (s) => [s.ctl ? "input 24 V DC · IR LED on" : "input 0 V", s.on ? (s.ctl ? "triac conducting · H1 on" : "conducting until current zero · H1 on") : s.ctl ? "waiting for voltage zero" : "triac off", "slowed ×50"].join(" · "),
};
for (const stage of document.querySelectorAll(".iso-stage[data-ssr]")) {
  const C = FIG;
  if (stage.dataset.ready) continue;
  stage.dataset.ready = "1";
  const svg = stage.querySelector("svg");
  const readout = stage.closest(".iso-plate").querySelector("[data-readout]");
  const cap = svg.querySelector('[data-move="s1"]');
  const wires = [...svg.querySelectorAll(".rl-wire")];
  const trace = svg.querySelector(".sr-trace");
  const mains = svg.querySelector(".sr-mains");
  const lens = svg.querySelector(".rl-lens");
  const glow = svg.querySelector(".rl-glow");
  const irGlow = svg.querySelector(".sr-ir-glow");
  const beam = svg.querySelector(".sr-beam");
  const indGlow = svg.querySelector(".sr-ind-glow");
  const marks = [svg.querySelector(".sr-led"), svg.querySelector(".sr-photo"), svg.querySelector(".sr-ind")];
  const triac = svg.querySelector(".sr-triac");
  const f = 1; // fréquence montrée (50 Hz ralentis 50 fois)
  const WINDOW = 2; // périodes affichées
  const N = 160;
  const hist = []; // [phase, v, vLoad]
  let pressed = false, capPos = 0, led = 0, on = false, wasOn = false, lampAt = 0, phase = 0, lastV = 0;
  let frame = 0, last = 0, clock = 0, visible = false, idle = 0, touring = !still.matches;
  const S = C.screen;
  const pt = (u, v) => [S.o[0] + (S.u[0] - S.o[0]) * u + (S.v[0] - S.o[0]) * v, S.o[1] + (S.u[1] - S.o[1]) * u + (S.v[1] - S.o[1]) * v];
  const poly = (k) => { let d = ""; hist.forEach((h, i) => { const p = pt(i / (N - 1), h[k] * 0.82); d += (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }); return d; };
  function step(dt, calm) {
    if (touring) { clock += dt; pressed = clock % 5 > 1.2 && clock % 5 < 3.4; }
    const capTarget = pressed ? 1 : 0;
    capPos = calm ? capTarget : capPos + (capTarget - capPos) * (1 - Math.exp(-dt / 0.04));
    const ctl = pressed && capPos > 0.95;
    led = calm ? +ctl : led + (+ctl - led) * (1 - Math.exp(-dt / 0.03));
    if (calm) {
      on = ctl; wasOn = false;
      hist.length = 0;
      for (let i = 0; i < N; i++) { const v = Math.sin(2 * Math.PI * WINDOW * i / (N - 1)); hist.push([0, v, on ? v : 0]); }
    } else {
      // le temps de l'oscilloscope avance par petits pas : le triac n'est amorcé (ou bloqué) qu'au passage par zéro
      const sub = Math.max(1, Math.ceil(dt * N / WINDOW / f));
      for (let i = 0; i < sub; i++) {
        phase += (2 * Math.PI * f * dt) / sub;
        const v = Math.sin(phase);
        const crossed = (lastV <= 0 && v > 0) || (lastV >= 0 && v < 0);
        if (crossed) {
          if (!on && ctl) on = true;            // zéro de tension : amorçage
          else if (on && !ctl) on = false;      // zéro de courant (charge résistive) : blocage
        }
        if (on) wasOn = true;
        if (!on && !ctl) wasOn = false;
        lastV = v;
        hist.push([phase, v, on ? v : 0]);
      }
      while (hist.length > N) hist.shift();
      if (on && !ctl) wasOn = true;
    }
    const want = on ? 1 : 0;
    lampAt = calm ? want : lampAt + (want - lampAt) * (1 - Math.exp(-dt / (want ? 0.08 : 0.25)));
    return ctl;
  }
  function draw(ctl) {
    cap.setAttribute("transform", translateAlong(C.P, [0, 0, -C.s1Travel * capPos]));
    mains.setAttribute("d", poly(1));
    trace.setAttribute("d", poly(2));
    const live = new Set();
    if (ctl) for (const id of C.ctlWires) live.add(id);
    if (on) for (const id of C.powerWires) live.add(id);
    for (const w of wires) { if (live.has(w.dataset.wire)) w.setAttribute("data-live", ""); else w.removeAttribute("data-live"); }
    for (const m of marks) { if (led > 0.5) m.setAttribute("data-on", ""); else m.removeAttribute("data-on"); }
    if (on) triac.setAttribute("data-on", ""); else triac.removeAttribute("data-on");
    if (lampAt > 0.5) lens.setAttribute("data-on", ""); else lens.removeAttribute("data-on");
    glow.style.opacity = lampAt.toFixed(3);
    irGlow.style.opacity = (0.9 * led).toFixed(3);
    beam.style.opacity = (0.55 * led).toFixed(3);
    indGlow.style.opacity = led.toFixed(3);
    const txt = READ[C.lang]({ ctl, on, wasOn: wasOn && !on });
    if (readout.textContent !== txt) readout.textContent = txt;
    stage.setAttribute("aria-pressed", pressed ? "true" : "false");
    stage.dataset.state = (ctl ? "ctl " : "") + (on ? "on" : "off");
  }
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
    last = now;
    const calm = still.matches;
    draw(step(dt, calm));
    frame = visible && !(calm && !touring) ? requestAnimationFrame(tick) : 0;
  }
  const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
  const press = (down) => { touring = false; pressed = down; clearTimeout(idle); if (!down) idle = setTimeout(() => { touring = !still.matches; clock = 0; run(); }, 6000); run(); };
  new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); else { cancelAnimationFrame(frame); frame = 0; } }, { rootMargin: "120px 0px" }).observe(stage);
  stage.addEventListener("pointerdown", (e) => { stage.setPointerCapture?.(e.pointerId); press(true); });
  stage.addEventListener("pointerup", () => press(false));
  stage.addEventListener("pointercancel", () => press(false));
  stage.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); if (!e.repeat) press(true); } });
  stage.addEventListener("keyup", (e) => { if (e.key === " " || e.key === "Enter") press(false); });
  stage.addEventListener("blur", () => { if (pressed && !touring) press(false); });
  for (let i = 0; i < N; i++) { phase += 2 * Math.PI * WINDOW / N; lastV = Math.sin(phase); hist.push([phase, lastV, 0]); }
  draw(false);
}

})();
