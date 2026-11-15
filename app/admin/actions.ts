
"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

async function verifyAdmin() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminUserId = process.env.ADMIN_USER_ID;

  if (!user || !adminUserId || user.id !== adminUserId) {
    redirect("/admin/login");
  }
}

export async function logoutAdmin() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function updateAISettings(formData: FormData) {
  await verifyAdmin();

  const aiEnabledValue = formData.get("aiEnabled");
  const hourlyLimitValue = Number(formData.get("hourlyLimit"));

  if (
    (aiEnabledValue !== "true" && aiEnabledValue !== "false") ||
    !Number.isInteger(hourlyLimitValue) ||
    hourlyLimitValue < 1 ||
    hourlyLimitValue > 100
  ) {
    redirect("/admin?settings=invalid");
  }

  const { error } = await supabaseAdmin
    .from("admin_settings")
    .upsert(
      [
        {
          key: "ai_enabled",
          value: aiEnabledValue === "true",
        },
        {
          key: "ai_hourly_limit",
          value: hourlyLimitValue,
        },
      ],
      { onConflict: "key" }
    );

  if (error) {
    console.error("Admin settings update failed:", error.message);
    redirect("/admin?settings=error");
  }

  redirect("/admin?settings=updated");
}
