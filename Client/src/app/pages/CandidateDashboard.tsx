import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  Bot,
  Video,
  User,
  Clock,
  CheckCircle,
  TrendingUp,
  ChevronRight,
  ChevronDown,
  Play,
  Star,
  Code2,
  MessageSquare,
  Calendar,
  BarChart2,
  Edit3,
  Brain,
  Target,
  Lightbulb,
  AlertCircle,
  Camera,
  Mail,
  MapPin,
  Briefcase,
  Plus,
  X,
  Save,
  Loader2,
  RefreshCw,
  Inbox,
} from "lucide-react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { DashboardLayout } from "../components/DashboardLayout";
import {
  fetchDashboard,
  updateProfile,
  uploadAvatarApi,
  removeAvatarApi,
} from "../../services/candidateService";
import { getAvatarUrl } from "../../utils/avatarUtils";
import { getHistory, getInterviewById } from "../../services/history";
import {
  getCurrentInterviewRooms,
  joinInterviewRoom,
  type InterviewRoomRecord,
} from "../../services/interviewRoomService";

// Experience

export interface Experience {
  id?: string;
  title?: string;
  role?: string;
  company: string;
  startDate?: string;
  endDate?: string | null;
  current?: boolean;
  description?: string | null;
  period?: string;
}

export function formatMonthYear(dateStr?: string | null): string {
  if (!dateStr) return "";
  if (/^\d{4}-\d{2}$/.test(dateStr)) {
    const [year, month] = dateStr.split("-");
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const mIdx = parseInt(month, 10) - 1;
    if (mIdx >= 0 && mIdx < 12) {
      return `${monthNames[mIdx]} ${year}`;
    }
  }
  return dateStr;
}

export function getExperiencePeriodText(exp: Experience): string {
  if (exp.period && !exp.startDate && !exp.endDate) {
    return exp.period;
  }
  const start = formatMonthYear(exp.startDate) || exp.startDate || "";
  if (exp.current) {
    return start ? `${start} – Present` : "Present";
  }
  const end = formatMonthYear(exp.endDate) || exp.endDate || "";
  if (start && end) {
    return `${start} – ${end}`;
  }
  return start || end || exp.period || "";
}

// User

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  title: string | null;
  location: string | null;
  avatar: string | null;
  about: string | null;
  readinessScore?: number;
  skills?: string[];
  targets?: string[];
  experience?: Experience[];
}

export function computeAverageMockScore(
  interviewHistory: any[],
  latestInterview?: any,
): number {
  if (Array.isArray(interviewHistory) && interviewHistory.length > 0) {
    const total = interviewHistory.reduce(
      (sum, item) => sum + (typeof item?.score === "number" ? item.score : 0),
      0,
    );
    return Math.round(total / interviewHistory.length);
  }
  const readiness = latestInterview?.evaluation?.overallScore;
  if (typeof readiness === "number" && readiness > 0) {
    return Math.round(readiness);
  }
  return 0;
}

// Dashboard Stats

export interface DashboardStats {
  questionsSolved: number;
  codingTimeSeconds: number;
  mockSessions: number;
  weeklyImprovement: number;
  totalCompletedRealInterviews?: number;
  totalCompletedMockInterviews?: number;
  averageRealInterviewScore?: number | null;
}

export interface SkillBreakdown {
  confidence: number;
  technical: number;
  readiness: number;
  problemSolving: number;
  communication: number;
}

// Progress Chart

export interface ProgressPoint {
  week: string;
  score: number;
}

// Practice Questions

export interface PracticeQuestion {
  id: string;
  title: string;
  topic: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  done: boolean;
  time: string;
}

// Time Formatter
function formatCodingTime(seconds: number) {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

// Mock Sessions

export interface MockSession {
  id: string;
  type: string;
  duration: string;
  topics: string[];
  score: number | null;
  date: string;
  status: "completed" | "scheduled";
}

// Mock Result

export interface MockResult {
  session: string;
  overall: number;
  technical: number;
  readiness: number;
  confidence: number;
  communication: number;
  problemSolving: number;
  strengths: string[];
  weaknesses: string[];
}

// Rooms

export interface Room {
  id: string;
  title: string;
  host: string;
  date: string;
  status: "upcoming" | "completed";
  duration: string;
}

// Dashboard Response

export interface DashboardResponse {
  user: UserProfile;
  stats: DashboardStats;
  skillBreakdown: SkillBreakdown;
  progressHistory: ProgressPoint[];
  practiceQuestions: PracticeQuestion[];

  mockSessions?: MockSession[];
  lastMockResult?: MockResult | null;
  rooms?: Room[];
  skills?: string[];
  targets?: string[];
  experience?: Experience[];

  totalCompletedRealInterviews?: number;
  totalCompletedMockInterviews?: number;
  averageRealInterviewScore?: number | null;
}

const navItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    id: "practice",
    label: "Practice Questions",
    icon: <BookOpen className="w-4 h-4" />,
  },
  { id: "mock", label: "AI Mock Interview", icon: <Bot className="w-4 h-4" /> },
  { id: "rooms", label: "My Rooms", icon: <Video className="w-4 h-4" /> },
  { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
];

