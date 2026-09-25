import React, { useState, useEffect, useRef, useCallback } from "react";
import whiteboardBg from "./assets/c69c6da2680c47ae26f097b37212ae09.jpg";
import { api } from "./utils/api.js";

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];
const DAY_LABELS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

const CARD_COLORS = [
  { label: "Default", bg: null,       border: null       },
  { label: "Red",     bg: "#fff0f0",  border: "#ffb3b3"  },
  { label: "Orange",  bg: "#fff7f0",  border: "#ffc89a"  },
  { label: "Yellow",  bg: "#fffbf0",  border: "#ffe08a"  },
  { label: "Green",   bg: "#f0fff6",  border: "#9adcb8"  },
  { label: "Blue",    bg: "#f0f5ff",  border: "#9ab8ff"  },
  { label: "Purple",  bg: "#f8f0ff",  border: "#c9a0ff"  },
  { label: "Pink",    bg: "#fff0f8",  border: "#ffabda"  },
];

const FIXED_COLUMNS = [
  { id: "todo",         title: "To Do",       dot: "#3b82f6" },
  { id: "in-progress",  title: "In Progress", dot: "#f97316" },
  { id: "done",         title: "Done",        dot: "#16a34a" },
];

const PRIORITIES = [
  { id: "tinggi", label: "Tinggi", bg: "#fee2e2", text: "#b91c1c" },
  { id: "sedang", label: "Sedang", bg: "#ffedd5", text: "#c2410c" },
  { id: "rendah", label: "Rendah", bg: "#f1f5f9", text: "#475569" },
];
function priorityStyle(id) {
  return PRIORITIES.find(p => p.id === id) || PRIORITIES[1];
}

// ─── AutoGrowTextarea ───────────────────────────────────────────
function AutoGrowTextarea({ value, onChange, onBlur, placeholder }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = Math.max(60, ref.current.scrollHeight) + "px";
    }
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); } }}
      placeholder={placeholder}
      style={{
        border: "none", background: "transparent", outline: "none",
        fontSize: 11, color: "var(--text-main)", width: "100%",
        resize: "none", fontFamily: "inherit", lineHeight: "1.4",
        wordBreak: "break-word", whiteSpace: "pre-wrap",
        overflowWrap: "break-word", wordWrap: "break-word",
        minHeight: "60px", height: "auto", overflow: "hidden", display: "block"
      }}
    />
  );
}

