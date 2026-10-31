import React from 'react';

/*
 * Logo Kanbify: empat kotak membulat dalam susunan belah ketupat.
 * variant "orange" untuk navbar, "white" untuk latar gelap seperti splash.
 * animate: kotak terbang dari pusat ke posisinya (lihat splash.css).
 */

// Posisi pusat tiap kotak, dan jarak tempuhnya dari pusat logo.
const TILES = [
  { x: 100, y: 56, dx: 0, dy: 44, order: 0 },   // atas
  { x: 56, y: 100, dx: 44, dy: 0, order: 1 },   // kiri
  { x: 144, y: 100, dx: -44, dy: 0, order: 1 }, // kanan
  { x: 100, y: 144, dx: 0, dy: -44, order: 2 }  // bawah
];

const PALETTES = {
  orange: ['#fb923c', '#c2410c', '#f97316', '#ea580c'],
  white: ['#ffffff', '#ffffff', '#ffffff', '#ffffff']
};

export default function LogoMark({
  variant = 'orange',
  size = 34,
  animate = false,
  className = ''
}) {
  const colors = PALETTES[variant] || PALETTES.orange;
  const classes = ['k-logo', animate && 'k-logo-anim', className]
    .filter(Boolean)
    .join(' ');

  return (
    <svg
      className={classes}
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-label="Kanbify"
      focusable="false"
    >
      {TILES.map((t, i) => (
        <g key={i} transform={`translate(${t.x} ${t.y})`}>
          <g
            className="k-logo-tile"
            style={{ '--dx': `${t.dx}px`, '--dy': `${t.dy}px`, '--i': t.order }}
          >
            <rect
              x="-28"
              y="-28"
              width="56"
              height="56"
              rx="14"
              fill={colors[i]}
              transform="rotate(45)"
            />
          </g>
        </g>
      ))}
    </svg>
  );
}
