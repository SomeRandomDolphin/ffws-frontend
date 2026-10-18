# Deployment gabungan FFWS

Susunan checkout: `ffws/frontend` dan `ffws/backend`. Backend harus memakai branch integrasi yang memuat Laravel pada root dan FastAPI di `services/monitoring-api`. Branch FastAPI lama menggantikan Laravel sehingga jangan dipakai sebagai checkout deployment gabungan.

## Persiapan

1. Backup database Laravel dan catat konfigurasi reverse proxy saat ini.
2. Pada `backend/.env`, gunakan konfigurasi Laravel yang sudah berjalan, termasuk `APP_KEY`, koneksi database, dan JWT secret. Jangan mengganti kunci aplikasi deployment yang sudah ada. Untuk instalasi Laravel baru, salin `.env.example` lalu generate kunci dan jalankan migrasi sesuai prosedur Laravel; jangan menjalankan migrasi atau seeder otomatis pada database lama.
3. Dari folder frontend jalankan (PowerShell 7):

```powershell
./scripts/initialize-stack.ps1 -WelangExcelPath '../Fix Data_Model Welang.xlsx'
```

Script membuat password arsip acak, mempertahankan password yang sudah ada, menyalin konfigurasi sensor lama bila tersedia, dan menaruh dataset Welang di folder impor. Kredensial tidak dicetak. File impor dan rahasia tidak masuk Git; kirim dataset serta konfigurasi ke operator melalui jalur privat. Pastikan format host database sensor dapat diakses dari Docker.

4. Periksa `.env.production`, `backend/.env`, serta konfigurasi sensor di service monitoring. Jangan mengubah password arsip setelah volume database dibuat tanpa prosedur rotasi akun MySQL.
5. Jalankan:

```powershell
docker compose --env-file .env.production -f compose.production.yml up -d --build
docker compose --env-file .env.production -f compose.production.yml ps
docker compose --env-file .env.production -f compose.production.yml logs --tail 50 worker
```

MySQL arsip terpisah dari database Laravel dan database sensor. Inisialisasi tabel arsip hanya memakai schema `ffws_monitoring`. Satu worker menangani ingest dan ekspor; jangan menambah replica worker tanpa implementasi penguncian pekerjaan lintas proses.

## Domain dan kompatibilitas

Frontend berupa static export dan terikat ke `127.0.0.1:3000`, FastAPI ke `127.0.0.1:8001`, dan Laravel ke `127.0.0.1:8080`. Frontend mengakses FastAPI melalui prefix same-origin `/monitoring-api`; reverse proxy host harus meneruskan prefix itu ke FastAPI sambil membuang prefix sebelum meneruskan request. Contoh Caddy:

```caddy
domain-baru.example {
  handle_path /monitoring-api/* {
    reverse_proxy 127.0.0.1:8001
  }
  handle {
    reverse_proxy 127.0.0.1:3000
  }
}
```

Teruskan domain atau prefix Laravel lama ke port 8080 sesuai konfigurasi yang sudah berjalan. Jika reverse proxy berada di container, sambungkan ke network Compose dan gunakan nama service, bukan loopback host. `NEXT_PUBLIC_MONITORING_API_URL` ditanam saat build; ubah nilainya dan build ulang jika prefix API berbeda.

Gunakan port frontend sementara ketika mengganti aplikasi lama. Cek domain HTTPS dan endpoint lama sebelum menghentikan proses lama. Untuk akses LAN langsung, ubah `FFWS_BIND_ADDRESS=0.0.0.0` dengan firewall yang sesuai.

## Pemeriksaan

- `/monitoring-api/health/ready`: backend dan schema arsip siap; jumlah stasiun dengan data tidak berarti seluruh sumber live.
- `/monitoring-api/v1/stations?region=welang`: dua stasiun dengan Excel, 13 titik tanpa data.
- `/monitoring-api/v1/capabilities`: fitur Laravel tersedia namun belum dipakai frontend baru; model/Telegram default nonaktif.
- Halaman Dhompo: tanggal historis asli 2023, grafik dan tombol unduh Excel 12 bulan.
- Halaman Surabaya: sensor/parameter sesuai arsip. Pengambilan awal dilakukan bertahap; data setahun penuh baru tersedia setelah backfill selesai. Periksa cursor dan error pada tabel `source_state` di arsip.
- Uji endpoint login, riwayat, impor dan konfigurasi stasiun Laravel memakai akun serta database yang sudah digunakan deployment lama.

