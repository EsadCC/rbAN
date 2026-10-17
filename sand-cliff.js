// Sandy rock cliffside showcase, messy 1-stud style (skills/one-stud/style.md). build() → { name, parts, groups, player }.
// Structure on the grid: a heightmap of stamped rects (3 close sandstone tones per rect) makes stepped massifs with jutting
// columns; faces get flush Inlet/Weld panels, tops get Studs moss plates with moss drips down the faces; a pale sand stair
// climbs between two massifs to a landing; upright cylinder stubs and scree wedges at the feet. Ferns/bushes are props.
(function () {
  const BK = (typeof window !== 'undefined' && window.BlockKit) || require('./block-kit.js');
  const SK = (typeof window !== 'undefined' && window.StudKit) || require('./stud-kit.js');
  const CK = (typeof window !== 'undefined' && window.ClassicKit) || require('./classic-kit.js');
  const { rng, Rz, eul } = BK;
  const C = {
    rock: ['#a5835f', '#977657', '#b28f6a'],
    sand: '#dcc9a0', dune: ['#e3d3ab', '#d3bf93'],
    stair: ['#e6d9b6', '#dacba2'],
    moss: ['#7a9e45', '#6b9140'],
    pebble: ['#8f7558', '#a5835f'],
  };
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  const key = (x, z) => x + ',' + z;

  function build(seed = 7) {
    const K = BK.kit(), r = rng(seed), HM = new Map();
    const hAt = (x, z) => (HM.get(key(x, z)) || { h: 0 }).h;
    const stamp = (x0, x1, z0, z1, h, c) => { for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (h > hAt(x, z)) HM.set(key(x, z), { h, c }); };

    // massif: T tiers stepping back and up, each 2–3 offset rects, plus jutting columns standing on the tier below
    function massif(cx, cz, w, d, H, T) {
      const back = Math.round(cz - d / 2);
      let thPrev = 0;
      for (let i = 0; i < T; i++) {
        const tw = Math.round(w * (1 - i * 0.16)), front = Math.round(cz + d / 2 - i * (d / (T + 0.5)));
        const th = Math.round((H * (i + 1)) / T);
        const n = 3 + (r() < 0.5 ? 1 : 0);
        for (let k = 0; k < n; k++) {
          const sx = Math.max(2, Math.round(tw * (0.55 + r() * 0.45))), x0 = Math.round(cx - tw / 2 + r() * (tw - sx));
          stamp(x0, x0 + sx - 1, back, front - Math.floor(r() * 2), th - (k ? Math.floor(r() * 3) : 0), pick(r, C.rock));
        }
        const nc = 3 + Math.floor(r() * 4);
        for (let c = 0; c < nc; c++) {
          const cw = 1 + Math.floor(r() * 3), x0 = Math.round(cx - tw / 2 + r() * (tw - cw)), dz = 1 + Math.floor(r() * 2);
          const ch = r() < 0.2 ? th + 1 : thPrev + 1 + Math.floor(r() * Math.max(1, th - thPrev - 1));
          stamp(x0, x0 + cw - 1, front - 2, front + dz - 1, ch, pick(r, C.rock));
        }
        thPrev = th;
      }
    }
    massif(-15, -6, 14, 16, 14, 3);
    massif(0, -9, 15, 18, 22, 4);
    massif(16, -6, 14, 16, 17, 3);
    massif(-5, 5, 8, 6, 5, 2);
    massif(-20, 3, 5, 5, 3, 1);
    massif(17, 6, 6, 5, 4, 2);

    // sand stair: x 6..10, rising 1 per stud from z 8 back to a landing at 11
    const SX0 = 6, SX1 = 10, SZ0 = 8, STEPS = 11, stairCells = new Set();
    for (let x = SX0; x <= SX1; x++) {
      for (let i = 0; i < STEPS; i++) { HM.delete(key(x, SZ0 - i)); stairCells.add(key(x, SZ0 - i) + ',' + (i + 1)); }
      for (let z = SZ0 - STEPS; z >= SZ0 - STEPS - 4; z--) { HM.delete(key(x, z)); stairCells.add(key(x, z) + ',' + STEPS); }
    }
    const stairH = new Map([...stairCells].map((s) => { const [x, z, h] = s.split(',').map(Number); return [key(x, z), h]; }));
    const topAt = (x, z) => Math.max(hAt(x, z), stairH.get(key(x, z)) || 0);

    // flush Inlet / Weld panels on tall front faces
    const recol = new Map();
    const faceDiff = (x, z) => hAt(x, z) - topAt(x, z + 1);
    for (let t = 0, n = 0; t < 600 && n < 13; t++) {
      const cells = [...HM.keys()];
      const [x, z] = pick(r, cells).split(',').map(Number), w = 2 + Math.floor(r() * 2);
      let ok = true, lo = 0, hi = 1e9;
      for (let i = 0; i < w; i++) { if (faceDiff(x + i, z) < 5 || hAt(x + i, z) !== hAt(x, z)) ok = false; lo = Math.max(lo, topAt(x + i, z + 1) + 1); hi = Math.min(hi, hAt(x + i, z) - 2); }
      if (!ok || hi - lo < 1) continue;
      if ([...recol.keys()].some((k) => { const [a, , c] = k.split(',').map(Number); return Math.abs(a - x) < 5 && Math.abs(c - z) < 3; })) continue;
      const ph = Math.min(hi - lo + 1, 2 + Math.floor(r() * 3)), y0 = lo + Math.floor(r() * (hi - lo + 2 - ph)), va = r() < 0.65 ? 'I' : 'W';
      for (let i = 0; i < w; i++) for (let y = y0; y < y0 + ph; y++) recol.set(x + i + ',' + y + ',' + z, va);
      n++;
    }

    const V = SK.vox();
    for (const [k, { h, c }] of HM) { const [x, z] = k.split(',').map(Number); for (let y = 0; y < h; y++) V.set(x, y, z, recol.has(x + ',' + y + ',' + z) ? c + '/' + recol.get(x + ',' + y + ',' + z) : c); }
    // scree wedges at feet and on 1-high steps
    for (const [k, { h, c }] of HM) {
      const [x, z] = k.split(',').map(Number);
      for (const [d, dx, dz] of [['+z', 0, 1], ['-x', -1, 0], ['+x', 1, 0]]) {
        const nh = topAt(x + dx, z + dz);
        if (h - nh >= 2 && !V.has(x + dx, nh, z + dz) && !stairH.has(key(x + dx, z + dz)) && r() < 0.12) V.wedge(x + dx, nh, z + dz, d, c);
      }
    }
    V.emit(K, 'Cliff/Rock', 'Rock');
    const S = SK.vox();
    for (const [k, h] of stairH) { const [x, z] = k.split(',').map(Number); for (let y = 0; y < h; y++) S.set(x, y, z, C.stair[(z + 100) % 2]); }
    S.emit(K, 'Cliff/Stairs', 'Step');

    // moss: Studs plates on tops (rect stamps on one plateau), drips down the front faces
    const moss = new Map(), mossTop = [];
    const cells = [...HM.keys()];
    for (let k = 0; k < 48; k++) {
      const [x, z] = pick(r, cells).split(',').map(Number), h = hAt(x, z);
      if (h < 3) continue;
      const sx = 1 + Math.floor(r() * 4), sz = 1 + Math.floor(r() * 3), col = pick(r, C.moss);
      for (let i = 0; i < sx; i++) for (let j = 0; j < sz; j++) if (hAt(x + i, z + j) === h) moss.set(key(x + i, z + j), col + '/S');
    }
    const byH = new Map();
    for (const [k, col] of moss) { const [x, z] = k.split(',').map(Number), h = hAt(x, z); if (!byH.has(h)) byH.set(h, new Map()); byH.get(h).set(k, col); mossTop.push([x, z, h]); }
    for (const [h, m] of byH) SK.plates(K, 'Cliff/Moss', 'Moss', m, h, 0.5);
    for (const [x, z, h] of mossTop) {
      const d = h - topAt(x, z + 1);
      if (d < 2 || moss.has(key(x, z + 1)) || r() > 0.35) continue;
      const L = 1 + Math.floor(r() * Math.min(5, d - 1));
      K.box('Cliff/Moss', 'Drip', [1, L + 0.5, 0.5], [x + 0.5, h + 0.5 - (L + 0.5) / 2, z + 1.25], C.moss[1], { variant: 'Studs' });
    }

    // upright stubs (true cylinders, no texture) on sand by the cliff feet and on low terraces
    const used = new Set();
    for (let t = 0, n = 0; t < 600 && n < 11; t++) {
      const x = Math.floor((r() - 0.5) * 46), z = Math.floor(-14 + r() * 26), base = topAt(x, z);
      if (stairH.has(key(x, z)) || moss.has(key(x, z)) || used.has(key(x, z)) || base > 8) continue;
      const near = topAt(x, z - 1) - base >= 2 || topAt(x - 1, z) - base >= 2 || topAt(x + 1, z) - base >= 2;
      if (!near || topAt(x + 1, z) !== base && topAt(x - 1, z) !== base) continue;
      const big = r() < 0.35 && topAt(x + 1, z) === base && topAt(x, z + 1) === base && topAt(x + 1, z + 1) === base, dd = big ? 2 : 1, hh = 1 + Math.floor(r() * 3);
      const cx = big ? x + 1 : x + 0.5, cz = big ? z + 1 : z + 0.5;
      K.add('Cliff/Stubs', 'Stub', [hh, dd, dd], { p: [cx, base + hh / 2, cz], R: Rz(90) }, pick(r, C.rock), { shape: 2 });
      for (let i = -1; i <= 2; i++) for (let j = -1; j <= 2; j++) used.add(key(x + i, z + j));
      n++;
    }

    // sand ground: Studs base, a few low dune plates, loose pebbles
    const N = 28;
    K.box('Ground', 'Sand', [2 * N, 1, 2 * N], [0, -0.5, -4], C.sand, { variant: 'Studs' });
    const dune = new Map();
    for (let k = 0; k < 10; k++) {
      const x0 = Math.floor((r() - 0.5) * 2 * (N - 4)), z0 = Math.floor(-4 + (r() - 0.3) * 2 * (N - 6)), sx = 3 + Math.floor(r() * 6), sz = 2 + Math.floor(r() * 4), col = pick(r, C.dune) + '/S';
      for (let x = x0; x < x0 + sx; x++) for (let z = z0; z < z0 + sz; z++) if (topAt(x, z) === 0 && !used.has(key(x, z)) && Math.abs(x) < N && z >= -4 - N && z < -4 + N) dune.set(key(x, z), col);
    }
    SK.plates(K, 'Ground', 'Dune', dune, 0, 0.5);
    for (let k = 0, t = 0; k < 14 && t < 400; t++) {
      const x = Math.floor((r() - 0.5) * 2 * (N - 2)), z = Math.floor(-4 + (r() - 0.2) * 2 * (N - 4));
      if (topAt(x, z) || dune.has(key(x, z)) || used.has(key(x, z)) || z < -4 - N + 2 || z > -4 + N - 2) continue;
      const d = 0.6 + Math.round(r() * 2) * 0.2;
      K.add('Ground/Loose', 'Pebble', [0.3, d, d], { p: [x + 0.5, 0.15, z + 0.5], R: Rz(90) }, pick(r, C.pebble), { shape: 2 });
      used.add(key(x, z)); k++;
    }

    // plants on moss (props)
    const plant = (kind, x, y, z, ry, col, s) => {
      const M = CK.MESH[kind];
      K.add('Props/Plants', kind, M.approx.map((v) => v * s), { p: [x, y, z], R: eul(0, ry, 0) }, col, { cc: false, extras: [{ mesh: { type: M.type, id: M.id, scale: [M.scale * s, M.scale * s, M.scale * s] } }], meshKey: kind });
    };
    const spots = mossTop.slice().sort(() => r() - 0.5), took = [];
    for (const [x, z, h] of spots) {
      if (took.length >= 12 || took.some(([a, b]) => Math.abs(a - x) < 4 && Math.abs(b - z) < 4)) continue;
      took.push([x, z]);
      const fern = r() < 0.6, s = 0.7 + r() * 0.4;
      if (fern) plant('Fern', x + 0.5, h + 0.5 + 1.1 * s, z + 0.5, r() * 360, pick(r, CK.C.fern), s);
      else plant('Bush', x + 0.5, h + 0.5 + 0.9 * s, z + 0.5, r() * 360, pick(r, CK.C.bush), s * 0.7);
    }

    return { name: 'SandCliff', parts: K.parts, groups: K.groups, player: [8.5, SZ0 - STEPS - 1.5, 180, STEPS] };
  }

  const api = { build, C };
  if (typeof window !== 'undefined') window.SandCliff = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
