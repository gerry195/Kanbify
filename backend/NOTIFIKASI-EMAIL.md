# Notifikasi & email aktivitas board

## Yang ditambahkan
- Tabel `board_notifications` (migrasi `2026_10_19_000001`).
- `NotificationService`: membuat notifikasi untuk semua anggota board kecuali pelaku.
- Hook di `TaskController`: status berubah, tugas diedit (judul, deskripsi, prioritas,
  deadline, tanggal mulai, anggota), tugas dihapus. Timer (`time`, `is_running`) diabaikan.
- Endpoint:
  - `GET  /api/notifications`            -> `{ unread, items[] }`
  - `PUT  /api/notifications/{id}/read`
  - `PUT  /api/notifications/read-all`
- Email ringkasan: `php artisan notifications:send-digest`, dijadwalkan tiap 10 menit.

## Langkah pasang
1. `php artisan migrate`
2. Isi `.env` untuk Gmail SMTP (buat App Password di akun Google, 2-Step Verification harus aktif):

```
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SCHEME=null
MAIL_USERNAME=alamat-gmail-kamu@gmail.com
MAIL_PASSWORD=app-password-16-karakter
MAIL_FROM_ADDRESS=alamat-gmail-kamu@gmail.com
MAIL_FROM_NAME="Kanbify"
FRONTEND_URL=http://localhost:5173
```

3. Jalankan scheduler (email digest tidak jalan tanpa ini):
   - dev: `php artisan schedule:work`
   - server: cron `* * * * * cd /path/ke/proyek && php artisan schedule:run >> /dev/null 2>&1`
4. Uji manual tanpa menunggu 10 menit: `php artisan notifications:send-digest`
   (dengan `MAIL_MAILER=log`, isi email tertulis di `storage/logs/laravel.log`).

## Catatan
- Foto profil disimpan sebagai data URI base64, dan klien email memblokirnya.
  Email memakai lingkaran berisi inisial. Foto asli tampil di panel lonceng.
- Batas Gmail sekitar 500 email per hari. Digest 10 menit menjaga jumlahnya kecil.
