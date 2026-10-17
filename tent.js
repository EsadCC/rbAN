// Ridge tent, 1-stud practice piece (skills/one-stud-building.md). build() → { name, parts, groups }.
// STRUCTURE (grid): canvas roof as a 45° stepped run (wedge + cell per row), wooden bargeboard frame on the front and back
// edge rows (the 45° frame, done with wedges, not rotated parts), a ridge pole under the peak, inset gables, a door with tied-back flaps.
// PROPS (classic, free): bedroll inside, crate, barrel, sack. No guy ropes (user: thin diagonals fight the style).
// Scale: 5-stud R6 player. H = 6 rows: peak 6, door 2 × 4 (stoop to enter).
(function () {
  const BK = (typeof window !== 'undefined' && window.BlockKit) || require('./block-kit.js');
  const SK = (typeof window !== 'undefined' && window.StudKit) || require('./stud-kit.js');
  const FK = (typeof window !== 'undefined' && window.ForestKit) || require('./forest-1stud.js');
  const FC = (typeof window !== 'undefined' && window.ForestCorner) || require('./forest-corner.js');
  const CK = (typeof window !== 'undefined' && window.ClassicKit) || require('./classic-kit.js');
  const { rng, Ry, Rz, Rx, eul, mul, add3, sub3, scl, cross, norm } = BK;
  const C = { ...FC.C, canvas: ['#b3a385', '#a69676', '#9a8b6d'], canvasDark: '#857760', rope: '#c8b48a' };
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  const S = (c) => c + '/S', W = (c) => c + '/W';
  const H = 6, L = 9, OZ = -4; // rows, length (z cells), world z offset

  function tent(V, r) {
    // tone per 2–3 cell run along z, per row and side, so the canvas reads as strips
    const tone = new Map();
    const toneAt = (side, y, z) => { const k = side + ',' + y + ',' + Math.floor((z + y * 2 + side * 5) / 3); if (!tone.has(k)) tone.set(k, pick(r, C.canvas)); return tone.get(k); };
    const wood = () => pick(r, C.bark);
    for (let z = 0; z < L; z++) {
      const edge = z === 0 || z === L - 1;
      for (let y = 0; y < H; y++) for (const side of [0, 1]) {
        const wx = side ? H - 1 - y : -H + y, sx = side ? H - 2 - y : -H + y + 1, dir = side ? '+x' : '-x';
        const col = edge ? wood() : toneAt(side, y, z);
        if (y === H - 1) { V.wedge(wx, y, z, dir, col); continue; }
        V.wedge(wx, y, z, dir, col);
        V.set(sx, y, z, edge ? col : toneAt(side, y, z));
      }
    }
    // ridge pole: the two cells under the peak, wood between the bargeboards (a poke-out read as a stray cube)
    for (let z = 1; z < L - 1; z++) for (const x of [-1, 0]) V.set(x, H - 2, z, C.bark[1]);
    // gables, inset 1 under the overhang; door 2 × 4 in the front one
    const gable = (z, door) => {
      for (let y = 0; y < H - 2; y++) for (let x = -H + y + 2; x <= H - 3 - y; x++) {
        if (door && (x === -1 || x === 0) && y <= 3) continue;
        V.set(x, y, z, toneAt(2 + (z > 3 ? 1 : 0), y, x + 10));
      }
    };
    gable(1, true); gable(L - 2, false);
    // tied-back flaps: a rolled column each side of the door, standing 1 proud of the gable, wedge-capped
    for (const x of [-2, 1]) { V.fill(x, x, 0, 3, 0, 0, C.canvasDark); V.wedge(x, 4, 0, x < 0 ? '-x' : '+x', C.canvasDark); }
    // repair patch on the left slope + a couple of Studs patches
    for (const [y, z] of [[2, 4], [2, 5], [3, 5]]) V.set(-H + y + 1, y, z, C.canvasDark);
    V.set(H - 2 - 1, 1, 3, S(C.canvas[1])); V.set(H - 2 - 3, 3, 6, S(C.canvas[0]));
  }

  function build() {
    const K = BK.kit(), r = rng(41), V = SK.vox();
    tent(V, r);
    FK.weldSplotch(V, C.bark, 9, 3);
    V.emit(K, 'Tent/Canvas', 'Block', [0, 0, OZ]);
    // dirt yard around the tent, frayed edge, plus a trodden strip from the door
    const fr = rng(12), fray = new Map();
    const fz = (x, z) => { const k = x + ',' + z; if (!fray.has(k)) fray.set(k, Math.floor(fr() * 2)); return fray.get(k); };
    const yard = (x, z) => (x >= -H - 3 + fz(x, z) && x <= H + 2 - fz(x, z) && z >= OZ - 4 + fz(x, z) && z <= OZ + L + 1 - fz(x, z)) || (Math.abs(x + 0.5) < 1.6 + fz(x, z) && z < OZ - 3 && z > OZ - 9);
    const G = FC.ground(K, rng(23), 14, (x, z) => yard(x, z) || V.has(x, 0, z - OZ));

    const P = (g) => 'Props/' + g;
    const rod = (g, n, a, b, d, col, o = {}) => {
      const v = sub3(b, a), len = Math.hypot(...v), X = scl(v, 1 / len);
      const up = Math.abs(X[1]) > 0.99 ? [1, 0, 0] : [0, 1, 0], Z = norm(cross(X, up)), Y = cross(Z, X);
      const R = [X[0], Y[0], Z[0], X[1], Y[1], Z[1], X[2], Y[2], Z[2]];
      return K.add(g, n, [len, d, d], { p: scl(add3(a, b), 0.5), R: o.roll ? mul(R, Rx(o.roll)) : R }, col, o);
    };
    // bedroll inside: rounded cylinder lying + two ties
    const BR = { p: [1.3, 0.55, OZ + 5.2], R: Ry(8) };
    CK.round(K, P('Bedroll'), 'Roll', [1.1, 3.2, 1.1], BK.local(BR, [0, 0, 0], Rz(90)), C.canvas[2] === '#9a8b6d' ? '#6b5a48' : '#6b5a48');
    for (const t of [-0.9, 0.9]) K.add(P('Bedroll'), 'Tie', [0.3, 1.2, 1.2], BK.local(BR, [t, 0, 0]), C.rope, { shape: 2 });
    // stores by the door
    CK.sack(K, { p: [-0.4, 0, OZ - 3.4], R: eul(0, -30, -10) });
    return { name: 'Tent', parts: K.parts, groups: K.groups, player: [0, OZ - 2.5, 180], doors: [{ name: 'Tent', w: 2, h: 4 }] };
  }

  const api = { build, tent, C, H, L };
  if (typeof window !== 'undefined') window.Tent = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
