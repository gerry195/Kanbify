import React, { useEffect, useMemo, useState } from "react";
import { api } from "../utils/api.js";

import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock3,
  CircleCheck,
  Circle,
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
// PRIORITY
// ============================================================

function getPriorityStyle(priority) {
  switch (priority) {
    case "tinggi":
      return {
        background: "#fee2e2",
        color: "#b91c1c",
      };

    case "rendah":
      return {
        background: "#f1f5f9",
        color: "#475569",
      };

    default:
      return {
        background: "#ffedd5",
        color: "#c2410c",
      };
  }
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

  return (
    <div
      style={{
        minHeight: "100%",
        background: "#f4f3ee",
        padding: "28px",
        fontFamily:
          "system-ui, sans-serif",
        color: "#2b2b29",
        boxSizing: "border-box",
        width: "100%",
        overflowX: "hidden",
      }}
    >
      {/* ====================================================
          HEADER
          ==================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          marginBottom: 24,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <CalendarDays
              size={24}
              strokeWidth={1.8}
            />

            <h1
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              Schedule
            </h1>
          </div>

          <p
            style={{
              margin:
                "6px 0 0",
              color: "#73736e",
              fontSize: 13,
            }}
          >
            {boardName
              ? `Deadline tugas dari board ${boardName}`
              : "Jadwal dan deadline tugas dari semua board"}
          </p>
        </div>

        <button
          onClick={goToday}
          style={{
            border:
              "1px solid #d7d4cc",
            background: "#fff",
            borderRadius: 8,
            padding:
              "8px 14px",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            color: "#333",
          }}
        >
          Hari Ini
        </button>
      </div>

      {/* ====================================================
          ERROR
          ==================================================== */}

      {error && (
        <div
          style={{
            marginBottom: 16,
            padding:
              "10px 14px",
            background:
              "#fff1f2",
            border:
              "1px solid #fecdd3",
            borderRadius: 8,
            color: "#be123c",
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}

      {/* ====================================================
          MAIN
          ==================================================== */}

      <div
        className="schedule-main"
        style={{
          display: "grid",

          /*
           * PENTING:
           * minmax(0, 1fr) mencegah
           * isi kalender memaksa kolom melebar.
           */
          gridTemplateColumns:
            "minmax(0, 1fr) 300px",

          gap: 20,

          width: "100%",
          minWidth: 0,
        }}
      >
        {/* ==================================================
            CALENDAR
            ================================================== */}

        <div
          style={{
            background: "#fff",
            border:
              "1px solid #e1ded6",
            borderRadius: 16,
            overflow: "hidden",
            minWidth: 0,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* MONTH HEADER */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between",

              padding:
                "18px 20px",

              borderBottom:
                "1px solid #ebe8e1",
            }}
          >
            <button
              onClick={
                previousMonth
              }
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                border:
                  "1px solid #ddd9d0",
                background: "#fff",
                cursor: "pointer",

                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",

                flexShrink: 0,
              }}
            >
              <ChevronLeft
                size={18}
              />
            </button>

            <h2
              style={{
                margin: 0,
                fontSize: 17,
                fontWeight: 700,
              }}
            >
              {MONTHS[month]}{" "}
              {year}
            </h2>

            <button
              onClick={
                nextMonth
              }
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                border:
                  "1px solid #ddd9d0",
                background: "#fff",
                cursor: "pointer",

                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",

                flexShrink: 0,
              }}
            >
              <ChevronRight
                size={18}
              />
            </button>
          </div>

          {/* DAY HEADER */}

          <div
            style={{
              display: "grid",

              /*
               * PENTING:
               * minmax(0, 1fr)
               * membuat setiap hari
               * memiliki lebar yang aman.
               */
              gridTemplateColumns:
                "repeat(7, minmax(0, 1fr))",

              borderBottom:
                "1px solid #ebe8e1",

              minWidth: 0,
            }}
          >
            {DAYS.map((day) => (
              <div
                key={day}
                style={{
                  padding:
                    "10px 4px",

                  textAlign:
                    "center",

                  fontSize: 11,
                  fontWeight: 600,
                  color: "#85847f",

                  minWidth: 0,
                  overflow: "hidden",
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* CALENDAR GRID */}

          <div
            style={{
              display: "grid",

              /*
               * INI SALAH SATU PERBAIKAN UTAMA.
               */
              gridTemplateColumns:
                "repeat(7, minmax(0, 1fr))",

              width: "100%",
              minWidth: 0,
            }}
          >
            {calendarDays.map(
              (day, index) => {
                // ==================================================
                // EMPTY CELL
                // ==================================================

                if (!day) {
                  return (
                    <div
                      key={`empty-${index}`}
                      style={{
                        minHeight: 105,
                        minWidth: 0,
                        width: "100%",

                        borderRight:
                          "1px solid #eeeae2",
                        borderBottom:
                          "1px solid #eeeae2",

                        background:
                          "#faf9f6",

                        boxSizing:
                          "border-box",

                        overflow: "hidden",
                      }}
                    />
                  );
                }

                // ==================================================
                // DATE
                // ==================================================

                const date =
                  new Date(
                    year,
                    month,
                    day
                  );

                const dateKey =
                  formatDateKey(
                    date
                  );

                const dayTasks =
                  tasksByDate[
                    dateKey
                  ] || [];

                const isToday =
                  dateKey ===
                  formatDateKey(
                    today
                  );

                const isSelected =
                  dateKey ===
                  selectedDate;

                return (
                  <div
                    key={dateKey}
                    onClick={() =>
                      setSelectedDate(
                        dateKey
                      )
                    }
                    style={{
                      minHeight: 105,

                      /*
                       * PERBAIKAN PENTING
                       */
                      minWidth: 0,
                      width: "100%",
                      maxWidth: "100%",

                      padding: 8,

                      borderRight:
                        "1px solid #eeeae2",
                      borderBottom:
                        "1px solid #eeeae2",

                      background:
                        isSelected
                          ? "#fff8f2"
                          : "#fff",

                      cursor: "pointer",

                      transition:
                        "background .15s",

                      boxSizing:
                        "border-box",

                      /*
                       * Task tidak boleh
                       * mendorong cell.
                       */
                      overflow: "hidden",
                    }}
                  >
                    {/* DATE */}

                    <div
                      style={{
                        width: 27,
                        height: 27,
                        borderRadius:
                          "50%",

                        display: "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",

                        background:
                          isToday
                            ? "#f97316"
                            : "transparent",

                        color:
                          isToday
                            ? "#fff"
                            : "#333",

                        fontSize: 12,

                        fontWeight:
                          isToday
                            ? 700
                            : 500,

                        marginBottom: 5,

                        flexShrink: 0,
                      }}
                    >
                      {day}
                    </div>

                    {/* TASK LIST */}

                    <div
                      style={{
                        display: "flex",
                        flexDirection:
                          "column",

                        gap: 4,

                        /*
                         * PERBAIKAN UTAMA
                         */
                        minWidth: 0,
                        width: "100%",
                        maxWidth: "100%",
                        overflow: "hidden",
                      }}
                    >
                      {dayTasks
                        .slice(0, 3)
                        .map(
                          (task) => {
                            const priority =
                              getPriorityStyle(
                                task.priority
                              );

                            return (
                              <div
                                key={`${task.board_id}-${task.id}`}
                                style={{
                                  /*
                                   * PERBAIKAN:
                                   * card tidak boleh
                                   * mempengaruhi ukuran
                                   * grid.
                                   */
                                  width:
                                    "100%",
                                  minWidth: 0,
                                  maxWidth:
                                    "100%",

                                  boxSizing:
                                    "border-box",

                                  padding:
                                    "5px 6px",

                                  borderRadius: 6,

                                  background:
                                    task.status ===
                                    "done"
                                      ? "#f0fdf4"
                                      : "#f8f8f6",

                                  border:
                                    "1px solid #e7e5df",

                                  fontSize: 10,
                                  lineHeight:
                                    1.25,

                                  overflow:
                                    "hidden",
                                }}
                              >
                                {/* TASK TITLE */}

                                <div
                                  style={{
                                    width:
                                      "100%",
                                    minWidth:
                                      0,
                                    maxWidth:
                                      "100%",

                                    fontWeight:
                                      600,

                                    /*
                                     * INI YANG
                                     * MEMBUAT ...
                                     */
                                    whiteSpace:
                                      "nowrap",

                                    overflow:
                                      "hidden",

                                    textOverflow:
                                      "ellipsis",

                                    textDecoration:
                                      task.status ===
                                      "done"
                                        ? "line-through"
                                        : "none",
                                  }}
                                  title={
                                    task.title
                                  }
                                >
                                  {task.title}
                                </div>

                                {/* PRIORITY + STATUS */}

                                <div
                                  style={{
                                    marginTop: 3,

                                    display:
                                      "flex",

                                    justifyContent:
                                      "space-between",

                                    alignItems:
                                      "center",

                                    gap: 4,

                                    minWidth: 0,
                                    width:
                                      "100%",

                                    overflow:
                                      "hidden",
                                  }}
                                >
                                  {/* PRIORITY */}

                                  <span
                                    style={{
                                      padding:
                                        "2px 4px",

                                      borderRadius:
                                        4,

                                      background:
                                        priority.background,

                                      color:
                                        priority.color,

                                      fontSize: 8,

                                      fontWeight:
                                        700,

                                      maxWidth:
                                        "50%",

                                      whiteSpace:
                                        "nowrap",

                                      overflow:
                                        "hidden",

                                      textOverflow:
                                        "ellipsis",

                                      flexShrink: 1,
                                    }}
                                  >
                                    {task.priority ||
                                      "sedang"}
                                  </span>

                                  {/* STATUS */}

                                  <span
                                    style={{
                                      color:
                                        "#8a8984",

                                      fontSize: 8,

                                      maxWidth:
                                        "50%",

                                      whiteSpace:
                                        "nowrap",

                                      overflow:
                                        "hidden",

                                      textOverflow:
                                        "ellipsis",

                                      flexShrink: 1,

                                      textAlign:
                                        "right",
                                    }}
                                  >
                                    {getStatusLabel(
                                      task.status
                                    )}
                                  </span>
                                </div>

                                {/* BOARD NAME */}

                                {!boardId &&
                                  task.board_name && (
                                    <div
                                      style={{
                                        marginTop: 3,

                                        color:
                                          "#99968f",

                                        fontSize: 8,

                                        width:
                                          "100%",

                                        maxWidth:
                                          "100%",

                                        whiteSpace:
                                          "nowrap",

                                        overflow:
                                          "hidden",

                                        textOverflow:
                                          "ellipsis",
                                      }}
                                      title={
                                        task.board_name
                                      }
                                    >
                                      {
                                        task.board_name
                                      }
                                    </div>
                                  )}
                              </div>
                            );
                          }
                        )}

                      {/* MORE TASKS */}

                      {dayTasks.length >
                        3 && (
                        <div
                          style={{
                            fontSize: 9,
                            color:
                              "#77756f",

                            paddingLeft: 3,

                            whiteSpace:
                              "nowrap",

                            overflow:
                              "hidden",

                            textOverflow:
                              "ellipsis",

                            minWidth: 0,
                          }}
                        >
                          +
                          {dayTasks.length -
                            3}{" "}
                          tugas lainnya
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* ==================================================
            DETAIL SIDEBAR
            ================================================== */}

        <div
          style={{
            background: "#fff",

            border:
              "1px solid #e1ded6",

            borderRadius: 16,

            padding: 18,

            height:
              "fit-content",

            minWidth: 0,

            boxSizing:
              "border-box",
          }}
        >
          {/* LABEL */}

          <div
            style={{
              fontSize: 12,
              color: "#77756f",
              marginBottom: 5,
            }}
          >
            Deadline
          </div>

          {/* SELECTED DATE */}

          <h3
            style={{
              margin:
                "0 0 18px",

              fontSize: 18,

              lineHeight: 1.3,
            }}
          >
            {new Date(
              `${selectedDate}T00:00:00`
            ).toLocaleDateString(
              "id-ID",
              {
                weekday:
                  "long",
                day: "numeric",
                month:
                  "long",
                year:
                  "numeric",
              }
            )}
          </h3>

          {/* LOADING */}

          {loading ? (
            <div
              style={{
                color:
                  "#85847f",
                fontSize: 12,
              }}
            >
              Memuat tugas...
            </div>
          ) : selectedTasks.length ===
            0 ? (
            // ==================================================
            // EMPTY STATE
            // ==================================================

            <div
              style={{
                padding:
                  "20px 10px",

                textAlign:
                  "center",

                color:
                  "#85847f",

                fontSize: 12,
              }}
            >
              <CalendarDays
                size={28}
                strokeWidth={1.5}
                style={{
                  marginBottom: 8,
                  opacity: 0.5,
                }}
              />

              <div>
                Tidak ada deadline
                pada tanggal ini.
              </div>
            </div>
          ) : (
            // ==================================================
            // SELECTED TASKS
            // ==================================================

            <div
              style={{
                display: "flex",

                flexDirection:
                  "column",

                gap: 10,

                minWidth: 0,
              }}
            >
              {selectedTasks.map(
                (task) => {
                  const done =
                    task.status ===
                    "done";

                  const priority =
                    getPriorityStyle(
                      task.priority
                    );

                  return (
                    <div
                      key={`${task.board_id}-${task.id}`}
                      style={{
                        padding: 12,

                        border:
                          "1px solid #e5e2da",

                        borderRadius: 10,

                        background:
                          done
                            ? "#f8faf8"
                            : "#fff",

                        minWidth: 0,

                        boxSizing:
                          "border-box",

                        overflow:
                          "hidden",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",

                          gap: 8,

                          alignItems:
                            "flex-start",

                          minWidth: 0,
                        }}
                      >
                        {/* CHECK */}

                        {done ? (
                          <CircleCheck
                            size={17}
                            color="#16a34a"
                            flexShrink={0}
                          />
                        ) : (
                          <Circle
                            size={17}
                            color="#9a9891"
                            flexShrink={0}
                          />
                        )}

                        <div
                          style={{
                            minWidth: 0,
                            flex: 1,
                          }}
                        >
                          {/* TITLE */}

                          <div
                            style={{
                              fontSize: 13,

                              fontWeight:
                                600,

                              lineHeight:
                                1.35,

                              textDecoration:
                                done
                                  ? "line-through"
                                  : "none",

                              overflowWrap:
                                "anywhere",
                            }}
                          >
                            {task.title}
                          </div>

                          {/* BOARD */}

                          {!boardId &&
                            task.board_name && (
                              <div
                                style={{
                                  marginTop: 4,

                                  fontSize: 10,

                                  color:
                                    "#8a8984",

                                  overflowWrap:
                                    "anywhere",
                                }}
                              >
                                Board:{" "}
                                {
                                  task.board_name
                                }
                              </div>
                            )}

                          {/* DESCRIPTION */}

                          {task.description && (
                            <div
                              style={{
                                marginTop: 5,

                                fontSize: 11,

                                color:
                                  "#77756f",

                                lineHeight:
                                  1.4,

                                overflowWrap:
                                  "anywhere",
                              }}
                            >
                              {
                                task.description
                              }
                            </div>
                          )}

                          {/* BADGES */}

                          <div
                            style={{
                              display:
                                "flex",

                              gap: 6,

                              marginTop: 9,

                              flexWrap:
                                "wrap",
                            }}
                          >
                            {/* PRIORITY */}

                            <span
                              style={{
                                padding:
                                  "3px 7px",

                                borderRadius:
                                  999,

                                background:
                                  priority.background,

                                color:
                                  priority.color,

                                fontSize: 9,

                                fontWeight:
                                  700,
                              }}
                            >
                              {task.priority ===
                              "tinggi"
                                ? "Tinggi"
                                : task.priority ===
                                  "rendah"
                                ? "Rendah"
                                : "Sedang"}
                            </span>

                            {/* STATUS */}

                            <span
                              style={{
                                padding:
                                  "3px 7px",

                                borderRadius:
                                  999,

                                background:
                                  "#f1f1ee",

                                color:
                                  "#66645f",

                                fontSize: 9,

                                fontWeight:
                                  600,
                              }}
                            >
                              {getStatusLabel(
                                task.status
                              )}
                            </span>
                          </div>

                          {/* TIME */}

                          {Number(
                            task.time
                          ) > 0 && (
                            <div
                              style={{
                                display:
                                  "flex",

                                alignItems:
                                  "center",

                                gap: 4,

                                marginTop: 8,

                                color:
                                  "#77756f",

                                fontSize: 10,
                              }}
                            >
                              <Clock3
                                size={12}
                              />

                              {Math.floor(
                                Number(
                                  task.time
                                ) /
                                  3600
                              )
                                .toString()
                                .padStart(
                                  2,
                                  "0"
                                )}

                              :

                              {Math.floor(
                                (Number(
                                  task.time
                                ) %
                                  3600) /
                                  60
                              )
                                .toString()
                                .padStart(
                                  2,
                                  "0"
                                )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>

      {/* ====================================================
          RESPONSIVE
          ==================================================== */}

      <style>{`
        /*
         * Tablet
         */
        @media (max-width: 1100px) {
          .schedule-main {
            grid-template-columns:
              minmax(0, 1fr) 280px !important;
          }
        }

        /*
         * Mobile / layar kecil
         */
        @media (max-width: 900px) {
          .schedule-main {
            grid-template-columns:
              minmax(0, 1fr) !important;
          }
        }

        /*
         * Mobile kecil
         */
        @media (max-width: 600px) {
          .schedule-main {
            grid-template-columns:
              minmax(0, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}