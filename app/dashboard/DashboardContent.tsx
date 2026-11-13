
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";

export default async function DashboardContent() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("student_profiles")
    .select("email, created_at")
    .eq("id", user.id)
    .maybeSingle();

  async function logout() {
    "use server";
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    redirect("/auth");
  }

  return (
    <main className="min-h-[75vh] bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900">My Dashboard</h1>
        <p className="mt-2 text-slate-500">Welcome to StudySprint!</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-indigo-50 p-5">
            <p className="text-sm font-semibold text-indigo-700">Student Email</p>
            <p className="mt-1 break-all font-medium">{profile?.email ?? user.email}</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-600">Account Created</p>
            <p className="mt-1 font-medium">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString("en-IN")
                : "Available"}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-600">Unique Student ID</p>
          <p className="mt-1 break-all text-sm">{user.id}</p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard/setting"
            className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white"
          >
            Account Settings
          </Link>

          <form action={logout}>
            <button className="rounded-lg bg-red-600 px-5 py-3 font-semibold text-white">
              Logout
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
