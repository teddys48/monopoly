# WNI Simulator — Phase 1: Foundation & Game Design

**WNI Simulator** (Warga Negara Indonesia Simulator) adalah permainan papan simulasi kehidupan ekonomi Indonesia berbasis web. Pemain mengarungi dinamika iklim ekonomi kerakyatan, mengelola arus kas dan likuiditas, mengakuisisi aset properti dan komersial (seperti kawasan kos, pasar rakyat, sentra UMKM), membayar pajak, dan menghadapi peristiwa ekonomi makro nasional.

> Proyek ini adalah game simulasi ekonomi orisinal, bukan tiruan langsung (_clone_) dari Monopoly. Seluruh aturan, lokasi, penamaan, dan visual dirancang mandiri dengan konteks ekonomi Indonesia.

---

## 🏗️ Arsitektur & Prinsip Desain

Arsitektur aplikasi memisahkan secara ketat lapisan logika game (_Domain_) dari lapisan antarmuka (_Presentation_):

```text
src/
├── lib/
│   ├── components/            # Lapisan Presentasi Svelte 5
│   │   ├── board/             # Tampilan papan perimeter 5x5, petak, modal inspeksi
│   │   ├── dashboard/         # Pusat kendali putaran, dadu, ringkasan giliran
│   │   ├── layout/            # Header, Footer, navigasi aplikasi
│   │   └── ui/                # Komponen primitif Neobrutalisme (Button, Card, Input, Badge)
│   ├── game/                  # Lapisan Domain Game (Framework-Independent)
│   │   ├── domain/            # Model entitas (Player, BoardTile, GameState, GameConfig, Event)
│   │   ├── engine/            # State factory, RNG terdeterminasi (Mulberry32) & default
│   │   ├── rules/             # Konstanta, aturan batasan, dan fungsi validasi murni
│   │   ├── actions/           # Aksi game bertipe eksplisit (GameAction)
│   │   ├── ai/                # Abstraksi strategi keputusan bot
│   │   ├── events/            # Tipe resolusi peristiwa ekonomi
│   │   └── data/              # Definisi petak papan ekonomi Indonesia & peristiwa sampel
│   ├── stores/                # State reaktif UI Svelte 5 runes (gameSession, theme)
│   ├── utils/                 # Format mata uang Rupiah (formatRupiah, formatShortRupiah)
│   └── types/                 # Re-export tipe domain
├── App.svelte                 # Root view coordinator (Menu -> Setup -> Papan)
├── main.ts                    # Entry point aplikasi
└── app.css                    # Tailwind CSS v4 & konfigurasi tema

tests/                         # Suite Pengujian Otomatis (Vitest)
├── domain/                    # Uji validasi konfigurasi, integritas papan, state factory, tema
└── engine/                    # Uji keacakan deterministik & batas lempar dadu RNG
```

### Prinsip Utama Domain:

1. **Aturan Game Mandiri**: Logika game tidak bergantung pada komponen Svelte, DOM API browser, atau UI store, sehingga siap dieksekusi di server untuk multiplayer daring di masa mendatang.
2. **Deterministic RNG**: Generator angka acak (_Random Number Generator_) dapat disuntikkan (_injectable_) dengan nilai _seed_ untuk pengujian simulasi yang dapat direproduksi.
3. **Immutability & Cloned Board**: Template papan master dilindungi dari mutasi langsung melalui deep clone murni pada factory.
4. **Explicit Game Actions**: Perubahan state terjadi melalui aksi game yang terdefinisi (_START_GAME_, _ROLL_DICE_, _SELECT_TILE_, dll.).

---

## 🎨 Arah Visual & UI/UX (Referensi: Neobrutalism.dev)

