import {
  LayoutDashboard, PlusCircle, Video, User,
  Clock, CheckCircle, Users, Calendar,
  TrendingUp, Edit3, Eye, Trash2, Copy,
  Camera, Mail, MapPin, Briefcase, Plus, X, Save,
  Mic, Loader2, AlertCircle, CheckCircle2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from "recharts";
import { DashboardLayout } from "../components/DashboardLayout";
import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import {
  getCurrentInterviewRooms,
  startInterviewRoom,
  createInterviewRoom,
  getScoresReceived,
  type InterviewRoomRecord,
  type CreateInterviewPayload,
  type InterviewDetailsResponse,
  type InterviewScoreRecord,
} from "../../services/interviewRoomService";
import {
  getInterviewerDashboard,
  getInterviewerProfile,
  updateInterviewerProfile,
  type InterviewerDashboardData,
  type InterviewerProfile,
} from "../../services/interviewerService";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "create", label: "Create Interview", icon: <PlusCircle className="w-4 h-4" /> },
  { id: "rooms", label: "Interview Rooms", icon: <Video className="w-4 h-4" /> },
  { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
];

const rooms = [
  { id: "R-5821", title: "Senior Frontend — React Specialist", candidate: "Priya Nair", role: "Senior Frontend Engineer", date: "Jun 16, 2026 · 2:00 PM", status: "upcoming", duration: "60 min", score: null },
  { id: "R-4490", title: "Backend Engineer — System Design", candidate: "David Kim", role: "Backend Engineer", date: "Jun 14, 2026 · 11:00 AM", status: "completed", duration: "58 min", score: 84 },
  { id: "R-3811", title: "Data Engineer — SQL & Pipelines", candidate: "Sofia Rossi", role: "Data Engineer", date: "Jun 12, 2026 · 3:30 PM", status: "completed", duration: "47 min", score: 71 },
  { id: "R-6102", title: "Staff Engineer — Full Loop", candidate: "James Wright", role: "Staff Engineer", date: "Jun 20, 2026 · 10:00 AM", status: "upcoming", duration: "3 hrs", score: null },
  { id: "R-2903", title: "Product Engineer — Behavioral", candidate: "Ananya Gupta", role: "Product Engineer", date: "Jun 10, 2026 · 1:00 PM", status: "completed", duration: "35 min", score: 90 },
];

