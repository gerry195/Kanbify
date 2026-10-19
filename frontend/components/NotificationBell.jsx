import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../utils/api';

import {
  Bell,
  CheckCheck,
  CircleCheck,
  ArrowRight,
  Pencil,
  Trash2
} from 'lucide-react';

const STATUS_LABEL = {
  backlog: 'Backlog',
  todo: 'To Do',
  'in-progress': 'On Progress',
  done: 'Done'
};

const FIELD_LABEL = {
  title: 'judul',
  description: 'deskripsi',
  priority: 'prioritas',
  due_date: 'deadline',
  start_date: 'tanggal mulai',
  assignees: 'anggota'
};

const BOARD_COLORS = [
  '#f97316',
  '#3b73d8',
  '#2f9e5f',
  '#a24fc4',
  '#d6453d',
  '#0f8fa0',
  '#c9951a'
];

const POLL_MS = 30000;

/* =========================================================
   HELPER
   ========================================================= */

function actorName(n) {
  return n.actor?.fullname || n.actor?.username || 'Seseorang';
}

function initials(name) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function timeAgo(value) {
  const mins = Math.floor((Date.now() - new Date(value).getTime()) / 60000);

  if (mins < 1) return 'baru saja';
  if (mins < 60) return `${mins} mnt lalu`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;

  return `${Math.floor(hrs / 24)} hari lalu`;
}

function dayGroup(value) {
  const d = new Date(value);
  const now = new Date();
  const start = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const diff = Math.round((start(now) - start(d)) / 86400000);

  if (diff <= 0) return 'Hari ini';
  if (diff === 1) return 'Kemarin';
  return 'Sebelumnya';
}

function typeBadge(n) {
  if (n.type === 'task_deleted') {
    return { Icon: Trash2, bg: '#d6453d' };
  }
  if (n.type === 'task_updated') {
    return { Icon: Pencil, bg: '#3b73d8' };
  }
  if (n.data?.to === 'done') {
    return { Icon: CircleCheck, bg: '#2f9e5f' };
  }
  return { Icon: ArrowRight, bg: '#f97316' };
}

/* Kalimat aktivitas: "<pelaku> <aksi> <tugas>" */
function Sentence({ n }) {
  const title = <strong>“{n.task?.title}”</strong>;
  let action;

  if (n.type === 'task_status') {
    action =
      n.data?.to === 'done' ? (
        <>menyelesaikan {title}</>
      ) : (
        <>
          memindahkan {title} ke{' '}
          <strong>{STATUS_LABEL[n.data?.to] || n.data?.to}</strong>
        </>
      );
  } else if (n.type === 'task_updated') {
    const fields = (n.data?.fields || [])
      .map((f) => FIELD_LABEL[f] || f)
      .join(', ');

    action = (
      <>
        mengubah {fields} pada {title}
      </>
    );
  } else if (n.type === 'task_deleted') {
    action = <>menghapus tugas {title}</>;
  } else {
    action = <>melakukan perubahan pada {title}</>;
  }

  return (
    <span>
      <strong>{actorName(n)}</strong> {action}
    </span>
  );
}

function Avatar({ n }) {
  const name = actorName(n);
  const { Icon, bg } = typeBadge(n);

  return (
    <span style={{ position: 'relative', flexShrink: 0, width: 40, height: 40 }}>
      <span
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          overflow: 'hidden',
          background: '#fde6d3',
          color: '#b45309',
          fontSize: 14,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {n.actor?.avatar ? (
          <img
            src={n.actor.avatar}
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          initials(name)
        )}
      </span>

      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: -3,
          bottom: -3,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: bg,
          color: '#fff',
          border: '2px solid #fff',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Icon size={9} strokeWidth={3} />
      </span>
    </span>
  );
}

/* =========================================================
   LONCENG + PANEL
   ========================================================= */

