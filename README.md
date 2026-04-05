# Gawean

Gawean adalah aplikasi workspace all-in-one yang mirip dengan Notion, dibangun menggunakan React, TypeScript, Tailwind CSS, Zustand, dan Supabase.

## Fitur yang Tersedia
- **Hierarchical Task Management**: Mendukung penambahan sub-item secara rekursif (bertingkat) ke dalam baris tabel seperti Notion.
- **Database Table View**: Dilengkapi dengan berbagai jenis properti kolom (Teks, Select, Status, Tanggal).
- **Properti Manajemen**: Bisa edit nama kolom, duplikat, pindah, dsb. Tersedia fitur panel Visibilitas Properti ("⋯") untuk men-toggle / sembunyikan kolom-kolom pada tabel.
- **Responsive & Full-width**: Tata letak responsif disesuaikan dengan Notion. Halaman tabel menggunakan lebah penuh (`max-w-full`).
- **Slash Commands & Block Editor**: Bisa menulis teks, judul (Heading), serta daftar tugas memakai slash `/`.
- **UI/UX Premium**: Memakai visual yang elegan (dark-mode ready, glassmorphism, animasi mulus).
- **App Sidebar**: Terdapat manajemen tree direktori halaman secara terstruktur.

## HAL YANG TERAKHIR DIBUAT (Namun Belum Sepenuhnya Berjalan)
- **Integrasi Supabase Auth & Database (RLS)**: Aplikasi ini telah sepenuhnya di-refactor *store*-nya (Zustand) untuk menyimpan langsung ke backend Supabase (`properties`, `pages`, `database_views`, `property_values`).
- Terdapat gerbang authentikasi login & sign-up (`App.tsx` Gate) menggunakan `@supabase/supabase-js`.
- File Skema database tersedia di `supabase-schema.sql`.

### ISSUE TERAKHIR (Belum Bisa)
Bagian pendaftaran user baru (Sign-Up / Auth) **Gagal / Menghasilkan Error 500 (Database error saving new user)**. Error ini disebabkan oleh kegagalan trigger PostgreSQL bawaan (`on_auth_user_created`) yang gagal mengeksekusi `create_seed_data_for_user()`. Kegagalan memicu rollback sehingga akun pun akhirnya tidak bisa terbuat. 

*Workaround/Next Step:* Skema PostgreSQL tabel dan trigger di Supabase mungkin perlu dipasang secara manual/diperiksa lagi di SQL editor Supabase dashboard untuk memastikan tidak ada konflik publikasi realtime atau dependensi relasi yang membuat pendaftaran user baru menjadi crash.

---
## Menjalankan Proyek di Lokal

1. Instalasi Node.js (Vite)
2. `npm install`
3. Gunakan `npm run dev` untuk menjalankan server di lokal (http://localhost:5173).
