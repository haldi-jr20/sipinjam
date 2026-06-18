"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, XCircle, CheckCircle, X, Wrench, PackageSearch, Tag, Users, UserCheck, UserX, IdCard, Clock } from "lucide-react";
import { useTransaction } from "@/lib/TransactionContext";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { PhaseChip, FlowTracker, fmtRel, Avt, Empty } from "@/components/ui/SharedUI";

export default function KoordinatorPage() {
  const router = useRouter();
  const { user, data, dispatch, alatList, accounts, approveAccount, rejectAccount, deleteAccount } = useTransaction();

  const [tab, setTab] = useState("pending");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [alasan, setAlasan] = useState("");
  const [rejectEmail, setRejectEmail] = useState<string | null>(null);
  const [viewIdCard, setViewIdCard] = useState<{name:string, src:string, status:string, email:string}|null>(null);
  const [revokeEmail, setRevokeEmail] = useState<string | null>(null);
  const [revokeConfirmStep, setRevokeConfirmStep] = useState(1);

  useEffect(() => {
    if (!user) router.push("/login");
    else if (user.role !== "koordinator") router.push(`/${user.role}`);
  }, [user, router]);

  if (!user || user.role !== "koordinator") return null;

  const pending = data.filter((t: any) => t.persetujuan_koordinator === "pending").sort((a: any, b: any) => b.nomor - a.nomor);
  const semua = data.slice().sort((a: any, b: any) => b.nomor - a.nomor);

  const peminjamPending = Object.entries(accounts).filter(([,v]: any) => v.role === "peminjam" && v.account_status === "pending");
  const peminjamAktif = Object.entries(accounts).filter(([,v]: any) => v.role === "peminjam" && v.account_status === "approved");
  const peminjamDitolak = Object.entries(accounts).filter(([,v]: any) => v.role === "peminjam" && v.account_status === "rejected");

  // Inventory Calculation
  const inventory = alatList.map((alat: any) => {
    const trx = data.filter((t: any) => t.barcode_aset === alat.kode);
    const activeTrx = trx.filter((t: any) => t.persetujuan_koordinator === "approved" && !t.waktu_kembali);
    const completed = trx.filter((t: any) => t.waktu_kembali).sort((a: any, b: any) => new Date(b.waktu_kembali).getTime() - new Date(a.waktu_kembali).getTime());
    
    const dipinjamCount = activeTrx.length;
    const total = alat.jumlah || 1;
    const tersediaCount = total - dipinjamCount;
    const lastCondition = "Baik";
    
    return { 
      ...alat, 
      total,
      tersediaCount,
      dipinjamCount,
      status: tersediaCount > 0 ? "Tersedia" : "Dipinjam",
      kondisi: lastCondition 
    };
  });

  const invStats = [
    ["Total Alat", inventory.reduce((s:number, i:any)=>s + i.total, 0), "inventory_2", "text-on-surface"],
    ["Tersedia", inventory.reduce((s:number, i:any)=>s + i.tersediaCount, 0), "check_circle", "text-secondary"],
    ["Dipinjam", inventory.reduce((s:number, i:any)=>s + i.dipinjamCount, 0), "outbound", "text-primary"],
  ];

  const kategoriStats = alatList.reduce((acc: any, alat: any) => {
    acc[alat.kategori] = (acc[alat.kategori] || 0) + (alat.jumlah || 1);
    return acc;
  }, {});

  const stats = [
    { label: "Menunggu Approval", val: pending.length, icon: "pending_actions", color: "text-tertiary" },
    { label: "Disetujui", val: data.filter((t: any) => t.persetujuan_koordinator === "approved").length, icon: "verified", color: "text-secondary" },
    { label: "Ditolak", val: data.filter((t: any) => t.persetujuan_koordinator === "rejected").length, icon: "cancel", color: "text-error" },
    { label: "Peminjam Aktif", val: peminjamAktif.length, icon: "group", color: "text-primary" }
  ];

  function TrxCard({ t }: { t: any }) {
    return (
      <div className="bg-surface dark:bg-surface-container-lowest/5 rounded-[20px] p-5 border border-outline-variant/10 ambient-shadow-lvl1 flex flex-col gap-4">
        <div className="flex justify-between items-start gap-2">
          <div>
            <h3 className="font-bold text-on-surface dark:text-inverse-on-surface text-sm">{t.nama_alat_produksi}</h3>
          </div>
          <PhaseChip trx={t}/>
        </div>

        <div className="pt-3 border-t border-outline-variant/10 flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
              {t.peminjam?.substring(0, 2).toUpperCase() || "U"}
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface dark:text-inverse-on-surface">{t.peminjam}</p>
              <p className="text-[10px] text-outline-variant">TRX-{t.nomor}</p>
            </div>
          </div>
        </div>

        {t.persetujuan_koordinator === "pending" && (
          <div className="flex gap-2 mt-2">
            <button onClick={()=>{setRejectId(t.nomor);setAlasan("");}} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-error/30 bg-error-container/10 text-error hover:bg-error-container/30 transition-colors text-xs font-bold">
              <XCircle size={14}/> Tolak
            </button>
            <button onClick={()=>dispatch({type:"APPROVE",id:t.nomor})} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-secondary/30 bg-secondary-container/10 text-secondary hover:bg-secondary-container/30 transition-colors text-xs font-bold">
              <CheckCircle size={14}/> Setujui
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- Header Actions ---
  const headerTabs = (
    <div className="flex bg-surface-container-low dark:bg-surface-container-high/20 p-1 rounded-xl border border-outline-variant/10 ambient-shadow-lvl1 overflow-x-auto hide-scrollbar">
      {[
        { id: "pending", label: `Perlu Ditinjau ${pending.length > 0 ? `(${pending.length})` : ''}`, icon: "gavel" },
        { id: "semua", label: "Semua Transaksi", icon: "receipt_long" },
        { id: "inventaris", label: "Inventaris", icon: "handyman" },
        { id: "peminjam", label: `Kelola Akun ${peminjamPending.length > 0 ? `(${peminjamPending.length}!)` : ''}`, icon: "manage_accounts" }
      ].map(t => (
        <button 
          key={t.id} 
          onClick={() => setTab(t.id)}
          className={`px-5 py-2 rounded-lg font-label-md text-[13px] transition-all flex items-center gap-2 whitespace-nowrap ${
            tab === t.id 
              ? "bg-primary text-on-primary shadow-sm" 
              : "text-on-surface-variant dark:text-outline-variant hover:text-primary dark:hover:text-primary-fixed-dim"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: tab === t.id ? "'FILL' 1" : "'FILL' 0" }}>{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  );

  return (
    <DashboardLayout 
      pageTitle="Otorisasi & Manajemen" 
      pageSubtitle="Koordinator Overview"
      headerActions={headerTabs}
    >
      
      {/* ─── MODALS ─── */}
      {rejectId && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-surface dark:bg-inverse-surface rounded-[24px] p-6 w-full max-w-sm ambient-shadow-lvl2 border border-outline-variant/20 relative animate-fadeIn">
            <button onClick={()=>setRejectId(null)} className="absolute top-4 right-4 text-outline hover:text-error"><X size={20}/></button>
            <h3 className="font-headline-md text-lg text-on-surface dark:text-inverse-on-surface mb-2">Tolak Pengajuan</h3>
            <p className="text-sm text-on-surface-variant dark:text-outline-variant mb-4">Berikan alasan penolakan agar peminjam mengetahui penyebabnya.</p>
            <textarea 
              autoFocus 
              placeholder="Alasan penolakan..." 
              value={alasan} 
              onChange={e=>setAlasan(e.target.value)} 
              className="w-full bg-background dark:bg-surface-container-lowest/5 border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface dark:text-inverse-on-surface focus:border-error focus:ring-1 focus:ring-error outline-none transition-all font-body-md text-sm resize-none mb-4"
              rows={3}
            />
            <button 
              disabled={!alasan.trim()} 
              onClick={()=>{dispatch({type:"REJECT",id:rejectId,alasan});setRejectId(null);}} 
              className="w-full bg-error text-on-error py-3 rounded-xl font-bold text-sm hover:shadow-lg disabled:opacity-50 transition-all"
            >
              Kirim Penolakan
            </button>
          </div>
        </div>
      )}

      {viewIdCard && (
        <div className="fixed inset-0 bg-on-surface/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-surface dark:bg-inverse-surface rounded-[24px] p-2 w-full max-w-md ambient-shadow-lvl2 border border-outline-variant/20 relative flex flex-col animate-fadeIn">
            <div className="flex justify-between items-center p-4 pb-2 border-b border-outline-variant/10">
              <h3 className="font-headline-md text-sm text-on-surface dark:text-inverse-on-surface flex items-center gap-2">
                <IdCard size={18} className="text-primary"/> ID Card: {viewIdCard.name}
              </h3>
              <button onClick={()=>setViewIdCard(null)} className="text-outline hover:text-error"><X size={20}/></button>
            </div>
            <div className="p-4 bg-background dark:bg-black/20 overflow-hidden flex justify-center">
              <img src={viewIdCard.src} alt="ID Card" className="max-w-full max-h-[60vh] object-contain rounded-lg border border-outline-variant/20 shadow-sm" />
            </div>
            {viewIdCard.status === "pending" && (
              <div className="p-4 flex gap-2 border-t border-outline-variant/10">
                <button onClick={()=>{rejectAccount(viewIdCard.email); setViewIdCard(null);}} className="flex-1 bg-error-container/20 text-error border border-error/30 py-2 rounded-xl text-xs font-bold hover:bg-error-container/40">Tolak Akun</button>
                <button onClick={()=>{approveAccount(viewIdCard.email); setViewIdCard(null);}} className="flex-1 bg-secondary text-on-secondary py-2 rounded-xl text-xs font-bold hover:brightness-110">Setujui Akun</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── STATS GRID ─── */}
      {tab !== "inventaris" && tab !== "peminjam" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter mb-stack-lg">
          {stats.map((s, i) => (
            <div key={i} className="bg-surface dark:bg-surface-container-lowest/5 rounded-2xl p-4 border border-outline-variant/10 ambient-shadow-lvl1 flex flex-col gap-2 items-center text-center">
              <span className={`material-symbols-outlined text-[28px] ${s.color}`}>{s.icon}</span>
              <p className="text-3xl font-display-lg font-bold text-on-surface dark:text-inverse-on-surface mt-1">{s.val}</p>
              <p className="text-xs text-on-surface-variant dark:text-outline-variant font-semibold">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ─── TRANSAKSI VIEWS ─── */}
      {(tab === "pending" || tab === "semua") && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter animate-fadeIn">
          {tab === "pending" && pending.length === 0 && (
            <div className="col-span-full py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-4 text-outline-variant">
                <ShieldCheck size={28} />
              </div>
              <h3 className="font-headline-md text-lg text-on-surface dark:text-inverse-on-surface mb-2">Semua Clear!</h3>
              <p className="text-on-surface-variant dark:text-outline-variant">Tidak ada pengajuan yang perlu ditinjau.</p>
            </div>
          )}
          {tab === "semua" && semua.length === 0 && (
            <div className="col-span-full py-16 text-center">
              <p className="text-on-surface-variant dark:text-outline-variant">Belum ada transaksi di sistem.</p>
            </div>
          )}

          {tab === "pending" && pending.map((t: any) => <TrxCard key={t.nomor} t={t} />)}
          {tab === "semua" && semua.map((t: any) => <TrxCard key={t.nomor} t={t} />)}
        </div>
      )}

      {/* ─── INVENTARIS ─── */}
      {tab === "inventaris" && (
        <div className="animate-fadeIn flex flex-col gap-stack-lg">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {invStats.map((s, i) => (
               <div key={i} className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-4 border border-primary/10 flex items-center gap-4">
                 <div className={`w-12 h-12 rounded-full bg-surface dark:bg-inverse-surface flex items-center justify-center shadow-sm ${s[3]}`}>
                    <span className="material-symbols-outlined">{s[2]}</span>
                 </div>
                 <div>
                    <p className={`text-2xl font-bold ${s[3]} dark:text-inverse-on-surface`}>{s[1]}</p>
                    <p className="text-xs text-on-surface-variant dark:text-outline-variant font-semibold">{s[0]}</p>
                 </div>
               </div>
            ))}
          </div>

          <div className="bg-surface dark:bg-surface-container-lowest/5 rounded-[24px] p-stack-lg border border-outline-variant/10 ambient-shadow-lvl1">
            <h3 className="font-headline-md text-lg text-on-surface dark:text-inverse-on-surface mb-stack-md flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">category</span>
              Statistik Kategori
            </h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(kategoriStats).map(([kat, count]) => (
                <div key={kat} className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant/20 rounded-xl px-4 py-2 text-sm font-semibold text-on-surface-variant dark:text-outline-variant flex items-center gap-2">
                  {kat} <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-xs">{count as number} Unit</span>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      )}

      {/* ─── KELOLA AKUN ─── */}
      {tab === "peminjam" && (
        <div className="animate-fadeIn flex flex-col gap-stack-lg">
          
          {/* Pending Approval */}
          {peminjamPending.length > 0 && (
            <div className="bg-tertiary/5 border border-tertiary/20 rounded-[24px] p-stack-lg">
              <h3 className="font-headline-md text-tertiary dark:text-tertiary-fixed-dim mb-4 flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined">how_to_reg</span>
                Menunggu Persetujuan Akun ({peminjamPending.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">
                {peminjamPending.map(([email, acc]: any) => (
                  <div key={email} className="bg-surface dark:bg-inverse-surface rounded-2xl p-5 border border-tertiary/30 ambient-shadow-lvl1 flex flex-col gap-4">
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 rounded-full bg-tertiary/20 flex items-center justify-center text-tertiary font-bold text-lg">
                        {acc.name.substring(0,2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-on-surface dark:text-inverse-on-surface text-sm">{acc.name}</p>
                        <p className="text-xs text-outline-variant">{email}</p>
                        <p className="text-xs text-on-surface-variant dark:text-outline-variant mt-1">{acc.instansi} · {acc.divisi}</p>
                      </div>
                    </div>
                    {acc.id_card && (
                      <button 
                        onClick={()=>setViewIdCard({name:acc.name, src:acc.id_card, status:acc.account_status, email:email})}
                        className="flex items-center justify-center gap-2 bg-surface-container-low dark:bg-surface-container-high/20 border border-outline-variant/20 py-2 rounded-xl text-xs font-semibold text-primary hover:bg-surface-container-highest transition-colors"
                      >
                        <IdCard size={14}/> Lihat ID Card
                      </button>
                    )}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button onClick={()=>rejectAccount(email)} className="bg-error-container/10 border border-error/30 text-error py-2 rounded-xl text-xs font-bold hover:bg-error-container/30 transition-colors">Tolak</button>
                      <button onClick={()=>approveAccount(email)} className="bg-secondary-container/10 border border-secondary/30 text-secondary py-2 rounded-xl text-xs font-bold hover:bg-secondary-container/30 transition-colors">Setujui</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
            {/* Active Users */}
            <div className="bg-surface dark:bg-surface-container-lowest/5 border border-outline-variant/10 rounded-[24px] p-stack-lg ambient-shadow-lvl1">
              <h3 className="font-headline-md text-primary dark:text-primary-fixed-dim mb-4 flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined">group</span>
                Peminjam Aktif ({peminjamAktif.length})
              </h3>
              <div className="flex flex-col gap-3">
                {peminjamAktif.map(([email, acc]: any) => (
                  <div key={email} className="bg-background dark:bg-inverse-surface border border-outline-variant/10 rounded-xl p-3 flex items-center justify-between gap-4">
                     <div>
                        <p className="font-bold text-on-surface dark:text-inverse-on-surface text-sm">{acc.name}</p>
                        <p className="text-[10px] text-outline-variant">{acc.instansi} · {email}</p>
                     </div>
                     <button onClick={()=>rejectAccount(email)} className="text-xs text-error font-semibold px-3 py-1.5 border border-error/20 rounded-lg hover:bg-error/10 transition-colors">
                        Cabut Akses
                     </button>
                  </div>
                ))}
                {peminjamAktif.length === 0 && <p className="text-sm text-outline text-center py-4">Belum ada peminjam aktif.</p>}
              </div>
            </div>

            {/* Rejected Users */}
            {peminjamDitolak.length > 0 && (
              <div className="bg-surface dark:bg-surface-container-lowest/5 border border-error/10 rounded-[24px] p-stack-lg ambient-shadow-lvl1">
                <h3 className="font-headline-md text-error dark:text-error/80 mb-4 flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined">person_off</span>
                  Akun Ditolak / Dicabut ({peminjamDitolak.length})
                </h3>
                <div className="flex flex-col gap-3">
                  {peminjamDitolak.map(([email, acc]: any) => (
                    <div key={email} className="bg-error/5 dark:bg-error/10 border border-error/10 rounded-xl p-3 flex items-center justify-between gap-4">
                       <div className="opacity-70">
                          <p className="font-bold text-on-surface dark:text-inverse-on-surface text-sm line-through decoration-error/50">{acc.name}</p>
                          <p className="text-[10px] text-outline-variant">{acc.instansi} · {email}</p>
                       </div>
                       <button onClick={()=>approveAccount(email)} className="text-xs text-secondary font-semibold px-3 py-1.5 border border-secondary/20 rounded-lg hover:bg-secondary/10 transition-colors">
                          Pulihkan Akses
                       </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
