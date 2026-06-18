import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });
    }

    // Buat 6 digit kode acak
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Buat hash HMAC untuk verifikasi stateless
    // Hash ini mengkombinasikan email dan OTP sehingga tidak bisa dipalsukan
    const secret = process.env.OTP_SECRET_KEY || "fallback_secret";
    const dataToHash = `${email}:${otp}`;
    const hash = crypto.createHmac("sha256", secret).update(dataToHash).digest("hex");

    // Setup Nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Kirim Email
    await transporter.sendMail({
      from: `"SiPinjam BKI" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Kode Verifikasi OTP Anda - SiPinjam",
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #4f46e5; margin-top: 0;">Kode Verifikasi SiPinjam</h2>
          <p style="color: #475569; font-size: 14px;">Halo,</p>
          <p style="color: #475569; font-size: 14px;">Anda sedang melakukan pendaftaran di sistem SiPinjam PT. BKI. Berikut adalah kode OTP Anda:</p>
          <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0f172a;">${otp}</span>
          </div>
          <p style="color: #475569; font-size: 14px;">Kode ini hanya berlaku untuk Anda. Jangan berikan kode ini kepada siapa pun.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">Jika Anda tidak merasa melakukan pendaftaran ini, silakan abaikan email ini.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, hash });
  } catch (error: any) {
    console.error("Gagal mengirim email OTP:", error);
    return NextResponse.json({ error: "Gagal mengirim email. Pastikan konfigurasi SMTP di .env.local benar." }, { status: 500 });
  }
}
