# S3 Bucket Structure untuk SILAB

## ✅ Bucket Information
- **Bucket Name:** `silab-ntdk-storage`
- **Region:** `ap-southeast-1` (Singapore)
- **Status:** ✅ Active dan ready

## 📁 Recommended Folder Structure

Berdasarkan aplikasi SILAB, berikut struktur folder yang direkomendasikan:

```
silab-ntdk-storage/
│
├── avatars/                    # User avatar profiles
│   ├── users/
│   │   └── {user-id}-{timestamp}.jpg
│   └── teknisi/
│       └── {teknisi-id}-{timestamp}.jpg
│
├── hasil_pdfs/                 # Analysis results/reports
│   ├── {booking-id}-{timestamp}.pdf
│   └── analysis/
│       └── {analysis-id}-result.pdf
│
├── payment_proofs/             # Payment/Invoice proofs
│   ├── invoices/
│   │   └── invoice-{number}-{timestamp}.pdf
│   └── receipts/
│       └── receipt-{id}-{timestamp}.pdf
│
├── documents/                  # General documents
│   ├── analysis/
│   │   └── {analysis-id}-{timestamp}.pdf
│   ├── reports/
│   │   └── {report-id}-{timestamp}.pdf
│   └── certificates/
│       └── {cert-id}-{timestamp}.pdf
│
├── signatures/                 # Digital signatures
│   ├── digital/
│   │   └── sig-{user-id}-{timestamp}.png
│   └── scans/
│       └── scan-{id}-{timestamp}.jpg
│
├── temp/                       # Temporary files
│   └── {session-id}-{timestamp}.tmp
│
└── test-folder/                # Testing only
    └── test files
```

---

## 🗂️ Folder Purposes

| Folder | Purpose | Recommended Files |
|--------|---------|-------------------|
| **avatars/** | User profile pictures | .jpg, .png, .gif |
| **hasil_pdfs/** | Analysis/booking results | .pdf |
| **payment_proofs/** | Invoices & receipts | .pdf, .jpg |
| **documents/** | General documents | .pdf, .doc, .docx |
| **signatures/** | Digital signatures | .png, .jpg |
| **temp/** | Temporary files | .tmp, .txt |
| **test-folder/** | Testing purposes | Any (for testing only) |

---

## 🔧 Implementation in Code

### Upload ke Specific Folder

```php
// Upload user avatar
$storage->uploadFile($file, 'avatars/users');

// Upload invoice
$storage->uploadInvoicePDF($pdfContent, $invoiceNumber);
// Auto path: invoices/invoice-INV-001-20250110-120000.pdf

// Upload analysis result
$storage->uploadAnalysisResult($content, $analysisId, 'pdf');
// Auto path: documents/analysis-123-abc123456.pdf

// Upload payment proof
$storage->uploadFile($file, 'payment_proofs/receipts');
```

---

## 📊 Integration dengan Models

### Invoice Model
```php
// Path di S3
protected $attributes = [
    'file_path' => 'invoices/invoice-INV-001-20250110-120000.pdf',
    'file_url' => 'https://silab-ntdk-storage.s3.ap-southeast-1.amazonaws.com/...',
];
```

### User Model
```php
// Avatar path
protected $attributes = [
    'avatar_path' => 'avatars/users/user-123-1234567890.jpg',
];
```

### BookingAnalysisItem Model
```php
// Analysis result path
protected $attributes = [
    'result_file_path' => 'documents/analysis-456-xyz789.pdf',
];
```

---

## 🚀 S3 URL Format

### Public URLs (untuk file yang bisa diakses public)
```
https://silab-ntdk-storage.s3.ap-southeast-1.amazonaws.com/avatars/users/user-123-1234567890.jpg
https://silab-ntdk-storage.s3.ap-southeast-1.amazonaws.com/hasil_pdfs/booking-456-20250110-120000.pdf
```

### Signed URLs (untuk private files, valid temporary)
```
https://silab-ntdk-storage.s3.ap-southeast-1.amazonaws.com/invoices/invoice-INV-001-...?X-Amz-Signature=...&X-Amz-Date=...
```

---

## 💡 Best Practices

### 1. **Naming Convention**
```
{type}-{identifier}-{timestamp}.{extension}

Examples:
- invoice-INV-001-20250110-120000.pdf
- user-123-1234567890.jpg
- analysis-456-abc789xyz-1234567890.pdf
```

### 2. **Folder Organization**
- ✅ Organize by **type** (invoices, avatars, etc)
- ✅ Use **consistent naming** across folders
- ✅ Include **timestamps** untuk prevent conflicts
- ✅ Use **lowercase** untuk folder names

### 3. **File Size Limits**
- Avatars: max 5 MB
- PDFs: max 50 MB
- Images: max 10 MB
- Documents: max 50 MB

### 4. **Access Control**
- Public files: avatars, some PDFs
- Private files: invoices, payment proofs → gunakan signed URLs
- Delete old files setelah X hari (lifecycle policy)

---

## 🧹 Cleanup & Maintenance

### Manual Cleanup
```php
// Delete files older than 30 days
$files = Storage::disk('s3')->listContents('temp');
foreach ($files as $file) {
    $age = time() - strtotime($file['last_modified']);
    if ($age > 30 * 24 * 60 * 60) { // 30 days
        Storage::disk('s3')->delete($file['path']);
    }
}
```

### S3 Lifecycle Policy (AWS Console)
1. Go to Bucket → Management → Lifecycle rules
2. Create rule untuk auto-delete files in `temp/` folder
3. Example: Delete objects after 7 days

---

## 🔐 Security

### Current Setup
- ✅ Bucket name: `silab-ntdk-storage` (tidak public)
- ✅ Files tidak automatically public
- ✅ Signed URLs untuk secure access
- ⚠️ Ensure IAM user hanya punya S3 access

### Recommended Actions
1. Enable **versioning** di bucket (recovery)
2. Enable **server-side encryption** (KMS)
3. Set **bucket policy** untuk deny public access
4. Regular **backup** dari important files
5. Monitor **CloudWatch logs** untuk access

---

## 📌 Next Steps

1. **Create folders** di AWS Console (optional, S3 auto-create when uploading)
   - Manually create: invoices/, documents/, signatures/ (optional)
   
2. **Update .env** dengan AWS credentials
   ```
   AWS_ACCESS_KEY_ID=your_actual_key
   AWS_SECRET_ACCESS_KEY=your_actual_secret
   ```

3. **Test upload** untuk setiap folder type
   ```bash
   php artisan tinker
   >>> $storage = app(\App\Services\S3StorageService::class)
   >>> $storage->uploadFile($file, 'avatars/users')
   ```

4. **Integrate** dengan Models/Controllers
   - Update Invoice, User, BookingAnalysisItem models
   - Add file_path dan file_url columns ke database

5. **Monitor costs**
   - Check S3 usage di CloudWatch
   - Set up billing alerts

---

## 📞 Reference

- **AWS S3 Console:** https://s3.console.aws.amazon.com
- **Bucket Name:** silab-ntdk-storage
- **Region:** ap-southeast-1
- **Configuration File:** `.env` (silab-laravel folder)
