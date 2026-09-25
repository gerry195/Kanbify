import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import BoardCard from '../components/BoardCard';

import {
  Bell,
  ClipboardList,
  FilePenLine,
  Timer,
  CircleCheck,
  TriangleAlert,
  RefreshCw,
  FolderOpen
} from 'lucide-react';

const CATEGORIES = ['Umum', 'Desain', 'Pemasaran', 'Pengembangan'];

function StatCard({ icon: Icon, label, value, tag }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 14,
        padding: '16px 18px',
        border: '1px solid #ece9e1',
        flex: '1 1 180px'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: '#fdf1e7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Icon
            size={17}
            strokeWidth={2}
            color="#f97316"
          />
        </div>

        <span
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            color: '#a8a8a3',
            letterSpacing: '0.5px'
          }}
        >
          {tag}
        </span>
      </div>

      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: '#1e1e1e',
          lineHeight: 1
        }}
      >
        {value}
      </div>

      <div
        style={{
          fontSize: 11.5,
          color: '#8a8a86',
          marginTop: 5
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default function DashboardPage({ onSelectBoard, onNavigate }) {
  const { user } = useAuth();

  const [boards, setBoards] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [boardName, setBoardName] = useState('');
  const [category, setCategory] = useState('Umum');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);

      const [boardsData, statsData] = await Promise.all([
        api.getBoards(),
        api.getStats()
      ]);

      setBoards(boardsData);
      setStats(statsData);
    } catch (err) {
      setError(err.message || 'Gagal memuat dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();

    if (!boardName.trim()) return;

    try {
      setSubmitting(true);

      const formData = new FormData();

      formData.append('name', boardName);
      formData.append('category', category);

      if (selectedImage) {
        formData.append('cover_image', selectedImage);
      }

      await api.createBoard(formData);

      setBoardName('');
      setCategory('Umum');
      setSelectedImage(null);
      setImagePreview(null);
      setShowModal(false);

      loadAll();
    } catch (err) {
      alert(err.message || 'Gagal membuat board');
    } finally {
      setSubmitting(false);
    }
  };

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
        Memuat Dashboard Kanbify...
      </div>
    );
  }

  const starredBoards = boards.filter((b) => b.starred);
  const boardsToShow =
    starredBoards.length > 0 ? starredBoards : boards;

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
        <span style={{ color: '#c7c7c1' }}>›</span>{' '}
        <span
          style={{
            color: '#f97316',
            fontWeight: 600
          }}
        >
          Dashboard
        </span>
      </div>

      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24
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
          Dashboard Utama
        </h1>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}
        >
          {/* Notification */}
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

          {/* Create board */}
          <button
            onClick={() => setShowModal(true)}
            style={{
              backgroundColor: '#f97316',
              color: '#fff',
              border: 'none',
              padding: '11px 18px',
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              boxShadow:
                '0 4px 10px -2px rgba(249,115,22,0.4)'
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>
              +
            </span>

            Buat Board Baru
          </button>
        </div>
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

      {/* Stat cards */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginBottom: 30,
          flexWrap: 'wrap'
        }}
      >
        <StatCard
          icon={ClipboardList}
          tag="TASK"
          value={stats?.total_tasks ?? 0}
          label="Aktif minggu ini"
        />

        <StatCard
          icon={FilePenLine}
          tag="TO DO"
          value={stats?.todo_tasks ?? 0}
          label="Aktif minggu ini"
        />

        <StatCard
          icon={Timer}
          tag="ON PROGRESS"
          value={stats?.in_progress_tasks ?? 0}
          label="Aktif minggu ini"
        />

        <StatCard
          icon={CircleCheck}
          tag="DONE"
          value={stats?.completed_tasks ?? 0}
          label="Aktif minggu ini"
        />
      </div>

      {/* Starred boards */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 16
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#1e1e1e',
              margin: 0
            }}
          >
            Stared Board
          </h2>

          <p
            style={{
              fontSize: 12,
              color: '#a8a8a3',
              margin: '3px 0 0 0'
            }}
          >
            {starredBoards.length > 0
              ? 'Kelola proyek kolaboratif tim Anda secara visual'
              : 'Belum ada board yang di-star — menampilkan semua board Anda'}
          </p>
        </div>

        <button
          onClick={() =>
            onNavigate && onNavigate('allboards')
          }
          style={{
            background: 'none',
            border: 'none',
            color: '#f97316',
            fontWeight: 600,
            fontSize: 12.5,
            cursor: 'pointer'
          }}
        >
          Lihat Semua Board →
        </button>
      </div>

      {/* Boards */}
      {boardsToShow.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            border: '2px dashed #ece9e1',
            borderRadius: 16,
            color: '#8a8a86'
          }}
        >
          <p
            style={{
              fontSize: 15,
              margin: '0 0 12px 0'
            }}
          >
            Belum ada papan kerja kanban.
          </p>

          <button
            onClick={() => setShowModal(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#f97316',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Buat papan kerja pertamamu sekarang
          </button>
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
          {boardsToShow.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              onOpen={onSelectBoard}
              onChanged={loadAll}
            />
          ))}
        </div>
      )}

      {/* Create Board Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: 20,
              padding: 28,
              width: 420,
              maxWidth: '90%',
              boxShadow:
                '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: '#1e1e1e',
                margin: '0 0 20px 0'
              }}
            >
              Buat Board Baru
            </h2>

            <form onSubmit={handleCreateBoard}>
              <div style={{ marginBottom: 16 }}>
                <label style={fieldLabel}>
                  Nama Board
                </label>

                <input
                  type="text"
                  placeholder="Contoh: Proyek Skripsi, Redesign Aplikasi"
                  value={boardName}
                  onChange={(e) =>
                    setBoardName(e.target.value)
                  }
                  required
                  style={fieldInput}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={fieldLabel}>
                  Kategori
                </label>

                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value)
                  }
                  style={fieldInput}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={fieldLabel}>
                  Cover Image
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                  id="board-cover-input"
                />

                <label
                  htmlFor="board-cover-input"
                  style={{
                    display: 'block',
                    padding: 14,
                    border: '2px dashed #ece9e1',
                    borderRadius: 10,
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: '#fafaf7',
                    color: '#8a8a86',
                    fontSize: 13
                  }}
                >
                  {imagePreview ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 7
                      }}
                    >
                      <RefreshCw size={15} />
                      Ganti Gambar
                    </span>
                  ) : (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 7
                      }}
                    >
                      <FolderOpen size={15} />
                      Pilih dari File Explorer
                    </span>
                  )}
                </label>

                {imagePreview && (
                  <div
                    style={{
                      marginTop: 12,
                      borderRadius: 10,
                      overflow: 'hidden',
                      height: 110,
                      border: '1px solid #ece9e1'
                    }}
                  >
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  justifyContent: 'flex-end'
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setImagePreview(null);
                    setSelectedImage(null);
                  }}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 10,
                    border: '1px solid #ece9e1',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    fontSize: 13.5
                  }}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 10,
                    border: 'none',
                    backgroundColor: '#f97316',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 13.5,
                    opacity: submitting ? 0.7 : 1
                  }}
                >
                  {submitting
                    ? 'Membuat...'
                    : 'Buat Board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const fieldLabel = {
  display: 'block',
  fontSize: 12.5,
  fontWeight: 600,
  color: '#4b4b47',
  marginBottom: 6
};

const fieldInput = {
  width: '100%',
  padding: 11,
  borderRadius: 10,
  border: '1px solid #ece9e1',
  fontSize: 13.5,
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff'
};