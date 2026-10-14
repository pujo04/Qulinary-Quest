# SPESIFIKASI KEBUTUHAN PERANGKAT LUNAK (SKPL)
## QulinaryQuest — Sistem Reservasi Meja dan Pemesanan Restoran
**Nomor Dokumen:** SKPL-QulinaryQuest-01  
**Revisi:** C (Penyelarasan Aktor Tunggal: Kasir Berdasarkan Hasil Wawancara & Evaluasi Penguji)  
**Tanggal:** 14 Oktober 2026  

---

### Identitas Penyusun
* **Nama:** Andreas Pujo Santoso (NPM: 2215061101)  
* **Program Studi:** S1 Teknik Informatika  
* **Institusi:** Universitas Lampung (Unila), Jl. Soemantri Brojonegoro No. 1 Bandar Lampung  
* **Tujuan Dokumen:** Praktik Demonstrasi Uji Kompetensi Pemrograman  

---

## DAFTAR PERUBAHAN DOKUMEN

| Revisi | Tanggal | Deskripsi Perubahan |
|---|---|---|
| **A** | 13 Oktober 2026 | Penyusunan draf awal dokumen SKPL QulinaryQuest. |
| **B** | 13 Oktober 2026 | **Penyelarasan dengan implementasi aktual:** Penyesuaian kode kebutuhan (`SKPL-QQ-F-xx`), Primary Key Integer autoincrement, status reservasi (`BOOKED`, `SEATED`, `DONE`, `CANCELLED`), polimorfisme OOP menu, spesifikasi tiket pop-up bukti reservasi, dan data 8 meja awal pada 3 zona area. |
| **C** | 14 Oktober 2026 | **Penyelarasan Aktor Tunggal (Kasir):**<br>1. Menetapkan **Kasir** (Staf Kasir / Operator Restoran) sebagai aktor tunggal yang memiliki hak akses penuh (*Full Operational Access*) untuk mengoperasikan seluruh fitur sistem.<br>2. Menggantikan *Mock Role Switcher* dengan tab navigasi kerja kasir terpadu (Reservasi Meja, Pesanan & Tagihan, Laporan Penjualan).<br>3. Menyesuaikan Use Case Model menjadi 1 Aktor Kasir yang terhubung ke seluruh use case (`UC-01` s.d. `UC-14` serta `UC-15`).<br>4. Memperbarui bab karakteristik pengguna, batasan sistem, dan matriks kebutuhan fungsional (`SKPL-QQ-F-01` s.d. `SKPL-QQ-F-17`). |

---

