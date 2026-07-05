"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTransaction } from "@/lib/TransactionContext";
import AnimatedTrails from "./AnimatedTrails";

type RoleMeta = { label: string; navLinks: { label: string; icon: string; href: string }[] };

const ROLE_META: Record<string, RoleMeta> = {
  peminjam: {
    label: "Borrower",
    navLinks: [
      { label: "Requests", icon: "add_circle", href: "/pengajuan" },
    ],
  },
  koordinator: {
    label: "Koordinator",
    navLinks: [
      { label: "Approvals", icon: "gavel", href: "/koordinator" },
    ],
  },
  petugas: {
    label: "Officer",
    navLinks: [
      { label: "Control", icon: "inventory_2", href: "/petugas" },
    ],
  },
};

interface DashboardLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
  pageSubtitle?: string;
  headerActions?: React.ReactNode;
}

export default function DashboardLayout({ children, pageTitle, pageSubtitle, headerActions }: DashboardLayoutProps) {
  const router = useRouter();
  const { user, logout } = useTransaction();
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);

  if (!user) return null;

  const meta = ROLE_META[user.role] || ROLE_META["peminjam"] as RoleMeta;

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const displayName = user.role || "?";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col antialiased relative overflow-x-hidden">
      <AnimatedTrails />

      {/* ─── TopNavBar ─── */}
      <nav className="bg-surface/80 backdrop-blur-md shadow-sm shadow-primary/5 sticky top-0 z-50 border-b border-outline-variant/20">
        <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop h-16 max-w-container-max mx-auto">
          {/* Brand */}
          <div className="font-display-lg text-headline-md tracking-tighter text-primary flex items-center gap-2">
            <img src="/bki-logo.svg" alt="BKI Sorong Logo" className="h-8 w-auto object-contain" />
            <span className="hidden md:inline">PINSET</span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-stack-lg">
            {meta.navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-primary font-bold border-b-2 border-primary pb-1 font-label-md text-label-md hover:bg-surface-container-highest/20 rounded-lg px-3 py-2 transition-all duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Trailing Actions */}
          <div className="flex items-center gap-stack-sm text-primary">
            {/* Role Badge */}
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full font-code-hud text-code-hud text-primary uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_4px_#3525cd]"></span>
              {meta.label}
            </span>
            
            <button onClick={() => setShowLogoutModal(true)} className="p-2 hover:bg-surface-container-highest/20 rounded-full transition-colors" title="Logout">
              <span className="material-symbols-outlined">logout</span>
            </button>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-tertiary flex items-center justify-center text-on-primary font-label-md text-[12px] shadow-sm border border-outline-variant/30">
              {initials}
            </div>
          </div>
        </div>
      </nav>

      {/* ─── Main Content Canvas ─── */}
      <main className="flex-1 w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg flex flex-col gap-stack-lg relative z-10">
        {/* Page Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-stack-md mb-stack-sm">
          <div>
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-background mb-2">{pageTitle}</h1>
            {pageSubtitle && (
              <p className="text-on-surface-variant font-body-md text-body-md">{pageSubtitle}</p>
            )}
          </div>
          {headerActions}
        </header>

        {children}
      </main>

      {/* ─── Footer ─── */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant/20 py-8 mt-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto font-body-md text-body-md text-on-surface-variant gap-stack-md">
          <div className="font-display-lg text-headline-md flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
            <img src="/bki-logo.svg" alt="BKI Sorong Logo" className="h-6 w-auto object-contain grayscale opacity-70" />
            <span className="hidden md:inline text-sm font-bold">PINSET</span>
          </div>
          <div className="flex gap-stack-lg text-sm text-center">
            <span className="text-on-surface-variant opacity-80">PT Biro Klasifikasi Indonesia (Persero)</span>
            <span className="text-on-surface-variant opacity-80">Cabang Sorong</span>
          </div>
          <div className="text-sm opacity-80 text-center">
            © 2026 PINSET Industrial Systems. All Rights Reserved.
          </div>
        </div>
      </footer>
      {/* ─── Logout Modal ─── */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-surface dark:bg-inverse-surface rounded-[24px] p-6 w-full max-w-sm ambient-shadow-lvl2 border border-outline-variant/20 relative animate-fadeIn text-center">
            <h3 className="font-headline-md text-lg text-on-surface dark:text-inverse-on-surface mb-2">Konfirmasi Keluar</h3>
            <p className="text-sm text-on-surface-variant dark:text-outline-variant mb-6">Apakah Anda yakin ingin keluar dari sistem?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface py-3 rounded-xl font-bold text-sm transition-all"
              >
                Batal
              </button>
              <button 
                onClick={handleLogout}
                className="flex-1 bg-error hover:bg-error/90 text-on-error py-3 rounded-xl font-bold text-sm transition-all"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
