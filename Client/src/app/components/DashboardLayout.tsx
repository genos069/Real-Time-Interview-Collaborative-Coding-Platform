import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Video, Bell, ChevronDown, Menu, X, LogOut } from "lucide-react";

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
};

export function DashboardLayout({
  role,
  navItems,
  activeSection,
  onSectionChange,
  children,
  userName = "Arjun Mehta",
  userInitials = "AM",
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const avatarColor = role === "candidate" ? "bg-[#00bfa6]" : "bg-[#1a4a7a]";
  const accentText = role === "candidate" ? "text-[#00bfa6]" : "text-[#4d9de0]";
  const accentBg = role === "candidate" ? "bg-[#00bfa6]/10 border-[#00bfa6]/20" : "bg-[#4d9de0]/10 border-[#4d9de0]/20";
  const accentFg = role === "candidate" ? "text-[#00bfa6]" : "text-[#4d9de0]";

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 bg-[#0d1b2a] flex flex-col transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
      >
        {/* Logo */}
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

        {/* Role badge */}
        <div className="px-5 py-4">
          <div className={`inline-flex items-center gap-1.5 ${accentBg} border text-xs px-2.5 py-1 rounded-full ${accentFg}`} style={{ fontWeight: 600 }}>
            <div className="w-1.5 h-1.5 rounded-full bg-current" />
            {role === "candidate" ? "Candidate" : "Interviewer"}
          </div>
        </div>

        {/* Nav */}
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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm transition-all ${active
                    ? `${role === "candidate" ? "bg-[#00bfa6]/15 text-[#00bfa6]" : "bg-[#4d9de0]/15 text-[#4d9de0]"}`
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

        {/* Bottom profile */}
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
              <Link to="/auth?role=candidate" className="flex items-center gap-2 px-4 py-2.5 text-white/60 hover:text-white hover:bg-white/5 text-sm transition-colors">
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Overlay */}
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
            <button className="relative w-9 h-9 rounded-full bg-[#f0f4f8] flex items-center justify-center text-[#4a6080] hover:text-[#0d1b2a] transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#00bfa6] rounded-full" />
            </button>
            <div className={`w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center text-xs text-[#0d1b2a]`} style={{ fontWeight: 700 }}>
              {userInitials}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
