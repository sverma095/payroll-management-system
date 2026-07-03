import Link from "next/link";
import { requestReset } from "./actions";

export default function ForgotPasswordPage({
  searchParams
}: {
  searchParams: { error?: string; sent?: string };
}) {
  if (searchParams?.sent) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-ink mb-6">Check your email</h1>
          <div className="bg-white border border-line rounded-xl p-6 shadow-sm">
            <p className="text-sm text-ink/70">
              If an account exists for that address, we&apos;ve sent a link to reset your
              password.
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
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Reset your password</h1>
          <p className="text-sm text-ink/50 mt-1">
            We&apos;ll email you a link to set a new one
          </p>
        </div>

        <form
          action={requestReset}
          className="bg-white border border-line rounded-xl p-6 shadow-sm space-y-4"
        >
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

          {searchParams?.error && <p className="text-sm text-warn">{searchParams.error}</p>}

          <button
            type="submit"
            className="w-full rounded-lg bg-accent text-white text-sm font-medium py-2.5 hover:bg-accent/90 transition-colors"
          >
            Send reset link
          </button>
        </form>

        <p className="text-xs text-center text-ink/40 mt-6">
          <Link href="/login" className="text-accent hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
