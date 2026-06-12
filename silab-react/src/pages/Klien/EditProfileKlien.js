import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Image, Spinner } from "react-bootstrap";
import FooterSetelahLogin from "../FooterSetelahLogin";
import NavbarProfile from "./NavbarProfile";
import CustomPopup from "../../components/Common/CustomPopup";
import { FaUserCircle, FaCamera } from "react-icons/fa";
import { useHistory } from "react-router-dom";
import axios from "axios";
import "@fontsource/poppins";

function EditProfileKlien() {
  useEffect(() => {
    document.title = "SILAB-NTDK - Edit Profil Klien";
  }, []);

  const history = useHistory();
  const token = localStorage.getItem("token");

  // State Form
  const [formData, setFormData] = useState({
    name: "",
    full_name: "",
    email: "",
    institusi: "",
    nomor_telpon: "",
    role: "",
    bio: "",
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);

  // State untuk popup
  const [popup, setPopup] = useState({ show: false, title: "", message: "", type: "info", onClose: null });

  // 1. LOAD DATA DARI DATABASE (DENGAN REPLIKA URL AWS S3)
  useEffect(() => {
    if (!token) {
      history.push("/login");
      return;
    }

    axios
      .get("http://52.77.226.138:8000/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const user = res.data.user;

        // Deteksi User Baru (Jika Nama Lengkap / Institusi masih kosong)
        if (!user.full_name || !user.institusi) {
          setIsFirstTime(true);
        } else {
          setIsFirstTime(false);
        }

        // Isi form dengan data yang ada
        setFormData({
          name: user.name || "",
          full_name: user.full_name || "",
          email: user.email || "",
          institusi: user.institusi || "", 
          nomor_telpon: user.nomor_telpon || "",
          role: user.role || "",
          bio: user.bio || "",
        });

        // [INTEGRASI S3] Membaca URL langsung dari Cloud AWS S3 jika tersedia
        if (user.avatar_url) {
          setPreviewAvatar(user.avatar_url);
        } else if (user.avatar) {
          setPreviewAvatar(`http://52.77.226.138:8000/storage/${user.avatar}`);
        }
      })
      .catch((err) => {
        console.error("Gagal ambil data:", err);
      })
      .finally(() => setLoading(false));
  }, [history, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setPreviewAvatar(URL.createObjectURL(file)); // Preview instan di sisi klien
    }
  };

  // 2. FUNGSI SIMPAN DENGAN TRANSMISI FILE KE BACKEND -> AWS S3
  const handleSave = async () => {
    // --- [VALIDASI FRONTEND] ---
    if (!formData.full_name.trim()) {
      setPopup({
        show: true,
        title: "Nama Lengkap wajib diisi!",
        message: "Mohon isi nama lengkap Anda sebelum menyimpan profil.",
        type: "error",
        onClose: () => setPopup((p) => ({ ...p, show: false })),
      });
      return;
    }
    if (!formData.institusi || formData.institusi === "") {
      setPopup({
        show: true,
        title: "Institusi wajib dipilih!",
        message: "Silakan pilih institusi Anda sebelum menyimpan profil.",
        type: "error",
        onClose: () => setPopup((p) => ({ ...p, show: false })),
      });
      return;
    }
    if (!formData.nomor_telpon.trim()) {
      setPopup({
        show: true,
        title: "Nomor Telepon wajib diisi!",
        message: "Mohon isi nomor telepon Anda sebelum menyimpan profil.",
        type: "error",
        onClose: () => setPopup((p) => ({ ...p, show: false })),
      });
      return;
    }

    setSaving(true);
    const dataToSend = new FormData();
    dataToSend.append("name", formData.name);
    dataToSend.append("full_name", formData.full_name);
    dataToSend.append("email", formData.email);
    dataToSend.append("institusi", formData.institusi);
    dataToSend.append("nomor_telpon", formData.nomor_telpon);
    dataToSend.append("bio", formData.bio || "");
    if (avatarFile) {
      dataToSend.append("avatar", avatarFile); // Menggunakan key 'avatar' sesuai validasi backend terbaru
    }

    try {
      const response = await axios.post("http://52.77.226.138:8000/api/profile/update", dataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Update LocalStorage agar Navbar tahu data sudah lengkap
      const updatedUser = response.data.user;
      localStorage.setItem("user", JSON.stringify(updatedUser));

      // Jika backend merespons dengan URL S3 baru, perbarui state preview
      if (response.data.avatar_url) {
        setPreviewAvatar(response.data.avatar_url);
      }

      // --- LOGIKA REDIRECT TERSTRUKTUR ---
      if (isFirstTime) {
        setPopup({
          show: true,
          title: "Profil Lengkap!",
          message: "Selamat! Profil Anda sudah lengkap. Anda akan diarahkan ke Dashboard.",
          type: "success",
          onClose: () => {
            setPopup((p) => ({ ...p, show: false }));
            history.push("/dashboard");
          },
        });
      } else {
        setPopup({
          show: true,
          title: "Profil berhasil diperbarui!",
          message: "Data profil Anda telah berhasil disimpan di Cloud Storage.",
          type: "success",
          onClose: () => {
            setPopup((p) => ({ ...p, show: false }));
            history.push("/dashboard/ProfileAkunKlien");
          },
        });
      }
    } catch (error) {
      console.error("Gagal update:", error.response);
      const msg = error.response?.data?.message || "Terjadi kesalahan saat menyimpan.";
      const validationErrors = error.response?.data?.errors;

      if (validationErrors) {
        if (validationErrors.avatar) {
          setPopup({
            show: true,
            title: "Gagal upload avatar",
            message: `${validationErrors.avatar[0]}\nPastikan file adalah gambar (JPG, PNG, WEBP, GIF)`,
            type: "error",
            onClose: () => setPopup((p) => ({ ...p, show: false })),
          });
        } else if (validationErrors.name) {
          setPopup({
            show: true,
            title: "Gagal menyimpan profil",
            message: validationErrors.name[0],
            type: "error",
            onClose: () => setPopup((p) => ({ ...p, show: false })),
          });
        } else if (validationErrors.full_name) {
          setPopup({
            show: true,
            title: "Gagal menyimpan profil",
            message: validationErrors.full_name[0],
            type: "error",
            onClose: () => setPopup((p) => ({ ...p, show: false })),
          });
        } else {
          setPopup({
            show: true,
            title: "Gagal menyimpan profil",
            message: msg,
            type: "error",
            onClose: () => setPopup((p) => ({ ...p, show: false })),
          });
        }
      } else {
        setPopup({
          show: true,
          title: "Gagal menyimpan profil",
          message: msg,
          type: "error",
          onClose: () => setPopup((p) => ({ ...p, show: false })),
        });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5" style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#F7F5F4" }}>
        <Spinner animation="border" style={{ color: "#8D766B" }} />
      </div>
    );
  }

  const userForNavbar = {
    name: formData.name,
    role: formData.role,
    avatar: previewAvatar,
  };

  return (
    <div style={{ backgroundColor: "#F7F5F4", minHeight: "100vh" }}>
      <NavbarProfile user={userForNavbar} />

      <div className="container py-5 font-poppins">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            
            {/* CARD CONTAINER ENTERPRISE STYLE */}
            <div className="card shadow-sm border-0 overflow-hidden" style={{ borderRadius: "24px", backgroundColor: "#FFF" }}>
              
              {/* Header Bertema Mocha/Earth */}
              <div className="p-4 text-center text-white" style={{ backgroundColor: "#4A3A2E" }}>
                <h4 className="fw-bold mb-1">Pengaturan Akun Klien</h4>
                <p className="mb-0 small text-white-50">Lengkapi informasi data profil layanan analisis laboratorium Anda</p>
              </div>

              <div className="card-body p-4">
                
                {/* UPLOADER FOTO PROFIL */}
                <div className="text-center mb-4">
                  <div className="position-relative d-inline-block">
                    {previewAvatar ? (
                      <Image src={previewAvatar} roundedCircle width={130} height={130} className="shadow-sm border border-3" style={{ objectFit: "cover", borderColor: "#8D766B" }} />
                    ) : (
                      <FaUserCircle size={130} style={{ color: "#8D766B" }} />
                    )}
                    <label htmlFor="avatarInput" className="position-absolute bottom-0 end-0 text-white p-2 rounded-circle shadow border border-2 border-white d-flex align-items-center justify-content-center" style={{ cursor: "pointer", backgroundColor: "#8D766B", width: "38px", height: "38px" }}>
                      <FaCamera size={16} />
                    </label>
                  </div>
                  <div className="mt-3">
                    <h5 className="fw-bold mb-0" style={{ color: "#4A3A2E" }}>{formData.full_name || formData.name || "Pengguna Baru"}</h5>
                    <p className="text-muted small">@{formData.name || "username"}</p>
                  </div>
                  <input type="file" accept="image/*" id="avatarInput" style={{ display: "none" }} onChange={handleAvatarChange} />
                </div>

                {/* FORM DATA INPUT */}
                <div className="mb-3">
                  <label className="form-label fw-semibold small text-secondary">Username <span className="text-danger">*</span></label>
                  <input type="text" className="form-control rounded-3 py-2 border-secondary-subtle" name="name" value={formData.name} onChange={handleChange} required />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold small text-secondary">Nama Lengkap <span className="text-danger">*</span></label>
                  <input type="text" className="form-control rounded-3 py-2 border-secondary-subtle" name="full_name" value={formData.full_name} onChange={handleChange} placeholder="Contoh: Aryanto Pratama, S.Kom" required />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold small text-secondary">Email <span className="text-danger">*</span></label>
                  <input type="email" className="form-control bg-light rounded-3 py-2 text-muted" name="email" value={formData.email} disabled style={{ cursor: "not-allowed" }} />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold small text-secondary">Institusi <span className="text-danger">*</span></label>
                  <select className="form-select rounded-3 py-2 border-secondary-subtle" name="institusi" value={formData.institusi} onChange={handleChange} required>
                    <option value="" disabled>-- Pilih Jenis Institusi --</option>
                    <optgroup label="Eksternal">
                      <option value="Umum">Umum / Instansi Luar</option>
                    </optgroup>
                    <optgroup label="Internal IPB">
                      <option value="Mahasiswa IPB">Mahasiswa IPB</option>
                      <option value="Dosen IPB">Dosen IPB</option>
                      <option value="Tendik IPB">Tendik IPB</option>
                    </optgroup>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold small text-secondary">Nomor Telepon <span className="text-danger">*</span></label>
                  <input type="text" className="form-control rounded-3 py-2 border-secondary-subtle" name="nomor_telpon" value={formData.nomor_telpon} onChange={handleChange} placeholder="Contoh: 08123456789" required />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold small text-secondary">Role</label>
                  <input type="text" className="form-control bg-light rounded-3 py-2 text-muted text-uppercase" name="role" value={formData.role} disabled style={{ cursor: "not-allowed" }} />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold small text-secondary">Bio Singkat</label>
                  <textarea className="form-control rounded-3 border-secondary-subtle" name="bio" value={formData.bio} onChange={handleChange} rows={3} placeholder="Tulis bio singkat atau instansi asal Anda (opsional)..." />
                </div>

                {/* AREA TOMBOL AKSI */}
                <div className="d-flex gap-2 mt-4 pt-2 border-top">
                  <button 
                    className="btn px-4 fw-bold shadow-sm border-0 py-2 flex-grow-1" 
                    style={{ backgroundColor: "#8D766B", color: "#FFF", borderRadius: "12px" }}
                    onClick={handleSave} 
                    disabled={saving}
                  >
                    {saving ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : "Simpan Profil"}
                  </button>
                  
                  {!isFirstTime && (
                    <button 
                      className="btn btn-outline-secondary px-4 fw-bold py-2" 
                      style={{ borderRadius: "12px" }}
                      onClick={() => history.goBack()} 
                      disabled={saving}
                    >
                      Batal
                    </button>
                  )}
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
      <CustomPopup show={popup.show} title={popup.title} message={popup.message} type={popup.type} buttonText="OK" onClose={popup.onClose} />
      <FooterSetelahLogin />
    </div>
  );
}

export default EditProfileKlien;