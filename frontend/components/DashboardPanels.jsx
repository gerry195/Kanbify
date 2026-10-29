import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const STATUSES = [
  { id: 'backlog', label: 'Backlog', color: '#b9b5a8', statKey: 'backlog_tasks' },
  { id: 'todo', label: 'To Do', color: '#3b73d8', statKey: 'todo_tasks' },
  { id: 'in-progress', label: 'On Progress', color: '#f97316', statKey: 'in_progress_tasks' },
  { id: 'done', label: 'Done', color: '#2f9e5f', statKey: 'completed_tasks' }
];

const STATUS_BY_ID = Object.fromEntries(STATUSES.map((s) => [s.id, s]));

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

// Kunci tanggal memakai jam lokal supaya "hari ini" tidak bergeser oleh zona waktu.
function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseKey(key) {
  return new Date(`${key}T00:00:00`);
}

function daysFromToday(key) {
  const today = parseKey(dateKey(new Date()));
  return Math.round((parseKey(key) - today) / 86400000);
}

function whenLabel(key) {
  const diff = daysFromToday(key);

  if (diff < 0) return `Terlambat ${Math.abs(diff)} hari`;
  if (diff === 0) return 'Hari ini';
  if (diff === 1) return 'Besok';

  return parseKey(key).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short'
  });
}

function Panel({ className, dark, title, sub, badge, children }) {
  return (
    <section
      className={`k-frost${dark ? ' k-frost-dark' : ''} k-dpanel ${className}`}
    >
      <div className="k-dpanel-head">
        <div>
          <h2 className="k-dpanel-title k-display">{title}</h2>
          {sub && <p className="k-dpanel-sub">{sub}</p>}
        </div>
        {badge && <span className="k-dpanel-badge">{badge}</span>}
      </div>
      {children}
    </section>
  );
}

