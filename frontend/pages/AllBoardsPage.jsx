import React, { useState, useEffect, useMemo } from 'react';

import { api } from '../utils/api';
import BoardCard from '../components/BoardCard';
import CreateBoardModal from '../components/CreateBoardModal';
import NotificationBell from '../components/NotificationBell';

import { TriangleAlert, Search, Plus } from 'lucide-react';

const CATEGORIES = ['Semua', 'Umum', 'Desain', 'Pemasaran', 'Pengembangan'];

export default function AllBoardsPage({ onSelectBoard, onOpenStats }) {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('updated');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      setBoards(await api.getBoards());
    } catch (err) {
      setError(err.message || 'Gagal memuat board');
    } finally {
      setLoading(false);
    }
  };

  const counts = useMemo(() => {
    const map = { Semua: boards.length };
    boards.forEach((b) => {
      const c = b.category || 'Umum';
      map[c] = (map[c] || 0) + 1;
    });
    return map;
  }, [boards]);

  const filtered = useMemo(() => {
    let list = [...boards];

    if (activeCategory !== 'Semua') {
      list = list.filter((b) => (b.category || 'Umum') === activeCategory);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((b) => b.name.toLowerCase().includes(q));
    }

    const pct = (b) => (b.total_tasks > 0 ? b.done_tasks / b.total_tasks : 0);

    if (sortBy === 'updated') {
      list.sort(
        (a, b) =>
          new Date(b.updated_at || b.created_at) -
          new Date(a.updated_at || a.created_at)
      );
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'progress') {
      list.sort((a, b) => pct(b) - pct(a));
    }

    return list;
  }, [boards, activeCategory, search, sortBy]);

  if (loading) {
    return (
      <div
        className="k-page"
        style={{ padding: 40, textAlign: 'center', color: 'var(--k-muted)' }}
      >
        Memuat board...
      </div>
    );
  }

  return (
    <div className="k-page k-staged" style={{ padding: '26px 34px 50px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div
          style={{ fontSize: 11.5, color: 'var(--k-faint)', marginBottom: 5 }}
        >
          Home <span style={{ margin: '0 3px' }}>›</span>
          <span style={{ color: 'var(--k-link)', fontWeight: 600 }}>
            Semua Board
          </span>
        </div>

        {/* HEADER */}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
            marginBottom: 6
          }}
        >
          <h1
            className="k-display"
            style={{ margin: 0, fontSize: 28, fontWeight: 600 }}
          >
            Semua Board Anda
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <NotificationBell
              onOpenBoard={(id) => {
                const b = boards.find((x) => x.id === id);
                if (b && onSelectBoard) {
                  onSelectBoard(b.id, b.name, b.role);
                }
              }}
            />

            <button
              type="button"
              className="k-btn k-btn-primary"
              onClick={() => setShowCreate(true)}
            >
              <Plus size={16} strokeWidth={2.2} />
              Buat Board Baru
            </button>
          </div>
        </div>

        <p
          style={{
            margin: '0 0 22px',
            fontSize: 13,
            color: 'var(--k-muted)'
          }}
        >
          {boards.length} board. Pantau progres, buka statistik, atau
          rapikan yang sudah tidak terpakai.
        </p>

        {error && (
          <div
            style={{
              background: '#fff1f0',
              border: '1px solid #fbd0cc',
              color: '#b42318',
              padding: 12,
              borderRadius: 10,
              marginBottom: 20,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <TriangleAlert size={16} />
            {error}
          </div>
        )}

        {/* FILTER + SEARCH + SORT */}

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 14,
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 22
          }}
        >
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`k-chip${activeCategory === cat ? ' on' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
                {counts[cat] ? (
                  <span style={{ opacity: 0.55, marginLeft: 6 }}>
                    {counts[cat]}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ position: 'relative', width: 200 }}>
              <Search
                size={15}
                color="var(--k-muted)"
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }}
              />
              <input
                className="k-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari board..."
                style={{ paddingLeft: 34 }}
              />
            </div>

            <select
              className="k-input"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="updated">Terakhir diupdate</option>
              <option value="name">Nama A-Z</option>
              <option value="progress">Progres tertinggi</option>
            </select>
          </div>
        </div>

        {/* GRID */}

        {filtered.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '56px 20px',
              border: '1.5px dashed #d9d4c6',
              borderRadius: 16,
              color: 'var(--k-muted)'
            }}
          >
            <p style={{ fontSize: 14.5, margin: '0 0 14px' }}>
              {boards.length === 0
                ? 'Kamu belum punya board.'
                : 'Tidak ada board yang cocok dengan filter ini.'}
            </p>
            {boards.length === 0 && (
              <button
                type="button"
                className="k-btn k-btn-primary"
                onClick={() => setShowCreate(true)}
              >
                <Plus size={16} strokeWidth={2.2} />
                Buat board pertama
              </button>
            )}
          </div>
        ) : (
          <div
            className="k-stagger"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(285px, 1fr))',
              gap: 20,
              alignItems: 'start'
            }}
          >
            {filtered.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                onOpen={onSelectBoard}
                onChanged={load}
                onOpenStats={onOpenStats}
              />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateBoardModal
          onClose={() => setShowCreate(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}
