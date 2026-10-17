// Forest corner, MESSY 1-stud style (skills/one-stud-building.md). build() → { name, parts, groups, rootXml }.
// Everything on the 1-stud grid. Shapes come from stamping overlapping rectangles of cells, each rect its own tone
// (2–3 tones per material), so outlines jut and step instead of being rounded off. Wedges only where they help (root ends, a rock ledge).
// Accents: Studs / Weld MaterialVariants (colour suffix '/S' '/W'), screw heads + an X plate on the waystone, loose 1×2 bricks, round pebbles.
(function () {
  const BK = (typeof window !== 'undefined' && window.BlockKit) || require('./block-kit.js');
  const SK = (typeof window !== 'undefined' && window.StudKit) || require('./stud-kit.js');
  const FK = (typeof window !== 'undefined' && window.ForestKit) || require('./forest-1stud.js');
  const { STEP } = SK, { rng, Ry, Rz } = BK;
  const C = {
    mud: '#5a4433',
    grass: ['#5f7a3b', '#6a8541', '#56703a'], moss: ['#7a9e45', '#6b9140'],
    bark: ['#5a4232', '#4c392b', '#68503b'], barkEnd: '#a8875f',
    leaf: ['#3d6a35', '#4a7a3b', '#345a2e', '#588a42'],
    rock: ['#7d7871', '#6b665f', '#8a857d'], pebble: ['#8a857d', '#6f6a63', '#5f5a54'], brick: ['#857f77', '#6f6a63', '#7a5a3e'], steel: '#4e5056',
  };
  const STEP_Y = 0.5; // ground level step (user: 0.5)
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  const S = (c) => c + '/S', W = (c) => c + '/W';
  const DIRS = Object.keys(STEP);

  // leaf pad: stacked 1-stud layers, each 2–3 offset rects; profile = width factor per layer, bottom first
  function pad(V, r, cx, cy, cz, w, prof) {
    prof.forEach((f, i) => {
      const n = 2 + Math.floor(r() * 2), top = i >= prof.length - 2;
      for (let k = 0; k < n; k++) {
        const sx = Math.max(1, Math.round(w * f * (0.6 + r() * 0.4))), sz = Math.max(1, Math.round(w * f * (0.6 + r() * 0.4)));
        const ox = Math.round((r() - 0.5) * w * f * 0.5), oz = Math.round((r() - 0.5) * w * f * 0.5);
        const x0 = cx + ox - Math.floor(sx / 2), z0 = cz + oz - Math.floor(sz / 2);
        let col = i === 0 ? (r() < 0.6 ? C.leaf[2] : C.leaf[0]) : i === prof.length - 1 ? (r() < 0.5 ? C.leaf[3] : C.leaf[1]) : pick(r, [C.leaf[0], C.leaf[1], C.leaf[3]]);
        if (top && r() < 0.3) col = S(col);
        V.fill(x0, x0 + sx - 1, cy + i, cy + i, z0, z0 + sz - 1, col);
      }
    });
  }
  // cell just outside a 2×2 core (cells x-1..x, z-1..z) on side d; s picks which of the two
  const face = (x, z, d, s) => ({ '+x': [x + 1, z - s], '-x': [x - 2, z - s], '+z': [x - s, z + 1], '-z': [x - s, z - 2] }[d]);

  function oak(V, r, x, z, H, w) {
    const B = () => pick(r, C.bark);
    V.fill(x - 1, x, 0, H, z - 1, z, C.bark[0]);
    V.fill(x - 2, x + 1, 0, 1, z - 1, z, B());
    V.fill(x - 1, x, 0, 1, z - 2, z + 1, B());
    for (let k = 0; k < 7; k++) {
      const d = pick(r, DIRS), [fx, fz] = face(x, z, d, Math.floor(r() * 2)), y0 = 1 + Math.floor(r() * (H - 3)), L = 2 + Math.floor(r() * 3);
      const col = r() < 0.3 ? W(B()) : B();
      V.fill(fx, fx, y0, Math.min(H, y0 + L - 1), fz, fz, col);
      if (r() < 0.5) { const [dx, dz] = STEP[d] || [0, 0]; const o = d[1] === 'x' ? [0, 1] : [1, 0]; V.fill(fx + o[0] * (fx > x - 1 ? -0 : 0), fx + o[0], y0, y0, fz, fz + o[1], col); }
    }
    for (const d of DIRS) {
      if (r() < 0.25) continue;
      const [dx, dz] = STEP[d], s = Math.floor(r() * 2);
      let [fx, fz] = face(x, z, d, s); fx += dx; fz += dz;
      const L = 1 + Math.floor(r() * 2), col = B();
      for (let i = 0; i < L; i++) V.set(fx + dx * i, 0, fz + dz * i, col);
      if (r() < 0.6) V.wedge(fx + dx * L, 0, fz + dz * L, d, col);
    }
    const used = [];
    for (let k = 0; k < 3; k++) {
      let d; do d = pick(r, DIRS); while (used.includes(d) && used.length < 4); used.push(d);
      const [dx, dz] = STEP[d], y = 5 + Math.floor(r() * (H - 6));
      let [bx, bz] = face(x, z, d, Math.floor(r() * 2)), by = y;
      const out = 1 + Math.floor(r() * 2), up = 1 + Math.floor(r() * 2), col = B();
      for (let i = 0; i < out; i++) { V.set(bx, by, bz, col); bx += dx; bz += dz; }
      for (let i = 0; i < up; i++) { V.set(bx, by, bz, col); by++; }
      V.set(bx, by, bz, col);
      pad(V, r, bx + dx, by + 1, bz + dz, 4 + Math.floor(r() * 2), [1, 0.6]);
    }
    pad(V, r, x, H + 1, z, w, [0.65, 1, 0.8, 0.45]);
    FK.weldSplotch(V, C.bark, Math.floor(r() * 1e6), 4);
  }

  function rock(V, r, x, z, w, d) {
    const prof = [[1, 1], [0.7, 1], [0.45, 1]].slice(0, 2 + Math.floor(r() * 2));
    let lastCol;
    prof.forEach(([f], i) => {
      for (let k = 0; k < 2; k++) {
        const sx = Math.max(1, Math.round(w * f * (0.6 + r() * 0.4))), sz = Math.max(1, Math.round(d * f * (0.6 + r() * 0.4)));
        const x0 = x + Math.round((r() - 0.5) * w * 0.4) - Math.floor(sx / 2), z0 = z + Math.round((r() - 0.5) * d * 0.4) - Math.floor(sz / 2);
        let col = pick(r, C.rock); if (i === prof.length - 1 && r() < 0.5) col = S(col);
        V.fill(x0, x0 + sx - 1, i, i, z0, z0 + sz - 1, col); lastCol = col;
        if (i > 0 && k === 0) { const zc = z0 + Math.floor(sz / 2); if (V.solid(x0 - 1, i - 1, zc) && !V.has(x0 - 1, i, zc)) V.wedge(x0 - 1, i, zc, '-x', V.color(x0 - 1, i - 1, zc)); }
      }
    });
    // moss on top
    const top = prof.length;
    const cells = [...V.cells.keys()].map((k) => k.split(',').map(Number)).filter(([cx, cy, cz]) => cy === top - 1 && Math.abs(cx - x) <= w && Math.abs(cz - z) <= d && !V.has(cx, top, cz));
    if (cells.length && r() < 0.8) { const [cx, , cz] = pick(r, cells); V.set(cx, top, cz, S(C.moss[0])); if (V.solid(cx + 1, top - 1, cz) && !V.has(cx + 1, top, cz)) V.set(cx + 1, top, cz, S(C.moss[1])); }
  }

  function stump(V, r, x, z) {
    V.fill(x - 1, x, 0, 2, z - 1, z, C.bark[0]);
    V.fill(x - 2, x + 1, 0, 0, z - 1, z, C.bark[1]);
    V.fill(x - 1, x, 0, 1, z - 2, z + 1, C.bark[2]);
    V.set(x + 1, 1, z, W(C.bark[1]));
  }

  // screw head on a face: centre p on the face, n = outward axis ('+x','-x','+z','-z','+y')
  function screw(K, g, p, n, d = 0.8) {
    const R = { '+x': BK.I, '-x': Ry(180), '+z': Ry(-90), '-z': Ry(90), '+y': Rz(90) }[n];
    const ax = { '+x': [1, 0, 0], '-x': [-1, 0, 0], '+z': [0, 0, 1], '-z': [0, 0, -1], '+y': [0, 1, 0] }[n];
    const at = (o) => BK.add3(p, BK.scl(ax, o));
    K.add(g, 'Screw', [0.2, d, d], { p: at(0.1), R }, C.rock[2], { shape: 2 });
    K.add(g, 'ScrewSlot', [0.08, d * 0.62, 0.1], { p: at(0.22), R }, C.steel);
    K.add(g, 'ScrewSlot', [0.1, 0.1, d * 0.62], { p: at(0.26), R }, C.steel);
  }

  function waystone(K, V, x, z) {
    V.fill(x - 1, x + 1, 0, 0, z - 1, z + 1, W(C.rock[1]));
    V.fill(x - 1, x, 1, 3, z - 1, z, W(C.rock[0]));
    V.set(x + 1, 1, z, C.rock[2]);
    V.set(x - 1, 4, z - 1, C.rock[2]); V.set(x, 4, z, C.rock[2]);
  }

  // ground: mud base, level-1 grass over most cells, raised level-2/3 patches (0.5 steps), a bare mud path
  function ground(K, r, N, blocked) {
    K.box('Ground', 'Mud', [2 * N, 1, 2 * N], [0, -0.5, 0], C.mud, { variant: 'Studs' }); // user: clean stud finish on the dirt makes it pop
    const L1 = new Map(), L2 = new Map(), L3 = new Map(), key = (x, z) => x + ',' + z;
    const pathZ = (x) => Math.round(3 - x * 0.3 + 2.2 * Math.sin(x / 4.5));
    const onPath = (x, z) => Math.abs(z - pathZ(x)) <= 1;
    const rect = (map, base, cols, n, smin, smax, sChance) => {
      for (let k = 0; k < n; k++) {
        const sx = smin + Math.floor(r() * (smax - smin + 1)), sz = smin + Math.floor(r() * (smax - smin + 1));
        const x0 = Math.floor((r() - 0.5) * 2 * N), z0 = Math.floor((r() - 0.5) * 2 * N);
        let col = pick(r, cols); if (r() < sChance) col = S(col);
        for (let x = x0; x < x0 + sx; x++) for (let z = z0; z < z0 + sz; z++) if (base(x, z)) map.set(key(x, z), col);
      }
    };
    const inside = (x, z) => x >= -N && x < N && z >= -N && z < N && !blocked(x, z);
    for (let x = -N; x < N; x++) for (let z = -N; z < N; z++) if (inside(x, z) && !onPath(x, z)) L1.set(key(x, z), C.grass[0]);
    rect(L1, (x, z) => L1.has(key(x, z)), C.grass, 40, 2, 7, 0.15);
    for (let k = 0; k < 7; k++) { const x0 = Math.floor((r() - 0.5) * 2 * N), z0 = Math.floor((r() - 0.5) * 2 * N), s = 2 + Math.floor(r() * 3); for (let x = x0; x < x0 + s; x++) for (let z = z0; z < z0 + s - 1; z++) L1.delete(key(x, z)); }
    // path edges fray: a few cells step into the path
    for (let x = -N; x < N; x++) if (r() < 0.3) { const z = pathZ(x) + (r() < 0.5 ? 1 : -1); if (inside(x, z)) L1.set(key(x, z), C.grass[2]); }
    rect(L2, (x, z) => L1.has(key(x, z)), [C.moss[0], C.moss[1], C.grass[1]], 9, 2, 6, 0.6);
    rect(L3, (x, z) => L2.has(key(x, z)), C.moss, 5, 1, 3, 0.7);
    SK.plates(K, 'Ground', 'Grass', L1, 0, STEP_Y);
    SK.plates(K, 'Ground', 'Raised', L2, STEP_Y, STEP_Y);
    SK.plates(K, 'Ground', 'Raised', L3, 2 * STEP_Y, STEP_Y);
    const level = (x, z) => (L3.has(key(x, z)) ? 3 : L2.has(key(x, z)) ? 2 : L1.has(key(x, z)) ? 1 : 0);
    const flat = (x, z, rad) => { const l = level(x, z); for (let i = -rad; i <= rad; i++) for (let j = -rad; j <= rad; j++) if (level(x + i, z + j) !== l || blocked(x + i, z + j)) return false; return true; };
    const used = [];
    for (let k = 0, t = 0; k < 9 && t < 300; t++) {
      const x = Math.floor((r() - 0.5) * 2 * (N - 2)), z = Math.floor((r() - 0.5) * 2 * (N - 2));
      if (!flat(x, z, 1) || used.some(([ux, uz]) => Math.abs(ux - x) < 4 && Math.abs(uz - z) < 4)) continue; k++; used.push([x, z]);
      const col = pick(r, C.brick), y = level(x, z) * STEP_Y, ry = r() < 0.5 ? 0 : 90;
      // 2-long axis spans cells x..x+1 (or z..z+1), so its centre sits on the stud line between them
      K.box('Ground/Loose', 'Brick', [2, 0.5, 1], [ry ? x + 0.5 : x + 1, y + 0.25, ry ? z + 1 : z + 0.5], col, { ry, variant: r() < 0.5 ? 'Studs' : undefined });
    }
    for (let k = 0, t = 0; k < 16 && t < 300; t++) {
      const x = Math.floor((r() - 0.5) * 2 * (N - 1)), z = Math.floor((r() - 0.5) * 2 * (N - 1));
      if (!flat(x, z, 0) || used.some(([ux, uz]) => Math.abs(ux - x) < 2 && Math.abs(uz - z) < 2)) continue; k++;
      const d = 0.6 + Math.round(r() * 2) * 0.2, y = level(x, z) * STEP_Y;
      K.add('Ground/Loose', 'Pebble', [0.3, d, d], { p: [x + 0.5, y + 0.15, z + 0.5], R: Rz(90) }, pick(r, C.pebble), { shape: 2 });
    }
    return { level: (x, z) => level(Math.floor(x), Math.floor(z)) * STEP_Y };
  }

  function build() {
    const K = BK.kit(), objs = [];
    const obj = (g, fn, o = [0, 0, 0]) => { const V = SK.vox(); fn(V); objs.push([g, V, o]); return V; };
    obj('Trees/Oak', (V) => FK.livingTree(V), [-8, 0, -6]);
    obj('Trees/DeadTree', (V) => FK.deadTree(V), [10, 0, 8]);
    obj('Bushes/BushA', (V) => pad(V, rng(5), -14, 0, 12, 5, [1, 0.6]));
    obj('Bushes/BushB', (V) => pad(V, rng(6), 15, 0, -12, 4, [1, 0.55]));
    obj('Rocks/RockA', (V) => rock(V, rng(2), 3, -13, 6, 5));
    obj('Rocks/RockB', (V) => rock(V, rng(4), -16, 0, 4, 4));
    obj('Rocks/RockC', (V) => rock(V, rng(9), 15, 15, 3, 3));
    obj('Stump', (V) => stump(V, rng(1), 2, 1));
    obj('Waystone', (V) => waystone(K, V, -3, 13));
    for (const [g, V, o] of objs) V.emit(K, g, 'Block', o);
    ground(K, rng(21), 20, (x, z) => objs.some(([, V, o]) => V.has(x - o[0], 0, z - o[2])));
    return { name: 'ForestCorner', parts: K.parts, groups: K.groups };
  }

  const api = { build, oak, pad, rock, stump, waystone, screw, ground, C };
  if (typeof window !== 'undefined') window.ForestCorner = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
