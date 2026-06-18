import type { Transaksi } from "@/lib/types";
import { getStatusDisplay } from "@/lib/types";

const BADGE_CLASSES: Record<ReturnType<typeof getStatusDisplay>, string> = {
  "Menunggu Persetujuan": "bg-amber-100 text-amber-700",
  "Disetujui":            "bg-sky-100 text-sky-700",
  "Ditolak":              "bg-red-100 text-red-700",
  "Sedang Dipinjam":      "bg-indigo-100 text-indigo-700",
  "Dikembalikan":         "bg-emerald-100 text-emerald-700",
};

const DOT_CLASSES: Record<ReturnType<typeof getStatusDisplay>, string> = {
  "Menunggu Persetujuan": "bg-amber-500",
  "Disetujui":            "bg-sky-500",
  "Ditolak":              "bg-red-500",
  "Sedang Dipinjam":      "bg-indigo-500",
  "Dikembalikan":         "bg-emerald-500",
};

interface Props {
  trx: Transaksi;
}

export default function StatusBadge({ trx }: Props) {
  const label = getStatusDisplay(trx);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${BADGE_CLASSES[label]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${DOT_CLASSES[label]}`} aria-hidden />
      {label}
    </span>
  );
}
