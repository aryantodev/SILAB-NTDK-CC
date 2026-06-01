import React, { useEffect, useState } from "react";
import NavbarLogin from "./NavbarLoginKlien";
import FooterSetelahLogin from "../FooterSetelahLogin";
import { motion } from "framer-motion";
import { Copy, Clock, CheckCircle, Wallet, Upload, Building, User, FileText } from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";

const PembayaranKlien = () => {
  useEffect(() => {
    document.title = "SILAB-NTDK - Portal Unggah & Pembayaran";
  }, []);

  // State Manajemen Tab & File Tambahan (Minggu 3)
  const [activeTab, setActiveTab] = useState("payment"); // "payment", "profile", "pdf"
  const [selectedProfileFile, setSelectedProfileFile] = useState(null);
  const [selectedPdfFile, setSelectedPdfFile] = useState(null);

  const [detailBooking, setDetailBooking] = useState(null);
  const [data, setData] = useState({
    vaNumber: "0504118998",
    expiryDate: "27 Oktober 2025, 13:00 WIB",
    method: "Bank BNI",
    total: "0",
  });
  const [invoiceIdRaw, setInvoiceIdRaw] = useState(null);
  const [invoiceProofPath, setInvoiceProofPath] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingBookings, setPendingBookings] = useState([]);

  const apiBase = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000/api";
  const apiHost = apiBase.replace(/\/api$/, "");

  // --- FUNGSI FETCH UTAMA ---
  const fetchInvoiceForBooking = async (useBookingId, isBackground = false) => {
    if (!useBookingId) return;
    if (!isBackground) setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${apiBase}/invoices?booking_id=${useBookingId}`, { headers });
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
        const inv = json.data[0];
        setInvoiceIdRaw(inv.id);
        setInvoiceProofPath(inv.payment_proof_path || null);
        const paid = (inv.status && inv.status.toUpperCase() === "PAID") || !!inv.paid_at;
        setPaymentSuccess(paid);
        setData({
          vaNumber: "0504118998",
          expiryDate: inv.due_date ? new Date(inv.due_date).toLocaleDateString("id-ID") : "7 hari dari sekarang",
          method: "Bank BNI",
          total: (inv.amount || 0).toLocaleString("id-ID"),
        });
        if (inv.booking) {
          const merged = { ...inv.booking, pdf_path: inv.booking.pdf_path || inv.pdf_path || inv.booking.pdfPath };
          setDetailBooking(merged);
          if (merged.is_paid || (merged.status && ["selesai", "ditandatangani", "lunas", "paid"].includes((merged.status || "").toLowerCase()))) {
            setPaymentSuccess(true);
          }
        }
      } else {
        // Fallback: Ambil data dari Booking jika invoice belum ada
        const userRes = await fetch(`${apiBase}/bookings`, { headers });
        const userJson = await userRes.json();
        if (userJson && userJson.success) {
          const bookings = userJson.data || [];
          const b = bookings.find((x) => String(x.id) === String(useBookingId));
          if (b) {
            try {
              const pricesRes = await fetch(`${apiBase}/analysis-prices`, { headers });
              const pricesJson = await pricesRes.json();
              const priceMap = {};
              if (Array.isArray(pricesJson)) {
                pricesJson.forEach((p) => {
                  priceMap[(p.jenis_analisis || p.jenisAnalisis || "").toString().toLowerCase()] = Number(p.harga || 0);
                });
              }
              const items = b.analysis_items || b.analysisItems || [];
              let sumPrices = 0;
              if (Array.isArray(items) && items.length > 0) {
                items.forEach((it) => {
                  const name = (it.nama_item || it.namaItem || it || "").toString().toLowerCase();
                  const p = priceMap[name];
                  sumPrices += typeof p === "number" && !isNaN(p) ? p : 50000;
                });
              } else {
                sumPrices = 50000;
              }
              const total = (Number(b.jumlah_sampel) || 0) * sumPrices;
              setData({
                vaNumber: "0504118998",
                expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("id-ID"),
                method: "Bank BNI",
                total: total.toLocaleString("id-ID"),
              });
            } catch (err) {
              const total = (Number(b.jumlah_sampel) || 0) * 50000;
              setData({
                vaNumber: "0504118998",
                expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("id-ID"),
                method: "Bank BNI",
                total: total.toLocaleString("id-ID"),
              });
            }
            setInvoiceIdRaw(null);
            setInvoiceProofPath(b.payment_proof_path || null);
            setPaymentSuccess(!!b.is_paid || (b.status && ["selesai", "ditandatangani", "lunas", "paid"].includes((b.status || "").toLowerCase())));
            setDetailBooking(b);
          }
        }
      }
    } catch (e) {
      console.error("Gagal memuat invoice", e);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // --- HANDLER INTEGRASI UNGHAHAN BARU (MINGGU 3) ---
  const handleProfileUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}`, Accept: "application/json" } : { Accept: "application/json" };
      const fd = new FormData();
      fd.append("foto_profil", file);

      const res = await fetch(`${apiBase}/profile/update`, {
        method: "POST",
        headers,
        body: fd,
      });

      if (res.ok) {
        alert("Foto profil berhasil diperbarui di Cloud S3!");
        setSelectedProfileFile(null);
      } else {
        alert("Gagal memperbarui foto profil.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setUploading(false);
    }
  };

  const handlePdfUpload = async (file) => {
    if (!file) return;
    const id = detailBooking ? detailBooking.id : new URLSearchParams(window.location.search).get("bookingId");
    if (!id) {
      alert("Silakan pilih salah satu kode batch pesanan terlebih dahulu!");
      return;
    }
    setUploading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}`, Accept: "application/json" } : { Accept: "application/json" };
      const fd = new FormData();
      fd.append("dokumen_pdf", file);

      const res = await fetch(`${apiBase}/bookings/${id}/upload-pdf`, {
        method: "POST",
        headers,
        body: fd,
      });

      if (res.ok) {
        alert("Dokumen PDF Hasil Lab sukses dikirim ke S3!");
        setSelectedPdfFile(null);
        const json = await res.json();
        if (json.data) setDetailBooking(json.data);
      } else {
        alert("Gagal mengunggah dokumen PDF.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setUploading(false);
    }
  };

  // --- EFFECT: Load Awal & Polling List Pending ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get("bookingId");
    if (bookingId) fetchInvoiceForBooking(bookingId);

    const fetchPending = async () => {
      try {
        if (params.get("bookingId")) return;
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const userRes = await fetch(`${apiBase}/bookings`, { headers });
        const userJson = await userRes.json();
        if (userJson && userJson.success) {
          const pending = (userJson.data || []).filter((b) => {
            const st = (b.status || "").toLowerCase();
            return st.includes("pembayaran") || st === "menunggu_konfirmasi_pembayaran" || st === "lunas" || st === "paid" || st === "verified" || st === "selesai" || st === "ditandatangani";
          });
          setPendingBookings(pending);
        }
      } catch (e) {
        console.error("Gagal memuat daftar booking", e);
      }
    };
    fetchPending();
    const listInterval = setInterval(() => {
      if (!new URLSearchParams(window.location.search).get("bookingId")) {
        fetchPending();
      }
    }, 10000);

    return () => clearInterval(listInterval);
  }, []);

  // --- EFFECT: Polling Detail ---
  useEffect(() => {
    const id = detailBooking ? detailBooking.id : invoiceIdRaw;
    if (!id) return;
    const iv = setInterval(() => fetchInvoiceForBooking(id, true), 5000);
    return () => clearInterval(iv);
  }, [detailBooking?.id, invoiceIdRaw]);

  const theme = {
    primary: "#483D3F",
    secondary: "#8D766B",
    background: "#F7F5F4",
  };

  const alreadyUploaded = detailBooking && (detailBooking.payment_proof_path || invoiceProofPath);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(data.vaNumber);
    alert("Nomor VA berhasil disalin!");
  };

  const getDisplayedTotal = () => {
    if (data && data.total && String(data.total).trim() !== "" && String(data.total).trim() !== "0") return data.total;
    const b = detailBooking;
    const candidates = [b && b.amount, b && b.total_amount, b && b.invoice_amount, b && b.harga, b && b.jumlah_sampel && b.jumlah_sampel * 50000];
    for (const c of candidates) {
      if (typeof c === "number" && !isNaN(c) && c > 0) return Number(c).toLocaleString("id-ID");
      if (typeof c === "string" && c.trim() !== "") {
        const n = Number(c);
        if (!isNaN(n) && n > 0) return n.toLocaleString("id-ID");
      }
    }
    if (loading) return "...";
    return "0";
  };

  const handleBackToList = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("bookingId");
      window.history.replaceState({}, "", url.toString());
    } catch (e) {
      window.location.search = "";
    }
    setDetailBooking(null);
    setInvoiceIdRaw(null);
    setInvoiceProofPath(null);
    setPaymentSuccess(false);
    setSelectedFile(null);
    setSelectedPdfFile(null);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 80);
  };

  return (
    <NavbarLogin>
      <div className="container-fluid min-vh-100 py-5" style={{ backgroundColor: "#F8F9FA" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto bg-white shadow-sm border" style={{ maxWidth: "500px", borderRadius: "24px", overflow: "hidden" }}>
          
          {/* Header */}
          <div className="p-4 text-center border-bottom bg-white">
            <h4 className="fw-bold mb-1">Pusat Unggah Berkas</h4>
            <p className="text-muted small mb-0">Manajemen berkas digital layanan SILAB-NTDK</p>
          </div>

          {/* Tabs Navigation Switcher (Minggu 3) */}
          <div className="d-flex border-bottom bg-light">
            <button 
              className={`flex-fill py-3 border-0 fw-semibold small transition-all ${activeTab === "payment" ? "bg-white border-bottom border-2 border-dark text-dark" : "text-muted bg-light"}`}
              onClick={() => setActiveTab("payment")}
            >
              <Wallet size={16} className="me-2 d-inline" /> Pembayaran
            </button>
            <button 
              className={`flex-fill py-3 border-0 fw-semibold small transition-all ${activeTab === "profile" ? "bg-white border-bottom border-2 border-dark text-dark" : "text-muted bg-light"}`}
              onClick={() => setActiveTab("profile")}
            >
              <User size={16} className="me-2 d-inline" /> Foto Profil
            </button>
            <button 
              className={`flex-fill py-3 border-0 fw-semibold small transition-all ${activeTab === "pdf" ? "bg-white border-bottom border-2 border-dark text-dark" : "text-muted bg-light"}`}
              onClick={() => setActiveTab("pdf")}
            >
              <FileText size={16} className="me-2 d-inline" /> Dokumen PDF
            </button>
          </div>

          <div className="p-4">
            
            {/* =========================================================================
                TAB 1: PEMBAYARAN & BUKTI TRANSFER
                ========================================================================= */}
            {activeTab === "payment" && (
              !detailBooking ? (
                <div className="d-flex flex-column gap-3">
                  <p className="text-muted small mb-0 text-center">Pilih transaksi aktif untuk melihat tagihan Virtual Account:</p>
                  {pendingBookings.length === 0 ? (
                    <div className="text-center py-4 text-muted small">Tidak ada daftar tagihan aktif saat ini.</div>
                  ) : (
                    pendingBookings.map((b) => (
                      <div key={b.id} onClick={() => fetchInvoiceForBooking(b.id)} className="p-3 border rounded-4 d-flex justify-content-between align-items-center cursor-pointer hover-effect" style={{ cursor: "pointer" }}>
                        <div>
                          <div className="fw-bold">{b.kode_batch || `Order #${b.id}`}</div>
                          <div className="text-muted small text-capitalize">{b.status?.replace(/_/g, ' ')}</div>
                        </div>
                        <button className="btn btn-light btn-sm rounded-pill px-3 fw-bold">Detail</button>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="text-center">
                  {/* Stepper */}
                  <div className="d-flex align-items-center justify-content-center mb-5 mt-2 position-relative">
                    <div className="d-flex flex-column align-items-center z-1">
                      <div className="rounded-circle d-flex align-items-center justify-content-center border" style={{ width: "50px", height: "50px", backgroundColor: paymentSuccess ? "#E9ECEF" : "#7D6E66", color: paymentSuccess ? "#ADB5BD" : "#FFF" }}>
                        <Clock size={24} />
                      </div>
                      <span className="small mt-2 fw-bold" style={{ color: paymentSuccess ? "#ADB5BD" : "#7D6E66" }}>Menunggu</span>
                    </div>
                    <div className="flex-grow-1 mx-2" style={{ height: "4px", backgroundColor: "#E9ECEF", maxWidth: "80px", marginTop: "-25px" }}>
                      <div style={{ width: paymentSuccess ? "100%" : "50%", height: "100%", backgroundColor: "#7D6E66" }}></div>
                    </div>
                    <div className="d-flex flex-column align-items-center z-1">
                      <div className="rounded-circle d-flex align-items-center justify-content-center border" style={{ width: "50px", height: "50px", backgroundColor: paymentSuccess ? "#7D6E66" : "#E9ECEF", color: paymentSuccess ? "#FFF" : "#ADB5BD" }}>
                        <CheckCircle size={24} />
                      </div>
                      <span className="small mt-2 fw-bold" style={{ color: paymentSuccess ? "#7D6E66" : "#ADB5BD" }}>Berhasil</span>
                    </div>
                  </div>

                  {/* VA Box */}
                  <div className="border rounded-4 p-4 mb-4 text-start">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="text-muted fw-bold small">Nomor Virtual Account</span>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <Building size={18} />
                        <span className="small fw-bold" style={{ fontSize: 12 }}>BNI</span>
                      </div>
                    </div>
                    <div className="bg-light p-3 rounded-3 d-flex justify-content-between align-items-center border">
                      <span className="fs-4 fw-bold letter-spacing-2" style={{ letterSpacing: "3px" }}>{data.vaNumber}</span>
                      <Copy size={20} className="text-muted cursor-pointer" onClick={copyToClipboard} />
                    </div>
                  </div>

                  {/* Expiry Badge */}
                  <div className="bg-danger-subtle text-danger py-2 px-3 rounded-pill mb-4 d-inline-flex align-items-center gap-2 small fw-bold">
                    <Clock size={16} /> Bayar sebelum: {data.expiryDate}
                  </div>

                  {/* Table */}
                  <div className="border-top pt-3 text-start">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted small">Metode Pembayaran</span>
                      <span className="fw-bold small">{data.method}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                      <span className="text-muted small">Total yang harus dibayar</span>
                      <span className="fw-bold fs-4">Rp {getDisplayedTotal()}</span>
                    </div>
                  </div>

                  {alreadyUploaded && (
                    <div className="mb-3 p-3 rounded-4 border d-flex justify-content-between align-items-center bg-light mt-4">
                      <div className="d-flex align-items-center gap-2">
                        <CheckCircle size={18} className="text-success" />
                        <div className="text-start">
                          <div className="small fw-bold">Bukti Pembayaran</div>
                          <div className="text-muted" style={{ fontSize: "10px" }}>Telah diunggah ke S3</div>
                        </div>
                      </div>
                      <a href={`${apiHost}/storage/${detailBooking?.payment_proof_path || invoiceProofPath}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-bold" style={{ fontSize: "12px" }}>Lihat Bukti</a>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="d-grid gap-2 mt-4">
                    <button
                      className="btn py-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                      style={{ backgroundColor: selectedFile ? "#28a745" : "#3D3432", color: "#FFF", borderRadius: "14px", border: "none" }}
                      disabled={uploading || alreadyUploaded}
                      onClick={async () => {
                        if (!selectedFile) {
                          document.getElementById("file-upload").click();
                        } else {
                          setUploading(true);
                          try {
                            const token = localStorage.getItem("token");
                            const headers = token ? { Authorization: `Bearer ${token}`, Accept: "application/json" } : { Accept: "application/json" };
                            const fd = new FormData();
                            fd.append("file", selectedFile);
                            const id = detailBooking ? detailBooking.id : new URLSearchParams(window.location.search).get("bookingId");
                            const res = await fetch(`${apiBase}/bookings/${id}/upload-payment-proof`, { method: "POST", headers, body: fd });
                            if (res.ok) {
                              alert("Bukti pembayaran berhasil dikirim!");
                              setSelectedFile(null);
                              const json = await res.json();
                              if (json.data) setDetailBooking(json.data);
                            } else {
                              alert("Gagal mengirim bukti.");
                            }
                          } catch (err) {
                            console.error(err);
                            alert("Terjadi kesalahan.");
                          } finally {
                            setUploading(false);
                          }
                        }
                      }}
                    >
                      {uploading ? <>Tunggu sebentar...</> : alreadyUploaded ? <>Bukti Sudah Terkirim</> : selectedFile ? <><CheckCircle size={20} /> Kirim Bukti Sekarang</> : <><Upload size={20} /> Unggah Bukti Pembayaran</>}
                    </button>
                    <input type="file" id="file-upload" hidden accept="image/*" onChange={(e) => setSelectedFile(e.target.files[0])} />
                    
                    {selectedFile && <div className="text-success small fw-bold mt-1">✓ File siap kirim: {selectedFile.name}</div>}

                    <button className="btn btn-light py-3 border-0 fw-bold d-flex align-items-center justify-content-center gap-2" style={{ borderRadius: "14px", color: "#666" }} onClick={() => fetchInvoiceForBooking(detailBooking?.id)}>
                      <span style={{ fontSize: 18 }}>↻</span> Cek Status Otomatis
                    </button>
                  </div>

                  <button className="btn btn-link text-muted small mt-3 text-decoration-none" onClick={handleBackToList}>
                    Kembali ke daftar pesanan
                  </button>
                </div>
              )
            )}

            {/* =========================================================================
                TAB 2: FOTO PROFIL (MINGGU 3)
                ========================================================================= */}
            {activeTab === "profile" && (
              <div className="text-center py-3">
                <div className="mb-4">
                  <div className="d-inline-flex align-items-center justify-content-center shadow-sm bg-light rounded-circle" style={{ width: 110, height: 110, color: theme.primary }}>
                    <User size={48} />
                  </div>
                </div>
                <h5 className="fw-bold mb-2">Perbarui Foto Profil</h5>
                <p className="text-muted small mb-4">Pilih file gambar berformat JPG, JPEG, atau PNG (Maksimal 1MB)</p>
                
                <div className="d-grid gap-2">
                  <button
                    className="btn Restoration-Button py-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                    style={{ backgroundColor: selectedProfileFile ? "#28a745" : "#7D766B", color: "#FFF", borderRadius: "14px", border: "none" }}
                    disabled={uploading}
                    onClick={() => {
                      if (!selectedProfileFile) {
                        document.getElementById("profile-file-upload").click();
                      } else {
                        handleProfileUpload(selectedProfileFile);
                      }
                    }}
                  >
                    {uploading ? "Mengirim ke S3..." : selectedProfileFile ? <><CheckCircle size={20} /> Simpan Foto Profil Sekarang</> : <><Upload size={20} /> Pilih Foto Profil</>}
                  </button>
                  <input type="file" id="profile-file-upload" hidden accept="image/*" onChange={(e) => setSelectedProfileFile(e.target.files[0])} />
                  
                  {selectedProfileFile && (
                    <span className="text-success small fw-semibold mt-1">✓ Berkas terpilih: {selectedProfileFile.name}</span>
                  )}
                </div>
              </div>
            )}

            {/* =========================================================================
                TAB 3: DOKUMEN PDF (MINGGU 3)
                ========================================================================= */}
            {activeTab === "pdf" && (
              <div className="text-center py-2">
                {!detailBooking ? (
                  <div className="d-flex flex-column gap-3">
                    <p className="text-muted small mb-1">Silakan pilih batch pesanan untuk menyematkan berkas PDF hasil lab:</p>
                    {pendingBookings.map((b) => (
                      <div key={b.id} onClick={() => { setDetailBooking(b); fetchInvoiceForBooking(b.id, false); }} className="p-3 border rounded-4 d-flex justify-content-between align-items-center cursor-pointer hover-effect" style={{ cursor: "pointer" }}>
                        <div>
                          <div className="fw-bold">{b.kode_batch || `Order #${b.id}`}</div>
                          <div className="text-muted small text-capitalize">{b.status?.replace(/_/g, ' ')}</div>
                        </div>
                        <button className="btn btn-light btn-sm rounded-pill px-3 fw-bold">Pilih</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    <div className="mb-4">
                      <div className="d-inline-flex align-items-center justify-content-center shadow-sm bg-light rounded-circle" style={{ width: 110, height: 110, color: theme.primary }}>
                        <FileText size={46} />
                      </div>
                    </div>
                    <h5 className="fw-bold mb-1">Unggah PDF Hasil Lab</h5>
                    <p className="text-muted small mb-2">Batch: <span className="fw-bold text-dark">{detailBooking.kode_batch || `#${detailBooking.id}`}</span></p>
                    <p className="text-muted small mb-4">Berkas wajib bertipe dokumen PDF asli (Maksimal 5MB)</p>
                    
                    <div className="d-grid gap-2">
                      <button
                        className="btn py-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                        style={{ backgroundColor: selectedPdfFile ? "#28a745" : "#483D3F", color: "#FFF", borderRadius: "14px", border: "none" }}
                        disabled={uploading}
                        onClick={() => {
                          if (!selectedPdfFile) {
                            document.getElementById("pdf-file-upload").click();
                          } else {
                            handlePdfUpload(selectedPdfFile);
                          }
                        }}
                      >
                        {uploading ? "Mengirim ke S3..." : selectedPdfFile ? <><CheckCircle size={20} /> Kirim Dokumen PDF Sekarang</> : <><Upload size={20} /> Pilih Berkas PDF</>}
                      </button>
                      <input type="file" id="pdf-file-upload" hidden accept="application/pdf" onChange={(e) => setSelectedPdfFile(e.target.files[0])} />
                      
                      {selectedPdfFile && (
                        <span className="text-success small fw-semibold mt-1">✓ Berkas terpilih: {selectedPdfFile.name}</span>
                      )}
                    </div>

                    <button className="btn btn-link text-muted small mt-4 text-decoration-none" onClick={handleBackToList}>
                      Kembali ke daftar pesanan
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </motion.div>
      </div>

      <style>{`
        .letter-spacing-2 { letter-spacing: 2px; }
        .hover-effect:hover { background-color: #F8F9FA; border-color: #DDD !important; }
        .z-1 { z-index: 1; }
        .transition-all { transition: all 0.2s ease-in-out; }
      `}</style>
      <FooterSetelahLogin />
    </NavbarLogin>
  );
};

export default PembayaranKlien;