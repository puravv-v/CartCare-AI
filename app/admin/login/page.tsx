"use client";

import Link from "next/link";
import { useState } from "react";

export default function AdminLoginPage() {
  const [passcode, setPasscode] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || !passcode) return;

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(
          response.status === 401
            ? "Those administrator credentials aren’t valid. Please try again."
            : "Admin sign-in is unavailable right now. Please try again shortly."
        );
        return;
      }
      if (data.ok) window.location.assign("/admin/tickets");
      else setError("Admin sign-in is unavailable right now. Please try again shortly.");
    } catch {
      setError("We couldn’t reach CartCare AI. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f6f3] px-4 py-8 sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute -left-36 -top-32 h-96 w-96 rounded-full bg-violet-200/50 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 -right-32 h-[28rem] w-[28rem] rounded-full bg-indigo-100/70 blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_24px_80px_rgba(35,31,56,0.12)] lg:min-h-[590px] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-[#17182c] p-10 text-white lg:flex xl:p-12">
          <div aria-hidden="true" className="absolute -right-28 -top-24 h-80 w-80 rounded-full border border-violet-300/10" />
          <div aria-hidden="true" className="absolute -right-12 -top-8 h-48 w-48 rounded-full border border-violet-300/10" />
          <div aria-hidden="true" className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" />
          <Brand dark />
          <div className="relative max-w-md pb-6">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07] text-violet-200">
              <ShieldIcon />
            </div>
            <p className="text-sm font-medium text-violet-200">CartCare AI Admin Portal</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight xl:text-[34px]">
              Every customer request, handled with care.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">
              A focused workspace for reviewing support tickets and helping customers move forward.
            </p>
            <div className="mt-8 flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Protected administrator access
            </div>
          </div>
          <p className="relative text-[11px] text-slate-500">CartCare AI · Administrator workspace</p>
        </section>

        <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-11">
          <div className="w-full max-w-sm">
            <div className="mb-9 lg:hidden">
              <Brand />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">Admin portal</p>
            <h1 className="mt-3 text-[30px] font-semibold tracking-tight text-slate-900">Administrator Login</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Manage customer support and resolve requests.
            </p>

            <form onSubmit={handleSubmit} className="mt-8">
              <label htmlFor="admin-passcode" className="mb-2 block text-sm font-medium text-slate-700">
                Administrator passcode
              </label>
              <div className="relative">
                <input
                  id="admin-passcode"
                  name="passcode"
                  type={showPasscode ? "text" : "password"}
                  autoComplete="current-password"
                  autoFocus
                  required
                  maxLength={100}
                  value={passcode}
                  onChange={(event) => setPasscode(event.target.value)}
                  placeholder="Enter administrator passcode"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-16 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />
                <button
                  type="button"
                  aria-label={showPasscode ? "Hide administrator passcode" : "Show administrator passcode"}
                  aria-pressed={showPasscode}
                  onClick={() => setShowPasscode((shown) => !shown)}
                  className="absolute inset-y-0 right-0 flex items-center px-4 text-xs font-semibold text-slate-500 transition hover:text-violet-700 focus:outline-none focus-visible:text-violet-700"
                >
                  {showPasscode ? "Hide" : "Show"}
                </button>
              </div>

              {error && (
                <p role="alert" className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-3 text-sm leading-5 text-rose-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !passcode}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_6px_14px_rgba(109,40,217,0.18)] transition hover:bg-violet-800 hover:shadow-[0_8px_18px_rgba(109,40,217,0.23)] focus:outline-none focus:ring-4 focus:ring-violet-200 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Securing your session…
                  </>
                ) : (
                  <>Sign in securely <span aria-hidden="true">→</span></>
                )}
              </button>
            </form>

            <div className="my-7 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Customer portal</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>
            <Link
              href="/login"
              className="block rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50/60 hover:text-violet-800 focus:outline-none focus:ring-4 focus:ring-violet-100"
            >
              Are you a customer? <span className="text-violet-700">Sign in to Customer Portal</span>
            </Link>
            <p className="mt-7 text-center text-[11px] text-slate-400">Authorized CartCare AI administrators only</p>
          </div>
        </section>
      </div>
    </main>
  );
}

function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-lg font-bold text-white shadow-lg shadow-violet-950/20">
        C
      </div>
      <div>
        <p className={`text-base font-semibold tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>CartCare AI</p>
        <p className={`text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>Administrator workspace</p>
      </div>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3 19 6v5c0 4.5-2.9 8-7 10-4.1-2-7-5.5-7-10V6l7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
