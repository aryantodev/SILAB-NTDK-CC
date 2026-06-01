# Workflow Status - SILAB System

## Alur Status Lengkap

### 1. **Klien** → Membuat Booking
- **Status Awal**: `menunggu`
- **Action**: Klien membuat pesanan booking analisis
- **Next**: Teknisi menerima permintaan

### 2. **Teknisi** → Verifikasi Sampel
- **Status Diterima**: `menunggu`
- **Actions**:
  - ✅ **Setuju** → Status: `disetujui`
  - ❌ **Tolak** → Status: `ditolak` (dengan `alasan_penolakan`)
- **Next**: 
  - Jika disetujui → Teknisi mulai analisis
  - Jika ditolak → Proses berakhir

### 3. **Teknisi** → Proses Analisis
- **Status**: `proses` / `sedang_dianalisis`
- **Actions**:
  - Teknisi mengisi hasil analisis
  - Upload data ke sistem
- **Next**: Kirim ke Koordinator untuk verifikasi

### 4. **Teknisi** → Kirim ke Koordinator
- **Status**: `menunggu_verifikasi`
- **Action**: Teknisi mengirim hasil analisis ke Koordinator
- **Next**: Koordinator melakukan review

### 5. **Koordinator** → Review Hasil
- **Status Diterima**: `menunggu_verifikasi`
- **Actions**:
  - ✅ **Kirim ke Kepala** → Status: `menunggu_verifikasi_kepala`
  - ❌ **Kirim ke Teknisi** → Status: `dikirim_ke_teknisi` (dengan `alasan_teknisi`)
- **Next**:
  - Jika kirim ke Kepala → Kepala Lab verifikasi
  - Jika kirim ke Teknisi → Teknisi revisi

### 6. **Kepala Lab** → Verifikasi Akhir
- **Status Diterima**: `menunggu_verifikasi_kepala`
- **Actions**:
  - ✅ **Setuju** → Status: `menunggu_ttd` / `menunggu_ttd_koordinator`
  - ❌ **Tolak** → Status: `ditolak_kepala` (dengan `alasan_tolak`)
- **Timestamp**: Sistem mencatat `status_updated_at` saat Kepala menyetujui
- **Next**:
  - Jika setuju → Ke Koordinator untuk tanda tangan
  - Jika tolak → Kembali ke Koordinator untuk diteruskan ke Teknisi

### 7. **Koordinator** → Tanda Tangan Digital
- **Status Diterima**: `menunggu_ttd` / `menunggu_ttd_koordinator` / `disetujui`
- **Actions**:
  - Koordinator dapat melihat PDF hasil analisis
  - PDF menampilkan tanggal verifikasi Kepala (`status_updated_at`)
  - Koordinator upload PDF yang sudah ditandatangani
- **Status Akhir**: `selesai` / `ditandatangani`
- **Next**: Klien dapat mengunduh hasil

### 8. **Klien** → Download Hasil
- **Status**: `selesai` / `ditandatangani`
- **Action**: Klien dapat mengunduh PDF hasil analisis yang sudah ditandatangani

---

## Daftar Status Valid

### Status Utama
1. `menunggu` - Booking baru, menunggu verifikasi teknisi
2. `disetujui` - Booking disetujui teknisi
3. `ditolak` - Booking ditolak teknisi (dengan alasan_penolakan)
4. `proses` / `sedang_dianalisis` - Analisis sedang dikerjakan
5. `menunggu_verifikasi` - Hasil siap, menunggu review koordinator
6. `menunggu_verifikasi_kepala` - Menunggu approval kepala lab
7. `ditolak_kepala` - Ditolak kepala (dengan alasan_tolak)
8. `dikirim_ke_teknisi` - Koordinator kirim balik ke teknisi (dengan alasan_teknisi)
9. `menunggu_ttd` / `menunggu_ttd_koordinator` - Menunggu tanda tangan koordinator
10. `selesai` / `ditandatangani` - Proses selesai
11. `dibatalkan` - Dibatalkan oleh klien
12. `menunggu_pembayaran` - (Optional) Menunggu pembayaran

---

## Field Rejection/Reason di Database

