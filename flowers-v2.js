
// Flowers v2 (1-stud): the blocky stem is broken up with round and sloped parts (user reference).
// Round heads (true cylinders / balls), a funnel calyx of hanging wedges under every head, wedge-tipped leaves, stacked thin discs for lavender.
(function () {
  const BK = (typeof window !== 'undefined' && window.BlockKit) || require('./block-kit.js');
  const SK = (typeof window !== 'undefined' && window.StudKit) || require('./stud-kit.js');
  const FK = (typeof window !== 'undefined' && window.ForestKit) || require('./forest-1stud.js');
  const P = { stem: '#5f7a3b', leaf: '#6a8541', leaf2: '#56703a', white: '#e8e2d0', yellow: '#d9b13b', red: '#b84a3a', purple: '#8f7fa8', purple2: '#7b6a96', blue: '#5b7cb0', blue2: '#4d6a99', pink: '#c75b86', pink2: '#d08aa0', dark: '#4c392b', brown: '#5a4232', teal: '#8fc9c4' };
  const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  const N4 = [[1, 0, '+x'], [-1, 0, '-x'], [0, 1, '+z'], [0, -1, '-z']];
  const MIN = { bud: 1, daisy: 2, tulip: 1.5, lupine: 1.5, sunflower: 7 }, SC = 0.5;

  const stem = (V, x, z, y0, y1) => { for (let y = y0; y <= y1; y++) V.set(x, y, z, P.stem); };
  // funnel calyx: 4 hanging wedges round the stem cell (flat face up, thin edge out, so the cup widens toward the head)
  const cup = (V, x, z, y, col = P.leaf2) => { for (const [dx, dz, d] of N4) V.wedge(x + dx, y, z + dz, d, col, true); };
  // wedge-tipped leaf lying out from the stem
  const leaf = (V, x, z, y, [dx, dz, d], col, len = 1) => { for (let i = 1; i <= len; i++) V.set(x + dx * i, y, z + dz * i, col); V.wedge(x + dx * (len + 1), y, z + dz * (len + 1), d, col); };
  const cyl = (K, cx, cy, cz, len, dia, axis, col, name = 'Head') => {
    const R = axis === 'y' ? BK.Rz(90) : axis === 'z' ? BK.Ry(90) : BK.Ry(0);
    K.add('Plants/Flowers', name, [len, dia, dia], { p: [cx, cy, cz], R }, col, { shape: 2 });
  };
  const ball = (K, cx, cy, cz, d, col) => K.add('Plants/Flowers', 'Bloom', [d, d, d], { p: [cx, cy, cz], R: BK.Ry(0) }, col, { shape: 0 });

  const KINDS = {
    // 3 tall: bead on a cup
    bud(V, K, r, x, z, h0) {
      stem(V, x, z, h0, h0); cup(V, x, z, h0); leaf(V, x, z, h0, pick(r, N4), P.leaf, 1);
      ball(K, x + 0.5, h0 + 2, z + 0.5, 2, pick(r, [P.teal, P.white, P.pink2]));
    },
    // 4: flat white disc, yellow eye
    daisy(V, K, r, x, z, h0) {
      stem(V, x, z, h0, h0 + 2); cup(V, x, z, h0 + 2); leaf(V, x, z, h0, pick(r, N4), pick(r, [P.leaf, P.leaf2]), 1);
      cyl(K, x + 0.5, h0 + 3.5, z + 0.5, 1, 3.5, 'y', P.white, 'Petals');
      cyl(K, x + 0.5, h0 + 4.25, z + 0.5, 0.5, 1.5, 'y', P.yellow, 'Eye');
    },
    // 5: upright cylinder with a round top
    tulip(V, K, r, x, z, h0) {
      const c = pick(r, [P.pink2, P.red, P.yellow]);
      stem(V, x, z, h0, h0 + 1); cup(V, x, z, h0 + 1); leaf(V, x, z, h0, N4[ri(r, 0, 3)], P.leaf, 1);
      cyl(K, x + 0.5, h0 + 2.75, z + 0.5, 1.5, 2, 'y', c, 'Cup');
      ball(K, x + 0.5, h0 + 4, z + 0.5, 2, c);
    },
    // 7: stack of thin discs on a stick, tapering
    lupine(V, K, r, x, z, h0) {
      const c1 = pick(r, [P.purple, P.blue]), c2 = c1 === P.purple ? P.purple2 : P.blue2;
      stem(V, x, z, h0, h0 + 5); leaf(V, x, z, h0, N4[ri(r, 0, 3)], P.leaf, 1); leaf(V, x, z, h0 + 1, N4[ri(r, 0, 3)], P.leaf2, 1);
      [2, 2, 1.5, 1.5, 1].forEach((d, i) => cyl(K, x + 0.5, h0 + 2.25 + i, z + 0.5, 0.5, d, 'y', i % 2 ? c2 : c1, 'Disc'));
    },
    // 7: tall v2 stem (wedge leaves), the original round face (5×5 disc: yellow ring, brown eye) turned to a random side
    sunflower(V, K, r, x, z, h0) {
      const f = pick(r, N4), s = [f[1], f[0]], top = h0 + ri(r, 6, 7) - 1;
      stem(V, x, z, h0, top);
      leaf(V, x, z, h0 + 1, N4[0], P.leaf, 2); leaf(V, x, z, h0 + 3, N4[1], P.leaf2, 2); leaf(V, x, z, h0 + 2, N4[r() < 0.5 ? 2 : 3], P.leaf, 1);
      V.set(x + f[0], top, z + f[1], P.leaf2);
      const hx = x + f[0] * 2, hz = z + f[1] * 2;
      for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) {
        if (Math.abs(a) === 2 && Math.abs(b) === 2) continue;
        V.set(hx + s[0] * a, top + b, hz + s[1] * a, Math.abs(a) <= 1 && Math.abs(b) <= 1 ? P.brown : P.yellow);
      }
    },
  };
  const ORDER = ['bud', 'daisy', 'tulip', 'lupine', 'sunflower'];

  // small kinds are built at 1-stud scale in a scratch kit, then shrunk by SC about their stem and placed at (x, z) (world studs, half-stud steps)
  function flower(V, K, r, x, z, h0, kind) {
    if (kind === 'sunflower') KINDS[kind](V, K, r, x, z, h0);
    else {
      const T = BK.kit(), W = SK.vox();
      KINDS[kind](W, T, r, 0, 0, 0); W.emit(T, 'Plants/Flowers', 'Voxel');
      for (const p of T.parts) K.add(p.group, p.name, p.size.map((v) => v * SC), { p: [p.cf.p[0] * SC + x, p.cf.p[1] * SC, p.cf.p[2] * SC + z], R: p.cf.R }, p.color, { cls: p.cls, shape: p.shape, variant: p.variant });
    }
    (V.fl || (V.fl = [])).push([x, z, MIN[kind]]);
  }
  function free(V, x, z, kind) {
    if (V.has(x, 0, z)) return false;
    if (kind === 'sunflower' && [-3, -2, -1, 0, 1, 2, 3].some((a) => [-3, -2, -1, 0, 1, 2, 3].some((b) => V.has(x + a, 0, z + b)))) return false;
    return !(V.fl || []).some(([a, b, n]) => Math.max(Math.abs(a - x), Math.abs(b - z)) < Math.max(MIN[kind], n));
  }
  function clump(V, K, r, cx, cz, kind, n, rad) {
    const q = kind === 'sunflower' ? 1 : 2;
    for (let i = 0, t = 0; i < n && t < n * 8; t++) {
      const x = cx + ri(r, -rad * q, rad * q) / q, z = cz + ri(r, -rad * q, rad * q) / q;
      if (!free(V, x, z, kind)) continue;
      flower(V, K, r, x, z, 0, kind); i++;
    }
  }

  function test() {
    const K = BK.kit(), V = SK.vox(), r = BK.rng(41);
    ORDER.forEach((k, i) => clump(V, K, r, -40 + i * 20, 0, k, k === 'sunflower' ? 3 : 8, k === 'sunflower' ? 6 : 4));
    const kinds = ['bud', 'daisy', 'tulip', 'lupine'];
    for (let bx = -30; bx < 30; bx += 10) for (let bz = -60; bz < -36; bz += 8) {
      clump(V, K, r, bx + 5, bz + 4, pick(r, kinds), ri(r, 6, 10), 4);
      if (r() < 0.5) clump(V, K, r, bx + 5, bz + 4, pick(r, kinds), ri(r, 3, 6), 4);
      if (r() < 0.12) clump(V, K, r, bx + 5, bz + 4, 'sunflower', 1, 3);
    }
    V.emit(K, 'Plants/Flowers', 'Voxel');
    const occ = new Set((V.fl || []).flatMap(([x, z]) => [-1, -0.5, 0, 0.5, 1, 1.5].flatMap((a) => [-1, -0.5, 0, 0.5, 1, 1.5].map((b) => Math.floor(x + a) + ',' + Math.floor(z + b)))));
    FK.groundTile(K, (x, z) => V.has(x, 0, z) || occ.has(x + ',' + z), 5, 64);
    return { name: 'FlowersV2', parts: K.parts, groups: K.groups, player: [-27, 12, 0] };
  }

  const api = { flower, clump, test, KINDS, ORDER, P };
  if (typeof window !== 'undefined') window.FlowersV2 = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