const diffColor: Record<string, string> = {
  EASY: "text-emerald-600 bg-emerald-50 border-emerald-200",
  MEDIUM: "text-amber-600 bg-amber-50 border-amber-200",
  HARD: "text-rose-600 bg-rose-50 border-rose-200",
};

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <h2
        className="text-[#0d1b2a]"
        style={{
          fontFamily: "'Roboto Slab', serif",
          fontWeight: 700,
          fontSize: "1.35rem",
        }}
      >
        {title}
      </h2>
      {subtitle && <p className="text-[#4a6080] text-sm mt-1">{subtitle}</p>}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 border ${accent ? "bg-[#00bfa6] border-[#00bfa6]" : "bg-white border-[#0d1b2a]/8"}`}
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${accent ? "bg-white/20" : "bg-[#0d1b2a]/6"}`}
      >
        <span className={accent ? "text-[#0d1b2a]" : "text-[#00bfa6]"}>
          {icon}
        </span>
      </div>
      <div
        className={`text-2xl mb-0.5 ${accent ? "text-[#0d1b2a]" : "text-[#0d1b2a]"}`}
        style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700 }}
      >
        {value}
      </div>
      <div
        className={`text-sm ${accent ? "text-[#0d1b2a]/70" : "text-[#4a6080]"}`}
      >
        {label}
      </div>
      {sub && (
        <div
          className={`text-xs mt-1 ${accent ? "text-[#0d1b2a]/50" : "text-[#00bfa6]"}`}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function ScoreBar({
  label,
  score,
  color,
}: {
  label: string;
  score: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[#0d1b2a] text-sm" style={{ fontWeight: 500 }}>
          {label}
        </span>
        <span className="text-sm" style={{ fontWeight: 700, color }}>
          {score}
          <span className="text-[#4a6080] font-normal text-xs">/100</span>
        </span>
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

/* Generic loading / error / empty helpers */

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-[#0d1b2a]/8 rounded-xl ${className}`} />
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <motion.div
      className="rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-50 via-white to-orange-50 p-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex flex-col items-center text-center max-w-md mx-auto">
        <motion.div
          className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-rose-100 flex items-center justify-center mb-5"
          animate={{
            y: [0, -6, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 2,
          }}
        >
          <AlertCircle className="w-8 h-8 text-rose-500" />
        </motion.div>

        <h3
          className="text-[#0d1b2a] text-xl mb-2"
          style={{
            fontFamily: "'Roboto Slab', serif",
            fontWeight: 700,
          }}
        >
          Oops! Something went wrong
        </h3>

        <p className="text-[#4a6080] text-sm leading-6 mb-6">{message}</p>

        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0d1b2a] px-5 py-3 text-white hover:bg-[#1b3149] transition-all duration-200 hover:scale-[1.02]"
          style={{ fontWeight: 600 }}
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>

        <p className="mt-4 text-xs text-[#7b8ca6]">
          If the issue continues, please try again in a few moments.
        </p>
      </div>
    </motion.div>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-10 flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-full bg-[#0d1b2a]/6 flex items-center justify-center mb-4">
        <span className="text-[#4a6080]">{icon}</span>
      </div>
      <p className="text-[#0d1b2a] text-sm mb-1" style={{ fontWeight: 600 }}>
        {title}
      </p>
      <p className="text-[#4a6080] text-xs max-w-sm">{subtitle}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Skeleton className="lg:col-span-3 h-56" />
        <Skeleton className="lg:col-span-2 h-56" />
      </div>
      <Skeleton className="mt-4 h-48" />
    </div>
  );
}

type DashboardSectionProps = {
  data: DashboardResponse;
  interviewHistory: any[];
  latestInterview: any;
};

function DashboardSection({
  data,
  interviewHistory,
  latestInterview,
}: DashboardSectionProps) {
  const stats = data.stats ?? {
    questionsSolved: 0,
    codingTimeSeconds: 0,
    mockSessions: 0,
    weeklyImprovement: 0,
  };

  const [selectedScoreType, setSelectedScoreType] = useState<"real" | "mock">("real");

  const totalRealInterviews =
    data.totalCompletedRealInterviews ??
    stats.totalCompletedRealInterviews ??
    0;

  const totalMockInterviews =
    data.totalCompletedMockInterviews ??
    stats.totalCompletedMockInterviews ??
    interviewHistory.length;

  const realScore =
    data.averageRealInterviewScore ??
    stats.averageRealInterviewScore ??
    null;

  const averageScore = computeAverageMockScore(
    interviewHistory,
    latestInterview,
  );

  const progressHistory = interviewHistory
    .slice()
    .reverse()
    .map((item, index) => ({
      week: `Mock ${index + 1}`,
      score: item.score,
    }));

  const mockSessions = interviewHistory.map((item) => ({
    id: item.id,
    title: item.role,
    date: new Date(item.createdAt).toLocaleDateString(),
    duration: item.difficulty,
    score: item.score,
    status: "COMPLETED",
  }));

  const evaluation = latestInterview?.evaluation;

  const skillBreakdown = evaluation
    ? [
      {
        skill: "Confidence",
        score: evaluation.confidenceScore,
      },
      {
        skill: "Technical",
        score: evaluation.technicalScore,
      },
      {
        skill: "Readiness",
        score: evaluation.overallScore,
      },
      {
        skill: "Problem Solving",
        score: evaluation.problemSolvingScore,
      },
      {
        skill: "Communication",
        score: evaluation.communicationScore,
      },
    ]
    : [];
  return (
    <div>
      <SectionHeader
        title="Your Dashboard"
        subtitle="Improved performance this month."
      />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          icon={<CheckCircle className="w-4.5 h-4.5" />}
          label="Questions Solved"
          value={String(stats.questionsSolved)}
        />

        {/* Selectable Score Card */}
        <div className="rounded-2xl p-5 border bg-[#00bfa6] border-[#00bfa6] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/20">
                <span className="text-[#0d1b2a]">
                  {selectedScoreType === "real" ? (
                    <TrendingUp className="w-4.5 h-4.5" />
                  ) : (
                    <BarChart2 className="w-4.5 h-4.5" />
                  )}
                </span>
              </div>
              <div className="relative">
                <select
                  value={selectedScoreType}
                  onChange={(e) => setSelectedScoreType(e.target.value as "real" | "mock")}
                  className="appearance-none bg-white/20 hover:bg-white/30 text-[#0d1b2a] text-xs font-semibold py-1.5 pl-2 pr-6 rounded-lg cursor-pointer focus:outline-none transition-colors border-none"
                  aria-label="Select score type"
                >
                  <option value="real" className="bg-[#0d1b2a] text-white">
                    Real Interview Score
                  </option>
                  <option value="mock" className="bg-[#0d1b2a] text-white">
                    AI Mock Interview Score
                  </option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-1.5 top-2 text-[#0d1b2a]/70 pointer-events-none" />
              </div>
            </div>

            <div
              className="text-2xl mb-0.5 text-[#0d1b2a]"
              style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700 }}
            >
              {selectedScoreType === "real"
                ? (realScore != null ? String(Math.round(realScore)) : "N/A")
                : String(averageScore)}
            </div>

            <div className="text-sm text-[#0d1b2a]/80 font-medium">
              {selectedScoreType === "real" ? "Real Interview Score" : "AI Mock Interview Score"}
            </div>
          </div>

          <div className="text-xs mt-2 text-[#0d1b2a]/70">
            {selectedScoreType === "real"
              ? "Avg. score from interviewers"
              : "Avg. score from mock interviews"}
          </div>
        </div>

        <StatCard
          icon={<Video className="w-4.5 h-4.5" />}
          label="Real Interviews"
          value={String(totalRealInterviews)}
          sub="Completed sessions"
        />

        <StatCard
          icon={<Star className="w-4.5 h-4.5" />}
          label="Mock Sessions"
          value={String(totalMockInterviews)}
          sub="AI mock interviews"
        />

        <StatCard
          icon={<Clock className="w-4.5 h-4.5" />}
          label="Practice Hours"
          value={formatCodingTime(stats.codingTimeSeconds)}
          sub="Last 30 days"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
          <p
            className="text-[#0d1b2a] text-sm mb-4"
            style={{ fontWeight: 600 }}
          >
            AI Mock Interview Score
          </p>
          {progressHistory.length === 0 ? (
            <EmptyState
              icon={<TrendingUp className="w-5 h-5" />}
              title="No progress history yet"
              subtitle="Complete a mock interview to start tracking your mock interview score over time."
            />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={progressHistory}>
                <defs>
                  <linearGradient
                    id="cand-score-grad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#00bfa6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#00bfa6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: "#4a6080" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[40, 100]}
                  tick={{ fontSize: 11, fill: "#4a6080" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #dde6ef",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#00bfa6"
                  strokeWidth={2.5}
                  fill="url(#cand-score-grad)"
                  dot={{ r: 3, fill: "#00bfa6" }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
          <p
            className="text-[#0d1b2a] text-sm mb-2"
            style={{ fontWeight: 600 }}
          >
            Skill Breakdown
          </p>
          {skillBreakdown.every((s) => s.score === 0) ? (
            <EmptyState
              icon={<Brain className="w-5 h-5" />}
              title="No skill data yet"
              subtitle="Skill breakdown appears after your first mock interview."
            />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={skillBreakdown}>
                <PolarGrid stroke="#dde6ef" />
                <PolarAngleAxis
                  dataKey="skill"
                  tick={{ fontSize: 10, fill: "#4a6080" }}
                />
                <Radar
                  dataKey="score"
                  stroke="#00bfa6"
                  fill="#00bfa6"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      <div className="mt-4 bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
        <p className="text-[#0d1b2a] text-sm mb-4" style={{ fontWeight: 600 }}>
          Recent Mock Sessions
        </p>
        {(mockSessions ?? []).length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-5 h-5" />}
            title="No mock sessions yet"
            subtitle="Schedule or start an AI mock interview to see your sessions here."
          />
        ) : (
          <div className="space-y-3">
            {mockSessions.map((s) => {
              const isCompleted = s.status === "COMPLETED";

              return (
                <div
                  key={s.id}
                  className="flex items-center gap-4 p-3.5 rounded-xl bg-[#f0f4f8] hover:bg-[#e8f0f7] transition-colors"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isCompleted ? "bg-[#00bfa6]/15" : "bg-[#0d1b2a]/8"
                      }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4 text-[#00bfa6]" />
                    ) : (
                      <Calendar className="w-4 h-4 text-[#4a6080]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[#0d1b2a] text-sm"
                      style={{ fontWeight: 500 }}
                    >
                      {s.title}
                    </p>

                    <p className="text-[#4a6080] text-xs">
                      {s.date} · {s.duration}
                    </p>
                  </div>

                  {s.score !== null ? (
                    <span
                      className="text-[#00bfa6] text-sm"
                      style={{ fontWeight: 700 }}
                    >
                      {s.score}/100
                    </span>
                  ) : (
                    <span
                      className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full"
                      style={{ fontWeight: 500 }}
                    >
                      Scheduled
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PracticeSection({ questions }: { questions: PracticeQuestion[] }) {
  const [filter, setFilter] = useState<"All" | "EASY" | "MEDIUM" | "HARD">(
    "All",
  );
  const filtered =
    filter === "All"
      ? questions
      : questions.filter((q) => q.difficulty === filter);
  const navigate = useNavigate();
  const filters: {
    value: "All" | "EASY" | "MEDIUM" | "HARD";
    label: string;
  }[] = [
      { value: "All", label: "All" },
      { value: "EASY", label: "Easy" },
      { value: "MEDIUM", label: "Medium" },
      { value: "HARD", label: "Hard" },
    ];

  return (
    <div>
      <SectionHeader
        title="Practice Questions"
        subtitle="Curated by role and difficulty. Solve daily to boost your score."
      />
      <div className="flex gap-2 mb-5">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm border transition-all ${filter === f.value
              ? "bg-[#0d1b2a] text-white border-[#0d1b2a]"
              : "bg-white text-[#4a6080] border-[#0d1b2a]/12 hover:border-[#0d1b2a]/25"
              }`}
            style={{ fontWeight: filter === f.value ? 600 : 400 }}
          >
            {f.label}
          </button>
        ))}
        <div className="ml-auto text-[#4a6080] text-sm flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-[#00bfa6]" />
          {questions.filter((q) => q.done).length}/{questions.length} completed
        </div>
      </div>
      {questions.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-5 h-5" />}
          title="No practice questions available"
          subtitle="Check back soon — new questions are added regularly."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-5 h-5" />}
          title={`No ${filter} questions`}
          subtitle="Try a different difficulty filter."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 overflow-hidden">
          {filtered.map((q, i) => (
            <div
              key={q.id}
              className={`flex items-center gap-4 px-5 py-4 hover:bg-[#f0f4f8] transition-colors cursor-pointer ${i > 0 ? "border-t border-[#0d1b2a]/6" : ""}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${q.done ? "bg-[#00bfa6]/15" : "bg-[#0d1b2a]/5"}`}
              >
                {q.done ? (
                  <CheckCircle className="w-3.5 h-3.5 text-[#00bfa6]" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-[#0d1b2a]/20" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm ${q.done ? "text-[#4a6080] line-through" : "text-[#0d1b2a]"}`}
                  style={{ fontWeight: q.done ? 400 : 500 }}
                >
                  {q.title}
                </p>
                <p className="text-[#4a6080] text-xs mt-0.5">{q.topic}</p>
              </div>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full border ${diffColor[q.difficulty]}`}
                style={{ fontWeight: 500 }}
              >
                {q.difficulty.charAt(0) + q.difficulty.slice(1).toLowerCase()}
              </span>
              <button
                onClick={async () => {

                  navigate(`/codeeditor/${q.id}`);
                }}
                className="text-[#00bfa6] text-xs flex items-center gap-1 hover:underline"
              >
                <Play className="w-3 h-3" />
                Solve
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MockSection({
  result,
  sessions,
}: {
  result: MockResult | null;
  sessions: MockSession[];
}) {
  const completedSessions = sessions.filter((s) => s.status === "completed");

  const scoreMetrics = result
    ? [
      {
        label: "Technical",
        score: result.technical,
        color: "#0d1b2a",
        icon: <Code2 className="w-4 h-4" />,
      },
      {
        label: "Readiness",
        score: result.readiness,
        color: "#00bfa6",
        icon: <Target className="w-4 h-4" />,
      },
      {
        label: "Confidence",
        score: result.confidence,
        color: "#7c5cbf",
        icon: <Brain className="w-4 h-4" />,
      },
      {
        label: "Communication",
        score: result.communication,
        color: "#2196f3",
        icon: <MessageSquare className="w-4 h-4" />,
      },
      {
        label: "Problem-Solving",
        score: result.problemSolving,
        color: "#f59e0b",
        icon: <Lightbulb className="w-4 h-4" />,
      },
    ]
    : [];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="AI Mock Interview"
        subtitle="Practice with our AI interviewer. Get scored on clarity, depth, and speed."
      />

      {/* ── Last Session Results ── */}
      {!result ? (
        <EmptyState
          icon={<Bot className="w-5 h-5" />}
          title="No mock interviews completed yet"
          subtitle="Start your first AI mock interview to get scored on technical skill, confidence, and communication."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 overflow-hidden">
          {/* Header bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#0d1b2a]/8 bg-[#0d1b2a]">
            <div>
              <p className="text-white text-sm" style={{ fontWeight: 600 }}>
                Last Mock Session Results
              </p>
              <p className="text-white/50 text-xs mt-0.5">{result.session}</p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-[#00bfa6] text-2xl"
                style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700 }}
              >
                {result.overall}
              </span>
              <span className="text-white/40 text-sm">/100 overall</span>
            </div>
          </div>

          <div className="p-6">
            {/* Score rings row */}
            <div className="grid grid-cols-5 gap-4 mb-6">
              {scoreMetrics.map(({ label, score, color, icon }) => (
                <div
                  key={label}
                  className="bg-[#f8fafc] rounded-xl border border-[#0d1b2a]/6 p-4 flex flex-col items-center gap-2"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${color}18` }}
                  >
                    <span style={{ color }}>{icon}</span>
                  </div>
                  {/* Score arc */}
                  <div
                    className="relative flex items-center justify-center"
                    style={{ width: 56, height: 56 }}
                  >
                    <svg
                      width={56}
                      height={56}
                      style={{
                        transform: "rotate(-90deg)",
                        position: "absolute",
                      }}
                    >
                      <circle
                        cx={28}
                        cy={28}
                        r={22}
                        fill="none"
                        stroke="#dde6ef"
                        strokeWidth={5}
                      />
                      <circle
                        cx={28}
                        cy={28}
                        r={22}
                        fill="none"
                        stroke={color}
                        strokeWidth={5}
                        strokeDasharray={`${(score / 100) * (2 * Math.PI * 22)} ${2 * Math.PI * 22}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span
                      style={{
                        fontFamily: "'Roboto Slab', serif",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        color: "#0d1b2a",
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      {score}
                    </span>
                  </div>
                  <p
                    className="text-[#4a6080] text-xs text-center leading-tight"
                    style={{ fontWeight: 500 }}
                  >
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {/* Score bars */}
            <div className="space-y-3 mb-6">
              {scoreMetrics.map(({ label, score, color }) => (
                <ScoreBar
                  key={label}
                  label={label}
                  score={score}
                  color={color}
                />
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
                  <p
                    className="text-emerald-800 text-sm"
                    style={{ fontWeight: 600 }}
                  >
                    Strengths
                  </p>
                </div>
                <ul className="space-y-2">
                  {result.strengths && result.strengths.length > 0 ? (
                    result.strengths.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs text-emerald-700 leading-relaxed"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                        {item}
                      </li>
                    ))
                  ) : (
                    <li className="text-xs text-emerald-700">
                      No strengths available
                    </li>
                  )}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="bg-rose-50 border border-rose-200/70 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  </div>
                  <p
                    className="text-rose-800 text-sm"
                    style={{ fontWeight: 600 }}
                  >
                    Areas to Improve
                  </p>
                </div>
                <ul className="space-y-2">
                  {result.weaknesses && result.weaknesses.length > 0 ? (
                    result.weaknesses.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs text-rose-700 leading-relaxed"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
                        {item}
                      </li>
                    ))
                  ) : (
                    <li className="text-xs text-rose-700">
                      No improvement areas available
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Past sessions */}
      <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
        <p className="text-[#0d1b2a] text-sm mb-4" style={{ fontWeight: 600 }}>
          Past Sessions
        </p>
        {completedSessions.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-5 h-5" />}
            title="No past sessions"
            subtitle="Completed mock interviews will show up here."
          />
        ) : (
          <div className="space-y-3">
            {completedSessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-4 p-3.5 rounded-xl bg-[#f0f4f8]"
              >
                <div className="w-9 h-9 rounded-xl bg-[#00bfa6]/15 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-[#00bfa6]" />
                </div>
                <div className="flex-1">
                  <p
                    className="text-[#0d1b2a] text-sm"
                    style={{ fontWeight: 500 }}
                  >
                    {s.type}
                  </p>
                  <p className="text-[#4a6080] text-xs">
                    {s.date} · {s.duration}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="text-[#00bfa6] text-sm"
                    style={{ fontWeight: 700 }}
                  >
                    {s.score}/100
                  </p>
                  <button className="text-[#4a6080] text-xs hover:text-[#0d1b2a] flex items-center gap-1 mt-0.5">
                    Review <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function RoomsSection({ rooms }: { rooms: Room[] }) {
  return (
    <div>
      <SectionHeader
        title="My Rooms"
        subtitle="All your scheduled and completed interview sessions."
      />
      {rooms.length === 0 ? (
        <EmptyState
          icon={<Video className="w-5 h-5" />}
          title="No rooms yet"
          subtitle="Scheduled and completed interview rooms will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rooms.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-5 hover:border-[#00bfa6]/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#0d1b2a]/6 flex items-center justify-center">
                  <Video className="w-4.5 h-4.5 text-[#0d1b2a]" />
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full border ${r.status === "upcoming" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}
                  style={{ fontWeight: 500 }}
                >
                  {r.status === "upcoming" ? "Upcoming" : "Completed"}
                </span>
              </div>
              <h3
                className="text-[#0d1b2a] mb-1"
                style={{
                  fontFamily: "'Roboto Slab', serif",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                }}
              >
                {r.title}
              </h3>
              <p className="text-[#4a6080] text-xs mb-3">{r.host}</p>
              <div className="flex items-center justify-between text-xs text-[#4a6080]">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  {r.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  {r.duration}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-[#0d1b2a]/6 flex items-center justify-between">
                <span className="text-[#4a6080] text-xs font-mono bg-[#f0f4f8] px-2 py-0.5 rounded">
                  {r.id}
                </span>
                {r.status === "upcoming" ? (
                  <button
                    className="bg-[#00bfa6] text-[#0d1b2a] text-xs px-4 py-1.5 rounded-lg hover:bg-[#00d4b8] transition-colors"
                    style={{ fontWeight: 600 }}
                  >
                    Join Room
                  </button>
                ) : (
                  <button className="text-[#4a6080] text-xs hover:text-[#0d1b2a] flex items-center gap-1">
                    View replay <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CurrentRoomsSection() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<InterviewRoomRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);
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

  const joinRoom = async (roomId: string) => {
    setJoiningRoomId(roomId);
    setError("");
    try {
      await joinInterviewRoom(roomId);
      navigate(`/interview-room/${roomId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to join this interview room.");
    } finally {
      setJoiningRoomId(null);
    }
  };

  return (
    <div>
      <SectionHeader title="My Rooms" subtitle="Join interviews once the interviewer has started them." />
      {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-[#4a6080]">Loading interview rooms...</p>
      ) : rooms.length === 0 ? (
        <EmptyState icon={<Video className="w-5 h-5" />} title="No rooms yet" subtitle="Scheduled interview rooms will appear here." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rooms.map((room) => (
            <div key={room.roomId} className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-[#0d1b2a]" style={{ fontWeight: 600 }}>{room.title}</h3>
                  <p className="mt-1 text-xs text-[#4a6080]">{room.targetRole}</p>
                  <p className="mt-3 text-xs text-[#4a6080]">{room.roomId} · {room.interviewType}</p>
                </div>
                {room.status === "ACTIVE" ? (
                  <button
                    onClick={() => joinRoom(room.roomId)}
                    disabled={joiningRoomId === room.roomId}
                    className="bg-[#00bfa6] text-[#0d1b2a] text-xs px-4 py-2 rounded-lg hover:bg-[#00d4b8] transition-colors disabled:opacity-60"
                    style={{ fontWeight: 600 }}
                  >
                    {joiningRoomId === room.roomId ? "Joining..." : "Join Room"}
                  </button>
                ) : (
                  <span className="text-xs text-amber-700">Waiting for interviewer</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileSection({
  data,
  interviewHistory = [],
  latestInterview,
  onEdit,
}: {
  data: DashboardResponse;
  interviewHistory?: any[];
  latestInterview?: any;
  onEdit: () => void;
}) {
  const { user, skills = [], targets = [], experience = [], stats } = data;
  const averageMockScore = computeAverageMockScore(
    interviewHistory,
    latestInterview,
  );
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div>
      <SectionHeader
        title="Profile"
        subtitle="Your candidate profile visible to interviewers."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-7 flex flex-col items-center text-center">
          <div className="relative mb-4">
            {user.avatar ? (
              <img
                src={getAvatarUrl(user.avatar)}
                alt={user.name}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full bg-[#00bfa6] flex items-center justify-center text-[#0d1b2a] text-2xl"
                style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700 }}
              >
                {initials}
              </div>
            )}
          </div>
          <h3
            className="text-[#0d1b2a] mb-0.5"
            style={{
              fontFamily: "'Roboto Slab', serif",
              fontWeight: 700,
              fontSize: "1.1rem",
            }}
          >
            {user.name}
          </h3>
          <p className="text-[#4a6080] text-sm mb-1">{user.email}</p>
          <p className="text-[#4a6080] text-xs mb-4">
            {user.title} · {user.location}
          </p>
          <div className="flex gap-1.5 flex-wrap justify-center mb-5">
            {skills.map((s) => (
              <span
                key={s}
                className="text-xs bg-[#f0f4f8] text-[#4a6080] border border-[#0d1b2a]/8 px-2.5 py-1 rounded-full"
              >
                {s}
              </span>
            ))}
          </div>
          <div className="w-full border-t border-[#0d1b2a]/8 pt-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { v: String(averageMockScore), l: "Score" },
                { v: String(stats.mockSessions), l: "Mocks" },
                { v: String(stats.questionsSolved), l: "Solved" },
              ].map(({ v, l }) => (
                <div key={l}>
                  <p
                    className="text-[#0d1b2a] text-lg"
                    style={{
                      fontFamily: "'Roboto Slab', serif",
                      fontWeight: 700,
                    }}
                  >
                    {v}
                  </p>
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
            <p
              className="text-[#0d1b2a] text-sm mb-3"
              style={{ fontWeight: 600 }}
            >
              About
            </p>
            <p className="text-[#4a6080] text-sm leading-relaxed">
              {user.about || "No bio added yet."}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
            <p
              className="text-[#0d1b2a] text-sm mb-4"
              style={{ fontWeight: 600 }}
            >
              Target Roles & Companies
            </p>
            {targets.length === 0 ? (
              <p className="text-[#4a6080] text-xs">
                No target roles added yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {targets.map((t) => (
                  <span
                    key={t}
                    className="text-xs bg-[#00bfa6]/10 text-[#00bfa6] border border-[#00bfa6]/20 px-3 py-1 rounded-full"
                    style={{ fontWeight: 500 }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
            <p
              className="text-[#0d1b2a] text-sm mb-4"
              style={{ fontWeight: 600 }}
            >
              Experience
            </p>
            {experience.length === 0 ? (
              <p className="text-[#4a6080] text-xs">No experience added yet.</p>
            ) : (
              <div className="space-y-4">
                {experience.map((exp, idx) => {
                  const jobTitle = exp.title || exp.role || "Role";
                  const companyName = exp.company || "";
                  const periodText = getExperiencePeriodText(exp);
                  return (
                    <div
                      key={exp.id || `${jobTitle}-${companyName}-${idx}`}
                      className="flex items-start gap-3.5"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#0d1b2a]/6 flex items-center justify-center shrink-0 mt-0.5">
                        <Briefcase className="w-4 h-4 text-[#4a6080]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p
                            className="text-[#0d1b2a] text-sm"
                            style={{ fontWeight: 600 }}
                          >
                            {jobTitle}
                          </p>
                          {companyName && (
                            <>
                              <span className="text-[#4a6080] text-sm">·</span>
                              <p className="text-[#4a6080] text-sm font-medium">
                                {companyName}
                              </p>
                            </>
                          )}
                          {exp.current && (
                            <span className="text-[10px] bg-[#00bfa6]/15 text-[#00bfa6] font-semibold px-2 py-0.5 rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        {periodText && (
                          <p className="text-[#4a6080] text-xs mt-0.5">
                            {periodText}
                          </p>
                        )}
                        {exp.description && (
                          <p className="text-[#4a6080] text-xs mt-1.5 leading-relaxed whitespace-pre-line">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EditProfileSection({
  data,
  onBack,
  onProfileSaved,
}: {
  data: DashboardResponse;
  onBack: () => void;
  onProfileSaved: (
    user: UserProfile,
    skills: string[],
    targets: string[],
    experience: Experience[],
  ) => void;
}) {
  const { user } = data;

  const [skills, setSkills] = useState<string[]>(data.skills ?? []);
  const [targets, setTargets] = useState<string[]>(data.targets ?? []);
  const [experiences, setExperiences] = useState<Experience[]>(() => {
    return Array.isArray(data.experience)
      ? data.experience.map((e) => ({
          id:
            e.id ||
            (typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : Math.random().toString(36).slice(2)),
          title: e.title || e.role || "",
          company: e.company || "",
          startDate: e.startDate || "",
          endDate: e.endDate || "",
          current: Boolean(e.current),
          description: e.description || "",
          period: e.period || "",
        }))
      : [];
  });

  const [newSkill, setNewSkill] = useState("");
  const [skillError, setSkillError] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [targetError, setTargetError] = useState("");

  const [avatar, setAvatar] = useState<string | null>(user.avatar ?? null);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarSuccess, setAvatarSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    title: user.title ?? "",
    location: user.location ?? "",
    about: user.about ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Experience form state
  const [isExpFormOpen, setIsExpFormOpen] = useState(false);
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [expForm, setExpForm] = useState({
    title: "",
    company: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
  });
  const [expFormError, setExpFormError] = useState("");

  const inputCls =
    "w-full bg-[#f0f4f8] border border-[#0d1b2a]/10 rounded-xl px-4 py-3 text-[#0d1b2a] placeholder-[#4a6080]/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#00bfa6]/30 focus:border-[#00bfa6]/60 transition-all";

  function addSkill() {
    const value = newSkill.trim();
    if (!value) return;
    if (skills.some((s) => s.trim().toLowerCase() === value.toLowerCase())) {
      setSkillError("Skill is already in your list.");
      return;
    }
    setSkillError("");
    setSkills((prev) => [...prev, value]);
    setNewSkill("");
  }

  function removeSkill(skillToRemove: string) {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  }

  function addTarget() {
    const value = newTarget.trim();
    if (!value) return;
    if (targets.some((t) => t.trim().toLowerCase() === value.toLowerCase())) {
      setTargetError("This target role or company is already in your list.");
      return;
    }
    setTargetError("");
    setTargets((prev) => [...prev, value]);
    setNewTarget("");
  }

  function removeTarget(targetToRemove: string) {
    setTargets((prev) => prev.filter((t) => t !== targetToRemove));
  }

  function startAddExperience() {
    setExpForm({
      title: "",
      company: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
    });
    setEditingExpId(null);
    setExpFormError("");
    setIsExpFormOpen(true);
  }

  function startEditExperience(exp: Experience) {
    setExpForm({
      title: exp.title || exp.role || "",
      company: exp.company || "",
      startDate: exp.startDate || "",
      endDate: exp.endDate || "",
      current: Boolean(exp.current),
      description: exp.description || "",
    });
    setEditingExpId(exp.id || null);
    setExpFormError("");
    setIsExpFormOpen(true);
  }

  function cancelExpForm() {
    setExpForm({
      title: "",
      company: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
    });
    setEditingExpId(null);
    setExpFormError("");
    setIsExpFormOpen(false);
  }

  function handleSaveExperienceEntry() {
    const title = expForm.title.trim();
    const company = expForm.company.trim();

    if (!title) {
      setExpFormError("Job title is required.");
      return;
    }
    if (!company) {
      setExpFormError("Company name is required.");
      return;
    }

    if (!expForm.current && expForm.startDate && expForm.endDate) {
      if (expForm.endDate < expForm.startDate) {
        setExpFormError("End date cannot precede start date.");
        return;
      }
    }

    setExpFormError("");

    const entryId =
      editingExpId ||
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2));

    const updatedEntry: Experience = {
      id: entryId,
      title,
      role: title,
      company,
      startDate: expForm.startDate || undefined,
      endDate: expForm.current ? null : expForm.endDate || null,
      current: expForm.current,
      description: expForm.description.trim() || null,
    };
    updatedEntry.period = getExperiencePeriodText(updatedEntry);

    if (editingExpId) {
      setExperiences((prev) =>
        prev.map((item) => (item.id === editingExpId ? updatedEntry : item)),
      );
    } else {
      setExperiences((prev) => [...prev, updatedEntry]);
    }

    cancelExpForm();
  }

  function removeExperience(idToRemove?: string) {
    if (!idToRemove) return;
    setExperiences((prev) => prev.filter((item) => item.id !== idToRemove));
    if (editingExpId === idToRemove) {
      cancelExpForm();
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setAvatarError("");
    setAvatarSuccess("");

    if (file.size > 4 * 1024 * 1024) {
      setAvatarError("Image file size must be less than 4 MB.");
      return;
    }

    const validMimes = ["image/jpeg", "image/png", "image/gif"];
    if (!validMimes.includes(file.type)) {
      setAvatarError("Only JPG, PNG, and GIF images are allowed.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPreviewAvatar(previewUrl);

    setAvatarLoading(true);
    try {
      const updated = await uploadAvatarApi(file);
      const newAvatarUrl = updated.avatar ?? null;
      setAvatar(newAvatarUrl);
      setPreviewAvatar(null);
      setAvatarSuccess("Profile photo updated successfully!");
      onProfileSaved(
        { ...user, avatar: newAvatarUrl },
        skills,
        targets,
        experiences,
      );
      try {
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem(
          "user",
          JSON.stringify({ ...stored, avatar: newAvatarUrl }),
        );
      } catch {}
    } catch (err: any) {
      setPreviewAvatar(null);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to upload profile photo.";
      setAvatarError(msg);
    } finally {
      setAvatarLoading(false);
    }
  }

  async function handleRemovePhoto() {
    if (!avatar && !previewAvatar) return;
    setAvatarLoading(true);
    setAvatarError("");
    setAvatarSuccess("");
    try {
      await removeAvatarApi();
      setAvatar(null);
      setPreviewAvatar(null);
      setAvatarSuccess("Profile photo removed.");
      onProfileSaved(
        { ...user, avatar: null },
        skills,
        targets,
        experiences,
      );
      try {
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem(
          "user",
          JSON.stringify({ ...stored, avatar: null }),
        );
      } catch {}
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to remove profile photo.";
      setAvatarError(msg);
    } finally {
      setAvatarLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    try {
      const updated = await updateProfile({
        name: form.name,
        email: form.email,
        title: form.title,
        location: form.location,
        about: form.about,
        skills,
        targets,
        experience: experiences,
      });
      onProfileSaved(
        { ...updated, avatar },
        skills,
        targets,
        experiences,
      );
      onBack();
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-lg bg-white border border-[#0d1b2a]/10 flex items-center justify-center text-[#4a6080] hover:text-[#0d1b2a] transition-colors"
        >
          ←
        </button>
        <div>
          <h2
            className="text-[#0d1b2a]"
            style={{
              fontFamily: "'Roboto Slab', serif",
              fontWeight: 700,
              fontSize: "1.35rem",
            }}
          >
            Edit Profile
          </h2>
          <p className="text-[#4a6080] text-sm">
            Update your candidate profile details.
          </p>
        </div>
      </div>

      {saveError && (
        <div className="mb-5 flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {saveError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar card */}
        <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-7 flex flex-col items-center text-center h-fit">
          <div className="relative mb-5">
            {previewAvatar || avatar ? (
              <img
                src={getAvatarUrl(previewAvatar || avatar)}
                alt={form.name}
                className="w-24 h-24 rounded-full object-cover"
                onError={() => {
                  setPreviewAvatar(null);
                  setAvatar(null);
                }}
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full bg-[#00bfa6] flex items-center justify-center text-[#0d1b2a] text-3xl"
                style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700 }}
              >
                {form.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarLoading}
              title="Change Photo"
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#0d1b2a] flex items-center justify-center shadow-lg hover:bg-[#1a2f45] transition-colors disabled:opacity-50"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <p
            className="text-[#0d1b2a] text-sm mb-1"
            style={{ fontWeight: 600 }}
          >
            Profile Photo
          </p>
          <p className="text-[#4a6080] text-xs mb-4">
            JPG, PNG or GIF · Max 4MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarLoading}
            className="w-full flex items-center justify-center gap-2 border border-[#0d1b2a]/15 text-[#0d1b2a] text-sm py-2 rounded-xl hover:bg-[#f0f4f8] transition-colors disabled:opacity-50"
            style={{ fontWeight: 500 }}
          >
            {avatarLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              "Upload Photo"
            )}
          </button>
          <button
            type="button"
            onClick={handleRemovePhoto}
            disabled={avatarLoading || (!avatar && !previewAvatar)}
            className="mt-2 w-full text-rose-500 text-sm py-2 rounded-xl hover:bg-rose-50 transition-colors disabled:opacity-40"
            style={{ fontWeight: 500 }}
          >
            Remove Photo
          </button>

          {avatarSuccess && (
            <div className="mt-3 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg w-full">
              {avatarSuccess}
            </div>
          )}
          {avatarError && (
            <div className="mt-3 text-xs text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg w-full">
              {avatarError}
            </div>
          )}
        </div>

        {/* Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Basic info */}
          <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
            <p
              className="text-[#0d1b2a] text-sm mb-4"
              style={{ fontWeight: 600 }}
            >
              Basic Information
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-[#0d1b2a] text-xs mb-1.5"
                  style={{ fontWeight: 500 }}
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4a6080]" />
                  <input
                    className={`${inputCls} pl-10`}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label
                  className="block text-[#0d1b2a] text-xs mb-1.5"
                  style={{ fontWeight: 500 }}
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4a6080]" />
                  <input
                    type="email"
                    className={`${inputCls} pl-10`}
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label
                  className="block text-[#0d1b2a] text-xs mb-1.5"
                  style={{ fontWeight: 500 }}
                >
                  Job Title
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4a6080]" />
                  <input
                    className={`${inputCls} pl-10`}
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label
                  className="block text-[#0d1b2a] text-xs mb-1.5"
                  style={{ fontWeight: 500 }}
                >
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4a6080]" />
                  <input
                    className={`${inputCls} pl-10`}
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
            <label
              className="block text-[#0d1b2a] text-sm mb-3"
              style={{ fontWeight: 600 }}
            >
              About / Bio
            </label>
            <textarea
              className={`${inputCls} resize-none h-28`}
              value={form.about}
              onChange={(e) => setForm({ ...form, about: e.target.value })}
              maxLength={400}
            />
            <p className="text-[#4a6080] text-xs mt-1.5">
              {form.about.length}/400 characters
            </p>
          </div>

          {/* Skills */}
          <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
            <div className="flex items-center justify-between mb-3">
              <p
                className="text-[#0d1b2a] text-sm font-semibold"
              >
                Skills
              </p>
              <span className="text-[#4a6080] text-xs">
                {skills.length} {skills.length === 1 ? "skill" : "skills"}
              </span>
            </div>
            {skills.length === 0 ? (
              <p className="text-[#4a6080] text-xs mb-3">
                No skills added yet. Add your key technical skills below.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 mb-3">
                {skills.map((s) => (
                  <span
                    key={s}
                    className="flex items-center gap-1.5 text-xs bg-[#00bfa6]/10 text-[#00bfa6] border border-[#00bfa6]/20 px-2.5 py-1 rounded-full font-medium"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => removeSkill(s)}
                      className="hover:text-rose-500 transition-colors"
                      title={`Remove ${s}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                className={`${inputCls} flex-1`}
                placeholder="Add a skill (e.g. React, Java, TypeScript)…"
                value={newSkill}
                onChange={(e) => {
                  setNewSkill(e.target.value);
                  if (skillError) setSkillError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
              />
              <button
                type="button"
                onClick={addSkill}
                className="bg-[#0d1b2a] text-white px-4 rounded-xl hover:bg-[#1a2f45] transition-colors flex items-center justify-center shrink-0"
                title="Add skill"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {skillError && (
              <p className="text-rose-500 text-xs mt-1.5">{skillError}</p>
            )}
          </div>

          {/* Target roles */}
          <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
            <div className="flex items-center justify-between mb-3">
              <p
                className="text-[#0d1b2a] text-sm font-semibold"
              >
                Target Roles & Companies
              </p>
              <span className="text-[#4a6080] text-xs">
                {targets.length} {targets.length === 1 ? "entry" : "entries"}
              </span>
            </div>
            {targets.length === 0 ? (
              <p className="text-[#4a6080] text-xs mb-3">
                No target roles or companies added yet. Add some below.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 mb-3">
                {targets.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1.5 text-xs bg-[#f0f4f8] text-[#0d1b2a] border border-[#0d1b2a]/10 px-2.5 py-1 rounded-full font-medium"
                  >
                    <span>{t}</span>
                    <button
                      type="button"
                      onClick={() => removeTarget(t)}
                      className="text-[#4a6080] hover:text-rose-500 transition-colors"
                      title={`Remove ${t}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                className={`${inputCls} flex-1`}
                placeholder="e.g. Frontend Engineer, Google, Staff Engineer, Stripe…"
                value={newTarget}
                onChange={(e) => {
                  setNewTarget(e.target.value);
                  if (targetError) setTargetError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTarget();
                  }
                }}
              />
              <button
                type="button"
                onClick={addTarget}
                className="bg-[#0d1b2a] text-white px-4 rounded-xl hover:bg-[#1a2f45] transition-colors flex items-center justify-center shrink-0"
                title="Add target role or company"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {targetError && (
              <p className="text-rose-500 text-xs mt-1.5">{targetError}</p>
            )}
          </div>

          {/* Experience Section */}
          <div className="bg-white rounded-2xl border border-[#0d1b2a]/8 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p
                  className="text-[#0d1b2a] text-sm font-semibold"
                >
                  Experience
                </p>
                <p className="text-[#4a6080] text-xs mt-0.5">
                  Highlight your past and current roles.
                </p>
              </div>
              {!isExpFormOpen && (
                <button
                  type="button"
                  onClick={startAddExperience}
                  className="flex items-center gap-1.5 text-xs bg-[#0d1b2a] text-white px-3 py-1.5 rounded-lg hover:bg-[#1a2f45] transition-colors font-medium"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Experience
                </button>
              )}
            </div>

            {/* List of existing experiences */}
            {experiences.length === 0 && !isExpFormOpen ? (
              <p className="text-[#4a6080] text-xs">
                No experience added yet. Click &quot;Add Experience&quot; to add your work history.
              </p>
            ) : (
              <div className="space-y-3 mb-4">
                {experiences.map((exp) => (
                  <div
                    key={exp.id || `${exp.title || exp.role}-${exp.company}`}
                    className="flex items-start justify-between p-3.5 rounded-xl bg-[#f0f4f8] border border-[#0d1b2a]/8 hover:border-[#0d1b2a]/15 transition-all"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#0d1b2a]/6 flex items-center justify-center shrink-0 mt-0.5">
                        <Briefcase className="w-4 h-4 text-[#4a6080]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-[#0d1b2a]">
                            {exp.title || exp.role}
                          </span>
                          <span className="text-sm text-[#4a6080]">·</span>
                          <span className="text-sm font-medium text-[#4a6080]">
                            {exp.company}
                          </span>
                          {exp.current && (
                            <span className="text-[10px] bg-[#00bfa6]/15 text-[#00bfa6] font-semibold px-2 py-0.5 rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#4a6080] mt-0.5">
                          {getExperiencePeriodText(exp)}
                        </p>
                        {exp.description && (
                          <p className="text-xs text-[#4a6080]/90 mt-1 leading-relaxed whitespace-pre-line line-clamp-2">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={() => startEditExperience(exp)}
                        className="p-1.5 text-[#4a6080] hover:text-[#0d1b2a] hover:bg-white rounded-lg transition-colors"
                        title="Edit entry"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeExperience(exp.id)}
                        className="p-1.5 text-[#4a6080] hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
                        title="Remove entry"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Experience Add/Edit Form */}
            {isExpFormOpen && (
              <div className="mt-4 p-4 rounded-xl border border-[#00bfa6]/30 bg-[#00bfa6]/5 space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <p className="text-[#0d1b2a] text-xs font-semibold">
                    {editingExpId ? "Edit Experience Entry" : "New Experience Entry"}
                  </p>
                  <button
                    type="button"
                    onClick={cancelExpForm}
                    className="text-[#4a6080] hover:text-[#0d1b2a] text-xs"
                  >
                    Cancel
                  </button>
                </div>

                {expFormError && (
                  <div className="flex items-center gap-1.5 text-rose-600 text-xs bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{expFormError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#0d1b2a] mb-1">
                      Job Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      className={inputCls}
                      placeholder="e.g. Software Engineer"
                      value={expForm.title}
                      onChange={(e) =>
                        setExpForm({ ...expForm, title: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#0d1b2a] mb-1">
                      Company Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      className={inputCls}
                      placeholder="e.g. Google, Stripe, Startup"
                      value={expForm.company}
                      onChange={(e) =>
                        setExpForm({ ...expForm, company: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#0d1b2a] mb-1">
                      Start Date
                    </label>
                    <input
                      type="month"
                      className={inputCls}
                      value={expForm.startDate}
                      onChange={(e) =>
                        setExpForm({ ...expForm, startDate: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#0d1b2a] mb-1">
                      End Date {expForm.current && <span className="text-[#4a6080] font-normal">(Present)</span>}
                    </label>
                    <input
                      type="month"
                      disabled={expForm.current}
                      className={`${inputCls} ${
                        expForm.current
                          ? "opacity-60 cursor-not-allowed bg-slate-100"
                          : ""
                      }`}
                      value={expForm.current ? "" : expForm.endDate}
                      onChange={(e) =>
                        setExpForm({ ...expForm, endDate: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    id="current-position-toggle"
                    type="checkbox"
                    checked={expForm.current}
                    onChange={(e) =>
                      setExpForm({
                        ...expForm,
                        current: e.target.checked,
                        endDate: e.target.checked ? "" : expForm.endDate,
                      })
                    }
                    className="w-4 h-4 rounded text-[#00bfa6] focus:ring-[#00bfa6]/30 border-[#0d1b2a]/20 cursor-pointer accent-[#00bfa6]"
                  />
                  <label
                    htmlFor="current-position-toggle"
                    className="text-xs text-[#0d1b2a] font-medium cursor-pointer select-none"
                  >
                    Current Position (I currently work here)
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#0d1b2a] mb-1">
                    Responsibilities & Achievements <span className="text-[#4a6080] font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    className={`${inputCls} resize-none`}
                    placeholder="Briefly describe your key responsibilities, technologies used, or impact…"
                    value={expForm.description}
                    onChange={(e) =>
                      setExpForm({ ...expForm, description: e.target.value })
                    }
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={cancelExpForm}
                    className="px-3.5 py-1.5 text-xs text-[#4a6080] hover:text-[#0d1b2a] rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveExperienceEntry}
                    className="bg-[#00bfa6] text-[#0d1b2a] px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#00d4b8] transition-colors"
                  >
                    {editingExpId ? "Update Entry" : "Add Entry"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Save / Cancel */}
          <div className="flex items-center justify-end gap-3 pb-2">
            <button
              onClick={onBack}
              disabled={saving}
              className="px-6 py-2.5 border border-[#0d1b2a]/15 text-[#4a6080] text-sm rounded-xl hover:text-[#0d1b2a] hover:bg-[#f0f4f8] transition-colors disabled:opacity-50"
              style={{ fontWeight: 500 }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-[#00bfa6] text-[#0d1b2a] text-sm px-6 py-2.5 rounded-xl hover:bg-[#00d4b8] transition-colors disabled:opacity-60"
              style={{ fontWeight: 600 }}
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CandidateDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(
    null,
  );

  const [interviewHistory, setInterviewHistory] = useState<any[]>([]);
  const [latestInterview, setLatestInterview] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchDashboard();
      setDashboardData(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading your dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const loadInterviewHistory = async () => {
      try {
        const history = await getHistory();

        setInterviewHistory(history);

        if (history.length > 0) {
          const latest = history[0];

          const details = await getInterviewById(latest.id);

          setLatestInterview(details);
        }
      } catch (error) {
        console.error("Failed to load interview history", error);
      }
    };

    loadInterviewHistory();
  }, []);

  function handleProfileSaved(
    user: UserProfile,
    skills: string[],
    targets: string[],
    experience?: Experience[],
  ) {
    setDashboardData((prev) =>
      prev
        ? {
            ...prev,
            user,
            skills,
            targets,
            experience: experience ?? prev.experience ?? [],
          }
        : prev,
    );
  }

  const userName = dashboardData?.user?.name ?? "Candidate";
  const userInitials = userName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const mockResult = latestInterview
    ? {
      overall: latestInterview.evaluation.overallScore,

      technical: latestInterview.evaluation.technicalScore,

      // If your backend doesn't provide readiness,
      // decide whether to add it to the API or remove it from the UI.
      readiness: latestInterview.evaluation.overallScore,

      confidence: latestInterview.evaluation.confidenceScore,

      communication: latestInterview.evaluation.communicationScore,

      problemSolving: latestInterview.evaluation.problemSolvingScore,

      strengths: latestInterview.evaluation.strengths,

      weaknesses: latestInterview.evaluation.weaknesses,

      session: new Date(latestInterview.createdAt).toLocaleDateString(),
    }
    : null;

  function renderBody() {
    if (loading) {
      return <DashboardSkeleton />;
    }
    if (error) {
      return <ErrorState message={error} onRetry={loadDashboard} />;
    }
    if (!dashboardData) {
      return (
        <EmptyState
          icon={<Inbox className="w-5 h-5" />}
          title="No dashboard data"
          subtitle="We couldn't find any data for your account yet."
        />
      );
    }

    switch (activeSection) {
      case "dashboard":
        return (
          <DashboardSection
            data={dashboardData}
            interviewHistory={interviewHistory}
            latestInterview={latestInterview}
          />
        );
      case "practice":
        return <PracticeSection questions={dashboardData.practiceQuestions} />;
      case "mock":
        return (
          <MockSection
            // result={dashboardData.lastMockResult ?? null}
            // sessions={dashboardData.mockSessions ?? []}
            result={mockResult}
            sessions={interviewHistory.map((item) => ({
              id: item.id,
              type: item.role,
              date: new Date(item.createdAt).toLocaleDateString(),
              duration: item.difficulty,
              topics: [],
              score: item.score,
              status: "completed",
            }))}
          />
        );
      case "rooms":
        return <CurrentRoomsSection />;
      case "profile":
        return (
          <ProfileSection
            data={dashboardData}
            interviewHistory={interviewHistory}
            latestInterview={latestInterview}
            onEdit={() => setActiveSection("edit-profile")}
          />
        );
      case "edit-profile":
        return (
          <EditProfileSection
            data={dashboardData}
            onBack={() => setActiveSection("profile")}
            onProfileSaved={handleProfileSaved}
          />
        );
      default:
        return null;
    }
  }

  return (
    <DashboardLayout
      role="candidate"
      navItems={navItems}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      userName={userName}
      userInitials={userInitials}
      userAvatar={dashboardData?.user?.avatar}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-[#0d1b2a] leading-tight"
            style={{
              fontFamily: "'Roboto Slab', serif",
              fontWeight: 700,
              fontSize: "1.55rem",
            }}
          >
            Welcome back, {dashboardData?.user?.name ?? "there"} 👋
          </h1>
          <p className="text-[#4a6080] text-sm mt-0.5">
            Start your journey with us.
          </p>
        </div>
        <button
          // onClick={() => setActiveSection("mock")}
          onClick={() => navigate("/ai-mock")}
          className="hidden sm:flex items-center gap-2 bg-[#00bfa6] text-[#0d1b2a] px-5 py-2.5 rounded-xl hover:bg-[#00d4b8] transition-colors"
          style={{ fontWeight: 600, fontSize: "0.875rem" }}
        >
          <Play className="w-3.5 h-3.5" /> Start Mock
        </button>
      </div>

      {renderBody()}
    </DashboardLayout>
  );
}