| Field | Digunakan Oleh | Keterangan |
|-------|----------------|------------|
| `alasan_penolakan` | Teknisi | Alasan teknisi menolak booking |
| `alasan_tolak` | Kepala Lab | Alasan kepala menolak hasil |
| `alasan_teknisi` | Koordinator | Instruksi koordinator ke teknisi |
| `status_updated_at` | System | Timestamp saat status berubah (untuk tanggal PDF) |

---

## PDF Generation

### Stored PDF (Uploaded by Teknisi/Koordinator)
- **Endpoint**: `GET /api/bookings/{id}/pdf`
- **Field**: `pdf_path` atau `file_ttd_path` di database
- **Used When**: Teknisi/Koordinator sudah upload file PDF

### Generated PDF (Fallback)
- **Endpoint**: `GET /api/bookings/{id}/pdf-generated`
- **Template**: `resources/views/pdf/booking_report.blade.php`
- **Data**:
  - `booking` - Data booking
  - `analysisItems` - Hasil analisis
  - `kategori` - BDM/BDP/Combined
  - `tanggal` - Dari `status_updated_at` (tanggal kepala setuju)
- **Used When**: Tidak ada PDF yang di-upload, sistem generate otomatis

---

## Frontend Components

### Teknisi
- **VerifikasiSampel.js**: Approve/Reject booking (`menunggu` → `disetujui`/`ditolak`)
- **GeneratePdfAnalysis.js**: Input hasil & kirim ke koordinator (`proses` → `menunggu_verifikasi`)

### Koordinator
- **VerifikasiSampelKoordinator.js**: Review hasil & kirim ke kepala atau teknisi
  - Filter: `menunggu_verifikasi`, `ditolak_kepala`
  - Actions: Kirim ke Kepala / Kirim ke Teknisi
- **TandaTanganKoordinator.js**: Preview PDF & upload signed PDF
  - Filter: `menunggu_ttd`, `disetujui`, `selesai`, `ditandatangani`
  - Actions: Preview PDF (dengan tanggal), Upload TTD

### Kepala
- **VerifikasiKepala.js**: Final approval
  - Filter: `menunggu_verifikasi_kepala`
  - Actions: Setuju (`menunggu_ttd`) / Tolak (`ditolak_kepala`)

---

## Troubleshooting

### PDF "Gagal mengunduh"
**Kemungkinan Penyebab**:
1. Package `barryvdh/laravel-dompdf` belum terinstall
2. Migration `status_updated_at` belum dijalankan
3. PDF endpoints tidak terdaftar di routes

**Solusi**:
```bash
# Install dompdf
cd silab-laravel
composer require barryvdh/laravel-dompdf

# Run migrations
php artisan migrate

# Verify routes
php artisan route:list | grep bookings
```

### Status tidak konsisten
**Kemungkinan Penyebab**:
1. Frontend menggunakan nama status yang berbeda dengan backend
2. Backend validation menolak status tertentu

**Solusi**:
- Pastikan status di frontend match dengan backend validation
- Cek file `BookingController.php` line 382 untuk daftar status valid
- Update frontend component untuk menggunakan status yang sama

---

## Next Steps untuk User

1. **Jalankan migrations** (sudah dilakukan):
   ```bash
   cd silab-laravel
   php artisan migrate
   ```

2. **Install dompdf** (jika belum):
   ```bash
   cd silab-laravel
   composer require barryvdh/laravel-dompdf
   ```

3. **Test workflow**:
   - Login sebagai Teknisi → Setujui booking → Isi hasil → Kirim ke Koordinator
   - Login sebagai Koordinator → Review → Kirim ke Kepala
   - Login sebagai Kepala → Approve (sistem mencatat `status_updated_at`)
   - Login sebagai Koordinator → Lihat PDF (tanggal muncul) → Upload TTD

4. **Verify PDF**:
   - Klik "Lihat" di TandaTanganKoordinator
   - Modal muncul dengan tanggal verifikasi
   - PDF menampilkan tanggal (bukan ***)
   - Bisa download dari modal

---

**Updated**: January 10, 2026
**Version**: 2.0
