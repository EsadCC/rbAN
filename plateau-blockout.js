// Sandy Plateau, STAGE 1 BLOCKOUT (skills/one-stud/large-sets.md). Plain tones, heights + flow only. build() → { name, parts, groups, player, zones, stairs }.
// 100×100 plot, +X east, −Z back (inland), +Z front (beach, sea). Beach top y = 0.
// Levels: Beach 0 (arrival flat) → Terrace 6 (wide walkable) → Plateau 12 (temple) → back rim 18/24. East massif steps 12/18/24 in x and z. Back + east = cliff edges; west + front open.
// Route: spawn → Stair1 (0→6) → terrace → Stair2 (6→12) → temple. Loop back: WestStair (12→6) → shelf → Stair4 (6→0) → beach.
// Budget: uncapped (user). Spend where it reads: cliff edges, temple, path edges; keep flats quiet and merged.
(function () {
  const BK = (typeof window !== 'undefined' && window.BlockKit) || require('./block-kit.js');
  const N = 50, WATER = -0.8, FLOOR = -4;
  const C = {
    beach: '#bdb7aa', wet: '#a9a397', seabed: '#8f8a80',
    lv: { 6: '#9a968f', 12: '#8d8a86', 18: '#7d7a77', 24: '#6d6a68' },
    temple: '#b8b0a0', path: '#d8d2c4', stair: '#e6e0d0', water: '#5f9fb8',
  };
  const hash = (x, z) => { let h = (x * 374761393 + z * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const SPAWN = [-8, 30];
  const TEMPLE = [0, -42];
  // dir 'z': rises toward −Z from zFoot; dir 'x': rises toward +X from xFoot. 6 wide.
  const STAIRS = [
    { name: 'Stair1', dir: 'z', a0: -12, a1: -7, foot: -2, base: 0, top: 6 },
    { name: 'Stair2', dir: 'z', a0: 8, a1: 13, foot: -20, base: 6, top: 12 },
    { name: 'WestStair', dir: 'x', a0: -42, a1: -37, foot: -38, base: 6, top: 12 },
    { name: 'Stair4', dir: 'z', a0: -48, a1: -43, foot: -20, base: 0, top: 6 },
  ];
  const PATHS = [
    { lv: [0], pts: [SPAWN, [-9, 20], [-9.5, 8], [-9.5, 0]] }, // spawn → Stair1
    { lv: [6], pts: [[-9.5, -9], [-2, -15], [10.5, -17], [10.5, -19]] }, // Stair1 top → Stair2
    { lv: [12], pts: [[10.5, -26], [6, -27], [0, -27]] }, // Stair2 top → grand stair
    { lv: [12], pts: [[2, -27], [-12, -28], [-26, -32], [-34, -39.5]] }, // temple front → WestStair
    { lv: [6], pts: [[-43, -39.5], [-44, -33], [-45.5, -27]] }, // shelf → Stair4 top
    { lv: [0], pts: [[-45.5, -19], [-36, -10], [-22, 0], [-9.5, 6]] }, // Stair4 foot → arrival flat
  ];

  function heights(o = {}) {
    const H = new Map(), K = (x, z) => x + ',' + z;
    for (let x = -N; x < N; x++) for (let z = -N; z < N; z++) {
      const cx = x + 0.5, cz = z + 0.5, j = (hash(x >> 2, z >> 2) - 0.5) * 4, j2 = (hash((x >> 2) + 40, (z >> 2) + 7) - 0.5) * 3;
      let h = 0;
      const sz = 40 + 3 * Math.sin(cx / 9) + (hash(x >> 1, 77) - 0.5) * 2;
      if (cz >= sz + 3) h = -2; else if (cz >= sz) h = -0.5;
      else {
        if (cz < -8 + j && cx < 34 + j2) h = 6;
        if (cz < -26 + j && cx < 34 + j2) h = 12;
        if (cx < -40 + j2 && cz > -26 + j && cz < -8 + j) h = 0; // west terrace falls away to the beach
        if (cx < -38 + j2 && cz < -26 + j) h = 6; // west shelf
        if (cz < -4 + j && cx > 34 + j2) h = Math.max(h, 12);
        if (cz < -10 + j && cx > 40 + j2) h = Math.max(h, 18);
        if (cz < -16 + j && cx > 46 + j2) h = Math.max(h, 24);
        if (cz < -44 + j) h = Math.max(h, 18);
        if (cz < -48 + j) h = Math.max(h, 24);
      }
      if (o.carve && cx > -32 && cx < 32 && cz > -48 && cz < -28) h = 12; // flat footprint for the temple
      const c = h === 0 ? C.beach : h === -0.5 ? C.wet : h < 0 ? C.seabed : C.lv[h];
      H.set(K(x, z), { h, c });
    }
    for (const s of STAIRS) {
      for (let i = 0; i < s.top - s.base; i++) for (let a = s.a0; a <= s.a1; a++) {
        const [x, z] = s.dir === 'z' ? [a, s.foot - i] : [s.foot + i, a];
        H.set(K(x, z), { h: s.base + 1 + i, c: C.stair });
      }
    }
    const smooth = (pts) => { const out = []; for (let i = 0; i + 1 < pts.length; i++) { const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)]; for (let k = 0; k < 6; k++) { const t = k / 6, t2 = t * t, t3 = t2 * t; out.push([0, 1].map((q) => 0.5 * (2 * p1[q] + (-p0[q] + p2[q]) * t + (2 * p0[q] - 5 * p1[q] + 4 * p2[q] - p3[q]) * t2 + (-p0[q] + 3 * p1[q] - 3 * p2[q] + p3[q]) * t3))); } } out.push(pts[pts.length - 1]); return out; };
    const seg = (p, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], d = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / d)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dz); };
    for (const P of PATHS) { const pl = smooth(P.pts); for (let i = 0; i + 1 < pl.length; i++) {
      const [a, b] = [pl[i], pl[i + 1]];
      for (let x = Math.floor(Math.min(a[0], b[0])) - 4; x <= Math.max(a[0], b[0]) + 4; x++) for (let z = Math.floor(Math.min(a[1], b[1])) - 4; z <= Math.max(a[1], b[1]) + 4; z++) {
        const v = H.get(K(x, z));
        if (v && v.c !== C.stair && P.lv.includes(v.h) && seg([x + 0.5, z + 0.5], a, b) < 2.9 + hash(x, z) * 0.5) v.c = C.path;
      }
    } }
    return H;
  }

  function build(o = {}) {
    const K = BK.kit(), H = heights(o), seen = new Set(), key = (x, z) => x + ',' + z;
    const same = (x, z, v) => { const q = H.get(key(x, z)); return q && !seen.has(key(x, z)) && q.h === v.h && q.c === v.c; };
    const group = (c) => (c === C.stair ? 'Blockout/Stairs' : c === C.path ? 'Blockout/Paths' : c === C.beach || c === C.wet || c === C.seabed ? 'Blockout/Beach' : 'Blockout/Terrain');
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
    if (!o.noLandmarks) {
      const G = 'Landmarks/Temple', t = C.temple;
      K.box(G, 'Podium', [64, 8, 13], [0, 16, -41.5], t);
      for (let i = 0; i < 7; i++) K.box(G, 'GrandStair', [14, 1 + i, 1], [0, 12 + (1 + i) / 2, -28.5 - i], t);
      [22, 22, 22, 16, 22, 22, 9, 13].forEach((h, i) => K.box(G, 'Column', [3, h, 3], [-28 + i * 8, 20 + h / 2, -38], t));
      K.box(G, 'Entablature', [20, 4, 4], [-20, 44, -38], t);
      K.box(G, 'Entablature', [12, 4, 4], [8, 44, -38], t);
      K.box(G, 'CellaWall', [18, 16, 8], [-13, 28, -44], t);
      K.box(G, 'CellaWall', [18, 10, 8], [13, 25, -44], t);
      K.box(G, 'DoorLintel', [8, 2, 8], [0, 35, -44], t);
      K.box(G, 'WingW', [10, 22, 8], [-27, 31, -44], t);
      K.box(G, 'WingE', [10, 14, 8], [27, 27, -44], t);
      K.box(G, 'Pediment', [14, 8, 6], [-7, 40, -45], t);
      K.box(G, 'Pediment', [8, 5, 6], [4, 38.5, -45], t);
      [[-36, 14, 5, 3, 4], [-16, 12, 4, 2, 3], [20, 12, 6, 3, 4], [30, 12, 4, 2, 4], [-24, 12, 3, 2, 3]].forEach(([x, z0, w, h, d]) => K.box(G, 'Rubble', [w, h, d], [x, 12 + h / 2, -26 - d / 2 + (z0 - 12) * 0.2], t));
    }
    if (o.extra) o.extra(K);
    K.box('Blockout/Water', 'Water', [2 * N - 0.2, 0.4, 2 * N - 0.2], [0, WATER - 0.2, 0], C.water, { tr: 0.35, cc: false, shadow: false });
    const zones = { Spawn: [SPAWN[0], 0, SPAWN[1]], Terrace: [-10, 6, -17], Plateau: [10, 12, -27], Temple: [TEMPLE[0], 20, TEMPLE[1]], WestShelf: [-44, 6, -36] };
    return { name: 'SandPlateau_Blockout', parts: K.parts, groups: K.groups, player: [SPAWN[0], SPAWN[1], 0, 0], zones, stairs: STAIRS };
  }

  const api = { build, heights, C, N, FLOOR, WATER, TEMPLE, STAIRS, PATHS };
  if (typeof window !== 'undefined') window.SandPlateau = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