export default function NotificationBell({ onOpenBoard }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ unread: 0, items: [] });
  const [filter, setFilter] = useState('all');
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const rootRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await api.getNotifications();
      setData({
        unread: res.unread ?? 0,
        items: Array.isArray(res.items) ? res.items : []
      });
      setError('');
    } catch (err) {
      setError(err.message || 'Gagal memuat notifikasi');
    } finally {
      setLoaded(true);
    }
  }, []);

  /* polling ringan untuk angka belum dibaca */
  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  /* tutup saat klik di luar atau tekan Esc */
  useEffect(() => {
    if (!open) return undefined;

    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const markRead = async (n) => {
    if (n.read) return;

    setData((d) => ({
      unread: Math.max(0, d.unread - 1),
      items: d.items.map((x) => (x.id === n.id ? { ...x, read: true } : x))
    }));

    try {
      await api.markNotificationRead(n.id);
    } catch {
      load();
    }
  };

  const markAll = async () => {
    setData((d) => ({
      unread: 0,
      items: d.items.map((x) => ({ ...x, read: true }))
    }));

    try {
      await api.markAllNotificationsRead();
    } catch {
      load();
    }
  };

  const openItem = (n) => {
    markRead(n);
    setOpen(false);
    if (n.board && onOpenBoard) onOpenBoard(n.board.id);
  };

  const shown =
    filter === 'unread' ? data.items.filter((n) => !n.read) : data.items;

  const groups = [];
  shown.forEach((n) => {
    const label = dayGroup(n.created_at);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(n);
    else groups.push({ label, items: [n] });
  });

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Notifikasi"
        aria-label={
          data.unread > 0
            ? `Notifikasi, ${data.unread} belum dibaca`
            : 'Notifikasi'
        }
        aria-expanded={open}
        style={{
          position: 'relative',
          width: 38,
          height: 38,
          borderRadius: '50%',
          border: `1px solid ${open ? 'var(--k-orange)' : 'var(--k-line)'}`,
          background: open ? 'var(--k-orange-soft)' : '#fff',
          color: 'var(--k-orange)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0
        }}
      >
        <Bell size={16} strokeWidth={1.9} />

        {data.unread > 0 && (
          <span
            className="k-num"
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              minWidth: 18,
              height: 18,
              padding: '0 4px',
              boxSizing: 'border-box',
              borderRadius: 9,
              background: 'var(--k-red)',
              color: '#fff',
              border: '2px solid var(--k-bg)',
              fontSize: 10,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {data.unread > 9 ? '9+' : data.unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="k-page"
          role="dialog"
          aria-label="Notifikasi"
          style={{
            position: 'absolute',
            top: 48,
            right: 0,
            width: 392,
            maxWidth: 'calc(100vw - 32px)',
            background: '#fff',
            border: '1px solid var(--k-line)',
            borderRadius: 16,
            boxShadow: '0 22px 50px -12px rgba(30,25,10,0.28)',
            zIndex: 200,
            overflow: 'hidden',
            minHeight: 0
          }}
        >
          {/* HEADER */}

          <div style={{ padding: '16px 18px 0' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <h2
                className="k-display"
                style={{ margin: 0, fontSize: 18, fontWeight: 600 }}
              >
                Notifikasi
              </h2>

              <button
                type="button"
                onClick={markAll}
                disabled={data.unread === 0}
                style={{
                  border: 'none',
                  background: 'none',
                  padding: '4px 0',
                  fontFamily: 'inherit',
                  fontSize: 12,
                  fontWeight: 600,
                  color:
                    data.unread === 0 ? 'var(--k-faint)' : 'var(--k-orange-deep)',
                  cursor: data.unread === 0 ? 'default' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                <CheckCheck size={14} /> Tandai semua dibaca
              </button>
            </div>

            <div style={{ display: 'flex', gap: 6, margin: '12px 0 12px' }}>
              {[
                ['all', 'Semua'],
                ['unread', `Belum dibaca${data.unread ? ` ${data.unread}` : ''}`]
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`k-chip${filter === id ? ' on' : ''}`}
                  onClick={() => setFilter(id)}
                  style={{ padding: '6px 12px', fontSize: 12 }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* LIST */}

          <div
            style={{
              maxHeight: 440,
              overflowY: 'auto',
              borderTop: '1px solid var(--k-line-soft)'
            }}
          >
            {!loaded ? (
              <p style={emptyStyle}>Memuat...</p>
            ) : error && data.items.length === 0 ? (
              <p style={emptyStyle}>
                Notifikasi belum tersambung ke server.
                <br />
                <span style={{ fontSize: 11.5, color: 'var(--k-faint)' }}>
                  {error}
                </span>
              </p>
            ) : shown.length === 0 ? (
              <p style={emptyStyle}>
                {filter === 'unread'
                  ? 'Semua sudah dibaca.'
                  : 'Belum ada aktivitas di board kamu.'}
              </p>
            ) : (
              groups.map((g) => (
                <div key={g.label}>
                  <div
                    className="k-eyebrow"
                    style={{ padding: '12px 18px 6px', background: '#fff' }}
                  >
                    {g.label}
                  </div>

                  {g.items.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => openItem(n)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        gap: 12,
                        alignItems: 'flex-start',
                        textAlign: 'left',
                        padding: '11px 18px',
                        border: 'none',
                        borderTop: '1px solid var(--k-line-soft)',
                        background: n.read ? '#fff' : '#fff8f1',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        color: 'var(--k-ink)'
                      }}
                    >
                      <Avatar n={n} />

                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span
                          style={{
                            display: 'block',
                            fontSize: 13,
                            lineHeight: 1.45,
                            color: 'var(--k-ink-2)',
                            wordBreak: 'break-word'
                          }}
                        >
                          <Sentence n={n} />
                        </span>

                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginTop: 6,
                            fontSize: 11.5,
                            color: 'var(--k-muted)'
                          }}
                        >
                          {n.board && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                maxWidth: 190,
                                padding: '2px 8px',
                                borderRadius: 6,
                                background: '#f5f3ec',
                                color: 'var(--k-ink-2)',
                                fontWeight: 600
                              }}
                            >
                              <span
                                style={{
                                  width: 7,
                                  height: 7,
                                  borderRadius: 2,
                                  flexShrink: 0,
                                  background:
                                    BOARD_COLORS[
                                      Number(n.board.id) % BOARD_COLORS.length
                                    ]
                                }}
                              />
                              <span
                                style={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {n.board.name}
                              </span>
                            </span>
                          )}
                          <span>{timeAgo(n.created_at)}</span>
                        </span>
                      </span>

                      {!n.read && (
                        <span
                          aria-label="Belum dibaca"
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: 'var(--k-orange)',
                            flexShrink: 0,
                            marginTop: 6
                          }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const emptyStyle = {
  margin: 0,
  padding: '34px 24px',
  textAlign: 'center',
  fontSize: 13,
  color: 'var(--k-muted)',
  lineHeight: 1.6
};
