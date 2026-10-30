import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import InviteCodeModal from './InviteCodeModal';

import { BarChart3, Trash2, Star, KeyRound } from 'lucide-react';
import { toast } from './Toast';

const CATEGORY_COLORS = {
  Desain: { bg: '#fee2e2', text: '#b91c1c' },
  Pemasaran: { bg: '#f3e8ff', text: '#7e22ce' },
  Pengembangan: { bg: '#dbeafe', text: '#1d4ed8' },
  Umum: { bg: '#f1f5f9', text: '#475569' }
};

function categoryColor(cat) {
  return CATEGORY_COLORS[cat] || CATEGORY_COLORS.Umum;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';

  const mins = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 60000
  );

  if (mins < 1) return 'baru saja';
  if (mins < 60) return `${mins}m ago`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;

  return `${Math.floor(hrs / 24)}d ago`;
}

/*
 * Kartu board dipakai di Dashboard dan Semua Board.
 *
 *  - Kategori ada di kiri atas cover.
 *  - Kunci (kode undangan), Statistik, dan Hapus ada di kanan atas cover.
 *    Kunci dan Hapus hanya untuk admin.
 *  - Bintang ada di samping judul, jauh dari kategori.
 *  - Hapus hanya muncul untuk admin board.
 */
export default function BoardCard({
  board,
  onOpen,
  onChanged,
  onOpenStats
}) {
  const isAdmin = board.role === 'admin';

  const [starred, setStarred] = useState(!!board.starred);
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    setStarred(!!board.starred);
  }, [board.starred]);

  const coverUrl = board.cover_image
    ? `http://localhost:8000/storage/covers/${board.cover_image}`
    : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600';

  const total = board.total_tasks ?? 0;
  const done = board.done_tasks ?? 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const cat = categoryColor(board.category);

  const open = () =>
    onOpen && onOpen(board.id, board.name, board.role);

  const handleStar = async (e) => {
    e.stopPropagation();
    setStarred((s) => !s);

    try {
      const res = await api.toggleStarBoard(board.id);
      setStarred(res.starred);
      toast.success(res.starred ? 'Board ditandai bintang' : 'Bintang board dilepas', { detail: board.name });
      if (onChanged) onChanged();
    } catch (err) {
      setStarred((s) => !s);
      toast.error(err?.message || 'Gagal mengubah bintang board');
    }
  };

  const handleInvite = (e) => {
    e.stopPropagation();
    setInviteOpen(true);
  };

  const handleStats = (e) => {
    e.stopPropagation();
    if (onOpenStats) onOpenStats(board.id);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();

    if (
      !window.confirm(
        `Hapus board "${board.name}" beserta seluruh tugas di dalamnya?`
      )
    ) {
      return;
    }

    try {
      await api.deleteBoard(board.id);
      toast.success('Board dihapus', { detail: board.name });
      if (onChanged) onChanged();
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus board');
    }
  };

  return (
    <>
    <div className="k-board" onClick={open}>
      {/* COVER: kategori kiri atas, aksi kanan atas */}

      <div className="k-board-cover">
        <img src={coverUrl} alt={board.name} />

        <span
          className="k-board-cat"
          style={{ background: cat.bg, color: cat.text }}
        >
          {board.category || 'Umum'}
        </span>

        <div className="k-board-actions">
          {isAdmin && (
            <button
              type="button"
              className="k-glass gold"
              title="Kode undangan"
              aria-label="Kode undangan"
              onClick={handleInvite}
            >
              <KeyRound size={15} strokeWidth={2} />
            </button>
          )}

          <button
            type="button"
            className="k-glass"
            title="Statistik board"
            aria-label="Statistik board"
            onClick={handleStats}
          >
            <BarChart3 size={15} strokeWidth={2} />
          </button>

          {isAdmin && (
            <button
              type="button"
              className="k-glass danger"
              title="Hapus board"
              aria-label="Hapus board"
              onClick={handleDelete}
            >
              <Trash2 size={15} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* BODY */}

      <div style={{ padding: '13px 16px 15px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            marginBottom: 11
          }}
        >
          <h3
            className="k-display"
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 600,
              color: 'var(--k-ink)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {board.name}
          </h3>

          <button
            type="button"
            className={`k-star${starred ? ' on' : ''}`}
            onClick={handleStar}
            title={
              starred
                ? 'Hapus dari starred'
                : 'Tandai sebagai starred'
            }
            aria-pressed={starred}
          >
            <Star
              size={16}
              strokeWidth={2}
              fill={starred ? 'currentColor' : 'none'}
            />
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            color: 'var(--k-muted)',
            marginBottom: 6
          }}
        >
          <span>Progres Tugas</span>
          <span style={{ fontWeight: 600, color: 'var(--k-ink-2)' }}>
            {done}/{total}
          </span>
        </div>

        <div className="k-bar" style={{ marginBottom: 13 }}>
          <span
            style={{
              width: `${pct}%`,
              background:
                pct === 100 ? 'var(--k-green)' : 'var(--k-orange)'
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex' }}>
            {(board.members || []).slice(0, 4).map((m, i) => (
              <div
                key={m.id}
                title={m.fullname || m.username}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid #fff',
                  marginLeft: i === 0 ? 0 : -8,
                  background: 'var(--k-orange)',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {m.avatar ? (
                  <img
                    src={m.avatar}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  (m.fullname || m.username)?.[0]?.toUpperCase()
                )}
              </div>
            ))}
          </div>

          <span style={{ fontSize: 10.5, color: 'var(--k-faint)' }}>
            Updated {timeAgo(board.updated_at || board.created_at)}
          </span>
        </div>
      </div>
    </div>

    {inviteOpen && (
      <InviteCodeModal board={board} onClose={() => setInviteOpen(false)} />
    )}
    </>
  );
}
