"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase";
import { AuthShell, FormMessage } from "@/components/AuthShell";

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState("");
  const [error,   setError]   = useState<string | null>(null);
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserClient();
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (err) throw new Error(err.message);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a link to choose a new one."
      footer={<Link href="/login" className="text-ink underline underline-offset-2">Back to log in</Link>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" required autoComplete="email" value={email}
            onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="field" />
        </div>
        {error && <FormMessage kind="error">{error}</FormMessage>}
        {sent  && <FormMessage kind="ok">If an account exists for that email, a reset link is on its way.</FormMessage>}
        <button type="submit" disabled={loading || sent} className="btn-primary w-full">
          {loading ? "Sending" : "Send reset link"}
        </button>
      </form>
    </AuthShell>
  );
}
