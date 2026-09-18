const testimonials = [
  {
    quote: "CodeGear brings coding, video communication, and collaboration into one interview workspace. The live coding environment makes technical interviews much easier to conduct",
    name: "Bibek Khalsai",
    role: "Beta Tester · AI-ML Engineer",
    initials: "BK",
    color: "bg-blue-500",
  },
  {
    quote: "The shared code editor and real-time collaboration features make remote technical interviews more interactive and convenient for both interviewers and candidates.",
    name: "Sohan Khosla",
    role: "Beta Tester · Cybersecurity Lead",
    initials: "SK",
    color: "bg-violet-500",
  },
  {
    quote: "Having video, screen sharing, and an interactive whiteboard alongside the coding environment gives a complete workspace for conducting technical interviews remotely.",
    name: "Sandeep Ghosh",
    role: "Beta Tester · Forward Deployed Engineer",
    initials: "SG",
    color: "bg-emerald-500",
  },
];

export function Testimonials() {
  return (
    <section className="bg-[#0d1b2a] py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <span
            className="text-[#00bfa6] text-sm uppercase tracking-widest"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
          >
            Testimonials
          </span>
          <h2
            className="text-white mt-3"
            style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
          >
            What our users say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(({ quote, name, role, initials, color }) => (
            <div
              key={name}
              className="bg-[#112233] rounded-2xl p-7 border border-white/8 flex flex-col"
            >
              <div className="text-[#00bfa6] text-3xl mb-4 leading-none">"</div>
              <p
                className="text-white/70 text-sm leading-relaxed flex-1 mb-6"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {quote}
              </p>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-xs text-white`} style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}>
                  {initials}
                </div>
                <div>
                  <p className="text-white text-sm" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>{name}</p>
                  <p className="text-white/40 text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
