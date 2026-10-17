// Snow Camp pine generator (palm-style): 4×4 → 2×2 trunk, whorls of drooping fan boughs every `sp` studs (cardinal and diagonal whorls alternate),
// lengths follow a cone, lateral sub-boughs step down, dark under-layer, snow settles on exposed tops, wedges round the tips.
// Works on ONE shared vox in world cells (cx, cz, h0 integers), so overlapping canopies merge instead of z-fighting.
(function () {
  const SK = (typeof window !== 'undefined' && window.StudKit) || require('./stud-kit.js');
  const FK = (typeof window !== 'undefined' && window.ForestKit) || require('./forest-1stud.js');
  const FC = (typeof window !== 'undefined' && window.ForestCorner) || require('./forest-corner.js');
  const C = { g: '#33503f', d: '#2a4535', l: '#345141', snow: '#f1f5f8', bark: FC.C.bark[0], bark2: FC.C.bark[1] || FC.C.bark[0] };
  // kinds: ht = total height, R = reach of the lowest whorl, y0 = first whorl height, sp = whorl spacing
  const KINDS = {
    big: { ht: 34, R: 8, y0: 10, sp: 3 },
    mid: { ht: 26, R: 6, y0: 8, sp: 3 },
    small: { ht: 20, R: 4, y0: 7, sp: 2 },
  };
  const CARD = [[1, 0], [0, 1], [-1, 0], [0, -1]], DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

  function pine(V, r, cx, cz, h0, kind, floorAt) {
    const K = KINDS[kind], top = h0 + K.ht;
    // trunk
    for (let y = h0; y < top - 3; y++) {
      const w = y < h0 + 6 ? [-2, 1] : [-1, 0];
      for (let x = cx + w[0]; x <= cx + w[1]; x++) for (let z = cz + w[0]; z <= cz + w[1]; z++) V.set(x, y, z, (x + y + z) % 5 === 0 ? C.bark2 : C.bark);
    }
    for (const [x, z, d, hs] of [[cx - 3, cz - 1, '-x', [2, 1]], [cx + 2, cz, '+x', [2, 1]], [cx, cz + 2, '+z', [2]], [cx - 1, cz - 3, '-z', [2, 1, 1]]])
      if ([0, 1, 2, 3].every((i) => [-1, 0, 1].every((q) => floorAt(x + (d[1] === 'x' ? (d[0] === '+' ? i : -i) : q), z + (d[1] === 'z' ? (d[0] === '+' ? i : -i) : q)) === h0))) FK.root({ ...V, set: (a, y, b, c) => V.set(a, y + h0, b, c), wedge: (a, y, b, d2, c, inv) => V.wedge(a, y + h0, b, d2, c, inv) }, x, z, d, hs, C.bark);
    // whorls
    let n = 0;
    for (let y = h0 + K.y0; y <= top - 3; y += K.sp, n++) {
      const t = (y - h0 - K.y0) / (K.ht - 3 - K.y0), Lbase = Math.max(2, Math.round(K.R * Math.pow(1 - t, 0.7)));
      const droop = 0.5 - 0.3 * t, diagTurn = n % 2 === 1;
      const dirs = [...CARD.map((d) => [d, false, diagTurn ? 0.7 : 1]), ...DIAG.map((d) => [d, true, diagTurn ? 1 : 0.7])];
      for (const [f, diag, k] of dirs) {
        if (r() < 0.12 && Lbase > 3) continue;
        const L = Math.max(1, Math.round(Lbase * k * (diag ? 0.85 : 1) + (r() - 0.5) * 2));
        const s = [f[1], -f[0]], spread = Math.min(2, Math.floor(L / 3));
        const sx = cx + (f[0] > 0 ? 1 : f[0] < 0 ? -2 : (r() < 0.5 ? -1 : 0)), sz = cz + (f[1] > 0 ? 1 : f[1] < 0 ? -2 : (r() < 0.5 ? -1 : 0));
        const put = (u, v, yy0, col) => {
          const yy = Math.max(yy0, h0 + 7); // no foliage below 7 studs: clear head height
          const x = sx + u * f[0] + v * s[0], z = sz + u * f[1] + v * s[1];
          if (yy < Math.max(floorAt(x, z), floorAt(x + 1, z), floorAt(x - 1, z), floorAt(x, z + 1), floorAt(x, z - 1), floorAt(x + 2, z))) return;
          if (!V.has(x, yy, z)) V.set(x, yy, z, col);
          if (diag && !V.has(x + 1, yy, z) && !(x + 1 >= cx - 1 && x + 1 <= cx && z >= cz - 1 && z <= cz)) V.set(x + 1, yy, z, col);
        };
        for (let u = 0; u < L; u++) {
          const yc = Math.round(y - u * droop), w = Math.min(spread, Math.floor(u / 2));
          put(u, 0, yc, C.g);
          if (u >= 1 && u < L - 1) put(u, 0, yc - 1, C.d);
          for (let j = 1; j <= w; j++) for (const sg of [-1, 1]) put(u, sg * j, yc - Math.floor((j + 1) / 2), C.l);
        }
      }
    }
    // spire: short bare tip with a snow cap
    for (let y = top - 3; y < top; y++) V.set(cx, y, cz, C.g);
    V.set(cx, top, cz, C.snow);
  }

  // snow settles on every exposed foliage top, then wedges round the tips
  function finish(V, r) {
    const foliage = (c) => c === C.g || c === C.d || c === C.l, list = [...V.cells.entries()];
    for (const [k, c] of list) {
      if (!foliage(c)) continue;
      const [x, y, z] = k.split(',').map(Number);
      if (V.has(x, y + 1, z)) continue;
      const pr = c === C.g ? 0.75 : c === C.l ? 0.3 : 0;
      if (r() < pr) V.set(x, y, z, r() < 0.3 ? C.snow + '/S' : C.snow);
    }
    FK.smooth(V, [C.g, C.d, C.l, C.snow, C.snow + '/S']);
    for (const k of [...V.wedges.keys()]) if (r() < 0.7) V.wedges.delete(k); // keep ~30% of the rounding wedges (part budget)
  }

  const api = { pine, finish, KINDS, C };
  if (typeof window !== 'undefined') window.SnowPines = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
