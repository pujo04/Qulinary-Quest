# QulinaryQuest — Sistem Pemesanan Restoran

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · PostgreSQL (Prisma ORM) · Zod · date-fns · Vitest

## Menjalankan
```bash
npm install
npx prisma db push  # sinkronisasi skema ke PostgreSQL (Prisma)
npx prisma db seed  # isi data awal meja dan menu (opsional jika baru)
npm run dev         # http://localhost:3000
npm test            # unit test
npm run lint        # type-check TypeScript
```

## Struktur
```
src/models/        Kelas OOP: Person→Customer, MenuItem→Food/Drink, Order (+DiscountPolicy), Reservation
src/repositories/  Akses basis data (CRUD, query laporan) — satu-satunya tempat SQL
src/services/      Aturan bisnis + transaksi (reservationService, orderService)
src/lib/           db (skema+indeks), schemas (Zod), errors, logger, api (handler), format
src/app/api/       REST API: tables, menu, reservations, orders, report
src/app/page.tsx   UI: tab Reservasi, Pesanan, Laporan
tests/             Unit test (Vitest)
```

## Pemetaan ke unit kompetensi
| Kode | Bukti dalam proyek |
|---|---|
| J.620100.009.01 Spesifikasi program | Skema model di `prisma/schema.prisma`, dokumen lengkap di [docs/SKPL-QulinaryQuest-01.md](docs/SKPL-QulinaryQuest-01.md) |
| J.620100.016.01 Guidelines & best practices | TypeScript `strict`, penamaan konsisten, pemisahan lapisan model/repository/service/API, validasi terpusat |
| J.620100.017.02 Pemrograman terstruktur | Fungsi terpisah per tugas (`createReservation`, `createOrder`, `handle`), struktur kontrol if/for/map, tipe data eksplisit |
| J.620100.018.02 OOP | Class, encapsulation (field private + getter), inheritance (`Person`→`Customer`, `MenuItem`→`Food`/`Drink`), polymorphism (`serviceRate`, `DiscountPolicy`), abstract class, hak akses public/private/protected |
| J.620100.019.02 Library | `next`, `react`, `tailwindcss`, `prisma`, `@prisma/client`, `zod`, `date-fns`, `vitest` — semua berlisensi MIT/ISC dan versi aktif |
| J.620100.021.02 Akses basis data | `src/repositories/index.ts` via Prisma Client: CRUD, relasi, indeks, transaksi, foreign key constraint |
| J.620100.023.02 Dokumentasi kode | README ini, komentar JSDoc pada bagian penting, tabel API di bawah |
| J.620100.025.02 Debugging | `src/lib/logger.ts`, `handle()` mencatat error tak terduga; panduan di bawah |
| J.620100.033.02 Unit testing | `tests/*.test.ts`: kasus normal, edge case (reservasi berurutan), dan error |

## API
| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/tables` | Daftar meja |
| GET | `/api/menu` | Daftar menu |
| GET/POST | `/api/reservations` | Daftar / buat reservasi (cek kapasitas & bentrok) |
| PATCH | `/api/reservations/:id` | Ubah status (BOOKED→SEATED→DONE, atau CANCELLED) |
| GET/POST | `/api/orders` | Daftar / catat pesanan (hanya untuk status SEATED) |
| GET | `/api/report?from=&to=` | Ringkasan reservasi, pendapatan, menu terlaris (ISO UTC) |

Aturan bisnis: service charge makanan 5%, minuman 0%; diskon dalam persen dari subtotal.

## Panduan debugging
1. Jalankan `npm run lint` untuk menemukan error tipe sebelum runtime.
2. Lihat log server di terminal (`logger.error`) — error 500 mencatat stack trace lengkap.
3. Error 400 = validasi Zod, 404 = data tidak ada, 422 = pelanggaran aturan bisnis.
4. Reproduksi bug dengan membuat test baru di `tests/`, perbaiki, lalu `npm test` untuk verifikasi.
5. Breakpoint: `NODE_OPTIONS='--inspect' npm run dev`, lalu attach debugger VS Code.
6. Reset data: hentikan server, hapus `restoran.db*`.

## Catatan
Waktu disimpan sebagai ISO UTC dan ditampilkan sesuai zona waktu browser.
