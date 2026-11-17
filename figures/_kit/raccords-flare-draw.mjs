// Dessin des 5 raccords dudgeon (figure raccords-flare, Q104), dans le navigateur comme dans Node.
// Union, réduction et té passent par raccords-draw en mode « dudgeon » (cône fileté mâle + six pans, écrou femelle) ;
// l'écrou seul, le bouchon (capuchon conique) et la valve à obus de la prise de pression sont tournés ici.
// `k` = kit iso, `G` = lathe, `TB` = tube, `D` = raccords-draw.

export function makeDraw(k, G, TB, D) {
  const draw = D.makeDraw(k, G, TB);
  const TAU = Math.PI * 2;
  const Q38 = 9.525, Q14 = 6.35;
  const hexagon = (R) => Array.from({ length: 6 }, (_, i) => [R * Math.cos(Math.PI / 6 + (i * TAU) / 6), R * Math.sin(Math.PI / 6 + (i * TAU) / 6)]);
  const FLARE = { material: "cuivre-pouce", mode: "dudgeon" };
  const SPECS = {
    union: { type: "manchon", ends: ["M", "M"], ods: [Q38, Q38], presents: ["tube-evase", "tube-evase"] },
    reduction: { type: "reduction", ends: ["F", "M"], ods: [Q38, Q14], presents: ["port-male", "tube-evase"] },
    te: { type: "te", ends: ["M", "M", "M"], ods: [Q14, Q14, Q14], tags: ["M", "M", "V"] },
  };
  const S = (paths, tone = "hi", extra = {}) => k.solidSvg(paths, { tone, ...extra });
  const brass = (svg) => `<g data-tint="laiton">${svg}</g>`;
  const copper = (svg) => `<g data-tint="cuivre">${svg}</g>`;
  const hose = (svg) => `<g data-tint="flexible">${svg}</g>`;
  const threads = (F, s0, s1, r, P) => {
    let d = "";
    for (let s = s0; s <= s1; s += 1.3) d += G.arcOf(F, s, r, P);
    return d ? k.lineSvg(d, { tone: "faint" }) : "";
  };
  const paintAll = (items, P) => items.sort((a, b) => k.depthOf(a.at, P) - k.depthOf(b.at, P)).map((i) => i.svg).join("");
  const tag = (p, text, P) => {
    const xy = k.iso(p, P);
    return `<g class="rc-tag"><circle cx="${xy[0].toFixed(1)}" cy="${xy[1].toFixed(1)}" r="7"/><text x="${xy[0].toFixed(1)}" y="${(xy[1] + 2.6).toFixed(1)}" text-anchor="middle">${text}</text></g>`;
  };
  const post = (x, top, P) => ({ at: [x, 0, 0], svg: k.solidSvg(k.cylinder(x, 0, 9, 0, 2.2, P, 36, 0.4), { tone: "lo" }) + k.solidSvg(k.cylinder(x, 0, 2.6, 2.2, top - 2.2, P, 20), { tone: "mid" }) + k.solidSvg(k.cylinder(x, 0, 6, top - 1.6, 1.6, P, 28, 0.3), { tone: "mid" }) });
  const hole = (F, s, r, P) => `<path class="rc-hole" d="${k.pathOf(Array.from({ length: 28 }, (_, i) => k.iso(G.pointOf(F, s, r, (i * TAU) / 28), P)), true)}"/>`;

  // Tube de cuivre évasé, de x0 (bord évasé) à x1, dans l'axe x.
  function flaredTube(x0, x1, r, z, P) {
    const out = TB.tubePieces([[x0, 0, z], [x1, 0, z]], r, P, { caps: [true, true] }).map((piece) => ({ at: piece.mid, svg: copper(TB.tubeSvg(piece, { tone: "hi" })) }));
    const F = G.frameAlong([x0, 0, z], [Math.sign(x1 - x0), 0, 0]);
    out.push({ at: [x0 + Math.sign(x1 - x0) * 1.5, 0, z], svg: copper(S(G.solidOf([[0, r * 1.55], [2.6, r]], F, P))) });
    return out;
  }
  // Orifice mâle conique sur un bloc (vanne, compresseur) ; le cône finit en x0 et pointe vers `dir` (+1 ou -1).
  function malePort(x0, r, z, P, dir = 1) {
    const s = r * 2.2;
    const BF = G.frameAlong([x0 - 21.5 * dir, 0, z], [dir, 0, 0]);
    return [
      { at: [x0 - 15.5 * dir, 0, z], svg: brass(S(G.prismOf(BF, [[-s, -s], [s, -s], [s, s], [-s, s]], 0, 12, P), "mid")) },
      { at: [x0 - 4 * dir, 0, z], svg: brass(S(G.solidOf([[12, r * 1.2], [20, r * 1.2], [21.5, r * 0.6]], BF, P), "hi", { inner: threads(BF, 13, 19.5, r * 1.2, P) })) },
    ];
  }

  // Écrou seul : six pans percé, collerette conique visible à l'intérieur ; monté : sur tube évasé, contre un orifice mâle.
  function ecrou(P, { mounted }) {
    const z = 30, r = draw.radiusOf(Q38);
    const items = [post(0, z - r * 1.4, P)];
    const F = G.frameAlong([-6, 0, z], [1, 0, 0]);
    if (!mounted) {
      items.push({ at: [0, 0, z], svg: brass(S(G.prismOf(F, hexagon(r * 1.35), 0, 12, P), "mid") + hole(F, 0, r * 0.75, P)) });
      return paintAll(items, P) + tag([0, 0, z + r * 1.35 + 7], "F", P);
    }
    items.push(...malePort(-14.5, r * 0.75, z, P));
    items.push({ at: [-6, 0, z], svg: brass(S(G.prismOf(G.frameAlong([-14, 0, z], [1, 0, 0]), hexagon(r * 1.35), 0, 12, P), "mid")) });
    items.push(...flaredTube(-12, 48, r * 0.62, z, P));
    return paintAll(items, P);
  }

  // Bouchon dudgeon : écrou à fond bombé, tourné vers l'observateur (-x) ; monté : vissé sur un orifice mâle, derrière.
  function bouchon(P, { mounted }) {
    const z = 30, r = draw.radiusOf(Q14);
    const x = mounted ? -4 : 6;
    const items = [post(mounted ? 10 : 0, z - r * 1.4, P)];
    const F = G.frameAlong([x, 0, z], [-1, 0, 0]);
    items.push({ at: [x - 5, 0, z], svg: brass(S(G.prismOf(F, hexagon(r * 1.35), 0, 9, P), "mid")) });
    items.push({ at: [x - 11, 0, z], svg: brass(S(G.solidOf([[9, r * 1.1], [11, r * 1.05, 1], [13, r * 0.6, 1], [13.6, 0]], F, P))) });
    if (mounted) items.push(...malePort(x - 9, r * 0.75, z, P, -1));
    return paintAll(items, P) + (mounted ? "" : tag([0, 0, z + r * 1.35 + 7], "F", P));
  }

  // Valve à obus et son bouchon, au bout de la voie de prise du té ; montée : bouchon ôté, flexible du manifold vissé.
  function valve(m, P, mounted) {
    const F = G.frameAlong(m.p, m.d);
    if (!mounted) return [{ at: [m.p[0] + m.d[0] * 4, m.p[1] + m.d[1] * 4, m.p[2]], svg: brass(S(G.solidOf([[0, m.r * 0.78], [5, m.r * 0.78], [6, m.r * 0.6, 1], [6.5, 0]], F, P))) }];
    const far = [m.p[0] + m.d[0] * 30, m.p[1] + m.d[1] * 30, m.p[2] + 10];
    const tube = TB.tubePieces([m.p, [m.p[0] + m.d[0] * 10, m.p[1] + m.d[1] * 10, m.p[2]], far], m.r * 0.8, P, { caps: [false, true] });
    return [
      { at: [m.p[0] + m.d[0] * 3, m.p[1] + m.d[1] * 3, m.p[2]], svg: brass(S(G.prismOf(F, hexagon(m.r * 1.3), 0, 6, P), "mid")) },
      ...tube.map((piece) => ({ at: piece.mid, svg: hose(TB.tubeSvg(piece, { tone: "mid" })) })),
    ];
  }

  function scene(key, P, { mounted = false } = {}) {
    if (key === "ecrou") return ecrou(P, { mounted });
    if (key === "bouchon") return bouchon(P, { mounted });
    const s = SPECS[key];
    const f = { ...FLARE, type: s.type, ends: s.ends, angle: null, sizes: s.ods.map(String) };
    if (key !== "te") return draw.scene(f, s.ods, P, mounted ? { presents: s.presents } : { tags: s.ends });
    // Té : passage dessiné par raccords-draw, prise munie de sa valve ou du flexible du manifold.
    const { mouths } = draw.layout(f, s.ods, 30);
    const run = draw.scene(f, s.ods, P, mounted ? { presents: ["tube-evase", "tube-evase", null] } : { tags: s.tags.slice(0, 2).concat([""]) });
    const extra = paintAll(valve(mouths[2], P, mounted), P);
    const m = mouths[2];
    return run + extra + (mounted ? "" : tag([m.p[0] + m.d[0] * 9, m.p[1] + m.d[1] * 9, m.p[2] + m.r + 6], s.tags[2], P));
  }
  return { scene };
}
