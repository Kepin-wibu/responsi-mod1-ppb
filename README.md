# 📚 REST API Layanan Pencatatan Peminjaman Buku Perpustakaan

## Kevin Nibras Kusuma

Backend REST API sederhana untuk mengelola layanan perpustakaan, meliputi pencatatan peminjaman buku oleh anggota, manajemen data buku, manajemen anggota, serta fitur filter status peminjaman.

---

## 📌 Deskripsi Umum & Tujuan Proyek

Proyek ini dibangun sebagai solusi digital pencatatan dan pengelolaan transaksi peminjaman buku perpustakaan. API ini memungkinkan petugas atau sistem aplikasi perpustakaan untuk:
- Mengelola data anggota perpustakaan (CRUD Anggota).
- Mengelola katalog buku dan jumlah stok (CRUD Buku).
- Mencatat transaksi peminjaman dan pengembalian buku (CRUD Peminjaman).
- Menyaring/filter data peminjaman berdasarkan status (misal: `Dipinjam`, `Dikembalikan`, `Terlambat`) melalui query parameter (`GET /api/loans?status=Terlambat`).

---

## 🛠️ Tech Stack & Arsitektur

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel (Serverless Functions)
- **Middleware / Utilities**: Cors, Helmet, Morgan, Dotenv, `@supabase/supabase-js`

---

## 🔗 Link Hasil Deployment Vercel

