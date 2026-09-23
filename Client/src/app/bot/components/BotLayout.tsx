import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  // Sparkles,
  Video,
  LayoutGrid,
  PlaySquare,
  History as HistoryIcon,
  BarChart3,
  Menu,
  X,
  ArrowLeft,
} from "lucide-react";

interface BotLayoutProps {
  children: React.ReactNode;
  /** Optional page title shown in the top bar. */
  title?: string;
  /** Optional short subtitle under the title. */
  subtitle?: string;
  /** Render content full-width instead of centered/max-width. */
  fullWidth?: boolean;
}

const NAV_ITEMS = [
  { id: "home", label: "Home", to: "/ai-mock", icon: LayoutGrid },
  { id: "start", label: "Start Interview", to: "/ai-mock", icon: PlaySquare },
  { id: "history", label: "History", to: "/history", icon: HistoryIcon },
  { id: "reports", label: "Reports", to: "/history", icon: BarChart3 },
];

export default function BotLayout({
  children,
  title,
  subtitle,
  fullWidth = false,
}: BotLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeId = (() => {
    if (location.pathname.startsWith("/history")) return "history";
    if (location.pathname.startsWith("/report")) return "reports";
    if (location.pathname.startsWith("/interview")) return "start";
    return "home";
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4f8fb] via-[#eef3f9] to-[#eaf6f3]">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0d1b2a] flex flex-col transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/8 shrink-0">
          <Link to="/candidate" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#00bfa6] flex items-center justify-center">
              {/* <Sparkles className="w-3.5 h-3.5 text-[#0d1b2a]" /> */}
              <Video className="w-3.5 h-3.5 text-[#0d1b2a]" />
            </div>
            <span className="text-white text-base font-semibold tracking-tight">
              CodeGear
            </span>
          </Link>
          <button
            className="lg:hidden text-white/50 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="inline-flex items-center gap-1.5 bg-[#00bfa6]/10 border border-[#00bfa6]/20 text-[#00bfa6] text-xs px-2.5 py-1 rounded-full font-semibold">
            <div className="w-1.5 h-1.5 rounded-full bg-current" />
            AI Mock Interview
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 overflow-y-auto">
          <p className="text-white/25 text-[10px] font-semibold uppercase tracking-widest px-2 mb-2">
            Menu
          </p>
          {NAV_ITEMS.map(({ id, label, to, icon: Icon }) => {
            const active = activeId === id;
            return (
              <Link
                key={id}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm transition-all ${
                  active
                    ? "bg-[#00bfa6]/15 text-[#00bfa6] font-semibold"
                    : "text-white/55 hover:text-white hover:bg-white/5 font-normal"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-5 border-t border-white/8">
          <div className="rounded-xl bg-white/5 p-3.5">
            <p className="text-white text-xs font-semibold mb-1">
              Practice makes perfect
            </p>
            <p className="text-white/40 text-[11px] leading-relaxed">
              Every mock session sharpens your answers with real-time AI
              feedback.
            </p>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-md border-b border-slate-900/5 h-16 flex items-center px-5 sm:px-8 gap-3">
          <button
            className="lg:hidden text-slate-500 hover:text-slate-800"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {location.pathname !== "/ai-mock" && (
            <button
              onClick={() => navigate(-1)}
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors mr-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          )}

          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-slate-800 truncate">
              {title ?? "AI Mock Interview"}
            </h1>
            {subtitle && (
              <p className="text-xs text-slate-500 truncate">{subtitle}</p>
            )}
          </div>
        </header>

        <main className="flex-1 px-5 sm:px-8 py-8">
          <div className={fullWidth ? "" : "mx-auto w-full max-w-[1100px]"}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
