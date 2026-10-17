// Classic props (free rotation, any primitive, the user's meshes) on messy-stud ground. build() → { name, parts, groups }.
// Two layers: STRUCTURE stays on the stud grid (ground, tree), PROPS here are classic: rotated, leaning, cylinders, 0.1–0.2 sizes.
// Meshes are SpecialMesh children (part.mesh = MESH key). Textures stripped so Part.Color tints them.
(function () {
  const BK = (typeof window !== 'undefined' && window.BlockKit) || require('./block-kit.js');
  const SK = (typeof window !== 'undefined' && window.StudKit) || require('./stud-kit.js');
  const FK = (typeof window !== 'undefined' && window.ForestKit) || require('./forest-1stud.js');
  const FC = (typeof window !== 'undefined' && window.ForestCorner) || require('./forest-corner.js');
  const { rng, mul, Rx, Ry, Rz, eul, local, d2r } = BK;
  // type 5 = FileMesh, 0 = Head (rounded cylinder). scale as in the user's files; approx = rendered size at that scale (measured, uploads/sizes.rbxmx); base = size at scale 1, so scale = wanted size / base.
  const MESH = {
    Fern: { type: 5, id: 'http://www.roblox.com/asset/?id=1091940', scale: 3, approx: [2, 3.6, 2], base: [0.667, 1.2, 0.667] },
    Bush: { type: 5, id: 'http://www.roblox.com/asset/?id=16659363', scale: 5, approx: [5, 2.6, 5], base: [1, 0.52, 1] },
    Cloud: { type: 5, id: 'http://www.roblox.com/asset/?id=1095708', scale: 5.5, approx: [5.5, 5.5, 5.5], base: [1, 1, 1] },
    Round: { type: 0, scale: 1.25 },
    // uploads/newmeshes.rbxmx. All stretch non-uniformly (per-axis scale). base = measured size / scale.
    Spring: { type: 5, id: 'http://www.roblox.com/Asset/?id=9753878', scale: 1.5, approx: [1, 1, 1], base: [0.667, 0.667, 0.667] },
    Book: { type: 5, id: 'http://www.roblox.com/asset/?id=1136139', scale: 0.5, approx: [1, 0.8, 1], base: [2, 1.6, 2] },
    Goblet: { type: 5, id: 'http://www.roblox.com/asset/?id=13116112', scale: 0.5, approx: [1, 1, 1], base: [2, 2, 2] },
    Ring: { type: 5, id: 'http://www.roblox.com/asset/?id=3270017', scale: 1, approx: [1, 1, 1], base: [1, 1, 1] },
    // MeshParts in the source: Size = rendered size, resize by setting Size. Export as MeshPart (class + MeshId) when first used.
    Teapot: { type: 5, id: 'rbxassetid://1594167', meshPart: [1.969, 1.55, 3.148], approx: [1.969, 1.55, 3.148], base: null },
    Potion: { type: 5, id: 'rbxassetid://66343132', meshPart: [0.95, 0.95, 1.521], approx: [0.95, 0.95, 1.521], base: null },
  };
  const C = {
    fern: ['#4f7a35', '#5d8a3c'], bush: ['#3f6a33', '#4a7a3b'],
    stone: ['#a8a39a', '#9a958c', '#b3aea4'], capRed: '#a8442e', capTan: '#b8925e', stem: '#d8cdb4',
    plank: ['#8a512d', '#9a5f36', '#7a4728'], frame: '#543e2f', lid: '#a8703f',
    stave: '#6b4028', barrelWood: '#5a4c42', crateWood: '#8a6a4a', crateFrame: '#4a3b31', hoop: '#5b5d69', burlap: '#a59a80', rope: '#c8b48a',
  };
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  const round = (K, g, n, size, cf, col, o = {}) => K.add(g, n, size, cf, col, { extras: [{ mesh: { type: 0, scale: [1.25, 1.25, 1.25] } }], ...o, meshKey: 'Round' });
  // BARREL, true cylinders (round things stay round), nothing overlaps: three stacked Weld cylinders (ends 0.5 narrower than the belly) with a Weld hoop
  // cylinder BETWEEN each pair, so a hoop never encloses the body. big (default): belly d3, ends d2.5, hoops d3.5 × 0.5, segments y 0–1, 1.5–2.5, 3–4, hoops 1–1.5 and 2.5–3.
  // small: belly d2, ends d1.5, hoops d2.5 × 0.5, segments y 0–0.5, 1–2, 2.5–3, hoops 0.5–1 and 2–2.5.
  function barrel(K, B, small = false) {
    const g = 'Props/Barrel', W = small ? 2 : 3, segs = small ? [[0, 0.5], [1, 2], [2.5, 3]] : [[0, 1], [1.5, 2.5], [3, 4]], hoops = small ? [[0.5, 1], [2, 2.5]] : [[1, 1.5], [2.5, 3]];
    segs.forEach(([y0, y1], i) => { const d = i === 1 ? W : W - 0.5; K.lbox(g, 'Body', [y1 - y0, d, d], B, [0, (y0 + y1) / 2, 0], C.barrelWood, { shape: 2, lR: BK.Rz(90), variant: 'Weld' }); });
    for (const [y0, y1] of hoops) K.lbox(g, 'Hoop', [y1 - y0, W + 0.5, W + 0.5], B, [0, (y0 + y1) / 2, 0], C.hoop, { shape: 2, lR: BK.Rz(90), variant: 'Weld' });
  }
  // CRATE, LEGO-built (user's example: uploads/example.rbxmx): a plain Weld cube s × s × s, then FLAT plates resting on its side faces (0.5 thick, only touching).
  // Each of the four side faces gets a frame: a full-width 1-tall strip along the top and the bottom, and 1-wide uprights between them when s ≥ 3.
  // Total footprint s + 1, height s. No part enters another's volume.
  function crate(K, B, s) {
    const g = 'Props/Crates', h = s / 2, t = 0.25, up = s - 2;
    K.lbox(g, 'Body', [s, s, s], B, [0, h, 0], C.crateWood, { variant: 'Weld' });
    for (const [nx, nz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const alongX = nz !== 0, W = (w, hh, lx, ly) => K.lbox(g, 'Plate', alongX ? [w, hh, 0.5] : [0.5, hh, w], B, alongX ? [lx, ly, nz * (h + t)] : [nx * (h + t), ly, lx], C.crateFrame);
      if (s < 2) { W(s, s, 0, s / 2); continue; }
      W(s, 1, 0, 0.5); W(s, 1, 0, s - 0.5);
      if (up > 0) for (const sd of [-1, 1]) W(1, up, sd * (h - 0.5), 1 + up / 2);
    }
  }
  // sack: squashed rounded cylinder + a rope tie + a rounded neck
  function sack(K, SB) {
    round(K, 'Props/Sack', 'Sack', [1.8, 2, 1.6], BK.local(SB, [0, 1, 0]), C.burlap);
    K.add('Props/Sack', 'Tie', [0.3, 0.7, 0.7], BK.local(SB, [0, 2.1, 0], BK.Rz(90)), C.rope, { shape: 2 });
    round(K, 'Props/Sack', 'Neck', [0.9, 0.6, 0.9], BK.local(SB, [0, 2.5, 0]), C.burlap);
  }

  function props(K, r) {
    const { add, box, lbox, beam } = K;
    const mesh = (g, n, key, p, ry, col, s = 1, o = {}) => {
      const M = MESH[key];
      return add(g, n, M.approx.map((v) => v * s), { p, R: eul(o.rx || 0, ry, o.rz || 0) }, col, { cc: false, extras: [{ mesh: { type: M.type, id: M.id, scale: [M.scale * s, M.scale * s, M.scale * s] } }], ...o, meshKey: key });
    };
    const rnd = (g, n, size, cf, col, o) => round(K, g, n, size, cf, col, o);

    // stepping stones: flattened rounded cylinders, each turned and tipped a little, following the old mud path line
    for (let i = 0; i < 6; i++) {
      const x = -11 + i * 3.6 + (r() - 0.5), z = Math.round(3 - x * 0.3 + 2.2 * Math.sin(x / 4.5)) + 0.5 + (r() - 0.5) * 0.8, d = 2.2 + r() * 0.8;
      rnd('Props/Stones', 'Stone', [d, 0.5, d * (0.8 + r() * 0.2)], { p: [x, 0.25, z], R: eul((r() - 0.5) * 6, r() * 180, (r() - 0.5) * 6) }, pick(r, C.stone));
    }
    // mushrooms: rounded-cylinder cap on a cylinder stem, leaning
    const shroom = (x, z, h, d, col, lean, ry) => {
      const B = { p: [x, 0, z], R: eul(lean, ry, 0) };
      add('Props/Mushrooms', 'Stem', [h, d * 0.28, d * 0.28], local(B, [0, h / 2, 0], Rz(90)), C.stem, { shape: 2 });
      rnd('Props/Mushrooms', 'Cap', [d, d * 0.42, d], local(B, [0, h + d * 0.12, 0]), col);
    };
    shroom(-7, -2, 1.2, 1.6, C.capRed, 8, 0); shroom(-6, -1.1, 0.7, 1, C.capRed, -12, 40); shroom(5.5, 9, 0.9, 1.3, C.capTan, 6, 80);
    // ferns + bushes
    mesh('Props/Plants', 'Fern', 'Fern', [-9.5, 1.1, 1.5], 20, C.fern[0]);
    mesh('Props/Plants', 'Fern', 'Fern', [-5, 0.9, 6], 110, C.fern[1], 0.8);
    mesh('Props/Plants', 'Fern', 'Fern', [9.5, 1.1, -3], 200, C.fern[0]);
    mesh('Props/Plants', 'Fern', 'Fern', [3, 0.8, -9], 300, C.fern[1], 0.7);
    mesh('Props/Plants', 'Bush', 'Bush', [-10, 1, -9], 30, C.bush[0]);
    mesh('Props/Plants', 'Bush', 'Bush', [10, 0.9, 10], 75, C.bush[1], 0.85);
    // sack: rounded cylinder squashed + a tied neck
    const SB = { p: [-4.6, 0, 10.4], R: eul(0, -20, -14) };
    sack(K, SB);
    // plank pile: planks crossed and leaning, not stacked square
    const pl = [[0, 0.15, 0, 4], [0.3, 0.45, 0.2, -6], [-0.2, 0.75, -0.1, 11]];
    for (const [dx, y, dz, ry] of pl) box('Props/Planks', 'Plank', [5, 0.3, 0.9], [2 + dx, y, 12 + dz], pick(r, C.plank), { ry: 70 + ry, variant: 'Weld' });
    beam('Props/Planks', 'Plank', [4.4, 0, 10.6], [3.4, 1.15, 13.6], 0.9, 0.3, C.plank[1], { roll: 0, variant: 'Weld' });
  }

  function build() {
    const K = BK.kit(), T = SK.vox(), O = [1, 0, 1];
    FK.livingTree(T);
    T.emit(K, 'Trees/Oak', 'Block', O);
    props(K, rng(13));
    FC.ground(K, rng(21), 14, (x, z) => T.has(x - O[0], 0, z - O[2]));
    return { name: 'ClassicTest', parts: K.parts, groups: K.groups };
  }

  const api = { build, props, barrel, crate, sack, round, MESH, C };
  if (typeof window !== 'undefined') window.ClassicKit = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
