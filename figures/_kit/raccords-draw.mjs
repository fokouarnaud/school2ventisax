// Dessin des raccords et des bouts de tube, dans le navigateur comme dans Node (figures raccords, choix-raccord).
// Un raccord du catalogue (figures/_data/raccords.mjs) : { material, mode, type, sizes, ends, angle }.
// Corps tiré au tube (kit tube.mjs : coudes lisses), extrémités tournées (lathe.mjs), écrous en prismes hexagonaux,
// peints par profondeur. Les tubes présentés (choix-raccord) partent de la bouche de chaque extrémité, à fleur.
// `k` = fonctions du kit iso (iso, pathOf, depthOf, solidSvg, lineSvg, topMatrix, faceTextSvg), `G` = lathe, `TB` = tube.

export function makeDraw(k, G, TB) {
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const TAU = Math.PI * 2;
  const dir = (deg) => [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180), 0];

  // Rayon affiché : croît comme la racine du diamètre réel, borné pour rester dans la carte.
  const radiusOf = (od) => Math.max(7, Math.min(22, 5 + 12 * Math.sqrt(od / 28.575)));
  const lengthOf = (r) => r + 9;

  // Géométrie : bouches (point, direction sortante, rayon, longueur d'emboîture) et tracé du corps.
  function layout(f, ods, z) {
    const r = ods.map(radiusOf);
    const C = [0, 0, z];
    const mouths = [];
    const routes = [];
    const end = (inner, d, i) => {
      const L = lengthOf(r[i]);
      mouths.push({ inner, d, r: r[i], L, p: add(inner, mul(d, L)) });
    };
    if (f.type === "manchon" || f.type === "reduction") {
      const half = f.type === "manchon" ? 1.5 : 4 + Math.abs(r[0] - r[1]);
      end(add(C, [-half, 0, 0]), [-1, 0, 0], 0);
      end(add(C, [half, 0, 0]), [1, 0, 0], 1);
      routes.push({ points: [mouths[0].inner, mouths[1].inner], radius: (t) => r[0] + (r[1] - r[0]) * t });
    } else if (f.type === "coude" && f.angle === 180) {
      const rho = r[0] * 1.7;
      end(add(C, [-2, -rho, 0]), [-1, 0, 0], 0);
      end(add(C, [-2, rho, 0]), [-1, 0, 0], 1);
      routes.push({ points: G.fillet([mouths[0].inner, add(C, [rho, -rho, 0]), add(C, [rho, rho, 0]), mouths[1].inner], rho * 0.98, 10), radius: () => r[0] });
    } else if (f.type === "coude") {
      const out = dir(-f.angle);
      const rho = r[0] * 1.5;
      const a = rho * Math.tan(((f.angle / 2) * Math.PI) / 180) + 2;
      end(add(C, [-a, 0, 0]), [-1, 0, 0], 0);
      end(add(C, mul(out, a)), out, 1);
      routes.push({ points: G.fillet([mouths[0].inner, C, mouths[1].inner], rho, 10), radius: () => r[0] });
    } else {
      const a = r[0] + 4;
      end(add(C, [-a, 0, 0]), [-1, 0, 0], 0);
      end(add(C, [a, 0, 0]), [1, 0, 0], 1);
      const b = Math.max(a, r[0] + 3);
      end(add(C, [0, b, 0]), [0, 1, 0], 2);
      routes.push({ points: [mouths[0].inner, mouths[1].inner], radius: () => r[0] });
      routes.push({ points: [add(C, [0, r[0] * 0.8, 0]), mouths[2].inner], radius: () => r[2], branch: true });
    }
    return { mouths, routes };
  }

  // Style d'une extrémité selon le mode d'assemblage et le genre.
  const styleOf = (mode, gender) =>
    ({ braser: "socket", sertir: "press", coller: "pvc", emboiter: "sleeve" })[mode] ||
    (mode === "dudgeon" ? (gender === "M" ? "flare" : "nut") : gender === "M" ? "thread" : "steel");

  const hexagon = (R, turn = 0) => Array.from({ length: 6 }, (_, i) => [R * Math.cos(turn + (i * TAU) / 6), R * Math.sin(turn + (i * TAU) / 6)]);
  const frameIn = (m) => G.frameAlong(m.p, mul(m.d, -1));

  function hole(m, P, radius) {
    const F = frameIn(m);
    const V = G.viewOf(P);
    const facing = m.d[0] * V[0] + m.d[1] * V[1] + m.d[2] * V[2];
    if (facing <= 0.05) return "";
    const pts = Array.from({ length: 28 }, (_, i) => k.iso(G.pointOf(F, 0, radius, (i * TAU) / 28), P));
    return `<path class="rc-hole" d="${k.pathOf(pts, true)}"/>`;
  }

  function endPiece(m, style, P, tone) {
    const F = frameIn(m);
    const { r, L } = m;
    const S = (paths, extra = {}) => k.solidSvg(paths, { tone, ...extra });
    const lines = (d) => (d ? k.lineSvg(d, { tone: "faint" }) : "");
    const threads = (s0, s1, radius) => {
      let d = "";
      for (let s = s0; s <= s1; s += 1.5) d += G.arcOf(F, s, radius, P);
      return lines(d);
    };
    const rs = r * 1.1;
    switch (style) {
      case "press":
        return S(G.solidOf([[0, rs - 0.5], [0.5, rs], [1.6, rs], [2.4, rs + 1.5, 1], [4.4, rs + 1.5, 1], [5.2, rs], [L, rs], [L, r]], F, P)) + hole(m, P, r * 0.86);
      case "pvc":
        return S(G.solidOf([[0, rs + 1], [2.6, rs + 1], [3, rs], [L, rs], [L, r]], F, P), { inner: lines(G.arcOf(F, L * 0.55, rs, P)) }) + hole(m, P, r * 0.9);
      case "sleeve": {
        let ribs = "";
        for (let s = 2; s < L - 1; s += 2.4) ribs += G.arcOf(F, s, rs, P);
        return S(G.solidOf([[0, rs], [L, rs], [L, r]], F, P), { inner: lines(ribs) }) + hole(m, P, r * 0.9);
      }
      case "flare": {
        const rm = r * 0.8;
        const spigot = S(G.solidOf([[0, rm * 0.5], [2.6, rm * 0.92], [3, rm], [L - 5, rm], [L - 5, r * 0.7], [L, r * 0.7]], F, P), { inner: threads(3.6, L - 6, rm) });
        return spigot + S(G.prismOf(F, hexagon(r * 1.25, Math.PI / 6), L - 5, L, P), { tone: "mid" });
      }
      case "thread": {
        const rm = r * 0.9;
        const spigot = S(G.solidOf([[0, rm - 0.6], [0.6, rm], [L - 5, rm], [L - 5, r * 0.8], [L, r * 0.8]], F, P), { inner: threads(1.4, L - 6, rm) });
        return spigot + S(G.prismOf(F, hexagon(r * 1.25, Math.PI / 6), L - 5, L, P), { tone: "mid" });
      }
      case "nut":
        return S(G.prismOf(F, hexagon(r * 1.3, Math.PI / 6), 0, L, P), { tone: "mid" }) + hole(m, P, r * 0.8);
      case "steel":
        return S(G.solidOf([[0, rs + 1.2], [3, rs + 1.2], [3.2, rs], [L, rs], [L, r]], F, P)) + hole(m, P, r * 0.85);
      default:
        return S(G.solidOf([[0, rs - 0.5], [0.5, rs], [L - 1, rs], [L, r]], F, P), { inner: lines(G.arcOf(F, L - 2.4, rs, P)) }) + hole(m, P, r * 0.86);
    }
  }

  // Tube présenté au bout `i` : il part de la bouche, à fleur, vers l'extérieur.
  function presented(m, present, material, P, length = 24) {
    const tone = "hi";
    const rt = m.r * 0.94;
    const far = add(m.p, mul(m.d, length));
    const F = G.frameAlong(m.p, m.d);
    const S = (paths, extra = {}) => k.solidSvg(paths, { tone, ...extra });
    if (present === "port-male" || present === "port-femelle") {
      const block = { x: -m.r * 1.6, y: -m.r * 1.6, w: m.r * 3.2, d: m.r * 3.2 };
      const BF = G.frameAlong(add(m.p, mul(m.d, 9)), m.d);
      const body = S(G.prismOf(BF, [[block.x, block.y], [block.x + block.w, block.y], [block.x + block.w, block.y + block.d], [block.x, block.y + block.d]], 0, 16, P), { tone: "mid" });
      const boss = present === "port-male"
        ? S(G.solidOf([[0, m.r * 0.5], [2.2, m.r * 0.8], [9, m.r * 0.8]], F, P), { inner: k.lineSvg([2.8, 4.3, 5.8, 7.3].map((s) => G.arcOf(F, s, m.r * 0.8, P)).join(""), { tone: "faint" }) })
        : S(G.solidOf([[0, m.r * 1.15], [9, m.r * 1.15]], F, P)) + hole({ ...m, d: mul(m.d, -1), p: m.p }, P, m.r * 0.8);
      return [{ at: add(m.p, mul(m.d, 17)), svg: body }, { at: add(m.p, mul(m.d, 4.5)), svg: boss }];
    }
    const pieces = TB.tubePieces([m.p, far], rt, P, { caps: [true, false] });
    const out = pieces.map((piece) => ({ at: piece.mid, svg: TB.tubeSvg(piece, { tone }) }));
    if (present === "tube-evase") {
      out.push({ at: add(m.p, mul(m.d, 2.5)), svg: S(G.solidOf([[0, rt * 0.6], [2.4, rt * 1.05], [2.6, rt]], F, P)) });
      out.push({ at: add(m.p, mul(m.d, 6)), svg: S(G.prismOf(F, hexagon(m.r * 1.3, Math.PI / 6), 3, 9, P), { tone: "mid" }) });
    }
    if (present === "tube-filete") {
      let d = "";
      for (let s = 1; s < 8; s += 1.5) d += G.arcOf(F, s, rt, P);
      out.push({ at: add(m.p, mul(m.d, 4)), svg: k.lineSvg(d, { tone: "lo" }) });
    }
    return out;
  }

  // Teinte de matière (CSS) : laiton pour le dudgeon et les vannes, sinon celle du matériau.
  const tintOf = (material, mode) => (mode === "dudgeon" ? "laiton" : material.startsWith("cuivre") ? "cuivre" : material);
  const tinted = (tint, list) => list.map((item) => ({ ...item, svg: `<g data-tint="${tint}">${item.svg}</g>` }));

  // Raccord seul, ou tubes seuls, ou les deux : renvoie le SVG peint par profondeur.
  function scene(f, ods, P, { z = 30, fitting = true, presents = null, material = f.material, tags = null } = {}) {
    const { mouths, routes } = layout(f, ods, z);
    const items = [];
    // Support tourné sous le centre du raccord : socle, colonne et berceau.
    const low = z - Math.max(...mouths.map((m) => m.r)) - 1;
    const post = k.solidSvg(k.cylinder(0, 0, 9, 0, 2.2, P, 36, 0.4), { tone: "lo" }) + k.solidSvg(k.cylinder(0, 0, 2.6, 2.2, low - 2.2, P, 20), { tone: "mid" }) + k.solidSvg(k.cylinder(0, 0, 6, low - 1.6, 1.6, P, 28, 0.3), { tone: "mid" });
    items.push({ at: [0, 0, 0], svg: post });
    if (fitting) {
      const tint = tintOf(f.material, f.mode);
      routes.forEach((route) => {
        for (const piece of TB.tubePieces(route.points, route.radius, P, { caps: false, maxLength: 12 })) items.push(...tinted(tint, [{ at: piece.mid, svg: TB.tubeSvg(piece, { tone: "hi" }) }]));
      });
      mouths.forEach((m, i) => items.push(...tinted(tint, [{ at: add(m.p, mul(m.d, -m.L / 2)), svg: endPiece(m, styleOf(f.mode, f.ends[i]), P, "hi") }])));
    }
    if (presents) {
      mouths.forEach((m, i) => {
        const port = presents[i].startsWith("port");
        items.push(...tinted(port ? "laiton" : tintOf(material, ""), presented(m, presents[i], material, P)));
      });
    }
    items.sort((a, b) => k.depthOf(a.at, P) - k.depthOf(b.at, P));
    const extent = mouths.map((m) => add(m.p, mul(m.d, presents ? 26 : 0)));
    const xs = [...extent.map((p) => p[0]), 0], ys = [...extent.map((p) => p[1]), 0];
    const pad = Math.max(...mouths.map((m) => m.r)) * 0.6 + 4;
    const plan = { x: Math.min(...xs) - pad, y: Math.min(...ys) - pad, w: Math.max(...xs) - Math.min(...xs) + 2 * pad, d: Math.max(...ys) - Math.min(...ys) + 2 * pad, r: pad };
    const halo = `<path class="iso-halo rc-halo" d="${k.haloOf(plan, 0, 0.3, P)}"/>`;
    let labels = "";
    if (tags) {
      mouths.forEach((m, i) => {
        const at = add(m.p, mul(m.d, presents ? 31 : 6));
        const xy = k.iso([at[0], at[1], at[2] + m.r + 4], P);
        labels += `<g class="rc-tag"><circle cx="${xy[0].toFixed(1)}" cy="${xy[1].toFixed(1)}" r="7"/><text x="${xy[0].toFixed(1)}" y="${(xy[1] + 2.6).toFixed(1)}" text-anchor="middle">${tags[i]}</text></g>`;
      });
    }
    return halo + items.map((item) => item.svg).join("") + labels;
  }

  return { radiusOf, layout, styleOf, tintOf, scene };
}
