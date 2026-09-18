import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { Client } from "@stomp/stompjs";
import { getToken, getUser, getUserRole, fetchCurrentUser, type User } from "../bot/utils/auth";
import { InterviewCodeEditor } from "../components/InterviewCodeEditor";
import {
  getInterviewCodeSnapshot,
  runInterviewCode,
  getInterviewRoom,
  finishInterviewRoom,
  submitInterviewScore,
  getInterviewScores,
  type InterviewDetailsResponse,
  type CodeSyncMessage,
  type RunInterviewCodeResponse,
  type InterviewEventMessage,
  type InterviewScoreRecord,
  type InterviewRoomScoresResponse,
} from "../../services/interviewRoomService";
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, Hand, Maximize2, Minimize2,
  Users, PhoneOff, MessageSquare, Code2, Send, ChevronDown, Play, RotateCcw,
  Map, WrapText, Wifi, Clock, Terminal, CheckCircle2,
  Keyboard, X, Blend, Copy, ChevronRight, PenLine, Eraser, Minus,
  Square, Circle, Undo2, Trash2, Palette, MoreVertical, Loader2,
  ShieldAlert, LogOut, Star,
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

export type SupportedInterviewLanguage = "Java" | "Python" | "C++";

export const INTERVIEW_LANGUAGES: readonly SupportedInterviewLanguage[] = [
  "Java",
  "Python",
  "C++",
];

export const INTERVIEW_STARTER_TEMPLATES: Record<SupportedInterviewLanguage, string> = {
  Java: `public class Main {
    public static void main(String[] args) {
        // Write your solution here
    }
}
`,
  Python: `# Write your solution here
`,
  "C++": `#include <iostream>
using namespace std;

int main() {
    // Write your solution here
    return 0;
}
`,
};

export function normalizeInterviewLanguage(lang?: string | null): SupportedInterviewLanguage {
  if (!lang) return "Java";
  const lower = lang.toLowerCase().trim();
  if (lower === "python" || lower === "python3") return "Python";
  if (lower === "cpp" || lower === "c++") return "C++";
  if (lower === "java") return "Java";
  return "Java";
}

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

type PresenceMessage = {
  roomId: string;
  userId: string;
  role: string;
  name?: string;
  event: string;
};

export type DrawTool = "pen" | "eraser" | "line" | "rect" | "circle";

export type WhiteboardPoint = {
  x: number;
  y: number;
};

export type InterviewWhiteboardMessage = {
  id?: string;
  roomId: string;
  senderUserId?: string;
  senderRole?: string;
  type: "STROKE" | "SHAPE" | "CLEAR" | "UNDO";
  tool?: DrawTool;
  color?: string;
  size?: number;
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  points?: WhiteboardPoint[];
  timestamp?: string;
};

export type InterviewChatMessage = {
  id: string;
  roomId: string;
  senderUserId: string;
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: string;
};

type WebRTCSignalMessage = {
  roomId: string;
  senderUserId?: string;
  senderRole?: string;
  type: "OFFER" | "ANSWER" | "ICE_CANDIDATE" | "RAISE_HAND" | "LOWER_HAND" | "HAND_STATE";
  sdp?: string;
  candidate?: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  raised?: boolean;
};

function getWebSocketUrl() {
  const apiUrl = new URL(import.meta.env.VITE_API_URL ?? window.location.origin);
  apiUrl.protocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";
  apiUrl.pathname = "/ws";
  apiUrl.search = "";
  apiUrl.hash = "";
  return apiUrl.toString();
}

/* ─── helpers ─── */
function useTimer() {
  const [s, setS] = useState(0);
  useEffect(() => { const id = setInterval(() => setS(x => x + 1), 1000); return () => clearInterval(id); }, []);
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
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

export function getInitials(name?: string, fallback = "U"): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getRoleColor(role?: string): string {
  const r = (role || "").toLowerCase();
  if (r === "candidate") return "#7C3AED";
  if (r === "observer") return "#059669";
  return "#1D4ED8"; // interviewer or default
}

export interface RoomParticipant {
  id?: string | number;
  userId: string;
  name: string;
  role: string;
  ini: string;
  color: string;
  isSelf: boolean;
  mic: boolean;
  cam: boolean;
  speaking: boolean;
  handRaised: boolean;
  ping: number;
}

/* ─── Navbar ─── */
function Navbar({
  timer,
  onFinishInterview,
  isInterviewer = false,
  isFinishing = false,
  participants = [],
}: {
  timer: string;
  onFinishInterview?: () => void;
  isInterviewer?: boolean;
  isFinishing?: boolean;
  participants?: RoomParticipant[];
}) {
  const count = participants.length;
  const countLabel = `${count} ${count === 1 ? "participant" : "participants"}`;

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
      </div>

      {/* Center */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 9, padding: "4px 10px" }}>
          <Clock size={12} color={C.tm} />
          <span style={{ fontFamily: MONO, fontSize: 13, color: C.tp, fontWeight: 600, letterSpacing: 1 }}>{timer}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.rose, boxShadow: `0 0 6px ${C.rose}`, animation: "pulse 1.5s infinite" }} />
          <span style={{ color: C.rose, fontSize: 11, fontWeight: 600 }}>LIVE</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Wifi size={12} color={C.emerald} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex" }}>
            {participants.slice(0, 4).map((p, i) => (
              <div
                key={p.userId || i}
                title={`${p.name} (${p.role})`}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: p.color,
                  border: `2px solid ${C.bg}`,
                  marginLeft: i > 0 ? -7 : 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 8,
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                {p.ini}
              </div>
            ))}
          </div>
          <span style={{ color: C.ts, fontSize: 11, fontWeight: 500 }}>{countLabel}</span>
        </div>
      </div>

      {/* Finish Interview (Only rendered for the Interviewer) */}
      {isInterviewer && onFinishInterview && (
        <button
          onClick={onFinishInterview}
          disabled={isFinishing}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: isFinishing ? `${C.rose}10` : `${C.rose}18`,
            border: `1px solid ${isFinishing ? `${C.rose}25` : `${C.rose}40`}`,
            borderRadius: 9,
            padding: "5px 12px",
            color: C.rose,
            fontSize: 12,
            fontWeight: 600,
            cursor: isFinishing ? "not-allowed" : "pointer",
            fontFamily: INTER,
            opacity: isFinishing ? 0.75 : 1,
            transition: "all 0.15s",
          }}
          onMouseEnter={e => {
            if (!isFinishing) e.currentTarget.style.background = `${C.rose}30`;
          }}
          onMouseLeave={e => {
            if (!isFinishing) e.currentTarget.style.background = `${C.rose}18`;
          }}
          title={isFinishing ? "Finishing interview..." : "Finish Interview"}
        >
          {isFinishing ? (
            <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <PhoneOff size={13} />
          )}
          <span>{isFinishing ? "Finishing..." : "Finish Interview"}</span>
        </button>
      )}
    </nav>
  );
}