export function StatusBars({ stats }) {
  const counts = STATUSES.map((s) => ({
    ...s,
    count: Number(stats?.[s.statKey] ?? 0)
  }));
  const total = counts.reduce((sum, s) => sum + s.count, 0);
  const max = Math.max(...counts.map((s) => s.count), 1);

  return (
    <Panel
      className="k-p-status"
      title="Status tugas"
      sub={`${total} tugas di semua board`}
    >
      {total === 0 ? (
        <p className="k-dpanel-empty">
          Belum ada tugas. Tambahkan tugas di salah satu board dan
          sebarannya muncul di sini.
        </p>
      ) : (
        <div className="k-bars" role="list">
          {counts.map((s) => (
            <div className="k-bar-col" role="listitem" key={s.id}>
              <span className="k-bar-num k-num">{s.count}</span>
              <div className="k-bar-track">
                <div
                  className="k-bar-fill"
                  style={{
                    height: s.count > 0 ? `${Math.max((s.count / max) * 100, 8)}%` : 0,
                    background: s.color
                  }}
                />
              </div>
              <span className="k-bar-name">{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

export function BoardProgress({ stats, onOpenBoard }) {
  const rows = [...(stats?.per_board ?? [])]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
  const doneThisWeek = stats?.completed_this_week ?? 0;

  return (
    <Panel
      className="k-p-boards"
      title="Progres per board"
      sub={`${doneThisWeek} tugas selesai minggu ini`}
    >
      {rows.length === 0 ? (
        <p className="k-dpanel-empty">
          Belum ada board. Buat board baru atau gabung dengan kode undangan.
        </p>
      ) : (
        <div>
          {rows.map((row) => {
            const pct = row.total > 0 ? Math.round((row.done / row.total) * 100) : 0;

            return (
              <button
                key={row.board_id}
                type="button"
                className="k-prow"
                onClick={() => onOpenBoard(row.board_id)}
              >
                <span className="k-prow-top">
                  <span className="k-prow-name">{row.name}</span>
                  <span className="k-prow-count k-num">
                    {row.done}/{row.total}
                  </span>
                </span>
                <span className="k-bar" aria-hidden="true">
                  <span
                    style={{
                      width: `${pct}%`,
                      background: pct === 100 ? 'var(--k-green)' : 'var(--k-orange)'
                    }}
                  />
                </span>
              </button>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

export function DeadlineList({ tasks, onOpenBoard, onOpenCalendar }) {
  const open = useMemo(
    () =>
      tasks
        .filter((t) => t.due && t.status !== 'done')
        .sort((a, b) => a.due.localeCompare(b.due)),
    [tasks]
  );
  const late = open.filter((t) => daysFromToday(t.due) < 0).length;

  return (
    <Panel
      dark
      className="k-p-deadline"
      title="Deadline terdekat"
      sub={late > 0 ? `${late} tugas terlambat` : 'Diurutkan dari tenggat terdekat'}
      badge={`${open.length} aktif`}
    >
      {open.length === 0 ? (
        <p className="k-dpanel-empty">
          Belum ada tugas dengan tenggat. Isi tanggal tenggat di kartu tugas
          dan daftarnya muncul di sini.
        </p>
      ) : (
        <div>
          {open.slice(0, 5).map((task) => {
            const diff = daysFromToday(task.due);
            const tone = diff < 0 ? ' late' : diff === 0 ? ' today' : '';

            return (
              <button
                key={task.id}
                type="button"
                className="k-task-row"
                onClick={() => onOpenBoard(task.boardId)}
              >
                <span className={`k-task-dot${tone}`} aria-hidden="true" />
                <span className="k-task-main">
                  <span className="k-task-title">{task.title}</span>
                  <span className="k-task-meta">{task.boardName}</span>
                </span>
                <span className={`k-task-when${diff < 0 ? ' late' : ''}`}>
                  {whenLabel(task.due)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="k-task-foot">
        <button type="button" className="k-link" onClick={onOpenCalendar}>
          Buka kalender →
        </button>
      </div>
    </Panel>
  );
}

export function MiniCalendar({ tasks, onOpenBoard }) {
  const todayKey = dateKey(new Date());
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selected, setSelected] = useState(todayKey);

  const byDay = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      if (t.due) (map[t.due] ||= []).push(t);
    });
    return map;
  }, [tasks]);

  // Minggu dimulai Senin; 6 baris penuh supaya tinggi kalender tidak berubah antar bulan.
  const offset = (month.getDay() + 6) % 7;
  const cells = Array.from({ length: 42 }, (_, i) =>
    new Date(month.getFullYear(), month.getMonth(), 1 - offset + i)
  );

  const shift = (delta) =>
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));

  const goToday = () => {
    const now = new Date();
    setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelected(todayKey);
  };

  const dayTasks = byDay[selected] ?? [];
  const monthLabel = month.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric'
  });
  const selectedLabel = parseKey(selected).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <Panel className="k-p-cal" title="Kalender tenggat">
      <div className="k-cal-wrap">
        <div>
          <div className="k-mini-head">
            <h3 className="k-mini-month k-display">{monthLabel}</h3>
            <div className="k-mini-nav">
              <button type="button" className="k-mini-btn" onClick={goToday}>
                Hari ini
              </button>
              <button
                type="button"
                className="k-mini-btn"
                aria-label="Bulan sebelumnya"
                onClick={() => shift(-1)}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="k-mini-btn"
                aria-label="Bulan berikutnya"
                onClick={() => shift(1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="k-mini-grid">
            {WEEKDAYS.map((d) => (
              <span key={d} className="k-mini-dow">
                {d}
              </span>
            ))}

            {cells.map((date) => {
              const key = dateKey(date);
              const count = byDay[key]?.length ?? 0;
              const cls = [
                'k-mini-day',
                date.getMonth() !== month.getMonth() && 'out',
                key === todayKey && 'today',
                key === selected && 'sel'
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <button
                  key={key}
                  type="button"
                  className={cls}
                  aria-pressed={key === selected}
                  aria-label={`${date.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}${count ? `, ${count} tugas` : ''}`}
                  onClick={() => setSelected(key)}
                >
                  {date.getDate()}
                  {count > 0 && <span className="k-mini-pip" />}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="k-day-title k-display">{selectedLabel}</h3>

          {dayTasks.length === 0 ? (
            <p className="k-dpanel-empty" style={{ padding: 0 }}>
              Tidak ada deadline pada tanggal ini.
            </p>
          ) : (
            dayTasks.map((task) => {
              const status = STATUS_BY_ID[task.status] ?? STATUS_BY_ID.backlog;

              return (
                <div className="k-day-row" key={task.id}>
                  <span
                    className="k-day-dot"
                    style={{ background: status.color }}
                    aria-hidden="true"
                  />
                  <span className="k-day-main">
                    <span className="k-day-name">{task.title}</span>
                    <span className="k-day-meta">
                      {task.boardName} · {status.label}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="k-link"
                    onClick={() => onOpenBoard(task.boardId)}
                  >
                    Buka
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Panel>
  );
}
