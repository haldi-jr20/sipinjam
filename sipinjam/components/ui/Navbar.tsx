"use client";

import { useState } from "react";
import { Package, LogOut, Settings, X, Lock, AlertTriangle, UserPlus, Mail, User, Briefcase, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransaction } from "@/lib/TransactionContext";
import { Avt } from "./SharedUI";

const PASS = "sipinjam123";

const ROLE_NAV: Record<string, any> = {
  peminjam:  { label:"Peminjam",        bg:"linear-gradient(135deg,#1E1B4B,#312E81)", acc:"#818CF8" },
  koordinator:{ label:"Koordinator",      bg:"linear-gradient(135deg,#2E1065,#4C1D95)", acc:"#A78BFA" },
  petugas:   { label:"Petugas Kontrol", bg:"linear-gradient(135deg,#022C22,#064E3B)", acc:"#34D399" },
};

export default function Navbar() {
  const router = useRouter();
  const { user, logout, deleteAccount, accounts, registerUser } = useTransaction();
  const [showSettings, setShowSettings] = useState(false);
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  // Register state for Koordinator/Petugas
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regName, setRegName] = useState("");
  const [regInstansi, setRegInstansi] = useState("");
  const [regDivisi, setRegDivisi] = useState("");
  const [regErr, setRegErr] = useState("");
  const [regMsg, setRegMsg] = useState("");

  if (!user) return null;

  const cfg = ROLE_NAV[user.role] || ROLE_NAV.peminjam;

  function handleLogout() {
    logout();
    router.push("/login");
  }

  function handleDelete() {
    if (pass !== PASS) {
      setErr("Password salah.");
      return;
    }
    deleteAccount(user.email);
    router.push("/login");
  }

  function doRegister() {
    setRegErr(""); setRegMsg("");
    if (!regEmail.trim() || !regPass.trim() || !regName.trim()) { setRegErr("Harap lengkapi semua data."); return; }
    if (accounts[regEmail.toLowerCase().trim()]) { setRegErr("Email sudah terdaftar."); return; }
    
    // Auto-assign role based on current user's role
    const newRole = user.role; 
    registerUser(regEmail, regName, newRole, regInstansi || "PT. BKI Cabang Sorong", regDivisi || (newRole === "koordinator" ? "Produksi" : "Gudang"));
    
    setRegMsg(`Akun ${newRole} baru berhasil ditambahkan!`);
    setRegEmail(""); setRegPass(""); setRegName(""); setRegInstansi(""); setRegDivisi("");
    setTimeout(() => setRegMsg(""), 3000);
  }

  const inp = { width: "100%", boxSizing: "border-box" as any, border: "1px solid #E2E8F0", borderRadius:10, padding: "8px 12px 8px 34px", fontSize: 13, outline: "none", background: "#F8FAFC", color: "#0F172A" };

  return (
    <div style={{background:cfg.bg,padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,position:"relative"}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{background:"white",borderRadius:8,padding:3,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
          <img 
            src="/bki-logo.svg" 
            alt="Logo BKI Cabang Sorong" 
            style={{height:22,width:"auto",objectFit:"contain"}}
          />
        </div>
        <span style={{color:"white",fontWeight:700,fontSize:14}}>SiPinjam</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:10,color:cfg.acc,fontWeight:600,textTransform:"uppercase",letterSpacing:".07em"}}>{cfg.label}</div>
          <div style={{fontSize:13,color:"white",fontWeight:500}}>{user.name}</div>
        </div>
        <Avt name={user.name} size={30} bg="rgba(255,255,255,.15)"/>
        
        <button onClick={()=>setShowSettings(true)} style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:8,padding:6,cursor:"pointer",display:"flex"}}><Settings size={14} color="rgba(255,255,255,.8)"/></button>
        <button onClick={handleLogout} style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:8,padding:6,cursor:"pointer",display:"flex"}}><LogOut size={14} color="rgba(255,255,255,.8)"/></button>
      </div>

      {showSettings&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,padding:20}}>
        <div style={{background:"white",borderRadius:20,padding:24,width:"100%",maxWidth:340,boxSizing:"border-box",maxHeight:"90vh",overflowY:"auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <p style={{fontSize:15,fontWeight:700,color:"#0F172A",margin:0}}>Pengaturan Akun</p>
            <button onClick={()=>{setShowSettings(false);setPass("");setErr("");setRegErr("");setRegMsg("");}} style={{background:"none",border:"none",cursor:"pointer"}}><X size={20} color="#94A3B8"/></button>
          </div>
          
          {(user.role === "koordinator" || user.role === "petugas") && (
            <div style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:12,padding:"14px",marginBottom:16}}>
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:12}}>
                <UserPlus size={16} color={cfg.acc}/>
                <p style={{fontSize:13,fontWeight:700,color:"#1E293B",margin:0}}>Tambah Rekan {cfg.label}</p>
              </div>
              
              {regMsg&&<div style={{background:"#ECFDF5",border:"1px solid #A7F3D0",color:"#065F46",fontSize:11,padding:"8px",borderRadius:8,marginBottom:10,display:"flex",gap:6,alignItems:"center"}}><CheckCircle size={12}/>{regMsg}</div>}
              {regErr&&<div style={{background:"#FEF2F2",border:"1px solid #FECACA",color:"#991B1B",fontSize:11,padding:"8px",borderRadius:8,marginBottom:10,display:"flex",gap:6,alignItems:"center"}}><XCircle size={12}/>{regErr}</div>}
              
              <div style={{position:"relative",marginBottom:8}}>
                <User size={13} color="#9CA3AF" style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}/>
                <input value={regName} onChange={e=>setRegName(e.target.value)} placeholder="Nama Lengkap" style={inp}/>
              </div>
              <div style={{position:"relative",marginBottom:8}}>
                <Mail size={13} color="#9CA3AF" style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}/>
                <input value={regEmail} onChange={e=>setRegEmail(e.target.value)} placeholder="Alamat Email" type="email" style={inp}/>
              </div>
              <div style={{position:"relative",marginBottom:8}}>
                <Briefcase size={13} color="#9CA3AF" style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}/>
                <input value={regInstansi} onChange={e=>setRegInstansi(e.target.value)} placeholder="Instansi / Cabang (opsional)" style={inp}/>
              </div>
              <div style={{position:"relative",marginBottom:8}}>
                <Briefcase size={13} color="#9CA3AF" style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}/>
                <input value={regDivisi} onChange={e=>setRegDivisi(e.target.value)} placeholder="Divisi (opsional)" style={inp}/>
              </div>
              <div style={{position:"relative",marginBottom:12}}>
                <Lock size={13} color="#9CA3AF" style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}/>
                <input value={regPass} onChange={e=>setRegPass(e.target.value)} placeholder="Password Baru" type="password" style={inp}/>
              </div>
              
              <button onClick={doRegister} disabled={!regEmail||!regPass||!regName} style={{width:"100%",background:cfg.bg,color:"white",border:"none",borderRadius:10,padding:"10px",fontSize:12,fontWeight:600,cursor:"pointer",opacity:(!regEmail||!regPass||!regName)?0.5:1}}>Buat Akun {cfg.label}</button>
            </div>
          )}

          <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:12,padding:"14px"}}>
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
              <AlertTriangle size={16} color="#DC2626"/>
              <p style={{fontSize:13,fontWeight:700,color:"#991B1B",margin:0}}>Hapus Akun Permanen</p>
            </div>
            <p style={{fontSize:11,color:"#B91C1C",margin:"0 0 12px",lineHeight:1.4}}>
              Tindakan ini tidak bisa dibatalkan. Konfirmasi dengan password Anda.
            </p>
            <div style={{position:"relative",marginBottom:err?8:12}}>
              <Lock size={14} color="#9CA3AF" style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}/>
              <input value={pass} onChange={e=>{setPass(e.target.value);setErr("");}} placeholder="Masukkan password..." type="password" style={{width:"100%",boxSizing:"border-box",border:"1px solid #FECACA",borderRadius:8,padding:"8px 12px 8px 34px",fontSize:13,outline:"none",background:"white",color:"#0F172A"}}/>
            </div>
            {err&&<p style={{color:"#DC2626",fontSize:11,margin:"0 0 10px"}}>{err}</p>}
            <button onClick={handleDelete} disabled={!pass} style={{width:"100%",background:"#DC2626",color:"white",border:"none",borderRadius:8,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer",opacity:pass?1:0.5}}>Hapus Akun Saya</button>
          </div>
        </div>
      </div>}
    </div>
  );
}
