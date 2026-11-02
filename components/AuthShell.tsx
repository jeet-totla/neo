import Link from "next/link";
import { Logo } from "@/components/Logo";

export function AuthShell({
  title, subtitle, children, footer,
}: { title: string; subtitle: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-page flex flex-col">
      <header className="max-w-[1120px] w-full mx-auto h-14 px-5 sm:px-6 flex items-center justify-between">
        <Logo />
        <Link href="/" className="text-[14px] text-body hover:text-ink transition-colors duration-150">Back</Link>
      </header>
      <main className="flex-1 grid place-items-center px-5 pb-16">
        <div className="rise w-full max-w-[400px]">
          <h1 className="font-display text-[36px] leading-[1.1] tracking-[-0.02em] mb-2">{title}</h1>
          <p className="text-[15px] leading-[22px] text-body mb-8">{subtitle}</p>
          <div className="surface rounded-panel p-6">{children}</div>
          {footer && <p className="mt-6 text-[14px] text-body">{footer}</p>}
        </div>
      </main>
    </div>
  );
}

export function FormMessage({ kind, children }: { kind: "error" | "ok"; children: React.ReactNode }) {
  const tone = kind === "error" ? "text-bad border-bad/20 bg-bad/[0.05]" : "text-good border-good/20 bg-good/[0.06]";
  return <p role={kind === "error" ? "alert" : "status"} className={`rounded-control border px-3.5 py-2.5 text-[13px] leading-[18px] ${tone}`}>{children}</p>;
}
