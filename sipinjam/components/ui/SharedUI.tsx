"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Hourglass, Ban, ShieldCheck, PackageCheck, CheckCircle, X, Scan, Camera, XCircle } from "lucide-react";

export function getPhase(t: any) {
  if (t.persetujuan_koordinator==="pending")                             return { label:"Menunggu Persetujuan", color:"#D97706", bg:"#FEF3C7", Icon:Hourglass };
  if (t.persetujuan_koordinator==="rejected")                            return { label:"Ditolak",              color:"#DC2626", bg:"#FEE2E2", Icon:Ban };
  if (t.persetujuan_koordinator==="approved" && !t.waktu_keluar)         return { label:"Disetujui",            color:"#2563EB", bg:"#DBEAFE", Icon:ShieldCheck };
  if (t.waktu_keluar && !t.waktu_kembali)               return { label:"Sedang Dipinjam",      color:"#7C3AED", bg:"#EDE9FE", Icon:PackageCheck };
  return                                                       { label:"Transaksi Ditutup",    color:"#059669", bg:"#D1FAE5", Icon:CheckCircle };
}

export function getStep(t: any) {
  if (t.persetujuan_koordinator==="pending")                             return 1;
  if (t.persetujuan_koordinator==="rejected")                            return -1;
  if (t.persetujuan_koordinator==="approved" && !t.waktu_keluar)         return 2;
  if (t.waktu_keluar && !t.waktu_kembali)               return 3;
  return 4;
}

export const S = {
  page:  { height:"100vh", display:"flex", flexDirection:"column" as any, overflow:"hidden", background:"#F1F5F9", fontFamily:"system-ui,sans-serif" },
  scroll:{ flex:1, overflowY:"auto" as any, WebkitOverflowScrolling:"touch" as any },
  pad:   { padding:"12px 14px 32px" },
  card:  { background:"white", borderRadius:16, border:"1px solid #E2E8F0", padding:"14px 16px", marginBottom:10 },
  label: { fontSize:10, fontWeight:600, color:"#94A3B8", textTransform:"uppercase" as any, letterSpacing:"0.08em", margin:"0 0 8px", display:"block" },
  input: { width:"100%", boxSizing:"border-box" as any, border:"1px solid #E2E8F0", borderRadius:12, padding:"10px 14px", fontSize:13, outline:"none", background:"#F8FAFC", fontFamily:"inherit", color:"#0F172A" },
};

