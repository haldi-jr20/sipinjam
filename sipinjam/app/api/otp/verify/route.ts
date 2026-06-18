import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email, otp, hash } = await req.json();

    if (!email || !otp || !hash) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const secret = process.env.OTP_SECRET_KEY || "fallback_secret";
    const dataToHash = `${email}:${otp}`;
    
    // Hash ulang OTP yang dimasukkan user
    const calculatedHash = crypto.createHmac("sha256", secret).update(dataToHash).digest("hex");

    // Jika hash cocok, berarti OTP benar (karena tidak ada orang yang tahu HMAC secret key)
    if (calculatedHash === hash) {
      return NextResponse.json({ success: true, message: "OTP Valid" });
    } else {
      return NextResponse.json({ error: "Kode OTP salah atau tidak valid" }, { status: 401 });
    }
  } catch (error: any) {
    console.error("Gagal memverifikasi OTP:", error);
    return NextResponse.json({ error: "Terjadi kesalahan sistem saat memverifikasi OTP" }, { status: 500 });
  }
}
