
"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";

export async function logoutAdmin() {
  const supabase = await createSupabaseServerClient();

  await supabase.auth.signOut();

  redirect("/admin/login");
}
