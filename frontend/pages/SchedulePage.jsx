import React, { useMemo, useState } from 'react';

import {
  CalendarDays,
  List,
  ChevronLeft,
  ChevronRight,
  Bell,
  Plus,
  Clock3,
  CircleCheck,
  CalendarClock,
  SlidersHorizontal
} from 'lucide-react';

const DAYS = [
  { key: 'mon', label: 'Sen', date: 19 },
  { key: 'tue', label: 'Sel', date: 20 },
  { key: 'wed', label: 'Rab', date: 21 },
  { key: 'thu', label: 'Kam', date: 22 },
  { key: 'fri', label: 'Jum', date: 23 },
  { key: 'sat', label: 'Sab', date: 24 },
  { key: 'sun', label: 'Min', date: 25 }
];

const HOURS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00'
];

const SCHEDULES = [
  {
    id: 1,
    day: 'mon',
    title: 'Design Landing Page',
    start: '09:00',
    end: '10:30',
    board: 'Desain',
    color: '#fff0e6',
    border: '#f97316'
  },
  {
    id: 2,
    day: 'tue',
    title: 'Riset Pengguna',
    start: '11:00',
    end: '12:00',
    board: 'Pemasaran',
    color: '#eaf3ff',
    border: '#3b82f6'
  },
  {
    id: 3,
    day: 'wed',
    title: 'Daily Standup',
    start: '08:30',
    end: '09:30',
    board: 'Umum',
    color: '#edf8ed',
    border: '#22c55e'
  },
  {
    id: 4,
    day: 'wed',
    title: 'Review Desain UI Dashboard',
    start: '13:00',
    end: '14:30',
    board: 'Desain',
    color: '#f4ecff',
    border: '#8b5cf6'
  },
  {
    id: 5,
    day: 'thu',
    title: 'Implementasi Fitur Login',
    start: '10:00',
    end: '12:00',
    board: 'Pengembangan',
    color: '#fff7df',
    border: '#f59e0b'
  },
  {
    id: 6,
    day: 'fri',
    title: 'Alpha Testing',
    start: '15:00',
    end: '17:00',
    board: 'Pengembangan',
    color: '#fff0f0',
    border: '#ef4444',
    deadline: true
  },
  {
    id: 7,
    day: 'sun',
    title: 'Update Konten Blog',
    start: '14:00',
    end: '15:30',
    board: 'Pemasaran',
    color: '#edf8ed',
    border: '#22c55e'
  }
];

function timeToMinutes(time) {
  const [hour, minute] = time.split(':').map(Number);

  return hour * 60 + minute;
}

function ScheduleCard({ item }) {
  const start = timeToMinutes(item.start);
  const end = timeToMinutes(item.end);

  const calendarStart = 8 * 60;
  const top = ((start - calendarStart) / 60) * 58;
  const height = ((end - start) / 60) * 58;

  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 8,
        right: 8,
        height: Math.max(height - 4, 52),
        background: item.color,
        borderLeft: `3px solid ${item.border}`,
        borderRadius: 8,
        padding: '9px 9px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform .15s ease, box-shadow .15s ease'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow =
          '0 4px 10px rgba(0,0,0,.08)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {item.deadline && (
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: '#ef4444',
            marginBottom: 3
          }}
        >
          DEADLINE
        </div>
      )}

      <div
        style={{
          fontSize: 11.5,
          fontWeight: 700,
          color: '#1e293b',
          lineHeight: 1.25
        }}
      >
        {item.title}
      </div>

      <div
        style={{
          fontSize: 10,
          color: '#475569',
          marginTop: 5
        }}
      >
        {item.start} - {item.end}
      </div>

      <div
        style={{
          fontSize: 9.5,
          color: item.border,
          marginTop: 4,
          fontWeight: 600
        }}
      >
        ● {item.board}
      </div>
    </div>
  );
}

