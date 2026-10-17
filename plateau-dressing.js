// Sandy Plateau, STAGE 3 DRESSING. Stage 1 heightmap (carved under the temple) + stage 2 temple, dressed per skills/one-stud/large-sets.md:
// flats stay open (sand caps, frayed rims), massing only on the EDGES (east massif, back wall + a backdrop ring beyond the plot), 1 rock tone + a darker one on ~10%.
// build() → { name, parts, groups, player, zones, doors }. Cells: { h, kind: rock | flat | sand | wet | seabed | path | stair, tone }.
(function () {
  const BK = (typeof window !== 'undefined' && window.BlockKit) || require('./block-kit.js');
  const SK = (typeof window !== 'undefined' && window.StudKit) || require('./stud-kit.js');
  const SP = (typeof window !== 'undefined' && window.SandPlateau) || require('./plateau-blockout.js');
  const PT = (typeof window !== 'undefined' && window.PlateauTemple) || require('./plateau-temple.js');
  const CV = (typeof window !== 'undefined' && window.CoastV2) || require('./coast-v2.js');
  const FK = (typeof window !== 'undefined' && window.ForestKit) || require('./forest-1stud.js');
  const PR0 = (typeof window !== 'undefined' && window.PlateauProps) || require('./plateau-props.js');
  const CK = (typeof window !== 'undefined' && window.ClassicKit) || require('./classic-kit.js');
  const { rng, Rz, eul } = BK;
  const C = {
    rock: ['#a5835f', '#977657'], moss: ['#7a9e45', '#6b9140'], sand: '#dcc9a0', dune: ['#e3d3ab', '#d3bf93'],
    wet: '#c2ab80', seabed: '#b39a72', path: '#c9b287', stair: ['#e6d9b6', '#dacba2'], bush: '#4a7a3b', fern: '#588a42',
  };
  const DIR = [['+z', 0, 1], ['-x', -1, 0], ['+x', 1, 0], ['-z', 0, -1]];
  const key = (x, z) => x + ',' + z;
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  const hash = (x, z, s = 0) => { let h = (x * 374761393 + z * 668265263 + s * 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // varied palms: kinds normal | young | tall | twin; random bend, crown size, frond count/length/droop, lean-side bias, nuts
  const PROFS = [[1, 1, 1, 0, -1, -2, -3], [0, 0, 0, -1, -2, -3, -4], [1, 0, -1, -2, -3, -4, -5], [2, 2, 1, 0, -1, -2, -3]];
  function crown(V, r, ox, oz, T, kind, lean) {
    const PC = CV.C, base = pick(r, PROFS), want = kind === 'young' ? 5 : 6 + Math.floor(r() * 3);
    V.fill(ox - 1, ox, T, T, oz - 1, oz, PC.palmHub);
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]].sort(() => r() - 0.5);
    const span = (d, o, i) => (d > 0 ? [o + i] : d < 0 ? [o - 1 - i] : [o - 1, o]);
    dirs.slice(0, want + (kind === 'tall' ? 0 : 0)).forEach(([dx, dz]) => {
      const card = dx === 0 || dz === 0, bias = dx * lean[0] + dz * lean[1] > 0 ? 1 : dx * lean[0] + dz * lean[1] < 0 ? -1 : 0;
      const scale = kind === 'young' ? 0.8 : 1, len = Math.max(3, Math.round(((card ? 4 : 3) + Math.floor(r() * 3) + bias * (r() < 0.6 ? 1 : 0)) * scale + (kind === 'tall' ? 0 : 1))), off = r() < 0.35 ? -1 : 0;
      for (let i = 1; i <= len; i++) {
        const y = T + base[Math.min(i - 1, base.length - 1)] + off, col = i <= 2 ? PC.frond[0] : i <= 4 ? PC.frond[1] : PC.frond[2];
        let xs = span(dx, ox, i), zs = span(dz, oz, i);
        if (card && i >= len - 1 && len > 4) { if (dx === 0) xs = [xs[0]]; else zs = [zs[0]]; }
        for (const x of xs) for (const z of zs) V.set(x, y, z, col);
      }
      if (card && r() < 0.6) { const xs = span(dx, ox, len + 1), zs = span(dz, oz, len + 1); V.wedge(xs[0], T + base[Math.min(len - 1, base.length - 1)] + off, zs[0], dx > 0 ? '+x' : dx < 0 ? '-x' : dz > 0 ? '+z' : '-z', PC.frond[2], true); }
    });
    const spots = [[ox + 1, T - 1, oz - 1], [ox - 2, T - 1, oz], [ox - 1, T - 1, oz + 1], [ox, T - 1, oz - 2]].sort(() => r() - 0.5);
    const balls = spots.slice(0, 1 + Math.floor(r() * 4)).map((c) => ({ c, d: 1, col: '#6b4f33' }));
    balls.push({ at: [ox, T + 1.25, oz], d: 1.5, col: PC.frond[0] }); // crown bud
    return balls;
  }
  function trunk(V, r, H, lean, ox0 = 0, oz0 = 0) {
    const PC = CV.C, k = 1 + Math.floor(r() * 3), ys = new Set(Array.from({ length: k + 1 }, () => Math.round(H * (0.25 + r() * 0.65)))), par = Math.floor(r() * 2);
    let ox = ox0, oz = oz0, dir = lean;
    for (let y = 0; y < H; y++) {
      if (ys.has(y)) { ox += dir[0]; oz += dir[1]; if (r() < 0.3) dir = [-dir[1] || dir[0], dir[0] || dir[1]]; }
      V.fill(ox - 1, ox, y, y, oz - 1, oz, PC.palmBark[(Math.floor(y / 2) + par) % 2]);
    }
    return [ox, oz];
  }
  function palmV(V, r, kind, lean) {
    const PC = CV.C, H = kind === 'young' ? 7 + Math.floor(r() * 3) : kind === 'tall' ? 15 + Math.floor(r() * 4) : 10 + Math.floor(r() * 5);
    V.fill(-2, 1, 0, 0, -1, 0, PC.palmBark[1]); V.fill(-1, 0, 0, 0, -2, 1, PC.palmBark[1]);
    const [ox, oz] = trunk(V, r, H, lean), nuts = crown(V, r, ox, oz, H, kind, lean);
    for (const [x, z, d, hs] of [[-2, -1, '-x', [1, 1]], [1, 0, '+x', [1]], [-1, 1, '+z', [1, 1]], [0, -2, '-z', [1]]]) if (r() < 0.65) FK.root(V, x, z, d, hs, PC.palmBark[1]);
    if (kind === 'twin') {
      V.fill(1, 2, 0, 0, -1, 0, PC.palmBark[1]);
      const H2 = H - 3 - Math.floor(r() * 2), [x2, z2] = trunk(V, r, H2, [-lean[0] || 1, -lean[1]], 2, 0);
      crown(V, r, x2, z2, H2, 'young', [-lean[0] || 1, -lean[1]]);
    }
    FK.smooth(V, PC.frond);
    FK.weldSplotch(V, PC.palmBark, Math.floor(r() * 1e6) + 1, 4 + Math.floor(H / 2));
    for (const k of [...V.cells.keys()]) { // Studs splotches on leaf tops
      const [x, y, z] = k.split(',').map(Number), col = V.color(x, y, z);
      if (PC.frond.includes(col) && !V.solid(x, y + 1, z) && r() < 0.3) V.set(x, y, z, col + '/S');
    }
    return nuts;
  }

  function build(o = {}) {
    const K = BK.kit(), r = rng(404), N = 50, FLOOR = SP.FLOOR, B = SP.C;
    const M = new Map(), get = (x, z) => M.get(key(x, z)), hAt = (x, z) => (get(x, z) || { h: -99 }).h;
    for (const [k, v] of SP.heights({ carve: true }))
      M.set(k, { h: v.h, kind: v.c === B.stair ? 'stair' : v.c === B.path ? 'path' : v.c === B.beach ? 'sand' : v.c === B.wet ? 'wet' : v.c === B.seabed ? 'seabed' : 'rock' });
    for (const s of SP.STAIRS) for (let i = 0; i < s.top - s.base; i++) for (let a = s.a0; a <= s.a1; a++) {
      const [x, z] = s.dir === 'z' ? [a, s.foot - i] : [s.foot + i, a]; const c = get(x, z); if (c) c.par = (((s.dir === 'z' ? z : x) % 2) + 2) % 2;
    }
    // backdrop ring beyond the plot: back wall tapering to the open west, east massif continued
    const jit = (x, z) => (hash(x >> 2, z >> 2) - 0.5) * 4, jit2 = (x, z) => (hash((x >> 2) + 40, (z >> 2) + 7) - 0.5) * 3;
    const eastRule = (x, z) => { const cx = x + 0.5, cz = z + 0.5, j = jit(x, z), j2 = jit2(x, z); let h = 0; if (cz < -4 + j && cx > 34 + j2) h = 12; if (cz < -10 + j && cx > 40 + j2) h = 18; if (cz < -16 + j && cx > 46 + j2) h = 24; return h; };
    for (let x = -N; x < 64; x++) for (let z = -64; z < -4; z++) {
      if (x < N && z >= -N) continue;
      const h = z < -N ? Math.max(eastRule(x, z), x >= N ? 24 : 12 + 3 * Math.round(4 * clamp((x + N) / 20, 0, 1))) : eastRule(x, z);
      if (h > 0) M.set(key(x, z), { h, kind: 'rock' });
    }
    const isMassif = (x, z) => (x >= 34 && z < -4) || z < -44;
    // protected: temple footprint, stairs, paths (+ margin)
    const prot = new Set(), protect = (x0, x1, z0, z1) => { for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) prot.add(key(x, z)); };
    protect(-34, 33, -50, -27);
    for (const [k, c] of M) if (c.kind === 'stair' || c.kind === 'path') { const [x, z] = k.split(',').map(Number); protect(x - (c.kind === 'path' ? 2 : 1), x + (c.kind === 'path' ? 2 : 1), z - (c.kind === 'path' ? 2 : 1), z + (c.kind === 'path' ? 2 : 1)); }

    // A. edge massing: stamped rects, tiers of 3, only on massif cells (never on flats, paths, stairs, temple)
    const raise = (x0, x1, z0, z1, nh) => { for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) { const c = get(x, z); if (c && c.kind === 'rock' && c.h >= 12 && c.h < nh && !prot.has(key(x, z)) && isMassif(x, z)) c.h = nh; } };
    for (let t = 0; t < (o.stamps || 90); t++) {
      const back = r() < 0.6, x0 = back ? Math.floor(-40 + r() * 104) : Math.floor(34 + r() * 30), z0 = back ? Math.floor(-64 + r() * 16) : Math.floor(-48 + r() * 42), sx = 4 + Math.floor(r() * 7), sz = 4 + Math.floor(r() * 6);
      const base = hAt(x0 + (sx >> 1), z0 + (sz >> 1)); if (base < 12) continue;
      const lim = z0 < -50 ? 36 : 30;
      raise(x0, x0 + sx - 1, z0, z0 + sz - 1, Math.min(lim, base + 3 * (1 + Math.floor(r() * 3))));
    }
    // B. classify flats (walkable tops) and fray their rims
    for (const [k, c] of M) {
      if (c.kind !== 'rock') continue;
      const [x, z] = k.split(',').map(Number);
      if ((c.h === 6 || c.h === 12) && !isMassif(x, z)) c.kind = 'flat';
    }
    for (const [k, c] of M) {
      if (c.kind !== 'flat' || prot.has(k)) continue;
      const [x, z] = k.split(',').map(Number);
      if (DIR.some(([, dx, dz]) => { const n = get(x + dx, z + dz); return !n || n.h < c.h; }) && hash(x, z, 9) < 0.22) c.kind = 'rock';
    }
    // C. jutting columns on massif faces, standing on the lower side
    const faces = [];
    for (const [k, c] of M) {
      if (c.kind !== 'rock') continue;
      const [x, z] = k.split(',').map(Number); if (!isMassif(x, z) || prot.has(k)) continue;
      for (const [d, dx, dz] of DIR) { const n = get(x + dx, z + dz); if (n && c.h - n.h >= 4 && ['rock', 'flat', 'sand'].includes(n.kind)) faces.push([x, z, d, dx, dz]); }
    }
    faces.sort(() => r() - 0.5);
    const colDone = new Set();
    for (const [x, z, d, dx, dz] of faces) {
      if (r() > 0.2) continue;
      const hi = hAt(x, z), lo = hAt(x + dx, z + dz), w = 1 + Math.floor(r() * 3), dep = 1 + Math.floor(r() * 2), tx = dz ? 1 : 0, tz = dx ? 1 : 0, cells = [];
      let ok = true;
      for (let i = 0; i < w && ok; i++) for (let j = 1; j <= dep && ok; j++) {
        const cx = x + tx * i + dx * j, cz = z + tz * i + dz * j, n = get(cx, cz), kk = key(cx, cz);
        if (!n || n.h !== lo || prot.has(kk) || colDone.has(kk) || !['rock', 'flat', 'sand'].includes(n.kind) || hAt(x + tx * i, z + tz * i) < hi - 2) ok = false; else cells.push([cx, cz]);
      }
      if (!ok) continue;
      const ch = r() < 0.15 ? hi + 1 : lo + 2 + Math.floor(r() * Math.max(1, hi - lo - 2));
      for (const [cx, cz] of cells) { const n = get(cx, cz); n.h = ch; n.kind = 'rock'; colDone.add(key(cx, cz)); for (const [, ax, az] of DIR) colDone.add(key(cx + ax, cz + az)); }
    }
    // D. one darker rock tone on ~10%: a few big rects
    for (let k = 0; k < 26; k++) {
      const x0 = Math.floor(-40 + r() * 104), z0 = Math.floor(-64 + r() * 60), sx = 5 + Math.floor(r() * 9), sz = 5 + Math.floor(r() * 8);
      for (let x = x0; x < x0 + sx; x++) for (let z = z0; z < z0 + sz; z++) { const c = get(x, z); if (c && c.kind === 'rock' && !colDone.has(key(x, z))) c.tone = 1; }
    }
    // D2. texture vomit: small stamped patches of Weld / Studs / Inlet on the massif rock (same tone, column-flush)
    for (let k = 0; k < (o.vomit || 190); k++) {
      const x0 = Math.floor(-40 + r() * 104), z0 = Math.floor(-64 + r() * 60), sx = 1 + Math.floor(r() * 4), sz = 1 + Math.floor(r() * 3), q = r(), tex = q < 0.4 ? 'Weld' : q < 0.7 ? 'Studs' : 'Inlet';
      for (let x = x0; x < x0 + sx; x++) for (let z = z0; z < z0 + sz; z++) { const c = get(x, z); if (c && c.kind === 'rock' && isMassif(x, z) && c.h >= 12 && !prot.has(key(x, z))) c.tex = tex; }
    }
    // E. flush Inlet / Weld panels on tall massif faces
    const band = new Map();
    const tall = faces.filter(([x, z, , dx, dz]) => hAt(x, z) - hAt(x + dx, z + dz) >= 6 && !colDone.has(key(x + dx, z + dz)));
    for (const [x, z, , dx, dz] of tall) {
      if (band.size > (o.panels || 70) * 3 || r() > 0.1) continue;
      const tx = dz ? 1 : 0, tz = dx ? 1 : 0, w = 2 + Math.floor(r() * 2);
      let ok = true, lo = -99, hi = 999;
      for (let i = 0; i < w; i++) {
        const cx = x + tx * i, cz = z + tz * i, c = get(cx, cz), n = get(cx + dx, cz + dz);
        if (!c || c.kind !== 'rock' || band.has(key(cx, cz)) || !n || c.h - n.h < 6) { ok = false; break; }
        for (let a = -2; a <= 2; a++) if (band.has(key(cx + tx * a, cz + tz * a))) ok = false;
        lo = Math.max(lo, n.h + 1); hi = Math.min(hi, c.h - 2);
      }
      if (!ok || hi - lo < 2) continue;
      const ph = Math.min(hi - lo, 2 + Math.floor(r() * 3)), y0 = lo + Math.floor(r() * (hi - lo - ph + 1)), va = r() < 0.65 ? 'Inlet' : 'Weld';
      for (let i = 0; i < w; i++) band.set(key(x + tx * i, z + tz * i), [y0, y0 + ph, va]);
    }
    const occ = new Set(), occupy = (x0, x1, z0, z1) => { for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) occ.add(key(x, z)); };
    const flatAt = (x, z, rad, h, kinds) => { for (let i = -rad; i <= rad; i++) for (let j = -rad; j <= rad; j++) { const c = get(x + i, z + j), kk = key(x + i, z + j); if (!c || c.h !== h || !kinds.includes(c.kind) || prot.has(kk) || occ.has(kk)) return false; } return true; };

    // F. palms on the beach and shelves (each checked against the terrain)
    const palms = [], used3 = new Set();
    for (let t = 0; t < 3000 && palms.length < (o.palms || 8); t++) {
      const lvl2 = palms.length < 2, x = lvl2 ? Math.floor(-36 + r() * 64) : Math.floor(-46 + r() * 90), z = lvl2 ? Math.floor(-25 + r() * 16) : Math.floor(-24 + r() * 62), c = get(x, z);
      if (lvl2 && (!c || c.h !== 6)) continue;
      if (!c || !['sand', 'flat'].includes(c.kind) || c.h > 6 || !flatAt(x, z, 2, c.h, ['sand', 'flat']) || palms.some(([a, b]) => Math.hypot(a - x, b - z) < 13)) continue;
      const V = SK.vox(), q = r(), kind = q < 0.2 ? 'young' : q < 0.45 ? 'tall' : q < 0.58 ? 'twin' : 'normal', lean = pick(r, [[0, 1], [1, 0], [-1, 0], [1, 1], [-1, 1], [0, -1]]), nuts = palmV(V, r, kind, lean);
      const world = [...V.cells.keys(), ...V.wedges.keys()].map((k) => { const [a, y, b] = k.split(',').map(Number); return [x + a, c.h + y, z + b]; });
      if (world.some(([a, y, b]) => hAt(a, b) > y || used3.has(a + ',' + Math.floor(y) + ',' + b) || prot.has(key(a, b)) && y < 3)) continue;
      world.forEach(([a, y, b]) => used3.add(a + ',' + Math.floor(y) + ',' + b));
      V.emit(K, 'Trees/Palms', 'Block', [x, c.h, z]);
      for (const n of nuts) K.add('Trees/Palms', n.at ? 'Bud' : 'Coconut', [n.d, n.d, n.d], { p: n.at ? [x + n.at[0], c.h + n.at[1], z + n.at[2]] : [x + n.c[0] + 0.5, c.h + n.c[1] + 0.5, z + n.c[2] + 0.5], R: BK.I }, n.col, { shape: 0 });
      palms.push([x, z]); occupy(x - 4, x + 4, z - 4, z + 4);
    }
    // shore rocks (2-layer clusters at the waterline) + scree wedges + stubs at massif feet
    for (let t = 0, n = 0; t < 4000 && n < (o.shoreRocks || 10); t++) {
      const x = Math.floor(-46 + r() * 92), z = Math.floor(10 + r() * 40), c = get(x, z);
      if (!c || c.kind !== 'sand' || !DIR.some(([, dx, dz]) => (get(x + dx * 2, z + dz * 2) || {}).kind === 'wet') || !flatAt(x, z, 2, 0, ['sand'])) continue;
      const V = SK.vox(), sx = 2 + Math.floor(r() * 3), sz = 2 + Math.floor(r() * 2);
      V.fill(-1, sx - 2, 0, 0, -1, sz - 2, C.rock[0]); V.fill(0, Math.max(0, sx - 2), 1, r() < 0.5 ? 2 : 1, 0, Math.max(0, sz - 2), C.rock[r() < 0.2 ? 1 : 0]);
      V.emit(K, 'Terrain/Shore', 'Rock', [x, 0, z]); occupy(x - 3, x + 3, z - 2, z + 3); n++;
    }
    const W = SK.vox();
    for (const [x, z, d, dx, dz] of faces) {
      const nx = x + dx, nz = z + dz, n = get(nx, nz), c = get(x, z), kk = key(nx, nz);
      if (!n || r() > 0.07 || prot.has(kk) || occ.has(kk) || colDone.has(kk) || band.has(key(x, z)) || hAt(x, z) - n.h < 2 || !['rock', 'flat', 'sand'].includes(n.kind)) continue;
      W.wedge(nx, n.h, nz, d, C.rock[c.tone || 0]); occ.add(kk);
    }
    for (const [x, z, , dx, dz] of faces) {
      const nx = x + dx * 2, nz = z + dz * 2, n = get(nx, nz), kk = key(nx, nz);
      if (!n || r() > 0.02 || prot.has(kk) || occ.has(kk) || colDone.has(kk) || !['sand', 'rock', 'flat'].includes(n.kind) || n.h >= hAt(x, z)) continue;
      const hh = 1 + Math.floor(r() * 3);
      K.add('Terrain/Stubs', 'Stub', [hh, 1, 1], { p: [nx + 0.5, n.h + hh / 2, nz + 0.5], R: Rz(90) }, C.rock[0], { shape: 2 });
      occupy(nx - 1, nx + 1, nz - 1, nz + 1);
    }

    // G. cover plates: Studs moss on massif tops (+ drips down faces), dunes on the beach
    const cover = new Map();
    const stampTop = (x, z, sx, sz, col, kinds, hmin = -9) => { const h = hAt(x, z); for (let i = 0; i < sx; i++) for (let j = 0; j < sz; j++) { const c = get(x + i, z + j), kk = key(x + i, z + j); if (c && c.h === h && h >= hmin && kinds.includes(c.kind) && !prot.has(kk) && !occ.has(kk) && !band.has(kk)) cover.set(kk, col); } };
    const cells = [...M.keys()].map((k) => k.split(',').map(Number));
    const rockTops = cells.filter(([x, z]) => get(x, z).kind === 'rock' && isMassif(x, z) && hAt(x, z) >= 12), sandCells = cells.filter(([x, z]) => get(x, z).kind === 'sand');
    for (let k = 0; k < (o.moss || 420); k++) { const [x, z] = pick(r, rockTops); stampTop(x, z, 1 + Math.floor(r() * 5), 1 + Math.floor(r() * 4), pick(r, C.moss) + '/S', ['rock'], 12); }
    for (let k = 0; k < (o.dunes || 40); k++) {
      const [x, z] = pick(r, sandCells), sx = 3 + Math.floor(r() * 7), sz = 2 + Math.floor(r() * 4);
      let near = false; for (let i = -3; i < sx + 3; i++) for (let j = -3; j < sz + 3; j++) { const c = get(x + i, z + j); if (c && (c.kind === 'path' || c.kind === 'wet')) near = true; }
      if (!near) stampTop(x, z, sx, sz, pick(r, C.dune) + '/S', ['sand']);
    }
    // frayed path edges
    for (const [x, z] of cells) { const c = get(x, z); if (c.kind !== 'path') continue; if (DIR.some(([, dx, dz]) => { const n = get(x + dx, z + dz); return n && n.kind !== 'path' && n.kind !== 'stair' && n.h === c.h; }) && hash(x, z, 9) < 0.15) c.kind = c.h <= 0.5 ? 'sand' : c.h === 6 || c.h === 12 ? 'flat' : 'rock'; }
    const byH = new Map();
    for (const [k, col] of cover) { const h = get(...k.split(',').map(Number)).h; if (!byH.has(h)) byH.set(h, new Map()); byH.get(h).set(k, col); }
    for (const [h, m] of byH) SK.plates(K, 'Terrain/Cover', 'Cover', m, h, 0.5);
    const dripCells = new Set();
    for (const [k, col] of cover) {
      if (!col.startsWith(C.moss[0]) && !col.startsWith(C.moss[1])) continue;
      const [x, z] = k.split(',').map(Number), h = hAt(x, z);
      for (const [, dx, dz] of DIR.slice(0, 3)) {
        const n = get(x + dx, z + dz), nk = key(x + dx, z + dz);
        if (!n || h - n.h < 3 || cover.has(nk) || dripCells.has(nk) || band.has(k) || band.has(nk) || prot.has(nk) || r() > 0.3) continue;
        dripCells.add(nk);
        const L = 1 + Math.floor(r() * Math.min(5, h - n.h - 1)), len = L + 0.5, size = dz ? [1, len, 0.5] : [0.5, len, 1];
        K.box('Terrain/Moss', 'Drip', size, [x + 0.5 + dx * 0.75, h + 0.5 - len / 2, z + 0.5 + dz * 0.75], C.moss[1], { variant: 'Studs' });
        break;
      }
    }
    // plants (Bush / Fern meshes) only on moss
    const mossCells = [...cover].filter(([, col]) => col.startsWith(C.moss[0]) || col.startsWith(C.moss[1])).map(([k]) => k.split(',').map(Number));
    const kitPlants = o.cat ? ['Sprout', 'Bush'].map((n) => PR0.find(o.cat, n)) : null, plantCol = { Plant: '#4a7a3b', Sprout: '#588a42', Sapling: '#5a8a40', Bush: '#4a7a3b' };
    for (let k = 0; k < (o.plants || 18) && mossCells.length; k++) {
      const [x, z] = pick(r, mossCells), kk = key(x, z), yaw = Math.floor(r() * 4) * 90 + (r() - 0.5) * 30;
      if (occ.has(kk)) continue; occupy(x - 2, x + 2, z - 2, z + 2);
      if (kitPlants) { const it = pick(r, kitPlants), [lo, hi] = { Sprout: [1, 1.6], Bush: [2.2, 2.8] }[it.name], s = lo + r() * (hi - lo); K.mesh('Props/Plants', it.name, it, [x + 0.5, hAt(x, z) + 0.56 + (it.size[1] * s) / 2, z + 0.5], plantCol[it.name], { size: it.size.map((v) => v * s), R: eul(0, yaw, 0), cc: false }); continue; }
      const s = 0.9 + r() * 0.8, bush = r() < 0.6, M0 = CK.MESH[bush ? 'Bush' : 'Fern'], s2 = 0.6 + r() * 0.4;
      K.add('Props/Plants', bush ? 'Bush' : 'Fern', M0.approx.map((v) => v * s2), { p: [x + 0.5, hAt(x, z) + 0.56 + M0.approx[1] * s2 / 2, z + 0.5], R: eul(0, yaw, 0) }, bush ? C.bush : C.fern, { cc: false, extras: [{ mesh: { type: M0.type, id: M0.id, scale: [M0.scale * s2, M0.scale * s2, M0.scale * s2] } }], meshKey: bush ? 'Bush' : 'Fern' });
    }

    // H. emit terrain columns (flats = rock body + 1-stud sand cap)
    const look = (c) => {
      if (c.kind === 'rock') return [C.rock[c.tone || 0], c.tex, 'Terrain/Rock'];
      if (c.kind === 'flat') return [C.rock[0], undefined, 'Terrain/Rock'];
      if (c.kind === 'sand') return [C.sand, 'Studs', 'Terrain/Sand'];
      if (c.kind === 'wet') return [C.wet, undefined, 'Terrain/Sand'];
      if (c.kind === 'seabed') return [C.seabed, undefined, 'Terrain/Sand'];
      if (c.kind === 'path') return [C.path, undefined, 'Terrain/Paths'];
      return [C.stair[c.par || 0], undefined, 'Terrain/Stairs'];
    };
    const sig = (x, z) => { const c = get(x, z); if (!c || band.has(key(x, z))) return null; const [col, va] = look(c); return c.h + '|' + c.kind + '|' + col + '|' + va; };
    const seen = new Set();
    for (let z = -64; z < N; z++) for (let x = -N; x < 64; x++) {
      const kk = key(x, z); if (seen.has(kk)) continue;
      const c = get(x, z); if (!c) continue;
      const [col, va, g] = look(c), b = band.get(kk);
      if (b) {
        seen.add(kk);
        const [y0, y1, v] = b, seg = (a, bb, vv) => bb > a && K.box(g, 'Rock', [1, bb - a, 1], [x + 0.5, (a + bb) / 2, z + 0.5], col, { variant: vv });
        seg(FLOOR, y0); seg(y0, y1, v); seg(y1, c.h); continue;
      }
      const s0 = sig(x, z), same = (xx, zz) => !seen.has(key(xx, zz)) && sig(xx, zz) === s0;
      let dx = 1, dz = 1;
      while (same(x + dx, z)) dx++;
      const row = (zz) => { for (let i = 0; i < dx; i++) if (!same(x + i, zz)) return false; return true; };
      while (row(z + dz)) dz++;
      for (let j = 0; j < dz; j++) for (let i = 0; i < dx; i++) seen.add(key(x + i, z + j));
      const cx = x + dx / 2, cz = z + dz / 2;
      if (c.kind === 'path' || c.kind === 'flat') {
        const under = c.kind === 'path' && c.h <= 0.5 ? [C.sand, 'Studs', 'Terrain/Sand'] : [C.rock[0], undefined, 'Terrain/Rock'];
        K.box(under[2], 'Block', [dx, c.h - 1 - FLOOR, dz], [cx, (FLOOR + c.h - 1) / 2, cz], under[0], { variant: under[1] });
        c.kind === 'path' ? K.box('Terrain/Paths', 'Path', [dx, 1, dz], [cx, c.h - 0.5, cz], C.path) : K.box('Terrain/Sand', 'Cap', [dx, 1, dz], [cx, c.h - 0.5, cz], C.sand, { variant: 'Studs' });
        continue;
      }
      K.box(g, c.kind === 'stair' ? 'Step' : 'Block', [dx, c.h - FLOOR, dz], [cx, (FLOOR + c.h) / 2, cz], col, { variant: va });
    }
    W.emit(K, 'Terrain/Scree', 'Scree');

    // stage 2: the temple + debris
    const r2 = rng(23);
    const PR = (typeof window !== 'undefined' && window.PlateauProps) || (typeof require !== 'undefined' && o.props ? require('./plateau-props.js') : null);
    for (const [fn, g] of [[PT.temple, 'Landmarks/Temple'], [PT.debris, 'Landmarks/Debris']]) { const V = SK.vox(); fn(V, r2, K); if (PR && fn === PT.temple) { PR.roots(V); PR.moss(K, V, PT.ORIGIN, rng(61), 26); } V.emit(K, g, 'Block', PT.ORIGIN); }
    if (PR) PR.props({ K, hAt, prot, occ, cat: o.cat });
    K.box('Terrain/Water', 'Water', [2 * N - 0.2, 0.4, 2 * N - 0.2], [0, SP.WATER - 0.2, 0], '#5f9fb8', { tr: 0.35, cc: false, shadow: false });
    return { name: 'SandPlateau_Dressed', parts: K.parts, groups: K.groups, player: [-8, 30, 0, 0], zones: { Spawn: [-8, 0, 30], Temple: [0, 20, -42] }, doors: [{ name: 'TempleDoor', w: 8, h: 14 }], palms };
  }

  const api = { build, C };
  if (typeof window !== 'undefined') window.PlateauDress = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
