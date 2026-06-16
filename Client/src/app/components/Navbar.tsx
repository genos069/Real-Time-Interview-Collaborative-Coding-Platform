import { useState } from "react";
import { Menu, X, Video } from "lucide-react";
import { Link } from "react-router";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0d1b2a]/95 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <div className="w-8 h-8 rounded-lg bg-[#00bfa6] flex items-center justify-center">
            <Video className="w-4 h-4 text-[#0d1b2a]" />
          </div>
          <span style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 600 }} className="text-white text-lg">
            CodeGear
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-white/70 hover:text-white transition-colors text-sm"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-white/70 hover:text-white transition-colors text-sm"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            How It Works
          </a>
          <a
            href="#"
            className="text-white/70 hover:text-white transition-colors text-sm"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Pricing
          </a>
          <a
            href="#"
            className="text-white/70 hover:text-white transition-colors text-sm"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            About
          </a>

        </div>

        <div className="hidden md:flex items-center gap-3">
          <a
            href="#get-started"
            className="text-white/80 hover:text-white text-sm px-4 py-2 transition-colors"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Sign In
          </a>
          <a
            href="#get-started"
            className="bg-[#00bfa6] text-[#0d1b2a] text-sm px-5 py-2 rounded-lg hover:bg-[#00d4b8] transition-colors"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
          >
            Get Started
          </a>
        </div>

        <button
          className="md:hidden text-white/80 hover:text-white"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-[#0d1b2a] border-t border-white/10 px-6 py-4 flex flex-col gap-4">
          <a
            href="#features"
            className="text-white/70 hover:text-white transition-colors text-sm"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-white/70 hover:text-white transition-colors text-sm"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            How It Works
          </a>
          <a
            href="#"
            className="text-white/70 hover:text-white transition-colors text-sm"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Pricing
          </a>
          <a
            href="#"
            className="text-white/70 hover:text-white transition-colors text-sm"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            About
          </a>
          <div className="flex gap-3 pt-2 border-t border-white/10">
            <a href="#get-started" className="bg-[#00bfa6] text-[#0d1b2a] text-sm px-4 py-1.5 rounded-lg" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>Get Started</a>
          </div>
        </div>
      )}
    </nav>
  );
}
