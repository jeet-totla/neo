import Link from "next/link";

/** The Neo mark: an ember tile with an N whose diagonal runs up into a single point, many sources into one briefing. */
export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      <rect width="64" height="64" rx="16" fill="#ff6a2c" />
      <path d="M20 46V18l24 28V18" stroke="#0a0a0b" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="44" cy="18" r="3.4" fill="#0a0a0b" />
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
