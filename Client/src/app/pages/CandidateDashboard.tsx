import { useState } from "react";
import {
  LayoutDashboard, BookOpen, Bot, Video, User,
  Clock, CheckCircle, TrendingUp, ChevronRight,
  Play, Lock, Star, Mic, Code2, MessageSquare,
  Users, Calendar, BarChart2, Zap, Plus
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, AreaChart, Area,
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
  { skill: "Algorithms", score: 72 },
  { skill: "System Design", score: 58 },
  { skill: "Behavioral", score: 84 },
  { skill: "SQL", score: 66 },
  { skill: "React", score: 90 },
  { skill: "Communication", score: 78 },
];

const progressData = [
  { week: "Wk 1", score: 54 },
  { week: "Wk 2", score: 61 },
  { week: "Wk 3", score: 67 },
  { week: "Wk 4", score: 63 },
  { week: "Wk 5", score: 74 },
  { week: "Wk 6", score: 81 },
  { week: "Wk 7", score: 79 },
  { week: "Wk 8", score: 88 },
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

const rooms = [
  { id: "R-4821", title: "Google L5 — Technical", host: "Sarah (Interviewer)", date: "Jun 16, 2026 · 3:00 PM", status: "upcoming", duration: "60 min" },
  { id: "R-3390", title: "AI Mock — System Design", host: "CodeGear Bot", date: "Jun 12, 2026 · 11:00 AM", status: "completed", duration: "55 min" },
  { id: "R-2711", title: "Behavioral Practice", host: "CodeGear Bot", date: "Jun 10, 2026 · 2:00 PM", status: "completed", duration: "32 min" },
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

/* ── Sections ── */

function DashboardSection() {
  return (
    <div>
      <SectionHeader title="Your Dashboard" subtitle="Week 8 performance — you're in the top 18% this month." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<CheckCircle className="w-4.5 h-4.5" />} label="Questions Solved" value="124" sub="+12 this week" />
        <StatCard icon={<BarChart2 className="w-4.5 h-4.5" />} label="Readiness Score" value="88" sub="↑ 7 pts" accent />
        <StatCard icon={<Clock className="w-4.5 h-4.5" />} label="Practice Hours" value="34h" sub="Last 30 days" />
        <StatCard icon={<Star className="w-4.5 h-4.5" />} label="Mock Sessions" value="9" sub="3 scheduled" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Line chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
          <p className="text-[#0d1b2a] text-sm mb-4" style={{ fontWeight: 600 }}>Readiness Score — 8 Weeks</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={progressData}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00bfa6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#00bfa6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#4a6080" }} axisLine={false} tickLine={false} />
              <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: "#4a6080" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #dde6ef", fontSize: 12 }} />
              <Area type="monotone" dataKey="score" stroke="#00bfa6" strokeWidth={2.5} fill="url(#scoreGrad)" dot={{ r: 3, fill: "#00bfa6" }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Radar chart */}
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

      {/* Upcoming sessions */}
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

  return (
    <div>
      <SectionHeader title="Practice Questions" subtitle="Curated by role and difficulty. Solve daily to boost your score." />

      {/* Filters */}
      <div className="flex gap-2 mb-5">
        {(["All", "Easy", "Medium", "Hard"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm border transition-all ${filter === f ? "bg-[#0d1b2a] text-white border-[#0d1b2a]" : "bg-white text-[#4a6080] border-[#0d1b2a]/12 hover:border-[#0d1b2a]/25"
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
              : <button className="text-[#00bfa6] text-xs flex items-center gap-1 hover:underline"><Play className="w-3 h-3" />Solve</button>
            }
          </div>
        ))}
      </div>
    </div>
  );
}

function MockSection() {
  const types = [
    { icon: <Code2 className="w-5 h-5" />, title: "Technical Round", desc: "DSA, system design, and coding challenges with real-time code execution.", duration: "45 min", locked: false },
    { icon: <MessageSquare className="w-5 h-5" />, title: "Behavioral Round", desc: "STAR-method questions evaluated by AI for structure and impact.", duration: "30 min", locked: false },
    { icon: <Zap className="w-5 h-5" />, title: "System Design", desc: "Design scalable systems. AI whiteboard + feedback on your architecture.", duration: "60 min", locked: false },
    { icon: <Mic className="w-5 h-5" />, title: "Full Loop Simulation", desc: "Back-to-back rounds mimicking a real 4-hour interview loop.", duration: "3.5 hrs", locked: true },
  ];

  return (
    <div>
      <SectionHeader title="AI Mock Interview" subtitle="Practice with our AI interviewer. Get scored on clarity, depth, and speed." />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {types.map(({ icon, title, desc, duration, locked }) => (
          <div
            key={title}
            className={`relative bg-white rounded-2xl border p-6 transition-all ${locked ? "border-[#0d1b2a]/6 opacity-60" : "border-[#0d1b2a]/8 hover:border-[#00bfa6]/40 hover:shadow-md hover:shadow-[#00bfa6]/5 cursor-pointer"}`}
          >
            {locked && (
              <div className="absolute top-4 right-4 text-[#4a6080]/60">
                <Lock className="w-4 h-4" />
              </div>
            )}
            <div className="w-10 h-10 rounded-xl bg-[#0d1b2a] flex items-center justify-center mb-4 text-[#00bfa6]">
              {icon}
            </div>
            <h3 className="text-[#0d1b2a] mb-1.5" style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 600, fontSize: "1rem" }}>
              {title}
            </h3>
            <p className="text-[#4a6080] text-sm leading-relaxed mb-4">{desc}</p>
            <div className="flex items-center justify-between">
              <span className="text-[#4a6080] text-xs flex items-center gap-1.5"><Clock className="w-3 h-3" />{duration}</span>
              {!locked && (
                <button className="bg-[#00bfa6] text-[#0d1b2a] text-xs px-4 py-1.5 rounded-lg hover:bg-[#00d4b8] transition-colors flex items-center gap-1.5" style={{ fontWeight: 600 }}>
                  <Play className="w-3 h-3" /> Start
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Past AI sessions */}
      <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
        <p className="text-[#0d1b2a] text-sm mb-4" style={{ fontWeight: 600 }}>Recent Mock Sessions</p>
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

function ProfileSection() {
  const skills = ["React", "TypeScript", "Node.js", "Python", "System Design", "SQL"];
  return (
    <div>
      <SectionHeader title="Profile" subtitle="Your candidate profile visible to interviewers." />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-7 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-[#00bfa6] flex items-center justify-center text-[#0d1b2a] text-2xl mb-4" style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700 }}>
            AM
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
          <button className="mt-5 w-full border border-[#0d1b2a]/15 text-[#0d1b2a] text-sm py-2.5 rounded-xl hover:bg-[#f0f4f8] transition-colors" style={{ fontWeight: 500 }}>
            Edit Profile
          </button>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
            <p className="text-[#0d1b2a] text-sm mb-4" style={{ fontWeight: 600 }}>About</p>
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

export default function CandidateDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");

  const sections: Record<string, React.ReactNode> = {
    dashboard: <DashboardSection />,
    practice: <PracticeSection />,
    mock: <MockSection />,
    rooms: <RoomsSection />,
    profile: <ProfileSection />,
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
      {/* Welcome bar */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[#0d1b2a] leading-tight" style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.55rem" }}>
            Welcome back, Arjun 👋
          </h1>
          <p className="text-[#4a6080] text-sm mt-0.5">You have 1 interview scheduled this week.</p>
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
