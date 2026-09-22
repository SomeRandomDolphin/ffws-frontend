# ITS Water Dashboard frontend

Frontend Next.js untuk pemantauan sumber daya air DAS Welang dan Surabaya. Data stasiun Welang, riwayat, prakiraan, hujan, dan kualitas air saat ini bersifat simulasi deterministik. Endpoint `/api/surabaya` meneruskan pembacaan dari sumber yang dikonfigurasi aplikasi dan mempertahankan status sumber ketika data live tidak tersedia.

## Menjalankan secara lokal

```powershell
npm ci
npm run dev
```

Buka `http://localhost:3000`. Peta dimulai dari cakupan Jawa Timur dan dapat difokuskan ke DAS Welang atau Surabaya. Pencarian memilih dan memusatkan stasiun; pemilihan marker membuka pembacaan, status, serta tautan detail.

Jika basemap utama gagal atau memerlukan lebih dari 10 detik untuk dimuat, peta beralih ke OpenTopoMap. Gunakan “Coba muat peta lagi” setelah koneksi pulih. Pemulihan basemap tidak mengatur ulang stasiun atau posisi kamera yang dipilih.

Warna status dan data deterministik Welang berasal dari `src/lib/demo-data.ts`. Data stasiun berada di `public/data`, sedangkan batas wilayah dan jaringan sungai berada di `public/geo`. Nilai sensor Welang tetap berupa simulasi dan tidak memerlukan backend.

## Production build

```powershell
npm run build
```

`Dockerfile` membangun output standalone Next.js dan menjalankannya dengan `node server.js` pada port 3000.

## Struktur presentasi

Token bersama, tipografi, kontrol, dan gaya detail stasiun berada di `src/app/globals.css`. Tata letak dashboard dan antarmuka peta berada di `src/app/map-dashboard.css`. Ikon menggunakan SVG lokal tanpa dependency ikon tambahan.

Label stasiun menggunakan deteksi benturan dan memprioritaskan stasiun terpilih. Marker tetap dapat difokuskan dengan keyboard dan dicari ketika label disembunyikan. Preferensi reduced motion menonaktifkan animasi yang tidak diperlukan.

## Verifikasi

Jalankan `npm run build`, lalu periksa browser pada lebar 375, 768, dan 1440px. Periksa navigasi keyboard, pencarian dan pemilihan stasiun, penutupan panel dengan Escape, kontrol lapisan, navigasi halaman detail, reduced motion, serta error console.
