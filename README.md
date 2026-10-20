# Kanbify

Aplikasi manajemen tugas berbasis papan Kanban untuk tim kecil. Anggota board bisa membagi tugas, melacak waktu pengerjaan, melihat jadwal di Gantt Chart, dan menerima notifikasi aktivitas.

## Fitur

- **Autentikasi**: daftar, masuk, keluar, dan ubah profil (termasuk foto).
- **Board**: buat board, bintangi board favorit, ubah latar belakang, hapus board.
- **Undang anggota**: bagikan kode undangan, anggota lain bergabung lewat kode. Peran admin dan member; admin ditandai mahkota di samping judul board.
- **Kanban**: kolom To Do, In Progress, Done, plus Backlog. Tugas bisa di-drag antar kolom.
- **Kartu tugas**: prioritas, penanggung jawab, rentang tanggal, chip sisa waktu, dan timer play/pause di kartu In Progress.
- **Gantt Chart**: jadwal tugas dari tanggal mulai sampai deadline, dengan zoom Minggu/Bulan dan garis hari ini.
- **Files**: unggah dan unduh file per board.
- **Statistik tim**: statistik per board (distribusi status, beban per anggota, prioritas dan keterlambatan, waktu terlacak).
- **Kalender**: tugas semua board dalam tampilan bulanan.
- **Notifikasi**: lonceng di dashboard berisi aktivitas anggota (status berubah, tugas diedit atau dihapus). Ringkasannya juga dikirim ke email anggota tiap 10 menit.

## Teknologi

| Bagian | Isi |
| --- | --- |
| Frontend | React 18, Vite, Tailwind CSS, lucide-react, animejs, react-router-dom |
| Backend | Laravel 13, Laravel Sanctum |
| Database | MySQL |
| Email | Laravel Mail lewat Gmail SMTP, antrean database |

## Struktur folder

```
kanbify/
├── backend/    # API Laravel
└── frontend/   # Aplikasi React (Vite)
```

## Prasyarat

- PHP 8.3 atau lebih baru dan Composer
- Node.js 18 atau lebih baru
- MySQL

## Menjalankan backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Atur koneksi database di `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=kanbify
DB_USERNAME=root
DB_PASSWORD=
```

Lalu:

```bash
php artisan migrate
php artisan serve
```

API berjalan di `http://localhost:8000/api`.

### Notifikasi email

Notifikasi dikirim sebagai ringkasan per 10 menit. Atur di `.env`:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=emailkamu@gmail.com
MAIL_PASSWORD=app-password-gmail
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=emailkamu@gmail.com
MAIL_FROM_NAME="Kanbify"

QUEUE_CONNECTION=database
APP_FRONTEND_URL=http://localhost:5173
```

`MAIL_PASSWORD` harus berupa **App Password** Gmail, bukan kata sandi akun. Jalankan dua proses ini di terminal terpisah:

```bash
php artisan queue:work
php artisan schedule:work
```

Panduan lengkap ada di `backend/NOTIFIKASI-EMAIL.md`.

## Menjalankan frontend

```bash
cd frontend
npm install
npm run dev
```

Aplikasi terbuka di `http://localhost:5173`. Secara bawaan frontend memanggil `http://localhost:8000/api`. Untuk mengubahnya, buat `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000/api
```

Build produksi:

```bash
npm run build
```

## Endpoint API

Semua endpoint selain `auth/register` dan `auth/login` memerlukan token Sanctum.

| Kelompok | Endpoint |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Profil | `/user/profile` |
| Board | `/boards`, `/boards/{id}`, `/boards/join`, `/boards/{id}/star`, `/boards/{id}/appearance` |
| Anggota | `/boards/{id}/members`, `/boards/{id}/members/{userId}` |
| Tugas | `/boards/{id}/tasks`, `/tasks`, `/tasks/{id}` |
| File | `/boards/{id}/files`, `/boards/{id}/files/{fileId}` |
| Statistik | `/stats`, `/boards/{id}/stats` |
| Kalender | `/calendar/tasks` |
| Notifikasi | `/notifications`, `/notifications/{id}/read`, `/notifications/read-all` |

## Pemecahan masalah

- **`Table 'kanbify.board_notifications' doesn't exist`**: jalankan `php artisan migrate`.
- **Email tidak terkirim**: pastikan `queue:work` dan `schedule:work` berjalan, dan `MAIL_PASSWORD` memakai App Password.
- **Frontend gagal memanggil API**: cek `VITE_API_URL` dan pastikan backend berjalan di port yang sama.

## Lisensi

Proyek ini dibuat untuk ....
