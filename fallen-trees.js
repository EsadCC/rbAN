
// Stumps and fallen trunks (oak + pine), 1-stud. Same palette and generators as oak-gen.js / snow-pines.js.
(function () {
  const BK = (typeof window !== 'undefined' && window.BlockKit) || require('./block-kit.js');
  const SK = (typeof window !== 'undefined' && window.StudKit) || require('./stud-kit.js');
  const FK = (typeof window !== 'undefined' && window.ForestKit) || require('./forest-1stud.js');
  const OG = (typeof window !== 'undefined' && window.OakGen) || require('./oak-gen.js');
  const SP = (typeof window !== 'undefined' && window.SnowPines) || require('./snow-pines.js');
  const C = { ...OG.C, cut: '#a8875f', ring: '#977657/W', snow: '#f1f5f8' };
  const BARK = [C.bark, C.bark2, C.bark3];
  const P = SP.C;
  const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  const DIRS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

  function roots(V, r, x0, x1, z0, z1, cx, cz, n, oak) {
    const sides = [['-x', x0 - 1, null], ['+x', x1 + 1, null], ['-z', null, z0 - 1], ['+z', null, z1 + 1]];
    const HS = oak ? [[2, 1], [1, 1], [2], [1], [2, 1, 1]] : [[2, 1], [1, 1], [2]];
    for (let i = 0; i < n; i++) {
      const [d, fx, fz] = sides[(i + ri(r, 0, 1)) % 4];
      const x = fx === null ? x0 + ri(r, 0, x1 - x0) : fx, z = fz === null ? z0 + ri(r, 0, z1 - z0) : fz;
      FK.root(V, cx + x, cz + z, d, HS[ri(r, 0, HS.length - 1)], C.bark);
    }
  }

  // columns of jagged broken wood above y0 over the (x0..x1, z0..z1) block; heights hmin..hmax (centre taller), light split tops
  function splinters(V, r, cx, cz, x0, x1, z0, z1, y0, hmin, hmax, snow) {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      const mid = x > x0 && x < x1 && z > z0 && z < z1, h = Math.min(hmax, ri(r, hmin, hmax - 1) + (mid ? 1 : 0));
      for (let y = y0; y < h - 1; y++) V.set(cx + x, y, cz + z, C.bark);
      V.set(cx + x, h - 1, cz + z, snow && r() < 0.7 ? (r() < 0.3 ? C.snow + '/S' : C.snow) : C.cut);
      if (r() < 0.3) { const d = ['+x', '-x', '+z', '-z'][ri(r, 0, 3)]; V.wedge(cx + x, h, cz + z, d, C.cut); }
    }
  }

  function stump(V, r, cx, cz, kind, style, snow) {
    const oak = kind === 'oak';
    if (oak) {
      FK.trunk(V, [[0, 2, cx - 2, cx + 2, cz - 2, cz + 2], [3, 3, cx - 2, cx + 1, cz - 2, cz + 1]], C.bark);
      roots(V, r, -2, 2, -2, 2, cx, cz, 5, true);
      if (style === 'cut') {
        V.fill(cx - 2, cx + 1, 4, 4, cz - 2, cz + 1, C.cut);
        V.fill(cx - 1, cx, 4, 4, cz - 1, cz, C.ring);
        FK.trunk(V, [[3, 3, cx - 2, cx + 1, cz - 2, cz + 1], [4, 4, cx - 2, cx + 1, cz - 2, cz + 1]], C.bark);
      } else splinters(V, r, cx, cz, -2, 1, -2, 1, 4, 6, 10, false);
    } else {
      FK.trunk(V, [[0, 4, cx - 2, cx + 1, cz - 2, cz + 1]], C.bark);
      roots(V, r, -2, 1, -2, 1, cx, cz, 4, false);
      if (style === 'cut') {
        V.fill(cx - 2, cx + 1, 5, 5, cz - 2, cz + 1, snow ? C.snow : C.cut);
        if (!snow) V.fill(cx - 1, cx, 5, 5, cz - 1, cz, C.ring); else V.fill(cx - 1, cx, 5, 5, cz - 1, cz, C.snow + '/S');
      } else splinters(V, r, cx, cz, -2, 1, -2, 1, 5, 7, 12, snow);
    }
    // bark streaks
    const pool = [];
    for (let y = 1; y < 6; y++) for (let x = cx - 3; x <= cx + 3; x++) for (let z = cz - 3; z <= cz + 3; z++) if (V.color(x, y, z) === C.bark && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !V.has(x + a, y, z + b))) pool.push([x, y, z]);
    for (let i = 0; i < 4 && pool.length; i++) { const [x, y, z] = pool.splice(ri(r, 0, pool.length - 1), 1)[0], col = r() < 0.5 ? C.bark2 : C.bark3; for (let q = 0, n = ri(r, 2, 3); q < n; q++) if (V.color(x, y + q, z) === C.bark) V.set(x, y + q, z, col); }
  }

  // trunk lying along +x from x0, centred on zc; segs [[len, w]]; flat on the ground, top corners chamfered
  function lay(V, x0, zc, segs) {
    let x = x0;
    const info = [];
    for (const [len, w] of segs) {
      const zs = zc - (w >> 1);
      for (let i = 0; i < len; i++) {
        for (let y = 0; y < w; y++) for (let z = zs; z < zs + w; z++) V.set(x + i, y, z, C.bark);
        if (w >= 3) { V.del(x + i, w - 1, zs); V.wedge(x + i, w - 1, zs, '-z', C.bark); V.del(x + i, w - 1, zs + w - 1); V.wedge(x + i, w - 1, zs + w - 1, '+z', C.bark);
          V.del(x + i, 0, zs); V.wedge(x + i, 0, zs, '-z', C.bark, true); V.del(x + i, 0, zs + w - 1); V.wedge(x + i, 0, zs + w - 1, '+z', C.bark, true); }
      }
      info.push({ x, len, w, zs });
      x += len;
    }
    return { x0, x1: x - 1, info };
  }
  const sectionAt = (T, x) => T.info.find((s) => x >= s.x && x < s.x + s.len);
  const endCaps = (V, T, zc, ws, col) => { // flush light end faces
    const a = T.info[0], b = T.info[T.info.length - 1];
    for (let y = 0; y < a.w; y++) for (let z = a.zs; z < a.zs + a.w; z++) if (V.solid(T.x0, y, z)) V.set(T.x0, y, z, col);
    if (b.w >= 2) for (let y = 0; y < b.w; y++) for (let z = b.zs; z < b.zs + b.w; z++) if (V.solid(T.x1, y, z)) V.set(T.x1, y, z, col);
  };
  const streaks = (V, r, T, n) => {
    const pool = [];
    for (let x = T.x0 + 1; x < T.x1 - 3; x++) for (let y = 0; y < 4; y++) for (let z = -8; z <= 8; z++) { const zz = z; if (V.color(x, y, zz) === C.bark && !V.has(x, y + 1, zz) || V.color(x, y, zz) === C.bark && !V.has(x, y, zz + 1) || V.color(x, y, zz) === C.bark && !V.has(x, y, zz - 1)) pool.push([x, y, zz]); }
    for (let i = 0; i < n && pool.length; i++) { const [x, y, z] = pool.splice(ri(r, 0, pool.length - 1), 1)[0], col = r() < 0.5 ? C.bark2 : C.bark3; for (let q = 0, m = ri(r, 3, 5); q < m; q++) if (V.color(x + q, y, z) === C.bark) V.set(x + q, y, z, col); }
  };

  // fallen oak: the whole tree turned 90°. Crown at the far end, its domes lying along the trunk axis (dark side toward the trunk, light + Studs toward the tip); side limbs are bare snapped stubs
  function fallenOak(V, r, x0, zc, short) {
    const T = lay(V, x0, zc, short ? [[4, 4], [4, 3], [5, 3]] : [[6, 5], [5, 4], [6, 3]]);
    endCaps(V, T, zc, 0, C.cut);
    const RM = '#3d6a36', tips = [];
    // crown limbs fan out from the top end
    const ex = T.x1;
    for (const [di, z0] of [[0, 0], [1, 1], [7, -1], [1, 0], [7, 0]]) OG.limb(V, r, ex, 1, zc + z0, di, short ? ri(r, 2, 3) : ri(r, 3, 5), 3, true, 0.4, 0, tips);
    OG.lump(V, r, ex + (short ? 3 : 4), 2, zc, short ? 4 : 5, short ? 3 : 4, () => 0, -7, true);
    for (const t of tips) OG.lump(V, r, t.x + 1, t.y, t.z, Math.max(2, 3 - t.depth + ri(r, 0, 1)), 2, () => 0, -7, true);
    // bare side stubs along the trunk
    for (let i = 0; i < 3; i++) {
      const xi = T.x0 + 3 + i * (short ? 3 : 4) + ri(r, -1, 1), s = sectionAt(T, xi), side = i % 2 ? 1 : -1;
      OG.limb(V, r, xi, Math.max(0, s.w - 2), side > 0 ? s.zs + s.w - 1 : s.zs, side > 0 ? 2 : 6, ri(r, 2, 4), 1, true, 0, 1, []);
    }
    // crown leaf tone by exposure along the trunk axis (tip side light, trunk side dark)
    for (const [k, c] of [...V.cells.entries()]) {
      if (c !== RM) continue;
      const [x, y, z] = k.split(',').map(Number);
      if (!V.has(x + 1, y, z)) { if (r() < 0.75) V.set(x, y, z, r() < 0.3 ? C.l + '/S' : C.l); else V.set(x, y, z, C.m); }
      else if (!V.has(x - 1, y, z)) V.set(x, y, z, C.d);
      else V.set(x, y, z, C.m);
    }
    // leaf litter: flat leaf plates on the ground round the crown (frayed), plus a few strays along the trunk
    const L = V.litter || (V.litter = new Map()), put = (x, z) => { if (!L.has(x + ',' + z)) L.set(x + ',' + z, r() < 0.5 ? C.d : r() < 0.8 ? C.m : r() < 0.5 ? C.l : C.l + '/S'); };
    const foot = new Set();
    for (const [k, c] of V.cells) { const [x, y, z] = k.split(',').map(Number); if (y <= 3 && x > ex - 1 && !BARK.includes(c)) foot.add(x + ',' + z); }
    for (const k of foot) { const [x, z] = k.split(',').map(Number); for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) { const d = Math.max(Math.abs(dx), Math.abs(dz)); if (d === 0 || r() < 0.18 + d * 0.2) continue; put(x + dx, z + dz); } }
    for (let i = 0; i < 10; i++) put(ex - ri(r, 0, 12), zc + ri(r, -4, 4) + (r() < 0.5 ? 3 : -3));
    streaks(V, r, T, 8);
    // splintered stump where it broke off
    splinters(V, r, x0 - 4, zc, -2, 1, -2, 1, 0, 2, 5, false);
    roots(V, r, -2, 1, -2, 1, x0 - 4, zc, 3, true);
  }

  // fallen pine: long tapering trunk, snapped bough stubs on the sides, a few boughs with green fans lying out to the sides
  function fallenPine(V, r, x0, zc, snow) {
    const T = lay(V, x0, zc, [[8, 4], [8, 3], [7, 2], [3, 1]]);
    endCaps(V, T, zc, 0, C.cut);
    const set = (x, y, z, c) => { if (y >= 0 && !V.has(x, y, z)) V.set(x, y, z, c); };
    let k = 0;
    for (let xi = T.x0 + 4; xi < T.x1 - 2; xi += 3, k++) {
      const s = sectionAt(T, xi);
      for (const side of [1, -1]) {
        if (r() < 0.25) continue;
        const ze = side > 0 ? s.zs + s.w : s.zs - 1, ym = Math.min(s.w - 1, Math.max(0, s.w - 2)), fan = r() < 0.8, L = s.w >= 3 ? 5 : 4;
        for (let u = 0; u < (fan ? 2 : ri(r, 1, 3)); u++) set(xi, ym, ze + side * u, C.bark);
        if (!fan) { if (r() < 0.6) V.set(xi, ym, ze + side * 2, C.bark2); continue; }
        for (let u = 2; u < 2 + L; u++) {
          const y = Math.max(0, ym - Math.floor((u - 2) / 2)), z = ze + side * u;
          set(xi, y, z, P.g);
          if (y > 0 && u < 1 + L) set(xi, y - 1, z, P.d);
          if (u >= 3) { set(xi - 1, y, z, P.l); set(xi + 1, y, z, P.l); }
        }
      }
      if (k % 2 === 0 && s.w >= 2) { // snapped upright bough stub
        const zz = s.zs + ri(r, 0, s.w - 1);
        for (let y = s.w; y < s.w + ri(r, 1, 2); y++) set(xi, y, zz, C.bark);
      }
    }
    streaks(V, r, T, 6);
    if (snow) {
      for (const [key, c] of [...V.cells.entries()]) {
        if (c !== C.bark && c !== P.g && c !== P.l && c !== C.bark2 && c !== C.bark3) continue;
        const [x, y, z] = key.split(',').map(Number);
        if (x < x0 - 6 || x > T.x1 + 3 || z < zc - 9 || z > zc + 9) continue;
        if (!V.has(x, y + 1, z) && r() < 0.6) V.set(x, y + 1, z, r() < 0.3 ? C.snow + '/S' : C.snow);
      }
    }
    // stump where it snapped
    splinters(V, r, x0 - 4, zc, -2, 1, -2, 1, 0, 3, 7, snow);
    roots(V, r, -2, 1, -2, 1, x0 - 4, zc, 3, false);
  }

  function finish(V, r) {
    FK.smooth(V, BARK);
    for (const k of [...V.wedges.keys()]) if (r() > 0.7) V.wedges.delete(k);
    const pre = new Set(V.wedges.keys());
    FK.smooth(V, [P.g, P.d, P.l, C.d, C.m, C.l, C.l + '/S']);
    for (const k of [...V.wedges.keys()]) if (!pre.has(k) && r() > 0.5) V.wedges.delete(k);
    FK.weldSplotch(V, BARK, 29, 12);
  }

  function test() {
    const K = BK.kit(), V = SK.vox(), r = BK.rng(23), XS = [-51, -17, 17, 51];
    stump(V, r, XS[0], 0, 'oak', 'cut'); fallenOak(V, r, XS[0] - 6, -34);
    stump(V, r, XS[1], 0, 'oak', 'broken'); fallenOak(V, r, XS[1] - 6, -34);
    stump(V, r, XS[2], 0, 'pine', 'cut'); fallenPine(V, r, XS[2] - 12, -34, false);
    stump(V, r, XS[3], 0, 'pine', 'broken', true); fallenPine(V, r, XS[3] - 12, -34, true);
    // leaf recolour for oak lumps (same rule as the oak generator)
    for (const [k, c] of [...V.cells.entries()]) {
      if (c !== C.m) continue;
      const [x, y, z] = k.split(',').map(Number);
      if (!V.has(x, y + 1, z)) { if (r() < 0.75) V.set(x, y, z, r() < 0.3 ? C.l + '/S' : C.l); } else if (!V.has(x, y - 1, z)) V.set(x, y, z, C.d);
    }
    finish(V, r);
    V.emit(K, 'Trees/Fallen', 'Voxel');
    const lit = new Map();
    for (const [k, c] of V.litter || []) { const [x, z] = k.split(',').map(Number); if (![0, 1].some((y) => V.has(x, y, z)) && ![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => V.has(x + a, 0, z + b) && V.color(x + a, 0, z + b) === C.bark && false)) lit.set(k, c); }
    SK.plates(K, 'Trees/Fallen', 'Litter', lit, 0);
    FK.groundTile(K, (x, z) => V.has(x, 0, z) || lit.has(x + ',' + z), 5, 64);
    return { name: 'FallenTrees', parts: K.parts, groups: K.groups, player: [-34, 10, 0], xs: XS };
  }

  const api = { stump, fallenOak, fallenPine, finish, test, C };
  if (typeof window !== 'undefined') window.FallenTrees = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
