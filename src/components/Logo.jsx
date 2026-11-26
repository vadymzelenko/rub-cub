// Brand mark: an isometric 3x3 cube drawn in SVG (crisp at any size, ~1 KB).
const TOP = ['#f5f5f4', '#ffd60a', '#f5f5f4', '#1f6fe5', '#f5f5f4', '#e0283c', '#f5f5f4', '#00a85a', '#f5f5f4'];
const LEFT = ['#00a85a', '#00a85a', '#ff7a1a', '#00a85a', '#ffd60a', '#00a85a', '#1f6fe5', '#00a85a', '#00a85a'];
const RIGHT = ['#e0283c', '#e0283c', '#e0283c', '#f5f5f4', '#e0283c', '#ff7a1a', '#e0283c', '#e0283c', '#e0283c'];

// Corner points of an isometric cube in a 100x100 box.
const T = [50, 6], R = [92, 30], L = [8, 30], C = [50, 54], BR = [92, 78], BL = [8, 78], B = [50, 102];

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.round(v * k).toString(16).padStart(2, '0');
  return '#' + ch(n >> 16) + ch((n >> 8) & 255) + ch(n & 255);
}

function lerp(p0, p1, p3, u, v) {
  return [p0[0] + u * (p1[0] - p0[0]) + v * (p3[0] - p0[0]), p0[1] + u * (p1[1] - p0[1]) + v * (p3[1] - p0[1])];
}

function cells(p0, p1, p3, colors) {
  const out = [];
  const g = 0.07; // gap between stickers
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const u0 = c / 3 + g / 2, u1 = (c + 1) / 3 - g / 2, v0 = r / 3 + g / 2, v1 = (r + 1) / 3 - g / 2;
    const pts = [lerp(p0, p1, p3, u0, v0), lerp(p0, p1, p3, u1, v0), lerp(p0, p1, p3, u1, v1), lerp(p0, p1, p3, u0, v1)];
    out.push({ d: pts.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' '), fill: colors[r * 3 + c] });
  }
  return out;
}

export default function Logo({ size = 40, className = '' }) {
  const faces = [
    ...cells(L, T, C, TOP),
    ...cells(L, C, BL, LEFT).map((c) => ({ ...c, fill: shade(c.fill, 0.84) })),
    ...cells(C, R, B, RIGHT).map((c) => ({ ...c, fill: shade(c.fill, 0.7) })),
  ];
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 100 108" role="img" aria-label="RubCub">
      <path d={`M${T} L${R} L${BR} L${B} L${BL} L${L} Z`} fill="#111114" stroke="#111114" strokeWidth="5" strokeLinejoin="round" />
      {faces.map((f, i) => (
        <polygon key={i} points={f.d} fill={f.fill} />
      ))}
    </svg>
  );
}
