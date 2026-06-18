"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTransaction } from "@/lib/TransactionContext";
import AnimatedTrails from "@/components/ui/AnimatedTrails";

const ROUTE: Record<string, string> = {
  koordinator: "/koordinator",
  petugas: "/petugas",
};

export default function LoginPage() {
  const router = useRouter();
  const { login, user, accounts } = useTransaction();

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (user && ROUTE[user.role]) {
      router.push(ROUTE[user.role]);
    }
  }, [user, router]);

  function doLogin() {
    const a = accounts[email.toLowerCase().trim()];
    if (!a) { setErr("Email tidak terdaftar."); return; }
    
    // Peminjam cannot login anymore
    if (a.role === "peminjam") {
      setErr("Akses ditolak. Hubungi Petugas untuk peminjaman.");
      return;
    }

    const userPass = a.password || "sipinjam123";
    if (pass !== userPass) { setErr("Password salah."); return; }
    
    login({ ...a, email });
    router.push(ROUTE[a.role] || "/");
  }

  return (
    <div className="bg-background text-on-background min-h-screen flex items-center justify-center relative overflow-hidden antialiased">
      <AnimatedTrails />
      {/* Glowing Radial Background */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[800px] bg-primary rounded-full blur-[120px] opacity-10 transform translate-y-1/4"></div>
      </div>

      {/* Main Content Container */}
      <main className="relative z-10 w-full max-w-md px-margin-mobile md:px-0">
        {/* Brand Header */}
        <div className="text-center mb-stack-lg flex flex-col items-center">
          <img src="/bki-logo.svg" alt="BKI Sorong Logo" className="h-16 w-auto mb-4" />
          <h1 className="font-display-lg text-display-lg text-on-background tracking-tighter">
            SiPinjam<span className="text-primary">.</span>
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-stack-xs">
            PT Biro Klasifikasi Indonesia (Persero) Cabang Sorong
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-surface border border-outline-variant/50 rounded-2xl p-stack-lg md:p-margin-desktop shadow-xl shadow-primary/5">
          <div className="text-center mb-6">
            <h2 className="font-headline-md text-on-surface">Staff Portal</h2>
            <p className="text-on-surface-variant text-sm mt-1">Masuk sebagai Petugas atau Koordinator</p>
          </div>

          {/* Error Message Global */}
          {err && <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-lg text-sm">{err}</div>}

          {/* LOGIN VIEW */}
          <div className="block animate-[fadeIn_0.3s_ease-out]">
            <form className="flex flex-col gap-stack-md" onSubmit={(e) => { e.preventDefault(); doLogin(); }}>
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-label-md text-on-surface-variant ml-1">Email Karyawan</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">mail</span>
                  <input
                    value={email} onChange={e => { setEmail(e.target.value); setErr(""); }}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-10 pr-4 py-3 font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none placeholder:text-outline/70"
                    placeholder="nama@sipinjam.com" type="email"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-md text-label-md text-on-surface-variant ml-1">Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">lock</span>
                  <input
                    value={pass} onChange={e => { setPass(e.target.value); setErr(""); }}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-10 pr-10 py-3 font-body-md text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none placeholder:text-outline/70"
                    placeholder="••••••••" type={show ? "text" : "password"}
                  />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant">
                    <span className="material-symbols-outlined">{show ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <button
                disabled={!email || !pass}
                className="mt-stack-sm w-full bg-primary hover:bg-primary-container disabled:bg-outline disabled:cursor-not-allowed text-on-primary font-label-md text-label-md py-3.5 rounded-lg shadow-md shadow-primary/20 transition-all flex justify-center items-center gap-2 group"
                type="submit"
              >
                Sign In
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer subtly integrated */}
        <p className="text-center font-code-hud text-code-hud text-on-surface-variant/70 mt-stack-lg">
          PROTECTED BY ENTERPRISE ENCRYPTION PROTOCOLS
        </p>
      </main>
    </div>
  );
}
