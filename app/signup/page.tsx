"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase";
import { AuthShell, FormMessage } from "@/components/AuthShell";

export default function SignupPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [notice,   setNotice]   = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const supabase = createBrowserClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding` },
      });
      if (authError) throw new Error(authError.message);

      if (data.session) {
        router.push("/onboarding");
        router.refresh();
      } else {
        setNotice("Check your inbox for a confirmation link to finish signing up.");
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Two minutes of setup, then a briefing every morning."
      footer={<>Already have an account? <Link href="/login" className="text-ink underline underline-offset-2">Log in</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" required autoComplete="email" value={email}
            onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="field" />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" type="password" required autoComplete="new-password" minLength={8} value={password}
            onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" className="field" />
        </div>
        {error  && <FormMessage kind="error">{error}</FormMessage>}
        {notice && <FormMessage kind="ok">{notice}</FormMessage>}
        <button type="submit" disabled={loading || !!notice} className="btn-primary w-full">
          {loading ? "Creating account" : "Create account"}
        </button>
        <p className="text-[12px] leading-[16px] text-muted">
          By creating an account you agree to the <Link href="/terms" className="underline underline-offset-2">terms</Link> and <Link href="/privacy" className="underline underline-offset-2">privacy policy</Link>.
        </p>
      </form>
    </AuthShell>
  );
}
