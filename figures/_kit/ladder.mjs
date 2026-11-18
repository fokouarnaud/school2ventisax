// Schémas électriques animés (circuit de commande, circuit de puissance) dessinés depuis figures/_data/demarreurs.mjs.
// Symboles repris des schémas du cours (IEC) ; couleurs par jetons du kit : lisibles en clair et en sombre.
// Chaque arête est un groupe <g class="ld-e" data-e="i"> ; le script de la figure pose data-live (sous tension),
// data-flow (parcourue par un courant : tirets qui avancent) et tourne les lames des contacts autour de leur pivot.

const f = (v) => (Math.round(v * 10) / 10).toString();
const P = (pts) => pts.map(([x, y], i) => `${i ? "L" : "M"}${f(x)} ${f(y)}`).join("");
const text = (x, y, s, { size = 14, anchor = "middle", cls = "", weight } = {}) =>
  `<text class="ld-t${cls ? ` ${cls}` : ""}" x="${f(x)}" y="${f(y)}" font-size="${size}" text-anchor="${anchor}"${weight ? ` font-weight="${weight}"` : ""}>${s}</text>`;
const path = (d, cls = "ld-s") => `<path class="${cls}" d="${d}"/>`;

// angles des lames (degrés, sens horaire, lame dessinée verticale depuis le pivot du bas)
export const BLADE = { noOpen: -26, noClosed: 0, ncClosed: 28, ncOpen: -18 };

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

export function schematicBody(schema) {
  const [w, h] = schema.view;
  const o = [`<rect class="ld-paper" width="${w}" height="${h}" rx="10"/>`];
  // rails et sources
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

// Le fragment ne porte que le cadre du schéma (viewBox réservée) : le script le dessine depuis les mêmes données,
// qu'il embarque déjà pour la simulation. Le fragment reste léger (budget de 160 Ko par langue).
export function schematicSvg(schema, { label, title, name }) {
  const [w, h] = schema.view;
  return `<figure class="ld-fig"><figcaption class="ld-cap">${title}</figcaption><svg class="ld-svg" data-schema="${name}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}" font-family="Arial, sans-serif" font-weight="bold"></svg></figure>`;
}

export const LADDER_CSS = `
.ld-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}
@media (max-width:640px){.ld-grid{grid-template-columns:1fr}}
.ld-fig{margin:0;min-width:0}
.ld-cap{font:11px/1.3 var(--anatomy-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--anatomy-muted);margin:0 0 6px}
.ld-svg{display:block;width:100%;height:auto}
.ld-paper{fill:var(--anatomy-paper);stroke:var(--anatomy-faint);stroke-width:1}
.ld-t{fill:var(--anatomy-strong)}
.ld-s{fill:none;stroke:var(--anatomy-mid);stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;transition:stroke .2s}
.ld-thin{stroke-width:1.6}
.ld-link{stroke-width:1.4;stroke-dasharray:4 3}
.ld-group{stroke-width:1.3;stroke-dasharray:4 3;stroke:var(--anatomy-lo)}
.ld-box,.ld-coil,.ld-wind{fill:var(--anatomy-paper)}
.ld-motor{fill:var(--anatomy-face)}
.ld-dot{fill:var(--anatomy-mid);transition:fill .2s}
.ld-pin{fill:var(--anatomy-paper);stroke:var(--anatomy-mid);stroke-width:1.4}
.ld-e[data-live] .ld-pin{stroke:var(--anatomy-hi)}
.ld-rail-l{stroke:var(--anatomy-red)}
.ld-rail-n{stroke:var(--anatomy-blue)}
.ld-e[data-live] .ld-s{stroke:var(--anatomy-hi)}
.ld-e[data-live] .ld-w{stroke-width:3.2}
.ld-e[data-flow] .ld-s{stroke:var(--anatomy-lit)}
.ld-dash{fill:none;stroke:var(--anatomy-card);stroke-width:1.6;stroke-dasharray:3 9;stroke-linecap:round;opacity:0;pointer-events:none}
.ld-e[data-flow] .ld-dash{opacity:1;animation:ld-flow .8s linear infinite}
@keyframes ld-flow{to{stroke-dashoffset:-12}}
.ld-coil[data-on]{fill:var(--anatomy-lit);stroke:var(--anatomy-lit)}
.ld-wind[data-on]{fill:var(--anatomy-lit)}
.ld-act{transition:transform .12s}
.ld-coupling{fill:var(--anatomy-lit)}
.ld-halo{fill:none;stroke:var(--anatomy-lit);stroke-width:2;opacity:0;transition:opacity .3s}
.ld-e[data-changed] .ld-halo{opacity:1;animation:ld-pulse 1.1s ease-out infinite}
.ld-e[data-changed] .ld-blade{stroke:var(--anatomy-lit);stroke-width:4}
.ld-e[data-changed] .ld-coil{stroke-width:4}
@keyframes ld-pulse{0%{stroke-width:4;opacity:1}100%{stroke-width:1;opacity:.35}}
.ld-track{fill:var(--anatomy-faint)}
.ld-bar{fill:var(--anatomy-lit)}
.ld-timer{font-weight:normal}
@media (prefers-reduced-motion:reduce){.ld-e[data-flow] .ld-dash,.ld-e[data-changed] .ld-halo{animation:none}}
`;

// Script (navigateur) : applique l'état résolu aux deux schémas. Attend D (module demarreurs) et BLADE dans la portée.
export const LADDER_LIVE = `
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
`;
