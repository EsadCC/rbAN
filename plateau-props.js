// Sandy Plateau, STAGE 4 PROPS: "a desert civilization left in a hurry; sea and jungle are taking it back". Quiet, sun-bleached, a little sad.
// Props lean on the build-kit MeshParts (src/fullkit-catalog.json): Vase, Ceramic_Potion, Bowl, Bag, Book, Goblet, Candle, Moai, Broom, Ring, Symbols, Rock, Mushroom.
// Primitives only where no mesh fits (brazier stand, slab, sand spill). Vines + moss are grid structure on the temple vox. One muted terracotta for the pots.
(function () {
  const BK = (typeof window !== 'undefined' && window.BlockKit) || require('./block-kit.js');
  const SK = (typeof window !== 'undefined' && window.StudKit) || require('./stud-kit.js');
  const FK = (typeof window !== 'undefined' && window.ForestKit) || require('./forest-1stud.js');
  const { Rz, Ry, Rx, eul, local, rng } = BK;
  const P = {
    S: '#d7c59a', T: '#b9a57a', dark: '#8a7650', clay: '#a65f45', grain: '#dcc9a0', moss: ['#7a9e45', '#6b9140'], wax: '#e4d8bc',
    vine: ['#4a7a3b', '#3d6a35'], rope: '#b3a385', ash: '#4f4a45', dune: ['#e3d3ab', '#d3bf93'], rock: ['#a5835f', '#977657', '#b9a57a'], apple: '#7a4f33',
  };
  // the user's tiki head (uploads/tikihead.rbxm): one MeshPart, MeshId 11114452856, InitialSize 16.09 × 35.5 × 16.59 placed at 4.76 × 10.5 × 4.91
  const TIKI = { name: 'TikiHead', meshId: 'rbxassetid://11114452856', size: [4.76, 10.5, 4.91], initialSize: [16.09, 35.5, 16.59], color: '#a3a2a5' };
  const find = (cat, name) => { if (name === 'TikiHead') return TIKI;
    for (const f of Object.values(cat.meshes)) { const it = f.find((o) => o.name === name); if (it) return it; } throw new Error('kit mesh ' + name); };
  // place a kit mesh: base frame B, local offset lp and rotation lR; scale uniform or per axis
  const mesh = (K, cat, g, name, B, lp, lR, scale, col, o = {}) => {
    const it = find(cat, name), cf = local(B, lp, lR || BK.I), s = Array.isArray(scale) ? scale : [scale, scale, scale];
    return K.mesh(g, name, it, cf.p, col, { size: it.size.map((v, i) => v * s[i]), R: cf.R, cc: o.cc });
  };
  const cyl = (K, g, n, len, d, cf, col) => K.add(g, n, [len, d, d], cf, col, { shape: 2 });
  const mossBlock = (K, g, B, lp, s, yaw) => K.add(g, 'MossPatch', s, local(B, lp, Ry(yaw)), P.moss[0], { variant: 'Studs' });

  // ---- grid structure on the temple vox: vines wrapping the broken columns, climbing walls (leaf greens, some Studs) ----
  function roots(V) {
    const [v0, v1] = P.vine;
    let n = 0;
    const put = (x, y, z, c) => V.set(x, y, z, (n++ % 4 === 0 ? c + '/S' : c));
    const wrap = (c, len, y0) => {
      const ring = [];
      for (let x = c - 3; x <= c + 2; x++) ring.push([x, 7]);
      for (let z = 8; z <= 12; z++) ring.push([c + 2, z]);
      for (let x = c + 1; x >= c - 3; x--) ring.push([x, 12]);
      for (let z = 11; z >= 8; z--) ring.push([c - 3, z]);
      for (let i = 0; i < len; i++) { const [x, z] = ring[i % ring.length]; put(x, y0 + Math.floor(i / 2.2), z, i % 7 < 2 ? v1 : v0); }
    };
    wrap(44, 26, 10); wrap(52, 12, 10);
    [[40, 10], [39, 10], [38, 10], [37, 11]].forEach(([x, z]) => put(x, 8, z, v0)); V.wedge(36, 8, 11, '-x', v0);
    [[47, 9], [48, 9]].forEach(([x, z]) => put(x, 8, z, v1)); V.wedge(48, 8, 10, '+z', v1);
    for (let y = 8; y <= 12; y++) put(47, y, 7, v0); for (let y = 13; y <= 16; y++) put(48, y, 7, v0); V.wedge(48, 17, 7, '+x', v0);
    for (let y = 8; y <= 12; y++) put(60, y, 7, v1); for (let y = 13; y <= 17; y++) put(61, y, 7, v1); V.wedge(61, 18, 7, '+x', v1);
    put(62, 8, 7, v0); put(62, 9, 7, v0); V.wedge(62, 10, 7, '+x', v0);
  }
  // Studs moss plates on exposed tops of the ruin (mostly the collapsed east half)
  function moss(K, V, o, r, n) {
    const shaft = (x, z) => [12, 20, 44, 52].some((c) => x >= c - 3 && x <= c + 2 && z >= 7 && z <= 12);
    const tops = [...V.cells.keys()].map((k) => k.split(',').map(Number)).filter(([x, y, z]) => {
      const col = V.color(x, y, z).split('/')[0];
      return (col === P.S || col === P.T) && !V.has(x, y + 1, z) && !shaft(x, z) && (y >= 8 || x >= 50);
    });
    const east = tops.filter(([x]) => x >= 34), set = new Set(tops.map((t) => t.join())), byY = new Map();
    for (let k = 0; k < n && tops.length; k++) {
      const pool = r() < 0.7 && east.length ? east : tops, [x, y, z] = pool[Math.floor(r() * pool.length)], sx = 1 + Math.floor(r() * 4), sz = 1 + Math.floor(r() * 3), col = P.moss[r() < 0.5 ? 0 : 1] + '/S';
      for (let i = 0; i < sx; i++) for (let j = 0; j < sz; j++) {
        if (!set.has([x + i, y, z + j].join())) continue;
        if (!byY.has(y)) byY.set(y, new Map());
        byY.get(y).set(o[0] + x + i + ',' + (o[2] + z + j), col);
      }
    }
    for (const [y, m] of byY) SK.plates(K, 'Terrain/Moss', 'Moss', m, o[1] + y + 1, 0.5);
  }

  // ---- placement ----
  function props(ctx) {
    const { K, hAt, prot, occ, cat } = ctx, r = rng(91), G = (s) => 'Props/' + s, gy = (x, z) => hAt(Math.floor(x), Math.floor(z)), pod = 20;
    const M = (g, name, x, y, z, ry, scale, col, o = {}) => mesh(K, cat, G(g), name, { p: [x, y, z], R: eul(o.rx || 0, ry, o.rz || 0) }, [0, 0, 0], BK.I, scale, col, o);
    const H = (name) => find(cat, name).size[1];
    // A. grain store at the west end of the podium: vases, a leaning flask, sacks, a bowl, and a broom left against the tower
    M('Pots', 'Vase', -30.6, pod + (H('Vase') * 2.3) / 2, -39.4, 30, 2.3, P.clay);
    M('Pots', 'Vase', -27.4, pod + (H('Vase') * 2.0) / 2, -39.2, -10, 2.0, P.clay);
    M('Pots', 'Ceramic_Potion', -26.0, pod + (H('Ceramic_Potion') * 2.7) / 2, -40.0, 15, 2.7, P.clay, { rx: -9 });
    mossBlock(K, G('Pots'), { p: [-30.6, pod + H('Vase') * 2.3, -39.4], R: BK.I }, [0.3, 0.12, 0.2], [1.1, 0.25, 1.0], 20);
    M('Sacks', 'Bag', -30.7, pod + (H('Bag') * 1.5) / 2, -36.4, 25, 1.5, P.grain, { rz: 10 });
    M('Sacks', 'Bag', -28.3, pod + (H('Bag') * 1.2) / 2, -36.6, -40, 1.2, P.grain, { rz: -8 });
    M('Bowls', 'Bowl', -26.0, pod + (H('Bowl') * 1.2) / 2, -37.0, 0, [1.7, 1.2, 1.7], P.clay, { rx: 180 }); // Bowl mesh imports upside-down in Roblox, so it is flipped
    // the broom: stood against the tower face, tipped back
    mesh(K, cat, G('Tools'), 'Broom', { p: [-23.9, pod, -40.4], R: eul(-9, 0, 0) }, [0, 2.95, 0], Rx(-90), 0.8, P.rope);
    // B. offerings at the temple steps: bowls (grain / apples), goblets, unlit candles, tablet stacks
    M('Bowls', 'Bowl', -4.3, pod + (H('Bowl') * 1.2) / 2, -38.8, 20, [1.7, 1.2, 1.7], P.clay, { rx: 180 }); // Bowl mesh imports upside-down in Roblox, so it is flipped
    M('Bowls', 'Bowl', -4.9, pod + (H('Bowl') * 1.2) / 2, -36.4, 70, [1.7, 1.2, 1.7], P.clay, { rx: 180 }); // Bowl mesh imports upside-down in Roblox, so it is flipped
    M('Bowls', 'Bowl', 3.0, pod + (H('Bowl') * 1.2) / 2, -37.3, 40, [1.7, 1.2, 1.7], P.clay, { rx: 180 }); // Bowl mesh imports upside-down in Roblox, so it is flipped
    M('Food', 'Apple', 2.7, pod + 1.25, -37.2, 30, 1.4, P.apple); M('Food', 'Apple', 3.5, pod + 1.2, -37.6, 80, 1.2, P.apple);
    M('Pots', 'Goblet', 1.6, pod + (H('Goblet') * 1.4) / 2, -36.1, 0, 1.4, P.clay); M('Pots', 'Goblet', -2.2, pod + (H('Goblet') * 1.4) / 2, -37.0, 0, 1.4, P.clay);
    for (const [x, z, s] of [[5.4, -40.2, 1], [5.6, -39.2, 0.8], [4.8, -39.8, 0.7]]) M('Candles', 'Candle', x, pod + (H('Candle') * s) / 2, z, r() * 90, s, P.wax);
    for (const [x, z, n, ry] of [[-7.4, -40.2, 3, 8], [-7.4, -37.2, 2, -14]]) for (let i = 0; i < n; i++) M('Tablets', 'Book', x + (r() - 0.5) * 0.3, pod + (H('Book') * 1.8) / 2 + H('Book') * 1.8 * i, z + (r() - 0.5) * 0.3, ry + (r() - 0.5) * 24, [1.9, 1.8, 1.9], P.S);
    // mushrooms where the roots meet the podium
    M('Plants', 'Mushroom', 7.4, pod + 0.55, -36.3, 20, 1.5, '#cbbd9d'); M('Plants', 'Mushroom', 6.8, pod + 0.55, -35.5, 60, 1.5, '#bfae8c');
    // C. the toppled idol head (Moai, scaled up) on the terrace by the stair route, half sunk in a sand drift
    const hx = -3, hz = -21, g0 = gy(hx, hz);
    [[13, 0.3, 6.4, 6, 0], [9.5, 0.3, 5, -8, 1], [6, 0.3, 3.4, 12, 2]].forEach(([w, h, d, yaw, i]) => K.add(G('Sand'), 'Drift', [w, h, d], local({ p: [hx + 0.4, g0, hz + 0.5], R: BK.I }, [0, h / 2 + 0.31 * i, 0], Ry(yaw)), P.dune[i % 2], { variant: 'Studs' }));
    M('Statue', 'TikiHead', hx, g0 + 1.3, hz, -90, 1.0, P.S, { rx: 74, rz: 6 });
    mossBlock(K, G('Statue'), { p: [hx - 5.6, g0 + 0.4, hz + 1.6], R: BK.I }, [0, 0, 0], [1.6, 0.25, 1.2], 25);
    // D. leaning slab with carved marks (Symbol meshes), a tipped vase with spilled sand
    let sx = 19, sz = -26;
    for (let x = 17; x <= 24; x++) for (let z = -32; z <= -18; z++) if (hAt(x, z) === 6 && hAt(x, z - 1) === 12 && hAt(x + 1, z) === 6 && hAt(x + 1, z - 1) === 12 && hAt(x - 1, z) === 6 && hAt(x - 1, z - 1) === 12) { sx = x; sz = z; break; }
    const SB = { p: [sx + 0.5, 6, sz + 1.5], R: eul(-13.5, 0, 0) };
    K.add(G('Stone'), 'Slab', [3.4, 6, 0.8], local(SB, [0, 3, 0]), P.S, { variant: 'Weld' });
    K.add(G('Stone'), 'Foot', [1.4, 0.7, 1.1], local(SB, [0.9, 0.36, 1.05]), P.T);
    const SYM = ['Symbol_Dash', 'Symbol_Plus', 'Symbol_Slash', 'Symbol_Arrow', 'Symbol_OpenParenthesis', 'Symbol_ClosedParenthesis'];
    for (let row = 0; row < 5; row++) for (let col = 0; col < 3; col++) {
      if ((row * 5 + col * 3) % 7 === 0) continue;
      const it = find(cat, SYM[(row * 2 + col * 3) % SYM.length]), cf = local(SB, [(col - 1) * 1.0, 1.1 + row * 0.95, 0.46], Rx(90));
      K.mesh(G('Stone'), it.name, it, cf.p, P.dark, { size: [0.85, 0.12, 0.85], R: cf.R, cc: false });
    }
    M('Pots', 'Vase', 16.2, 6 + 1.9, -15.5, 180, 2.5, P.clay, { rz: 80 });
    [[2.4, 0.2, 1.8, -1.2, 0, 4], [3.2, 0.26, 2.6, -3.4, 0.2, -9], [2.2, 0.32, 1.7, -5.4, -0.2, 13], [1.2, 0.22, 1, -6.9, 0.3, -6]].forEach(([w, h, d, x, z, yaw], i) =>
      K.add(G('Sand'), 'Spill', [w, h, d], local({ p: [18.6, 6, -15.5], R: Ry(180) }, [x, h / 2 + 0.03 * i, z], Ry(yaw)), P.dune[i % 2], { variant: 'Studs' }));
    // E. moss on the drums lying on the east plateau
    for (const [x, z] of [[16, -31], [26, -31]]) mossBlock(K, G('Stone'), { p: [x, 12 + 4.1, z], R: BK.I }, [0, 0, 0], [1.4, 0.25, 1.2], 25);
    // F. pebbles: flat cylinder discs, flush on the stud grid (diameter 1–3, 1 thick, no tilt), a few per spot
    const got = [], taken = new Set();
    for (let t = 0; t < 1500 && got.length < 18; t++) {
      const x = Math.floor(-46 + r() * 92), z = Math.floor(-30 + r() * 72), h = hAt(x, z);
      if (h < 0 || (prot && prot.has(x + ',' + z)) || (occ && occ.has(x + ',' + z)) || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => hAt(x + a, z + b) !== h) || got.some(([a, b]) => Math.hypot(a - x, b - z) < 7)) continue;
      let left = 1 + Math.floor(r() * 3);
      for (let i = 0; i < 9 && left > 0; i++) {
        const d = 1 + Math.floor(r() * 3), cx = x + Math.floor((r() - 0.5) * 5), cz = z + Math.floor((r() - 0.5) * 5), cells = [];
        for (let a = 0; a < d; a++) for (let b = 0; b < d; b++) cells.push(cx + a + ',' + (cz + b));
        if (cells.some((k) => taken.has(k) || (prot && prot.has(k)) || hAt(...k.split(',').map(Number)) !== h)) continue;
        cells.forEach((k) => taken.add(k));
        K.add(G('Pebbles'), 'Pebble', [1, d, d], { p: [cx + d / 2, h + 0.5, cz + d / 2], R: Rz(90) }, P.rock[Math.floor(r() * 3)], { shape: 2 });
        left--;
      }
      got.push([x, z]);
    }
  }

  const api = { props, roots, moss, find, P };
  if (typeof window !== 'undefined') window.PlateauProps = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
