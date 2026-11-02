import Link from "next/link";

/** The Neo mark: a sunrise over the horizon, for the morning briefing. */
export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      <rect width="64" height="64" rx="16" fill="#0a0a0b"/><rect x=".5" y=".5" width="63" height="63" rx="15.5" stroke="#f4f1ea" strokeOpacity=".14"/><path d="M14 38a18 18 0 0 1 36 0z" fill="#ff6a2c"/><path d="M10 44h44M18 52h28" stroke="#f4f1ea" strokeWidth="4" strokeLinecap="round"/>
    </svg>
  );
}

export function Logo({ href = "/", className = "", size = 24 }: { href?: string; className?: string; size?: number }) {
  return (
    <Link href={href} aria-label="Neo home" className={`inline-flex items-center gap-2 text-ink ${className}`}>
      <LogoMark size={size} />
      <span className="font-display text-[24px] leading-none tracking-[-0.02em]">Neo</span>
    </Link>
  );
}
