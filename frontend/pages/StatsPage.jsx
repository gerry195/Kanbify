import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../utils/api';

import { TriangleAlert, ArrowUpRight, Clock3, CircleAlert } from 'lucide-react';

/* =========================================================
   KONSTANTA
   ========================================================= */

const STATUSES = [
  { id: 'done', label: 'Done', color: '#2f9e5f' },
  { id: 'in-progress', label: 'On Progress', color: '#f97316' },
  { id: 'todo', label: 'To Do', color: '#3b73d8' },
  { id: 'backlog', label: 'Backlog', color: '#b9b5a8' }
];

const PRIORITIES = [
  { id: 'sangat-tinggi', label: 'Sangat tinggi', color: '#b42318' },
  { id: 'tinggi', label: 'Tinggi', color: '#e0523f' },
  { id: 'sedang', label: 'Sedang', color: '#d9922b' },
  { id: 'rendah', label: 'Rendah', color: '#5b8bd9' },
  { id: 'sangat-rendah', label: 'Sangat rendah', color: '#6fae8a' }
];

/* =========================================================
   HELPER
   ========================================================= */

function formatTime(seconds) {
  const s = Number(seconds) || 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);

  if (h > 0) return `${h}j ${m}m`;
  if (m > 0) return `${m}m`;
  return s > 0 ? `${s}d` : '0m';
}

function dayKey(value) {
  const m = String(value || '').match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function todayKey() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function daysBetween(fromKey, toKey) {
  const a = new Date(`${fromKey}T00:00:00`);
  const b = new Date(`${toKey}T00:00:00`);
  return Math.round((b - a) / 86400000);
}

function formatDay(key) {
  return new Date(`${key}T00:00:00`).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short'
  });
}

function personName(p) {
  return p.fullname || p.name || p.username || `User ${p.id ?? p.user_id}`;
}

function initials(name) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/* =========================================================
   KOMPONEN KECIL
   ========================================================= */

