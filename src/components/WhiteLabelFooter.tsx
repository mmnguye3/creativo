import { Link } from "react-router-dom";
import { useWhiteLabel } from "@/contexts/WhiteLabelContext";
import { Mail, Phone, ArrowRight } from "lucide-react";
import { SiInstagram, SiFacebook } from "react-icons/si";

const SERVICE_LINKS = [
  { label: "Social Media Ads", anchor: "#services" },
  { label: "Logo & Branding", anchor: "#services" },
  { label: "Website Design", anchor: "#services" },
  { label: "Product Photography", anchor: "#services" },
  { label: "Print Design", anchor: "#services" },
  { label: "Video Content", anchor: "#services" },
];

const WhiteLabelFooter = () => {
  const { agencySettings, agencySlug } = useWhiteLabel();

  const agencyName     = agencySettings?.agency_name  || "AI Agency";
  const aboutText      = agencySettings?.about_content || "Empowering businesses with innovative design solutions that transform the way you work and grow — delivered fast under your brand.";
  const contactEmail   = agencySettings?.contact_email  || null;
  const contactPhone   = agencySettings?.contact_phone  || null;
  const hidePoweredBy  = agencySettings?.hide_powered_by || false;
  const primaryColor   = agencySettings?.primary_color   || "#f97316";
  const logoUrl        = agencySettings?.logo_url        || null;
  const initial        = agencyName.trim().charAt(0).toUpperCase();

  const instagramUrl   = agencySettings?.instagram_url || null;
  const facebookUrl    = agencySettings?.facebook_url  || null;
  const twitterUrl     = agencySettings?.twitter_url   || null;
  const linkedinUrl    = agencySettings?.linkedin_url  || null;
  const hasSocials     = instagramUrl || facebookUrl || twitterUrl || linkedinUrl;

  const year = new Date().getFullYear();

  // Inline style helpers for theming from primary_color
  const accentStyle    = { color: primaryColor };
  const accentBg       = { backgroundColor: primaryColor };
  const accentBorder   = { borderColor: primaryColor };

  return (
    <footer className="bg-zinc-950 border-t border-white/8" data-testid="footer-whitelabel">
      <div className="container mx-auto px-4 pt-16 pb-10">

        {/* ── Four-column grid ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

          {/* 1 — Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
            {/* Logo mark */}
            <div className="flex items-center gap-3 mb-4">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${agencyName} logo`}
                  className="h-10 w-auto rounded-lg object-contain"
                />
              ) : (
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}aa)` }}
                >
                  {initial}
                </div>
              )}
              <span className="font-bold text-white text-lg leading-tight">{agencyName}</span>
            </div>

            {/* About blurb */}
            <p className="text-zinc-400 text-sm leading-relaxed mb-5">
              {aboutText}
            </p>

            {/* Social icons — only rendered when URL is set */}
            {hasSocials && (
              <div className="flex items-center gap-3">
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-zinc-400 transition-colors hover:border-current"
                    style={{ ["--tw-text-opacity" as string]: "1" }}
                    onMouseEnter={e => (e.currentTarget.style.color = primaryColor)}
                    onMouseLeave={e => (e.currentTarget.style.color = "")}
                    data-testid="link-social-instagram"
                  >
                    <SiInstagram className="w-3.5 h-3.5" />
                  </a>
                )}
                {facebookUrl && (
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-zinc-400 transition-colors"
                    onMouseEnter={e => (e.currentTarget.style.color = primaryColor)}
                    onMouseLeave={e => (e.currentTarget.style.color = "")}
                    data-testid="link-social-facebook"
                  >
                    <SiFacebook className="w-3.5 h-3.5" />
                  </a>
                )}
                {twitterUrl && (
                  <a
                    href={twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="X / Twitter"
                    className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-zinc-400 transition-colors"
                    onMouseEnter={e => (e.currentTarget.style.color = primaryColor)}
                    onMouseLeave={e => (e.currentTarget.style.color = "")}
                    data-testid="link-social-twitter"
                  >
                    {/* X (formerly Twitter) logo */}
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                )}
                {linkedinUrl && (
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-zinc-400 transition-colors"
                    onMouseEnter={e => (e.currentTarget.style.color = primaryColor)}
                    onMouseLeave={e => (e.currentTarget.style.color = "")}
                    data-testid="link-social-linkedin"
                  >
                    {/* LinkedIn logo */}
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* 2 — Services column */}
          <div>
            <h4 className="text-white font-semibold text-sm tracking-wide uppercase mb-5">
              Services
            </h4>
            <ul className="space-y-3">
              {SERVICE_LINKS.map(({ label, anchor }) => (
                <li key={label}>
                  <a
                    href={anchor}
                    className="text-zinc-400 text-sm hover:text-white transition-colors"
                    data-testid={`link-service-${label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* 3 — Company column */}
          <div>
            <h4 className="text-white font-semibold text-sm tracking-wide uppercase mb-5">
              Company
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="#about" className="text-zinc-400 text-sm hover:text-white transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#contact" className="text-zinc-400 text-sm hover:text-white transition-colors">
                  Contact
                </a>
              </li>
              {agencySlug && (
                <>
                  <li>
                    <Link
                      to={`/${agencySlug}/privacy-policy`}
                      className="text-zinc-400 text-sm hover:text-white transition-colors"
                      data-testid="link-privacy-policy"
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link
                      to={`/${agencySlug}/terms-of-service`}
                      className="text-zinc-400 text-sm hover:text-white transition-colors"
                      data-testid="link-terms-of-service"
                    >
                      Terms of Service
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* 4 — Get in touch column */}
          <div>
            <h4 className="text-white font-semibold text-sm tracking-wide uppercase mb-5">
              Get in Touch
            </h4>
            <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
              Ready to elevate your brand? We'd love to hear from you.
            </p>

            <div className="space-y-3 mb-6">
              {contactEmail && (
                <a
                  href={`mailto:${contactEmail}`}
                  className="flex items-center gap-2.5 text-sm text-zinc-400 hover:text-white transition-colors group"
                  data-testid="link-contact-email"
                >
                  <Mail className="w-4 h-4 shrink-0 group-hover:text-current transition-colors" style={accentStyle} />
                  {contactEmail}
                </a>
              )}
              {contactPhone && (
                <a
                  href={`tel:${contactPhone}`}
                  className="flex items-center gap-2.5 text-sm text-zinc-400 hover:text-white transition-colors group"
                  data-testid="link-contact-phone"
                >
                  <Phone className="w-4 h-4 shrink-0" style={accentStyle} />
                  {contactPhone}
                </a>
              )}
            </div>

            <a
              href="#contact"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
              style={accentBg}
              data-testid="button-footer-start-project"
            >
              Start a Project
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* ── Bottom bar ───────────────────────────────────────────────── */}
        <div className="mt-12 pt-6 border-t border-white/8 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
          <p>© {year} {agencyName}. All rights reserved.</p>

          {agencySlug && (
            <div className="flex items-center gap-4">
              <Link
                to={`/${agencySlug}/privacy-policy`}
                className="hover:text-zinc-300 transition-colors"
              >
                Privacy
              </Link>
              <Link
                to={`/${agencySlug}/terms-of-service`}
                className="hover:text-zinc-300 transition-colors"
              >
                Terms
              </Link>
            </div>
          )}

          {!hidePoweredBy && (
            <p className="text-zinc-600">
              Powered by{" "}
              <a
                href="https://cretivo.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-400 transition-colors"
              >
                Cretivo
              </a>
            </p>
          )}
        </div>
      </div>
    </footer>
  );
};

export default WhiteLabelFooter;
