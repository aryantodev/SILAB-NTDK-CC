# AWS S3 Integration Summary untuk SILAB

## 📋 Overview

Konfigurasi AWS S3 untuk aplikasi SILAB telah selesai. Berikut adalah ringkasan file-file yang telah dibuat dan cara menggunakannya.

## 📁 File yang Telah Dibuat

### 1. **Environment Configuration**
   - **`.env`** - File konfigurasi untuk development/staging
   - **`.env.example`** - Template konfigurasi untuk dokumentasi

   **Isi penting:**
   ```
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_DEFAULT_REGION=ap-southeast-1
   AWS_BUCKET=your_bucket_name
   FILESYSTEM_DISK=local (development) atau s3 (production)
   ```

### 2. **Service Class**
   - **`app/Services/S3StorageService.php`** - Service helper untuk S3 operations
   
   **Method utama:**
   - `uploadFile()` - Upload file umum
   - `uploadInvoicePDF()` - Upload invoice PDF
   - `uploadAnalysisResult()` - Upload hasil analisa
   - `getUrl()` - Get public URL
   - `getSignedUrl()` - Get temporary signed URL
   - `download()` - Download file
   - `deleteFile()` - Hapus file
   - Dan method lainnya untuk file operations

### 3. **Example Controller**
   - **`app/Http/Controllers/Examples/S3ExampleController.php`** - Contoh implementasi
   
   **Endpoint examples:**
   - `POST /api/upload` - Upload file
   - `GET /api/download/{path}` - Download file
   - `GET /api/file-url/{path}` - Get file URL
   - `GET /api/signed-url` - Get signed URL
   - `DELETE /api/delete` - Delete file

### 4. **Documentation Files**
   - **`AWS_S3_SETUP.md`** - Panduan setup AWS S3 dari awal
   - **`S3_SERVICE_USAGE.md`** - Panduan cara menggunakan S3StorageService
   - **`AWS_S3_IMPLEMENTATION_CHECKLIST.md`** - Checklist implementasi lengkap
   - **`tests/S3ConnectionTest.php`** - Script untuk test koneksi S3

---

## 🚀 Quick Start

### Step 1: Configure AWS Credentials

Edit file `.env` di folder `silab-laravel/`:

```bash
cd silab-laravel

# Edit .env file dengan credentials AWS Anda:
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_DEFAULT_REGION=ap-southeast-1
AWS_BUCKET=your_bucket_name
FILESYSTEM_DISK=local
```

### Step 2: Generate App Key

```bash
php artisan key:generate
```

### Step 3: Test Connection

```bash
php artisan tinker
```

Dalam tinker, jalankan:
```php
Storage::disk('s3')->put('test.txt', 'Hello S3');
Storage::disk('s3')->exists('test.txt');
Storage::disk('s3')->get('test.txt');
Storage::disk('s3')->delete('test.txt');
```

### Step 4: Implement di Model/Controller

```php
<?php
namespace App\Http\Controllers;

use App\Services\S3StorageService;

class MyController
{
    public function __construct(
        private S3StorageService $storage
    ) {}

    public function uploadInvoice()
    {
        // Upload invoice
        $result = $this->storage->uploadInvoicePDF(
            $pdfContent,
            $invoiceNumber
        );
        
        // Result berisi: path, url, signed_url
        return response()->json($result);
    }
}
```

---

## 📊 Architecture

```
SILAB Application
    ↓
Laravel API
    ↓
S3StorageService (app/Services/)
    ↓
Storage Facade
    ↓
AWS SDK (league/flysystem-aws-s3-v3)
    ↓
AWS S3 (Cloud)
```

---

## 🔧 Configuration Details

### Laravel Filesystem Config (`config/filesystems.php`)

Konfigurasi S3 disk sudah ada:
```php
's3' => [
    'driver' => 's3',
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION'),
    'bucket' => env('AWS_BUCKET'),
    'url' => env('AWS_URL'),
    'endpoint' => env('AWS_ENDPOINT'),
]
```

