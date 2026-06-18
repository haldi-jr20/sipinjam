"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PackageCheck, Wrench, ChevronRight, Info, RotateCcw, CheckCircle, X, PackageSearch, Plus, Tag, QrCode, XCircle } from "lucide-react";
import { useTransaction } from "@/lib/TransactionContext";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { PhaseChip, BarcodeScannerBtn, Avt, Empty, fmtRel, fmtDate } from "@/components/ui/SharedUI";
import Barcode from "react-barcode";

export default function PetugasPage() {
  const router = useRouter();
  const { user, data, dispatch, alatList, addAlat } = useTransaction();

  const [tab, setTab] = useState("keluar");
  const [modal, setModal] = useState<any>(null);

  const [kondisi, setKondisi] = useState("");
  const [deskripsiKondisi, setDeskripsiKondisi] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // State untuk tambah alat
  const [newKode, setNewKode] = useState("");
  const [newNama, setNewNama] = useState("");
  const [newKategori, setNewKategori] = useState("");
  const [newJumlah, setNewJumlah] = useState("1");
  const [isExisting, setIsExisting] = useState(false);
  const [scanKembaliErr, setScanKembaliErr] = useState("");

  // State untuk buat peminjaman
  const [peminjamName, setPeminjamName] = useState("");
  const [peminjamInstansi, setPeminjamInstansi] = useState("");
  const [peminjamDivisi, setPeminjamDivisi] = useState("");
  const [peminjamKontak, setPeminjamKontak] = useState("");
  const [alatTarget, setAlatTarget] = useState<any>(null);
  const [alatKodeTarget, setAlatKodeTarget] = useState("");
  const [jumlahPinjamTarget, setJumlahPinjamTarget] = useState("1");
  const [keteranganTarget, setKeteranganTarget] = useState("");
  const [scanAjukanErr, setScanAjukanErr] = useState("");
  const [ajukanOk, setAjukanOk] = useState(false);

  useEffect(() => {
    if (!user) router.push("/login");
    else if (user.role !== "petugas") router.push(`/${user.role}`);
  }, [user, router]);

  if (!user || user.role !== "petugas") return null;

  const approved = data.filter((t: any) => t.persetujuan_koordinator === "approved");
  const siapKeluar = approved.filter((t: any) => !t.waktu_keluar && !t.waktu_kembali).sort((a: any, b: any) => b.nomor - a.nomor);
  const dipinjam = approved.filter((t: any) => t.waktu_keluar && !t.waktu_kembali).sort((a: any, b: any) => new Date(b.waktu_keluar).getTime() - new Date(a.waktu_keluar).getTime());
  const selesai = approved.filter((t: any) => t.waktu_kembali).sort((a: any, b: any) => new Date(b.waktu_kembali).getTime() - new Date(a.waktu_kembali).getTime());

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
  const sisaStokTarget = getTersedia(alatKodeTarget);

  function submitAjukan(e: React.FormEvent) {
    e.preventDefault();
    const qty = parseInt(jumlahPinjamTarget);
    if (!alatTarget || qty < 1 || qty > sisaStokTarget || !peminjamName) return;
    dispatch({
      type: "ADD",
      payload: {
        nomor: Date.now(),
        barcode_aset: alatTarget.kode,
        nama_alat_produksi: alatTarget.nama,
        peminjam: peminjamName,
        peminjam_instansi: peminjamInstansi,
        peminjam_divisi: peminjamDivisi,
        peminjam_kontak: peminjamKontak,
        persetujuan_koordinator: "pending",
        waktu_keluar: null,
        waktu_kembali: null,
        petugas_kontrol_alat: null
      }
    });
    setAlatTarget(null); setAlatKodeTarget(""); setJumlahPinjamTarget("1"); setKeteranganTarget("");
    setPeminjamName(""); setPeminjamInstansi(""); setPeminjamDivisi(""); setPeminjamKontak("");
    setAjukanOk(true);
    setTimeout(() => { setAjukanOk(false); setTab("keluar"); }, 1600);
  }

  function closeModal() {
    setModal(null); setLoading(false); setStep(1); setKondisi(""); setDeskripsiKondisi("");
    setNewKode(""); setNewNama(""); setNewKategori(""); setNewJumlah("1"); setIsExisting(false); setScanKembaliErr("");
  }

  function generateNewKode() {
    let maxId = 0;
    alatList.forEach((a: any) => {
      if (a.kode.startsWith("ALT-")) {
        const num = parseInt(a.kode.substring(4), 10);
        if (!isNaN(num) && num > maxId) maxId = num;
      }
    });
    return `ALT-${String(maxId + 1).padStart(3, '0')}`;
  }

  function handleNameChange(e: any) {
    const val = e.target.value;
    setNewNama(val);
    const existing = alatList.find((a: any) => a.nama.toLowerCase() === val.toLowerCase());
    if (existing) {
      setNewKode(existing.kode); setNewKategori(existing.kategori); setIsExisting(true);
    } else {
      setNewKode(generateNewKode());
      if (isExisting) setNewKategori("");
      setIsExisting(false);
    }
  }

  function doTambahAlat() {
    if (!newKode || !newNama || !newKategori || parseInt(newJumlah) < 1) return;
    let finalKategori = newKategori.trim();
    const existingCat = Object.keys(kategoriStats).find(k => k.toLowerCase() === finalKategori.toLowerCase());
    if (existingCat) finalKategori = existingCat;
    addAlat(newKode, newNama, finalKategori, parseInt(newJumlah));
    setModal({ type: "tambah_alat_sukses", kode: newKode, nama: newNama });
  }

  function doKeluar() {
    setLoading(true);
    setTimeout(() => {
      dispatch({ type: "KELUAR", id: modal.trx.nomor, petugas: user.name });
      closeModal(); setTab("dipinjam");
    }, 1300);
  }

  function doScanKembali(scannedCode: string) {
    setScanKembaliErr("");
    if (scannedCode.toLowerCase() !== modal.trx.barcode_aset.toLowerCase()) {
      setScanKembaliErr(`Kode "${scannedCode}" tidak cocok dengan alat yang sedang dikembalikan (${modal.trx.barcode_aset}).`);
      return;
    }
    setStep(3);
    setTimeout(() => {
      dispatch({ type: "KEMBALI", id: modal.trx.nomor, kondisi, deskripsi: deskripsiKondisi, petugas: user.name });
      closeModal(); setTab("selesai");
    }, 1400);
  }

  const kondisiOpts = ["Baik", "Rusak Ringan", "Rusak Berat"];
  const kondisiColor: any = { "Baik": "text-emerald-600", "Rusak Ringan": "text-amber-600", "Rusak Berat": "text-error" };

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
              <p className="font-bold text-on-surface dark:text-inverse-on-surface text-sm">{t.nama_alat_produksi}</p>
              <p className="text-xs text-outline-variant mt-0.5">TRX-{t.nomor} • {t.barcode_aset}</p>
            </div>
          </div>
          <PhaseChip trx={t} />
        </div>

        <div className="bg-surface-container-lowest dark:bg-black/20 rounded-xl p-3 text-xs text-on-surface-variant dark:text-outline-variant border border-outline-variant/5">
          {t.keterangan}
        </div>

        <div className="pt-3 border-t border-outline-variant/10 flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isBlue ? 'bg-primary/10 text-primary' : 'bg-emerald-500/10 text-emerald-600'}`}>
              {t.peminjam.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface dark:text-inverse-on-surface">{t.peminjam}</p>
              <p className="text-[10px] text-outline-variant">
                {t.waktu_keluar ? `Keluar ${fmtRel(t.waktu_keluar)}` : `Disetujui`}
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
                  required value={peminjamName} onChange={e => setPeminjamName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  className="w-full bg-background dark:bg-inverse-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface dark:text-inverse-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-body-md"
                />
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
                <label className="font-label-md text-label-md text-on-surface-variant dark:text-outline-variant">No. Telepon / Email</label>
                <input
                  required value={peminjamKontak} onChange={e => setPeminjamKontak(e.target.value)}
                  placeholder="Nomor telepon/Email yang bisa dihubungi"
                  className="w-full bg-background dark:bg-inverse-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface dark:text-inverse-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-body-md"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-label-md text-label-md text-on-surface-variant dark:text-outline-variant">Pilih Aset / Alat (Tanpa Scan Barcode)</label>
              <div className="flex flex-col sm:flex-row gap-stack-sm">
                <div className="relative flex-1">
                  <select
                    value={alatKodeTarget}
                    onChange={e => {
                      const selected = alatList.find((a: any) => a.kode === e.target.value);
                      setAlatTarget(selected || null);
                      setAlatKodeTarget(e.target.value);
                      setJumlahPinjamTarget("1");
                      setScanAjukanErr("");
                    }}
                    className="w-full appearance-none bg-background dark:bg-inverse-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface dark:text-inverse-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-body-md"
                  >
                    <option value="">Pilih dari katalog...</option>
                    {alatList.map((a: any) => {
                      const stok = getTersedia(a.kode);
                      return <option key={a.kode} value={a.kode} disabled={stok === 0}>{a.nama} {stok === 0 ? "(Habis)" : `(${stok} tersedia)`}</option>
                    })}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
                </div>

                <div className="sm:w-48 shrink-0">
                  <BarcodeScannerBtn
                    label="Scan Barcode Alat"
                    sub="Arahkan kamera ke QR"
                    onResult={(code: string) => {
                      setScanAjukanErr("");
                      const found = alatList.find((a: any) => a.kode.toLowerCase() === code.toLowerCase() || a.nama.toLowerCase() === code.toLowerCase());
                      if (found) {
                        const stok = getTersedia(found.kode);
                        if (stok === 0) setScanAjukanErr(`Alat "${found.nama}" sedang tidak tersedia.`);
                        else { setAlatTarget(found); setAlatKodeTarget(found.kode); setJumlahPinjamTarget("1"); }
                      } else {
                        setScanAjukanErr(`Kode "${code}" tidak ditemukan.`);
                      }
                    }}
                  />
                </div>
              </div>

              {scanAjukanErr && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-3 flex gap-2 items-start mt-2">
                  <XCircle size={14} className="text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                  <p className="text-red-800 dark:text-red-300 text-xs m-0">{scanAjukanErr}</p>
                </div>
              )}

              {alatTarget && (
                <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-3 flex gap-3 items-center mt-2">
                  <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center shrink-0">
                    <Wrench size={18} className="text-primary dark:text-primary-fixed-dim" />
                  </div>
                  <div className="flex-1">
                    <p className="font-label-md text-label-md text-on-surface dark:text-inverse-on-surface">{alatTarget.nama}</p>
                    <p className="text-xs text-on-surface-variant dark:text-outline-variant mt-0.5">{alatTarget.kode}</p>
                  </div>
                  <button type="button" onClick={() => { setAlatTarget(null); setAlatKodeTarget(""); }} className="text-outline hover:text-error transition-colors p-1">
                    <XCircle size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="font-label-md text-label-md text-on-surface-variant dark:text-outline-variant">Kuantitas</label>
                {alatTarget && (
                  <div className="bg-secondary-container/20 border border-secondary/30 px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_4px_#006c4a]"></div>
                    <span className="font-label-md text-[11px] text-secondary dark:text-secondary-fixed">Tersedia: {sisaStokTarget} Unit</span>
                  </div>
                )}
              </div>
              <input
                type="number" min="1" max={sisaStokTarget || 1}
                value={jumlahPinjamTarget} onChange={e => setJumlahPinjamTarget(e.target.value)}
                disabled={!alatTarget}
                className="w-full bg-background dark:bg-inverse-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface dark:text-inverse-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-body-md disabled:opacity-50 disabled:bg-surface-container"
              />
              {alatTarget && parseInt(jumlahPinjamTarget) > sisaStokTarget && (
                <p className="text-xs text-error mt-1 font-body-md">Melebihi stok tersedia ({sisaStokTarget})</p>
              )}
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
                disabled={!alatTarget || parseInt(jumlahPinjamTarget) < 1 || parseInt(jumlahPinjamTarget) > sisaStokTarget || !peminjamName}
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
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-surface dark:bg-inverse-surface rounded-[24px] p-6 w-full max-w-sm ambient-shadow-lvl2 border border-outline-variant/20 relative animate-fadeIn">
            <button onClick={closeModal} className="absolute top-4 right-4 text-outline hover:text-error"><X size={20} /></button>
            <h3 className="font-headline-md text-lg text-on-surface dark:text-inverse-on-surface mb-2">Serah Terima Alat</h3>
            <p className="text-sm text-on-surface-variant dark:text-outline-variant mb-4">Pastikan alat dalam kondisi baik sebelum diserahkan kepada peminjam.</p>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex gap-3 items-center mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                <Wrench size={18} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-on-surface dark:text-inverse-on-surface">{modal.trx.nama_alat_produksi}</p>
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
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-surface dark:bg-inverse-surface rounded-[24px] p-6 w-full max-w-md ambient-shadow-lvl2 border border-outline-variant/20 relative animate-fadeIn overflow-hidden">
            <button onClick={closeModal} className="absolute top-4 right-4 text-outline hover:text-error z-10"><X size={20} /></button>

            <div className="flex items-center gap-2 mb-6 relative z-10">
              <div className={`flex-1 h-1.5 rounded-full ${step >= 1 ? 'bg-emerald-500' : 'bg-outline-variant/30'}`}></div>
              <div className={`flex-1 h-1.5 rounded-full ${step >= 2 ? 'bg-emerald-500' : 'bg-outline-variant/30'}`}></div>
              <div className={`flex-1 h-1.5 rounded-full ${step >= 3 ? 'bg-emerald-500' : 'bg-outline-variant/30'}`}></div>
            </div>

            {step === 1 && (
              <div className="animate-fadeIn">
                <h3 className="font-headline-md text-lg text-on-surface dark:text-inverse-on-surface mb-2">Cek Fisik Alat</h3>
                <p className="text-sm text-on-surface-variant dark:text-outline-variant mb-4">Bagaimana kondisi fisik {modal.trx.nama_alat_produksi} saat ini?</p>

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
                  Lanjut Scan Barcode <ChevronRight size={16} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="animate-fadeIn">
                <h3 className="font-headline-md text-lg text-on-surface dark:text-inverse-on-surface mb-2">Verifikasi Barcode</h3>
                <p className="text-sm text-on-surface-variant dark:text-outline-variant mb-4">Scan barcode pada fisik alat untuk memastikan alat yang dikembalikan sesuai.</p>

                <div className="mb-6">
                  <BarcodeScannerBtn label="Scan Barcode Alat" sub="Arahkan ke QR Alat" onResult={doScanKembali} />
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
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-surface dark:bg-inverse-surface rounded-[24px] p-6 w-full max-w-sm ambient-shadow-lvl2 border border-outline-variant/20 relative animate-fadeIn">
            <button onClick={closeModal} className="absolute top-4 right-4 text-outline hover:text-error"><X size={20} /></button>
            <h3 className="font-headline-md text-lg text-on-surface dark:text-inverse-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">add_box</span> Stok Baru
            </h3>

            <form onSubmit={e => { e.preventDefault(); doTambahAlat(); }} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-outline-variant uppercase tracking-wider mb-1 block">Nama Alat</label>
                <input required autoFocus list="list-nama-alat" placeholder="Pilih atau ketik merek/nama alat..." value={newNama} onChange={handleNameChange} className="w-full bg-background dark:bg-surface-container-lowest/5 border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm text-on-surface dark:text-inverse-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                <datalist id="list-nama-alat">
                  {alatList.map((a: any) => <option key={a.kode} value={a.nama} />)}
                </datalist>
                {isExisting && <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle size={10} /> Alat sudah ada, stok akan ditambahkan</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-outline-variant uppercase tracking-wider mb-1 block">Kode (Auto)</label>
                  <input readOnly value={newKode} className="w-full bg-surface-container-highest/50 dark:bg-black/20 border border-outline-variant/10 rounded-xl px-4 py-2.5 text-sm text-outline font-code-hud" />
                </div>
                <div>
                  <label className="text-xs font-bold text-outline-variant uppercase tracking-wider mb-1 block">Tambah Jumlah</label>
                  <input required type="number" min="1" value={newJumlah} onChange={e => setNewJumlah(e.target.value)} className="w-full bg-background dark:bg-surface-container-lowest/5 border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm text-on-surface dark:text-inverse-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-outline-variant uppercase tracking-wider mb-1 block">Kategori</label>
                <input required list="list-kategori" placeholder="Pilih atau ketik kategori..." value={newKategori} onChange={e => setNewKategori(e.target.value)} disabled={isExisting} className="w-full bg-background dark:bg-surface-container-lowest/5 border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm text-on-surface dark:text-inverse-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-50 disabled:bg-surface-container-highest" />
                <datalist id="list-kategori">
                  {Object.keys(kategoriStats).map(kat => <option key={kat} value={kat} />)}
                </datalist>
              </div>
              <button type="submit" disabled={!newNama} className="w-full mt-2 bg-gradient-to-r from-primary to-surface-tint text-on-primary py-3 rounded-xl font-bold text-sm hover:shadow-lg disabled:opacity-50 transition-all flex justify-center items-center gap-2">
                Simpan ke Katalog
              </button>
            </form>
          </div>
        </div>
      )}

      {(modal?.type === "tambah_alat_sukses" || modal?.type === "lihat_qr") && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-surface dark:bg-inverse-surface rounded-[24px] p-6 w-full max-w-sm ambient-shadow-lvl2 border border-outline-variant/20 relative animate-fadeIn text-center">
            <button onClick={closeModal} className="absolute top-4 right-4 text-outline hover:text-error"><X size={20} /></button>

            {modal.type === "tambah_alat_sukses" ? (
              <>
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} />
                </div>
                <h3 className="font-headline-md text-lg text-on-surface dark:text-inverse-on-surface mb-2">Alat Berhasil Ditambahkan</h3>
                <p className="text-sm text-on-surface-variant dark:text-outline-variant mb-6">Berikut adalah Barcode untuk alat <strong>{modal.nama}</strong>. Silakan cetak untuk ditempelkan pada fisik alat.</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-[32px]">barcode</span>
                </div>
                <h3 className="font-headline-md text-lg text-on-surface dark:text-inverse-on-surface mb-2">Barcode Alat</h3>
                <p className="text-sm text-on-surface-variant dark:text-outline-variant mb-6">Alat: <strong>{modal.nama}</strong></p>
              </>
            )}

            <div className="bg-white p-4 rounded-xl border border-outline-variant/20 mb-6 inline-block mx-auto shadow-sm text-center">
              <Barcode value={modal.kode} width={1.5} height={60} displayValue={true} />
            </div>

            <div className="flex gap-3">
              <button onClick={() => window.print()} className="flex-1 bg-surface-container-high dark:bg-surface-container-highest text-on-surface py-3 rounded-xl font-bold text-sm hover:shadow-md transition-all flex justify-center items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">print</span> Cetak
              </button>

              <button onClick={closeModal} className="flex-1 bg-gradient-to-r from-primary to-surface-tint text-on-primary py-3 rounded-xl font-bold text-sm hover:shadow-lg transition-all flex justify-center items-center gap-2">
                Selesai
              </button>
            </div>
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

      {/* ─── SELESAI TAB ─── */}
      {tab === "selesai" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter animate-fadeIn">
          {selesai.length === 0 ? (
            <div className="col-span-full py-16 text-center">
              <h3 className="font-headline-md text-lg text-on-surface dark:text-inverse-on-surface mb-2">Belum ada riwayat</h3>
            </div>
          ) : selesai.map((t: any) => (
            <div key={t.nomor} className="bg-surface dark:bg-surface-container-lowest/5 rounded-[20px] p-5 border border-outline-variant/10 ambient-shadow-lvl1 flex flex-col gap-4">
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-bold text-on-surface dark:text-inverse-on-surface text-sm">{t.nama_alat_produksi}</h3>
                <PhaseChip trx={t} />
              </div>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-3 border-t border-outline-variant/10">
                <div>
                  <p className="text-[10px] text-outline font-semibold uppercase tracking-wider mb-1">Peminjam</p>
                  <p className="text-xs text-on-surface dark:text-inverse-on-surface font-bold">{t.peminjam}</p>
                </div>
                <div>
                  <p className="text-[10px] text-outline font-semibold uppercase tracking-wider mb-1">Petugas</p>
                  <p className={`text-xs font-bold text-outline`}>{t.petugas_kontrol_alat || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-outline font-semibold uppercase tracking-wider mb-1">Waktu Keluar</p>
                  <p className="text-xs text-on-surface dark:text-inverse-on-surface">{fmtDate(t.waktu_keluar)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-outline font-semibold uppercase tracking-wider mb-1">Waktu Kembali</p>
                  <p className="text-xs text-emerald-600 font-bold">{fmtDate(t.waktu_kembali)}</p>
                </div>
              </div>
            </div>
          ))}
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
                    <button onClick={() => setModal({ type: "lihat_qr", kode: i.kode, nama: i.nama })} className="text-[10px] bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant px-2 py-1 rounded-md font-bold transition-colors flex items-center gap-1 active:scale-95">
                      <span className="material-symbols-outlined text-[12px]">barcode</span> Barcode
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

    </DashboardLayout>
  );
}
