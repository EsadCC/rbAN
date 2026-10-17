// Snow Camp, STAGE 1 BLOCKOUT (skills/one-stud/large-sets.md). Plain tones, heights + flow only. build() → { name, parts, groups, player, zones }.
// 60×60 plot, +X east, −Z back (hill), +Z front (spawn). Ground top y = 0.
// Levels: clearing/flats 0, frozen pond −0.5, hill tiers 2/4/6/8 on back, 1/2/4/6 on the sides, 1/2 drift at the front.
// Pines: 19–29 studs tall (tiers 3 high, trunk 4×4), ~10 of them.
// Zones: Fire circle (−5,−6) with 3 benches (east side open to the pond view), Tent (−15,−13) door east, Woodpile, Snowman, Pond (12,8). Pines frame the edges.
(function () {
  const BK = (typeof window !== 'undefined' && window.BlockKit) || require('./block-kit.js');
  const N = 30, FLOOR = -4;
  const C = {
    snow: '#e9eef2', lv: { 1: '#e5ebef', 2: '#e0e7ec', 4: '#d8e0e7', 6: '#d0d9e1', 8: '#c8d2db' },
    ice: '#a9cde0', path: '#c3ccd4', rock: '#8d9096', pine: '#2f4a3a', bark: '#5a4232', mark: '#c98f5a',
  };
  const hash = (x, z) => { let h = (x * 374761393 + z * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const FIRE = [-5, -6], TENT = [-15.5, -12], POND = [12, 8], SNOWMAN = [4, 19], WOOD = [-16.5, -2.5], SPAWN = [-3, 25];
  const PATHS = [
    [SPAWN, [-3, 17], [-4, 8], [-5, 0]],
    [[-3, 15], [1, 14.5], [4, 14]],
    [[-8, -7], [-10, -10], [-10.5, -12]],
    [[3, 19], [-2, 18]],
  ];
  const lvColor = (h) => (h === 0 ? C.snow : h === -0.5 ? C.ice : C.lv[h] || C.lv[8]);

  function heights() {
    const H = new Map(), K = (x, z) => x + ',' + z;
    for (let x = -N; x < N; x++) for (let z = -N; z < N; z++) {
      const cx = x + 0.5, cz = z + 0.5, j = (hash(x >> 2, z >> 2) - 0.5) * 3, j2 = (hash((x >> 2) + 40, (z >> 2) + 7) - 0.5) * 3;
      let h = 0;
      if (cz < -20 + j) h = 2;
      if (cz < -24 + j) h = 4;
      if (cz < -27 + j) h = 6;
      if (cz < -28.5 + j * 0.5) h = 8;
      if (cx < -24 + j2) h = Math.max(h, 1);
      if (cx < -26.5 + j2) h = Math.max(h, 2);
      if (cx < -28.5 + j2 * 0.5) h = Math.max(h, 4);
      if (cx > 24 + j2) h = Math.max(h, 2);
      if (cx > 26.5 + j2) h = Math.max(h, 4);
      if (cx > 28.5 + j2 * 0.5) h = Math.max(h, 6);
      if (cx > 14 && cz < -14 + j) h = Math.max(h, 4); // east back shoulder
      if (cx > 19 && cz < -17 + j) h = Math.max(h, 6);
      if (cz > 27.5 + j * 0.5) h = Math.max(h, 1);
      if (cz > 29 + j * 0.3) h = Math.max(h, 2);
      let c = null;
      if (h === 0) {
        const e = ((cx - POND[0]) / 11) ** 2 + ((cz - POND[1]) / 8) ** 2;
        if (e < 1 + (hash(x, z) - 0.5) * 0.22) h = -0.5;
      }
      H.set(K(x, z), { h, c });
    }
    // rock outcrops on the back-right hill
    for (const [x0, z0, w, d, h] of [[12, -30, 9, 5, 8], [20, -27, 6, 4, 6], [-6, -30, 5, 3, 8], [-22, -27, 4, 3, 6]])
      for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) { const v = H.get(K(x, z)); if (v) { v.h = Math.max(v.h, h); v.c = C.rock; } }
    for (const v of H.values()) if (!v.c) v.c = lvColor(v.h);
    // packed-snow clearing + paths (flat snow only)
    const seg = (p, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], d = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / d)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dz); };
    for (let x = -N; x < N; x++) for (let z = -N; z < N; z++) {
      const v = H.get(K(x, z));
      if (v.h !== 0 || v.c !== C.snow) continue;
      const p = [x + 0.5, z + 0.5];
      let on = Math.hypot(p[0] - FIRE[0], p[1] - FIRE[1]) < 8.5 + (hash(x, z) - 0.5) * 2;
      for (const P of PATHS) for (let i = 0; i + 1 < P.length; i++) if (seg(p, P[i], P[i + 1]) < 2.2 + hash(x + 9, z) * 0.6) on = true;
      if (on) v.c = C.path;
    }
    return H;
  }

  function build(o = {}) {
    const K = BK.kit(), H = heights(), seen = new Set(), key = (x, z) => x + ',' + z;
    const same = (x, z, v) => { const q = H.get(key(x, z)); return q && !seen.has(key(x, z)) && q.h === v.h && q.c === v.c; };
    const group = (c) => (c === C.path ? 'Blockout/Paths' : c === C.ice ? 'Blockout/Ice' : c === C.rock ? 'Blockout/Rock' : 'Blockout/Snow');
    if (o.ground !== false) for (let z = -N; z < N; z++) for (let x = -N; x < N; x++) {
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

    // pines: stepped cones, placed by seeded tries (even widths on integer centres, no overlap)
    const rnd = (() => { let s = 7; return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
    const KINDS = [[10, 8, 6, 4, 2], [12, 10, 8, 6, 4, 2], [12, 10, 8, 6, 4, 2], [16, 14, 12, 10, 8, 6, 4, 2]];
    const SMALL = [[6, 4, 2], [8, 6, 4, 2], [8, 6, 4, 2]];
    const placed = [];
    const attempt = (kinds, thOf, tries, maxN, edgeMax, f = 1) => {
      for (let t = 0; t < tries && placed.length < maxN; t++) {
        const x = Math.round(-24 + rnd() * 48), z = Math.round(-24 + rnd() * 48);
        const edge = Math.min(x + N, N - x, z + N, N - z);
        const h0 = hAt(x, z);
        if (edge > edgeMax && h0 < 2) continue;
        const k = kinds[Math.floor(rnd() * kinds.length)];
        const w = k[0], r = w / 2, th = thOf(k);
        if (x - r < -N || x + r > N || z - r < -N || z + r > N) continue;
        if (Math.hypot(x - FIRE[0], z - FIRE[1]) < 17 * Math.max(f, 0.9) || Math.hypot(x - TENT[0], z - TENT[1]) < 14 * f || Math.hypot(x - SNOWMAN[0], z - SNOWMAN[1]) < 11 * f || Math.hypot(x - WOOD[0], z - WOOD[1]) < 11 * f) continue;
        let ok = true, mx = -9;
        for (let a = x - r; a < x + r; a++) for (let b = z - r; b < z + r; b++) mx = Math.max(mx, hAt(a, b));
        for (let a = x - 2; a < x + 2 && ok; a++) for (let b = z - 2; b < z + 2; b++) { const c = cAt(a, b); if (c === C.path || c === C.ice || c === C.rock || hAt(a, b) !== h0) { ok = false; break; } }
        if (!ok || mx > h0 + th - 1) continue;
        if (placed.some((p) => Math.abs(p.x - x) < (p.r + r) + 2.5 && Math.abs(p.z - z) < (p.r + r) + 2.5)) continue;
        placed.push({ x, z, r, k, h0, th });
      }
    };
    attempt(KINDS, (k) => (k.length === 8 ? 5 : 4), 30000, 9, 15);
    if (o.smallPines) attempt(SMALL, () => 3, 60000, 18, 16, 0.65);
    if (o.pines !== false) placed.forEach((p, i) => {
      const G = 'Trees/Pine' + (i + 1);
      K.box(G, 'Trunk', [4, p.th, 4], [p.x, p.h0 + p.th / 2, p.z], C.bark);
      p.k.forEach((w, n) => K.box(G, 'Tier', [w, 3, w], [p.x, p.h0 + p.th + 1.5 + n * 3, p.z], C.pine));
    });

    // key-spot markers (footprints only, replaced in stage 2)
    if (o.markers !== false) {
    const M = C.mark;
    K.box('Markers/FireRing', 'RingN', [6, 1, 1], [FIRE[0], 0.5, FIRE[1] - 2.5], M);
    K.box('Markers/FireRing', 'RingS', [6, 1, 1], [FIRE[0], 0.5, FIRE[1] + 2.5], M);
    K.box('Markers/FireRing', 'RingW', [1, 1, 4], [FIRE[0] - 2.5, 0.5, FIRE[1]], M);
    K.box('Markers/FireRing', 'RingE', [1, 1, 4], [FIRE[0] + 2.5, 0.5, FIRE[1]], M);
    K.box('Markers/Bench', 'BenchN', [5, 2, 2], [FIRE[0], 1, FIRE[1] - 6.5], M);
    K.box('Markers/Bench', 'BenchW', [2, 2, 5], [FIRE[0] - 6.5, 1, FIRE[1]], M);
    K.box('Markers/Bench', 'BenchS', [5, 2, 2], [FIRE[0], 1, FIRE[1] + 6.5], M);
    K.box('Markers/Tent', 'Tent', [9, 6, 12], [TENT[0], 3, TENT[1]], M);
    K.box('Markers/Woodpile', 'Woodpile', [4, 2, 3], [WOOD[0], 1, WOOD[1]], M);
    }

    const zones = { Fire: [FIRE[0], 0, FIRE[1]], Tent: [TENT[0], 0, TENT[1]], Pond: [POND[0], 0, POND[1]], Snowman: [SNOWMAN[0], 0, SNOWMAN[1]], Hill: [5, 4, -24] };
    return { name: 'SnowCamp_Blockout', parts: K.parts, groups: K.groups, player: [SPAWN[0], SPAWN[1], 0, 0], zones, pines: placed.length, trees: placed };
  }

  const api = { build, heights, C, N, FLOOR, FIRE, TENT, POND, SNOWMAN, WOOD };
  if (typeof window !== 'undefined') window.SnowCamp = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