🌐 **Live API URL**: [https://library-loan-api.vercel.app](https://library-loan-api.vercel.app) *(Ganti dengan URL Vercel setelah Anda melakukan deploy)*  
🔗 **Repository GitHub**: [https://github.com/username/library-loan-api](https://github.com/username/library-loan-api)

---

## 🗄️ Struktur Data & Schema Database (Supabase / PostgreSQL)

Skema database terdiri dari 3 tabel utama yang saling berrelasi (`members`, `books`, dan `loans`). Skema lengkap tersedia pada file [`schema.sql`](file:///home/haidar/Documents/kuliah/library-loan-api/schema.sql).

### 1. Tabel `members` (Anggota Perpustakaan)
| Field | Tipe Data | Keterangan |
|---|---|---|
| `id` | UUID | Primary Key (Default: `gen_random_uuid()`) |
| `name` | VARCHAR(255) | Nama lengkap anggota (Required) |
| `email` | VARCHAR(255) | Email unik anggota (Required, Unique) |
| `phone` | VARCHAR(50) | Nomor telepon anggota |
| `created_at` | TIMESTAMPTZ | Waktu pendaftaran |

### 2. Tabel `books` (Katalog Buku)
| Field | Tipe Data | Keterangan |
|---|---|---|
| `id` | UUID | Primary Key (Default: `gen_random_uuid()`) |
| `title` | VARCHAR(255) | Judul buku (Required) |
| `author` | VARCHAR(255) | Penulis buku (Required) |
| `isbn` | VARCHAR(50) | Kode ISBN unik (Optional, Unique) |
| `stock` | INT | Jumlah stok tersedia (Default: `1`) |
| `created_at` | TIMESTAMPTZ | Waktu ditambahkan |

### 3. Tabel `loans` (Transaksi Peminjaman)
| Field | Tipe Data | Keterangan |
|---|---|---|
| `id` | UUID | Primary Key (Default: `gen_random_uuid()`) |
| `member_id` | UUID | Foreign Key -> `members.id` (ON DELETE CASCADE) |
| `book_id` | UUID | Foreign Key -> `books.id` (ON DELETE CASCADE) |
| `borrow_date` | DATE | Tanggal peminjaman (Default: `CURRENT_DATE`) |
| `due_date` | DATE | Tanggal batas pengembalian (Required) |
| `return_date` | DATE | Tanggal buku dikembalikan (Nullable) |
| `status` | VARCHAR(50) | Status: `'Dipinjam'`, `'Dikembalikan'`, `'Terlambat'` |
| `notes` | TEXT | Catatan tambahan |
| `created_at` | TIMESTAMPTZ | Waktu dibuat |
| `updated_at` | TIMESTAMPTZ | Waktu diperbarui |

---

## 🚀 Panduan Instalasi & Cara Menjalankan Lokal

### 1. Prasyarat
- Node.js versi 18 atau lebih baru.
- Akun Supabase (untuk database PostgreSQL).

### 2. Langkah-langkah
1. **Clone Repository**:
   ```bash
   git clone https://github.com/username/library-loan-api.git
   cd library-loan-api
   ```

2. **Install Dependensi**:
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variable**:
   Salin file `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   Isi file `.env` dengan kredensial Supabase Anda:
   ```env
   PORT=3000
   SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_KEY=<your-supabase-anon-key>
   ```

4. **Setup Database Supabase**:
   - Buka SQL Editor di Dashboard Supabase Anda.
   - Salin dan jalankan seluruh isi file [`schema.sql`](file:///home/haidar/Documents/kuliah/library-loan-api/schema.sql).

5. **Jalankan Server Lokal**:
   ```bash
   # Mode Development
   npm run dev

   # atau Mode Production
   npm start
   ```
   Server akan berjalan di: `http://localhost:3000`

---

## 📖 Dokumentasi Endpoint API (Request & Response)

### 1. Peminjaman Buku (Loans)

#### A. Menampilkan Seluruh Peminjaman & Filter Query
- **Endpoint**: `GET /api/loans`
- **Query Parameter**:
  - `status` *(opsional)*: Filter berdasarkan status (`Dipinjam`, `Dikembalikan`, `Terlambat`)
  - `member_id` *(opsional)*: Filter berdasarkan UUID anggota
  - `book_id` *(opsional)*: Filter berdasarkan UUID buku
- **Contoh Request Filter Status Terlambat**:
  ```http
  GET /api/loans?status=Terlambat HTTP/1.1
  Host: localhost:3000
  ```
- **Contoh Response (200 OK)**:
  ```json
  {
    "success": true,
    "count": 1,
    "filtersApplied": {
      "status": "Terlambat",
      "member_id": null,
      "book_id": null
    },
    "data": [
      {
        "id": "f2222222-2222-2222-2222-222222222222",
        "borrow_date": "2026-10-01",
        "due_date": "2026-10-07",
        "return_date": null,
        "status": "Terlambat",
        "notes": "Peminjaman terlambat belum dikembalikan",
        "created_at": "2026-10-01T10:00:00.000Z",
        "updated_at": "2026-10-08T00:00:00.000Z",
        "member": {
          "id": "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
          "name": "Siti Rahma",
          "email": "siti@example.com",
          "phone": "089876543210"
        },
        "book": {
          "id": "22222222-2222-2222-2222-222222222222",
          "title": "Bumi Manusia",
          "author": "Pramoedya Ananta Toer",
          "isbn": "978-979-97312-3-4"
        }
      }
    ]
  }
  ```

#### B. Menampilkan Detail Peminjaman
- **Endpoint**: `GET /api/loans/:id`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "f1111111-1111-1111-1111-111111111111",
      "borrow_date": "2026-10-07",
      "due_date": "2026-10-14",
      "return_date": null,
      "status": "Dipinjam",
      "notes": "Peminjaman reguler",
      "member": {
        "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        "name": "Budi Santoso",
        "email": "budi@example.com"
      },
      "book": {
        "id": "11111111-1111-1111-1111-111111111111",
        "title": "Laskar Pelangi",
        "author": "Andrea Hirata"
      }
    }
  }
  ```

#### C. Mencatat Peminjaman Baru (Create)
- **Endpoint**: `POST /api/loans`
- **Request Body**:
  ```json
  {
    "member_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "book_id": "11111111-1111-1111-1111-111111111111",
    "due_date": "2026-10-20",
    "notes": "Peminjaman untuk tugas kuliah"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Transaksi peminjaman buku berhasil dicatat.",
    "data": {
      "id": "d4e5f6a7-8901-2345-6789-0123456789ab",
      "member_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "book_id": "11111111-1111-1111-1111-111111111111",
      "borrow_date": "2026-10-10",
      "due_date": "2026-10-20",
      "return_date": null,
      "status": "Dipinjam",
      "notes": "Peminjaman untuk tugas kuliah",
      "created_at": "2026-10-10T15:30:00.000Z",
      "updated_at": "2026-10-10T15:30:00.000Z"
    }
  }
  ```

#### D. Memperbarui Status / Pengembalian Buku (Update)
- **Endpoint**: `PUT /api/loans/:id`
- **Request Body (Mengembalikan Buku)**:
  ```json
  {
    "status": "Dikembalikan",
    "notes": "Buku dikembalikan dalam kondisi baik"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data peminjaman berhasil diperbarui.",
    "data": {
      "id": "d4e5f6a7-8901-2345-6789-0123456789ab",
      "status": "Dikembalikan",
      "return_date": "2026-10-10",
      "notes": "Buku dikembalikan dalam kondisi baik"
    }
  }
  ```

#### E. Menghapus Data Peminjaman (Delete)
- **Endpoint**: `DELETE /api/loans/:id`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Data peminjaman berhasil dihapus."
  }
  ```

---

### 2. Anggota (Members) & Buku (Books)

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/members` | Menampilkan seluruh anggota |
| `POST` | `/api/members` | Menambah anggota baru |
| `GET` | `/api/books` | Menampilkan katalog buku |
| `POST` | `/api/books` | Menambah buku baru ke katalog |

---

## ☁️ Panduan Deployment ke Vercel

Proyek ini telah dikonfigurasi untuk deployment ke **Vercel** menggunakan Vercel Serverless Function (`vercel.json` dan `api/index.js`).

### Langkah Deployment via Vercel CLI:
1. Install Vercel CLI (jika belum):
   ```bash
   npm i -g vercel
   ```
2. Login ke akun Vercel:
   ```bash
   vercel login
   ```
3. Deploy ke Vercel:
   ```bash
   vercel
   ```
4. Tambahkan Environment Variable di Vercel Dashboard (Project Settings -> Environment Variables):
   - `SUPABASE_URL` = `<URL_SUPABASE_ANDA>`
   - `SUPABASE_KEY` = `<ANON_KEY_SUPABASE_ANDA>`
5. Redeploy project untuk menerapkan variabel lingkungan:
   ```bash
   vercel --prod
   ```

---

## 📄 Lisensi

ISC License.
# responsi-mod1-ppb
