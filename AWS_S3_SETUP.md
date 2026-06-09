# Konfigurasi AWS S3 untuk SILAB

## Prasyarat
- AWS Account dengan akses ke S3
- AWS Access Key ID dan Secret Access Key

## Langkah Setup

### 1. Membuat S3 Bucket di AWS
- Login ke AWS Console: https://console.aws.amazon.com
- Navigasi ke S3 service
- Click "Create bucket"
- Isi nama bucket (contoh: `silab-storage` atau `silab-files`)
- Pilih region (contoh: `ap-southeast-1` untuk Indonesia)
- Configure permissions sesuai kebutuhan
- Click "Create bucket"

### 2. Membuat IAM User untuk S3 Access
- Login ke AWS Console
- Navigasi ke IAM > Users
- Click "Create user"
- Isi nama user (contoh: `silab-app`)
- Click "Next"
- Pada "Set permissions", pilih "Attach policies directly"
- Search dan select `AmazonS3FullAccess` (atau custom policy)
- Click "Next" dan "Create user"

### 3. Generate Access Keys
- Buka user yang baru dibuat
- Click tab "Security credentials"
- Scroll ke "Access keys"
- Click "Create access key"
- Pilih use case "Application running outside AWS"
- Copy Access Key ID dan Secret Access Key

### 4. Update File .env
Buka file `.env` di folder silab-laravel dan update:

```
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_DEFAULT_REGION=ap-southeast-1
AWS_BUCKET=your_bucket_name
AWS_URL=https://your_bucket_name.s3.ap-southeast-1.amazonaws.com
AWS_ENDPOINT=
AWS_USE_PATH_STYLE_ENDPOINT=false

# Untuk development, gunakan 'local'
# Untuk production, ganti dengan 's3'
FILESYSTEM_DISK=local
```

### 5. Generate App Key
Jalankan command:
```bash
php artisan key:generate
```

### 6. Testing Koneksi S3
Buat test command:
```bash
php artisan tinker
```

Dalam tinker, jalankan:
```php
Storage::disk('s3')->put('test.txt', 'Hello from S3');
Storage::disk('s3')->get('test.txt');
```

## Menggunakan S3 di Aplikasi

### Setup Storage Link (untuk development)
```bash
php artisan storage:link
```

### Upload File ke S3
```php
use Illuminate\Support\Facades\Storage;

// Upload file
Storage::disk('s3')->put('folder/filename.ext', $file_content);

// Get URL file
$url = Storage::disk('s3')->url('folder/filename.ext');

// Download file
return Storage::disk('s3')->download('folder/filename.ext');

// Delete file
Storage::disk('s3')->delete('folder/filename.ext');
```

### Upload dari Form Request
```php
// Di Controller
$path = $request->file('upload')->store('uploads', 's3');
$url = Storage::disk('s3')->url($path);
```

## Struktur Folder di S3 (Recommended)
```
silab-storage/
├── invoices/        (PDF Invoice)
├── uploads/         (User uploads)
├── documents/       (Dokumen hasil analisa)
├── signatures/      (Tanda tangan digital)
└── temp/           (File temporary)
```

## Custom Disk Configuration (Optional)
Jika ingin multiple disks, tambahkan di `config/filesystems.php`:

```php
's3-invoices' => [
    'driver' => 's3',
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION'),
    'bucket' => env('AWS_BUCKET'),
    'path' => 'invoices',
],
```

## Troubleshooting

### Error: "InvalidAccessKeyId"
- Periksa AWS_ACCESS_KEY_ID dan AWS_SECRET_ACCESS_KEY
- Pastikan IAM user memiliki permission S3

### Error: "NoSuchBucket"
- Periksa nama bucket di AWS_BUCKET
- Pastikan bucket sudah dibuat di region yang benar

### Error: "Access Denied"
- Periksa permission IAM user
- Pastikan bucket policy mengizinkan akses

### File tidak bisa diakses dari browser
- Enable "Block public access" settings di bucket
- Atau generate signed URL untuk private files

## Environment untuk Different Stages

### Development (Local)
```
FILESYSTEM_DISK=local
```

### Staging/Production
```
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=production_key
AWS_SECRET_ACCESS_KEY=production_secret
AWS_BUCKET=silab-prod
```

## Referensi
- Laravel Storage Documentation: https://laravel.com/docs/filesystem
- AWS S3 Documentation: https://docs.aws.amazon.com/s3/
- Laravel AWS Integration: https://docs.aws.amazon.com/sdk-for-php/latest/developer-guide/
