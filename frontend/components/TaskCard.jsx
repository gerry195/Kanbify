import React from 'react';

import { CalendarDays, Pause, Play, Pencil, Trash2, CircleCheck } from 'lucide-react';

/*
 * Kartu task dengan sisa waktu.
 *
 *  - Batang tipis menunjukkan berapa bagian dari rentang mulai-deadline
 *    yang sudah lewat. Warnanya ikut sisa waktu:
 *      hijau = aman, kuning = H-2 atau kurang, merah = lewat deadline.
 *  - Kartu di kolom On Progress memegang timer (mulai/jeda).
 *  - Prioritas jadi titik berwarna di kiri bawah, bukan badge besar.
 */

const PRIORITY = {
  'sangat-tinggi': { label: 'Sangat tinggi', color: '#b42318' },
  tinggi: { label: 'Tinggi', color: '#e0523f' },
  sedang: { label: 'Sedang', color: '#d9922b' },
  rendah: { label: 'Rendah', color: '#5b8bd9' },
  'sangat-rendah': { label: 'Sangat rendah', color: '#6fae8a' }
};

const TONE = {
  safe: { fg: '#1f7a48', bg: '#e8f6ee', bar: '#2f9e5f' },
  soon: { fg: '#9a6212', bg: '#fdf3e1', bar: '#e0a02f' },
  late: { fg: '#b42318', bg: '#fdecea', bar: '#d6453d' },
  done: { fg: '#1f7a48', bg: '#e8f6ee', bar: '#2f9e5f' },
  none: { fg: '#6b675d', bg: '#f1efe8', bar: '#b9b5a8' }
};

function key(value) {
  return value ? String(value).slice(0, 10) : '';
}

function toDate(k) {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function dayDiff(fromKey, toKey) {
  return Math.round((toDate(toKey) - toDate(fromKey)) / 86400000);
}

function todayKey() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function short(k) {
  return toDate(k).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short'
  });
}

