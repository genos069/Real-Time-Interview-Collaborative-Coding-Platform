import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import { Video, Bell, ChevronDown, Menu, X, LogOut, CheckCircle, Clock, Calendar, Star } from "lucide-react";
import { Client } from "@stomp/stompjs";
import { getToken, getUser } from "../bot/utils/auth";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type NotificationItem,
  type NotificationType,
} from "../../services/notificationService";

type NavItem = {
  icon: React.ReactNode;
  label: string;
  id: string;
};

type Props = {
  role: "candidate" | "interviewer";
  navItems: NavItem[];
  activeSection: string;
  onSectionChange: (id: string) => void;
  children: React.ReactNode;
  userName?: string;
  userInitials?: string;
  notifications?: NotificationItem[];
};

function getWebSocketUrl() {
  const apiUrl = new URL(import.meta.env.VITE_API_URL ?? window.location.origin);
  apiUrl.protocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";
  apiUrl.pathname = "/ws";
  apiUrl.search = "";
  apiUrl.hash = "";
  return apiUrl.toString();
}

function formatNotificationTime(isoString?: string): string {
  if (!isoString) return "Just now";
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "Just now";
  }
}

function getNotificationIcon(type: NotificationType, role: "candidate" | "interviewer") {
  switch (type) {
    case "INTERVIEW_SCHEDULED":
      return <Calendar className="w-3.5 h-3.5 text-[#00bfa6]" />;
    case "INTERVIEWER_WAITING":
      return <Clock className="w-3.5 h-3.5 text-[#f59e0b]" />;
    case "CANDIDATE_JOINED":
      return <CheckCircle className="w-3.5 h-3.5 text-[#00bfa6]" />;
    case "INTERVIEW_COMPLETED":
      return <CheckCircle className={`w-3.5 h-3.5 ${role === "candidate" ? "text-[#00bfa6]" : "text-[#4d9de0]"}`} />;
    case "INTERVIEW_SCORE_RECEIVED":
    case "CANDIDATE_REVIEW_RECEIVED":
      return <Star className="w-3.5 h-3.5 text-[#f59e0b]" />;
    case "EVALUATION_PENDING":
      return <Clock className="w-3.5 h-3.5 text-[#f59e0b]" />;
    default:
      return <Bell className="w-3.5 h-3.5 text-[#4a6080]" />;
  }
}

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

  const [notifList, setNotifList] = useState<NotificationItem[]>(notifications ?? []);
  const [toastNotif, setToastNotif] = useState<NotificationItem | null>(null);

  useEffect(() => {
    let isMounted = true;
    const user = getUser();
    const token = getToken();

    // 1. Fetch persisted notifications from backend MongoDB
    getNotifications()
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setNotifList(data);
        }
      })
      .catch((err) => {
        console.error("Failed to load notifications:", err);
      });

    // 2. Real-time STOMP notification subscription
    if (!token || !user?.id) {
      return;
    }

    const client = new Client({
      brokerURL: getWebSocketUrl(),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/notifications/${user.id}`, (message) => {
          try {
            const newNotif = JSON.parse(message.body) as NotificationItem;
            if (isMounted && newNotif && newNotif.id) {
              setNotifList((prev) => {
                if (prev.some((n) => n.id === newNotif.id)) return prev;
                return [newNotif, ...prev];
              });
              setToastNotif(newNotif);
              setTimeout(() => {
                setToastNotif((curr) => (curr?.id === newNotif.id ? null : curr));
              }, 6000);
            }
          } catch (e) {
            console.error("Failed to parse incoming notification:", e);
          }
        });
      },
    });

    client.activate();

    return () => {
      isMounted = false;
      void client.deactivate();
    };
  }, []);

  async function handleMarkAsRead(id: string) {
    try {
      setNotifList((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      await markNotificationAsRead(id);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      setNotifList((prev) => prev.map((n) => ({ ...n, read: true })));
      await markAllNotificationsAsRead();
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  }

  function dismissNotif(id: string) {
    void handleMarkAsRead(id);
  }

  const allNotifs = notifList;
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
              CodeGear
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

      {/* Instant Notification Toast */}
      {toastNotif && (
        <div className="fixed top-20 right-6 z-50 max-w-sm w-full bg-white rounded-2xl shadow-2xl border border-[#0d1b2a]/10 p-4 animate-in fade-in slide-in-from-top-3 flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${role === "candidate" ? "bg-[#00bfa6]/15" : "bg-[#4d9de0]/15"}`}>
            {getNotificationIcon(toastNotif.type, role)}
          </div>
          <div className="flex-1 min-w-0 pr-2">
            <p className="text-[#0d1b2a] text-xs font-semibold">{toastNotif.title}</p>
            <p className="text-[#4a6080] text-xs mt-0.5 leading-snug">{toastNotif.message}</p>
            <p className="text-[#4a6080]/60 text-[10px] mt-1">Just now</p>
          </div>
          <button
            onClick={() => setToastNotif(null)}
            className="text-[#4a6080]/60 hover:text-[#0d1b2a] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
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
                          onClick={() => handleMarkAsRead(n.id)}
                          className={`group relative flex gap-3 px-4 py-3.5 hover:bg-[#f0f4f8] cursor-pointer transition-colors ${i > 0 ? "border-t border-[#0d1b2a]/5" : ""} ${!n.read ? "bg-[#f8fafc]" : ""}`}
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${!n.read ? (role === "candidate" ? "bg-[#00bfa6]/15" : "bg-[#4d9de0]/15") : "bg-[#0d1b2a]/5"}`}>
                            {getNotificationIcon(n.type, role)}
                          </div>
                          <div className="flex-1 min-w-0 pr-5">
                            <div className="flex items-start gap-2">
                              <p className="text-[#0d1b2a] text-xs leading-snug flex-1" style={{ fontWeight: n.read ? 400 : 600 }}>
                                {n.title}
                              </p>
                              {!n.read && <div className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0 mt-1`} />}
                            </div>
                            <p className="text-[#4a6080] text-xs mt-0.5 leading-snug">{n.message}</p>
                            <p className="text-[#4a6080]/60 text-[10px] mt-1">{formatNotificationTime(n.createdAt)}</p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); dismissNotif(n.id); }}
                            className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-[#4a6080]/40 opacity-0 group-hover:opacity-100 hover:bg-[#0d1b2a]/8 hover:text-[#0d1b2a] transition-all"
                            title="Mark as read"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {allNotifs.length > 0 && (
                    <div className="px-4 py-2.5 border-t border-[#0d1b2a]/8">
                      <button
                        onClick={handleMarkAllAsRead}
                        className={`text-xs w-full text-center ${accentText} hover:underline`}
                        style={{ fontWeight: 500 }}
                      >
                        Mark all as read
                      </button>
                    </div>
                  )}
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
