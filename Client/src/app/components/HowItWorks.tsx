const steps = [
  { num: "01", title: "Create Your Profile", desc: "Sign up as a candidate or interviewer. Add your skills, role preferences, and availability in under 5 minutes." },
  { num: "02", title: "Create a Session", desc: "Candidates book mock or real interviews. Interviewers set open slots." },
  { num: "03", title: "Conduct the Interview", desc: "Join your HD video room with built-in code editor, whiteboard, and structured question sets." },
  { num: "04", title: "Review AI Insights", desc: "Get instant score breakdowns on communication, problem-solving, and technical accuracy." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[#0d1b2a] py-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span
            className="text-[#00bfa6] text-sm uppercase tracking-widest"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
          >
            How It Works
          </span>
          <h2
            className="text-white mt-3"
            style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)" }}
          >
            From signup to offer in 4 steps
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map(({ num, title, desc }, i) => (
            <div key={num} className="relative">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[calc(100%_-_12px)] w-full h-px bg-gradient-to-r from-[#00bfa6]/40 to-transparent z-10" />
              )}
              <div className="bg-[#112233] rounded-2xl p-7 border border-white/8 hover:border-[#00bfa6]/30 transition-colors h-full">
                <div
                  className="text-[#00bfa6] mb-5"
                  style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "2.5rem", lineHeight: 1, opacity: 0.6 }}
                >
                  {num}
                </div>
                <h3
                  className="text-white mb-3"
                  style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 600, fontSize: "1.05rem" }}
                >
                  {title}
                </h3>
                <p
                  className="text-white/50 text-sm leading-relaxed"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
