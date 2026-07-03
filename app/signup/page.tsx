import Link from "next/link";
import { signUp } from "./actions";

export default function SignupPage({
  searchParams
}: {
  searchParams: { error?: string; sent?: string };
}) {
  if (searchParams?.sent) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span className="text-xs font-mono tracking-wider text-ink/60 uppercase">
                Ledger access
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Check your email</h1>
          </div>
          <div className="bg-white border border-line rounded-xl p-6 shadow-sm">
            <p className="text-sm text-ink/70">
              We&apos;ve sent a confirmation link to your inbox. Open it to finish setting up
              your account.
            </p>
          </div>
          <Link href="/login" className="text-xs text-ink/40 mt-6 inline-block hover:text-ink/60">
            Back to sign in
          </Link>
        </div>
      </main>
    );
  }

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
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Create your account</h1>
          <p className="text-sm text-ink/50 mt-1">
            You&apos;ll need the invite code from your employer
          </p>
        </div>

        <form
          action={signUp}
          className="bg-white border border-line rounded-xl p-6 shadow-sm space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-ink/70 mb-1.5">Invite code</label>
            <input
              type="text"
              name="invite_code"
              required
              placeholder="e.g. INV-4F82A1"
              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink/70 mb-1.5">Work email</label>
            <input
              type="email"
              name="email"
              required
              placeholder="you@company.com"
              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink/70 mb-1.5">Password</label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              placeholder="At least 8 characters"
              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink/70 mb-1.5">
              Confirm password
            </label>
            <input
              type="password"
              name="confirm_password"
              required
              minLength={8}
              placeholder="••••••••"
              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </div>

          {searchParams?.error && <p className="text-sm text-warn">{searchParams.error}</p>}

          <button
            type="submit"
            className="w-full rounded-lg bg-accent text-white text-sm font-medium py-2.5 hover:bg-accent/90 transition-colors"
          >
            Create account
          </button>
        </form>

        <p className="text-xs text-center text-ink/40 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
