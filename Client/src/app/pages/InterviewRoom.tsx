import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router";
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, Hand, Maximize2, Minimize2,
  Users, PhoneOff, MessageSquare, Code2, Send, ChevronDown, Play, RotateCcw,
  Map, WrapText, Expand, Wifi, Clock, Terminal, CheckCircle2, XCircle,
  Keyboard, X, Blend, Copy, ChevronRight, PenLine, Eraser, Minus,
  Square, Circle, Type, Undo2, Trash2, Palette, MoreVertical,
} from "lucide-react";

/* ─── constants ─── */
const INTER = "'Inter', sans-serif";
const MONO = "'JetBrains Mono', monospace";
const C = {
  bg: "#0F172A", surface: "#111827", elevated: "#1E293B",
  border: "rgba(255,255,255,0.07)", borderHover: "rgba(255,255,255,0.14)",
  blue: "#3B82F6", emerald: "#10B981", rose: "#F43F5E", amber: "#F59E0B",
  violet: "#8B5CF6",
  tp: "#F1F5F9", ts: "#94A3B8", tm: "#475569",
};

const LANGUAGES = ["JavaScript", "Python", "Java", "C++", "SQL", "Kotlin"];
const CODE_STUBS: Record<string, string> = {
  JavaScript: `
function twoSum(nums, target) {
  
}

console.log(twoSum([2, 7, 11, 15], 9)); // [0, 1]
`,
  Python: `
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
       
`,
  Java: `import java.util.HashMap;
class Solution {
    public int[] twoSum(int[] nums, int target) {
       
    }
}
`,
  "C++": `
class Solution {
public:
    
    
};
`
};

const SHORTCUTS = [
  { keys: ["Ctrl", "Enter"], label: "Run Code" },
  { keys: ["Ctrl", "Shift", "Enter"], label: "Submit Code" },
  { keys: ["Ctrl", "/"], label: "Toggle Comment" },
  { keys: ["Ctrl", "B"], label: "Toggle Code / Chat" },
  { keys: ["Ctrl", "J"], label: "Toggle Console" },
  { keys: ["Ctrl", "D"], label: "Duplicate Line" },
  { keys: ["Ctrl", "Z"], label: "Undo" },
  { keys: ["F11"], label: "Fullscreen" },
];

