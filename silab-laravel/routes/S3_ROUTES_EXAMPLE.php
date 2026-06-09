<?php

/**
 * Example Routes untuk S3 File Operations
 *
 * Tambahkan routes ini ke routes/api.php atau routes/web.php
 * Adjust path dan controller sesuai kebutuhan aplikasi Anda
 */

use App\Http\Controllers\Examples\S3ExampleController;
use Illuminate\Support\Facades\Route;

// ============================================================
// S3 File Operations Routes (Example)
// ============================================================

Route::prefix('files')->group(function () {

    // Upload file
    Route::post('/upload', [S3ExampleController::class, 'uploadFile'])
        ->name('files.upload')
        ->middleware(['auth:sanctum']); // Add authentication if needed

    // Upload multiple files
    Route::post('/upload-multiple', [S3ExampleController::class, 'uploadMultiple'])
        ->name('files.upload-multiple')
        ->middleware(['auth:sanctum']);

    // Download file
    Route::get('/download/{path}', [S3ExampleController::class, 'downloadFile'])
        ->name('files.download')
        ->where('path', '.*'); // Allow slashes in path

    // Get file URL
    Route::get('/url/{path}', [S3ExampleController::class, 'getFileUrl'])
        ->name('files.url')
        ->where('path', '.*');

    // Get signed URL (temporary)
    Route::post('/signed-url', [S3ExampleController::class, 'getSignedUrl'])
        ->name('files.signed-url')
        ->middleware(['auth:sanctum']);

    // Delete file
    Route::delete('/delete', [S3ExampleController::class, 'deleteFile'])
        ->name('files.delete')
        ->middleware(['auth:sanctum']);

    // Get file info
    Route::get('/info/{path}', [S3ExampleController::class, 'getFileInfo'])
        ->name('files.info')
        ->where('path', '.*');
});

// ============================================================
// Alternative: Simpler Routes (if you prefer)
// ============================================================

/*
Route::post('/upload', [S3ExampleController::class, 'uploadFile']);
Route::get('/download/{path}', [S3ExampleController::class, 'downloadFile'])->where('path', '.*');
Route::delete('/delete/{path}', [S3ExampleController::class, 'deleteFile'])->where('path', '.*');
*/

// ============================================================
// Usage Examples in Frontend (React)
// ============================================================

/*

// 1. Upload file
const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', 'uploads');

  const response = await fetch('/api/files/upload', {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
};

// 2. Download file
const downloadFile = (filePath) => {
  window.location.href = `/api/files/download/${filePath}`;
};

// 3. Get file URL
const getFileUrl = async (filePath) => {
  const response = await fetch(`/api/files/url/${filePath}`);
  return await response.json();
};

// 4. Get signed URL (for private files)
const getSignedUrl = async (filePath, expiresIn = 60) => {
  const response = await fetch('/api/files/signed-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      path: filePath,
      expires_in: expiresIn
    })
  });

  return await response.json();
};

// 5. Delete file
const deleteFile = async (filePath) => {
  const response = await fetch('/api/files/delete', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      path: filePath
    })
  });

  return await response.json();
};

// 6. Get file info
const getFileInfo = async (filePath) => {
  const response = await fetch(`/api/files/info/${filePath}`);
  return await response.json();
};

*/

// ============================================================
// Testing Routes (Optional)
// ============================================================

/*
// Test endpoints tanpa authentication
Route::get('/test', function () {
    return response()->json([
        'message' => 'S3 routes working',
        'endpoints' => [
            'POST /api/files/upload',
            'GET /api/files/download/{path}',
            'GET /api/files/url/{path}',
            'POST /api/files/signed-url',
            'DELETE /api/files/delete',
            'GET /api/files/info/{path}',
        ]
    ]);
});
*/
