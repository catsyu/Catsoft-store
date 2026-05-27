# Catsoft Email Inbox Setup

Cloudflare Email Routing biasa hanya meneruskan email ke mailbox tujuan. Agar email bisa muncul di `email-inbox.html`, email masuk perlu ditangkap oleh Email Worker lalu disimpan ke database.

## File yang dipakai

- `email-inbox.html`, `email-inbox.css`, `email-inbox.js`: halaman admin inbox.
- `customer-database.html`, `customer-database.css`, `customer-database.js`: halaman admin customer yang sync ke D1 dan tetap punya backup lokal browser.
- `office-activation.html`, `office-activation.css`, `office-activation.js`: halaman admin aktivasi Office dari screenshot Installation ID.
- `cloudflare-email-worker.example.js`: contoh Worker untuk menerima email, menyimpan email/customer, API list/detail, dan forward ulang ke Gmail.
- `cloudflare-email-schema.sql`: schema D1 untuk tabel email dan customer.

## Alur data

1. Email masuk ke alamat seperti `Chatgpt@catsoft.store`.
2. Cloudflare Email Routing mengirim email itu ke Email Worker.
3. Worker menyimpan metadata, isi email, kategori, dan OTP ke D1.
4. Worker tetap meneruskan email ke `FORWARD_TO`, jadi Gmail tujuan tetap menerima email.
5. `email-inbox.html` membaca API `/api/email-messages`.

## Menambahkan domain lain

Untuk `catsoft.digital` dan `catsoft.online`, pakai Worker dan D1 yang sama:

1. Pastikan domain `catsoft.digital` dan `catsoft.online` sudah ada sebagai zone di Cloudflare.
2. Buka masing-masing domain > Email Routing.
3. Enable Email Routing dan ikuti instruksi DNS sampai status DNS configured.
4. Buka Routing rules.
5. Aktifkan Catch-All.
6. Set action Catch-All ke `Send to a Worker`.
7. Pilih Worker `mail-base-all-catch`.
8. Kirim email test ke alamat seperti `test@catsoft.digital` dan `test@catsoft.online`.
9. Buka `https://catsoft.store/api/email-messages/health`; angka `total` harus naik.

Tidak perlu membuat D1 baru. Selama semua domain diarahkan ke Worker `mail-base-all-catch`, semua email akan masuk ke tabel `email_messages` yang sama. Page inbox sudah bisa difilter per domain: `catsoft.store`, `catsoft.digital`, dan `catsoft.online`.

## Agar data up-to-date

- Worker harus menjadi tujuan catch-all atau custom address di Cloudflare Email Routing.
- API `/api/email-messages*` harus dilayani Worker, bukan file static.
- Response API sudah memakai `Cache-Control: no-store` di contoh Worker.
- `email-inbox.js` auto-refresh setiap 15 detik saat tab aktif, refresh lagi saat tab dibuka, dan menambahkan cache-buster pada request.
- Jika route API berada di belakang Cloudflare Cache Rules, pastikan path `/api/email-messages*` di-bypass dari cache.
- Untuk Customer Database, route `/api/customer-records*` juga harus diarahkan ke Worker dan di-bypass dari cache.
- Untuk Office Activation, route `/api/office-confirmation*` juga harus diarahkan ke Worker dan di-bypass dari cache.

## Jika email test tidak muncul di inbox

Cek urut dari belakang:

1. Buka `https://catsoft.store/api/email-messages`.
2. Jika hasilnya 404, route HTTP `/api/email-messages*` belum diarahkan ke Worker.
   Untuk sinkron akses admin lintas device, route `/api/admin-accounts*` juga harus menuju Worker yang sama.
3. Jika hasilnya 401, API terkunci. Aktifkan Cloudflare Access untuk route itu, atau sementara set variable `ALLOW_UNAUTHENTICATED_API = "true"` hanya untuk testing.
4. Jika hasilnya 500, buka Worker Logs dan cek D1 binding `EMAIL_DB` serta apakah schema sudah dijalankan.
5. Jika hasilnya `{"emails":[]}`, Worker API sudah hidup, tapi email belum tersimpan. Cek apakah Worker email memakai kode `cloudflare-email-worker.example.js`, bukan starter Worker kosong.
6. Di D1 Console, jalankan `SELECT COUNT(*) FROM email_messages;` untuk memastikan email benar-benar masuk database.

Jika health check sudah `ok:true` tetapi `total` tetap 0 setelah mengirim email baru:

1. Buka Email Routing > Routing rules.
2. Pastikan Catch-All destination benar-benar Worker `mail-base-all-catch`, bukan worker lama.
3. Buka Worker `mail-base-all-catch` > Observability > Logs.
4. Kirim email baru ke `test@catsoft.store`.
5. Log yang benar harus muncul berurutan:
   - `Incoming email received`
   - `Incoming email saved`
   - `Incoming email forwarded`
