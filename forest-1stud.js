// Forest, 1-stud style. Dead tree test piece on a 24×24 ground tile.
// Trunk tapers in layers; every exposed ledge gets a wedge sloping out. Branches are 45° stairs smoothed with a wedge above
// and a hanging wedge below each step. Roots are stepped blocks capped with wedges. Ground cover is 0.2 plates on the grid.
(function () {
  const BK = (typeof window !== 'undefined' && window.BlockKit) || require('./block-kit.js');
  const SK = (typeof window !== 'undefined' && window.StudKit) || require('./stud-kit.js');
  const { STEP, FLIP } = SK;
  const C = {
    mud: '#5a4433', mudWet: '#4a382b', gravel: '#857a6c', grass: '#5b6a38', grassDark: '#4b5a30', grassDry: '#6f7542', stone: '#77726b', stoneDark: '#635e58',
    dead: '#7d6d5c', bark: '#5a4232', barkDark: '#45342a', leafDark: '#3e5a2c', leaf: '#4a6a33', leafLight: '#5d7c3c', deadDark: '#655748', deadLight: '#8c7c69', knot: '#3a2f27',
  };

  // layered trunk: [y0, y1, x0, x1, z0, z1] inclusive
  function trunk(V, layers, col) {
    layers.forEach(([y0, y1, x0, x1, z0, z1]) => V.fill(x0, x1, y0, y1, z0, z1, col));
    for (let i = 0; i < layers.length - 1; i++) {
      const [, top, x0, x1, z0, z1] = layers[i], up = layers[i + 1], y = top + 1;
      const inUp = (x, z) => x >= up[2] && x <= up[3] && z >= up[4] && z <= up[5];
      for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
        if (inUp(x, z)) continue;
        const n = Object.entries(STEP).filter(([, [dx, dz]]) => inUp(x + dx, z + dz)).map(([d]) => d);
        if (n.length === 1) V.wedge(x, y, z, FLIP[n[0]], col);
      }
      // overhangs: hanging wedge under any upper cell with nothing below
      for (let x = up[2]; x <= up[3]; x++) for (let z = up[4]; z <= up[5]; z++) {
        if (V.solid(x, top, z)) continue;
        const n = Object.entries(STEP).filter(([, [dx, dz]]) => V.solid(x + dx, top, z + dz)).map(([d]) => d);
        if (n.length) V.wedge(x, top, z, FLIP[n[0]], col, true);
      }
    }
  }
  // 45° stair branch: starts at (x, y, z), climbs one up per step along dir
  function branch(V, x, y, z, dir, n, col, tip = true) {
    const [dx, dz] = STEP[dir];
    for (let i = 0; i < n; i++) V.set(x + dx * i, y + i, z + dz * i, col);
    for (let i = 0; i < n - 1; i++) {
      V.wedge(x + dx * i, y + i + 1, z + dz * i, FLIP[dir], col);
      V.wedge(x + dx * (i + 1), y + i, z + dz * (i + 1), dir, col, true);
    }
    const e = [x + dx * (n - 1), y + n - 1, z + dz * (n - 1)];
    if (tip) V.wedge(e[0] + dx, e[1], e[2] + dz, dir, col);
    return e;
  }
  // root along dir from the trunk face cell (x, z): heights listed per step, each run capped by an outward wedge
  function root(V, x, z, dir, hs, col) {
    const [dx, dz] = STEP[dir];
    hs.forEach((h, i) => {
      const cx = x + dx * i, cz = z + dz * i;
      for (let y = 0; y < h; y++) V.set(cx, y, cz, col);
      V.wedge(cx, h, cz, dir, col);
    });
    const L = hs.length;
    V.wedge(x + dx * L, 0, z + dz * L, dir, col);
  }

  // smoothing pass over cells of the given colours: a wedge on every empty cell that sits on top of one (or hangs under one)
  // and has exactly one same-level solid neighbour; the wedge slopes away from that neighbour.
  function smooth(V, cols, under = true) {
    const ok = (x, y, z) => V.solid(x, y, z) && cols.includes(V.color(x, y, z));
    const cand = new Set();
    for (const k of V.cells.keys()) { const [x, y, z] = k.split(',').map(Number); if (!ok(x, y, z)) continue; for (const [dx, dz] of Object.values(STEP)) { cand.add([x + dx, y + 1, z + dz].join()); if (under) cand.add([x + dx, y - 1, z + dz].join()); } cand.add([x, y + 1, z].join()); }
    const top = [], hang = [];
    for (const k of cand) {
      const [x, y, z] = k.split(',').map(Number);
      if (V.has(x, y, z)) continue;
      const n = Object.entries(STEP).filter(([, [dx, dz]]) => ok(x + dx, y, z + dz));
      if (n.length !== 1) continue;
      const [d, [dx, dz]] = n[0];
      if (ok(x, y - 1, z)) top.push([x, y, z, FLIP[d], V.color(x + dx, y, z + dz)]);
      else if (under && ok(x, y + 1, z) && y > 0) hang.push([x, y, z, FLIP[d], V.color(x + dx, y, z + dz)]);
    }
    top.forEach(([x, y, z, d, c]) => V.wedge(x, y, z, d, c));
    hang.forEach(([x, y, z, d, c]) => { if (!V.has(x, y, z)) V.wedge(x, y, z, d, c, true); });
  }
  // leaf mass: ellipsoid of cells, shaded by height (dark underside, light crown)
  function canopy(V, cx, cy, cz, rx, ry, rz) {
    for (let y = -ry; y <= ry; y++) for (let z = -rz; z <= rz; z++) for (let x = -rx; x <= rx; x++) {
      const e = (x / (rx + 0.5)) ** 2 + (y / (ry + 0.5)) ** 2 + (z / (rz + 0.5)) ** 2;
      if (e > 1) continue;
      const t = (y + ry) / (2 * ry), col = t < 0.3 ? C.leafDark : t < 0.75 ? C.leaf : C.leafLight;
      const prev = V.color(cx + x, cy + y, cz + z);
      if (prev === C.leafLight || (prev === C.leaf && col === C.leafDark)) continue;
      V.set(cx + x, cy + y, cz + z, col);
    }
  }

  // Weld splotches on wood: n small clusters (2–4 exposed cells) of a wood colour recoloured with the Weld variant.
  function weldSplotch(V, woods, seed = 3, n = 5) {
    const r = BK.rng(seed), N6 = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
    const wood = (x, y, z) => woods.includes(V.color(x, y, z));
    const open = (x, y, z) => N6.some(([a, b, c]) => !V.has(x + a, y + b, z + c));
    const pool = [...V.cells.keys()].map((k) => k.split(',').map(Number)).filter(([x, y, z]) => y > 0 && wood(x, y, z) && open(x, y, z));
    for (let i = 0; i < n && pool.length; i++) {
      let [x, y, z] = pool.splice(Math.floor(r() * pool.length), 1)[0];
      const size = 2 + Math.floor(r() * 3);
      for (let k = 0; k < size; k++) {
        const c = V.color(x, y, z); if (wood(x, y, z)) V.set(x, y, z, c + '/W');
        const nb = N6.map(([a, b, c2]) => [x + a, y + b, z + c2]).filter(([a, b, c2]) => wood(a, b, c2) && open(a, b, c2));
        if (!nb.length) break; [x, y, z] = nb[Math.floor(r() * nb.length)];
      }
    }
  }

  function livingTree(V) {
    const B = C.bark;
    trunk(V, [
      [0, 2, -2, 1, -2, 1],
      [3, 9, -1, 1, -2, 0],
      [10, 13, -1, 0, -2, -1],
    ], B);
    V.fill(2, 2, 0, 1, -1, -1, C.barkDark); V.wedge(2, 2, -1, '+x', C.barkDark);
    V.fill(-2, -2, 3, 6, -1, -1, C.barkDark); V.wedge(-2, 7, -1, '-x', C.barkDark);
    V.fill(0, 0, 4, 8, 1, 1, C.barkDark); V.wedge(0, 9, 1, '+z', C.barkDark);
    V.set(1, 5, -3, C.knot); V.set(0, 5, -3, C.barkDark); V.set(2, 5, -3, C.barkDark); V.set(1, 6, -3, C.barkDark);
    V.wedge(0, 6, -3, '-x', C.barkDark); V.wedge(2, 6, -3, '+x', C.barkDark);
    root(V, -3, 0, '-x', [2, 1], B);
    root(V, 2, -2, '+x', [2, 1], B);
    root(V, -1, 2, '+z', [1, 1], B);
    root(V, 0, -3, '-z', [2, 1, 1], B);
    root(V, 1, 2, '+z', [2], B);
    // limbs climb out into the side masses
    branch(V, 2, 9, -1, '+x', 4, B, false);
    branch(V, -2, 10, -1, '-x', 3, B, false);
    branch(V, 0, 11, 1, '+z', 3, B, false);
    // canopy: one crown + three side masses at different heights
    canopy(V, 0, 17, -1, 5, 3, 5);
    canopy(V, 5, 14, -1, 3, 2, 3);
    canopy(V, -4, 14, 0, 3, 2, 3);
    canopy(V, 0, 15, 4, 3, 2, 2);
    canopy(V, 1, 20, -2, 3, 2, 3);
    smooth(V, [C.leafDark, C.leaf, C.leafLight]);
    weldSplotch(V, [C.bark, C.barkDark], 7, 5);
  }

  function deadTree(V) {
    const D = C.dead;
    trunk(V, [
      [0, 3, -2, 1, -2, 1],
      [4, 8, -2, 0, -2, 0],
      [9, 12, -1, 0, -2, -1],
      [13, 15, 0, 1, -2, -1],
    ], D);
    // bark ridges (one stud proud of the face) + knot
    V.fill(2, 2, 0, 2, 0, 0, C.deadDark); V.wedge(2, 3, 0, '+x', C.deadDark);
    V.fill(-3, -3, 0, 1, -2, -2, C.deadDark); V.wedge(-3, 2, -2, '-x', C.deadDark);
    V.fill(-1, -1, 4, 6, 1, 1, C.deadDark); V.wedge(-1, 7, 1, '+z', C.deadDark);
    V.fill(0, 0, 9, 11, 0, 0, C.deadDark);
    V.set(-1, 6, -2, C.knot); V.set(-2, 6, -3, C.deadDark); V.set(0, 6, -3, C.deadDark); V.set(-1, 7, -3, C.deadDark);
    V.wedge(-2, 7, -3, '-x', C.deadDark); V.wedge(0, 7, -3, '+x', C.deadDark);
    // broken top
    V.set(0, 16, -2, D); V.wedge(1, 16, -2, '+x', D); V.wedge(0, 16, -1, '+z', D); V.wedge(1, 16, -1, '+x', C.deadLight);
    V.wedge(0, 17, -2, '-z', C.deadLight);
    // roots
    root(V, -3, 0, '-x', [2, 1], D);
    root(V, 2, -2, '+x', [1], D);
    root(V, -1, 2, '+z', [2, 1, 1], D);
    root(V, 0, -3, '-z', [1, 1], D);
    root(V, 1, 2, '+z', [1], D);
    // branches
    let e = branch(V, -3, 6, -1, '-x', 4, D, false);
    V.set(e[0], e[1] + 1, e[2], D); V.set(e[0], e[1] + 2, e[2], D); V.wedge(e[0], e[1] + 3, e[2], '-x', D);
    V.set(e[0] - 1, e[1] + 1, e[2], D); V.wedge(e[0] - 2, e[1] + 1, e[2], '-x', D);
    branch(V, -1, 7, 1, '+z', 3, D);
    e = branch(V, -1, 10, -3, '-z', 3, D, false);
    V.set(e[0], e[1] + 1, e[2], D); V.wedge(e[0], e[1] + 2, e[2], '+z', D); V.wedge(e[0], e[1], e[2] - 1, '-z', D);
    e = branch(V, 2, 13, -1, '+x', 2, D, false);
    V.set(e[0] + 1, e[1], e[2], D); V.wedge(e[0] + 2, e[1], e[2], '+x', D); V.wedge(e[0], e[1] + 1, e[2], '+x', D);
    weldSplotch(V, [C.dead, C.deadDark], 11, 5);
  }

  // 24×24 mud tile; ground cover as random-walk blobs of plates; cells under solid voxels at y=0 are left bare
  function groundTile(K, solidAt, seed = 5, N = 12) {
    const r = BK.rng(seed);
    K.box('Ground', 'Mud', [2 * N, 1, 2 * N], [0, -0.5, 0], C.mud);
    const map = new Map(), key = (x, z) => x + ',' + z;
    const blocked = (x, z) => solidAt(x, z) || x < -N || x >= N || z < -N || z >= N;
    const blob = (col, n, len) => {
      for (let b = 0; b < n; b++) {
        let x = Math.floor((r() - 0.5) * 2 * N), z = Math.floor((r() - 0.5) * 2 * N);
        for (let i = 0; i < len; i++) {
          if (!blocked(x, z) && !map.has(key(x, z))) map.set(key(x, z), col);
          const d = Object.values(STEP)[Math.floor(r() * 4)]; x += d[0]; z += d[1];
        }
      }
    };
    blob(C.grassDark, 5, 60); blob(C.grass, 6, 40); blob(C.grassDry, 5, 14); blob(C.gravel, 4, 12); blob(C.mudWet, 3, 10);
    const S = SK.vox();
    for (let i = 0; i < 6; i++) {
      const x = Math.floor((r() - 0.5) * 2 * (N - 2)), z = Math.floor((r() - 0.5) * 2 * (N - 2));
      if (solidAt(x, z) || solidAt(x + 1, z) || map.get(key(x, z)) === undefined && false) continue;
      const col = r() < 0.5 ? C.stone : C.stoneDark;
      S.set(x, 0, z, col); map.delete(key(x, z));
      if (r() < 0.6) { S.set(x + 1, 0, z, col); map.delete(key(x + 1, z)); S.wedge(x, 1, z, '-x', col); }
    }
    SK.plates(K, 'Ground', 'Cover', map, 0);
    S.emit(K, 'Ground', 'Stone');
  }

  function build() {
    const K = BK.kit(), D = SK.vox(), L = SK.vox(), OD = [-9, 0, 0], OL = [9, 0, 1];
    deadTree(D); livingTree(L);
    D.emit(K, 'DeadTree', 'Wood', OD);
    L.emit(K, 'Tree', 'Wood', OL);
    groundTile(K, (x, z) => D.has(x - OD[0], 0, z - OD[2]) || L.has(x - OL[0], 0, z - OL[2]), 5, 18);
    return { name: 'ForestKit1Stud', parts: K.parts, groups: K.groups };
  }

  const api = { build, weldSplotch, livingTree, canopy, smooth, deadTree, trunk, branch, root, groundTile, C };
  if (typeof window !== 'undefined') window.ForestKit = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