### Recommended S3 Folder Structure

```
s3://your-bucket/
├── invoices/          # Invoice PDFs
│   └── invoice-001-20250101-120000.pdf
├── documents/         # Analysis results
│   └── analysis-123-abc123456.pdf
├── uploads/          # User uploads
│   └── file-abc123456-1234567890.pdf
├── signatures/       # Digital signatures
│   └── sig-user-123-1234567890.png
└── temp/            # Temporary files
    └── temp-xyz789-1234567890.tmp
```

---

## 📝 Usage Examples

### Upload Invoice

```php
use App\Services\S3StorageService;

$storage = app(S3StorageService::class);

// Generate PDF
$pdf = PDF::loadView('invoices.template', ['invoice' => $invoice]);
$pdfContent = $pdf->output();

// Upload ke S3
$result = $storage->uploadInvoicePDF($pdfContent, $invoice->invoice_number);

// Result:
// [
//     'path' => 'invoices/invoice-INV-001-20250108-120000.pdf',
//     'url' => 'https://bucket.s3.region.amazonaws.com/...',
//     'signed_url' => 'https://bucket.s3.region.amazonaws.com/...?X-Amz-Signature=...'
// ]
```

### Upload Analysis Result

```php
$result = $storage->uploadAnalysisResult(
    $analysisContent,
    $analysisId,
    'pdf'
);

// Simpan ke database
$booking->analysis_file_path = $result['path'];
$booking->analysis_file_url = $result['url'];
$booking->save();
```

### Download File

```php
// Method 1: Direct download
return $storage->download('invoices/invoice-001.pdf');

// Method 2: Get URL untuk browser
$url = $storage->getSignedUrl('invoices/invoice-001.pdf', 60); // 60 minutes
return response()->json(['url' => $url]);
```

### Send via Email

```php
use PDF;
use App\Services\S3StorageService;
use Illuminate\Mail\Mailable;

class SendInvoiceMail extends Mailable
{
    public function build()
    {
        $storage = app(S3StorageService::class);
        $signedUrl = $storage->getSignedUrl(
            'invoices/invoice-001.pdf',
            1440 // 24 hours
        );

        return $this->view('emails.invoice')
                    ->with(['download_link' => $signedUrl]);
    }
}
```

---

## 🔐 Security Best Practices

1. **Never commit credentials to Git**
   ```bash
   # .gitignore should have:
   .env
   .env.local
   .env.*.php
   ```

2. **Use IAM User with Limited Permissions**
   - Create IAM user with S3-only access
   - Use specific bucket ARN in policy
   - Rotate credentials regularly

3. **Enable S3 Bucket Encryption**
   - Enable server-side encryption (SSE-S3)
   - Or use KMS encryption (SSE-KMS)

4. **Restrict Public Access**
   - Block public access setting di bucket
   - Use signed URLs untuk private files
   - Never make invoice/analysis files public

5. **File Validation**
   - Validate file type
   - Check file size limits
   - Scan for malware (optional)

---

## 🧪 Testing

### Unit Test Example

```php
<?php
namespace Tests\Unit;

use App\Services\S3StorageService;
use Illuminate\Foundation\Testing\TestCase;

class S3StorageServiceTest extends TestCase
{
    private S3StorageService $storage;

    protected function setUp(): void
    {
        parent::setUp();
        $this->storage = app(S3StorageService::class);
    }

    public function test_can_upload_file()
    {
        $file = UploadedFile::fake()->create('test.pdf', 100);
        $result = $this->storage->uploadFile($file, 'test');

        $this->assertIsArray($result);
        $this->assertArrayHasKey('path', $result);
        $this->assertArrayHasKey('url', $result);
    }
}
```

### Integration Test

