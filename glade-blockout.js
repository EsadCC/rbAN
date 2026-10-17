
// Oak Glade, STAGE 1 BLOCKOUT. Plain tones: heights, stream, paths, clearing, tree footprints. build() → { name, parts, groups, player, zones, trees }.
// 60×60 plot, +X east, −Z back, +Z front (spawn). Ground top y = 0, stream −0.5, low wooded banks rise 1–3 at the back and sides.
// Landmark: ancient oak in the clearing at LAND. Edge trees = mix of the 5 oak kinds as box markers (trunk + crown block). Stumps/logs as markers.
(function () {
  const BK = (typeof window !== 'undefined' && window.BlockKit) || require('./block-kit.js');
  const N = 30, FLOOR = -4;
  const C = {
    lv: { 0: '#7a9a58', 1: '#72915a', 2: '#6a8a52', 3: '#62824a' }, clear: '#8aa862', path: '#9a7f5e', water: '#6a9fb5', bank: '#8a7a5a',
    bark: '#5a4232', crown: '#4a7a3b', crown2: '#3d6a35', mark: '#c98f5a',
  };
  const hash = (x, z) => { let h = (x * 374761393 + z * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const LAND = [-2, -8], SPAWN = [-3, 25], CLEAR_R = 12;
  const STREAM = [[28, -30], [22, -20], [16, -10], [12, 0], [8, 8], [0, 13], [-10, 17], [-20, 15], [-30, 19]];
  const PATHS = [
    [SPAWN, [-3, 16], [-3, 6], [-2, -3]],
    [[-2, -8], [8, -10], [14, -12]],
    [[-2, -14], [-3, -22], [-2, -29]],
    [[-3, -6], [-14, -8], [-25, -6]],
  ];
  const STUMPS = [[-13, -1, 'cut'], [10, -17, 'broken'], [-10, 10, 'cut']];
  const LOGS = [[-22, -17, 14, 4], [3, -23, 15, 4]];
  // kind: [crown width, trunk width, trunk height, crown y0, crown y1]
  const KINDS = { young: [10, 3, 7, 6, 13], mature: [20, 4, 9, 9, 17], lean: [18, 4, 9, 9, 17], twin: [18, 4, 9, 9, 17], ancient: [22, 5, 11, 11, 20] };
  // display-only marker sizes [crown width, total height] = generated-oak averages; placement keeps KINDS
  const DISP = { young: [15, 14], mature: [18, 19], lean: [18, 19], twin: [21, 20], ancient: [25, 23] };
  const seg = (p, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], d = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / d)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dz); };
  const distTo = (p, L) => { let m = 1e9; for (let i = 0; i + 1 < L.length; i++) m = Math.min(m, seg(p, L[i], L[i + 1])); return m; };

  function heights() {
    const H = new Map(), K = (x, z) => x + ',' + z;
    for (let x = -N; x < N; x++) for (let z = -N; z < N; z++) {
      const cx = x + 0.5, cz = z + 0.5, j = (hash(x >> 2, z >> 2) - 0.5) * 3, j2 = (hash((x >> 2) + 40, (z >> 2) + 7) - 0.5) * 3;
      let h = 0;
      if (cz < -20 + j) h = 1;
      if (cz < -25 + j) h = 2;
      if (cz < -28.5 + j * 0.5) h = 3;
      if (cx < -24 + j2) h = Math.max(h, 1);
      if (cx < -27.5 + j2) h = Math.max(h, 2);
      if (cx > 25 + j2) h = Math.max(h, 1);
      if (cx > 28 + j2 * 0.5) h = Math.max(h, 2);
      if (cz > 27.5 + j * 0.5) h = Math.max(h, 1);
      const p = [cx, cz], ds = distTo(p, STREAM), dj = (hash(x, z) - 0.5) * 1.2;
      let c = null;
      if (ds < 2.2 + dj) { h = -0.5; c = C.water; }
      else if (ds < 3.4 + dj && h <= 1) { h = 0; c = C.bank; }
      H.set(K(x, z), { h, c });
    }
    for (let x = -N; x < N; x++) for (let z = -N; z < N; z++) {
      const v = H.get(K(x, z)), p = [x + 0.5, z + 0.5];
      if (v.c) continue;
      let c = C.lv[v.h] || C.lv[3];
      if (v.h === 0 && Math.hypot(p[0] - LAND[0], p[1] - LAND[1]) < CLEAR_R + (hash(x, z) - 0.5) * 3) c = C.clear;
      if (v.h <= 1) for (const P of PATHS) if (distTo(p, P) < 2.2 + hash(x + 9, z) * 0.6) c = C.path;
      v.c = c;
    }
    return H;
  }

  function build(o = {}) {
    const K = BK.kit(), H = heights(), seen = new Set(), key = (x, z) => x + ',' + z;
    const same = (x, z, v) => { const q = H.get(key(x, z)); return q && !seen.has(key(x, z)) && q.h === v.h && q.c === v.c; };
    const group = (c) => (c === C.path ? 'Blockout/Paths' : c === C.water ? 'Blockout/Water' : c === C.bank ? 'Blockout/Bank' : c === C.clear ? 'Blockout/Clearing' : 'Blockout/Grass');
    for (let z = -N; z < N; z++) for (let x = -N; x < N; x++) {
      if (seen.has(key(x, z))) continue;
      const v = H.get(key(x, z));
      let dx = 1, dz = 1;
      while (same(x + dx, z, v)) dx++;
      const row = (zz) => { for (let i = 0; i < dx; i++) if (!same(x + i, zz, v)) return false; return true; };
      while (row(z + dz)) dz++;
      for (let q = 0; q < dz; q++) for (let i = 0; i < dx; i++) seen.add(key(x + i, z + q));
      const hy = v.h - FLOOR;
      K.box(group(v.c), 'Block', [dx, hy, dz], [x + dx / 2, FLOOR + hy / 2, z + dz / 2], v.c);
    }
    const hAt = (x, z) => { const v = H.get(key(Math.floor(x), Math.floor(z))); return v ? v.h : 0; };
    const cAt = (x, z) => { const v = H.get(key(Math.floor(x), Math.floor(z))); return v ? v.c : null; };

    const rnd = (() => { let s = 13; return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
    const placed = [{ kind: 'ancient', x: LAND[0], z: LAND[1], h0: 0, landmark: true }];
    const MIXED = ['mature', 'mature', 'lean', 'twin', 'mature', 'ancient', 'young'];
    const clear = (x, z, r) => { for (let a = x - r; a <= x + r; a++) for (let b = z - r; b <= z + r; b++) { const c = cAt(a, b); if (c === C.path || c === C.water || c === C.bank) return false; } return true; };
    const TOTAL = o.trees || 17;
    for (let t = 0; t < 80000 && placed.length < TOTAL; t++) {
      const pass = t < 40000 ? 0 : 1;
      const x = Math.round(-27 + rnd() * 54), z = Math.round(-27 + rnd() * 54), edge = Math.min(x + N, N - x, z + N, N - z), h0 = hAt(x, z);
      if (edge > 12 && h0 < 1) continue;
      if (Math.hypot(x - LAND[0], z - LAND[1]) < CLEAR_R + 4) continue;
      const kind = pass ? 'young' : MIXED[Math.floor(rnd() * (MIXED.length - 2)) + (rnd() < 0.5 ? 0 : 0)], k = KINDS[kind], r = k[0] / 2;
      if (kind === 'ancient' && placed.filter((p) => p.kind === 'ancient').length > 1) continue;
      if (!clear(x, z, 2) || [[-2, -2], [1, -2], [-2, 1], [1, 1]].some(([a, b]) => hAt(x + a, z + b) !== h0)) continue;
      if (Math.abs(x) > N - 3 || Math.abs(z) > N - 3) continue;
      if (placed.some((p) => Math.max(Math.abs(p.x - x), Math.abs(p.z - z)) < 0.6 * (r + KINDS[p.kind][0] / 2))) continue;
      if (STUMPS.some(([a, b]) => Math.hypot(a - x, b - z) < 8) || LOGS.some(([a, b, l, w]) => x > a - r * 0.5 && x < a + l + r * 0.5 && Math.abs(z - b) < r * 0.3 + 2)) continue;
      placed.push({ kind, x, z, h0 });
    }
    if (o.trees !== 0) placed.forEach((p, i) => {
      const [, tw, th, c0] = KINDS[p.kind], [w, c1] = DISP[p.kind], G = 'Trees/Oak' + (i + 1) + '_' + p.kind;
      K.box(G, 'Trunk', [tw, th, tw], [p.x, p.h0 + th / 2, p.z], C.bark);
      K.box(G, 'Crown', [w - i * 0.04, c1 - c0 - i * 0.04, w - i * 0.04], [p.x, p.h0 + (c0 + c1) / 2, p.z], p.landmark ? C.crown2 : C.crown, { tr: 0.65, cc: false, shadow: false });
    });
    STUMPS.forEach(([x, z], i) => K.box('Markers/Stump', 'Stump' + (i + 1), [4, 4, 4], [x, 2, z], C.mark));
    LOGS.forEach(([x, z, l, w], i) => K.box('Markers/Log', 'Log' + (i + 1), [l, 4, w], [x + l / 2, 2 + Math.max(0, hAt(x, z)), z], C.mark));

    const zones = { Landmark: [LAND[0], 8, LAND[1]], Clearing: [LAND[0], 0, LAND[1]], Stream: [12, 0, 0], Spawn: [SPAWN[0], 0, SPAWN[1]] };
    return { name: 'OakGlade_Blockout', parts: K.parts, groups: K.groups, player: [SPAWN[0], SPAWN[1], 0, 0], zones, trees: placed };
  }

  const api = { build, heights, C, N, FLOOR, LAND, STREAM, PATHS, STUMPS, LOGS, KINDS };
  if (typeof window !== 'undefined') window.OakGlade = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
