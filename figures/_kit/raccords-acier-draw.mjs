// Dessin des 7 raccords acier à visser (figure raccords-acier, Q101), dans le navigateur comme dans Node.
// Manchon, mamelon, réduction, coude et té passent par raccords-draw (corps tiré au tube, extrémités tournées,
// six pans) ; l'union 3 pièces et le bouchon / capuchon sont tournés ici. Chaque raccord se montre seul, avec ses
// repères M ou F à chaque bouche, ou monté sur ses tubes filetés et ses orifices femelles.
// `k` = kit iso, `G` = lathe, `TB` = tube, `D` = raccords-draw.

export function makeDraw(k, G, TB, D) {
  const draw = D.makeDraw(k, G, TB);
  const TAU = Math.PI * 2;
  const DN20 = 26.9, DN15 = 21.3;
  const hexagon = (R) => Array.from({ length: 6 }, (_, i) => [R * Math.cos(Math.PI / 6 + (i * TAU) / 6), R * Math.sin(Math.PI / 6 + (i * TAU) / 6)]);
  const STEEL = { material: "acier", mode: "filete" };
  const SPECS = {
    manchon: { type: "manchon", ends: ["F", "F"], ods: [DN20, DN20], presents: ["tube-filete", "tube-filete"] },
    mamelon: { type: "manchon", ends: ["M", "M"], ods: [DN20, DN20], presents: ["port-femelle", "port-femelle"] },
    reduction: { type: "reduction", ends: ["M", "F"], ods: [DN20, DN15], presents: ["port-femelle", "tube-filete"] },
    coude: { type: "coude", angle: 90, ends: ["F", "F"], ods: [DN20, DN20], presents: ["tube-filete", "tube-filete"], shift: [70, 46] },
    te: { type: "te", ends: ["F", "F", "F"], ods: [DN20, DN20, DN15], presents: ["tube-filete", "tube-filete", "tube-filete"] },
  };

  const S = (paths, tone = "hi", extra = {}) => k.solidSvg(paths, { tone, ...extra });
  const threads = (F, s0, s1, r, P) => {
    let d = "";
    for (let s = s0; s <= s1; s += 1.5) d += G.arcOf(F, s, r, P);
    return d ? k.lineSvg(d, { tone: "faint" }) : "";
  };
  const tinted = (svg) => `<g data-tint="acier">${svg}</g>`;
  const paintAll = (items, P) => items.sort((a, b) => k.depthOf(a.at, P) - k.depthOf(b.at, P)).map((i) => i.svg).join("");
  const tag = (p, text, P) => {
    const xy = k.iso(p, P);
    return `<g class="rc-tag"><circle cx="${xy[0].toFixed(1)}" cy="${xy[1].toFixed(1)}" r="7"/><text x="${xy[0].toFixed(1)}" y="${(xy[1] + 2.6).toFixed(1)}" text-anchor="middle">${text}</text></g>`;
  };
  const post = (x, top, P) => ({ at: [x, 0, 0], svg: k.solidSvg(k.cylinder(x, 0, 9, 0, 2.2, P, 36, 0.4), { tone: "lo" }) + k.solidSvg(k.cylinder(x, 0, 2.6, 2.2, top - 2.2, P, 20), { tone: "mid" }) + k.solidSvg(k.cylinder(x, 0, 6, top - 1.6, 1.6, P, 28, 0.3), { tone: "mid" }) });
  // Tube fileté posé dans l'axe x, de x0 à x1 (filets du côté de `threadAt`).
  function pipe(x0, x1, r, z, P, threadAt) {
    const pieces = TB.tubePieces([[x0, 0, z], [x1, 0, z]], r, P, { caps: [true, true] });
    const out = pieces.map((piece) => ({ at: piece.mid, svg: TB.tubeSvg(piece, { tone: "hi" }) }));
    const F = G.frameAlong([threadAt, 0, z], [Math.sign(x1 + x0 - 2 * threadAt) || 1, 0, 0]);
    out.push({ at: [threadAt, 0, z + r], svg: threads(F, 1, 8, r, P) });
    return out;
  }

  // Union 3 pièces : embout gauche (taraudé, collet), écrou six pans libre, embout droit (taraudé, filet mâle).
  function union(P, { mounted, tags }) {
    const z = 30, r = draw.radiusOf(DN20), gap = mounted ? 0 : 7;
    const items = [post(0, z - r * 1.5 - 1, P)];
    const FL = G.frameAlong([-26 - gap, 0, z], [1, 0, 0]);
    items.push({ at: [-18 - gap, 0, z], svg: tinted(S(G.solidOf([[0, r * 1.12], [14, r * 1.12], [14, r * 1.3], [20, r * 1.3], [20, r * 0.9]], FL, P))) });
    const FN = G.frameAlong([-6, 0, z], [1, 0, 0]);
    items.push({ at: [0, 0, z + 1], svg: tinted(S(G.prismOf(FN, hexagon(r * 1.6), 0, 12, P), "mid")) });
    const FR = G.frameAlong([6 + gap, 0, z], [1, 0, 0]);
    items.push({ at: [17 + gap, 0, z], svg: tinted(S(G.solidOf([[0, r * 1.15], [6, r * 1.15], [6, r * 1.12], [20, r * 1.12], [20, r * 0.9]], FR, P), "hi", { inner: threads(FR, 0.8, 5.2, r * 1.15, P) })) });
    if (mounted) {
      items.push(...pipe(-58, -26, r * 0.94, z, P, -30).map((i) => ({ ...i, svg: tinted(i.svg) })));
      items.push(...pipe(26, 58, r * 0.94, z, P, 30).map((i) => ({ ...i, svg: tinted(i.svg) })));
    }
    let labels = "";
    if (tags) labels = tag([-30 - gap, 0, z + r + 6], tags[0], P) + tag([0, 0, z + r * 1.6 + 6], tags[1], P) + tag([30 + gap, 0, z + r + 6], tags[2], P);
    return paintAll(items, P) + labels;
  }

  // Bouchon mâle (tête six pans, tige filetée) à gauche, capuchon femelle (fond bombé) à droite.
  function bouchon(P, { mounted, tags }) {
    const z = 30, r = draw.radiusOf(DN20);
    const items = [post(-24, z - r * 1.3, P), post(24, z - r * 1.3, P)];
    const FP = G.frameAlong([-36, 0, z], [1, 0, 0]);
    items.push({ at: [-30, 0, z], svg: tinted(S(G.prismOf(FP, hexagon(r * 1.25), 0, 7, P), "mid")) });
    items.push({ at: [-20, 0, z], svg: tinted(S(G.solidOf([[7, r * 0.9], [20, r * 0.9], [21, r * 0.75]], FP, P), "hi", { inner: threads(FP, 8, 19.5, r * 0.9, P) })) });
    const FC = G.frameAlong([16, 0, z], [1, 0, 0]);
    items.push({ at: [24, 0, z], svg: tinted(S(G.solidOf([[0, r * 1.15], [14, r * 1.15], [16, r * 1.05, 1], [17.4, r * 0.7, 1], [18, 0]], FC, P))) });
    if (mounted) {
      const BF = G.frameAlong([-58, 0, z], [1, 0, 0]);
      const s = r * 1.6;
      items.push({ at: [-52, 0, z], svg: `<g data-tint="laiton">${S(G.prismOf(BF, [[-s, -s], [s, -s], [s, s], [-s, s]], 0, 14, P), "mid")}</g>` });
      items.push({ at: [-38, 0, z], svg: `<g data-tint="laiton">${S(G.solidOf([[14, r * 1.15], [22, r * 1.15]], BF, P))}</g>` });
      items.push(...pipe(16, 52, r * 0.94, z, P, 18).map((i) => ({ ...i, svg: tinted(i.svg) })));
    }
    let labels = "";
    if (tags) labels = tag([-22, 0, z + r + 8], tags[0], P) + tag([24, 0, z + r * 1.15 + 8], tags[1], P);
    return paintAll(items, P) + labels;
  }

  // Scène d'un raccord : seul (repères M / F) ou monté.
  function scene(key, P, { mounted = false } = {}) {
    if (key === "union") return union(P, { mounted, tags: mounted ? null : ["1", "2", "3"] });
    if (key === "bouchon") return bouchon(P, { mounted, tags: mounted ? null : ["M", "F"] });
    const s = SPECS[key];
    const f = { ...STEEL, type: s.type, ends: s.ends, angle: s.angle || null, sizes: s.ods.map(String) };
    const svg = draw.scene(f, s.ods, P, mounted ? { presents: s.presents } : { tags: s.ends });
    // Le coude monte vers le fond : décalé vers l'avant de l'établi pour rester dans le cadre.
    return s.shift ? `<g transform="translate(${s.shift[0]} ${s.shift[1]})">${svg}</g>` : svg;
  }
  return { scene };
}
