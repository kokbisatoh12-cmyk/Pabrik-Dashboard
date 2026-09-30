# Pabrik Monitor (Vercel)

Dashboard web untuk memantau bot pabrik: status, posisi (peta + jejak), inventory, log, total panen.

## Deploy
1. Upload folder ini ke GitHub, lalu Import di vercel.com (Framework: Other). Atau `npx vercel` dari folder ini.
2. Di Vercel: Storage → tambah **Upstash Redis** (Marketplace) dan hubungkan ke project. Env `KV_REST_API_URL` / `KV_REST_API_TOKEN` otomatis terisi. Tanpa ini data disimpan di memori sementara dan bisa hilang.
3. Settings → Environment Variables:
   - `REPORT_KEY` = kunci rahasia (bebas, panjang), dipakai script Lua
   - `VIEW_PASSWORD` = password untuk membuka halaman web
4. Redeploy.

## Isi di pabrik.lua
```lua
dashboardUrl   = "https://NAMAPROJECT.vercel.app/api/report"
dashboardKey   = "sama dengan REPORT_KEY"
reportInterval = 3
```
Buka `https://NAMAPROJECT.vercel.app`, login dengan VIEW_PASSWORD.

Catatan: `dashboardKey` ada di script, jadi jangan share script yang sudah diisi.
