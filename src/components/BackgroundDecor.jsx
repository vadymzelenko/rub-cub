// Изометрический кубик Рубика 3×3 в фоне (SVG, размытый). Три видимые грани,
// каждая разбита на 9 клеток, чтобы читался «кубик», а не плоский ромб.

const A = [200, 50];   // верхняя вершина
const B = [320, 120];  // верх-право
const F = [80, 120];   // верх-лево
const G = [200, 190];  // центр
const C = [320, 260];  // низ-право
const E = [80, 260];   // низ-лево
const D = [200, 330];  // нижняя вершина

const PALETTES = {
    // U (top) — серебристо-белый
    top:   ['#e4e4e8', '#d6d6dc', '#c8c8cf', '#d6d6dc', '#e4e4e8', '#d6d6dc', '#c8c8cf', '#d6d6dc', '#e4e4e8'],
    // R (right) — красный
    right: ['#c41e3a', '#a8192f', '#8e1427', '#a8192f', '#c41e3a', '#a8192f', '#8e1427', '#a8192f', '#c41e3a'],
    // L (left) — зелёный
    left:  ['#009e60', '#008a54', '#007648', '#008a54', '#009e60', '#008a54', '#007648', '#008a54', '#009e60'],
};

function point(p0, p1, p3, u, v) {
    return [
        p0[0] + u * (p1[0] - p0[0]) + v * (p3[0] - p0[0]),
        p0[1] + u * (p1[1] - p0[1]) + v * (p3[1] - p0[1]),
    ];
}

function faceCells(p0, p1, p3, palette) {
    const cells = [];
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            const u0 = c / 3, u1 = (c + 1) / 3;
            const v0 = r / 3, v1 = (r + 1) / 3;
            const pts = [
                point(p0, p1, p3, u0, v0),
                point(p0, p1, p3, u1, v0),
                point(p0, p1, p3, u1, v1),
                point(p0, p1, p3, u0, v1),
            ].map((p) => p.join(',')).join(' ');
            cells.push({ points: pts, fill: palette[r * 3 + c] });
        }
    }
    return cells;
}

export default function BackgroundDecor() {
    const topCells   = faceCells(A, B, F, PALETTES.top);
    const rightCells = faceCells(B, C, G, PALETTES.right);
    const leftCells  = faceCells(F, G, E, PALETTES.left);

    return (
        <div className="bg-decor" aria-hidden="true">
            <div className="bg-cube">
                <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
                    <g stroke="rgba(0,0,0,0.28)" strokeWidth="0.8" strokeLinejoin="round">
                        {leftCells.map((cell, i) => (
                            <polygon key={'l' + i} points={cell.points} fill={cell.fill} />
                        ))}
                        {rightCells.map((cell, i) => (
                            <polygon key={'r' + i} points={cell.points} fill={cell.fill} />
                        ))}
                        {topCells.map((cell, i) => (
                            <polygon key={'t' + i} points={cell.points} fill={cell.fill} />
                        ))}
                    </g>
                </svg>
            </div>
        </div>
    );
}