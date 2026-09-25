import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

import {
  Folder,
  CircleCheck,
  Clock3,
  FilePenLine,
  Package,
  CalendarDays,
  Hourglass,
  Pin,
  TriangleAlert
} from 'lucide-react';

function formatTime(s) {
  s = Number(s) || 0;

  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);

  if (h > 0) return `${h}j ${m}m`;

  return `${m}m ${s % 60}d`;
}

function StatCard({ label, value, color, icon: Icon }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 14,
        padding: '18px 20px',
        border: '1px solid #f1f5f9',
        boxShadow:
          '0 4px 6px -1px rgba(0,0,0,0.04)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flex: '1 1 180px'
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: `${color}1a`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <Icon
          size={20}
          strokeWidth={2}
          color={color}
        />
      </div>

      <div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: '#1e293b',
            lineHeight: 1.1
          }}
        >
          {value}
        </div>

        <div
          style={{
            fontSize: 12,
            color: '#64748b',
            marginTop: 2
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getStats()
      .then(setStats)
      .catch((err) =>
        setError(err.message || 'Gagal memuat statistik')
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: 'center',
          color: '#64748b',
          fontFamily: 'system-ui'
        }}
      >
        Memuat statistik...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: 30,
          fontFamily: 'system-ui'
        }}
      >
        <div
          style={{
            backgroundColor: '#fef2f2',
            color: '#b91c1c',
            padding: 12,
            borderRadius: 8,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <TriangleAlert size={17} />
          {error}
        </div>
      </div>
    );
  }

  const s = stats || {};
  const rate = s.completion_rate ?? 0;

  return (
    <div
      style={{
        padding: '30px',
        maxWidth: 1100,
        margin: '0 auto',
        fontFamily: 'system-ui, sans-serif'
      }}
    >
      <h1
        style={{
          fontSize: 26,
          fontWeight: 700,
          margin: 0,
          color: '#1e293b'
        }}
      >
        Stats
      </h1>

      <p
        style={{
          fontSize: 14,
          color: '#64748b',
          margin: '4px 0 24px 0'
        }}
      >
        Ringkasan performa tugas di seluruh board kamu.
      </p>

      {/* Main statistics */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 24
        }}
      >
        <StatCard
          label="Total Tugas"
          value={s.total_tasks ?? 0}
          color="#667eea"
          icon={Folder}
        />

        <StatCard
          label="Selesai"
          value={s.completed_tasks ?? 0}
          color="#16a34a"
          icon={CircleCheck}
        />

        <StatCard
          label="Sedang Dikerjakan"
          value={s.in_progress_tasks ?? 0}
          color="#d97706"
          icon={Clock3}
        />

        <StatCard
          label="To Do"
          value={s.todo_tasks ?? 0}
          color="#0ea5e9"
          icon={FilePenLine}
        />

        <StatCard
          label="Backlog"
          value={s.backlog_tasks ?? 0}
          color="#64748b"
          icon={Package}
        />
      </div>

      {/* Secondary statistics */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 24
        }}
      >
        <StatCard
          label="Selesai Minggu Ini"
          value={s.completed_this_week ?? 0}
          color="#7a8560"
          icon={CalendarDays}
        />

        <StatCard
          label="Total Waktu Dilacak"
          value={formatTime(s.total_time_tracked)}
          color="#7a8560"
          icon={Hourglass}
        />

        <StatCard
          label="Jumlah Board"
          value={s.boards_count ?? 0}
          color="#7a8560"
          icon={Pin}
        />
      </div>

      {/* Completion rate */}
      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          padding: 20,
          border: '1px solid #f1f5f9',
          marginBottom: 24
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 8
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#1e293b'
            }}
          >
            Tingkat Penyelesaian
          </span>

          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#16a34a'
            }}
          >
            {rate}%
          </span>
        </div>

        <div
          style={{
            height: 10,
            borderRadius: 6,
            background: '#f1f5f9',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              width: `${rate}%`,
              height: '100%',
              background:
                'linear-gradient(90deg,#16a34a,#22c55e)',
              transition: 'width .3s'
            }}
          />
        </div>
      </div>

      {/* Bottom sections */}
      <div
        style={{
          display: 'flex',
          gap: 20,
          flexWrap: 'wrap'
        }}
      >
        {/* Per board */}
        <div
          style={{
            flex: '1 1 320px',
            background: '#fff',
            borderRadius: 14,
            padding: 20,
            border: '1px solid #f1f5f9'
          }}
        >
          <h3
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#1e293b',
              margin: '0 0 14px 0'
            }}
          >
            Per Board
          </h3>

          {(!s.per_board ||
            s.per_board.length === 0) ? (
            <p
              style={{
                fontSize: 13,
                color: '#94a3b8',
                margin: 0
              }}
            >
              Belum ada board.
            </p>
          ) : (
            s.per_board.map((b) => {
              const pct =
                b.total > 0
                  ? Math.round(
                      (b.done / b.total) * 100
                    )
                  : 0;

              return (
                <div
                  key={b.board_id}
                  style={{
                    marginBottom: 12
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent:
                        'space-between',
                      fontSize: 12,
                      marginBottom: 4
                    }}
                  >
                    <span
                      style={{
                        color: '#334155',
                        fontWeight: 500
                      }}
                    >
                      {b.name}
                    </span>

                    <span
                      style={{
                        color: '#64748b'
                      }}
                    >
                      {b.done}/{b.total} selesai
                    </span>
                  </div>

                  <div
                    style={{
                      height: 7,
                      borderRadius: 4,
                      background: '#f1f5f9',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: '#667eea'
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Recently completed */}
        <div
          style={{
            flex: '1 1 320px',
            background: '#fff',
            borderRadius: 14,
            padding: 20,
            border: '1px solid #f1f5f9'
          }}
        >
          <h3
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#1e293b',
              margin: '0 0 14px 0'
            }}
          >
            Baru Selesai
          </h3>

          {(!s.recent_completed ||
            s.recent_completed.length === 0) ? (
            <p
              style={{
                fontSize: 13,
                color: '#94a3b8',
                margin: 0
              }}
            >
              Belum ada tugas yang selesai.
            </p>
          ) : (
            s.recent_completed.map((t) => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 0',
                  borderBottom:
                    '1px solid #f1f5f9',
                  fontSize: 13
                }}
              >
                <CircleCheck
                  size={16}
                  color="#16a34a"
                  strokeWidth={2}
                />

                <span
                  style={{
                    color: '#334155',
                    flex: 1
                  }}
                >
                  {t.title}
                </span>

                <span
                  style={{
                    color: '#94a3b8',
                    fontSize: 11
                  }}
                >
                  {t.completed_at
                    ? new Date(
                        t.completed_at
                      ).toLocaleDateString(
                        'id-ID'
                      )
                    : ''}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}