/* ─── helpers ─── */
function useTimer() {
  const [s, setS] = useState(0);
  useEffect(() => { const id = setInterval(() => setS(x => x + 1), 1000); return () => clearInterval(id); }, []);
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

function highlight(code: string) {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const KW = /\b(function|const|let|var|return|if|else|for|while|new|class|import|export|default|from|of|in|typeof|instanceof|null|undefined|true|false|async|await|try|catch|finally|throw|this|super|extends|def|elif|pass|self|None|True|False|public|private|static|void|int|bool|string|number|type|interface)\b/g;
  return code.split("\n").map(line => {
    let h = esc(line);
    h = h.replace(/(\/\/.*$|#.*$)/g, '<span style="color:#6A9955">$1</span>');
    h = h.replace(/(&quot;[^&]*?&quot;|'[^']*?'|`[^`]*?`)/g, '<span style="color:#CE9178">$1</span>');
    h = h.replace(KW, '<span style="color:#569CD6;font-weight:500">$1</span>');
    h = h.replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#B5CEA8">$1</span>');
    h = h.replace(/(\w+)(?=\s*\()/g, '<span style="color:#DCDCAA">$1</span>');
    h = h.replace(/\b([A-Z][A-Za-z0-9_]*)\b/g, '<span style="color:#4EC9B0">$1</span>');
    return h;
  }).join("\n");
}

function GlassCard({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={className} style={{
      background: "rgba(30,41,59,0.55)",
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      border: `1px solid ${C.border}`, borderRadius: 16, ...style,
    }}>{children}</div>
  );
}

/* ─── Navbar ─── */
function Navbar({ timer, onLeave }: { timer: string; onLeave: () => void }) {
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 60, height: 52,
      background: "rgba(15,23,42,0.9)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      borderBottom: `1px solid ${C.border}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 18px", fontFamily: INTER,
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#3B82F6,#10B981)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Code2 size={14} color="#fff" />
        </div>
        <span style={{ color: C.tp, fontWeight: 700, fontSize: 14, letterSpacing: -0.3 }}>
          Code<span style={{ color: C.blue }}>Gear</span>
        </span>
        <div style={{ width: 1, height: 16, background: C.border, margin: "0 6px" }} />
        <span style={{ color: C.tm, fontSize: 11 }}>Senior Frontend · Round 2</span>
      </div>

      {/* Center */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 9, padding: "4px 10px" }}>
          <Clock size={12} color={C.tm} />
          <span style={{ fontFamily: MONO, fontSize: 13, color: C.tp, fontWeight: 600, letterSpacing: 1 }}>{timer}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.rose, boxShadow: `0 0 6px ${C.rose}`, animation: "pulse 1.5s infinite" }} />
          <span style={{ color: C.rose, fontSize: 11, fontWeight: 600 }}>REC</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Wifi size={12} color={C.emerald} />
          <span style={{ color: C.emerald, fontSize: 11, fontWeight: 600 }}>24ms</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex" }}>
            {["PN", "SL"].map((ini, i) => (
              <div key={ini} style={{ width: 24, height: 24, borderRadius: "50%", background: i === 0 ? "#7C3AED" : "#1D4ED8", border: `2px solid ${C.bg}`, marginLeft: i > 0 ? -7 : 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#fff", fontWeight: 700 }}>{ini}</div>
            ))}
          </div>
          <span style={{ color: C.ts, fontSize: 11, fontWeight: 500 }}>2 participants</span>
        </div>
        <span style={{ background: `${C.emerald}18`, color: C.emerald, border: `1px solid ${C.emerald}30`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>Connected</span>
      </div>

      {/* Leave */}
      <button
        onClick={onLeave}
        style={{ display: "flex", alignItems: "center", gap: 6, background: `${C.rose}18`, border: `1px solid ${C.rose}40`, borderRadius: 9, padding: "5px 12px", color: C.rose, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: INTER, transition: "background 0.15s" }}
        onMouseEnter={e => (e.currentTarget.style.background = `${C.rose}30`)}
        onMouseLeave={e => (e.currentTarget.style.background = `${C.rose}18`)}
      >
        <PhoneOff size={13} /> Leave
      </button>
    </nav>
  );
}

/* ─── Participants Sidebar ─── */
const PARTICIPANTS = [
  { id: 1, name: "Priya Nair", role: "Candidate", ini: "PN", color: "#7C3AED", mic: true, cam: true, ping: 22, speaking: true },
  { id: 2, name: "Sarah Lin", role: "Interviewer", ini: "SL", color: "#1D4ED8", mic: true, cam: true, ping: 18, speaking: false },
  { id: 3, name: "James Okafor", role: "Observer", ini: "JO", color: "#059669", mic: false, cam: false, ping: 105, speaking: false },
];

function ParticipantsSidebar({ onClose }: { onClose: () => void }) {
  return (
    <div style={{
      position: "absolute", top: 0, right: 0, bottom: 0, zIndex: 30,
      width: 280,
      background: "rgba(17,24,39,0.97)",
      backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
      borderLeft: `1px solid ${C.border}`,
      display: "flex", flexDirection: "column",
      fontFamily: INTER,
      boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Users size={15} color={C.blue} />
          <span style={{ color: C.tp, fontWeight: 700, fontSize: 14 }}>Participants</span>
          <span style={{ background: `${C.blue}20`, color: C.blue, borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{PARTICIPANTS.length}</span>
        </div>
        <button onClick={onClose} style={{ width: 26, height: 26, borderRadius: 7, border: "none", cursor: "pointer", background: "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", color: C.ts }}>
          <X size={13} />
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
        {PARTICIPANTS.map(p => (
          <div key={p.id} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 12,
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${p.speaking ? C.emerald + "40" : C.border}`,
            transition: "border-color 0.3s",
          }}>
            {/* Avatar with speaking ring */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: p.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, boxShadow: p.speaking ? `0 0 0 2px ${C.emerald}` : undefined }}>
                {p.ini}
              </div>
              {p.speaking && (
                <div style={{ position: "absolute", bottom: -1, right: -1, width: 10, height: 10, borderRadius: "50%", background: C.emerald, border: `2px solid ${C.surface}` }} />
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: C.tp, fontSize: 12, fontWeight: 600, marginBottom: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</p>
              <p style={{ color: C.tm, fontSize: 10 }}>{p.role}</p>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
              {p.mic ? <Mic size={12} color={C.ts} /> : <MicOff size={12} color={C.rose} />}
              {p.cam ? <Video size={12} color={C.ts} /> : <VideoOff size={12} color={C.rose} />}
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <Wifi size={10} color={p.ping < 60 ? C.emerald : p.ping < 120 ? C.amber : C.rose} />
                <span style={{ fontSize: 9, color: p.ping < 60 ? C.emerald : p.ping < 120 ? C.amber : C.rose, fontFamily: MONO }}>{p.ping}ms</span>
              </div>
              <button style={{ width: 22, height: 22, borderRadius: 6, border: "none", cursor: "pointer", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: C.tm }}>
                <MoreVertical size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: "12px 14px", borderTop: `1px solid ${C.border}` }}>
        <button style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          background: `${C.blue}18`, border: `1px solid ${C.blue}30`,
          borderRadius: 10, padding: "9px 0",
          color: C.blue, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: INTER,
        }}>
          <Users size={13} /> Invite Participant
        </button>
      </div>
    </div>
  );
}

/* ─── Whiteboard ─── */
type DrawTool = "pen" | "eraser" | "line" | "rect" | "circle";

function Whiteboard({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<ImageData[]>([]);
  const [tool, setTool] = useState<DrawTool>("pen");
  const [color, setColor] = useState("#00BFFF");
  const [size, setSize] = useState(3);
  const drawing = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const snapshotRef = useRef<ImageData | null>(null);

  const COLORS_WB = ["#F1F5F9", "#3B82F6", "#10B981", "#F43F5E", "#F59E0B", "#8B5CF6", "#EC4899", "#00BFFF"];
  const SIZES = [2, 4, 8, 14];

  function getCtx() { return canvasRef.current!.getContext("2d")!; }
  function pt(e: React.MouseEvent<HTMLCanvasElement>) {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (canvasRef.current!.width / r.width), y: (e.clientY - r.top) * (canvasRef.current!.height / r.height) };
  }

  function saveHistory() {
    const ctx = getCtx();
    historyRef.current = [...historyRef.current.slice(-20), ctx.getImageData(0, 0, canvasRef.current!.width, canvasRef.current!.height)];
  }

  function undo() {
    const prev = historyRef.current.pop();
    if (prev) getCtx().putImageData(prev, 0, 0);
  }

  function clear() {
    saveHistory();
    const c = canvasRef.current!;
    getCtx().clearRect(0, 0, c.width, c.height);
  }

  function onDown(e: React.MouseEvent<HTMLCanvasElement>) {
    saveHistory();
    drawing.current = true;
    const p = pt(e);
    startPos.current = p;
    const ctx = getCtx();
    if (tool === "pen" || tool === "eraser") {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    }
    snapshotRef.current = ctx.getImageData(0, 0, canvasRef.current!.width, canvasRef.current!.height);
  }

  function onMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const p = pt(e);
    const ctx = getCtx();

    if (tool === "pen") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color; ctx.lineWidth = size; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.lineTo(p.x, p.y); ctx.stroke();
    } else if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = size * 4; ctx.lineCap = "round";
      ctx.lineTo(p.x, p.y); ctx.stroke();
    } else {
      if (snapshotRef.current) ctx.putImageData(snapshotRef.current, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color; ctx.lineWidth = size; ctx.lineCap = "round";
      const s = startPos.current;
      ctx.beginPath();
      if (tool === "line") {
        ctx.moveTo(s.x, s.y); ctx.lineTo(p.x, p.y);
      } else if (tool === "rect") {
        ctx.rect(s.x, s.y, p.x - s.x, p.y - s.y);
      } else if (tool === "circle") {
        const rx = Math.abs(p.x - s.x) / 2, ry = Math.abs(p.y - s.y) / 2;
        ctx.ellipse(s.x + (p.x - s.x) / 2, s.y + (p.y - s.y) / 2, rx, ry, 0, 0, Math.PI * 2);
      }
      ctx.stroke();
    }
  }

  function onUp() {
    drawing.current = false;
    const ctx = getCtx();
    ctx.globalCompositeOperation = "source-over";
    ctx.beginPath();
  }

  const toolBtns: { id: DrawTool; icon: React.ReactNode; label: string }[] = [
    { id: "pen", icon: <PenLine size={14} />, label: "Pen" },
    { id: "eraser", icon: <Eraser size={14} />, label: "Eraser" },
    { id: "line", icon: <Minus size={14} />, label: "Line" },
    { id: "rect", icon: <Square size={14} />, label: "Rectangle" },
    { id: "circle", icon: <Circle size={14} />, label: "Circle" },
  ];

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#0a0f1a", borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}` }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", background: "rgba(17,24,39,0.9)", borderBottom: `1px solid ${C.border}`, flexWrap: "wrap", flexShrink: 0 }}>
        {/* Tools */}
        <div style={{ display: "flex", gap: 3 }}>
          {toolBtns.map(t => (
            <button key={t.id} onClick={() => setTool(t.id)} title={t.label} style={{
              width: 30, height: 30, borderRadius: 8, border: `1px solid ${tool === t.id ? C.blue + "60" : C.border}`, cursor: "pointer",
              background: tool === t.id ? `${C.blue}25` : "rgba(255,255,255,0.04)",
              color: tool === t.id ? C.blue : C.ts,
              display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s",
            }}>{t.icon}</button>
          ))}
        </div>

        <div style={{ width: 1, height: 22, background: C.border }} />

        {/* Colors */}
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <Palette size={12} color={C.tm} />
          {COLORS_WB.map(c => (
            <button key={c} onClick={() => setColor(c)} style={{
              width: 18, height: 18, borderRadius: "50%", background: c, border: `2px solid ${color === c ? "#fff" : C.border}`,
              cursor: "pointer", transition: "transform 0.1s", transform: color === c ? "scale(1.25)" : "scale(1)",
            }} />
          ))}
        </div>

        <div style={{ width: 1, height: 22, background: C.border }} />

        {/* Stroke sizes */}
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {SIZES.map(s => (
            <button key={s} onClick={() => setSize(s)} style={{
              width: 28, height: 28, borderRadius: 7, border: `1px solid ${size === s ? C.blue + "60" : C.border}`,
              background: size === s ? `${C.blue}20` : "rgba(255,255,255,0.04)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ width: s + 2, height: s + 2, borderRadius: "50%", background: color }} />
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 22, background: C.border }} />

        <button onClick={undo} title="Undo" style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", cursor: "pointer", color: C.ts, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Undo2 size={13} />
        </button>
        <button onClick={clear} title="Clear All" style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", cursor: "pointer", color: C.rose, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Trash2 size={13} />
        </button>

        <div style={{ flex: 1 }} />

        <span style={{ color: C.tm, fontSize: 10, fontFamily: MONO }}>{tool} · {size}px</span>

        <button onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: 8, padding: "4px 10px", color: C.ts, fontSize: 11, cursor: "pointer", fontFamily: INTER, fontWeight: 500 }}>
          <X size={12} /> Close
        </button>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {/* Grid background */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.25 }}
          dangerouslySetInnerHTML={{ __html: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><defs><pattern id="wbgrid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M 28 0 L 0 0 0 28" fill="none" stroke="#334155" stroke-width="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#wbgrid)"/></svg>` }}
        />
        <canvas
          ref={canvasRef}
          width={1400} height={700}
          style={{ width: "100%", height: "100%", cursor: tool === "eraser" ? "cell" : "crosshair", display: "block" }}
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onMouseLeave={onUp}
        />
      </div>
    </div>
  );
}

/* ─── Video Panel ─── */
function VideoPanel({
  mic, cam, screen, handRaised, blurred, showParticipants,
  onMic, onCam, onScreen, onHand, onBlur, onFullscreen, onParticipants, onWhiteboard, whiteboardActive,
  screenStream,
}: {
  mic: boolean; cam: boolean; screen: boolean; handRaised: boolean; blurred: boolean; showParticipants: boolean; whiteboardActive: boolean;
  onMic: () => void; onCam: () => void; onScreen: () => void; onHand: () => void; onBlur: () => void;
  onFullscreen: () => void; onParticipants: () => void; onWhiteboard: () => void;
  screenStream: MediaStream | null;
}) {
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const [speaking, setSpeaking] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSpeaking(Math.random() > 0.6 ? (Math.random() > 0.5 ? 0 : 1) : speaking), 2200);
    return () => clearInterval(id);
  }, [speaking]);

  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  function CtrlBtn({ icon, label, active, danger, onClick }: { icon: React.ReactNode; label: string; active?: boolean; danger?: boolean; onClick: () => void }) {
    const [hov, setHov] = useState(false);
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        title={label}
        style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          padding: "7px 10px", borderRadius: 12, cursor: "pointer", border: "none",
          fontFamily: INTER, transition: "all 0.15s", minWidth: 56,
          background: danger
            ? (hov ? `${C.rose}30` : `${C.rose}15`)
            : active
              ? (hov ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.11)")
              : (hov ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.04)"),
          color: danger ? C.rose : active ? C.tp : C.ts,
        }}
      >
        <div style={{
          width: 38, height: 38, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center",
          background: danger ? `${C.rose}20` : active ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)",
          border: `1px solid ${danger ? C.rose + "40" : "rgba(255,255,255,0.07)"}`,
        }}>{icon}</div>
        <span style={{ fontSize: 9, fontWeight: 500 }}>{label}</span>
      </button>
    );
  }

  const SpeakWave = ({ on }: { on: boolean }) => on ? (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 14 }}>
      {[3, 6, 4, 8, 5, 7, 3].map((h, i) => (
        <div key={i} style={{ width: 2, borderRadius: 2, background: C.emerald, height: h, animation: `waveBar 0.55s ease-in-out ${i * 0.09}s infinite alternate` }} />
      ))}
    </div>
  ) : null;

  return (
    <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Main video area */}
      <div style={{ flex: 1, borderRadius: 18, overflow: "hidden", position: "relative", background: "#070d18" }}>
        {screen && screenStream ? (
          /* Real screen share */
          <>
            <video
              ref={screenVideoRef}
              autoPlay
              muted
              style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }}
            />
            <div style={{ position: "absolute", top: 12, left: 12 }}>
              <span style={{ background: `${C.blue}22`, border: `1px solid ${C.blue}40`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, color: C.blue, fontFamily: INTER }}>
                ● Screen Sharing
              </span>
            </div>
            {/* Floating pip thumbnails */}
            <div style={{ position: "absolute", bottom: 14, right: 14, display: "flex", flexDirection: "column", gap: 8, zIndex: 10 }}>
              {[
                { name: "Priya Nair", ini: "PN", color: "#7C3AED", active: speaking === 0 },
                { name: "You", ini: "SL", color: "#1D4ED8", active: speaking === 1 },
              ].map(p => (
                <div key={p.name} style={{
                  width: 112, height: 74, borderRadius: 11, background: C.elevated,
                  border: `2px solid ${p.active ? C.emerald : "rgba(255,255,255,0.08)"}`,
                  position: "relative", overflow: "hidden",
                  boxShadow: p.active ? `0 0 14px ${C.emerald}50` : "0 4px 20px rgba(0,0,0,0.5)",
                  transition: "border-color 0.3s", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: p.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700 }}>{p.ini}</div>
                  <div style={{ position: "absolute", bottom: 4, left: 6, display: "flex", alignItems: "center", gap: 3 }}>
                    <span style={{ color: "#fff", fontSize: 8, fontWeight: 600, background: "rgba(0,0,0,0.55)", borderRadius: 4, padding: "1px 4px" }}>{p.name}</span>
                    <SpeakWave on={p.active} />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Normal video grid */
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: "100%", gap: 8, padding: 8 }}>
            {[
              { name: "Priya Nair", ini: "PN", color: "#7C3AED", sub: "Candidate", active: speaking === 0 },
              { name: "Sarah Lin (You)", ini: "SL", color: "#1D4ED8", sub: "Interviewer", active: speaking === 1 },
            ].map(p => (
              <div key={p.name} style={{
                borderRadius: 14, background: C.elevated,
                border: `2px solid ${p.active ? C.emerald : "rgba(255,255,255,0.06)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative", overflow: "hidden",
                boxShadow: p.active ? `0 0 20px ${C.emerald}30` : "none",
                transition: "border-color 0.3s,box-shadow 0.3s",
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: `linear-gradient(135deg,${p.color},${p.color}88)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: 20, fontWeight: 700, fontFamily: INTER,
                  boxShadow: `0 8px 28px ${p.color}50`,
                  filter: blurred && p.name === "Sarah Lin (You)" ? "blur(4px)" : "none",
                  transition: "filter 0.3s",
                }}>{p.ini}</div>

                {blurred && p.name === "Sarah Lin (You)" && (
                  <div style={{ position: "absolute", top: 8, right: 8 }}>
                    <span style={{ background: `${C.blue}22`, border: `1px solid ${C.blue}40`, borderRadius: 8, padding: "2px 7px", fontSize: 9, color: C.blue, fontWeight: 600, fontFamily: INTER }}>Blur ON</span>
                  </div>
                )}

                <div style={{ position: "absolute", bottom: 10, left: 10, display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", borderRadius: 7, padding: "3px 8px", display: "flex", alignItems: "center", gap: 5 }}>
                    {p.active && <SpeakWave on />}
                    <span style={{ color: "#fff", fontSize: 10, fontWeight: 600, fontFamily: INTER }}>{p.name}</span>
                    <span style={{ color: C.tm, fontSize: 9, fontFamily: INTER }}>· {p.sub}</span>
                  </div>
                </div>
                {p.active && <div style={{ position: "absolute", top: 9, right: 9, width: 7, height: 7, borderRadius: "50%", background: C.emerald, boxShadow: `0 0 8px ${C.emerald}` }} />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating control bar */}
      <GlassCard style={{ padding: "7px 14px", display: "flex", alignItems: "center", justifyContent: "center", gap: 2, flexShrink: 0 }}>
        <CtrlBtn icon={mic ? <Mic size={16} /> : <MicOff size={16} />} label={mic ? "Mute" : "Unmute"} active={mic} onClick={onMic} />
        <CtrlBtn icon={cam ? <Video size={16} /> : <VideoOff size={16} />} label={cam ? "Camera" : "Start"} active={cam} onClick={onCam} />
        <CtrlBtn icon={screen ? <MonitorOff size={16} /> : <Monitor size={16} />} label="Share Screen" active={screen} onClick={onScreen} />
        <CtrlBtn icon={<Hand size={16} />} label="Hand" active={handRaised} onClick={onHand} />
        <CtrlBtn icon={<Blend size={16} />} label="Blur BG" active={blurred} onClick={onBlur} />
        <CtrlBtn icon={<PenLine size={16} />} label="Whiteboard" active={whiteboardActive} onClick={onWhiteboard} />
        <div style={{ width: 1, height: 38, background: C.border, margin: "0 4px" }} />
        <CtrlBtn icon={<Users size={16} />} label="People" active={showParticipants} onClick={onParticipants} />
        <CtrlBtn icon={<Maximize2 size={16} />} label="Fullscreen" onClick={onFullscreen} />
        <div style={{ width: 1, height: 38, background: C.border, margin: "0 4px" }} />
        <button
          onClick={() => { window.location.href = "/interviewer"; }}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            padding: "7px 12px", borderRadius: 12, cursor: "pointer", border: "none", minWidth: 56,
            background: `${C.rose}20`, transition: "all 0.15s", fontFamily: INTER,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = `${C.rose}35`)}
          onMouseLeave={e => (e.currentTarget.style.background = `${C.rose}20`)}
        >
          <div style={{ width: 38, height: 38, borderRadius: 11, background: C.rose, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 14px ${C.rose}50` }}>
            <PhoneOff size={16} color="#fff" />
          </div>
          <span style={{ fontSize: 9, fontWeight: 600, color: C.rose }}>End</span>
        </button>
      </GlassCard>
    </div>
  );
}

/* ─── Code Editor ─── */
function CodeEditor() {
  const [lang, setLang] = useState("JavaScript");
  const [code, setCode] = useState(CODE_STUBS["JavaScript"]);
  const [langOpen, setLangOpen] = useState(false);
  const [minimap, setMinimap] = useState(true);
  const [wrap, setWrap] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);

  const lines = code.split("\n");

  function syncScroll() {
    if (textareaRef.current && mirrorRef.current)
      mirrorRef.current.scrollTop = textareaRef.current.scrollTop;
  }

  function TBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
    const [hov, setHov] = useState(false);
    return (
      <button onClick={onClick} title={label} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
        width: 27, height: 27, borderRadius: 7, border: "none", cursor: "pointer", transition: "all 0.15s",
        background: active ? `${C.blue}25` : hov ? "rgba(255,255,255,0.08)" : "transparent",
        color: active ? C.blue : hov ? C.tp : C.ts, display: "flex", alignItems: "center", justifyContent: "center",
      }}>{icon}</button>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: INTER }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 10px", height: 40, background: C.surface, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ position: "relative" }}>
          <button onClick={() => setLangOpen(!langOpen)} style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: 7, padding: "3px 9px", cursor: "pointer", color: C.ts, fontSize: 11, fontWeight: 500, fontFamily: INTER }}>
            <Code2 size={11} color={C.blue} /> {lang} <ChevronDown size={10} />
          </button>
          {langOpen && (
            <div style={{ position: "absolute", top: 34, left: 0, zIndex: 100, background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 11, overflow: "hidden", minWidth: 150, boxShadow: "0 20px 50px rgba(0,0,0,0.6)" }}>
              {LANGUAGES.map(l => (
                <button key={l} onClick={() => { setLang(l); setCode(CODE_STUBS[l] ?? `// ${l}\n`); setLangOpen(false); }} style={{
                  width: "100%", textAlign: "left", padding: "7px 13px", border: "none", cursor: "pointer", fontFamily: INTER, fontSize: 12, transition: "background 0.1s",
                  background: l === lang ? `${C.blue}18` : "transparent", color: l === lang ? C.blue : C.ts, fontWeight: l === lang ? 600 : 400,
                }}
                  onMouseEnter={e => { if (l !== lang) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
                  onMouseLeave={e => { if (l !== lang) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >{l}</button>
              ))}
            </div>
          )}
        </div>
        <div style={{ flex: 1 }} />
        <TBtn icon={<Map size={12} />} label="Minimap" active={minimap} onClick={() => setMinimap(!minimap)} />
        <TBtn icon={<WrapText size={12} />} label="Word Wrap" active={wrap} onClick={() => setWrap(!wrap)} />
        <TBtn icon={<Copy size={12} />} label="Copy" onClick={() => navigator.clipboard.writeText(code)} />
        <TBtn icon={<RotateCcw size={12} />} label="Reset" onClick={() => setCode(CODE_STUBS[lang] ?? "")} />
        <div style={{ width: 1, height: 16, background: C.border, margin: "0 3px" }} />
        <button style={{
          display: "flex", alignItems: "center", gap: 5,
          background: `linear-gradient(135deg,${C.blue},#1D4ED8)`,
          border: "none", borderRadius: 7, padding: "4px 12px", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer",
          fontFamily: INTER, boxShadow: `0 3px 12px ${C.blue}40`,
        }}><Play size={10} /> Run</button>
      </div>

      {/* Editor */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", background: "#0D1117" }}>
        {/* Line numbers */}
        <div style={{ width: 44, flexShrink: 0, background: "#0D1117", borderRight: `1px solid ${C.border}`, overflow: "hidden", paddingTop: 12, userSelect: "none" }}>
          {lines.map((_, i) => (
            <div key={i} style={{ height: 20, lineHeight: "20px", textAlign: "right", paddingRight: 9, color: C.tm, fontSize: 11, fontFamily: MONO }}>{i + 1}</div>
          ))}
        </div>
        {/* Highlight + textarea */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <div ref={mirrorRef} aria-hidden="true" style={{ position: "absolute", inset: 0, padding: "12px 12px", fontFamily: MONO, fontSize: 12.5, lineHeight: "20px", color: "#D4D4D4", whiteSpace: wrap ? "pre-wrap" : "pre", overflow: "hidden", pointerEvents: "none", wordBreak: wrap ? "break-all" : "normal" }}
            dangerouslySetInnerHTML={{ __html: highlight(code) + " " }} />
          <textarea ref={textareaRef} value={code} onChange={e => setCode(e.target.value)} onScroll={syncScroll} spellCheck={false} style={{
            position: "absolute", inset: 0, padding: "12px 12px", fontFamily: MONO, fontSize: 12.5, lineHeight: "20px",
            background: "transparent", color: "transparent", caretColor: "#AEAFAD",
            border: "none", outline: "none", resize: "none", whiteSpace: wrap ? "pre-wrap" : "pre", overflow: "auto", tabSize: 2,
          }} />
        </div>
        {/* Minimap */}
        {minimap && (
          <div style={{ width: 64, flexShrink: 0, background: "#0a0f1a", borderLeft: `1px solid ${C.border}`, overflow: "hidden", padding: "12px 5px", opacity: 0.55 }}>
            {lines.slice(0, 50).map((line, i) => (
              <div key={i} style={{ height: 2.5, marginBottom: 0.8 }}>
                {line.trim() && <div style={{ height: "100%", width: `${Math.min(100, line.length * 1.4)}%`, background: line.trim().startsWith("//") || line.trim().startsWith("#") ? "#3F4B3B" : "#2D4A7A", borderRadius: 1 }} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Chat ─── */
type Msg = { id: number; sender: string; ini: string; color: string; text: string; time: string; self: boolean };

function ChatPanel() {
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: 1, sender: "Priya Nair", ini: "PN", color: "#7C3AED", text: "Hi! Ready whenever you are.", time: "14:02", self: false },
    { id: 2, sender: "You", ini: "SL", color: "#1D4ED8", text: "Great, let's start with Two Sum.", time: "14:02", self: true },
    { id: 3, sender: "Priya Nair", ini: "PN", color: "#7C3AED", text: "Sure! Should I start brute-force first?", time: "14:03", self: false },
    { id: 4, sender: "You", ini: "SL", color: "#1D4ED8", text: "Yes, then we'll optimize. Walk me through it.", time: "14:03", self: true },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  function send() {
    const text = input.trim(); if (!text) return;
    setMsgs(p => [...p, { id: Date.now(), sender: "You", ini: "SL", color: "#1D4ED8", text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), self: true }]);
    setInput("");
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: INTER }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px", display: "flex", flexDirection: "column", gap: 12 }}>
        {msgs.map(m => (
          <div key={m.id} style={{ display: "flex", flexDirection: m.self ? "row-reverse" : "row", gap: 7, alignItems: "flex-end" }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: m.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{m.ini}</div>
            <div style={{ maxWidth: "75%", display: "flex", flexDirection: "column", gap: 3, alignItems: m.self ? "flex-end" : "flex-start" }}>
              <div style={{ padding: "8px 12px", borderRadius: m.self ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: m.self ? `linear-gradient(135deg,${C.blue},#1D4ED8)` : C.elevated, color: C.tp, fontSize: 12, lineHeight: 1.5, boxShadow: m.self ? `0 3px 12px ${C.blue}30` : "none" }}>{m.text}</div>
              <span style={{ color: C.tm, fontSize: 10 }}>{m.time}</span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: "9px 12px", borderTop: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 7, alignItems: "center", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 11, padding: "5px 7px 5px 12px" }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()} placeholder="Type a message…" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: C.tp, fontSize: 12, fontFamily: INTER }} />
          <button onClick={send} style={{ width: 30, height: 30, borderRadius: 8, background: input.trim() ? `linear-gradient(135deg,${C.blue},#1D4ED8)` : "rgba(255,255,255,0.06)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: input.trim() ? `0 3px 10px ${C.blue}40` : "none", transition: "all 0.15s" }}>
            <Send size={13} color={input.trim() ? "#fff" : C.tm} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Console ─── */
function ConsolePanel() {
  type CTab = "console" | "output";
  const [tab, setTab] = useState<CTab>("console");

  const logs = [
    { t: "log", text: "[14:07:02] Running test suite…" },
    { t: "log", text: "[14:07:02] ✓ Test 1: nums=[2,7,11,15], target=9 → [0,1]" },
    { t: "success", text: "[14:07:02] ✓ Test 2: nums=[3,2,4], target=6 → [1,2]" },
    { t: "success", text: "[14:07:02] ✓ Test 3: nums=[3,3], target=6 → [0,1]" },
    { t: "warn", text: "[14:07:02] ⚠ Runtime: 76ms · O(n) · Mem: 44MB" },
  ];
  const lc = (t: string) => t === "success" ? C.emerald : t === "warn" ? C.amber : t === "error" ? C.rose : C.ts;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: INTER }}>
      <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "6px 10px", borderBottom: `1px solid ${C.border}`, background: C.surface, flexShrink: 0, borderRadius: "0 0 0 0" }}>
        {(["console", "output"] as CTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "5px 12px", borderRadius: 7, border: "none", cursor: "pointer", fontFamily: INTER, fontSize: 11, fontWeight: tab === t ? 600 : 400, color: tab === t ? C.tp : C.tm, background: tab === t ? "rgba(255,255,255,0.08)" : "transparent", borderBottom: tab === t ? `2px solid ${C.blue}` : "2px solid transparent", transition: "all 0.15s" }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ background: `${C.emerald}18`, color: C.emerald, border: `1px solid ${C.emerald}30`, borderRadius: 20, padding: "2px 9px", fontSize: 10, fontWeight: 600 }}>3/3 Passed</span>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
        {tab === "console" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {logs.map((l, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <ChevronRight size={10} color={C.tm} style={{ flexShrink: 0, marginTop: 4 }} />
                <span style={{ fontFamily: MONO, fontSize: 11, color: lc(l.t), lineHeight: 1.7 }}>{l.text}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontFamily: MONO, fontSize: 12, color: C.ts, lineHeight: 1.9 }}>
            <div style={{ color: C.emerald }}>$ node solution.js</div>
            <div>[0, 1]</div><div>[1, 2]</div><div>[0, 1]</div>
            <div style={{ color: C.tm, marginTop: 8 }}>Execution time: 76ms · Memory: 44.2 MB</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Shortcut Modal ─── */
function ShortcutModal({ onClose }: { onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.elevated, borderRadius: 18, border: `1px solid ${C.border}`, padding: 26, width: 400, boxShadow: "0 40px 100px rgba(0,0,0,0.8)", fontFamily: INTER }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: `${C.blue}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Keyboard size={15} color={C.blue} />
            </div>
            <div>
              <p style={{ color: C.tp, fontWeight: 700, fontSize: 14 }}>Keyboard Shortcuts</p>
              <p style={{ color: C.tm, fontSize: 10 }}>Speed up your workflow</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 26, height: 26, borderRadius: 7, border: "none", cursor: "pointer", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", color: C.ts }}><X size={13} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {SHORTCUTS.map(s => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 11px", borderRadius: 9, background: "rgba(255,255,255,0.03)" }}>
              <span style={{ color: C.ts, fontSize: 12 }}>{s.label}</span>
              <div style={{ display: "flex", gap: 4 }}>
                {s.keys.map(k => (
                  <kbd key={k} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 5, padding: "2px 7px", fontFamily: MONO, fontSize: 10, color: C.tp, boxShadow: "0 1px 0 rgba(0,0,0,0.4)" }}>{k}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Root ─── */
export default function InterviewRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const timer = useTimer();
  const containerRef = useRef<HTMLDivElement>(null);

  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [screen, setScreen] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [blurred, setBlurred] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [whiteboardActive, setWhiteboardActive] = useState(false);
  const [rightTab, setRightTab] = useState<"code" | "chat">("code");
  const [consoleVisible, setConsoleVisible] = useState(true);
  const [shortcutOpen, setShortcutOpen] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  /* ── Fullscreen ── */
  async function toggleFullscreen() {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  /* ── Screen Share ── */
  async function toggleScreenShare() {
    if (screen && screenStream) {
      screenStream.getTracks().forEach(t => t.stop());
      setScreenStream(null);
      setScreen(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      stream.getVideoTracks()[0].addEventListener("ended", () => {
        setScreenStream(null);
        setScreen(false);
      });
      setScreenStream(stream);
      setScreen(true);
    } catch {
      setScreen(false);
    }
  }

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "b") { e.preventDefault(); setRightTab(t => t === "code" ? "chat" : "code"); }
      if ((e.ctrlKey || e.metaKey) && e.key === "j") { e.preventDefault(); setConsoleVisible(v => !v); }
      if (e.key === "?" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) setShortcutOpen(true);
      if (e.key === "Escape") setShortcutOpen(false);
      if (e.key === "F11") { e.preventDefault(); toggleFullscreen(); }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [screen, screenStream]);

  const tabBtn = (id: "code" | "chat", icon: React.ReactNode, label: string) => {
    const active = rightTab === id;
    return (
      <button onClick={() => setRightTab(id)} style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "6px 13px", borderRadius: 9, border: "none", cursor: "pointer",
        background: active ? "rgba(255,255,255,0.09)" : "transparent",
        color: active ? C.tp : C.tm, fontSize: 12, fontWeight: active ? 600 : 400, fontFamily: INTER,
        borderBottom: active ? `2px solid ${C.blue}` : "2px solid transparent", transition: "all 0.15s",
      }}>{icon} {label}</button>
    );
  };

  return (
    <>
      <style>{`
        @keyframes waveBar { from{transform:scaleY(0.4)} to{transform:scaleY(1)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.35} }
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
        ::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.2)}
      `}</style>

      <div ref={containerRef} data-room-id={roomId} style={{ height: "100dvh", background: C.bg, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: INTER }}>
        <Navbar timer={timer} onLeave={() => { screenStream?.getTracks().forEach(t => t.stop()); window.location.href = "/interviewer"; }} />

        {/* Body */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden", padding: "62px 10px 10px 10px", gap: 10 }}>

          {/* ── Left 65% ── */}
          <div style={{ flex: "0 0 65%", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
            <VideoPanel
              mic={mic} cam={cam} screen={screen} handRaised={handRaised} blurred={blurred}
              showParticipants={showParticipants} whiteboardActive={whiteboardActive}
              onMic={() => setMic(!mic)} onCam={() => setCam(!cam)}
              onScreen={toggleScreenShare}
              onHand={() => setHandRaised(!handRaised)}
              onBlur={() => setBlurred(!blurred)}
              onFullscreen={toggleFullscreen}
              onParticipants={() => setShowParticipants(!showParticipants)}
              onWhiteboard={() => setWhiteboardActive(!whiteboardActive)}
              screenStream={screenStream}
            />
            {showParticipants && <ParticipantsSidebar onClose={() => setShowParticipants(false)} />}
          </div>

          {/* ── Right 35% ── */}
          <div style={{ flex: "0 0 calc(35% - 10px)", display: "flex", flexDirection: "column", gap: 10, overflow: "hidden" }}>

            {/* Code / Chat / Whiteboard top panel */}
            <GlassCard style={{
              flex: whiteboardActive ? 1 : (consoleVisible ? "0 0 54%" : 1),
              display: "flex", flexDirection: "column", overflow: "hidden", transition: "flex 0.25s ease",
            }}>
              <div style={{ display: "flex", alignItems: "center", padding: "3px 8px 0 8px", borderBottom: `1px solid ${C.border}`, background: C.surface, flexShrink: 0, borderRadius: "16px 16px 0 0" }}>
                {!whiteboardActive && tabBtn("code", <Code2 size={12} />, "Code Editor")}
                {!whiteboardActive && tabBtn("chat", <MessageSquare size={12} />, "Chat")}
                {whiteboardActive && (
                  <span style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 13px", color: C.tp, fontSize: 12, fontWeight: 600, fontFamily: INTER }}>
                    <PenLine size={12} color={C.blue} /> Whiteboard
                  </span>
                )}
                <div style={{ flex: 1 }} />
                {!whiteboardActive && (
                  <button onClick={() => setConsoleVisible(!consoleVisible)} style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: "none", cursor: "pointer", color: C.tm, fontSize: 11, fontFamily: INTER, padding: "4px 7px", borderRadius: 6 }}>
                    <Terminal size={11} />{consoleVisible ? "Hide" : "Show"} Console
                  </button>
                )}
              </div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                {whiteboardActive
                  ? <Whiteboard onClose={() => setWhiteboardActive(false)} />
                  : rightTab === "code" ? <CodeEditor /> : <ChatPanel />
                }
              </div>
            </GlassCard>

            {/* Console — hidden when whiteboard active */}
            {consoleVisible && !whiteboardActive && (
              <GlassCard style={{ flex: "0 0 calc(46% - 10px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <ConsolePanel />
              </GlassCard>
            )}
          </div>
        </div>

        {/* Shortcut FAB */}
        <button
          onClick={() => setShortcutOpen(true)}
          title="Keyboard Shortcuts (?)"
          style={{
            position: "fixed", bottom: 20, right: 20, zIndex: 40,
            width: 38, height: 38, borderRadius: "50%",
            background: C.elevated, border: `1px solid ${C.border}`,
            boxShadow: "0 6px 28px rgba(0,0,0,0.4)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: C.tm, transition: "all 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = C.tp; (e.currentTarget as HTMLButtonElement).style.borderColor = C.borderHover; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = C.tm; (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; }}
        >
          <Keyboard size={15} />
        </button>

        {shortcutOpen && <ShortcutModal onClose={() => setShortcutOpen(false)} />}
      </div>
    </>
  );
}
