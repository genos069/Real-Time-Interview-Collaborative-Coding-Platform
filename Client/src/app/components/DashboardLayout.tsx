import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import { Video, Bell, ChevronDown, Menu, X, LogOut, CheckCircle, Clock, Calendar } from "lucide-react";

type NavItem = {
  icon: React.ReactNode;
  label: string;
  id: string;
};

type Notification = {
  id: number;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  icon: React.ReactNode;
};

type Props = {
  role: "candidate" | "interviewer";
  navItems: NavItem[];
  activeSection: string;
  onSectionChange: (id: string) => void;
  children: React.ReactNode;
  userName?: string;
  userInitials?: string;
  notifications?: Notification[];
};

const defaultCandidateNotifications: Notification[] = [
  {
    id: 1,
    title: "Interview Scheduled",
    desc: "Google L5 — Technical with Sarah on Jun 16 at 3:00 PM",
    time: "2h ago",
    read: false,
    icon: <Calendar className="w-3.5 h-3.5 text-[#00bfa6]" />,
  },
  {
    id: 2,
    title: "AI Feedback Ready",
    desc: "Your Behavioral Round from Jun 12 has been scored.",
    time: "1d ago",
    read: false,
    icon: <CheckCircle className="w-3.5 h-3.5 text-[#00bfa6]" />,
  },
  {
    id: 3,
    title: "Mock Session Reminder",
    desc: "System Design session starts in 30 minutes.",
    time: "2d ago",
    read: true,
    icon: <Clock className="w-3.5 h-3.5 text-[#4a6080]" />,
  },
];

const defaultInterviewerNotifications: Notification[] = [
  {
    id: 1,
    title: "Candidate Confirmed",
    desc: "Priya Nair confirmed for Jun 16 at 2:00 PM.",
    time: "3h ago",
    read: false,
    icon: <CheckCircle className="w-3.5 h-3.5 text-[#4d9de0]" />,
  },
  {
    id: 2,
    title: "Scorecard Due",
    desc: "Complete James Wright's evaluation by Jun 22.",
    time: "1d ago",
    read: true,
    icon: <Clock className="w-3.5 h-3.5 text-[#4a6080]" />,
  },
];

