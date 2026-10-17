// Shared block-building kit for lobby pieces. kit() → { parts, groups, box, wedge, beam, ... }; toRbxmx(model); zfight(parts).
// Rule: no two same-facing faces may be coplanar and overlapping (zfight() reports them). Ground top is y = 0; parts that meet the ground sink below it.
(function () {
  const d2r = Math.PI / 180, I = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const mul = (a, b) => { const r = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) r.push(a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j]); return r; };
  const Rx = (a) => { const c = Math.cos(a * d2r), s = Math.sin(a * d2r); return [1, 0, 0, 0, c, -s, 0, s, c]; };
  const Ry = (a) => { const c = Math.cos(a * d2r), s = Math.sin(a * d2r); return [c, 0, s, 0, 1, 0, -s, 0, c]; };
  const Rz = (a) => { const c = Math.cos(a * d2r), s = Math.sin(a * d2r); return [c, -s, 0, s, c, 0, 0, 0, 1]; };
  const eul = (rx = 0, ry = 0, rz = 0) => mul(Ry(ry), mul(Rx(rx), Rz(rz)));
  const mv = (R, v) => [R[0] * v[0] + R[1] * v[1] + R[2] * v[2], R[3] * v[0] + R[4] * v[1] + R[5] * v[2], R[6] * v[0] + R[7] * v[1] + R[8] * v[2]];
  const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], scl = (a, s) => a.map((v) => v * s);
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a) => scl(a, 1 / Math.hypot(...a));
  const local = (base, lp, lR = I) => ({ p: add3(base.p, mv(base.R, lp)), R: mul(base.R, lR) });
  const MAT = { plastic: 256, smooth: 272, neon: 288 };
  function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  const NUT_DECAL = 'rbxassetid://2674352232';
  function kit() {
    const parts = [], groups = {};
    const G = (path, meta) => (groups[path] = Object.assign(groups[path] || {}, meta));
    const add = (group, name, size, cf, color, o = {}) => {
      G(group, {});
      const p = { group, name, size: size.slice(), cf, color, cls: o.cls || 'Part', shape: o.shape ?? 1, mat: o.mat ?? MAT.plastic, tr: o.tr ?? 0, cc: o.cc ?? true, shadow: o.shadow ?? true, light: o.light, extras: o.extras, variant: o.variant, meshKey: o.meshKey, style: o.style, meshId: o.meshId, initialSize: o.initialSize, kitName: o.kitName };
      parts.push(p); return p;
    };
    const cf = (p, o = {}) => ({ p, R: o.R || eul(o.rx, o.ry, o.rz) });
    const box = (g, n, size, p, color, o = {}) => add(g, n, size, cf(p, o), color, o);
    const wedge = (g, n, size, p, color, o = {}) => add(g, n, size, cf(p, o), color, { ...o, cls: 'WedgePart' });
    // TrussPart: 2-stud square section, length snaps to 2-stud steps (Roblox forces this). o.style 0 = Frame, 1 = Alternating, 2 = Bridge, 3 = NoSupports.
    const truss = (g, n, len, p, color, o = {}) => add(g, n, [2, Math.max(2, Math.round(len / 2) * 2), 2], cf(p, o), color, { ...o, cls: 'TrussPart' });
    // Nut/bolt head (Official NDC Build Kit, Parts): a 1×2×2 cylinder (axis = local X) with the Old Cylinder Icon decal on both end faces.
    // d = diameter (default 2), t = thickness along the axis (default 1). Face it with rx/ry/rz; untextured (no MaterialVariant).
    const nut = (g, n, p, color = '#635f62', o = {}) => add(g, n, [o.t ?? 1, o.d ?? 2, o.d ?? 2], cf(p, o), color, { ...o, shape: 2, extras: [{ decal: NUT_DECAL, face: 0, name: 'ROBLOX Old Cylinder Icon' }, { decal: NUT_DECAL, face: 3, name: 'ROBLOX Old Cylinder Icon' }] });
    // MeshPart from the build kit catalog (src/fullkit-catalog.json). item = catalog entry { name, meshId, size, initialSize, color }.
    // o.size = wanted size (default the kit size), or o.scale = uniform factor on the kit size. Box collision (no physics data needed).
    const mesh = (g, n, item, p, color, o = {}) => {
      const size = o.size || item.size.map((v) => v * (o.scale ?? 1));
      return add(g, n, size, o.R ? { p, R: o.R } : cf(p, o), color || item.color, { mat: item.mat ?? MAT.smooth, ...o, cls: 'MeshPart', meshId: item.meshId, initialSize: item.initialSize || item.size, kitName: item.name });
    };
    const lbox = (g, n, size, base, lp, color, o = {}) => add(g, n, size, local(base, lp, o.lR || I), color, o);
    // box whose long (Z) axis runs from a to b; roll turns it about that axis
    const beam = (g, n, a, b, w, h, color, o = {}) => {
      const d = sub3(b, a), L = Math.hypot(...d), z = scl(d, 1 / L), up = Math.abs(z[1]) > 0.99 ? [1, 0, 0] : [0, 1, 0];
      let x = norm(cross(up, z)), y = cross(z, x);
      if (o.roll) { const c = Math.cos(o.roll * d2r), s = Math.sin(o.roll * d2r); [x, y] = [add3(scl(x, c), scl(y, s)), add3(scl(x, -s), scl(y, c))]; }
      return add(g, n, [w, h, L + (o.ext || 0)], { p: scl(add3(a, b), 0.5), R: [x[0], y[0], z[0], x[1], y[1], z[1], x[2], y[2], z[2]] }, color, o);
    };
    return { parts, groups, G, add, box, wedge, truss, nut, mesh, lbox, beam };
  }

  // Same-facing coplanar overlapping faces between boxes that share all three axes (any permutation).
  function zfight(parts, tol = 0.02) {
    const ax = (p) => [0, 1, 2].map((j) => [p.cf.R[j], p.cf.R[3 + j], p.cf.R[6 + j]]);
    const boxes = parts.filter((p) => p.cls === 'Part' && p.shape === 1 && p.tr < 1).map((p) => ({ p, A: ax(p), h: p.size.map((v) => v / 2), c: p.cf.p }));
    const out = [];
    for (let i = 0; i < boxes.length; i++) for (let k = i + 1; k < boxes.length; k++) {
      const a = boxes[i], b = boxes[k];
      const d = sub3(b.c, a.c);
      if (Math.hypot(...d) > Math.hypot(...a.h) + Math.hypot(...b.h)) continue;
      const map = a.A.map((u) => { for (let j = 0; j < 3; j++) { const t = dot(u, b.A[j]); if (Math.abs(t) > 0.9999) return [j, Math.sign(t)]; } return null; });
      if (map.some((m) => !m)) continue;
      const hb = map.map(([j]) => b.h[j]), cb = a.A.map((u) => dot(u, d));
      for (let f = 0; f < 3; f++) for (const s of [1, -1]) {
        if (Math.abs(cb[f] + s * hb[f] - s * a.h[f]) > tol) continue;
        let area = 1;
        for (let g = 0; g < 3; g++) if (g !== f) area *= Math.max(0, Math.min(a.h[g], cb[g] + hb[g]) - Math.max(-a.h[g], cb[g] - hb[g]));
        if (area > 0.01) out.push(`${a.p.group}/${a.p.name} × ${b.p.group}/${b.p.name}`);
      }
    }
    return out;
  }


  // Volume overlap (OBB vs OBB, separating axes). Returns pairs of Part boxes (first in `pre` group prefixes) that share volume deeper than tol. Skips groups starting with any `skip` prefix.
  function clip(parts, pre, skip = [], tol = 0.02) {
    const O = (p) => ({ c: p.cf.p, h: p.size.map((v) => v / 2), A: [0, 1, 2].map((j) => [p.cf.R[j], p.cf.R[3 + j], p.cf.R[6 + j]]) });
    const pen = (P, Q) => {
      const a = O(P), b = O(Q), d = sub3(b.c, a.c), axes = [...a.A, ...b.A];
      for (const u of a.A) for (const v of b.A) { const w = cross(u, v), L = Math.hypot(...w); if (L > 1e-6) axes.push(w.map((x) => x / L)); }
      let m = 1e9;
      for (const ax of axes) { const ra = a.h.reduce((s, h, i) => s + h * Math.abs(dot(ax, a.A[i])), 0), rb = b.h.reduce((s, h, i) => s + h * Math.abs(dot(ax, b.A[i])), 0); m = Math.min(m, ra + rb - Math.abs(dot(ax, d))); if (m <= tol) return m; }
      return m;
    };
    const boxes = parts.filter((p) => p.cls === 'Part' && p.shape === 1 && p.tr < 1 && !skip.some((g) => p.group.startsWith(g))), isMine = (p) => pre.some((g) => p.group.startsWith(g)), out = [];
    boxes.forEach((p, i) => { if (!isMine(p)) return; boxes.forEach((q, j) => { if (i === j || (isMine(q) && j < i)) return; if (Math.hypot(...sub3(p.cf.p, q.cf.p)) > Math.hypot(...p.size) / 2 + Math.hypot(...q.size) / 2) return; const m = pen(p, q); if (m > tol) out.push(p.group + '/' + p.name + ' × ' + q.group + '/' + q.name + ' ' + m.toFixed(2)); }); });
    return out;
  }

  // Grid compliance for STRUCTURE parts: rotation must be a 90° multiple (R entries in {-1,0,1}),
  // world AABB x/z edges on half studs (user: half studs allowed for anything), y edges on 0.1 steps (plates 0.2/0.4, half-bricks 0.5). Round parts (shape≠1) only need
  // their centre on a quarter-stud point. opts.only = group-name prefixes to check (default all),
  // opts.skip = prefixes to ignore (props). Returns a list of failure strings; [] = compliant.
  function gridCheck(parts, opts = {}) {
    const { only = null, skip = [], xz = 0.5, y = 0.1, tol = 0.01 } = opts;
    const on = (v, s) => Math.abs(v / s - Math.round(v / s)) * s < tol;
    const out = [];
    for (const p of parts) {
      if (p.cls !== 'Part' && p.cls !== 'WedgePart' && p.cls !== 'CornerWedgePart' && p.cls !== 'TrussPart') continue;
      const g = p.group || '';
      if (only && !only.some((o) => g.startsWith(o))) continue;
      if (skip.some((o) => g.startsWith(o))) continue;
      const R = p.cf.R, id = `${g}/${p.name}`;
      if (R.some((v) => !(on(v, 1) && Math.abs(v) <= 1 + tol))) { out.push(id + ': rotation not 90°'); continue; }
      const c = p.cf.p;
      if (p.cls === 'Part' && p.shape !== 1) {
        if (![0, 2].every((j) => on(c[j], xz / 2))) out.push(id + ': round part off grid');
        continue;
      }
      const ext = [0, 1, 2].map((i) => (Math.abs(R[i * 3]) * p.size[0] + Math.abs(R[i * 3 + 1]) * p.size[1] + Math.abs(R[i * 3 + 2]) * p.size[2]) / 2);
      const bad = [];
      for (const [j, s] of [[0, xz], [1, y], [2, xz]]) if (!on(c[j] - ext[j], s) || !on(c[j] + ext[j], s)) bad.push('xyz'[j]);
      if (bad.length) out.push(`${id}: off grid in ${bad.join('')} (centre ${c.map((v) => +v.toFixed(3)).join(',')}, size ${p.size.map((v) => +v.toFixed(3)).join(',')})`);
    }
    return out;
  }

  // Scale stand-in: a standard 5-stud R6 player (house colours), front = -Z before ry. Preview only, never exported.
  function player(at = [0, 0, 0], ry = 0) {
    const K = kit(), B = { p: at, R: Ry(ry) }, g = 'Scale/Player';
    K.lbox(g, 'Left Leg', [1, 2, 1], B, [-0.5, 1, 0], '#1b2a35');
    K.lbox(g, 'Right Leg', [1, 2, 1], B, [0.5, 1, 0], '#1b2a35');
    K.lbox(g, 'Torso', [2, 2, 1], B, [0, 3, 0], '#287f47');
    K.lbox(g, 'Left Arm', [1, 2, 1], B, [-1.5, 3, 0], '#1b2a35');
    K.lbox(g, 'Right Arm', [1, 2, 1], B, [1.5, 3, 0], '#1b2a35');
    K.lbox(g, 'Head', [1.2, 1.2, 1.2], B, [0, 4.6, 0], '#f5cd30');
    return K.parts;
  }

  // Scale check against the 5-stud R6 player. Reads group names, returns warnings ([] = OK).
  // seats: tops of groups matching /Bench|Seat|Stool/ must be 1.5–2.5. hazards (/Fire|Ash/) need >= 4 to any seat part.
  // props: Props/<Kind> heights against PROP_H. opts.doors = [{ name, w, h }] checked against 3 × 6 min.
  // opts.walk = [[groupA, groupB], ...] pairs that need >= 3 clear between footprints.
  const PROP_H = { Barrel: [2.9, 4.1], Sack: [1.5, 2.8], Plants: [1, 4], Pot: [0.8, 2] }; // crates skipped: they come in sizes and stacks
  function scaleCheck(parts, opts = {}) {
    const out = [], box = {};
    for (const p of parts) {
      const R = p.cf.R, c = p.cf.p, e = [0, 1, 2].map((i) => (Math.abs(R[i * 3]) * p.size[0] + Math.abs(R[i * 3 + 1]) * p.size[1] + Math.abs(R[i * 3 + 2]) * p.size[2]) / 2);
      const k = p.group.split('/').slice(0, 2).join('/'), b = (box[k] = box[k] || { lo: [1e9, 1e9, 1e9], hi: [-1e9, -1e9, -1e9] });
      for (let i = 0; i < 3; i++) { b.lo[i] = Math.min(b.lo[i], c[i] - e[i]); b.hi[i] = Math.max(b.hi[i], c[i] + e[i]); }
    }
    const gap = (a, b) => Math.max(0, Math.max(a.lo[0] - b.hi[0], b.lo[0] - a.hi[0]), Math.max(a.lo[2] - b.hi[2], b.lo[2] - a.hi[2]));
    const keys = Object.keys(box), seats = keys.filter((k) => /Bench|Seat|Stool/.test(k)), hazards = keys.filter((k) => /Fire|Ash/.test(k));
    for (const s of seats) { const t = box[s].hi[1]; if (t < 1.5 || t > 2.5) out.push(`${s}: seat top ${t.toFixed(2)} (want 1.5–2.5)`); }
    // hazard ↔ seat measured part to part (an L of benches has a bbox that swallows the fire)
    const pb = (k) => parts.filter((q) => q.group.startsWith(k)).map((p) => { const R = p.cf.R, c = p.cf.p, e = [0, 1, 2].map((i) => (Math.abs(R[i * 3]) * p.size[0] + Math.abs(R[i * 3 + 1]) * p.size[1] + Math.abs(R[i * 3 + 2]) * p.size[2]) / 2); return { lo: c.map((v, i) => v - e[i]), hi: c.map((v, i) => v + e[i]) }; });
    for (const h of hazards) for (const s of seats) { let d = 1e9; const S = pb(s); for (const a of pb(h)) for (const q of S) d = Math.min(d, gap(a, q)); if (d < 4) out.push(`${h} ↔ ${s}: ${d.toFixed(1)} clear (want ≥ 4)`); }
    for (const k of keys) {
      const kind = k.split('/')[1], r = k.startsWith('Props/') && PROP_H[kind];
      if (!r) continue;
      // per-part groups share a key, so measure each prop instance by clustering on the stand point
      const inst = [];
      for (const p of parts.filter((q) => q.group.startsWith(k))) {
        const c = p.cf.p, near = inst.find((i) => Math.hypot(i.x - c[0], i.z - c[2]) < 1.6);
        const R = p.cf.R, ey = (Math.abs(R[3]) * p.size[0] + Math.abs(R[4]) * p.size[1] + Math.abs(R[5]) * p.size[2]) / 2;
        if (near) { near.lo = Math.min(near.lo, c[1] - ey); near.hi = Math.max(near.hi, c[1] + ey); } else inst.push({ x: c[0], z: c[2], lo: c[1] - ey, hi: c[1] + ey });
      }
      for (const i of inst) { const h = i.hi - i.lo; if (h < r[0] || h > r[1]) out.push(`${k} at (${i.x.toFixed(1)}, ${i.z.toFixed(1)}): ${h.toFixed(2)} tall (want ${r[0]}–${r[1]})`); }
    }
    for (const d of opts.doors || []) if (d.w < 3 || d.h < 6) out.push(`door ${d.name}: ${d.w} × ${d.h} (want ≥ 3 × 6)`);
    for (const [a, b] of opts.walk || []) if (box[a] && box[b]) { const d = gap(box[a], box[b]); if (d < 3) out.push(`${a} ↔ ${b}: ${d.toFixed(1)} clear (want ≥ 3)`); }
    return out;
  }

  const SPIN = (deg) => `-- Client-side spin about the PrimaryPart's X axis.\nlocal RunService = game:GetService("RunService")\nlocal model = script.Parent\nlocal SPEED = ${deg} -- degrees per second\n\nRunService.RenderStepped:Connect(function(dt)\n\tmodel:PivotTo(model:GetPivot() * CFrame.Angles(math.rad(SPEED * dt), 0, 0))\nend)\n`;
  function toRbxmx(model) {
    let n = 0;
    const ref = () => 'RBX' + (n++).toString(16).toUpperCase().padStart(32, '0');
    const f = (v) => { const r = +(+v).toFixed(4); return Object.is(r, -0) ? 0 : r; };
    const cfx = (name, c) => `<CoordinateFrame name="${name}">` + ['X', 'Y', 'Z'].map((k, i) => `<${k}>${f(c.p[i])}</${k}>`).join('') +
      ['R00', 'R01', 'R02', 'R10', 'R11', 'R12', 'R20', 'R21', 'R22'].map((k, i) => `<${k}>${f(c.R[i])}</${k}>`).join('') + '</CoordinateFrame>';
    const v3 = (name, v) => `<Vector3 name="${name}"><X>${f(v[0])}</X><Y>${f(v[1])}</Y><Z>${f(v[2])}</Z></Vector3>`;
    const col = (h) => 4278190080 + parseInt(h.slice(1), 16);
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const extraXml = (e) => {
      if (e.att) return `<Item class="Attachment" referent="${ref()}"><Properties>${cfx('CFrame', { p: e.p, R: e.R || I })}<bool name="Visible">false</bool><string name="Name">${e.att}</string></Properties></Item>`;
      if (e.mesh) { const m = e.mesh; return `<Item class="SpecialMesh" referent="${ref()}"><Properties><token name="MeshType">${m.type}</token>${m.id ? `<Content name="MeshId"><url>${m.id}</url></Content>` : '<Content name="MeshId"><null></null></Content>'}<Content name="TextureId"><null></null></Content>${v3('Offset', [0, 0, 0])}${v3('Scale', m.scale)}${v3('VertexColor', [1, 1, 1])}<string name="Name">Mesh</string></Properties></Item>`; }
      if (e.decal) return `<Item class="Decal" referent="${ref()}"><Properties><Content name="Texture"><url>${e.decal}</url></Content><token name="Face">${e.face ?? 5}</token><float name="Transparency">0</float><string name="Name">${e.name || 'Decal'}</string></Properties></Item>`;
      if (e.gui && model.gui && model.gui[e.gui]) return model.gui[e.gui].replace(/referent="[^"]*"/g, () => `referent="${ref()}"`);
      return '';
    };
    const partXml = (p, ind) => {
      p.ref = ref();
      const light = p.light ? `<Item class="PointLight" referent="${ref()}"><Properties><float name="Brightness">${p.light.brightness}</float><Color3 name="Color"><R>${p.light.color[0]}</R><G>${p.light.color[1]}</G><B>${p.light.color[2]}</B></Color3><float name="Range">${p.light.range}</float><bool name="Shadows">false</bool><string name="Name">PointLight</string></Properties></Item>` : '';
      const props = `<bool name="Anchored">true</bool><token name="BottomSurface">0</token><token name="TopSurface">0</token>${cfx('CFrame', p.cf)}<bool name="CanCollide">${p.cc}</bool><bool name="CanQuery">${p.cc}</bool><bool name="CastShadow">${p.shadow}</bool><Color3uint8 name="Color3uint8">${col(p.color)}</Color3uint8><token name="Material">${p.mat}</token>${p.variant ? `<string name="MaterialVariantSerialized">${p.variant}</string>` : ''}<float name="Transparency">${p.tr}</float>${v3('size', p.size)}${p.cls === 'Part' ? `<token name="shape">${p.shape}</token>` : ''}${p.cls === 'TrussPart' ? `<token name="style">${p.style || 0}</token>` : ''}${p.cls === 'MeshPart' ? `<Content name="MeshId"><url>${p.meshId}</url></Content><Content name="TextureID"><null></null></Content>${v3('InitialSize', p.initialSize)}<token name="RenderFidelity">1</token><token name="CollisionFidelity">${p.cc ? 2 : 0}</token><bool name="DoubleSided">false</bool>` : ''}<string name="Name">${esc(p.name)}</string>`;
      return `${ind}<Item class="${p.cls}" referent="${p.ref}"><Properties>${props}</Properties>${light}${(p.extras || []).map(extraXml).join('')}</Item>`;
    };
    const tree = { children: {}, parts: [] };
    for (const path in model.groups) { let node = tree; for (const seg of path.split('/')) node = node.children[seg] = node.children[seg] || { children: {}, parts: [], path: (node.path ? node.path + '/' : '') + seg }; }
    for (const p of model.parts) { let node = tree; for (const seg of p.group.split('/')) node = node.children[seg]; node.parts.push(p); }
    const nodeXml = (name, node, ind) => {
      const meta = model.groups[node.path] || {};
      const inner = [...node.parts.map((p) => partXml(p, ind + '\t')), ...Object.entries(node.children).map(([k, c]) => nodeXml(k, c, ind + '\t'))];
      if (meta.spin) inner.push(`${ind}\t<Item class="Script" referent="${ref()}"><Properties><string name="Name">Spin</string><token name="RunContext">2</token><bool name="Disabled">false</bool><ProtectedString name="Source"><![CDATA[${SPIN(meta.spin)}]]></ProtectedString></Properties></Item>`);
      if (meta.folder) return `${ind}<Item class="Folder" referent="${ref()}"><Properties><string name="Name">${esc(name)}</string></Properties>\n${inner.join('\n')}\n${ind}</Item>`;
      const pp = meta.primary ? node.parts.find((p) => p.name === meta.primary) : null;
      return `${ind}<Item class="Model" referent="${ref()}"><Properties><string name="Name">${esc(name)}</string><Ref name="PrimaryPart">${pp ? pp.ref : 'null'}</Ref></Properties>\n${inner.join('\n')}\n${ind}</Item>`;
    };
    const top = Object.entries(tree.children), isRoot = ([, c]) => (model.groups[c.path] || {}).root;
    const body = top.filter((e) => !isRoot(e)).map(([k, c]) => nodeXml(k, c, '\t\t')).join('\n');
    const roots = top.filter(isRoot).map(([k, c]) => nodeXml(k, c, '\t')).join('\n');
    return `<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">\n\t<Item class="Model" referent="${ref()}"><Properties><string name="Name">${model.name}</string><Ref name="PrimaryPart">null</Ref></Properties>\n${body}\n\t</Item>\n${roots}\n</roblox>\n`;
  }

  const api = { kit, zfight, clip, gridCheck, scaleCheck, player, PROP_H, toRbxmx, rng, MAT, I, mul, Rx, Ry, Rz, eul, mv, add3, sub3, scl, dot, cross, norm, local, d2r };
  if (typeof window !== 'undefined') window.BlockKit = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