// ─── MiniCalendar ───────────────────────────────────────────────
function MiniCalendar() {
  const today = new Date();
  const [cur, setCur] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const firstDay = getFirstDayOfMonth(cur.year, cur.month);
  const daysInMonth = getDaysInMonth(cur.year, cur.month);
  const prevMonth = () => setCur(c => c.month === 0 ? { year: c.year-1, month: 11 } : { ...c, month: c.month-1 });
  const nextMonth = () => setCur(c => c.month === 11 ? { year: c.year+1, month: 0 } : { ...c, month: c.month+1 });
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return (
    <div style={{ padding: "0 10px 12px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
        <button onClick={prevMonth} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", fontSize:16, padding:"2px 6px" }}>‹</button>
        <span style={{ fontSize:12, fontWeight:500, color:"var(--text-main)" }}>{MONTH_NAMES[cur.month]} {cur.year}</span>
        <button onClick={nextMonth} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", fontSize:16, padding:"2px 6px" }}>›</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:1 }}>
        {DAY_LABELS.map(d => (
          <div key={d} style={{ textAlign:"center", fontSize:10, color:"var(--text-muted)", padding:"2px 0" }}>{d}</div>
        ))}
        {cells.map((day, i) => {
          const isToday = day && cur.year === today.getFullYear() && cur.month === today.getMonth() && day === today.getDate();
          return (
            <div key={i} style={{
              textAlign:"center", fontSize:11, width:24, height:24,
              display:"flex", alignItems:"center", justifyContent:"center", margin:"auto",
              borderRadius:"50%",
              background: isToday ? "#667eea" : "transparent",
              color: isToday ? "#fff" : day ? "var(--text-main)" : "transparent",
              cursor: day ? "pointer" : "default",
            }}>{day || ""}</div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SideSection ────────────────────────────────────────────────
function SideSection({ title, children, extra }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ borderBottom: "0.5px solid var(--border)" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", cursor:"pointer" }} onClick={() => setOpen(o => !o)}>
        <div style={{ fontSize:13, fontWeight:600, color:"var(--text-main)" }}>{title}</div>
        <div style={{ display:"flex", alignItems:"center", gap:8, color:"var(--text-muted)", fontSize:13 }}>
          {extra}
          <span style={{ transition:"transform .2s", display:"inline-block", transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}>▾</span>
        </div>
      </div>
      {open && children}
    </div>
  );
}

// ─── ColorPicker ────────────────────────────────────────────────
function ColorPicker({ currentColor, onChange }) {
  const [open, setOpen] = useState(false);
  const current = CARD_COLORS.find(c => c.bg === currentColor) || CARD_COLORS[0];
  return (
    <div style={{ position:"relative" }}>
      <div
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        title="Ubah warna kartu"
        style={{
          width:20, height:20, borderRadius:6,
          background: current.bg || "var(--bg-badge)",
          border: `2px solid ${current.border || "var(--border)"}`,
          cursor:"pointer", flexShrink:0,
        }}
      />
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position:"fixed", inset:0, zIndex:99 }} />
          <div style={{
            position:"absolute", bottom:28, left:0, zIndex:100,
            background:"var(--bg-surface)", border:"0.5px solid var(--border)",
            borderRadius:8, padding:7, display:"flex", gap:6, flexWrap:"wrap",
            width:130, boxShadow:"0 4px 16px rgba(0,0,0,0.12)",
          }}>
            {CARD_COLORS.map(c => (
              <div key={c.label} title={c.label}
                onClick={e => { e.stopPropagation(); onChange(c.bg); setOpen(false); }}
                style={{
                  width:20, height:20, borderRadius:4, cursor:"pointer",
                  background: c.bg || "#e8e8e4",
                  border: `2px solid ${c.bg === currentColor ? "#4f46e5" : (c.border || "var(--border)")}`,
                  transition:"transform .1s",
                }}
                onMouseOver={e => e.currentTarget.style.transform="scale(1.25)"}
                onMouseOut={e => e.currentTarget.style.transform="scale(1)"}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── MembersModal (admin only) ────────────────────────────────
function MembersModal({ boardId, onClose }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [username, setUsername] = useState('');
  const [newRole, setNewRole]   = useState('member');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    api.getBoardMembers(boardId)
      .then(setMembers)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [boardId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await api.addBoardMember(boardId, username.trim(), newRole);
      setUsername('');
      load();
    } catch (err) {
      setError(err.message || 'Gagal menambahkan member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (userId, role) => {
    try { await api.updateBoardMemberRole(boardId, userId, role); load(); }
    catch (err) { alert(err.message); }
  };

  const handleRemove = async (userId) => {
    if (!window.confirm('Keluarkan member ini dari board?')) return;
    try { await api.removeBoardMember(boardId, userId); load(); }
    catch (err) { alert(err.message); }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:16, padding:24, width:420, maxWidth:"90%", fontFamily:"system-ui, sans-serif" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:"#1e293b" }}>Board Members</h3>
          <span onClick={onClose} style={{ cursor:"pointer", color:"#94a3b8" }}>✕</span>
        </div>

        <form onSubmit={handleAdd} style={{ display:"flex", gap:8, marginBottom:16 }}>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username"
            style={{ flex:1, padding:"8px 10px", borderRadius:8, border:"1px solid #cbd5e1", fontSize:13 }} />
          <select value={newRole} onChange={e => setNewRole(e.target.value)}
            style={{ padding:"8px 10px", borderRadius:8, border:"1px solid #cbd5e1", fontSize:13 }}>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" disabled={submitting} style={{
            padding:"8px 14px", borderRadius:8, border:"none", background:"#7a8560",
            color:"#fff", fontWeight:600, fontSize:13, cursor:"pointer"
          }}>{submitting ? '...' : 'Add'}</button>
        </form>

        {error && <div style={{ color:"#b91c1c", fontSize:12, marginBottom:10 }}>⚠️ {error}</div>}

        {loading ? (
          <div style={{ fontSize:13, color:"#64748b" }}>Memuat...</div>
        ) : (
          <div style={{ maxHeight:280, overflowY:"auto" }}>
            {members.map(m => (
              <div key={m.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 0", borderBottom:"1px solid #f1f5f9" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#1e293b" }}>{m.fullname || m.username}</div>
                  <div style={{ fontSize:11, color:"#94a3b8" }}>@{m.username}</div>
                </div>
                <select value={m.role} onChange={e => handleRoleChange(m.id, e.target.value)}
                  style={{ fontSize:12, padding:"4px 6px", borderRadius:6, border:"1px solid #cbd5e1" }}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <span onClick={() => handleRemove(m.id)} style={{ cursor:"pointer", color:"#94a3b8", fontSize:12 }}>🗑️</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function App({ boardId, boardName, role = 'member', onBackToDashboard }) {
  const isAdmin = role === 'admin';
  const [quests, setQuests]           = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dragOver, setDragOver]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const [search, setSearch]           = useState("");
  const [priorityFilter, setPriorityFilter] = useState("semua");
  const [addModal, setAddModal]       = useState(null); // { status } | null
  const [newTitle, setNewTitle]       = useState("");
  const [newPriority, setNewPriority] = useState("sedang");

  // ── Fetch tasks ──
  useEffect(() => {
    if (!boardId) return;
    setLoading(true);
    api.getTasks(boardId)
      .then(data => {
        const normalised = data.map(t => ({
          ...t,
          note:      t.description ?? t.note ?? "",
          time:      Number(t.time) || 0,
          isRunning: Boolean(t.is_running || t.isRunning),
          color:     t.color ?? null,
          priority:  t.priority ?? "sedang",
        }));
        setQuests(normalised);
      })
      .catch(err => console.error("Gagal ambil tasks:", err))
      .finally(() => setLoading(false));
  }, [boardId]);

  // ── Timer tick ──
  useEffect(() => {
    const iv = setInterval(() => {
      setQuests(prev => prev.map(q => q.isRunning ? { ...q, time: q.time + 1 } : q));
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  // ── Sync task ke backend ──
  const syncTask = useCallback(async (quest) => {
    try {
      await api.updateTask(
        quest.id, quest.title, quest.note ?? "",
        quest.status, quest.color, quest.time,
        quest.isRunning, quest.due_date ?? null, quest.priority ?? "sedang"
      );
    } catch (err) { console.error("Gagal sync task:", err); }
  }, []);

  const toggleTimer = (id) => {
    setQuests(prev => prev.map(q => {
      if (q.id !== id) return q;
      const updated = { ...q, isRunning: !q.isRunning };
      syncTask(updated);
      return updated;
    }));
  };

  const setQuestColor = (id, color) => {
    setQuests(prev => prev.map(q => {
      if (q.id !== id) return q;
      const updated = { ...q, color };
      syncTask(updated);
      return updated;
    }));
  };

  const setQuestNote = (id, text) => {
    const words = text.split(/\s+/).filter(Boolean);
    let finalText = text;
    if (words.length > 15) {
      let count = 0, cutIndex = 0;
      for (let i = 0; i < text.length; i++) {
        const prevChar = i === 0 ? " " : text[i-1];
        if ((prevChar === " " || prevChar === "\n") && text[i] !== " " && text[i] !== "\n") count++;
        if (count > 15) { cutIndex = i; break; }
      }
      finalText = text.substring(0, cutIndex).trimEnd();
    }
    setQuests(prev => prev.map(q => q.id === id ? { ...q, note: finalText } : q));
  };

  const syncNoteOnBlur = (quest) => syncTask({ ...quest });

  const openAddModal = (colId) => {
    if (!isAdmin) { alert("Hanya admin board yang dapat menambahkan tugas."); return; }
    if (!boardId) { alert("Board belum dimuat. Coba refresh."); return; }
    setNewTitle("");
    setNewPriority("sedang");
    setAddModal({ status: colId });
  };

  const submitNewTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !addModal) return;
    const colId = addModal.status;
    const shouldRun = colId === "in-progress";
    try {
      const res = await api.createTask(newTitle.trim(), "", colId, null, boardId, null, 0, shouldRun, newPriority);
      const normalise = (t) => ({
        ...t,
        title:     t.title     ?? newTitle.trim(),
        status:    t.status    ?? colId,
        priority:  t.priority  ?? newPriority,
        note:      t.description ?? t.note ?? "",
        time:      Number(t.time) || 0,
        isRunning: Boolean(t.is_running ?? shouldRun),
        color:     t.color ?? null,
        board_id:  t.board_id ?? boardId,
      });
      if (res && res.id) {
        setQuests(prev => [...prev, normalise(res)]);
      } else {
        const tasks = await api.getTasks(boardId);
        setQuests(tasks.map(t => ({
          ...t,
          note:      t.description ?? t.note ?? "",
          time:      Number(t.time) || 0,
          isRunning: Boolean(t.is_running),
          color:     t.color ?? null,
          priority:  t.priority ?? "sedang",
        })));
      }
      setAddModal(null);
    } catch (err) {
      console.error("Gagal buat task:", err);
      alert("Gagal menyimpan tugas ke database.");
    }
  };

  const deleteQuest = async (id) => {
    if (!isAdmin) { alert("Hanya admin board yang dapat menghapus tugas."); return; }
    if (!window.confirm("Hapus tugas ini?")) return;
    try {
      await api.deleteTask(id);
      setQuests(prev => prev.filter(q => q.id !== id));
    } catch (err) {
      console.error("Gagal hapus task:", err);
      alert("Gagal menghapus tugas.");
    }
  };

  // ── Drag & Drop ──
  const handleDragStart = (e, id) => {
    e.dataTransfer.setData("text/plain", String(id));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault(); e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDragOver(colId);
  };

  const handleDragLeave = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX >= rect.right ||
        e.clientY < rect.top  || e.clientY >= rect.bottom) setDragOver(null);
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault(); e.stopPropagation();
    setDragOver(null);
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    setQuests(prev => prev.map(q => {
      if (String(q.id) !== String(id)) return q;
      const updated = { ...q, status: targetStatus, isRunning: targetStatus === "in-progress" };
      syncTask(updated);
      return updated;
    }));
  };

  const formatTime = (s) => {
    s = Number(s) || 0;
    const h   = Math.floor(s / 3600).toString().padStart(2,"0");
    const m   = Math.floor((s % 3600) / 60).toString().padStart(2,"0");
    const sec = (s % 60).toString().padStart(2,"0");
    return `${h}:${m}:${sec}`;
  };

  const filteredQuests = (colId) => {
    let base = colId === "todo"
      ? quests.filter(q => q.status === "todo" || q.status === "backlog")
      : quests.filter(q => q.status === colId);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      base = base.filter(t => t.title.toLowerCase().includes(q));
    }
    if (priorityFilter !== "semua") {
      base = base.filter(t => (t.priority || "sedang") === priorityFilter);
    }
    return base;
  };

  return (
    <div style={{
      display:"flex", flexDirection:"column", height:"100vh",
      fontFamily:"system-ui, sans-serif", fontSize:13,
      backgroundImage:`url(${whiteboardBg})`,
      backgroundSize:"cover", backgroundPosition:"center",
      color:"var(--text-main)", position:"relative"
    }}>

      {/* ── Topbar: nama board kiri, tombol Dashboard kanan ── */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"10px 16px",
        background:"rgba(255,255,255,0.92)",
        borderBottom:"0.5px solid var(--border)",
        flexShrink:0, backdropFilter:"blur(10px)",
        boxShadow:"0 1px 4px rgba(0,0,0,0.06)"
      }}>
        {/* Nama board */}
        <span style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{
            fontSize:14, fontWeight:600, color:"var(--text-main)",
            letterSpacing:"-0.2px"
          }}>
            {boardName || "Board"}
          </span>
          <span style={{
            fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:999,
            color: isAdmin ? "#166534" : "#1e40af",
            background: isAdmin ? "rgba(220,252,231,0.9)" : "rgba(219,234,254,0.9)",
            textTransform:"uppercase", letterSpacing:"0.5px"
          }}>{isAdmin ? "Admin" : "Member"}</span>
        </span>

        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {isAdmin && (
            <button onClick={() => setShowMembers(true)} style={{
              background:"none", border:"1px solid var(--border)",
              cursor:"pointer", color:"var(--text-muted)",
              fontSize:12, fontWeight:500,
              padding:"5px 14px", borderRadius:6,
            }}>
              👥 Members
            </button>
          )}
          {isAdmin && (
            <button onClick={() => openAddModal("todo")} style={{
              background:"#f97316", border:"none", color:"#fff",
              cursor:"pointer", fontSize:12, fontWeight:600,
              padding:"7px 16px", borderRadius:8,
              display:"flex", alignItems:"center", gap:6,
              boxShadow:"0 3px 8px -2px rgba(249,115,22,0.5)"
            }}>
              + Tambah Tugas Baru
            </button>
          )}
          {/* Tombol Dashboard */}
          {onBackToDashboard && (
            <button onClick={onBackToDashboard} style={{
              background:"none", border:"1px solid var(--border)",
              cursor:"pointer", color:"var(--text-muted)",
              fontSize:12, fontWeight:500,
              padding:"5px 14px", borderRadius:6,
              display:"flex", alignItems:"center", gap:4,
              transition:"all .15s"
            }}
              onMouseOver={e => { e.currentTarget.style.background="var(--bg-column)"; e.currentTarget.style.color="var(--text-main)"; }}
              onMouseOut={e => { e.currentTarget.style.background="none"; e.currentTarget.style.color="var(--text-muted)"; }}
            >
              Dashboard
            </button>
          )}
        </div>
      </div>

      {/* ── Search + filter bar ── */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12,
        padding:"10px 16px", background:"rgba(255,255,255,0.8)",
        borderBottom:"0.5px solid var(--border)", flexShrink:0, backdropFilter:"blur(10px)"
      }}>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Cari tugas..."
            style={{ padding:"7px 12px", borderRadius:8, border:"1px solid var(--border)", fontSize:12, outline:"none", width:180 }}
          />
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
            style={{ padding:"7px 10px", borderRadius:8, border:"1px solid var(--border)", fontSize:12, outline:"none", background:"#fff" }}>
            <option value="semua">Semua Prioritas</option>
            {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:11.5, color:"var(--text-muted)" }}>
            Total Selesai: <strong style={{ color:"var(--text-main)" }}>{quests.filter(q => q.status === "done").length}/{quests.length}</strong> Tugas Selesai
          </span>
          <div style={{ width:80, height:5, borderRadius:4, background:"#f1f5f9", overflow:"hidden" }}>
            <div style={{
              width: `${quests.length > 0 ? Math.round(quests.filter(q => q.status === "done").length / quests.length * 100) : 0}%`,
              height:"100%", background:"#16a34a"
            }} />
          </div>
        </div>
      </div>

      {addModal && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.4)",
          display:"flex", alignItems:"center", justifyContent:"center", zIndex:1001
        }} onClick={() => setAddModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background:"#fff", borderRadius:16, padding:24, width:380, maxWidth:"90%",
            fontFamily:"system-ui, sans-serif"
          }}>
            <h3 style={{ margin:"0 0 16px 0", fontSize:15, fontWeight:700, color:"#1e1e1e" }}>Tambah Tugas Baru</h3>
            <form onSubmit={submitNewTask}>
              <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#4b4b47", marginBottom:6 }}>Nama Tugas</label>
              <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)}
                placeholder="Contoh: Membuat wireframe layout"
                style={{ width:"100%", padding:10, borderRadius:8, border:"1px solid #e2e2dc", fontSize:13, outline:"none", boxSizing:"border-box", marginBottom:14 }} />

              <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#4b4b47", marginBottom:6 }}>Prioritas</label>
              <div style={{ display:"flex", gap:8, marginBottom:20 }}>
                {PRIORITIES.map(p => (
                  <button type="button" key={p.id} onClick={() => setNewPriority(p.id)} style={{
                    flex:1, padding:"8px 0", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:600,
                    border: newPriority === p.id ? `2px solid ${p.text}` : "1px solid #e2e2dc",
                    background: p.bg, color: p.text
                  }}>{p.label}</button>
                ))}
              </div>

              <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                <button type="button" onClick={() => setAddModal(null)} style={{
                  padding:"9px 16px", borderRadius:8, border:"1px solid #e2e2dc", background:"#fff", cursor:"pointer", fontSize:13
                }}>Batal</button>
                <button type="submit" style={{
                  padding:"9px 18px", borderRadius:8, border:"none", background:"#f97316", color:"#fff",
                  fontWeight:600, cursor:"pointer", fontSize:13
                }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMembers && (
        <MembersModal boardId={boardId} onClose={() => setShowMembers(false)} />
      )}

      <div style={{ display:"flex", flex:1, overflow:"hidden", position:"relative" }}>

        {/* ── Board ── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", padding:"20px" }}>
          {loading ? (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", flex:1, color:"var(--text-muted)", fontSize:14 }}>
              Memuat tugas...
            </div>
          ) : (
            <div style={{ display:"flex", gap:20, flex:1, overflowX:"auto", overflowY:"hidden" }}>
              {FIXED_COLUMNS.map(col => {
                const cards = filteredQuests(col.id);
                const isOver = dragOver === col.id;
                return (
                  <div key={col.id}
                    onDragOver={e => handleDragOver(e, col.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={e => handleDrop(e, col.id)}
                    style={{
                      flex:"1 0 250px", display:"flex", flexDirection:"column",
                      borderRadius:18, border:"1px solid var(--border)",
                      background: isOver ? "var(--bg-column-hover)" : "var(--bg-column)",
                      backdropFilter:"blur(8px)",
                      transition:"background .2s", minWidth:240,
                      overflow:"hidden", boxShadow:"0 4px 12px rgba(0,0,0,0.03)"
                    }}>

                    {/* Column header */}
                    <div style={{ padding:"14px 16px", borderBottom:"0.5px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between", background:"var(--bg-header)", flexShrink:0 }}>
                      <span style={{ fontWeight:700, fontSize:14, userSelect:"none", color:"var(--text-main)", display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ width:8, height:8, borderRadius:"50%", background:col.dot, display:"inline-block" }} />
                        {col.title}
                      </span>
                      <div style={{ background:"white", color:"#667eea", fontSize:11, borderRadius:"50%", width:22, height:22, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, border:"1px solid var(--border)" }}>
                        {cards.length}
                      </div>
                    </div>

                    {/* Cards */}
                    <div style={{ flex:1, overflowY:"auto", padding:"14px" }}>
                      {isAdmin && cards.length === 0 && col.id !== "in-progress" && col.id !== "done" && (
                        <div style={{ textAlign:"center", paddingTop:10 }}>
                          <button onClick={() => openAddModal(col.id)} style={{ background:"none", border:"none", color:"var(--text-muted)", fontSize:22, cursor:"pointer" }}>+</button>
                        </div>
                      )}

                      {cards.map(quest => {
                        const cardColor = CARD_COLORS.find(c => c.bg === quest.color);
                        return (
                          <div key={quest.id} draggable
                            onDragStart={e => handleDragStart(e, quest.id)}
                            style={{
                              background: quest.color || "var(--bg-card)",
                              border: `1px solid ${cardColor?.border || "var(--border-card)"}`,
                              borderRadius:10, padding:"12px", marginBottom:10,
                              cursor:"grab", boxShadow:"0 2px 6px var(--shadow)",
                              transition:"border-color .15s, background .2s",
                            }}
                            onMouseOver={e => e.currentTarget.style.borderColor = cardColor?.border || "var(--accent)"}
                            onMouseOut={e => e.currentTarget.style.borderColor = cardColor?.border || "var(--border-card)"}>

                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                              <span style={{
                                fontSize:9.5, fontWeight:700, padding:"3px 9px", borderRadius:999,
                                textTransform:"uppercase", letterSpacing:"0.4px",
                                background: priorityStyle(quest.priority).bg,
                                color: priorityStyle(quest.priority).text
                              }}>{priorityStyle(quest.priority).label}</span>
                              {isAdmin && <span onClick={() => deleteQuest(quest.id)} style={{ cursor:"pointer", color:"var(--text-muted)", fontSize:11, flexShrink:0, opacity:0.6 }}>✕</span>}
                            </div>

                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:6, marginBottom:8 }}>
                              <p style={{ margin:0, fontWeight:600, fontSize:13, color:"var(--text-main)", lineHeight:1.4, wordBreak:"break-word", flex:1 }}>{quest.title}</p>
                            </div>

                            <div style={{ display:"flex", flexDirection:"column", gap:4, marginBottom:10, background:"var(--bg-note-box)", padding:"6px 8px", borderRadius:6 }}>
                              <AutoGrowTextarea
                                value={quest.note || ""}
                                onChange={e => setQuestNote(quest.id, e.target.value)}
                                onBlur={() => syncNoteOnBlur(quest)}
                                placeholder="Add note..."
                              />
                            </div>

                            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                              <ColorPicker currentColor={quest.color} onChange={color => setQuestColor(quest.id, color)} />
                              {quest.status === "done" && <span style={{ fontSize:11, color:"var(--green)", fontWeight:600 }}>✓ Done</span>}
                              {quest.status === "in-progress" && (
                                <span style={{ fontFamily:"monospace", fontSize:11, color:"var(--green)", fontWeight:600 }}>
                                  {formatTime(quest.time)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {isAdmin && cards.length > 0 && col.id !== "in-progress" && col.id !== "done" && (
                        <div style={{ textAlign:"center", marginTop:4 }}>
                          <button onClick={() => openAddModal(col.id)} style={{ background:"none", border:"none", color:"var(--text-muted)", fontSize:20, cursor:"pointer" }}>+</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Sidebar toggle ── */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title={sidebarOpen ? "Sembunyikan sidebar" : "Tampilkan sidebar"}
          style={{
            position:"absolute", top:"50%",
            right: sidebarOpen ? "240px" : "0px",
            transform:"translate(50%, -50%)",
            width:30, height:30, borderRadius:"50%",
            border:"1px solid var(--border)", background:"#ffffff",
            color:"#667eea", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:12, fontWeight:700,
            boxShadow:"0 3px 8px rgba(0,0,0,0.15)",
            zIndex:99, transition:"right 0.25s ease",
          }}
        >
          {sidebarOpen ? "▶" : "◀"}
        </button>

        {/* ── Right Sidebar ── */}
        <div style={{
          width: sidebarOpen ? 240 : 0,
          borderLeft: sidebarOpen ? "1px solid var(--border)" : "none",
          background:"var(--sidebar-surface)",
          display:"flex", flexDirection:"column",
          overflowY:"auto", flexShrink:0,
          backdropFilter:"blur(12px)",
          transition:"width 0.25s ease",
          overflow:"hidden",
        }}>
          {sidebarOpen && (
            <>
              <SideSection title="Task">
                {quests.filter(q => q.status === "in-progress").length === 0 ? (
                  <div style={{ padding:"12px 14px" }}>
                    <div style={{ fontWeight:500, fontSize:12, color:"var(--text-muted)", whiteSpace:"normal" }}>Tidak ada tugas yang sedang dikerjakan</div>
                  </div>
                ) : (
                  <div style={{ padding:"6px 12px" }}>
                    {quests.filter(q => q.status === "in-progress").map(q => (
                      <div key={q.id} style={{
                        padding:"10px", borderRadius:8,
                        background: q.color || "var(--bg-timer)",
                        border: `0.5px solid ${CARD_COLORS.find(c=>c.bg===q.color)?.border || "var(--border)"}`,
                        marginBottom:8, fontSize:12, boxShadow:"0 1px 3px var(--shadow)",
                      }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:4, marginBottom:4 }}>
                          <div style={{ fontWeight:600, color:"var(--text-main)", fontSize:12, wordBreak:"break-word", whiteSpace:"normal" }}>{q.title}</div>
                          {isAdmin && <span onClick={() => deleteQuest(q.id)} style={{ cursor:"pointer", color:"var(--text-muted)", fontSize:11, opacity:0.6 }}>✕</span>}
                        </div>
                        {q.note && <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:6, wordBreak:"break-word", lineHeight:"1.4", whiteSpace:"pre-wrap" }}>{q.note}</div>}
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:4 }}>
                          <span style={{ fontFamily:"monospace", color: q.isRunning ? "var(--green)" : "var(--text-muted)", fontWeight: q.isRunning ? 700 : 400, fontSize:12 }}>
                            {formatTime(q.time)}
                          </span>
                          <button onClick={() => toggleTimer(q.id)} style={{
                            background: q.isRunning ? "var(--amber-bg)" : "var(--green-bg)",
                            color: q.isRunning ? "var(--amber)" : "var(--green)",
                            border: `0.5px solid ${q.isRunning ? "var(--amber)" : "var(--green)"}`,
                            borderRadius:5, padding:"2px 9px", cursor:"pointer", fontSize:12,
                          }}>
                            {q.isRunning ? "⏸" : "▶"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SideSection>

              <SideSection title="Calendar"><MiniCalendar /></SideSection>

              <SideSection title="Completed Tasks Log">
                <div style={{ padding:"12px 14px" }}>
                  {quests.filter(q => q.status === "done").length === 0 ? (
                    <p style={{ fontSize:12, color:"var(--text-muted)", margin:0, lineHeight:1.5, whiteSpace:"normal" }}>
                      Kartu yang sudah selesai akan tampil di sini.
                    </p>
                  ) : (
                    quests.filter(q => q.status === "done").map(q => (
                      <div key={q.id} style={{ marginBottom:8, padding:"8px", borderRadius:6, background: q.color || "var(--bg-timer)", border:`0.5px solid ${CARD_COLORS.find(c=>c.bg===q.color)?.border || "var(--border)"}` }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:4 }}>
                          <div style={{ color:"var(--text-main)", fontSize:12, fontWeight:500, wordBreak:"break-word", whiteSpace:"normal" }}>{q.title}</div>
                          {isAdmin && <span onClick={() => deleteQuest(q.id)} style={{ cursor:"pointer", color:"var(--text-muted)", fontSize:11, opacity:0.6 }}>✕</span>}
                        </div>
                        {q.note && <div style={{ fontSize:11, color:"var(--text-muted)", fontStyle:"italic", marginTop:2, whiteSpace:"pre-wrap" }}>"{q.note}"</div>}
                        <div style={{ color:"var(--text-muted)", fontSize:11, marginTop:4, fontFamily:"monospace" }}>{formatTime(q.time)} finish</div>
                      </div>
                    ))
                  )}
                </div>
              </SideSection>
            </>
          )}
        </div>
      </div>

      <style>{`
        :root {
          --bg-surface:       rgba(255,255,255,0.92);
          --sidebar-surface:  rgba(250,250,248,0.88);
          --bg-header:        rgba(255,255,255,0.5);
          --bg-column:        rgba(255,255,255,0.4);
          --bg-column-hover:  rgba(235,245,255,0.55);
          --bg-card:          #ffffff;
          --bg-badge:         rgba(0,0,0,0.06);
          --bg-timer:         #ffffff;
          --bg-note-box:      rgba(0,0,0,0.03);
          --border:           rgba(0,0,0,0.12);
          --border-card:      rgba(0,0,0,0.1);
          --text-main:        #2b2b29;
          --text-muted:       #6e6e6b;
          --accent:           #667eea;
          --shadow:           rgba(0,0,0,0.04);
          --green:            #16a34a; --green-bg: rgba(22,163,74,0.1);
          --amber:            #d97706; --amber-bg: rgba(217,119,6,0.1);
        }
        * { box-sizing: border-box; } body { margin: 0; }
        ::-webkit-scrollbar { width:6px; height:6px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:var(--border); border-radius:4px; }
      `}</style>
    </div>
  );
}