export function DashboardLayout({
  role,
  navItems,
  activeSection,
  onSectionChange,
  children,
  userName = "Arjun Mehta",
  userInitials = "AM",
  notifications,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const initialNotifs = notifications ?? (role === "candidate" ? defaultCandidateNotifications : defaultInterviewerNotifications);
  const [notifList, setNotifList] = useState(initialNotifs);

  const allNotifs = notifList;

  function dismissNotif(id: number) {
    setNotifList((prev) => prev.filter((n) => n.id !== id));
  }
  const unread = allNotifs.filter((n) => !n.read).length;

  const avatarColor = role === "candidate" ? "bg-[#00bfa6]" : "bg-[#1a4a7a]";
  const accentText = role === "candidate" ? "text-[#00bfa6]" : "text-[#4d9de0]";
  const accentBg = role === "candidate" ? "bg-[#00bfa6]/10 border-[#00bfa6]/20" : "bg-[#4d9de0]/10 border-[#4d9de0]/20";
  const accentFg = role === "candidate" ? "text-[#00bfa6]" : "text-[#4d9de0]";
  const dotColor = role === "candidate" ? "bg-[#00bfa6]" : "bg-[#4d9de0]";

  // Close dropdowns on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 bg-[#0d1b2a] flex flex-col transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/8 shrink-0">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#00bfa6] flex items-center justify-center">
              <Video className="w-3.5 h-3.5 text-[#0d1b2a]" />
            </div>
            <span className="text-white text-base" style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 600 }}>
              InterviewAI
            </span>
          </Link>
          <button className="lg:hidden text-white/50 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className={`inline-flex items-center gap-1.5 ${accentBg} border text-xs px-2.5 py-1 rounded-full ${accentFg}`} style={{ fontWeight: 600 }}>
            <div className="w-1.5 h-1.5 rounded-full bg-current" />
            {role === "candidate" ? "Candidate" : "Interviewer"}
          </div>
        </div>

        <nav className="flex-1 px-3 pb-4 overflow-y-auto">
          <p className="text-white/25 text-[10px] uppercase tracking-widest px-2 mb-2" style={{ fontWeight: 600 }}>
            Menu
          </p>
          {navItems.map(({ icon, label, id }) => {
            const active = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => { onSectionChange(id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm transition-all ${
                  active
                    ? role === "candidate"
                      ? "bg-[#00bfa6]/15 text-[#00bfa6]"
                      : "bg-[#4d9de0]/15 text-[#4d9de0]"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
                style={{ fontWeight: active ? 600 : 400 }}
              >
                <span className={active ? accentFg : ""}>{icon}</span>
                {label}
              </button>
            );
          })}
        </nav>

        {/* Sidebar profile */}
        <div className="px-3 pb-5 border-t border-white/8 pt-4">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors"
          >
            <div className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-xs text-[#0d1b2a]`} style={{ fontWeight: 700 }}>
              {userInitials}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-white text-sm truncate" style={{ fontWeight: 500 }}>{userName}</p>
              <p className="text-white/35 text-xs">{role === "candidate" ? "Candidate" : "Interviewer"}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-white/30" />
          </button>
          {profileOpen && (
            <div className="mt-1 bg-[#112233] rounded-xl border border-white/8 overflow-hidden">
              <Link to="/" className="flex items-center gap-2 px-4 py-2.5 text-white/60 hover:text-white hover:bg-white/5 text-sm transition-colors">
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </Link>
            </div>
          )}
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-[#0d1b2a]/8 h-16 flex items-center justify-between px-6">
          <button className="lg:hidden text-[#4a6080] hover:text-[#0d1b2a]" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden lg:flex items-center gap-1 text-sm text-[#4a6080]">
            <Link to="/" className="hover:text-[#0d1b2a] transition-colors">Home</Link>
            <span className="mx-1">/</span>
            <span className={`${accentText}`} style={{ fontWeight: 500 }}>
              {navItems.find((n) => n.id === activeSection)?.label ?? "Dashboard"}
            </span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Notification bell */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative w-9 h-9 rounded-full bg-[#f0f4f8] flex items-center justify-center text-[#4a6080] hover:text-[#0d1b2a] hover:bg-[#dde6ef] transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unread > 0 && (
                  <span className={`absolute top-1.5 right-1.5 w-2 h-2 ${dotColor} rounded-full border border-white`} />
                )}
              </button>

              {/* Notification dropdown */}
              {notifOpen && (
                <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl border border-[#0d1b2a]/10 shadow-xl shadow-[#0d1b2a]/8 overflow-hidden z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#0d1b2a]/8">
                    <p className="text-[#0d1b2a] text-sm" style={{ fontWeight: 600 }}>Notifications</p>
                    {unread > 0 && (
                      <span className={`text-xs ${role === "candidate" ? "bg-[#00bfa6]/15 text-[#00bfa6]" : "bg-[#4d9de0]/15 text-[#4d9de0]"} px-2 py-0.5 rounded-full`} style={{ fontWeight: 600 }}>
                        {unread} new
                      </span>
                    )}
                  </div>

                  {allNotifs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center px-6">
                      <div className="w-10 h-10 rounded-full bg-[#f0f4f8] flex items-center justify-center mb-3">
                        <Bell className="w-5 h-5 text-[#4a6080]/40" />
                      </div>
                      <p className="text-[#0d1b2a] text-sm" style={{ fontWeight: 500 }}>All caught up!</p>
                      <p className="text-[#4a6080] text-xs mt-1">No new notifications right now.</p>
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto">
                      {allNotifs.map((n, i) => (
                        <div
                          key={n.id}
                          className={`group relative flex gap-3 px-4 py-3.5 hover:bg-[#f0f4f8] transition-colors ${i > 0 ? "border-t border-[#0d1b2a]/5" : ""} ${!n.read ? "bg-[#f8fafc]" : ""}`}
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${!n.read ? (role === "candidate" ? "bg-[#00bfa6]/15" : "bg-[#4d9de0]/15") : "bg-[#0d1b2a]/5"}`}>
                            {n.icon}
                          </div>
                          <div className="flex-1 min-w-0 pr-5">
                            <div className="flex items-start gap-2">
                              <p className="text-[#0d1b2a] text-xs leading-snug flex-1" style={{ fontWeight: n.read ? 400 : 600 }}>
                                {n.title}
                              </p>
                              {!n.read && <div className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0 mt-1`} />}
                            </div>
                            <p className="text-[#4a6080] text-xs mt-0.5 leading-snug">{n.desc}</p>
                            <p className="text-[#4a6080]/60 text-[10px] mt-1">{n.time}</p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); dismissNotif(n.id); }}
                            className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-[#4a6080]/40 opacity-0 group-hover:opacity-100 hover:bg-[#0d1b2a]/8 hover:text-[#0d1b2a] transition-all"
                            title="Dismiss"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="px-4 py-2.5 border-t border-[#0d1b2a]/8">
                    <button className={`text-xs w-full text-center ${accentText} hover:underline`} style={{ fontWeight: 500 }}>
                      Mark all as read
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile avatar → goes to profile section */}
            <button
              onClick={() => { onSectionChange("profile"); }}
              title="Go to Profile"
              className={`w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center text-xs text-[#0d1b2a] hover:opacity-80 transition-opacity ring-2 ring-transparent hover:ring-offset-1 ${role === "candidate" ? "hover:ring-[#00bfa6]/40" : "hover:ring-[#4d9de0]/40"}`}
              style={{ fontWeight: 700 }}
            >
              {userInitials}
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
