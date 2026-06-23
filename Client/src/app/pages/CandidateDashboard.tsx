import { useState } from "react";
import { useNavigate } from "react-router";
import {
  LayoutDashboard, BookOpen, Bot, Video, User,
  Clock, CheckCircle, TrendingUp, ChevronRight,
  Play, Lock, Star, Mic, Code2, MessageSquare,
  Users, Calendar, BarChart2, Zap, Edit3,
  Brain, Target, Lightbulb, AlertCircle, Camera,
  Mail, MapPin, Briefcase, Plus, X, Save,
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { DashboardLayout } from "../components/DashboardLayout";



const navItems = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "practice", label: "Practice Questions", icon: <BookOpen className="w-4 h-4" /> },
  { id: "mock", label: "AI Mock Interview", icon: <Bot className="w-4 h-4" /> },
  { id: "rooms", label: "My Rooms", icon: <Video className="w-4 h-4" /> },
  { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
];

const skillData = [
  { skill: "Confidence", score: 72 },
  { skill: "Technical", score: 58 },
  { skill: "Readiness", score: 84 },
  { skill: "Problemsolving", score: 90 },
  { skill: "Communication", score: 78 },
];

const progressData = [
  { week: "Mock 1", score: 54 },
  { week: "Mock 2", score: 61 },
  { week: "Mock 3", score: 67 },
  { week: "Mock 4", score: 63 },
  { week: "Mock 5", score: 74 },
  { week: "Mock 6", score: 81 },
  { week: "Mock 7", score: 79 },
  { week: "Mock 8", score: 88 },
];

const practiceQuestions = [
  { id: 1, title: "Two Sum", difficulty: "Easy", topic: "Arrays", done: true, time: "12m" },
  { id: 2, title: "LRU Cache", difficulty: "Medium", topic: "Design", done: true, time: "28m" },
  { id: 3, title: "Merge K Sorted Lists", difficulty: "Hard", topic: "Linked Lists", done: false, time: null },
  { id: 4, title: "Design Twitter", difficulty: "Hard", topic: "System Design", done: false, time: null },
  { id: 5, title: "Valid Parentheses", difficulty: "Easy", topic: "Stacks", done: true, time: "8m" },
  { id: 6, title: "Word Search II", difficulty: "Hard", topic: "Backtracking", done: false, time: null },
  { id: 7, title: "Binary Tree Level Order", difficulty: "Medium", topic: "Trees", done: false, time: null },
  { id: 8, title: "Coin Change", difficulty: "Medium", topic: "DP", done: true, time: "21m" },
];

const mockSessions = [
  { id: 1, type: "Technical Round", duration: "45 min", topics: ["Arrays", "Trees", "DP"], score: 82, date: "Jun 12, 2026", status: "completed" },
  { id: 2, type: "Behavioral Round", duration: "30 min", topics: ["Leadership", "Conflict", "Goals"], score: 76, date: "Jun 10, 2026", status: "completed" },
  { id: 3, type: "System Design", duration: "60 min", topics: ["Scalability", "DB", "API"], score: null, date: "Jun 16, 2026", status: "scheduled" },
];

const lastMockScores = {
  session: "Technical Round — Jun 12, 2026",
  overall: 82,
  technical: 78,
  readiness: 81,
  confidence: 74,
  communication: 85,
  problemSolving: 80,
  strengths: [
    "Clearly articulated time and space complexity for every solution",
    "Strong communication — broke down thought process step by step",
    "Handled edge cases proactively without being prompted",
    "Efficient use of hints — maintained momentum throughout",
  ],
  weaknesses: [
    "Struggled to pivot when initial approach hit a dead end (System Design Q2)",
    "Confidence dipped during backtracking problems — hesitated before committing",
    "Missed opportunity to discuss trade-offs on the DP solution",
  ],
};

const rooms = [
  { id: "R-4821", title: "Google L5 — Technical", host: "Sarah (Interviewer)", date: "Jun 16, 2026 · 3:00 PM", status: "upcoming", duration: "60 min" },
  { id: "R-3390", title: "AI Mock — System Design", host: "InterviewAI Bot", date: "Jun 12, 2026 · 11:00 AM", status: "completed", duration: "55 min" },
  { id: "R-2711", title: "Behavioral Practice", host: "InterviewAI Bot", date: "Jun 10, 2026 · 2:00 PM", status: "completed", duration: "32 min" },
  { id: "R-5103", title: "Stripe SDE2 — Technical", host: "Marcus (Interviewer)", date: "Jun 20, 2026 · 4:30 PM", status: "upcoming", duration: "60 min" },
];