/* ─── Participants Sidebar ─── */
function ParticipantsSidebar({
  onClose,
  participants = [],
}: {
  onClose: () => void;
  participants?: RoomParticipant[];
}) {
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
          <span style={{ background: `${C.blue}20`, color: C.blue, borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{participants.length}</span>
        </div>
        <button onClick={onClose} style={{ width: 26, height: 26, borderRadius: 7, border: "none", cursor: "pointer", background: "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", color: C.ts }}>
          <X size={13} />
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
        {participants.map(p => {
          const displayName = p.isSelf ? `${p.name} (You)` : p.name;
          return (
            <div key={p.userId || p.id} style={{
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
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: C.tp, fontSize: 12, fontWeight: 600, marginBottom: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</span>
                {p.handRaised && (
                  <span
                    title={`${displayName}'s hand is raised`}
                    aria-label="Hand raised"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(245,158,11,0.2)",
                      border: "1px solid rgba(245,158,11,0.45)",
                      borderRadius: 4,
                      padding: "2px 4px",
                      flexShrink: 0,
                    }}
                  >
                    <Hand size={11} color={C.amber} />
                  </span>
                )}
              </div>
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
        );
      })}
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
function drawStrokeOnCtx(
  ctx: CanvasRenderingContext2D,
  tool: DrawTool,
  color: string,
  size: number,
  points: WhiteboardPoint[]
) {
  if (!points || points.length === 0) return;
  ctx.save();
  if (tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = size * 4;
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
  }
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  if (points.length === 1) {
    ctx.lineTo(points[0].x + 0.01, points[0].y);
  } else {
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
  }
  ctx.stroke();
  ctx.restore();
}

function drawShapeOnCtx(
  ctx: CanvasRenderingContext2D,
  tool: DrawTool,
  color: string,
  size: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number
) {
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  if (tool === "line") {
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
  } else if (tool === "rect") {
    ctx.rect(startX, startY, endX - startX, endY - startY);
  } else if (tool === "circle") {
    const rx = Math.max(0.1, Math.abs(endX - startX) / 2);
    const ry = Math.max(0.1, Math.abs(endY - startY) / 2);
    ctx.ellipse(startX + (endX - startX) / 2, startY + (endY - startY) / 2, rx, ry, 0, 0, Math.PI * 2);
  }
  ctx.stroke();
  ctx.restore();
}

interface WhiteboardProps {
  onClose: () => void;
  roomId?: string;
  stompClientRef?: React.MutableRefObject<Client | null>;
  onRegisterRemoteWhiteboardHandler?: (handler: ((msg: InterviewWhiteboardMessage) => void) | null) => void;
  currentUserId?: string;
  userRole?: string;
}

function Whiteboard({
  onClose,
  roomId,
  stompClientRef,
  onRegisterRemoteWhiteboardHandler,
  currentUserId,
  userRole,
}: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<ImageData[]>([]);
  const [tool, setTool] = useState<DrawTool>("pen");
  const [color, setColor] = useState("#00BFFF");
  const [size, setSize] = useState(3);
  const drawing = useRef(false);
  const startPos = useRef<WhiteboardPoint>({ x: 0, y: 0 });
  const lastPos = useRef<WhiteboardPoint>({ x: 0, y: 0 });
  const currentEndPos = useRef<WhiteboardPoint>({ x: 0, y: 0 });
  const currentPoints = useRef<WhiteboardPoint[]>([]);
  const snapshotRef = useRef<ImageData | null>(null);
  const sentOpIdsRef = useRef<Set<string>>(new Set());

  const COLORS_WB = ["#F1F5F9", "#3B82F6", "#10B981", "#F43F5E", "#F59E0B", "#8B5CF6", "#EC4899", "#00BFFF"];
  const SIZES = [2, 4, 8, 14];

  function getCtx() {
    return canvasRef.current ? canvasRef.current.getContext("2d") : null;
  }

  function pt(e: React.PointerEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>): WhiteboardPoint {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const r = canvas.getBoundingClientRect();
    const scaleX = r.width > 0 ? (canvas.width / r.width) : 1;
    const scaleY = r.height > 0 ? (canvas.height / r.height) : 1;
    return {
      x: Math.round((e.clientX - r.left) * scaleX * 10) / 10,
      y: Math.round((e.clientY - r.top) * scaleY * 10) / 10,
    };
  }

  function saveHistory() {
    if (!canvasRef.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    historyRef.current = [
      ...historyRef.current.slice(-20),
      ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height),
    ];
  }

  const publishOperation = useCallback((msg: InterviewWhiteboardMessage) => {
    const client = stompClientRef?.current;
    if (!client || !client.connected || !roomId) {
      return;
    }
    try {
      client.publish({
        destination: `/app/interview/${roomId}/whiteboard`,
        body: JSON.stringify(msg),
      });
    } catch (err) {
      console.error("Failed to publish whiteboard operation:", err);
    }
  }, [roomId, stompClientRef]);

  function undo() {
    const prev = historyRef.current.pop();
    const ctx = getCtx();
    if (!ctx || !canvasRef.current) return;

    if (prev) {
      ctx.putImageData(prev, 0, 0);
    } else {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    if (!roomId) return;
    const opId = (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    sentOpIdsRef.current.add(opId);
    publishOperation({
      id: opId,
      roomId,
      senderUserId: currentUserId,
      senderRole: userRole,
      type: "UNDO",
    });
  }

  function clear() {
    saveHistory();
    const ctx = getCtx();
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    if (!roomId) return;
    const opId = (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    sentOpIdsRef.current.add(opId);
    publishOperation({
      id: opId,
      roomId,
      senderUserId: currentUserId,
      senderRole: userRole,
      type: "CLEAR",
    });
  }

  const handleRemoteOperation = useCallback((msg: InterviewWhiteboardMessage) => {
    if (!msg || !canvasRef.current) return;

    // Prevent echoing/duplicating our own operations
    if (msg.id && sentOpIdsRef.current.has(msg.id)) {
      return;
    }
    if (msg.senderUserId && currentUserId && msg.senderUserId === currentUserId) {
      return;
    }

    const ctx = getCtx();
    if (!ctx) return;

    if (msg.type === "STROKE" && msg.points && msg.points.length > 0) {
      saveHistory();
      drawStrokeOnCtx(
        ctx,
        msg.tool || "pen",
        msg.color || "#00BFFF",
        msg.size || 3,
        msg.points
      );
    } else if (msg.type === "SHAPE" && msg.startX !== undefined && msg.startY !== undefined && msg.endX !== undefined && msg.endY !== undefined) {
      saveHistory();
      drawShapeOnCtx(
        ctx,
        msg.tool || "line",
        msg.color || "#00BFFF",
        msg.size || 3,
        msg.startX,
        msg.startY,
        msg.endX,
        msg.endY
      );
    } else if (msg.type === "CLEAR") {
      saveHistory();
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    } else if (msg.type === "UNDO") {
      const prev = historyRef.current.pop();
      if (prev) {
        ctx.putImageData(prev, 0, 0);
      } else {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, [currentUserId]);

  useEffect(() => {
    onRegisterRemoteWhiteboardHandler?.(handleRemoteOperation);
    return () => {
      onRegisterRemoteWhiteboardHandler?.(null);
    };
  }, [onRegisterRemoteWhiteboardHandler, handleRemoteOperation]);

  function onDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!canvasRef.current) return;
    try {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch { }
    saveHistory();
    drawing.current = true;
    const p = pt(e);
    startPos.current = p;
    lastPos.current = p;
    currentEndPos.current = p;
    currentPoints.current = [p];

    const ctx = getCtx();
    if (!ctx) return;

    if (tool === "pen" || tool === "eraser") {
      ctx.save();
      if (tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = size * 4;
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
      }
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + 0.01, p.y);
      ctx.stroke();
      ctx.restore();
    }
    snapshotRef.current = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
  }

  function onMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || !canvasRef.current) return;
    const p = pt(e);
    currentEndPos.current = p;
    const ctx = getCtx();
    if (!ctx) return;

    if (tool === "pen" || tool === "eraser") {
      ctx.save();
      if (tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = size * 4;
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
      }
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.restore();
      lastPos.current = p;
      currentPoints.current.push(p);
    } else {
      if (snapshotRef.current) {
        ctx.putImageData(snapshotRef.current, 0, 0);
      }
      drawShapeOnCtx(
        ctx,
        tool,
        color,
        size,
        startPos.current.x,
        startPos.current.y,
        p.x,
        p.y
      );
    }
  }

  function onUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    drawing.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch { }

    const ctx = getCtx();
    if (ctx) {
      ctx.globalCompositeOperation = "source-over";
      ctx.beginPath();
    }

    if (!roomId) return;

    const opId = (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

    sentOpIdsRef.current.add(opId);
    if (sentOpIdsRef.current.size > 200) {
      const first = sentOpIdsRef.current.values().next().value;
      if (first) sentOpIdsRef.current.delete(first);
    }

    if (tool === "pen" || tool === "eraser") {
      if (currentPoints.current.length > 0) {
        publishOperation({
          id: opId,
          roomId,
          senderUserId: currentUserId,
          senderRole: userRole,
          type: "STROKE",
          tool,
          color,
          size,
          points: currentPoints.current,
        });
      }
    } else if (tool === "line" || tool === "rect" || tool === "circle") {
      const s = startPos.current;
      const ePos = currentEndPos.current;
      if (s.x !== ePos.x || s.y !== ePos.y) {
        publishOperation({
          id: opId,
          roomId,
          senderUserId: currentUserId,
          senderRole: userRole,
          type: "SHAPE",
          tool,
          color,
          size,
          startX: s.x,
          startY: s.y,
          endX: ePos.x,
          endY: ePos.y,
        });
      }
    }
    currentPoints.current = [];
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

      {/* Canvas Area */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {/* Grid background (strictly non-interactive behind canvas) */}
        <div
          style={{ position: "absolute", inset: 0, opacity: 0.25, pointerEvents: "none", zIndex: 1 }}
          dangerouslySetInnerHTML={{ __html: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><defs><pattern id="wbgrid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M 28 0 L 0 0 0 28" fill="none" stroke="#334155" stroke-width="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#wbgrid)"/></svg>` }}
        />
        <canvas
          ref={canvasRef}
          width={1400}
          height={700}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            cursor: tool === "eraser" ? "cell" : "crosshair",
            display: "block",
            touchAction: "none",
            zIndex: 2,
          }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        />
      </div>
    </div>
  );
}

/* ─── Web Audio Activity Detection Hook ─── */
interface AudioActivityState {
  isSpeaking: boolean;
  level: number;
}

function useAudioActivity(stream: MediaStream | null, enabled: boolean = true): AudioActivityState {
  const [activity, setActivity] = useState<AudioActivityState>({ isSpeaking: false, level: 0 });

  useEffect(() => {
    if (!stream || !enabled) {
      setActivity({ isSpeaking: false, level: 0 });
      return;
    }

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      setActivity({ isSpeaking: false, level: 0 });
      return;
    }

    const audioTrack = audioTracks[0];
    if (!audioTrack.enabled || audioTrack.readyState === "ended") {
      setActivity({ isSpeaking: false, level: 0 });
      return;
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }

    let audioCtx: AudioContext | null = null;
    let sourceNode: MediaStreamAudioSourceNode | null = null;
    let analyser: AnalyserNode | null = null;
    let animFrameId: number | null = null;
    let isMounted = true;
    let holdUntil = 0;
    let currentSpeaking = false;
    let lastLevel = 0;
    let lastUpdate = 0;
    let lastDispatchedSpeaking = false;
    let lastDispatchedLevel = 0;

    try {
      audioCtx = new AudioContextClass();
      sourceNode = audioCtx.createMediaStreamSource(stream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.4;
      sourceNode.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const ON_THRESHOLD = 0.038;
      const OFF_THRESHOLD = 0.022;
      const HOLD_DELAY_MS = 380;

      const checkAudio = () => {
        if (!isMounted) return;

        const tracks = stream.getAudioTracks();
        if (tracks.length === 0 || !tracks[0].enabled || tracks[0].muted || tracks[0].readyState === "ended") {
          if (lastDispatchedSpeaking || lastDispatchedLevel > 0) {
            currentSpeaking = false;
            lastLevel = 0;
            lastDispatchedSpeaking = false;
            lastDispatchedLevel = 0;
            setActivity({ isSpeaking: false, level: 0 });
          }
          animFrameId = requestAnimationFrame(checkAudio);
          return;
        }

        if (audioCtx && audioCtx.state === "suspended") {
          audioCtx.resume().catch(() => { });
        }

        analyser!.getByteTimeDomainData(dataArray);

        let sumSquares = 0;
        for (let i = 0; i < bufferLength; i++) {
          const norm = (dataArray[i] - 128) / 128;
          sumSquares += norm * norm;
        }
        const rms = Math.sqrt(sumSquares / bufferLength);

        const rawLevel = Math.min(1, Math.max(0, (rms - OFF_THRESHOLD) / 0.18));
        const targetLevel = (lastLevel * 0.6) + (rawLevel * 0.4);

        const now = performance.now();

        if (rms >= ON_THRESHOLD) {
          currentSpeaking = true;
          holdUntil = now + HOLD_DELAY_MS;
        } else if (now >= holdUntil && rms < OFF_THRESHOLD) {
          currentSpeaking = false;
        }

        const nextSpeaking = currentSpeaking;
        const nextLevel = nextSpeaking ? Math.round(targetLevel * 100) / 100 : 0;
        const speakingChanged = lastDispatchedSpeaking !== nextSpeaking;
        const levelChanged = nextSpeaking && (Math.abs(nextLevel - lastDispatchedLevel) >= 0.03 || now - lastUpdate >= 45);

        if (speakingChanged || levelChanged) {
          lastUpdate = now;
          lastLevel = targetLevel;
          lastDispatchedSpeaking = nextSpeaking;
          lastDispatchedLevel = nextLevel;
          setActivity({
            isSpeaking: nextSpeaking,
            level: nextLevel,
          });
        }

        animFrameId = requestAnimationFrame(checkAudio);
      };

      animFrameId = requestAnimationFrame(checkAudio);
    } catch (err) {
      console.warn("Audio activity detection initialization warning:", err);
    }

    return () => {
      isMounted = false;
      if (animFrameId !== null) {
        cancelAnimationFrame(animFrameId);
      }
      try {
        sourceNode?.disconnect();
      } catch { }
      try {
        analyser?.disconnect();
      } catch { }
      try {
        if (audioCtx && audioCtx.state !== "closed") {
          audioCtx.close().catch(() => { });
        }
      } catch { }
      setActivity({ isSpeaking: false, level: 0 });
    };
  }, [stream, enabled]);

  return activity;
}

/* ─── Control Button ─── */
function CtrlBtn({
  icon,
  label,
  active,
  danger,
  onClick,
  title,
  ariaLabel,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick?: () => void;
  title?: string;
  ariaLabel?: string;
  badge?: number | string;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={title || label}
      aria-label={ariaLabel || label}
      aria-pressed={active}
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
        position: "relative",
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center",
        background: danger ? `${C.rose}20` : active ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)",
        border: `1px solid ${danger ? C.rose + "40" : "rgba(255,255,255,0.07)"}`,
        pointerEvents: "none",
        position: "relative",
      }}>
        {icon}
        {badge !== undefined && (
          <span style={{
            position: "absolute",
            top: -4,
            right: -6,
            background: C.blue,
            color: "#fff",
            borderRadius: 10,
            padding: "1px 5px",
            fontSize: 9,
            fontWeight: 700,
            fontFamily: MONO,
            boxShadow: "0 2px 5px rgba(0,0,0,0.4)",
            lineHeight: "12px",
          }}>
            {badge}
          </span>
        )}
      </div>
      <span style={{ fontSize: 9, fontWeight: 500, pointerEvents: "none" }}>{label}</span>
    </button>
  );
}

/* ─── Speaking Wave Indicator ─── */
function SpeakWave({ active, level = 0 }: { active: boolean; level?: number }) {
  if (!active) return null;
  const clampedLevel = Math.min(1, Math.max(0, level));
  const factors = [0.35, 0.7, 0.5, 1.0, 0.65, 0.85, 0.4];

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 14, pointerEvents: "none" }}>
      {factors.map((factor, i) => {
        const h = Math.round(3 + factor * clampedLevel * 11);
        return (
          <div
            key={i}
            style={{
              width: 2,
              borderRadius: 2,
              background: C.emerald,
              height: h,
              transition: "height 0.08s ease-out",
              pointerEvents: "none",
            }}
          />
        );
      })}
    </div>
  );
}

/* ─── Video Panel ─── */
function VideoPanel({
  mic, cam, screen, handRaised, blurred, showParticipants,
  onMic, onCam, onScreen, onHand, onBlur, onFullscreen, onParticipants, onWhiteboard, whiteboardActive,
  screenStream, localStream, remoteStream, mediaError,
  isCandidate = false, userName, onLeave, raisedHands,
  onSpeakingChange,
  participants = [],
}: {
  mic: boolean; cam: boolean; screen: boolean; handRaised: boolean; blurred: boolean; showParticipants: boolean; whiteboardActive: boolean;
  onMic: () => void; onCam: () => void; onScreen: () => void; onHand: () => void; onBlur: () => void;
  onFullscreen: () => void; onParticipants: () => void; onWhiteboard: () => void;
  screenStream: MediaStream | null;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
  mediaError?: string | null;
  isCandidate?: boolean;
  userName?: string;
  onLeave?: () => void;
  raisedHands?: { candidate: boolean; interviewer: boolean };
  onSpeakingChange?: (states: { candidate: boolean; interviewer: boolean }) => void;
  participants?: RoomParticipant[];
}) {
  const screenAreaRef = useRef<HTMLDivElement>(null);
  const selfTileRef = useRef<HTMLDivElement>(null);
  const remoteTileRef = useRef<HTMLDivElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [fullscreenElement, setFullscreenElement] = useState<Element | null>(null);
  const [isRemoteScreen, setIsRemoteScreen] = useState(false);
  const [remoteFitMode, setRemoteFitMode] = useState<"contain" | "cover" | null>(null);

  const localAudio = useAudioActivity(localStream ?? null, mic);
  const remoteAudio = useAudioActivity(remoteStream ?? null, true);

  const candidateAudio = isCandidate ? localAudio : remoteAudio;
  const interviewerAudio = isCandidate ? remoteAudio : localAudio;

  const selfParticipant = participants.find(p => p.isSelf);
  const remoteParticipant = participants.find(p => !p.isSelf);

  const localRole = isCandidate ? "Candidate" : "Interviewer";
  const remoteRole = isCandidate ? "Interviewer" : "Candidate";

  const localName = selfParticipant?.name || (userName ? userName : localRole);
  const localIni = selfParticipant?.ini || getInitials(localName, isCandidate ? "CA" : "IN");
  const localColor = selfParticipant?.color || (isCandidate ? "#7C3AED" : "#1D4ED8");

  const remoteName = remoteParticipant
    ? remoteParticipant.name
    : `Waiting for ${remoteRole}...`;
  const remoteIni = remoteParticipant
    ? remoteParticipant.ini
    : (isCandidate ? "IN" : "CA");
  const remoteColor = remoteParticipant
    ? remoteParticipant.color
    : (isCandidate ? "#1D4ED8" : "#7C3AED");
  const remoteSub = remoteParticipant
    ? remoteParticipant.role
    : remoteRole;

  const prevSpeakingRef = useRef({ candidate: false, interviewer: false });
  useEffect(() => {
    const prev = prevSpeakingRef.current;
    if (prev.candidate !== candidateAudio.isSpeaking || prev.interviewer !== interviewerAudio.isSpeaking) {
      prevSpeakingRef.current = {
        candidate: candidateAudio.isSpeaking,
        interviewer: interviewerAudio.isSpeaking,
      };
      onSpeakingChange?.({
        candidate: candidateAudio.isSpeaking,
        interviewer: interviewerAudio.isSpeaking,
      });
    }
  }, [candidateAudio.isSpeaking, interviewerAudio.isSpeaking, onSpeakingChange]);

  useEffect(() => {
    const handler = () => {
      setFullscreenElement(document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleTileFullscreen = async (el: HTMLElement | null) => {
    if (!el) return;
    try {
      if (document.fullscreenElement === el) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        }
      }
    } catch (err) {
      console.warn("Fullscreen toggle failed:", err);
    }
  };

  const updateRemoteStreamType = useCallback(() => {
    const video = remoteVideoRef.current;
    if (!video || !remoteStream) {
      setIsRemoteScreen(false);
      return;
    }
    const { videoWidth, videoHeight } = video;
    if (videoWidth > 0 && videoHeight > 0) {
      const track = remoteStream.getVideoTracks()[0];
      const settings = track?.getSettings ? track.getSettings() : undefined;
      const displaySurface = (settings as Record<string, unknown> | undefined)?.displaySurface;
      const label = track?.label?.toLowerCase() || "";

      // Screen capture produces high-res widescreen resolutions (e.g. 1920x1080, 2560x1440, 1366x768, 1440x900, 1536x864, 1680x1050),
      // whereas standard camera stream in Chrome defaults to 640x480 (4:3).
      const isScreenTrack = Boolean(
        displaySurface ||
        label.includes("screen") ||
        label.includes("window") ||
        label.includes("display") ||
        videoWidth > 1280 ||
        (videoWidth >= 1280 && videoWidth / videoHeight >= 1.5)
      );
      setIsRemoteScreen(isScreenTrack);
    }
  }, [remoteStream]);

  useEffect(() => {
    updateRemoteStreamType();
  }, [remoteStream, updateRemoteStreamType]);

  useEffect(() => {
    const video = remoteVideoRef.current;
    if (!video) return;
    video.addEventListener("resize", updateRemoteStreamType);
    video.addEventListener("loadedmetadata", updateRemoteStreamType);
    return () => {
      video.removeEventListener("resize", updateRemoteStreamType);
      video.removeEventListener("loadedmetadata", updateRemoteStreamType);
    };
  }, [updateRemoteStreamType]);

  const effectiveRemoteFit = remoteFitMode ?? (isRemoteScreen ? "contain" : "cover");

  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, cam, screen]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(err => {
        console.warn("Remote video play() warning:", err);
      });
    }
  }, [remoteStream, screen]);

  return (
    <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Main video area */}
      <div
        ref={screen && screenStream ? screenAreaRef : undefined}
        style={{
          flex: 1,
          borderRadius: fullscreenElement === screenAreaRef.current ? 0 : 18,
          overflow: "hidden",
          position: "relative",
          background: "#070d18",
        }}
      >
        {mediaError && (
          <div style={{ position: "absolute", top: 12, left: 12, right: 12, zIndex: 20, background: "rgba(244,63,94,0.9)", color: "#fff", padding: "8px 12px", borderRadius: 8, fontSize: 12, fontFamily: INTER }}>
            {mediaError}
          </div>
        )}
        {screen && screenStream ? (
          /* Real screen share */
          <>
            <video
              ref={screenVideoRef}
              autoPlay
              muted
              style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }}
            />
            <div style={{ position: "absolute", top: 12, left: 12, zIndex: 10 }}>
              <span style={{ background: `${C.blue}22`, border: `1px solid ${C.blue}40`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, color: C.blue, fontFamily: INTER }}>
                ● Screen Sharing
              </span>
            </div>
            {/* Screen share tile fullscreen control */}
            <div style={{ position: "absolute", top: 12, right: 12, zIndex: 15 }}>
              <button
                onClick={() => toggleTileFullscreen(screenAreaRef.current)}
                title={fullscreenElement === screenAreaRef.current ? "Exit fullscreen" : "Enter fullscreen"}
                aria-label={fullscreenElement === screenAreaRef.current ? "Exit fullscreen" : "Enter fullscreen"}
                style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "#fff", transition: "all 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0.6)")}
              >
                {fullscreenElement === screenAreaRef.current ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
            </div>
            {/* Floating pip thumbnails */}
            <div style={{ position: "absolute", bottom: 14, right: 14, display: "flex", flexDirection: "column", gap: 8, zIndex: 10 }}>
              {[
                {
                  id: "self",
                  name: "You",
                  ini: localIni,
                  color: localColor,
                  active: isCandidate ? candidateAudio.isSpeaking : interviewerAudio.isSpeaking,
                  audioLevel: isCandidate ? candidateAudio.level : interviewerAudio.level,
                  handRaised: Boolean(raisedHands ? raisedHands[isCandidate ? "candidate" : "interviewer"] : handRaised),
                },
                {
                  id: "remote",
                  name: remoteParticipant ? remoteParticipant.name : remoteRole,
                  ini: remoteIni,
                  color: remoteColor,
                  active: !isCandidate ? candidateAudio.isSpeaking : interviewerAudio.isSpeaking,
                  audioLevel: !isCandidate ? candidateAudio.level : interviewerAudio.level,
                  handRaised: Boolean(
                    remoteParticipant?.handRaised ||
                    (raisedHands ? raisedHands[!isCandidate ? "candidate" : "interviewer"] : false)
                  ),
                },
              ].map(p => (
                <div key={p.id} style={{
                  width: 112, height: 74, borderRadius: 11, background: C.elevated,
                  border: `2px solid ${p.active ? C.emerald : "rgba(255,255,255,0.08)"}`,
                  position: "relative", overflow: "hidden",
                  boxShadow: p.active ? `0 0 14px ${C.emerald}50` : "0 4px 20px rgba(0,0,0,0.5)",
                  transition: "border-color 0.3s", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: p.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700 }}>{p.ini}</div>
                  <div style={{ position: "absolute", bottom: 4, left: 6, display: "flex", alignItems: "center", gap: 3, pointerEvents: "none" }}>
                    {p.handRaised && (
                      <span
                        title="Hand raised"
                        aria-label="Hand raised"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "rgba(245, 158, 11, 0.25)",
                          border: "1px solid rgba(245, 158, 11, 0.5)",
                          borderRadius: 3,
                          padding: "1px",
                        }}
                      >
                        <Hand size={9} color={C.amber} />
                      </span>
                    )}
                    <span style={{ color: "#fff", fontSize: 8, fontWeight: 600, background: "rgba(0,0,0,0.55)", borderRadius: 4, padding: "1px 4px" }}>{p.name}</span>
                    <SpeakWave active={p.active} level={p.audioLevel} />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Normal video grid */
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: "100%", gap: 8, padding: 8 }}>
            {[
              {
                id: "self",
                name: `${localName} (You)`,
                ini: localIni,
                color: localColor,
                sub: localRole,
                isSelf: true,
                active: isCandidate ? candidateAudio.isSpeaking : interviewerAudio.isSpeaking,
                audioLevel: isCandidate ? candidateAudio.level : interviewerAudio.level,
                handRaised: Boolean(raisedHands ? raisedHands[isCandidate ? "candidate" : "interviewer"] : handRaised),
              },
              {
                id: "remote",
                name: remoteName,
                ini: remoteIni,
                color: remoteColor,
                sub: remoteSub,
                isSelf: false,
                active: !isCandidate ? candidateAudio.isSpeaking : interviewerAudio.isSpeaking,
                audioLevel: !isCandidate ? candidateAudio.level : interviewerAudio.level,
                handRaised: Boolean(
                  remoteParticipant?.handRaised ||
                  (raisedHands ? raisedHands[!isCandidate ? "candidate" : "interviewer"] : false)
                ),
              },
            ].map(p => {
              const tileRef = p.isSelf ? selfTileRef : remoteTileRef;
              const isThisFullscreen = fullscreenElement === tileRef.current;

              return (
                <div
                  key={p.id}
                  ref={tileRef}
                  style={{
                    borderRadius: isThisFullscreen ? 0 : 14,
                    background: isThisFullscreen ? "#070d18" : C.elevated,
                    border: isThisFullscreen ? "none" : `2px solid ${p.active ? C.emerald : "rgba(255,255,255,0.06)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    overflow: "hidden",
                    boxShadow: p.active && !isThisFullscreen ? `0 0 20px ${C.emerald}30` : "none",
                    transition: "border-color 0.3s,box-shadow 0.3s",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  {p.isSelf && cam && localStream && localStream.getVideoTracks().length > 0 ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: isThisFullscreen ? "contain" : "cover",
                        transform: "scaleX(-1)",
                        filter: blurred ? "blur(4px)" : "none",
                        transition: "filter 0.3s",
                        background: isThisFullscreen ? "#000" : "transparent",
                      }}
                    />
                  ) : !p.isSelf && remoteStream ? (
                    <>
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        onLoadedMetadata={updateRemoteStreamType}
                        onResize={updateRemoteStreamType}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: isThisFullscreen ? "contain" : effectiveRemoteFit,
                          objectPosition: "center",
                          background: (isThisFullscreen || effectiveRemoteFit === "contain") ? "#000" : "transparent",
                          display: remoteStream.getVideoTracks().length > 0 ? "block" : "none",
                        }}
                      />
                      {remoteStream.getVideoTracks().length === 0 && (
                        <div style={{
                          width: 64, height: 64, borderRadius: "50%",
                          background: `linear-gradient(135deg,${p.color},${p.color}88)`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontSize: 20, fontWeight: 700, fontFamily: INTER,
                          boxShadow: `0 8px 28px ${p.color}50`,
                        }}>{p.ini}</div>
                      )}
                    </>
                  ) : (
                    <div style={{
                      width: 64, height: 64, borderRadius: "50%",
                      background: `linear-gradient(135deg,${p.color},${p.color}88)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: 20, fontWeight: 700, fontFamily: INTER,
                      boxShadow: `0 8px 28px ${p.color}50`,
                      filter: blurred && p.isSelf ? "blur(4px)" : "none",
                      transition: "filter 0.3s",
                    }}>{p.ini}</div>
                  )}

                  {/* Remote screen sharing badge */}
                  {!p.isSelf && isRemoteScreen && (
                    <div style={{ position: "absolute", top: 10, left: 10, zIndex: 10 }}>
                      <span style={{
                        background: `${C.blue}22`,
                        border: `1px solid ${C.blue}40`,
                        borderRadius: 20,
                        padding: "2px 8px",
                        fontSize: 10,
                        fontWeight: 600,
                        color: C.blue,
                        fontFamily: INTER,
                      }}>
                        ● Screen Sharing
                      </span>
                    </div>
                  )}

                  {/* Top-right tile controls */}
                  <div style={{ position: "absolute", top: 10, right: 10, display: "flex", alignItems: "center", gap: 6, zIndex: 15 }}>
                    {blurred && p.isSelf && (
                      <span style={{ background: `${C.blue}22`, border: `1px solid ${C.blue}40`, borderRadius: 8, padding: "2px 7px", fontSize: 9, color: C.blue, fontWeight: 600, fontFamily: INTER }}>
                        Blur ON
                      </span>
                    )}

                    {/* Remote fit toggle: allows user to switch between contain (preserve full screen) and cover (fill tile) */}
                    {!p.isSelf && remoteStream && remoteStream.getVideoTracks().length > 0 && (
                      <button
                        onClick={() => setRemoteFitMode(m => (m ?? (isRemoteScreen ? "contain" : "cover")) === "contain" ? "cover" : "contain")}
                        title={effectiveRemoteFit === "contain" ? "Fill tile (crop edges)" : "Fit to tile (show full screen)"}
                        aria-label={effectiveRemoteFit === "contain" ? "Fill tile" : "Fit to tile"}
                        style={{
                          height: 26,
                          padding: "0 8px",
                          borderRadius: 7,
                          background: "rgba(0,0,0,0.6)",
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                          color: effectiveRemoteFit === "contain" ? C.blue : "#fff",
                          fontSize: 10,
                          fontWeight: 500,
                          fontFamily: INTER,
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0.6)")}
                      >
                        {effectiveRemoteFit === "contain" ? "Fit" : "Fill"}
                      </button>
                    )}

                    {/* Individual tile fullscreen control */}
                    <button
                      onClick={() => toggleTileFullscreen(tileRef.current)}
                      title={isThisFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                      aria-label={isThisFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 7,
                        background: "rgba(0,0,0,0.6)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "#fff",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0.6)")}
                    >
                      {isThisFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                    </button>

                    {p.active && <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.emerald, boxShadow: `0 0 8px ${C.emerald}` }} />}
                  </div>

                  {/* Participant overlay information */}
                  <div style={{ position: "absolute", bottom: 10, left: 10, display: "flex", alignItems: "center", gap: 7, zIndex: 10, pointerEvents: "none" }}>
                    <div style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", borderRadius: 7, padding: "3px 8px", display: "flex", alignItems: "center", gap: 5 }}>
                      {p.handRaised && (
                        <span
                          title={`${p.name}'s hand is raised`}
                          aria-label="Hand raised"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "rgba(245, 158, 11, 0.25)",
                            border: "1px solid rgba(245, 158, 11, 0.5)",
                            borderRadius: 4,
                            padding: "2px 4px",
                            marginRight: 2,
                            boxShadow: "0 0 6px rgba(245, 158, 11, 0.3)",
                          }}
                        >
                          <Hand size={11} color={C.amber} />
                        </span>
                      )}
                      <span style={{ color: "#fff", fontSize: 10, fontWeight: 600, fontFamily: INTER }}>{p.name}</span>
                      <span style={{ color: C.tm, fontSize: 9, fontFamily: INTER }}>· {p.sub}</span>
                      <SpeakWave active={p.active} level={p.audioLevel} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating control bar */}
      <GlassCard style={{
        padding: "7px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        flexShrink: 0,
        position: "relative",
        zIndex: 25,
      }}>
        <CtrlBtn icon={mic ? <Mic size={16} /> : <MicOff size={16} />} label={mic ? "Mute" : "Unmute"} active={mic} onClick={onMic} />
        <CtrlBtn icon={cam ? <Video size={16} /> : <VideoOff size={16} />} label={cam ? "Camera" : "Start"} active={cam} onClick={onCam} />
        <CtrlBtn icon={screen ? <MonitorOff size={16} /> : <Monitor size={16} />} label="Share Screen" active={screen} onClick={onScreen} />
        <CtrlBtn
          icon={<Hand size={16} />}
          label={handRaised ? "Lower Hand" : "Raise Hand"}
          active={handRaised}
          onClick={onHand}
          title={handRaised ? "Lower your hand (hand is currently raised)" : "Raise your hand (hand is currently lowered)"}
          ariaLabel={handRaised ? "Lower hand (currently raised)" : "Raise hand (currently lowered)"}
        />
        <CtrlBtn icon={<Blend size={16} />} label="Blur BG" active={blurred} onClick={onBlur} />
        <CtrlBtn icon={<PenLine size={16} />} label="Whiteboard" active={whiteboardActive} onClick={onWhiteboard} />
        <div style={{ width: 1, height: 38, background: C.border, margin: "0 4px" }} />
        <CtrlBtn icon={<Users size={16} />} label="People" badge={participants.length} active={showParticipants} onClick={onParticipants} />
        <CtrlBtn icon={<Maximize2 size={16} />} label="Fullscreen" onClick={onFullscreen} />
        <div style={{ width: 1, height: 38, background: C.border, margin: "0 4px" }} />
        <button
          onClick={onLeave}
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
          <span style={{ fontSize: 9, fontWeight: 600, color: C.rose }}>Leave</span>
        </button>
      </GlassCard>
    </div>
  );
}

/* ─── Code Editor ─── */
interface CodeEditorProps {
  roomId?: string;
  stompClientRef?: React.RefObject<Client | null>;
  onRegisterRemoteCodeHandler?: (handler: ((msg: CodeSyncMessage) => void) | null) => void;
  currentUserId?: string;
  userRole?: string;
  isExecuting?: boolean;
  onRunCode?: (lang: SupportedInterviewLanguage, code: string) => void;
}

function CodeEditor({
  roomId: propRoomId,
  stompClientRef,
  onRegisterRemoteCodeHandler,
  isExecuting = false,
  onRunCode,
}: CodeEditorProps) {
  const { roomId: paramRoomId } = useParams<{ roomId: string }>();
  const roomId = propRoomId || paramRoomId;

  const [selectedLang, setSelectedLang] = useState<SupportedInterviewLanguage>("Java");
  const [codes, setCodes] = useState<Record<SupportedInterviewLanguage, string>>({
    Java: INTERVIEW_STARTER_TEMPLATES.Java,
    Python: INTERVIEW_STARTER_TEMPLATES.Python,
    "C++": INTERVIEW_STARTER_TEMPLATES["C++"],
  });
  const [langOpen, setLangOpen] = useState(false);
  const [minimap, setMinimap] = useState(true);
  const [wrap, setWrap] = useState(false);
  const [copied, setCopied] = useState(false);

  // Synchronization refs
  const isRemoteUpdateRef = useRef<boolean>(false);
  const hasReceivedRemoteEditRef = useRef<boolean>(false);
  const lastSentCodeRef = useRef<string>("");
  const lastReceivedCodeRef = useRef<string>("");
  const publishTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedLangRef = useRef<SupportedInterviewLanguage>(selectedLang);
  const codesRef = useRef<Record<SupportedInterviewLanguage, string>>(codes);

  useEffect(() => {
    selectedLangRef.current = selectedLang;
  }, [selectedLang]);

  useEffect(() => {
    codesRef.current = codes;
  }, [codes]);

  // Clean up debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (publishTimeoutRef.current) {
        clearTimeout(publishTimeoutRef.current);
      }
    };
  }, []);

  // Fetch persistent code snapshot on mount / roomId change (Phase 4B integration)
  useEffect(() => {
    if (!roomId) return;
    let isCancelled = false;

    const loadSnapshot = async () => {
      try {
        const snapshot = await getInterviewCodeSnapshot(roomId);
        if (isCancelled) return;

        // Race condition prevention:
        // If a newer live collaborative edit has already arrived over STOMP,
        // do not overwrite it with an older REST snapshot!
        if (hasReceivedRemoteEditRef.current) {
          console.info(
            "Skipping REST snapshot overwrite because newer live collaborative edit was already received."
          );
          return;
        }

        if (snapshot) {
          const normalized = normalizeInterviewLanguage(snapshot.language);
          const hasSavedCode =
            typeof snapshot.currentCode === "string" && snapshot.currentCode.trim().length > 0;

          setSelectedLang(normalized);
          selectedLangRef.current = normalized;

          const nextCodes: Record<SupportedInterviewLanguage, string> = { ...codesRef.current };
          const raw = snapshot as unknown as Record<string, string>;
          if (raw["code_Java"] && raw["code_Java"].trim().length > 0) {
            nextCodes.Java = raw["code_Java"];
          }
          if (raw["code_Python"] && raw["code_Python"].trim().length > 0) {
            nextCodes.Python = raw["code_Python"];
          }
          if (raw["code_C++"] && raw["code_C++"].trim().length > 0) {
            nextCodes["C++"] = raw["code_C++"];
          }
          if (hasSavedCode) {
            nextCodes[normalized] = snapshot.currentCode;
          }

          codesRef.current = nextCodes;
          setCodes(nextCodes);

          if (hasSavedCode) {
            lastReceivedCodeRef.current = snapshot.currentCode;
          }
        }
      } catch (err) {
        // Fall back safely to default starter template without breaking the room
        console.error("Failed to load interview code snapshot:", err);
      }
    };

    loadSnapshot();

    return () => {
      isCancelled = true;
    };
  }, [roomId]);

  // Register remote code handler with parent STOMP subscription
  useEffect(() => {
    if (!onRegisterRemoteCodeHandler) return;

    const handleRemoteCode = (msg: CodeSyncMessage) => {
      hasReceivedRemoteEditRef.current = true;

      const incomingLang = msg.language ? normalizeInterviewLanguage(msg.language) : null;
      const currentActiveLang = selectedLangRef.current;
      const isLanguageChange = incomingLang !== null && incomingLang !== currentActiveLang;

      // Check if this is a language-only change (code is null/undefined)
      const isLanguageChangeOnly = msg.code === null || msg.code === undefined;

      if (isLanguageChangeOnly) {
        if (isLanguageChange && incomingLang) {
          console.info(
            `Remote language change received: "${incomingLang}" (switching from "${currentActiveLang}")`
          );

          // Cancel any pending debounced publish for previous language
          if (publishTimeoutRef.current) {
            clearTimeout(publishTimeoutRef.current);
            publishTimeoutRef.current = null;
          }

          setSelectedLang(incomingLang);
          selectedLangRef.current = incomingLang;
          lastReceivedCodeRef.current = codesRef.current[incomingLang] ?? INTERVIEW_STARTER_TEMPLATES[incomingLang];
        }
        return;
      }

      // Otherwise, this message contains code content
      if (typeof msg.code === "string") {
        // If this is a language change, apply language switch immediately regardless of code content!
        if (isLanguageChange && incomingLang) {
          console.info(
            `Remote code sync with language change: "${incomingLang}" (was "${currentActiveLang}")`
          );
          if (publishTimeoutRef.current) {
            clearTimeout(publishTimeoutRef.current);
            publishTimeoutRef.current = null;
          }
          setSelectedLang(incomingLang);
          selectedLangRef.current = incomingLang;
        } else {
          // If in the same language, avoid redundant updates if code is identical to what we just sent
          if (msg.code === lastSentCodeRef.current) {
            return;
          }
        }

        const targetLang = incomingLang || currentActiveLang;

        // If targetLang is the active language, update lastReceivedCodeRef
        if (targetLang === selectedLangRef.current) {
          lastReceivedCodeRef.current = msg.code;
        }

        // Flag that an incoming remote update is being applied to prevent echo / infinite loop
        isRemoteUpdateRef.current = true;

        setCodes((prev) => {
          const updated = {
            ...prev,
            [targetLang]: msg.code as string,
          };
          codesRef.current = updated;
          return updated;
        });

        // Safely release the flag after the React render cycle and Monaco model update
        setTimeout(() => {
          isRemoteUpdateRef.current = false;
        }, 50);
      }
    };

    onRegisterRemoteCodeHandler(handleRemoteCode);

    return () => {
      onRegisterRemoteCodeHandler(null);
    };
  }, [onRegisterRemoteCodeHandler]);

  // Publish helper with debounce
  const publishCode = (codeToPublish: string, langToPublish: string) => {
    if (publishTimeoutRef.current) {
      clearTimeout(publishTimeoutRef.current);
    }

    publishTimeoutRef.current = setTimeout(() => {
      const client = stompClientRef?.current;
      if (client && client.connected && roomId) {
        const payload: Partial<CodeSyncMessage> = {
          roomId,
          code: codeToPublish,
          language: langToPublish,
          cursorPosition: null,
        };

        client.publish({
          destination: `/app/interview/${roomId}/code`,
          body: JSON.stringify(payload),
        });
      }
    }, 200);
  };

  const handleLanguageChange = (newLang: SupportedInterviewLanguage) => {
    if (newLang === selectedLangRef.current) {
      setLangOpen(false);
      return;
    }

    setLangOpen(false);
    setSelectedLang(newLang);
    selectedLangRef.current = newLang;

    // Clear any pending debounced code publish for the previous language
    if (publishTimeoutRef.current) {
      clearTimeout(publishTimeoutRef.current);
      publishTimeoutRef.current = null;
    }

    // Publish language change immediately to STOMP with consistent code for new language
    const client = stompClientRef?.current;
    if (client && client.connected && roomId) {
      const targetCode = codesRef.current[newLang] ?? INTERVIEW_STARTER_TEMPLATES[newLang];
      lastSentCodeRef.current = targetCode;
      lastReceivedCodeRef.current = targetCode;

      const payload: Partial<CodeSyncMessage> = {
        roomId,
        language: newLang,
        code: targetCode,
        cursorPosition: null,
      };

      client.publish({
        destination: `/app/interview/${roomId}/code`,
        body: JSON.stringify(payload),
      });
    }
  };

  const handleCodeChange = (newCode: string) => {
    // 1. If this change was triggered by an incoming remote update being applied, do NOT publish
    if (isRemoteUpdateRef.current) {
      return;
    }

    // 2. If the code is identical to what was just received or sent, do NOT publish
    if (newCode === lastReceivedCodeRef.current || newCode === lastSentCodeRef.current) {
      return;
    }

    // 3. Local edit: update local state and publish via STOMP
    setCodes((prev) => {
      const updated = {
        ...prev,
        [selectedLang]: newCode,
      };
      codesRef.current = updated;
      return updated;
    });

    lastSentCodeRef.current = newCode;
    publishCode(newCode, selectedLang);
  };

  const handleReset = () => {
    const starter = INTERVIEW_STARTER_TEMPLATES[selectedLang];
    setCodes((prev) => {
      const updated = {
        ...prev,
        [selectedLang]: starter,
      };
      codesRef.current = updated;
      return updated;
    });

    if (publishTimeoutRef.current) {
      clearTimeout(publishTimeoutRef.current);
    }

    lastSentCodeRef.current = starter;
    lastReceivedCodeRef.current = starter;

    const client = stompClientRef?.current;
    if (client && client.connected && roomId) {
      client.publish({
        destination: `/app/interview/${roomId}/code`,
        body: JSON.stringify({
          roomId,
          code: starter,
          language: selectedLang,
          cursorPosition: null,
        }),
      });
    }
  };

  const handleCopy = () => {
    const currentCode = codes[selectedLang] ?? "";
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  function TBtn({
    icon,
    label,
    active,
    onClick,
  }: {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick: () => void;
  }) {
    const [hov, setHov] = useState(false);
    return (
      <button
        onClick={onClick}
        title={label}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          width: 27,
          height: 27,
          borderRadius: 7,
          border: "none",
          cursor: "pointer",
          transition: "all 0.15s",
          background: active
            ? `${C.blue}25`
            : hov
              ? "rgba(255,255,255,0.08)"
              : "transparent",
          color: active ? C.blue : hov ? C.tp : C.ts,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </button>
    );
  }

  const activeCode = codes[selectedLang] ?? INTERVIEW_STARTER_TEMPLATES[selectedLang];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: INTER }}>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "0 10px",
          height: 40,
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
        }}
      >
        {/* Language Selector Dropdown - ONLY Java, Python, C++ */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setLangOpen(!langOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              background: "rgba(255,255,255,0.06)",
              border: `1px solid ${C.border}`,
              borderRadius: 7,
              padding: "3px 9px",
              cursor: "pointer",
              color: C.ts,
              fontSize: 11,
              fontWeight: 500,
              fontFamily: INTER,
            }}
          >
            <Code2 size={11} color={C.blue} /> {selectedLang} <ChevronDown size={10} />
          </button>
          {langOpen && (
            <div
              style={{
                position: "absolute",
                top: 34,
                left: 0,
                zIndex: 100,
                background: C.elevated,
                border: `1px solid ${C.border}`,
                borderRadius: 11,
                overflow: "hidden",
                minWidth: 150,
                boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
              }}
            >
              {INTERVIEW_LANGUAGES.map((l) => (
                <button
                  key={l}
                  onClick={() => handleLanguageChange(l)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "7px 13px",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: INTER,
                    fontSize: 12,
                    transition: "background 0.1s",
                    background: l === selectedLang ? `${C.blue}18` : "transparent",
                    color: l === selectedLang ? C.blue : C.ts,
                    fontWeight: l === selectedLang ? 600 : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (l !== selectedLang)
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "rgba(255,255,255,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    if (l !== selectedLang)
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        <TBtn
          icon={<Map size={12} />}
          label={minimap ? "Hide Minimap" : "Show Minimap"}
          active={minimap}
          onClick={() => setMinimap(!minimap)}
        />
        <TBtn
          icon={<WrapText size={12} />}
          label={wrap ? "Disable Word Wrap" : "Enable Word Wrap"}
          active={wrap}
          onClick={() => setWrap(!wrap)}
        />
        <TBtn
          icon={copied ? <CheckCircle2 size={12} color={C.emerald} /> : <Copy size={12} />}
          label={copied ? "Copied!" : "Copy Code"}
          onClick={handleCopy}
        />
        <TBtn
          icon={<RotateCcw size={12} />}
          label="Reset to Boilerplate"
          onClick={handleReset}
        />
        <div style={{ width: 1, height: 16, background: C.border, margin: "0 3px" }} />
        {/* Run Button - connected to backend execution */}
        <button
          onClick={() => onRunCode?.(selectedLang, activeCode)}
          disabled={isExecuting}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: isExecuting
              ? "rgba(255,255,255,0.12)"
              : `linear-gradient(135deg,${C.blue},#1D4ED8)`,
            border: "none",
            borderRadius: 7,
            padding: "4px 12px",
            color: isExecuting ? C.ts : "#fff",
            fontSize: 11,
            fontWeight: 600,
            cursor: isExecuting ? "not-allowed" : "pointer",
            fontFamily: INTER,
            boxShadow: isExecuting ? "none" : `0 3px 12px ${C.blue}40`,
            opacity: isExecuting ? 0.75 : 1,
            transition: "all 0.15s ease",
          }}
        >
          {isExecuting ? (
            <>
              <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} /> Running...
            </>
          ) : (
            <>
              <Play size={10} /> Run
            </>
          )}
        </button>
      </div>

      {/* Monaco Editor */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <InterviewCodeEditor
          value={activeCode}
          language={selectedLang}
          onChange={handleCodeChange}
          minimap={minimap}
          wordWrap={wrap}
        />
      </div>
    </div>
  );
}

/* ─── Chat ─── */
interface ChatMessage {
  id: string;
  sender: string;
  ini: string;
  color: string;
  text: string;
  time: string;
  self: boolean;
}

interface ChatPanelProps {
  roomId?: string;
  stompClientRef?: React.RefObject<Client | null>;
  isCandidate?: boolean;
  userRole?: string;
  currentUserId?: string;
  currentUserName?: string;
  isConnected?: boolean;
  onRegisterRemoteChatHandler?: (handler: ((msg: InterviewChatMessage) => void) | null) => void;
}

function formatChatTime(rawTime?: string): string {
  if (!rawTime) {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  try {
    const d = new Date(rawTime);
    if (isNaN(d.getTime())) {
      return rawTime;
    }
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch {
    return rawTime;
  }
}

function ChatPanel({
  roomId,
  stompClientRef,
  isCandidate = false,
  userRole,
  currentUserId,
  currentUserName,
  isConnected = false,
  onRegisterRemoteChatHandler,
}: ChatPanelProps) {
  // Start with completely empty state (no static / fake messages)
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Register remote chat handler with the parent STOMP subscription
  useEffect(() => {
    if (!onRegisterRemoteChatHandler) return;

    const handleIncomingMessage = (chatMsg: InterviewChatMessage) => {
      if (!chatMsg || !chatMsg.id || !chatMsg.text) return;

      const currentRole = (userRole || (isCandidate ? "candidate" : "interviewer")).toLowerCase();
      const isSelf = Boolean(
        (currentUserId && chatMsg.senderUserId && chatMsg.senderUserId === currentUserId) ||
        (!currentUserId && chatMsg.senderRole && chatMsg.senderRole.toLowerCase() === currentRole)
      );

      const senderRoleLower = chatMsg.senderRole?.toLowerCase();
      const isSenderCandidate = senderRoleLower === "candidate";

      const formattedMsg: ChatMessage = {
        id: chatMsg.id,
        sender: isSelf ? (currentUserName || "You") : (chatMsg.senderName || (isSenderCandidate ? "Candidate" : "Interviewer")),
        ini: getInitials(chatMsg.senderName, isSenderCandidate ? "CA" : "IN"),
        color: isSenderCandidate ? "#7C3AED" : "#1D4ED8",
        text: chatMsg.text,
        time: formatChatTime(chatMsg.timestamp),
        self: isSelf,
      };

      setMsgs((prev) => {
        // Prevent duplicate messages by stable server id
        if (prev.some((m) => m.id === formattedMsg.id)) {
          return prev;
        }
        return [...prev, formattedMsg];
      });
    };

    onRegisterRemoteChatHandler(handleIncomingMessage);
    return () => {
      onRegisterRemoteChatHandler(null);
    };
  }, [onRegisterRemoteChatHandler, currentUserId, isCandidate, userRole]);

  const canSend = Boolean(input.trim()) && isConnected;

  const handleSendMessage = () => {
    const text = input.trim();
    if (!text) return;

    const client = stompClientRef?.current;
    if (!client || !client.connected || !roomId) {
      console.warn("STOMP client is not connected. Cannot publish chat message.");
      return;
    }

    try {
      client.publish({
        destination: `/app/interview/${roomId}/chat`,
        body: JSON.stringify({
          roomId,
          text,
        }),
      });

      // Clear input after publishing
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (err) {
      console.error("Failed to publish chat message:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 80)}px`;
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: INTER, overflow: "hidden" }}>
      {/* Scrollable conversation body */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: "12px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {msgs.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 20px",
              textAlign: "center",
              userSelect: "none",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <MessageSquare size={20} color={C.ts} />
            </div>
            <span style={{ color: C.tp, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              No messages yet
            </span>
            <span style={{ color: C.tm, fontSize: 11, maxWidth: 220, lineHeight: 1.4 }}>
              Messages exchanged during this interview session will appear here in real time.
            </span>
          </div>
        ) : (
          msgs.map(m => (
            <div
              key={m.id}
              style={{
                display: "flex",
                flexDirection: m.self ? "row-reverse" : "row",
                justifyContent: m.self ? "flex-end" : "flex-start",
                alignItems: "flex-end",
                gap: 8,
                width: "100%",
              }}
            >
              {/* Avatar with initials */}
              <div
                title={m.self ? "You" : m.sender}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: m.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 9,
                  fontWeight: 700,
                  flexShrink: 0,
                  userSelect: "none",
                }}
              >
                {m.ini}
              </div>

              {/* Message bubble + sender info */}
              <div
                style={{
                  maxWidth: "75%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                  alignItems: m.self ? "flex-end" : "flex-start",
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: m.self ? "#60A5FA" : C.ts,
                    paddingLeft: m.self ? 0 : 2,
                    paddingRight: m.self ? 2 : 0,
                    userSelect: "none",
                  }}
                >
                  {m.self ? "You" : m.sender}
                </span>
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: m.self ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                    background: m.self
                      ? "linear-gradient(135deg, #1D4ED8, #2563EB)"
                      : "#1E293B",
                    border: m.self
                      ? "1px solid rgba(59, 130, 246, 0.35)"
                      : "1px solid rgba(255, 255, 255, 0.08)",
                    color: m.self ? "#FFFFFF" : C.tp,
                    fontSize: 12,
                    lineHeight: 1.5,
                    boxShadow: m.self
                      ? "0 2px 8px rgba(29, 78, 216, 0.25)"
                      : "0 2px 6px rgba(0, 0, 0, 0.25)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                  }}
                >
                  {m.text}
                </div>
                <span
                  style={{
                    color: C.tm,
                    fontSize: 10,
                    paddingLeft: m.self ? 0 : 4,
                    paddingRight: m.self ? 4 : 0,
                    userSelect: "none",
                  }}
                >
                  {m.time}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area pinned to bottom */}
      <div
        style={{
          padding: "9px 12px",
          borderTop: `1px solid ${C.border}`,
          background: C.surface,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "flex-end",
            background: C.elevated,
            border: `1px solid ${C.border}`,
            borderRadius: 11,
            padding: "6px 8px 6px 12px",
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? "Type a message… (Enter to send, Shift+Enter for newline)" : "Connecting to chat…"}
            disabled={!isConnected}
            rows={1}
            aria-label="Chat message"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: C.tp,
              fontSize: 12,
              lineHeight: "18px",
              fontFamily: INTER,
              resize: "none",
              minHeight: 20,
              maxHeight: 80,
              overflowY: "auto",
              padding: "2px 0",
              opacity: isConnected ? 1 : 0.6,
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!canSend}
            aria-label="Send message"
            title={!isConnected ? "Chat disconnected" : canSend ? "Send message (Enter)" : "Type a message to send"}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: canSend ? `linear-gradient(135deg,${C.blue},#1D4ED8)` : "rgba(255,255,255,0.06)",
              border: "none",
              cursor: canSend ? "pointer" : "not-allowed",
              opacity: canSend ? 1 : 0.45,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: canSend ? `0 3px 10px ${C.blue}40` : "none",
              transition: "all 0.15s",
              flexShrink: 0,
            }}
          >
            <Send size={13} color={canSend ? "#fff" : C.tm} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Console ─── */
interface ConsolePanelProps {
  executionResult: RunInterviewCodeResponse | null;
  isExecuting: boolean;
}

function ConsolePanel({ executionResult, isExecuting }: ConsolePanelProps) {
  type CTab = "console" | "output";
  const [tab, setTab] = useState<CTab>("console");

  const normalizedStatus = (executionResult?.status ?? "").toUpperCase();
  const isSuccess =
    Boolean(executionResult) &&
    (normalizedStatus === "SUCCESS" ||
      (executionResult?.exitCode === 0 && (!executionResult.error || !executionResult.error.trim())));

  const isFailed =
    Boolean(executionResult) &&
    !isSuccess &&
    (normalizedStatus === "ERROR" ||
      normalizedStatus === "COMPILE_ERROR" ||
      normalizedStatus === "RUNTIME_ERROR" ||
      normalizedStatus === "EXECUTION_ERROR" ||
      (executionResult?.exitCode !== null && executionResult?.exitCode !== undefined && executionResult.exitCode !== 0) ||
      Boolean(executionResult?.error && executionResult.error.trim()));

  let failureLabel = "Execution Error";
  if (normalizedStatus === "COMPILE_ERROR" || executionResult?.error?.includes("error:")) {
    failureLabel = "Compile Error";
  } else if (
    normalizedStatus === "RUNTIME_ERROR" ||
    executionResult?.error?.includes("Exception") ||
    executionResult?.error?.includes("Traceback")
  ) {
    failureLabel = "Runtime Error";
  } else if (isFailed) {
    failureLabel = "Failed";
  }

  const formatTime = (t?: string) => {
    if (!t || t === "0") return "";
    const num = parseFloat(t);
    return isNaN(num) ? t : `${num.toFixed(2)}s`;
  };

  const formatMemory = (m?: string) => {
    if (!m || m === "0") return "";
    const num = parseInt(m, 10);
    if (isNaN(num)) return m;
    if (num > 1024) return `${(num / 1024).toFixed(1)} MB`;
    return `${num} KB`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: INTER }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 3,
          padding: "6px 10px",
          borderBottom: `1px solid ${C.border}`,
          background: C.surface,
          flexShrink: 0,
          borderRadius: "0 0 0 0",
        }}
      >
        {(["console", "output"] as CTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "5px 12px",
              borderRadius: 7,
              border: "none",
              cursor: "pointer",
              fontFamily: INTER,
              fontSize: 11,
              fontWeight: tab === t ? 600 : 400,
              color: tab === t ? C.tp : C.tm,
              background: tab === t ? "rgba(255,255,255,0.08)" : "transparent",
              borderBottom: tab === t ? `2px solid ${C.blue}` : "2px solid transparent",
              transition: "all 0.15s",
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {isExecuting ? (
          <span
            style={{
              background: `${C.blue}18`,
              color: C.blue,
              border: `1px solid ${C.blue}30`,
              borderRadius: 20,
              padding: "2px 9px",
              fontSize: 10,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Running...
          </span>
        ) : isSuccess ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                background: `${C.emerald}18`,
                color: C.emerald,
                border: `1px solid ${C.emerald}30`,
                borderRadius: 20,
                padding: "2px 9px",
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              Passed
            </span>
            {formatTime(executionResult?.executionTime) && (
              <span style={{ fontFamily: MONO, fontSize: 10, color: C.tm }}>
                {formatTime(executionResult?.executionTime)}
              </span>
            )}
          </div>
        ) : isFailed ? (
          <span
            style={{
              background: `${C.rose}18`,
              color: C.rose,
              border: `1px solid ${C.rose}30`,
              borderRadius: 20,
              padding: "2px 9px",
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            {failureLabel}
          </span>
        ) : (
          <span
            style={{
              background: "rgba(255,255,255,0.05)",
              color: C.tm,
              border: `1px solid ${C.border}`,
              borderRadius: 20,
              padding: "2px 9px",
              fontSize: 10,
              fontWeight: 500,
            }}
          >
            Ready
          </span>
        )}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
        {isExecuting ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: MONO,
              fontSize: 11,
              color: C.blue,
              padding: "6px 0",
            }}
          >
            <ChevronRight size={12} color={C.blue} />
            <span>Executing program on compiler server...</span>
          </div>
        ) : !executionResult ? (
          <div
            style={{
              fontFamily: INTER,
              fontSize: 12,
              color: C.tm,
              padding: "12px 0",
              textAlign: "center",
            }}
          >
            Press <strong style={{ color: C.ts }}>Run</strong> in the editor toolbar to execute your code.
          </div>
        ) : tab === "console" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {/* Status overview */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <ChevronRight
                size={10}
                color={isSuccess ? C.emerald : C.rose}
                style={{ flexShrink: 0 }}
              />
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  color: isSuccess ? C.emerald : C.rose,
                  fontWeight: 600,
                }}
              >
                {isSuccess
                  ? `Execution Succeeded (Exit code: ${executionResult.exitCode ?? 0})`
                  : `Execution Failed: ${failureLabel}`}
              </span>
            </div>

            {/* Execution metrics */}
            {(formatTime(executionResult.executionTime) || formatMemory(executionResult.memory)) && (
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  color: C.tm,
                  marginLeft: 18,
                  marginBottom: 4,
                }}
              >
                {formatTime(executionResult.executionTime) &&
                  `Time: ${formatTime(executionResult.executionTime)}`}
                {formatTime(executionResult.executionTime) &&
                  formatMemory(executionResult.memory) &&
                  " · "}
                {formatMemory(executionResult.memory) &&
                  `Memory: ${formatMemory(executionResult.memory)}`}
              </div>
            )}

            {/* Error output if any */}
            {executionResult.error && (
              <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 4 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: C.rose,
                    fontFamily: INTER,
                  }}
                >
                  Error Details:
                </span>
                <pre
                  style={{
                    fontFamily: MONO,
                    fontSize: 11,
                    color: C.rose,
                    background: "rgba(244,63,94,0.08)",
                    border: "1px solid rgba(244,63,94,0.2)",
                    borderRadius: 6,
                    padding: "8px 10px",
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    lineHeight: 1.6,
                  }}
                >
                  {executionResult.error}
                </pre>
              </div>
            )}

            {/* Standard output if any */}
            {executionResult.output && executionResult.output.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 4 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: C.tm,
                    fontFamily: INTER,
                  }}
                >
                  Standard Output:
                </span>
                <pre
                  style={{
                    fontFamily: MONO,
                    fontSize: 11,
                    color: C.tp,
                    background: "rgba(0,0,0,0.3)",
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                    padding: "8px 10px",
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    lineHeight: 1.6,
                  }}
                >
                  {executionResult.output}
                </pre>
              </div>
            ) : !executionResult.error ? (
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  color: C.tm,
                  fontStyle: "italic",
                  marginLeft: 18,
                  marginTop: 6,
                }}
              >
                No Output
              </div>
            ) : null}
          </div>
        ) : (
          /* Output tab: Clean, full-height raw stdout / stderr view */
          <div style={{ fontFamily: MONO, fontSize: 12, lineHeight: 1.7, minHeight: "100%" }}>
            {executionResult.output && executionResult.output.length > 0 ? (
              <pre
                style={{
                  fontFamily: MONO,
                  fontSize: 12,
                  color: C.tp,
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {executionResult.output}
              </pre>
            ) : executionResult.error ? (
              <pre
                style={{
                  fontFamily: MONO,
                  fontSize: 12,
                  color: C.rose,
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {executionResult.error}
              </pre>
            ) : (
              <div style={{ color: C.tm, fontStyle: "italic", fontSize: 11 }}>
                No Output
              </div>
            )}
            {(formatTime(executionResult.executionTime) || formatMemory(executionResult.memory)) && (
              <div
                style={{
                  color: C.tm,
                  marginTop: 14,
                  paddingTop: 8,
                  borderTop: `1px solid ${C.border}`,
                  fontSize: 11,
                }}
              >
                {formatTime(executionResult.executionTime)
                  ? `Execution time: ${formatTime(executionResult.executionTime)}`
                  : ""}
                {formatTime(executionResult.executionTime) &&
                  formatMemory(executionResult.memory)
                  ? " · "
                  : ""}
                {formatMemory(executionResult.memory)
                  ? `Memory: ${formatMemory(executionResult.memory)}`
                  : ""}
              </div>
            )}
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

function ScoreModalDialog({
  open,
  onClose,
  isInterviewer,
  isCandidate,
  hasAlreadyScored,
  submittedScore,
  alreadySubmittedScore,
  scoreInput,
  onScoreInputChange,
  scoreValidationError,
  scoreSubmitError,
  isSubmittingScore,
  onSubmit,
  onNavigateDashboard,
}: {
  open: boolean;
  onClose: () => void;
  isInterviewer: boolean;
  isCandidate: boolean;
  hasAlreadyScored: boolean;
  submittedScore: number | null;
  alreadySubmittedScore: number | null;
  scoreInput: string;
  onScoreInputChange: (val: string) => void;
  scoreValidationError: string | null;
  scoreSubmitError: string | null;
  isSubmittingScore: boolean;
  onSubmit: (e?: React.FormEvent) => void;
  onNavigateDashboard: () => void;
}) {
  if (!open) return null;
  const isDone = hasAlreadyScored || submittedScore != null;
  const currentScoreVal = submittedScore ?? alreadySubmittedScore;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(15,23,42,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        fontFamily: INTER,
      }}
    >
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          padding: "36px 32px",
          maxWidth: 440,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 25px 70px rgba(0,0,0,0.6)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: isDone
              ? "rgba(16,185,129,0.12)"
              : "rgba(59,130,246,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isDone ? (
            <CheckCircle2 size={30} color={C.emerald} />
          ) : (
            <Star size={28} color={C.blue} />
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h2 style={{ color: C.tp, fontSize: 20, fontWeight: 700 }}>
            Interview Complete
          </h2>
          <p style={{ color: C.ts, fontSize: 14 }}>
            {isDone
              ? "Your score has been recorded."
              : isInterviewer
              ? "Rate the Candidate"
              : "Rate the Interviewer"}
          </p>
        </div>

        {isDone ? (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
            <div
              style={{
                background: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.25)",
                borderRadius: 14,
                padding: "16px 20px",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{ color: C.ts, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                Score Submitted
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ color: C.emerald, fontSize: 32, fontWeight: 800, fontFamily: MONO }}>
                  {currentScoreVal}
                </span>
                <span style={{ color: C.tm, fontSize: 16, fontWeight: 600 }}>/ 100</span>
              </div>
              <span style={{ color: C.ts, fontSize: 12 }}>
                {isInterviewer
                  ? "Thank you for evaluating this candidate."
                  : "Thank you for rating your interviewer."}
              </span>
            </div>

            <button
              onClick={onNavigateDashboard}
              style={{
                width: "100%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px 24px",
                borderRadius: 12,
                border: "none",
                background: C.blue,
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              <LogOut size={16} />
              Return to Dashboard
            </button>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%" }}>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                autoFocus
                placeholder="85"
                value={scoreInput}
                disabled={isSubmittingScore}
                onChange={(e) => onScoreInputChange(e.target.value)}
                style={{
                  width: 110,
                  height: 52,
                  textAlign: "center",
                  fontSize: 24,
                  fontWeight: 700,
                  fontFamily: MONO,
                  color: C.tp,
                  background: C.elevated,
                  border: `1px solid ${scoreValidationError ? C.rose : C.border}`,
                  borderRadius: 12,
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => (e.currentTarget.style.borderColor = scoreValidationError ? C.rose : C.blue)}
                onBlur={e => (e.currentTarget.style.borderColor = scoreValidationError ? C.rose : C.border)}
              />
              <span style={{ color: C.ts, fontSize: 18, fontWeight: 600 }}>/ 100</span>
            </div>

            {(scoreValidationError || scoreSubmitError) && (
              <div
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "rgba(244,63,94,0.12)",
                  border: "1px solid rgba(244,63,94,0.3)",
                  color: "#FDA4AF",
                  fontSize: 12,
                  lineHeight: 1.4,
                  textAlign: "center",
                }}
              >
                {scoreValidationError || scoreSubmitError}
              </div>
            )}

            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              <button
                type="submit"
                disabled={isSubmittingScore}
                style={{
                  width: "100%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "12px 24px",
                  borderRadius: 12,
                  border: "none",
                  background: C.blue,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: isSubmittingScore ? "not-allowed" : "pointer",
                  opacity: isSubmittingScore ? 0.7 : 1,
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={e => {
                  if (!isSubmittingScore) e.currentTarget.style.opacity = "0.9";
                }}
                onMouseLeave={e => {
                  if (!isSubmittingScore) e.currentTarget.style.opacity = "1";
                }}
              >
                {isSubmittingScore ? (
                  <>
                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                    Submitting...
                  </>
                ) : (
                  "Submit Score"
                )}
              </button>

              <button
                type="button"
                disabled={isSubmittingScore}
                onClick={onNavigateDashboard}
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "transparent",
                  border: "none",
                  color: C.tm,
                  fontSize: 12,
                  cursor: "pointer",
                  transition: "color 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = C.ts)}
                onMouseLeave={e => (e.currentTarget.style.color = C.tm)}
              >
                Skip & Return to Dashboard
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ─── Root ─── */
export default function InterviewRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const timer = useTimer();
  const containerRef = useRef<HTMLDivElement>(null);
  const [presenceStatus, setPresenceStatus] = useState("Connecting");
  const [presenceMessages, setPresenceMessages] = useState<PresenceMessage[]>([]);

  const globalRole = getUserRole();
  const [currentUser, setCurrentUser] = useState<User | null>(() => getUser());
  const [roomAuthStatus, setRoomAuthStatus] = useState<"verifying" | "authorized" | "unauthorized" | "not_found" | "completed" | "error">("verifying");
  const [roomAuthError, setRoomAuthError] = useState<string | null>(null);
  const [interviewRecord, setInterviewRecord] = useState<InterviewDetailsResponse | null>(null);
  const [roomRole, setRoomRole] = useState<"Interviewer" | "Candidate" | "Observer" | null>(null);

  const currentUserId = currentUser?.id || currentUser?._id || currentUser?.userId;
  const currentUserName = currentUser?.name?.trim();
  const isCandidate = roomRole ? roomRole === "Candidate" : globalRole === "candidate";
  const isInterviewer = roomRole === "Interviewer" || (!roomRole && globalRole === "interviewer");
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [completionNotice, setCompletionNotice] = useState<{
    show: boolean;
    title: string;
    message: string;
  } | null>(null);
  const isTerminatedRef = useRef(false);

  // Mutual Scoring State
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [scoreInput, setScoreInput] = useState("");
  const [scoreValidationError, setScoreValidationError] = useState<string | null>(null);
  const [scoreSubmitError, setScoreSubmitError] = useState<string | null>(null);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);
  const [hasAlreadyScored, setHasAlreadyScored] = useState(false);
  const [alreadySubmittedScore, setAlreadySubmittedScore] = useState<number | null>(null);

  const validateScoreInput = (raw: string): { valid: boolean; error?: string; value?: number } => {
    const trimmed = raw.trim();
    if (!trimmed) {
      return { valid: false, error: "Please enter a score." };
    }
    if (!/^-?\d+$/.test(trimmed)) {
      if (/^-?\d+\.\d+$/.test(trimmed)) {
        return { valid: false, error: "Decimal scores are not allowed. Please enter an integer from 0 to 100." };
      }
      return { valid: false, error: "Invalid score. Please enter a whole number from 0 to 100." };
    }
    const num = Number(trimmed);
    if (isNaN(num)) {
      return { valid: false, error: "Score must be a number." };
    }
    if (num < 0 || num > 100) {
      return { valid: false, error: "Score must be between 0 and 100." };
    }
    return { valid: true, value: num };
  };

  const handleScoreSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmittingScore || hasAlreadyScored || submittedScore != null || !roomId) {
      return;
    }
    setScoreValidationError(null);
    setScoreSubmitError(null);

    const validation = validateScoreInput(scoreInput);
    if (!validation.valid || validation.value === undefined) {
      setScoreValidationError(validation.error || "Invalid score.");
      return;
    }

    setIsSubmittingScore(true);
    try {
      await submitInterviewScore(roomId, validation.value);
      setSubmittedScore(validation.value);
      setHasAlreadyScored(true);
      setAlreadySubmittedScore(validation.value);
    } catch (err: any) {
      console.error("Failed to submit score:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to submit score. Please try again.";
      setScoreSubmitError(msg);
    } finally {
      setIsSubmittingScore(false);
    }
  };

  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [screen, setScreen] = useState(false);
  const [raisedHands, setRaisedHands] = useState<{ candidate: boolean; interviewer: boolean }>({
    candidate: false,
    interviewer: false,
  });
  const selfRoleKey = isCandidate ? "candidate" : "interviewer";
  const handRaised = raisedHands[selfRoleKey];
  const [blurred, setBlurred] = useState(false);
  const [, setIsFullscreen] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [whiteboardActive, setWhiteboardActive] = useState(false);
  const [speakingStates, setSpeakingStates] = useState<{ candidate: boolean; interviewer: boolean }>({
    candidate: false,
    interviewer: false,
  });
  const [rightTab, setRightTab] = useState<"code" | "chat">("code");
  const [consoleVisible, setConsoleVisible] = useState(true);
  const [shortcutOpen, setShortcutOpen] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);

  // Initialize participantsMap empty until room membership is verified
  const [participantsMap, setParticipantsMap] = useState<Record<string, RoomParticipant>>({});
  const hasAnnouncedToUserRef = useRef<Set<string>>(new Set());

  // Step 2 & 3: Verify room membership via backend before initializing room participation
  useEffect(() => {
    let active = true;

    const verifyMembership = async () => {
      if (!roomId) {
        if (active) {
          setRoomAuthStatus("error");
          setRoomAuthError("Missing room ID in URL");
        }
        return;
      }

      const token = getToken();
      if (!token) {
        if (active) {
          setRoomAuthStatus("unauthorized");
          setRoomAuthError("You must be logged in to enter an interview room.");
        }
        return;
      }

      try {
        let usr = getUser();
        if (!usr || !usr.id) {
          usr = await fetchCurrentUser();
        }
        if (active && usr) {
          setCurrentUser(usr);
        }

        const roomData = await getInterviewRoom(roomId);
        if (!active) return;

        setInterviewRecord(roomData);

        if (roomData.status === "COMPLETED") {
          const uid = usr?.id || usr?.userId;
          let assignedRole: "Interviewer" | "Candidate" | "Observer" | null = null;
          if (uid && roomData.interviewerId && uid === roomData.interviewerId) {
            assignedRole = "Interviewer";
          } else if (uid && roomData.candidateId && uid === roomData.candidateId) {
            assignedRole = "Candidate";
          } else if (uid && roomData.observerId && uid === roomData.observerId) {
            assignedRole = "Observer";
          }
          if (assignedRole) {
            setRoomRole(assignedRole);
          }
          setRoomAuthStatus("completed");
          setRoomAuthError("This interview has been completed and is no longer active.");

          // Check if user has already scored
          try {
            const scoresData = await getInterviewScores(roomId);
            const isCand = assignedRole ? assignedRole === "Candidate" : globalRole === "candidate";
            const myScore = isCand ? scoresData.interviewerScore : scoresData.candidateScore;
            if (myScore != null) {
              setHasAlreadyScored(true);
              setAlreadySubmittedScore(myScore);
            }
          } catch (e) {
            console.warn("Could not check scores for completed room:", e);
          }
          return;
        }

        const uid = usr?.id || usr?.userId;
        let assignedRole: "Interviewer" | "Candidate" | "Observer" | null = null;
        if (uid && roomData.interviewerId && uid === roomData.interviewerId) {
          assignedRole = "Interviewer";
        } else if (uid && roomData.candidateId && uid === roomData.candidateId) {
          assignedRole = "Candidate";
        } else if (uid && roomData.observerId && uid === roomData.observerId) {
          assignedRole = "Observer";
        }

        if (!assignedRole) {
          setRoomAuthStatus("unauthorized");
          setRoomAuthError("You are not an assigned participant of this interview room.");
          return;
        }

        setRoomRole(assignedRole);
        setRoomAuthStatus("authorized");

        // Seed verified local participant keyed by stable authentic userId
        const localName = usr?.name?.trim() || assignedRole;
        const localColor = getRoleColor(assignedRole.toLowerCase());
        setParticipantsMap({
          [uid!]: {
            id: uid!,
            userId: uid!,
            name: localName,
            role: assignedRole,
            ini: getInitials(localName, assignedRole.slice(0, 2).toUpperCase()),
            color: localColor,
            isSelf: true,
            mic,
            cam,
            speaking: false,
            handRaised: false,
            ping: 20,
          },
        });
      } catch (err: any) {
        if (!active) return;
        console.error("Room verification failed:", err);
        const status = err?.response?.status;
        const msg = err?.response?.data?.message || err?.message;
        if (status === 403) {
          setRoomAuthStatus("unauthorized");
          setRoomAuthError(msg || "You are not authorized to join this interview room.");
        } else if (status === 404) {
          setRoomAuthStatus("not_found");
          setRoomAuthError(msg || "Interview room not found.");
        } else {
          setRoomAuthStatus("error");
          setRoomAuthError(msg || "Failed to verify room membership.");
        }
      }
    };

    void verifyMembership();

    return () => {
      active = false;
    };
  }, [roomId]);

  // Sync local controls & speaking status into participantsMap
  useEffect(() => {
    setParticipantsMap(prev => {
      const selfKey = Object.keys(prev).find(k => prev[k].isSelf) || currentUserId;
      if (!selfKey) return prev;
      const current = prev[selfKey];
      if (!current) return prev;
      const isSpeaking = Boolean(isCandidate ? speakingStates.candidate : speakingStates.interviewer);
      const isRaised = Boolean(isCandidate ? raisedHands.candidate : raisedHands.interviewer);
      if (current.mic === mic && current.cam === cam && current.speaking === isSpeaking && current.handRaised === isRaised) {
        return prev;
      }
      return {
        ...prev,
        [selfKey]: {
          ...current,
          mic,
          cam,
          speaking: isSpeaking,
          handRaised: isRaised,
        },
      };
    });
  }, [mic, cam, speakingStates, raisedHands, isCandidate, currentUserId]);

  // Sync remote participant speaking & hand raised status into participantsMap
  useEffect(() => {
    setParticipantsMap(prev => {
      let changed = false;
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        const p = next[key];
        if (p.isSelf) return;
        const roleKey = p.role.toLowerCase() as "candidate" | "interviewer";
        const isSpeaking = Boolean(speakingStates[roleKey]);
        const isRaised = Boolean(raisedHands[roleKey]);
        if (p.speaking !== isSpeaking || p.handRaised !== isRaised) {
          next[key] = { ...p, speaking: isSpeaking, handRaised: isRaised };
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [speakingStates, raisedHands]);

  const participantsList = Object.values(participantsMap);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const stompClientRef = useRef<Client | null>(null);
  const remoteCodeHandlerRef = useRef<((msg: CodeSyncMessage) => void) | null>(null);
  const remoteChatHandlerRef = useRef<((msg: InterviewChatMessage) => void) | null>(null);
  const remoteWhiteboardHandlerRef = useRef<((msg: InterviewWhiteboardMessage) => void) | null>(null);

  const handleRegisterRemoteCode = useCallback(
    (handler: ((msg: CodeSyncMessage) => void) | null) => {
      remoteCodeHandlerRef.current = handler;
    },
    []
  );

  const handleRegisterRemoteChat = useCallback(
    (handler: ((msg: InterviewChatMessage) => void) | null) => {
      remoteChatHandlerRef.current = handler;
    },
    []
  );

  const handleRegisterRemoteWhiteboard = useCallback(
    (handler: ((msg: InterviewWhiteboardMessage) => void) | null) => {
      remoteWhiteboardHandlerRef.current = handler;
    },
    []
  );

  const handleToggleHand = useCallback(() => {
    const nextState = !handRaised;

    // Update local state immediately for instant responsive feedback
    setRaisedHands((prev) => ({
      ...prev,
      [selfRoleKey]: nextState,
    }));

    // Publish to STOMP signaling channel so other participant receives state in real time
    const client = stompClientRef.current;
    if (client && client.connected && roomId) {
      try {
        client.publish({
          destination: `/app/interview/${roomId}/signal`,
          body: JSON.stringify({
            roomId,
            type: nextState ? "RAISE_HAND" : "LOWER_HAND",
            raised: nextState,
          }),
        });
        console.info(`Published ${nextState ? "RAISE_HAND" : "LOWER_HAND"} for room ${roomId}`);
      } catch (err) {
        console.error("Failed to publish hand state change via STOMP:", err);
      }
    } else {
      console.warn("STOMP client not connected, hand state toggled locally only");
    }
  }, [handRaised, roomId, selfRoleKey]);

  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<RunInterviewCodeResponse | null>(null);

  const handleRunCode = useCallback(
    async (lang: SupportedInterviewLanguage, code: string) => {
      if (!roomId || isExecuting) return;
      setIsExecuting(true);
      setConsoleVisible(true);
      try {
        const res = await runInterviewCode(roomId, {
          language: lang,
          code,
          input: "",
        });
        setExecutionResult(res);
      } catch (err: any) {
        setExecutionResult({
          status: "EXECUTION_ERROR",
          output: "",
          error:
            err?.response?.data?.message ||
            err?.message ||
            "Execution request failed",
          exitCode: -1,
        });
      } finally {
        setIsExecuting(false);
      }
    },
    [roomId, isExecuting]
  );

  const hasCandidateJoinedRef = useRef(false);
  const isOfferingRef = useRef(false);
  const remoteIceQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const localIceQueueRef = useRef<RTCIceCandidate[]>([]);
  const mediaAcquisitionPromiseRef = useRef<Promise<MediaStream | null> | null>(null);

  const processOrQueueRemoteCandidate = async (candidateInit: RTCIceCandidateInit) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;
    if (pc.remoteDescription && pc.remoteDescription.type) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
      } catch (err) {
        console.error("Error adding remote ICE candidate:", err);
      }
    } else {
      console.info("Queueing remote ICE candidate until remoteDescription is set");
      remoteIceQueueRef.current.push(candidateInit);
    }
  };

  const flushQueuedRemoteCandidates = async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !pc.remoteDescription) return;
    while (remoteIceQueueRef.current.length > 0) {
      const candidateInit = remoteIceQueueRef.current.shift();
      if (candidateInit) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
        } catch (err) {
          console.error("Error flushing queued remote ICE candidate:", err);
        }
      }
    }
  };

  const createAndSendOffer = async () => {
    const pc = peerConnectionRef.current;
    const client = stompClientRef.current;
    if (!pc || !client || !client.connected || !roomId) {
      return;
    }

    if (isCandidate) {
      return;
    }

    if (!localStreamRef.current) {
      return;
    }

    if (isOfferingRef.current || pc.signalingState !== "stable") {
      return;
    }

    isOfferingRef.current = true;
    try {
      console.info("Interviewer creating and sending WebRTC OFFER...");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      client.publish({
        destination: `/app/interview/${roomId}/signal`,
        body: JSON.stringify({
          roomId,
          type: "OFFER",
          sdp: offer.sdp,
        }),
      });
      console.info("Sent WebRTC OFFER to room:", roomId);
    } catch (err) {
      console.error("Failed to create/send WebRTC offer:", err);
    } finally {
      isOfferingRef.current = false;
    }
  };

  const handleLeave = () => {
    isTerminatedRef.current = true;
    if (stompClientRef.current?.connected && roomId) {
      try {
        stompClientRef.current.publish({
          destination: `/app/interview/${roomId}/leave`,
          body: JSON.stringify({}),
        });
      } catch (e) {
        console.warn("Could not publish leave message:", e);
      }
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    screenStream?.getTracks().forEach(t => t.stop());
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    remoteStreamRef.current = null;
    setRemoteStream(null);
    remoteIceQueueRef.current = [];
    localIceQueueRef.current = [];
    mediaAcquisitionPromiseRef.current = null;
    hasCandidateJoinedRef.current = false;
    stompClientRef.current = null;
    setRaisedHands({ candidate: false, interviewer: false });
    navigate(isCandidate ? "/candidate" : "/interviewer");
  };

  const handleFinishInterview = async () => {
    if (isFinishing || !roomId || isCandidate || isTerminatedRef.current) return;
    setIsFinishing(true);
    setFinishError(null);

    try {
      const response = await finishInterviewRoom(roomId);
      if (response && response.status === "COMPLETED") {
        isTerminatedRef.current = true;
        if (stompClientRef.current?.connected && roomId) {
          try {
            stompClientRef.current.publish({
              destination: `/app/interview/${roomId}/leave`,
              body: JSON.stringify({}),
            });
          } catch (e) {
            console.warn("Could not publish leave message:", e);
          }
        }
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(t => t.stop());
          screenStreamRef.current = null;
        }
        screenStream?.getTracks().forEach(t => t.stop());
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        if (peerConnectionRef.current) {
          peerConnectionRef.current.onicecandidate = null;
          peerConnectionRef.current.ontrack = null;
          peerConnectionRef.current.close();
          peerConnectionRef.current = null;
        }
        remoteStreamRef.current = null;
        setRemoteStream(null);
        remoteIceQueueRef.current = [];
        localIceQueueRef.current = [];
        mediaAcquisitionPromiseRef.current = null;
        hasCandidateJoinedRef.current = false;
        stompClientRef.current = null;
        setRaisedHands({ candidate: false, interviewer: false });

        // Open mutual scoring modal for interviewer
        try {
          const scoresData = await getInterviewScores(roomId);
          if (scoresData.candidateScore != null) {
            setHasAlreadyScored(true);
            setAlreadySubmittedScore(scoresData.candidateScore);
          }
        } catch (e) {
          console.warn("Could not check scores on finish:", e);
        }
        setScoreModalOpen(true);
      } else {
        setFinishError("Interview status was not updated to completed. Please try again.");
        setIsFinishing(false);
      }
    } catch (err: any) {
      console.error("Failed to finish interview:", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to finish interview. Please try again.";
      setFinishError(msg);
      setIsFinishing(false);
    }
  };

  const handleRemoteInterviewCompleted = useCallback((eventMsg?: InterviewEventMessage) => {
    if (isTerminatedRef.current) return;
    isTerminatedRef.current = true;

    // Interviewer already handles termination via REST response flow
    if (!isCandidate) {
      return;
    }

    console.info("Candidate processing remote interview completion event:", eventMsg);

    // 1. Immediately stop local audio, video, and screen sharing tracks
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    screenStream?.getTracks().forEach(t => t.stop());
    localStreamRef.current?.getTracks().forEach(t => t.stop());

    // 2. Close WebRTC peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // 3. Clear remote media state
    remoteStreamRef.current = null;
    setRemoteStream(null);
    remoteIceQueueRef.current = [];
    localIceQueueRef.current = [];
    mediaAcquisitionPromiseRef.current = null;
    hasCandidateJoinedRef.current = false;

    // 4. Disconnect STOMP
    if (stompClientRef.current) {
      try {
        stompClientRef.current.deactivate();
      } catch (err) {
        console.warn("Error deactivating STOMP client on remote completion:", err);
      }
      stompClientRef.current = null;
    }

    setRaisedHands({ candidate: false, interviewer: false });

    // 5. Open mutual scoring modal for Candidate
    if (roomId) {
      void getInterviewScores(roomId).then(scoresData => {
        if (scoresData.interviewerScore != null) {
          setHasAlreadyScored(true);
          setAlreadySubmittedScore(scoresData.interviewerScore);
        }
      }).catch(err => {
        console.warn("Could not check scores on remote completion:", err);
      });
    }
    setScoreModalOpen(true);
  }, [isCandidate, roomId, screenStream]);

  useEffect(() => {
    if (roomAuthStatus !== "authorized") return;
    let active = true;
    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaError("getUserMedia is not supported");
      return;
    }

    const acquireMedia = async (): Promise<MediaStream | null> => {
      try {
        return await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (err) {
        console.warn("getUserMedia({ video: true, audio: true }) failed, falling back to audio only:", err);
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          if (active) {
            setCam(false);
            setMediaError("Camera unavailable. Microphone audio enabled.");
          }
          return audioStream;
        } catch (audioErr) {
          console.error("getUserMedia audio fallback also failed:", audioErr);
          throw audioErr;
        }
      }
    };

    const promise = acquireMedia()
      .then(stream => {
        if (!active || !stream) {
          stream?.getTracks().forEach(t => t.stop());
          return null;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);
        stream.getAudioTracks().forEach(t => { t.enabled = mic; });
        stream.getVideoTracks().forEach(t => { t.enabled = cam; });
        return stream;
      })
      .catch(err => {
        if (!active) return null;
        setMediaError(err instanceof Error ? err.message : "Failed to access microphone/camera");
        return null;
      });

    mediaAcquisitionPromiseRef.current = promise;

    return () => {
      active = false;
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
      mediaAcquisitionPromiseRef.current = null;
    };
  }, [roomAuthStatus]);

  useEffect(() => {
    if (roomAuthStatus !== "authorized") return;
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      const client = stompClientRef.current;
      if (client?.connected && roomId) {
        client.publish({
          destination: `/app/interview/${roomId}/signal`,
          body: JSON.stringify({
            roomId,
            type: "ICE_CANDIDATE",
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
          }),
        });
      } else {
        localIceQueueRef.current.push(event.candidate);
      }
    };

    pc.ontrack = (event) => {
      console.info("WebRTC ontrack received track:", event.track.kind, event.track.id);
      const incomingStream = event.streams?.[0];
      if (incomingStream) {
        remoteStreamRef.current = incomingStream;
        setRemoteStream(incomingStream);
      } else {
        let stream = remoteStreamRef.current;
        if (!stream) {
          stream = new MediaStream();
          remoteStreamRef.current = stream;
        }
        if (!stream.getTracks().some(t => t.id === event.track.id)) {
          stream.addTrack(event.track);
        }
        setRemoteStream(stream);
      }
    };

    return () => {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.close();
      peerConnectionRef.current = null;
      remoteStreamRef.current = null;
      setRemoteStream(null);
      remoteIceQueueRef.current = [];
      localIceQueueRef.current = [];
    };
  }, [roomId, roomAuthStatus]);

  useEffect(() => {
    if (!localStream || !peerConnectionRef.current) return;
    const pc = peerConnectionRef.current;
    const senders = pc.getSenders();
    localStream.getTracks().forEach((track) => {
      const alreadyAdded = senders.some((sender) => sender.track === track);
      if (!alreadyAdded) {
        pc.addTrack(track, localStream);
      }
    });

    if (!isCandidate && hasCandidateJoinedRef.current) {
      void createAndSendOffer();
    }
  }, [localStream, isCandidate]);

  const toggleMic = () => {
    setMic(m => {
      const next = !m;
      localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = next; });
      return next;
    });
  };

  const toggleCam = () => {
    setCam(c => {
      const next = !c;
      localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = next; });
      return next;
    });
  };

  useEffect(() => {
    if (roomAuthStatus !== "authorized") return;
    let isActive = true;
    setPresenceStatus("Connecting");
    setPresenceMessages([]);

    if (!roomId) {
      setPresenceStatus("Missing room ID");
      return;
    }

    const token = getToken();
    if (!token) {
      setPresenceStatus("Missing authentication token");
      return;
    }

    let unsubscribe: (() => void) | undefined;
    const client = new Client({
      brokerURL: getWebSocketUrl(),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 0,
      onConnect: () => {
        if (isActive) {
          setPresenceStatus("Connected");
        }
        stompClientRef.current = client;

        const presenceSub = client.subscribe(
          `/topic/interview/${roomId}/presence`,
          (message) => {
            try {
              const presence = JSON.parse(message.body) as PresenceMessage;
              console.info("Interview presence event:", presence);
              if (isActive) {
                setPresenceMessages((events) => [...events, presence].slice(-5));
              }

              if (presence.event === "JOINED") {
                const presenceUserId = presence.userId;
                if (!presenceUserId) return;

                // Validate that this user belongs to this interview room
                if (interviewRecord) {
                  const isAssigned = (
                    presenceUserId === interviewRecord.interviewerId ||
                    presenceUserId === interviewRecord.candidateId ||
                    Boolean(interviewRecord.observerId && presenceUserId === interviewRecord.observerId)
                  );
                  if (!isAssigned) {
                    console.warn("Ignoring presence from unassigned user:", presenceUserId);
                    return;
                  }
                }

                const isSelf = Boolean(currentUserId && presenceUserId === currentUserId);
                const presenceRoleLower = (presence.role || "").toLowerCase();
                const roleDisplay = presenceRoleLower === "candidate"
                  ? "Candidate"
                  : presenceRoleLower === "observer"
                  ? "Observer"
                  : "Interviewer";

                const nameDisplay = presence.name?.trim() || (isSelf && currentUserName ? currentUserName : roleDisplay);
                const color = getRoleColor(presenceRoleLower);

                setParticipantsMap((prev) => {
                  const copy = { ...prev };
                  const existing = copy[presenceUserId];
                  copy[presenceUserId] = {
                    id: presenceUserId,
                    userId: presenceUserId,
                    name: nameDisplay,
                    role: roleDisplay,
                    ini: getInitials(nameDisplay, presenceRoleLower.slice(0, 2).toUpperCase()),
                    color,
                    isSelf,
                    mic: isSelf ? mic : (existing ? existing.mic : true),
                    cam: isSelf ? cam : (existing ? existing.cam : true),
                    speaking: isSelf
                      ? Boolean(isCandidate ? speakingStates.candidate : speakingStates.interviewer)
                      : Boolean(existing?.speaking),
                    handRaised: isSelf
                      ? Boolean(isCandidate ? raisedHands.candidate : raisedHands.interviewer)
                      : Boolean(existing?.handRaised),
                    ping: existing?.ping ?? (isSelf ? 20 : 35),
                  };
                  return copy;
                });

                if (!isSelf) {
                  if (!hasAnnouncedToUserRef.current.has(presenceUserId)) {
                    hasAnnouncedToUserRef.current.add(presenceUserId);
                    if (client.connected) {
                      client.publish({
                        destination: `/app/interview/${roomId}/join`,
                        body: JSON.stringify({}),
                      });
                    }
                  }
                }

                if (presenceRoleLower === "candidate") {
                  hasCandidateJoinedRef.current = true;
                  if (!isCandidate) {
                    void createAndSendOffer();
                  }
                }
              } else if (presence.event === "LEFT") {
                if (presence.userId) {
                  hasAnnouncedToUserRef.current.delete(presence.userId);
                  setParticipantsMap((prev) => {
                    const next = { ...prev };
                    delete next[presence.userId];
                    return next;
                  });
                  if (presence.role?.toLowerCase() === "candidate") {
                    hasCandidateJoinedRef.current = false;
                  }
                }
              }
            } catch {
              console.error("Unable to parse interview presence message", message.body);
            }
          },
        );

        const signalSub = client.subscribe(
          `/topic/interview/${roomId}/signal`,
          async (message) => {
            try {
              const signal = JSON.parse(message.body) as WebRTCSignalMessage;
              if (!signal || !signal.type) return;

              const isFromSelf = Boolean(
                signal.senderUserId && currentUserId && signal.senderUserId === currentUserId
              );

              if (isFromSelf) {
                return;
              }

              // Handle Hand Raise / Lower signals
              if (
                signal.type === "RAISE_HAND" ||
                signal.type === "LOWER_HAND" ||
                signal.type === "HAND_STATE"
              ) {
                const isRaised =
                  signal.type === "RAISE_HAND"
                    ? true
                    : signal.type === "LOWER_HAND"
                      ? false
                      : Boolean(signal.raised);

                const senderRole = signal.senderRole?.toLowerCase();
                if (senderRole === "candidate" || senderRole === "interviewer") {
                  setRaisedHands((prev) => ({
                    ...prev,
                    [senderRole]: isRaised,
                  }));
                  console.info(`Received ${signal.type} from remote ${senderRole}: ${isRaised}`);
                }
                return;
              }

              const pc = peerConnectionRef.current;
              if (!pc) return;

              if (signal.type === "OFFER" && signal.sdp) {
                console.info("Candidate received WebRTC OFFER via STOMP");

                // Wait for local media acquisition if still in progress
                if (!localStreamRef.current && mediaAcquisitionPromiseRef.current) {
                  console.info("Waiting for local media acquisition before creating WebRTC ANSWER...");
                  try {
                    await mediaAcquisitionPromiseRef.current;
                  } catch {
                    // proceed even if media failed so remote media can still be received
                  }
                }

                const pc = peerConnectionRef.current;
                if (!pc) return;

                // Ensure candidate's local tracks are attached before answering
                const currentStream = localStreamRef.current;
                if (currentStream) {
                  const senders = pc.getSenders();
                  currentStream.getTracks().forEach((track) => {
                    const alreadyAdded = senders.some((sender) => sender.track === track);
                    if (!alreadyAdded) {
                      console.info("Candidate attaching local track before answer:", track.kind, track.id);
                      pc.addTrack(track, currentStream);
                    }
                  });
                }

                await pc.setRemoteDescription(
                  new RTCSessionDescription({ type: "offer", sdp: signal.sdp })
                );
                await flushQueuedRemoteCandidates();

                // Re-check senders after setting remote description to ensure tracks pair with transceivers
                if (currentStream) {
                  const senders = pc.getSenders();
                  currentStream.getTracks().forEach((track) => {
                    const alreadyAdded = senders.some((sender) => sender.track === track);
                    if (!alreadyAdded) {
                      console.info("Candidate attaching local track to transceiver:", track.kind, track.id);
                      pc.addTrack(track, currentStream);
                    }
                  });
                }

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                client.publish({
                  destination: `/app/interview/${roomId}/signal`,
                  body: JSON.stringify({
                    roomId,
                    type: "ANSWER",
                    sdp: answer.sdp,
                  }),
                });
                console.info("Candidate sent WebRTC ANSWER via STOMP");
              } else if (signal.type === "ANSWER" && signal.sdp) {
                console.info("Interviewer received WebRTC ANSWER via STOMP");
                if (pc.signalingState === "have-local-offer") {
                  await pc.setRemoteDescription(
                    new RTCSessionDescription({ type: "answer", sdp: signal.sdp })
                  );
                  await flushQueuedRemoteCandidates();
                  console.info("Interviewer set remote description (ANSWER). Signaling stable.");
                } else {
                  console.warn("Ignoring ANSWER received in signalingState:", pc.signalingState);
                }
              } else if (signal.type === "ICE_CANDIDATE" && signal.candidate) {
                await processOrQueueRemoteCandidate({
                  candidate: signal.candidate,
                  sdpMid: signal.sdpMid ?? undefined,
                  sdpMLineIndex: signal.sdpMLineIndex ?? undefined,
                });
              }
            } catch (err) {
              console.error("Error processing WebRTC signal:", err);
            }
          },
        );

        const codeSub = client.subscribe(
          `/topic/interview/${roomId}/code`,
          (message) => {
            try {
              const codeMsg = JSON.parse(message.body) as CodeSyncMessage;
              if (!codeMsg || codeMsg.roomId !== roomId) return;

              const isFromSelf = Boolean(
                codeMsg.senderUserId && currentUserId && codeMsg.senderUserId === currentUserId
              );

              if (isFromSelf) {
                return;
              }

              remoteCodeHandlerRef.current?.(codeMsg);
            } catch (err) {
              console.error("Unable to parse code sync message", err);
            }
          },
        );

        const chatSub = client.subscribe(
          `/topic/interview/${roomId}/chat`,
          (message) => {
            try {
              const chatMsg = JSON.parse(message.body) as InterviewChatMessage;
              if (!chatMsg || chatMsg.roomId !== roomId) return;
              remoteChatHandlerRef.current?.(chatMsg);
            } catch (err) {
              console.error("Unable to parse chat message", err);
            }
          },
        );

        const whiteboardSub = client.subscribe(
          `/topic/interview/${roomId}/whiteboard`,
          (message) => {
            try {
              const wbMsg = JSON.parse(message.body) as InterviewWhiteboardMessage;
              if (!wbMsg || wbMsg.roomId !== roomId) return;
              remoteWhiteboardHandlerRef.current?.(wbMsg);
            } catch (err) {
              console.error("Unable to parse whiteboard message", err);
            }
          },
        );

        const eventsSub = client.subscribe(
          `/topic/interview/${roomId}/events`,
          (message) => {
            try {
              const eventMsg = JSON.parse(message.body) as InterviewEventMessage;
              console.info("Interview room event received:", eventMsg);
              if (eventMsg.event === "INTERVIEW_COMPLETED" || eventMsg.status === "COMPLETED") {
                handleRemoteInterviewCompleted(eventMsg);
              }
            } catch (err) {
              console.error("Unable to parse interview event message", err);
            }
          },
        );

        unsubscribe = () => {
          presenceSub.unsubscribe();
          signalSub.unsubscribe();
          codeSub.unsubscribe();
          chatSub.unsubscribe();
          whiteboardSub.unsubscribe();
          eventsSub.unsubscribe();
        };

        // Flush any queued local ICE candidates that were collected prior to connect
        while (localIceQueueRef.current.length > 0) {
          const c = localIceQueueRef.current.shift();
          if (c) {
            client.publish({
              destination: `/app/interview/${roomId}/signal`,
              body: JSON.stringify({
                roomId,
                type: "ICE_CANDIDATE",
                candidate: c.candidate,
                sdpMid: c.sdpMid,
                sdpMLineIndex: c.sdpMLineIndex,
              }),
            });
          }
        }

        client.publish({
          destination: `/app/interview/${roomId}/join`,
          body: JSON.stringify({}),
        });
      },
      onStompError: (frame) => {
        console.error("Interview presence STOMP error:", frame.headers.message, frame.body);
        if (isActive) {
          setPresenceStatus("STOMP error");
        }
      },
      onWebSocketError: (event) => {
        console.error("Interview presence WebSocket error:", event);
        if (isActive) {
          setPresenceStatus("WebSocket error");
        }
      },
      onWebSocketClose: () => {
        if (isActive) {
          setPresenceStatus("Disconnected");
        }
      },
    });

    client.activate();

    return () => {
      isActive = false;
      unsubscribe?.();
      stompClientRef.current = null;
      remoteCodeHandlerRef.current = null;
      remoteChatHandlerRef.current = null;
      hasCandidateJoinedRef.current = false;
      remoteIceQueueRef.current = [];
      localIceQueueRef.current = [];
      void client.deactivate();
    };
  }, [roomId, roomAuthStatus, isCandidate, currentUserId, currentUserName, interviewRecord]);

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
  const stopScreenShare = async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    setScreenStream(null);
    setScreen(false);

    // Restore camera video track on WebRTC connection
    const pc = peerConnectionRef.current;
    if (pc) {
      const cameraTrack = localStreamRef.current?.getVideoTracks()[0] || null;
      const videoSender = pc.getSenders().find(s => s.track?.kind === "video")
        || pc.getTransceivers().find(t => t.receiver.track?.kind === "video")?.sender;

      if (videoSender) {
        try {
          console.info("Restoring camera track on WebRTC video sender:", cameraTrack ? cameraTrack.id : "null");
          await videoSender.replaceTrack(cameraTrack);
        } catch (err) {
          console.error("Error restoring camera track on WebRTC sender:", err);
        }
      }
    }
  };

  async function toggleScreenShare() {
    if (screen || screenStreamRef.current) {
      await stopScreenShare();
      return;
    }
    try {
      console.info("Requesting display media for screen sharing...");
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const screenTrack = stream.getVideoTracks()[0];

      if (!screenTrack) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      screenStreamRef.current = stream;
      setScreenStream(stream);
      setScreen(true);

      // Handle browser's native "Stop sharing" button
      screenTrack.addEventListener("ended", () => {
        console.info("Screen track ended via browser UI");
        void stopScreenShare();
      });

      // Transmit screen track over WebRTC by replacing outgoing video track
      const pc = peerConnectionRef.current;
      if (pc) {
        const videoSender = pc.getSenders().find(s => s.track?.kind === "video")
          || pc.getTransceivers().find(t => t.receiver.track?.kind === "video")?.sender;

        if (videoSender) {
          console.info("Replacing WebRTC video track with screen track:", screenTrack.id);
          await videoSender.replaceTrack(screenTrack);
        } else {
          console.info("No existing video sender; adding screen track to peer connection");
          pc.addTrack(screenTrack, stream);
        }
      }
    } catch (err) {
      console.warn("Screen share cancelled or failed:", err);
      await stopScreenShare();
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

  if (roomAuthStatus === "verifying") {
    return (
      <div style={{ height: "100dvh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: INTER, gap: 16 }}>
        <Loader2 size={36} color={C.blue} style={{ animation: "spin 1s linear infinite" }} />
        <div style={{ color: C.tp, fontSize: 16, fontWeight: 600 }}>Verifying Room Membership...</div>
        <div style={{ color: C.ts, fontSize: 13 }}>Please wait while we verify your interview assignment.</div>
      </div>
    );
  }

  if (roomAuthStatus !== "authorized") {
    const isCompleted = roomAuthStatus === "completed";
    const isForbidden = roomAuthStatus === "unauthorized";
    const isNotFound = roomAuthStatus === "not_found";
    const title = isCompleted
      ? "Interview Completed"
      : isForbidden
      ? "Access Denied"
      : isNotFound
      ? "Room Not Found"
      : "Unable to Join Room";
    const description = roomAuthError || (
      isCompleted
        ? "This interview session has been ended and is no longer active."
        : isForbidden
        ? "You are not a participant of this interview room."
        : isNotFound
        ? "The interview room does not exist or has already closed."
        : "Failed to verify room membership. Please check your network and try again."
    );

    return (
      <div style={{ height: "100dvh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: INTER, padding: 20 }}>
        <div style={{
          background: C.surface,
          border: `1px solid ${isCompleted ? "rgba(16,185,129,0.3)" : isForbidden ? "rgba(244,63,94,0.3)" : C.border}`,
          borderRadius: 20,
          padding: "36px 32px",
          maxWidth: 440,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: isCompleted ? "rgba(16,185,129,0.12)" : isForbidden ? "rgba(244,63,94,0.12)" : "rgba(245,158,11,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {isCompleted ? (
              <CheckCircle2 size={28} color={C.emerald} />
            ) : (
              <ShieldAlert size={28} color={isForbidden ? C.rose : C.amber} />
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <h2 style={{ color: C.tp, fontSize: 20, fontWeight: 700 }}>{title}</h2>
            <p style={{ color: C.ts, fontSize: 13, lineHeight: 1.5 }}>{description}</p>
          </div>
          {isCompleted && (hasAlreadyScored || submittedScore != null) && (
            <div
              style={{
                background: "rgba(16,185,129,0.12)",
                border: "1px solid rgba(16,185,129,0.3)",
                borderRadius: 12,
                padding: "8px 16px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <CheckCircle2 size={16} color={C.emerald} />
              <span style={{ color: C.tp, fontSize: 13, fontWeight: 600 }}>
                Score Submitted: {submittedScore ?? alreadySubmittedScore}/100
              </span>
            </div>
          )}

          {isCompleted && !hasAlreadyScored && submittedScore == null && (
            <button
              onClick={() => setScoreModalOpen(true)}
              style={{
                marginTop: 4,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                borderRadius: 10,
                border: "none",
                background: C.emerald,
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              <Star size={15} />
              {isCandidate ? "Rate the Interviewer" : "Rate the Candidate"}
            </button>
          )}

          <button
            onClick={() => navigate(isCandidate ? "/candidate" : "/interviewer")}
            style={{
              marginTop: 8,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 10,
              border: "none",
              background: C.blue,
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            <LogOut size={15} />
            Return to Dashboard
          </button>
        </div>

        <ScoreModalDialog
          open={scoreModalOpen}
          onClose={() => setScoreModalOpen(false)}
          isInterviewer={isInterviewer}
          isCandidate={isCandidate}
          hasAlreadyScored={hasAlreadyScored}
          submittedScore={submittedScore}
          alreadySubmittedScore={alreadySubmittedScore}
          scoreInput={scoreInput}
          onScoreInputChange={(val) => {
            setScoreInput(val);
            setScoreValidationError(null);
            setScoreSubmitError(null);
          }}
          scoreValidationError={scoreValidationError}
          scoreSubmitError={scoreSubmitError}
          isSubmittingScore={isSubmittingScore}
          onSubmit={handleScoreSubmit}
          onNavigateDashboard={() => navigate(isCandidate ? "/candidate" : "/interviewer")}
        />
      </div>
    );
  }

  const effectiveRole = roomRole ? roomRole.toLowerCase() : (globalRole || "candidate");

  return (
    <>
      <style>{`
        @keyframes waveBar { from{transform:scaleY(0.4)} to{transform:scaleY(1)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
        ::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.2)}
      `}</style>

      <div ref={containerRef} data-room-id={roomId} style={{ height: "100dvh", background: C.bg, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: INTER }}>
        <Navbar
          timer={timer}
          onFinishInterview={handleFinishInterview}
          isInterviewer={isInterviewer}
          isFinishing={isFinishing}
          participants={participantsList}
        />

        {/* Real-time Completion Notification Modal for Candidate */}
        {completionNotice?.show && (
          <div style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            background: "rgba(15,23,42,0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            fontFamily: INTER,
          }}>
            <div style={{
              background: C.surface,
              border: `1px solid rgba(16,185,129,0.35)`,
              borderRadius: 20,
              padding: "36px 32px",
              maxWidth: 440,
              width: "100%",
              textAlign: "center",
              boxShadow: "0 25px 70px rgba(0,0,0,0.6)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "rgba(16,185,129,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <CheckCircle2 size={30} color={C.emerald} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <h2 style={{ color: C.tp, fontSize: 20, fontWeight: 700 }}>
                  {completionNotice.title}
                </h2>
                <p style={{ color: C.ts, fontSize: 13, lineHeight: 1.6 }}>
                  {completionNotice.message}
                </p>
              </div>
              <button
                onClick={() => navigate("/candidate")}
                style={{
                  marginTop: 8,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 22px",
                  borderRadius: 10,
                  border: "none",
                  background: C.blue,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                <LogOut size={15} />
                Return to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Post-Interview Mutual Scoring Modal */}
        <ScoreModalDialog
          open={scoreModalOpen}
          onClose={() => setScoreModalOpen(false)}
          isInterviewer={isInterviewer}
          isCandidate={isCandidate}
          hasAlreadyScored={hasAlreadyScored}
          submittedScore={submittedScore}
          alreadySubmittedScore={alreadySubmittedScore}
          scoreInput={scoreInput}
          onScoreInputChange={(val) => {
            setScoreInput(val);
            setScoreValidationError(null);
            setScoreSubmitError(null);
          }}
          scoreValidationError={scoreValidationError}
          scoreSubmitError={scoreSubmitError}
          isSubmittingScore={isSubmittingScore}
          onSubmit={handleScoreSubmit}
          onNavigateDashboard={() => navigate(isCandidate ? "/candidate" : "/interviewer")}
        />

        {finishError && (
          <div style={{
            position: "absolute",
            top: 56,
            right: 16,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(244,63,94,0.15)",
            border: "1px solid rgba(244,63,94,0.4)",
            borderRadius: 10,
            padding: "8px 14px",
            backdropFilter: "blur(12px)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
            color: C.tp,
            fontSize: 12,
            fontFamily: INTER,
          }}>
            <ShieldAlert size={16} color={C.rose} />
            <span>{finishError}</span>
            <button
              onClick={() => setFinishError(null)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: C.ts,
                padding: 0,
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Body */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden", padding: "62px 10px 10px 10px", gap: 10 }}>

          {/* ── Left 65% ── */}
          <div style={{ flex: "0 0 65%", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
            <VideoPanel
              mic={mic} cam={cam} screen={screen} handRaised={handRaised} blurred={blurred}
              showParticipants={showParticipants} whiteboardActive={whiteboardActive}
              onMic={toggleMic} onCam={toggleCam}
              onScreen={toggleScreenShare}
              onHand={handleToggleHand}
              onBlur={() => setBlurred(!blurred)}
              onFullscreen={toggleFullscreen}
              onParticipants={() => setShowParticipants(!showParticipants)}
              onWhiteboard={() => setWhiteboardActive(!whiteboardActive)}
              screenStream={screenStream}
              localStream={localStream}
              remoteStream={remoteStream}
              mediaError={mediaError}
              isCandidate={isCandidate}
              userName={currentUserName}
              onLeave={handleLeave}
              raisedHands={raisedHands}
              onSpeakingChange={setSpeakingStates}
              participants={participantsList}
            />
            {showParticipants && (
              <ParticipantsSidebar
                onClose={() => setShowParticipants(false)}
                participants={participantsList}
              />
            )}
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
              <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
                <div style={{ display: !whiteboardActive && rightTab === "code" ? "block" : "none", height: "100%", width: "100%" }}>
                  <CodeEditor
                    roomId={roomId}
                    stompClientRef={stompClientRef}
                    onRegisterRemoteCodeHandler={handleRegisterRemoteCode}
                    currentUserId={currentUserId}
                    userRole={effectiveRole}
                    isExecuting={isExecuting}
                    onRunCode={handleRunCode}
                  />
                </div>
                <div style={{ display: !whiteboardActive && rightTab === "chat" ? "block" : "none", height: "100%", width: "100%" }}>
                  <ChatPanel
                    roomId={roomId}
                    stompClientRef={stompClientRef}
                    isCandidate={isCandidate}
                    userRole={effectiveRole}
                    currentUserId={currentUserId}
                    currentUserName={currentUserName}
                    isConnected={presenceStatus === "Connected"}
                    onRegisterRemoteChatHandler={handleRegisterRemoteChat}
                  />
                </div>
                <div style={{ display: whiteboardActive ? "block" : "none", height: "100%", width: "100%" }}>
                  <Whiteboard
                    onClose={() => setWhiteboardActive(false)}
                    roomId={roomId}
                    stompClientRef={stompClientRef}
                    onRegisterRemoteWhiteboardHandler={handleRegisterRemoteWhiteboard}
                    currentUserId={currentUserId}
                    userRole={effectiveRole}
                  />
                </div>
              </div>
            </GlassCard>

            {/* Console — hidden when whiteboard active */}
            {consoleVisible && !whiteboardActive && (
              <GlassCard style={{ flex: "0 0 calc(46% - 10px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <ConsolePanel
                  executionResult={executionResult}
                  isExecuting={isExecuting}
                />
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
