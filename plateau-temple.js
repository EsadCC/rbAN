// Sandy Plateau, STAGE 2 LANDMARK: the giant ruined temple in 1-stud style on the stage-1 terrain.
// Local vox coords: lx 0..63 (world x = lx − 32), lz 0..20 (world z = lz − 48, 0 = back), y 0 = plateau top (world 12).
// One stone S + a darker trim T (~10%). West side intact, east side collapsed. build() → { name, parts, groups, player, zones, doors }.
(function () {
  const BK = (typeof window !== 'undefined' && window.BlockKit) || require('./block-kit.js');
  const SK = (typeof window !== 'undefined' && window.StudKit) || require('./stud-kit.js');
  const SP = (typeof window !== 'undefined' && window.SandPlateau) || require('./plateau-blockout.js');
  const S = '#d7c59a', T = '#b9a57a', SI = S + '/I', SW = S + '/W', TI = T + '/I', TW = T + '/W';
  const SC = (typeof window !== 'undefined' && window.ClassicKit) || require('./classic-kit.js');
  const ORIGIN = [-32, 12, -48];

  function temple(V, r, K) {
    const cut = (x0, x1, y0, y1, z0, z1) => { for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) V.del(x, y, z); };
    // ---- podium: 13 deep, 8 high, Inlet top, base course 1 proud, pilasters + flush panels on the front
    V.fill(0, 63, 0, 6, 0, 12, S);
    V.fill(0, 63, 7, 7, 0, 12, SI);
    V.fill(0, 63, 0, 1, 13, 13, T);
    for (const x of [4, 12, 20, 43, 51, 59]) V.fill(x, x + 1, 2, 7, 13, 13, T);
    for (const [a, b] of [[6, 10], [14, 18], [46, 49], [54, 57]]) V.fill(a, b, 2, 6, 12, 12, SI);
    V.set(8, 4, 12, SW); V.set(16, 5, 12, SW); V.set(47, 3, 12, SW);
    // collapsed east end of the podium
    [7, 7, 6, 6, 5, 5, 4, 3].forEach((h, i) => cut(56 + i, 56 + i, h + 1, 7, 8, 12));
    [7, 6, 6, 5].forEach((h, i) => cut(60 + i, 60 + i, h + 1, 7, 3, 7));
    // ---- grand stair (14 wide, 7 rises) with stepped cheek walls + 45° wedge caps
    for (let i = 0; i < 7; i++) {
      const lz = 19 - i;
      V.fill(25, 38, 0, i - 1, lz, lz, S); V.fill(25, 38, i, i, lz, lz, SI);
      for (const [a, b] of [[22, 24], [39, 41]]) { V.fill(a, b, 0, Math.min(i + 2, 8), lz, lz, S); if (i < 6) V.wedge(a, i + 3, lz, '+z', S), V.wedge(a + 1, i + 3, lz, '+z', S), V.wedge(b, i + 3, lz, '+z', S); }
      V.set(23, i + 2 > 8 ? 8 : i + 2, lz, T); V.set(40, i + 2 > 8 ? 8 : i + 2, lz, T);
    }
    // ---- cella: tall west wall, low broken east wall, 8×14 door into a 16×6 sanctum
    V.fill(10, 27, 8, 23, 0, 6, S);
    const et = [23, 23, 23, 23, 23, 23, 21, 19, 17, 16, 15, 14, 13, 12, 11, 10, 9, 9];
    et.forEach((t, i) => V.fill(36 + i, 36 + i, 8, t, 0, 6, S));
    et.forEach((t, i) => { if (et[i + 1] === t - 1) for (let z = 0; z <= 6; z++) V.wedge(37 + i, t, z, '+x', S); });
    cut(24, 39, 8, 21, 1, 5); cut(28, 35, 8, 21, 6, 6);
    V.fill(28, 35, 22, 23, 0, 6, S);
    V.fill(10, 35, 23, 23, 7, 7, T); // cornice lip
    V.fill(14, 17, 12, 19, 6, 6, SI); V.fill(23, 26, 12, 19, 6, 6, SI); V.fill(38, 41, 10, 15, 6, 6, SI); V.fill(46, 49, 10, 14, 6, 6, SI);
    V.set(15, 20, 6, SW); V.set(24, 13, 6, SW);
    V.fill(24, 25, 8, 21, 7, 7, T); V.fill(38, 39, 8, 14, 7, 7, T); // door pilasters 1 proud (only where free of columns)
    // idol in the sanctum
    V.fill(29, 34, 8, 9, 1, 4, T); V.fill(30, 33, 10, 15, 2, 3, S); V.fill(29, 34, 14, 16, 2, 3, S); SC.round(K, 'Props/StatueHead', 'Head', [3.5, 3.5, 3.5], { p: [ORIGIN[0] + 32, ORIGIN[1] + 18.75, ORIGIN[2] + 3], R: BK.I }, S); V.set(30, 12, 2, SW);
    // ---- pediment: 45° stepped gable on the west half, east half fallen
    for (let k = 0; k < 10; k++) {
      const x0 = 22 + k, x1 = 41 - k, y = 24 + k, hi = k >= 6 ? Math.max(x0, x1 - 1 - (k >= 8 ? 1 : 0)) : x1;
      V.fill(x0, hi, y, y, 1, 5, S);
      for (let z = 1; z <= 5; z++) { V.wedge(x0 - 1, y, z, '-x', S); if (k < 6) V.wedge(x1 + 1, y, z, '+x', S); }
    }
    V.fill(22, 41, 24, 24, 0, 6, T);
    V.fill(28, 35, 27, 29, 5, 5, SI); V.set(31, 28, 5, SW);
    // ---- columns: 6×6 plinth, 4×4 shaft, T rings, 6×6 capital
    // clustered shafts: 5 true cylinders (d2) per column, rings d5; flared wedge base and capital on a 6×6 slab / abacus
    const cyl = (g, n, d, y0, y1, x, z, col) => K.add(g, n, [y1 - y0, d, d], { p: [ORIGIN[0] + x, ORIGIN[1] + (y0 + y1) / 2, ORIGIN[2] + z], R: BK.Rz(90) }, col, { shape: 2 });
    const col = (c, h, intact) => {
      const top = 8 + h, G = 'Landmarks/Temple';
      V.fill(c - 3, c + 2, 8, 8, 7, 12, T); V.set(c, 8, 12, TW);
      V.fill(c - 2, c + 1, 9, 9, 8, 11, S); V.fill(c - 2, c + 1, 10, 10, 8, 11, T);
      for (let x = c - 2; x <= c + 1; x++) { V.wedge(x, 9, 12, '+z', T); V.wedge(x, 9, 7, '-z', T); }
      for (let z = 8; z <= 11; z++) { V.wedge(c - 3, 9, z, '-x', T); V.wedge(c + 2, 9, z, '+x', T); }
      const cut = [2, 0, 3, 1, 2];
      [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, 0]].forEach(([dx, dz], i) => cyl(G, 'Shaft', 2, 11, intact ? top - 4 : top - cut[i], c + dx, 10 + dz, S));
      for (const y of [14, 22]) if (y < top - 4) cyl(G, 'Ring', 5, y, y + 1, c, 10, T);
      if (intact) {
        V.fill(c - 2, c + 1, top - 4, top - 3, 8, 11, T);
        for (let x = c - 2; x <= c + 1; x++) { V.wedge(x, top - 3, 12, '-z', T, true); V.wedge(x, top - 3, 7, '+z', T, true); }
        for (let z = 8; z <= 11; z++) { V.wedge(c - 3, top - 3, z, '+x', T, true); V.wedge(c + 2, top - 3, z, '-x', T, true); }
        V.fill(c - 3, c + 2, top - 2, top - 2, 7, 12, S); V.set(c, top - 2, 12, SW);
        V.fill(c - 3, c + 2, top - 1, top - 1, 7, 12, T);
      }
    };
    col(12, 22, true); col(20, 22, true); col(44, 15, false); col(52, 7, false);
    V.fill(9, 22, 30, 32, 7, 12, S); V.fill(8, 23, 33, 33, 6, 13, T);
    cut(20, 23, 31, 33, 7, 9); cut(22, 23, 30, 32, 10, 12); cut(23, 23, 33, 33, 6, 13);
    V.fill(9, 22, 31, 31, 13, 13, TI);
    // ---- west tower (intact-ish), east tower (broken)
    const wt = [29, 29, 29, 29, 28, 27, 26, 26, 25, 25];
    wt.forEach((t, i) => V.fill(i, i, 8, t, 0, 6, S));
    for (let i = 0; i < 4; i++) V.set(i, 29, 3, T);
    V.fill(3, 6, 14, 21, 6, 6, SI); V.fill(3, 6, 24, 26, 6, 6, TI); V.set(4, 18, 6, SW);
    for (const y of [13, 22]) V.fill(0, 9, y, y, 7, 7, T);
    const et2 = [21, 21, 20, 19, 19, 17, 16, 14, 12, 11];
    et2.forEach((t, i) => V.fill(54 + i, 54 + i, 8, t, 0, 6, S));
    et2.forEach((t, i) => { if (et2[i + 1] === t - 1 || et2[i + 1] === t - 2) for (let z = 0; z <= 6; z++) V.wedge(55 + i, et2[i + 1] + 1, z, '+x', S); });
    V.fill(55, 58, 14, 18, 6, 6, SI); V.set(56, 16, 6, SW);
    V.fill(54, 63, 13, 13, 7, 7, T);
  }

  // debris on the plateau east of the grand stair + loose bricks, plus a little at the west foot
  function debris(V, r, K) {
    const heap = (x, z, w, d) => { V.fill(x, x + w - 1, 0, 0, z, z + d - 1, S); V.fill(x + 1, x + w - 2, 1, 1, z + 1, z + d - 2, S); V.fill(x + 2, x + w - 3, 2, 2, z + 2, z + d - 3, T); };
    for (const c of [48, 53, 58]) K.add('Landmarks/Debris', 'Drum', [4, 4, 4], { p: [ORIGIN[0] + c, ORIGIN[1] + 2, ORIGIN[2] + 17], R: BK.I }, S, { shape: 2 });
    V.fill(46, 49, 0, 0, 14, 14, T);
    V.fill(43, 47, 0, 2, 17, 19, T);
    heap(60, 14, 5, 5); heap(43, 14, 4, 3);
    V.fill(0, 3, 0, 1, 14, 16, S); V.fill(1, 2, 2, 2, 14, 15, T);
    for (let i = 0; i < 12; i++) {
      const x = 8 + Math.floor(r() * 54), z = 14 + Math.floor(r() * 7), w = r() < 0.5;
      const [dx, dz] = w ? [2, 1] : [1, 2];
      let ok = true;
      for (let a = 0; a < dx; a++) for (let b = 0; b < dz; b++) if (V.has(x + a, 0, z + b) || (x + a >= 20 && x + a <= 42 && z + b <= 20 && z + b >= 14 && false)) ok = false;
      if (!ok || (x > 14 && x < 43 && z < 21)) continue; // keep the stair approach and path clear
      V.fill(x, x + dx - 1, 0, 0, z, z + dz - 1, r() < 0.3 ? T : S);
    }
  }

  function build() {
    const r = BK.rng(23);
    const m = SP.build({ noLandmarks: true, carve: true, extra: (K) => {
      for (const [fn, g] of [[temple, 'Landmarks/Temple'], [debris, 'Landmarks/Debris']]) { const V = SK.vox(); fn(V, r, K); V.emit(K, g, 'Block', ORIGIN); }
    } });
    return { ...m, name: 'SandPlateau_Temple', doors: [{ name: 'TempleDoor', w: 8, h: 14 }] };
  }

  const api = { build, temple, debris, ORIGIN };
  if (typeof window !== 'undefined') window.PlateauTemple = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
