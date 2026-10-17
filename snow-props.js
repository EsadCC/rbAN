// Snow Camp, STAGE 4 PROPS. Stage 3 scene + a small, quiet set (user finds dense props too much): tea on the benches (kit Teapot + Mug),
// a chopping stump by the woodpile, two fallen logs, a signpost at the spawn path, conifer sprouts at the rock piles and tree bases.
(function () {
  const BK = (typeof window !== 'undefined' && window.BlockKit) || require('./block-kit.js');
  const SK = (typeof window !== 'undefined' && window.StudKit) || require('./stud-kit.js');
  const FK = (typeof window !== 'undefined' && window.ForestKit) || require('./forest-1stud.js');
  const FC = (typeof window !== 'undefined' && window.ForestCorner) || require('./forest-corner.js');
  const SC = (typeof window !== 'undefined' && window.SnowCamp) || require('./snow-blockout.js');
  const SD = (typeof window !== 'undefined' && window.SnowCampDressed) || require('./snow-dressing.js');
  const { rng, eul } = BK;
  const C = { snow: '#f1f5f8', wood: FC.C.bark[0], wood2: FC.C.bark[1], pot: '#7d8a93', mug: '#a65f45', sprout: '#4a7a3b' };

  function build(o = {}) {
    const cat = o.cat, base = SD.build(), K = BK.kit(), r = rng(515);
    base.parts.forEach((p) => K.parts.push(p));
    Object.assign(K.groups, base.groups);
    const [fx, fz] = SC.FIRE, find = (n) => { for (const f of Object.values(cat.meshes)) { const it = f.find((q) => q.name === n); if (it) return it; } throw new Error('kit mesh ' + n); };
    const mesh = (g, n, x, y, z, ry, s, col, rest = {}) => { const it = find(n), size = it.size.map((v) => v * s); return K.mesh('Props/' + g, n, it, [x, y + size[1] / 2, z], col, { size, ry, ...rest }); };
    const occ = base.occ, key = (x, z) => x + ',' + z;
    const flat = (x, z) => { const c = base.cells.get(key(x, z)); return c && c.kind === 'snow' && c.h === 0; };
    const clear = (x, z, w, d) => { for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) if (!flat(x + i, z + j) || occ.has(key(x + i, z + j)) || Math.hypot(x + i - fx, z + j - fz) < 10.5) return false; return true; };
    const take = (x, z, w, d) => { for (let i = -1; i <= w; i++) for (let j = -1; j <= d; j++) occ.add(key(x + i, z + j)); };

    // tea on the benches (seat top y = 2): teapot + mug north, two mugs south
    mesh('Tea', 'Teapot', fx - 0.5, 2, fz - 9.5, 90, 1, C.pot);
    mesh('Tea', 'Mug', fx + 2.6, 2, fz - 9.5, 200, 1.3, C.mug);
    mesh('Tea', 'Mug', fx - 1.2, 2, fz + 8.5, 20, 1.3, C.mug);
    mesh('Tea', 'Mug', fx + 1.3, 2, fz + 8.3, 140, 1.3, C.mug);

    // chopping stump by the woodpile, snow on top
    const St = SK.vox();
    FC.stump(St, rng(1), -11, -1);
    FK.weldSplotch(St, FC.C.bark, 5, 2);
    St.emit(K, 'Props/Stump', 'Block');
    K.box('Props/Stump', 'Snow', [2, 0.5, 2], [-11, 3.25, -1], C.snow);

    // kit Barrel meshes (the kit has one, use it): two by the woodpile, one beside the tent door, snow on the lids
    for (const [x, z, ry] of [[-16.8, 1.6, 20], [-14.4, 2.2, 110], [-9.6, -15.2, 60]]) {
      const it = find('Barrel');
      mesh('Barrels', 'Barrel', x, 0, z, ry, 1, '#5a4c42');
      K.add('Props/Barrels', 'LidSnow', [0.5, 1.8, 1.8], { p: [x, it.size[1] + 0.25, z], R: eul(0, 0, 90) }, C.snow, { shape: 2 });
    }

    // kit Snowman mesh imports UPSIDE DOWN (like Bowl): rx 180, size as listed (1.7 tall, arms span 2.6 on Z), scaled 2.5
    { const it = find('Snowman'), s = 2.5, size = it.size.map((v) => v * s);
      K.mesh('Props/Snowman', 'Snowman', it, [4, size[1] / 2, 19], '#f1f5f8', { size, rx: 180, ry: 0 }); }
    mesh('Barrels', 'Bucket', -12.2, 0, 3.6, 40, 1.3, '#7d8a93');

    // signpost at the spawn path: post, two boards facing the spawn, snow cap
    const [sx, sz] = [-6.5, 20.5], W = (c) => ({ variant: 'Weld' });
    K.box('Props/Sign', 'Post', [1, 6, 1], [sx, 3, sz], C.wood, W());
    K.box('Props/Sign', 'Board', [4, 1.5, 0.5], [sx + 1, 4.75, sz + 0.75], C.wood2, W());
    K.box('Props/Sign', 'Board', [3.5, 1.5, 0.5], [sx - 0.75, 3, sz + 0.75], C.wood2, W());
    K.box('Props/Sign', 'Snow', [1, 0.5, 1], [sx, 6.25, sz], C.snow);

    // two fallen logs, snow on top (true cylinders, whole props turned 0/90)
    let logs = 0;
    for (let t = 0; t < 800 && logs < 2; t++) {
      const x = Math.round(-26 + r() * 52), z = Math.round(-22 + r() * 48), alongX = logs === 0;
      const w = alongX ? 6 : 2, d = alongX ? 2 : 6;
      if (!clear(x, z, w, d)) continue;
      take(x, z, w, d); logs++;
      K.add('Props/Logs', 'Log', [6, 2, 2], { p: [x + w / 2, 1, z + d / 2], R: eul(0, alongX ? 0 : 90, 0) }, C.wood, { shape: 2, variant: 'Weld' });
      K.box('Props/Logs', 'Snow', alongX ? [4, 0.5, 1] : [1, 0.5, 4], [x + w / 2, 2.25, z + d / 2], C.snow);
    }

    // sprouts: at rock piles and the foot of the pines
    const spots = [];
    base.piles.forEach((p, i) => spots.push([p.x + (i % 2 ? -1.2 : 4.2), p.z + 0.5]));
    base.treeList.slice(0, 4).forEach((t) => spots.push([t.cx + 3.5, t.cz + 3.5]));
    for (const [x, z] of spots) if (flat(Math.floor(x), Math.floor(z))) mesh('Plants', 'Sprout', x, 0.1, z, Math.floor(r() * 4) * 90, 1.2 + r() * 0.5, C.sprout, { cc: false });
    return { name: 'SnowCamp_Props', parts: K.parts, groups: K.groups, player: base.player, zones: base.zones };
  }

  const api = { build };
  if (typeof window !== 'undefined') window.SnowCampProps = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
