"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDateTime, formatRupiah, formatReceiptCode, formatDateOnly, formatTimeOnly } from "@/lib/format";
import { ReservationStatus, allowedTransitions } from "@/models/Reservation";

type KasirTab = "reservasi" | "pesanan" | "laporan";

interface TableRow {
  id: number;
  number: number;
  capacity: number;
}

interface MenuRow {
  id: number;
  name: string;
  category: "FOOD" | "DRINK";
  price: number;
}

interface ResRow {
  id: number;
  customerName: string;
  phone: string;
  tableNumber: number;
  reservedAt: string;
  durationMin: number;
  guests: number;
  status: ReservationStatus;
  notes?: string;
}

interface OrderRow {
  id: number;
  createdAt: string;
  total: number;
  tableNumber: number;
  customerName: string;
}

interface ReportData {
  byStatus: { status: ReservationStatus; n: number }[];
  orders: number;
  revenue: number;
  topMenu: { name: string; qty: number }[];
}

interface Notice {
  ok: boolean;
  text: string;
}

const STATUS_LABEL: Record<ReservationStatus, string> = {
  BOOKED: "Dipesan",
  SEATED: "Sedang makan",
  DONE: "Selesai",
  CANCELLED: "Dibatalkan",
};

const STATUS_COLOR: Record<ReservationStatus, string> = {
  BOOKED: "text-secondary font-medium",
  SEATED: "text-primary font-semibold",
  DONE: "text-on-surface-variant",
  CANCELLED: "text-error font-medium",
};

const getTableArea = (tableNumber: number): "Indoor" | "VIP" | "Terrace" => {
  if (tableNumber <= 2) return "Terrace";
  if (tableNumber <= 6) return "Indoor";
  return "VIP";
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Terjadi kesalahan pada sistem");
  return body as T;
}

