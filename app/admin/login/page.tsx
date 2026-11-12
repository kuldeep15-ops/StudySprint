
import { loginAdmin } from "./actions";

export const instant = false;

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({
  searchParams,
}: LoginPageProps) {
  const { error } = await searchParams;

  const errorMessages: Record<string, string> = {
    missing: "Email aur password dono enter karo.",
    config: "Admin configuration missing hai.",
    invalid: "Email ya password galat hai.",
    unauthorized: "Tumhe admin access nahi hai.",
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-slate-900">
            StudySprint
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Private Admin Dashboard
          </p>
        </div>

        <h2 className="mb-6 text-xl font-bold text-slate-800">
          Admin Login
        </h2>

        {error && errorMessages[error] && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {errorMessages[error]}
          </p>
        )}

        <form action={loginAdmin} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="Admin email"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="Password"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700"
          >
            Login to Admin
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Authorized administrator access only.
        </p>
      </div>
    </main>
  );
}
