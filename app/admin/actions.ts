
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
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

function getPlanFormValues(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = String(formData.get("price") ?? "").trim();
  const credits = Number(formData.get("credits"));
  const validityDays = Number(formData.get("validityDays"));
  const sortOrder = Number(formData.get("sortOrder") ?? 0);

  if (
    name.length < 2 ||
    name.length > 60 ||
    description.length > 300 ||
    !/^\d{1,6}(\.\d{1,2})?$/.test(price) ||
    !Number.isInteger(credits) ||
    credits < 1 ||
    credits > 10000 ||
    !Number.isInteger(validityDays) ||
    validityDays < 1 ||
    validityDays > 3650 ||
    !Number.isInteger(sortOrder) ||
    sortOrder < 0 ||
    sortOrder > 10000
  ) {
    return null;
  }

  const [rupees, paise = ""] = price.split(".");
  const pricePaise =
    Number(rupees) * 100 + Number(paise.padEnd(2, "0"));

  if (!Number.isSafeInteger(pricePaise) || pricePaise < 100) {
    return null;
  }

  return {
    name,
    description,
    price_paise: pricePaise,
    credits,
    validity_days: validityDays,
    sort_order: sortOrder,
  };
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

  revalidatePath("/admin");
  redirect("/admin?settings=updated");
}

export async function createCreditPlan(formData: FormData) {
  await verifyAdmin();

  const values = getPlanFormValues(formData);

  if (!values) {
    redirect("/admin?plans=invalid");
  }

  const { error } = await supabaseAdmin
    .from("ai_credit_plans")
    .insert({
      ...values,
      is_active: true,
      is_featured: formData.get("isFeatured") === "on",
    });

  if (error) {
    console.error("Credit plan creation failed:", error.message);
    redirect("/admin?plans=error");
  }

  revalidatePath("/admin");
  redirect("/admin?plans=created");
}

export async function updateCreditPlan(formData: FormData) {
  await verifyAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const values = getPlanFormValues(formData);

  if (
    !id ||
    id.length > 50 ||
    !/^[0-9a-f-]{36}$/i.test(id) ||
    !values
  ) {
    redirect("/admin?plans=invalid");
  }

  const { error } = await supabaseAdmin
    .from("ai_credit_plans")
    .update({
      ...values,
      is_active: formData.get("isActive") === "on",
      is_featured: formData.get("isFeatured") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Credit plan update failed:", error.message);
    redirect("/admin?plans=error");
  }

  revalidatePath("/admin");
  redirect("/admin?plans=updated");
}

export async function deleteCreditPlan(formData: FormData) {
  await verifyAdmin();

  const id = String(formData.get("id") ?? "").trim();

  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    redirect("/admin?plans=invalid");
  }

  const { error } = await supabaseAdmin
    .from("ai_credit_plans")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Credit plan deletion failed:", error.message);
    redirect("/admin?plans=error");
  }

  revalidatePath("/admin");
  redirect("/admin?plans=deleted");
}
