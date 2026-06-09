<?php

namespace App\Http\Controllers\Examples;

use App\Services\S3StorageService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

/**
 * Example Controller untuk S3 Upload/Download
 *
 * Ini adalah contoh implementasi S3StorageService di controller
 * Copy dan modify sesuai kebutuhan aplikasi Anda
 */
class S3ExampleController
{
    private S3StorageService $storageService;

    public function __construct(S3StorageService $storageService)
    {
        $this->storageService = $storageService;
    }

    /**
     * Upload file ke S3
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function uploadFile(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'file' => 'required|file|max:51200', // 50 MB
                'folder' => 'sometimes|string', // optional folder
            ]);

            $folder = $request->input('folder', 'uploads');

            $result = $this->storageService->uploadFile(
                $request->file('file'),
                $folder
            );

            Log::info('File uploaded to S3', [
                'path' => $result['path'],
                'size' => $request->file('file')->getSize(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'File berhasil di-upload ke S3',
                'data' => $result,
            ], 201);

        } catch (\Throwable $e) {
            Log::error('S3 upload failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal upload file: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Download file dari S3
     *
     * @param string $path
     * @return \Illuminate\Http\Response
     */
    public function downloadFile(string $path)
    {
        try {
            if (!$this->storageService->fileExists($path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File tidak ditemukan',
                ], 404);
            }

            Log::info('File downloaded from S3', ['path' => $path]);

            return $this->storageService->download($path);

        } catch (\Throwable $e) {
            Log::error('S3 download failed', [
                'path' => $path,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal download file',
            ], 500);
        }
    }

    /**
     * Get file URL (public)
     *
     * @param string $path
     * @return JsonResponse
     */
    public function getFileUrl(string $path): JsonResponse
    {
        try {
            if (!$this->storageService->fileExists($path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File tidak ditemukan',
                ], 404);
            }

            $url = $this->storageService->getUrl($path);

            return response()->json([
                'success' => true,
                'url' => $url,
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mendapatkan URL file',
            ], 500);
        }
    }

    /**
     * Get signed URL (private, temporary)
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getSignedUrl(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'path' => 'required|string',
                'expires_in' => 'sometimes|integer|min:1|max:1440', // max 24 hours
            ]);

            $path = $request->input('path');
            $expiresIn = $request->input('expires_in', 60); // default 60 minutes

            if (!$this->storageService->fileExists($path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File tidak ditemukan',
                ], 404);
            }

            $url = $this->storageService->getSignedUrl($path, $expiresIn);

            return response()->json([
                'success' => true,
                'url' => $url,
                'expires_in_minutes' => $expiresIn,
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal generate signed URL',
            ], 500);
        }
    }

    /**
     * Delete file dari S3
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function deleteFile(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'path' => 'required|string',
            ]);

            $path = $request->input('path');

            if (!$this->storageService->fileExists($path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File tidak ditemukan',
                ], 404);
            }

            $this->storageService->deleteFile($path);

            Log::info('File deleted from S3', ['path' => $path]);

            return response()->json([
                'success' => true,
                'message' => 'File berhasil dihapus dari S3',
            ]);

        } catch (\Throwable $e) {
            Log::error('S3 delete failed', [
                'path' => $request->input('path'),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus file',
            ], 500);
        }
    }

    /**
     * Get file info
     *
     * @param string $path
     * @return JsonResponse
     */
    public function getFileInfo(string $path): JsonResponse
    {
        try {
            if (!$this->storageService->fileExists($path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File tidak ditemukan',
                ], 404);
            }

            $size = $this->storageService->getFileSize($path);
            $url = $this->storageService->getUrl($path);

            return response()->json([
                'success' => true,
                'data' => [
                    'path' => $path,
                    'size' => $size,
                    'size_mb' => round($size / 1024 / 1024, 2),
                    'url' => $url,
                ],
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mendapatkan info file',
            ], 500);
        }
    }

    /**
     * Upload multiple files
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function uploadMultiple(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'files' => 'required|array',
                'files.*' => 'file|max:51200',
                'folder' => 'sometimes|string',
            ]);

            $folder = $request->input('folder', 'uploads');
            $results = [];

            foreach ($request->file('files') as $file) {
                $result = $this->storageService->uploadFile($file, $folder);
                $results[] = $result;
            }

            Log::info('Multiple files uploaded to S3', [
                'count' => count($results),
            ]);

            return response()->json([
                'success' => true,
                'message' => count($results) . ' file(s) berhasil di-upload',
                'data' => $results,
            ], 201);

        } catch (\Throwable $e) {
            Log::error('S3 multiple upload failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal upload multiple files',
            ], 400);
        }
    }
}