export const fmtRel = (iso: string) => {
  if (!iso) return "—";
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} mnt lalu`;
  if (m < 1440) return `${Math.floor(m/60)} jam lalu`;
  return new Date(iso).toLocaleString("id-ID",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
};

export const fmtDate = (iso: string) => !iso ? "—" : new Date(iso).toLocaleString("id-ID",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});

export function Avt({ name, size=32, bg="#4F46E5" }: { name: string, size?: number, bg?: string }) {
  const init = (name||"?").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
  return <div style={{width:size,height:size,borderRadius:"50%",background:bg,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:size*.35,flexShrink:0}}>{init}</div>;
}

export function PhaseChip({ trx }: { trx: any }) {
  const p = getPhase(trx);
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 9px",borderRadius:20,fontSize:11,fontWeight:600,color:p.color,background:p.bg,flexShrink:0,whiteSpace:"nowrap"}}><p.Icon size={11}/>{p.label}</span>;
}

export function Empty({ Icon, title, sub }: { Icon: any, title: string, sub: string }) {
  return <div style={{textAlign:"center",padding:"52px 20px"}}><div style={{width:52,height:52,borderRadius:"50%",background:"#F1F5F9",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}><Icon size={22} color="#CBD5E1"/></div><p style={{fontSize:14,fontWeight:600,color:"#475569",margin:"0 0 4px"}}>{title}</p><p style={{fontSize:12,color:"#94A3B8",margin:0}}>{sub}</p></div>;
}

export function Tabs({ tabs, active, onChange, acc="#4F46E5" }: { tabs: any[], active: string, onChange: any, acc?: string }) {
  return (
    <div style={{background:"white",borderBottom:"1px solid #F1F5F9",display:"flex",flexShrink:0}}>
      {tabs.map(([id,label,badge])=>(
        <button key={id} onClick={()=>onChange(id)}
          style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:5,padding:"11px 4px",border:"none",borderBottom:`2.5px solid ${active===id?acc:"transparent"}`,background:"none",cursor:"pointer",fontSize:12,fontWeight:active===id?600:400,color:active===id?acc:"#94A3B8",transition:"all .15s"}}>
          {label}{badge>0&&<span style={{background:active===id?acc:"#E2E8F0",color:active===id?"white":"#64748B",borderRadius:10,fontSize:10,fontWeight:700,padding:"1px 6px"}}>{badge}</span>}
        </button>
      ))}
    </div>
  );
}

const FLOW = ["Input","Approval","Keluar","Kembali","Selesai"];
export function FlowTracker({ trx }: { trx: any }) {
  const step = getStep(trx);
  const cancelled = step===-1;
  const active = cancelled ? 1 : step;
  return (
    <div style={{background:"#F8FAFC",borderRadius:12,border:"1px solid #E2E8F0",padding:"12px 14px",marginBottom:10}}>
      <span style={S.label}>Posisi dalam alur proses</span>
      <div style={{display:"flex",alignItems:"center"}}>
        {FLOW.map((l,i)=>{
          const n=i+1, done=!cancelled&&n<active, cur=!cancelled&&n===active, isX=cancelled&&n===1;
          return (
            <div key={l} style={{display:"flex",alignItems:"center",flex:i<FLOW.length-1?1:"none"}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <div style={{width:22,height:22,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:isX?"#DC2626":done||cur?"#4F46E5":"#E2E8F0",border:cur&&!isX?"2px solid #818CF8":"2px solid transparent"}}>
                  {isX?<X size={11} color="white"/>:done?<CheckCircle size={11} color="white"/>:<span style={{fontSize:10,fontWeight:700,color:cur?"white":"#94A3B8"}}>{n}</span>}
                </div>
                <span style={{fontSize:9,fontWeight:cur||done?600:400,color:cur?"#4F46E5":done?"#64748B":"#CBD5E1",whiteSpace:"nowrap"}}>{l}</span>
              </div>
              {i<FLOW.length-1&&<div style={{flex:1,height:2,background:done?"#4F46E5":"#E2E8F0",margin:"0 2px 14px"}}/>}
            </div>
          );
        })}
      </div>
      {cancelled&&<div style={{marginTop:8,background:"#FEE2E2",borderRadius:8,padding:"6px 10px",display:"flex",gap:6,alignItems:"flex-start"}}><Ban size={13} color="#DC2626" style={{flexShrink:0,marginTop:1}}/><p style={{fontSize:11,color:"#991B1B",margin:0}}><b>Ditolak</b></p></div>}
    </div>
  );
}

/* ── ScanBtn (simulasi, digunakan petugas dll.) ── */
export function ScanBtn({ onDone, label="Scan Barcode", sub="Klik untuk buka kamera" }: { onDone: any, label?: string, sub?: string }) {
  const [sc, setSc] = useState(false);
  function go(){ setSc(true); setTimeout(()=>{ setSc(false); onDone(); },1400); }
  return (
    <button onClick={go} disabled={sc} style={{width:"100%",border:"2px dashed #C7D2FE",borderRadius:14,padding:"22px 16px",background:sc?"#F5F3FF":"white",display:"flex",flexDirection:"column",alignItems:"center",gap:8,cursor:"pointer",boxSizing:"border-box"}}>
      {sc?<><div style={{width:36,height:36,border:"3px solid #EEF2FF",borderTop:"3px solid #4F46E5",borderRadius:"50%",animation:"spin .8s linear infinite"}}/><p style={{fontSize:13,color:"#6366F1",fontWeight:500,margin:0}}>Membaca barcode...</p></> :
         <><div style={{width:44,height:44,background:"#EEF2FF",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center"}}><Scan size={22} color="#4F46E5"/></div><p style={{fontSize:13,fontWeight:600,color:"#4F46E5",margin:0}}>{label}</p><p style={{fontSize:11,color:"#94A3B8",margin:0}}>{sub}</p></>}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </button>
  );
}

/* ── BarcodeScannerBtn (sungguhan, menggunakan kamera) ── */
export function BarcodeScannerBtn({ onResult, label="Scan Barcode Alat", sub="Arahkan kamera ke barcode / QR code alat" }: { onResult: (code: string) => void, label?: string, sub?: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const scannerRef = useRef<any>(null);
  const readerRef = useRef<HTMLDivElement>(null);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        // State 2 = SCANNING, State 3 = PAUSED
        if (state === 2 || state === 3) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        // ignore cleanup errors
      }
      scannerRef.current = null;
    }
  }, []);

  const closeModal = useCallback(() => {
    stopScanner();
    setOpen(false);
    setError("");
  }, [stopScanner]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const startScanner = async () => {
      // Dynamic import to avoid SSR issues
      const { Html5Qrcode } = await import("html5-qrcode");

      if (cancelled || !readerRef.current) return;

      const scannerId = "barcode-reader-" + Date.now();
      readerRef.current.id = scannerId;

      const scanner = new Html5Qrcode(scannerId);
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.0,
          },
          (decodedText: string) => {
            // Berhasil scan
            onResult(decodedText);
            closeModal();
          },
          () => {
            // Scan error per-frame (normal, abaikan)
          }
        );
      } catch (err: any) {
        if (!cancelled) {
          setError("Tidak dapat mengakses kamera. Pastikan izin kamera diaktifkan.");
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(startScanner, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      stopScanner();
    };
  }, [open, onResult, closeModal, stopScanner]);

  return (
    <>
      <button onClick={() => { setOpen(true); setError(""); }} style={{width:"100%",border:"2px dashed #C7D2FE",borderRadius:14,padding:"18px 16px",background:"white",display:"flex",flexDirection:"column",alignItems:"center",gap:8,cursor:"pointer",boxSizing:"border-box",transition:"background .2s"}}>
        <div style={{width:44,height:44,background:"#EEF2FF",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center"}}><Camera size={22} color="#4F46E5"/></div>
        <p style={{fontSize:13,fontWeight:600,color:"#4F46E5",margin:0}}>{label}</p>
        <p style={{fontSize:11,color:"#94A3B8",margin:0}}>{sub}</p>
      </button>

      {open && (
        <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,.85)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:16}}>
          {/* Header */}
          <div style={{width:"100%",maxWidth:400,display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <p style={{color:"white",fontSize:15,fontWeight:700,margin:0,display:"flex",alignItems:"center",gap:8}}><Scan size={18}/> Scanner Barcode</p>
            <button onClick={closeModal} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><XCircle size={20} color="white"/></button>
          </div>

          {/* Camera area */}
          <div style={{width:"100%",maxWidth:400,borderRadius:16,overflow:"hidden",background:"#000",position:"relative"}}>
            <div ref={readerRef} style={{width:"100%"}}/>
            {/* Scan line animation */}
            <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{width:260,height:160,border:"2px solid rgba(99,102,241,.5)",borderRadius:12,position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,#4F46E5,transparent)",animation:"scanLine 2s ease-in-out infinite"}}/>
              </div>
            </div>
          </div>

          {error && (
            <div style={{width:"100%",maxWidth:400,marginTop:12,background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:12,padding:"12px 14px"}}>
              <p style={{fontSize:12,color:"#DC2626",margin:0,textAlign:"center"}}>{error}</p>
            </div>
          )}

          <p style={{color:"rgba(255,255,255,.6)",fontSize:12,marginTop:14,textAlign:"center"}}>Arahkan kamera ke barcode atau QR code alat</p>

          {/* Manual input fallback */}
          <div style={{width:"100%",maxWidth:400,marginTop:16}}>
            <ManualCodeInput onSubmit={(code: string) => { onResult(code); closeModal(); }}/>
          </div>

          <style>{`
            @keyframes scanLine {
              0%, 100% { top: 10%; }
              50% { top: 85%; }
            }
            #${readerRef.current?.id || 'x'} video { border-radius: 16px; }
          `}</style>
        </div>
      )}
    </>
  );
}

/* ── Komponen input manual kode alat (fallback jika kamera tidak tersedia) ── */
function ManualCodeInput({ onSubmit }: { onSubmit: (code: string) => void }) {
  const [code, setCode] = useState("");
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <button onClick={() => setExpanded(!expanded)} style={{width:"100%",background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.15)",borderRadius:12,padding:"10px 14px",color:"rgba(255,255,255,.7)",fontSize:12,cursor:"pointer",textAlign:"center"}}>
        {expanded ? "Sembunyikan" : "Kamera bermasalah? Input kode alat manual"}
      </button>
      {expanded && (
        <div style={{display:"flex",gap:8,marginTop:8}}>
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="Contoh: ALT-001"
            style={{flex:1,border:"1px solid rgba(255,255,255,.2)",borderRadius:10,padding:"10px 14px",fontSize:14,background:"rgba(255,255,255,.1)",color:"white",outline:"none",fontFamily:"monospace",letterSpacing:1}}
          />
          <button
            onClick={() => { if (code.trim()) onSubmit(code.trim()); }}
            disabled={!code.trim()}
            style={{background:code.trim()?"#4F46E5":"rgba(255,255,255,.1)",color:"white",border:"none",borderRadius:10,padding:"10px 18px",fontSize:13,fontWeight:600,cursor:code.trim()?"pointer":"not-allowed",opacity:code.trim()?1:0.5}}
          >OK</button>
        </div>
      )}
    </div>
  );
}