## DAFTAR ISI
1. [Pendahuluan](#1-pendahuluan)  
   1.1 [Tujuan Penulisan Dokumen](#11-tujuan-penulisan-dokumen)  
   1.2 [Lingkup Masalah](#12-lingkup-masalah)  
   1.3 [Definisi, Istilah, dan Singkatan](#13-definisi-istilah-dan-singkatan)  
   1.4 [Referensi](#14-referensi)  
2. [Deskripsi Umum Perangkat Lunak](#2-deskripsi-umum-perangkat-lunak)  
   2.1 [Deskripsi Umum Sistem](#21-deskripsi-umum-sistem)  
   2.2 [Karakteristik Pengguna](#22-karakteristik-pengguna)  
   2.3 [Batasan Sistem](#23-batasan-sistem)  
   2.4 [Lingkungan Operasi](#24-lingkungan-operasi)  
3. [Deskripsi Kebutuhan](#3-deskripsi-kebutuhan)  
   3.1 [Kebutuhan Fungsional](#31-kebutuhan-fungsional)  
   3.2 [Model Use Case](#32-model-use-case)  
       3.2.1 [Diagram Use Case](#321-diagram-use-case)  
       3.2.2 [Definisi Aktor](#322-definisi-aktor)  
       3.2.3 [Definisi Use Case](#323-definisi-use-case)  
4. [Perancangan Basis Data](#4-perancangan-basis-data)  
   4.1 [Pemodelan Basis Data](#41-pemodelan-basis-data)  
       4.1.1 [Entity Relationship Diagram (ERD)](#411-entity-relationship-diagram-erd)  
       4.1.2 [Contextual Data Model (CDM)](#412-contextual-data-model-cdm)  
       4.1.3 [Physical Data Model (PDM)](#413-physical-data-model-pdm)  
       4.1.4 [Deskripsi Rinci Tabel](#414-deskripsi-rinci-tabel)  
       4.1.5 [Query Utama PostgreSQL](#415-query-utama-postgresql)  

---

## 1. Pendahuluan

### 1.1 Tujuan Penulisan Dokumen
Dokumen Spesifikasi Kebutuhan Perangkat Lunak (SKPL) ini disusun untuk menjelaskan kebutuhan perangkat lunak aplikasi **QulinaryQuest**, yaitu sistem reservasi meja dan pemesanan restoran berbasis web yang dioperasikan terpusat oleh **Kasir**. Dokumen ini mendefinisikan kebutuhan fungsional, spesifikasi aktor tunggal kasir, use case, aturan bisnis OOP, serta rancangan basis data relasional yang diimplementasikan menggunakan Prisma ORM dan PostgreSQL.

### 1.2 Lingkup Masalah
Aplikasi QulinaryQuest dibangun untuk memecahkan kendala pencatatan manual di restoran melalui stasiun kerja operasional kasir (*Cashier POS Workstation*):
* Kasir mencatat reservasi meja pelanggan (tamu *walk-in* maupun reservasi via telepon), memilih tanggal dan slot jam, menentukan area meja (Indoor, VIP, Terrace), serta menerbitkan Bukti Reservasi resmi dalam bentuk pop-up tiket dengan opsi cetak PDF.
* Sistem memvalidasi kapasitas meja dan mencegah bentrok jadwal (*anti-overlapping schedule*) secara otomatis.
* Kasir mengelola transisi status kedatangan tamu (menandai duduk `SEATED`, menyelesaikan `DONE`, atau membatalkan `CANCELLED`).
* Kasir mencatat pesanan hidangan untuk meja tamu yang sedang duduk (`SEATED`), menerapkan kebijakan diskon persentase, dan menghitung biaya pelayanan (*service charge* 5% makanan, 0% minuman) secara otomatis berbasis OOP polimorfisme.
* Kasir memantau laporan operasional dan penjualan harian/mingguan yang meliputi total pendapatan, jumlah pesanan, distribusi status meja, dan 5 menu terlaris.
* *Di luar lingkup:* Autentikasi multi-peran login terpisah (sistem difokuskan sebagai dedicated POS workstation kasir), payment gateway pihak ketiga, notifikasi SMS/WA gateway riil, dan inventaris bahan baku dapur.

### 1.3 Definisi, Istilah, dan Singkatan
| Istilah | Penjelasan |
|---|---|
| **QulinaryQuest** | Nama aplikasi sistem pemesanan dan reservasi restoran. |
| **SKPL** | Spesifikasi Kebutuhan Perangkat Lunak. |
| **SKPL-QulinaryQuest-01** | Nomor identitas dokumen spesifikasi ini. |
| **Kasir** | Aktor tunggal sistem yang memiliki wewenang penuh mengoperasikan reservasi meja, pemesanan hidangan POS, dan laporan penjualan. |
| **Reservasi** | Pemesanan alokasi meja yang dicatat oleh kasir untuk tanggal, jam, durasi, dan area tertentu. |
| **Meja** | Meja fisik restoran dengan nomor meja (T-01 s.d. T-08), kapasitas (2 s.d. 10 orang), dan area (Terrace, Indoor, VIP). |
| **Area Meja** | Pembagian zona restoran: *Terrace* (Meja 1-2, santai luar ruangan), *Indoor* (Meja 3-6, ruang makan utama), dan *VIP* (Meja 7-8, ruang privat kapasitas besar). |
| **Kode Booking** | Kode unik tanda bukti reservasi berformat `RSV-TTTTBBHH-NNN` (contoh: `RSV-20261014-001`). |
| **Status Reservasi** | Siklus hidup pemesanan meja: `BOOKED` (Dipesan), `SEATED` (Sedang makan), `DONE` (Selesai), `CANCELLED` (Dibatalkan). |
| **Pesanan (Order)** | Transaksi pemesanan hidangan untuk meja tamu yang sedang duduk (`SEATED`). |
| **Service Charge** | Biaya pelayanan restoran yang dihitung secara polimorfis OOP (5% untuk kategori Makanan, 0% untuk Minuman). |
| **Terminal Kasir** | Antarmuka stasiun kerja kasir terpadu yang memuat navigasi tab Reservasi Meja, Pesanan & Tagihan, dan Laporan Penjualan tanpa memerlukan pengalihan peran buatan. |
| **Prisma ORM** | Object-Relational Mapping generasi baru untuk Node.js/TypeScript yang menjamin tipe-aman (*type-safe*). |

### 1.4 Referensi
1. Elmasri, R. dan Navathe, S. B. (2015). *Fundamentals of Database Systems*. Pearson: Boston.
2. IEEE Std 830-1998, *IEEE Recommended Practice for Software Requirements Specifications*.
3. Standar Kompetensi Kerja Nasional Indonesia (SKKNI) Bidang Pemrograman Perangkat Lunak.
4. Dokumentasi Resmi Next.js App Router (https://nextjs.org/docs).
5. Dokumentasi Resmi Prisma ORM (https://www.prisma.io/docs).

---

## 2. Deskripsi Umum Perangkat Lunak

### 2.1 Deskripsi Umum Sistem
QulinaryQuest adalah sistem workstation kasir dan pemesanan restoran berbasis web arsitektur modern Next.js 14 yang dioperasikan secara terpusat oleh **Kasir** sebagai operator tunggal. Kasir memiliki wewenang penuh mengoperasikan tiga modul layanan terintegrasi:
1. **Layanan Reservasi Meja**: Mencatat pemesanan meja tamu (*walk-in* maupun via telepon), memilih jumlah tamu dengan stepper, memilih area meja, memilih jam kunjungan, serta menerbitkan dan mencetak Bukti Reservasi tiket pop-up.
2. **Layanan Pesanan & Tagihan (POS)**: Mengonfirmasi kedatangan tamu (`SEATED`), mencatat pesanan hidangan menu meja, menerapkan diskon, menghitung service charge secara otomatis (OOP polimorfisme), serta mencetak struk tagihan kasir.
3. **Layanan Laporan Penjualan**: Meninjau analitik pendapatan kotor, statistik transaksi pesanan, pemantauan okupansi meja, serta 5 menu terlaris restoran berdasarkan filter rentang tanggal.

### 2.2 Karakteristik Pengguna
| Kategori Pengguna | Tugas Utama | Hak Akses Sistem |
|---|---|---|
| **Kasir (Operator Tunggal)** | Mengoperasikan seluruh aktivitas operasional restoran: mencatat reservasi meja tamu, menerbitkan tiket reservasi pop-up, mengonfirmasi kedatangan tamu (`SEATED`), mencatat pesanan menu hidangan per meja, menghitung tagihan dengan service charge & diskon, mencetak struk kasir, menyelesaikan transaksi (`DONE`), membatalkan reservasi (`CANCELLED`), serta mengakses laporan omzet pendapatan dan 5 menu terlaris. | Hak akses penuh (*Full Operational Access*) ke seluruh modul: Reservasi Meja, Pencatatan Pesanan & Tagihan, serta Laporan Penjualan. |

### 2.3 Batasan Sistem
* Sistem dirancang sebagai stasiun kerja operasional kasir tunggal (*Single-Operator Cashier Workstation*) terpadu tanpa memerlukan login berjenjang atau pengalihan peran manual antar pengguna.
* Melayani satu restoran dengan 8 meja awal berkapasitas 2 hingga 10 orang, jam operasional 17.00 – 23.00 WIB, alokasi waktu bersantap 120 menit (2 jam), dan toleransi kedatangan 15 menit.
* Waktu disimpan dalam standar ISO UTC di database dan ditampilkan dalam format lokal WIB di peramban.
* Mata uang menggunakan Rupiah Indonesia (IDR) bilangan bulat.
* Bahasa antarmuka 100% menggunakan Bahasa Indonesia yang komunikatif dan elegan.

### 2.4 Lingkungan Operasi
| Komponen | Spesifikasi Teknis |
|---|---|
| **Kerangka Kerja (Framework)** | Next.js 14 (App Router), React 18, TypeScript (Strict Mode) |
| **Styling & Antarmuka** | Tailwind CSS v3 (dengan Google Fonts: *Newsreader* & *Inter*) |
| **Runtime Server** | Node.js v20+ / v22 LTS |
| **Akses Basis Data (ORM)** | Prisma ORM v6.19+ |
| **Sistem Basis Data (DBMS)** | PostgreSQL (Prisma Cloud Database) |
| **Pustaka Pendukung** | Zod (validasi skema runtime), date-fns (format tanggal lokal) |
| **Framework Pengujian** | Vitest (Unit Test Model OOP & Skema Zod) |
| **Target Peramban** | Chrome, Edge, Firefox, Safari (Desktop 1440px & Tablet/Mobile responsif) |

---

## 3. Deskripsi Kebutuhan

### 3.1 Kebutuhan Fungsional

| ID Kebutuhan | Nama Kebutuhan | Deskripsi & Aturan Bisnis |
|---|---|---|
| **SKPL-QQ-F-01** | Penyediaan data awal (*Seed*) | Sistem menyediakan data awal 8 meja (T-01 s.d. T-08) pada area Terrace, Indoor, dan VIP serta 7 menu standar (makanan dan minuman) dengan harga dasar Rupiah. |
| **SKPL-QQ-F-02** | Pencatatan data reservasi meja oleh Kasir | Kasir memasukkan nama pelanggan pemesan, nomor WhatsApp/telepon valid, jumlah tamu (stepper mulai dari 1), area meja terpilih, tanggal kunjungan, jam kunjungan, dan catatan khusus opsional. |
| **SKPL-QQ-F-03** | Validasi masukan data reservasi | Sistem memvalidasi nama minimal 2 karakter, format nomor WhatsApp Indonesia (`/^(\+62\|0)\d{8,13}$/`), tanggal tidak lampau, dan memastikan jam kunjungan telah dipilih secara eksplisit. |
| **SKPL-QQ-F-04** | Validasi ketersediaan & bentrok meja | Sistem memeriksa ketersediaan meja pada rentang waktu yang diminta agar tidak tumpang tindih (*overlap*) dengan reservasi aktif lain pada meja yang sama. |
| **SKPL-QQ-F-05** | Penerbitan Bukti Reservasi Pop-Up | Setelah kasir berhasil menyimpan reservasi, sistem langsung memunculkan Bukti Reservasi dalam **Pop-Up Modal** dengan kode tiket unik `RSV-TTTTBBHH-NNN`, status `Dipesan`, rincian lengkap, dan tombol cetak PDF untuk tamu. |
| **SKPL-QQ-F-06** | Penutupan Pop-Up & Masuk ke Riwayat | Saat pop-up bukti reservasi ditutup, sistem secara otomatis menggulirkan layar (*smooth scroll*) ke tabel **Riwayat Reservasi & Status Meja** di mana data baru sudah tercatat. |
| **SKPL-QQ-F-07** | Tombol "Lihat Bukti" pada Riwayat | Setiap baris pada Riwayat Reservasi dilengkapi tombol *Lihat Bukti* yang dapat membuka kembali pop-up tiket reservasi tersebut kapan saja. |
| **SKPL-QQ-F-08** | Menampilkan Informasi & Kapasitas Meja | Sistem menyediakan modal navigasi untuk melihat daftar seluruh meja, kapasitas maksimal, dan zonasi area. |
| **SKPL-QQ-F-09** | Konfirmasi kedatangan tamu (*Check-in*) | Kasir dapat memperbarui status reservasi dari `BOOKED` menjadi `SEATED` (Sedang makan) saat tamu tiba di restoran melalui tabel riwayat. |
| **SKPL-QQ-F-10** | Pencatatan pesanan menu meja | Kasir dapat memilih meja yang berstatus `SEATED` dan menambahkan item hidangan makanan/minuman dengan kuantitas porsi tertentu. |
| **SKPL-QQ-F-11** | Kalkulasi tagihan otomatis (OOP) | Sistem menghitung subtotal pesanan, service charge 5% khusus makanan (minuman 0% polimorfis), potongan diskon persentase (*Strategy Pattern*), dan total tagihan secara presisi. |
| **SKPL-QQ-F-12** | Penyelesaian transaksi & penutupan meja | Kasir dapat menyelesaikan pesanan dan mengubah status reservasi meja menjadi `DONE` (Selesai). |
| **SKPL-QQ-F-13** | Pembatalan reservasi meja | Kasir dapat membatalkan reservasi berstatus `BOOKED` menjadi `CANCELLED`. |
| **SKPL-QQ-F-14** | Riwayat transaksi kasir | Sistem mencatat seluruh riwayat pesanan (nomor order, tanggal, nama pemesan, nomor meja, total bayar). |
| **SKPL-QQ-F-15** | Analisis kinerja operasional kasir | Kasir dapat memantau ringkasan total pendapatan, jumlah transaksi pesanan, rata-rata nilai transaksi, dan distribusi status reservasi. |
| **SKPL-QQ-F-16** | Laporan 5 Menu Terlaris | Sistem menghitung dan menampilkan 5 menu makanan/minuman dengan jumlah porsi penjualan terbanyak dalam rentang tanggal audit. |
| **SKPL-QQ-F-17** | Navigasi Tab Stasiun Kerja Kasir | Kasir dapat berpindah antar tab kerja (Reservasi Meja, Pesanan & Tagihan, Laporan Penjualan) secara cepat dan terintegrasi dalam satu layar kerja. |

---

### 3.2 Model Use Case

#### 3.2.1 Diagram Use Case
```
                          +----------------------------------------------------+
                          |         SISTEM POS WORKSTATION QULINARYQUEST       |
                          +----------------------------------------------------+
                          |                                                    |
   (   Kasir   ) -------->| [UC-01] Mencatat Formulir Reservasi Tamu           |
         |                |    |                                               |
         |                |    +--> (include) [UC-02] Validasi Bentrok Meja    |
         |                |                                                    |
         +--------------->| [UC-03] Menerbitkan Bukti Reservasi (Pop-up Modal) |
         |                |                                                    |
         +--------------->| [UC-04] Melihat Informasi & Kapasitas Meja         |
         |                |                                                    |
         +--------------->| [UC-05] Memantau Riwayat Reservasi Restoran        |
         |                |                                                    |
         +--------------->| [UC-06] Konfirmasi Tamu Duduk (SEATED)             |
         |                |                                                    |
         +--------------->| [UC-07] Mencatat Pesanan Menu Hidangan             |
         |                |    |                                               |
         |                |    +--> (include) [UC-08] Kalkulasi Tagihan (OOP)  |
         |                |                                                    |
         +--------------->| [UC-09] Menyelesaikan Transaksi & Selesai (DONE)   |
         |                |                                                    |
         +--------------->| [UC-10] Membatalkan Reservasi (CANCELLED)          |
         |                |                                                    |
         +--------------->| [UC-11] Mencetak Struk Tagihan Kasir               |
         |                |                                                    |
         +--------------->| [UC-12] Melihat Riwayat Transaksi Penjualan        |
         |                |                                                    |
         +--------------->| [UC-13] Memantau Analisis Pendapatan & Okupansi    |
         |                |                                                    |
         +--------------->| [UC-14] Melihat Laporan 5 Menu Terlaris            |
         |                |                                                    |
         +--------------->| [UC-15] Navigasi Tab Modul Kerja Kasir             |
                          +----------------------------------------------------+
```

#### 3.2.2 Definisi Aktor
1. **Kasir (Aktor Tunggal):** Staf operasional restoran yang memiliki wewenang penuh menjalankan seluruh fungsi sistem melalui terminal kasir terpadu, mulai dari pencatatan reservasi meja tamu (walk-in atau telepon), penerbitan tiket bukti reservasi, konfirmasi kedatangan tamu (`SEATED`), pencatatan pesanan hidangan menu, perhitungan tagihan otomatis, penutupan meja (`DONE`), pembatalan reservasi (`CANCELLED`), hingga pengawasan audit laporan pendapatan dan menu terlaris.

#### 3.2.3 Definisi Use Case
* **UC-01 (Mencatat Formulir Reservasi Tamu):** Kasir menginput identitas tamu, kontak WhatsApp, jumlah tamu, area meja, tanggal, dan slot jam pemesanan.
* **UC-02 (Validasi Bentrok Meja):** Sistem secara otomatis memastikan meja dan durasi alokasi 120 menit tidak mengalami tumpang tindih (*overlap*) dengan jadwal reservasi lain.
* **UC-03 (Menerbitkan Bukti Reservasi Pop-Up):** Menampilkan tiket reservasi instan dalam jendela pop-up modal berformat resmi dengan tombol cetak PDF untuk diberikan kepada tamu.
* **UC-04 (Melihat Informasi Meja):** Kasir membuka modal denah untuk memeriksa daftar nomor meja, kapasitas maksimal, dan zonasi area meja.
* **UC-05 (Memantau Riwayat Reservasi Restoran):** Kasir meninjau tabel data reservasi tersimpan dan opsi *Lihat Bukti*.
* **UC-06 (Konfirmasi Tamu Duduk):** Kasir memperbarui status reservasi menjadi `SEATED` saat tamu tiba di restoran.
* **UC-07 (Mencatat Pesanan Hidangan):** Kasir memilih hidangan makanan/minuman dan kuantitas porsi untuk meja tamu yang sedang `SEATED`.
* **UC-08 (Kalkulasi Tagihan OOP):** Sistem menghitung subtotal, biaya pelayanan (*service charge* 5% makanan, 0% minuman), diskon strategi, dan total akhir tagihan secara otomatis.
* **UC-09 (Menyelesaikan Transaksi):** Kasir menyimpan tagihan akhir dan mengubah status meja menjadi `DONE`.
* **UC-10 (Membatalkan Reservasi):** Kasir membatalkan reservasi tamu berstatus `BOOKED` menjadi `CANCELLED`.
* **UC-11 (Mencetak Struk Tagihan):** Kasir menerbitkan dan mencetak lembar rincian pesanan dan total bayar pelanggan.
* **UC-12 (Melihat Riwayat Transaksi):** Kasir meninjau seluruh transaksi penjualan yang telah dibayar.
* **UC-13 (Memantau Analisis Pendapatan):** Kasir memantau metrik omzet penjualan kotor, total pesanan, rata-rata belanja, dan distribusi okupansi meja.
* **UC-14 (Melihat 5 Menu Terlaris):** Kasir melihat daftar 5 menu terfavorit dengan porsi penjualan terbanyak berdasarkan filter rentang tanggal.
* **UC-15 (Navigasi Tab Modul Kerja Kasir):** Kasir berpindah antar modul kerja (Reservasi Meja, Pesanan & Tagihan, Laporan Penjualan) secara instan melalui header navigasi.

---

## 4. Perancangan Basis Data

### 4.1 Pemodelan Basis Data

#### 4.1.1 Entity Relationship Diagram (ERD)
Sistem QulinaryQuest terdiri dari 6 entitas relasional:
1. `Customer`: Menyimpan data profil pelanggan (nama, nomor kontak unik, email).
2. `Table`: Menyimpan data meja restoran (nomor meja unik, kapasitas kursi).
3. `Reservation`: Menyimpan reservasi meja yang menghubungkan `Customer` dan `Table`.
4. `MenuItem`: Menyimpan katalog hidangan (nama, kategori `FOOD`/`DRINK`, harga dasar).
5. `Order`: Menyimpan pesanan hidangan yang terikat pada `Reservation`.
6. `OrderItem`: Menyimpan rincian item hidangan, kuantitas, dan harga satuan dalam sebuah `Order`.

#### 4.1.2 Contextual Data Model (CDM)
* Satu `Customer` dapat melakukan banyak (0..N) `Reservation`.
* Satu `Reservation` harus dimiliki tepat satu (1..1) `Customer`.
* Satu `Table` dapat dialokasikan untuk banyak (0..N) `Reservation` pada waktu berbeda.
* Satu `Reservation` dialokasikan ke tepat satu (1..1) `Table`.
* Satu `Reservation` menghasilkan nol atau satu (0..1) `Order`.
* Satu `Order` terikat pada tepat satu (1..1) `Reservation`.
* Satu `Order` memiliki satu atau banyak (1..N) `OrderItem`.
* Satu `MenuItem` dapat dipesan dalam banyak (0..N) `OrderItem`.

#### 4.1.3 Physical Data Model (PDM) & Skema Prisma
Model data fisik diimplementasikan menggunakan PostgreSQL melalui skema Prisma ([prisma/schema.prisma](file:///c:/Users/andre/Downloads/restoran-app/restoran/prisma/schema.prisma)).

---

### 4.1.4 Deskripsi Rinci Tabel

#### 1. Tabel `customers`
Menyimpan identitas pelanggan yang melakukan reservasi.
| Nama Kolom | Tipe Data | Keterangan | Boleh Null |
|---|---|---|---|
| `id` | `Int` (Autoincrement, PK) | Identitas unik pelanggan | NO |
| `name` | `String` (VarChar) | Nama lengkap pelanggan | NO |
| `phone` | `String` (VarChar, Unique) | Nomor WhatsApp/Telepon unik | NO |
| `email` | `String` (VarChar) | Alamat email pelanggan (opsional) | YES |

#### 2. Tabel `tables`
Menyimpan data fisik meja restoran.
| Nama Kolom | Tipe Data | Keterangan | Boleh Null |
|---|---|---|---|
| `id` | `Int` (Autoincrement, PK) | Identitas unik meja | NO |
| `number` | `Int` (Unique) | Nomor meja fisik (1 s.d. 8) | NO |
| `capacity` | `Int` | Kapasitas kursi (2, 4, 6, atau 10 orang) | NO |

#### 3. Tabel `reservations`
Menyimpan data transaksi reservasi meja.
| Nama Kolom | Tipe Data | Keterangan | Boleh Null |
|---|---|---|---|
| `id` | `Int` (Autoincrement, PK) | Identitas unik reservasi | NO |
| `customer_id` | `Int` (FK `customers.id`) | Relasi ke pelanggan pemesan | NO |
| `table_id` | `Int` (FK `tables.id`) | Relasi ke meja yang dialokasikan | NO |
| `reserved_at` | `DateTime` (Timestamp) | Waktu mulai kunjungan (UTC) | NO |
| `duration_min` | `Int` | Durasi alokasi sesi (bawaan 120 menit) | NO |
| `guests` | `Int` | Jumlah tamu yang dipesan | NO |
| `status` | `String` | Status: `BOOKED`, `SEATED`, `DONE`, `CANCELLED` | NO |

#### 4. Tabel `menu_items`
Menyimpan katalog menu hidangan.
| Nama Kolom | Tipe Data | Keterangan | Boleh Null |
|---|---|---|---|
| `id` | `Int` (Autoincrement, PK) | Identitas unik menu | NO |
| `name` | `String` (VarChar) | Nama hidangan | NO |
| `category` | `String` | Kategori hidangan: `FOOD` atau `DRINK` | NO |
| `price` | `Int` | Harga dasar per porsi (Rupiah) | NO |

#### 5. Tabel `orders`
Menyimpan transaksi pemesanan menu hidangan per meja.
| Nama Kolom | Tipe Data | Keterangan | Boleh Null |
|---|---|---|---|
| `id` | `Int` (Autoincrement, PK) | Identitas unik pesanan | NO |
| `reservation_id` | `Int` (FK `reservations.id`) | Relasi ke reservasi meja aktif | NO |
| `created_at` | `DateTime` (Default `now()`) | Waktu transaksi pesanan dibuat | NO |
| `subtotal` | `Int` | Total harga kotor item hidangan | NO |
| `service_charge` | `Int` | Biaya pelayanan (5% makanan, 0% minuman) | NO |
| `discount` | `Int` | Nilai potongan diskon | NO |
| `total` | `Int` | Total akhir tagihan yang dibayarkan | NO |

#### 6. Tabel `order_items`
Menyimpan rincian item hidangan dalam setiap pesanan.
| Nama Kolom | Tipe Data | Keterangan | Boleh Null |
|---|---|---|---|
| `id` | `Int` (Autoincrement, PK) | Identitas unik item pesanan | NO |
| `order_id` | `Int` (FK `orders.id`, Cascade) | Relasi ke pesanan induk | NO |
| `menu_item_id` | `Int` (FK `menu_items.id`) | Relasi ke menu hidangan | NO |
| `qty` | `Int` | Jumlah porsi yang dipesan | NO |
| `unit_price` | `Int` | Harga satuan saat pemesanan | NO |

---

### 4.1.5 Query Utama PostgreSQL

#### Query 1: Mencari Meja Aktif Bebas Bentrok
```sql
SELECT t.id, t.number, t.capacity
FROM tables t
WHERE t.capacity >= :guests
  AND NOT EXISTS (
    SELECT 1 FROM reservations r
    WHERE r.table_id = t.id
      AND r.status IN ('BOOKED', 'SEATED')
      AND r.reserved_at < :endsAt 
      AND (r.reserved_at + INTERVAL '120 minutes') > :startsAt
  )
ORDER BY t.capacity ASC, t.number ASC;
```

#### Query 2: Pendaftaran / Pembaruan Data Pelanggan (*Upsert*)
```sql
INSERT INTO customers (name, phone, email)
VALUES (:name, :phone, :email)
ON CONFLICT (phone)
DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email
RETURNING id;
```

#### Query 3: Menyimpan Reservasi Baru
```sql
INSERT INTO reservations (customer_id, table_id, reserved_at, duration_min, guests, status)
VALUES (:customerId, :tableId, :reservedAt, 120, :guests, 'BOOKED')
RETURNING id;
```

#### Query 4: Transisi Status Reservasi Kedatangan Tamu (Check-In)
```sql
UPDATE reservations
SET status = 'SEATED'
WHERE id = :reservationId AND status = 'BOOKED'
RETURNING id, status;
```

#### Query 5: Menyimpan Pesanan & Rincian Item (Transaksi Atomik)
```sql
-- Buat transaksi induk pesanan
INSERT INTO orders (reservation_id, created_at, subtotal, service_charge, discount, total)
VALUES (:reservationId, NOW(), :subtotal, :serviceCharge, :discount, :total)
RETURNING id;

-- Masukkan item hidangan
INSERT INTO order_items (order_id, menu_item_id, qty, unit_price)
VALUES (:orderId, :menuItemId, :qty, :unitPrice);
```

#### Query 6: Rekapitulasi Laporan Pendapatan & Omzet (Kasir)
```sql
SELECT 
  COUNT(id) AS total_orders,
  COALESCE(SUM(total), 0) AS total_revenue
FROM orders
WHERE created_at >= :fromDate AND created_at < :toDate;
```

#### Query 7: Rekapitulasi 5 Menu Terlaris (*Top Selling Items*)
```sql
SELECT 
  m.name,
  COALESCE(SUM(oi.qty), 0) AS total_terjual
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN menu_items m ON m.id = oi.menu_item_id
WHERE o.created_at >= :fromDate AND o.created_at < :toDate
GROUP BY m.id, m.name
ORDER BY total_terjual DESC
LIMIT 5;
```

---

*Dokumen ini telah disahkan dan diselaraskan secara penuh dengan basis kode implementasi QulinaryQuest.*