const diffColor: Record<string, string> = {
  Easy: "text-emerald-600 bg-emerald-50 border-emerald-200",
  Medium: "text-amber-600 bg-amber-50 border-amber-200",
  Hard: "text-rose-600 bg-rose-50 border-rose-200",
};

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-[#0d1b2a]" style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.35rem" }}>
        {title}
      </h2>
      {subtitle && <p className="text-[#4a6080] text-sm mt-1">{subtitle}</p>}
    </div>
  );
}

function StatCard({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 border ${accent ? "bg-[#00bfa6] border-[#00bfa6]" : "bg-white border-[#0d1b2a]/8"}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${accent ? "bg-white/20" : "bg-[#0d1b2a]/6"}`}>
        <span className={accent ? "text-[#0d1b2a]" : "text-[#00bfa6]"}>{icon}</span>
      </div>
      <div className={`text-2xl mb-0.5 ${accent ? "text-[#0d1b2a]" : "text-[#0d1b2a]"}`} style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700 }}>
        {value}
      </div>
      <div className={`text-sm ${accent ? "text-[#0d1b2a]/70" : "text-[#4a6080]"}`}>{label}</div>
      {sub && <div className={`text-xs mt-1 ${accent ? "text-[#0d1b2a]/50" : "text-[#00bfa6]"}`}>{sub}</div>}
    </div>
  );
}

/* ── Score ring ── */
function ScoreRing({ score, label, color, size = "md" }: { score: number; label: string; color: string; size?: "sm" | "md" | "lg" }) {
  const r = size === "lg" ? 44 : size === "md" ? 30 : 22;
  const stroke = size === "lg" ? 7 : 5;
  const circumference = 2 * Math.PI * r;
  const filled = (score / 100) * circumference;
  const dim = (r + stroke + 4) * 2;
  const textSize = size === "lg" ? "1.6rem" : size === "md" ? "0.9rem" : "0.75rem";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={dim} height={dim} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke="#dde6ef" strokeWidth={stroke} />
        <circle
          cx={dim / 2} cy={dim / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${filled} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <div style={{ marginTop: -(dim / 2 + 14), position: "relative", zIndex: 1, transform: "rotate(0deg)", textAlign: "center", lineHeight: 1 }}>
        <p style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: textSize, color: "#0d1b2a" }}>{score}</p>
      </div>
      <p className="text-[#4a6080] text-center leading-tight" style={{ fontSize: size === "lg" ? "0.8rem" : "0.7rem", fontWeight: 500, maxWidth: 70, marginTop: dim / 2 - 6 }}>
        {label}
      </p>
    </div>
  );
}

/* ── Score bar ── */
function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[#0d1b2a] text-sm" style={{ fontWeight: 500 }}>{label}</span>
        <span className="text-sm" style={{ fontWeight: 700, color }}>{score}<span className="text-[#4a6080] font-normal text-xs">/100</span></span>
      </div>
      <div className="h-2 bg-[#dde6ef] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
    </div>
  );
}

/* ── Sections ── */

function DashboardSection() {
  return (
    <div>
      <SectionHeader title="Your Dashboard" subtitle="Improved performance this month." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<CheckCircle className="w-4.5 h-4.5" />} label="Questions Solved" value="124" sub="+12 this week" />
        <StatCard icon={<BarChart2 className="w-4.5 h-4.5" />} label="Readiness Score" value="88" sub="↑ 7 pts" accent />
        <StatCard icon={<Clock className="w-4.5 h-4.5" />} label="Practice Hours" value="34h" sub="Last 30 days" />
        <StatCard icon={<Star className="w-4.5 h-4.5" />} label="Mock Sessions" value="9" sub="Last 30 days" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
          <p className="text-[#0d1b2a] text-sm mb-4" style={{ fontWeight: 600 }}>Readiness Score — 8 Weeks</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={progressData}>
              <defs>
                <linearGradient id="cand-score-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00bfa6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#00bfa6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#4a6080" }} axisLine={false} tickLine={false} />
              <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: "#4a6080" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #dde6ef", fontSize: 12 }} />
              <Area type="monotone" dataKey="score" stroke="#00bfa6" strokeWidth={2.5} fill="url(#cand-score-grad)" dot={{ r: 3, fill: "#00bfa6" }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
          <p className="text-[#0d1b2a] text-sm mb-2" style={{ fontWeight: 600 }}>Skill Breakdown</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={skillData}>
              <PolarGrid stroke="#dde6ef" />
              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: "#4a6080" }} />
              <Radar dataKey="score" stroke="#00bfa6" fill="#00bfa6" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-4 bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
        <p className="text-[#0d1b2a] text-sm mb-4" style={{ fontWeight: 600 }}>Recent & Upcoming Mock Sessions</p>
        <div className="space-y-3">
          {mockSessions.map((s) => (
            <div key={s.id} className="flex items-center gap-4 p-3.5 rounded-xl bg-[#f0f4f8] hover:bg-[#e8f0f7] transition-colors">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.status === "completed" ? "bg-[#00bfa6]/15" : "bg-[#0d1b2a]/8"}`}>
                {s.status === "completed" ? <CheckCircle className="w-4 h-4 text-[#00bfa6]" /> : <Calendar className="w-4 h-4 text-[#4a6080]" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#0d1b2a] text-sm" style={{ fontWeight: 500 }}>{s.type}</p>
                <p className="text-[#4a6080] text-xs">{s.date} · {s.duration}</p>
              </div>
              {s.score !== null
                ? <span className="text-[#00bfa6] text-sm" style={{ fontWeight: 700 }}>{s.score}/100</span>
                : <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full" style={{ fontWeight: 500 }}>Scheduled</span>
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PracticeSection() {
  const [filter, setFilter] = useState<"All" | "Easy" | "Medium" | "Hard">("All");
  const filtered = filter === "All" ? practiceQuestions : practiceQuestions.filter((q) => q.difficulty === filter);
  const navigate = useNavigate();
  return (
    <div>
      <SectionHeader title="Practice Questions" subtitle="Curated by role and difficulty. Solve daily to boost your score." />
      <div className="flex gap-2 mb-5">
        {(["All", "Easy", "Medium", "Hard"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm border transition-all ${
              filter === f ? "bg-[#0d1b2a] text-white border-[#0d1b2a]" : "bg-white text-[#4a6080] border-[#0d1b2a]/12 hover:border-[#0d1b2a]/25"
            }`}
            style={{ fontWeight: filter === f ? 600 : 400 }}
          >
            {f}
          </button>
        ))}
        <div className="ml-auto text-[#4a6080] text-sm flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-[#00bfa6]" />
          {practiceQuestions.filter((q) => q.done).length}/{practiceQuestions.length} completed
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 overflow-hidden">
        {filtered.map((q, i) => (
          <div
            key={q.id}
            className={`flex items-center gap-4 px-5 py-4 hover:bg-[#f0f4f8] transition-colors cursor-pointer ${i > 0 ? "border-t border-[#0d1b2a]/6" : ""}`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${q.done ? "bg-[#00bfa6]/15" : "bg-[#0d1b2a]/5"}`}>
              {q.done ? <CheckCircle className="w-3.5 h-3.5 text-[#00bfa6]" /> : <div className="w-2 h-2 rounded-full bg-[#0d1b2a]/20" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${q.done ? "text-[#4a6080] line-through" : "text-[#0d1b2a]"}`} style={{ fontWeight: q.done ? 400 : 500 }}>
                {q.title}
              </p>
              <p className="text-[#4a6080] text-xs mt-0.5">{q.topic}</p>
            </div>
            <span className={`text-xs px-2.5 py-0.5 rounded-full border ${diffColor[q.difficulty]}`} style={{ fontWeight: 500 }}>
              {q.difficulty}
            </span>
            {q.time
              ? <span className="text-[#4a6080] text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{q.time}</span>
              : <button onClick={() => navigate("/CodeEditor")} className="text-[#00bfa6] text-xs flex items-center gap-1 hover:underline"><Play className="w-3 h-3" />Solve</button>
            }
          </div>
        ))}
      </div>
    </div>
  );
}

function MockSection() {
  const s = lastMockScores;

  const scoreMetrics = [
    { label: "Technical", score: s.technical, color: "#0d1b2a", icon: <Code2 className="w-4 h-4" /> },
    { label: "Readiness", score: s.readiness, color: "#00bfa6", icon: <Target className="w-4 h-4" /> },
    { label: "Confidence", score: s.confidence, color: "#7c5cbf", icon: <Brain className="w-4 h-4" /> },
    { label: "Communication", score: s.communication, color: "#2196f3", icon: <MessageSquare className="w-4 h-4" /> },
    { label: "Problem-Solving", score: s.problemSolving, color: "#f59e0b", icon: <Lightbulb className="w-4 h-4" /> },
  ];

  const types = [
    { icon: <Code2 className="w-5 h-5" />, title: "Technical Round", desc: "DSA, system design, and coding challenges with real-time code execution.", duration: "45 min", locked: false },
    { icon: <MessageSquare className="w-5 h-5" />, title: "Behavioral Round", desc: "STAR-method questions evaluated by AI for structure and impact.", duration: "30 min", locked: false },
    { icon: <Zap className="w-5 h-5" />, title: "System Design", desc: "Design scalable systems. AI whiteboard + feedback on your architecture.", duration: "60 min", locked: false },
    { icon: <Mic className="w-5 h-5" />, title: "Full Loop Simulation", desc: "Back-to-back rounds mimicking a real 4-hour interview loop.", duration: "3.5 hrs", locked: true },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader title="AI Mock Interview" subtitle="Practice with our AI interviewer. Get scored on clarity, depth, and speed." />

      {/* ── Last Session Results ── */}
      <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#0d1b2a]/8 bg-[#0d1b2a]">
          <div>
            <p className="text-white text-sm" style={{ fontWeight: 600 }}>Last Mock Session Results</p>
            <p className="text-white/50 text-xs mt-0.5">{s.session}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#00bfa6] text-2xl" style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700 }}>{s.overall}</span>
            <span className="text-white/40 text-sm">/100 overall</span>
          </div>
        </div>

        <div className="p-6">
          {/* Score rings row */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            {scoreMetrics.map(({ label, score, color, icon }) => (
              <div key={label} className="bg-[#f8fafc] rounded-xl border border-[#0d1b2a]/6 p-4 flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                  <span style={{ color }}>{icon}</span>
                </div>
                {/* Score arc */}
                <div className="relative flex items-center justify-center" style={{ width: 56, height: 56 }}>
                  <svg width={56} height={56} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
                    <circle cx={28} cy={28} r={22} fill="none" stroke="#dde6ef" strokeWidth={5} />
                    <circle
                      cx={28} cy={28} r={22}
                      fill="none"
                      stroke={color}
                      strokeWidth={5}
                      strokeDasharray={`${(score / 100) * (2 * Math.PI * 22)} ${2 * Math.PI * 22}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "0.9rem", color: "#0d1b2a", position: "relative", zIndex: 1 }}>
                    {score}
                  </span>
                </div>
                <p className="text-[#4a6080] text-xs text-center leading-tight" style={{ fontWeight: 500 }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Score bars */}
          <div className="space-y-3 mb-6">
            {scoreMetrics.map(({ label, score, color }) => (
              <ScoreBar key={label} label={label} score={score} color={color} />
            ))}
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="bg-emerald-50 border border-emerald-200/70 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <p className="text-emerald-800 text-sm" style={{ fontWeight: 600 }}>Strengths</p>
              </div>
              <ul className="space-y-2">
                {s.strengths.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-emerald-700 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="bg-rose-50 border border-rose-200/70 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                </div>
                <p className="text-rose-800 text-sm" style={{ fontWeight: 600 }}>Areas to Improve</p>
              </div>
              <ul className="space-y-2">
                {s.weaknesses.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-rose-700 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Past sessions */}
      <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
        <p className="text-[#0d1b2a] text-sm mb-4" style={{ fontWeight: 600 }}>Past Sessions</p>
        <div className="space-y-3">
          {mockSessions.filter((s) => s.status === "completed").map((s) => (
            <div key={s.id} className="flex items-center gap-4 p-3.5 rounded-xl bg-[#f0f4f8]">
              <div className="w-9 h-9 rounded-xl bg-[#00bfa6]/15 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-[#00bfa6]" />
              </div>
              <div className="flex-1">
                <p className="text-[#0d1b2a] text-sm" style={{ fontWeight: 500 }}>{s.type}</p>
                <p className="text-[#4a6080] text-xs">{s.date} · {s.duration}</p>
              </div>
              <div className="text-right">
                <p className="text-[#00bfa6] text-sm" style={{ fontWeight: 700 }}>{s.score}/100</p>
                <button className="text-[#4a6080] text-xs hover:text-[#0d1b2a] flex items-center gap-1 mt-0.5">Review <ChevronRight className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RoomsSection() {
  return (
    <div>
      <SectionHeader title="My Rooms" subtitle="All your scheduled and completed interview sessions." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rooms.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-5 hover:border-[#00bfa6]/30 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#0d1b2a]/6 flex items-center justify-center">
                <Video className="w-4.5 h-4.5 text-[#0d1b2a]" />
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full border ${r.status === "upcoming" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`} style={{ fontWeight: 500 }}>
                {r.status === "upcoming" ? "Upcoming" : "Completed"}
              </span>
            </div>
            <h3 className="text-[#0d1b2a] mb-1" style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 600, fontSize: "0.95rem" }}>{r.title}</h3>
            <p className="text-[#4a6080] text-xs mb-3">{r.host}</p>
            <div className="flex items-center justify-between text-xs text-[#4a6080]">
              <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />{r.date}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{r.duration}</span>
            </div>
            <div className="mt-3 pt-3 border-t border-[#0d1b2a]/6 flex items-center justify-between">
              <span className="text-[#4a6080] text-xs font-mono bg-[#f0f4f8] px-2 py-0.5 rounded">{r.id}</span>
              {r.status === "upcoming"
                ? <button className="bg-[#00bfa6] text-[#0d1b2a] text-xs px-4 py-1.5 rounded-lg hover:bg-[#00d4b8] transition-colors" style={{ fontWeight: 600 }}>Join Room</button>
                : <button className="text-[#4a6080] text-xs hover:text-[#0d1b2a] flex items-center gap-1">View replay <ChevronRight className="w-3 h-3" /></button>
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileSection({ onEdit }: { onEdit: () => void }) {
  const skills = ["React", "TypeScript", "Node.js", "Python", "System Design", "SQL"];
  return (
    <div>
      <SectionHeader title="Profile" subtitle="Your candidate profile visible to interviewers." />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-7 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-full bg-[#00bfa6] flex items-center justify-center text-[#0d1b2a] text-2xl" style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700 }}>
              AM
            </div>
          </div>
          <h3 className="text-[#0d1b2a] mb-0.5" style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.1rem" }}>Arjun Mehta</h3>
          <p className="text-[#4a6080] text-sm mb-1">arjun.mehta@email.com</p>
          <p className="text-[#4a6080] text-xs mb-4">Frontend Engineer · Bangalore, India</p>
          <div className="flex gap-1.5 flex-wrap justify-center mb-5">
            {skills.map((s) => (
              <span key={s} className="text-xs bg-[#f0f4f8] text-[#4a6080] border border-[#0d1b2a]/8 px-2.5 py-1 rounded-full">{s}</span>
            ))}
          </div>
          <div className="w-full border-t border-[#0d1b2a]/8 pt-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              {[{ v: "88", l: "Score" }, { v: "9", l: "Mocks" }, { v: "124", l: "Solved" }].map(({ v, l }) => (
                <div key={l}>
                  <p className="text-[#0d1b2a] text-lg" style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700 }}>{v}</p>
                  <p className="text-[#4a6080] text-xs">{l}</p>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={onEdit}
            className="mt-5 w-full flex items-center justify-center gap-2 bg-[#0d1b2a] text-white text-sm py-2.5 rounded-xl hover:bg-[#1a2f45] transition-colors"
            style={{ fontWeight: 600 }}
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Profile
          </button>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
            <p className="text-[#0d1b2a] text-sm mb-3" style={{ fontWeight: 600 }}>About</p>
            <p className="text-[#4a6080] text-sm leading-relaxed">
              3 years of experience building scalable React applications. Passionate about performance optimization and clean architecture. Currently preparing for senior engineering roles at top-tier tech companies.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
            <p className="text-[#0d1b2a] text-sm mb-4" style={{ fontWeight: 600 }}>Target Roles & Companies</p>
            <div className="flex flex-wrap gap-2">
              {["Senior Frontend Engineer", "Staff Engineer", "Google", "Stripe", "Shopify", "Notion"].map((t) => (
                <span key={t} className="text-xs bg-[#00bfa6]/10 text-[#00bfa6] border border-[#00bfa6]/20 px-3 py-1 rounded-full" style={{ fontWeight: 500 }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
            <p className="text-[#0d1b2a] text-sm mb-4" style={{ fontWeight: 600 }}>Experience</p>
            <div className="space-y-3">
              {[
                { role: "Frontend Engineer", company: "Razorpay", period: "2022 – Present" },
                { role: "Software Engineer Intern", company: "Flipkart", period: "2021 – 2022" },
              ].map(({ role, company, period }) => (
                <div key={role} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0d1b2a]/6 flex items-center justify-center">
                    <Users className="w-3.5 h-3.5 text-[#4a6080]" />
                  </div>
                  <div>
                    <p className="text-[#0d1b2a] text-sm" style={{ fontWeight: 500 }}>{role} · {company}</p>
                    <p className="text-[#4a6080] text-xs">{period}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditProfileSection({ onBack }: { onBack: () => void }) {
  const [skills, setSkills] = useState(["React", "TypeScript", "Node.js", "Python", "System Design", "SQL"]);
  const [targets, setTargets] = useState(["Senior Frontend Engineer", "Staff Engineer", "Google", "Stripe", "Shopify", "Notion"]);
  const [newSkill, setNewSkill] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [form, setForm] = useState({
    name: "Arjun Mehta",
    email: "arjun.mehta@email.com",
    title: "Frontend Engineer",
    location: "Bangalore, India",
    about: "3 years of experience building scalable React applications. Passionate about performance optimization and clean architecture. Currently preparing for senior engineering roles at top-tier tech companies.",
    linkedin: "linkedin.com/in/arjunmehta",
    github: "github.com/arjunmehta",
    phone: "+91 98765 43210",
  });

  const inputCls = "w-full bg-[#f0f4f8] border border-[#0d1b2a]/10 rounded-xl px-4 py-3 text-[#0d1b2a] placeholder-[#4a6080]/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#00bfa6]/30 focus:border-[#00bfa6]/60 transition-all";

  function addSkill() {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  }
  function addTarget() {
    if (newTarget.trim() && !targets.includes(newTarget.trim())) {
      setTargets([...targets, newTarget.trim()]);
      setNewTarget("");
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-8 h-8 rounded-lg bg-white border border-[#0d1b2a]/10 flex items-center justify-center text-[#4a6080] hover:text-[#0d1b2a] transition-colors">
          ←
        </button>
        <div>
          <h2 className="text-[#0d1b2a]" style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.35rem" }}>Edit Profile</h2>
          <p className="text-[#4a6080] text-sm">Update your candidate profile details.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar card */}
        <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-7 flex flex-col items-center text-center h-fit">
          <div className="relative mb-5">
            <div className="w-24 h-24 rounded-full bg-[#00bfa6] flex items-center justify-center text-[#0d1b2a] text-3xl" style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700 }}>
              AM
            </div>
            <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#0d1b2a] flex items-center justify-center shadow-lg hover:bg-[#1a2f45] transition-colors">
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <p className="text-[#0d1b2a] text-sm mb-1" style={{ fontWeight: 600 }}>Profile Photo</p>
          <p className="text-[#4a6080] text-xs mb-4">JPG, PNG or GIF · Max 4MB</p>
          <button className="w-full border border-[#0d1b2a]/15 text-[#0d1b2a] text-sm py-2 rounded-xl hover:bg-[#f0f4f8] transition-colors" style={{ fontWeight: 500 }}>
            Upload Photo
          </button>
          <button className="mt-2 w-full text-rose-500 text-sm py-2 rounded-xl hover:bg-rose-50 transition-colors" style={{ fontWeight: 500 }}>
            Remove Photo
          </button>
        </div>

        {/* Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Basic info */}
          <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
            <p className="text-[#0d1b2a] text-sm mb-4" style={{ fontWeight: 600 }}>Basic Information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#0d1b2a] text-xs mb-1.5" style={{ fontWeight: 500 }}>Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4a6080]" />
                  <input className={`${inputCls} pl-10`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-[#0d1b2a] text-xs mb-1.5" style={{ fontWeight: 500 }}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4a6080]" />
                  <input type="email" className={`${inputCls} pl-10`} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-[#0d1b2a] text-xs mb-1.5" style={{ fontWeight: 500 }}>Job Title</label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4a6080]" />
                  <input className={`${inputCls} pl-10`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-[#0d1b2a] text-xs mb-1.5" style={{ fontWeight: 500 }}>Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4a6080]" />
                  <input className={`${inputCls} pl-10`} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                </div>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
            <label className="block text-[#0d1b2a] text-sm mb-3" style={{ fontWeight: 600 }}>About / Bio</label>
            <textarea
              className={`${inputCls} resize-none h-28`}
              value={form.about}
              onChange={(e) => setForm({ ...form, about: e.target.value })}
            />
            <p className="text-[#4a6080] text-xs mt-1.5">{form.about.length}/400 characters</p>
          </div>

          {/* Skills */}
          <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
            <p className="text-[#0d1b2a] text-sm mb-3" style={{ fontWeight: 600 }}>Skills</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {skills.map((s) => (
                <span key={s} className="flex items-center gap-1.5 text-xs bg-[#00bfa6]/10 text-[#00bfa6] border border-[#00bfa6]/20 px-2.5 py-1 rounded-full" style={{ fontWeight: 500 }}>
                  {s}
                  <button onClick={() => setSkills(skills.filter((sk) => sk !== s))} className="hover:text-rose-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className={`${inputCls} flex-1`}
                placeholder="Add a skill…"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSkill()}
              />
              <button onClick={addSkill} className="bg-[#0d1b2a] text-white px-4 rounded-xl hover:bg-[#1a2f45] transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Target roles */}
          <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
            <p className="text-[#0d1b2a] text-sm mb-3" style={{ fontWeight: 600 }}>Target Roles & Companies</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {targets.map((t) => (
                <span key={t} className="flex items-center gap-1.5 text-xs bg-[#f0f4f8] text-[#4a6080] border border-[#0d1b2a]/8 px-2.5 py-1 rounded-full">
                  {t}
                  <button onClick={() => setTargets(targets.filter((tg) => tg !== t))} className="hover:text-rose-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className={`${inputCls} flex-1`}
                placeholder="Add role or company…"
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTarget()}
              />
              <button onClick={addTarget} className="bg-[#0d1b2a] text-white px-4 rounded-xl hover:bg-[#1a2f45] transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Social links */}
          <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
            <p className="text-[#0d1b2a] text-sm mb-4" style={{ fontWeight: 600 }}>Links & Contact</p>
            <div className="space-y-3">
              {[
                { label: "LinkedIn", key: "linkedin" as const },
                { label: "GitHub", key: "github" as const },
                { label: "Phone", key: "phone" as const },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-[#0d1b2a] text-xs mb-1.5" style={{ fontWeight: 500 }}>{label}</label>
                  <input className={inputCls} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                </div>
              ))}
            </div>
          </div>

          {/* Save / Cancel */}
          <div className="flex items-center justify-end gap-3 pb-2">
            <button
              onClick={onBack}
              className="px-6 py-2.5 border border-[#0d1b2a]/15 text-[#4a6080] text-sm rounded-xl hover:text-[#0d1b2a] hover:bg-[#f0f4f8] transition-colors"
              style={{ fontWeight: 500 }}
            >
              Cancel
            </button>
            <button
              onClick={onBack}
              className="flex items-center gap-2 bg-[#00bfa6] text-[#0d1b2a] text-sm px-6 py-2.5 rounded-xl hover:bg-[#00d4b8] transition-colors"
              style={{ fontWeight: 600 }}
            >
              <Save className="w-3.5 h-3.5" /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CandidateDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");

  const sections: Record<string, React.ReactNode> = {
    dashboard: <DashboardSection />,
    practice: <PracticeSection />,
    mock: <MockSection />,
    rooms: <RoomsSection />,
    profile: <ProfileSection onEdit={() => setActiveSection("edit-profile")} />,
    "edit-profile": <EditProfileSection onBack={() => setActiveSection("profile")} />,
  };

  return (
    <DashboardLayout
      role="candidate"
      navItems={navItems}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      userName="Arjun Mehta"
      userInitials="AM"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[#0d1b2a] leading-tight" style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.55rem" }}>
            Welcome back, Arjun 👋
          </h1>
          <p className="text-[#4a6080] text-sm mt-0.5">Start your journey with us.</p>
        </div>
        <button
          onClick={() => setActiveSection("mock")}
          className="hidden sm:flex items-center gap-2 bg-[#00bfa6] text-[#0d1b2a] px-5 py-2.5 rounded-xl hover:bg-[#00d4b8] transition-colors"
          style={{ fontWeight: 600, fontSize: "0.875rem" }}
        >
          <Play className="w-3.5 h-3.5" /> Start Mock
        </button>
      </div>

      {sections[activeSection]}
    </DashboardLayout>
  );
}
