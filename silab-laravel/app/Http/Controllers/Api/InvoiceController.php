<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Invoice;
use App\Models\Booking;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection as SupportCollection;
use Illuminate\Support\Facades\Mail;
use App\Mail\InvoiceMail;
use Barryvdh\DomPDF\Facade\Pdf as DomPdf;
use Illuminate\Support\Facades\Log;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        // Eager load booking.analysisItems agar frontend bisa menampilkan detail itemized
        $query = Invoice::with(['user', 'booking.analysisItems', 'confirmer'])->orderBy('created_at', 'desc');
        if ($request->filled('status')) $query->where('status', $request->status);
        if ($request->filled('booking_id')) $query->where('booking_id', $request->booking_id);
        $invoices = $query->get();
        return response()->json(['success' => true, 'data' => $invoices]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'invoice_number' => 'required|unique:invoices,invoice_number',
            'user_id' => 'required|exists:users,id',
            'amount' => 'required|numeric',
        ]);

        $inv = Invoice::create([
            'invoice_number' => $request->invoice_number,
            'user_id' => $request->user_id,
            'booking_id' => $request->booking_id,
            'amount' => $request->amount,
            'due_date' => $request->due_date,
            'status' => $request->status ?? 'DRAFT'
        ]);

        return response()->json(['success' => true, 'data' => $inv], 201);
    }

    /**
     * Membuat invoice otomatis dari booking dengan menjumlahkan harga analisis
     */
    public function createFromBooking(Request $request)
    {
        $request->validate([
            'booking_id' => 'required|exists:bookings,id'
        ]);

        $booking = Booking::with('analysisItems', 'user')->findOrFail($request->booking_id);

        if ($booking instanceof SupportCollection) {
            $booking = $booking->first();
        }

        $samples = (int) ($booking->jumlah_sampel ?? 0);
        $sumPrices = 0;
        foreach ($booking->analysisItems as $item) {
            $price = DB::table('analysis_prices')->where('jenis_analisis', $item->nama_item)->value('harga');
            if (!$price) {
                $price = 50000; // Fallback harga per item per sampel
            }
            $sumPrices += (float) $price;
        }
        $amount = $samples * $sumPrices;

        $invNumber = 'INV-' . ($booking->kode_batch ? $booking->kode_batch : (date('Ymd') . '-B' . $booking->id));

        $inv = Invoice::create([
            'invoice_number' => $invNumber,
            'user_id' => $booking->user_id,
            'booking_id' => $booking->id,
            'amount' => $amount,
            'due_date' => now()->addDays(7)->toDateString(),
            'status' => 'UNPAID'
        ]);

        return response()->json(['success' => true, 'data' => $inv], 201);
    }

    public function confirmPayment(Request $request, $id)
    {
        $inv = Invoice::findOrFail($id);
        $inv->status = 'PAID';
        $inv->paid_at = now();
        $inv->confirmed_by = Auth::id();
        $inv->save();
        return response()->json(['success' => true, 'data' => $inv]);
    }

    /**
     * INTEGRASI UPLOAD BUKTI PEMBAYARAN KE AWS S3
     */
    public function uploadPaymentProof(Request $request, $id)
    {
        $inv = Invoice::findOrFail($id);

        // Validasi ekstensi berkas gambar maupun dokumen PDF (Maksimal 10MB)
        $request->validate([
            'file' => 'required|mimes:pdf,jpeg,png,jpg|max:10240'
        ]);

        try {
            $file = $request->file('file');

            /** @var \Illuminate\Filesystem\FilesystemAdapter $s3Disk */
            $s3Disk = Storage::disk('s3');

            // Hapus bukti pembayaran lama di bucket S3 jika ada sebelum menimpa berkas baru
            if ($inv->payment_proof_path && $s3Disk->exists($inv->payment_proof_path)) {
                $s3Disk->delete($inv->payment_proof_path);
            }

            // Simpan berkas langsung ke folder 'bukti-transfer' di dalam bucket AWS S3
            $path = $s3Disk->putFile('bukti-transfer', $file);

            $inv->payment_proof_path = $path;
            $inv->status = 'UNPAID'; // Tetap UNPAID sebelum diverifikasi manual oleh keuangan/admin
            $inv->save();

            return response()->json([
                'success' => true,
                'message' => 'Bukti pembayaran asli berhasil disimpan di AWS S3 cloud!',
                'data' => $inv,
                'url_akses' => $s3Disk->url($path)
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengunggah bukti pembayaran ke cloud storage: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Menghasilkan PDF Invoice dan Mengirimkannya ke Klien via Email (Aset Disimpan di S3)
     */
    public function sendToClient(Request $request, $id)
    {
        $inv = Invoice::with('booking.analysisItems', 'user')->findOrFail($id);
        Log::info('sendToClient called for invoice ' . $id);

        if (!$inv->user || empty($inv->user->email)) {
            Log::error('Invoice send failed: missing user email for invoice ' . $id);
            return response()->json(['success' => false, 'message' => 'Email klien tidak tersedia untuk invoice ini'], 400);
        }

        if (!class_exists('\Barryvdh\DomPDF\Facade\Pdf')) {
            return response()->json(['success' => false, 'message' => 'PDF generator belum terpasang. Jalankan composer require barryvdh/laravel-dompdf'], 500);
        }

        try {
            // Render view blade invoice menjadi dokumen PDF mentah
            $pdf = DomPdf::loadView('pdf.invoice', ['invoice' => $inv])->setPaper('a4', 'portrait');
            $output = $pdf->output();

            $filename = 'invoices/' . $inv->invoice_number . '.pdf';

            /** @var \Illuminate\Filesystem\FilesystemAdapter $s3Disk */
            $s3Disk = Storage::disk('s3');

            // Simpan file hasil generate PDF langsung ke folder 'invoices' di AWS S3
            $s3Disk->put($filename, $output);
            Log::info('Generated invoice PDF at S3 path: ' . $filename . ' for invoice ' . $id);

            // Kirim email notifikasi dengan melampirkan berkas dari cloud storage
            try {
                Mail::to($inv->user->email)->send(new InvoiceMail($inv, $filename));
                Log::info('Mail sent to ' . $inv->user->email . ' for invoice ' . $id);
            } catch (\Exception $e) {
                Log::error('Mail send failed for invoice ' . $id . ': ' . $e->getMessage());
                return response()->json(['success' => false, 'message' => 'Gagal mengirim email: ' . $e->getMessage()], 500);
            }

            return response()->json([
                'success' => true,
                'message' => 'Invoice berhasil dikirim ke email klien!',
                'data' => ['pdf_path' => $filename, 'url_akses' => $s3Disk->url($filename)]
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal menghasilkan PDF: ' . $e->getMessage()], 500);
        }
    }
}
