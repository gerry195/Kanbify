import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
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

const CATEGORIES = [
  'Umum',
  'Desain',
  'Pemasaran',
  'Pengembangan'
];

/* =========================================================
   STAT CARD
   ========================================================= */

function StatCard({ icon: Icon, label, value, tag }) {
  return (
    <div
      style={{
        flex: '1 1 190px',
        minWidth: 0,
        background: '#ffffff',
        border: '1px solid #e8e5de',
        borderRadius: 14,
        padding: '16px 18px',
        boxSizing: 'border-box'
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
            width: 35,
            height: 35,
            borderRadius: 10,
            background: '#fff1e7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Icon
            size={17}
            strokeWidth={2}
            color="#ff6b0b"
          />
        </div>

        <span
          style={{
            fontSize: 9.5,
            fontWeight: 600,
            color: '#99958e',
            letterSpacing: '0.3px'
          }}
        >
          {tag}
        </span>
      </div>

      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          lineHeight: 1,
          color: '#151515'
        }}
      >
        {value}
      </div>

      <div
        style={{
          fontSize: 11.5,
          color: '#8e8b85',
          marginTop: 6
        }}
      >
        {label}
      </div>
    </div>
  );
}

/* =========================================================
   DASHBOARD
   ========================================================= */

export default function DashboardPage({
  onSelectBoard,
  onNavigate
}) {
  const [boards, setBoards] = useState([]);
  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* =======================================================
     CREATE BOARD STATE
     ======================================================= */

  const [showModal, setShowModal] = useState(false);
  const [boardName, setBoardName] = useState('');
  const [category, setCategory] = useState('Umum');

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  /* =======================================================
     LOAD DATA
     ======================================================= */

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError('');

      const [boardsData, statsData] = await Promise.all([
        api.getBoards(),
        api.getStats()
      ]);

      setBoards(boardsData);
      setStats(statsData);
    } catch (err) {
      setError(
        err.message || 'Gagal memuat dashboard'
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     IMAGE
     ======================================================= */

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  /* =======================================================
     CREATE BOARD
     ======================================================= */

  const handleCreateBoard = async (e) => {
    e.preventDefault();

    if (!boardName.trim()) return;

    try {
      setSubmitting(true);

      const formData = new FormData();

      formData.append(
        'name',
        boardName.trim()
      );

      formData.append(
        'category',
        category
      );

      if (selectedImage) {
        formData.append(
          'cover_image',
          selectedImage
        );
      }

      await api.createBoard(formData);

      resetModal();

      await loadAll();
    } catch (err) {
      alert(
        err.message ||
        'Gagal membuat board'
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =======================================================
     RESET MODAL
     ======================================================= */

  const resetModal = () => {
    setBoardName('');
    setCategory('Umum');
    setSelectedImage(null);
    setImagePreview(null);
    setShowModal(false);
  };

  /* =======================================================
     LOADING
     ======================================================= */

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#8e8b85',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 13
        }}
      >
        Memuat Dashboard Kanbify...
      </div>
    );
  }

  /* =======================================================
     BOARD DATA
     ======================================================= */

  const starredBoards = boards.filter(
    (board) => board.starred
  );

  const boardsToShow =
    starredBoards.length > 0
      ? starredBoards
      : boards;

  /* =======================================================
     PAGE
     ======================================================= */

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100%',
        background: '#f4f3ee',
        padding: '22px 22px 50px',
        boxSizing: 'border-box',
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      }}
    >

      {/* =================================================
          PAGE HEADER
          ================================================= */}

      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto'
        }}
      >

        {/* Breadcrumb */}

        <div
          style={{
            fontSize: 11.5,
            color: '#aaa69e',
            marginBottom: 5
          }}
        >
          Home
          <span
            style={{
              margin: '0 4px',
              color: '#c5c1b9'
            }}
          >
            ›
          </span>

          <span
            style={{
              color: '#ff6b0b',
              fontWeight: 600
            }}
          >
            Dashboard
          </span>
        </div>

        {/* Title + Actions */}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 20,
            marginBottom: 28
          }}
        >

          <h1
            style={{
              margin: 0,
              fontSize: 24,
              lineHeight: 1.15,
              fontWeight: 700,
              color: '#151515',
              letterSpacing: '-0.4px'
            }}
          >
            Dashboard Utama
          </h1>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexShrink: 0
            }}
          >

            {/* Notification */}

            <button
              type="button"
              title="Notifikasi"
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                border: '1px solid #e6e2da',
                background: '#ffffff',
                color: '#ff6b0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0
              }}
            >
              <Bell
                size={16}
                strokeWidth={1.8}
              />
            </button>

            {/* Create Board */}

            <button
              type="button"
              onClick={() =>
                setShowModal(true)
              }
              style={{
                border: 'none',
                background: '#ff6b0b',
                color: '#ffffff',
                borderRadius: 10,
                padding: '11px 16px',
                fontSize: 12.5,
                fontWeight: 650,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                boxShadow:
                  '0 5px 12px rgba(255,107,11,0.22)'
              }}
            >
              <span
                style={{
                  fontSize: 17,
                  lineHeight: 1,
                  fontWeight: 500
                }}
              >
                +
              </span>

              Buat Board Baru
            </button>

          </div>
        </div>

        {/* =================================================
            ERROR
            ================================================= */}

        {error && (
          <div
            style={{
              background: '#fff1f1',
              border: '1px solid #ffd7d7',
              color: '#b91c1c',
              padding: '11px 13px',
              borderRadius: 10,
              marginBottom: 20,
              fontSize: 12.5,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <TriangleAlert size={16} />
            {error}
          </div>
        )}

        {/* =================================================
            STATISTICS
            ================================================= */}

        <div
          style={{
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
            marginBottom: 32
          }}
        >

          <StatCard
            icon={ClipboardList}
            tag="TASK"
            value={
              stats?.total_tasks ?? 0
            }
            label="Aktif minggu ini"
          />

          <StatCard
            icon={FilePenLine}
            tag="TO DO"
            value={
              stats?.todo_tasks ?? 0
            }
            label="Aktif minggu ini"
          />

          <StatCard
            icon={Timer}
            tag="ON PROGRESS"
            value={
              stats?.in_progress_tasks ?? 0
            }
            label="Aktif minggu ini"
          />

          <StatCard
            icon={CircleCheck}
            tag="DONE"
            value={
              stats?.completed_tasks ?? 0
            }
            label="Aktif minggu ini"
          />

        </div>

        {/* =================================================
            STARRED BOARD HEADER
            ================================================= */}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 20,
            marginBottom: 15
          }}
        >

          <div>

            <h2
              style={{
                margin: 0,
                fontSize: 15.5,
                fontWeight: 700,
                color: '#151515'
              }}
            >
              Stared Board
            </h2>

            <p
              style={{
                margin:
                  '4px 0 0 0',
                fontSize: 11.5,
                color: '#a09c94'
              }}
            >
              {starredBoards.length > 0
                ? 'Kelola proyek kolaboratif tim Anda secara visual'
                : 'Belum ada board yang di-star — menampilkan semua board Anda'}
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              onNavigate &&
              onNavigate('allboards')
            }
            style={{
              border: 'none',
              background: 'transparent',
              color: '#ff6b0b',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '4px 0',
              whiteSpace: 'nowrap'
            }}
          >
            Lihat Semua Board →
          </button>

        </div>

        {/* =================================================
            BOARD GRID
            ================================================= */}

        {boardsToShow.length === 0 ? (

          <div
            style={{
              background: '#ffffff',
              border:
                '1px dashed #dcd8cf',
              borderRadius: 14,
              minHeight: 240,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: 30,
              boxSizing: 'border-box'
            }}
          >

            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                background: '#fff1e7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12
              }}
            >
              <ClipboardList
                size={21}
                color="#ff6b0b"
                strokeWidth={1.8}
              />
            </div>

            <p
              style={{
                margin:
                  '0 0 10px',
                fontSize: 13.5,
                color: '#55524c',
                fontWeight: 500
              }}
            >
              Belum ada papan kerja kanban.
            </p>

            <button
              type="button"
              onClick={() =>
                setShowModal(true)
              }
              style={{
                border: 'none',
                background: 'transparent',
                color: '#ff6b0b',
                fontSize: 12.5,
                fontWeight: 650,
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
                'repeat(auto-fill, minmax(285px, 1fr))',
              gap: 20,
              alignItems: 'start'
            }}
          >

            {boardsToShow.map(
              (board) => (
                <BoardCard
                  key={board.id}
                  board={board}
                  onOpen={
                    onSelectBoard
                  }
                  onChanged={
                    loadAll
                  }
                />
              )
            )}

          </div>

        )}

      </div>

      {/* ===================================================
          CREATE BOARD MODAL
          =================================================== */}

      {showModal && (

        <div
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'rgba(15,15,15,0.42)',
            backdropFilter:
              'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            zIndex: 1000,
            boxSizing: 'border-box'
          }}
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              resetModal();
            }
          }}
        >

          <div
            style={{
              width: 420,
              maxWidth: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#ffffff',
              borderRadius: 18,
              padding: 25,
              boxSizing: 'border-box',
              boxShadow:
                '0 24px 60px rgba(0,0,0,0.18)'
            }}
          >

            {/* Modal Header */}

            <div
              style={{
                marginBottom: 20
              }}
            >

              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#171717'
                }}
              >
                Buat Board Baru
              </h2>

              <p
                style={{
                  margin:
                    '5px 0 0',
                  fontSize: 12,
                  color: '#99958e'
                }}
              >
                Buat papan kerja baru untuk
                mengatur tugasmu.
              </p>

            </div>

            <form
              onSubmit={
                handleCreateBoard
              }
            >

              {/* Board Name */}

              <div
                style={{
                  marginBottom: 16
                }}
              >

                <label
                  style={fieldLabel}
                >
                  Nama Board
                </label>

                <input
                  type="text"
                  placeholder="Contoh: Proyek Skripsi"
                  value={boardName}
                  onChange={(e) =>
                    setBoardName(
                      e.target.value
                    )
                  }
                  required
                  style={fieldInput}
                />

              </div>

              {/* Category */}

              <div
                style={{
                  marginBottom: 16
                }}
              >

                <label
                  style={fieldLabel}
                >
                  Kategori
                </label>

                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(
                      e.target.value
                    )
                  }
                  style={fieldInput}
                >

                  {CATEGORIES.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* Cover */}

              <div
                style={{
                  marginBottom: 22
                }}
              >

                <label
                  style={fieldLabel}
                >
                  Cover Image
                </label>

                <input
                  id="board-cover-input"
                  type="file"
                  accept="image/*"
                  onChange={
                    handleImageChange
                  }
                  style={{
                    display: 'none'
                  }}
                />

                <label
                  htmlFor="board-cover-input"
                  style={{
                    display: 'flex',
                    flexDirection:
                      'column',
                    alignItems: 'center',
                    justifyContent:
                      'center',
                    minHeight: 88,
                    border:
                      '2px dashed #e4e0d8',
                    borderRadius: 11,
                    background:
                      '#faf9f6',
                    color: '#8f8b84',
                    cursor: 'pointer',
                    fontSize: 12.5,
                    gap: 6
                  }}
                >

                  {imagePreview ? (
                    <>
                      <RefreshCw
                        size={17}
                        color="#ff6b0b"
                      />

                      <span>
                        Ganti Gambar
                      </span>
                    </>
                  ) : (
                    <>
                      <FolderOpen
                        size={18}
                        color="#ff6b0b"
                      />

                      <span>
                        Pilih dari File Explorer
                      </span>
                    </>
                  )}

                </label>

                {imagePreview && (
                  <div
                    style={{
                      marginTop: 10,
                      height: 110,
                      borderRadius: 10,
                      overflow: 'hidden',
                      border:
                        '1px solid #e7e3db'
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

              {/* Buttons */}

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'flex-end',
                  gap: 10
                }}
              >

                <button
                  type="button"
                  onClick={
                    resetModal
                  }
                  style={{
                    padding:
                      '10px 16px',
                    borderRadius: 9,
                    border:
                      '1px solid #e3dfd7',
                    background:
                      '#ffffff',
                    color: '#55524c',
                    cursor: 'pointer',
                    fontSize: 12.5,
                    fontWeight: 500
                  }}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting
                  }
                  style={{
                    padding:
                      '10px 18px',
                    borderRadius: 9,
                    border: 'none',
                    background:
                      '#ff6b0b',
                    color: '#ffffff',
                    cursor:
                      submitting
                        ? 'default'
                        : 'pointer',
                    fontSize: 12.5,
                    fontWeight: 650,
                    opacity:
                      submitting
                        ? 0.7
                        : 1
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

/* =========================================================
   FORM STYLES
   ========================================================= */

const fieldLabel = {
  display: 'block',
  marginBottom: 6,
  fontSize: 12,
  fontWeight: 600,
  color: '#4d4a45'
};

const fieldInput = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 11px',
  borderRadius: 9,
  border: '1px solid #e1ddd5',
  background: '#ffffff',
  color: '#252525',
  fontSize: 12.5,
  outline: 'none'
};