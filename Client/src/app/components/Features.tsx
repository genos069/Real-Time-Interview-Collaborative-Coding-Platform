import { Brain, Code2, Video, BarChart3, Clock, Shield } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Feedback",
    desc: "Instant analysis of communication clarity, technical depth, and confidence after every session.",
  },
  {
    icon: Code2,
    title: "Live Code Editor",
    desc: "Built-in collaborative IDE with syntax highlighting, 40+ languages, and real-time execution.",
  },
  {
    icon: Video,
    title: "HD Video Sessions",
    desc: "Crystal-clear video with automatic recording, noise cancellation, and session replay.",
  },
  {
    icon: BarChart3,
    title: "Candidate Analytics",
    desc: "Track performance trends across sessions, identify skill gaps, and benchmark against peers.",
  },
  {
    icon: Clock,
    title: "Smart Scheduling",
    desc: "Auto-match candidates with interviewers based on skills, timezone, and availability.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    desc: "SOC 2 Type II certified, end-to-end encrypted, with SSO and granular role controls.",
  },
];

export function Features() {
  return (
    <section className="bg-[#f0f4f8] py-28">
      <div className="max-w-7xl mx-auto px-6" id="features">
        <div className="text-center mb-16">
          <span
            className="text-[#00bfa6] text-sm uppercase tracking-widest"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
          >
            Platform Features
          </span>
          <h2
            className="text-[#0d1b2a] mt-3"
            style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)" }}
          >
            Everything you need to interview smarter
          </h2>
          <p
            className="text-[#4a6080] mt-4 max-w-2xl mx-auto text-lg"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            From the first technical question to the final offer, CodeGear handles every step with precision.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-2xl p-7 border border-[#0d1b2a]/8 hover:border-[#00bfa6]/40 hover:shadow-lg hover:shadow-[#00bfa6]/5 transition-all group"
            >
              <div className="w-11 h-11 rounded-xl bg-[#0d1b2a] flex items-center justify-center mb-5 group-hover:bg-[#00bfa6] transition-colors">
                <Icon className="w-5 h-5 text-[#00bfa6] group-hover:text-[#0d1b2a] transition-colors" />
              </div>
              <h3
                className="text-[#0d1b2a] mb-2"
                style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 600, fontSize: "1.05rem" }}
              >
                {title}
              </h3>
              <p
                className="text-[#4a6080] leading-relaxed text-sm"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