function clock(seconds) {
  const s = Number(seconds) || 0;
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${h}:${m}:${sec}`;
}

function initials(name) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/* Hitung teks chip, warna, dan isi batang dari tanggal tugas. */
function schedule(quest) {
  const start = key(quest.start_date);
  const due = key(quest.due_date);
  const today = todayKey();

  if (quest.status === 'done') {
    return { tone: 'done', chip: 'Selesai', pct: 100, start, due };
  }

  if (!due) {
    return { tone: 'none', chip: null, pct: null, start, due };
  }

  const left = dayDiff(today, due);

  let tone = 'safe';
  let chip = `${left} hari lagi`;

  if (left < 0) {
    tone = 'late';
    chip = `Terlambat ${Math.abs(left)} hari`;
  } else if (left === 0) {
    tone = 'soon';
    chip = 'Hari ini';
  } else if (left === 1) {
    tone = 'soon';
    chip = 'Besok';
  } else if (left <= 2) {
    tone = 'soon';
  }

  let pct = null;

  if (start) {
    const total = Math.max(1, dayDiff(start, due));
    const spent = dayDiff(start, today);
    pct = Math.max(0, Math.min(100, Math.round((spent / total) * 100)));
    if (left < 0) pct = 100;
  }

  return { tone, chip, pct, start, due };
}

export default function TaskCard({
  quest,
  cardColor,
  menuOpen,
  onOpen,
  onDragStart,
  onToggleMenu,
  onCloseMenu,
  onEdit,
  onDelete,
  onToggleTimer
}) {
  const sch = schedule(quest);
  const tone = TONE[sch.tone];
  const pr = PRIORITY[quest.priority] || PRIORITY.sedang;
  const assignees = Array.isArray(quest.assignees) ? quest.assignees : [];
  const running = quest.status === 'in-progress';
  const done = quest.status === 'done';

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      className="kb-task"
      style={{
        position: 'relative',
        marginBottom: 10,
        padding: '13px 14px 12px',
        borderRadius: 14,
        cursor: 'pointer',
        fontFamily: 'var(--k-font-body)',
        background: cardColor?.bg || '#fff',
        border: `1px solid ${cardColor?.border || 'var(--k-line)'}`,
        boxShadow: '0 1px 2px rgba(30,25,10,0.05)',
        opacity: done ? 0.92 : 1
      }}
    >
      {/* BARIS ATAS: id + menu */}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.07em',
            color: 'var(--k-faint)'
          }}
        >
          TASK-{quest.id}
        </span>

        <button
          type="button"
          aria-label={`Menu tindakan ${quest.title}`}
          title="Tindakan task"
          draggable={false}
          onClick={(e) => {
            e.stopPropagation();
            onToggleMenu();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            width: 24,
            height: 24,
            margin: '-3px -5px 0 0',
            border: 0,
            background: 'transparent',
            color: 'var(--k-muted)',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 17,
            lineHeight: 1
          }}
        >
          ⋮
        </button>
      </div>

      {menuOpen && (
        <>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onCloseMenu();
            }}
            style={{ position: 'fixed', inset: 0, zIndex: 20 }}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              right: 10,
              top: 34,
              zIndex: 21,
              width: 156,
              background: '#fff',
              border: '1px solid var(--k-line)',
              borderRadius: 11,
              boxShadow: '0 14px 30px rgba(30,25,10,0.18)',
              padding: 5
            }}
          >
            <button type="button" onClick={onEdit} style={menuItem}>
              <Pencil size={14} /> Edit task
            </button>
            <button
              type="button"
              onClick={onDelete}
              style={{ ...menuItem, color: 'var(--k-red)' }}
            >
              <Trash2 size={14} /> Hapus task
            </button>
          </div>
        </>
      )}

      {/* JUDUL + CATATAN */}

      <div
        className="k-display"
        style={{
          fontSize: 15,
          fontWeight: 600,
          lineHeight: 1.3,
          color: 'var(--k-ink)',
          wordBreak: 'break-word',
          marginBottom: quest.note ? 5 : 11,
          textDecoration: done ? 'line-through' : 'none',
          textDecorationColor: 'var(--k-faint)'
        }}
      >
        {quest.title}
      </div>

      {quest.note && (
        <div
          style={{
            fontSize: 11.5,
            lineHeight: 1.45,
            color: 'var(--k-muted)',
            marginBottom: 11,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {quest.note}
        </div>
      )}

      {/* SISA WAKTU */}

      {sch.due || sch.start ? (
        <div style={{ marginBottom: 11 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              marginBottom: sch.pct !== null ? 7 : 0
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                color: 'var(--k-ink-2)',
                fontWeight: 500
              }}
            >
              <CalendarDays size={13} color="var(--k-muted)" />
              {sch.start && sch.due
                ? `${short(sch.start)} → ${short(sch.due)}`
                : sch.due
                ? `Deadline ${short(sch.due)}`
                : `Mulai ${short(sch.start)}`}
            </span>

            {sch.chip && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 999,
                  color: tone.fg,
                  background: tone.bg,
                  whiteSpace: 'nowrap'
                }}
              >
                {done && <CircleCheck size={11} strokeWidth={2.4} />}
                {sch.chip}
              </span>
            )}
          </div>

          {sch.pct !== null && (
            <div className="k-bar" style={{ height: 5 }}>
              <span style={{ width: `${sch.pct}%`, background: tone.bar }} />
            </div>
          )}
        </div>
      ) : (
        <div
          style={{ fontSize: 11, color: 'var(--k-faint)', marginBottom: 11 }}
        >
          Belum ada jadwal
        </div>
      )}

      {/* TIMER (On Progress) atau total waktu (Done) */}

      {running && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            marginBottom: 11,
            padding: '6px 8px 6px 6px',
            borderRadius: 10,
            background: quest.isRunning ? '#fff4ea' : '#f6f4ee'
          }}
        >
          <button
            type="button"
            draggable={false}
            aria-label={quest.isRunning ? 'Jeda timer' : 'Lanjutkan timer'}
            onClick={(e) => {
              e.stopPropagation();
              onToggleTimer();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              width: 26,
              height: 26,
              border: 0,
              borderRadius: 8,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: quest.isRunning ? '#f97316' : '#fff',
              color: quest.isRunning ? '#fff' : '#f97316',
              boxShadow: quest.isRunning
                ? '0 3px 8px rgba(249,115,22,0.35)'
                : 'inset 0 0 0 1px #e8e4d9'
            }}
          >
            {quest.isRunning ? (
              <Pause size={13} fill="currentColor" strokeWidth={0} />
            ) : (
              <Play size={13} fill="currentColor" strokeWidth={0} />
            )}
          </button>

          <span
            className="k-num"
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: quest.isRunning ? '#c2570a' : 'var(--k-ink-2)'
            }}
          >
            {clock(quest.time)}
          </span>

          <span
            style={{
              marginLeft: 'auto',
              fontSize: 10.5,
              fontWeight: 600,
              color: 'var(--k-muted)'
            }}
          >
            {quest.isRunning ? 'Berjalan' : 'Dijeda'}
          </span>
        </div>
      )}

      {/* FOOTER: anggota + prioritas */}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          paddingTop: 10,
          borderTop: '1px solid var(--k-line-soft)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
          {assignees.slice(0, 3).map((person, i) => {
            const name =
              person.fullname || person.name || person.username || 'Anggota';

            return (
              <span
                key={person.id ?? person.user_id ?? i}
                title={name}
                style={{
                  width: 24,
                  height: 24,
                  marginLeft: i === 0 ? 0 : -7,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid #fff',
                  boxSizing: 'border-box',
                  background: ['#fde6d3', '#dbe8fb', '#dcf1e4'][i % 3],
                  color: '#4a463c',
                  fontSize: 9,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {person.avatar ? (
                  <img
                    src={person.avatar}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  initials(name)
                )}
              </span>
            );
          })}

          {assignees.length > 3 && (
            <span style={{ marginLeft: 5, fontSize: 10.5, color: 'var(--k-muted)' }}>
              +{assignees.length - 3}
            </span>
          )}

          {assignees.length === 0 && (
            <span style={{ fontSize: 10.5, color: 'var(--k-faint)' }}>
              Belum ditugaskan
            </span>
          )}
        </div>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--k-ink-2)',
            flexShrink: 0
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: pr.color
            }}
          />
          {pr.label}
        </span>
      </div>
    </div>
  );
}

const menuItem = {
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  width: '100%',
  border: 0,
  background: '#fff',
  padding: '9px 10px',
  borderRadius: 7,
  cursor: 'pointer',
  textAlign: 'left',
  fontFamily: 'inherit',
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--k-ink-2)'
};
