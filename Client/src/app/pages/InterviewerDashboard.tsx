import {
  LayoutDashboard, PlusCircle, Video, User,
  Clock, CheckCircle, Users, Calendar, ChevronRight,
  BarChart2, TrendingUp, Edit3, Eye, Trash2, Copy,
  Camera, Mail, MapPin, Briefcase, Plus, X, Save,
  Mic, MessageSquare,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from "recharts";
import { DashboardLayout } from "../components/DashboardLayout";
import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { getInterviewerDashboard } from "../../services/interviewerService";
import {
  getCurrentInterviewRooms,
  startInterviewRoom,
  type InterviewRoomRecord,
} from "../../services/interviewRoomService";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "create", label: "Create Interview", icon: <PlusCircle className="w-4 h-4" /> },
  { id: "rooms", label: "Interview Rooms", icon: <Video className="w-4 h-4" /> },
  { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
];

const weeklyData = [
  { day: "Mon", conducted: 2, scheduled: 1 },
  { day: "Tue", conducted: 4, scheduled: 2 },
  { day: "Wed", conducted: 1, scheduled: 3 },
  { day: "Thu", conducted: 5, scheduled: 1 },
  { day: "Fri", conducted: 3, scheduled: 2 },
  { day: "Sat", conducted: 0, scheduled: 0 },
  { day: "Sun", conducted: 1, scheduled: 0 },
];

const offerRateData = [
  { month: "Jan", rate: 22 },
  { month: "Feb", rate: 28 },
  { month: "Mar", rate: 25 },
  { month: "Apr", rate: 31 },
  { month: "May", rate: 38 },
  { month: "Jun", rate: 35 },
];

const rooms = [
  { id: "R-5821", title: "Senior Frontend — React Specialist", candidate: "Priya Nair", role: "Senior Frontend Engineer", date: "Jun 16, 2026 · 2:00 PM", status: "upcoming", duration: "60 min", score: null },
  { id: "R-4490", title: "Backend Engineer — System Design", candidate: "David Kim", role: "Backend Engineer", date: "Jun 14, 2026 · 11:00 AM", status: "completed", duration: "58 min", score: 84 },
  { id: "R-3811", title: "Data Engineer — SQL & Pipelines", candidate: "Sofia Rossi", role: "Data Engineer", date: "Jun 12, 2026 · 3:30 PM", status: "completed", duration: "47 min", score: 71 },
  { id: "R-6102", title: "Staff Engineer — Full Loop", candidate: "James Wright", role: "Staff Engineer", date: "Jun 20, 2026 · 10:00 AM", status: "upcoming", duration: "3 hrs", score: null },
  { id: "R-2903", title: "Product Engineer — Behavioral", candidate: "Ananya Gupta", role: "Product Engineer", date: "Jun 10, 2026 · 1:00 PM", status: "completed", duration: "35 min", score: 90 },
];

const recentCandidates = [
  { name: "David Kim", role: "Backend Engineer", score: 84, decision: "Advance", initials: "DK", color: "bg-blue-500" },
  { name: "Sofia Rossi", role: "Data Engineer", score: 71, decision: "Hold", initials: "SR", color: "bg-violet-500" },
  { name: "Ananya Gupta", role: "Product Engineer", score: 90, decision: "Advance", initials: "AG", color: "bg-emerald-500" },
];

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-[#0d1b2a]" style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.35rem" }}>{title}</h2>
      {subtitle && <p className="text-[#4a6080] text-sm mt-1">{subtitle}</p>}
    </div>
  );
}

