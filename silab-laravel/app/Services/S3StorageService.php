<?php

namespace App\Services;

use App\Exceptions\S3StorageException;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;

/**
 * S3 Storage Service
 * Helper class untuk interaksi dengan AWS S3
 */
class S3StorageService
{
    private string $disk = 's3';
    private array $allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif', 'zip'];
    private int $maxFileSize = 50 * 1024 * 1024; // 50 MB

    /**
     * Upload file ke S3
     *
     * @param \Illuminate\Http\UploadedFile|string $file
     * @param string $folder
     * @param string|null $filename
     * @return array ['path' => string, 'url' => string]
     */
    public function uploadFile($file, string $folder = 'uploads', ?string $filename = null): array
    {
        if (is_string($file)) {
            throw new InvalidArgumentException('File harus berupa UploadedFile instance');
        }

        // Validasi file
        $this->validateFile($file);

        // Generate nama file
        $filename = $filename ?? $this->generateFilename($file);
        $path = "{$folder}/{$filename}";

        try {
            // Upload file
            Storage::disk($this->disk)->put($path, fopen($file->getRealPath(), 'r'));

            return [
                'path' => $path,
                'url' => $this->getUrl($path),
                'disk' => $this->disk,
            ];
        } catch (\Throwable $e) {
            throw new S3StorageException("Upload gagal: {$e->getMessage()}", 0, $e);
        }
    }

    /**
     * Generate signed URL untuk private files
     *
     * @param string $path
     * @param int $expirationMinutes
     * @return string
     */
    public function getSignedUrl(string $path, int $expirationMinutes = 60): string
    {
        return Storage::disk($this->disk)->temporaryUrl(
            $path,
            now()->addMinutes($expirationMinutes)
        );
    }

    /**
     * Get public URL
     *
     * @param string $path
     * @return string
     */
    public function getUrl(string $path): string
    {
        return Storage::disk($this->disk)->url($path);
    }

    /**
     * Download file
     *
     * @param string $path
     * @return \Symfony\Component\HttpFoundation\StreamedResponse
     */
    public function download(string $path)
    {
        return Storage::disk($this->disk)->download($path);
    }

    /**
     * Delete file
     *
     * @param string $path
     * @return bool
     */
    public function deleteFile(string $path): bool
    {
        return Storage::disk($this->disk)->delete($path);
    }

    /**
     * Check if file exists
     *
     * @param string $path
     * @return bool
     */
    public function fileExists(string $path): bool
    {
        return Storage::disk($this->disk)->exists($path);
    }

    /**
     * Get file size
     *
     * @param string $path
     * @return int|false
     */
    public function getFileSize(string $path)
    {
        return Storage::disk($this->disk)->size($path);
    }

    /**
     * Upload PDF Invoice
     *
     * @param string $pdfContent
     * @param string $invoiceNumber
     * @return array
     */
    public function uploadInvoicePDF(string $pdfContent, string $invoiceNumber): array
    {
        $filename = "invoice-{$invoiceNumber}-" . now()->format('Ymd-His') . '.pdf';
        $path = "invoices/{$filename}";

        try {
            Storage::disk($this->disk)->put($path, $pdfContent);

            return [
                'path' => $path,
                'url' => $this->getUrl($path),
                'signed_url' => $this->getSignedUrl($path, 1440),
            ];
        } catch (\Throwable $e) {
            throw new S3StorageException("Upload invoice gagal: {$e->getMessage()}", 0, $e);
        }
    }

    /**
     * Upload Analysis Result
     *
     * @param string $content
     * @param string $analysisId
     * @param string $extension
     * @return array
     */
    public function uploadAnalysisResult(string $content, string $analysisId, string $extension = 'pdf'): array
    {
        $filename = "analysis-{$analysisId}-" . Str::random(8) . ".{$extension}";
        $path = "documents/{$filename}";

        try {
            Storage::disk($this->disk)->put($path, $content);

            return [
                'path' => $path,
                'url' => $this->getUrl($path),
            ];
        } catch (\Throwable $e) {
            throw new S3StorageException("Upload hasil analisa gagal: {$e->getMessage()}", 0, $e);
        }
    }

    /**
     * Batch delete files
     *
     * @param array $paths
     * @return bool
     */
    public function deleteMultiple(array $paths): bool
    {
        try {
            Storage::disk($this->disk)->delete($paths);
            return true;
        } catch (\Throwable $e) {
            throw new S3StorageException("Batch delete gagal: {$e->getMessage()}", 0, $e);
        }
    }

    /**
     * Get file content
     *
     * @param string $path
     * @return string
     */
    public function getContent(string $path): string
    {
        return Storage::disk($this->disk)->get($path);
    }

    /**
     * Validasi file
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @throws S3StorageException
     */
    private function validateFile($file): void
    {
        $maxSizeMB = $this->maxFileSize / 1024 / 1024;

        if ($file->getSize() > $this->maxFileSize) {
            throw new S3StorageException("File terlalu besar. Maksimal: {$maxSizeMB}MB");
        }

        $extension = strtolower($file->getClientOriginalExtension());
        if (!in_array($extension, $this->allowedExtensions)) {
            $allowedList = implode(', ', $this->allowedExtensions);
            throw new S3StorageException("Tipe file tidak diizinkan. Izin: {$allowedList}");
        }
    }

    /**
     * Generate unique filename
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @return string
     */
    private function generateFilename($file): string
    {
        $extension = strtolower($file->getClientOriginalExtension());
        return Str::random(16) . '-' . now()->timestamp . ".{$extension}";
    }
}
