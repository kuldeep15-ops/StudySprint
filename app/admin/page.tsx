
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";
import { logoutAdmin } from "./actions";

export const instant = false;

export const metadata = {
  title: "Admin Dashboard | StudySprint",
};

export default async function AdminDashboard() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminUserId = process.env.ADMIN_USER_ID;

  if (!user || !adminUserId || user.id !== adminUserId) {
    redirect("/admin/login");
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              StudySprint Admin
            </h1>
            <p className="text-sm text-slate-500">
              Private Administration Panel
            </p>
          </div>

          <form action={logoutAdmin}>
            <button
              type="submit"
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Logout
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10">
        <h2 className="text-xl font-bold text-slate-900">
          Welcome, Administrator
        </h2>

        <p className="mt-2 text-sm text-slate-600">
          Your private StudySprint control panel is ready.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["AI Generations", "Usage analytics coming soon"],
            ["API Costs", "Cost tracking coming soon"],
            ["Model Analytics", "Model reports coming soon"],
            ["Generation History", "Request logs coming soon"],
            ["Usage Limits", "Quota management coming soon"],
            ["AI Controls", "System controls coming soon"],
          ].map(([title, description]) => (
            <section
              key={title}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h3 className="font-bold text-slate-800">{title}</h3>
              <p className="mt-2 text-sm text-slate-500">
                {description}
              </p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
