(() => {
const G = (() => {


const TAU = Math.PI * 2;
const LIGHT_UP = 1.2;
const BANDS = [0, 0.2, 0.42, 0.62];

const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const len3 = (a) => Math.hypot(a[0], a[1], a[2]);
const unit3 = (a) => {
  const length = len3(a) || 1;
  return [a[0] / length, a[1] / length, a[2] / length];
};
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

function viewOf(P) {
  const { sinA, cosA, sinE, cosE } = cameraOf(P);
  return [cosA * cosE, sinA * cosE, sinE];
}

function lightOf(P) {
  const { sinA, cosA } = cameraOf(P);
  return unit3([-sinA, cosA, LIGHT_UP]);
}

const scaleOf = (P) => cameraOf(P).k;

function bandOf(score) {
  let tone = 0;
  while (tone < BANDS.length && score >= BANDS[tone]) tone++;
  return tone;
}

const toneOf = (normal, P) => bandOf(dot3(unit3(normal), lightOf(P)));

function frameAlong(o, a) {
  const axis = unit3(a);
  const helper = Math.abs(axis[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1];
  const u = unit3(cross3(helper, axis));
  const v = cross3(axis, u);
  return { o, a: axis, u, v };
}

const frameOf = (o, a, u, v) => ({ o, a, u, v });

function pointOf(F, s, r, angle) {
  const c = Math.cos(angle);
  const n = Math.sin(angle);
  return [
    F.o[0] + F.a[0] * s + r * (c * F.u[0] + n * F.v[0]),
    F.o[1] + F.a[1] * s + r * (c * F.u[1] + n * F.v[1]),
    F.o[2] + F.a[2] * s + r * (c * F.u[2] + n * F.v[2]),
  ];
}

const radialOf = (F, angle) => {
  const c = Math.cos(angle);
  const n = Math.sin(angle);
  return [c * F.u[0] + n * F.v[0], c * F.u[1] + n * F.v[1], c * F.u[2] + n * F.v[2]];
};

const tangentOf = (F, angle) => {
  const c = Math.cos(angle);
  const n = Math.sin(angle);
  return [-n * F.u[0] + c * F.v[0], -n * F.u[1] + c * F.v[1], -n * F.u[2] + c * F.v[2]];
};

const angleToward = (F, direction) => Math.atan2(dot3(direction, F.v), dot3(direction, F.u));

function hullTagged(points) {
  const sorted = [...points].sort((a, b) => a.p[0] - b.p[0] || a.p[1] - b.p[1]);
  if (sorted.length < 3) return sorted;
  const cross = (o, a, b) => (a.p[0] - o.p[0]) * (b.p[1] - o.p[1]) - (a.p[1] - o.p[1]) * (b.p[0] - o.p[0]);
  const lower = [];
  for (const point of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 1e-9) lower.pop();
    lower.push(point);
  }
  const upper = [];
  for (let index = sorted.length - 1; index >= 0; index--) {
    const point = sorted[index];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 1e-9) upper.pop();
    upper.push(point);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

const hullOf = (points) => hullTagged(points.map((p) => ({ p }))).map(({ p }) => p);

function runsOf(flags) {
  const count = flags.length;
  const start = flags.findIndex((flag, index) => flag !== flags[(index + count - 1) % count]);
  if (start < 0) return flags[0] ? [Array.from({ length: count + 1 }, (_, index) => index % count)] : [];
  const runs = [];
  let run = null;
  for (let step = 0; step < count; step++) {
    const index = (start + step) % count;
    if (flags[index]) {
      if (!run) run = [index];
      run.push((index + 1) % count);
    } else if (run) {
      runs.push(run);
      run = null;
    }
  }
  if (run) runs.push(run);
  return runs;
}

function groupsOf(keys) {
  const count = keys.length;
  const out = [];
  const start = keys.findIndex((key, index) => key !== keys[(index + count - 1) % count]);
  if (start < 0) {
    if (keys[0] !== null) out.push({ key: keys[0], run: Array.from({ length: count + 1 }, (_, index) => index % count) });
    return out;
  }
  let current = null;
  for (let step = 0; step < count; step++) {
    const index = (start + step) % count;
    const key = keys[index];
    if (current && current.key === key) {
      current.run.push((index + 1) % count);
      continue;
    }
    if (current && current.key !== null) out.push(current);
    current = { key, run: [index, (index + 1) % count] };
  }
  if (current && current.key !== null) out.push(current);
  return out;
}

const stepsFor = (radius, least = 16, most = 112, scale = 0) => Math.max(least, Math.min(most, scale ? Math.ceil((TAU * radius * scale) / 3) : Math.round((radius * 1.3) / 4) * 4));

function chains(edges) {
  const out = [];
  let current = null;
  for (const [a, b, keep] of edges) {
    if (!keep) {
      if (current) out.push(current);
      current = null;
      continue;
    }
    if (!current) current = [a];
    current.push(b);
  }
  if (current) out.push(current);
  if (out.length > 1 && edges[0][2] && edges[edges.length - 1][2]) {
    const last = out.pop();
    out[0] = [...last, ...out[0].slice(1)];
  }
  return out;
}

function labelledArcs(nr, na, view, light, gr = nr, ga = na) {
  const cuts = [];
  if (Math.abs(gr) > 1e-9) {
    const visibleCut = -(ga * view.a) / (gr * view.flat);
    if (visibleCut > -1 && visibleCut < 1) {
      const d = Math.acos(visibleCut);
      cuts.push(view.phi - d, view.phi + d);
    }
  }
  if (Math.abs(nr) > 1e-9) {
    for (const threshold of BANDS) {
      const c = (threshold - na * light.a) / (nr * light.flat);
      if (c > -1 && c < 1) {
        const d = Math.acos(c);
        cuts.push(light.phi - d, light.phi + d);
      }
    }
  }
  const wrap = (angle) => ((angle % TAU) + TAU) % TAU;
  const sorted = [...new Set(cuts.map((angle) => Math.round(wrap(angle) * 1e9) / 1e9))].sort((a, b) => a - b);
  const label = (angle) => {
    const facing = gr * view.flat * Math.cos(angle - view.phi) + ga * view.a;
    if (facing <= 1e-9) return -1;
    return bandOf(nr * light.flat * Math.cos(angle - light.phi) + na * light.a);
  };
  if (!sorted.length) {
    const tone = label(0);
    return tone < 0 ? [] : [{ tone, from: 0, to: TAU, full: true }];
  }
  const arcs = sorted.map((from, index) => {
    const to = index + 1 < sorted.length ? sorted[index + 1] : sorted[0] + TAU;
    return { tone: label((from + to) / 2), from, to };
  });
  const merged = [];
  for (const arc of arcs) {
    const last = merged[merged.length - 1];
    if (last && last.tone === arc.tone && Math.abs(last.to - arc.from) < 1e-9) last.to = arc.to;
    else merged.push({ ...arc });
  }
  if (merged.length > 1 && merged[0].tone === merged[merged.length - 1].tone && Math.abs(merged[merged.length - 1].to - TAU - merged[0].from) < 1e-9) {
    const last = merged.pop();
    merged[0].from = last.from - TAU;
  }
  return merged.filter((arc) => arc.tone >= 0);
}

function hermiteSlopes(run) {
  const n = run.length - 1;
  const h = Array.from({ length: n }, (_, j) => run[j + 1][0] - run[j][0]);
  const delta = h.map((value, j) => (run[j + 1][1] - run[j][1]) / value);
  const d = new Array(n + 1).fill(0);
  const end = (h0, h1, d0, d1) => {
    let value = ((2 * h0 + h1) * d0 - h0 * d1) / (h0 + h1);
    if (Math.sign(value) !== Math.sign(d0)) value = 0;
    else if (Math.sign(d0) !== Math.sign(d1) && Math.abs(value) > Math.abs(3 * d0)) value = 3 * d0;
    return value;
  };
  if (n === 1) d[0] = d[1] = delta[0];
  else {
    d[0] = end(h[0], h[1], delta[0], delta[1]);
    d[n] = end(h[n - 1], h[n - 2], delta[n - 1], delta[n - 2]);
  }
  for (let k = 1; k < n; k++) {
    if (delta[k - 1] * delta[k] <= 0) continue;
    const w1 = 2 * h[k] + h[k - 1];
    const w2 = h[k] + 2 * h[k - 1];
    d[k] = (w1 + w2) / (w1 / delta[k - 1] + w2 / delta[k]);
  }
  return d;
}

function curveRuns(meridian) {
  const m = meridian.length;
  const segments = new Array(m - 1).fill(null);
  let start = 0;
  while (start < m - 1) {
    let end = start + 1;
    while (end < m - 1 && meridian[end][2] && Math.abs(meridian[end + 1][0] - meridian[end][0]) > 1e-9 && Math.abs(meridian[end][0] - meridian[end - 1][0]) > 1e-9) end++;
    const run = meridian.slice(start, end + 1);
    const n = run.length - 1;
    if (n >= 2 && run.every((point, j) => j === 0 || Math.abs(point[0] - run[j - 1][0]) > 1e-9)) {
      const d = hermiteSlopes(run);
      for (let j = 0; j < n; j++) {
        const [s0, r0] = run[j];
        const [s1, r1] = run[j + 1];
        const hj = s1 - s0;
        const d0 = d[j];
        const d1 = d[j + 1];
        const radius = (s) => {
          const t = (s - s0) / hj;
          return (2 * t ** 3 - 3 * t ** 2 + 1) * r0 + (t ** 3 - 2 * t ** 2 + t) * hj * d0 + (-2 * t ** 3 + 3 * t ** 2) * r1 + (t ** 3 - t ** 2) * hj * d1;
        };
        const slope = (s) => {
          const t = (s - s0) / hj;
          return ((6 * t ** 2 - 6 * t) * r0 + (6 * t - 6 * t ** 2) * r1) / hj + (3 * t ** 2 - 4 * t + 1) * d0 + (3 * t ** 2 - 2 * t) * d1;
        };
        segments[start + j] = { radius, slope };
      }
    }
    start = end;
  }
  return segments;
}

function curved(meridian, P, segments, { error = 0.2, depth = 6 } = {}) {
  const k = scaleOf(P);
  const out = [meridian[0]];
  for (let i = 0; i < meridian.length - 1; i++) {
    const curve = segments[i];
    const [s0] = meridian[i];
    const [s1] = meridian[i + 1];
    if (curve) {
      const split = (a, b, level) => {
        const mid = (a + b) / 2;
        const chord = (curve.radius(a) + curve.radius(b)) / 2;
        if (level < depth && Math.abs(curve.radius(mid) - chord) * k > error) {
          split(a, mid, level + 1);
          out.push([mid, curve.radius(mid), 1]);
          split(mid, b, level + 1);
        }
      };
      split(s0, s1, 0);
    }
    out.push(meridian[i + 1]);
  }
  return out;
}

function smoothRows(meridian, F, P, { rows = 6, slope = null, radius = null, steps = 48, error = 0.35, depth: deepest = 8, fineness = 0.1 } = {}) {
  const V = viewOf(P);
  const L = lightOf(P);
  const view = { a: dot3(F.a, V), flat: Math.hypot(dot3(F.u, V), dot3(F.v, V)), phi: Math.atan2(dot3(F.v, V), dot3(F.u, V)) };
  const light = { a: dot3(F.a, L), flat: Math.hypot(dot3(F.u, L), dot3(F.v, L)), phi: Math.atan2(dot3(F.v, L), dot3(F.u, L)) };
  const m = meridian.length;
  const faces = [];
  for (let i = 0; i < m - 1; i++) {
    const ds = meridian[i + 1][0] - meridian[i][0];
    const dr = meridian[i + 1][1] - meridian[i][1];
    const length = Math.hypot(ds, dr) || 1;
    faces.push([ds / length, -dr / length]);
  }
  const splines = slope ? null : curveRuns(meridian);
  const vertexNormal = (k, own) => {
    if (k <= 0 || k >= m - 1 || !meridian[k][2]) return own;
    const a = faces[k - 1];
    const b = faces[k];
    const x = a[0] + b[0];
    const y = a[1] + b[1];
    const length = Math.hypot(x, y) || 1;
    return [x / length, y / length];
  };
  const normalAt = (i, u) => {
    const [s0] = meridian[i];
    const [s1] = meridian[i + 1];
    const s = s0 + (s1 - s0) * u;
    const sign = Math.sign(s1 - s0) || 1;
    const g = slope ? slope(s) : splines[i] ? splines[i].slope(s) : null;
    if (g !== null) {
      const length = Math.hypot(1, g);
      return [sign / length, (-sign * g) / length];
    }
    const a = vertexNormal(i, faces[i]);
    const b = vertexNormal(i + 1, faces[i]);
    const x = a[0] + (b[0] - a[0]) * u;
    const y = a[1] + (b[1] - a[1]) * u;
    const length = Math.hypot(x, y) || 1;
    return [x / length, y / length];
  };
  const pointAt = (i, u, angle) => {
    const [s0, r0] = meridian[i];
    const [s1, r1] = meridian[i + 1];
    const s = s0 + (s1 - s0) * u;
    return iso(pointOf(F, s, radius ? radius(s) : splines && splines[i] ? splines[i].radius(s) : r0 + (r1 - r0) * u, angle), P);
  };
  const buckets = [[], [], [], [], []];
  const fine = TAU / Math.max(24, Math.min(192, steps * 1.5));
  const arcPoints = (i, u, from, to) => {
    const count = Math.max(1, Math.ceil((to - from) / fine));
    return Array.from({ length: count + 1 }, (_, index) => pointAt(i, u, from + ((to - from) * index) / count));
  };
  const centreOf = (arc, reference) => {
    let mid = (arc.from + arc.to) / 2 - reference;
    mid = ((mid % TAU) + TAU) % TAU;
    return mid;
  };
  const levelOf = (i, u) => {
    const [nr, na] = normalAt(i, u);
    const groups = new Map();
    for (const arc of labelledArcs(nr, na, view, light, faces[i][0], faces[i][1])) {
      if (!groups.has(arc.tone)) groups.set(arc.tone, []);
      groups.get(arc.tone).push(arc);
    }
    for (const list of groups.values()) list.sort((x, y) => centreOf(x, light.phi) - centreOf(y, light.phi));
    return { i, u, groups };
  };
  const same = (x, y) => {
    if (x.groups.size !== y.groups.size) return false;
    for (const [tone, list] of x.groups) if ((y.groups.get(tone) ?? []).length !== list.length) return false;
    return true;
  };
  const align = (reference, arc) => {
    const out = { ...arc };
    const centre = (reference.from + reference.to) / 2;
    while ((out.from + out.to) / 2 - centre > Math.PI) {
      out.from -= TAU;
      out.to -= TAU;
    }
    while (centre - (out.from + out.to) / 2 > Math.PI) {
      out.from += TAU;
      out.to += TAU;
    }
    return out;
  };
  const strayOf = (i, a, mid, b) => {
    let worst = 0;
    for (const [tone, list] of mid.groups) {
      list.forEach((arc, index) => {
        const lo = align(arc, a.groups.get(tone)[index]);
        const hi = align(arc, b.groups.get(tone)[index]);
        for (const key of ["from", "to"]) {
          const p = pointAt(i, mid.u, arc[key]);
          const p0 = pointAt(i, a.u, lo[key]);
          const p1 = pointAt(i, b.u, hi[key]);
          worst = Math.max(worst, Math.hypot(p[0] - (p0[0] + p1[0]) / 2, p[1] - (p0[1] + p1[1]) / 2));
        }
      });
    }
    return worst;
  };
  const sheet = (tone, levels) => {
    levels[0].groups.get(tone).forEach((arc, index) => {
      const chain = [arc];
      for (let k = 1; k < levels.length; k++) chain.push(align(chain[k - 1], levels[k].groups.get(tone)[index]));
      const last = levels.length - 1;
      const points = [...arcPoints(levels[0].i, levels[0].u, chain[0].from, chain[0].to)];
      for (let k = 1; k < last; k++) points.push(pointAt(levels[k].i, levels[k].u, chain[k].to));
      points.push(...arcPoints(levels[last].i, levels[last].u, chain[last].from, chain[last].to).reverse());
      for (let k = last - 1; k >= 1; k--) points.push(pointAt(levels[k].i, levels[k].u, chain[k].from));
      buckets[tone].push(pathOf(oriented(points), true));
    });
  };
  const overlap = (x, y) => Math.min(x.to, y.to) - Math.max(x.from, y.from);
  const strip = (tone, a, b) => {
    const below = a.groups.get(tone) ?? [];
    const above = (b.groups.get(tone) ?? []).map((arc) => ({ arc, used: false }));
    const quad = (lo, hi) => {
      const points = [...arcPoints(a.i, a.u, lo.from, lo.to), ...arcPoints(b.i, b.u, hi.from, hi.to).reverse()];
      buckets[tone].push(pathOf(oriented(points), true));
    };
    for (const arc of below) {
      let best = null;
      let score = -Infinity;
      for (const entry of above) {
        if (entry.used) continue;
        const aligned = align(arc, entry.arc);
        const value = overlap(arc, aligned);
        if (value > score) (score = value), (best = entry);
      }
      if (best && score > -0.05) {
        best.used = true;
        quad(arc, align(arc, best.arc));
      } else {
        const centre = (arc.from + arc.to) / 2;
        quad(arc, { from: centre, to: centre });
      }
    }
    for (const entry of above) {
      if (entry.used) continue;
      const centre = (entry.arc.from + entry.arc.to) / 2;
      quad({ from: centre, to: centre }, entry.arc);
    }
  };
  const k = scaleOf(P);
  let run = [];
  const flush = () => {
    const tones = [...new Set(run.flatMap((level) => [...level.groups.keys()]))].sort((x, y) => x - y);
    for (const tone of tones) {
      const countOf = (level) => (level.groups.get(tone) ?? []).length;
      let start = 0;
      for (let at = 1; at <= run.length; at++) {
        if (at < run.length && countOf(run[at - 1]) === countOf(run[at])) continue;
        if (at - 1 > start && countOf(run[start])) sheet(tone, run.slice(start, at));
        if (at < run.length) strip(tone, run[at - 1], run[at]);
        start = at;
      }
    }
    run = [];
  };
  for (let i = 0; i < m - 1; i++) {
    const ds = meridian[i + 1][0] - meridian[i][0];
    if (Math.abs(ds) < 1e-9) {
      flush();
      continue;
    }
    const count = Math.max(1, rows);
    const reach = (Math.hypot(ds, meridian[i + 1][1] - meridian[i][1]) * k) / count;
    const limit = Math.max(1, Math.min(deepest, Math.ceil(Math.log2(Math.max(2, reach / fineness)))));
    const coarse = Array.from({ length: count + 1 }, (_, index) => levelOf(i, index / count));
    run.push(coarse[0]);
    const refine = (a, b, depth) => {
      const mid = levelOf(i, (a.u + b.u) / 2);
      const split = depth < limit && (!same(a, b) || !same(a, mid) || (depth < 6 && strayOf(i, a, mid, b) > error));
      if (!split) {
        run.push(b);
        return;
      }
      refine(a, mid, depth + 1);
      refine(mid, b, depth + 1);
    };
    for (let index = 1; index <= count; index++) refine(coarse[index - 1], coarse[index], 0);
  }
  flush();
  return buckets;
}

function sideOf(meridian) {
  const m = meridian.length;
  let first = 0;
  let last = m - 1;
  if (meridian[0][1] <= 1e-9) first = 1;
  if (meridian[m - 1][1] <= 1e-9) last = m - 2;
  const side = meridian.slice(first, last + 1);
  for (let index = 1; index < side.length; index++) if (side[index][0] - side[index - 1][0] <= 1e-9) return null;
  return side.length >= 3 ? side : null;
}

function surfaceOf(side, F, P, rims, { samples = 96, slope = null } = {}) {
  const V = viewOf(P);
  const aV = dot3(F.a, V);
  const facing = Math.atan2(dot3(F.v, V), dot3(F.u, V));
  const [left, right] = silhouettePoints(side, F, P, { samples, slope });
  if (left.length <= samples || right.length <= samples) return null;
  const s0 = side[0][0];
  const s1 = side[side.length - 1][0];
  const angleOf = (point) => angleToward(F, sub3(point, add3(F.o, mul3(F.a, dot3(sub3(point, F.o), F.a)))));
  const wrap = (angle) => ((angle % TAU) + TAU) % TAU;
  const arc = (s, r, from, to, through) => {
    let sweep = wrap(to - from);
    if (wrap(through - from) > sweep) sweep -= TAU;
    const count = Math.max(4, Math.ceil(Math.abs(sweep) / (TAU / 96)), Math.ceil((Math.abs(sweep) * r * scaleOf(P)) / 1.5));
    return Array.from({ length: count + 1 }, (_, index) => iso(pointOf(F, s, r, from + (sweep * index) / count), P));
  };
  const r0 = side[0][1];
  const r1 = side[side.length - 1][1];
  const bottom = -aV > 0 ? facing + Math.PI : facing;
  const top = aV > 0 ? facing + Math.PI : facing;
  const L = left.map((point) => iso(point, P));
  const R = right.map((point) => iso(point, P));
  const topArc = arc(s1, r1, angleOf(left[left.length - 1]), angleOf(right[right.length - 1]), top);
  const bottomArc = arc(s0, r0, angleOf(right[0]), angleOf(left[0]), bottom);
  const keepFirst = rims === "all" || rims === "first" || rims === "ends";
  const keepLast = rims === "all" || rims === "last" || rims === "ends";
  const fill = pathOf([...L, ...topArc, ...[...R].reverse(), ...bottomArc], true);
  const outline = [pathOf(L), pathOf(R), keepLast ? pathOf(topArc) : "", keepFirst ? pathOf(bottomArc) : ""].join("");
  const hull = hullOf([...arc(s0, r0, 0, TAU - 1e-6, Math.PI), ...arc(s1, r1, 0, TAU - 1e-6, Math.PI), ...L, ...R]);
  let gap = 0;
  for (const p of [...L, ...R]) {
    let best = Infinity;
    for (let index = 0; index < hull.length; index++) {
      const a = hull[index];
      const b = hull[(index + 1) % hull.length];
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
      best = Math.min(best, Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dy * t));
    }
    gap = Math.max(gap, best);
  }
  return { fill, outline, gap };
}

const softOf = (meridian) => meridian.some((point) => Boolean(point[2]));

function lathe(meridian, F, P, { steps = stepsFor(Math.max(...meridian.map(([, r]) => r)), 32, 160, scaleOf(P)), fill = "auto", hole = null, bevel = 0, rims = "all", smooth: asked = "auto", waist = 0.5 } = {}) {
  const smooth = asked === "auto" ? softOf(meridian) : asked;
  const V = viewOf(P);
  const L = lightOf(P);
  const aV = dot3(F.a, V);
  const uV = dot3(F.u, V);
  const vV = dot3(F.v, V);
  const aL = dot3(F.a, L);
  const uL = dot3(F.u, L);
  const vL = dot3(F.v, L);
  const n = steps;
  const m = meridian.length;
  const rings = meridian.map(([s, r]) => Array.from({ length: n }, (_, j) => iso(pointOf(F, s, r, (j / n) * TAU), P)));
  const midC = [];
  const midS = [];
  for (let j = 0; j < n; j++) {
    const t = ((j + 0.5) / n) * TAU;
    midC.push(Math.cos(t));
    midS.push(Math.sin(t));
  }
  const seen = [];
  const tones = [];
  for (let i = 0; i < m - 1; i++) {
    const ds = meridian[i + 1][0] - meridian[i][0];
    const dr = meridian[i + 1][1] - meridian[i][1];
    const length = Math.hypot(ds, dr);
    const row = [];
    const toneRow = [];
    for (let j = 0; j < n; j++) {
      if (length < 1e-9) {
        row.push(false);
        toneRow.push(0);
        continue;
      }
      const facing = ds * (midC[j] * uV + midS[j] * vV) - dr * aV;
      const lit = (ds * (midC[j] * uL + midS[j] * vL) - dr * aL) / length;
      row.push(facing > 1e-6 * length);
      toneRow.push(bandOf(lit));
    }
    seen.push(row);
    tones.push(toneRow);
  }
  const buckets = [[], [], [], [], []];
  const all = [];
  const smoothed = smooth ? smoothRows(meridian, F, P, { steps, ...(smooth === true ? {} : smooth) }) : null;
  if (smoothed) smoothed.forEach((list, tone) => list.forEach((d) => (buckets[tone].push(d), all.push(d))));
  for (let i = 0; i < m - 1; i++) {
    if (smoothed && Math.abs(meridian[i + 1][0] - meridian[i][0]) > 1e-9) continue;
    const keys = seen[i].map((visible, j) => (visible ? tones[i][j] : null));
    for (const { key, run } of groupsOf(keys)) {
      const a = run.map((j) => rings[i][j]);
      const b = run.map((j) => rings[i + 1][j]).reverse();
      const d = pathOf(oriented([...a, ...b]), true);
      buckets[key].push(d);
      all.push(d);
    }
  }
  const phi = Math.atan2(vV, uV);
  const flatV = Math.hypot(uV, vV);
  const rangeOf = (i) => {
    const ds = meridian[i + 1][0] - meridian[i][0];
    const dr = meridian[i + 1][1] - meridian[i][1];
    if (Math.hypot(ds, dr) < 1e-9) return null;
    if (Math.abs(ds) < 1e-9 || flatV < 1e-9) return -dr * aV > 1e-9 ? [-1, 1] : null;
    const c = (dr * aV) / (ds * flatV);
    return ds > 0 ? [Math.max(-1, c), 1] : [-1, Math.min(1, c)];
  };
  const arcsOf = (ranges) => {
    if (ranges.some((range) => !range)) return [];
    const lo = Math.max(...ranges.map(([x]) => x));
    const hi = Math.min(...ranges.map(([, x]) => x));
    if (lo >= hi - 1e-9) return [];
    const near = Math.acos(Math.min(1, hi));
    const far = Math.acos(Math.max(-1, lo));
    if (hi >= 1 && lo <= -1) return [[phi, phi + TAU]];
    if (hi >= 1) return [[phi - far, phi + far]];
    if (lo <= -1) return [[phi + near, phi + TAU - near]];
    return [[phi + near, phi + far], [phi - far, phi - near]];
  };
  const along = (s, r, [from, to]) => {
    const count = Math.max(2, Math.ceil(((to - from) * Math.max(r, 1e-6) * scaleOf(P)) / 1.5));
    return Array.from({ length: count + 1 }, (_, j) => iso(pointOf(F, s, r, from + ((to - from) * j) / count), P));
  };
  const creases = [];
  for (let i = 1; i < m - 1; i++) {
    if (meridian[i][2] || meridian[i][1] <= 1e-9) continue;
    for (const arc of arcsOf([rangeOf(i - 1), rangeOf(i)])) creases.push(pathOf(along(meridian[i][0], meridian[i][1], arc)));
  }
  let bevelPath = "";
  if (bevel > 0 && m > 2) {
    const ends = [];
    if (meridian[0][1] <= 1e-9) ends.push([0, 1, 1]);
    if (meridian[m - 1][1] <= 1e-9) ends.push([m - 2, m - 2, m - 3]);
    for (const [cap, rim, side] of ends) {
      const [s, r] = meridian[rim];
      for (const arc of arcsOf([rangeOf(cap), rangeOf(side)])) {
        const inset = along(s, Math.max(0, r - bevel), arc);
        const edge = along(s, r, arc);
        bevelPath += pathOf([edge[0], ...inset.slice(1, -1), edge[edge.length - 1]]);
      }
    }
  }
  const { fill: fillPath, outline } = outlineOf(meridian, F, P, { steps: n, fill, hole, rims, smooth, waist, all });
  return {
    fill: fillPath,
    outline,
    crease: creases.join(""),
    top: buckets[4].join(""),
    shades: buckets.slice(0, 4).map((list) => list.join("")),
    bevel: bevelPath || undefined,
    seamless: Boolean(smoothed),
  };
}

function shapeOf(meridian, P, smooth) {
  if (smooth && smooth.radius) {
    const segments = meridian.slice(0, -1).map(([s0], index) => (Math.abs(meridian[index + 1][0] - s0) > 1e-9 ? { radius: smooth.radius, slope: smooth.slope } : null));
    return curved(meridian, P, segments);
  }
  const curves = smooth && !smooth.slope ? curveRuns(meridian) : null;
  return curves && curves.some(Boolean) ? curved(meridian, P, curves) : meridian;
}

function outlineOf(meridian, F, P, { steps = stepsFor(Math.max(...meridian.map(([, r]) => r)), 32, 160, scaleOf(P)), fill = "auto", hole = null, rims = "all", smooth: asked = "auto", waist = 0.5, all = null } = {}) {
  const smooth = asked === "auto" ? softOf(meridian) : asked;
  const n = steps;
  let fillPath;
  let outline;
  const shape = shapeOf(meridian, P, smooth);
  const side = fill === "auto" || fill === "surface" ? sideOf(shape) : null;
  const surface = side && !hole ? surfaceOf(side, F, P, rims, { slope: smooth && smooth.slope ? smooth.slope : null }) : null;
  if (surface && (fill === "surface" || surface.gap > waist)) {
    fillPath = surface.fill;
    outline = surface.outline;
  } else if (fill === "hull" || fill === "auto" || fill === "surface") {
    const most = Math.max(...shape.map(([, r]) => r));
    const around = Math.min(320, Math.max(n, Math.ceil((TAU * most * scaleOf(P)) / 1.5)));
    const tagged = [];
    shape.forEach(([s, r], index) => {
      for (let j = 0; j < around; j++) tagged.push({ p: iso(pointOf(F, s, r, (j / around) * TAU), P), ring: index });
    });
    const hull = hullTagged(tagged);
    const holePath = hole ? pathOf(Array.from({ length: around }, (_, j) => iso(pointOf(F, hole[0], hole[1], (j / around) * TAU), P)), true) : "";
    fillPath = pathOf(hull.map(({ p }) => p), true) + holePath;
    if (rims === "all") {
      outline = pathOf(hull.map(({ p }) => p), true) + holePath;
    } else {
      const keepFirst = rims === "first" || rims === "ends";
      const keepLast = rims === "last" || rims === "ends";
      const edges = hull.map((a, index) => {
        const b = hull[(index + 1) % hull.length];
        const same = a.ring === b.ring;
        const keep = !same || (a.ring !== 0 && a.ring !== shape.length - 1) || (keepFirst && a.ring === 0) || (keepLast && a.ring === shape.length - 1);
        return [a.p, b.p, keep];
      });
      outline = chains(edges).map((points) => pathOf(points)).join("") + holePath;
    }
  } else {
    fillPath = all ? all.join("") : (({ shades, top }) => [...shades, top].join(""))(lathe(meridian, F, P, { steps: n, fill: "auto", hole, rims, smooth, waist }));
    outline = "";
  }
  return { fill: fillPath, outline };
}

const signedArea = (points) => points.reduce((sum, [x, y], index) => {
  const [nx, ny] = points[(index + 1) % points.length];
  return sum + x * ny - nx * y;
}, 0);

const oriented = (points) => (signedArea(points) < 0 ? [...points].reverse() : points);

const saddleStart = (R, a, angle) => Math.sqrt(Math.max(0, R * R - a * a * Math.cos(angle) ** 2));

function saddleOf(F, a, start, s1, P, { steps = stepsFor(a, 24) } = {}) {
  const V = viewOf(P);
  const L = lightOf(P);
  const n = steps;
  const angle = (j) => (j / n) * TAU;
  const from = typeof start === "function" ? start : (t) => saddleStart(start, a, t);
  const low = Array.from({ length: n }, (_, j) => iso(pointOf(F, from(angle(j)), a, angle(j)), P));
  const high = Array.from({ length: n }, (_, j) => iso(pointOf(F, s1, a, angle(j)), P));
  const seen = [];
  const tones = [];
  for (let j = 0; j < n; j++) {
    const normal = radialOf(F, angle(j + 0.5));
    seen.push(dot3(normal, V) > 1e-6);
    tones.push(bandOf(dot3(normal, L)));
  }
  const buckets = [[], [], [], [], []];
  const fills = [];
  const keys = seen.map((visible, j) => (visible ? tones[j] : null));
  for (const { key, run } of groupsOf(keys)) {
    const d = pathOf(oriented([...run.map((j) => low[j]), ...run.map((j) => high[j]).reverse()]), true);
    buckets[key].push(d);
    fills.push(d);
  }
  const capSeen = dot3(F.a, V) > 1e-6;
  if (capSeen) {
    const d = pathOf(oriented(high), true);
    buckets[bandOf(dot3(F.a, L))].push(d);
    fills.push(d);
  }
  const front = runsOf(seen);
  const back = runsOf(seen.map((visible) => !visible));
  const edges = [];
  for (const run of front) {
    edges.push(pathOf(run.map((j) => low[j])));
    edges.push(pathOf([low[run[0]], high[run[0]]]), pathOf([low[run[run.length - 1]], high[run[run.length - 1]]]));
  }
  for (const run of capSeen ? back : front) edges.push(pathOf(run.map((j) => high[j])));
  return {
    fill: fills.join(""),
    outline: edges.join(""),
    crease: capSeen ? front.map((run) => pathOf(run.map((j) => high[j]))).join("") : "",
    top: buckets[4].join(""),
    shades: buckets.slice(0, 4).map((list) => list.join("")),
    seamless: true,
  };
}

function prismOf(F, polygon, s0, s1, P) {
  const V = viewOf(P);
  const L = lightOf(P);
  const ring = oriented(polygon.map(([x, y]) => [x, y]));
  const n = ring.length;
  const at = (s, [x, y]) => [F.o[0] + F.a[0] * s + F.u[0] * x + F.v[0] * y, F.o[1] + F.a[1] * s + F.u[1] * x + F.v[1] * y, F.o[2] + F.a[2] * s + F.u[2] * x + F.v[2] * y];
  const low = ring.map((point) => iso(at(s0, point), P));
  const high = ring.map((point) => iso(at(s1, point), P));
  const buckets = [[], [], [], [], []];
  const seen = [];
  for (let j = 0; j < n; j++) {
    const [x0, y0] = ring[j];
    const [x1, y1] = ring[(j + 1) % n];
    const normal = unit3(add3(mul3(F.u, y1 - y0), mul3(F.v, -(x1 - x0))));
    const visible = dot3(normal, V) > 1e-6;
    seen.push(visible);
    if (visible) buckets[bandOf(dot3(normal, L))].push(pathOf([low[j], low[(j + 1) % n], high[(j + 1) % n], high[j]], true));
  }
  const ends = [[s0, low, mul3(F.a, -1)], [s1, high, F.a]];
  const capSeen = ends.map(([, , normal]) => dot3(normal, V) > 1e-6);
  ends.forEach(([, points, normal], index) => capSeen[index] && buckets[bandOf(dot3(normal, L))].push(pathOf(points, true)));
  const hull = hullOf([...low, ...high]);
  const creases = [];
  for (let j = 0; j < n; j++) {
    const prev = (j - 1 + n) % n;
    const a = [ring[j][0] - ring[prev][0], ring[j][1] - ring[prev][1]];
    const b = [ring[(j + 1) % n][0] - ring[j][0], ring[(j + 1) % n][1] - ring[j][1]];
    const sharp = (a[0] * b[0] + a[1] * b[1]) / (Math.hypot(a[0], a[1]) * Math.hypot(b[0], b[1]) || 1) < Math.cos(0.35);
    if (sharp && seen[j] && seen[prev]) creases.push(pathOf([low[j], high[j]]));
    ends.forEach(([, points], index) => capSeen[index] && seen[j] && creases.push(pathOf([points[j], points[(j + 1) % n]])));
  }
  return { fill: pathOf(hull, true), outline: pathOf(hull, true), crease: creases.join(""), top: buckets[4].join(""), shades: buckets.slice(0, 4).map((list) => list.join("")) };
}

function stadium(r0, r1, offset, steps = 32) {
  const circle = (cx, r) => Array.from({ length: steps }, (_, index) => [cx + r * Math.cos((index / steps) * TAU), r * Math.sin((index / steps) * TAU)]);
  return hullOf([...circle(0, r0), ...circle(offset, r1)]);
}

function sphereOf(centre, r, P, { steps = 48 } = {}) {
  const V = viewOf(P);
  const L = lightOf(P);
  const F = frameAlong(centre, V);
  const flat = (p) => iso(p, P);
  const rim = Array.from({ length: steps }, (_, index) => pointOf(F, 0, r, (index / steps) * TAU));
  const outline = pathOf(rim.map(flat), true);
  const capOf = (threshold) => {
    const points = rim.filter((p) => dot3(sub3(p, centre), L) / r >= threshold).map(flat);
    const c = dot3(L, V);
    const LF = frameAlong(add3(centre, mul3(L, r * threshold)), L);
    const radius = r * Math.sqrt(Math.max(0, 1 - threshold * threshold));
    for (let index = 0; index < steps; index++) {
      const p = pointOf(LF, 0, radius, (index / steps) * TAU);
      if (dot3(sub3(p, centre), V) >= -1e-9) points.push(flat(p));
    }
    if (c > threshold) points.push(flat(add3(centre, mul3(V, r))));
    return points.length > 2 ? pathOf(hullOf(points), true) : "";
  };
  const shades = [outline, capOf(BANDS[1]), capOf(BANDS[2]), capOf(BANDS[3])];
  return { fill: outline, outline, crease: "", top: "", shades, seamless: true };
}

const disc = (s0, s1, r, F, P, options = {}) =>
  lathe(
    [
      [s0, 0],
      [s0, r],
      [s1, r],
      [s1, 0],
    ],
    F,
    P,
    { steps: stepsFor(r, 32, 160, scaleOf(P)), ...options },
  );

const ringBand = (s0, s1, rIn, rOut, F, P, options = {}) =>
  lathe(
    [
      [s0, rIn],
      [s0, rOut],
      [s1, rOut],
      [s1, rIn],
    ],
    F,
    P,
    { steps: stepsFor(rOut, 32, 160, scaleOf(P)), hole: null, ...options },
  );

function solidOf(profile, F, P, options = {}) {
  const first = profile[0];
  const last = profile[profile.length - 1];
  const meridian = [[first[0], 0], ...profile, [last[0], 0]];
  const most = Math.max(...profile.map(([, r]) => r));
  return lathe(meridian, F, P, { steps: stepsFor(most, 32, 160, scaleOf(P)), ...options });
}

function bandOfProfile(profile, F, P, options = {}) {
  const most = Math.max(...profile.map(([, r]) => r));
  return lathe(profile, F, P, { steps: stepsFor(most, 32, 160, scaleOf(P)), ...options });
}

function silhouettePoints(profile, F, P, { samples = 72, slope: given = null, radius = null } = {}) {
  const V = viewOf(P);
  const aV = dot3(F.a, V);
  const uV = dot3(F.u, V);
  const vV = dot3(F.v, V);
  const facing = Math.atan2(vV, uV);
  const flat = Math.hypot(uV, vV) || 1e-9;
  const s0 = profile[0][0];
  const s1 = profile[profile.length - 1][0];
  const radiusAt = radius ?? ((s) => {
    let index = 1;
    while (index < profile.length - 1 && profile[index][0] < s) index++;
    const [sa, ra] = profile[index - 1];
    const [sb, rb] = profile[index];
    return ra + ((rb - ra) * (s - sa)) / (sb - sa || 1);
  });
  const side = (sign) => {
    const points = [];
    for (let step = 0; step <= samples; step++) {
      const s = s0 + ((s1 - s0) * step) / samples;
      const h = (s1 - s0) / samples / 2 || 0.01;
      const slope = given ? given(s) : (radiusAt(Math.min(s1, s + h)) - radiusAt(Math.max(s0, s - h))) / (Math.min(s1, s + h) - Math.max(s0, s - h) || 1);
      const c = (slope * aV) / flat;
      if (Math.abs(c) > 1) continue;
      points.push(pointOf(F, s, radiusAt(s), facing + sign * Math.acos(c)));
    }
    return points;
  };
  return [side(1), side(-1)];
}

const silhouetteOf = (profile, F, P, options = {}) =>
  silhouettePoints(profile, F, P, options)
    .map((points) => pathOf(points.map((point) => iso(point, P))))
    .join("");

function profileCurve(profile, { slope = null, radius = null } = {}) {
  for (let index = 1; index < profile.length; index++) if (profile[index][0] - profile[index - 1][0] <= 1e-9) throw new Error(`profileCurve: s must rise along the profile (point ${index} at s = ${profile[index][0]})`);
  const segments = curveRuns(profile);
  const s0 = profile[0][0];
  const s1 = profile[profile.length - 1][0];
  const find = (s) => {
    let lo = 0;
    let hi = profile.length - 2;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (profile[mid][0] <= s) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  };
  const linear = (index, s) => {
    const [sa, ra] = profile[index];
    const [sb, rb] = profile[index + 1];
    return [ra + ((rb - ra) * (s - sa)) / (sb - sa), (rb - ra) / (sb - sa)];
  };
  const radiusAt = radius ?? ((s) => {
    const at = Math.max(s0, Math.min(s1, s));
    const index = find(at);
    return segments[index] ? segments[index].radius(at) : linear(index, at)[0];
  });
  const slopeAt = slope ?? ((s) => {
    const at = Math.max(s0, Math.min(s1, s));
    const index = find(at);
    return segments[index] ? segments[index].slope(at) : linear(index, at)[1];
  });
  return { s0, s1, radius: radiusAt, slope: slopeAt, analytic: Boolean(slope && radius) };
}

function bandsOf(profile, cuts, F, P, { slope = null, radius = null, steps, rows = 6, rims = "none", fill = "auto", samples = 72 } = {}) {
  const curve = profileCurve(profile, { slope, radius });
  const { s0, s1 } = curve;
  const stops = [s0, ...[...new Set(cuts)].filter((s) => s > s0 + 1e-6 && s < s1 - 1e-6).sort((a, b) => a - b), s1];
  const most = Math.max(...profile.map(([, r]) => r), ...stops.map((s) => curve.radius(s)));
  const n = steps ?? stepsFor(most, 32, 160, scaleOf(P));
  const knot = (s, soft) => (soft ? [s, curve.radius(s), 1] : [s, curve.radius(s)]);
  const meridianOf = (a, b) => [knot(a), ...profile.filter(([s]) => s > a + 1e-9 && s < b - 1e-9).map(([s, , soft]) => knot(s, soft)), knot(b)];
  const shading = { slope: curve.slope, radius: curve.radius, rows };
  const bands = stops.slice(0, -1).map((a, index) => {
    const b = stops[index + 1];
    const meridian = meridianOf(a, b);
    const paths = lathe(meridian, F, P, { steps: n, rims, fill, smooth: shading });
    const seam = index < stops.length - 2 ? arcOf(F, b, curve.radius(b), P, { slope: curve.slope(b) }) : "";
    return { s0: a, s1: b, profile: meridian, paths: { ...paths, outline: "" }, outline: paths.outline, seam };
  });
  const sidesOf = (from = s0, to = s1, { ends = false, count = samples } = {}) => {
    const span = [Math.max(s0, from), Math.min(s1, to)];
    const dense = Array.from({ length: count + 1 }, (_, index) => knot(span[0] + ((span[1] - span[0]) * index) / count, true));
    const points = silhouettePoints(dense, F, P, { samples: count, slope: curve.slope, radius: curve.radius });
    const rim = (s) => arcOf(F, s, curve.radius(s), P, { slope: curve.slope(s) });
    const rimsAt = ends === true ? span : ends === "first" ? [span[0]] : ends === "last" ? [span[1]] : [];
    return { d: points.map((list) => pathOf(list.map((point) => iso(point, P)))).join("") + rimsAt.map(rim).join(""), points };
  };
  return { bands, sidesOf, radius: curve.radius, slope: curve.slope, steps: n, s0, s1 };
}

function arcOf(F, s, r, P, { slope = 0, steps = 0, least = 0.02, inward = false, from = 0, to = TAU, trim = 0.3 } = {}) {
  const V = viewOf(P);
  const aV = dot3(F.a, V);
  const uV = dot3(F.u, V);
  const vV = dot3(F.v, V);
  const flat = Math.hypot(uV, vV);
  const phi = Math.atan2(vV, uV);
  const norm = Math.hypot(1, slope);
  const full = Math.abs(to - from - TAU) < 1e-9;
  let visible;
  if (flat < 1e-9) visible = (inward ? slope * aV / norm > least : -slope * aV / norm > least) ? [[phi, phi + TAU]] : [];
  else if (inward) {
    const c = (slope * aV - least * norm) / flat;
    visible = c <= -1 ? [] : c >= 1 ? [[phi, phi + TAU]] : [[phi + Math.acos(c), phi + TAU - Math.acos(c)]];
  } else {
    const c = (least * norm + slope * aV) / flat;
    visible = c >= 1 ? [] : c <= -1 ? [[phi, phi + TAU]] : [[phi - Math.acos(c), phi + Math.acos(c)]];
  }
  const at = (t) => iso(pointOf(F, s, r, t), P);
  const speed = (t) => {
    const a = at(t - 1e-3);
    const b = at(t + 1e-3);
    return Math.hypot(b[0] - a[0], b[1] - a[1]) / 2e-3;
  };
  const count = (span) => Math.max(2, Math.ceil(((steps || stepsFor(r, 24, 112)) * span) / TAU), Math.ceil((span * r * scaleOf(P)) / 1.5));
  const out = [];
  for (const [a, b] of visible) {
    if (b - a >= TAU - 1e-9 && full) {
      const n = count(TAU);
      out.push(pathOf(Array.from({ length: n }, (_, j) => at(from + (j / n) * TAU)), true));
      continue;
    }
    const pieces = full ? [[a, b, true, true]] : [];
    if (!full)
      for (let turn = -2; turn <= 2; turn++) {
        const lo = Math.max(a + turn * TAU, from);
        const hi = Math.min(b + turn * TAU, to);
        if (hi - lo > 1e-6) pieces.push([lo, hi, lo > from + 1e-9, hi < to - 1e-9]);
      }
    for (const [lo, hi, limb0, limb1] of pieces) {
      const span = hi - lo;
      const cut0 = limb0 && trim > 0 ? Math.min(span * 0.25, trim / (speed(lo) || 1)) : 0;
      const cut1 = limb1 && trim > 0 ? Math.min(span * 0.25, trim / (speed(hi) || 1)) : 0;
      const t0 = lo + cut0;
      const t1 = hi - cut1;
      const n = count(t1 - t0);
      out.push(pathOf(Array.from({ length: n + 1 }, (_, j) => at(t0 + ((t1 - t0) * j) / n))));
    }
  }
  return out.join("");
}

function circleOf(F, s, r, P, steps = 0) {
  const count = steps || stepsFor(r, 24, 112);
  return pathOf(
    Array.from({ length: count }, (_, j) => iso(pointOf(F, s, r, (j / count) * TAU), P)),
    true,
  );
}

function spokesOf(F, s, r0, r1, count, P, { phase = 0, sweep = 0, from = 0, to = TAU } = {}) {
  const lines = [];
  for (let index = 0; index < count; index++) {
    const t = phase + from + (index / count) * (to - from);
    lines.push(pathOf([iso(pointOf(F, s, r0, t), P), iso(pointOf(F, s, r1, t + sweep), P)]));
  }
  return lines.join("");
}

const fadeOf = (value, [lo, hi]) => {
  const t = Math.max(0, Math.min(1, (value - lo) / (hi - lo || 1e-9)));
  return t * t * (3 - 2 * t);
};

function ribsOf(F, s0, s1, r, count, P, { phase = 0, twist = 0, least = 0.12, r1 = r, fade = null, seams = false } = {}) {
  const V = viewOf(P);
  const lines = [];
  const slope = (r1 - r) / (s1 - s0 || 1);
  for (let index = 0; index < count; index++) {
    const t = phase + (index / count) * TAU;
    const radial = radialOf(F, t + twist / 2);
    const normal = unit3([radial[0] - slope * F.a[0], radial[1] - slope * F.a[1], radial[2] - slope * F.a[2]]);
    const facing = dot3(normal, V);
    const d = pathOf([iso(pointOf(F, s0, r, t), P), iso(pointOf(F, s1, r1, t + twist), P)]);
    if (fade) {
      const alpha = fadeOf(facing, fade);
      if (alpha > 0.02) lines.push({ d, alpha });
      continue;
    }
    if (facing < least) continue;
    lines.push(d);
  }
  const ends = seams ? [seams === "last" ? "" : arcOf(F, s0, r, P, { slope }), seams === "first" ? "" : arcOf(F, s1, r1, P, { slope })].filter(Boolean) : [];
  if (fade) return [...lines, ...ends.map((d) => ({ d, alpha: 1 }))];
  return [...lines, ...ends].join("");
}

function rodOut(F, from, to, r, P, { stroke = 0, ...options } = {}) {
  const pad = 0.35 / scaleOf(P);
  const ring = (s) => Array.from({ length: 48 }, (_, index) => iso(pointOf(F, s, r + pad, (index / 48) * TAU), P));
  return {
    paths: disc(from - stroke, to, r, F, P, options),
    clip: pathOf(hullOf([...ring(from), ...ring(to + stroke)]), true),
    from,
    to,
    stroke,
    reach: to + stroke,
  };
}

function dotsOf(F, s, r, count, P, { phase = 0, slope = 0, least = 0.08, all = false, fade = null } = {}) {
  const V = viewOf(P);
  const out = [];
  for (let index = 0; index < count; index++) {
    const t = phase + (index / count) * TAU;
    let alpha = 1;
    if (!all) {
      const radial = radialOf(F, t);
      const normal = unit3([radial[0] - slope * F.a[0], radial[1] - slope * F.a[1], radial[2] - slope * F.a[2]]);
      const facing = dot3(normal, V);
      if (fade) alpha = fadeOf(facing, fade);
      else if (facing < least) continue;
      if (alpha <= 0.02) continue;
    }
    const [x, y] = iso(pointOf(F, s, r, t), P);
    out.push(alpha < 1 ? [x, y, alpha] : [x, y]);
  }
  return out;
}

function facingOf(F, angle, P, slope = 0) {
  const radial = radialOf(F, angle);
  return dot3(unit3([radial[0] - slope * F.a[0], radial[1] - slope * F.a[1], radial[2] - slope * F.a[2]]), viewOf(P));
}

function fillet(points, radius, perArc = 7, { P = null, tube = 0, margin = 1.3 } = {}) {
  if (points.length < 3) return points.map((p) => [...p]);
  const V = P && tube ? viewOf(P) : null;
  const out = [[...points[0]]];
  for (let index = 1; index < points.length - 1; index++) {
    const prev = points[index - 1];
    const here = points[index];
    const next = points[index + 1];
    const into = unit3(sub3(here, prev));
    const outOf = unit3(sub3(next, here));
    const cosTurn = Math.max(-1, Math.min(1, dot3(into, outOf)));
    const turn = Math.acos(cosTurn);
    if (turn < 1e-3) {
      out.push([...here]);
      continue;
    }
    const room = Math.min(len3(sub3(here, prev)), len3(sub3(next, here))) * 0.48;
    const facing = V ? Math.abs(dot3(unit3(cross3(into, outOf)), V)) : 1;
    const bend = V ? Math.max(radius, (margin * tube) / (0.7 * Math.max(0.05, facing) ** 2)) : radius;
    const cut = Math.min(bend * Math.tan(turn / 2), room);
    const a = sub3(here, mul3(into, cut));
    const b = add3(here, mul3(outOf, cut));
    const count = Math.max(2, Math.ceil((perArc * turn) / (Math.PI / 2)));
    for (let step = 0; step <= count; step++) {
      const t = step / count;
      const p0 = lerp3(a, here, t);
      const p1 = lerp3(here, b, t);
      out.push(lerp3(p0, p1, t));
    }
  }
  out.push([...points[points.length - 1]]);
  return out;
}

function resample(points, spacing) {
  const lengths = [0];
  for (let index = 1; index < points.length; index++) lengths.push(lengths[index - 1] + len3(sub3(points[index], points[index - 1])));
  const total = lengths[lengths.length - 1];
  const count = Math.max(1, Math.round(total / spacing));
  const out = [];
  let segment = 1;
  for (let step = 0; step <= count; step++) {
    const at = (total * step) / count;
    while (segment < points.length - 1 && lengths[segment] < at) segment++;
    const a = points[segment - 1];
    const b = points[segment];
    const span = lengths[segment] - lengths[segment - 1] || 1;
    out.push(lerp3(a, b, Math.min(1, Math.max(0, (at - lengths[segment - 1]) / span))));
  }
  return out;
}

function pathLength(points) {
  let total = 0;
  for (let index = 1; index < points.length; index++) total += len3(sub3(points[index], points[index - 1]));
  return total;
}

function cut(points, from, to) {
  const out = [];
  let walked = 0;
  for (let index = 1; index < points.length; index++) {
    const a = points[index - 1];
    const b = points[index];
    const length = len3(sub3(b, a));
    const start = walked;
    const end = walked + length;
    if (end >= from && start <= to) {
      const t0 = Math.max(0, (from - start) / (length || 1));
      const t1 = Math.min(1, (to - start) / (length || 1));
      if (!out.length) out.push(lerp3(a, b, t0));
      out.push(lerp3(a, b, t1));
    }
    walked = end;
  }
  return out;
}

const pointAlong = (points, at) => {
  const piece = cut(points, at, at + 0.01);
  return piece[0] ?? points[points.length - 1];
};

function tangentAlong(points, at) {
  const total = pathLength(points);
  const a = pointAlong(points, Math.max(0, at - 0.6));
  const b = pointAlong(points, Math.min(total, at + 0.6));
  return unit3(sub3(b, a));
}

function spiral(F, s, r0, r1, a0, a1, steps = 28) {
  const out = [];
  for (let index = 0; index <= steps; index++) {
    const t = index / steps;
    out.push(pointOf(F, s, r0 + (r1 - r0) * t, a0 + (a1 - a0) * t));
  }
  return out;
}

function arcPoints(F, s, r, a0, a1, steps = 24) {
  return Array.from({ length: steps + 1 }, (_, index) => pointOf(F, s, r, a0 + ((a1 - a0) * index) / steps));
}

return { dot3, add3, sub3, mul3, len3, unit3, cross3, lerp3, viewOf, lightOf, scaleOf, bandOf, toneOf, frameAlong, frameOf, pointOf, radialOf, tangentOf, angleToward, hullOf, runsOf, stepsFor, curveRuns, softOf, lathe, outlineOf, saddleStart, saddleOf, prismOf, stadium, sphereOf, disc, ringBand, solidOf, bandOfProfile, silhouettePoints, silhouetteOf, profileCurve, bandsOf, arcOf, circleOf, spokesOf, fadeOf, ribsOf, rodOut, dotsOf, facingOf, fillet, resample, pathLength, cut, pointAlong, tangentAlong, spiral, arcPoints };
})();
const TB = (() => {



const LIGHT = (() => {
  const length = Math.hypot(-0.55, -0.835);
  return [-0.55 / length, -0.835 / length];
})();

const poly = (points, closed = true) => pathOf(points, closed);

const area = (points) => points.reduce((sum, [x, y], index) => {
  const [nx, ny] = points[(index + 1) % points.length];
  return sum + x * ny - nx * y;
}, 0);

function sideOf(frames) {
  const out = { left: [], right: [], shineA: [], shineB: [], shadeA: [], shadeB: [] };
  for (const { p, nx, ny, half } of frames) {
    out.left.push([p[0] + nx * half, p[1] + ny * half]);
    out.right.push([p[0] - nx * half, p[1] - ny * half]);
    const toward = nx * LIGHT[0] + ny * LIGHT[1];
    const shineAt = half * 0.44 * toward;
    const shineHalf = half * 0.24;
    out.shineA.push([p[0] + nx * (shineAt + shineHalf), p[1] + ny * (shineAt + shineHalf)]);
    out.shineB.push([p[0] + nx * (shineAt - shineHalf), p[1] + ny * (shineAt - shineHalf)]);
    const shadeAt = -half * 0.62 * toward;
    const shadeHalf = half * 0.2;
    out.shadeA.push([p[0] + nx * (shadeAt + shadeHalf), p[1] + ny * (shadeAt + shadeHalf)]);
    out.shadeB.push([p[0] + nx * (shadeAt - shadeHalf), p[1] + ny * (shadeAt - shadeHalf)]);
  }
  return out;
}

function capOf(centre, tangent, radius, inward, P) {
  const V = G.viewOf(P);
  let n1 = G.cross3(tangent, V);
  if (G.len3(n1) < 1e-6) n1 = G.frameAlong([0, 0, 0], tangent).u;
  n1 = G.unit3(n1);
  const n2 = G.unit3(G.cross3(tangent, n1));
  const steps = 28;
  const ring = Array.from({ length: steps }, (_, index) => {
    const angle = (index / steps) * Math.PI * 2;
    return iso(G.add3(centre, G.add3(G.mul3(n1, radius * Math.cos(angle)), G.mul3(n2, radius * Math.sin(angle)))), P);
  });
  const c = iso(centre, P);
  const probe = iso(G.add3(centre, n2), P);
  const along = (probe[0] - c[0]) * inward[0] + (probe[1] - c[1]) * inward[1];
  const from = along > 0 ? steps / 2 : 0;
  const half = (start) => Array.from({ length: steps / 2 + 1 }, (_, index) => ring[(start + index) % steps]);
  return { ring, arc: half(from), inner: half((from + steps / 2) % steps) };
}

function stripeEnd(half, centre, nx, ny, from, to) {
  const offset = (p) => (p[0] - centre[0]) * nx + (p[1] - centre[1]) * ny;
  const values = half.map(offset);
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  const points = [];
  const cross = (k, level) => {
    const t = (level - values[k]) / (values[k + 1] - values[k] || 1e-9);
    return [half[k][0] + (half[k + 1][0] - half[k][0]) * t, half[k][1] + (half[k + 1][1] - half[k][1]) * t];
  };
  for (let k = 0; k < half.length; k++) {
    if (values[k] >= lo && values[k] <= hi) points.push(half[k]);
    if (k < half.length - 1) for (const level of [lo, hi]) if ((values[k] - level) * (values[k + 1] - level) < 0) points.push(cross(k, level));
  }
  const order = points.map((p) => offset(p));
  const sorted = points.map((p, index) => [p, order[index]]).sort((x, y) => (from > to ? y[1] - x[1] : x[1] - y[1]));
  return sorted.map(([p]) => p);
}

function spansOf(total, gaps, breaks, maxLength, closed) {
  const cuts = gaps
    .map(([a, b]) => [Math.max(0, Math.min(a, b)), Math.min(total, Math.max(a, b))])
    .filter(([a, b]) => b - a > 1e-6)
    .sort((x, y) => x[0] - y[0]);
  const runs = [];
  let at = 0;
  for (const [a, b] of cuts) {
    if (a > at + 1e-6) runs.push([at, a, at > 0, true]);
    at = Math.max(at, b);
  }
  if (total > at + 1e-6) runs.push([at, total, at > 0, cuts.length > 0 && cuts[cuts.length - 1][1] >= total - 1e-6]);
  const pieces = [];
  for (const [from, to, gapStart, gapEnd] of runs) {
    const stops = [from, ...breaks.filter((b) => b > from + 1e-6 && b < to - 1e-6).sort((x, y) => x - y), to];
    for (let index = 0; index < stops.length - 1; index++) {
      const a = stops[index];
      const b = stops[index + 1];
      const count = Math.max(1, Math.ceil((b - a) / maxLength - 1e-9));
      for (let c = 0; c < count; c++) {
        pieces.push({
          from: a + ((b - a) * c) / count,
          to: a + ((b - a) * (c + 1)) / count,
          open0: !(index === 0 && c === 0),
          open1: !(index === stops.length - 2 && c === count - 1),
          gap0: index === 0 && c === 0 && gapStart,
          gap1: index === stops.length - 2 && c === count - 1 && gapEnd,
        });
      }
    }
  }
  if (closed && !cuts.length && pieces.length) {
    pieces[0].open0 = true;
    pieces[pieces.length - 1].open1 = true;
  }
  return pieces;
}

function runsOf(total, gaps = []) {
  const cuts = gaps
    .map(([a, b]) => [Math.max(0, Math.min(a, b)), Math.min(total, Math.max(a, b))])
    .filter(([a, b]) => b - a > 1e-6)
    .sort((x, y) => x[0] - y[0]);
  const runs = [];
  let at = 0;
  for (const [a, b] of cuts) {
    if (a > at + 1e-6) runs.push([at, a]);
    at = Math.max(at, b);
  }
  if (total > at + 1e-6) runs.push([at, total]);
  return runs;
}

function crossingsOf(points, centre, axis, radius) {
  const n = G.unit3(axis);
  const out = [];
  let walked = 0;
  for (let index = 1; index < points.length; index++) {
    const a = points[index - 1];
    const b = points[index];
    const length = G.len3(G.sub3(b, a));
    const da = G.dot3(G.sub3(a, centre), n);
    const db = G.dot3(G.sub3(b, centre), n);
    if ((da <= 0 && db > 0) || (da >= 0 && db < 0)) {
      const t = da / (da - db);
      const p = G.lerp3(a, b, t);
      if (G.len3(G.sub3(p, centre)) <= radius) out.push(walked + t * length);
    }
    walked += length;
  }
  return out;
}

function ringsOf(dense, total, radiusAt, P, span, { pitch = 3, twist = 0, cross = false, fade = [0.1, 0.55], phase = 0, steps = 16 } = {}) {
  const V = G.viewOf(P);
  const [lo, hi] = span;
  const margin = twist ? 0 : Math.min(pitch * 0.35, (hi - lo) / 2);
  const from = Math.max(lo, span.real0 ? lo + margin : lo);
  const to = Math.min(hi, span.real1 ? hi - margin : hi);
  if (to <= from) return [];
  const out = [];
  const hands = twist ? (cross ? [1, -1] : [1]) : [0];
  const reach = Math.abs(twist) * Math.max(...[0, 0.5, 1].map(radiusAt));
  const first = Math.ceil((from - reach - phase) / pitch);
  const last = Math.floor((to + reach - phase) / pitch);
  const surface = (t, theta) => {
    const at = Math.max(0, Math.min(total, t));
    const c = G.pointAlong(dense, at);
    const T = G.tangentAlong(dense, at);
    let n1 = G.cross3(T, V);
    if (G.len3(n1) < 1e-6) return null;
    n1 = G.unit3(n1);
    let n2 = G.unit3(G.cross3(T, n1));
    if (G.dot3(n2, V) < 0) n2 = G.mul3(n2, -1);
    const r = radiusAt(at / (total || 1));
    const normal = G.add3(G.mul3(n1, Math.cos(theta)), G.mul3(n2, Math.sin(theta)));
    return { p: iso(G.add3(c, G.mul3(normal, r)), P), facing: G.dot3(normal, V), r };
  };
  for (let index = first; index <= last; index++) {
    const station = phase + index * pitch;
    for (const hand of hands) {
      const samples = [];
      for (let step = 0; step <= steps; step++) {
        const theta = (step / steps) * Math.PI;
        const t = station + hand * twist * radiusAt(Math.max(0, Math.min(1, station / (total || 1)))) * (step / steps - 0.5);
        samples.push({ t, theta });
      }
      for (let step = 0; step < steps; step++) {
        let a = samples[step];
        let b = samples[step + 1];
        if ((a.t < from && b.t < from) || (a.t > to && b.t > to)) continue;
        const clipTo = (x, y, edge) => ({ t: edge, theta: x.theta + ((y.theta - x.theta) * (edge - x.t)) / (y.t - x.t || 1e-9) });
        if (a.t < from) a = clipTo(a, b, from);
        if (b.t < from) b = clipTo(b, a, from);
        if (a.t > to) a = clipTo(a, b, to);
        if (b.t > to) b = clipTo(b, a, to);
        const pa = surface(a.t, a.theta);
        const pb = surface(b.t, b.theta);
        if (!pa || !pb) continue;
        const alpha = fade ? G.fadeOf((pa.facing + pb.facing) / 2, fade) : 1;
        if (alpha <= 0.02) continue;
        out.push({ d: pathOf([pa.p, pb.p]), alpha });
      }
    }
  }
  return out;
}

function tubePieces(points3, radius, P, { maxLength = 30, spacing = 2.2, closed = false, breaks = [], gaps = [], caps = true, stripes = "auto", rings = null } = {}) {
  const dense = G.resample(points3, spacing);
  const total = G.pathLength(dense);
  const radiusAt = typeof radius === "function" ? radius : () => radius;
  const k = G.scaleOf(P);
  const wide = stripes === "auto" ? Math.max(...Array.from({ length: 33 }, (_, index) => radiusAt(index / 32))) * k > 1.3 : Boolean(stripes);
  const lead = 0.5;
  const out = [];
  const looped = closed && !gaps.length;
  const wrap = (at) => (looped ? ((at % total) + total) % total : Math.max(0, Math.min(total, at)));
  const step = Math.max(0.05, Math.min(spacing, total / 4) * 0.5);
  const frameAt = (at, p, width) => {
    const a = iso(G.pointAlong(dense, wrap(at - step)), P);
    const b = iso(G.pointAlong(dense, wrap(at + step)), P);
    let tx = b[0] - a[0];
    let ty = b[1] - a[1];
    const length = Math.hypot(tx, ty) || 1;
    tx /= length;
    ty /= length;
    return { p, nx: -ty, ny: tx, half: width };
  };
  const partOf = (start, end) => {
    let points = G.cut(dense, Math.max(0, start), Math.min(total, end));
    if (looped && start < 0) points = [...G.cut(dense, total + start, total), ...points.slice(1)];
    if (looped && end > total) points = [...points, ...G.cut(dense, 0, end - total).slice(1)];
    let walked = looped ? start : Math.max(0, start);
    const along = points.map((point, index) => {
      if (index > 0) walked += G.len3(G.sub3(point, points[index - 1]));
      return walked;
    });
    const flat = points.map((point) => iso(point, P));
    const widths = along.map((at) => radiusAt(looped ? wrap(at) / total : Math.min(1, Math.max(0, at / total))) * k);
    const frames = flat.map((p, index) => frameAt(along[index], p, widths[index]));
    return { points, flat, widths, frames };
  };
  for (const piece of spansOf(total, gaps, breaks, maxLength, closed)) {
    const openStart = piece.open0 && (piece.from > 0 || looped);
    const openEnd = piece.open1 && (piece.to < total || looped);
    const body = partOf(openStart ? piece.from - lead : piece.from, openEnd ? piece.to + lead : piece.to);
    if (body.points.length < 2) continue;
    const stripe = openStart || openEnd ? partOf(openStart ? piece.from - 2 * lead : piece.from, openEnd ? piece.to + 2 * lead : piece.to) : body;
    const { points: part, flat, widths, frames } = body;
    const sides = sideOf(frames);
    const bands = stripe === body ? sides : sideOf(stripe.frames);
    let bodyPath = poly([...sides.left, ...sides.right.slice().reverse()]);
    let edges = pathOf(sides.left) + pathOf(sides.right);
    const ends = [!piece.open0 && !looped && (piece.from <= 1e-6 || piece.gap0), !piece.open1 && !looped && (piece.to >= total - 1e-6 || piece.gap1)];
    const capped = [ends[0] && (piece.gap0 || [caps].flat()[0]), ends[1] && (piece.gap1 || [caps].flat().at(-1))];
    const sign = Math.sign(area([...sides.left, ...sides.right.slice().reverse()]));
    const tips = [null, null];
    [0, 1].forEach((side) => {
      if (!capped[side]) return;
      const at = side ? part.length - 1 : 0;
      const other = side ? part.length - 2 : 1;
      const tangent = G.unit3(G.sub3(part[side ? at : other], part[side ? other : at]));
      const outward = side ? tangent : G.mul3(tangent, -1);
      const inward = [flat[other][0] - flat[at][0], flat[other][1] - flat[at][1]];
      const { ring, arc, inner } = capOf(part[at], tangent, widths[at] / k, inward, P);
      const oriented = Math.sign(area(ring)) === sign ? ring : ring.slice().reverse();
      bodyPath += poly(oriented);
      edges += pathOf(arc);
      const open = G.dot3(outward, G.viewOf(P)) > 0;
      if (open) edges += pathOf(inner);
      tips[side] = { half: open ? inner : arc, frame: frames[at] };
    });
    const band = (a, b, offsets) => {
      const head = tips[1] ? stripeEnd(tips[1].half, tips[1].frame.p, tips[1].frame.nx, tips[1].frame.ny, offsets(tips[1].frame)[0], offsets(tips[1].frame)[1]) : [];
      const tail = tips[0] ? stripeEnd(tips[0].half, tips[0].frame.p, tips[0].frame.nx, tips[0].frame.ny, offsets(tips[0].frame)[1], offsets(tips[0].frame)[0]) : [];
      return poly([...a, ...head, ...b.slice().reverse(), ...tail]);
    };
    const toward = ({ nx, ny }) => nx * LIGHT[0] + ny * LIGHT[1];
    const shineOffsets = (frame) => [frame.half * 0.44 * toward(frame) + frame.half * 0.24, frame.half * 0.44 * toward(frame) - frame.half * 0.24];
    const shadeOffsets = (frame) => [-frame.half * 0.62 * toward(frame) + frame.half * 0.2, -frame.half * 0.62 * toward(frame) - frame.half * 0.2];
    const ringSpan = Object.assign([openStart ? piece.from - 2 * lead : piece.from, openEnd ? piece.to + 2 * lead : piece.to], { real0: !openStart, real1: !openEnd });
    out.push({
      rings: rings ? ringsOf(dense, total, radiusAt, P, ringSpan, rings) : [],
      ringTone: rings?.tone ?? "lo",
      mid: G.pointAlong(dense, (piece.from + piece.to) / 2),
      body: bodyPath,
      shine: band(bands.shineA, bands.shineB, shineOffsets),
      shade: band(bands.shadeA, bands.shadeB, shadeOffsets),
      edges,
      wide,
      points: part,
      radii: widths.map((width) => width / k),
      ends,
      from: piece.from,
      to: piece.to,
    });
  }
  return out;
}

function ringsSvg(rings, tone = "lo") {
  const groups = new Map();
  for (const { d, alpha } of rings ?? []) {
    const level = Math.min(1, Math.round(alpha * 20) / 20);
    if (level <= 0) continue;
    groups.set(level, (groups.get(level) ?? "") + d);
  }
  return [...groups].map(([alpha, d]) => `<path class="tb-ring" data-tone="${tone}" d="${d}"${alpha < 1 ? ` opacity="${alpha.toFixed(2)}"` : ""}/>`).join("");
}

function tubeSvg(piece, { tone = "hi" } = {}) {
  const shine = piece.wide ? `<path class="tb-shine" d="${piece.shine}"/><path class="tb-shade" d="${piece.shade}"/>` : "";
  return `<g class="tb"><path class="tb-body" d="${piece.body}"/>${shine}${ringsSvg(piece.rings, piece.ringTone)}<path class="iso-line tb-edge" data-tone="${tone}" d="${piece.edges}"/></g>`;
}

return { runsOf, crossingsOf, tubePieces, ringsSvg, tubeSvg };
})();
const D = (() => {
// Dessin des raccords et des bouts de tube, dans le navigateur comme dans Node (figures raccords, choix-raccord).
// Un raccord du catalogue (figures/_data/raccords.mjs) : { material, mode, type, sizes, ends, angle }.
// Corps tiré au tube (kit tube.mjs : coudes lisses), extrémités tournées (lathe.mjs), écrous en prismes hexagonaux,
// peints par profondeur. Les tubes présentés (choix-raccord) partent de la bouche de chaque extrémité, à fleur.
// `k` = fonctions du kit iso (iso, pathOf, depthOf, solidSvg, lineSvg, topMatrix, faceTextSvg), `G` = lathe, `TB` = tube.

function makeDraw(k, G, TB) {
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

return { makeDraw };
})();
const SA = (() => {
// Dessin des 7 raccords acier à visser (figure raccords-acier, Q101), dans le navigateur comme dans Node.
// Manchon, mamelon, réduction, coude et té passent par raccords-draw (corps tiré au tube, extrémités tournées,
// six pans) ; l'union 3 pièces et le bouchon / capuchon sont tournés ici. Chaque raccord se montre seul, avec ses
// repères M ou F à chaque bouche, ou monté sur ses tubes filetés et ses orifices femelles.
// `k` = kit iso, `G` = lathe, `TB` = tube, `D` = raccords-draw.

function makeSteelDraw(k, G, TB, D) {
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

return { makeSteelDraw };
})();
const AC = (() => {
// Raccords acier à visser de la figure `raccords-acier` (Partie 4, module 2, section « Acier, PVC, mixtes » ; Q101).
// Les 7 raccords que cite la section : forme, filetages (mâle M à l'extérieur, femelle F à l'intérieur), fonction,
// particularité ; puis les situations du mode « Reconnaître ». Filetages de tuyauteries d'eau ou d'acier galvanisé,
// jamais du circuit frigorifique (section « Sans flamme »). Rien en base (Q73).

const L = (fr, en) => ({ fr, en });

const FUNCTIONS = {
  prolonger: L("Prolonger en ligne droite", "Extend in a straight line"),
  "relier-femelles": L("Relier deux entrées femelles", "Join two female ports"),
  "changer-diametre": L("Changer de diamètre", "Change diameter"),
  "changer-direction": L("Changer de direction", "Change direction"),
  demonter: L("Raccorder en restant démontable", "Join and stay removable"),
  deriver: L("Créer une dérivation", "Make a branch"),
  fermer: L("Fermer une conduite", "Close a line"),
};

const FITTINGS = {
  manchon: {
    name: L("Manchon", "Coupling (socket)"),
    threads: ["F/F"], threadsLabel: L("Femelle / femelle", "Female / female"),
    function: "prolonger", ways: 2,
    feature: L("Relie deux tubes ou embouts mâles de même diamètre", "Joins two male tubes or ends of the same diameter"),
    detail: L("Cylindre creux taraudé aux deux bouts, de même diamètre : on y visse deux tubes filetés bout à bout.", "Hollow cylinder threaded inside at both ends, same diameter: two threaded tubes screw into it end to end."),
  },
  mamelon: {
    name: L("Mamelon", "Nipple (hex)"),
    threads: ["M/M"], threadsLabel: L("Mâle / mâle", "Male / male"),
    function: "relier-femelles", ways: 2,
    feature: L("Six pans au milieu pour la clé", "Hexagon in the middle for the spanner"),
    detail: L("L'inverse du manchon : fileté à l'extérieur aux deux bouts, avec un six pans central ; il assemble deux raccords ou appareils femelles.", "The opposite of the coupling: threaded outside at both ends, with a central hexagon; it joins two female fittings or appliances."),
  },
  reduction: {
    name: L("Réduction", "Reducer (bush)"),
    threads: ["M/F", "F/F"], threadsLabel: L("Mâle / femelle (ou femelle / femelle)", "Male / female (or female / female)"),
    function: "changer-diametre", ways: 2,
    feature: L("Deux diamètres différents, souvent mâle grand et femelle petit", "Two different diameters, often large male and small female"),
    detail: L("Le côté mâle, le plus gros, se visse dans un raccord femelle plus grand ; le côté femelle, plus petit, reçoit le tube réduit, sans rallonger la ligne.", "The larger male side screws into a larger female fitting; the smaller female side takes the reduced pipe, without lengthening the line."),
  },
  coude: {
    name: L("Coude", "Elbow"),
    threads: ["M/M", "M/F", "F/F"], threadsLabel: L("Mâle / mâle, mâle / femelle ou femelle / femelle", "Male / male, male / female or female / female"),
    function: "changer-direction", ways: 2,
    feature: L("Forme un angle, le plus souvent 90° ou 45°", "Forms an angle, usually 90° or 45°"),
    detail: L("Il change l'axe de la tuyauterie sans cintrer le tube.", "It changes the axis of the pipework without bending the pipe."),
  },
  union: {
    name: L("Union (3 pièces)", "Union (3-piece)"),
    threads: ["3 pièces"], threadsLabel: L("Trois pièces : deux embouts et un écrou libre", "Three pieces: two tailpieces and a loose nut"),
    function: "demonter", ways: 2,
    feature: L("Démonte un appareil sans tourner les tuyaux", "Removes an appliance without turning the pipes"),
    detail: L("Chaque embout se visse sur son tube, puis l'écrou central les serre l'un contre l'autre : on démonte une pompe ou une vanne sans couper ni vriller la tuyauterie. À ne pas confondre avec le raccord union dudgeon mâle/mâle du frigoriste.", "Each tailpiece screws onto its pipe, then the central nut pulls them together: a pump or valve comes out without cutting or twisting the pipework. Not to be confused with the refrigeration male/male flare union."),
  },
  te: {
    name: L("Té", "Tee"),
    threads: ["F/F/F", "M/M/M"], threadsLabel: L("Trois voies, femelles (ou mâles)", "Three ways, female (or male)"),
    function: "deriver", ways: 3,
    feature: L("Trois ouvertures en T, la dérivation à 90°", "Three openings in a T, the branch at 90°"),
    detail: L("Deux voies dans l'alignement et une piquée à 90° : dérivation vers un autre circuit, ou pose d'un manomètre, d'un purgeur, d'une sonde ; égal ou réduit (piquage plus petit).", "Two ways in line and one branch at 90°: a branch to another circuit, or a place for a gauge, a vent or a sensor; equal or reducing (smaller branch)."),
  },
  bouchon: {
    name: L("Bouchon (ou capuchon)", "Plug (or cap)"),
    threads: ["M", "F"], threadsLabel: L("Mâle seul (bouchon) ou femelle seul (capuchon)", "Male only (plug) or female only (cap)"),
    function: "fermer", ways: 1,
    feature: L("Une seule ouverture, fond plein", "One opening only, solid end"),
    detail: L("Il obture de façon étanche un bout de tube ou une sortie inutilisée : le bouchon mâle se visse dans un femelle, le capuchon femelle coiffe un filetage mâle.", "It seals a pipe end or an unused outlet: the male plug screws into a female thread, the female cap goes over a male thread."),
  },
};

const ORDER = ["manchon", "mamelon", "reduction", "coude", "union", "te", "bouchon"];

// Situations d'atelier : la fonction attendue désigne un seul raccord.
const CASES = [
  { function: "demonter", ask: L("Il faudra pouvoir déposer la pompe sans tourner les tuyaux.", "The pump must come out without turning the pipes.") },
  { function: "fermer", ask: L("Une sortie d'un té reste inutilisée : il faut la condamner.", "One outlet of a tee is not used: it must be sealed.") },
  { function: "fermer", ask: L("Un tube fileté mâle attend une extension future : on le coiffe.", "A male threaded pipe awaits a future extension: it is capped.") },
  { function: "relier-femelles", ask: L("Visser une vanne femelle directement dans un raccord femelle.", "Screw a female valve straight into a female fitting.") },
  { function: "changer-diametre", ask: L("Passer d'une sortie femelle 3/4\" à un tube 1/2\" sans rallonger la ligne.", "Go from a 3/4\" female outlet to a 1/2\" pipe without lengthening the line.") },
  { function: "deriver", ask: L("Poser un manomètre sur la conduite.", "Fit a pressure gauge on the line.") },
  { function: "deriver", ask: L("Alimenter un second circuit à partir de la conduite.", "Feed a second circuit from the line.") },
  { function: "changer-direction", ask: L("Longer un mur puis tourner à 90°, sans cintrer.", "Run along a wall then turn 90°, without bending.") },
  { function: "prolonger", ask: L("Rabouter deux tubes filetés mâles du même diamètre.", "Join two male threaded pipes of the same diameter end to end.") },
];

const rotate = (list, n) => [...list.slice(n % list.length), ...list.slice(0, n % list.length)];
const keyOf = (fn) => ORDER.find((k) => FITTINGS[k].function === fn);

function buildSteelFittings() {
  const out = [];
  const push = (kind, level, rest) => out.push({ key: `${kind}|${JSON.stringify(rest)}`, level, kind, ...rest });
  ORDER.forEach((key, i) => {
    const others = rotate(ORDER.filter((x) => x !== key), i).slice(0, 3);
    const options = [key, ...others].sort();
    push("nom", 1, { fitting: key, answer: key, options });
    push("fonction", 1, { fitting: key, answer: key, options });
    // Filetage : aucun leurre ne partage un filetage avec la bonne réponse (un coude F/F rendrait juste le manchon).
    const apart = ORDER.filter((x) => x !== key && !FITTINGS[x].threads.some((t) => FITTINGS[key].threads.includes(t)));
    push("filetage", 2, { fitting: key, answer: key, options: [key, ...rotate(apart, i).slice(0, 3)].sort() });
    push("particularite", 2, { fitting: key, answer: key, options });
  });
  CASES.forEach((c, i) => {
    const key = keyOf(c.function);
    const others = rotate(ORDER.filter((x) => x !== key), i + 2).slice(0, 3);
    push("situation", 3, { case: i, function: c.function, answer: key, options: [key, ...others].sort() });
  });
  const fittings = Object.fromEntries(ORDER.map((key) => [key, { ...FITTINGS[key], functionLabel: FUNCTIONS[FITTINGS[key].function] }]));
  return { functions: FUNCTIONS, fittings, order: ORDER, cases: CASES, situations: out };
}

return { FUNCTIONS, FITTINGS, ORDER, buildSteelFittings };
})();
const LANG = "fr";
const PROJ = {"origin":[340,196.15784120898743],"scale":2.5233991200555423,"azimuth":120,"elevation":30};
const TX = {buttons:{"explore":"Explorer","compare":"Comparer","quiz":"Reconnaître","prev":"Précédent","next":"Suivant","mounted":"Voir monté","alone":"Voir seul","again":"Situation suivante","series":"Nouvelle série"},tour:(i, n, view) => `raccord ${i} / ${n} · ${view}`,views:{"alone":"seul, repères M et F","mounted":"monté"},unionKey:"1 et 3 : embouts ; 2 : écrou libre.",ask:{"nom":"Comment s'appelle ce raccord ?","fonction":(fn) => `Quel raccord sert à : ${fn.toLowerCase()} ?`,"filetage":"Quels filetages a ce raccord ?","particularite":(f) => `Quel raccord se reconnaît à ceci : ${f.toLowerCase()} ?`,"situation":(c) => `${c} Quel raccord ?`},right:"Juste.",wrong:(a) => `Non : la bonne réponse est « ${a} ».`,done:(g, t) => `Série terminée : ${g} / ${t}. Lancez une nouvelle série pour d'autres situations.`,step:(i, n) => `situation ${i} / ${n}`,score:(g, t) => `Score de la série : ${g} / ${t}`,marks:{"right":"Bonne réponse","wrong":"Votre réponse, fausse"}};

const still = matchMedia("(prefers-reduced-motion: reduce)");
const scope = document.querySelector('.live-figure[data-figure="raccords-acier"]') || document;
const root = scope.querySelector(".iso-plate");
const stage = root.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const readout = root.querySelector("[data-readout]");
const feedback = scope.querySelector(".mv-feedback");
const scoreEl = scope.querySelector(".mv-score");
const buttons = Object.fromEntries([...scope.querySelectorAll(".mv-controls button")].map((b) => [b.dataset.act, b]));
let frame = 0, last = 0, visible = false;
function loop(step, busy) {
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60; last = now;
    step(still.matches ? dt * 6 : dt);
    frame = visible && busy() ? requestAnimationFrame(tick) : 0;
  }
  return () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
}

const K = { iso, pathOf, depthOf, solidSvg, lineSvg, haloOf, cylinder };
const SD = SA.makeSteelDraw(K, G, TB, D);
const CAT = AC.buildSteelFittings();
const F = CAT.fittings;
const live = svg.querySelector(".rc-live");
const prompt = scope.querySelector(".rc-prompt");
const quizBox = scope.querySelector(".rc-quiz");
const compareBox = scope.querySelector(".ra-compare");
// Les réponses vont dans la liste du mode « Reconnaître ».
const optionsBox = scope.querySelector(".rc-quiz .rc-options");
let mode = "explore", at = 0, mounted = false;
function paint(key, asMounted) { live.innerHTML = key ? SD.scene(key, PROJ, { mounted: asMounted }) : ""; }
function card(key) {
  const f = F[key];
  return [f.name[LANG] + ".", f.threadsLabel[LANG] + ".", f.functionLabel[LANG] + ".", f.detail[LANG], key === "union" && !mounted ? TX.unionKey : ""].filter(Boolean).join(" ");
}
function showTour() {
  const key = CAT.order[at];
  paint(key, mounted);
  prompt.textContent = TX.tour(at + 1, CAT.order.length, mounted ? TX.views.mounted : TX.views.alone);
  readout.textContent = F[key].name[LANG];
  feedback.textContent = card(key);
  buttons.mounted.textContent = mounted ? TX.buttons.alone : TX.buttons.mounted;
  buttons.mounted.setAttribute("aria-pressed", mounted);
}
// ---------------------------------------------------------------- Reconnaître
const pool = { 1: [], 2: [], 3: [] };
CAT.situations.forEach((s) => pool[s.level].push(s));
const PLAN = [1, 1, 1, 1, 2, 2, 2, 3, 3, 3];
let list = [], qi = 0, good = 0, answered = false;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const label = (s, o) => (s.kind === "filetage" ? F[o].threadsLabel[LANG] : F[o].name[LANG]);
function ask(s) {
  const f = F[s.fitting || s.answer];
  if (s.kind === "fonction") return TX.ask.fonction(f.functionLabel[LANG]);
  if (s.kind === "particularite") return TX.ask.particularite(f.feature[LANG]);
  if (s.kind === "situation") return TX.ask.situation(CAT.cases[s.case].ask[LANG]);
  return TX.ask[s.kind];
}
function qshow() {
  answered = false;
  const s = list[qi];
  // Nom et filetage : le raccord est dessiné ; sinon il n'apparaît qu'à la correction.
  paint(s.kind === "nom" || s.kind === "filetage" ? s.fitting : null, false);
  readout.textContent = "";
  prompt.textContent = ask(s);
  optionsBox.replaceChildren(...s.options.slice().sort(() => Math.random() - 0.5).map((o) => {
    const b = document.createElement("button"); b.type = "button"; b.textContent = label(s, o); b._o = o;
    b.addEventListener("click", () => answer(o)); return b;
  }));
  feedback.textContent = "";
  buttons.again.disabled = true;
  scoreEl.textContent = TX.score(good, qi) + " · " + TX.step(qi + 1, list.length);
}
function answer(o) {
  if (answered) return;
  answered = true;
  const s = list[qi], ok = same(o, s.answer);
  if (ok) good++;
  for (const b of optionsBox.children) {
    b.disabled = true;
    if (same(b._o, s.answer)) { b.dataset.state = "right"; b.prepend("✓ "); b.setAttribute("aria-label", TX.marks.right + " : " + b.textContent.slice(2)); }
    else if (same(b._o, o)) { b.dataset.state = "wrong"; b.prepend("✗ "); b.setAttribute("aria-label", TX.marks.wrong + " : " + b.textContent.slice(2)); }
  }
  // Correction dessinée : le bon raccord, monté pour une situation d'atelier.
  paint(s.answer, s.kind === "situation");
  readout.textContent = F[s.answer].name[LANG];
  const last = qi === list.length - 1;
  feedback.textContent = [ok ? TX.right : TX.wrong(label(s, s.answer)), F[s.answer].name[LANG] + ". " + F[s.answer].detail[LANG], last ? TX.done(good, list.length) : ""].filter(Boolean).join(" ");
  buttons.again.disabled = last;
  scoreEl.textContent = TX.score(good, qi + 1) + " · " + TX.step(qi + 1, list.length);
}
function start() {
  list = [];
  for (const level of PLAN) {
    const kinds = {};
    pool[level].forEach((x) => (kinds[x.kind] ||= []).push(x));
    const groups = Object.values(kinds);
    let s;
    for (let i = 0; i < 40; i++) { const g = groups[Math.floor(Math.random() * groups.length)]; s = g[Math.floor(Math.random() * g.length)]; if (!list.includes(s)) break; }
    list.push(s);
  }
  qi = 0; good = 0; qshow();
}
buttons.again.addEventListener("click", () => { if (qi < list.length - 1) { qi++; qshow(); } });
buttons.series.addEventListener("click", start);
// ---------------------------------------------------------------- Comparer
for (const b of compareBox.querySelectorAll("button[data-fit]")) b.addEventListener("click", () => {
  for (const o of compareBox.querySelectorAll("button[data-fit]")) o.setAttribute("aria-pressed", o === b);
  paint(b.dataset.fit, false);
  readout.textContent = F[b.dataset.fit].name[LANG];
  feedback.textContent = card(b.dataset.fit);
});
function setMode(next) {
  mode = next;
  for (const m of ["explore", "compare", "quiz"]) buttons[m].setAttribute("aria-pressed", m === mode);
  for (const act of ["prev", "next", "mounted"]) buttons[act].hidden = mode !== "explore";
  quizBox.hidden = mode !== "quiz";
  compareBox.hidden = mode !== "compare";
  scoreEl.textContent = ""; feedback.textContent = ""; prompt.textContent = "";
  if (mode === "explore") showTour();
  else if (mode === "compare") compareBox.querySelector("button[data-fit]").click();
  else start();
}
buttons.explore.addEventListener("click", () => setMode("explore"));
buttons.compare.addEventListener("click", () => setMode("compare"));
buttons.quiz.addEventListener("click", () => setMode("quiz"));
buttons.prev.addEventListener("click", () => { at = (at + CAT.order.length - 1) % CAT.order.length; showTour(); });
buttons.next.addEventListener("click", () => { at = (at + 1) % CAT.order.length; showTour(); });
buttons.mounted.addEventListener("click", () => { mounted = !mounted; showTour(); });
for (const b of scope.querySelectorAll(".mv-controls button, .ra-compare button")) b.disabled = false;
const run = () => {};
window.__ra = { setMode, show: (i, m) => { at = i; mounted = !!m; showTour(); }, answer: (i) => answer(list[qi].options[i]), current: () => list[qi] };
setMode("explore");
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);

})();
