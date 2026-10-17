
// Oak generator (1-stud): layered trunk (FK.trunk wedge ledges), wedge-capped roots, major limbs as stepped runs that rise and fork,
// broad flat-bottomed leaf lumps at limb tips and over the trunk, leaf tone by exposure (dark under, light + Studs on top), wedges round the lumps.
// Works on ONE shared vox in world cells.
(function () {
  const BK = (typeof window !== 'undefined' && window.BlockKit) || require('./block-kit.js');
  const SK = (typeof window !== 'undefined' && window.StudKit) || require('./stud-kit.js');
  const FK = (typeof window !== 'undefined' && window.ForestKit) || require('./forest-1stud.js');
  const C = { bark: '#5a4232', bark2: '#4c392b', bark3: '#68503b', d: '#345a2e', m: '#3d6a35', l: '#588a42' };
  const DIRS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  const BARK = [C.bark, C.bark2, C.bark3];
  // layers: [y0,y1,x0,x1,z0,z1] relative to (cx,cz,h0). limbs: n, start y band, len range, run (steps per rise), tip lump [r, ry], fork chance, top lump [r, ry, lift]
  const KINDS = {
    young: { layers: [[0, 2, -1, 1, -1, 1], [3, 7, -1, 0, -1, 0]], roots: 3, limbs: { n: 4, y0: 6, ys: 1, len: [2, 4], run: 2, tip: [3, 2], fork: 0.3, top: [3, 2, 1] } },
    mature: { layers: [[0, 3, -2, 1, -2, 1], [4, 8, -1, 1, -1, 1], [9, 12, -1, 0, -1, 0]], roots: 4, limbs: { n: 6, y0: 8, ys: 3, len: [4, 6], run: 2, tip: [3, 2], fork: 0.5, top: [4, 3, 1] } },
    ancient: { layers: [[0, 3, -2, 2, -2, 2], [4, 7, -2, 1, -2, 1], [8, 10, -1, 1, -1, 1], [11, 13, -1, 0, -1, 0]], roots: 6, limbs: { n: 7, y0: 8, ys: 4, len: [6, 9], run: 2, tip: [4, 3], fork: 0.7, top: [5, 3, 1] } },
    lean: { layers: [[0, 3, -2, 1, -2, 1], [4, 7, -1, 1, -1, 1], [8, 10, 0, 1, 0, 1], [11, 13, 1, 2, 1, 2]], roots: 4, lean: [1, 1], limbs: { n: 5, y0: 8, ys: 3, len: [4, 6], run: 2, tip: [3, 2], fork: 0.5, top: [4, 3, 1] } },
    twin: {
      layers: [[0, 3, -2, 1, -2, 1], [4, 5, -1, 1, -1, 1]], roots: 4, stems: [
        { layer: [6, 12, -2, -1, -1, 0], dirs: [4, 3, 5, 2, 6] },
        { layer: [6, 13, 1, 2, -1, 0], dirs: [0, 1, 7, 2, 6] },
      ], limbs: { n: 4, y0: 8, ys: 3, len: [4, 5], run: 2, tip: [3, 2], fork: 0.5, top: [3, 3, 1] },
    },
  };

  const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));

  function lump(V, r, cx, cy, cz, rad, ry, floorAt, h0, rot) {
    const parts = [[0, 0, 0, 1]];
    for (let i = 0, n = 2 + ri(r, 0, 2); i < n; i++) parts.push([Math.round((r() - 0.5) * rad * 1.1), Math.round((r() - 0.3) * ry), Math.round((r() - 0.5) * rad * 1.1), 0.55 + r() * 0.25]);
    for (const [ox, oy, oz, s] of parts) {
      const R = rad * s, Y = ry * s;
      for (let y = -Math.ceil(Y); y <= Math.ceil(Y); y++) for (let z = -Math.ceil(R); z <= Math.ceil(R); z++) for (let x = -Math.ceil(R); x <= Math.ceil(R); x++) {
        const e = (x / (R + 0.5)) ** 2 + ((y > 0 ? y : y * 1.4) / (Y + 0.5)) ** 2 + (z / (R + 0.5)) ** 2;
        if (e > 1) continue;
        const wx = rot ? cx + oy + y : cx + ox + x, wy = rot ? cy + ox + x : cy + oy + y, wz = cz + oz + z;
        if (wy < h0 + 7 || V.has(wx, wy, wz)) continue;
        if (wy < Math.max(floorAt(wx, wz), floorAt(wx + 1, wz), floorAt(wx - 1, wz), floorAt(wx, wz + 1), floorAt(wx, wz - 1))) continue;
        V.set(wx, wy, wz, rot ? '#3d6a36' : C.m);
      }
    }
  }

  // one limb: stepped run along DIRS[di], one rise every `run` steps, 2×2 near the trunk, may fork once. Returns tips.
  function limb(V, r, x, y, z, di, len, run, thick, forkP, depth, tips) {
    const [dx, dz] = DIRS[di], diag = dx && dz;
    for (let u = 0; u < len; u++) {
      if (diag) { if (u % 2 === 0) x += dx; else z += dz; } else { x += dx; z += dz; }
      if ((u + 1) % run === 0) y++;
      V.set(x, y, z, C.bark);
      if (thick && u < len * 0.45) V.set(x, y - 1, z, C.bark);
      if (thick && u < len * 0.25 && !diag) V.set(x + Math.abs(dz), y, z + Math.abs(dx), C.bark);
      if (!diag && u > 1 && u < len - 1 && r() < 0.15) { const s = r() < 0.5 ? 1 : -1; x += Math.abs(dz) * s; z += Math.abs(dx) * s; V.set(x, y, z, C.bark); }
      if (depth < 1 && u === Math.floor(len * 0.5) && r() < forkP) limb(V, r, x, y, z, (di + (r() < 0.5 ? 1 : 7)) % 8, Math.max(3, Math.floor(len * 0.65)), Math.max(1, run - 1), false, 0, depth + 1, tips);
    }
    tips.push({ x, y, z, depth });
  }

  function oak(V, r, cx, cz, h0, kind, floorAt) {
    const K = KINDS[kind], L = K.limbs, tips = [];
    const wr = { set: (a, y, b, c) => V.set(a, y + h0, b, c), wedge: (a, y, b, d, c, inv) => V.wedge(a, y + h0, b, d, c, inv) };
    const abs = (l) => [l[0] + h0, l[1] + h0, l[2] + cx, l[3] + cx, l[4] + cz, l[5] + cz];
    const base = K.layers[0];
    const stems = K.stems ? K.stems.map((s) => ({ ...s, layer: s.layer })) : [{ layer: K.layers[K.layers.length - 1], dirs: null }];
    if (K.stems) for (const s of stems) FK.trunk(V, [...K.layers, s.layer].map(abs), C.bark);
    else FK.trunk(V, K.layers.map(abs), C.bark);
    // roots
    const sides = [['-x', base[2] - 1, null], ['+x', base[3] + 1, null], ['-z', null, base[4] - 1], ['+z', null, base[5] + 1]];
    for (let i = 0; i < K.roots; i++) {
      const [d, fx, fz] = sides[(i + ri(r, 0, 1)) % 4];
      const x = fx === null ? base[2] + ri(r, 0, base[3] - base[2]) : fx, z = fz === null ? base[4] + ri(r, 0, base[5] - base[4]) : fz;
      if (floorAt(cx + x, cz + z) !== h0) continue;
      FK.root(wr, cx + x, cz + z, d, [[2, 1], [1, 1], [2], [1], [2, 1, 1]][ri(r, 0, 4)], C.bark);
    }
    // limbs + lumps per stem top
    for (const s of stems) {
      const [, y1, x0, , z0] = s.layer, ox = cx + x0, oz = cz + z0, top = h0 + y1;
      const off = ri(r, 0, 7);
      const pick = s.dirs ? s.dirs.slice(0, L.n) : Array.from({ length: L.n }, (_, i) => (off + Math.round((i * 8) / L.n)) % 8);
      for (const di of pick) {
        const [dx, dz] = DIRS[di];
        let m = 1;
        if (K.lean) m = 0.55 + 0.9 * ((dx * K.lean[0] + dz * K.lean[1]) / (Math.hypot(...DIRS[di]) * Math.hypot(...K.lean)) + 1) / 2;
        const len = Math.max(3, Math.round(ri(r, L.len[0], L.len[1]) * m));
        const sx = dx > 0 ? ox + 2 : dx < 0 ? ox - 1 : ox + ri(r, 0, 1), sz = dz > 0 ? oz + 2 : dz < 0 ? oz - 1 : oz + ri(r, 0, 1);
        const sy = Math.min(top - 1, h0 + L.y0 + ri(r, 0, L.ys));
        V.set(dx > 0 ? ox + 1 : dx < 0 ? ox : sx, sy, dz > 0 ? oz + 1 : dz < 0 ? oz : sz, C.bark);
        limb(V, r, sx - dx, sy, sz - dz, di, len, L.run, true, L.fork, 0, tips);
      }
      const tl = s.dirs ? [L.top[0], L.top[1], L.top[2]] : L.top;
      lump(V, r, ox, top + tl[2] + 1, oz, tl[0], tl[1], floorAt, h0);
    }
    for (const t of tips) {
      const k = t.depth ? 0.8 : 1;
      lump(V, r, t.x, t.y + 1, t.z, Math.max(2, Math.round(L.tip[0] * k + (r() - 0.5) * 1.5)), Math.max(2, Math.round(L.tip[1] * k + (r() - 0.3))), floorAt, h0);
    }
    // bark streaks: vertical runs of darker bark on exposed trunk cells
    const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]], pool = [];
    for (let y = h0 + 1; y < h0 + 12; y++) for (let x = cx - 3; x <= cx + 3; x++) for (let z = cz - 3; z <= cz + 3; z++) if (V.color(x, y, z) === C.bark && N4.some(([a, b]) => !V.has(x + a, y, z + b))) pool.push([x, y, z]);
    for (let i = 0; i < Math.min(pool.length, 2 + K.roots); i++) {
      const [x, y, z] = pool.splice(ri(r, 0, pool.length - 1), 1)[0], col = r() < 0.5 ? C.bark2 : C.bark3;
      for (let q = 0, n = ri(r, 2, 4); q < n; q++) if (V.color(x, y + q, z) === C.bark) V.set(x, y + q, z, col);
    }
  }

  // leaf tone by exposure, then wedges (bark first, then leaves), Weld on wood
  function finish(V, r, keepLeaf = 0.5, keepBark = 0.7) {
    FK.smooth(V, BARK);
    for (const k of [...V.wedges.keys()]) if (r() > keepBark) V.wedges.delete(k);
    for (const [k, c] of [...V.cells.entries()]) {
      if (c !== C.m) continue;
      const [x, y, z] = k.split(',').map(Number);
      if (!V.has(x, y + 1, z)) { if (r() < 0.75) V.set(x, y, z, r() < 0.3 ? C.l + '/S' : C.l); } else if (!V.has(x, y - 1, z)) V.set(x, y, z, C.d);
    }
    const before = new Set(V.wedges.keys());
    FK.smooth(V, [C.d, C.m, C.l, C.l + '/S']);
    for (const k of [...V.wedges.keys()]) if (!before.has(k) && r() > keepLeaf) V.wedges.delete(k);
    FK.weldSplotch(V, BARK, 17, 10 + Math.floor(V.cells.size / 400));
  }

  // test layout: two rows of the five kinds (different seeds)
  const ORDER = ['young', 'mature', 'ancient', 'lean', 'twin'];
  function test() {
    const K = BK.kit(), V = SK.vox(), r = BK.rng(11), layout = [];
    ORDER.forEach((kind, i) => { layout.push({ kind, x: -56 + i * 28, z: 0 }); layout.push({ kind, x: -56 + i * 28, z: -48 }); });
    for (const t of layout) oak(V, r, t.x, t.z, 0, t.kind, () => 0);
    finish(V, r);
    V.emit(K, 'Trees/Oaks', 'Voxel');
    FK.groundTile(K, (x, z) => V.has(x, 0, z), 5, 64);
    return { name: 'OakTest', parts: K.parts, groups: K.groups, player: [-42, 11, 0], layout };
  }

  const api = { oak, finish, test, KINDS, C, ORDER, limb, lump };
  if (typeof window !== 'undefined') window.OakGen = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
