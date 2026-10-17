// Snow Camp, STAGE 3 DRESSING. Stage 2 camp + dressed terrain: Studs snow caps (1 tone + a darker one on ~10%), packed-snow paths, Inlet ice,
// raised drifts, snow-capped rock piles, snow on the camp, and the real pines (green boughs with snow shelves, ragged strips, Weld trunk, root wedges).
// All structure on the grid; half-stud sizes only.
(function () {
  const BK = (typeof window !== 'undefined' && window.BlockKit) || require('./block-kit.js');
  const SK = (typeof window !== 'undefined' && window.StudKit) || require('./stud-kit.js');
  const FK = (typeof window !== 'undefined' && window.ForestKit) || require('./forest-1stud.js');
  const FC = (typeof window !== 'undefined' && window.ForestCorner) || require('./forest-corner.js');
  const SP = (typeof window !== 'undefined' && window.SnowPines) || require('./snow-pines.js');
  const SC = (typeof window !== 'undefined' && window.SnowCamp) || require('./snow-blockout.js');
  const SS = (typeof window !== 'undefined' && window.SnowCampSpots) || require('./snow-spots.js');
  const { rng } = BK;
  const C = {
    snow: ['#e9eef2', '#dbe3ea'], cap: '#f1f5f8', path: '#c3ccd4', ice: ['#a9cde0', '#9bbfd4'], rock: ['#8d9096', '#7e8187'],
    pine: ['#33503f', '#2a4535'], pile: ['#7d7871', '#6b665f'], bark: FC.C.bark,
  };
  const VAR = { snow: 'Studs', path: 'Studs', rock: 'Studs', ice: 'Inlet' };

  function build() {
    const K = BK.kit(), r = rng(77), pick = (a) => a[Math.floor(r() * a.length)];
    const base = SS.build({ snow: true, ground: false, pines: false, smallPines: true });
    base.parts.forEach((p) => K.parts.push(p));
    Object.assign(K.groups, base.groups);
    const key = (x, z) => x + ',' + z, N = SC.N, FLOOR = SC.FLOOR, [fx, fz] = SC.FIRE, P = SC.POND;

    // ---- terrain ----
    const H = SC.heights(), cells = new Map();
    for (const [k, v] of H) {
      const [x, z] = k.split(',').map(Number);
      cells.set(k, { x, z, h: v.h, kind: v.h === -0.5 ? 'ice' : v.c === SC.C.path ? 'path' : v.c === SC.C.rock ? 'rock' : 'snow', tone: 0 });
    }
    for (const kind of ['snow', 'rock', 'ice']) { // darker tone on ~10%, stamped as small rects
      const list = [...cells.values()].filter((c) => c.kind === kind), target = list.length * 0.1;
      let n = 0;
      for (let t = 0; t < 600 && n < target; t++) {
        const o = pick(list), w = 2 + Math.floor(r() * 3), d = 2 + Math.floor(r() * 2);
        for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) { const c = cells.get(key(o.x + i, o.z + j)); if (c && c.kind === kind && c.h === o.h && !c.tone) { c.tone = 1; n++; } }
      }
    }
    const bodyCol = (c) => (c.kind === 'rock' ? C.rock[0] : c.kind === 'ice' ? C.ice[0] : C.snow[0]);
    const plateCol = (c) => (c.kind === 'path' ? C.path : C[c.kind][c.tone]);
    const merge = (kf, emit) => {
      const seen = new Set(), same = (x, z, f) => { const c = cells.get(key(x, z)); return c && !seen.has(key(x, z)) && kf(c) === f; };
      for (let z = -N; z < N; z++) for (let x = -N; x < N; x++) {
        if (seen.has(key(x, z))) continue;
        const c = cells.get(key(x, z)), f = kf(c);
        let dx = 1, dz = 1;
        while (same(x + dx, z, f)) dx++;
        const row = (zz) => { for (let i = 0; i < dx; i++) if (!same(x + i, zz, f)) return false; return true; };
        while (row(z + dz)) dz++;
        for (let q = 0; q < dz; q++) for (let i = 0; i < dx; i++) seen.add(key(x + i, z + q));
        emit(x, z, dx, dz, c);
      }
    };
    merge((c) => bodyCol(c) + c.h, (x, z, dx, dz, c) => {
      const hy = c.h - 0.2 - FLOOR;
      K.box('Terrain/Body', 'Block', [dx, hy, dz], [x + dx / 2, FLOOR + hy / 2, z + dz / 2], bodyCol(c));
    });
    merge((c) => c.kind + c.tone + c.h, (x, z, dx, dz, c) => {
      K.box('Terrain/' + c.kind[0].toUpperCase() + c.kind.slice(1), 'Cap', [dx, 0.2, dz], [x + dx / 2, c.h - 0.1, z + dz / 2], plateCol(c), { variant: VAR[c.kind] });
    });

    // ---- pine placement (few, big, framing the edges) ----
    const trees = [], rects = [[-20, -11, -18, -6], [-18, -14, -4, -1], [-9, 0, -18, 5]];
    const hAt = (x, z) => { const c = cells.get(key(x, z)); return c ? c.h : 99; };
    const rr = rng(404), want = ['big', 'big', 'big', 'mid', 'mid', 'mid', 'small', 'small'];
    for (const kind of want) {
      const R = SP.KINDS[kind].R;
      for (let t = 0; t < 4000; t++) {
        const cx = Math.round(-27 + rr() * 54), cz = Math.round(-27 + rr() * 54), h0 = hAt(cx, cz);
        if (h0 < 0 || h0 > 6) continue;
        if (Math.min(cx + N, N - cx, cz + N, N - cz) > R + 6 && h0 < 2) continue;
        if (cx - R * 0.6 < -N || cx + R * 0.6 > N || cz - R * 0.6 < -N || cz + R * 0.6 > N) continue;
        let ok = true;
        for (let a = cx - 3; a <= cx + 2 && ok; a++) for (let b = cz - 3; b <= cz + 2; b++) { const c = cells.get(key(a, b)); if (!c || c.kind === 'path' || c.kind === 'ice' || c.kind === 'rock' || c.h !== h0) { ok = false; break; } }
        if (!ok) continue;
        const rad = Math.ceil(R * 0.8);
        for (let a = -rad; a <= rad && ok; a += 2) for (let b = -rad; b <= rad; b += 2) { if (a * a + b * b > rad * rad) continue; const c = cells.get(key(cx + a, cz + b)); if (c && (c.h > h0 + 3 || c.kind === 'ice' && Math.hypot(a, b) < 3)) { ok = false; break; } }
        if (!ok) continue;
        if (rects.some(([x0, x1, z0, z1]) => Math.hypot(Math.max(x0 - cx, 0, cx - x1), Math.max(z0 - cz, 0, cz - z1)) < R * 1.3 + 1)) continue;
        if (trees.some((q) => Math.hypot(q.cx - cx, q.cz - cz) < (q.R + R) * 1.0)) continue;
        trees.push({ cx, cz, h0, kind, R }); break;
      }
    }

    // ---- occupancy: camp, pines, pond, clearing ----
    const occ = new Set();
    const occR = (x0, x1, z0, z1, pad = 0) => { for (let x = Math.floor(x0 - pad); x < x1 + pad; x++) for (let z = Math.floor(z0 - pad); z < z1 + pad; z++) occ.add(key(x, z)); };
    occR(-20, -11, -18, -6, 2); occR(-18, -14, -4, -1, 2); occR(-9, 0, -18, 5, 1);
    for (const t of trees) occR(t.cx - t.R * 0.6, t.cx + t.R * 0.6, t.cz - t.R * 0.6, t.cz + t.R * 0.6, 1);
    const free = (x, z, w, d) => { for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) { const c = cells.get(key(x + i, z + j)); if (!c || c.kind !== 'snow' || c.h !== 0 || occ.has(key(x + i, z + j)) || Math.hypot(x + i - fx, z + j - fz) < 10.5) return false; } return true; };
    const take = (x, z, w, d) => { for (let i = -1; i <= w; i++) for (let j = -1; j <= d; j++) occ.add(key(x + i, z + j)); };

    // ---- rock piles (snow-capped), mostly on the pond bank ----
    let piles = 0; const pileList = [];
    for (let t = 0; t < 600 && piles < 9; t++) {
      let x, z;
      if (piles < 6) { const a = r() * Math.PI * 2; x = Math.round(P[0] + 12.4 * Math.cos(a)); z = Math.round(P[1] + 9.2 * Math.sin(a)); } else { x = Math.round(-22 + r() * 44); z = -20 + Math.floor(r() * 2); }
      if (!free(x, z, 3, 2)) continue;
      take(x, z, 3, 2); piles++; pileList.push({ x, z });
      const flip = r() < 0.5 ? 0 : 1, G = 'Terrain/RockPiles';
      K.box(G, 'Base', [3, 1, 2], [x + 1.5, 0.5, z + 1], C.pile[0]);
      const tx = flip ? x + 1 : x;
      K.box(G, 'Top', [2, 1, 1], [tx + 1, 1.5, z + 0.5], C.pile[1]);
      K.box(G, 'Snow', [2, 0.5, 1], [tx + 1, 2.25, z + 0.5], C.cap);
      K.box(G, 'Snow', [1, 0.5, 2], [flip ? x + 0.5 : x + 2.5, 1.25, z + 1], C.cap);
    }

    // ---- drifts ----
    let drifts = 0;
    for (let t = 0; t < 2000 && drifts < 14; t++) {
      const w = 2 + Math.floor(r() * 4), d = 2 + Math.floor(r() * 3), x = Math.round(-27 + r() * 54), z = Math.round(-22 + r() * 50);
      if (!free(x, z, w, d)) continue;
      take(x, z, w, d); drifts++;
      K.box('Terrain/Drifts', 'Drift', [w, 0.5, d], [x + w / 2, 0.25, z + d / 2], C.snow[0], { variant: 'Studs' });
      if (w >= 4 && d >= 3) K.box('Terrain/Drifts', 'Drift', [w - 2, 0.5, d - 2], [x + w / 2, 0.75, z + d / 2], C.snow[0], { variant: 'Studs' });
    }

    // ---- terrain finishing: scree wedges at tall faces, bank wedges at the pond, flush pebble discs ----
    const ROT = { '-z': 0, '+z': 180, '+x': -90, '-x': 90 }, DIRS = [['+x', 1, 0], ['-x', -1, 0], ['+z', 0, 1], ['-z', 0, -1]];
    const OPP = { '+x': '-x', '-x': '+x', '+z': '-z', '-z': '+z' };
    const at = (x, z) => cells.get(key(x, z));
    for (const c of cells.values()) {
      if (c.kind !== 'snow' || c.h < 0 || occ.has(key(c.x, c.z)) || Math.hypot(c.x - fx, c.z - fz) < 11) continue;
      const hi = DIRS.filter(([, dx, dz]) => { const q = at(c.x + dx, c.z + dz); return q && q.h >= c.h + 2; });
      if (hi.length !== 1 || r() > 0.85) continue; // one tall neighbour only, most of every tier foot
      const [dir, dx, dz] = hi[0], q = at(c.x + dx, c.z + dz);
      K.add('Terrain/Scree', 'Scree', [1, 1, 1], { p: [c.x + 0.5, c.h + 0.5, c.z + 0.5], R: BK.Ry(ROT[OPP[dir]]) }, q.kind === 'rock' ? C.rock[q.tone] : C.snow[0], { cls: 'WedgePart' });
    }
    for (const c of cells.values()) { // pond bank: half-height wedges on the ice edge, sloping out into the pond
      if (c.kind !== 'ice') continue;
      const bank = DIRS.filter(([, dx, dz]) => { const q = at(c.x + dx, c.z + dz); return q && q.kind === 'snow' && q.h === 0; });
      if (bank.length !== 1 || r() > 0.95) continue;
      K.add('Terrain/Bank', 'BankWedge', [1, 0.5, 1], { p: [c.x + 0.5, -0.25, c.z + 0.5], R: BK.Ry(ROT[OPP[bank[0][0]]]) }, C.snow[0], { cls: 'WedgePart' });
    }
    const PEB = ['#6f747a', '#5f646a', '#7d8187'], pocc = new Set();
    const pebble = (x, z, dd) => {
      for (let i = 0; i < dd; i++) for (let j = 0; j < dd; j++) { const q = at(x + i, z + j); if (!q || q.kind !== 'snow' || q.h !== 0 || pocc.has(key(x + i, z + j)) || (q.kind === 'snow' && occ.has(key(x + i, z + j)))) return false; }
      for (let i = -1; i <= dd; i++) for (let j = -1; j <= dd; j++) pocc.add(key(x + i, z + j));
      K.add('Terrain/Pebbles', 'Pebble', [0.5, dd, dd], { p: [x + dd / 2, 0.25, z + dd / 2], R: BK.eul(0, 0, 90) }, PEB[Math.floor(r() * 3)], { shape: 2 });
      return true;
    };
    const near = (pred, count, tries) => { const list = [...cells.values()].filter(pred); for (let t = 0, n = 0; t < tries && n < count && list.length; t++) { const c = list[Math.floor(r() * list.length)]; if (pebble(c.x, c.z, 1 + Math.floor(r() * 3))) n++; } };
    const nb = (c, f) => DIRS.some(([, dx, dz]) => { const q = at(c.x + dx, c.z + dz); return q && f(q); });
    near((c) => c.kind === 'snow' && c.h === 0 && Math.hypot(c.x - fx, c.z - fz) > 12, 12, 800); // a few strays on open ground

    // ---- pines: one shared vox so overlapping canopies merge ----
    const V = SK.vox(), pr = rng(9);
    const floorAt = (x, z) => { const c = cells.get(key(x, z)); return c ? c.h : 0; };
    for (const t of trees) SP.pine(V, pr, t.cx, t.cz, t.h0, t.kind, floorAt);
    SP.finish(V, pr);
    FK.weldSplotch(V, [SP.C.bark, SP.C.bark2], 31, 8 + trees.length * 2);
    V.emit(K, 'Trees/Pines', 'Voxel');
    return { name: 'SnowCamp_Dressed', parts: K.parts, groups: K.groups, player: base.player, zones: base.zones, trees: trees.length, kinds: trees.map((t) => t.kind).join(), treeList: trees, occ, piles: pileList, cells };
  }

  const api = { build, C };
  if (typeof window !== 'undefined') window.SnowCampDressed = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
