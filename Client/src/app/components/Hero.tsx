import { ArrowRight, Play, Star } from "lucide-react";
import Typed from 'typed.js';
import { useEffect } from 'react';



export function Hero() {
  useEffect(() => {
    const typed = new Typed('#element', {
      strings: [
        'Hire Smarter.',
        '<span style="color:#00bfa6">Perform Better.</span>'
      ],
      contentType: 'html',
      typeSpeed: 50,
      backSpeed: 70,
      loop: true,
    });

    return () => typed.destroy();
  }, []);
  return (
    <section className="relative min-h-screen bg-[#0d1b2a] flex items-center overflow-hidden pt-16">
      {/* Background geometric elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-[#00bfa6]/5 rounded-full blur-3xl translate-x-1/2" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#1a4a7a]/40 rounded-full blur-3xl" />
        <div className="absolute top-20 left-10 w-px h-32 bg-gradient-to-b from-transparent via-[#00bfa6]/40 to-transparent" />
        <div className="absolute top-40 right-20 w-px h-48 bg-gradient-to-b from-transparent via-[#00bfa6]/20 to-transparent" />
        {/* Grid dots */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left content */}
        <div>
          <div
            className="inline-flex items-center gap-2 bg-[#00bfa6]/10 border border-[#00bfa6]/25 text-[#00bfa6] text-xs px-3 py-1.5 rounded-full mb-6"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}
          >
            <Star className="w-3 h-3 fill-current" />
            Trusted by 50,000+ professionals
          </div>

          <h1
            className="text-white mb-6 leading-tight whitespace-nowrap "
            style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 600, fontSize: "clamp(2.25rem, 5vw, 3.75rem)", lineHeight: 1.15 }}
          ><span id="element" >
            </span>
          </h1>

          <p
            className="text-white/60 text-lg mb-10 max-w-xl leading-relaxed"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}
          >
            CodeGear brings candidates and interviewers together in a structured, AI-powered virtual environment. Run technical interviews, assess soft skills, and land the right role — all in one platform.
          </p>

          <div className="flex flex-wrap gap-4 mb-12">
            <a
              href="#get-started"
              className="inline-flex items-center gap-2 bg-[#00bfa6] text-[#0d1b2a] px-7 py-3.5 rounded-lg hover:bg-[#00d4b8] transition-all hover:shadow-lg hover:shadow-[#00bfa6]/25 active:scale-[0.98]"
              style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 text-white/70 border border-white/20 px-7 py-3.5 rounded-lg hover:border-white/40 hover:text-white transition-all"
              style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}
            >
              <Play className="w-4 h-4" />
              Watch Demo
            </a>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-6 border-t border-white/10 pt-8">
            <div className="flex -space-x-2">
              {["bg-blue-400", "bg-emerald-400", "bg-violet-400", "bg-orange-400"].map((color, i) => (
                <div key={i} className={`w-8 h-8 rounded-full ${color} border-2 border-[#0d1b2a] flex items-center justify-center text-[10px] text-white font-semibold`}>
                  {["AK", "MR", "SL", "+"][i]}
                </div>
              ))}
            </div>
            <div>
              <div className="flex gap-0.5 mb-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-[#00bfa6] text-[#00bfa6]" />
                ))}
              </div>
              <p className="text-white/50 text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>4.9/5 from 3,200+ reviews</p>
            </div>
          </div>
        </div>

        {/* Right: mock video card */}
        <div className="relative">
          <div className="relative bg-[#112233] rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40">
            <img
              src="https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=700&h=460&fit=crop&auto=format"
              alt="Virtual interview in progress"
              className="w-full h-72 object-cover opacity-70"
            />
            {/* Overlay UI elements */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d1b2a]/80 via-transparent to-transparent" />
            <div className="absolute top-4 left-4 bg-[#0d1b2a]/70 backdrop-blur-sm text-[#00bfa6] text-xs px-3 py-1 rounded-full border border-[#00bfa6]/30" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              ● LIVE
            </div>
            <div className="absolute top-4 right-4 bg-[#0d1b2a]/70 backdrop-blur-sm text-white/70 text-xs px-3 py-1 rounded-full border border-white/10" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              42:17
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>Senior Frontend Engineer</p>
                  <p className="text-white/50 text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>Technical Round · Round 2 of 3</p>
                </div>
                <div className="flex gap-2">
                  {["bg-red-500", "bg-yellow-500", "bg-[#00bfa6]"].map((c, i) => (
                    <div key={i} className={`w-8 h-8 rounded-lg ${c}/20 border border-white/10 flex items-center justify-center`}>
                      <div className={`w-2 h-2 rounded-full ${c}`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Floating score card */}
          <div className="absolute -bottom-6 -left-6 bg-white rounded-xl p-4 shadow-xl shadow-black/20 border border-[#0d1b2a]/5">
            <p className="text-[#4a6080] text-xs mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>AI Score Summary</p>
            <div className="flex gap-3">
              {[
                { label: "Clarity", score: 88 },
                { label: "Depth", score: 92 },
                { label: "Speed", score: 76 },
              ].map(({ label, score }) => (
                <div key={label} className="text-center">
                  <div className="text-[#0d1b2a] text-sm mb-0.5" style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700 }}>{score}</div>
                  <div className="text-[#4a6080] text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Floating status pill */}
          <div className="absolute -top-4 -right-4 bg-[#00bfa6] text-[#0d1b2a] text-xs px-3 py-2 rounded-xl shadow-lg" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
            AI Feedback Ready ✓
          </div>
        </div>
      </div>
    </section>
  );
}
