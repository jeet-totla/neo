"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";
import { AuthShell, FormMessage } from "@/components/AuthShell";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserClient();
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw new Error(err.message);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Choose a new password" subtitle="Use at least 8 characters.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="label">New password</label>
          <input id="password" type="password" required minLength={8} autoComplete="new-password" value={password}
            onChange={e => setPassword(e.target.value)} className="field" />
        </div>
        {error && <FormMessage kind="error">{error}</FormMessage>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Saving" : "Save password"}
        </button>
      </form>
    </AuthShell>
  );
}
