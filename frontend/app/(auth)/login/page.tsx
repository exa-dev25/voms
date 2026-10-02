"use client";

import { signIn, getSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  Truck,
} from "lucide-react";

const demoAccounts = [
  { role: "Viewer", email: "viewer@example.com" },
  { role: "User", email: "user@example.com" },
  { role: "Admin", email: "admin@example.com" },
  { role: "Super Admin", email: "superadmin@example.com" },
];

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("Invalid email or password");
      }

      const session = await getSession();

      if (!session || !session.accessToken) {
        throw new Error("Login gagal, token tidak ditemukan.");
      }

      localStorage.setItem("token", session.accessToken);
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Login gagal. Silakan coba lagi.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className='relative min-h-screen w-full overflow-hidden bg-[#08111a] text-slate-100'>
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_18%_45%,rgba(8,145,178,0.14),transparent_38%),radial-gradient(ellipse_at_82%_10%,rgba(56,189,248,0.08),transparent_30%)]'
      />
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(148,163,184,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.7)_1px,transparent_1px)] [background-size:44px_44px]'
      />

      <div className='relative mx-auto grid min-h-screen w-full max-w-7xl items-center gap-12 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_440px] lg:px-14 lg:py-12'>
        <section className='hidden max-w-2xl lg:block'>
          <div className='inline-flex items-center gap-3'>
            <span className='flex h-11 w-11 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-300'>
              <Truck className='h-5 w-5' aria-hidden='true' />
            </span>
            <span className='text-sm font-semibold tracking-wide text-slate-200'>
              VOMS{" "}
              <span className='ml-2 font-normal text-slate-500'>
                Fleet operations
              </span>
            </span>
          </div>

          <p className='mt-16 flex items-center gap-2 text-xs font-semibold uppercase text-cyan-300'>
            <Activity className='h-4 w-4' aria-hidden='true' />
            Vehicle operations, at a glance
          </p>
          <h1 className='mt-5 max-w-xl text-5xl font-semibold leading-[1.08] text-white'>
            Every route. <span className='text-slate-400'>One clear view.</span>
          </h1>
          <p className='mt-5 max-w-lg text-base leading-7 text-slate-400'>
            Sign in to monitor fleet activity, trip progress, and vehicle
            status.
          </p>

          <div className='relative mt-12 max-w-xl overflow-hidden rounded-lg border border-slate-700/70 bg-[#0c1722]/80 p-5'>
            <div className='flex items-center justify-between text-[11px] font-medium uppercase text-slate-500'>
              <span>Route overview</span>
              <span className='flex items-center gap-2 normal-case text-emerald-300'>
                <span className='h-1.5 w-1.5 rounded-full bg-emerald-400' />
                Monitoring ready
              </span>
            </div>
            <div className='relative mt-5 h-24'>
              <svg
                className='absolute inset-0 h-full w-full'
                viewBox='0 0 560 96'
                fill='none'
                preserveAspectRatio='none'
                aria-hidden='true'
              >
                <path
                  d='M18 70H114L156 32H265L304 62H392L435 25H542'
                  stroke='#243746'
                  strokeWidth='10'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <path
                  d='M18 70H114L156 32H265L304 62H392L435 25H542'
                  stroke='#29b6d4'
                  strokeWidth='2.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeDasharray='7 8'
                />
              </svg>
              <span className='absolute left-[2%] top-[62%] h-3 w-3 rounded-full border-2 border-[#0c1722] bg-slate-300 shadow-[0_0_0_4px_rgba(148,163,184,0.14)]' />
              <span className='absolute left-[52%] top-[27%] flex h-8 w-8 items-center justify-center rounded-full border border-cyan-200/40 bg-cyan-300/15 text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.2)]'>
                <Truck className='h-4 w-4' aria-hidden='true' />
              </span>
              <span className='absolute right-[1%] top-[17%] h-3 w-3 rounded-full border-2 border-[#0c1722] bg-emerald-300 shadow-[0_0_0_4px_rgba(52,211,153,0.14)]' />
            </div>
            <div className='mt-3 flex items-center justify-between border-t border-slate-800 pt-4 text-xs text-slate-400'>
              <span className='flex items-center gap-2'>
                <MapPin
                  className='h-3.5 w-3.5 text-slate-500'
                  aria-hidden='true'
                />{" "}
                Origin
              </span>
              <span className='text-slate-600'>Live position</span>
              <span className='flex items-center gap-2'>
                Destination{" "}
                <MapPin
                  className='h-3.5 w-3.5 text-emerald-400'
                  aria-hidden='true'
                />
              </span>
            </div>
          </div>

          <p className='mt-12 text-xs text-slate-600'>
            © 2026 Fleet Management Dashboard
          </p>
        </section>

        <section className='mx-auto w-full max-w-[440px]'>
          <div className='mb-7 flex items-center gap-3 lg:hidden'>
            <span className='flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-300'>
              <Truck className='h-5 w-5' aria-hidden='true' />
            </span>
            <div>
              <p className='text-sm font-semibold text-white'>VOMS</p>
              <p className='text-xs text-slate-500'>Fleet operations</p>
            </div>
          </div>

          <div className='rounded-lg border border-slate-700/70 bg-[#101c28]/95 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-8'>
            <div className='mb-7'>
              <div className='mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-300'>
                <LockKeyhole className='h-5 w-5' aria-hidden='true' />
              </div>
              <h2 className='text-2xl font-semibold text-white'>
                Welcome back
              </h2>
              <p className='mt-2 text-sm text-slate-400'>
                Sign in to access your dashboard.
              </p>
            </div>

            {error && (
              <div
                role='alert'
                className='mb-5 rounded-md border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-200'
              >
                {error}
              </div>
            )}

            <form className='space-y-5' onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor='email'
                  className='mb-2 block text-sm font-medium text-slate-300'
                >
                  Email address
                </label>
                <input
                  id='email'
                  type='email'
                  autoComplete='username'
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className='h-12 w-full rounded-md border border-slate-600 bg-[#0a141e] px-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15'
                  placeholder='name@company.com'
                />
              </div>

              <div>
                <div className='mb-2 flex items-center justify-between'>
                  <label
                    htmlFor='password'
                    className='block text-sm font-medium text-slate-300'
                  >
                    Password
                  </label>
                </div>
                <div className='relative'>
                  <input
                    id='password'
                    type={showPassword ? "text" : "password"}
                    autoComplete='current-password'
                    required
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className='h-12 w-full rounded-md border border-slate-600 bg-[#0a141e] px-3.5 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15'
                    placeholder='Enter your password'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    title={showPassword ? "Hide password" : "Show password"}
                    className='absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 transition hover:text-slate-200'
                  >
                    {showPassword ? (
                      <EyeOff className='h-4 w-4' aria-hidden='true' />
                    ) : (
                      <Eye className='h-4 w-4' aria-hidden='true' />
                    )}
                  </button>
                </div>
              </div>

              <button
                type='submit'
                disabled={isLoading}
                className='flex h-12 w-full items-center justify-center gap-2 rounded-md bg-cyan-400 px-4 text-sm font-semibold text-[#06212a] transition hover:bg-cyan-300 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60'
              >
                {isLoading ? (
                  <>
                    <LoaderCircle
                      className='h-4 w-4 animate-spin'
                      aria-hidden='true'
                    />{" "}
                    Signing in
                  </>
                ) : (
                  <>
                    Sign in{" "}
                    <ArrowRight className='h-4 w-4' aria-hidden='true' />
                  </>
                )}
              </button>
            </form>

            <div className='mt-7 border-t border-slate-800 pt-5'>
              <div className='mb-3 flex items-center justify-between'>
                <p className='text-xs font-semibold uppercase text-slate-500'>
                  Demo access
                </p>
                <span className='text-xs text-slate-600'>
                  Password: <code className='text-slate-400'>Pw123</code>
                </span>
              </div>
              <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                {demoAccounts.map((account) => (
                  <div
                    key={account.email}
                    className='min-w-0 rounded-md bg-[#0a141e] px-3 py-2'
                  >
                    <p className='text-[11px] text-slate-500'>{account.role}</p>
                    <code className='block truncate text-xs text-cyan-200'>
                      {account.email}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className='mt-5 text-center text-xs text-slate-600 lg:hidden'>
            © 2026 Fleet Management Dashboard
          </p>
        </section>
      </div>
    </main>
  );
}