export default function Home() {
  const [tab, setTab] = useState<KasirTab>("reservasi");
  const [modal, setModal] = useState<"info-meja" | "kontak" | null>(null);

  // Shared Data
  const [tables, setTables] = useState<TableRow[]>([]);
  const [menu, setMenu] = useState<MenuRow[]>([]);
  const [reservations, setReservations] = useState<ResRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [popupRes, setPopupRes] = useState<ResRow | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const loadTables = useCallback(() => api<TableRow[]>("/api/tables").then(setTables).catch(() => {}), []);
  const loadMenu = useCallback(() => api<MenuRow[]>("/api/menu").then(setMenu).catch(() => {}), []);
  const loadReservations = useCallback(
    () =>
      api<ResRow[]>("/api/reservations")
        .then((data) => {
          setReservations(data);
        })
        .catch(() => {}),
    []
  );
  const loadOrders = useCallback(() => api<OrderRow[]>("/api/orders").then(setOrders).catch(() => {}), []);

  useEffect(() => {
    loadTables();
    loadMenu();
    loadReservations();
    loadOrders();
  }, [loadTables, loadMenu, loadReservations, loadOrders]);

  function handleClosePopup() {
    setPopupRes(null);
    setTimeout(() => {
      document.getElementById("riwayat-reservasi")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  return (
    <div className="bg-surface font-body-md text-on-surface min-h-screen flex flex-col antialiased">
      {/* HEADER FIXED */}
      <header className="fixed top-0 w-full z-50 bg-surface">
        {/* Top Workstation Bar */}
        <div className="h-8 w-full border-b border-outline-variant/60 flex items-center justify-between px-margin-mobile lg:px-margin bg-surface-container-low/40">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-primary text-surface font-label-caption text-[11px] font-medium tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary block"></span>
              Operator: Kasir
            </span>
            <span className="hidden sm:inline font-body-sm text-body-sm text-on-surface-variant">
              Terminal Kasir &amp; Reservasi Terpadu
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-body-sm text-on-surface-variant/80">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 block animate-pulse"></span>
              Sistem Aktif (Online)
            </span>
            <span className="hidden md:inline">·</span>
            <span className="hidden md:inline">Jam Operasional: 17.00 – 23.00 WIB</span>
          </div>
        </div>

        {/* Main Navbar Bar */}
        <div className="h-14 w-full border-b border-outline-variant/60 flex items-center justify-between px-margin-mobile lg:px-margin">
          <button
            type="button"
            onClick={() => setTab("reservasi")}
            className="font-headline-md text-headline-md text-primary tracking-tight font-normal text-left cursor-pointer"
          >
            QulinaryQuest
          </button>
          <div className="flex items-center gap-6 md:gap-8">
            <nav className="flex items-center gap-4 sm:gap-6 lg:gap-8" aria-label="Navigasi Kasir">
              <button
                type="button"
                onClick={() => setTab("reservasi")}
                className={`transition-colors cursor-pointer text-sm sm:text-base ${
                  tab === "reservasi"
                    ? "text-primary border-b-2 border-primary pb-1 font-medium"
                    : "font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Reservasi Meja
              </button>
              <button
                type="button"
                onClick={() => setTab("pesanan")}
                className={`transition-colors cursor-pointer text-sm sm:text-base ${
                  tab === "pesanan"
                    ? "text-primary border-b-2 border-primary pb-1 font-medium"
                    : "font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Pesanan &amp; Tagihan
              </button>
              <button
                type="button"
                onClick={() => setTab("laporan")}
                className={`transition-colors cursor-pointer text-sm sm:text-base ${
                  tab === "laporan"
                    ? "text-primary border-b-2 border-primary pb-1 font-medium"
                    : "font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Laporan Penjualan
              </button>
              <button
                type="button"
                onClick={() => setModal("info-meja")}
                className="hidden md:block font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              >
                Denah Meja
              </button>
              <button
                type="button"
                onClick={() => setModal("kontak")}
                className="hidden md:block font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              >
                Kontak
              </button>
            </nav>
            <div
              className="flex items-center gap-2 pl-3 border-l border-outline-variant/60"
              title="Kasir Restoran (Hak Akses Penuh)"
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary">
                <span className="material-symbols-outlined text-[18px]">point_of_sale</span>
              </div>
              <div className="hidden lg:flex flex-col text-left leading-tight">
                <span className="font-medium text-xs text-primary">Kasir Restoran</span>
                <span className="text-[10px] text-on-surface-variant">Hak Akses Penuh</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="w-full pt-[88px] bg-surface flex-grow min-h-[calc(100vh-49px)]">
        <div className="w-full max-w-[1440px] mx-auto px-margin-mobile lg:px-margin py-8 lg:py-12">
          {/* Global Alert Banner */}
          {notice && (
            <div
              role="status"
              className={`mb-8 border px-4 py-3 flex items-center justify-between transition-all ${
                notice.ok
                  ? "bg-surface-container-high border-secondary/40 text-on-surface"
                  : "bg-error-container/40 border-error text-error"
              }`}
            >
              <span className="font-body-sm">{notice.text}</span>
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="text-xs uppercase font-medium hover:underline ml-4 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-0 lg:divide-x lg:divide-outline-variant/60">
            {/* KOLOM KIRI: Informasi Terminal Kasir (~33%) */}
            <aside className="lg:col-span-4 lg:pr-12 flex flex-col justify-between">
              {tab === "reservasi" && (
                <div>
                  <span className="font-label-caption text-label-caption text-secondary tracking-widest uppercase mb-3 block">
                    Terminal Kasir • Layanan Reservasi
                  </span>
                  <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-normal">
                    Reservasi Meja
                  </h1>
                  <div className="w-16 h-[1.5px] bg-secondary my-6"></div>
                  <div className="space-y-6 text-on-surface-variant font-body-md text-body-md leading-relaxed">
                    <p>Kasir melayani pencatatan reservasi meja untuk tamu langsung (walk-in) maupun reservasi via telepon.</p>
                    <p>Buka setiap hari, sesi malam 17.00 – 23.00 WIB.</p>
                    <p>Lama sesi bersantap dialokasikan 2 jam per meja.</p>
                    <p>Meja ditahan maksimal 15 menit dari jam reservasi yang dipilih sebelum dialihkan.</p>
                    <p>Kasir dapat langsung menerbitkan dan mencetak <strong>Bukti Reservasi (Tiket Pop-Up)</strong> untuk tamu.</p>
                    <p>Saat tamu tiba di restoran, Kasir dapat mengonfirmasi kedatangan dengan menekan <strong>Tandai duduk (SEATED)</strong> pada tabel Riwayat Reservasi.</p>
                  </div>
                </div>
              )}

              {tab === "pesanan" && (
                <div>
                  <span className="font-label-caption text-label-caption text-secondary tracking-widest uppercase mb-3 block">
                    Terminal Kasir • Point of Sale
                  </span>
                  <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-normal">
                    Pesanan &amp; Bill
                  </h1>
                  <div className="w-16 h-[1.5px] bg-secondary my-6"></div>
                  <div className="space-y-6 text-on-surface-variant font-body-md text-body-md leading-relaxed">
                    <p>Pencatatan pesanan hidangan khusus untuk tamu meja yang telah berstatus <strong>Sedang makan (SEATED)</strong>.</p>
                    <p>Biaya pelayanan (Service Charge) sebesar 5% otomatis dikenakan khusus untuk makanan (OOP Polimorfisme).</p>
                    <p>Kategori minuman bebas biaya pelayanan (0%).</p>
                    <p>Kasir dapat menerapkan strategi diskon persentase dan mencetak struk tagihan resmi.</p>
                  </div>
                </div>
              )}

              {tab === "laporan" && (
                <div>
                  <span className="font-label-caption text-label-caption text-secondary tracking-widest uppercase mb-3 block">
                    Terminal Kasir • Audit Operasional
                  </span>
                  <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-normal">
                    Laporan Penjualan
                  </h1>
                  <div className="w-16 h-[1.5px] bg-secondary my-6"></div>
                  <div className="space-y-6 text-on-surface-variant font-body-md text-body-md leading-relaxed">
                    <p>Kasir dapat memantau ikhtisar performa pendapatan restoran, volume reservasi, dan menu favorit terlaris.</p>
                    <p>Agregasi data dihitung secara real-time dari database PostgreSQL cloud.</p>
                    <p>Gunakan filter rentang tanggal untuk melakukan audit kinerja harian atau mingguan.</p>
                  </div>
                </div>
              )}

              {/* Bantuan Meja Depan / Info Bawah */}
              <div className="mt-16 pt-8 border-t border-outline-variant/60">
                <div className="font-label-caption text-label-caption text-on-surface-variant uppercase tracking-wider mb-2">
                  Bantuan Operasional Kasir
                </div>
                <p className="font-body-sm text-body-sm text-on-surface mb-1">+62 (721) 489-2104</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">kasir@qulinaryquest.id</p>
              </div>
            </aside>

            {/* KOLOM KANAN: Formulir & Konten Interaktif Kasir (~67%) */}
            <section className="lg:col-span-8 lg:pl-12 space-y-16">
              {tab === "reservasi" && (
                <KasirReservasiView
                  tables={tables}
                  reservations={reservations}
                  onReservationCreated={(created, fullRes) => {
                    setNotice({ ok: true, text: `Reservasi #${created.id} berhasil dicatat oleh Kasir!` });
                    setPopupRes(fullRes); // Munculkan bukti reservasi dalam pop-up
                    loadReservations();
                  }}
                  onOpenReceiptPopup={(r) => setPopupRes(r)}
                  onStatusChanged={(id, newStatus) => {
                    loadReservations();
                    if (popupRes && popupRes.id === id) {
                      setPopupRes({ ...popupRes, status: newStatus });
                    }
                  }}
                  onError={(err) => setNotice({ ok: false, text: err })}
                />
              )}

              {tab === "pesanan" && (
                <KasirPesananView
                  tables={tables}
                  menu={menu}
                  reservations={reservations}
                  orders={orders}
                  onOrderCreated={(order) => {
                    setNotice({ ok: true, text: `Pesanan #${order.id} berhasil dicatat oleh Kasir! Total: ${formatRupiah(order.total)}` });
                    loadOrders();
                  }}
                  onError={(err) => setNotice({ ok: false, text: err })}
                />
              )}

              {tab === "laporan" && (
                <KasirLaporanView onError={(err) => setNotice({ ok: false, text: err })} />
              )}
            </section>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full bg-surface border-t border-outline-variant/60 py-4 mt-auto">
        <div className="w-full px-margin-mobile lg:px-margin text-center sm:text-left">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            QulinaryQuest, Jl. Contoh Raya 12, Bandar Lampung. Buka setiap hari 17.00 – 23.00
          </p>
        </div>
      </footer>

      {/* POP-UP MODAL BUKTI RESERVASI (MUNCUL SETELAH MEMESAN / KLIK LIHAT BUKTI) */}
      {popupRes && (
        <div
          className="fixed inset-0 z-50 bg-primary/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
          onClick={handleClosePopup}
        >
          <div
            className="bg-surface border border-outline-variant/80 max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-outline-variant/60 pb-4">
              <div>
                <span className="font-label-caption text-label-caption text-on-surface-variant uppercase tracking-wider block mb-1">
                  Bukti Reservasi
                </span>
                <h2 className="font-headline-lg-mobile text-headline-lg-mobile sm:font-headline-lg sm:text-headline-lg text-primary tracking-tight font-normal">
                  {formatReceiptCode(popupRes.id, popupRes.reservedAt)}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full block ${
                      popupRes.status === "CANCELLED"
                        ? "bg-error"
                        : popupRes.status === "SEATED"
                        ? "bg-primary"
                        : "bg-secondary"
                    }`}
                  ></span>
                  <span className={`font-body-sm text-body-sm ${STATUS_COLOR[popupRes.status]}`}>
                    {STATUS_LABEL[popupRes.status]}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClosePopup}
                  aria-label="Tutup"
                  className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors text-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Ledgers / Ruled Key-Value List */}
            <div className="divide-y divide-outline-variant/60 font-body-md text-body-md">
              <div className="py-3 flex justify-between items-baseline">
                <span className="text-on-surface-variant font-normal">Atas nama</span>
                <span className="text-primary font-medium text-right">{popupRes.customerName}</span>
              </div>
              <div className="py-3 flex justify-between items-baseline">
                <span className="text-on-surface-variant font-normal">Tamu</span>
                <span className="text-primary font-headline-sm text-headline-sm font-normal text-right">
                  {popupRes.guests} orang
                </span>
              </div>
              <div className="py-3 flex justify-between items-baseline">
                <span className="text-on-surface-variant font-normal">Tanggal</span>
                <span className="text-primary font-normal text-right">
                  {formatDateOnly(popupRes.reservedAt)}
                </span>
              </div>
              <div className="py-3 flex justify-between items-baseline">
                <span className="text-on-surface-variant font-normal">Jam</span>
                <span className="text-primary font-headline-sm text-headline-sm font-normal text-right">
                  {formatTimeOnly(popupRes.reservedAt)} WIB
                </span>
              </div>
              <div className="py-3 flex justify-between items-baseline">
                <span className="text-on-surface-variant font-normal">Meja</span>
                <span className="text-primary font-headline-sm text-headline-sm font-normal text-right">
                  T-0{popupRes.tableNumber}
                </span>
              </div>
              <div className="py-3 flex justify-between items-baseline">
                <span className="text-on-surface-variant font-normal">Area</span>
                <span className="text-primary font-normal text-right">
                  {getTableArea(popupRes.tableNumber)}
                </span>
              </div>
              <div className="py-3 flex justify-between items-start gap-8">
                <span className="text-on-surface-variant font-normal flex-shrink-0">Catatan</span>
                <span className="text-primary font-normal text-right">
                  {popupRes.notes || "Tidak ada catatan khusus"}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="border-t border-outline-variant/60 pt-4 flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => window.print()}
                className="font-body-sm text-body-sm text-primary underline underline-offset-4 decoration-secondary hover:text-secondary transition-colors focus:outline-none cursor-pointer"
              >
                Simpan sebagai PDF
              </button>

              <button
                type="button"
                onClick={handleClosePopup}
                className="bg-primary text-surface px-6 py-2.5 rounded-[2px] font-body-md hover:bg-primary-container transition-colors cursor-pointer"
              >
                Tutup &amp; Lihat Riwayat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INFORMASI MEJA */}
      {modal === "info-meja" && (
        <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-outline-variant/80 max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-baseline justify-between border-b border-outline-variant/60 pb-3">
              <span className="font-title-editorial text-title-editorial text-primary">Informasi &amp; Kapasitas Meja</span>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="text-on-surface-variant hover:text-primary font-body-sm cursor-pointer"
              >
                ✕ Tutup
              </button>
            </div>
            <div className="divide-y divide-outline-variant/60 max-h-[60vh] overflow-y-auto pr-1">
              {tables.map((t) => {
                const area = getTableArea(t.number);
                return (
                  <div key={t.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-primary">Meja T-0{t.number}</p>
                      <p className="font-body-sm text-on-surface-variant">Area: {area}</p>
                    </div>
                    <span className="font-headline-sm text-headline-sm text-secondary">
                      {t.capacity} <span className="text-sm font-sans font-normal text-on-surface-variant">orang</span>
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-outline-variant/60 pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="bg-primary text-surface px-5 py-2 font-body-sm rounded-[2px] cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONTAK */}
      {modal === "kontak" && (
        <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-outline-variant/80 max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-baseline justify-between border-b border-outline-variant/60 pb-3">
              <span className="font-title-editorial text-title-editorial text-primary">Kontak QulinaryQuest</span>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="text-on-surface-variant hover:text-primary font-body-sm cursor-pointer"
              >
                ✕ Tutup
              </button>
            </div>
            <div className="space-y-4 font-body-md text-on-surface-variant">
              <div>
                <p className="font-medium text-primary mb-1">Alamat Restoran</p>
                <p>Jl. Contoh Raya 12, Enggal, Bandar Lampung, Lampung 35118</p>
              </div>
              <div>
                <p className="font-medium text-primary mb-1">Jam Operasional</p>
                <p>Senin – Minggu: 17.00 – 23.00 WIB</p>
              </div>
              <div>
                <p className="font-medium text-primary mb-1">Telepon &amp; WhatsApp</p>
                <p>+62 (721) 489-2104 / +62 812-3456-7890</p>
              </div>
              <div>
                <p className="font-medium text-primary mb-1">Email Layanan</p>
                <p>reservasi@qulinaryquest.id</p>
              </div>
            </div>
            <div className="border-t border-outline-variant/60 pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="bg-primary text-surface px-5 py-2 font-body-sm rounded-[2px] cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   KASIR RESERVASI VIEW (Pencatatan Reservasi + Riwayat Status Meja)
   ========================================================================== */
function KasirReservasiView({
  tables,
  reservations,
  onReservationCreated,
  onOpenReceiptPopup,
  onStatusChanged,
  onError,
}: {
  tables: TableRow[];
  reservations: ResRow[];
  onReservationCreated: (created: { id: number }, fullRes: ResRow) => void;
  onOpenReceiptPopup: (r: ResRow) => void;
  onStatusChanged: (id: number, nextStatus: ReservationStatus) => void;
  onError: (msg: string) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [guestCount, setGuestCount] = useState(1);
  const [area, setArea] = useState<"Indoor" | "VIP" | "Terrace">("Indoor");
  const [selectedTableId, setSelectedTableId] = useState<number>(0);
  const [visitDate, setVisitDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [visitTime, setVisitTime] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Filter tables by Area
  const availableTables = useMemo(() => {
    return tables.filter((t) => getTableArea(t.number) === area);
  }, [tables, area]);

  // Otomatis pilih meja yang sesuai bila area berubah
  useEffect(() => {
    if (availableTables.length > 0) {
      const currentSelected = availableTables.find((t) => t.id === selectedTableId);
      if (!currentSelected) {
        const best = availableTables.find((t) => t.capacity >= guestCount) || availableTables[0];
        setSelectedTableId(best.id);
      }
    }
  }, [availableTables, guestCount, selectedTableId]);

  // Validasi nomor telepon/WA
  const isPhoneValid = useMemo(() => /^(\+62|0)\d{8,13}$/.test(phone.trim()), [phone]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      onError("Silakan isi nama lengkap.");
      return;
    }
    if (!phone.trim()) {
      onError("Silakan isi nomor WhatsApp.");
      return;
    }
    if (!isPhoneValid) {
      onError("Nomor WhatsApp tidak valid (contoh: 081234567890).");
      return;
    }
    if (!visitTime) {
      onError("Silakan pilih jam kunjungan terlebih dahulu.");
      return;
    }
    const targetTable =
      tables.find((t) => t.id === selectedTableId) ||
      availableTables.find((t) => t.id === selectedTableId) ||
      availableTables[0] ||
      tables[0];

    if (!targetTable) {
      onError("Silakan pilih meja yang tersedia.");
      return;
    }

    try {
      setSubmitting(true);
      const reservedIso = new Date(`${visitDate}T${visitTime}:00+07:00`).toISOString();
      const payload = {
        customerName: name.trim(),
        phone: phone.trim(),
        email: undefined,
        tableId: targetTable.id,
        reservedAt: reservedIso,
        durationMin: 120, // 2 jam
        guests: guestCount,
      };

      const res = await api<{ id: number }>("/api/reservations", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const createdRes: ResRow = {
        id: res.id,
        customerName: name.trim(),
        phone: phone.trim(),
        tableNumber: targetTable.number,
        reservedAt: reservedIso,
        durationMin: 120,
        guests: guestCount,
        status: "BOOKED",
        notes: notes.trim() || undefined,
      };

      // Memicu pembukaan pop-up bukti reservasi
      onReservationCreated(res, createdRes);

      // Reset formulir
      setName("");
      setPhone("");
      setGuestCount(1);
      setVisitTime("");
      setNotes("");
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(id: number, status: ReservationStatus) {
    try {
      await api(`/api/reservations/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      onStatusChanged(id, status);
    } catch (err) {
      onError((err as Error).message);
    }
  }

  const times = ["17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30"];

  return (
    <>
      {/* 1. FORMULIR PEMESANAN TERBUKA */}
      <section className="space-y-10">
        <div className="flex items-baseline justify-between border-b border-outline-variant/60 pb-3">
          <span className="font-title-editorial text-title-editorial text-primary">Formulir Reservasi Meja</span>
          <span className="font-label-caption text-label-caption text-on-surface-variant uppercase">
            Pencatatan Tamu oleh Kasir
          </span>
        </div>

        <form id="form-reservasi" onSubmit={handleSubmit} className="space-y-9">
          {/* 1. Nama Lengkap */}
          <div className="flex flex-col space-y-2">
            <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="nama_lengkap">
              Nama tamu / pemesan
            </label>
            <input
              id="nama_lengkap"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Rina Wulandari"
              className="w-full bg-transparent border-0 border-b border-outline-variant/80 py-2.5 px-0 text-primary font-body-lg text-body-lg placeholder:text-on-surface-variant/40 focus:ring-0 focus:outline-none focus:border-secondary transition-colors"
            />
          </div>

          {/* 2. Nomor WhatsApp */}
          <div className="flex flex-col space-y-2">
            <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="whatsapp">
              Nomor WhatsApp tamu
            </label>
            <input
              id="whatsapp"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="081234567890"
              className={`w-full bg-transparent border-0 border-b py-2.5 px-0 text-primary font-body-lg text-body-lg placeholder:text-on-surface-variant/40 focus:ring-0 focus:outline-none transition-colors ${
                !isPhoneValid && phone.length > 0
                  ? "border-error focus:border-error"
                  : "border-outline-variant/80 focus:border-secondary"
              }`}
            />
            {!isPhoneValid && phone.length > 0 && (
              <span className="font-body-sm text-[12px] text-error pt-1 leading-none tracking-normal">
                Nomor WhatsApp tidak valid (contoh: 081234567890)
              </span>
            )}
          </div>

          {/* 3. Jumlah Tamu Stepper */}
          <div className="flex flex-col space-y-3">
            <label className="font-label-md text-label-md text-on-surface-variant">Jumlah tamu</label>
            <div className="flex items-center gap-6">
              <div className="inline-flex items-center border border-primary/20 rounded-[2px] bg-surface">
                <button
                  type="button"
                  id="btn-minus"
                  aria-label="Kurangi tamu"
                  onClick={() => setGuestCount((c) => Math.max(1, c - 1))}
                  className="w-9 h-9 flex items-center justify-center text-primary hover:bg-surface-container transition-colors text-base select-none focus:outline-none cursor-pointer"
                >
                  −
                </button>
                <span
                  id="guest-count"
                  className="w-12 text-center font-numeral-display text-[22px] leading-none text-primary pt-1 select-none"
                >
                  {guestCount}
                </span>
                <button
                  type="button"
                  id="btn-plus"
                  aria-label="Tambah tamu"
                  onClick={() => setGuestCount((c) => Math.min(20, c + 1))}
                  className="w-9 h-9 flex items-center justify-center text-primary hover:bg-surface-container transition-colors text-base select-none focus:outline-none cursor-pointer"
                >
                  +
                </button>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Orang dewasa &amp; anak</span>
            </div>
          </div>

          {/* 4. Area Meja */}
          <div className="flex flex-col space-y-3">
            <label className="font-label-md text-label-md text-on-surface-variant">Area meja</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
              {/* Indoor */}
              <label
                onClick={() => setArea("Indoor")}
                className="flex items-start gap-3 cursor-pointer group select-none"
              >
                <span
                  className={`mt-1 flex items-center justify-center w-4 h-4 rounded-full border relative flex-shrink-0 transition-colors ${
                    area === "Indoor" ? "border-primary" : "border-outline-variant group-hover:border-primary"
                  }`}
                >
                  {area === "Indoor" && <span className="w-2 h-2 rounded-full bg-primary block"></span>}
                </span>
                <div className="flex flex-col">
                  <span
                    className={`font-body-md text-body-md font-medium transition-colors ${
                      area === "Indoor" ? "text-primary" : "text-on-surface-variant group-hover:text-primary"
                    }`}
                  >
                    Indoor
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">4 meja, maks. 8 orang</span>
                </div>
              </label>

              {/* VIP */}
              <label
                onClick={() => setArea("VIP")}
                className="flex items-start gap-3 cursor-pointer group select-none"
              >
                <span
                  className={`mt-1 flex items-center justify-center w-4 h-4 rounded-full border relative flex-shrink-0 transition-colors ${
                    area === "VIP" ? "border-primary" : "border-outline-variant group-hover:border-primary"
                  }`}
                >
                  {area === "VIP" && <span className="w-2 h-2 rounded-full bg-primary block"></span>}
                </span>
                <div className="flex flex-col">
                  <span
                    className={`font-body-md text-body-md font-medium transition-colors ${
                      area === "VIP" ? "text-primary" : "text-on-surface-variant group-hover:text-primary"
                    }`}
                  >
                    VIP
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant/70">2 ruang, maks. 10 orang</span>
                </div>
              </label>

              {/* Terrace */}
              <label
                onClick={() => setArea("Terrace")}
                className="flex items-start gap-3 cursor-pointer group select-none"
              >
                <span
                  className={`mt-1 flex items-center justify-center w-4 h-4 rounded-full border relative flex-shrink-0 transition-colors ${
                    area === "Terrace" ? "border-primary" : "border-outline-variant group-hover:border-primary"
                  }`}
                >
                  {area === "Terrace" && <span className="w-2 h-2 rounded-full bg-primary block"></span>}
                </span>
                <div className="flex flex-col">
                  <span
                    className={`font-body-md text-body-md font-medium transition-colors ${
                      area === "Terrace" ? "text-primary" : "text-on-surface-variant group-hover:text-primary"
                    }`}
                  >
                    Terrace
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant/70">2 meja, maks. 4 orang</span>
                </div>
              </label>
            </div>

            {/* Pilihan Nomor Meja Spesifik */}
            <div className="pt-2">
              <span className="font-label-caption text-label-caption text-on-surface-variant uppercase tracking-wider block mb-1.5">
                Nomor Meja Terpilih ({area}):
              </span>
              <div className="flex flex-wrap gap-2">
                {availableTables.map((t) => {
                  const isSelected = selectedTableId === t.id;
                  const isFit = t.capacity >= guestCount;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTableId(t.id)}
                      className={`px-3 py-1.5 text-body-sm font-body-sm rounded-[2px] transition-colors border cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary text-surface font-medium"
                          : isFit
                          ? "border-outline-variant/80 text-primary hover:border-primary"
                          : "border-outline-variant/40 text-on-surface-variant/50 opacity-60"
                      }`}
                    >
                      Meja {t.number} ({t.capacity} org)
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 5. Tanggal Kunjungan */}
          <div className="flex flex-col space-y-2">
            <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="tanggal_kunjungan">
              Tanggal kunjungan
            </label>
            <input
              id="tanggal_kunjungan"
              type="date"
              required
              min={new Date().toISOString().split("T")[0]}
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className="w-full bg-transparent border-0 border-b border-outline-variant/80 py-2.5 px-0 text-primary font-body-lg text-body-lg focus:ring-0 focus:outline-none focus:border-secondary transition-colors cursor-pointer"
            />
          </div>

          {/* 6. Jam Kunjungan */}
          <div className="flex flex-col space-y-3">
            <label className="font-label-md text-label-md text-on-surface-variant flex items-center justify-between">
              <span>Jam kunjungan</span>
              {!visitTime && (
                <span className="text-secondary font-label-caption text-xs uppercase tracking-wider">
                  *Silakan pilih jam
                </span>
              )}
            </label>
            <div id="time-selector" className="flex flex-wrap gap-2.5 pt-1">
              {times.map((t) => {
                const isSelected = visitTime === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setVisitTime(t)}
                    className={`px-4 py-2 text-body-sm font-body-sm rounded-[2px] transition-colors focus:outline-none cursor-pointer ${
                      isSelected
                        ? "border border-primary bg-primary text-surface font-medium"
                        : "border border-outline-variant/80 text-primary hover:border-primary"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 7. Plain Inline Ruled Notice Box */}
          <div className="border-t border-b border-outline-variant/60 py-4">
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              <span className="text-secondary font-medium mr-1.5">Ketersediaan Sesi:</span>
              {visitTime ? (
                <>
                  Area {area} siap dialokasikan untuk {guestCount} orang pada pukul {visitTime} WIB. Meja ditahan maksimal 15
                  menit setelah jam reservasi.
                </>
              ) : (
                <>Silakan tentukan jam kunjungan pada pilihan di atas untuk memeriksa alokasi sesi meja.</>
              )}
            </p>
          </div>

          {/* 8. Catatan Khusus */}
          <div className="flex flex-col space-y-2">
            <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="catatan_khusus">
              Catatan khusus (opsional)
            </label>
            <textarea
              id="catatan_khusus"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Alergi, kursi bayi, acara khusus"
              className="w-full bg-transparent border-0 border-b border-outline-variant/80 py-2 px-0 text-primary font-body-md text-body-md placeholder:text-on-surface-variant/40 focus:ring-0 focus:outline-none focus:border-secondary transition-colors resize-none"
            />
          </div>

          {/* 9. Tombol Aksi Utama */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary text-surface px-6 py-3 rounded-[2px] font-body-md text-body-md hover:bg-primary-container transition-colors focus:outline-none disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Menyimpan reservasi..." : "Simpan & Terbitkan Bukti Reservasi"}
            </button>
          </div>
        </form>
      </section>

      {/* 2. RIWAYAT RESERVASI RESTORAN (LEGER DATA) */}
      <section id="riwayat-reservasi" className="border-t border-outline-variant/80 pt-10 mt-16 space-y-6 scroll-mt-28">
        <div className="flex items-baseline justify-between border-b border-outline-variant/60 pb-3">
          <span className="font-title-editorial text-title-editorial text-primary">Riwayat Reservasi &amp; Status Meja</span>
          <span className="font-label-caption text-label-caption text-on-surface-variant uppercase">
            {reservations.length} data tersimpan
          </span>
        </div>

        <div className="divide-y divide-outline-variant/60 overflow-x-auto">
          {reservations.length === 0 ? (
            <p className="py-6 text-on-surface-variant font-body-sm italic">
              Belum ada riwayat reservasi. Silakan lakukan pemesanan meja melalui formulir di atas.
            </p>
          ) : (
            reservations.map((r) => {
              const transitions = allowedTransitions(r.status);
              return (
                <div key={r.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-primary">{r.customerName}</span>
                      <span className="font-body-sm text-on-surface-variant">({r.phone})</span>
                      <span className={`text-xs px-2 py-0.5 border rounded-[2px] ${STATUS_COLOR[r.status]}`}>
                        {STATUS_LABEL[r.status]}
                      </span>
                    </div>
                    <p className="font-body-sm text-on-surface-variant">
                      Meja T-0{r.tableNumber} ({getTableArea(r.tableNumber)}) · {r.guests} tamu · {formatDateTime(r.reservedAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenReceiptPopup(r)}
                      className="px-3 py-1 text-xs rounded-[2px] border border-outline-variant hover:border-primary text-primary transition-colors cursor-pointer"
                    >
                      Lihat Bukti
                    </button>
                    {transitions.map((next) => (
                      <button
                        key={next}
                        type="button"
                        onClick={() => handleStatusChange(r.id, next)}
                        className={`px-3 py-1 text-xs rounded-[2px] border transition-colors cursor-pointer ${
                          next === "CANCELLED"
                            ? "border-error/40 text-error hover:bg-error-container/30"
                            : "border-primary bg-primary text-surface hover:bg-primary-container"
                        }`}
                      >
                        {next === "SEATED"
                          ? "Tandai duduk"
                          : next === "DONE"
                          ? "Selesai"
                          : "Batalkan"}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </>
  );
}

/* ==========================================================================
   KASIR PESANAN VIEW (Pencatatan Pesanan + Perhitungan Service + Cetak Bill)
   ========================================================================== */
function KasirPesananView({
  tables,
  menu,
  reservations,
  orders,
  onOrderCreated,
  onError,
}: {
  tables: TableRow[];
  menu: MenuRow[];
  reservations: ResRow[];
  orders: OrderRow[];
  onOrderCreated: (order: { id: number; total: number }) => void;
  onError: (msg: string) => void;
}) {
  const seatedReservations = useMemo(
    () => reservations.filter((r) => r.status === "SEATED"),
    [reservations]
  );

  const [selectedResId, setSelectedResId] = useState<number>(0);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (seatedReservations.length > 0 && !selectedResId) {
      setSelectedResId(seatedReservations[0].id);
    }
  }, [seatedReservations, selectedResId]);

  const updateQty = (id: number, delta: number) => {
    setQuantities((prev) => {
      const cur = prev[id] || 0;
      const next = Math.max(0, cur + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  // Live Ledger Calculation
  const calculation = useMemo(() => {
    let subtotal = 0;
    let serviceCharge = 0;

    for (const item of menu) {
      const q = quantities[item.id] || 0;
      if (q > 0) {
        subtotal += item.price * q;
        if (item.category === "FOOD") {
          serviceCharge += Math.round(item.price * q * 0.05);
        }
      }
    }

    const discount = Math.round((subtotal * discountPercent) / 100);
    const total = subtotal + serviceCharge - discount;

    return { subtotal, serviceCharge, discount, total };
  }, [menu, quantities, discountPercent]);

  async function handleCreateOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedResId) {
      onError("Pilih meja tamu yang sedang duduk terlebih dahulu.");
      return;
    }

    const items = Object.entries(quantities)
      .map(([mId, qty]) => ({ menuItemId: Number(mId), qty }))
      .filter((i) => i.qty > 0);

    if (items.length === 0) {
      onError("Pilih minimal satu menu hidangan.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api<{ id: number; total: number }>("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          reservationId: selectedResId,
          items,
          discountPercent,
        }),
      });

      setQuantities({});
      setDiscountPercent(0);
      onOrderCreated(res);
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-16">
      <section className="space-y-10">
        <div className="flex items-baseline justify-between border-b border-outline-variant/60 pb-3">
          <span className="font-title-editorial text-title-editorial text-primary">Pencatatan Pesanan Meja</span>
          <span className="font-label-caption text-label-caption text-on-surface-variant uppercase">
            Khusus Tamu Sedang Duduk (SEATED)
          </span>
        </div>

        {seatedReservations.length === 0 ? (
          <div className="border border-outline-variant/60 p-6 bg-surface-container-low text-on-surface-variant">
            <p className="font-medium text-primary mb-1">Tidak ada meja dengan status Sedang Duduk.</p>
            <p className="font-body-sm">
              Untuk mencatat pesanan hidangan, buka tab <strong>Reservasi Meja</strong> di atas, lalu konfirmasi kedatangan tamu dengan menekan tombol
              &quot;Tandai duduk&quot;.
            </p>
          </div>
        ) : (
          <form onSubmit={handleCreateOrder} className="space-y-10">
            {/* 1. Pilih Tamu & Meja */}
            <div className="flex flex-col space-y-3">
              <label className="font-label-md text-label-md text-on-surface-variant">
                Pilih Tamu &amp; Meja
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {seatedReservations.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedResId(r.id)}
                    className={`p-4 border text-left transition-colors cursor-pointer ${
                      selectedResId === r.id
                        ? "border-primary bg-primary text-surface"
                        : "border-outline-variant/80 hover:border-primary bg-surface"
                    }`}
                  >
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-medium text-base">{r.customerName}</span>
                      <span className={selectedResId === r.id ? "text-surface" : "text-secondary font-medium"}>
                        Meja T-0{r.tableNumber}
                      </span>
                    </div>
                    <p className={`font-body-sm ${selectedResId === r.id ? "text-surface/80" : "text-on-surface-variant"}`}>
                      {r.guests} orang · {formatDateTime(r.reservedAt)}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Menu Hidangan */}
            <div className="space-y-4">
              <label className="font-label-md text-label-md text-on-surface-variant block">
                Daftar Menu Hidangan (Makanan &amp; Minuman)
              </label>
              <div className="divide-y divide-outline-variant/60 border-t border-b border-outline-variant/60">
                {menu.map((item) => {
                  const qty = quantities[item.id] || 0;
                  return (
                    <div key={item.id} className="py-3.5 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-primary">{item.name}</p>
                        <p className="font-body-sm text-on-surface-variant">
                          {formatRupiah(item.price)} · {item.category === "FOOD" ? "Makanan (+5% service)" : "Minuman (0% service)"}
                        </p>
                      </div>
                      <div className="inline-flex items-center border border-primary/20 rounded-[2px] bg-surface">
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, -1)}
                          className="w-8 h-8 flex items-center justify-center text-primary hover:bg-surface-container text-sm select-none cursor-pointer"
                        >
                          −
                        </button>
                        <span className="w-10 text-center font-numeral-display text-[18px] leading-none pt-0.5 select-none">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, 1)}
                          className="w-8 h-8 flex items-center justify-center text-primary hover:bg-surface-container text-sm select-none cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Diskon */}
            <div className="flex flex-col space-y-3">
              <label className="font-label-md text-label-md text-on-surface-variant">Kebijakan Diskon (%)</label>
              <div className="flex gap-3">
                {[0, 10, 20, 30].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDiscountPercent(d)}
                    className={`px-4 py-2 text-body-sm rounded-[2px] border transition-colors cursor-pointer ${
                      discountPercent === d
                        ? "border-primary bg-primary text-surface font-medium"
                        : "border-outline-variant/80 hover:border-primary text-primary"
                    }`}
                  >
                    {d === 0 ? "Tanpa Diskon" : `${d}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Rincian Struk Otomatis (Ledger) */}
            <div className="border border-outline-variant/80 p-6 bg-surface-container-low space-y-4">
              <span className="font-label-caption text-label-caption text-on-surface-variant uppercase tracking-wider block border-b border-outline-variant/60 pb-2">
                Ikhtisar Struk Tagihan
              </span>
              <div className="divide-y divide-outline-variant/60 font-body-md text-body-md">
                <div className="py-2.5 flex justify-between">
                  <span className="text-on-surface-variant">Subtotal</span>
                  <span className="text-primary font-medium">{formatRupiah(calculation.subtotal)}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-on-surface-variant">Biaya Pelayanan (5% Makanan)</span>
                  <span className="text-primary font-medium">{formatRupiah(calculation.serviceCharge)}</span>
                </div>
                {calculation.discount > 0 && (
                  <div className="py-2.5 flex justify-between text-secondary">
                    <span>Diskon ({discountPercent}%)</span>
                    <span>-{formatRupiah(calculation.discount)}</span>
                  </div>
                )}
                <div className="py-3 flex justify-between items-baseline font-headline-sm text-headline-sm text-primary">
                  <span>Total Bayar</span>
                  <span>{formatRupiah(calculation.total)}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || calculation.total === 0}
                  className="w-full bg-primary text-surface py-3.5 rounded-[2px] font-body-md hover:bg-primary-container transition-colors disabled:opacity-40 cursor-pointer"
                >
                  {submitting ? "Memproses pesanan..." : "Catat Pesanan & Terbitkan Tagihan"}
                </button>
              </div>
            </div>
          </form>
        )}
      </section>

      {/* 5. Daftar Pesanan Terkini */}
      <section className="border-t border-outline-variant/80 pt-10 space-y-6">
        <div className="flex items-baseline justify-between border-b border-outline-variant/60 pb-3">
          <span className="font-title-editorial text-title-editorial text-primary">Riwayat Transaksi Pesanan</span>
          <span className="font-label-caption text-label-caption text-on-surface-variant uppercase">
            {orders.length} transaksi
          </span>
        </div>

        <div className="divide-y divide-outline-variant/60">
          {orders.length === 0 ? (
            <p className="py-6 text-on-surface-variant font-body-sm italic">Belum ada riwayat transaksi pesanan.</p>
          ) : (
            orders.map((o) => (
              <div key={o.id} className="py-3.5 flex justify-between items-center">
                <div>
                  <p className="font-medium text-primary">
                    Order #{o.id} · Meja T-0{o.tableNumber} ({o.customerName})
                  </p>
                  <p className="font-body-sm text-on-surface-variant">{formatDateTime(o.createdAt)}</p>
                </div>
                <span className="font-headline-sm text-headline-sm text-primary">{formatRupiah(o.total)}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

/* ==========================================================================
   KASIR LAPORAN VIEW (Laporan Pendapatan, Okupansi, dan Top 5 Menu)
   ========================================================================== */
function KasirLaporanView({ onError }: { onError: (msg: string) => void }) {
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const fromIso = new Date(`${fromDate}T00:00:00Z`).toISOString();
      const toIso = new Date(`${toDate}T23:59:59Z`).toISOString();
      const data = await api<ReportData>(`/api/report?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`);
      setReport(data);
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, onError]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return (
    <div className="space-y-12">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-outline-variant/60 pb-3">
        <span className="font-title-editorial text-title-editorial text-primary">Ikhtisar Kinerja Restoran</span>
        <span className="font-label-caption text-label-caption text-on-surface-variant uppercase">
          Audit Operasional Kasir · Prisma PostgreSQL
        </span>
      </div>

      {/* Date Range Picker */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 border border-outline-variant/60 bg-surface-container-low">
        <div className="flex flex-col space-y-1">
          <label className="font-label-caption text-on-surface-variant uppercase">Dari Tanggal</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-transparent border-0 border-b border-outline-variant/80 py-1.5 px-0 text-primary font-body-md focus:outline-none focus:border-secondary cursor-pointer"
          />
        </div>
        <div className="flex flex-col space-y-1">
          <label className="font-label-caption text-on-surface-variant uppercase">Sampai Tanggal</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-transparent border-0 border-b border-outline-variant/80 py-1.5 px-0 text-primary font-body-md focus:outline-none focus:border-secondary cursor-pointer"
          />
        </div>
      </div>

      {loading ? (
        <p className="py-8 text-on-surface-variant font-body-sm italic">Memuat data analitik...</p>
      ) : report ? (
        <div className="space-y-12">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="border border-outline-variant/80 p-5 space-y-2">
              <span className="font-label-caption text-on-surface-variant uppercase">Total Pendapatan</span>
              <p className="font-headline-lg text-headline-lg text-primary">{formatRupiah(report.revenue)}</p>
            </div>
            <div className="border border-outline-variant/80 p-5 space-y-2">
              <span className="font-label-caption text-on-surface-variant uppercase">Total Transaksi</span>
              <p className="font-headline-lg text-headline-lg text-primary">{report.orders} pesanan</p>
            </div>
            <div className="border border-outline-variant/80 p-5 space-y-2">
              <span className="font-label-caption text-on-surface-variant uppercase">Rata-rata Pesanan</span>
              <p className="font-headline-lg text-headline-lg text-primary">
                {report.orders > 0 ? formatRupiah(Math.round(report.revenue / report.orders)) : "Rp 0"}
              </p>
            </div>
          </div>

          {/* Status Reservasi Ledger */}
          <div className="space-y-4">
            <h3 className="font-title-editorial text-title-editorial text-primary border-b border-outline-variant/60 pb-2">
              Distribusi Status Reservasi
            </h3>
            <div className="divide-y divide-outline-variant/60 font-body-md">
              {report.byStatus.map((s) => (
                <div key={s.status} className="py-3 flex justify-between items-baseline">
                  <span className="text-on-surface-variant">{STATUS_LABEL[s.status]}</span>
                  <span className="text-primary font-headline-sm text-headline-sm font-normal">{s.n} meja</span>
                </div>
              ))}
              {report.byStatus.length === 0 && (
                <p className="py-4 text-on-surface-variant font-body-sm italic">Tidak ada data reservasi pada rentang ini.</p>
              )}
            </div>
          </div>

          {/* Top 5 Menu */}
          <div className="space-y-4">
            <h3 className="font-title-editorial text-title-editorial text-primary border-b border-outline-variant/60 pb-2">
              5 Menu Terlaris
            </h3>
            <div className="divide-y divide-outline-variant/60 font-body-md">
              {report.topMenu.map((m, idx) => (
                <div key={m.name} className="py-3 flex justify-between items-baseline">
                  <span className="text-primary font-medium">
                    {idx + 1}. {m.name}
                  </span>
                  <span className="text-secondary font-headline-sm text-headline-sm font-normal">{m.qty} porsi</span>
                </div>
              ))}
              {report.topMenu.length === 0 && (
                <p className="py-4 text-on-surface-variant font-body-sm italic">Belum ada pesanan pada rentang ini.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
