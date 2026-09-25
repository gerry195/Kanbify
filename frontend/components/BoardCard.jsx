import React, { useState, useRef, useEffect } from 'react';
import { api } from '../utils/api';

const CATEGORY_COLORS = {
  'Desain':        { bg: '#fee2e2', text: '#b91c1c' },
  'Pemasaran':     { bg: '#f3e8ff', text: '#7e22ce' },
  'Pengembangan':  { bg: '#dbeafe', text: '#1d4ed8' },
  'Umum':          { bg: '#f1f5f9', text: '#475569' },
};

function categoryColor(cat) {
  return CATEGORY_COLORS[cat] || CATEGORY_COLORS['Umum'];
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'baru saja';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function BoardCard({ board, onOpen, onChanged, onOpenMembers }) {
  const isAdmin = board.role === 'admin';
  const [starred, setStarred] = useState(!!board.starred);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => { setStarred(!!board.starred); }, [board.starred]);

  useEffect(() => {
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const coverUrl = board.cover_image
    ? `http://localhost:8000/storage/covers/${board.cover_image}`
    : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600';

  const total = board.total_tasks ?? 0;
  const done = board.done_tasks ?? 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const cat = categoryColor(board.category);

  const handleStar = async (e) => {
    e.stopPropagation();
    setStarred(s => !s); // optimistic
    try {
      const res = await api.toggleStarBoard(board.id);
      setStarred(res.starred);
      onChanged && onChanged();
    } catch {
      setStarred(s => !s); // revert
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (!window.confirm(`Hapus board "${board.name}" beserta seluruh tugas di dalamnya?`)) return;
    try {
      await api.deleteBoard(board.id);
      onChanged && onChanged();
    } catch (err) {
      alert(err.message || 'Gagal menghapus board');
    }
  };

  return (
    <div
      onClick={() => onOpen && onOpen(board.id, board.name, board.role)}
      style={{
        backgroundColor: '#fff', borderRadius: 16, overflow: 'visible',
        border: '1px solid #ece9e1', cursor: 'pointer',
        display: 'flex', flexDirection: 'column',
        transition: 'transform .15s, box-shadow .15s',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 20px -6px rgba(0,0,0,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.03)'; }}
    >
      {/* Header row: category+star badge (left) — kebab menu (right) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 12px 0 12px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: cat.bg, color: cat.text,
          fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 999,
          textTransform: 'uppercase', letterSpacing: '0.4px'
        }}>
          <span
            onClick={handleStar}
            title={starred ? 'Hapus dari starred' : 'Tandai sebagai starred'}
            style={{ cursor: 'pointer', fontSize: 11, lineHeight: 1, color: starred ? '#f59e0b' : cat.text, opacity: starred ? 1 : 0.55 }}
          >
            {starred ? '★' : '☆'}
          </span>
          {board.category || 'Umum'}
        </div>

        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o); }}
            style={{
              background: 'rgba(0,0,0,0.04)', border: 'none', borderRadius: 8,
              width: 26, height: 26, cursor: 'pointer', color: '#64748b', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >⋮</button>

          {menuOpen && (
            <div
              onClick={e => e.stopPropagation()}
              style={{
                position: 'absolute', top: 30, right: 0, background: '#fff',
                border: '1px solid #eee', borderRadius: 10, width: 180,
                boxShadow: '0 8px 20px rgba(0,0,0,0.12)', zIndex: 20, overflow: 'hidden'
              }}
            >
              <button onClick={() => { setMenuOpen(false); onOpenMembers && onOpenMembers(board); }}
                style={menuBtnStyle}>👤 Undang Anggota</button>
              <button onClick={() => { setMenuOpen(false); onOpen && onOpen(board.id, board.name, board.role); }}
                style={menuBtnStyle}>📊 Statistik Board</button>
              {isAdmin && (
                <button onClick={handleDelete} style={{ ...menuBtnStyle, color: '#dc2626' }}>🗑️ Hapus Board</button>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ width: '100%', height: 130, marginTop: 10, backgroundColor: '#e2e8f0' }}>
        <img src={coverUrl} alt={board.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>

      <div style={{ padding: '14px 16px 16px 16px' }}>
        <h3 style={{ fontSize: 14.5, fontWeight: 700, color: '#1e1e1e', margin: '0 0 10px 0' }}>{board.name}</h3>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8a8a86', marginBottom: 5 }}>
          <span>Progres Tugas</span>
          <span style={{ fontWeight: 600, color: '#4b4b47' }}>{done}/{total}</span>
        </div>
        <div style={{ height: 5, borderRadius: 4, background: '#f0efe9', overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#16a34a' : '#f97316' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex' }}>
            {(board.members || []).slice(0, 4).map((m, i) => (
              <div key={m.id} title={m.fullname || m.username} style={{
                width: 24, height: 24, borderRadius: '50%', overflow: 'hidden',
                border: '2px solid #fff', marginLeft: i === 0 ? 0 : -8,
                background: '#f97316', color: '#fff', fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {m.avatar ? <img src={m.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : (m.fullname || m.username)?.[0]?.toUpperCase()}
              </div>
            ))}
          </div>
          <span style={{ fontSize: 10.5, color: '#a8a8a3', display: 'flex', alignItems: 'center', gap: 4 }}>
            📅 Updated {timeAgo(board.updated_at || board.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
}

const menuBtnStyle = {
  display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px',
  background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5,
  color: '#333', borderBottom: '1px solid #f4f4f4'
};