Aplikasi mengadopsi standar desain **Neobrutalisme** terinspirasi dari [neobrutalism.dev](https://www.neobrutalism.dev/):

- **Garis Tepi & Border Hitam Pekat**: Border tebal hitam murni (`border-2 border-black` / `border-4 border-black`) pada setiap kartu, input, dan tombol.
- **Hard Drop Shadows Berwarna Hitam Solid**:
  - Bayangan tegas tanpa blur (`shadow-[4px_4px_0px_0px_#000]`, `shadow-[2px_2px_0px_0px_#000]`, `shadow-[6px_6px_0px_0px_#000]`, `shadow-[8px_8px_0px_0px_#000]`).
  - **Di Dark Mode**: Bayangan tetap berwarna hitam solid (`#000`), didukung kanvas charcoal berkarakter (`#1e2129`) dan kartu (`#2b303c`) sehingga efek elevasi 3D neobrutalism tetap terlihat tegas, taktil, dan memiliki kontras yang pas.
- **Interaksi Taktil**: Efek tekan fisik mikro pada tombol dan kartu interaktif:
  - Hover: `hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000]`
  - Active: `active:translate-x-[4px] active:translate-y-[4px] active:shadow-none`
- **Palet Warna Neobrutalisme**:
  - Kanvas latar belakang: `#f6f5f0` (mode terang, default) dan `#1e2129` (mode gelap).
  - Warna aksen cerah: Emerald Hijau Rupiah (`#10b981`), Kuning Emas (`#facc15`), Biru Bahari (`#38bdf8`), Ungu Lilac (`#c084fc`), Coral Red (`#ff6b6b`).
- **Dukungan Tema Terang (Default) & Gelap**:
  - **Default**: Selalu memuat **Light Mode** secara default saat pertama kali dibuka.
  - **Class-Based Dark Mode**: Menggunakan `@custom-variant dark (&:where(.dark, .dark *));` pada Tailwind CSS v4 agar tidak terpengaruh paksa oleh preferensi tema gelap sistem operasi jika pengguna memilih mode terang.
  - Sakelar tema instan tersimpan di `localStorage` dan dieksekusi sebelum render awal melalui script inline di `<head>`.
- Seluruh antarmuka menggunakan **Bahasa Indonesia** yang natural.

---

## 📋 Cakupan Fitur Fase 1 (Tersedia)

- [x] **Menu Utama (Beranda)**:
  - Identitas & _branding_ WNI Simulator.
  - Kartu pemilihan mode permainan: "Lawan Bot AI", "Multiplayer Lokal", dan "Multiplayer Online" (ditandai dengan jelas _Segera Hadir_).
  - Akses cepat pratinjau papan langsung.
  - Pengalih tema Terang/Gelap.
- [x] **Konfigurasi Permainan Baru (Game Setup)**:
  - Pemilihan mode (`BOT` vs `LOCAL_MULTIPLAYER`).
  - Pemilihan jumlah pemain (2, 3, atau 4 orang).
  - Penyesuaian nama pemain, warna pion, dan kontroler (_Manusia_ vs _Bot AI_).
  - Pengaturan modal awal (default: Rp 10.000.000).
  - Validasi _real-time_ (nama kosong, nama duplikat, warna bentrok, batas pemain).
- [x] **Pratinjau Papan Ekonomi Indonesia (16 Petak)**:
  - Petak #0: Mulai & Gajian Pokok (bonus gaji Rp 2.000.000 setiap putaran).
  - Petak komersial & properti riil: Kawasan Kos, Pasar Rakyat Tradisional, Sentra UMKM, Terminal Antarkota, Pusat Kuliner Malam, Sentra Kerajinan Nusantara, Bank Daerah, Kawasan Industri, Pusat Belanja, Pelabuhan, Kawasan CBD.
  - Petak kebijakan & acara: Peristiwa Ekonomi, Libur Tanggal Merah, Kantor Pajak Pratama.
  - Legenda pemain yang menampilkan posisi pion dan saldo terkini.
  - Panel inspeksi detail petak (klik pada petak manapun untuk melihat harga beli, hasil sewa, dan profil lokasi).
  - Uji coba simulasi lempar dadu dengan pergerakan pion melintasi papan dan pencatatan riwayat transaksi.
- [x] **Tema & Aksesibilitas**:
  - Sakelar tema Terang (default) / Gelap dengan persistensi `localStorage`.
  - Kontras teks memenuhi standar WCAG AA dengan bayangan hitam pekat neobrutalism.
- [x] **Suite Pengujian Unit (30 Pengujian)**:
  - Validasi konfigurasi game valid & invalid.
  - Integritas data papan (keberadaan petak START, keunikan ID, urutan indeks 0-15).
  - State factory game & isolasi template.
  - Deterministik RNG ter-seed.
  - Penentuan preferensi tema (default light).
  - Pemformatan mata uang Rupiah.

---

## 🚫 Batasan Fase 1 (Belum Diimplementasikan)

Sesuai spesifikasi Fase 1, fitur-fitur berikut **secara sengaja belum diimplementasikan** dan dijadwalkan untuk fase-fase berikutnya:

- Sistem pembelian properti penuh, hipotek, dan lelang tanah.
- Perhitungan hukum perpajakan riil dan bunga pinjaman bank kompleks.
- Engine kecerdasan buatan (_AI decision tree / Minimax_) tingkat lanjut untuk bot.
- Mode multiplayer online berbasis WebSocket, server, otentikasi, atau database.
- Kartu peristiwa ekonomi dinamis dengan efek permanen pada suku bunga pasar.

---

## 🚀 Panduan Memulai (Setup & Menjalankan)

### Prasyarat

- [Bun](https://bun.sh/) (v1.2+) atau Node.js (v20+).

### Instalasi Dependensi

```bash
bun install
```

### Menjalankan Server Pengembangan (Dev)

```bash
bun run dev
```

Buka peramban di `http://localhost:5173`.

### Menjalankan Pengujian Unit

```bash
bun run test
```

### Memeriksa Tipe TypeScript & Svelte

```bash
bun run check
```

### Menjalankan Linting

```bash
bun run lint
```

### Memeriksa & Memperbaiki Format Kode

```bash
bun run format:check
bun run format
```

### Membangun Versi Produksi (Build)

```bash
bun run build
bun run preview
```

---

## 🛠️ Tech Stack

- **Framework**: Svelte 5 (menggunakan Runes `$state`, `$derived`)
- **Bahasa**: TypeScript (Strict Mode)
- **Bundler & Tooling**: Vite 8, Bun
- **Styling**: Tailwind CSS v4 (@tailwindcss/vite) dengan Neobrutalism token
- **Ikonografi**: Lucide Svelte
- **Pengujian**: Vitest
- **Kualitas Kode**: ESLint (Flat Config) & Prettier
