import React, { useMemo, useRef, useLayoutEffect, useState, useCallback } from 'react';

import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

/*
 * Gantt Chart board. Menggantikan tab Timeline dan Calendar.
 *
 *  - Satu baris per tugas, batang dari tanggal mulai sampai deadline.
 *  - Tugas yang hanya punya satu tanggal tampil sebagai penanda belah ketupat.
 *  - Tugas tanpa tanggal ditaruh di bagian bawah supaya tidak hilang.
 *  - Garis oranye menandai hari ini. Akhir pekan diberi bayangan tipis.
 *  - Warna batang mengikuti status. Tugas yang lewat deadline jadi merah.
 */

const LEFT_W = 252;
const ROW_H = 52;
const MONTH_H = 28;
const DAY_H = 44;

const ZOOMS = {
  minggu: { label: 'Minggu', dayW: 44, minDays: 35 },
  bulan: { label: 'Bulan', dayW: 16, minDays: 120 }
};

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
const DOW = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const COLORS = {
  todo: '#3b73d8',
  'in-progress': '#f97316',
  done: '#2f9e5f',
  backlog: '#9a968a',
  late: '#d6453d'
};

const STATUS_LABEL = {
  todo: 'To Do',
  'in-progress': 'On Progress',
  done: 'Done',
  backlog: 'Backlog'
};

/* ---------- tanggal ---------- */

const key = (v) => (v ? String(v).slice(0, 10) : '');

