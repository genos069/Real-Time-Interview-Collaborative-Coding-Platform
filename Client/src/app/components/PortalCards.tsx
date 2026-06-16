import { ArrowRight, UserCheck, Briefcase } from "lucide-react";
import { Link } from "react-router";

export function PortalCards() {
  return (
    <section id="get-started" className="bg-[#f0f4f8] py-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <span
            className="text-[#00bfa6] text-sm uppercase tracking-widest"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
          >
            Get Started
          </span>
          <h2
            className="text-[#0d1b2a] mt-3"
            style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)" }}
          >
            Choose your role to begin
          </h2>
          <p
            className="text-[#4a6080] mt-4 max-w-xl mx-auto"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Whether you're preparing for your dream job or evaluating top talent, CodeGear has a dedicated portal built for you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Candidate Card */}
          <Link
            to="/auth?role=candidate"
            className="group relative bg-[#0d1b2a] rounded-3xl p-10 overflow-hidden border border-white/8 hover:border-[#00bfa6]/40 transition-all hover:shadow-2xl hover:shadow-[#00bfa6]/10 hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#00bfa6]/8 rounded-full blur-2xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />

            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-[#00bfa6]/15 border border-[#00bfa6]/25 flex items-center justify-center mb-7">
                <UserCheck className="w-7 h-7 text-[#00bfa6]" />
              </div>

              <div
                className="text-[#00bfa6] text-xs uppercase tracking-widest mb-2"
                style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
              >
                For Job Seekers
              </div>
              <h3
                className="text-white mb-4"
                style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.75rem" }}
              >
                Candidate Portal
              </h3>
              <p
                className="text-white/55 leading-relaxed mb-8 text-sm"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Practice with real-world interview scenarios, receive AI-driven feedback, and track your readiness score across technical, behavioral, and system design rounds.
              </p>

              <ul className="space-y-2.5 mb-8">
                {["Mock interviews with AI feedback", "Curated question banks", "Progress dashboard & reports"].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-white/60 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    <div className="w-4 h-4 rounded-full bg-[#00bfa6]/20 border border-[#00bfa6]/40 flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00bfa6]" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              <div
                className="inline-flex items-center gap-2 bg-[#00bfa6] text-[#0d1b2a] px-6 py-3 rounded-xl group-hover:bg-[#00d4b8] transition-colors"
                style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
              >
                Enter as Candidate
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Interviewer Card */}
          <Link
            to="/auth?role=interviewer"
            className="group relative bg-white rounded-3xl p-10 overflow-hidden border border-[#0d1b2a]/10 hover:border-[#0d1b2a]/30 transition-all hover:shadow-2xl hover:shadow-[#0d1b2a]/10 hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#0d1b2a]/4 rounded-full blur-2xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />

            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-[#0d1b2a]/8 border border-[#0d1b2a]/15 flex items-center justify-center mb-7">
                <Briefcase className="w-7 h-7 text-[#0d1b2a]" />
              </div>

              <div
                className="text-[#0d1b2a]/50 text-xs uppercase tracking-widest mb-2"
                style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
              >
                For Hiring Teams
              </div>
              <h3
                className="text-[#0d1b2a] mb-4"
                style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.75rem" }}
              >
                Interviewer Portal
              </h3>
              <p
                className="text-[#4a6080] leading-relaxed mb-8 text-sm"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Evaluate candidates efficiently with structured rubrics, collaborative scorecards, and AI-assisted summaries that cut time-to-hire without compromising quality.
              </p>

              <ul className="space-y-2.5 mb-8">
                {["Build custom interview kits", "Collaborative evaluation rubrics", "Room creation & scheduling"].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-[#4a6080] text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    <div className="w-4 h-4 rounded-full bg-[#0d1b2a]/8 border border-[#0d1b2a]/20 flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0d1b2a]" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              <div
                className="inline-flex items-center gap-2 bg-[#0d1b2a] text-white px-6 py-3 rounded-xl group-hover:bg-[#1a2f45] transition-colors"
                style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
              >
                Enter as Interviewer
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
