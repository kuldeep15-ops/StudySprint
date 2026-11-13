
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type AuthChangeEvent,
  type Session,
  type User,
} from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/app/lib/supabaseBrowser";

export default function StudentAccount() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getUser().then(
      (result: { data: { user: User | null } }) => {
        setUserEmail(result.data.user?.email ?? null);
        setLoading(false);
      }
    );

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUserEmail(session?.user?.email ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function logout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setUserEmail(null);
    router.push("/");
    router.refresh();
  }

  if (loading) return null;

  if (userEmail) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700"
        >
          My Account
        </Link>
        <button
          onClick={logout}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/auth"
      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
    >
      Login / Sign up
    </Link>
  );
}
