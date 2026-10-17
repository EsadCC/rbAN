// 1-stud building helper. Everything sits on a 1-stud grid, axis-aligned (90° turns only).
// vox() collects unit cells; solid cells of one colour are greedy-merged into boxes, wedges stay single cells.
// Wedge dir = the side its thin edge points to ('+x','-x','+z','-z'); inv = hanging (flat face up).
// Plates (0.2 tall, LEGO plate) are only for ground cover. Cells never overlap, so faces can't z-fight.
(function () {
  const BK = (typeof window !== 'undefined' && window.BlockKit) || require('./block-kit.js');
  const ROT = { '-z': 0, '+z': 180, '+x': -90, '-x': 90 };
  const STEP = { '+x': [1, 0], '-x': [-1, 0], '+z': [0, 1], '-z': [0, -1] };
  // colour strings may carry a MaterialVariant suffix: '#rrggbb/S' = Studs, '/W' = Weld, '/I' = Inlet
  const VAR = { S: 'Studs', W: 'Weld', I: 'Inlet' };
  const FLIP = { '+x': '-x', '-x': '+x', '+z': '-z', '-z': '+z' };

  function vox() {
    const cells = new Map(), wedges = new Map();
    const key = (x, y, z) => x + ',' + y + ',' + z;
    const api = {
      set(x, y, z, color) { wedges.delete(key(x, y, z)); cells.set(key(x, y, z), color); },
      fill(x0, x1, y0, y1, z0, z1, color) { for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) api.set(x, y, z, color); },
      wedge(x, y, z, dir, color, inv = false) { if (!cells.has(key(x, y, z))) wedges.set(key(x, y, z), { x, y, z, dir, color, inv }); },
      del(x, y, z) { cells.delete(key(x, y, z)); wedges.delete(key(x, y, z)); },
      has: (x, y, z) => cells.has(key(x, y, z)) || wedges.has(key(x, y, z)),
      solid: (x, y, z) => cells.has(key(x, y, z)),
      color: (x, y, z) => cells.get(key(x, y, z)),
      cells, wedges,
      emit(K, g, name, origin = [0, 0, 0]) {
        const seen = new Set(), list = [...cells.keys()].map((k) => k.split(',').map(Number));
        list.sort((a, b) => a[1] - b[1] || a[2] - b[2] || a[0] - b[0]);
        const same = (x, y, z, c) => cells.get(key(x, y, z)) === c && !seen.has(key(x, y, z));
        for (const [x, y, z] of list) {
          if (seen.has(key(x, y, z))) continue;
          const c = cells.get(key(x, y, z));
          let dx = 1, dz = 1, dy = 1;
          while (same(x + dx, y, z, c)) dx++;
          const row = (zz, yy) => { for (let i = 0; i < dx; i++) if (!same(x + i, yy, zz, c)) return false; return true; };
          while (row(z + dz, y)) dz++;
          const slab = (yy) => { for (let j = 0; j < dz; j++) if (!row(z + j, yy)) return false; return true; };
          while (slab(y + dy)) dy++;
          for (let k = 0; k < dy; k++) for (let j = 0; j < dz; j++) for (let i = 0; i < dx; i++) seen.add(key(x + i, y + k, z + j));
          const [col, va] = c.split('/');
          K.box(g, name, [dx, dy, dz], [origin[0] + x + dx / 2, origin[1] + y + dy / 2, origin[2] + z + dz / 2], col, { variant: VAR[va] });
        }
        for (const w of wedges.values()) {
          const R = w.inv ? BK.mul(BK.Ry(ROT[w.dir]), BK.Rz(180)) : BK.Ry(ROT[w.dir]);
          const [col, va] = w.color.split('/');
          K.add(g, name + 'Wedge', [1, 1, 1], { p: [origin[0] + w.x + 0.5, origin[1] + w.y + 0.5, origin[2] + w.z + 0.5], R }, col, { cls: 'WedgePart', variant: VAR[va] });
        }
      },
    };
    return api;
  }

  // flat 2D cells → merged plates
  function plates(K, g, name, cellMap, y, h = 0.2) {
    const seen = new Set(), key = (x, z) => x + ',' + z;
    const list = [...cellMap.keys()].map((k) => k.split(',').map(Number)).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    const same = (x, z, c) => cellMap.get(key(x, z)) === c && !seen.has(key(x, z));
    for (const [x, z] of list) {
      if (seen.has(key(x, z))) continue;
      const c = cellMap.get(key(x, z));
      let dx = 1, dz = 1;
      while (same(x + dx, z, c)) dx++;
      const row = (zz) => { for (let i = 0; i < dx; i++) if (!same(x + i, zz, c)) return false; return true; };
      while (row(z + dz)) dz++;
      for (let j = 0; j < dz; j++) for (let i = 0; i < dx; i++) seen.add(key(x + i, z + j));
      const [col, va] = c.split('/');
      K.box(g, name, [dx, h, dz], [x + dx / 2, y + h / 2, z + dz / 2], col, { variant: VAR[va] });
    }
  }

  const api = { vox, plates, STEP, FLIP, VAR };
  if (typeof window !== 'undefined') window.StudKit = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
