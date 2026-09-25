import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

import {
  ClipboardList,
  CircleCheck,
  Clock3,
  FilePenLine,
  Package,
  CalendarDays,
  Timer,
  LayoutGrid,
  TrendingUp,
  TriangleAlert
} from 'lucide-react';

function formatTime(seconds) {
  const s = Number(seconds) || 0;

  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);

  if (h > 0) {
    return `${h}j ${m}m`;
  }

  return `${m}m ${s % 60}d`;
}


/* =========================================================
   STAT CARD
   ========================================================= */

function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = '#f97316',
  iconBackground = '#fff1e7',
  smallText
}) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e8e5df',
        borderRadius: 14,
        padding: '16px 18px',
        minHeight: 106,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flex: '1 1 170px'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: iconBackground,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Icon
            size={18}
            strokeWidth={1.8}
            color={iconColor}
          />
        </div>

        <span
          style={{
            fontSize: 10,
            color: '#9a9892',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '.4px'
          }}
        >
          {label}
        </span>
      </div>

      <div>
        <div
          style={{
            fontSize: 25,
            fontWeight: 700,
            lineHeight: 1,
            color: '#171717',
            marginBottom: 5
          }}
        >
          {value}
        </div>

        {smallText && (
          <div
            style={{
              fontSize: 11,
              color: '#9a9892'
            }}
          >
            {smallText}
          </div>
        )}
      </div>
    </div>
  );
}


/* =========================================================
   BOARD PROGRESS
   ========================================================= */

function BoardProgress({ board }) {
  const total = Number(board.total) || 0;
  const done = Number(board.done) || 0;

  const percentage =
    total > 0
      ? Math.round((done / total) * 100)
      : 0;

  return (
    <div
      style={{
        marginBottom: 18
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 7
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            minWidth: 0
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: '#fff1e7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <LayoutGrid
              size={13}
              color="#f97316"
              strokeWidth={2}
            />
          </div>

          <span
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: '#292929',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {board.name}
          </span>
        </div>

        <span
          style={{
            fontSize: 11,
            color: '#8f8c85',
            whiteSpace: 'nowrap'
          }}
        >
          {done}/{total}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}
      >
        <div
          style={{
            height: 7,
            flex: 1,
            borderRadius: 10,
            background: '#ebe9e4',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              width: `${percentage}%`,
              height: '100%',
              borderRadius: 10,
              background: '#f97316',
              transition: 'width .3s ease'
            }}
          />
        </div>

        <span
          style={{
            width: 32,
            textAlign: 'right',
            fontSize: 11,
            fontWeight: 600,
            color: '#66635d'
          }}
        >
          {percentage}%
        </span>
      </div>
    </div>
  );
}


/* =========================================================
   RECENT COMPLETED ITEM
   ========================================================= */

function RecentTask({ task }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '11px 0',
        borderBottom: '1px solid #efede8'
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 9,
          background: '#edf8ef',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <CircleCheck
          size={16}
          color="#16a34a"
          strokeWidth={2}
        />
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0
        }}
      >
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: '#292929',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {task.title}
        </div>

        <div
          style={{
            fontSize: 10.5,
            color: '#9a9892',
            marginTop: 3
          }}
        >
          Tugas selesai
        </div>
      </div>

      <span
        style={{
          fontSize: 10.5,
          color: '#9a9892',
          whiteSpace: 'nowrap'
        }}
      >
        {task.completed_at
          ? new Date(
              task.completed_at
            ).toLocaleDateString('id-ID')
          : '-'}
      </span>
    </div>
  );
}


