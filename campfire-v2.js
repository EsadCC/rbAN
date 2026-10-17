// Campfire v2 (skills/one-stud-building.md): chunky + one-tone rework after the user's reference. build() → { name, parts, groups }.
// The fire is the feature: a one-tone grid stone ring with Weld logs stacked inside on the ash (the user supplies the flames).
// No tripod, pot or teepee (thin diagonals fight the style). Set pieces one tone per material, texture carries variation.
// STRUCTURE (grid): trampled mud clearing, stepped stone fire ring with an ash bed, two split-log benches, a chopping stump.
// Wood rule: every wooden thing has Weld somewhere; one-part wood (log, plank, stick) is Weld all over.
// PROPS (classic, free): teepee firewood, a tripod with a hanging pot (all rotated blocks, user: no cylinders on the centrepiece), a firewood pile, the approved barrel, crate and sack, ferns.
// No Neon (user: not yet). Scale = standard 5-stud R6 player: bench seat 2, stump 3.
(function () {
  const BK = (typeof window !== 'undefined' && window.BlockKit) || require('./block-kit.js');
  const SK = (typeof window !== 'undefined' && window.StudKit) || require('./stud-kit.js');
  const FK = (typeof window !== 'undefined' && window.ForestKit) || require('./forest-1stud.js');
  const FC = (typeof window !== 'undefined' && window.ForestCorner) || require('./forest-corner.js');
  const CK = (typeof window !== 'undefined' && window.ClassicKit) || require('./classic-kit.js');
  const { rng, mul, Ry, Rz, eul, local, add3, sub3, scl, cross, norm } = BK;
  const C = {
    ...FC.C,
    ash: ['#4f4a45', '#5c5650', '#45403c'], charred: '#3a2f27',
    pot: '#44464d', stick: '#4a3b31', rope: '#c8b48a',
  };
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  const S = (c) => c + '/S';
  const R_CLEAR = 10.5;

  // fire ring: cells whose centre is 1.6–2.95 from the fire centre; 1 high; only outer cells stack a 2nd stone or a wedge sloping outward, so the fire stays visible
  function fireRing(V, r) {
    const ring = [], pit = [];
    for (let x = -3; x < 3; x++) for (let z = -3; z < 3; z++) {
      const d = Math.hypot(x + 0.5, z + 0.5);
      if (d < 1.6) pit.push([x, z]); else if (d < 2.95) ring.push([x, z]);
    }
    // tones stamped as short runs so neighbours share a stone colour
    let col = pick(r, C.rock);
    ring.sort((a, b) => Math.atan2(a[1] + 0.5, a[0] + 0.5) - Math.atan2(b[1] + 0.5, b[0] + 0.5));
    ring.forEach(([x, z], i) => {
      if (i % 2 === 0 && r() < 0.7) col = pick(r, C.rock);
      V.set(x, 0, z, col);
      const out = Math.abs(x + 0.5) > Math.abs(z + 0.5) ? (x < 0 ? '-x' : '+x') : z < 0 ? '-z' : '+z';
      const outer = Math.hypot(x + 0.5, z + 0.5) > 2.3;
      if (outer && r() < 0.3) V.set(x, 1, z, r() < 0.25 ? S(col) : col);
      else if (outer && r() < 0.3) V.wedge(x, 1, z, out, col);
    });
    return pit;
  }

  // split-log bench along axis 'x' or 'z': 3 across, flat seat on top (y 1), rounded underside (hanging wedges at y 0)
  function bench(V, r, a0, c0, len, axis) {
    const at = (t, u, y) => (axis === 'x' ? [a0 + t, y, c0 + u] : [c0 + u, y, a0 + t]);
    const side = (u) => (axis === 'x' ? (u ? '+z' : '-z') : u ? '+x' : '-x');
    const col = C.bark[0];
    for (let t = 0; t < len; t++) {
      const end = t === 0 || t === len - 1, c = end ? C.barkEnd : col;
      for (let u = -1; u <= 1; u++) V.set(...at(t, u, 1), c);
      V.set(...at(t, 0, 0), c);
      V.wedge(...at(t, -1, 0), side(0), c, true);
      V.wedge(...at(t, 1, 0), side(1), c, true);
    }
    // one branch stub on the side, a stud proud with a wedge cap
    const t = 2 + Math.floor(r() * (len - 4));
    V.set(...at(t, 2, 1), col);
  }

  function build() {
    const K = BK.kit(), r = rng(31);
    const Ring = SK.vox(), Benches = SK.vox(), Stump = SK.vox();
    const Logs = SK.vox();
    // stone ring on the grid round a 4×4 pit (one tone, Studs on a few tops), wood stacked inside on the ash
    for (let x = -3; x <= 2; x++) for (let z = -3; z <= 2; z++) {
      const edge = x === -3 || x === 2 || z === -3 || z === 2, corner = (x === -3 || x === 2) && (z === -3 || z === 2);
      if (edge && !corner) Ring.set(x, 0, z, (x + z) % 3 === 0 ? C.rock[0] + '/S' : C.rock[0]);
    }
    for (const [x, z] of [[-3, -1], [2, 0], [0, 2]]) Ring.set(x, 1, z, C.rock[0]);
    // wood inside: two logs one way, one across on top (a little log-cabin stack), Weld, one charred
    Logs.fill(-2, 1, 0, 0, -2, -2, C.bark[0] + '/W');
    Logs.fill(-2, 1, 0, 0, 1, 1, C.bark[0] + '/W');
    Logs.fill(-1, -1, 1, 1, -2, 1, C.charred + '/W');
    Logs.fill(0, 0, 1, 1, -2, 1, C.bark[0] + '/W');
    const pit = [];
    for (let x = -2; x < 2; x++) for (let z = -2; z < 2; z++) if (Math.hypot(x + 0.5, z + 0.5) < 2.1) pit.push([x, z]);
    // seats leave ~4 studs between the ring and the bench edge so feet stay clear of the fire
    bench(Benches, r, -3, -10, 7, 'x');
    bench(Benches, r, -3, -10, 6, 'z');
    FC.stump(Stump, rng(1), 9, -7);
    // woodpile on the grid beside the stump: 3 logs of 3, 2 on top
    const Pile = SK.vox();
    for (const z of [-4, -3, -2]) Pile.fill(9, 11, 0, 0, z, z, C.bark[0] + '/W');
    Pile.fill(9, 11, 1, 1, -4, -3, C.bark[0] + '/W');
    FK.weldSplotch(Benches, C.bark, 17, 2);
    Benches.emit(K, 'Campfire/Benches', 'Log');
    Ring.emit(K, 'Campfire/FireRing', 'Stone');
    Pile.emit(K, 'Campfire/Woodpile', 'Log');
    Logs.emit(K, 'Campfire/Firewood', 'Log', [0, 0.2, 0]); // rests on the 0.2 ash bed
    Stump.emit(K, 'Campfire/Stump', 'Block');
    // ash bed: two 0.2 plates in two tones over the pit cells
    const ash = new Map();
    pit.forEach(([x, z]) => ash.set(x + ',' + z, C.ash[0] + '/S'));
    SK.plates(K, 'Campfire/Ash', 'Ash', ash, 0, 0.2);
    // clearing = bare trampled mud, frayed edge
    const cr = rng(8), fray = new Map();
    const clear = (x, z) => { const k = x + ',' + z; if (!fray.has(k)) fray.set(k, cr() * 1.6); return Math.hypot(x + 0.5, z + 0.5) < R_CLEAR - 0.8 + fray.get(k); };
    const solid = (x, z) => Pile.has(x, 0, z) || Ring.has(x, 0, z) || Benches.has(x, 0, z) || Stump.has(x, 0, z);
    const G = FC.ground(K, rng(21), 15, (x, z) => clear(x, z) || solid(x, z));

    // ---- props ----
    const P = (g) => 'Props/' + g;
    const rod = (g, n, a, b, d, col, o = {}) => {
      const v = sub3(b, a), L = Math.hypot(...v), X = scl(v, 1 / L);
      const up = Math.abs(X[1]) > 0.99 ? [1, 0, 0] : [0, 1, 0], Z = norm(cross(X, up)), Y = cross(Z, X);
      // o.roll turns a square block about its own length so crossed sticks don't line up
      const R = [X[0], Y[0], Z[0], X[1], Y[1], Z[1], X[2], Y[2], Z[2]];
      return K.add(g, n, [L, d, d], { p: scl(add3(a, b), 0.5), R: o.roll ? BK.mul(R, BK.Rx(o.roll)) : R }, col, { shape: 1, ...o });
    };
    // approved props, placed freely
    CK.sack(K, { p: [-5.6, 0, 8.6], R: eul(0, 30, 12) });
    // ferns on the grass rim (mesh centre = ground + half height, buried 0.15)
    const M = CK.MESH.Fern;
    for (const [x, z, s, ry] of [[-12.2, -10.4, 0.9, 20], [11.4, 11.6, 0.8, 140], [-11.8, 11.2, 0.7, 260], [12.4, -9.8, 0.75, 80]]) {
      const h = M.base[1] * M.scale * s;
      K.add(P('Plants'), 'Fern', M.approx.map((v) => v * s), { p: [x, G.level(x, z) + h / 2 - 0.15, z], R: Ry(ry) }, pick(r, CK.C.fern), { cc: false, meshKey: 'Fern', extras: [{ mesh: { type: M.type, id: M.id, scale: [M.scale * s, M.scale * s, M.scale * s] } }] });
    }
    return { name: 'Campfire', parts: K.parts, groups: K.groups, player: [0.5, -6, 180] };
  }

  const api = { build, fireRing, bench, C };
  if (typeof window !== 'undefined') window.CampfireV2 = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