```bash
# Run S3 connection test
php artisan tinker < tests/S3ConnectionTest.php

# Atau manual test di tinker:
php artisan tinker

# Dalam tinker:
>>> $storage = app(\App\Services\S3StorageService::class)
>>> $storage->fileExists('test.txt')
>>> Storage::disk('s3')->put('test.txt', 'test')
>>> Storage::disk('s3')->get('test.txt')
>>> Storage::disk('s3')->delete('test.txt')
```

---

## 📈 Production Deployment

### Environment Setup

```bash
# .env untuk production
APP_ENV=production
APP_DEBUG=false
FILESYSTEM_DISK=s3

# AWS Credentials (dari AWS Secrets Manager atau environment)
AWS_ACCESS_KEY_ID=prod_access_key
AWS_SECRET_ACCESS_KEY=prod_secret_key
AWS_DEFAULT_REGION=ap-southeast-1
AWS_BUCKET=silab-prod-bucket
```

### Docker Setup (jika menggunakan Docker)

```dockerfile
# Dockerfile
FROM php:8.2-fpm

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

COPY . /app
WORKDIR /app

# Install composer dependencies
RUN composer install --no-dev --optimize-autoloader

# Run migrations
RUN php artisan migrate --force

EXPOSE 9000

CMD ["php-fpm"]
```

### Cost Optimization

- **Enable S3 Lifecycle Policies** untuk auto-delete old files
- **Use S3 Intelligent-Tiering** untuk automatic cost optimization
- **Enable S3 Analytics** untuk monitor usage
- **Consider CloudFront CDN** untuk faster delivery

---

## 🐛 Troubleshooting

### Error: InvalidAccessKeyId
**Penyebab:** AWS credentials tidak valid
**Solusi:** 
- Periksa AWS_ACCESS_KEY_ID dan AWS_SECRET_ACCESS_KEY di .env
- Regenerate access keys dari AWS IAM

### Error: NoSuchBucket
**Penyebab:** Bucket tidak ada atau nama salah
**Solusi:**
- Periksa AWS_BUCKET di .env
- Pastikan bucket sudah dibuat di region yang sesuai

### Error: Access Denied
**Penyebab:** IAM user tidak punya permission
**Solusi:**
- Attach `AmazonS3FullAccess` policy ke IAM user
- Atau create custom policy dengan S3 permissions

### File tidak bisa diakses dari browser
**Penyebab:** File adalah private
**Solusi:**
- Use signed URL dari `getSignedUrl()`
- Atau set bucket policy untuk public access

### Slow Upload Performance
**Solusi:**
- Use streaming untuk large files
- Enable multipart upload
- Consider CloudFront atau direct uploads

---

## 📚 Dokumentasi Lengkap

- **[AWS_S3_SETUP.md](AWS_S3_SETUP.md)** - Setup AWS S3 dari awal
- **[S3_SERVICE_USAGE.md](S3_SERVICE_USAGE.md)** - Cara menggunakan service
- **[AWS_S3_IMPLEMENTATION_CHECKLIST.md](AWS_S3_IMPLEMENTATION_CHECKLIST.md)** - Implementasi checklist

---

## 🔗 Useful Links

- [Laravel Storage Documentation](https://laravel.com/docs/filesystem)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS SDK for PHP](https://docs.aws.amazon.com/sdk-for-php/)
- [League Flysystem AWS S3 v3](https://flysystem.thephpleague.com/docs/adapter/aws-s3-v3/)

---

## ✅ Checklist Implementasi

- [x] Environment configuration (.env dan .env.example)
- [x] S3StorageService class
- [x] Example controller
- [x] Documentation
- [ ] **TODO:** Update models untuk store file paths
- [ ] **TODO:** Update controllers untuk use S3StorageService
- [ ] **TODO:** Update API endpoints
- [ ] **TODO:** Update React frontend
- [ ] **TODO:** Test di staging environment
- [ ] **TODO:** Deploy ke production

---

**Dibuat pada:** 2026-06-08
**Status:** Ready untuk Implementation
**Next Step:** Update models dan controllers untuk menggunakan S3StorageService
