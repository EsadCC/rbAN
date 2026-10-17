// Snow Camp, STAGE 2 KEY SPOTS. Stage 1 terrain (no markers) + the real fire ring, benches, tent and woodpile.
// Structure on the grid (ring, benches, tent, woodpile); Fire pit stays EMPTY (user adds flames). Snow caps come in stage 3.
(function () {
  const BK = (typeof window !== 'undefined' && window.BlockKit) || require('./block-kit.js');
  const SK = (typeof window !== 'undefined' && window.StudKit) || require('./stud-kit.js');
  const FK = (typeof window !== 'undefined' && window.ForestKit) || require('./forest-1stud.js');
  const FC = (typeof window !== 'undefined' && window.ForestCorner) || require('./forest-corner.js');
  const CV = (typeof window !== 'undefined' && window.CampfireV2) || require('./campfire-v2.js');
  const TN = (typeof window !== 'undefined' && window.Tent) || require('./tent.js');
  const SC = (typeof window !== 'undefined' && window.SnowCamp) || require('./snow-blockout.js');
  const { rng } = BK;
  const C = { ...FC.C, snow: '#f1f5f8' };
  const FIRE = SC.FIRE, ORIGIN_TENT = [-11, 0, -12];
  const DIR = { '-x': '-z', '+x': '+z', '-z': '+x', '+z': '-x' };

  // quarter turn: front (−z) faces +x. Cell (x,z) → (−z−1, x).
  function turn(V) {
    const O = SK.vox();
    for (const [k, c] of V.cells) { const [x, y, z] = k.split(',').map(Number); O.set(-z - 1, y, x, c); }
    for (const w of V.wedges.values()) O.wedge(-w.z - 1, w.y, w.x, DIR[w.dir], w.color, w.inv);
    return O;
  }

  function ring() {
    const Ring = SK.vox(), S = (c) => c + '/S';
    for (let x = -3; x <= 2; x++) for (let z = -3; z <= 2; z++) {
      const edge = x === -3 || x === 2 || z === -3 || z === 2, corner = (x === -3 || x === 2) && (z === -3 || z === 2);
      if (edge && !corner) Ring.set(x, 0, z, (x + z) % 3 === 0 ? S(C.rock[0]) : C.rock[0]);
    }
    for (const [x, z] of [[-3, -1], [2, 0], [0, 2]]) Ring.set(x, 1, z, C.rock[0]);
    return Ring;
  }

  function build(o = {}) {
    const K = BK.kit(), base = SC.build({ markers: false, ground: o.ground, pines: o.pines, smallPines: o.smallPines });
    base.parts.forEach((p) => { K.parts.push(p); });
    Object.assign(K.groups, base.groups);
    const [fx, fz] = FIRE, r = rng(31);
    ring().emit(K, 'Camp/FireRing', 'Stone', [fx, 0, fz]);
    // seats ~4 studs from the ring edge; east side open toward the pond
    const Benches = SK.vox();
    CV.bench(Benches, r, -3, -10, 7, 'x');
    CV.bench(Benches, r, -3, 8, 7, 'x');
    FK.weldSplotch(Benches, C.bark, 17, 2);
    Benches.emit(K, 'Camp/Benches', 'Log', [fx, 0, fz]);
    // tent, door to the fire
    const T = SK.vox();
    TN.tent(T, rng(41));
    FK.weldSplotch(T, C.bark, 9, 3);
    if (o.snow) { // snow blanket on the upper roof (not the wooden bargeboards or ridge pole)
      const wood = new Set(C.bark.concat([C.barkEnd]));
      for (const [k, c] of T.cells) { const [x, y, z] = k.split(',').map(Number); if (y >= 3 && z >= 1 && z <= TN.L - 2 && !wood.has(c.split('/')[0])) T.cells.set(k, C.snow); }
      for (const w of T.wedges.values()) if (w.y >= 3 && w.z >= 1 && w.z <= TN.L - 2 && !wood.has(w.color.split('/')[0])) w.color = C.snow;
    }
    turn(T).emit(K, 'Camp/Tent', 'Block', ORIGIN_TENT);
    // woodpile: 4 long, 3 rows, 2 on top
    const Pile = SK.vox();
    for (const z of [0, 1, 2]) Pile.fill(0, 3, 0, 0, z, z, C.bark[0] + '/W');
    Pile.fill(0, 3, 1, 1, 0, 1, C.bark[0] + '/W');
    Pile.emit(K, 'Camp/Woodpile', 'Log', [-18, 0, -4]);
    if (o.snow) {
      K.box('Camp/Snow', 'WoodSnow', [3, 0.5, 2], [-16, 2.25, -3], C.snow);
      for (const [x, z] of [[-3, -1], [2, 0], [0, 2]]) K.box('Camp/Snow', 'StoneSnow', [1, 0.5, 1], [fx + x + 0.5, 2.25, fz + z + 0.5], C.snow);
    }
    return { name: 'SnowCamp_KeySpots', parts: K.parts, groups: K.groups, player: base.player, zones: base.zones, pines: base.pines, trees: base.trees };
  }

  const api = { build, turn };
  if (typeof window !== 'undefined') window.SnowCampSpots = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
