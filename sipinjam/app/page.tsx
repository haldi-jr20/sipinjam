import { redirect } from "next/navigation";

// Nanti: cek session Supabase di sini, redirect ke dashboard jika sudah login
// const supabase = createServerSupabaseClient();
// const { data: { session } } = await supabase.auth.getSession();
// if (session) redirect("/dashboard");

export default function RootPage() {
  redirect("/login");
}
