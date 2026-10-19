import React, { useEffect, useMemo, useState } from "react";
import { api } from "../utils/api.js";

import {
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Circle,
  LoaderCircle,
  CalendarX2,
} from "lucide-react";

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const DAYS = [
  "Min",
  "Sen",
  "Sel",
  "Rab",
  "Kam",
  "Jum",
  "Sab",
];

// ============================================================
// DATE HELPERS
// ============================================================

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeDate(dateValue) {
  if (!dateValue) return null;

  const value = String(dateValue);

  // YYYY-MM-DD
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  // Fallback ISO datetime
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return formatDateKey(date);
}

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  return days;
}

// ============================================================
// WARNA PER BOARD + PRIORITAS
// ============================================================

const BOARD_COLORS = [
  "#f97316",
  "#3b73d8",
  "#2f9e5f",
  "#a24fc4",
  "#d6453d",
  "#0f8fa0",
  "#c9951a",
];

function boardColor(boardId) {
  const n = Number(boardId);
  const seed = Number.isFinite(n)
    ? n
    : String(boardId || "")
        .split("")
        .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);

  return BOARD_COLORS[Math.abs(seed) % BOARD_COLORS.length];
}

const PRIORITY_LABEL = {
  "sangat-tinggi": "Sangat tinggi",
  tinggi: "Tinggi",
  sedang: "Sedang",
  rendah: "Rendah",
  "sangat-rendah": "Sangat rendah",
};

function priorityTone(priority) {
  if (priority === "sangat-tinggi" || priority === "tinggi") {
    return { background: "#fdecea", color: "#b42318" };
  }
  if (priority === "rendah" || priority === "sangat-rendah") {
    return { background: "#eaf1fb", color: "#2f5fb3" };
  }
  return { background: "#fdf3e1", color: "#a8661a" };
}

// ============================================================
// STATUS
// ============================================================

function getStatusLabel(status) {
  switch (status) {
    case "todo":
    case "backlog":
      return "To Do";

    case "in-progress":
      return "In Progress";

    case "done":
      return "Done";

    default:
      return status || "Task";
  }
}

// ============================================================
// BOARD NAME HELPER
// ============================================================

function getBoardName(board) {
  return (
    board?.name ||
    board?.title ||
    board?.board_name ||
    "Board"
  );
}

// ============================================================
// MAIN
// ============================================================