6. Jika tidak ada `Incoming email received`, email belum masuk ke Worker. Perbaiki Catch-All Email Routing.
7. Jika ada `Incoming email received` tapi tidak ada `Incoming email saved`, lihat error D1 di log.
8. Jika ada `Incoming email saved` tapi tidak ada `Incoming email forwarded`, cek variable `FORWARD_TO`.

## Checklist Cloudflare untuk `mail-base-all-catch`

1. Buka Worker `mail-base-all-catch`.
2. Deploy isi `cloudflare-email-worker.example.js` ke Worker itu.
3. Buka Settings > Variables.
4. Tambahkan variable `FORWARD_TO` dengan isi email Gmail tujuan, contoh `cundigitora@gmail.com`.
5. Untuk testing sementara, tambahkan variable `ALLOW_UNAUTHENTICATED_API` dengan isi `true`.
6. Buka Settings > Bindings.
7. Tambahkan D1 database binding:
   - Variable name: `EMAIL_DB`
   - D1 database: pilih database inbox yang sudah dibuat.
8. Jika Customer Database memakai D1 terpisah seperti `catsoft-customer-db`, tambahkan binding kedua:
   - Variable name: `CUSTOMER_DB`
   - D1 database: `catsoft-customer-db`
   Jika tidak memakai D1 terpisah, cukup jalankan tabel `customer_records` di database yang terikat ke `EMAIL_DB`.
9. Buka Triggers atau Workers Routes.
10. Tambahkan route HTTP:
   - Route: `catsoft.store/api/email-messages*`
   - Route: `www.catsoft.store/api/email-messages*`
   - Worker: `mail-base-all-catch`
11. Tambahkan route HTTP kedua untuk Customer Database:
   - Route: `catsoft.store/api/customer-records*`
   - Route: `www.catsoft.store/api/customer-records*`
   - Worker: `mail-base-all-catch`
12. Tambahkan route HTTP ketiga untuk aktivasi Office:
   - Route: `catsoft.store/api/office-confirmation*`
   - Route: `www.catsoft.store/api/office-confirmation*`
   - Worker: `mail-base-all-catch`
13. Tambahkan route HTTP keempat untuk sinkron akun admin:
   - Route: `catsoft.store/api/admin-accounts*`
   - Route: `www.catsoft.store/api/admin-accounts*`
   - Worker: `mail-base-all-catch`
14. Buka Email Routing > Routing rules.
15. Pastikan Catch-All action menuju Worker `mail-base-all-catch`.
16. Buka `https://catsoft.store/api/email-messages/health`, `https://catsoft.store/api/customer-records/health`, dan `https://catsoft.store/api/admin-accounts`.

Jika ingin domain lain seperti `catsoft.digital`, `catsoft.online`, atau subdomain `www`-nya memakai D1 yang sama, arahkan route API domain tersebut ke Worker yang sama dan jangan buat binding D1 baru. Contoh:

- `catsoft.digital/api/email-messages*`
- `catsoft.digital/api/customer-records*`
- `catsoft.digital/api/admin-accounts*`
- `catsoft.online/api/email-messages*`
- `catsoft.online/api/customer-records*`
- `catsoft.online/api/admin-accounts*`

Hasil health check:

- `{"ok":true,"database":"connected","total":0}` berarti API dan D1 sudah tersambung.
- `Missing EMAIL_DB D1 binding` berarti binding D1 belum bernama `EMAIL_DB`.
- `no such table: email_messages` berarti schema belum dijalankan ke D1.
- `Unauthorized` berarti `ALLOW_UNAUTHENTICATED_API` belum `true` atau belum pakai Cloudflare Access.

Jika log menampilkan `Failed to save incoming email to D1`, buka detail log dan lihat error lengkapnya. Error yang sering terjadi:

- `no column named ...`: tabel lama sudah ada tapi kolom belum lengkap. Jalankan `ALTER TABLE` yang ada di bagian bawah `cloudflare-email-schema.sql` hanya untuk kolom yang belum ada.
  Untuk sinkron read/delete email lintas device, pastikan kolom `email_messages.deleted_at` sudah ada di database binding `EMAIL_DB`. Untuk sinkron admin, pastikan tabel `admin_accounts` sudah ada di database binding `ADMIN_DB`.
- `too large`: ukuran email terlalu besar. Worker sudah membatasi body yang disimpan, deploy ulang Worker terbaru.
- `NOT NULL constraint failed`: schema tabel tidak sama dengan schema terbaru.

## Contoh `wrangler.toml`