function toDate(k) {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toKey(d) {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function addDays(d, n) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function diff(aKey, bKey) {
  return Math.round((toDate(bKey) - toDate(aKey)) / 86400000);
}

function short(k) {
  return toDate(k).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function initials(name) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/* ---------- komponen ---------- */

export default function BoardGantt({ quests = [], onOpenTask, onAddTask }) {
  const [zoom, setZoom] = useState('minggu');
  const scrollRef = useRef(null);

  const { dayW, minDays } = ZOOMS[zoom];
  const today = toKey(new Date());

  /* pisahkan tugas berjadwal dan tanpa jadwal */
  const { scheduled, unscheduled } = useMemo(() => {
    const s = [];
    const u = [];

    quests.forEach((q) => {
      const a = key(q.start_date);
      const b = key(q.due_date);

      if (!a && !b) {
        u.push(q);
        return;
      }

      const from = a || b;
      const to = b || a;

      s.push({
        q,
        start: from <= to ? from : to,
        end: from <= to ? to : from,
        milestone: !a || !b
      });
    });

    s.sort((x, y) => x.start.localeCompare(y.start) || x.end.localeCompare(y.end));

    return { scheduled: s, unscheduled: u };
  }, [quests]);

  /* rentang hari yang digambar */
  const range = useMemo(() => {
    const all = [today, ...scheduled.flatMap((x) => [x.start, x.end])];
    const lo = all.reduce((m, k) => (k < m ? k : m));
    const hi = all.reduce((m, k) => (k > m ? k : m));

    const first = addDays(toDate(lo), -7);
    let count = diff(toKey(first), toKey(addDays(toDate(hi), 21))) + 1;
    if (count < minDays) count = minDays;

    const days = [];
    for (let i = 0; i < count; i += 1) {
      const date = addDays(first, i);
      const k = toKey(date);
      days.push({
        i,
        k,
        date,
        dow: date.getDay(),
        weekend: date.getDay() === 0 || date.getDay() === 6,
        today: k === today
      });
    }

    const months = [];
    days.forEach((d) => {
      const label = `${MONTHS[d.date.getMonth()]} ${d.date.getFullYear()}`;
      const last = months[months.length - 1];
      if (last && last.label === label) last.n += 1;
      else months.push({ label, n: 1 });
    });

    return { start: toKey(first), days, months };
  }, [scheduled, today, minDays]);

  const totalW = range.days.length * dayW;
  const todayIdx = diff(range.start, today);

  const goToday = useCallback(
    (smooth) => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTo({
        left: Math.max(0, todayIdx * dayW - 140),
        behavior: smooth ? 'smooth' : 'auto'
      });
    },
    [todayIdx, dayW]
  );

  /* saat dibuka atau zoom berganti, langsung tampilkan posisi hari ini */
  useLayoutEffect(() => {
    goToday(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);

  const step = () => (zoom === 'minggu' ? dayW * 7 : dayW * 28);

  const scrollBy = (dir) =>
    scrollRef.current?.scrollBy({ left: dir * step(), behavior: 'smooth' });

  const isEmpty = scheduled.length === 0 && unscheduled.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, fontFamily: 'var(--k-font-body)' }}>
      {/* KONTROL */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 12,
          flexShrink: 0
        }}
      >
        <div>
          <h2 className="k-display" style={{ margin: 0, fontSize: 24, fontWeight: 600, color: 'var(--k-ink)' }}>
            Gantt Chart
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--k-ink-2)' }}>
            Jadwal tugas dari tanggal mulai sampai deadline.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {Object.entries(ZOOMS).map(([id, z]) => (
              <button
                key={id}
                type="button"
                className={`k-chip${zoom === id ? ' on' : ''}`}
                onClick={() => setZoom(id)}
                style={{ padding: '7px 13px', fontSize: 12 }}
              >
                {z.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" className="k-btn" aria-label="Geser ke kiri" onClick={() => scrollBy(-1)} style={{ padding: 9 }}>
              <ChevronLeft size={15} />
            </button>
            <button type="button" className="k-btn" onClick={() => goToday(true)} style={{ padding: '9px 13px' }}>
              Hari ini
            </button>
            <button type="button" className="k-btn" aria-label="Geser ke kanan" onClick={() => scrollBy(1)} style={{ padding: 9 }}>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* LEGENDA */}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginBottom: 12, flexShrink: 0 }}>
        {[
          ['todo', 'To Do'],
          ['in-progress', 'On Progress'],
          ['done', 'Done'],
          ['backlog', 'Backlog'],
          ['late', 'Lewat deadline']
        ].map(([id, label]) => (
          <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--k-ink-2)', fontWeight: 500 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[id] }} />
            {label}
          </span>
        ))}
      </div>

      {/* CHART */}

      {isEmpty ? (
        <div className="k-panel" style={{ padding: '44px 20px', textAlign: 'center', color: 'var(--k-muted)', fontSize: 13 }}>
          <p style={{ margin: '0 0 14px' }}>Belum ada tugas di board ini.</p>
          <button type="button" className="k-btn k-btn-primary" onClick={onAddTask}>
            <Plus size={15} strokeWidth={2.2} /> Tambah tugas
          </button>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="k-panel kb-gantt"
          style={{ flex: 1, minHeight: 0, overflow: 'auto', background: '#fff', position: 'relative' }}
        >
          {/* HEADER */}

          <div
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 5,
              display: 'flex',
              width: LEFT_W + totalW,
              background: '#fff',
              borderBottom: '1px solid var(--k-line)'
            }}
          >
            <div
              className="k-eyebrow"
              style={{
                position: 'sticky',
                left: 0,
                zIndex: 6,
                width: LEFT_W,
                flexShrink: 0,
                height: MONTH_H + DAY_H,
                boxSizing: 'border-box',
                padding: '0 14px',
                display: 'flex',
                alignItems: 'flex-end',
                paddingBottom: 10,
                background: '#fff',
                borderRight: '1px solid var(--k-line)'
              }}
            >
              Tugas · {scheduled.length + unscheduled.length}
            </div>

            <div style={{ width: totalW }}>
              <div style={{ display: 'flex', height: MONTH_H, borderBottom: '1px solid var(--k-line-soft)' }}>
                {range.months.map((m, idx) => (
                  <div
                    key={`${m.label}-${idx}`}
                    style={{ width: m.n * dayW, flexShrink: 0, clipPath: 'inset(0)', borderRight: '1px solid var(--k-line-soft)', boxSizing: 'border-box' }}
                  >
                    <span
                      className="k-display"
                      style={{
                        position: 'sticky',
                        left: LEFT_W + 10,
                        display: 'inline-block',
                        lineHeight: `${MONTH_H}px`,
                        fontSize: 12.5,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        color: 'var(--k-ink)'
                      }}
                    >
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', height: DAY_H }}>
                {range.days.map((d) => {
                  const wide = zoom === 'minggu';
                  const showNum = wide || d.dow === 1 || d.date.getDate() === 1;

                  return (
                    <div
                      key={d.k}
                      style={{
                        width: dayW,
                        flexShrink: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                        color: d.weekend ? 'var(--k-faint)' : 'var(--k-muted)'
                      }}
                    >
                      {wide && <span style={{ fontSize: 9.5, fontWeight: 600 }}>{DOW[d.dow]}</span>}
                      <span
                        className="k-num"
                        style={{
                          minWidth: wide ? 22 : 0,
                          height: wide ? 22 : 'auto',
                          padding: wide ? 0 : '0 1px',
                          borderRadius: '50%',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: wide ? 12 : 10,
                          fontWeight: 600,
                          background: d.today ? 'var(--k-orange)' : 'transparent',
                          color: d.today ? '#fff' : 'inherit',
                          whiteSpace: 'nowrap',
                          overflow: 'visible'
                        }}
                      >
                        {showNum ? d.date.getDate() : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* BADAN */}

          <div style={{ position: 'relative', width: LEFT_W + totalW }}>
            {/* lapisan: garis kolom, akhir pekan, hari ini */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: LEFT_W,
                top: 0,
                bottom: 0,
                width: totalW,
                pointerEvents: 'none',
                zIndex: 0,
                backgroundImage:
                  zoom === 'minggu'
                    ? `linear-gradient(to right, transparent ${dayW - 1}px, var(--k-line-soft) ${dayW - 1}px)`
                    : 'none',
                backgroundSize: `${dayW}px 100%`
              }}
            >
              {range.days
                .filter((d) => d.weekend)
                .map((d) => (
                  <span
                    key={d.k}
                    style={{ position: 'absolute', top: 0, bottom: 0, left: d.i * dayW, width: dayW, background: 'rgba(60,50,20,0.035)' }}
                  />
                ))}

              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: todayIdx * dayW + dayW / 2 - 1,
                  width: 2,
                  background: 'var(--k-orange)',
                  opacity: 0.7
                }}
              />
            </div>

            {scheduled.map(({ q, start, end, milestone }) => {
              const late = q.status !== 'done' && end < today;
              const color = q.status === 'done' ? COLORS.done : late ? COLORS.late : COLORS[q.status] || COLORS.todo;

              const sIdx = diff(range.start, start);
              const eIdx = diff(range.start, end);
              const left = sIdx * dayW + 3;
              const width = (eIdx - sIdx + 1) * dayW - 6;
              const inside = width >= 96;

              let pct = 0;
              if (q.status === 'done') pct = 100;
              else if (start !== end) {
                pct = Math.max(0, Math.min(100, Math.round((diff(start, today) / diff(start, end)) * 100)));
              }

              const tip = `${q.title}\n${short(start)}${start !== end ? ` → ${short(end)}` : ''} · ${late ? 'Lewat deadline' : STATUS_LABEL[q.status] || 'Task'}`;

              return (
                <Row key={q.id} q={q} start={start} end={end} color={color} onOpenTask={onOpenTask}>
                  {milestone ? (
                    <>
                      <button
                        type="button"
                        title={tip}
                        onClick={() => onOpenTask(q)}
                        className="kb-gantt-bar"
                        style={{
                          position: 'absolute',
                          top: ROW_H / 2 - 8,
                          left: sIdx * dayW + dayW / 2 - 8,
                          width: 16,
                          height: 16,
                          padding: 0,
                          border: '2px solid #fff',
                          borderRadius: 3,
                          background: color,
                          transform: 'rotate(45deg)',
                          boxShadow: '0 1px 4px rgba(30,25,10,0.3)',
                          cursor: 'pointer'
                        }}
                      />
                      <span style={{ position: 'absolute', top: 0, left: sIdx * dayW + dayW / 2 + 16, lineHeight: `${ROW_H}px`, fontSize: 11.5, fontWeight: 600, color: 'var(--k-ink-2)', whiteSpace: 'nowrap' }}>
                        {q.title}
                      </span>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        title={tip}
                        onClick={() => onOpenTask(q)}
                        className="kb-gantt-bar"
                        style={{
                          position: 'absolute',
                          top: ROW_H / 2 - 15,
                          left,
                          width,
                          height: 30,
                          padding: '0 10px',
                          border: 'none',
                          borderRadius: 9,
                          background: color,
                          color: '#fff',
                          fontFamily: 'inherit',
                          fontSize: 11.5,
                          fontWeight: 600,
                          textAlign: 'left',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          cursor: 'pointer',
                          boxShadow: `0 3px 8px ${color}55`
                        }}
                      >
                        {inside ? q.title : ''}
                        <span
                          aria-hidden="true"
                          style={{ position: 'absolute', left: 0, bottom: 0, height: 3, width: `${pct}%`, background: 'rgba(255,255,255,0.7)' }}
                        />
                      </button>

                      {!inside && (
                        <span style={{ position: 'absolute', top: 0, left: left + width + 8, lineHeight: `${ROW_H}px`, fontSize: 11.5, fontWeight: 600, color: 'var(--k-ink-2)', whiteSpace: 'nowrap' }}>
                          {q.title}
                        </span>
                      )}
                    </>
                  )}
                </Row>
              );
            })}

            {unscheduled.length > 0 && (
              <>
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', height: 34, alignItems: 'center', background: '#faf9f5', borderTop: '1px solid var(--k-line)', borderBottom: '1px solid var(--k-line-soft)' }}>
                  <span className="k-eyebrow" style={{ position: 'sticky', left: 14 }}>
                    Belum dijadwalkan · {unscheduled.length}
                  </span>
                </div>

                {unscheduled.map((q) => (
                  <Row key={q.id} q={q} color={COLORS[q.status] || COLORS.todo} onOpenTask={onOpenTask}>
                    <span style={{ position: 'sticky', left: LEFT_W + 14, display: 'inline-block', lineHeight: `${ROW_H}px`, fontSize: 11.5, color: 'var(--k-faint)' }}>
                      Atur tanggal mulai dan deadline di detail tugas
                    </span>
                  </Row>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        .kb-gantt-bar { transition: filter .15s ease, transform .15s ease; }
        .kb-gantt-bar:hover { filter: brightness(1.07); }
        .kb-gantt-row:hover { background: rgba(249,115,22,0.04); }
        .kb-gantt-row:hover .kb-gantt-left { background: #fdfaf5; }
        .kb-gantt-title:hover { color: var(--k-orange-deep); }
      `}</style>
    </div>
  );
}

/* Satu baris: kolom kiri (menempel saat digeser) + area batang. */
function Row({ q, start, end, color, onOpenTask, children }) {
  const assignees = Array.isArray(q.assignees) ? q.assignees : [];

  return (
    <div
      className="kb-gantt-row"
      style={{ position: 'relative', zIndex: 1, display: 'flex', height: ROW_H, borderBottom: '1px solid var(--k-line-soft)' }}
    >
      <div
        className="kb-gantt-left"
        style={{
          position: 'sticky',
          left: 0,
          zIndex: 3,
          width: LEFT_W,
          flexShrink: 0,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 12px 0 14px',
          background: '#fff',
          borderRight: '1px solid var(--k-line)'
        }}
      >
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />

        <div style={{ minWidth: 0, flex: 1 }}>
          <button
            type="button"
            className="kb-gantt-title"
            onClick={() => onOpenTask(q)}
            style={{
              display: 'block',
              maxWidth: '100%',
              padding: 0,
              border: 'none',
              background: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--k-ink)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textDecoration: q.status === 'done' ? 'line-through' : 'none',
              textDecorationColor: 'var(--k-faint)'
            }}
          >
            {q.title}
          </button>

          <div style={{ fontSize: 11, color: 'var(--k-muted)', marginTop: 2 }}>
            {start ? `${short(start)}${start !== end ? ` → ${short(end)}` : ''}` : 'Tanpa jadwal'}
          </div>
        </div>

        <div style={{ display: 'flex', flexShrink: 0 }}>
          {assignees.slice(0, 2).map((p, i) => {
            const name = p.fullname || p.name || p.username || 'Anggota';

            return (
              <span
                key={p.id ?? p.user_id ?? i}
                title={name}
                style={{
                  width: 22,
                  height: 22,
                  marginLeft: i === 0 ? 0 : -6,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid #fff',
                  boxSizing: 'border-box',
                  background: ['#fde6d3', '#dbe8fb'][i % 2],
                  color: '#4a463c',
                  fontSize: 8.5,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {p.avatar ? (
                  <img src={p.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  initials(name)
                )}
              </span>
            );
          })}
        </div>
      </div>

      <div style={{ position: 'relative', flex: 1 }}>{children}</div>
    </div>
  );
}
