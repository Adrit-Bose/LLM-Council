"use client";

import { isSupabaseConfigured } from "@/lib/supabase/env";

export function SupabaseSetupBanner() {
  if (isSupabaseConfigured()) return null;

  return (
    <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 text-center text-sm text-amber-200">
      Supabase is not configured. Copy{" "}
      <code className="text-amber-100">.env.example</code> to{" "}
      <code className="text-amber-100">.env.local</code>, add your project URL
      and anon key, then restart <code className="text-amber-100">npm run dev</code>.
    </div>
  );
}
