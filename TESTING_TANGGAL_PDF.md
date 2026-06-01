# Testing Guide - Tanggal di PDF

## Perubahan yang Sudah Dilakukan

### 1. Backend (BookingController.php)
✅ Tambahan fallback untuk tanggal PDF:
```php
// Urutan prioritas:
1. status_updated_at (kapan kepala setuju)
2. updated_at (kapan booking terakhir diupdate)
3. created_at (kapan booking dibuat)
4. Carbon::now() (hari ini)
```

### 2. Frontend Kepala (VerifikasiKepala.js & LihatHasilPdfKepala.js)
✅ Ketika kepala klik "Setuju", frontend sekarang mengirim:
```javascript
{
  status: "menunggu_ttd_koordinator",
  status_updated_at: new Date().toISOString()
}
```

### 3. Backend (updateStatus method)
✅ Backend menerima `status_updated_at` dari frontend dan menyimpannya ke database

---

## Cara Testing

### Step 1: Reset Data (Optional)
Jika ingin test dari awal dengan data bersih:

```bash
cd silab-laravel
php artisan reset:verifikasi-kepala
```

### Step 2: Workflow Testing

#### A. Login sebagai **Teknisi**
1. Approve booking yang masuk
2. Isi hasil analisis
3. Kirim ke Koordinator (status → `menunggu_verifikasi`)

#### B. Login sebagai **Koordinator** 
1. Buka **Verifikasi Sampel Koordinator**
2. Lihat PDF (harus sudah ada data hasil)
3. Klik **"Kirim ke Kepala"** (status → `menunggu_verifikasi_kepala`)

#### C. Login sebagai **Kepala Lab** 
1. Buka **Verifikasi Kepala**
2. Klik **"Setuju"** pada salah satu booking
   - ⚠️ **PENTING**: Saat klik ini, sistem akan:
     - Set `status = menunggu_ttd_koordinator`
     - Set `status_updated_at = <timestamp sekarang>`
3. Status berubah jadi `menunggu_ttd_koordinator`

#### D. Login sebagai **Koordinator** (Tanda Tangan)
1. Buka **Tanda Tangan Digital**
2. Booking yang tadi disetujui kepala harus muncul
3. Klik **"Lihat"**
4. **Modal preview harus menampilkan**:
   - ✅ Tanggal Verifikasi: **DD/MM/YYYY** (bukan **/**/****)
   - ✅ PDF preview dengan tanggal yang benar di header
5. Klik **"Download"** untuk simpan PDF
6. Buka PDF yang didownload, cek bagian:
   ```
   Kepada Yth.             Tanggal: DD/MM/YYYY
   [Nama Klien]
   Di Tempat
   ```
   Tanggal harus **terisi dengan benar**, bukan **/**/****

---

## Troubleshooting

### Masalah 1: Tanggal masih menampilkan **/**/**
**Penyebab**:
- `status_updated_at` belum tersimpan di database
- Booking belum pernah di-approve oleh Kepala setelah perubahan kode ini

**Solusi**:
1. Logout dan login ulang
2. Test ulang dari step Kepala → klik "Setuju"
3. Atau jalankan manual update di database:
   ```sql
   UPDATE bookings 
   SET status_updated_at = NOW() 
   WHERE status = 'menunggu_ttd_koordinator';
   ```

### Masalah 2: Modal preview tidak muncul
**Penyebab**:
- Booking belum ada di filter status yang sesuai
- React belum reload

**Solusi**:
1. Refresh halaman (F5)
2. Pastikan status booking = `menunggu_ttd_koordinator` atau `disetujui`

### Masalah 3: Error "PDF generator belum terpasang"
**Solusi**:
```bash
cd silab-laravel
composer require barryvdh/laravel-dompdf
```

---

## Expected Result

### Screenshot Yang Benar:
```
┌────────────────────────────────────────────────┐
│ Preview Laporan Analisis                    X │
├────────────────────────────────────────────────┤
│ Tanggal Verifikasi: 10/01/2026    [Download]  │
├────────────────────────────────────────────────┤
│                                                │
│  [PDF PREVIEW WITH IFRAME]                     │
│                                                │
│  Kepada Yth.              Tanggal: 10/01/2026 │
│  Yahdillah                                     │
│  Di Tempat                                     │
│                                                │
│  Tabel 1. Hasil Analisis BDM pada hewan...    │
│                                                │
└────────────────────────────────────────────────┘
        [Tutup]            [Download PDF]
```

### Yang SALAH (sebelum fix):
```
Kepada Yth.              Tanggal: **/**/**    ❌
```

### Yang BENAR (setelah fix):
```
Kepada Yth.              Tanggal: 10/01/2026  ✅
```

---

## Database Check

Untuk memverifikasi `status_updated_at` tersimpan:

```sql
SELECT 
    id, 
    kode_batch, 
    status, 
    status_updated_at,
    updated_at,
    created_at
FROM bookings 
WHERE status = 'menunggu_ttd_koordinator'
ORDER BY updated_at DESC
LIMIT 5;
```

Pastikan kolom `status_updated_at` **TIDAK NULL** untuk booking yang sudah di-approve Kepala.

---

**Last Updated**: January 10, 2026
**Status**: ✅ FIXED - Tanggal sekarang masuk ke PDF dengan benar
