<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage; // Tambahkan ini

class InvoiceMail extends Mailable
{
    use Queueable, SerializesModels;

    public $invoice;
    public $pdfPath;

    public function __construct($invoice, $pdfPath = null)
    {
        $this->invoice = $invoice;
        $this->pdfPath = $pdfPath;
    }

    public function build()
    {
        $mail = $this->subject('Invoice Anda dari Laboratorium')
                     ->view('emails.invoice_email')
                     ->with(['invoice' => $this->invoice]);

        // Cek apakah path ada dan file tersedia di S3
        if ($this->pdfPath && Storage::disk('s3')->exists($this->pdfPath)) {
            // Ambil konten file dari S3
            $pdfContent = Storage::disk('s3')->get($this->pdfPath);

            // Gunakan attachData karena file berasal dari storage cloud/S3
            $mail->attachData($pdfContent, basename($this->pdfPath), [
                'mime' => 'application/pdf',
            ]);
        }

        return $mail;
    }
}
