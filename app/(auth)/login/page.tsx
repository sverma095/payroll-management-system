import Link from "next/link";
import { signIn } from "./actions";

export default function LoginPage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span className="text-xs font-mono tracking-wider text-ink/60 uppercase">
              Ledger access
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Payroll OS
          </h1>
          <p className="text-sm text-ink/50 mt-1">Sign in to your tenant</p>
        </div>

        <form
          action={signIn}
          className="bg-white border border-line rounded-xl p-6 shadow-sm space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-ink/70 mb-1.5">
              Work email
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="you@company.com"
              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink/70 mb-1.5">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </div>

          {searchParams?.error && (
            <p className="text-sm text-warn">{searchParams.error}</p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-accent text-white text-sm font-medium py-2.5 hover:bg-accent/90 transition-colors"
          >
            Sign in
          </button>

          <div className="flex items-center justify-between text-xs pt-1">
            <Link href="/forgot-password" className="text-accent hover:underline">
              Forgot password?
            </Link>
            <Link href="/signup" className="text-accent hover:underline">
              Have an invite code?
            </Link>
          </div>
        </form>

        <p className="text-xs text-center text-ink/40 mt-6">
          Data is isolated per company. One company cannot access another
          company&apos;s records.
        </p>
      </div>
    </main>
  );
}
