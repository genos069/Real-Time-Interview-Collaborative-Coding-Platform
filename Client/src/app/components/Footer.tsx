import { Video } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#081422] border-t border-white/8 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-14">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#00bfa6] flex items-center justify-center">
                <Video className="w-4 h-4 text-[#0d1b2a]" />
              </div>
              <span style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 600 }} className="text-white text-lg">
                CodeGear
              </span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              The intelligent platform where great careers and great teams connect.
            </p>
          </div>

          {[
            { heading: "Product", links: ["Features", "Pricing", "Integrations", "Changelog"] },
            { heading: "Company", links: ["About", "Blog", "Careers", "Press"] },
            { heading: "Support", links: ["Help Center", "Privacy Policy", "Terms of Service", "Contact"] },
          ].map(({ heading, links }) => (
            <div key={heading}>
              <h4 className="text-white text-sm mb-4" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>{heading}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-white/40 hover:text-white/70 text-sm transition-colors" style={{ fontFamily: "'DM Sans', sans-serif" }}>{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/30 text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            © 2026 CodeGear. All rights reserved.
          </p>
          <p className="text-white/30 text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            SOC 2 Type II · GDPR Compliant · ISO 27001
          </p>
        </div>
      </div>
    </footer>
  );
}
