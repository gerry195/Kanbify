import React from 'react';

import { Crown, Search, Palette, Users } from 'lucide-react';

/*
 * Potongan kecil untuk topbar dan toolbar halaman board.
 *
 * Gaya ikon mengikuti tombol kunci emas di kartu board:
 * kotak kecil berwarna lembut, ikon garis dengan warna yang sama
 * di dalamnya.
 */

const TINTS = {
  blue: { bg: '#eaf1fb', fg: '#3b73d8' },
  rose: { bg: '#fdecef', fg: '#d6456b' },
  green: { bg: '#e8f6ee', fg: '#2f9e5f' },
  gold: { bg: '#fff5da', fg: '#c98a06' }
};

export function IconTile({ icon: Icon, tint = 'gold', size = 26 }) {
  const t = TINTS[tint] || TINTS.gold;

  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        background: t.bg,
        color: t.fg,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      <Icon size={Math.round(size * 0.58)} strokeWidth={2} />
    </span>
  );
}

const fieldBase = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  height: 40,
  boxSizing: 'border-box',
  padding: '0 14px 0 7px',
  borderRadius: 11,
  border: '1px solid var(--k-line)',
  background: 'rgba(255,255,255,0.96)',
  color: 'var(--k-ink)',
  fontFamily: 'var(--k-font-body)',
  fontSize: 12.5,
  fontWeight: 600
};

export function ToolSearch({ value, onChange }) {
  return (
    <label style={{ ...fieldBase, width: 210, cursor: 'text' }}>
      <IconTile icon={Search} tint="blue" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Cari tugas..."
        aria-label="Cari tugas"
        style={{
          flex: 1,
          minWidth: 0,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontFamily: 'inherit',
          fontSize: 12.5,
          fontWeight: 500,
          color: 'inherit'
        }}
      />
    </label>
  );
}

const TOOL_ICONS = { background: [Palette, 'rose'], members: [Users, 'green'] };

export function ToolButton({ kind, onClick, children }) {
  const [Icon, tint] = TOOL_ICONS[kind] || TOOL_ICONS.members;

  return (
    <button
      type="button"
      onClick={onClick}
      className="k-btn"
      style={{ ...fieldBase, cursor: 'pointer' }}
    >
      <IconTile icon={Icon} tint={tint} />
      {children}
    </button>
  );
}

/* =========================================================
   FOTO ANGGOTA + MAHKOTA ADMIN
   ========================================================= */

function initials(name) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function MemberAvatar({ member, index, size }) {
  const name = member.fullname || member.username || 'Anggota';
  const isAdmin = member.role === 'admin';

  return (
    <span
      title={isAdmin ? `${name} (Admin)` : name}
      style={{
        position: 'relative',
        width: size,
        height: size,
        marginLeft: index === 0 ? 0 : -8,
        flexShrink: 0
      }}
    >
      <span
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          border: '2px solid #fff',
          boxSizing: 'border-box',
          background: '#fde6d3',
          color: '#b45309',
          fontSize: size * 0.36,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 1px 3px rgba(30,25,10,0.18)'
        }}
      >
        {member.avatar ? (
          <img
            src={member.avatar}
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          initials(name)
        )}
      </span>

      {isAdmin && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: -9,
            right: -7,
            transform: 'rotate(24deg)',
            lineHeight: 0,
            filter: 'drop-shadow(0 1px 1.5px rgba(120,80,0,0.45))'
          }}
        >
          <Crown size={16} strokeWidth={1.8} color="#b47a00" fill="#f6b91a" />
        </span>
      )}
    </span>
  );
}

/*
 * Admin ditaruh paling depan. Mahkota miring di kanan atas hanya
 * untuk admin. Anggota biasa tanpa mahkota.
 */
export function MemberStack({ members = [], max = 5, size = 32, onClick }) {
  if (!members.length) return null;

  const sorted = [...members].sort(
    (a, b) => (b.role === 'admin') - (a.role === 'admin')
  );
  const shown = sorted.slice(0, max);
  const extra = sorted.length - shown.length;

  return (
    <button
      type="button"
      onClick={onClick}
      title="Lihat anggota board"
      aria-label={`${members.length} anggota board`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '10px 6px 2px 8px',
        margin: '-10px 0 -2px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer'
      }}
    >
      {shown.map((m, i) => (
        <MemberAvatar
          key={m.id ?? m.user_id ?? i}
          member={m}
          index={i}
          size={size}
        />
      ))}

      {extra > 0 && (
        <span
          style={{
            marginLeft: -8,
            width: size,
            height: size,
            borderRadius: '50%',
            border: '2px solid #fff',
            boxSizing: 'border-box',
            background: '#efece3',
            color: '#5f5b50',
            fontSize: 11,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          +{extra}
        </span>
      )}
    </button>
  );
}
