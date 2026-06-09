# Panduan Menggunakan S3StorageService

Service `S3StorageService` adalah helper class untuk memudahkan interaksi dengan AWS S3 dari aplikasi SILAB.

## Instalasi / Setup

Service sudah tersedia di:
```
app/Services/S3StorageService.php
```

## Cara Menggunakan

### 1. Menggunakan di Controller

```php
<?php

namespace App\Http\Controllers;

use App\Services\S3StorageService;
use Illuminate\Http\Request;

class FileUploadController extends Controller
{
    private S3StorageService $storageService;

    public function __construct(S3StorageService $storageService)
    {
        $this->storageService = $storageService;
    }

    // Upload file umum
    public function uploadFile(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:51200', // 50 MB
        ]);

        try {
            $result = $this->storageService->uploadFile(
                $request->file('file'),
                'uploads', // folder di S3
                null // null = auto-generate nama file
            );

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    // Upload invoice PDF
    public function uploadInvoice(Request $request)
    {
        $request->validate([
            'invoice_number' => 'required|string',
            'pdf_content' => 'required|string', // base64 atau content
        ]);

        try {
            $result = $this->storageService->uploadInvoicePDF(
                $request->input('pdf_content'),
                $request->input('invoice_number')
            );

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    // Download file
    public function downloadFile($filename)
    {
        try {
            return $this->storageService->download("uploads/{$filename}");
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 404);
        }
    }

    // Get signed URL untuk private files
    public function getSignedUrl($filename)
    {
        try {
            $url = $this->storageService->getSignedUrl(
                "uploads/{$filename}",
                60 // valid for 60 minutes
            );

            return response()->json([
                'success' => true,
                'url' => $url,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    // Delete file
    public function deleteFile($filename)
    {
        try {
            $this->storageService->deleteFile("uploads/{$filename}");

            return response()->json([
                'success' => true,
                'message' => 'File berhasil dihapus',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
```

### 2. Menggunakan di Model

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Services\S3StorageService;

class Invoice extends Model
{
    protected $fillable = ['invoice_number', 'file_path', 'file_url'];

    private S3StorageService $storage;

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->storage = app(S3StorageService::class);
    }

    // Upload invoice dan simpan path ke database
    public function uploadInvoiceFile(string $pdfContent): void
    {
        try {
            $result = $this->storage->uploadInvoicePDF(
                $pdfContent,
                $this->invoice_number
            );

            $this->update([
                'file_path' => $result['path'],
                'file_url' => $result['url'],
            ]);
        } catch (\Exception $e) {
            \Log::error("Invoice upload failed: {$e->getMessage()}");
            throw $e;
        }
    }

    // Delete file dari S3 saat invoice dihapus
    protected static function booted(): void
    {
        static::deleting(function (self $invoice) {
            if ($invoice->file_path) {
                app(S3StorageService::class)->deleteFile($invoice->file_path);
            }
        });
    }
}
```

### 3. Menggunakan dengan Laravel Mail

```php
<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use App\Services\S3StorageService;

class SendInvoiceMail extends Mailable
{
    private $storageService;

    public function __construct()
    {
        $this->storageService = app(S3StorageService::class);
    }

    public function build()
    {
        $filePath = 'invoices/invoice-001.pdf';

        return $this->subject('Invoice')
                    ->view('emails.invoice')
                    ->attach($this->storageService->getSignedUrl($filePath, 120));
    }
}
```

### 4. Menggunakan dengan DomPDF

```php
<?php

namespace App\Http\Controllers;

use PDF;
use App\Services\S3StorageService;

class InvoiceController extends Controller
{
    private S3StorageService $storageService;

    public function __construct(S3StorageService $storageService)
    {
        $this->storageService = $storageService;
    }

    public function generateAndUploadInvoicePdf($invoiceId)
    {
        // Generate PDF
        $pdf = PDF::loadView('invoices.template', [
            'invoice' => Invoice::find($invoiceId)
        ]);

        $pdfContent = $pdf->output();

        // Upload ke S3
        try {
            $invoice = Invoice::find($invoiceId);
            $result = $this->storageService->uploadInvoicePDF(
                $pdfContent,
                $invoice->invoice_number
            );

            // Simpan path ke database
            $invoice->update([
                'file_path' => $result['path'],
                'file_url' => $result['url'],
            ]);

            return response()->json([
                'success' => true,
                'url' => $result['signed_url'],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
```

## Method Tersedia

| Method | Deskripsi | Return |
|--------|-----------|--------|
| `uploadFile($file, $folder, $filename)` | Upload file umum | `['path', 'url', 'disk']` |
| `uploadInvoicePDF($content, $invoiceNo)` | Upload invoice PDF | `['path', 'url', 'signed_url']` |
| `uploadAnalysisResult($content, $id, $ext)` | Upload hasil analisa | `['path', 'url']` |
| `getSignedUrl($path, $minutes)` | Generate signed URL | `string` |
| `getUrl($path)` | Get public URL | `string` |
| `download($path)` | Download file | Response |
| `deleteFile($path)` | Hapus file | `bool` |
| `deleteMultiple($paths)` | Hapus multiple files | `bool` |
| `fileExists($path)` | Check file exists | `bool` |
| `getFileSize($path)` | Get file size | `int\|false` |
| `getContent($path)` | Get file content | `string` |

## Konfigurasi Allowed Extensions

Untuk mengubah tipe file yang diizinkan, edit di `S3StorageService.php`:

```php
private array $allowedExtensions = [
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 
    'jpg', 'jpeg', 'png', 'gif', 'zip'
];
```

## Konfigurasi Max File Size

Untuk mengubah ukuran file maksimal (default 50MB), edit:

```php
private int $maxFileSize = 50 * 1024 * 1024; // bytes
```

## Troubleshooting

### Error: "Upload gagal: InvalidAccessKeyId"
- Periksa AWS_ACCESS_KEY_ID dan AWS_SECRET_ACCESS_KEY di .env

### Error: "Upload gagal: NoSuchBucket"
- Periksa AWS_BUCKET di .env
- Pastikan bucket sudah dibuat di AWS

### File tidak bisa diakses
- Jika upload ke private folder, gunakan `getSignedUrl()` bukan `getUrl()`
- Signed URL hanya valid selama waktu yang ditentukan

### Performa Upload Lambat
- Gunakan streaming untuk file besar:
```php
Storage::disk('s3')->put($path, fopen($file->getRealPath(), 'r'));
```

## Tips

1. **Backup lokal di development:**
   - Ganti `FILESYSTEM_DISK=local` di .env development
   - Upload akan ke folder `storage/app/uploads` bukan S3

2. **Cleanup old files:**
   ```php
   // Hapus file yang sudah lama
   $files = Storage::disk('s3')->listContents('documents');
   foreach ($files as $file) {
       if ($file['last_modified'] < strtotime('-30 days')) {
           Storage::disk('s3')->delete($file['path']);
       }
   }
   ```

3. **Generate thumbnail:**
   - Gunakan AWS Lambda atau third-party service seperti Imgix untuk thumbnail generation

## Referensi
- [Laravel Storage Documentation](https://laravel.com/docs/filesystem)
- [AWS SDK for PHP](https://docs.aws.amazon.com/sdk-for-php/)
- [S3 API Documentation](https://docs.aws.amazon.com/s3/latest/API/)
