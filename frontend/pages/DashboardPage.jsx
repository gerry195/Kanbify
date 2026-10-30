import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import BoardCard from '../components/BoardCard';
import CreateBoardModal from '../components/CreateBoardModal';
import NotificationBell from '../components/NotificationBell';
import {
  StatusBars,
  BoardProgress,
  DeadlineList,
  MiniCalendar
} from '../components/DashboardPanels';

import {
  ClipboardList,
  FilePenLine,
  Timer,
  CircleCheck,
  TriangleAlert,
  UserPlus,
  X,
  ArrowRight
} from 'lucide-react';
import { toast } from '../components/Toast';

const STAT_TILES = [
  { icon: ClipboardList, tag: 'Task', key: 'total_tasks' },
  { icon: FilePenLine, tag: 'To Do', key: 'todo_tasks' },
  { icon: Timer, tag: 'On Progress', key: 'in_progress_tasks' },
  { icon: CircleCheck, tag: 'Done', key: 'completed_tasks' }
];

function StatCard({ icon: Icon, tag, value }) {
  return (
    <div className="k-frost k-stat">
      <div className="k-stat-top">
        <span className="k-stat-icon">
          <Icon size={18} strokeWidth={2} />
        </span>
        <span className="k-stat-tag">{tag}</span>
      </div>

      <div className="k-stat-value k-num">{value}</div>
      <div className="k-stat-label">Di semua board</div>
    </div>
  );
}

function normalizeTasks(data) {
  const list = Array.isArray(data) ? data : data?.data ?? [];

  return list.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    due: t.due_date ? String(t.due_date).slice(0, 10) : null,
    boardId: t.board_id ?? t.board?.id,
    boardName: t.board?.name ?? ''
  }));
}