```toml
name = "mail-base-all-catch"
main = "cloudflare-email-worker.example.js"
compatibility_date = "2026-05-25"

routes = [
  { pattern = "catsoft.store/api/email-messages*", zone_name = "catsoft.store" },
  { pattern = "www.catsoft.store/api/email-messages*", zone_name = "catsoft.store" },
  { pattern = "catsoft.store/api/customer-records*", zone_name = "catsoft.store" },
  { pattern = "www.catsoft.store/api/customer-records*", zone_name = "catsoft.store" },
  { pattern = "catsoft.store/api/office-confirmation*", zone_name = "catsoft.store" },
  { pattern = "www.catsoft.store/api/office-confirmation*", zone_name = "catsoft.store" },
  { pattern = "catsoft.store/api/admin-accounts*", zone_name = "catsoft.store" },
  { pattern = "www.catsoft.store/api/admin-accounts*", zone_name = "catsoft.store" },

  { pattern = "catsoft.digital/api/email-messages*", zone_name = "catsoft.digital" },
  { pattern = "www.catsoft.digital/api/email-messages*", zone_name = "catsoft.digital" },
  { pattern = "catsoft.digital/api/customer-records*", zone_name = "catsoft.digital" },
  { pattern = "www.catsoft.digital/api/customer-records*", zone_name = "catsoft.digital" },
  { pattern = "catsoft.digital/api/office-confirmation*", zone_name = "catsoft.digital" },
  { pattern = "www.catsoft.digital/api/office-confirmation*", zone_name = "catsoft.digital" },
  { pattern = "catsoft.digital/api/admin-accounts*", zone_name = "catsoft.digital" },
  { pattern = "www.catsoft.digital/api/admin-accounts*", zone_name = "catsoft.digital" },

  { pattern = "catsoft.online/api/email-messages*", zone_name = "catsoft.online" },
  { pattern = "www.catsoft.online/api/email-messages*", zone_name = "catsoft.online" },
  { pattern = "catsoft.online/api/customer-records*", zone_name = "catsoft.online" },
  { pattern = "www.catsoft.online/api/customer-records*", zone_name = "catsoft.online" },
  { pattern = "catsoft.online/api/office-confirmation*", zone_name = "catsoft.online" },
  { pattern = "www.catsoft.online/api/office-confirmation*", zone_name = "catsoft.online" },
  { pattern = "catsoft.online/api/admin-accounts*", zone_name = "catsoft.online" },
  { pattern = "www.catsoft.online/api/admin-accounts*", zone_name = "catsoft.online" }
]

[[d1_databases]]
binding = "EMAIL_DB"
database_name = "email-db"
database_id = "ISI_DATABASE_ID_D1"

[[d1_databases]]
binding = "CUSTOMER_DB"
database_name = "catsoft-customer-db"
database_id = "ISI_DATABASE_ID_D1_CUSTOMER"

[[d1_databases]]
binding = "ADMIN_DB"
database_name = "admin_accounts"
database_id = "ISI_DATABASE_ID_D1_ADMIN"

[vars]
FORWARD_TO = "cundigitora@gmail.com"
```

## Langkah deploy ringkas

1. Buat D1 database di Cloudflare untuk email, customer, dan admin.
2. Jalankan schema `cloudflare-email-schema.sql` ke D1. Jika memakai database terpisah seperti `EMAIL_DB`, `CUSTOMER_DB`, dan `ADMIN_DB`, pastikan tabel yang sesuai ada di masing-masing database.
3. Deploy Worker dengan binding `EMAIL_DB`, `CUSTOMER_DB`, `ADMIN_DB`, dan variable `FORWARD_TO`.
4. Lindungi route `/api/email-messages*` dengan Cloudflare Access, atau set secret `INBOX_API_TOKEN`.
5. Lindungi route `/api/office-confirmation*` dengan Cloudflare Access yang sama, atau gunakan mode testing `ALLOW_UNAUTHENTICATED_API = "true"`.
6. Di Cloudflare Email Routing, ubah catch-all atau custom address agar action-nya menuju Email Worker `mail-base-all-catch`.

## Perintah menjalankan schema D1

Jika memakai Wrangler:

```bash
wrangler d1 execute email-db --remote --file=cloudflare-email-schema.sql
```

Ganti `email-db` dengan nama D1 database yang dibuat di Cloudflare jika namanya berbeda. Untuk setup tiga database terpisah, jalankan schema yang relevan ke database email, customer, dan admin, atau deploy Worker terbaru agar tabel `admin_accounts` dan kolom `deleted_at` dibuat otomatis saat endpoint dipanggil.

Jika lewat Dashboard Cloudflare:

1. Buka Workers & Pages.
2. Buka D1.
3. Pilih database inbox.
4. Buka Console.
5. Paste isi `cloudflare-email-schema.sql`.
6. Jalankan query.

Untuk mode sementara, `email-inbox.html` akan menampilkan data demo jika API belum tersambung.
