<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator; // Tambahan untuk validasi file
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\AnalysisPriceController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\Api\QuotaController;
use App\Http\Controllers\Api\BookingController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Blokir akses ke file sensitif via API
Route::get('/.env', function () {
    abort(404);
});
Route::get('/storage/{any}', function () {
    abort(404);
})->where('any', '.*\.env.*');

// Public Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Reset Password
Route::post('/send-otp', [PasswordResetController::class, 'sendOtp']);
Route::post('/reset-password', [PasswordResetController::class, 'resetPassword']);

Route::get('/hello', function () {
    return response()->json(['message' => 'Koneksi API Berhasil']);
});

Route::get('/analysis-prices', [AnalysisPriceController::class, 'index']);
Route::get('/analysis-prices-grouped', [AnalysisPriceController::class, 'grouped']);
Route::get('/calendar-quota', [QuotaController::class, 'getMonthlyQuota']);

// Public debug route for koordinator report (temporary - remove in production)
Route::get('/koordinator-report-debug', [BookingController::class, 'getKoordinatorReport']);


// Protected Routes (Harus Login)
Route::middleware('auth:sanctum')->group(function () {

    // Data User
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // ==========================================
    // [BARU] ROUTE UPDATE PROFILE
    // ==========================================
    Route::post('/profile/update', [AuthController::class, 'updateProfile']);
    // ==========================================

    Route::post('/update-quota', [QuotaController::class, 'updateQuota']);

    // Booking Routes
    // ... (Semua route booking bawaan tetap aman dijalankan)
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::get('/bookings/all', [BookingController::class, 'indexAll']);
    Route::get('/bookings/{id}', [BookingController::class, 'show']);
    Route::get('/koordinator-report', [BookingController::class, 'getKoordinatorReport']);
    Route::put('/bookings/{id}/status', [BookingController::class, 'updateStatus']);
    Route::put('/bookings/{id}/cancel', [BookingController::class, 'cancelBooking']);
    Route::put('/bookings/{id}/results', [BookingController::class, 'updateAnalysisResult']);
    Route::put('/bookings/{id}/finalize', [BookingController::class, 'finalizeAnalysis']);
    Route::put('/bookings/{id}/kirim-koordinator', [BookingController::class, 'kirimKeKoordinator']);
    Route::put('/bookings/{id}/kirim-kepala', [BookingController::class, 'kirimKeKepala']);
    Route::put('/bookings/{id}/approve-by-kepala', [BookingController::class, 'approveByKepala']);
    Route::post('/bookings/{id}/upload-pdf', [BookingController::class, 'uploadPdfAndKirim']);
    Route::post('/bookings/{id}/upload-payment-proof', [BookingController::class, 'uploadPaymentProof']);
    Route::get('/bookings/{id}/pdf', [BookingController::class, 'downloadPdf']);
    Route::get('/bookings/{id}/pdf-generated', [BookingController::class, 'downloadGeneratedPdf']);
    Route::put('/bookings/{id}/verifikasi', [BookingController::class, 'verifikasiKoordinator']);
    Route::post('/bookings/{id}/verify-payment', [BookingController::class, 'verifyPayment']);
    Route::post('/bookings/{id}/send-result-email', [BookingController::class, 'sendResultEmail']);
    Route::delete('/bookings/{id}', [BookingController::class, 'destroy']);

    // Notification Routes
    Route::get('/notifications/unread', [NotificationController::class, 'getUnread']);
    Route::get('/notifications', [NotificationController::class, 'getAll']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

    // Invoice routes
    Route::get('/invoices', [\App\Http\Controllers\Api\InvoiceController::class, 'index']);
    Route::post('/invoices', [\App\Http\Controllers\Api\InvoiceController::class, 'store']);
    Route::post('/invoices/{id}/upload-payment-proof', [\App\Http\Controllers\Api\InvoiceController::class, 'uploadPaymentProof']);
    Route::post('/invoices/from-booking', [\App\Http\Controllers\Api\InvoiceController::class, 'createFromBooking']);
    Route::put('/invoices/{id}/confirm-payment', [\App\Http\Controllers\Api\InvoiceController::class, 'confirmPayment']);
    Route::post('/invoices/{id}/send-email', [\App\Http\Controllers\Api\InvoiceController::class, 'sendToClient']);

    // User management for admin
    Route::get('/users', [\App\Http\Controllers\Api\UserController::class, 'index']);
    Route::post('/users', [\App\Http\Controllers\Api\UserController::class, 'store']);
    Route::patch('/users/{id}', [\App\Http\Controllers\Api\UserController::class, 'update']);

});

// =========================================================================
// PENGUJIAN KONEKSI AWS S3 (MANDIRI)
// =========================================================================
Route::get('/test-s3', function () {
    try {
        $sukses = Storage::disk('s3')->put('test-folder/koneksi-berhasil.txt', 'Koneksi S3 sukses! Siap menyimpan bukti bayar.');
        if ($sukses) {
            return response()->json(['status' => 'Sukses', 'message' => 'File benar-benar sukses terunggah dan masuk ke AWS S3!'], 200);
        } else {
            return response()->json(['status' => 'Gagal', 'message' => 'Gagal mengunggah ke S3.'], 500);
        }
    } catch (\Exception $e) {
        return response()->json(['status' => 'Error Sistem', 'message' => $e->getMessage()], 500);
    }
});

// =========================================================================
// MINGGU 3: TESTING UPLOAD FILE ASLI SECARA BERTAHAH (S3 INTEGRATION)
// =========================================================================

// 1. Pengujian Upload Bukti Pembayaran (Target Folder S3: bukti-transfer)
Route::post('/test-upload-bukti-bayar', function (Request $request) {
    $validator = Validator::make($request->all(), [
        'bukti_pembayaran' => 'required|image|mimes:jpeg,png,jpg|max:2048', // Maks 2MB
    ]);

    if ($validator->fails()) {
        return response()->json(['status' => 'Gagal Validasi', 'errors' => $validator->errors()], 422);
    }

    try {
        $file = $request->file('bukti_pembayaran');
       $path = Storage::disk('s3')->putFile('bukti-transfer', $file);
// Susun URL manual aman tanpa method ->url()
$url = "https://" . config('filesystems.disks.s3.bucket') . ".s3." . config('filesystems.disks.s3.region') . ".amazonaws.com/" . $path;

        return response()->json([
            'status' => 'Sukses',
            'message' => 'Bukti pembayaran asli berhasil masuk ke S3!',
            's3_path' => $path,
            's3_url' => $url
        ], 200);
    } catch (\Exception $e) {
        return response()->json(['status' => 'Error', 'message' => $e->getMessage()], 500);
    }
});

// 2. Pengujian Upload Foto Profil (Target Folder S3: avatars)
Route::post('/test-upload-foto-profil', function (Request $request) {
    $validator = Validator::make($request->all(), [
        'foto_profil' => 'required|image|mimes:jpeg,png,jpg|max:1024', // Maks 1MB
    ]);

    if ($validator->fails()) {
        return response()->json(['status' => 'Gagal Validasi', 'errors' => $validator->errors()], 422);
    }

    try {
        $file = $request->file('foto_profil');
$path = Storage::disk('s3')->putFile('avatars', $file);
$url = "https://" . config('filesystems.disks.s3.bucket') . ".s3." . config('filesystems.disks.s3.region') . ".amazonaws.com/" . $path;

        return response()->json([
            'status' => 'Sukses',
            'message' => 'Foto profil asli berhasil masuk ke S3!',
            's3_path' => $path,
            's3_url' => $url
        ], 200);
    } catch (\Exception $e) {
        return response()->json(['status' => 'Error', 'message' => $e->getMessage()], 500);
    }
});

// 3. Pengujian Upload Dokumen PDF Hasil Analisis Lab (Target Folder S3: hasil-analisis)
Route::post('/test-upload-pdf-hasil', function (Request $request) {
    $validator = Validator::make($request->all(), [
        'dokumen_pdf' => 'required|mimes:pdf|max:5120', // Maks 5MB
    ]);

    if ($validator->fails()) {
        return response()->json(['status' => 'Gagal Validasi', 'errors' => $validator->errors()], 422);
    }

    try {
        $file = $request->file('dokumen_pdf');
$path = Storage::disk('s3')->putFile('hasil-analisis', $file);
$url = "https://" . config('filesystems.disks.s3.bucket') . ".s3." . config('filesystems.disks.s3.region') . ".amazonaws.com/" . $path;

        return response()->json([
            'status' => 'Sukses',
            'message' => 'Dokumen PDF Hasil Lab berhasil masuk ke S3!',
            's3_path' => $path,
            's3_url' => $url
        ], 200);
    } catch (\Exception $e) {
        return response()->json(['status' => 'Error', 'message' => $e->getMessage()], 500);
    }
});
