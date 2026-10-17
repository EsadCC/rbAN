
// Oak Glade, STAGE 2 TREES + GROUND. Stage 1 layout (glade-blockout.js, placement unchanged) dressed with: Studs grass caps (2 tones, 10% dark),
// dirt paths, Inlet water, earthen tier faces with grass scree wedges, the real oaks (one shared vox), cut/broken stumps, two fallen oaks,
// and 2×2 leaf-litter plates under every crown. All structure on the grid.
(function () {
  const BK = (typeof window !== 'undefined' && window.BlockKit) || require('./block-kit.js');
  const SK = (typeof window !== 'undefined' && window.StudKit) || require('./stud-kit.js');
  const OG = (typeof window !== 'undefined' && window.OakGen) || require('./oak-gen.js');
  const FT = (typeof window !== 'undefined' && window.FallenTrees) || require('./fallen-trees.js');
  const GB = (typeof window !== 'undefined' && window.OakGlade) || require('./glade-blockout.js');
  const { rng } = BK;
  const C = {
    grass: ['#6b8e45', '#5c7d3a'], clear: ['#7fa352', '#709446'], path: ['#8a6f4e', '#7d6445'], bank: ['#7d6a4c', '#6f5d42'], water: ['#5f93a8', '#52869b'],
    soil: '#6b5640', wbody: '#4f7f93', lit: [OG.C.d, OG.C.m, '#6a4f33'],
  };
  const VAR = { grass: 'Studs', clear: 'Studs', path: 'Studs', bank: 'Studs', water: 'Inlet' };

  // real oak crowns are 15–25 wide and carpet the plot at the blockout's 16 trees; these blockout trees are dropped to keep the glade open
  const DROP = [[2, 19], [18, 4], [-20, 8], [-20, -13], [-23, -1], [10, -27]];

  function build() {
    const K = BK.kit(), r = rng(77), pick = (a) => a[Math.floor(r() * a.length)], key = (x, z) => x + ',' + z;
    const base = GB.build({ trees: 0 }), N = GB.N, FLOOR = GB.FLOOR, GC = GB.C;
    const H = GB.heights(), cells = new Map();
    for (const [k, v] of H) {
      const [x, z] = k.split(',').map(Number);
      cells.set(k, { x, z, h: v.h, kind: v.c === GC.water ? 'water' : v.c === GC.path ? 'path' : v.c === GC.clear ? 'clear' : v.c === GC.bank ? 'bank' : 'grass', tone: 0 });
    }
    // darker second tone on ~10%, stamped as small rects
    for (const kind of ['grass', 'clear', 'water']) {
      const list = [...cells.values()].filter((c) => c.kind === kind), target = list.length * 0.1;
      let n = 0;
      for (let t = 0; t < 600 && n < target; t++) {
        const o = pick(list), w = 2 + Math.floor(r() * 3), d = 2 + Math.floor(r() * 2);
        for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) { const c = cells.get(key(o.x + i, o.z + j)); if (c && c.kind === kind && c.h === o.h && !c.tone) { c.tone = 1; n++; } }
      }
    }
    const merge = (kf, emit) => {
      const seen = new Set(), same = (x, z, f) => { const c = cells.get(key(x, z)); return c && !seen.has(key(x, z)) && kf(c) === f; };
      for (let z = -N; z < N; z++) for (let x = -N; x < N; x++) {
        if (seen.has(key(x, z))) continue;
        const c = cells.get(key(x, z)), f = kf(c);
        let dx = 1, dz = 1;
        while (same(x + dx, z, f)) dx++;
        const row = (zz) => { for (let i = 0; i < dx; i++) if (!same(x + i, zz, f)) return false; return true; };
        while (row(z + dz)) dz++;
        for (let q = 0; q < dz; q++) for (let i = 0; i < dx; i++) seen.add(key(x + i, z + q));
        emit(x, z, dx, dz, c);
      }
    };
    merge((c) => (c.kind === 'water' ? 'w' : 's') + c.h, (x, z, dx, dz, c) => {
      const hy = c.h - 0.2 - FLOOR;
      K.box('Terrain/Body', 'Block', [dx, hy, dz], [x + dx / 2, FLOOR + hy / 2, z + dz / 2], c.kind === 'water' ? C.wbody : C.soil);
    });
    merge((c) => c.kind + c.tone + c.h, (x, z, dx, dz, c) => {
      K.box('Terrain/' + c.kind[0].toUpperCase() + c.kind.slice(1), 'Cap', [dx, 0.2, dz], [x + dx / 2, c.h - 0.1, z + dz / 2], C[c.kind][c.tone], { variant: VAR[c.kind] });
    });
    const at = (x, z) => cells.get(key(x, z));
    const hAt = (x, z) => { const c = at(x, z); return c ? c.h : 0; };
    const walk = (c) => c && (c.kind === 'grass' || c.kind === 'clear');

    // ---- one shared vox for every tree, stump and log ----
    const V = SK.vox(), tr = rng(9), litter = new Map(), trees = base.trees.filter((t) => !DROP.some(([x, z]) => x === t.x && z === t.z)), occ = new Set();
    const place = (T, ox, oy, oz) => {
      for (const [k, c] of T.cells) { const [x, y, z] = k.split(',').map(Number); V.set(x + ox, y + oy, z + oz, c); }
      for (const w of T.wedges.values()) V.wedge(w.x + ox, w.y + oy, w.z + oz, w.dir, w.color, w.inv);
      for (const [k, c] of T.litter || []) { const [x, z] = k.split(',').map(Number); litter.set(key(x + ox, z + oz), { c, y: oy }); }
    };
    const baseOf = (x0, x1, z0, z1) => { let m = -9, n = 9; for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) { const h = hAt(x, z); m = Math.max(m, h); n = Math.min(n, h); } return [m, n]; };
    const support = (x0, x1, z0, z1, y) => { for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (let q = Math.floor(hAt(x, z)); q < y; q++) V.set(x, q, z, OG.C.bark); };
    const sr = rng(31), stumps = GB.STUMPS.map(([x, z]) => [x, z]);
    GB.STUMPS.forEach(([x, z, style]) => {
      const T = SK.vox(); FT.stump(T, sr, 0, 0, 'oak', style);
      const [m] = baseOf(x - 3, x + 3, z - 3, z + 3); support(x - 2, x + 2, z - 2, z + 2, m);
      place(T, x, m, z);
    });
    // fallen oaks: search the nearest flat free footprint to each marker, either orientation (trunk along +x, or turned 90° to run along +z)
    const MAP = { '+x': '+z', '+z': '-x', '-x': '-z', '-z': '+x' };
    const rot = (T) => {
      const U = SK.vox(); U.litter = new Map();
      for (const [k, c] of T.cells) { const [x, y, z] = k.split(',').map(Number); U.set(-z, y, x, c); }
      for (const w of T.wedges.values()) U.wedge(-w.z, w.y, w.x, MAP[w.dir], w.color, w.inv);
      for (const [k, c] of T.litter || []) { const [x, z] = k.split(',').map(Number); U.litter.set(key(-z, x), c); }
      return U;
    };
    const boxes = [], logs = [];
    const gap = (a, b) => Math.hypot(Math.max(a[0] - b[1], b[0] - a[1], 0), Math.max(a[2] - b[3], b[2] - a[3], 0));
    for (const [hx, hz] of GB.LOGS) {
      let best = null;
      for (let o = 0; o < 2; o++) for (let x0 = -24; x0 <= 24; x0++) for (let zc = -22; zc <= 24; zc++) {
        const core = o ? [x0 - 4, x0 + 4, zc - 5, zc + 14] : [x0 - 5, x0 + 14, zc - 4, zc + 4], bx = o ? [x0 - 5, x0 + 5, zc - 6, zc + 16] : [x0 - 6, x0 + 16, zc - 5, zc + 5];
        if (bx[1] > N + 3 || bx[0] < -N + 2 || bx[2] < -N + 2 || bx[3] > N + 3) continue;
        let ok = true;
        for (let x = core[0]; x <= core[1] && ok; x++) for (let z = core[2]; z <= core[3]; z++) if (!walk(at(x, z))) { ok = false; break; }
        if (!ok) continue;
        const [m, n] = baseOf(...core); if (m - n > 1 || n < 0) continue;
        const hit = trees.filter((t) => gap(core, [t.x - 3, t.x + 3, t.z - 3, t.z + 3]) < 1);
        if (hit.some((t) => t.kind !== 'young' || t.landmark)) continue;
        if (stumps.some(([sx, sz]) => gap(bx, [sx - 3, sx + 3, sz - 3, sz + 3]) < 2) || boxes.some((q) => gap(bx, q) < 3)) continue;
        const d = Math.hypot(x0 - hx, zc - hz) + 8 * hit.length;
        if (!best || d < best.d) best = { o, x0, zc, bx, d, m, hit };
      }
      if (!best) continue;
      for (const t of best.hit) trees.splice(trees.indexOf(t), 1);
      boxes.push(best.bx); logs.push([best.x0, best.zc, best.o]);
      let T = SK.vox(); FT.fallenOak(T, sr, 0, 0, true); if (best.o) T = rot(T);
      if (best.o) support(best.x0 - 3, best.x0 + 3, best.zc - 1, best.zc + 12, best.m); else support(best.x0 - 1, best.x0 + 12, best.zc - 3, best.zc + 3, best.m);
      place(T, best.x0, best.m, best.zc);
    }
    for (const t of trees) {
      const [bx0, bx1, bz0, bz1] = [OG.KINDS[t.kind].layers[0][2], OG.KINDS[t.kind].layers[0][3], OG.KINDS[t.kind].layers[0][4], OG.KINDS[t.kind].layers[0][5]];
      for (let x = t.x + bx0; x <= t.x + bx1; x++) for (let z = t.z + bz0; z <= t.z + bz1; z++) for (let y = Math.floor(hAt(x, z)); y < t.h0; y++) V.set(x, y, z, OG.C.bark);
      OG.oak(V, tr, t.x, t.z, t.h0, t.kind, hAt);
      for (let a = -4; a <= 4; a++) for (let b = -4; b <= 4; b++) occ.add(key(t.x + a, t.z + b));
    }
    for (const k of [...V.cells.keys(), ...V.wedges.keys()]) { const [x, y, z] = k.split(',').map(Number); if (y < hAt(x, z)) V.del(x, y, z); } // nothing inside terrain
    OG.finish(V, tr);
    for (const k of [...V.cells.keys(), ...V.wedges.keys()]) { const [x, y, z] = k.split(',').map(Number); if (y < hAt(x, z)) V.del(x, y, z); }
    V.emit(K, 'Trees/Oaks', 'Voxel');

    // ---- leaf litter: 2×2 plates fraying out from each trunk, plus the fallen crowns' own litter ----
    const lit = new Map();
    for (const t of trees) {
      const R = { young: 6, mature: 8, lean: 8, twin: 9, ancient: 11 }[t.kind];
      for (let a = -R; a <= R; a += 2) for (let b = -R; b <= R; b += 2) {
        const d = Math.hypot(a, b) / R; if (d > 1 || r() > 0.9 - d * 0.75) continue;
        const x = t.x + a - (t.x + a & 1), z = t.z + b - (t.z + b & 1), col = pick(C.lit);
        for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) lit.set(key(x + i, z + j), { c: col, y: null });
      }
    }
    for (const [k, v] of litter) lit.set(k, v);
    const byCol = new Map();
    for (const [k, v] of lit) {
      const [x, z] = k.split(',').map(Number), c = at(x, z);
      if (!walk(c) || V.has(x, Math.floor(c.h), z) || V.has(x, Math.floor(c.h) + 1, z)) continue;
      if (c.h !== Math.floor(c.h)) continue;
      const g = v.c + '|' + c.h; if (!byCol.has(g)) byCol.set(g, new Map()); byCol.get(g).set(k, v.c);
    }
    for (const [g, m] of byCol) SK.plates(K, 'Ground/Litter', 'Leaves', m, +g.split('|')[1]);

    // ---- scree: grass wedges at the foot of each tier ----
    const ROT = { '-z': 0, '+z': 180, '+x': -90, '-x': 90 }, DIRS = [['+x', 1, 0], ['-x', -1, 0], ['+z', 0, 1], ['-z', 0, -1]], OPP = { '+x': '-x', '-x': '+x', '+z': '-z', '-z': '+z' };
    for (const c of cells.values()) {
      if (!walk(c) || c.h < 0 || occ.has(key(c.x, c.z)) || byCol.size && [...byCol.values()].some((m) => m.has(key(c.x, c.z)))) continue;
      const hi = DIRS.filter(([, dx, dz]) => { const q = at(c.x + dx, c.z + dz); return q && q.kind !== 'water' && q.kind !== 'path' && q.h >= c.h + 1; });
      if (hi.length !== 1 || r() > 0.6) continue;
      K.add('Terrain/Scree', 'Scree', [1, 1, 1], { p: [c.x + 0.5, c.h + 0.5, c.z + 0.5], R: BK.Ry(ROT[OPP[hi[0][0]]]) }, C.grass[0], { cls: 'WedgePart' });
    }
    return { name: 'OakGlade_Dressed', parts: K.parts, groups: K.groups, player: base.player, zones: base.zones, trees: trees.length, stumps: stumps.length, logs, treeList: trees };
  }

  const api = { build, C };
  if (typeof window !== 'undefined') window.OakGladeDressed = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