function StatCard({ icon, label, value, sub, dark }: { icon: React.ReactNode; label: string; value: string; sub?: string; dark?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 border ${dark ? "bg-[#0d1b2a] border-[#0d1b2a]" : "bg-white border-[#0d1b2a]/8"}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${dark ? "bg-white/10" : "bg-[#0d1b2a]/6"}`}>
        <span className="text-[#4d9de0]">{icon}</span>
      </div>
      <div className={`text-2xl mb-0.5 ${dark ? "text-white" : "text-[#0d1b2a]"}`} style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700 }}>{value}</div>
      <div className={`text-sm ${dark ? "text-white/60" : "text-[#4a6080]"}`}>{label}</div>
      {sub && <div className="text-xs mt-1 text-[#4d9de0]">{sub}</div>}
    </div>
  );
}

/* ── Dashboard ── */
function DashboardSection() {
  return (
    <div>
      <SectionHeader title="Overview" subtitle="This week you have conducted 16 sessions across 4 open roles." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Video className="w-4.5 h-4.5" />} label="Interviews Conducted" value="47" sub="↑ 9 this month" />
        <StatCard icon={<Users className="w-4.5 h-4.5" />} label="Candidates Reviewed" value="38" sub="5 pending" dark />
        <StatCard icon={<TrendingUp className="w-4.5 h-4.5" />} label="Avg. Score Given" value="76" sub="Out of 100" />
        <StatCard icon={<CheckCircle className="w-4.5 h-4.5" />} label="Offer Rate" value="35%" sub="↑ 7% vs last month" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
          <p className="text-[#0d1b2a] text-sm mb-4" style={{ fontWeight: 600 }}>This Week — Conducted vs Scheduled</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#4a6080" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#4a6080" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #dde6ef", fontSize: 12 }} />
              <Bar dataKey="conducted" fill="#0d1b2a" radius={[4, 4, 0, 0]} name="Conducted" />
              <Bar dataKey="scheduled" fill="#4d9de0" radius={[4, 4, 0, 0]} name="Scheduled" opacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
          <p className="text-[#0d1b2a] text-sm mb-4" style={{ fontWeight: 600 }}>Offer Rate — 6 Months</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={offerRateData}>
              <defs>
                <linearGradient id="intv-rate-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4d9de0" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4d9de0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#4a6080" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#4a6080" }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #dde6ef", fontSize: 12 }} />
              <Area type="monotone" dataKey="rate" stroke="#4d9de0" strokeWidth={2.5} fill="url(#intv-rate-grad)" dot={{ r: 3, fill: "#4d9de0" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[#0d1b2a] text-sm" style={{ fontWeight: 600 }}>Recent Candidate Reviews</p>
          <button className="text-[#4d9de0] text-xs hover:underline">View all</button>
        </div>
        <div className="space-y-3">
          {recentCandidates.map((c) => (
            <div key={c.name} className="flex items-center gap-4 p-3.5 rounded-xl bg-[#f0f4f8]">
              <div className={`w-9 h-9 rounded-full ${c.color} flex items-center justify-center text-xs text-white`} style={{ fontWeight: 700 }}>{c.initials}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[#0d1b2a] text-sm" style={{ fontWeight: 500 }}>{c.name}</p>
                <p className="text-[#4a6080] text-xs">{c.role}</p>
              </div>
              <p className="text-[#0d1b2a] text-sm" style={{ fontWeight: 700 }}>{c.score}/100</p>
              <span className={`text-xs px-2.5 py-1 rounded-full border ${c.decision === "Advance" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`} style={{ fontWeight: 500 }}>
                {c.decision}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Create Interview ── */
function CreateSection() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ title: "", role: "", type: "", duration: "60", date: "", time: "", notes: "" });

  const types = [
    { id: "technical", label: "Technical", icon: "💻" },
    { id: "behavioral", label: "Behavioral", icon: "🎤" },
    { id: "system", label: "System Design", icon: "🏗️" },
    { id: "full", label: "Full Loop", icon: "🔄" },
  ];

  const inputCls = "w-full bg-white border border-[#0d1b2a]/12 rounded-xl px-4 py-3 text-[#0d1b2a] placeholder-[#4a6080]/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#4d9de0]/30 focus:border-[#4d9de0]/60 transition-all";

  return (
    <div>
      <SectionHeader title="Create Interview" subtitle="Set up a new interview room in under 2 minutes." />

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8">
        {[1, 2].map((s, i) => (
          <div key={s} className="flex items-center">
            <button
              onClick={() => setStep(s)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${step >= s ? "bg-[#0d1b2a] text-white" : "bg-white border border-[#0d1b2a]/15 text-[#4a6080]"}`}
              style={{ fontWeight: 600 }}
            >
              {s}
            </button>
            <span className={`ml-2 text-xs mr-6 ${step >= s ? "text-[#0d1b2a]" : "text-[#4a6080]"}`} style={{ fontWeight: step === s ? 600 : 400 }}>
              {["Role & Type", "Schedule"][s - 1]}
            </span>
            {i < 1 && <div className={`w-8 h-px mr-6 ${step > s ? "bg-[#0d1b2a]" : "bg-[#0d1b2a]/15"}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-7 max-w-2xl">
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-[#0d1b2a] text-sm mb-1.5" style={{ fontWeight: 500 }}>Interview Title</label>
              <input className={inputCls} placeholder="e.g. Senior Frontend — React Specialist" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="block text-[#0d1b2a] text-sm mb-1.5" style={{ fontWeight: 500 }}>Target Role</label>
              <input className={inputCls} placeholder="e.g. Senior Software Engineer" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            </div>
            <div>
              <label className="block text-[#0d1b2a] text-sm mb-2" style={{ fontWeight: 500 }}>Interview Type</label>
              <div className="grid grid-cols-2 gap-3">
                {types.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setForm({ ...form, type: t.id })}
                    className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${form.type === t.id ? "bg-[#0d1b2a] border-[#0d1b2a] text-white" : "bg-[#f0f4f8] border-[#0d1b2a]/8 text-[#4a6080] hover:border-[#0d1b2a]/20"}`}
                  >
                    <span className="text-lg">{t.icon}</span>
                    <span className="text-sm" style={{ fontWeight: form.type === t.id ? 600 : 400 }}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[#0d1b2a] text-sm mb-1.5" style={{ fontWeight: 500 }}>Date</label>
                <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label className="block text-[#0d1b2a] text-sm mb-1.5" style={{ fontWeight: 500 }}>Time</label>
                <input type="time" className={inputCls} value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-[#0d1b2a] text-sm mb-1.5" style={{ fontWeight: 500 }}>Duration</label>
              <select className={inputCls} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}>
                {["30", "45", "60", "90", "120"].map((d) => (
                  <option key={d} value={d}>{d} minutes</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[#0d1b2a] text-sm mb-1.5" style={{ fontWeight: 500 }}>Candidate Email</label>
              <input type="email" className={inputCls} placeholder="candidate@email.com" />
            </div>
            <div>
              <label className="block text-[#0d1b2a] text-sm mb-1.5" style={{ fontWeight: 500 }}>
                Notes for Candidate <span className="text-[#4a6080] font-normal">(optional)</span>
              </label>
              <textarea className={`${inputCls} resize-none h-24`} placeholder="Preparation tips, what to expect..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="p-4 bg-[#0d1b2a]/4 rounded-xl border border-[#0d1b2a]/8">
              <p className="text-[#0d1b2a] text-sm mb-0.5" style={{ fontWeight: 600 }}>Ready to create?</p>
              <p className="text-[#4a6080] text-xs">A room link will be generated and emailed to the candidate automatically.</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-7 pt-5 border-t border-[#0d1b2a]/8">
          <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className="text-[#4a6080] text-sm disabled:opacity-30 hover:text-[#0d1b2a] transition-colors" style={{ fontWeight: 500 }}>
            ← Back
          </button>
          <button
            onClick={() => { if (step < 2) setStep(step + 1); }}
            className="bg-[#0d1b2a] text-white text-sm px-6 py-2.5 rounded-xl hover:bg-[#1a2f45] transition-colors"
            style={{ fontWeight: 600 }}
          >
            {step === 2 ? "Create Room →" : "Continue →"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Rooms ── */
export function RoomsSection() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[#0d1b2a]" style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.35rem" }}>Interview Rooms</h2>
          <p className="text-[#4a6080] text-sm mt-1">Manage all your created interview sessions.</p>
        </div>
        <button className="flex items-center gap-2 bg-[#0d1b2a] text-white text-sm px-4 py-2.5 rounded-xl hover:bg-[#1a2f45] transition-colors" style={{ fontWeight: 600 }}>
          <PlusCircle className="w-3.5 h-3.5" /> New Room
        </button>
      </div>
      <div className="space-y-3">
        {rooms.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-5 hover:border-[#4d9de0]/30 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#0d1b2a]/6 flex items-center justify-center shrink-0">
                <Video className="w-5 h-5 text-[#0d1b2a]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="text-[#0d1b2a] mb-0.5" style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 600, fontSize: "0.95rem" }}>{r.title}</h3>
                    <p className="text-[#4a6080] text-xs">{r.candidate} · {r.role}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border shrink-0 ${r.status === "upcoming" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`} style={{ fontWeight: 500 }}>
                    {r.status === "upcoming" ? "Upcoming" : "Completed"}
                  </span>
                </div>
                <div className="flex items-center gap-5 mt-3 flex-wrap">
                  <span className="text-[#4a6080] text-xs flex items-center gap-1.5"><Calendar className="w-3 h-3" />{r.date}</span>
                  <span className="text-[#4a6080] text-xs flex items-center gap-1.5"><Clock className="w-3 h-3" />{r.duration}</span>
                  <span className="text-[#4a6080] text-xs font-mono bg-[#f0f4f8] px-2 py-0.5 rounded">{r.id}</span>
                  {r.score !== null && <span className="text-[#4d9de0] text-xs" style={{ fontWeight: 600 }}>Score: {r.score}/100</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {r.status === "upcoming" ? (
                  <>
                    <button className="w-8 h-8 rounded-lg bg-[#f0f4f8] flex items-center justify-center text-[#4a6080] hover:text-[#0d1b2a] hover:bg-[#dde6ef] transition-colors" title="Edit">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button className="w-8 h-8 rounded-lg bg-[#f0f4f8] flex items-center justify-center text-[#4a6080] hover:text-[#0d1b2a] hover:bg-[#dde6ef] transition-colors" title="Copy link">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <Link
                      to={`/interview-room/${r.id}`}
                      className="bg-[#0d1b2a] text-white text-xs px-4 py-2 rounded-lg hover:bg-[#1a2f45] transition-colors"
                      style={{ fontWeight: 600 }}
                    >
                      Start
                    </Link>
                  </>
                ) : (
                  <>
                    <button className="w-8 h-8 rounded-lg bg-[#f0f4f8] flex items-center justify-center text-[#4a6080] hover:text-[#0d1b2a] hover:bg-[#dde6ef] transition-colors" title="View scorecard">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button className="w-8 h-8 rounded-lg bg-[#f0f4f8] flex items-center justify-center text-rose-400 hover:bg-rose-50 transition-colors" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Profile ── */
function CurrentRoomsSection() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<InterviewRoomRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingRoomId, setStartingRoomId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRooms = async () => {
      try {
        setRooms(await getCurrentInterviewRooms());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load interview rooms.");
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, []);

  const enterRoom = async (room: InterviewRoomRecord) => {
    setStartingRoomId(room.roomId);
    setError("");
    try {
      if (room.status === "CREATED") {
        await startInterviewRoom(room.roomId);
      }
      navigate(`/interview-room/${room.roomId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start the interview.");
    } finally {
      setStartingRoomId(null);
    }
  };

  return (
    <div>
      <SectionHeader title="Interview Rooms" subtitle="Manage your scheduled and active interview sessions." />
      {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-[#4a6080]">Loading interview rooms...</p>
      ) : rooms.length === 0 ? (
        <p className="text-sm text-[#4a6080]">No active or scheduled interview rooms.</p>
      ) : (
        <div className="space-y-3">
          {rooms.map((room) => (
            <div key={room.roomId} className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-[#0d1b2a]" style={{ fontWeight: 600 }}>{room.title}</h3>
                  <p className="mt-1 text-xs text-[#4a6080]">{room.candidateEmail} · {room.targetRole}</p>
                  <p className="mt-3 text-xs text-[#4a6080]">{room.roomId} · {room.interviewType}</p>
                </div>
                <button
                  onClick={() => enterRoom(room)}
                  disabled={startingRoomId === room.roomId}
                  className="bg-[#0d1b2a] text-white text-xs px-4 py-2 rounded-lg hover:bg-[#1a2f45] transition-colors disabled:opacity-60"
                  style={{ fontWeight: 600 }}
                >
                  {startingRoomId === room.roomId ? "Starting..." : room.status === "CREATED" ? "Start" : "Enter"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileSection({ onEdit }: { onEdit: () => void }) {
  const specializations = ["Frontend", "System Design", "Behavioral", "Full-Stack", "Data Engineering"];
  return (
    <div>
      <SectionHeader title="Profile" subtitle="Your interviewer profile seen by candidates and the platform." />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-7 flex flex-col items-center text-center h-fit">
          <div className="w-20 h-20 rounded-full bg-[#1a4a7a] flex items-center justify-center text-white text-2xl mb-4" style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700 }}>
            SL
          </div>
          <h3 className="text-[#0d1b2a] mb-0.5" style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.1rem" }}>Sarah Lin</h3>
          <p className="text-[#4a6080] text-sm mb-1">sarah.lin@company.com</p>
          <p className="text-[#4a6080] text-xs mb-4">Engineering Manager · San Francisco, CA</p>
          <div className="flex gap-1.5 flex-wrap justify-center mb-5">
            {specializations.map((s) => (
              <span key={s} className="text-xs bg-[#f0f4f8] text-[#4a6080] border border-[#0d1b2a]/8 px-2.5 py-1 rounded-full">{s}</span>
            ))}
          </div>
          <div className="w-full border-t border-[#0d1b2a]/8 pt-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              {[{ v: "47", l: "Interviews" }, { v: "35%", l: "Offer Rate" }, { v: "4.8★", l: "Rating" }].map(({ v, l }) => (
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
            <p className="text-[#0d1b2a] text-sm mb-3" style={{ fontWeight: 600 }}>Bio</p>
            <p className="text-[#4a6080] text-sm leading-relaxed">
              Engineering Manager at Stripe with 8 years in full-stack development and 3 years in technical hiring. Conducted 200+ interviews across frontend, backend, and leadership roles. Focused on calibrated, fair assessments.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
            <p className="text-[#0d1b2a] text-sm mb-4" style={{ fontWeight: 600 }}>Interview Specializations</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { area: "Technical Rounds", count: "24 sessions" },
                { area: "System Design", count: "11 sessions" },
                { area: "Behavioral", count: "8 sessions" },
                { area: "Full Loop", count: "4 sessions" },
              ].map(({ area, count }) => (
                <div key={area} className="bg-[#f0f4f8] rounded-xl p-4 border border-[#0d1b2a]/6">
                  <p className="text-[#0d1b2a] text-sm" style={{ fontWeight: 500 }}>{area}</p>
                  <p className="text-[#4a6080] text-xs mt-0.5">{count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Edit Profile ── */
function EditProfileSection({ onBack }: { onBack: () => void }) {
  const [specializations, setSpecializations] = useState(["Frontend", "System Design", "Behavioral", "Full-Stack", "Data Engineering"]);
  const [newSpec, setNewSpec] = useState("");
  const [form, setForm] = useState({
    name: "Sarah Lin",
    email: "sarah.lin@company.com",
    title: "Engineering Manager",
    location: "San Francisco, CA",
    company: "Stripe",
    about: "Engineering Manager at Stripe with 8 years in full-stack development and 3 years in technical hiring. Conducted 200+ interviews across frontend, backend, and leadership roles.",
    linkedin: "linkedin.com/in/sarahlin",
    github: "github.com/sarahlin",
    phone: "+1 415 555 0192",
  });

  const inputCls = "w-full bg-[#f0f4f8] border border-[#0d1b2a]/10 rounded-xl px-4 py-3 text-[#0d1b2a] placeholder-[#4a6080]/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#4d9de0]/30 focus:border-[#4d9de0]/60 transition-all";

  function addSpec() {
    const v = newSpec.trim();
    if (v && !specializations.includes(v)) { setSpecializations([...specializations, v]); setNewSpec(""); }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-8 h-8 rounded-lg bg-white border border-[#0d1b2a]/10 flex items-center justify-center text-[#4a6080] hover:text-[#0d1b2a] transition-colors">←</button>
        <div>
          <h2 className="text-[#0d1b2a]" style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.35rem" }}>Edit Profile</h2>
          <p className="text-[#4a6080] text-sm">Update your interviewer profile details.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar */}
        <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-7 flex flex-col items-center text-center h-fit">
          <div className="relative mb-5">
            <div className="w-24 h-24 rounded-full bg-[#1a4a7a] flex items-center justify-center text-white text-3xl" style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700 }}>SL</div>
            <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#0d1b2a] flex items-center justify-center shadow-lg hover:bg-[#1a2f45] transition-colors">
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <p className="text-[#0d1b2a] text-sm mb-1" style={{ fontWeight: 600 }}>Profile Photo</p>
          <p className="text-[#4a6080] text-xs mb-4">JPG, PNG or GIF · Max 4MB</p>
          <button className="w-full border border-[#0d1b2a]/15 text-[#0d1b2a] text-sm py-2 rounded-xl hover:bg-[#f0f4f8] transition-colors" style={{ fontWeight: 500 }}>Upload Photo</button>
          <button className="mt-2 w-full text-rose-500 text-sm py-2 rounded-xl hover:bg-rose-50 transition-colors" style={{ fontWeight: 500 }}>Remove Photo</button>
        </div>

        {/* Form */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
            <p className="text-[#0d1b2a] text-sm mb-4" style={{ fontWeight: 600 }}>Basic Information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Full Name", key: "name" as const, icon: <User className="w-3.5 h-3.5 text-[#4a6080]" /> },
                { label: "Email", key: "email" as const, icon: <Mail className="w-3.5 h-3.5 text-[#4a6080]" /> },
                { label: "Job Title", key: "title" as const, icon: <Briefcase className="w-3.5 h-3.5 text-[#4a6080]" /> },
                { label: "Company", key: "company" as const, icon: <Users className="w-3.5 h-3.5 text-[#4a6080]" /> },
                { label: "Location", key: "location" as const, icon: <MapPin className="w-3.5 h-3.5 text-[#4a6080]" /> },
                { label: "Phone", key: "phone" as const, icon: <Mic className="w-3.5 h-3.5 text-[#4a6080]" /> },
              ].map(({ label, key, icon }) => (
                <div key={key}>
                  <label className="block text-[#0d1b2a] text-xs mb-1.5" style={{ fontWeight: 500 }}>{label}</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2">{icon}</span>
                    <input className={`${inputCls} pl-10`} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
            <label className="block text-[#0d1b2a] text-sm mb-3" style={{ fontWeight: 600 }}>Bio</label>
            <textarea className={`${inputCls} resize-none h-28`} value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} />
            <p className="text-[#4a6080] text-xs mt-1.5">{form.about.length}/400 characters</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
            <p className="text-[#0d1b2a] text-sm mb-3" style={{ fontWeight: 600 }}>Specializations</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {specializations.map((s) => (
                <span key={s} className="flex items-center gap-1.5 text-xs bg-[#4d9de0]/10 text-[#4d9de0] border border-[#4d9de0]/20 px-2.5 py-1 rounded-full" style={{ fontWeight: 500 }}>
                  {s}
                  <button onClick={() => setSpecializations(specializations.filter((x) => x !== s))} className="hover:text-rose-500 transition-colors"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input className={`${inputCls} flex-1`} placeholder="Add specialization…" value={newSpec} onChange={(e) => setNewSpec(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSpec()} />
              <button onClick={addSpec} className="bg-[#0d1b2a] text-white px-4 rounded-xl hover:bg-[#1a2f45] transition-colors"><Plus className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
            <p className="text-[#0d1b2a] text-sm mb-4" style={{ fontWeight: 600 }}>Social Links</p>
            <div className="space-y-3">
              {[
                { label: "LinkedIn", key: "linkedin" as const },
                { label: "GitHub", key: "github" as const },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-[#0d1b2a] text-xs mb-1.5" style={{ fontWeight: 500 }}>{label}</label>
                  <input className={inputCls} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pb-2">
            <button onClick={onBack} className="px-6 py-2.5 border border-[#0d1b2a]/15 text-[#4a6080] text-sm rounded-xl hover:text-[#0d1b2a] hover:bg-[#f0f4f8] transition-colors" style={{ fontWeight: 500 }}>Cancel</button>
            <button onClick={onBack} className="flex items-center gap-2 bg-[#0d1b2a] text-white text-sm px-6 py-2.5 rounded-xl hover:bg-[#1a2f45] transition-colors" style={{ fontWeight: 600 }}>
              <Save className="w-3.5 h-3.5" /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InterviewerDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");

  const sections: Record<string, React.ReactNode> = {
    dashboard: <DashboardSection />,
    create: <CreateSection />,
    rooms: <CurrentRoomsSection />,
    profile: <ProfileSection onEdit={() => setActiveSection("edit-profile")} />,
    "edit-profile": <EditProfileSection onBack={() => setActiveSection("profile")} />,
  };

  return (
    <DashboardLayout
      role="interviewer"
      navItems={navItems}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      userName="Sarah Lin"
      userInitials="SL"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[#0d1b2a] leading-tight" style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.55rem" }}>
            Welcome back, Sarah 👋
          </h1>
          <p className="text-[#4a6080] text-sm mt-0.5">You have 2 interviews scheduled this week.</p>
        </div>
        <button
          onClick={() => setActiveSection("create")}
          className="hidden sm:flex items-center gap-2 bg-[#0d1b2a] text-white px-5 py-2.5 rounded-xl hover:bg-[#1a2f45] transition-colors"
          style={{ fontWeight: 600, fontSize: "0.875rem" }}
        >
          <PlusCircle className="w-3.5 h-3.5" /> Create Interview
        </button>
      </div>
      {sections[activeSection]}
    </DashboardLayout>
  );
}
