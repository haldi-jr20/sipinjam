"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

const TransactionContext = createContext<any>(null);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<Record<string, any>>({});
  const [alatList, setAlatList] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const json = await res.json();
      const map: Record<string, any> = {};
      json.forEach((u: any) => (map[u.email] = u));
      setAccounts(map);
    } catch (e) {}
  };

  const fetchAlat = async () => {
    try {
      const res = await fetch('/api/alat');
      const json = await res.json();
      setAlatList(json);
    } catch (e) {}
  };

  const fetchTransaksi = async () => {
    try {
      const res = await fetch('/api/transaksi');
      const json = await res.json();
      setData(json);
    } catch (e) {}
  };

  const refreshAll = async () => {
    await Promise.all([fetchUsers(), fetchAlat(), fetchTransaksi()]);
    setIsLoaded(true);
  };

  useEffect(() => {
    const savedUser = sessionStorage.getItem("sipinjam_user");
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch (e) {}
    }
    refreshAll();
  }, []);

  const login = (userData: any) => {
    sessionStorage.setItem("sipinjam_user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    sessionStorage.removeItem("sipinjam_user");
    setUser(null);
  };

  const registerUser = async (email: string, name: string, role: string, instansi: string, divisi: string, id_card: string = "", password: string = "sipinjam123") => {
    const emailKey = email.toLowerCase().trim();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailKey, name, role, instansi, divisi, account_status: role === "peminjam" ? "pending" : "approved", id_card, password })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal mendaftarkan akun.");
      }
      await fetchUsers();
      return accounts; // Note: this might be stale, but caller just needs success
    } catch (error: any) {
      throw new Error(error.message || "Gagal mendaftarkan akun.");
    }
  };

  // Mocked missing user API endpoints for update/delete as they are not explicitly written yet
  // If the app relies on them, we'd need them. For now, just refresh or skip.
  const approveAccount = async (email: string) => { /* Not implemented in API yet */ };
  const rejectAccount = async (email: string) => { /* Not implemented in API yet */ };
  const deleteAccount = async (email: string) => { /* Not implemented in API yet */ };
  const changePassword = async (email: string, newPassword: string) => { /* Not implemented in API yet */ };

  const tambahAlat = async (kode: string, nama: string, kategori: string, jumlah: number = 1) => {
    await fetch('/api/alat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kode, nama, kategori, jumlah })
    });
    await fetchAlat();
  };

  const ajukanPeminjaman = async (payload: any) => {
    const res = await fetch('/api/transaksi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await fetchTransaksi();
  };

  const updateStatus = async (id: number, action: "APPROVE" | "REJECT" | "KELUAR" | "KEMBALI", petugas?: string, kondisi?: string, catatan?: string) => {
    await fetch('/api/transaksi', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action, petugas, kondisi, catatan })
    });
    await fetchTransaksi();
    if (action === "APPROVE" || action === "KEMBALI") {
      await fetchAlat(); // Refresh stock
    }
  };

  return (
    <TransactionContext.Provider
      value={{
        data,
        alatList,
        user,
        accounts,
        isLoaded,
        login,
        logout,
        registerUser,
        approveAccount,
        rejectAccount,
        deleteAccount,
        changePassword,
        tambahAlat,
        ajukanPeminjaman,
        updateStatus,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransaction() {
  return useContext(TransactionContext);
}
