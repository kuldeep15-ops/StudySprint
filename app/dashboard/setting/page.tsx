
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";

export const instant = false;

export default async function AccountSettingsPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  return (
    <main className="min-h-[75vh] bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-2xl border bg-white p-8">
        <h1 className="text-2xl font-black text-slate-900">
          Account Settings
        </h1>

        <div className="mt-6 space-y-4">
          <div>
            <p className="text-sm text-slate-500">Email</p>
            <p className="font-semibold">{user.email}</p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Student ID</p>
            <p className="break-all text-sm font-medium">{user.id}</p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Account Created</p>
            <p className="font-medium">
              {new Date(user.created_at).toLocaleDateString("en-IN")}
            </p>
          </div>
        </div>

        <a
          href="/dashboard"
          className="mt-8 inline-block rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white"
        >
          Back to Dashboard
        </a>
      </div>
    </main>
  );
}
