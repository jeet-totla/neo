import Link from "next/link";

/** The Neo mark: three lines from many sources converge through a lens onto one point. */
export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      <rect width="64" height="64" rx="16" fill="#0a0a0b"/>
      <rect x=".5" y=".5" width="63" height="63" rx="15.5" stroke="#f4f1ea" strokeOpacity=".14"/>
      <circle cx="34" cy="32" r="19" stroke="#ff6a2c" strokeWidth="3.5"/>
      <path d="M6 20c14 0 17 6 22 12M6 32h22M6 44c14 0 17-6 22-12" stroke="#f4f1ea" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="36" cy="32" r="6.5" fill="#ff6a2c"/>
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
