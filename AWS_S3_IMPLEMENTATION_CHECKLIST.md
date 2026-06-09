# AWS S3 Implementation Checklist untuk SILAB

## Pre-Implementation

- [ ] AWS Account sudah dibuat
- [ ] IAM User dengan S3 access sudah dibuat
- [ ] Access Key ID dan Secret Access Key sudah di-generate
- [ ] S3 Bucket sudah dibuat dengan nama bucket ditentukan

## Installation & Configuration

### Step 1: Environment Setup
- [ ] File `.env` sudah dibuat dengan AWS credentials:
  - [ ] `AWS_ACCESS_KEY_ID` = access key dari IAM user
  - [ ] `AWS_SECRET_ACCESS_KEY` = secret key dari IAM user
  - [ ] `AWS_DEFAULT_REGION` = region yang digunakan (contoh: ap-southeast-1)
  - [ ] `AWS_BUCKET` = nama S3 bucket
  - [ ] `AWS_URL` = S3 bucket URL

- [ ] File `.env.example` sudah dibuat untuk dokumentasi

### Step 2: Composer Dependencies
- [ ] Package `league/flysystem-aws-s3-v3` sudah di-install:
  ```bash
  composer require league/flysystem-aws-s3-v3
  ```

### Step 3: Laravel Configuration
- [ ] File `config/filesystems.php` sudah dikonfigurasi untuk S3
- [ ] Default `FILESYSTEM_DISK` di `.env` sudah ditentukan:
  - Development: `local`
  - Production: `s3`

### Step 4: Service Setup
- [ ] File `app/Services/S3StorageService.php` sudah ada
- [ ] Namespace dan class sudah sesuai
- [ ] Semua method sudah ter-import dengan benar

## Testing

- [ ] Run connection test:
  ```bash
  php artisan tinker < tests/S3ConnectionTest.php
  ```
  
- [ ] Verify test results:
  - [ ] S3 Configuration found
  - [ ] Environment Variables valid
  - [ ] S3 Connection successful
  - [ ] S3StorageService working

## Integration with Existing Models

### For Invoice Model
- [ ] Update `app/Models/Invoice.php`:
  - [ ] Add `file_path` and `file_url` columns ke migration (jika belum ada)
  - [ ] Setup relationship atau attributes untuk store file path
  - [ ] Implement service injection di model

- [ ] Update `app/Mail/InvoiceMail.php`:
  - [ ] Use S3StorageService untuk get invoice file
  - [ ] Update attachment logic

- [ ] Update `app/Http/Controllers/InvoiceController.php`:
  - [ ] Inject S3StorageService
  - [ ] Update upload/download endpoints

### For Analysis Result
- [ ] Update `app/Models/BookingAnalysisItem.php`:
  - [ ] Add file storage logic
  - [ ] Track file path di database

- [ ] Update `app/Mail/SendAnalysisResult.php`:
  - [ ] Use S3StorageService untuk attach file

### For Other Files
- [ ] Identify semua file upload points di aplikasi
- [ ] Replace local storage dengan S3StorageService
- [ ] Update file retrieval logic

## Database Migrations

- [ ] Create/Update migration untuk store file paths:
  ```php
  Schema::table('invoices', function (Blueprint $table) {
      $table->string('file_path')->nullable();
      $table->string('file_url')->nullable();
  });
  ```

- [ ] Run migrations:
  ```bash
  php artisan migrate
  ```

## API/Controller Updates

- [ ] Update endpoints untuk file operations:
  - [ ] POST /api/upload - upload file
  - [ ] GET /api/download/{id} - download file
  - [ ] DELETE /api/delete/{id} - delete file

- [ ] Add error handling untuk S3 exceptions

- [ ] Test endpoints dengan Postman atau similar:
  - [ ] Upload test file
  - [ ] Download file
  - [ ] Delete file

## Frontend Integration (React)

- [ ] Update React components untuk upload:
  - [ ] Setup form untuk file upload
  - [ ] Send file ke API endpoint

- [ ] Update file display logic:
  - [ ] Use S3 URL untuk display files
  - [ ] Handle signed URLs untuk private files

- [ ] Add progress tracking untuk upload (optional)

## Production Deployment

- [ ] Update AWS credentials di production environment
- [ ] Set `FILESYSTEM_DISK=s3` di production .env
- [ ] Test upload/download di staging environment
- [ ] Setup S3 backup policy (lifecycle rules)
- [ ] Enable S3 versioning (optional)
- [ ] Setup CloudFront CDN (optional untuk faster delivery)

## Documentation & Monitoring

- [ ] Document file storage structure di S3
- [ ] Setup CloudWatch logs untuk S3 access
- [ ] Document backup strategy
- [ ] Create recovery procedure untuk lost files

## Security Checklist

- [ ] S3 bucket policy reviewed:
  - [ ] Public access blocked (jika necessary)
  - [ ] Only application IAM user dapat access
  - [ ] Proper encryption enabled

- [ ] AWS Credentials:
  - [ ] Tidak di-commit ke Git
  - [ ] Stored di secure environment variables
  - [ ] Rotated periodically

- [ ] File Validation:
  - [ ] File type validation implemented
  - [ ] File size limits enforced
  - [ ] Virus scan integration (optional)

## Cleanup & Maintenance

- [ ] Setup S3 lifecycle policy untuk auto-delete old files
- [ ] Setup CloudWatch alarms untuk quota warnings
- [ ] Regular backup testing
- [ ] Document cost optimization strategies

## Completion

- [ ] All steps completed
- [ ] All tests passing
- [ ] Application tested in staging environment
- [ ] Ready for production deployment

---

## Notes

- Keep AWS credentials secure and never commit to version control
- Regular monitoring of S3 costs and usage
- Implement proper error handling and logging
- Consider using CloudFront for better performance
- Document all S3 operations untuk team reference

## Troubleshooting Log

| Issue | Solution | Date |
|-------|----------|------|
|       |          |      |
|       |          |      |
|       |          |      |
