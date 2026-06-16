import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router";
import { Video, Eye, EyeOff, ArrowLeft, ChevronDown, Mail, Lock, User, Building2 } from "lucide-react";

type Tab = "login" | "signup";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = searchParams.get("role") ?? "candidate";
  const [tab, setTab] = useState<Tab>("login");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const roleLabel = role === "interviewer" ? "Interviewer" : "Candidate";
  const roleColor = role === "interviewer" ? "text-[#0d1b2a]" : "text-[#00bfa6]";
  const roleBg = role === "interviewer" ? "bg-[#0d1b2a]" : "bg-[#00bfa6]";
  const roleBgLight = role === "interviewer" ? "bg-[#0d1b2a]/8 border-[#0d1b2a]/15" : "bg-[#00bfa6]/10 border-[#00bfa6]/25";
  const btnHover = role === "interviewer" ? "hover:bg-[#1a2f45]" : "hover:bg-[#00d4b8]";
  const btnText = role === "interviewer" ? "text-white" : "text-[#0d1b2a]";

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] bg-[#0d1b2a] p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#00bfa6]/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#1a4a7a]/40 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2 pointer-events-none" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#00bfa6] flex items-center justify-center">
              <Video className="w-4.5 h-4.5 text-[#0d1b2a]" />
            </div>
            <span className="text-white text-xl" style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 600 }}>
              CodeGear
            </span>
          </Link>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center py-16">
          <div
            className={`inline-flex items-center gap-2 ${roleBgLight} border text-xs px-3 py-1.5 rounded-full mb-6 w-fit`}
            style={{ fontWeight: 600, color: role === "interviewer" ? "rgba(255,255,255,0.6)" : "#00bfa6" }}
          >
            {role === "interviewer" ? <Building2 className="w-3 h-3" /> : <User className="w-3 h-3" />}
            {roleLabel} Portal
          </div>

          <h2
            className="text-white mb-5 leading-tight"
            style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "clamp(1.75rem, 2.5vw, 2.5rem)", lineHeight: 1.2 }}
          >
            {role === "interviewer"
              ? "Find and assess top talent, faster."
              : "Prepare, practice, and land your dream role."}
          </h2>

          <p className="text-white/50 leading-relaxed mb-10" style={{ fontSize: "0.95rem" }}>
            {role === "interviewer"
              ? "Access structured rubrics, AI-assisted summaries, and collaborative scorecards — all in one session."
              : "Run AI mock interviews, get instant feedback, and track your readiness across every round type."}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {(role === "interviewer"
              ? [
                { value: "12k+", label: "Interviews conducted" },
                { value: "4.8×", label: "Faster hiring" },
                { value: "93%", label: "Team satisfaction" },
              ]
              : [
                { value: "50k+", label: "Mock sessions done" },
                { value: "78%", label: "Offer success rate" },
                { value: "4.9★", label: "User rating" },
              ]
            ).map(({ value, label }) => (
              <div key={label} className="bg-white/5 border border-white/8 rounded-xl p-4">
                <div
                  className="text-[#00bfa6] mb-1"
                  style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.4rem" }}
                >
                  {value}
                </div>
                <div className="text-white/40 text-xs">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative z-10 bg-white/5 border border-white/8 rounded-2xl p-5">
          <p className="text-white/60 text-sm leading-relaxed mb-4">
            {role === "interviewer"
              ? "\"The AI summary cuts my post-interview write-up from 30 minutes to 5. Our team's calibration is the best it's ever been.\""
              : "\"After 8 mock rounds with CodeGear, I walked into my Meta interview feeling genuinely prepared. Offer in hand.\""
            }
          </p>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full ${role === "interviewer" ? "bg-violet-500" : "bg-blue-500"} flex items-center justify-center text-xs text-white font-bold`}>
              {role === "interviewer" ? "RL" : "AK"}
            </div>
            <div>
              <p className="text-white text-xs font-semibold">{role === "interviewer" ? "Rachel Lin" : "Arjun Mehta"}</p>
              <p className="text-white/35 text-xs">{role === "interviewer" ? "Engineering Manager · Stripe" : "Software Engineer · Google"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-between mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#00bfa6] flex items-center justify-center">
                <Video className="w-4 h-4 text-[#0d1b2a]" />
              </div>
              <span className="text-[#0d1b2a] text-lg" style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 600 }}>CodeGear</span>
            </Link>
            <span
              className={`text-xs px-3 py-1 rounded-full border ${roleBgLight} ${roleColor}`}
              style={{ fontWeight: 600 }}
            >
              {roleLabel}
            </span>
          </div>

          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[#4a6080] hover:text-[#0d1b2a] text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to home
          </Link>

          {/* Tab switcher */}
          <div className="bg-[#dde6ef] rounded-xl p-1 flex mb-8">
            {(["login", "signup"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 rounded-lg text-sm transition-all ${tab === t
                    ? "bg-white text-[#0d1b2a] shadow-sm"
                    : "text-[#4a6080] hover:text-[#0d1b2a]"
                  }`}
                style={{ fontWeight: tab === t ? 600 : 400 }}
              >
                {t === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <h1
              className="text-[#0d1b2a] mb-1"
              style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.65rem" }}
            >
              {tab === "login" ? `Welcome back` : `Join as ${roleLabel}`}
            </h1>
            <p className="text-[#4a6080] text-sm">
              {tab === "login"
                ? "Sign in to continue to your dashboard."
                : "Create your account to get started."}
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); navigate(role === "interviewer" ? "/interviewer" : "/candidate"); }} className="space-y-4">
            {/* Full name — signup only */}
            {tab === "signup" && (
              <div>
                <label className="block text-[#0d1b2a] text-sm mb-1.5" style={{ fontWeight: 500 }}>
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a6080]" />
                  <input
                    type="text"
                    placeholder="Arjun Mehta"
                    className="w-full bg-white border border-[#0d1b2a]/12 rounded-xl pl-10 pr-4 py-3 text-[#0d1b2a] placeholder-[#4a6080]/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#00bfa6]/30 focus:border-[#00bfa6]/60 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-[#0d1b2a] text-sm mb-1.5" style={{ fontWeight: 500 }}>
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a6080]" />
                <input
                  type="email"
                  placeholder="arjun@company.com"
                  className="w-full bg-white border border-[#0d1b2a]/12 rounded-xl pl-10 pr-4 py-3 text-[#0d1b2a] placeholder-[#4a6080]/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#00bfa6]/30 focus:border-[#00bfa6]/60 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[#0d1b2a] text-sm" style={{ fontWeight: 500 }}>Password</label>
                {tab === "login" && (
                  <a href="#" className="text-[#00bfa6] text-xs hover:underline">Forgot password?</a>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a6080]" />
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-white border border-[#0d1b2a]/12 rounded-xl pl-10 pr-11 py-3 text-[#0d1b2a] placeholder-[#4a6080]/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#00bfa6]/30 focus:border-[#00bfa6]/60 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4a6080] hover:text-[#0d1b2a] transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm password — signup only */}
            {tab === "signup" && (
              <div>
                <label className="block text-[#0d1b2a] text-sm mb-1.5" style={{ fontWeight: 500 }}>
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a6080]" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full bg-white border border-[#0d1b2a]/12 rounded-xl pl-10 pr-11 py-3 text-[#0d1b2a] placeholder-[#4a6080]/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#00bfa6]/30 focus:border-[#00bfa6]/60 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4a6080] hover:text-[#0d1b2a] transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Role dropdown — DISABLED / locked */}
            <div>
              <label className="block text-[#0d1b2a] text-sm mb-1.5" style={{ fontWeight: 500 }}>
                Role
                <span className="ml-2 text-[#4a6080] text-xs font-normal">(assigned from portal)</span>
              </label>
              <div className="relative">
                {role === "interviewer"
                  ? <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a6080]" />
                  : <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a6080]" />
                }
                <select
                  disabled
                  value={role}
                  className="w-full bg-[#dde6ef] border border-[#0d1b2a]/10 rounded-xl pl-10 pr-10 py-3 text-[#4a6080] text-sm appearance-none cursor-not-allowed"
                >
                  <option value="candidate">Candidate</option>
                  <option value="interviewer">Interviewer</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a6080]/50 pointer-events-none" />
                {/* Lock badge */}
                <div className="absolute right-9 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center">
                  <svg viewBox="0 0 12 14" className="w-3 h-3 fill-[#4a6080]/50">
                    <rect x="1" y="6" width="10" height="8" rx="1.5" />
                    <path d="M3 6V4a3 3 0 0 1 6 0v2" strokeWidth="1.5" stroke="#4a6080" fill="none" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
              <p className="text-[#4a6080]/70 text-xs mt-1.5">
                To switch roles,{" "}
                <Link to="/#get-started" className="text-[#00bfa6] hover:underline">
                  return to the portal selection
                </Link>
                .
              </p>
            </div>

            {/* Terms — signup only */}
            {tab === "signup" && (
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  className="mt-0.5 w-4 h-4 rounded border-[#0d1b2a]/20 accent-[#00bfa6]"
                />
                <label htmlFor="terms" className="text-[#4a6080] text-xs leading-relaxed">
                  I agree to the{" "}
                  <a href="#" className="text-[#00bfa6] hover:underline">Terms of Service</a>
                  {" "}and{" "}
                  <a href="#" className="text-[#00bfa6] hover:underline">Privacy Policy</a>
                </label>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              className={`w-full ${roleBg} ${btnText} ${btnHover} py-3.5 rounded-xl text-sm transition-all active:scale-[0.98] shadow-lg mt-2`}
              style={{ fontWeight: 600 }}
            >
              {tab === "login" ? `Sign In as ${roleLabel}` : `Create ${roleLabel} Account`}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#0d1b2a]/10" />
            <span className="text-[#4a6080] text-xs">or continue with</span>
            <div className="flex-1 h-px bg-[#0d1b2a]/10" />
          </div>

          {/* OAuth */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Google",
                icon: (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                ),
              },
              {
                label: "GitHub",
                icon: (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0d1b2a" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                ),
              },
            ].map(({ label, icon }) => (
              <button
                key={label}
                type="button"
                className="flex items-center justify-center gap-2 bg-white border border-[#0d1b2a]/12 rounded-xl py-3 text-[#0d1b2a] text-sm hover:border-[#0d1b2a]/25 hover:shadow-sm transition-all"
                style={{ fontWeight: 500 }}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          <p className="text-center text-[#4a6080] text-xs mt-6">
            {tab === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setTab(tab === "login" ? "signup" : "login")}
              className="text-[#00bfa6] hover:underline"
              style={{ fontWeight: 600 }}
            >
              {tab === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
