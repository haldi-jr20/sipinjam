"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PackageCheck, Wrench, ChevronRight, Info, RotateCcw, CheckCircle, X, PackageSearch, Plus, Tag, QrCode, XCircle, FileSpreadsheet, FileDown } from "lucide-react";
import { useTransaction } from "@/lib/TransactionContext";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { PhaseChip, Avt, Empty, fmtRel, fmtDate } from "@/components/ui/SharedUI";
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

export default function PetugasPage() {
  const router = useRouter();
  const { data, user, alatList, tambahAlat, editAlat, ajukanPeminjaman, updateStatus, updateStatusAlat, hapusAlat } = useTransaction();

  const [tab, setTab] = useState("keluar");
  const [modal, setModal] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; icon: string; color: string; confirmLabel: string; onConfirm: () => void } | null>(null);

  const [kondisi, setKondisi] = useState("");
  const [deskripsiKondisi, setDeskripsiKondisi] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [isExporting, setIsExporting] = useState<"" | "excel" | "pdf">("")

  // State untuk tambah alat
  const [newKode, setNewKode] = useState("");
  const [newNama, setNewNama] = useState("");
  const [newKategori, setNewKategori] = useState("");
  const [newJumlah, setNewJumlah] = useState("1");
  const [isExisting, setIsExisting] = useState(false);
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [showKategoriDropdown, setShowKategoriDropdown] = useState(false);
  const [scanKembaliErr, setScanKembaliErr] = useState("");

  const [peminjamName, setPeminjamName] = useState("");
  const [peminjamInstansi, setPeminjamInstansi] = useState("");
  const [peminjamDivisi, setPeminjamDivisi] = useState("");
  const [peminjamKontak, setPeminjamKontak] = useState("");
  const [keteranganTarget, setKeteranganTarget] = useState("");
  const [tanggalPeminjaman, setTanggalPeminjaman] = useState("");
  const [tanggalPengembalian, setTanggalPengembalian] = useState("");
  const [selectedAlatItems, setSelectedAlatItems] = useState<{alat: any, qty: number}[]>([]);
  const [alatKodeTarget, setAlatKodeTarget] = useState("");
  const [jumlahPinjamTarget, setJumlahPinjamTarget] = useState("1");
  const [ajukanOk, setAjukanOk] = useState(false);
  const [konfirmasiRusak, setKonfirmasiRusak] = useState(false);

  // Field-level errors
  const [errNama, setErrNama] = useState("");
  const [errKontak, setErrKontak] = useState("");
  const [errTanggal, setErrTanggal] = useState("");


  useEffect(() => {
    if (!user) router.push("/login");
    else if (user.role !== "petugas") router.push(`/${user.role}`);
  }, [user, router]);

  if (!user || user.role !== "petugas") return null;

  const approved = data.filter((t: any) => t.persetujuan_koordinator === "approved");
  const siapKeluar = approved.filter((t: any) => !t.petugas_kontrol_alat && t.catatan_kembali === null).sort((a: any, b: any) => b.nomor - a.nomor);
  const dipinjam = approved.filter((t: any) => t.petugas_kontrol_alat && t.catatan_kembali === null).sort((a: any, b: any) => b.nomor - a.nomor);
  const selesai = approved.filter((t: any) => {
    return t.catatan_kembali !== null && t.created_at && t.created_at.startsWith(selectedMonth);
  }).sort((a: any, b: any) => b.nomor - a.nomor);
  const ditolak = data.filter((t: any) => {
    return t.persetujuan_koordinator === "rejected" && t.created_at && t.created_at.startsWith(selectedMonth);
  }).sort((a: any, b: any) => b.nomor - a.nomor);

  // Inventory Calculation
  const inventory = alatList.map((alat: any) => {
    const trx = data.filter((t: any) => t.barcode_aset?.includes(alat.kode));
    const activeTrx = trx.filter((t: any) => t.persetujuan_koordinator === "approved" && t.catatan_kembali === null);
    const completed = trx.filter((t: any) => t.catatan_kembali !== null);

    const dipinjamCount = activeTrx.length;
    const total = alat.jumlah || 1;
    const tersediaCount = total - dipinjamCount;
    const lastCondition = alat.kondisi || "Baik";

    return {
      ...alat, total, tersediaCount, dipinjamCount,
      status: tersediaCount > 0 ? "Tersedia" : "Dipinjam",
      kondisi: lastCondition
    };
  });

  const invStats = [
    ["Total Alat", inventory.reduce((s: number, i: any) => s + i.total, 0), "inventory_2", "text-on-surface"],
    ["Tersedia", inventory.reduce((s: number, i: any) => s + i.tersediaCount, 0), "check_circle", "text-emerald-600"],
    ["Dipinjam", inventory.reduce((s: number, i: any) => s + i.dipinjamCount, 0), "outbound", "text-primary"],
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

  function getTersedia(kode: string) {
    if (!kode) return 0;
    const a = alatList.find((x: any) => x.kode === kode);
    if (!a) return 0;
    const trx = data.filter((t: any) => t.barcode_aset === kode && t.persetujuan_koordinator === "approved" && !t.waktu_kembali);
    const dipinjamCount = trx.length;
    return (a.jumlah || 1) - dipinjamCount;
  }


  function validateForm(): boolean {
    let valid = true;
    // Validasi nama: hanya huruf, spasi, titik, tanda hubung
    if (!/^[a-zA-Z\s.'-]+$/.test(peminjamName.trim())) {
      setErrNama("Nama hanya boleh berisi huruf dan spasi.");
      valid = false;
    } else {
      setErrNama("");
    }
    // Validasi kontak: hanya angka, 10–13 digit
    if (!/^[0-9]{10,13}$/.test(peminjamKontak.trim())) {
      setErrKontak("Nomor HP harus 10–13 digit angka (tanpa spasi atau tanda baca).");
      valid = false;
    } else {
      setErrKontak("");
    }
    // Validasi tanggal: pengembalian tidak boleh sebelum peminjaman
    if (tanggalPeminjaman && tanggalPengembalian && tanggalPengembalian < tanggalPeminjaman) {
      setErrTanggal("Tanggal pengembalian tidak boleh sebelum tanggal peminjaman.");
      valid = false;
    } else {
      setErrTanggal("");
    }
    return valid;
  }

  async function submitAjukan(e: React.FormEvent) {
    e.preventDefault();
    if (selectedAlatItems.length === 0 || !peminjamName || !tanggalPeminjaman || !tanggalPengembalian) return;
    if (!validateForm()) return;
    
    let barcode_aset: string[] = [];
    let nama_alat_produksi: string[] = [];
    selectedAlatItems.forEach(item => {
      for(let i=0; i<item.qty; i++) {
        barcode_aset.push(item.alat.kode);
        nama_alat_produksi.push(item.alat.nama);
      }
    });

    await ajukanPeminjaman({
      barcode_aset,
      nama_alat_produksi,
      peminjam: peminjamName,
      peminjam_instansi: peminjamInstansi,
      peminjam_divisi: peminjamDivisi,
      peminjam_kontak: peminjamKontak,
      tujuan_peminjaman: keteranganTarget,
      tanggal_peminjaman: tanggalPeminjaman,
      tanggal_pengembalian: tanggalPengembalian,
      keterangan: "",
    });
    setSelectedAlatItems([]); setAlatKodeTarget(""); setJumlahPinjamTarget("1"); setKeteranganTarget("");
    setPeminjamName(""); setPeminjamInstansi(""); setPeminjamDivisi(""); setPeminjamKontak("");
    setTanggalPeminjaman(""); setTanggalPengembalian("");
    setErrNama(""); setErrKontak(""); setErrTanggal("");
    setKonfirmasiRusak(false);
    setAjukanOk(true);
    setTimeout(() => { setAjukanOk(false); setTab("keluar"); }, 1600);
  }

  function addAlatToSelection() {
    const alat = alatList.find((a: any) => a.kode === alatKodeTarget);
    const qty = parseInt(jumlahPinjamTarget);
    if (!alat || qty < 1) return;
    
    const stok = getTersedia(alat.kode);
    const currentQty = selectedAlatItems.find(i => i.alat.kode === alat.kode)?.qty || 0;
    if (currentQty + qty > stok) {
       setConfirmModal({ title: "Stok Tidak Cukup", message: "Jumlah yang diminta melebihi stok yang tersedia.", icon: "warning", color: "text-amber-600", confirmLabel: "Mengerti", onConfirm: () => setConfirmModal(null) }); return;
    }

    setSelectedAlatItems(prev => {
      const existing = prev.find(i => i.alat.kode === alat.kode);
      if (existing) {
        return prev.map(i => i.alat.kode === alat.kode ? { ...i, qty: i.qty + qty } : i);
      }
      return [...prev, { alat, qty }];
    });
    setAlatKodeTarget("");
    setJumlahPinjamTarget("1");
  }

  function removeAlatFromSelection(kode: string) {
    setSelectedAlatItems(prev => prev.filter(i => i.alat.kode !== kode));
  }

  function closeModal() {
    setModal(null); setLoading(false); setStep(1); setKondisi(""); setDeskripsiKondisi("");
    setNewKode(""); setNewNama(""); setNewKategori(""); setNewJumlah("1"); setIsExisting(false); setScanKembaliErr("");
  }

  async function doEditAlat() {
    if (!newKode || !newNama || !newKategori) return;
    await editAlat(newKode, newNama, newKategori);
    closeModal();
  }

  function generateNewKode() {
    let maxId = 0;
    alatList.forEach((a: any) => {
      if (a.kode.startsWith("ALT")) {
        const num = parseInt(a.kode.substring(3), 10);
        if (!isNaN(num) && num > maxId) maxId = num;
      }
    });
    return `ALT${String(maxId + 1).padStart(3, '0')}`;
  }

  function handleNameChange(e: any) {
    const val = e.target.value;
    setNewNama(val);
    const existing = alatList.find((a: any) => a.nama.toLowerCase() === val.toLowerCase());
    setNewKode(generateNewKode());
    if (existing) {
      setNewKategori(existing.kategori);
      setIsExisting(true);
    } else {
      if (isExisting) setNewKategori("");
      setIsExisting(false);
    }
  }

  async function doTambahAlat() {
    if (!newKode || !newNama || !newKategori || parseInt(newJumlah) < 1) return;
    let finalKategori = newKategori.trim();
    const existingCat = Object.keys(kategoriStats).find(k => k.toLowerCase() === finalKategori.toLowerCase());
    if (existingCat) finalKategori = existingCat;
    await tambahAlat(newKode, newNama, finalKategori, parseInt(newJumlah));
    setModal({ type: "tambah_alat_sukses", kode: newKode, nama: newNama });
  }

  function doKeluar() {
    setLoading(true);
    setTimeout(async () => {
      await updateStatus(modal.trx.nomor, "KELUAR", user.role === "petugas" ? "Petugas" : user.role);
      closeModal(); setTab("dipinjam");
    }, 1300);
  }

  function doScanKembali(scannedCode: string) {
    setScanKembaliErr("");
    
    let validBarcodes: string[] = [];
    try {
      validBarcodes = JSON.parse(modal.trx.barcode_aset);
    } catch (e) {
      validBarcodes = [modal.trx.barcode_aset];
    }
    
    const isValid = validBarcodes.some(b => b.toLowerCase() === scannedCode.toLowerCase());

    if (!isValid) {
      setScanKembaliErr(`Kode "${scannedCode}" tidak cocok dengan alat yang dipinjam (${formatArrayStr(modal.trx.barcode_aset)}).`);
      return;
    }
    
    setStep(3);
    setTimeout(async () => {
      await updateStatus(modal.trx.nomor, "KEMBALI", user.role === "petugas" ? "Petugas" : user.role, kondisi, deskripsiKondisi);
      closeModal(); setTab("selesai");
    }, 1400);
  }

  const kondisiOpts = ["Baik", "Rusak Ringan", "Rusak Berat"];
  const kondisiColor: any = { 
    "Baik": "text-emerald-600", 
    "Kondisi Baik": "text-emerald-600",
    "Rusak Ringan": "text-amber-600", 
    "Kondisi Kurang Baik": "text-amber-600",
    "Rusak Berat": "text-error",
    "Service": "text-error"
  };

  function TrxRow({ t, btn, onBtn, btnIcon, colorTheme }: { t: any, btn: string, onBtn: any, btnIcon: any, colorTheme: 'blue' | 'emerald' }) {
    const isBlue = colorTheme === 'blue';
    return (
      <div className="bg-surface dark:bg-surface-container-lowest/5 rounded-[20px] p-5 border border-outline-variant/10 ambient-shadow-lvl1 flex flex-col gap-4">
        <div className="flex justify-between items-start gap-2">
          <div className="flex gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isBlue ? 'bg-primary/10 text-primary' : 'bg-emerald-500/10 text-emerald-600'}`}>
              <Wrench size={18} />
            </div>
            <div>
              <p className="font-bold text-on-surface dark:text-inverse-on-surface text-sm">{formatArrayStr(t.nama_alat_produksi, true)}</p>
              <p className="text-xs text-outline-variant mt-0.5">TRX-{t.nomor} • {formatArrayStr(t.barcode_aset)}</p>
            </div>
          </div>
          <PhaseChip trx={t} />
        </div>

        <div className="bg-surface-container-lowest dark:bg-black/20 rounded-xl p-3 text-xs text-on-surface-variant dark:text-outline-variant border border-outline-variant/5">
          <p><span className="font-bold text-on-surface">Tujuan:</span> {t.tujuan_peminjaman || "-"}</p>
          {t.keterangan && <p className="mt-1"><span className="font-bold text-on-surface">Catatan:</span> {t.keterangan}</p>}
        </div>

        <div className="flex gap-4 text-xs text-outline-variant px-1">
          <p className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">calendar_today</span> <span className="font-semibold text-on-surface">Pinjam:</span> {fmtDate(t.tanggal_peminjaman)}</p>
          <p className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">event_busy</span> <span className="font-semibold text-on-surface">Kembali:</span> {fmtDate(t.tanggal_pengembalian)}</p>
        </div>

        <div className="pt-3 border-t border-outline-variant/10 flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isBlue ? 'bg-primary/10 text-primary' : 'bg-emerald-500/10 text-emerald-600'}`}>
              {t.peminjam.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface dark:text-inverse-on-surface">{t.peminjam}</p>
              <p className="text-[10px] text-outline-variant">
                {t.petugas_kontrol_alat ? `Oleh: ${t.petugas_kontrol_alat}` : `Disetujui`}
              </p>
            </div>
          </div>
          <button onClick={onBtn} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 ${isBlue ? 'bg-gradient-to-r from-primary to-surface-tint' : 'bg-gradient-to-r from-emerald-600 to-emerald-500'}`}>
            {btnIcon} {btn}
          </button>
        </div>
      </div>
    );
  }

  const headerTabs = (
    <div className="flex bg-surface-container-low dark:bg-surface-container-high/20 p-1 rounded-xl border border-outline-variant/10 ambient-shadow-lvl1 overflow-x-auto hide-scrollbar">
      {[
        { id: "ajukan", label: "Buat Peminjaman", icon: "add_circle" },
        { id: "keluar", label: `Siap Keluar ${siapKeluar.length > 0 ? `(${siapKeluar.length})` : ''}`, icon: "outbox" },
        { id: "dipinjam", label: `Sedang Dipinjam ${dipinjam.length > 0 ? `(${dipinjam.length})` : ''}`, icon: "hourglass_top" },
        { id: "selesai", label: "Selesai", icon: "task_alt" },
        { id: "ditolak", label: `Ditolak ${ditolak.length > 0 ? `(${ditolak.length})` : ''}`, icon: "cancel" },
        { id: "inventaris", label: "Katalog Alat", icon: "inventory_2" }
      ].map(t => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          className={`px-5 py-2 rounded-lg font-label-md text-[13px] transition-all flex items-center gap-2 whitespace-nowrap ${tab === t.id
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
      pageTitle="Logistik & Penyerahan"
      pageSubtitle="Officer Overview"
      headerActions={headerTabs}
    >

      {/* ─── TAB: BUAT PEMINJAMAN ─── */}
      {tab === "ajukan" && (
        <div className="bg-surface dark:bg-surface-container-lowest/5 rounded-[24px] p-stack-lg border border-outline-variant/10 ambient-shadow-lvl2 backdrop-blur-xl animate-fadeIn max-w-4xl mx-auto">
          <h2 className="font-headline-md text-headline-md text-on-surface dark:text-inverse-on-surface mb-stack-md flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">edit_document</span>
            Form Peminjaman Baru
          </h2>

          <p className="text-sm text-on-surface-variant dark:text-outline-variant mb-6">Gunakan form ini untuk menginput data peminjaman jika ada pegawai yang datang untuk meminjam alat. Transaksi ini akan diteruskan ke Koordinator untuk persetujuan.</p>

          {ajukanOk && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-xl p-4 flex gap-3 items-start mb-6">
              <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-emerald-800 dark:text-emerald-300 font-bold text-sm">Pengajuan berhasil dibuat!</p>
                <p className="text-emerald-600 dark:text-emerald-400 text-xs mt-1">Menunggu persetujuan Koordinator.</p>
              </div>
            </div>
          )}

          <form onSubmit={submitAjukan} className="flex flex-col gap-stack-lg">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface-variant dark:text-outline-variant">Nama Peminjam</label>
                <input
                  required
                  value={peminjamName}
                  onChange={e => {
                    // hanya izinkan huruf, spasi, titik, tanda hubung
                    const val = e.target.value;
                    if (/^[a-zA-Z\s.'-]*$/.test(val)) setPeminjamName(val);
                  }}
                  onBlur={() => {
                    if (peminjamName && !/^[a-zA-Z\s.'-]+$/.test(peminjamName.trim()))
                      setErrNama("Nama hanya boleh berisi huruf dan spasi.");
                    else setErrNama("");
                  }}
                  placeholder="Masukkan nama lengkap"
                  className={`w-full bg-background dark:bg-inverse-surface border rounded-xl px-4 py-3 text-on-surface dark:text-inverse-on-surface focus:ring-1 outline-none transition-all font-body-md text-body-md ${errNama ? 'border-error focus:border-error focus:ring-error' : 'border-outline-variant/30 focus:border-primary focus:ring-primary'}`}
                />
                {errNama && <p className="text-xs text-error mt-0.5 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span>{errNama}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface-variant dark:text-outline-variant">Asal Instansi / Perusahaan</label>
                <input
                  required value={peminjamInstansi} onChange={e => setPeminjamInstansi(e.target.value)}
                  placeholder="Contoh: BKI Sorong, PT. XYZ..."
                  className="w-full bg-background dark:bg-inverse-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface dark:text-inverse-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-body-md"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface-variant dark:text-outline-variant">Divisi / Jabatan</label>
                <input
                  required value={peminjamDivisi} onChange={e => setPeminjamDivisi(e.target.value)}
                  placeholder="Contoh: Produksi, Teknisi..."
                  className="w-full bg-background dark:bg-inverse-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface dark:text-inverse-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-body-md"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface-variant dark:text-outline-variant">No. HP (WhatsApp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm font-bold select-none">+62</span>
                  <input
                    required
                    type="tel"
                    inputMode="numeric"
                    maxLength={13}
                    value={peminjamKontak}
                    onChange={e => {
                      // hanya izinkan angka
                      const val = e.target.value.replace(/\D/g, "");
                      setPeminjamKontak(val);
                    }}
                    onBlur={() => {
                      if (peminjamKontak && !/^[0-9]{10,13}$/.test(peminjamKontak))
                        setErrKontak("Nomor HP harus 10–13 digit angka.");
                      else setErrKontak("");
                    }}
                    placeholder="08xx xxxx xxxx"
                    className={`w-full bg-background dark:bg-inverse-surface border rounded-xl pl-12 pr-4 py-3 text-on-surface dark:text-inverse-on-surface focus:ring-1 outline-none transition-all font-body-md text-body-md ${errKontak ? 'border-error focus:border-error focus:ring-error' : 'border-outline-variant/30 focus:border-primary focus:ring-primary'}`}
                  />
                </div>
                {errKontak && <p className="text-xs text-error mt-0.5 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span>{errKontak}</p>}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-label-md text-label-md text-on-surface-variant dark:text-outline-variant">Pilih Aset / Alat</label>
              <div className="flex flex-col sm:flex-row gap-stack-sm">
                <div className="relative flex-1">
                  <select
                    value={alatKodeTarget}
                    onChange={e => {
                      setAlatKodeTarget(e.target.value);
                      setJumlahPinjamTarget("1");
                    }}
                    className="w-full appearance-none bg-background dark:bg-inverse-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface dark:text-inverse-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-body-md"
                  >
                    <option value="">Pilih dari katalog...</option>
                    {alatList.map((a: any) => {
                      const stok = getTersedia(a.kode);
                      const isRusakBerat = a.kondisi === "Rusak Berat" || a.kondisi === "Service";
                      const disabled = stok === 0 || isRusakBerat;
                      return <option key={a.kode} value={a.kode} disabled={disabled}>{a.nama} {stok === 0 ? "(Habis)" : isRusakBerat ? `(Rusak Berat)` : `(${stok} tersedia) - ${a.kondisi || 'Baik'}`}</option>
                    })}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
                </div>
                
                <div className="sm:w-24 shrink-0 flex items-center">
                  <input
                    type="number" min="1" max={alatKodeTarget ? getTersedia(alatKodeTarget) : 1}
                    value={jumlahPinjamTarget} onChange={e => setJumlahPinjamTarget(e.target.value)}
                    disabled={!alatKodeTarget || getTersedia(alatKodeTarget) <= 1}
                    placeholder="Qty"
                    className="w-full bg-background dark:bg-inverse-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface dark:text-inverse-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-body-md disabled:opacity-50"
                  />
                </div>

                <button type="button" onClick={() => {
                  const max = getTersedia(alatKodeTarget);
                  if (parseInt(jumlahPinjamTarget) > max) {
                    setConfirmModal({ title: "Stok Tidak Cukup", message: `Stok maksimal yang tersedia untuk alat ini adalah ${max} unit.`, icon: "inventory", color: "text-amber-600", confirmLabel: "Mengerti", onConfirm: () => { setConfirmModal(null); setJumlahPinjamTarget(max.toString()); } });
                    return;
                  }
                  addAlatToSelection();
                }} disabled={!alatKodeTarget} className="bg-primary hover:bg-primary-container text-on-primary disabled:bg-outline disabled:cursor-not-allowed px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                  Tambah
                </button>
              </div>

              {selectedAlatItems.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  {selectedAlatItems.map((item, idx) => (
                    <div key={idx} className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex gap-3 items-center">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary">build</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-label-md text-on-surface">{item.alat.nama} <span className="font-bold text-primary">(Qty: {item.qty})</span></p>
                        <p className="text-xs text-on-surface-variant">{item.alat.kode} • {item.alat.kondisi || 'Baik'}</p>
                      </div>
                      <button type="button" onClick={() => removeAlatFromSelection(item.alat.kode)} className="text-outline hover:text-error transition-colors p-1">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface-variant dark:text-outline-variant">Tanggal Peminjaman</label>
                <input
                  type="date"
                  required
                  value={tanggalPeminjaman}
                  onChange={e => {
                    setTanggalPeminjaman(e.target.value);
                    // Reset error tanggal jika pengembalian valid
                    if (tanggalPengembalian && e.target.value && tanggalPengembalian >= e.target.value) setErrTanggal("");
                  }}
                  className="w-full bg-background border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface outline-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface-variant dark:text-outline-variant">Tanggal Pengembalian (Estimasi)</label>
                <input
                  type="date"
                  required
                  min={tanggalPeminjaman || undefined}
                  value={tanggalPengembalian}
                  onChange={e => {
                    setTanggalPengembalian(e.target.value);
                    if (tanggalPeminjaman && e.target.value < tanggalPeminjaman)
                      setErrTanggal("Tanggal pengembalian tidak boleh sebelum tanggal peminjaman.");
                    else setErrTanggal("");
                  }}
                  className={`w-full bg-background border rounded-xl px-4 py-3 text-on-surface outline-none ${errTanggal ? 'border-error' : 'border-outline-variant/30'}`}
                />
                {errTanggal && <p className="text-xs text-error mt-0.5 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span>{errTanggal}</p>}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-label-md text-label-md text-on-surface-variant dark:text-outline-variant">Tujuan Peminjaman</label>
              <textarea
                value={keteranganTarget} onChange={e => setKeteranganTarget(e.target.value)}
                placeholder="Catatan keperluan atau keterangan tambahan..." rows={3}
                className="w-full bg-background dark:bg-inverse-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface dark:text-inverse-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-body-md resize-none"
              ></textarea>
            </div>

            <div className="mt-stack-sm flex justify-end">
              <button
                type="submit"
                disabled={selectedAlatItems.length === 0 || !peminjamName || !tanggalPeminjaman || !tanggalPengembalian}
                className="w-full md:w-auto bg-gradient-to-r from-primary to-surface-tint text-on-primary px-8 py-3 rounded-xl font-label-md text-label-md hover:shadow-[0_8px_16px_rgba(53,37,205,0.25)] transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-2"
              >
                Kirim Pengajuan
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── MODALS ─── */}
      {modal?.type === "keluar" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-surface dark:bg-inverse-surface rounded-[24px] p-8 w-full max-w-sm ambient-shadow-lvl2 border border-outline-variant/20 relative animate-fadeIn shadow-2xl">
            <button onClick={closeModal} className="absolute top-4 right-4 text-outline hover:text-error"><X size={20} /></button>
            <h3 className="font-headline-md text-lg text-on-surface dark:text-inverse-on-surface mb-2">Serah Terima Alat</h3>
            <p className="text-sm text-on-surface-variant dark:text-outline-variant mb-4">Pastikan alat dalam kondisi baik sebelum diserahkan kepada peminjam.</p>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex gap-3 items-center mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                <Wrench size={18} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-on-surface dark:text-inverse-on-surface">{formatArrayStr(modal.trx.nama_alat_produksi, true)}</p>
                <p className="text-xs text-outline-variant mt-0.5">{modal.trx.peminjam}</p>
              </div>
            </div>

            <button disabled={loading} onClick={doKeluar} className="w-full bg-gradient-to-r from-primary to-surface-tint text-on-primary py-3 rounded-xl font-bold text-sm hover:shadow-lg disabled:opacity-50 transition-all flex justify-center items-center gap-2">
              {loading ? <span className="material-symbols-outlined animate-spin">refresh</span> : "Konfirmasi Penyerahan"}
            </button>
          </div>
        </div>
      )}

      {modal?.type === "kembali" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-surface dark:bg-inverse-surface rounded-[24px] p-8 w-full max-w-md ambient-shadow-lvl2 border border-outline-variant/20 relative animate-fadeIn overflow-hidden shadow-2xl">
            <button onClick={closeModal} className="absolute top-4 right-4 text-outline hover:text-error z-10"><X size={20} /></button>

            <div className="flex items-center gap-2 mb-6 relative z-10">
              <div className={`flex-1 h-1.5 rounded-full ${step >= 1 ? 'bg-emerald-500' : 'bg-outline-variant/30'}`}></div>
              <div className={`flex-1 h-1.5 rounded-full ${step >= 2 ? 'bg-emerald-500' : 'bg-outline-variant/30'}`}></div>
              <div className={`flex-1 h-1.5 rounded-full ${step >= 3 ? 'bg-emerald-500' : 'bg-outline-variant/30'}`}></div>
            </div>

            {step === 1 && (
              <div className="animate-fadeIn">
                <h3 className="font-headline-md text-lg text-on-surface dark:text-inverse-on-surface mb-2">Cek Fisik Alat</h3>
                <p className="text-sm text-on-surface-variant dark:text-outline-variant mb-4">Bagaimana kondisi fisik {formatArrayStr(modal.trx.nama_alat_produksi, true)} saat ini?</p>

                <div className="flex flex-col gap-3 mb-4">
                  {kondisiOpts.map(k => (
                    <button key={k} onClick={() => setKondisi(k)} className={`p-4 rounded-xl border flex items-center justify-between transition-all ${kondisi === k ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'border-outline-variant/30 text-on-surface dark:text-inverse-on-surface hover:bg-surface-container-highest/20'}`}>
                      <span className="font-bold text-sm">{k}</span>
                      {kondisi === k && <CheckCircle size={18} />}
                    </button>
                  ))}
                </div>

                <div className="mb-6">
                  <label className="text-xs font-bold text-outline-variant uppercase tracking-wider mb-2 block">Keterangan Tambahan</label>
                  <textarea placeholder="Tuliskan catatan kondisi atau keterangan tambahan di sini..." value={deskripsiKondisi} onChange={e => setDeskripsiKondisi(e.target.value)} className="w-full bg-background dark:bg-surface-container-lowest/5 border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface dark:text-inverse-on-surface focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all font-body-md text-sm resize-none" rows={3} />
                </div>

                <button disabled={!kondisi || !deskripsiKondisi.trim()} onClick={() => setStep(2)} className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-3 rounded-xl font-bold text-sm hover:shadow-lg disabled:opacity-50 transition-all flex justify-center items-center gap-2">
                  Lanjut Verifikasi Kode <ChevronRight size={16} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="animate-fadeIn">
                <h3 className="font-headline-md text-lg text-on-surface dark:text-inverse-on-surface mb-2">Verifikasi Kode Alat</h3>
                <p className="text-sm text-on-surface-variant dark:text-outline-variant mb-4">Masukkan kode fisik alat untuk memastikan alat yang dikembalikan sesuai.</p>

                <div className="mb-6">
                  <div className="flex gap-2">
                    <input type="text" id="inputKodeKembali" placeholder="Misal: ALT019" className="flex-1 bg-background border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 uppercase" onKeyDown={e => {
                      if(e.key === 'Enter') doScanKembali(e.currentTarget.value);
                    }}/>
                    <button onClick={() => {
                      const val = (document.getElementById('inputKodeKembali') as HTMLInputElement).value;
                      doScanKembali(val);
                    }} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 rounded-xl font-bold transition-colors">
                      Cek
                    </button>
                  </div>
                  {scanKembaliErr && <p className="text-xs text-error mt-2 font-bold bg-error-container/20 p-2 rounded-lg border border-error/30">{scanKembaliErr}</p>}
                </div>

                <button onClick={() => setStep(1)} className="text-xs font-bold text-outline hover:text-primary transition-colors flex items-center gap-1">
                  &larr; Kembali ke Pilihan Kondisi
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="py-8 text-center animate-fadeIn">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined animate-spin text-[32px]">refresh</span>
                </div>
                <h3 className="font-bold text-lg text-emerald-600">Menyimpan Data...</h3>
              </div>
            )}
          </div>
        </div>
      )}

      {modal?.type === "tambah_alat" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-surface dark:bg-inverse-surface rounded-[24px] p-8 w-full max-w-sm ambient-shadow-lvl2 border border-outline-variant/20 relative animate-fadeIn shadow-2xl">
            <button onClick={closeModal} className="absolute top-4 right-4 text-outline hover:text-error"><X size={20} /></button>
            <h3 className="font-headline-md text-lg text-on-surface dark:text-inverse-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">add_box</span> Stok Baru
            </h3>

            <form onSubmit={e => { e.preventDefault(); doTambahAlat(); }} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-outline-variant uppercase tracking-wider mb-1 block">Nama Alat</label>
                <div className="relative">
                  <input 
                    required autoFocus 
                    placeholder="Pilih atau ketik merek/nama alat..." 
                    value={newNama} 
                    onChange={handleNameChange}
                    onFocus={() => setShowNameDropdown(true)}
                    onBlur={() => setTimeout(() => setShowNameDropdown(false), 200)}
                    className="w-full bg-background dark:bg-surface-container-lowest/5 border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm text-on-surface dark:text-inverse-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                  />
                  {showNameDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-surface dark:bg-inverse-surface border border-outline-variant/30 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {Array.from(new Set(alatList.map((a: any) => a.nama)))
                        .filter((n: any) => n.toLowerCase().includes(newNama.toLowerCase()))
                        .map((nama: any) => (
                        <div 
                          key={nama}
                          className="px-4 py-2.5 hover:bg-surface-container-highest cursor-pointer text-sm text-on-surface dark:text-inverse-on-surface transition-colors border-b border-outline-variant/10 last:border-0"
                          onClick={() => {
                            handleNameChange({ target: { value: nama } });
                            setShowNameDropdown(false);
                          }}
                        >
                          {nama}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {isExisting && <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle size={10} /> Alat sudah ada, unit baru akan dibuat</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-outline-variant uppercase tracking-wider mb-1 block">Kode Mulai</label>
                  <input readOnly value={newKode} className="w-full bg-surface-container-highest/50 dark:bg-black/20 border border-outline-variant/10 rounded-xl px-4 py-2.5 text-sm text-outline font-code-hud" />
                </div>
                <div>
                  <label className="text-xs font-bold text-outline-variant uppercase tracking-wider mb-1 block">Jumlah Unit</label>
                  <input required type="number" min="1" value={newJumlah} onChange={e => setNewJumlah(e.target.value)} className="w-full bg-background dark:bg-surface-container-lowest/5 border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm text-on-surface dark:text-inverse-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-outline-variant uppercase tracking-wider mb-1 block">Kategori</label>
                <div className="relative">
                  <input 
                    required 
                    placeholder="Pilih atau ketik kategori..." 
                    value={newKategori} 
                    onChange={e => setNewKategori(e.target.value)} 
                    disabled={isExisting} 
                    onFocus={() => setShowKategoriDropdown(true)}
                    onBlur={() => setTimeout(() => setShowKategoriDropdown(false), 200)}
                    className="w-full bg-background dark:bg-surface-container-lowest/5 border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm text-on-surface dark:text-inverse-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-50 disabled:bg-surface-container-highest" 
                  />
                  {showKategoriDropdown && !isExisting && (
                    <div className="absolute bottom-[calc(100%+4px)] z-10 w-full bg-surface dark:bg-inverse-surface border border-outline-variant/30 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {Object.keys(kategoriStats)
                        .filter((k: any) => k.toLowerCase().includes(newKategori.toLowerCase()))
                        .map((kat: any) => (
                        <div 
                          key={kat}
                          className="px-4 py-2.5 hover:bg-surface-container-highest cursor-pointer text-sm text-on-surface dark:text-inverse-on-surface transition-colors border-b border-outline-variant/10 last:border-0"
                          onClick={() => {
                            setNewKategori(kat);
                            setShowKategoriDropdown(false);
                          }}
                        >
                          {kat}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button type="submit" disabled={!newNama} className="w-full mt-2 bg-gradient-to-r from-primary to-surface-tint text-on-primary py-3 rounded-xl font-bold text-sm hover:shadow-lg disabled:opacity-50 transition-all flex justify-center items-center gap-2">
                Simpan ke Katalog
              </button>
            </form>
          </div>
        </div>
      )}

      {modal?.type === "edit_alat" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-surface dark:bg-inverse-surface rounded-[24px] p-8 w-full max-w-sm ambient-shadow-lvl2 border border-outline-variant/20 relative animate-fadeIn shadow-2xl">
            <button onClick={closeModal} className="absolute top-4 right-4 text-outline hover:text-error transition-colors"><X size={20} /></button>
            <h3 className="font-headline-md text-xl text-on-surface dark:text-inverse-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">edit</span> Edit Data Alat
            </h3>

            <form onSubmit={e => { e.preventDefault(); doEditAlat(); }} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-outline-variant uppercase tracking-wider mb-1 block">Kode Alat</label>
                <input readOnly value={newKode} className="w-full bg-surface-container-highest/50 dark:bg-black/20 border border-outline-variant/10 rounded-xl px-4 py-3 text-sm text-outline font-code-hud cursor-not-allowed" />
              </div>
              <div>
                <label className="text-xs font-bold text-outline-variant uppercase tracking-wider mb-1 block">Nama Alat</label>
                <input required autoFocus placeholder="Nama alat..." value={newNama} onChange={e => setNewNama(e.target.value)} className="w-full bg-background dark:bg-surface-container-lowest/5 border border-outline-variant/30 rounded-xl px-4 py-3 text-sm text-on-surface dark:text-inverse-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
              </div>
              <div>
                <label className="text-xs font-bold text-outline-variant uppercase tracking-wider mb-1 block">Kategori</label>
                <input required list="list-kategori-edit" placeholder="Pilih atau ketik kategori..." value={newKategori} onChange={e => setNewKategori(e.target.value)} className="w-full bg-background dark:bg-surface-container-lowest/5 border border-outline-variant/30 rounded-xl px-4 py-3 text-sm text-on-surface dark:text-inverse-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                <datalist id="list-kategori-edit">
                  {Object.keys(kategoriStats).map(kat => <option key={kat} value={kat} />)}
                </datalist>
              </div>
              <button type="submit" disabled={!newNama || !newKategori} className="w-full mt-4 bg-primary hover:bg-primary-container text-on-primary py-3 rounded-xl font-bold text-sm hover:shadow-lg disabled:opacity-50 transition-all flex justify-center items-center gap-2">
                Simpan Perubahan
              </button>
            </form>
          </div>
        </div>
      )}

      {(modal?.type === "tambah_alat_sukses" || modal?.type === "lihat_qr") && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-surface dark:bg-inverse-surface rounded-[24px] p-8 w-full max-w-sm ambient-shadow-lvl2 border border-outline-variant/20 relative animate-fadeIn text-center shadow-2xl">
            <button onClick={closeModal} className="absolute top-4 right-4 text-outline hover:text-error"><X size={20} /></button>

            {modal.type === "tambah_alat_sukses" ? (
              <>
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} />
                </div>
                <h3 className="font-headline-md text-lg text-on-surface dark:text-inverse-on-surface mb-2">Alat Berhasil Ditambahkan</h3>
                <p className="text-sm text-on-surface-variant dark:text-outline-variant mb-6">Berikut adalah Kode untuk alat <strong>{modal.nama}</strong>. Silakan dicatat atau tempelkan pada fisik alat.</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Tag size={32} />
                </div>
                <h3 className="font-headline-md text-lg text-on-surface dark:text-inverse-on-surface mb-2">Kode Alat</h3>
                <p className="text-sm text-on-surface-variant dark:text-outline-variant mb-6">Alat: <strong>{modal.nama}</strong></p>
              </>
            )}

            <div className="bg-white p-4 rounded-xl border border-outline-variant/20 mb-6 inline-block mx-auto shadow-sm text-center min-w-[200px]">
              <p className="text-3xl font-code-hud font-bold tracking-widest text-on-surface">{modal.kode}</p>
            </div>

            <div className="flex gap-3">

              <button onClick={closeModal} className="flex-1 bg-gradient-to-r from-primary to-surface-tint text-on-primary py-3 rounded-xl font-bold text-sm hover:shadow-lg transition-all flex justify-center items-center gap-2">
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {modal?.type === "lihat_kondisi" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-surface dark:bg-inverse-surface rounded-[24px] p-8 w-full max-w-sm ambient-shadow-lvl2 border border-outline-variant/20 relative animate-fadeIn shadow-2xl">
            <button onClick={closeModal} className="absolute top-4 right-4 text-outline hover:text-error"><X size={20} /></button>
            <h3 className="font-headline-md text-lg text-on-surface dark:text-inverse-on-surface mb-4">Informasi Kondisi Alat</h3>
            
            <div className="bg-surface-container-lowest dark:bg-black/20 p-4 rounded-xl border border-outline-variant/10 mb-4">
                <p className="font-bold text-sm text-on-surface dark:text-inverse-on-surface">{modal.alat.nama}</p>
                <p className="text-xs text-outline-variant mt-1">{modal.alat.kode}</p>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs text-outline font-bold uppercase tracking-wider mb-1">Status Ketersediaan</p>
                <p className="text-sm font-bold text-on-surface dark:text-inverse-on-surface">{modal.alat.status} ({modal.alat.tersediaCount} dari {modal.alat.total} unit)</p>
              </div>
              <div>
                <p className="text-xs text-outline font-bold uppercase tracking-wider mb-1">Kondisi Fisik Saat Ini</p>
                <p className={`text-sm font-bold ${kondisiColor[modal.alat.kondisi] || 'text-on-surface dark:text-inverse-on-surface'}`}>{modal.alat.kondisi || 'Baik'}</p>
              </div>
            </div>

            <button onClick={closeModal} className="w-full mt-6 bg-surface-container-high hover:bg-surface-container-highest text-on-surface py-3 rounded-xl font-bold text-sm transition-all">
                Tutup
            </button>
          </div>
        </div>
      )}

      {/* ─── TRANSAKSI VIEWS ─── */}
      {(tab === "keluar" || tab === "dipinjam") && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter animate-fadeIn">
          {tab === "keluar" && siapKeluar.length === 0 && (
            <div className="col-span-full py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-4 text-outline-variant">
                <PackageCheck size={28} />
              </div>
              <h3 className="font-headline-md text-lg text-on-surface dark:text-inverse-on-surface mb-2">Semua Tuntas</h3>
              <p className="text-on-surface-variant dark:text-outline-variant">Tidak ada alat yang menunggu penyerahan.</p>
            </div>
          )}
          {tab === "dipinjam" && dipinjam.length === 0 && (
            <div className="col-span-full py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-4 text-outline-variant">
                <Info size={28} />
              </div>
              <h3 className="font-headline-md text-lg text-on-surface dark:text-inverse-on-surface mb-2">Aman</h3>
              <p className="text-on-surface-variant dark:text-outline-variant">Saat ini tidak ada alat yang sedang dipinjam keluar.</p>
            </div>
          )}

          {tab === "keluar" && siapKeluar.map((t: any) => <TrxRow key={t.nomor} t={t} btn="Keluarkan Alat" btnIcon={<ChevronRight size={14} />} onBtn={() => setModal({ type: "keluar", trx: t })} colorTheme="blue" />)}
          {tab === "dipinjam" && dipinjam.map((t: any) => <TrxRow key={t.nomor} t={t} btn="Terima Kembali" btnIcon={<RotateCcw size={14} />} onBtn={() => { setModal({ type: "kembali", trx: t }); setKondisi(""); setStep(1); }} colorTheme="emerald" />)}
        </div>
      )}

      {/* ─── SELESAI TAB (HISTORY BULANAN) ─── */}
      {tab === "selesai" && (
        <div className="bg-surface dark:bg-surface-container-lowest/5 rounded-[24px] p-stack-lg border border-outline-variant/10 ambient-shadow-lvl2 animate-fadeIn">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
            <div>
              <h2 className="font-headline-md text-xl text-on-surface dark:text-inverse-on-surface">Riwayat Peminjaman Bulanan</h2>
              <p className="text-sm text-on-surface-variant dark:text-outline-variant">Laporan peminjaman alat yang telah selesai.</p>
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
                disabled={selesai.length === 0 || isExporting !== ""}
                onClick={async () => {
                  setIsExporting("excel");
                  await exportExcel(selesai, selectedMonth, "Riwayat_Peminjaman_PINSET");
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
                disabled={selesai.length === 0 || isExporting !== ""}
                onClick={async () => {
                  setIsExporting("pdf");
                  await exportPDF(selesai, selectedMonth, "Riwayat_Peminjaman_PINSET");
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
                  <th className="py-3 px-2">Tanggal Pinjam</th>
                  <th className="py-3 px-2">Tanggal Kembali</th>
                  <th className="py-3 px-2">Tujuan</th>
                  <th className="py-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {selesai.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-outline">Belum ada riwayat peminjaman.</td></tr>
                ) : selesai.map((t: any, idx: number) => {
                  let namaAlat = t.nama_alat_produksi;
                  try {
                    const parsed = JSON.parse(namaAlat);
                    if (Array.isArray(parsed)) {
                      // Count frequencies
                      const counts: Record<string, number> = {};
                      parsed.forEach((n: string) => counts[n] = (counts[n] || 0) + 1);
                      namaAlat = Object.entries(counts).map(([name, qty]) => `${name} (${qty})`).join(", ");
                    }
                  } catch(e) {}

                  return (
                    <tr key={t.nomor} className="border-b border-outline-variant/10 hover:bg-surface-container-lowest/50 transition-colors text-sm text-on-surface">
                      <td className="py-3 px-2">{idx + 1}</td>
                      <td className="py-3 px-2">
                        <p className="font-bold">{t.peminjam}</p>
                        <p className="text-xs text-outline-variant">{t.peminjam_instansi}</p>
                      </td>
                      <td className="py-3 px-2 max-w-[200px] truncate" title={namaAlat}>{namaAlat}</td>
                      <td className="py-3 px-2">{fmtDate(t.tanggal_peminjaman)}</td>
                      <td className="py-3 px-2 text-emerald-600 font-bold">{fmtDate(t.tanggal_pengembalian)}</td>
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

      {/* ─── DITOLAK TAB ─── */}
      {tab === "ditolak" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter animate-fadeIn">
          {ditolak.length === 0 ? (
            <div className="col-span-full py-16 text-center">
              <h3 className="font-headline-md text-lg text-on-surface dark:text-inverse-on-surface mb-2">Tidak ada transaksi ditolak</h3>
            </div>
          ) : ditolak.map((t: any) => {
            const namaAlat = formatArrayStr(t.nama_alat_produksi, true);
            return (
            <div key={t.nomor} className="bg-surface dark:bg-surface-container-lowest/5 rounded-[20px] p-5 border border-error/20 ambient-shadow-lvl1 flex flex-col gap-4">
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-bold text-on-surface dark:text-inverse-on-surface text-sm">{namaAlat}</h3>
                <PhaseChip trx={t} />
              </div>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-3 border-t border-outline-variant/10">
                <div>
                  <p className="text-[10px] text-outline font-semibold uppercase tracking-wider mb-1">Peminjam</p>
                  <p className="text-xs text-on-surface dark:text-inverse-on-surface font-bold">{t.peminjam}</p>
                </div>
                <div>
                  <p className="text-[10px] text-outline font-semibold uppercase tracking-wider mb-1">Tujuan</p>
                  <p className={`text-xs font-bold text-outline`}>{t.tujuan_peminjaman || "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-outline font-semibold uppercase tracking-wider mb-1 text-error">Alasan Penolakan (Koordinator)</p>
                  <p className="text-xs text-on-surface-variant dark:text-outline-variant p-3 bg-error/10 text-error rounded-xl border border-error/20 font-bold">{t.alasan_penolakan || "Tidak ada alasan."}</p>
                </div>
              </div>
            </div>
          )})}
        </div>
      )}

      {/* ─── INVENTARIS TAB ─── */}
      {tab === "inventaris" && (
        <div className="animate-fadeIn flex flex-col gap-stack-lg">
          <div className="flex flex-col md:flex-row gap-4 mb-2">
            <button onClick={() => { setNewKode(generateNewKode()); setModal({ type: "tambah_alat" }); }} className="bg-gradient-to-r from-primary to-surface-tint text-on-primary border-none rounded-xl px-6 py-3 flex items-center justify-center gap-2 font-bold text-sm shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0">
              <Plus size={18} /> Tambah Stok / Alat Baru
            </button>

            <div className="flex flex-wrap gap-2 flex-1 items-center md:justify-end">
              {Object.entries(kategoriStats).map(([kat, count]) => (
                <div key={kat} className="bg-surface dark:bg-inverse-surface border border-outline-variant/20 rounded-xl px-3 py-1.5 text-xs font-bold text-on-surface-variant dark:text-outline-variant flex items-center gap-2 shadow-sm">
                  {kat} <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-md">{count as number}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {invStats.map((s, i) => (
              <div key={i} className="bg-surface dark:bg-surface-container-lowest/5 rounded-2xl p-4 border border-outline-variant/10 ambient-shadow-lvl1 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full bg-surface-container-low dark:bg-black/20 flex items-center justify-center ${s[3]}`}>
                  <span className="material-symbols-outlined text-[24px]">{s[2]}</span>
                </div>
                <div>
                  <p className={`text-2xl font-bold ${s[3]}`}>{s[1]}</p>
                  <p className="text-xs text-outline font-bold uppercase tracking-wider">{s[0]}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mt-2">
            {kondisiCardStats.map((s, i) => (
              <div key={i} className="bg-surface dark:bg-surface-container-lowest/5 rounded-2xl p-4 border border-outline-variant/10 ambient-shadow-lvl1 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full bg-surface-container-low dark:bg-black/20 flex items-center justify-center ${s.color}`}>
                  <span className="material-symbols-outlined text-[24px]">{s.icon}</span>
                </div>
                <div>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
                  <p className="text-xs text-outline font-bold uppercase tracking-wider">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter mt-2">
            {inventory.length === 0 ? <div className="col-span-full py-16 text-center text-outline"><PackageSearch size={32} className="mx-auto mb-2" />Belum ada katalog.</div> : inventory.map((i: any) => (
              <div key={i.kode} className="bg-surface dark:bg-surface-container-lowest/5 border border-outline-variant/10 rounded-2xl p-4 flex gap-4 ambient-shadow-lvl1">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${i.status === "Tersedia" ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
                  <Wrench size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-bold text-on-surface dark:text-inverse-on-surface text-sm">{i.nama}</p>
                    <span className="text-[9px] bg-surface-container-high dark:bg-black/30 text-on-surface-variant dark:text-outline px-2 py-0.5 rounded uppercase tracking-wider font-bold">{i.kategori}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-xs text-outline-variant font-code-hud">{i.kode}</p>
                    <button onClick={() => setModal({ type: "lihat_kondisi", alat: i })} className="text-[10px] bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant px-2 py-1 rounded-md font-bold transition-colors flex items-center gap-1 active:scale-95">
                      <span className="material-symbols-outlined text-[12px]">info</span> Detail Kondisi
                    </button>
                    <button onClick={() => {
                        setNewKode(i.kode);
                        setNewNama(i.nama);
                        setNewKategori(i.kategori);
                        setModal({ type: "edit_alat" });
                      }} className="text-[10px] bg-primary/10 hover:bg-primary/20 text-primary px-2 py-1 rounded-md font-bold transition-colors flex items-center gap-1 active:scale-95">
                        <span className="material-symbols-outlined text-[12px]">edit</span> Edit
                    </button>
                    {(i.kondisi === "Rusak Ringan" || i.kondisi === "Kurang Baik" || i.kondisi === "Kondisi Kurang Baik") && (
                      <button onClick={() => {
                        setConfirmModal({ title: "Kirim ke Service?", message: `Ubah status alat "${i.nama}" (${i.kode}) menjadi Service?`, icon: "build_circle", color: "text-amber-600", confirmLabel: "Ya, Service", onConfirm: () => { updateStatusAlat(i.kode, "Service"); setConfirmModal(null); } });
                      }} className="text-[10px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 px-2 py-1 rounded-md font-bold transition-colors flex items-center gap-1 active:scale-95">
                        <span className="material-symbols-outlined text-[12px]">build_circle</span> Service
                      </button>
                    )}
                    {(i.kondisi === "Service" || i.kondisi === "Rusak Berat" || i.kondisi === "Rusak Ringan" || i.kondisi === "Kurang Baik" || i.kondisi === "Kondisi Kurang Baik") && (
                      <button onClick={() => {
                        setConfirmModal({ title: "Set Kondisi Baik?", message: `Ubah status alat "${i.nama}" (${i.kode}) menjadi Kondisi Baik?`, icon: "check_circle", color: "text-emerald-600", confirmLabel: "Ya, Set Baik", onConfirm: () => { updateStatusAlat(i.kode, "Baik"); setConfirmModal(null); } });
                      }} className="text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 px-2 py-1 rounded-md font-bold transition-colors flex items-center gap-1 active:scale-95">
                        <span className="material-symbols-outlined text-[12px]">check_circle</span> Set Baik
                      </button>
                    )}
                    <button onClick={() => {
                      setConfirmModal({ title: "Hapus Alat?", message: `Hapus alat "${i.nama}" (${i.kode}) secara permanen? Tindakan ini tidak bisa dibatalkan.`, icon: "delete_forever", color: "text-error", confirmLabel: "Hapus Permanen", onConfirm: () => { hapusAlat(i.kode); setConfirmModal(null); } });
                    }} className="text-[10px] bg-error/10 hover:bg-error/20 text-error px-2 py-1 rounded-md font-bold transition-colors flex items-center gap-1 active:scale-95 ml-auto">
                      <span className="material-symbols-outlined text-[12px]">delete</span> Hapus
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <p className={i.tersediaCount > 0 ? "text-emerald-600 font-bold" : "text-error font-bold"}>
                      {i.tersediaCount > 0 ? `Tersedia ${i.tersediaCount} / ${i.total} unit` : `Semua unit dipinjam (${i.total})`}
                    </p>
                    <p className="text-outline-variant flex items-center gap-1">Kondisi Terakhir: <span className={`font-bold ${kondisiColor[i.kondisi] || 'text-outline'}`}>{i.kondisi}</span></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── CUSTOM CONFIRM MODAL ─── */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4" onClick={() => setConfirmModal(null)}>
          <div className="bg-surface dark:bg-inverse-surface rounded-[24px] p-8 w-full max-w-sm ambient-shadow-lvl2 border border-outline-variant/20 relative animate-fadeIn shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setConfirmModal(null)} className="absolute top-4 right-4 text-outline hover:text-error transition-colors"><X size={20}/></button>
            
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              confirmModal.color === 'text-error' ? 'bg-error/10' : 
              confirmModal.color === 'text-emerald-600' ? 'bg-emerald-500/10' : 
              'bg-amber-500/10'
            }`}>
              <span className={`material-symbols-outlined text-[28px] ${confirmModal.color}`}>{confirmModal.icon}</span>
            </div>
            
            <h3 className="font-headline-md text-lg text-on-surface dark:text-inverse-on-surface mb-2 text-center">{confirmModal.title}</h3>
            <p className="text-sm text-on-surface-variant dark:text-outline-variant mb-6 text-center leading-relaxed">{confirmModal.message}</p>
            
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(null)} className="flex-1 bg-surface-container-high dark:bg-surface-container-highest text-on-surface dark:text-inverse-on-surface py-3 rounded-xl font-bold text-sm hover:shadow-md transition-all">
                Batal
              </button>
              <button onClick={confirmModal.onConfirm} className={`flex-1 py-3 rounded-xl font-bold text-sm hover:shadow-lg transition-all text-white ${
                confirmModal.color === 'text-error' ? 'bg-gradient-to-r from-red-600 to-red-500' : 
                confirmModal.color === 'text-emerald-600' ? 'bg-gradient-to-r from-emerald-600 to-emerald-500' : 
                'bg-gradient-to-r from-amber-600 to-amber-500'
              }`}>
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
