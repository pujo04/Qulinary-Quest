import { format } from "date-fns";
import { id } from "date-fns/locale";

export const formatRupiah = (n: number): string =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export const formatDateTime = (iso: string): string =>
  format(new Date(iso), "dd MMM yyyy, HH:mm", { locale: id });

export const formatDateOnly = (date: Date | string): string =>
  format(new Date(date), "EEEE, dd MMMM yyyy", { locale: id });

export const formatTimeOnly = (date: Date | string): string =>
  format(new Date(date), "HH:mm", { locale: id });

export const formatReceiptCode = (id: number, dateStr?: string): string => {
  const d = dateStr ? new Date(dateStr) : new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `RSV-${y}${m}${day}-${String(id).padStart(3, "0")}`;
};