function Panel({ title, hint, children, style }) {
  return (
    <section className="k-panel" style={{ padding: '20px 22px', ...style }}>
      <div style={{ marginBottom: 16 }}>
        <h2
          className="k-display"
          style={{ margin: 0, fontSize: 16, fontWeight: 600 }}
        >
          {title}
        </h2>
        {hint && (
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--k-muted)' }}>
            {hint}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }) {
  return (
    <div
      style={{
        padding: '22px 0',
        textAlign: 'center',
        fontSize: 12.5,
        color: 'var(--k-muted)'
      }}
    >
      {children}
    </div>
  );
}

function Avatar({ name, avatar, size = 28 }) {
  return (
    <span
      title={name}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        background: '#fde6d3',
        color: '#b45309',
        fontSize: size * 0.36,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      {avatar ? (
        <img
          src={avatar}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}

/* =========================================================
   HALAMAN
   ========================================================= */

export default function StatsPage({ initialBoardId, onOpenBoard }) {
  const [boards, setBoards] = useState([]);
  const [tasksByBoard, setTasksByBoard] = useState({});
  const [selected, setSelected] = useState(initialBoardId ?? 'all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError('');

        const list = await api.getBoards();
        const boardList = Array.isArray(list) ? list : list?.data || [];

        const entries = await Promise.all(
          boardList.map(async (b) => {
            try {
              const tasks = await api.getTasks(b.id);
              return [b.id, Array.isArray(tasks) ? tasks : []];
            } catch {
              return [b.id, []];
            }
          })
        );

        if (cancelled) return;

        setBoards(boardList);
        setTasksByBoard(Object.fromEntries(entries));
      } catch (err) {
        if (!cancelled) setError(err.message || 'Gagal memuat statistik');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSelected(initialBoardId ?? 'all');
  }, [initialBoardId]);

  const board = boards.find((b) => b.id === selected) || null;

  /* ------- tugas untuk pilihan aktif ------- */

  const tasks = useMemo(() => {
    if (selected === 'all') {
      return boards.flatMap((b) =>
        (tasksByBoard[b.id] || []).map((t) => ({ ...t, _board: b.name }))
      );
    }
    return (tasksByBoard[selected] || []).map((t) => ({
      ...t,
      _board: board?.name
    }));
  }, [selected, boards, tasksByBoard, board]);

  /* ------- agregasi ------- */

  const data = useMemo(() => {
    const today = todayKey();
    const total = tasks.length;

    const byStatus = Object.fromEntries(STATUSES.map((s) => [s.id, 0]));
    const byPriority = Object.fromEntries(PRIORITIES.map((p) => [p.id, 0]));
    const people = new Map();
    const overdue = [];
    let seconds = 0;

    const person = (p) => {
      const key = String(p.id ?? p.user_id ?? personName(p));
      if (!people.has(key)) {
        people.set(key, {
          key,
          name: personName(p),
          avatar: p.avatar,
          total: 0,
          done: 0
        });
      }
      return people.get(key);
    };

    let unassigned = { total: 0, done: 0 };

    tasks.forEach((t) => {
      const status = byStatus[t.status] !== undefined ? t.status : 'backlog';
      byStatus[status] += 1;
      seconds += Number(t.time) || 0;

      const isDone = status === 'done';

      if (!isDone) {
        const pr = byPriority[t.priority] !== undefined ? t.priority : 'sedang';
        byPriority[pr] += 1;

        const due = dayKey(t.due_date);
        if (due && due < today) {
          overdue.push({ ...t, due, late: daysBetween(due, today) });
        }
      }

      const assignees = Array.isArray(t.assignees) ? t.assignees : [];
      if (assignees.length === 0) {
        unassigned.total += 1;
        if (isDone) unassigned.done += 1;
      } else {
        assignees.forEach((a) => {
          const row = person(a);
          row.total += 1;
          if (isDone) row.done += 1;
        });
      }
    });

    overdue.sort((a, b) => b.late - a.late);

    const topTime = [...tasks]
      .filter((t) => Number(t.time) > 0)
      .sort((a, b) => Number(b.time) - Number(a.time))
      .slice(0, 5);

    return {
      total,
      byStatus,
      byPriority,
      openCount: total - byStatus.done,
      pct: total > 0 ? Math.round((byStatus.done / total) * 100) : 0,
      people: [...people.values()].sort((a, b) => b.total - a.total),
      unassigned,
      overdue,
      seconds,
      topTime
    };
  }, [tasks]);

  /* ------- state awal ------- */

  if (loading) {
    return (
      <div className="k-page" style={{ padding: 40, color: 'var(--k-muted)' }}>
        Memuat statistik...
      </div>
    );
  }

  if (error) {
    return (
      <div className="k-page" style={{ padding: 30 }}>
        <div
          style={{
            maxWidth: 560,
            background: '#fff1f0',
            border: '1px solid #fbd0cc',
            borderRadius: 12,
            padding: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            color: '#b42318',
            fontSize: 13
          }}
        >
          <TriangleAlert size={17} />
          {error}
        </div>
      </div>
    );
  }

  const maxPriority = Math.max(1, ...Object.values(data.byPriority));
  const maxTime = Math.max(1, ...data.topTime.map((t) => Number(t.time)));
  const maxLoad = Math.max(1, ...data.people.map((p) => p.total), data.unassigned.total);

  return (
    <div className="k-page" style={{ padding: '26px 34px 56px' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <div style={{ fontSize: 11.5, color: 'var(--k-faint)', marginBottom: 5 }}>
          Home <span style={{ margin: '0 3px' }}>›</span>
          <span style={{ color: 'var(--k-link)', fontWeight: 600 }}>
            Statistik Tim
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 16,
            flexWrap: 'wrap',
            marginBottom: 18
          }}
        >
          <div>
            <h1
              className="k-display"
              style={{ margin: 0, fontSize: 28, fontWeight: 600 }}
            >
              {board ? board.name : 'Semua board'}
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--k-muted)' }}>
              {board
                ? `Statistik khusus board ${board.category || 'Umum'} ini.`
                : 'Gabungan seluruh board kamu. Pilih satu board untuk melihat rinciannya.'}
            </p>
          </div>

          {board && onOpenBoard && (
            <button
              type="button"
              className="k-btn"
              onClick={() => onOpenBoard(board.id, board.name, board.role)}
            >
              Buka board <ArrowUpRight size={15} />
            </button>
          )}
        </div>

        {/* PILIH BOARD */}

        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 6,
            marginBottom: 20
          }}
        >
          <button
            type="button"
            className={`k-tab${selected === 'all' ? ' on' : ''}`}
            onClick={() => setSelected('all')}
          >
            Semua board <small>{boards.length}</small>
          </button>

          {boards.map((b) => (
            <button
              key={b.id}
              type="button"
              className={`k-tab${selected === b.id ? ' on' : ''}`}
              onClick={() => setSelected(b.id)}
            >
              {b.name}
              <small>{(tasksByBoard[b.id] || []).length}</small>
            </button>
          ))}
        </div>

        {boards.length === 0 ? (
          <Empty>Belum ada board. Buat board dulu untuk melihat statistik.</Empty>
        ) : (
          <>
            {/* RINGKASAN */}

            <section
              className="k-panel k-split"
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)',
                marginBottom: 18,
                overflow: 'hidden'
              }}
            >
              <div style={{ padding: '24px 26px' }}>
                <div className="k-eyebrow">Tingkat penyelesaian</div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 10,
                    margin: '6px 0 18px'
                  }}
                >
                  <span
                    className="k-num"
                    style={{ fontSize: 64, fontWeight: 600, lineHeight: 1 }}
                  >
                    {data.pct}
                    <span style={{ fontSize: 30, color: 'var(--k-orange)' }}>%</span>
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--k-muted)' }}>
                    {data.byStatus.done} dari {data.total} tugas selesai
                  </span>
                </div>

                <div className="k-stack" role="img" aria-label="Distribusi status tugas">
                  {data.total === 0 ? (
                    <span style={{ flexGrow: 1, background: 'transparent' }} />
                  ) : (
                    STATUSES.map((s) =>
                      data.byStatus[s.id] > 0 ? (
                        <span
                          key={s.id}
                          style={{
                            flexGrow: data.byStatus[s.id],
                            flexBasis: 0,
                            background: s.color
                          }}
                        />
                      ) : null
                    )
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px 22px',
                    marginTop: 14
                  }}
                >
                  {STATUSES.map((s) => (
                    <span
                      key={s.id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 7,
                        fontSize: 12.5,
                        color: 'var(--k-ink-2)'
                      }}
                    >
                      <span
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: 3,
                          background: s.color
                        }}
                      />
                      {s.label}
                      <strong className="k-num" style={{ fontWeight: 600 }}>
                        {data.byStatus[s.id]}
                      </strong>
                    </span>
                  ))}
                </div>
              </div>

              <div
                style={{
                  borderLeft: '1px solid var(--k-line)',
                  display: 'grid',
                  gridTemplateRows: 'repeat(3, 1fr)'
                }}
              >
                {[
                  { label: 'Tugas aktif', value: data.openCount, note: 'belum selesai' },
                  {
                    label: 'Terlambat',
                    value: data.overdue.length,
                    note: 'lewat deadline',
                    alert: data.overdue.length > 0
                  },
                  { label: 'Waktu terlacak', value: formatTime(data.seconds), note: 'total timer' }
                ].map((row, i) => (
                  <div
                    key={row.label}
                    style={{
                      padding: '14px 24px',
                      borderTop: i === 0 ? 'none' : '1px solid var(--k-line)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12
                    }}
                  >
                    <div>
                      <div className="k-eyebrow">{row.label}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--k-faint)', marginTop: 2 }}>
                        {row.note}
                      </div>
                    </div>
                    <div
                      className="k-num"
                      style={{
                        fontSize: 30,
                        fontWeight: 600,
                        color: row.alert ? 'var(--k-red)' : 'var(--k-ink)'
                      }}
                    >
                      {row.value}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* BEBAN + PRIORITAS */}

            <div
              className="k-split"
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)',
                gap: 18,
                marginBottom: 18
              }}
            >
              <Panel
                title="Beban per anggota"
                hint="Bagian gelap adalah tugas yang sudah selesai."
              >
                {data.people.length === 0 && data.unassigned.total === 0 ? (
                  <Empty>Belum ada tugas di board ini.</Empty>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {data.people.map((p) => (
                      <LoadRow key={p.key} person={p} max={maxLoad} />
                    ))}
                    {data.unassigned.total > 0 && (
                      <LoadRow
                        person={{ name: 'Belum ditugaskan', ...data.unassigned }}
                        max={maxLoad}
                        muted
                      />
                    )}
                  </div>
                )}
              </Panel>

              <Panel
                title="Prioritas tugas aktif"
                hint="Hanya tugas yang belum selesai."
              >
                {data.openCount === 0 ? (
                  <Empty>Tidak ada tugas aktif.</Empty>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                    {PRIORITIES.map((p) => (
                      <div key={p.id}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: 12.5,
                            marginBottom: 5
                          }}
                        >
                          <span style={{ color: 'var(--k-ink-2)' }}>{p.label}</span>
                          <strong className="k-num" style={{ fontWeight: 600 }}>
                            {data.byPriority[p.id]}
                          </strong>
                        </div>
                        <div className="k-bar">
                          <span
                            style={{
                              width: `${(data.byPriority[p.id] / maxPriority) * 100}%`,
                              background: p.color
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </div>

            {/* TERLAMBAT + WAKTU */}

            <div
              className="k-split"
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                gap: 18
              }}
            >
              <Panel title="Tugas terlambat" hint="Urut dari yang paling lama lewat deadline.">
                {data.overdue.length === 0 ? (
                  <Empty>Tidak ada tugas yang terlambat.</Empty>
                ) : (
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {data.overdue.slice(0, 6).map((t) => (
                      <li
                        key={`${t._board}-${t.id}`}
                        className="k-row-hover"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 6px',
                          borderTop: '1px solid var(--k-line-soft)'
                        }}
                      >
                        <CircleAlert size={16} color="var(--k-red)" style={{ flexShrink: 0 }} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {t.title}
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--k-muted)' }}>
                            {selected === 'all' && t._board ? `${t._board} · ` : ''}
                            Deadline {formatDay(t.due)}
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: 'var(--k-red)',
                            background: '#fdecea',
                            padding: '3px 8px',
                            borderRadius: 6,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {t.late} hari
                        </span>
                      </li>
                    ))}
                    {data.overdue.length > 6 && (
                      <li
                        style={{
                          fontSize: 12,
                          color: 'var(--k-muted)',
                          paddingTop: 10,
                          borderTop: '1px solid var(--k-line-soft)'
                        }}
                      >
                        dan {data.overdue.length - 6} tugas lain
                      </li>
                    )}
                  </ul>
                )}
              </Panel>

              <Panel title="Waktu terlacak" hint="Lima tugas dengan timer terlama.">
                {data.topTime.length === 0 ? (
                  <Empty>Belum ada timer yang dijalankan.</Empty>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                    {data.topTime.map((t) => (
                      <div key={`${t._board}-${t.id}`}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 10,
                            fontSize: 12.5,
                            marginBottom: 5
                          }}
                        >
                          <span
                            style={{
                              color: 'var(--k-ink-2)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {t.title}
                          </span>
                          <span
                            className="k-num"
                            style={{
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              flexShrink: 0
                            }}
                          >
                            <Clock3 size={12} color="var(--k-muted)" />
                            {formatTime(t.time)}
                          </span>
                        </div>
                        <div className="k-bar">
                          <span
                            style={{
                              width: `${(Number(t.time) / maxTime) * 100}%`,
                              background: 'var(--k-ink)'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   BARIS BEBAN ANGGOTA
   ========================================================= */

function LoadRow({ person, max, muted }) {
  const width = (person.total / max) * 100;
  const doneShare = person.total > 0 ? (person.done / person.total) * 100 : 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {muted ? (
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: '1.5px dashed #cfc9b8',
            flexShrink: 0
          }}
        />
      ) : (
        <Avatar name={person.name} avatar={person.avatar} />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 12.5,
            marginBottom: 5
          }}
        >
          <span
            style={{
              color: muted ? 'var(--k-muted)' : 'var(--k-ink-2)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {person.name}
          </span>
          <span style={{ color: 'var(--k-muted)', flexShrink: 0, marginLeft: 8 }}>
            <strong className="k-num" style={{ color: 'var(--k-ink)', fontWeight: 600 }}>
              {person.done}
            </strong>
            /{person.total} selesai
          </span>
        </div>

        <div className="k-bar" style={{ background: 'transparent' }}>
          <span
            style={{
              width: `${width}%`,
              background: '#f6d7bd',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <span
              style={{
                position: 'absolute',
                inset: 0,
                width: `${doneShare}%`,
                background: muted ? '#9a968a' : 'var(--k-ink)'
              }}
            />
          </span>
        </div>
      </div>
    </div>
  );
}