export default function DashboardPage({
  onSelectBoard,
  onNavigate,
  onOpenStats
}) {
  const { user } = useAuth();

  const [boards, setBoards] = useState([]);
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError('');

      // Panel tugas hanya pelengkap; kegagalannya tidak boleh menjatuhkan dashboard.
      const [boardsData, statsData, taskData] = await Promise.all([
        api.getBoards(),
        api.getStats(),
        api.getCalendarTasks().catch(() => [])
      ]);

      setBoards(boardsData);
      setStats(statsData);
      setTasks(normalizeTasks(taskData));
    } catch (err) {
      setError(
        err.message || 'Gagal memuat dashboard'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleJoinBoard = async (e) => {
    e.preventDefault();

    const code = inviteCode.trim().toUpperCase();

    if (!code) {
      setJoinError('Masukkan kode undangan terlebih dahulu.');
      return;
    }

    try {
      setJoining(true);
      setJoinError('');
      setJoinSuccess('');

      const response = await api.joinBoard(code);

      setJoinSuccess(
        response?.message ||
        'Berhasil bergabung ke board.'
      );

      setInviteCode('');
      toast.success('Berhasil bergabung ke board');

      // Beri waktu user membaca pesan berhasil sebelum modal tertutup.
      setTimeout(async () => {
        setShowJoinModal(false);
        setJoinSuccess('');
        await loadAll();
      }, 700);

    } catch (err) {
      setJoinError(
        err.message ||
        'Gagal bergabung ke board.'
      );
    } finally {
      setJoining(false);
    }
  };

  const resetJoinModal = () => {
    setInviteCode('');
    setJoinError('');
    setJoinSuccess('');
    setJoining(false);
    setShowJoinModal(false);
  };

  const openBoardById = (id) => {
    const board = boards.find((b) => b.id === id);
    if (board && onSelectBoard) {
      onSelectBoard(board.id, board.name, board.role);
    }
  };

  if (loading) {
    return (
      <div className="k-page k-dash-loading">
        Memuat Dashboard Kanbify...
      </div>
    );
  }

  const starredBoards = boards.filter(
    (board) => board.starred
  );

  const boardsToShow =
    starredBoards.length > 0
      ? starredBoards
      : boards;

  const firstName = (user?.fullname || user?.username || '').split(' ')[0];
  const todayLabel = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="k-page k-staged">
      <div className="k-dash">

        <div className="k-dash-head">
          <div>
            <h1 className="k-dash-title k-display">
              {firstName ? `Selamat datang, ${firstName}` : 'Dashboard Utama'}
            </h1>
            <p className="k-dash-sub">Dashboard utama · {todayLabel}</p>
          </div>

          <div className="k-dash-actions">
            <NotificationBell onOpenBoard={openBoardById} />

            <button
              type="button"
              className="k-btn"
              onClick={() => setShowJoinModal(true)}
            >
              <UserPlus size={15} strokeWidth={1.9} />
              Gabung Board
            </button>

            <button
              type="button"
              className="k-btn k-btn-primary"
              onClick={() => setShowModal(true)}
            >
              <span style={{ fontSize: 17, lineHeight: 1, fontWeight: 500 }}>
                +
              </span>
              Buat Board Baru
            </button>
          </div>
        </div>

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

        <div className="k-dash-grid">
          {STAT_TILES.map((tile) => (
            <StatCard
              key={tile.key}
              icon={tile.icon}
              tag={tile.tag}
              value={stats?.[tile.key] ?? 0}
            />
          ))}

          <StatusBars stats={stats} />
          <BoardProgress stats={stats} onOpenBoard={openBoardById} />
          <DeadlineList
            tasks={tasks}
            onOpenBoard={openBoardById}
          />
          <MiniCalendar tasks={tasks} onOpenBoard={openBoardById} />
        </div>

        <div className="k-frost k-board-head">
          <div>
            <h2 className="k-display">Stared Board</h2>
            <p>
              {starredBoards.length > 0
                ? 'Kelola proyek kolaboratif tim Anda secara visual'
                : 'Belum ada board yang di-star — menampilkan semua board Anda'}
            </p>
          </div>

          <button
            type="button"
            className="k-link"
            onClick={() => onNavigate && onNavigate('allboards')}
          >
            Lihat Semua Board →
          </button>
        </div>

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
            className="k-stagger"
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
                  onOpenStats={
                    onOpenStats
                  }
                />
              )
            )}

          </div>

        )}

      </div>

      {showModal && (
        <CreateBoardModal
          onClose={() => setShowModal(false)}
          onCreated={loadAll}
        />
      )}

      {/* ===================================================
          JOIN BOARD MODAL
          =================================================== */}

      {showJoinModal && (

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
              resetJoinModal();
            }
          }}
        >

          <div
            style={{
              width: 420,
              maxWidth: '100%',
              background: '#ffffff',
              borderRadius: 18,
              padding: 25,
              boxSizing: 'border-box',
              boxShadow:
                '0 24px 60px rgba(0,0,0,0.18)'
            }}
          >

            {/* JOIN HEADER */}

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 15,
                marginBottom: 20
              }}
            >

              <div>

                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 11,
                    background: '#fff1e7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12
                  }}
                >
                  <UserPlus
                    size={19}
                    color="#ff6b0b"
                    strokeWidth={1.9}
                  />
                </div>

                <h2
                  style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#171717'
                  }}
                >
                  Gabung ke Board
                </h2>

                <p
                  style={{
                    margin:
                      '5px 0 0',
                    fontSize: 12,
                    color: '#99958e',
                    lineHeight: 1.5
                  }}
                >
                  Masukkan kode undangan dari
                  pemilik board untuk bergabung.
                </p>

              </div>

              <button
                type="button"
                onClick={resetJoinModal}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: 'none',
                  background: '#f5f4f1',
                  color: '#77736c',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  flexShrink: 0
                }}
              >
                <X
                  size={17}
                  strokeWidth={1.8}
                />
              </button>

            </div>

            <form
              onSubmit={handleJoinBoard}
            >

              {/* INVITE CODE */}

              <div
                style={{
                  marginBottom: 14
                }}
              >

                <label
                  style={fieldLabel}
                >
                  Kode Undangan
                </label>

                <input
                  type="text"
                  placeholder="Contoh: A7K9P2XM"
                  value={inviteCode}
                  onChange={(e) => {
                    setInviteCode(
                      e.target.value
                        .toUpperCase()
                        .replace(/\s/g, '')
                    );

                    setJoinError('');
                    setJoinSuccess('');
                  }}
                  maxLength={20}
                  autoFocus
                  style={{
                    ...fieldInput,
                    fontSize: 16,
                    fontWeight: 650,
                    letterSpacing: '2px',
                    textAlign: 'center',
                    textTransform: 'uppercase'
                  }}
                />

              </div>

              {/* ERROR */}

              {joinError && (
                <div
                  style={{
                    background: '#fff1f1',
                    border:
                      '1px solid #ffd7d7',
                    color: '#b91c1c',
                    borderRadius: 9,
                    padding:
                      '10px 11px',
                    fontSize: 11.5,
                    lineHeight: 1.4,
                    marginBottom: 14
                  }}
                >
                  {joinError}
                </div>
              )}

              {/* SUCCESS */}

              {joinSuccess && (
                <div
                  style={{
                    background: '#f0fdf4',
                    border:
                      '1px solid #bbf7d0',
                    color: '#15803d',
                    borderRadius: 9,
                    padding:
                      '10px 11px',
                    fontSize: 11.5,
                    lineHeight: 1.4,
                    marginBottom: 14
                  }}
                >
                  {joinSuccess}
                </div>
              )}

              {/* INFO */}

              {!joinError &&
                !joinSuccess && (
                  <div
                    style={{
                      background: '#faf9f6',
                      border:
                        '1px solid #ebe7df',
                      borderRadius: 9,
                      padding:
                        '10px 11px',
                      fontSize: 11,
                      color: '#88847d',
                      lineHeight: 1.5,
                      marginBottom: 20
                    }}
                  >
                    Kode undangan diberikan oleh
                    admin atau pemilik board.
                  </div>
                )}

              {/* BUTTONS */}

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
                    resetJoinModal
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
                    joining ||
                    !inviteCode.trim()
                  }
                  style={{
                    padding:
                      '10px 17px',
                    borderRadius: 9,
                    border: 'none',
                    background:
                      '#ff6b0b',
                    color: '#ffffff',
                    cursor:
                      joining ||
                      !inviteCode.trim()
                        ? 'default'
                        : 'pointer',
                    fontSize: 12.5,
                    fontWeight: 650,
                    opacity:
                      joining ||
                      !inviteCode.trim()
                        ? 0.6
                        : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7
                  }}
                >
                  {joining
                    ? 'Bergabung...'
                    : (
                      <>
                        Gabung Board
                        <ArrowRight
                          size={15}
                          strokeWidth={1.9}
                        />
                      </>
                    )}
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