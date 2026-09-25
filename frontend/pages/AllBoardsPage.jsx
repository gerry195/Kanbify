import React, {
  useState,
  useEffect,
  useMemo
} from 'react';

import { api } from '../utils/api';
import BoardCard from '../components/BoardCard';

import {
  Bell,
  TriangleAlert,
  Search
} from 'lucide-react';

const CATEGORIES = [
  'Semua',
  'Umum',
  'Desain',
  'Pemasaran',
  'Pengembangan'
];

export default function AllBoardsPage({
  onSelectBoard
}) {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] =
    useState('Semua');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] =
    useState('updated');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);

      const data = await api.getBoards();

      setBoards(data);
    } catch (err) {
      setError(
        err.message || 'Gagal memuat board'
      );
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let list = [...boards];

    if (activeCategory !== 'Semua') {
      list = list.filter(
        (b) =>
          (b.category || 'Umum') ===
          activeCategory
      );
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();

      list = list.filter((b) =>
        b.name.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'updated') {
      list.sort(
        (a, b) =>
          new Date(
            b.updated_at || b.created_at
          ) -
          new Date(
            a.updated_at || a.created_at
          )
      );
    } else if (sortBy === 'name') {
      list.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    } else if (sortBy === 'progress') {
      const pct = (b) =>
        b.total_tasks > 0
          ? b.done_tasks / b.total_tasks
          : 0;

      list.sort((a, b) => pct(b) - pct(a));
    }

    return list;
  }, [
    boards,
    activeCategory,
    search,
    sortBy
  ]);

  if (loading) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: 'center',
          color: '#8a8a86',
          fontFamily: 'system-ui'
        }}
      >
        Memuat board...
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '28px 34px',
        maxWidth: 1200,
        margin: '0 auto',
        fontFamily: 'system-ui, sans-serif'
      }}
    >
      {/* Breadcrumb */}
      <div
        style={{
          fontSize: 11.5,
          color: '#a8a8a3',
          marginBottom: 4
        }}
      >
        Home{' '}
        <span style={{ color: '#c7c7c1' }}>
          ›
        </span>{' '}
        <span
          style={{
            color: '#f97316',
            fontWeight: 600
          }}
        >
          Semua Board
        </span>
      </div>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 22
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            margin: 0,
            color: '#1e1e1e'
          }}
        >
          Semua Board Anda
        </h1>

        <button
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            border: '1px solid #ece9e1',
            background: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Notifikasi"
        >
          <Bell
            size={16}
            strokeWidth={2}
            color="#f97316"
          />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            color: '#b91c1c',
            padding: 12,
            borderRadius: 8,
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

      {/* Filter + search + sort */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24
        }}
      >
        {/* Categories */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap'
          }}
        >
          {CATEGORIES.map((cat) => {
            const active =
              activeCategory === cat;

            return (
              <button
                key={cat}
                onClick={() =>
                  setActiveCategory(cat)
                }
                style={{
                  padding: '8px 16px',
                  borderRadius: 999,
                  border: active
                    ? 'none'
                    : '1px solid #ece9e1',
                  background: active
                    ? '#f97316'
                    : '#fff',
                  color: active
                    ? '#fff'
                    : '#4b4b47',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search + sort */}
        <div
          style={{
            display: 'flex',
            gap: 10
          }}
        >
          <div
            style={{
              position: 'relative',
              width: 190
            }}
          >
            <Search
              size={15}
              color="#9a9a94"
              strokeWidth={2}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform:
                  'translateY(-50%)',
                pointerEvents: 'none'
              }}
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Cari board..."
              style={{
                padding: '9px 14px 9px 34px',
                borderRadius: 10,
                border:
                  '1px solid #ece9e1',
                fontSize: 12.5,
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value)
            }
            style={{
              padding: '9px 12px',
              borderRadius: 10,
              border:
                '1px solid #ece9e1',
              fontSize: 12.5,
              outline: 'none',
              background: '#fff'
            }}
          >
            <option value="updated">
              Terakhir diupdate
            </option>

            <option value="name">
              Nama A-Z
            </option>

            <option value="progress">
              Progres tertinggi
            </option>
          </select>
        </div>
      </div>

      {/* Description */}
      <p
        style={{
          fontSize: 12.5,
          color: '#a8a8a3',
          margin: '-8px 0 18px 0'
        }}
      >
        Kelola, monitor, dan tinjau progres
        seluruh sprint board tim Anda secara
        komprehensif.
      </p>

      {/* Boards */}
      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            border:
              '2px dashed #ece9e1',
            borderRadius: 16,
            color: '#8a8a86'
          }}
        >
          <p
            style={{
              fontSize: 15,
              margin: 0
            }}
          >
            Tidak ada board yang cocok
            dengan filter ini.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(270px, 1fr))',
            gap: 20
          }}
        >
          {filtered.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              onOpen={onSelectBoard}
              onChanged={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}