function getShortLabel(name?: string): string {
  if (!name || !name.trim()) return "Candidate";
  const parts = name.trim().split(/\s+/);
  if (parts.length > 1) {
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  }
  return name.length > 12 ? `${name.substring(0, 10)}...` : name;
}

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
  const [dashboardData, setDashboardData] = useState<InterviewerDashboardData | null>(null);
  const [receivedScores, setReceivedScores] = useState<InterviewScoreRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        const [data, scores] = await Promise.all([
          getInterviewerDashboard(),
          getScoresReceived().catch((err) => {
            console.warn("Failed to load received interview scores:", err);
            return [] as InterviewScoreRecord[];
          }),
        ]);
        if (active) {
          setDashboardData(data);
          setReceivedScores(scores || []);
        }
      } catch (err: any) {
        console.error("Failed to load interviewer dashboard:", err);
        if (active) {
          setError(err?.message || "Failed to load dashboard metrics.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchMetrics();
    return () => {
      active = false;
    };
  }, []);

  const interviewsConducted = dashboardData ? String(dashboardData.interviewsConducted) : "0";
  const candidatesReviewed = dashboardData ? String(dashboardData.candidatesReviewed) : "0";
  const avgScore = dashboardData && dashboardData.averageScoreGiven != null
    ? String(Math.round(dashboardData.averageScoreGiven))
    : "N/A";

  const reviews = dashboardData?.recentCandidateReviews && dashboardData.recentCandidateReviews.length > 0
    ? dashboardData.recentCandidateReviews
    : [];

  // Map of scores given by candidates to this interviewer, keyed by roomId and interviewId
  const receivedScoreMap = new Map<string, number>();
  receivedScores.forEach((s) => {
    if (s.roomId && s.score != null) {
      receivedScoreMap.set(s.roomId, s.score);
    }
    if (s.interviewId && s.score != null) {
      receivedScoreMap.set(s.interviewId, s.score);
    }
  });

  // Chronological order (oldest to newest) for chart progression, limited to 6 most recent sessions
  const chronologicalReviews = [...reviews].slice(0, 6).reverse();

  // 1. Left Chart: Candidate Score vs Interviewer Score (Mutual Scores)
  const mutualScoreData = chronologicalReviews.map((c) => {
    const recScore = (c.roomId ? receivedScoreMap.get(c.roomId) : undefined)
      ?? (c.interviewId ? receivedScoreMap.get(c.interviewId) : undefined);
    return {
      name: getShortLabel(c.candidateName || c.candidateEmail),
      fullName: c.candidateName || c.candidateEmail || "Candidate",
      candidateScore: c.score != null ? c.score : 0,
      interviewerScore: recScore != null ? recScore : 0,
      hasInterviewerScore: recScore != null,
      role: c.targetRole || c.interviewTitle || "Interview",
    };
  });

  // 2. Right Chart: Average Interview Score (Running average progression across evaluated candidates)
  let cumulativeSum = 0;
  const averageScoreData = chronologicalReviews.map((c, idx) => {
    cumulativeSum += c.score != null ? c.score : 0;
    const runningAvg = Math.round((cumulativeSum / (idx + 1)) * 10) / 10;
    return {
      name: getShortLabel(c.candidateName || c.candidateEmail),
      fullName: c.candidateName || c.candidateEmail || "Candidate",
      score: c.score != null ? c.score : 0,
      average: runningAvg,
    };
  });

  return (
    <div>
      <SectionHeader title="Overview" subtitle="Track your conducted sessions, candidate reviews, and scoring performance." />
      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={<Video className="w-4.5 h-4.5" />}
          label="Interviews Conducted"
          value={loading ? "..." : interviewsConducted}
          sub="Completed sessions"
        />
        <StatCard
          icon={<Users className="w-4.5 h-4.5" />}
          label="Candidates Reviewed"
          value={loading ? "..." : candidatesReviewed}
          sub="With submitted scores"
          dark
        />
        <StatCard
          icon={<TrendingUp className="w-4.5 h-4.5" />}
          label="Avg. Score"
          value={loading ? "..." : avgScore}
          sub="Out of 100"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[#0d1b2a] text-sm" style={{ fontWeight: 600 }}>Candidate Score vs Interviewer Score</p>
            {mutualScoreData.length > 0 && (
              <span className="text-xs text-[#4a6080]">
                {mutualScoreData.length} scored {mutualScoreData.length === 1 ? "session" : "sessions"}
              </span>
            )}
          </div>
          {mutualScoreData.length === 0 ? (
            <div className="h-[200px] flex flex-col items-center justify-center text-xs text-[#4a6080] bg-[#f0f4f8] rounded-xl text-center px-4">
              No mutual interview scores recorded yet. Scores given by you and candidates will appear here.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={mutualScoreData} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#4a6080" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#4a6080" }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: any, name: string, item: any) => {
                    if (name === "Interviewer Score" && !item?.payload?.hasInterviewerScore) {
                      return ["Not submitted yet", name];
                    }
                    return [`${value}/100`, name];
                  }}
                  labelFormatter={(_label, payload) => {
                    const item = payload?.[0]?.payload;
                    return item?.fullName ? `${item.fullName} · ${item.role}` : _label;
                  }}
                  contentStyle={{ borderRadius: 10, border: "1px solid #dde6ef", fontSize: 12 }}
                />
                <Bar dataKey="candidateScore" fill="#0d1b2a" radius={[4, 4, 0, 0]} name="Candidate Score" />
                <Bar dataKey="interviewerScore" fill="#4d9de0" radius={[4, 4, 0, 0]} name="Interviewer Score" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[#0d1b2a] text-sm" style={{ fontWeight: 600 }}>Average Interview Score</p>
            {dashboardData?.averageScoreGiven != null && (
              <span className="text-xs text-[#4d9de0]" style={{ fontWeight: 600 }}>
                Avg: {Math.round(dashboardData.averageScoreGiven)}/100
              </span>
            )}
          </div>
          {averageScoreData.length === 0 ? (
            <div className="h-[200px] flex flex-col items-center justify-center text-xs text-[#4a6080] bg-[#f0f4f8] rounded-xl text-center px-4">
              No completed interview scores recorded yet. Your average scoring trend will appear here once candidates are evaluated.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={averageScoreData}>
                <defs>
                  <linearGradient id="intv-score-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4d9de0" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#4d9de0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#4a6080" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#4a6080" }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: any, name: string) => [`${value}/100`, name]}
                  labelFormatter={(_label, payload) => {
                    const item = payload?.[0]?.payload;
                    return item?.fullName || _label;
                  }}
                  contentStyle={{ borderRadius: 10, border: "1px solid #dde6ef", fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="average"
                  stroke="#4d9de0"
                  strokeWidth={2.5}
                  fill="url(#intv-score-grad)"
                  dot={{ r: 3, fill: "#4d9de0" }}
                  name="Avg Score"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[#0d1b2a] text-sm" style={{ fontWeight: 600 }}>Recent Candidate Reviews</p>
          {reviews.length > 0 && <span className="text-[#4a6080] text-xs">{reviews.length} reviewed</span>}
        </div>
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-sm text-[#4a6080] gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#4d9de0]" />
              <span>Loading reviews...</span>
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-5 rounded-xl bg-[#f0f4f8] text-center text-xs text-[#4a6080]">
              No candidate reviews submitted yet. When you complete and score candidate interviews, their ratings will appear here.
            </div>
          ) : (
            reviews.map((c, idx) => (
              <div key={c.candidateId ? `${c.candidateId}-${idx}` : idx} className="flex items-center gap-4 p-3.5 rounded-xl bg-[#f0f4f8]">
                <div className={`w-9 h-9 rounded-full ${c.color || "bg-blue-500"} flex items-center justify-center text-xs text-white`} style={{ fontWeight: 700 }}>
                  {c.initials || "CR"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#0d1b2a] text-sm" style={{ fontWeight: 500 }}>
                    {c.candidateName || c.candidateEmail || "Candidate"}
                  </p>
                  <p className="text-[#4a6080] text-xs">
                    {c.targetRole || c.interviewTitle || "Technical Interview"}
                  </p>
                </div>
                <p className="text-[#0d1b2a] text-sm" style={{ fontWeight: 700 }}>
                  {c.score}/100
                </p>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full border ${c.decision === "Advance" || (c.score != null && c.score >= 70)
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  style={{ fontWeight: 500 }}
                >
                  {c.decision || (c.score != null && c.score >= 70 ? "Advance" : "Review")}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Create Interview ── */
interface CreateSectionProps {
  onRoomCreated?: (room: InterviewDetailsResponse) => void;
}

function CreateSection({ onRoomCreated }: CreateSectionProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: "",
    role: "",
    type: "technical",
    duration: "60",
    date: "",
    time: "",
    candidateEmail: "",
    notes: "",
  });
  const [validationError, setValidationError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const types = [
    { id: "technical", label: "Technical", icon: "💻" },
    { id: "behavioral", label: "Behavioral", icon: "🎤" },
    { id: "system", label: "System Design", icon: "🏗️" },
    { id: "full", label: "Full Loop", icon: "🔄" },
  ];

  const inputCls = "w-full bg-white border border-[#0d1b2a]/12 rounded-xl px-4 py-3 text-[#0d1b2a] placeholder-[#4a6080]/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#4d9de0]/30 focus:border-[#4d9de0]/60 transition-all";

  const handleNextOrSubmit = async () => {
    setValidationError("");
    setSubmitError("");

    if (step === 1) {
      if (!form.title.trim()) {
        setValidationError("Interview title is required.");
        return;
      }
      if (!form.role.trim()) {
        setValidationError("Target role is required.");
        return;
      }
      if (!form.type.trim()) {
        setValidationError("Please select an interview type.");
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      const email = form.candidateEmail.trim();
      if (!email) {
        setValidationError("Candidate email is required.");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setValidationError("Please enter a valid candidate email address.");
        return;
      }

      setIsSubmitting(true);
      try {
        const payload: CreateInterviewPayload = {
          title: form.title.trim(),
          targetRole: form.role.trim(),
          interviewType: form.type,
          candidateEmail: email,
          candidateNotes: form.notes.trim() ? form.notes.trim() : undefined,
        };
        const createdRoom = await createInterviewRoom(payload);
        setForm({
          title: "",
          role: "",
          type: "technical",
          duration: "60",
          date: "",
          time: "",
          candidateEmail: "",
          notes: "",
        });
        setStep(1);
        if (onRoomCreated) {
          onRoomCreated(createdRoom);
        }
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to create interview room. Please check the candidate email and try again.";
        setSubmitError(msg);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div>
      <SectionHeader title="Create Interview" subtitle="Set up a new interview room in under 2 minutes." />

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8">
        {[1, 2].map((s, i) => (
          <div key={s} className="flex items-center">
            <button
              type="button"
              onClick={() => {
                if (!isSubmitting) {
                  setValidationError("");
                  setSubmitError("");
                  setStep(s);
                }
              }}
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
              <label className="block text-[#0d1b2a] text-sm mb-1.5" style={{ fontWeight: 500 }}>
                Interview Title <span className="text-rose-500">*</span>
              </label>
              <input
                className={inputCls}
                placeholder="e.g. Senior Frontend — React Specialist"
                value={form.title}
                onChange={(e) => {
                  setForm({ ...form, title: e.target.value });
                  if (validationError) setValidationError("");
                }}
              />
            </div>
            <div>
              <label className="block text-[#0d1b2a] text-sm mb-1.5" style={{ fontWeight: 500 }}>
                Target Role <span className="text-rose-500">*</span>
              </label>
              <input
                className={inputCls}
                placeholder="e.g. Senior Software Engineer"
                value={form.role}
                onChange={(e) => {
                  setForm({ ...form, role: e.target.value });
                  if (validationError) setValidationError("");
                }}
              />
            </div>
            <div>
              <label className="block text-[#0d1b2a] text-sm mb-2" style={{ fontWeight: 500 }}>
                Interview Type <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {types.map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => {
                      setForm({ ...form, type: t.id });
                      if (validationError) setValidationError("");
                    }}
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
              <div hidden>
                <label className="block text-[#0d1b2a] text-sm mb-1.5" style={{ fontWeight: 500 }}>Date</label>
                <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div hidden>
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
              <label className="block text-[#0d1b2a] text-sm mb-1.5" style={{ fontWeight: 500 }}>
                Candidate Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                className={inputCls}
                placeholder="candidate@email.com"
                value={form.candidateEmail}
                onChange={(e) => {
                  setForm({ ...form, candidateEmail: e.target.value });
                  if (validationError) setValidationError("");
                  if (submitError) setSubmitError("");
                }}
              />
            </div>
            <div>
              <label className="block text-[#0d1b2a] text-sm mb-1.5" style={{ fontWeight: 500 }}>
                Notes for Candidate <span className="text-[#4a6080] font-normal">(optional)</span>
              </label>
              <textarea
                className={`${inputCls} resize-none h-24`}
                placeholder="Preparation tips, what to expect..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <div className="p-4 bg-[#0d1b2a]/4 rounded-xl border border-[#0d1b2a]/8">
              <p className="text-[#0d1b2a] text-sm mb-0.5" style={{ fontWeight: 600 }}>Ready to create?</p>
              <p className="text-[#4a6080] text-xs">The interview room will be initialized and stored in the database ready for your session.</p>
            </div>
          </div>
        )}

        {validationError && (
          <div className="flex items-center gap-2 p-3 mt-4 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{validationError}</span>
          </div>
        )}

        {submitError && (
          <div className="flex items-center gap-2 p-3 mt-4 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-7 pt-5 border-t border-[#0d1b2a]/8">
          <button
            type="button"
            onClick={() => {
              setValidationError("");
              setSubmitError("");
              setStep(Math.max(1, step - 1));
            }}
            disabled={step === 1 || isSubmitting}
            className="text-[#4a6080] text-sm disabled:opacity-30 hover:text-[#0d1b2a] transition-colors"
            style={{ fontWeight: 500 }}
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={handleNextOrSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-[#0d1b2a] text-white text-sm px-6 py-2.5 rounded-xl hover:bg-[#1a2f45] transition-colors disabled:opacity-60"
            style={{ fontWeight: 600 }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Room...</span>
              </>
            ) : step === 2 ? (
              "Create Room →"
            ) : (
              "Continue →"
            )}
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

/* ── Current Real Rooms ── */
interface CurrentRoomsSectionProps {
  refreshTrigger?: number;
  successMessage?: string | null;
  onClearSuccessMessage?: () => void;
  onNewRoom?: () => void;
}

function CurrentRoomsSection({
  refreshTrigger,
  successMessage,
  onClearSuccessMessage,
  onNewRoom,
}: CurrentRoomsSectionProps) {
  const navigate = useNavigate();
  const [roomsList, setRoomsList] = useState<InterviewRoomRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingRoomId, setStartingRoomId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadRooms = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getCurrentInterviewRooms();
      setRoomsList(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load interview rooms.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, [refreshTrigger]);

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <SectionHeader title="Interview Rooms" subtitle="Manage your scheduled and active interview sessions." />
        </div>

      </div>

      {successMessage && (
        <div className="flex items-center justify-between gap-2 p-4 mb-5 text-sm font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          {onClearSuccessMessage && (
            <button
              onClick={onClearSuccessMessage}
              className="text-emerald-700 hover:text-emerald-900 transition-colors p-1"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}
      {loading ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-[#0d1b2a]/8">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#4d9de0] mb-2" />
          <p className="text-sm text-[#4a6080]">Loading interview rooms...</p>
        </div>
      ) : roomsList.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-[#0d1b2a]/8">
          <Video className="w-8 h-8 mx-auto mb-2 text-[#4a6080]/60" />
          <p className="text-sm font-medium text-[#0d1b2a]">No active or scheduled interview rooms.</p>
          <p className="mt-1 text-xs text-[#4a6080]">Click "New Room" to schedule an interview with a candidate.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {roomsList.map((room) => (
            <div key={room.roomId} className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-5 hover:border-[#4d9de0]/30 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#0d1b2a]/6 flex items-center justify-center shrink-0">
                    <Video className="w-5 h-5 text-[#0d1b2a]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-[#0d1b2a]" style={{ fontWeight: 600 }}>{room.title}</h3>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border ${room.status === "CREATED" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`} style={{ fontWeight: 500 }}>
                        {room.status === "CREATED" ? "Scheduled" : room.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#4a6080]">Candidate: {room.candidateEmail} · Role: {room.targetRole}</p>
                  </div>
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

/* ── Profile ── */
interface ProfileSectionProps {
  user: InterviewerProfile | null;
  dashboardData: InterviewerDashboardData | null;
  onEdit: () => void;
}

function ProfileSection({ user, dashboardData, onEdit }: ProfileSectionProps) {
  const displayName = user?.name?.trim() || "Interviewer";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "IN";

  const reviews = dashboardData?.recentCandidateReviews && dashboardData.recentCandidateReviews.length > 0
    ? dashboardData.recentCandidateReviews
    : [];

  return (
    <div>
      <SectionHeader title="Profile" subtitle="Your interviewer profile seen by candidates and the platform." />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-7 flex flex-col items-center text-center h-fit">
          <div className="relative mb-4">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={displayName}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full bg-[#1a4a7a] flex items-center justify-center text-white text-2xl"
                style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700 }}
              >
                {initials}
              </div>
            )}
          </div>
          <h3
            className="text-[#0d1b2a] mb-0.5"
            style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.1rem" }}
          >
            {displayName}
          </h3>
          <p className="text-[#4a6080] text-sm mb-1">{user?.email || "No email available"}</p>
          <p className="text-[#4a6080] text-xs mb-4">
            {user?.title ? (user.location ? `${user.title} · ${user.location}` : user.title) : (user?.location ? user.location : "Technical Interviewer")}
          </p>
          <div className="w-full border-t border-[#0d1b2a]/8 pt-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { v: String(dashboardData?.interviewsConducted ?? 0), l: "Conducted" },
                { v: String(dashboardData?.candidatesReviewed ?? 0), l: "Reviewed" },
                { v: dashboardData?.averageScoreGiven != null ? `${Math.round(dashboardData.averageScoreGiven)}` : "N/A", l: "Avg. Score" },
              ].map(({ v, l }) => (
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
              {user?.about?.trim()
                ? user.about
                : "No bio added yet. Click 'Edit Profile' to add your professional background and interviewing focus."}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[#0d1b2a] text-sm" style={{ fontWeight: 600 }}>Recent Candidate Evaluations</p>
              {reviews.length > 0 && (
                <span className="text-[#4a6080] text-xs">{reviews.length} completed</span>
              )}
            </div>
            {reviews.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#f0f4f8] text-center text-xs text-[#4a6080]">
                No candidate evaluations submitted yet. When you complete and score interviews, recent summaries will appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.slice(0, 4).map((r, idx) => (
                  <div key={r.roomId || idx} className="flex items-center justify-between p-3 rounded-xl bg-[#f0f4f8]">
                    <div className="min-w-0">
                      <p className="text-[#0d1b2a] text-sm" style={{ fontWeight: 500 }}>
                        {r.candidateName || r.candidateEmail || "Candidate"}
                      </p>
                      <p className="text-[#4a6080] text-xs">
                        {r.targetRole || r.interviewTitle || "Technical Interview"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#0d1b2a]">{r.score}/100</span>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full border ${
                        r.decision === "Advance" || r.score >= 70
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {r.decision || (r.score >= 70 ? "Advance" : "Review")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Edit Profile ── */
interface EditProfileSectionProps {
  user: InterviewerProfile | null;
  onBack: () => void;
  onProfileSaved: (updated: InterviewerProfile) => void;
}

function EditProfileSection({ user, onBack, onProfileSaved }: EditProfileSectionProps) {
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    title: user?.title ?? "",
    location: user?.location ?? "",
    about: user?.about ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const inputCls = "w-full bg-[#f0f4f8] border border-[#0d1b2a]/10 rounded-xl px-4 py-3 text-[#0d1b2a] placeholder-[#4a6080]/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#4d9de0]/30 focus:border-[#4d9de0]/60 transition-all";

  const displayName = form.name.trim() || user?.name || "Interviewer";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "IN";

  async function handleSave() {
    if (!form.name.trim()) {
      setSaveError("Full name cannot be empty.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const updated = await updateInterviewerProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        title: form.title.trim(),
        location: form.location.trim(),
        about: form.about.trim(),
      });
      onProfileSaved(updated);
      try {
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({
          ...stored,
          name: updated.name,
          email: updated.email,
        }));
      } catch {
        // ignore storage parse error
      }
      onBack();
    } catch (err: any) {
      setSaveError(
        err?.response?.data?.message || err?.message || "Failed to save profile changes."
      );
    } finally {
      setSaving(false);
    }
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

      {saveError && (
        <div className="flex items-center gap-2 p-3 mb-4 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar */}
        <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-7 flex flex-col items-center text-center h-fit">
          <div className="relative mb-5">
            {user?.avatar ? (
              <img src={user.avatar} alt={displayName} className="w-24 h-24 rounded-full object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#1a4a7a] flex items-center justify-center text-white text-3xl" style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700 }}>
                {initials}
              </div>
            )}
          </div>
          <p className="text-[#0d1b2a] text-sm mb-1" style={{ fontWeight: 600 }}>{displayName}</p>
          <p className="text-[#4a6080] text-xs">Technical Interviewer</p>
        </div>

        {/* Form */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
            <p className="text-[#0d1b2a] text-sm mb-4" style={{ fontWeight: 600 }}>Basic Information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#0d1b2a] text-xs mb-1.5" style={{ fontWeight: 500 }}>Full Name</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2"><User className="w-3.5 h-3.5 text-[#4a6080]" /></span>
                  <input className={`${inputCls} pl-10`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" />
                </div>
              </div>
              <div>
                <label className="block text-[#0d1b2a] text-xs mb-1.5" style={{ fontWeight: 500 }}>Email</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2"><Mail className="w-3.5 h-3.5 text-[#4a6080]" /></span>
                  <input className={`${inputCls} pl-10`} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-[#0d1b2a] text-xs mb-1.5" style={{ fontWeight: 500 }}>Job Title / Professional Role</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2"><Briefcase className="w-3.5 h-3.5 text-[#4a6080]" /></span>
                  <input className={`${inputCls} pl-10`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Senior Software Engineer" />
                </div>
              </div>
              <div>
                <label className="block text-[#0d1b2a] text-xs mb-1.5" style={{ fontWeight: 500 }}>Location</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2"><MapPin className="w-3.5 h-3.5 text-[#4a6080]" /></span>
                  <input className={`${inputCls} pl-10`} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. San Francisco, CA" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
            <label className="block text-[#0d1b2a] text-sm mb-3" style={{ fontWeight: 600 }}>Bio / Summary</label>
            <textarea className={`${inputCls} resize-none h-28`} value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} placeholder="Share your technical experience and interview focus..." />
            <p className="text-[#4a6080] text-xs mt-1.5">{form.about.length}/400 characters</p>
          </div>

          <div className="flex items-center justify-end gap-3 pb-2">
            <button
              type="button"
              onClick={onBack}
              disabled={saving}
              className="px-6 py-2.5 border border-[#0d1b2a]/15 text-[#4a6080] text-sm rounded-xl hover:text-[#0d1b2a] hover:bg-[#f0f4f8] transition-colors disabled:opacity-50"
              style={{ fontWeight: 500 }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-[#0d1b2a] text-white text-sm px-6 py-2.5 rounded-xl hover:bg-[#1a2f45] transition-colors disabled:opacity-60"
              style={{ fontWeight: 600 }}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InterviewerDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [roomsRefreshTrigger, setRoomsRefreshTrigger] = useState(0);
  const [roomCreatedSuccessMessage, setRoomCreatedSuccessMessage] = useState<string | null>(null);

  const [profile, setProfile] = useState<InterviewerProfile | null>(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        return {
          id: u.id || "",
          name: u.name || "",
          email: u.email || "",
          role: u.role || "interviewer",
          title: "",
          location: "",
          about: "",
        };
      }
    } catch {
      // ignore
    }
    return null;
  });
  const [dashboardData, setDashboardData] = useState<InterviewerDashboardData | null>(null);

  useEffect(() => {
    let active = true;
    const loadProfileAndStats = async () => {
      try {
        const [prof, dash] = await Promise.all([
          getInterviewerProfile().catch((err) => {
            console.warn("Could not fetch interviewer profile:", err);
            return null;
          }),
          getInterviewerDashboard().catch((err) => {
            console.warn("Could not fetch interviewer dashboard for profile:", err);
            return null;
          }),
        ]);
        if (active) {
          if (prof) setProfile(prof);
          if (dash) setDashboardData(dash);
        }
      } catch (err) {
        console.warn("Error loading interviewer profile data:", err);
      }
    };
    loadProfileAndStats();
    return () => {
      active = false;
    };
  }, []);

  const handleProfileSaved = (updated: InterviewerProfile) => {
    setProfile(updated);
  };

  const handleRoomCreated = (createdRoom: InterviewDetailsResponse) => {
    setRoomCreatedSuccessMessage(
      `Interview room "${createdRoom.title}" created successfully for ${createdRoom.candidateEmail || createdRoom.candidateId}!`
    );
    setRoomsRefreshTrigger((prev) => prev + 1);
    setActiveSection("rooms");
  };

  const displayName = profile?.name?.trim() || "Interviewer";
  const firstName = displayName.split(" ")[0];
  const userInitials = displayName
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "IN";

  const sections: Record<string, React.ReactNode> = {
    dashboard: <DashboardSection />,
    create: <CreateSection onRoomCreated={handleRoomCreated} />,
    rooms: (
      <CurrentRoomsSection
        refreshTrigger={roomsRefreshTrigger}
        successMessage={roomCreatedSuccessMessage}
        onClearSuccessMessage={() => setRoomCreatedSuccessMessage(null)}
        onNewRoom={() => {
          setRoomCreatedSuccessMessage(null);
          setActiveSection("create");
        }}
      />
    ),
    profile: (
      <ProfileSection
        user={profile}
        dashboardData={dashboardData}
        onEdit={() => setActiveSection("edit-profile")}
      />
    ),
    "edit-profile": (
      <EditProfileSection
        user={profile}
        onBack={() => setActiveSection("profile")}
        onProfileSaved={handleProfileSaved}
      />
    ),
  };

  return (
    <DashboardLayout
      role="interviewer"
      navItems={navItems}
      activeSection={activeSection}
      onSectionChange={(section) => {
        if (section !== "rooms") {
          setRoomCreatedSuccessMessage(null);
        }
        setActiveSection(section);
      }}
      userName={displayName}
      userInitials={userInitials}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[#0d1b2a] leading-tight" style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.55rem" }}>
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-[#4a6080] text-sm mt-0.5">Manage your interviews, candidates, and evaluations.</p>
        </div>
        <button
          onClick={() => {
            setRoomCreatedSuccessMessage(null);
            setActiveSection("create");
          }}
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
