import React, { useState, useEffect, useRef, useCallback, useLayoutEffect, useMemo } from "react";

import whiteboardBg from "./assets/c69c6da2680c47ae26f097b37212ae09.jpg";

import { api } from "./utils/api.js";
import { Plus } from "lucide-react";
import BoardGantt from "./components/BoardGantt.jsx";
import TaskCard from "./components/TaskCard.jsx";
import { MemberStack, ToolButton, ToolSearch } from "./components/BoardHeaderBits.jsx";



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
  { id: "sangat-tinggi", label: "Sangat Tinggi", symbol: "⇈", bg: "#fee2e2", text: "#b91c1c" },
  { id: "tinggi", label: "Tinggi", symbol: "↑", bg: "#fee2e2", text: "#dc2626" },
  { id: "sedang", label: "Sedang", symbol: "—", bg: "#fef3c7", text: "#b45309" },
  { id: "rendah", label: "Rendah", symbol: "↓", bg: "#dbeafe", text: "#1d4ed8" },
  { id: "sangat-rendah", label: "Sangat Rendah", symbol: "⇊", bg: "#dcfce7", text: "#15803d" },
];

function priorityStyle(id) {
  return PRIORITIES.find(p => p.id === id) || PRIORITIES[2];
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



// ─── Date helpers ───────────────────────────────────────────────

function toDateKey(value) {

  if (!value) return "";

  const raw = String(value);

  // Laravel's date:Y-m-d cast normally returns YYYY-MM-DD. If a full

  // datetime ever arrives, only use its date portion to avoid timezone shifts.

  return raw.length >= 10 ? raw.slice(0, 10) : raw;

}



function formatDateLabel(dateKey) {

  if (!dateKey) return "";

  const [y, m, d] = dateKey.split("-").map(Number);

  if (!y || !m || !d) return dateKey;

  return new Date(y, m - 1, d).toLocaleDateString("id-ID", {

    day: "numeric",

    month: "long",

    year: "numeric",

  });

}



// ─── Glass tokens (ubah di sini untuk mengatur intensitas glassmorphism) ───
const GLASS = {
  panel: {
    background: "rgba(255,255,255,0.75)",
    backdropFilter: "blur(20px) saturate(150%)",
    WebkitBackdropFilter: "blur(20px) saturate(150%)",
    border: "1px solid rgba(255,255,255,0.65)",
    boxShadow: "0 10px 40px rgba(15,23,42,0.14), inset 0 1px 0 rgba(255,255,255,0.7)",
  },
  card: {
    background: "rgba(255,255,255,0.55)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.7)",
    boxShadow: "0 2px 10px rgba(15,23,42,0.06)",
  },
};

// ─── Deteksi terang/gelap background board ──────────────────────
// Mengembalikan true jika background dominan gelap → teks jadi putih.
function lumaOfHex(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function useBoardIsDark(backgroundCss) {
  const [dark, setDark] = useState(() => {
    if (/url\(/.test(backgroundCss)) return false;
    const hexes = backgroundCss.match(/#[0-9a-f]{6}/gi) || [];
    if (!hexes.length) return false;
    return hexes.reduce((s, h) => s + lumaOfHex(h), 0) / hexes.length < 0.5;
  });

  useEffect(() => {
    let cancelled = false;
    const urlMatch = /url\(\s*["']?(.*?)["']?\s*\)/.exec(backgroundCss);

    if (!urlMatch) {
      const hexes = backgroundCss.match(/#[0-9a-f]{6}/gi) || [];
      if (hexes.length) setDark(hexes.reduce((s, h) => s + lumaOfHex(h), 0) / hexes.length < 0.5);
      return undefined;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      try {
        const size = 48;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let total = 0;
        for (let i = 0; i < data.length; i += 4) {
          total += (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
        }
        setDark(total / (data.length / 4) < 0.5);
      } catch {
        // Canvas "tainted" (server belum mengirim header CORS untuk gambar) → anggap terang.
        setDark(false);
      }
    };
    img.onerror = () => { if (!cancelled) setDark(false); };
    img.src = urlMatch[1];
    return () => { cancelled = true; };
  }, [backgroundCss]);

  return dark;
}

// ─── BoardTabs (pill + indikator geser) ─────────────────────────
const BOARD_TABS = [
  { id: "board",    label: "Board" },
  { id: "backlog",  label: "Backlog" },
  { id: "gantt",    label: "Gantt Chart" },
  { id: "files",    label: "Files" },
];

function TabIcon({ name }) {
  const common = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  switch (name) {
    case "board":
      return <svg {...common}><rect x="3" y="3" width="5" height="14" rx="1.5" /><rect x="10" y="3" width="5" height="18" rx="1.5" /><rect x="17" y="3" width="4" height="10" rx="1.5" /></svg>;
    case "backlog":
      return <svg {...common}><rect x="3" y="5" width="6" height="6" rx="1" /><path d="m3 17 2 2 4-4" /><path d="M13 6h8M13 12h8M13 18h8" /></svg>;
    case "gantt":
      return <svg {...common}><rect x="3" y="4" width="10" height="4" rx="1.2" /><rect x="8" y="10" width="13" height="4" rx="1.2" /><rect x="5" y="16" width="9" height="4" rx="1.2" /></svg>;
    default:
      return <svg {...common}><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" /></svg>;
  }
}

function BoardTabs({ active, onChange }) {
  const trackRef = useRef(null);
  const btnRefs = useRef({});
  const [indicator, setIndicator] = useState(null);
  const [animate, setAnimate] = useState(false);

  const measure = useCallback(() => {
    const el = btnRefs.current[active];
    if (!el) return;
    setIndicator({ left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight });
  }, [active]);

  useLayoutEffect(() => { measure(); }, [measure]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setAnimate(true));
    let ro;
    if (typeof ResizeObserver !== "undefined" && trackRef.current) {
      ro = new ResizeObserver(() => measure());
      ro.observe(trackRef.current);
    }
    if (document.fonts?.ready) document.fonts.ready.then(measure);
    return () => { cancelAnimationFrame(raf); ro?.disconnect(); };
  }, [measure]);

  return (
    <div ref={trackRef} role="tablist" aria-label="Tampilan board" className="kb-tabs-track">
      <span
        aria-hidden
        className="kb-tab-indicator"
        style={{
          opacity: indicator ? 1 : 0,
          transform: indicator ? `translate(${indicator.left}px, ${indicator.top}px)` : "none",
          width: indicator?.width || 0,
          height: indicator?.height || 0,
          transition: animate ? undefined : "none",
        }}
      />
      {BOARD_TABS.map((tab, i) => (
        <button
          key={tab.id}
          ref={el => { btnRefs.current[tab.id] = el; }}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={`kb-tab${active === tab.id ? " is-active" : ""}`}
          style={{ animationDelay: `${i * 70}ms` }}
          onClick={() => onChange(tab.id)}
        >
          <TabIcon name={tab.id} />
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Helper tanggal ─────────────────────────────────────────────
function dateToKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function keyToDate(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function taskRange(task) {
  const start = toDateKey(task.start_date);
  const end = toDateKey(task.due_date);
  if (!start && !end) return null;
  const s = start || end;
  const e = end || start;
  return s <= e ? { start: s, end: e } : { start: e, end: s };
}

function shortDate(key) {
  return keyToDate(key).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function statusLabel(status) {
  return status === "done" ? "Selesai" : status === "in-progress" ? "Sedang dikerjakan" : status === "todo" ? "To Do" : "Backlog";
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
  const [showAppearance, setShowAppearance] = useState(false);
  const [boardAppearance, setBoardAppearance] = useState({ background: 'whiteboard', background_image: null });
  const [appearanceFile, setAppearanceFile] = useState(null);
  const [appearanceSaving, setAppearanceSaving] = useState(false);
  useEffect(() => {
    if (!boardId) return;
    api.getBoard(boardId).then(data => setBoardAppearance({ background: data.background || 'whiteboard', background_image: data.background_image || null })).catch(err => console.error('Gagal memuat tampilan board:', err));
  }, [boardId]);
  const saveBoardAppearance = async () => {
    setAppearanceSaving(true);
    try {
      const form = new FormData(); form.append('background', boardAppearance.background);
      if (appearanceFile) form.append('background_image', appearanceFile);
      await api.updateBoardAppearance(boardId, form);
      const fresh = await api.getBoard(boardId);
      setBoardAppearance({ background: fresh.background || 'whiteboard', background_image: fresh.background_image || null });
      setAppearanceFile(null); setShowAppearance(false);
    } catch (err) { alert(err.message || 'Gagal menyimpan background board'); }
    finally { setAppearanceSaving(false); }
  };
  const boardBackgroundStyle = boardAppearance.background_image
    ? `url(${(import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '')}/storage/${boardAppearance.background_image})`
    : boardAppearance.background === 'green' ? 'linear-gradient(135deg, #174b38, #23634a)'
    : boardAppearance.background === 'blue' ? 'linear-gradient(135deg, #dbeafe, #eff6ff)'
    : boardAppearance.background === 'cream' ? 'linear-gradient(135deg, #f5ead5, #fffaf0)'
    : boardAppearance.background === 'dark' ? 'linear-gradient(135deg, #202124, #34363a)'
    : `url(${whiteboardBg})`;
  // Warna teks yang tampil langsung di atas background board (judul kolom dll.)
  const boardIsDark = useBoardIsDark(boardBackgroundStyle);
  const boardInk = boardIsDark ? "#ffffff" : "#0f172a";
  const boardInkSoft = boardIsDark ? "rgba(255,255,255,0.75)" : "rgba(15,23,42,0.55)";
  const boardInkTransition = "color .35s ease, background .35s ease, border-color .35s ease";

  const [quests, setQuests]           = useState([]);
  const [activeView, setActiveView] = useState("board");
  const [boardFiles, setBoardFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [fileError, setFileError] = useState("");


  const [dragOver, setDragOver]       = useState(null);

  const [loading, setLoading]         = useState(true);

  const [showMembers, setShowMembers] = useState(false);

  const [search, setSearch]           = useState("");

  const [priorityFilter, setPriorityFilter] = useState("semua");

  const [addModal, setAddModal]       = useState(null); // { status } | null

  const [newTitle, setNewTitle]       = useState("");

  const [newPriority, setNewPriority] = useState("sedang");

  const [newDueDate, setNewDueDate]   = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStatus, setNewStatus] = useState("todo");
  const [boardMembers, setBoardMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [savingTask, setSavingTask] = useState(false);
  const [priorityMenuOpen, setPriorityMenuOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [taskMenuOpenId, setTaskMenuOpenId] = useState(null);
  const [taskModalTab, setTaskModalTab] = useState("detail");
  const [taskEditForm, setTaskEditForm] = useState(null);
  const [savingTaskEdit, setSavingTaskEdit] = useState(false);



  useEffect(() => {
    if (!boardId || activeView !== "files") return;
    let active = true;
    setFilesLoading(true); setFileError("");
    api.getBoardFiles(boardId)
      .then(data => { if (active) setBoardFiles(Array.isArray(data) ? data : (data?.files || [])); })
      .catch(err => { if (active) setFileError(err.message || "Gagal memuat file board."); })
      .finally(() => { if (active) setFilesLoading(false); });
    return () => { active = false; };
  }, [boardId, activeView]);

  const uploadBoardFile = async (file) => {
    if (!file || !boardId) return;
    setFileUploading(true); setFileError("");
    try {
      const form = new FormData(); form.append("file", file);
      const result = await api.uploadBoardFile(boardId, form);
      const newFile = result?.file || result;
      if (newFile?.id) setBoardFiles(prev => [newFile, ...prev.filter(item => String(item.id) !== String(newFile.id))]);
      else setBoardFiles(await api.getBoardFiles(boardId).then(data => Array.isArray(data) ? data : (data?.files || [])));
    } catch (err) { setFileError(err.message || "Gagal mengunggah file."); }
    finally { setFileUploading(false); }
  };

  const downloadBoardFile = async (file) => {
    try {
      const blob = await api.downloadBoardFile(boardId, file.id);
      const url = URL.createObjectURL(blob); const link = document.createElement("a");
      link.href = url; link.download = file.original_name || file.name || "board-file"; link.click(); URL.revokeObjectURL(url);
    } catch (err) { setFileError(err.message || "Gagal mengunduh file."); }
  };

  const removeBoardFile = async (file) => {
    if (!window.confirm(`Hapus file ${file.original_name || file.name || "ini"}?`)) return;
    try { await api.deleteBoardFile(boardId, file.id); setBoardFiles(prev => prev.filter(item => String(item.id) !== String(file.id))); }
    catch (err) { setFileError(err.message || "Gagal menghapus file."); }
  };

  // Load board members for the multi-select assignee field.
  useEffect(() => {
    if (!boardId) return;
    let active = true;
    setMembersLoading(true);
    api.getBoardMembers(boardId)
      .then(data => {
        if (active) setBoardMembers(Array.isArray(data) ? data : (data?.members || []));
      })
      .catch(err => {
        console.error("Gagal mengambil anggota board:", err);
        if (active) setBoardMembers([]);
      })
      .finally(() => { if (active) setMembersLoading(false); });
    return () => { active = false; };
  }, [boardId, showMembers]);

  // ── Fetch tasks ──

// ── Fetch tasks + soft refresh ──

useEffect(() => {
  if (!boardId) return;

  let active = true;
  let isFetching = false;

  const loadTasks = async (showLoading = false) => {
    if (isFetching) return;

    isFetching = true;

    if (showLoading) {
      setLoading(true);
    }

    try {
      const data = await api.getTasks(boardId);

      if (!active || !Array.isArray(data)) return;

      const normalised = data.map(t => ({
        ...t,
        note: t.description ?? t.note ?? "",
        time: Number(t.time) || 0,
        isRunning: Boolean(t.is_running ?? t.isRunning),
        color: t.color ?? null,
        priority: t.priority ?? "sedang",
        due_date: toDateKey(t.due_date),
      }));

      setQuests(normalised);
    } catch (err) {
      console.error("Gagal memperbarui tasks:", err);
    } finally {
      isFetching = false;

      if (active && showLoading) {
        setLoading(false);
      }
    }
  };

  // Muat data pertama kali ketika board dibuka.
  loadTasks(true);

  // Periksa perubahan dari pengguna lain setiap 3 detik.
  const intervalId = setInterval(() => {
    if (!document.hidden) {
      loadTasks(false);
    }
  }, 3000);

  // Perbarui segera ketika pengguna kembali ke tab.
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      loadTasks(false);
    }
  };

  document.addEventListener(
    "visibilitychange",
    handleVisibilityChange
  );

  return () => {
    active = false;
    clearInterval(intervalId);

    document.removeEventListener(
      "visibilitychange",
      handleVisibilityChange
    );
  };
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



const openTaskDetails = (quest) => {
    setSelectedTaskId(quest.id);
    setTaskModalTab("detail");
    setTaskMenuOpenId(null);
    setTaskEditForm({
      title: quest.title || "",
      description: quest.note ?? quest.description ?? "",
      status: quest.status || "todo",
      priority: quest.priority || "sedang",
      due_date: toDateKey(quest.due_date),
      start_date: toDateKey(quest.start_date),
      assignees: (Array.isArray(quest.assignees) ? quest.assignees : []).map(a => Number(a.id ?? a.user_id)).filter(Number.isFinite),
    });
  };

  const beginEditTask = (quest) => {
    setTaskEditForm({
      title: quest.title || "",
      description: quest.note ?? quest.description ?? "",
      status: quest.status || "todo",
      priority: quest.priority || "sedang",
      due_date: toDateKey(quest.due_date),
      start_date: toDateKey(quest.start_date),
      assignees: (Array.isArray(quest.assignees) ? quest.assignees : []).map(a => Number(a.id ?? a.user_id)).filter(Number.isFinite),
    });
    setTaskModalTab("edit");
    setTaskMenuOpenId(null);
  };

  const saveTaskEdit = async (e) => {
    e.preventDefault();
    const currentTask = quests.find(q => String(q.id) === String(selectedTaskId));
    if (!currentTask || !taskEditForm || savingTaskEdit) return;
    if (!taskEditForm.title.trim()) {
      alert("Nama task wajib diisi.");
      return;
    }

    setSavingTaskEdit(true);
    try {
      const response = await api.updateTask(
        currentTask.id,
        taskEditForm.title.trim(),
        taskEditForm.description || "",
        taskEditForm.status,
        currentTask.color ?? null,
        currentTask.time ?? 0,
        taskEditForm.status === "in-progress" ? Boolean(currentTask.isRunning) : false,
        taskEditForm.due_date || null,
        taskEditForm.priority,
        taskEditForm.assignees,
        taskEditForm.start_date || null
      );

      const saved = response?.task || response;
      const updated = {
        ...currentTask,
        ...(saved && typeof saved === "object" ? saved : {}),
        title: taskEditForm.title.trim(),
        note: taskEditForm.description || "",
        description: taskEditForm.description || "",
        status: taskEditForm.status,
        priority: taskEditForm.priority,
        due_date: toDateKey(taskEditForm.due_date),
        start_date: toDateKey(taskEditForm.start_date),
        isRunning: taskEditForm.status === "in-progress" ? Boolean(currentTask.isRunning) : false,
        assignees: Array.isArray(saved?.assignees) ? saved.assignees : taskEditForm.assignees.map(id => {
          const member = boardMembers.find(m => Number(m.id ?? m.user_id) === Number(id));
          return member ? { ...member, id: Number(member.id ?? member.user_id) } : { id: Number(id) };
        }),
      };
      setQuests(prev => prev.map(q => String(q.id) === String(currentTask.id) ? updated : q));
      setTaskModalTab("detail");
    } catch (err) {
      console.error("Gagal memperbarui task:", err);
      alert(err.message || "Gagal menyimpan perubahan task.");
    } finally {
      setSavingTaskEdit(false);
    }
  };

  const openAddModal = (colId = "todo") => {

  if (!boardId) {

    alert("Board belum dimuat. Coba refresh.");

    return;

  }



  setNewTitle("");
  setNewDescription("");
  setNewStatus(colId || "todo");
  setNewPriority("sedang");
  setNewStartDate("");
  setNewDueDate("");

  setSelectedAssignees([]);
  setPriorityMenuOpen(false);
  setAddModal({ status: colId });

};



  const submitNewTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !addModal || savingTask) return;

    const colId = newStatus || addModal.status;
    if (newStartDate && newDueDate && newDueDate < newStartDate) {
      alert("Deadline tidak boleh lebih awal daripada tanggal mulai.");
      return;
    }
    const shouldRun = colId === "in-progress";
    setSavingTask(true);

    try {
      const res = await api.createTask(
        newTitle.trim(), newDescription.trim(), colId, null, boardId,
        newDueDate || null, 0, shouldRun, newPriority, selectedAssignees, newStartDate || null
      );

      const normalise = (t) => ({
        ...t,
        title: t.title ?? newTitle.trim(),
        status: t.status ?? colId,
        priority: t.priority ?? newPriority,
        due_date: toDateKey(t.due_date ?? newDueDate),
        start_date: toDateKey(t.start_date ?? newStartDate),
        note: t.description ?? t.note ?? newDescription.trim(),
        description: t.description ?? t.note ?? newDescription.trim(),
        time: Number(t.time) || 0,
        isRunning: Boolean(t.is_running ?? shouldRun),
        color: t.color ?? null,
        board_id: t.board_id ?? boardId,
        assignees: Array.isArray(t.assignees) ? t.assignees : [],
      });

      if (res && res.id) {
        setQuests(prev => [...prev, normalise(res)]);
      } else {
        const tasks = await api.getTasks(boardId);
        setQuests(tasks.map(t => ({
          ...t,
          note: t.description ?? t.note ?? "",
          time: Number(t.time) || 0,
          isRunning: Boolean(t.is_running ?? t.isRunning),
          color: t.color ?? null,
          priority: t.priority ?? "sedang",
          due_date: toDateKey(t.due_date),
          assignees: Array.isArray(t.assignees) ? t.assignees : [],
        })));
      }
      setAddModal(null);
    } catch (err) {
      console.error("Gagal buat task:", err);
      alert(err.message || "Gagal menyimpan tugas ke database.");
    } finally {
      setSavingTask(false);
    }
  };

  const deleteQuest = async (id) => {

    if (!window.confirm("Hapus tugas ini?")) return;

    try {

      await api.deleteTask(id);

      setQuests(prev => prev.filter(q => String(q.id) !== String(id)));
      if (String(selectedTaskId) === String(id)) setSelectedTaskId(null);
      if (String(taskMenuOpenId) === String(id)) setTaskMenuOpenId(null);
r
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



  const ganttQuests = quests.filter(t => {
    if (search.trim() && !t.title.toLowerCase().includes(search.trim().toLowerCase())) return false;
    if (priorityFilter !== "semua" && (t.priority || "sedang") !== priorityFilter) return false;
    return true;
  });

  const filteredQuests = (colId) => {

    let base = quests.filter(q => q.status === colId);

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

      background: boardBackgroundStyle,

      backgroundSize:"cover", backgroundPosition:"center",

      color:"var(--text-main)", position:"relative"

    }}>



      {/* ── Topbar: judul board + foto anggota (admin bermahkota) ── */}

      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"10px 16px",
        background:"rgba(255,255,255,0.92)",
        borderBottom:"0.5px solid var(--border)",
        flexShrink:0, backdropFilter:"blur(10px)",
        boxShadow:"0 1px 4px rgba(0,0,0,0.06)"
      }}>
        <span style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
          <span className="k-display" style={{ fontSize:18, fontWeight:600, color:"var(--k-ink)", whiteSpace:"nowrap" }}>
            {boardName || "Board"}
          </span>

          <MemberStack members={boardMembers} onClick={() => setShowMembers(true)} />

          <span style={{
            fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:999,
            color: isAdmin ? "#166534" : "#1e40af",
            background: isAdmin ? "rgba(220,252,231,0.9)" : "rgba(219,234,254,0.9)",
            textTransform:"uppercase", letterSpacing:"0.5px"
          }}>{isAdmin ? "Admin" : "Member"}</span>
        </span>

        <div />
      </div>

      {/* ── Board view navigation ── */}
      <div style={{display:"flex",alignItems:"center",padding:"10px 24px",background:"rgba(255,255,255,0.7)",borderBottom:"1px solid var(--border)",flexShrink:0,backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)"}}>
        <BoardTabs active={activeView} onChange={setActiveView} />
      </div>

      {/* ── Search + filter bar ── */}

      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12,
        padding:"10px 16px", background:"rgba(255,255,255,0.8)",
        borderBottom:"0.5px solid var(--border)", flexShrink:0, backdropFilter:"blur(10px)"
      }}>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          <ToolSearch value={search} onChange={setSearch} />

          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
            aria-label="Filter prioritas"
            style={{ height:40, padding:"0 12px", borderRadius:11, border:"1px solid var(--k-line)", fontFamily:"var(--k-font-body)", fontSize:12.5, fontWeight:600, color:"var(--k-ink)", outline:"none", background:"rgba(255,255,255,0.96)", cursor:"pointer" }}>
            <option value="semua">Semua Prioritas</option>
            {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:10, marginLeft:"auto" }}>
          {isAdmin && <ToolButton kind="background" onClick={() => setShowAppearance(true)}>Background</ToolButton>}
          <ToolButton kind="members" onClick={() => setShowMembers(true)}>Members</ToolButton>
          <button type="button" className="k-btn k-btn-primary" onClick={() => openAddModal("todo")} style={{ height:40, padding:"0 16px", borderRadius:11 }}>
            <Plus size={16} strokeWidth={2.4} /> Tambah Tugas Baru
          </button>
        </div>
      </div>

      {selectedTaskId !== null && (() => {
        const task = quests.find(q => String(q.id) === String(selectedTaskId));
        if (!task) return null;
        const form = taskEditForm || {
          title: task.title || "",
          description: task.note ?? task.description ?? "",
          status: task.status || "todo",
          priority: task.priority || "sedang",
          due_date: toDateKey(task.due_date),
          start_date: toDateKey(task.start_date),
          assignees: (Array.isArray(task.assignees) ? task.assignees : []).map(a => Number(a.id ?? a.user_id)).filter(Number.isFinite),
        };
        const updateForm = (key, value) => setTaskEditForm(prev => ({ ...(prev || form), [key]: value }));
        const assignedMembers = (Array.isArray(task.assignees) ? task.assignees : []);
        return (
          <div onClick={() => { if (!savingTaskEdit) setSelectedTaskId(null); }} style={{ position:"fixed", inset:0, zIndex:1200, background:"rgba(15,23,42,.48)", display:"flex", alignItems:"center", justifyContent:"center", padding:18 }}>
            <div onClick={e => e.stopPropagation()} style={{ width:760, maxWidth:"100%", maxHeight:"92vh", overflowY:"auto", background:"#fff", borderRadius:16, boxShadow:"0 24px 70px rgba(15,23,42,.24)", color:"#1e293b" }}>
              <div style={{ padding:"22px 24px 16px", borderBottom:"1px solid #edf0f4" }}>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:14 }}>
                  <div>
                    <div style={{ color:"#94a3b8", fontSize:11, fontWeight:700, letterSpacing:".04em", marginBottom:5 }}>TASK-{task.id}</div>
                    <h2 style={{ margin:0, fontSize:21, lineHeight:1.3, fontWeight:750 }}>{task.title}</h2>
                    <div style={{ color:"#94a3b8", fontSize:11, marginTop:7 }}>Task Kanbify{task.created_at ? ` · Dibuat ${new Date(task.created_at).toLocaleDateString("id-ID")}` : ""}</div>
                  </div>
                  <button type="button" aria-label="Tutup detail task" onClick={() => setSelectedTaskId(null)} style={{ border:0, background:"transparent", color:"#64748b", fontSize:24, cursor:"pointer", lineHeight:1 }}>×</button>
                </div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, marginTop:16 }}>
                  <div style={{ display:"flex", gap:4, borderBottom:"1px solid #e2e8f0" }}>
                    {["detail","edit"].map(tab => <button key={tab} type="button" onClick={() => { if (tab === "edit") beginEditTask(task); else setTaskModalTab("detail"); }} style={{ padding:"9px 16px", border:0, borderBottom:taskModalTab===tab?"2px solid #2563eb":"2px solid transparent", background:"transparent", color:taskModalTab===tab?"#2563eb":"#64748b", fontSize:12, fontWeight:650, cursor:"pointer" }}>{tab==="detail"?"▤  Detail":"✎  Edit"}</button>)}
                  </div>
                  <div style={{ position:"relative" }}>
                    <button type="button" onClick={() => setTaskMenuOpenId(prev => prev === `detail-${task.id}` ? null : `detail-${task.id}`)} style={{ border:"1px solid #e2e8f0", background:"#fff", borderRadius:8, padding:"7px 11px", color:"#475569", cursor:"pointer" }}>⋯</button>
                    {taskMenuOpenId === `detail-${task.id}` && <div style={{ position:"absolute", right:0, top:38, zIndex:4, width:145, background:"#fff", border:"1px solid #e2e8f0", borderRadius:9, boxShadow:"0 12px 28px rgba(15,23,42,.15)", padding:5 }}>
                      <button type="button" onClick={() => beginEditTask(task)} style={{ display:"block", width:"100%", padding:"9px 10px", border:0, background:"#fff", textAlign:"left", cursor:"pointer", color:"#334155", fontSize:12 }}>✎ Edit Task</button>
                      <button type="button" onClick={() => { setTaskMenuOpenId(null); deleteQuest(task.id); }} style={{ display:"block", width:"100%", padding:"9px 10px", border:0, background:"#fff", textAlign:"left", cursor:"pointer", color:"#dc2626", fontSize:12 }}>⌫ Hapus Task</button>
                    </div>}
                  </div>
                </div>
              </div>

              {taskModalTab === "detail" ? (
                <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1.3fr) minmax(220px,.9fr)", gap:16, padding:20 }}>
                  <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                    <section style={{ border:"1px solid #edf0f4", borderRadius:10, padding:14 }}>
                      <div style={{ fontSize:12, fontWeight:700, marginBottom:8 }}>Deskripsi / Catatan</div>
                      <div style={{ fontSize:13, color:task.note ? "#475569" : "#94a3b8", lineHeight:1.65, whiteSpace:"pre-wrap" }}>{task.note || task.description || "Belum ada deskripsi untuk task ini."}</div>
                    </section>
                    <section style={{ border:"1px solid #edf0f4", borderRadius:10, padding:14 }}>
                      <div style={{ fontSize:12, fontWeight:700, marginBottom:10 }}>Informasi Task</div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,minmax(0,1fr))", gap:12 }}>
                        <div><div style={{ fontSize:10, color:"#94a3b8", marginBottom:5 }}>Status</div><span style={{ fontSize:12, fontWeight:650 }}>{FIXED_COLUMNS.find(c => c.id === task.status)?.title || task.status}</span></div>
                        <div><div style={{ fontSize:10, color:"#94a3b8", marginBottom:5 }}>Prioritas</div><span style={{ display:"inline-block", fontSize:11, fontWeight:700, borderRadius:6, padding:"4px 7px", background:priorityStyle(task.priority).bg, color:priorityStyle(task.priority).text }}>{priorityStyle(task.priority).label}</span></div>
                        <div><div style={{ fontSize:10, color:"#94a3b8", marginBottom:5 }}>Tanggal mulai</div><span style={{ fontSize:12 }}>{task.start_date ? formatDateLabel(toDateKey(task.start_date)) : "Belum ditentukan"}</span></div>
                        <div><div style={{ fontSize:10, color:"#94a3b8", marginBottom:5 }}>Deadline</div><span style={{ fontSize:12 }}>{task.due_date ? formatDateLabel(toDateKey(task.due_date)) : "Belum ditentukan"}</span></div>
                      </div>
                    </section>
                    <section style={{ border:"1px solid #edf0f4", borderRadius:10, padding:14 }}>
                      <div style={{ fontSize:12, fontWeight:700, marginBottom:8 }}>Waktu pengerjaan</div>
                      <div style={{ fontFamily:"monospace", fontSize:13, color:"#475569" }}>{formatTime(task.time)}</div>
                    </section>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                    <section style={{ border:"1px solid #edf0f4", borderRadius:10, padding:14 }}>
                      <div style={{ fontSize:12, fontWeight:700, marginBottom:10 }}>Anggota yang mengerjakan</div>
                      {assignedMembers.length ? assignedMembers.map((person, index) => <div key={person.id ?? person.user_id ?? index} style={{ display:"flex", alignItems:"center", gap:9, marginBottom:9 }}>
                        <span style={{ width:30, height:30, borderRadius:"50%", background:"#e0edff", color:"#1d4ed8", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700 }}>{(person.fullname || person.name || person.username || "M").split(/\s+/).map(p=>p[0]).join("").slice(0,2).toUpperCase()}</span>
                        <span style={{ fontSize:12, color:"#334155" }}>{person.fullname || person.name || person.username || `User ${person.id ?? person.user_id}`}</span>
                      </div>) : <div style={{ fontSize:12, color:"#94a3b8" }}>Belum ada anggota yang ditugaskan.</div>}
                      <button type="button" onClick={() => beginEditTask(task)} style={{ marginTop:5, border:"1px solid #e2e8f0", background:"#fff", borderRadius:7, padding:"7px 10px", color:"#475569", fontSize:11, cursor:"pointer" }}>Ubah anggota</button>
                    </section>
                    <section style={{ border:"1px solid #edf0f4", borderRadius:10, padding:14 }}>
                      <div style={{ fontSize:12, fontWeight:700, marginBottom:8 }}>Catatan</div>
                      <div style={{ fontSize:12, color:"#64748b", lineHeight:1.5 }}>Gunakan tab Edit untuk memperbarui deskripsi, prioritas, status, jadwal, atau anggota task.</div>
                    </section>
                  </div>
                </div>
              ) : (
                <form onSubmit={saveTaskEdit} style={{ padding:20 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1.2fr) minmax(220px,.8fr)", gap:16 }}>
                    <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
                      <label style={{ fontSize:12, fontWeight:650, color:"#475569" }}>Nama task
                        <input required maxLength={255} value={form.title} onChange={e => updateForm("title", e.target.value)} style={{ display:"block", width:"100%", marginTop:6, padding:"10px 11px", border:"1px solid #dbe1e8", borderRadius:8, fontSize:13, boxSizing:"border-box" }} />
                      </label>
                      <label style={{ fontSize:12, fontWeight:650, color:"#475569" }}>Detail info / catatan
                        <textarea rows={6} value={form.description} onChange={e => updateForm("description", e.target.value)} placeholder="Jelaskan pekerjaan dan hasil yang diharapkan..." style={{ display:"block", width:"100%", resize:"vertical", marginTop:6, padding:"10px 11px", border:"1px solid #dbe1e8", borderRadius:8, fontSize:13, boxSizing:"border-box", lineHeight:1.5 }} />
                      </label>
                      <label style={{ fontSize:12, fontWeight:650, color:"#475569" }}>Anggota yang mengerjakan
                        <div style={{ marginTop:6, border:"1px solid #dbe1e8", borderRadius:8, padding:"8px 10px", maxHeight:150, overflowY:"auto" }}>
                          {boardMembers.length === 0 ? <div style={{ fontSize:12, color:"#94a3b8" }}>Tidak ada data anggota board.</div> : boardMembers.map(member => {
                            const memberId = Number(member.id ?? member.user_id);
                            const checked = form.assignees.includes(memberId);
                            return <label key={memberId} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 0", fontSize:12, fontWeight:400, cursor:"pointer" }}>
                              <input type="checkbox" checked={checked} onChange={e => updateForm("assignees", e.target.checked ? [...new Set([...form.assignees, memberId])] : form.assignees.filter(id => id !== memberId))} />
                              <span>{member.fullname || member.name || member.username || `User ${memberId}`}</span>
                            </label>;
                          })}
                        </div>
                      </label>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
                      <label style={{ fontSize:12, fontWeight:650, color:"#475569" }}>Status
                        <select value={form.status} onChange={e => updateForm("status", e.target.value)} style={{ display:"block", width:"100%", marginTop:6, padding:"10px 11px", border:"1px solid #dbe1e8", borderRadius:8, background:"#fff", fontSize:13 }}>
                          {FIXED_COLUMNS.map(col => <option key={col.id} value={col.id}>{col.title}</option>)}
                          {form.status === "backlog" && <option value="backlog">Backlog</option>}
                        </select>
                      </label>
                      <label style={{ fontSize:12, fontWeight:650, color:"#475569" }}>Prioritas
                        <select value={form.priority} onChange={e => updateForm("priority", e.target.value)} style={{ display:"block", width:"100%", marginTop:6, padding:"10px 11px", border:"1px solid #dbe1e8", borderRadius:8, background:"#fff", fontSize:13 }}>
                          {PRIORITIES.map(priority => <option key={priority.id} value={priority.id}>{priority.label}</option>)}
                        </select>
                      </label>
                      <label style={{ fontSize:12, fontWeight:650, color:"#475569" }}>Tanggal mulai
                        <input type="date" value={form.start_date || ""} onChange={e => updateForm("start_date", e.target.value)} style={{ display:"block", width:"100%", marginTop:6, padding:"10px 11px", border:"1px solid #dbe1e8", borderRadius:8, fontSize:13, boxSizing:"border-box" }} />
                      </label>
                      <label style={{ fontSize:12, fontWeight:650, color:"#475569" }}>Deadline
                        <input type="date" value={form.due_date || ""} onChange={e => updateForm("due_date", e.target.value)} style={{ display:"block", width:"100%", marginTop:6, padding:"10px 11px", border:"1px solid #dbe1e8", borderRadius:8, fontSize:13, boxSizing:"border-box" }} />
                      </label>
                    </div>
                  </div>
                  <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:22, borderTop:"1px solid #edf0f4", paddingTop:16 }}>
                    <button type="button" disabled={savingTaskEdit} onClick={() => setTaskModalTab("detail")} style={{ padding:"9px 14px", border:"1px solid #dbe1e8", borderRadius:8, background:"#fff", cursor:"pointer", color:"#475569", fontSize:12 }}>Batal</button>
                    <button type="submit" disabled={savingTaskEdit || !form.title.trim()} style={{ padding:"9px 16px", border:0, borderRadius:8, background:"#f97316", color:"#fff", fontWeight:700, cursor:savingTaskEdit?"wait":"pointer", fontSize:12 }}>{savingTaskEdit?"Menyimpan...":"Simpan Perubahan"}</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        );
      })()}

      {addModal && (
        <div
          style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.42)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1001, padding:16 }}
          onClick={() => { if (!savingTask) setAddModal(null); }}
        >
          <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:12, padding:20, width:440, maxWidth:"100%", maxHeight:"90vh", overflowY:"auto", fontFamily:"system-ui, sans-serif", boxShadow:"0 20px 60px rgba(0,0,0,0.18)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
              <h3 style={{ margin:0, fontSize:18, fontWeight:700, color:"#1e293b" }}>Tambah Tugas Baru</h3>
              <button type="button" aria-label="Tutup" disabled={savingTask} onClick={() => setAddModal(null)} style={{ border:0, background:"transparent", color:"#64748b", fontSize:22, cursor:"pointer", lineHeight:1 }}>×</button>
            </div>

            <form onSubmit={submitNewTask}>
              <label style={{ display:"block", fontSize:10, fontWeight:700, color:"#475569", marginBottom:6 }}>JUDUL TUGAS</label>
              <input autoFocus required value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Misal: Membuat wireframe layout..." style={{ width:"100%", padding:"10px 11px", borderRadius:7, border:"1px solid #cbd5e1", fontSize:12, outline:"none", boxSizing:"border-box", marginBottom:13 }} />

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:13}}>
                <label style={{display:"block",fontSize:10,fontWeight:700,color:"#475569"}}>STATUS KOLOM
                  <select value={newStatus} onChange={e=>setNewStatus(e.target.value)} style={{display:"block",width:"100%",marginTop:6,padding:"9px 10px",borderRadius:7,border:"1px solid #cbd5e1",background:"#fff",fontSize:12,boxSizing:"border-box"}}>
                    {FIXED_COLUMNS.map(col=><option key={col.id} value={col.id}>{col.title}</option>)}<option value="backlog">Backlog</option>
                  </select>
                </label>
                <label style={{display:"block",fontSize:10,fontWeight:700,color:"#475569"}}>PRIORITAS
                  <select value={newPriority} onChange={e=>setNewPriority(e.target.value)} style={{display:"block",width:"100%",marginTop:6,padding:"9px 10px",borderRadius:7,border:"1px solid #cbd5e1",background:"#fff",fontSize:12,boxSizing:"border-box"}}>
                    {PRIORITIES.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </label>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:13}}>
                <label style={{display:"block",fontSize:10,fontWeight:700,color:"#475569"}}>TANGGAL MULAI
                  <input type="date" value={newStartDate} onChange={e=>setNewStartDate(e.target.value)} style={{display:"block",width:"100%",marginTop:6,padding:"9px 8px",borderRadius:7,border:"1px solid #cbd5e1",fontSize:12,boxSizing:"border-box"}} />
                </label>
                <label style={{display:"block",fontSize:10,fontWeight:700,color:"#475569"}}>DEADLINE
                  <input type="date" min={newStartDate || undefined} value={newDueDate} onChange={e=>setNewDueDate(e.target.value)} style={{display:"block",width:"100%",marginTop:6,padding:"9px 8px",borderRadius:7,border:"1px solid #cbd5e1",fontSize:12,boxSizing:"border-box"}} />
                </label>
              </div>
              <label style={{display:"block",fontSize:10,fontWeight:700,color:"#475569",marginBottom:6}}>CATATAN / DETAIL</label>
              <textarea rows={3} value={newDescription} onChange={e=>setNewDescription(e.target.value)} placeholder="Tambahkan catatan atau deskripsi tugas di sini..." style={{display:"block",width:"100%",resize:"vertical",padding:"10px 11px",borderRadius:7,border:"1px solid #cbd5e1",fontSize:12,boxSizing:"border-box",marginBottom:15}} />

              <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#475569", marginBottom:7 }}>Pilih Member</label>
              <div style={{ border:"1px solid #dbe1e8", borderRadius:8, padding:"7px 10px", marginBottom:18, maxHeight:150, overflowY:"auto" }}>
                {membersLoading ? <div style={{ color:"#64748b", fontSize:12, padding:6 }}>Memuat anggota board...</div> : boardMembers.length === 0 ? <div style={{ color:"#94a3b8", fontSize:12, padding:6 }}>Belum ada anggota yang tersedia.</div> : boardMembers.map(member => {
                  const userId = Number(member.user_id ?? member.id);
                  const checked = selectedAssignees.includes(userId);
                  const displayName = member.fullname || member.name || member.username || `User ${userId}`;
                  return <label key={userId} style={{ display:"flex", alignItems:"center", gap:9, padding:"7px 4px", cursor:"pointer", fontSize:12, color:"#334155" }}>
                    <input type="checkbox" checked={checked} onChange={e => setSelectedAssignees(prev => e.target.checked ? [...new Set([...prev, userId])] : prev.filter(id => id !== userId))} style={{ accentColor:"#f97316" }} />
                    <span style={{ display:"flex", flexDirection:"column", gap:2 }}><span style={{ fontWeight:600 }}>{displayName}</span>{member.username && <span style={{ color:"#94a3b8", fontSize:11 }}>@{member.username}</span>}</span>
                  </label>;
                })}
              </div>
              {selectedAssignees.length > 0 && <div style={{ fontSize:11, color:"#64748b", marginTop:-11, marginBottom:16 }}>{selectedAssignees.length} anggota dipilih</div>}

              <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                <button type="button" disabled={savingTask} onClick={() => setAddModal(null)} style={{ padding:"9px 16px", borderRadius:8, border:"1px solid #dbe1e8", background:"#fff", cursor:"pointer", fontSize:13, color:"#334155" }}>Batal</button>
                <button type="submit" disabled={savingTask || !newTitle.trim()} style={{ padding:"9px 18px", borderRadius:8, border:"none", background:savingTask ? "#fdba74" : "#f97316", color:"#fff", fontWeight:600, cursor:savingTask ? "wait" : "pointer", fontSize:13 }}>{savingTask ? "Menyimpan..." : "Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMembers && (

        <MembersModal boardId={boardId} onClose={() => setShowMembers(false)} />

      )}



      {showAppearance && isAdmin && (
        <div style={{ position:"fixed", inset:0, zIndex:1100, background:"rgba(15,23,42,.45)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }} onClick={() => !appearanceSaving && setShowAppearance(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width:440, maxWidth:"100%", background:"#fff", borderRadius:16, padding:24, boxShadow:"0 20px 60px rgba(0,0,0,.18)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}><h3 style={{ margin:0, color:"#1e293b", fontSize:18 }}>Background Board</h3><button onClick={() => setShowAppearance(false)} style={{ border:0, background:"transparent", fontSize:22, cursor:"pointer", color:"#64748b" }}>×</button></div>
            <p style={{ margin:"0 0 16px", color:"#64748b", fontSize:13 }}>Pilih tampilan untuk board ini. Semua anggota akan melihat background yang sama.</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,minmax(0,1fr))", gap:10 }}>
              {[
                {id:"whiteboard",label:"Papan tulis putih",preview:"#ffffff",border:"#dbe1e8"}, {id:"green",label:"Papan tulis hijau",preview:"linear-gradient(135deg,#174b38,#23634a)",border:"#174b38"}, {id:"blue",label:"Biru lembut",preview:"linear-gradient(135deg,#dbeafe,#eff6ff)",border:"#bfdbfe"}, {id:"cream",label:"Krem",preview:"linear-gradient(135deg,#f5ead5,#fffaf0)",border:"#e7d8bb"}, {id:"dark",label:"Gelap",preview:"linear-gradient(135deg,#202124,#34363a)",border:"#34363a"}
              ].map(option => <button key={option.id} onClick={() => setBoardAppearance(v => ({...v,background:option.id}))} style={{ textAlign:"left", padding:0, border:boardAppearance.background===option.id?"2px solid #f97316":"1px solid #e2e8f0", borderRadius:10, overflow:"hidden", background:"#fff", cursor:"pointer" }}><div style={{ height:58, background:option.preview, borderBottom:`1px solid ${option.border}` }} /><div style={{ padding:"9px 10px", fontSize:12, color:"#334155", fontWeight:600 }}>{option.label}{boardAppearance.background===option.id?" ✓":""}</div></button>)}
            </div>
            <label style={{ display:"block", marginTop:18, color:"#334155", fontWeight:600, fontSize:12 }}>Atau unggah gambar sendiri (JPG, PNG, WEBP; maks. 5 MB)</label><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setAppearanceFile(e.target.files?.[0] || null)} style={{ width:"100%", marginTop:8, fontSize:12 }} />
            {appearanceFile && <div style={{ marginTop:6, fontSize:12, color:"#64748b" }}>Dipilih: {appearanceFile.name}</div>}
            <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:22 }}><button onClick={() => setShowAppearance(false)} disabled={appearanceSaving} style={{ padding:"9px 14px", border:"1px solid #dbe1e8", borderRadius:8, background:"#fff", cursor:"pointer" }}>Batal</button><button onClick={saveBoardAppearance} disabled={appearanceSaving} style={{ padding:"9px 16px", border:0, borderRadius:8, background:"#f97316", color:"#fff", fontWeight:600, cursor:"pointer" }}>{appearanceSaving?"Menyimpan...":"Simpan background"}</button></div>
          </div>
        </div>
      )}

      <div style={{ display:"flex", flex:1, overflow:"hidden", position:"relative" }}>



        {/* ── Board ── */}

        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", padding:"20px", minWidth:0 }}>

          {loading ? (

            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", flex:1, color:boardInkSoft, transition:boardInkTransition, fontSize:14 }}>

              Memuat tugas...

            </div>

          ) : (

            <div style={{ display: activeView === "board" ? "flex" : "none", gap:20, flex:1, overflowX:"auto", overflowY:"hidden" }}>

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

                      borderRadius:0, border:"none",

                      background: isOver ? "rgba(255,255,255,0.12)" : "transparent",

                      backdropFilter:"none",

                      transition:"background .2s", minWidth:240,

                      overflow:"visible", boxShadow:"none"

                    }}>



                    {/* Column header: kotak glass berisi nama tahap + jumlah tugas (selalu terbaca di background apa pun) */}

                    <div className="kb-col-chip" style={{ margin:"6px 8px 0", padding:"9px 10px 9px 14px", borderRadius:14, display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, flexShrink:0, background:"rgba(255,255,255,0.92)", backdropFilter:"blur(14px) saturate(150%)", WebkitBackdropFilter:"blur(14px) saturate(150%)", border:"1px solid rgba(255,255,255,0.85)", boxShadow:"0 6px 20px rgba(15,23,42,0.16), inset 0 1px 0 rgba(255,255,255,0.8)" }}>

                      <span style={{ fontWeight:800, fontSize:14, letterSpacing:"-0.1px", userSelect:"none", color:"#0f172a", display:"flex", alignItems:"center", gap:9 }}>

                        <span style={{ width:9, height:9, borderRadius:"50%", background:col.dot, boxShadow:`0 0 0 3px ${col.dot}33`, display:"inline-block" }} />

                        {col.title}

                      </span>

                      <div title={`${cards.length} tugas`} style={{ background:col.dot, color:"#ffffff", fontSize:12, borderRadius:999, minWidth:26, height:26, padding:"0 8px", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, boxShadow:`0 3px 10px ${col.dot}59` }}>

                        {cards.length}

                      </div>

                    </div>



                    {/* Cards */}

                    <div style={{ flex:1, overflowY:"auto", padding:"12px 8px 14px", minHeight:180 }}>

                      {cards.length === 0 && col.id !== "in-progress" && col.id !== "done" && (

                        <div style={{ textAlign:"center", paddingTop:10 }}>

                          <button onClick={() => openAddModal(col.id)} className="kb-cal-btn" style={{ width:34, height:34, borderRadius:"50%", border:"1px solid rgba(255,255,255,0.85)", background:"rgba(255,255,255,0.8)", backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)", color:"#334155", boxShadow:"0 4px 12px rgba(15,23,42,0.14)", fontSize:20, lineHeight:1, cursor:"pointer" }}>+</button>

                        </div>

                      )}



                      {cards.map(quest => (
                        <TaskCard
                          key={quest.id}
                          quest={quest}
                          cardColor={CARD_COLORS.find(c => c.bg === quest.color)}
                          menuOpen={String(taskMenuOpenId) === String(quest.id)}
                          onOpen={() => openTaskDetails(quest)}
                          onDragStart={e => handleDragStart(e, quest.id)}
                          onToggleMenu={() => setTaskMenuOpenId(prev => String(prev) === String(quest.id) ? null : quest.id)}
                          onCloseMenu={() => setTaskMenuOpenId(null)}
                          onEdit={() => { setTaskMenuOpenId(null); setSelectedTaskId(quest.id); beginEditTask(quest); }}
                          onDelete={() => { setTaskMenuOpenId(null); deleteQuest(quest.id); }}
                          onToggleTimer={() => toggleTimer(quest.id)}
                        />
                      ))}

                      {cards.length > 0 && col.id !== "in-progress" && col.id !== "done" && (

                        <div style={{ textAlign:"center", marginTop:4 }}>

                          <button onClick={() => openAddModal(col.id)} className="kb-cal-btn" style={{ width:34, height:34, borderRadius:"50%", border:"1px solid rgba(255,255,255,0.85)", background:"rgba(255,255,255,0.8)", backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)", color:"#334155", boxShadow:"0 4px 12px rgba(15,23,42,0.14)", fontSize:20, lineHeight:1, cursor:"pointer" }}>+</button>

                        </div>

                      )}

                    </div>

                  </div>

                );

              })}

            </div>

          )}

          {!loading && activeView !== "board" && (
            <div key={activeView} className="kb-view-in" style={{ flex:1, minHeight:0, borderRadius:20, padding:22, ...(activeView === "gantt" ? { display:"flex", flexDirection:"column", overflow:"hidden" } : { overflowY:"auto" }), ...GLASS.panel }}>
              {activeView === "backlog" && <>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, marginBottom:18 }}>
                  <div>
                    <h2 style={{ margin:0, fontSize:22, fontWeight:800, letterSpacing:"-0.3px", color:"#0f172a" }}>Backlog</h2>
                    <p style={{ margin:"5px 0 0", fontSize:12, color:"#475569" }}>Tugas yang belum siap masuk pengerjaan aktif.</p>
                  </div>
                  <button className="kb-cal-btn" onClick={() => openAddModal("backlog")} style={{ border:0, borderRadius:10, background:"linear-gradient(135deg,#fb923c,#f97316)", boxShadow:"0 6px 16px rgba(249,115,22,.35)", color:"white", padding:"10px 15px", fontWeight:700, fontSize:12, cursor:"pointer" }}>+ Tambah tugas</button>
                </div>
                {quests.filter(q => q.status === "backlog").length === 0
                  ? <div style={{ padding:36, textAlign:"center", color:"#64748b", fontSize:13 }}>Belum ada tugas di backlog. Tambahkan tugas yang ingin dikerjakan nanti.</div>
                  : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:14 }}>
                      {quests.filter(q => q.status === "backlog").map(q => (
                        <div key={q.id} className="kb-glass-card" onClick={() => openTaskDetails(q)} style={{ ...GLASS.card, borderRadius:14, padding:14, cursor:"pointer" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", gap:8, marginBottom:9 }}>
                            <span style={{ fontSize:10, color:"#64748b", fontWeight:700 }}>TASK-{q.id}</span>
                            <span style={{ fontSize:10, fontWeight:700, color:priorityStyle(q.priority).text, background:priorityStyle(q.priority).bg, padding:"3px 7px", borderRadius:6 }}>{priorityStyle(q.priority).label}</span>
                          </div>
                          <div style={{ fontWeight:700, color:"#0f172a", fontSize:13 }}>{q.title}</div>
                          {q.note && <p style={{ fontSize:12, color:"#475569", lineHeight:1.5 }}>{q.note}</p>}
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, marginTop:12 }}>
                            <span style={{ fontSize:11, color:"#475569" }}>{q.due_date ? `Deadline ${formatDateLabel(toDateKey(q.due_date))}` : "Belum ada deadline"}</span>
                            <button
                              onClick={e => { e.stopPropagation(); const updated = { ...q, status:"todo", isRunning:false }; setQuests(prev => prev.map(t => String(t.id) === String(q.id) ? updated : t)); syncTask(updated); }}
                              style={{ border:"1px solid rgba(251,146,60,.5)", background:"rgba(255,247,237,.85)", color:"#c2410c", padding:"6px 9px", borderRadius:7, cursor:"pointer", fontSize:11, fontWeight:700, whiteSpace:"nowrap", flexShrink:0 }}
                            >Pindah ke To Do</button>
                          </div>
                        </div>
                      ))}
                    </div>}
              </>}

              {activeView === "gantt" && (
                <BoardGantt quests={ganttQuests} onOpenTask={openTaskDetails} onAddTask={() => openAddModal("todo")} />
              )}

              {activeView === "files" && <>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, marginBottom:18 }}>
                  <div>
                    <h2 style={{ margin:0, fontSize:22, fontWeight:800, letterSpacing:"-0.3px", color:"#0f172a" }}>Files</h2>
                    <p style={{ margin:"5px 0 0", fontSize:12, color:"#475569" }}>Dokumen dan lampiran yang dibagikan di board ini.</p>
                  </div>
                  <label className="kb-cal-btn" style={{ border:0, borderRadius:10, background:fileUploading ? "#fdba74" : "linear-gradient(135deg,#fb923c,#f97316)", boxShadow:"0 6px 16px rgba(249,115,22,.35)", color:"white", padding:"10px 15px", fontWeight:700, cursor:fileUploading ? "wait" : "pointer", fontSize:12 }}>
                    {fileUploading ? "Mengunggah..." : "+ Unggah file"}
                    <input type="file" disabled={fileUploading} onChange={e => { uploadBoardFile(e.target.files?.[0]); e.target.value = ""; }} style={{ display:"none" }} />
                  </label>
                </div>
                {fileError && <div style={{ padding:10, marginBottom:12, borderRadius:8, background:"rgba(254,242,242,.9)", color:"#b91c1c", fontSize:12 }}>{fileError}</div>}
                {filesLoading
                  ? <div style={{ padding:28, textAlign:"center", color:"#475569", fontSize:12 }}>Memuat file...</div>
                  : boardFiles.length === 0
                    ? <div style={{ padding:36, textAlign:"center", color:"#64748b", fontSize:13 }}>Belum ada file. Unggah dokumen untuk membagikannya kepada anggota board.</div>
                    : <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                        {boardFiles.map(file => (
                          <div key={file.id} className="kb-glass-card" style={{ ...GLASS.card, display:"flex", alignItems:"center", gap:12, padding:12, borderRadius:12 }}>
                            <div style={{ width:38, height:38, borderRadius:10, background:"rgba(255,255,255,.75)", border:"1px solid rgba(255,255,255,.9)", display:"grid", placeItems:"center", color:"#475569", fontWeight:800, fontSize:10 }}>FILE</div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:12, fontWeight:700, color:"#0f172a", overflowWrap:"anywhere" }}>{file.original_name || file.name || file.filename || `File ${file.id}`}</div>
                              <div style={{ fontSize:10, color:"#64748b", marginTop:4 }}>{file.created_at ? new Date(file.created_at).toLocaleDateString("id-ID") : "File board"}{file.user?.fullname ? ` · ${file.user.fullname}` : ""}</div>
                            </div>
                            <button onClick={() => downloadBoardFile(file)} style={{ border:"1px solid rgba(255,255,255,.9)", background:"rgba(255,255,255,.7)", borderRadius:7, padding:"7px 10px", cursor:"pointer", fontSize:11, color:"#334155" }}>Unduh</button>
                            {isAdmin && <button onClick={() => removeBoardFile(file)} style={{ border:"1px solid rgba(254,202,202,.9)", background:"rgba(255,255,255,.7)", borderRadius:7, padding:"7px 10px", cursor:"pointer", fontSize:11, color:"#b91c1c" }}>Hapus</button>}
                          </div>
                        ))}
                      </div>}
              </>}
            </div>
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

        /* ── Tabs pill ── */
        .kb-tabs-track { position:relative; display:inline-flex; flex-wrap:wrap; gap:4px; padding:5px; border-radius:999px; background:rgba(255,255,255,0.6); border:1px solid rgba(255,255,255,0.85); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); box-shadow:0 4px 18px rgba(15,23,42,0.1), inset 0 1px 0 rgba(255,255,255,0.8); }
        .kb-tab-indicator { position:absolute; left:0; top:0; border-radius:999px; background:linear-gradient(135deg,#fb923c,#f97316 55%,#ea580c); box-shadow:0 6px 16px rgba(249,115,22,0.42); pointer-events:none; transition: transform .5s cubic-bezier(.34,1.4,.5,1), width .5s cubic-bezier(.34,1.4,.5,1), height .5s cubic-bezier(.34,1.4,.5,1), opacity .2s; }
        .kb-tab { position:relative; z-index:1; display:inline-flex; align-items:center; gap:8px; padding:9px 16px; border:0; border-radius:999px; background:transparent; color:#334155; font-size:12.5px; font-weight:600; cursor:pointer; transition:color .25s, background .25s, transform .15s; animation:kb-tab-in .55s cubic-bezier(.22,1,.36,1) backwards; }
        .kb-tab svg { transition:transform .3s cubic-bezier(.34,1.56,.64,1); }
        .kb-tab:hover:not(.is-active) { background:rgba(255,255,255,0.85); color:#c2410c; }
        .kb-tab:hover svg { transform:scale(1.18) rotate(-6deg); }
        .kb-tab:active { transform:scale(.96); }
        .kb-tab.is-active { color:#fff; font-weight:700; }
        .kb-tab:focus-visible { outline:2px solid #ea580c; outline-offset:2px; }

        /* ── Animasi umum ── */
        @keyframes kb-tab-in { from { opacity:0; transform:translateY(-12px) scale(.9); } to { opacity:1; transform:none; } }
        @keyframes kb-view-in { from { opacity:0; transform:translateY(16px) scale(.985); } to { opacity:1; transform:none; } }
        @keyframes kb-slide-next { from { opacity:0; transform:translateX(26px); } to { opacity:1; transform:none; } }
        @keyframes kb-slide-prev { from { opacity:0; transform:translateX(-26px); } to { opacity:1; transform:none; } }
        @keyframes kb-pulse { 0%,100% { box-shadow:0 0 0 0 rgba(249,115,22,.5); } 50% { box-shadow:0 0 0 6px rgba(249,115,22,0); } }
        .kb-view-in { animation:kb-view-in .45s cubic-bezier(.22,1,.36,1) both; }
        .kb-slide-next { animation:kb-slide-next .35s cubic-bezier(.22,1,.36,1) both; }
        .kb-slide-prev { animation:kb-slide-prev .35s cubic-bezier(.22,1,.36,1) both; }

        .kb-col-chip { transition:transform .2s ease, box-shadow .2s ease; }
        .kb-col-chip:hover { transform:translateY(-1px); }

        /* ── Glass card + tombol ── */
        .kb-glass-card { transition:transform .2s ease, box-shadow .2s ease, background .2s ease; }
        .kb-glass-card:hover { transform:translateY(-2px); background:rgba(255,255,255,0.78) !important; box-shadow:0 12px 26px rgba(15,23,42,0.13) !important; }
        .kb-task { transition:transform .16s ease, box-shadow .16s ease; }
        .kb-task:hover { transform:translateY(-2px); box-shadow:0 12px 24px -10px rgba(30,25,10,0.28) !important; }
        .kb-task:focus-visible { outline:2px solid #ea580c; outline-offset:2px; }
        .kb-cal-btn { transition:transform .15s ease, filter .15s ease; }
        .kb-cal-btn:hover { transform:translateY(-1px); filter:brightness(1.04); }
        .kb-cal-btn:active { transform:scale(.95); }

        /* ── Calendar ── */
        .kb-cal-layout { display:grid; grid-template-columns:minmax(0,1fr) 320px; gap:18px; align-items:start; }
        @media (max-width:1000px) { .kb-cal-layout { grid-template-columns:minmax(0,1fr); } }
        .kb-cal-cell { transition:background .2s, box-shadow .2s; }
        .kb-cal-cell:hover::after { content:""; position:absolute; inset:0; background:rgba(255,255,255,0.35); pointer-events:none; }
        .kb-cal-cell:focus-visible { box-shadow:inset 0 0 0 2px #ea580c !important; }
        .kb-cal-chip { transition:transform .15s ease, filter .15s ease; }
        .kb-cal-chip:hover { transform:translateY(-1px); filter:brightness(.95); z-index:2; }
        .kb-agenda-item { transition:transform .15s ease, background .15s ease; }
        .kb-agenda-item:hover { transform:translateX(3px); background:rgba(255,255,255,0.95) !important; }

        @media (prefers-reduced-motion:reduce) {
          .kb-tab, .kb-view-in, .kb-slide-next, .kb-slide-prev { animation:none !important; }
          .kb-tab-indicator { transition:none !important; }
        }

        * { box-sizing: border-box; } body { margin: 0; }

        ::-webkit-scrollbar { width:6px; height:6px; }

        ::-webkit-scrollbar-track { background:transparent; }

        ::-webkit-scrollbar-thumb { background:var(--border); border-radius:4px; }

      `}</style>

    </div>

  );

}