function MiniCalendar() {
  const dates = [
    null,
    null,
    null,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    21,
    22,
    23,
    24,
    25,
    26,
    27,
    28,
    29,
    30,
    31
  ];

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e7e3dc',
        borderRadius: 14,
        padding: 18
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 18
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 700,
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: 7
          }}
        >
          <CalendarDays size={17} />
          Kalender Mini
        </h3>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 15
        }}
      >
        <button
          style={{
            width: 34,
            height: 34,
            border: '1px solid #e7e3dc',
            background: '#fff',
            borderRadius: 8,
            cursor: 'pointer'
          }}
        >
          <ChevronLeft size={16} />
        </button>

        <strong style={{ fontSize: 13 }}>
          Mei 2025
        </strong>

        <button
          style={{
            width: 34,
            height: 34,
            border: '1px solid #e7e3dc',
            background: '#fff',
            borderRadius: 8,
            cursor: 'pointer'
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 5,
          textAlign: 'center'
        }}
      >
        {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(
          (day) => (
            <div
              key={day}
              style={{
                fontSize: 10,
                color: '#94a3b8',
                paddingBottom: 5
              }}
            >
              {day}
            </div>
          )
        )}

        {dates.map((date, index) => (
          <div
            key={index}
            style={{
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              color:
                date === 21
                  ? '#fff'
                  : date === 24 || date === 25
                    ? date === 25
                      ? '#ef4444'
                      : '#3b82f6'
                    : '#334155',
              background:
                date === 21
                  ? '#f97316'
                  : 'transparent',
              borderRadius: '50%',
              fontWeight:
                date === 21 ? 700 : 400
            }}
          >
            {date}
          </div>
        ))}
      </div>
    </div>
  );
}

function Upcoming() {
  const items = [
    {
      title: 'Alpha Testing',
      date: '23 Mei 2025 • 15:00',
      label: 'Deadline',
      color: '#ef4444'
    },
    {
      title: 'Implementasi Fitur Login',
      date: '22 Mei 2025 • 10:00',
      label: 'Pengembangan',
      color: '#f59e0b'
    },
    {
      title: 'Daily Standup',
      date: '21 Mei 2025 • 08:30',
      label: 'Umum',
      color: '#22c55e'
    }
  ];

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e7e3dc',
        borderRadius: 14,
        padding: 18
      }}
    >
      <h3
        style={{
          margin: '0 0 12px',
          fontSize: 15,
          fontWeight: 700,
          color: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: 7
        }}
      >
        <CalendarDays size={17} />
        Upcoming (5)
      </h3>

      {items.map((item) => (
        <div
          key={item.title}
          style={{
            padding: '12px 0',
            borderTop: '1px solid #f1f5f9'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#1e293b'
                }}
              >
                {item.title}
              </div>

              <div
                style={{
                  fontSize: 10,
                  color: '#94a3b8',
                  marginTop: 4
                }}
              >
                {item.date}
              </div>
            </div>

            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: item.color,
                background: `${item.color}18`,
                padding: '5px 7px',
                borderRadius: 6,
                whiteSpace: 'nowrap'
              }}
            >
              {item.label}
            </span>
          </div>
        </div>
      ))}

      <button
        style={{
          marginTop: 8,
          border: 'none',
          background: 'transparent',
          color: '#f97316',
          fontSize: 11,
          fontWeight: 700,
          cursor: 'pointer'
        }}
      >
        Lihat semua jadwal →
      </button>
    </div>
  );
}

