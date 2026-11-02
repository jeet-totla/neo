import { Logo } from "@/components/Logo";
import Link from "next/link";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-page">
      <header className="max-w-[720px] mx-auto px-5 sm:px-6 h-14 flex items-center justify-between">
        <Logo />
        <Link href="/" className="text-[14px] text-body hover:text-ink transition-colors duration-150">Back</Link>
      </header>
      <main className="max-w-[720px] mx-auto px-5 sm:px-6 pt-12 pb-24">
        <h1 className="font-display text-[44px] leading-[1.08] tracking-[-0.02em] mb-2">{title}</h1>
        <p className="dateline mb-12">Last updated {updated}</p>
        <div className="space-y-8 text-[15px] leading-[26px] text-body [&_h2]:text-ink [&_h2]:text-[18px] [&_h2]:font-medium [&_h2]:mb-2 [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-ink">
          {children}
        </div>
      </main>
    </div>
  );
}