Tidak ada interpolasi data kosong, prakiraan simulasi, atau ambang demo pada halaman monitoring baru. Grafik bisa diringkas; workbook berisi catatan sumber asli termasuk provenance API/Excel. RC/RL merupakan pos hujan Cendono/Lawang dan tidak otomatis dianggap hujan pada stasiun muka air.

## Operasional

Acuan tinggi sensor dan perhitungan tinggi air dikelola FastAPI melalui `services/monitoring-api/configs/surabaya/live_sources.yaml`. FE membaca `referenceCm`, `waterLevelCm`, dan `capacityPercent` dari API. Untuk mengubah acuan, perbarui konfigurasi dan build ulang backend; arsip mentah serta ekspor tidak berubah. Deploy backend terbaru sebelum frontend agar field kalibrasi tersedia.

Untuk menjalankan hasil build frontend di luar Docker: `npm run build`, lalu `npm start`. Server ini hanya menyajikan file statis; path API tetap perlu diteruskan reverse proxy. Port alternatif di PowerShell: `$env:PORT='3103'; npm start`.

Pembaruan Excel: salin file baru sebagai `services/monitoring-api/imports/welang.xlsx`; worker mendeteksi checksum baru pada siklus berikutnya. Impor ulang manual:

```powershell
docker compose --env-file .env.production -f compose.production.yml exec worker python -m monitoring.worker import-excel --path /app/imports/welang.xlsx
```

Impor file yang sama tidak menggandakan data. Tabel `import_batches` berisi jumlah baris dan nomor baris gagal. Data yang valid sebelum kegagalan dapat tersimpan; impor ulang aman karena upsert memakai identitas pengamatan.

API Welang opsional mengikuti kontrak `records` pada dokumentasi backend. Simpan token di environment; jangan di frontend. Setelah mengubah environment, gunakan `up -d` agar container dibuat ulang.

Ekspor dibuat worker, berlaku 24 jam, dan dibersihkan pada siklus worker. Arsip pengamatan tidak dihapus otomatis. Pantau kapasitas volume MySQL. Buat backup rutin dengan `mysqldump --single-transaction` melalui akun backup/server, simpan ke lokasi di luar volume Docker, dan uji restore ke database terpisah sebelum cutover. Backup dataset impor dan konfigurasi privat secara terpisah.

Contoh backup arsip dari PowerShell 7 (password tetap berada di environment container):

```powershell
New-Item -ItemType Directory -Force backups | Out-Null
docker compose --env-file .env.production -f compose.production.yml exec -T archive-db sh -c 'MYSQL_PWD="$MYSQL_PASSWORD" mysqldump --no-tablespaces --single-transaction -uarchive "$MYSQL_DATABASE"' | Out-File -Encoding utf8 backups/archive.sql
```

Uji restore pada project Compose terpisah, yang membuat volume database baru:

```powershell
docker compose --env-file .env.production -f compose.production.yml -p ffws-restore up -d archive-db
# Tunggu archive-db sehat sebelum mengimpor.
Get-Content -Raw backups/archive.sql | docker compose --env-file .env.production -f compose.production.yml -p ffws-restore exec -T archive-db sh -c 'MYSQL_PWD="$MYSQL_PASSWORD" mysql -uarchive "$MYSQL_DATABASE"'
docker compose --env-file .env.production -f compose.production.yml -p ffws-restore exec -T archive-db sh -c 'MYSQL_PWD="$MYSQL_PASSWORD" mysql -uarchive "$MYSQL_DATABASE" -e "SELECT COUNT(*) FROM observations"'
docker compose --env-file .env.production -f compose.production.yml -p ffws-restore down
```

Update: pull kedua repository, backup, lalu `up -d --build`. Rollback: checkout commit frontend/backend sebelumnya dan build ulang; jangan menjalankan `down -v`, menghapus volume, atau membalikkan migrasi database Laravel. Database arsip hanya menambah tabel dan disimpan pada volume `archive_mysql`.
