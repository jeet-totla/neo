"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase";
import { AuthShell, FormMessage } from "@/components/AuthShell";

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw new Error(authError.message);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Log in"
      subtitle="Pick up where you left off."
      footer={<>New to Neo? <Link href="/signup" className="text-ink underline underline-offset-2">Create an account</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" required autoComplete="email" value={email}
            onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="field" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="label">Password</label>
            <Link href="/forgot-password" className="text-[13px] text-body hover:text-ink mb-1.5 transition-colors duration-150">Forgot password</Link>
          </div>
          <input id="password" type="password" required autoComplete="current-password" value={password}
            onChange={e => setPassword(e.target.value)} className="field" />
        </div>
        {error && <FormMessage kind="error">{error}</FormMessage>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Logging in" : "Log in"}
        </button>
      </form>
    </AuthShell>
  );
}
