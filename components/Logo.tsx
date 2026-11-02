import Link from "next/link";

/** Wordmark plus a flat mark: a small ember square. No gradients, no sparkle. */
export function Logo({ href = "/", className = "" }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={`inline-flex items-center gap-2 text-[17px] font-semibold tracking-tight text-ink ${className}`}>
      <span aria-hidden className="h-[14px] w-[14px] rounded-[4px] bg-accent" />
      Neo
    </Link>
  );
}