/* =========================================================
   STATS PAGE
   ========================================================= */

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getStats()
      .then(setStats)
      .catch((err) => {
        setError(
          err.message ||
          'Gagal memuat statistik'
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  /* =======================================================
     LOADING
     ======================================================= */

  if (loading) {
    return (
      <div
        style={{
          padding: 30,
          color: '#8f8c85',
          fontFamily: 'system-ui, sans-serif'
        }}
      >
        Memuat statistik...
      </div>
    );
  }


  /* =======================================================
     ERROR
     ======================================================= */

  if (error) {
    return (
      <div
        style={{
          padding: 30,
          fontFamily: 'system-ui, sans-serif'
        }}
      >
        <div
          style={{
            maxWidth: 600,
            background: '#fff5f5',
            border: '1px solid #f3d0d0',
            borderRadius: 12,
            padding: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            color: '#b91c1c',
            fontSize: 13
          }}
        >
          <TriangleAlert size={17} />
          {error}
        </div>
      </div>
    );
  }


  const s = stats || {};

  const totalTasks = Number(
    s.total_tasks || 0
  );

  const completedTasks = Number(
    s.completed_tasks || 0
  );

  const inProgressTasks = Number(
    s.in_progress_tasks || 0
  );

  const todoTasks = Number(
    s.todo_tasks || 0
  );

  const backlogTasks = Number(
    s.backlog_tasks || 0
  );

  const completionRate = Number(
    s.completion_rate || 0
  );


  return (
    <div
      style={{
        padding: '26px 22px 40px',
        maxWidth: 1100,
        margin: '0 auto',
        boxSizing: 'border-box',
        fontFamily: 'system-ui, sans-serif',
        color: '#171717'
      }}
    >

      {/* ===================================================
          HEADER
          =================================================== */}

      <div
        style={{
          marginBottom: 23
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: '#aaa69f',
            marginBottom: 7
          }}
        >
          Home
          <span
            style={{
              margin: '0 5px'
            }}
          >
            ›
          </span>
          <span
            style={{
              color: '#f97316'
            }}
          >
            Statistik Tim
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 20
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 26,
                lineHeight: 1.15,
                fontWeight: 700,
                letterSpacing: '-.5px',
                color: '#171717'
              }}
            >
              Statistik Tim
            </h1>

            <p
              style={{
                margin: '6px 0 0',
                fontSize: 12.5,
                color: '#9a9892'
              }}
            >
              Ringkasan performa tugas di seluruh
              board Anda.
            </p>
          </div>
        </div>
      </div>


      {/* ===================================================
          MAIN STATS
          =================================================== */}

      <div
        style={{
          display: 'flex',
          gap: 14,
          flexWrap: 'wrap',
          marginBottom: 22
        }}
      >
        <StatCard
          label="Task"
          value={totalTasks}
          icon={ClipboardList}
          iconColor="#f97316"
          iconBackground="#fff1e7"
          smallText="Total seluruh tugas"
        />

        <StatCard
          label="Done"
          value={completedTasks}
          icon={CircleCheck}
          iconColor="#16a34a"
          iconBackground="#edf8ef"
          smallText="Tugas selesai"
        />

        <StatCard
          label="On Progress"
          value={inProgressTasks}
          icon={Clock3}
          iconColor="#d97706"
          iconBackground="#fff7e8"
          smallText="Sedang dikerjakan"
        />

        <StatCard
          label="To Do"
          value={todoTasks}
          icon={FilePenLine}
          iconColor="#0ea5e9"
          iconBackground="#edf8fd"
          smallText="Siap dikerjakan"
        />

        <StatCard
          label="Backlog"
          value={backlogTasks}
          icon={Package}
          iconColor="#73706a"
          iconBackground="#f1f0ed"
          smallText="Belum diproses"
        />
      </div>


      {/* ===================================================
          SECONDARY STATS
          =================================================== */}

      <div
        style={{
          display: 'flex',
          gap: 14,
          flexWrap: 'wrap',
          marginBottom: 22
        }}
      >

        <StatCard
          label="Minggu Ini"
          value={s.completed_this_week ?? 0}
          icon={CalendarDays}
          iconColor="#f97316"
          iconBackground="#fff1e7"
          smallText="Task selesai minggu ini"
        />

        <StatCard
          label="Waktu"
          value={formatTime(
            s.total_time_tracked
          )}
          icon={Timer}
          iconColor="#7a8560"
          iconBackground="#f1f3e9"
          smallText="Total waktu dilacak"
        />

        <StatCard
          label="Board"
          value={s.boards_count ?? 0}
          icon={LayoutGrid}
          iconColor="#7a8560"
          iconBackground="#f1f3e9"
          smallText="Jumlah board"
        />

      </div>


      {/* ===================================================
          COMPLETION RATE
          =================================================== */}

      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e8e5df',
          borderRadius: 14,
          padding: 18,
          marginBottom: 22,
          boxSizing: 'border-box'
        }}
      >

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 9
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 9,
                background: '#fff1e7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <TrendingUp
                size={16}
                color="#f97316"
                strokeWidth={1.9}
              />
            </div>

            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#292929'
                }}
              >
                Tingkat Penyelesaian
              </div>

              <div
                style={{
                  fontSize: 10.5,
                  color: '#9a9892',
                  marginTop: 2
                }}
              >
                Persentase tugas yang sudah selesai
              </div>
            </div>
          </div>

          <span
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: '#f97316'
            }}
          >
            {completionRate}%
          </span>
        </div>


        <div
          style={{
            height: 9,
            borderRadius: 20,
            background: '#eceae5',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              width: `${Math.min(
                100,
                Math.max(0, completionRate)
              )}%`,
              height: '100%',
              background: '#f97316',
              borderRadius: 20,
              transition: 'width .4s ease'
            }}
          />
        </div>

      </div>


      {/* ===================================================
          LOWER CONTENT
          =================================================== */}

      <div
        style={{
          display: 'flex',
          gap: 18,
          flexWrap: 'wrap'
        }}
      >

        {/* =================================================
            PER BOARD
            ================================================= */}

        <div
          style={{
            flex: '1 1 420px',
            background: '#ffffff',
            border: '1px solid #e8e5df',
            borderRadius: 14,
            padding: 18,
            boxSizing: 'border-box'
          }}
        >

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 18
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#292929'
                }}
              >
                Progress Board
              </h3>

              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: 10.5,
                  color: '#9a9892'
                }}
              >
                Perbandingan tugas yang telah selesai
              </p>
            </div>

            <LayoutGrid
              size={18}
              color="#b0ada6"
              strokeWidth={1.7}
            />
          </div>


          {(!s.per_board ||
            s.per_board.length === 0) ? (

            <div
              style={{
                padding: '25px 0',
                textAlign: 'center',
                color: '#aaa69f',
                fontSize: 12
              }}
            >
              Belum ada board.
            </div>

          ) : (

            s.per_board.map((board) => (
              <BoardProgress
                key={board.board_id}
                board={board}
              />
            ))

          )}

        </div>


        {/* =================================================
            RECENT COMPLETED
            ================================================= */}

        <div
          style={{
            flex: '1 1 420px',
            background: '#ffffff',
            border: '1px solid #e8e5df',
            borderRadius: 14,
            padding: 18,
            boxSizing: 'border-box'
          }}
        >

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 7
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#292929'
                }}
              >
                Baru Selesai
              </h3>

              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: 10.5,
                  color: '#9a9892'
                }}
              >
                Lima tugas terakhir yang diselesaikan
              </p>
            </div>

            <CircleCheck
              size={18}
              color="#16a34a"
              strokeWidth={1.8}
            />
          </div>


          {(!s.recent_completed ||
            s.recent_completed.length === 0) ? (

            <div
              style={{
                padding: '30px 0',
                textAlign: 'center',
                color: '#aaa69f',
                fontSize: 12
              }}
            >
              Belum ada tugas yang selesai.
            </div>

          ) : (

            s.recent_completed.map((task) => (
              <RecentTask
                key={task.id}
                task={task}
              />
            ))

          )}

        </div>

      </div>

    </div>
  );
}