export default function SchedulePage() {
  const [view, setView] = useState('calendar');

  const totalDuration = useMemo(() => {
    return SCHEDULES.reduce((total, item) => {
      return (
        total +
        (timeToMinutes(item.end) -
          timeToMinutes(item.start))
      );
    }, 0);
  }, []);

  const hours = Math.floor(totalDuration / 60);
  const minutes = totalDuration % 60;

  return (
    <div
      style={{
        padding: '30px',
        maxWidth: 1250,
        margin: '0 auto',
        fontFamily: 'system-ui, sans-serif',
        color: '#1e293b'
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 24
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              color: '#94a3b8',
              marginBottom: 6
            }}
          >
            Home <span style={{ margin: '0 4px' }}>›</span>
            <span style={{ color: '#f97316' }}>
              Schedule
            </span>
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 27,
              fontWeight: 750,
              letterSpacing: '-0.5px'
            }}
          >
            Schedule
          </h1>

          <p
            style={{
              margin: '5px 0 0',
              color: '#94a3b8',
              fontSize: 13
            }}
          >
            Lihat dan kelola jadwal tugas, deadline, dan
            aktivitas tim.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}
        >
          <button
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: '1px solid #e7e3dc',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f97316'
            }}
          >
            <Bell size={17} />
          </button>

          <button
            style={{
              height: 42,
              padding: '0 18px',
              border: 'none',
              borderRadius: 10,
              background: '#f97316',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              cursor: 'pointer',
              boxShadow: '0 5px 12px rgba(249,115,22,.18)'
            }}
          >
            <Plus size={17} />
            Buat Jadwal Baru
          </button>
        </div>
      </div>

      {/* MAIN COLUMNS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 350px',
          gap: 20,
          alignItems: 'start'
        }}
      >
        {/* CALENDAR */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #e7e3dc',
            borderRadius: 14,
            overflow: 'hidden'
          }}
        >
          {/* CALENDAR TOOLBAR */}
          <div
            style={{
              height: 72,
              padding: '0 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #eeeae4'
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 8
              }}
            >
              <button
                onClick={() => setView('calendar')}
                style={{
                  height: 38,
                  padding: '0 14px',
                  border: 'none',
                  borderRadius: 9,
                  background:
                    view === 'calendar'
                      ? '#f97316'
                      : '#fff',
                  color:
                    view === 'calendar'
                      ? '#fff'
                      : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <CalendarDays size={16} />
                Kalender
              </button>

              <button
                onClick={() => setView('list')}
                style={{
                  height: 38,
                  padding: '0 14px',
                  border: '1px solid #e7e3dc',
                  borderRadius: 9,
                  background:
                    view === 'list'
                      ? '#f8f7f3'
                      : '#fff',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <List size={16} />
                Daftar
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <button
                style={{
                  width: 38,
                  height: 38,
                  border: '1px solid #e7e3dc',
                  borderRadius: 8,
                  background: '#fff'
                }}
              >
                <ChevronLeft size={17} />
              </button>

              <button
                style={{
                  height: 38,
                  padding: '0 15px',
                  border: '1px solid #e7e3dc',
                  borderRadius: 8,
                  background: '#fff',
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                Mei 2025
              </button>

              <button
                style={{
                  height: 38,
                  padding: '0 13px',
                  border: '1px solid #e7e3dc',
                  borderRadius: 8,
                  background: '#fff',
                  fontSize: 12
                }}
              >
                Hari Ini
              </button>

              <button
                style={{
                  width: 38,
                  height: 38,
                  border: '1px solid #e7e3dc',
                  borderRadius: 8,
                  background: '#fff'
                }}
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>

          {view === 'calendar' ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '62px repeat(7, 1fr)',
                minHeight: 600
              }}
            >
              {/* TIME COLUMN */}
              <div
                style={{
                  borderRight: '1px solid #eeeae4'
                }}
              >
                <div style={{ height: 62 }} />

                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    style={{
                      height: 58,
                      boxSizing: 'border-box',
                      paddingTop: 8,
                      paddingRight: 7,
                      textAlign: 'right',
                      fontSize: 10,
                      color: '#64748b',
                      borderTop: '1px solid #f1f5f9'
                    }}
                  >
                    {hour}
                  </div>
                ))}
              </div>

              {/* DAYS */}
              {DAYS.map((day) => (
                <div
                  key={day.key}
                  style={{
                    position: 'relative',
                    borderRight: '1px solid #eeeae4'
                  }}
                >
                  <div
                    style={{
                      height: 62,
                      borderBottom: '1px solid #eeeae4',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color:
                          day.key === 'wed'
                            ? '#f97316'
                            : '#334155'
                      }}
                    >
                      {day.label}
                    </span>

                    <span
                      style={{
                        width:
                          day.key === 'wed'
                            ? 28
                            : 'auto',
                        height:
                          day.key === 'wed'
                            ? 28
                            : 'auto',
                        borderRadius: '50%',
                        background:
                          day.key === 'wed'
                            ? '#f97316'
                            : 'transparent',
                        color:
                          day.key === 'wed'
                            ? '#fff'
                            : '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700
                      }}
                    >
                      {day.date}
                    </span>
                  </div>

                  <div
                    style={{
                      position: 'relative',
                      height: 580
                    }}
                  >
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        style={{
                          height: 58,
                          boxSizing: 'border-box',
                          borderTop:
                            '1px solid #f1f5f9'
                        }}
                      />
                    ))}

                    {SCHEDULES.filter(
                      (item) =>
                        item.day === day.key
                    ).map((item) => (
                      <ScheduleCard
                        key={item.id}
                        item={item}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 20 }}>
              {SCHEDULES.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: 15,
                    marginBottom: 10,
                    background: item.color,
                    borderLeft: `4px solid ${item.border}`,
                    borderRadius: 9
                  }}
                >
                  <strong
                    style={{
                      fontSize: 13
                    }}
                  >
                    {item.title}
                  </strong>

                  <div
                    style={{
                      fontSize: 11,
                      color: '#64748b',
                      marginTop: 5
                    }}
                  >
                    {item.start} - {item.end} ·{' '}
                    {item.board}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}
        >
          <MiniCalendar />

          {/* FILTER */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #e7e3dc',
              borderRadius: 14,
              padding: 18
            }}
          >
            <h3
              style={{
                margin: '0 0 14px',
                fontSize: 15,
                display: 'flex',
                alignItems: 'center',
                gap: 7
              }}
            >
              <SlidersHorizontal size={16} />
              Filter
            </h3>

            <select
              style={{
                width: '100%',
                height: 38,
                border: '1px solid #e7e3dc',
                borderRadius: 8,
                padding: '0 10px',
                marginBottom: 9,
                background: '#fff',
                fontSize: 11
              }}
            >
              <option>Semua Board</option>
              <option>Umum</option>
              <option>Desain</option>
              <option>Pemasaran</option>
              <option>Pengembangan</option>
            </select>

            <select
              style={{
                width: '100%',
                height: 38,
                border: '1px solid #e7e3dc',
                borderRadius: 8,
                padding: '0 10px',
                background: '#fff',
                fontSize: 11
              }}
            >
              <option>Semua Kategori</option>
              <option>Meeting</option>
              <option>Task</option>
              <option>Deadline</option>
            </select>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                marginTop: 13,
                fontSize: 11,
                color: '#64748b'
              }}
            >
              <input type="checkbox" />
              Hanya deadline
            </label>
          </div>

          <Upcoming />
        </div>
      </div>

      {/* SUMMARY */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(4, minmax(0, 1fr))',
          gap: 14,
          marginTop: 14
        }}
      >
        {[
          {
            icon: CalendarDays,
            value: SCHEDULES.length,
            label: 'Total Jadwal\nMinggu ini'
          },
          {
            icon: Clock3,
            value: `${hours}j ${minutes}m`,
            label: 'Total Durasi\nMinggu ini'
          },
          {
            icon: CircleCheck,
            value: 4,
            label: 'Selesai\nMinggu ini'
          },
          {
            icon: CalendarClock,
            value: 1,
            label: 'Deadline\nMendatang'
          }
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              style={{
                background: '#fff',
                border: '1px solid #e7e3dc',
                borderRadius: 13,
                padding: '15px 17px',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: '#fff0e6',
                  color: '#f97316',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Icon size={20} />
              </div>

              <div>
                <div
                  style={{
                    fontSize: 21,
                    fontWeight: 750,
                    lineHeight: 1
                  }}
                >
                  {item.value}
                </div>

                <div
                  style={{
                    fontSize: 10,
                    color: '#94a3b8',
                    marginTop: 4,
                    whiteSpace: 'pre-line'
                  }}
                >
                  {item.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}