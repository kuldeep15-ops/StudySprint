
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { logoutAdmin, updateAISettings } from "./actions";

export const instant = false;

export const metadata = {
  title: "Admin Dashboard | StudySprint",
};

type GenerationLog = {
  id: string;
  created_at: string;
  subject_code: string | null;
  subject_name: string | null;
  unit_title: string | null;
  topic: string | null;
  language: string | null;
  model: string | null;
  status: string;
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  estimated_cost_usd: number | null;
  duration_ms: number | null;
  error_status: number | null;
  error_message: string | null;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 break-words text-2xl font-black text-slate-900">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </section>
  );
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams?: Promise<{ settings?: string }>;
}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminUserId = process.env.ADMIN_USER_ID;

  if (!user || !adminUserId || user.id !== adminUserId) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const settingsMessage = params?.settings;

  const [countResult, logsResult, settingsResult] = await Promise.all([
    supabaseAdmin
      .from("ai_generation_logs")
      .select("id", { count: "exact", head: true }),

    supabaseAdmin
      .from("ai_generation_logs")
      .select(
        "id, created_at, subject_code, subject_name, unit_title, topic, language, model, status, input_tokens, output_tokens, total_tokens, estimated_cost_usd, duration_ms, error_status, error_message"
      )
      .order("created_at", { ascending: false })
      .limit(1000),

    supabaseAdmin
      .from("admin_settings")
      .select("key, value")
      .in("key", ["ai_enabled", "ai_hourly_limit"]),
  ]);

  const logs = (logsResult.data ?? []) as GenerationLog[];
  const totalGenerations = countResult.count ?? 0;

  const settings = settingsResult.data ?? [];

  const aiEnabledSetting = settings.find(
    (setting) => setting.key === "ai_enabled"
  )?.value;

  const hourlyLimitSetting = settings.find(
    (setting) => setting.key === "ai_hourly_limit"
  )?.value;

  const aiEnabled =
    typeof aiEnabledSetting === "boolean" ? aiEnabledSetting : false;

  const hourlyLimit =
    typeof hourlyLimitSetting === "number" &&
    Number.isInteger(hourlyLimitSetting) &&
    hourlyLimitSetting >= 1 &&
    hourlyLimitSetting <= 100
      ? hourlyLimitSetting
      : 5;

  const successCount = logs.filter((log) => log.status === "success").length;
  const failedCount = logs.filter((log) => log.status === "failed").length;
  const startedCount = logs.filter((log) => log.status === "started").length;

  const totalInputTokens = logs.reduce(
    (sum, log) => sum + (log.input_tokens ?? 0),
    0
  );

  const totalOutputTokens = logs.reduce(
    (sum, log) => sum + (log.output_tokens ?? 0),
    0
  );

  const totalTokens = logs.reduce(
    (sum, log) => sum + (log.total_tokens ?? 0),
    0
  );

  const knownCosts = logs
    .map((log) => log.estimated_cost_usd)
    .filter((cost): cost is number => cost !== null);

  const estimatedCost = knownCosts.reduce((sum, cost) => sum + cost, 0);

  const modelStats = new Map<string, number>();

  for (const log of logs) {
    const model = log.model || "Unknown";
    modelStats.set(model, (modelStats.get(model) ?? 0) + 1);
  }

  const models = Array.from(modelStats.entries()).sort(
    (a, b) => b[1] - a[1]
  );

  const today = new Date();

  const dailyStats = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const count = logs.filter((log) => {
      const created = new Date(log.created_at);
      return created >= date && created < nextDate;
    }).length;

    return {
      label: date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      }),
      count,
    };
  });

  const maxDailyCount = Math.max(
    ...dailyStats.map((day) => day.count),
    1
  );

  const recentLogs = logs.slice(0, 20);

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

      <div className="mx-auto max-w-7xl space-y-8 px-5 py-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Dashboard Overview
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            AI generation analytics and system usage.
          </p>
        </div>

        {settingsMessage === "updated" && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            AI settings successfully updated.
          </div>
        )}

        {settingsMessage === "invalid" && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Invalid settings. Hourly limit must be between 1 and 100.
          </div>
        )}

        {settingsMessage === "error" && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Settings could not be saved. Check server logs.
          </div>
        )}

        {countResult.error || logsResult.error || settingsResult.error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Some dashboard data could not be loaded. Check Supabase configuration.
          </div>
        ) : null}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                AI System Controls
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Control public AI notes generation.
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1.5 text-sm font-bold ${
                aiEnabled
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {aiEnabled ? "AI ENABLED" : "AI DISABLED"}
            </span>
          </div>

          <form action={updateAISettings} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="aiEnabled"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                AI Generation
              </label>

              <select
                id="aiEnabled"
                name="aiEnabled"
                defaultValue={String(aiEnabled)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 sm:max-w-xs"
              >
                <option value="true">Enabled — Students can generate notes</option>
                <option value="false">Disabled — Stop all new generations</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="hourlyLimit"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Maximum generations per IP per hour
              </label>

              <input
                id="hourlyLimit"
                name="hourlyLimit"
                type="number"
                min="1"
                max="100"
                required
                defaultValue={hourlyLimit}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 sm:max-w-xs"
              />

              <p className="mt-2 text-xs text-slate-500">
                Allowed range: 1–100. Users sharing the same public IP share
                this limit.
              </p>
            </div>

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
            >
              Save AI Settings
            </button>
          </form>
        </section>

        <section>
          <h3 className="mb-4 text-lg font-bold text-slate-900">
            AI Usage
          </h3>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Generations"
              value={formatNumber(totalGenerations)}
              description="All recorded requests"
            />
            <StatCard
              title="Successful"
              value={formatNumber(successCount)}
              description="Success in latest 1,000 records"
            />
            <StatCard
              title="Failed"
              value={formatNumber(failedCount)}
              description="Failed in latest 1,000 records"
            />
            <StatCard
              title="In Progress"
              value={formatNumber(startedCount)}
              description="Started in latest 1,000 records"
            />
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-lg font-bold text-slate-900">
            Token & Cost Analytics
          </h3>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Tokens"
              value={formatNumber(totalTokens)}
              description="Latest 1,000 records"
            />
            <StatCard
              title="Input Tokens"
              value={formatNumber(totalInputTokens)}
              description="Latest 1,000 records"
            />
            <StatCard
              title="Output Tokens"
              value={formatNumber(totalOutputTokens)}
              description="Latest 1,000 records"
            />
            <StatCard
              title="Estimated API Cost"
              value={
                knownCosts.length
                  ? `$${estimatedCost.toFixed(6)}`
                  : "Not available"
              }
              description={
                knownCosts.length
                  ? `${knownCosts.length} records with cost data`
                  : "Pricing calculation not configured yet"
              }
            />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">
            Daily Generations
          </h3>
          <p className="mb-6 mt-1 text-sm text-slate-500">
            Last 7 days, based on latest 1,000 records.
          </p>

          <div className="flex h-48 items-end justify-between gap-3">
            {dailyStats.map((day) => (
              <div
                key={day.label}
                className="flex h-full flex-1 flex-col items-center justify-end gap-2"
              >
                <span className="text-xs font-semibold text-slate-600">
                  {day.count}
                </span>
                <div className="flex h-32 w-full items-end">
                  <div
                    className="w-full rounded-t-md bg-blue-600"
                    style={{
                      height: `${Math.max(
                        (day.count / maxDailyCount) * 100,
                        day.count > 0 ? 5 : 0
                      )}%`,
                    }}
                  />
                </div>
                <span className="text-center text-xs text-slate-500">
                  {day.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">
            Model Analytics
          </h3>
          <p className="mb-5 mt-1 text-sm text-slate-500">
            Model-wise generation count in latest 1,000 records.
          </p>

          {models.length === 0 ? (
            <p className="text-sm text-slate-500">No model data available.</p>
          ) : (
            <div className="space-y-4">
              {models.map(([model, count]) => (
                <div key={model}>
                  <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm">
                    <span className="font-semibold text-slate-800">
                      {model}
                    </span>
                    <span className="text-slate-500">
                      {formatNumber(count)} generations
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{
                        width: `${(count / Math.max(logs.length, 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h3 className="text-lg font-bold text-slate-900">
              Recent Generation History
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Latest 20 AI generation requests.
            </p>
          </div>

          {recentLogs.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">
              No generation records found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Subject / Topic</th>
                    <th className="px-5 py-3">Model</th>
                    <th className="px-5 py-3">Tokens</th>
                    <th className="px-5 py-3">Duration</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="max-w-xs px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {log.subject_name || log.subject_code || "Unknown"}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {log.topic || log.unit_title || "No topic"}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {log.model || "Unknown"}
                      </td>
                      <td className="px-5 py-4 tabular-nums text-slate-600">
                        {formatNumber(log.total_tokens ?? 0)}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {log.duration_ms !== null
                          ? `${(log.duration_ms / 1000).toFixed(1)}s`
                          : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            log.status === "success"
                              ? "bg-green-100 text-green-700"
                              : log.status === "failed"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="text-xs text-slate-400">
          Analytics are calculated from the latest 1,000 generation records.
          Total Generations shows the database-wide count.
        </p>
      </div>
    </main>
  );
}
