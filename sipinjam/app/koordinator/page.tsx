"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, XCircle, CheckCircle, X, Wrench, PackageSearch, Tag, Users, UserCheck, UserX, IdCard, Clock, FileSpreadsheet, FileDown } from "lucide-react";
import { useTransaction } from "@/lib/TransactionContext";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { PhaseChip, FlowTracker, fmtRel, Avt, Empty, fmtDate } from "@/components/ui/SharedUI";
import { exportExcel, exportPDF } from "@/lib/exportUtils";
function formatArrayStr(str: any, showQty: boolean = false) {
  if (!str) return "-";
  try {
    const arr = JSON.parse(str);
    if (Array.isArray(arr)) {
      if (showQty) {
        const counts: Record<string, number> = {};
        arr.forEach((n: string) => counts[n] = (counts[n] || 0) + 1);
        return Object.entries(counts).map(([name, qty]) => `${name} (${qty} unit)`).join(", ");
      }
      return arr.join(", ");
    }
  } catch(e) {}
  return str;
}

export default function KoordinatorPage() {
  const router = useRouter();
  const { user, data, updateStatus, alatList } = useTransaction();

  const [tab, setTab] = useState("pending");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [alasan, setAlasan] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [isExporting, setIsExporting] = useState<"" | "excel" | "pdf">("")

  useEffect(() => {
    if (!user) router.push("/login");
    else if (user.role !== "koordinator") router.push(`/${user.role}`);
  }, [user, router]);

  if (!user || user.role !== "koordinator") return null;

  const pending = data.filter((t: any) => t.persetujuan_koordinator === "pending").sort((a: any, b: any) => b.nomor - a.nomor);
  
  // Filter by selected month for history
  const history = data.filter((t: any) => {
    if (!t.created_at) return false;
    return t.created_at.startsWith(selectedMonth);
  }).sort((a: any, b: any) => b.nomor - a.nomor);



  // Inventory Calculation
  const inventory = alatList.map((alat: any) => {
    const trx = data.filter((t: any) => t.barcode_aset?.includes(alat.kode));
    const activeTrx = trx.filter((t: any) => t.persetujuan_koordinator === "approved" && t.catatan_kembali === null); // Approximation of active
    const completed = trx.filter((t: any) => t.catatan_kembali !== null);
    
    const dipinjamCount = activeTrx.length;
    const total = alat.jumlah || 1;
    const tersediaCount = total - dipinjamCount;
    const lastCondition = alat.kondisi || "Baik";
    
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

  const kondisiCardStats = [
    { label: "Kondisi Baik", val: inventory.filter((i:any) => i.kondisi === "Baik" || i.kondisi === "Kondisi Baik" || !i.kondisi).reduce((s:number, i:any)=>s+i.total, 0), icon: "verified", color: "text-emerald-600" },
    { label: "Rusak Ringan", val: inventory.filter((i:any) => i.kondisi === "Rusak Ringan" || i.kondisi === "Kondisi Kurang Baik").reduce((s:number, i:any)=>s+i.total, 0), icon: "build", color: "text-amber-600" },
    { label: "Rusak Berat / Service", val: inventory.filter((i:any) => i.kondisi === "Rusak Berat" || i.kondisi === "Service").reduce((s:number, i:any)=>s+i.total, 0), icon: "error", color: "text-error" },
  ];

  const kategoriStats = alatList.reduce((acc: any, alat: any) => {
    acc[alat.kategori] = (acc[alat.kategori] || 0) + (alat.jumlah || 1);
    return acc;
  }, {});

  const stats = [
    { label: "Menunggu Approval", val: pending.length, icon: "pending_actions", color: "text-tertiary" },
    { label: "Disetujui (Bulan Ini)", val: history.filter((t: any) => t.persetujuan_koordinator === "approved").length, icon: "verified", color: "text-secondary" },
    { label: "Ditolak (Bulan Ini)", val: history.filter((t: any) => t.persetujuan_koordinator === "rejected").length, icon: "cancel", color: "text-error" }
  ];

  function TrxCard({ t }: { t: any }) {
    return (
      <div className="bg-surface dark:bg-surface-container-lowest/5 rounded-[20px] p-5 border border-outline-variant/10 ambient-shadow-lvl1 flex flex-col gap-4">
        <div className="flex justify-between items-start gap-2">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Wrench size={18} />
            </div>
            <div>
              <p className="font-bold text-on-surface dark:text-inverse-on-surface text-sm">{formatArrayStr(t.nama_alat_produksi, true)}</p>
              <p className="text-xs text-outline-variant mt-0.5">TRX-{t.nomor} • {formatArrayStr(t.barcode_aset)}</p>
            </div>
          </div>
          <PhaseChip trx={t} />
        </div>

        <div className="pt-3 border-t border-outline-variant/10 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
              {t.peminjam?.substring(0, 2).toUpperCase() || "U"}
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface dark:text-inverse-on-surface">{t.peminjam}</p>
              <p className="text-[10px] text-outline-variant">TRX-{t.nomor}</p>
            </div>
          </div>
          <div className="bg-surface-container-lowest dark:bg-black/20 p-2 rounded-lg text-xs text-on-surface-variant border border-outline-variant/10">
            <p><span className="font-bold text-on-surface">Tujuan:</span> {t.tujuan_peminjaman || "-"}</p>
            {t.keterangan && <p className="mt-1"><span className="font-bold text-on-surface">Catatan:</span> {t.keterangan}</p>}
          </div>

          <div className="flex gap-4 text-xs text-outline-variant px-1 mt-1">
            <p className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">calendar_today</span> <span className="font-semibold text-on-surface">Pinjam:</span> {fmtDate(t.tanggal_peminjaman)}</p>
            <p className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">event_busy</span> <span className="font-semibold text-on-surface">Kembali:</span> {fmtDate(t.tanggal_pengembalian)}</p>
          </div>
        </div>

        {t.persetujuan_koordinator === "pending" && (
          <div className="flex gap-2 mt-2">
            <button onClick={()=>{setRejectId(t.nomor);setAlasan("");}} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-error/30 bg-error-container/10 text-error hover:bg-error-container/30 transition-colors text-xs font-bold">
              <XCircle size={14}/> Tolak
            </button>
            <button onClick={async ()=>await updateStatus(t.nomor, "APPROVE")} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-secondary/30 bg-secondary-container/10 text-secondary hover:bg-secondary-container/30 transition-colors text-xs font-bold">
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
        { id: "inventaris", label: "Inventaris", icon: "handyman" }
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-surface dark:bg-inverse-surface rounded-[24px] p-8 w-full max-w-sm ambient-shadow-lvl2 border border-outline-variant/20 relative animate-fadeIn shadow-2xl">
            <button onClick={()=>setRejectId(null)} className="absolute top-4 right-4 text-outline hover:text-error transition-colors"><X size={20}/></button>
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
              onClick={async ()=>{
                if(rejectId) {
                  await updateStatus(Number(rejectId), "REJECT", undefined, undefined, undefined, alasan);
                }
                setRejectId(null);
              }}
              className="w-full bg-error text-on-error py-3 rounded-xl font-bold text-sm hover:shadow-lg disabled:opacity-50 transition-all"
            >
              Kirim Penolakan
            </button>
          </div>
        </div>
      )}



      {/* ─── STATS GRID ─── */}
      {tab !== "inventaris" && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-gutter mb-stack-lg">
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
      {tab === "pending" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter animate-fadeIn">
          {pending.length === 0 && (
            <div className="col-span-full py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-4 text-outline-variant">
                <ShieldCheck size={28} />
              </div>
              <h3 className="font-headline-md text-lg text-on-surface dark:text-inverse-on-surface mb-2">Semua Clear!</h3>
              <p className="text-on-surface-variant dark:text-outline-variant">Tidak ada pengajuan yang perlu ditinjau.</p>
            </div>
          )}
          {pending.map((t: any) => <TrxCard key={t.nomor} t={t} />)}
        </div>
      )}

      {tab === "semua" && (
        <div className="bg-surface dark:bg-surface-container-lowest/5 rounded-[24px] p-stack-lg border border-outline-variant/10 ambient-shadow-lvl2 animate-fadeIn">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
            <div>
              <h2 className="font-headline-md text-xl text-on-surface dark:text-inverse-on-surface">Riwayat Persetujuan Bulanan</h2>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="bg-background border border-outline-variant/30 rounded-xl px-4 py-2 text-on-surface outline-none"
              />
              {/* Export Excel */}
              <button
                disabled={history.length === 0 || isExporting !== ""}
                onClick={async () => {
                  setIsExporting("excel");
                  await exportExcel(history, selectedMonth, "Riwayat_Persetujuan_PINSET");
                  setIsExporting("");
                }}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm text-sm"
              >
                {isExporting === "excel"
                  ? <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                  : <FileSpreadsheet size={16} />}
                Excel
              </button>
              {/* Export PDF */}
              <button
                disabled={history.length === 0 || isExporting !== ""}
                onClick={async () => {
                  setIsExporting("pdf");
                  await exportPDF(history, selectedMonth, "Riwayat_Persetujuan_PINSET");
                  setIsExporting("");
                }}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm text-sm"
              >
                {isExporting === "pdf"
                  ? <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                  : <FileDown size={16} />}
                PDF
              </button>

            </div>
          </div>

          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b-2 border-outline-variant/30 text-sm font-bold text-on-surface-variant">
                  <th className="py-3 px-2">No</th>
                  <th className="py-3 px-2">Peminjam</th>
                  <th className="py-3 px-2">Alat (Qty)</th>
                  <th className="py-3 px-2">Tujuan</th>
                  <th className="py-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-outline">Belum ada transaksi di bulan ini.</td></tr>
                ) : history.map((t: any, idx: number) => {
                  let namaAlat = formatArrayStr(t.nama_alat_produksi, true);

                  return (
                    <tr key={t.nomor} className="border-b border-outline-variant/10 hover:bg-surface-container-lowest/50 transition-colors text-sm text-on-surface">
                      <td className="py-3 px-2">{idx + 1}</td>
                      <td className="py-3 px-2">
                        <p className="font-bold">{t.peminjam}</p>
                        <p className="text-xs text-outline-variant">{t.peminjam_instansi}</p>
                      </td>
                      <td className="py-3 px-2 max-w-[200px] truncate" title={namaAlat}>{namaAlat}</td>
                      <td className="py-3 px-2 max-w-[150px] truncate" title={t.tujuan_peminjaman}>{t.tujuan_peminjaman || "-"}</td>
                      <td className="py-3 px-2"><PhaseChip trx={t} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mt-2">
            {kondisiCardStats.map((s, i) => (
               <div key={i} className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-4 border border-primary/10 flex items-center gap-4">
                 <div className={`w-12 h-12 rounded-full bg-surface dark:bg-inverse-surface flex items-center justify-center shadow-sm ${s.color}`}>
                    <span className="material-symbols-outlined">{s.icon}</span>
                 </div>
                 <div>
                    <p className={`text-2xl font-bold ${s.color} dark:text-inverse-on-surface`}>{s.val}</p>
                    <p className="text-xs text-on-surface-variant dark:text-outline-variant font-semibold">{s.label}</p>
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



    </DashboardLayout>
  );
}