export default function SchedulePage({ boardId, boardName }) {
  const today = new Date();

  const [currentDate, setCurrentDate] = useState(
    new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    )
  );

  const [selectedDate, setSelectedDate] = useState(
    formatDateKey(today)
  );

  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // ==========================================================
  // LOAD TASKS
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    const loadTasks = async () => {
      try {
        setLoading(true);
        setError("");

        // ====================================================
        // CASE 1
        // Schedule dibuka dari board tertentu
        // ====================================================

        if (boardId) {
          const data = await api.getTasks(boardId);

          if (cancelled) return;

          const normalized = (data || []).map((task) => ({
            ...task,

            due_date: normalizeDate(task.due_date),

            board_id:
              task.board_id ?? boardId,

            board_name:
              task.board_name ??
              boardName ??
              "Board",
          }));

          setTasks(normalized);

          console.log(
            "[Schedule] Task dari board:",
            boardId,
            normalized
          );

          return;
        }

        // ====================================================
        // CASE 2
        // Schedule dari menu utama
        // Ambil semua board
        // ====================================================

        const boardsResponse =
          await api.getBoards();

        if (cancelled) return;

        const boards = Array.isArray(
          boardsResponse
        )
          ? boardsResponse
          : Array.isArray(
              boardsResponse?.data
            )
          ? boardsResponse.data
          : [];

        console.log(
          "[Schedule] Semua board:",
          boards
        );

        if (boards.length === 0) {
          setTasks([]);
          return;
        }

        // ====================================================
        // Ambil task semua board secara paralel
        // ====================================================

        const results = await Promise.all(
          boards.map(async (board) => {
            try {
              const boardTasks =
                await api.getTasks(board.id);

              return (boardTasks || []).map(
                (task) => ({
                  ...task,

                  due_date:
                    normalizeDate(
                      task.due_date
                    ),

                  board_id:
                    task.board_id ??
                    board.id,

                  board_name:
                    task.board_name ??
                    getBoardName(board),
                })
              );
            } catch (boardError) {
              console.error(
                `Gagal mengambil task board ${board.id}:`,
                boardError
              );

              return [];
            }
          })
        );

        if (cancelled) return;

        const allTasks = results.flat();

        console.log(
          "[Schedule] Semua task:",
          allTasks
        );

        setTasks(allTasks);
      } catch (error) {
        if (cancelled) return;

        console.error(
          "Gagal mengambil task untuk Schedule:",
          error
        );

        setTasks([]);

        setError(
          error?.message ||
            "Gagal mengambil data task."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadTasks();

    return () => {
      cancelled = true;
    };
  }, [boardId, boardName]);

  // ==========================================================
  // CALENDAR
  // ==========================================================

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(
    () =>
      getCalendarDays(
        year,
        month
      ),
    [year, month]
  );

  const previousMonth = () => {
    setCurrentDate(
      new Date(
        year,
        month - 1,
        1
      )
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(
        year,
        month + 1,
        1
      )
    );
  };

  const goToday = () => {
    const now = new Date();

    setCurrentDate(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      )
    );

    setSelectedDate(
      formatDateKey(now)
    );
  };

  // ==========================================================
  // GROUP TASK BY DATE
  // ==========================================================

  const tasksByDate = useMemo(() => {
    const grouped = {};

    tasks.forEach((task) => {
      const dateKey =
        normalizeDate(
          task.due_date
        );

      if (!dateKey) return;

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }

      grouped[dateKey].push(task);
    });

    return grouped;
  }, [tasks]);

  const selectedTasks =
    tasksByDate[selectedDate] || [];

  // ==========================================================
  // RENDER
  // ==========================================================

  const todayKey = formatDateKey(today);

  const cells = [...calendarDays];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedLabel = new Date(`${selectedDate}T00:00:00`).toLocaleDateString(
    "id-ID",
    { weekday: "long", day: "numeric", month: "long", year: "numeric" }
  );

  const upcoming = useMemo(
    () =>
      tasks
        .filter(
          (t) =>
            t.due_date && t.due_date >= todayKey && t.status !== "done"
        )
        .sort((a, b) => a.due_date.localeCompare(b.due_date))
        .slice(0, 5),
    [tasks, todayKey]
  );

  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthTasks = tasks.filter(
    (t) => t.due_date && t.due_date.startsWith(monthPrefix)
  );
  const monthDone = monthTasks.filter((t) => t.status === "done").length;

  const boardLegend = useMemo(() => {
    const seen = new Map();
    tasks.forEach((t) => {
      if (!seen.has(t.board_id)) seen.set(t.board_id, t.board_name);
    });
    return [...seen.entries()];
  }, [tasks]);

  const StatusIcon = ({ status }) =>
    status === "done" ? (
      <CircleCheck size={17} color="#2f9e5f" />
    ) : status === "in-progress" ? (
      <LoaderCircle size={17} color="#f97316" />
    ) : (
      <Circle size={17} color="#b9b5a8" />
    );

  return (
    <div className="k-page" style={{ padding: "26px 34px 56px" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        {/* HEADER */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          <div>
            <div className="k-eyebrow" style={{ marginBottom: 4 }}>
              {boardName ? `Board ${boardName}` : "Semua board"}
            </div>
            <h1
              className="k-display"
              style={{ margin: 0, fontSize: 34, fontWeight: 600, lineHeight: 1.05 }}
            >
              {MONTHS[month]}{" "}
              <span style={{ color: "var(--k-faint)" }}>{year}</span>
            </h1>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--k-muted)" }}>
              {monthTasks.length === 0
                ? "Tidak ada deadline bulan ini."
                : `${monthTasks.length} deadline bulan ini, ${monthDone} sudah selesai.`}
            </p>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="k-btn"
              onClick={previousMonth}
              aria-label="Bulan sebelumnya"
              style={{ padding: 10 }}
            >
              <ChevronLeft size={16} />
            </button>
            <button type="button" className="k-btn" onClick={goToday}>
              Hari ini
            </button>
            <button
              type="button"
              className="k-btn"
              onClick={nextMonth}
              aria-label="Bulan berikutnya"
              style={{ padding: 10 }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: "10px 14px",
              background: "#fff1f0",
              border: "1px solid #fbd0cc",
              borderRadius: 10,
              color: "#b42318",
              fontSize: 12.5,
            }}
          >
            {error}
          </div>
        )}

        <div
          className="k-split"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 320px",
            gap: 20,
            alignItems: "start",
          }}
        >
          {/* KALENDER */}

          <div>
            <div className="k-panel" style={{ overflow: "hidden" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                  borderBottom: "1px solid var(--k-line)",
                  background: "#faf9f5",
                }}
              >
                {DAYS.map((d) => (
                  <div
                    key={d}
                    className="k-eyebrow"
                    style={{ padding: "10px 0", textAlign: "center" }}
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                }}
              >
                {cells.map((day, index) => {
                  if (!day) {
                    return <div key={`e-${index}`} className="k-cal-cell out" />;
                  }

                  const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const dayTasks = tasksByDate[key] || [];
                  const isToday = key === todayKey;
                  const isSelected = key === selectedDate;

                  return (
                    <button
                      type="button"
                      key={key}
                      className={`k-cal-cell${isSelected ? " sel" : ""}`}
                      onClick={() => setSelectedDate(key)}
                    >
                      <span
                        className="k-num"
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12.5,
                          fontWeight: 600,
                          background: isToday ? "var(--k-orange)" : "transparent",
                          color: isToday ? "#fff" : "var(--k-ink-2)",
                        }}
                      >
                        {day}
                      </span>

                      {dayTasks.slice(0, 3).map((task) => {
                        const color = boardColor(task.board_id);
                        const isDone = task.status === "done";

                        return (
                          <span
                            key={`${task.board_id}-${task.id}`}
                            className="k-cal-pill"
                            title={`${task.title} · ${task.board_name}`}
                            style={{
                              borderLeftColor: color,
                              background: `${color}1a`,
                              color: "var(--k-ink)",
                              opacity: isDone ? 0.5 : 1,
                              textDecoration: isDone ? "line-through" : "none",
                            }}
                          >
                            {task.title}
                          </span>
                        );
                      })}

                      {dayTasks.length > 3 && (
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 600,
                            color: "var(--k-muted)",
                            paddingLeft: 2,
                          }}
                        >
                          +{dayTasks.length - 3} lagi
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {boardLegend.length > 1 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px 18px",
                  marginTop: 14,
                }}
              >
                {boardLegend.map(([id, name]) => (
                  <span
                    key={id}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                      fontSize: 12,
                      color: "var(--k-ink-2)",
                    }}
                  >
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: 3,
                        background: boardColor(id),
                      }}
                    />
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* AGENDA */}

          <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <section className="k-panel" style={{ padding: "20px 20px 14px" }}>
              <div className="k-eyebrow">Agenda</div>
              <h2
                className="k-display"
                style={{
                  margin: "4px 0 14px",
                  fontSize: 20,
                  fontWeight: 600,
                  textTransform: "capitalize",
                }}
              >
                {selectedLabel}
              </h2>

              {loading ? (
                <p style={{ fontSize: 12.5, color: "var(--k-muted)" }}>
                  Memuat jadwal...
                </p>
              ) : selectedTasks.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px 0 10px",
                    color: "var(--k-muted)",
                    fontSize: 12.5,
                  }}
                >
                  <CalendarX2 size={22} style={{ marginBottom: 6, opacity: 0.6 }} />
                  <div>Tidak ada deadline pada tanggal ini.</div>
                </div>
              ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {selectedTasks.map((task) => {
                    const color = boardColor(task.board_id);
                    const tone = priorityTone(task.priority);
                    const isDone = task.status === "done";

                    return (
                      <li
                        key={`${task.board_id}-${task.id}`}
                        style={{
                          display: "flex",
                          gap: 11,
                          padding: "12px 0",
                          borderTop: "1px solid var(--k-line-soft)",
                        }}
                      >
                        <span style={{ marginTop: 1 }}>
                          <StatusIcon status={task.status} />
                        </span>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontSize: 13.5,
                              fontWeight: 600,
                              lineHeight: 1.35,
                              wordBreak: "break-word",
                              textDecoration: isDone ? "line-through" : "none",
                              color: isDone ? "var(--k-muted)" : "var(--k-ink)",
                            }}
                          >
                            {task.title}
                          </div>

                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              alignItems: "center",
                              gap: 8,
                              marginTop: 6,
                            }}
                          >
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                fontSize: 11.5,
                                color: "var(--k-muted)",
                              }}
                            >
                              <span
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: 2,
                                  background: color,
                                }}
                              />
                              {task.board_name}
                            </span>

                            <span
                              style={{
                                fontSize: 10.5,
                                fontWeight: 700,
                                padding: "2px 7px",
                                borderRadius: 5,
                                ...tone,
                              }}
                            >
                              {PRIORITY_LABEL[task.priority] || "Sedang"}
                            </span>

                            <span style={{ fontSize: 11, color: "var(--k-faint)" }}>
                              {getStatusLabel(task.status)}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="k-panel" style={{ padding: "18px 20px 8px" }}>
              <h3
                className="k-display"
                style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 600 }}
              >
                Deadline berikutnya
              </h3>

              {upcoming.length === 0 ? (
                <p
                  style={{
                    fontSize: 12.5,
                    color: "var(--k-muted)",
                    margin: "0 0 12px",
                  }}
                >
                  Tidak ada deadline mendatang.
                </p>
              ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {upcoming.map((task) => (
                    <li key={`${task.board_id}-${task.id}`}>
                      <button
                        type="button"
                        className="k-row-hover"
                        onClick={() => {
                          const d = new Date(`${task.due_date}T00:00:00`);
                          setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
                          setSelectedDate(task.due_date);
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "9px 4px",
                          background: "none",
                          border: "none",
                          borderTop: "1px solid var(--k-line-soft)",
                          cursor: "pointer",
                          textAlign: "left",
                          fontFamily: "inherit",
                        }}
                      >
                        <span
                          style={{
                            width: 3,
                            alignSelf: "stretch",
                            borderRadius: 2,
                            background: boardColor(task.board_id),
                          }}
                        />
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span
                            style={{
                              display: "block",
                              fontSize: 12.5,
                              fontWeight: 600,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {task.title}
                          </span>
                          <span style={{ fontSize: 11, color: "var(--k-muted)" }}>
                            {new Date(`${task.due_date}T00:00:00`).toLocaleDateString(
                              "id-ID",
                              { day: "numeric", month: "short" }
                            )}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
