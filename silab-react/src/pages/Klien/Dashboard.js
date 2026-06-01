import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import NavbarLoginKlien from "./NavbarLoginKlien";
import "@fontsource/poppins";
import { getUser } from "../../services/AuthService";
import { getUserBookings } from "../../services/BookingService";
import FooterSetelahLogin from "../FooterSetelahLogin";

function Dashboard() {
  useEffect(() => {
    document.title = "SILAB-NTDK - Dashboard Klien";
  }, []);

  const history = useHistory();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, inProgress: 0, completed: 0 });

  const colors = {
    background: "#FDFBF7",
    cardBg: "#FFFFFF",
    primary: "#8D6E63",
    accent: "#A1887F",
    soft: "#D7CCC8",
    text: "#4E342E",
    muted: "#8D6E63",
  };

  useEffect(() => {
    const user = getUser();
    setUsername(user?.name || user?.username || user?.email || "Pengguna");
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await getUserBookings();
        const data = Array.isArray(res) ? res : res?.data || [];

        const valid = data.filter((b) => !["ditolak", "dibatalkan"].includes((b.status || "").toLowerCase()));

        setStats({
          total: valid.length,
          inProgress: valid.filter((b) => (b.status || "").toLowerCase() === "proses").length,
          completed: valid.filter((b) => ["selesai", "ditandatangani"].includes((b.status || "").toLowerCase())).length,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon, bg }) => (
    <div className="col-12 col-md-4 mb-4">
      <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 18 }}>
        <div className="card-body d-flex align-items-center gap-3 p-4">
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              backgroundColor: bg,
              color: "#fff",
              fontSize: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </div>
          <div>
            <small style={{ color: colors.muted }}>{title}</small>
            <h4 className="fw-bold mb-0" style={{ color: colors.text }}>
              {loading ? "—" : value}
            </h4>
          </div>
        </div>
      </div>
    </div>
  );

  const Step = ({ number, title, desc }) => (
    <div className="d-flex gap-3 mb-4">
      <div
        className="fw-bold d-flex align-items-center justify-content-center"
        style={{
          minWidth: 46,
          height: 46,
          borderRadius: "50%",
          border: `2px solid ${colors.soft}`,
          color: colors.primary,
          background: "#FAFAFA",
        }}
      >
        {number}
      </div>
      <div>
        <h6 className="fw-bold mb-1" style={{ color: colors.text }}>
          {title}
        </h6>
        <p className="small mb-0" style={{ color: colors.muted }}>
          {desc}
        </p>
      </div>
    </div>
  );

  return (
    <NavbarLoginKlien>
      <div
        style={{
          fontFamily: "Poppins, sans-serif",
          minHeight: "100vh",
          background: colors.background,
          padding: "3rem 0 4rem",
        }}
      >
        <div className="container">
          {/* Header */}
          <div className="row align-items-center mb-5">
            <div className="col-md-8 text-center text-md-start mb-3 mb-md-0">
              <h3 className="fw-light mb-1" style={{ color: colors.text }}>
                Jumpa lagi,
                <span className="fw-bold ms-1" style={{ color: colors.primary }}>
                  {username}
                </span>{" "}
                👋
              </h3>
              <p className="mb-0" style={{ color: colors.muted }}>
                Selamat datang di pusat kendali layanan laboratorium Anda
              </p>
            </div>
            <div className="col-md-4 text-center text-md-end">
              <button
                className="btn px-4 py-2 text-white shadow-sm"
                style={{
                  borderRadius: 14,
                  background: colors.primary,
                  transition: "0.3s",
                }}
                onMouseEnter={(e) => (e.target.style.background = colors.accent)}
                onMouseLeave={(e) => (e.target.style.background = colors.primary)}
                onClick={() => (window.location.href = "/dashboard/pemesananSampelKlien")}
              >
                + Buat Pesanan Baru
              </button>
            </div>
          </div>

          {/* Statistik */}
          <div className="row">
            <StatCard title="Total Pemesanan" value={stats.total} icon="📄" bg="#BCAAA4" />
            <StatCard title="Proses Analisis" value={stats.inProgress} icon="⏳" bg="#D7CCC8" />
            <StatCard title="Hasil Selesai" value={stats.completed} icon="✅" bg="#8D6E63" />
          </div>

          {/* Alur */}
          <div className="card border-0 shadow-sm mt-3" style={{ borderRadius: 22 }}>
            <div className="card-body p-4 p-md-5">
              <h5 className="fw-bold mb-4" style={{ color: colors.text }}>
                Alur Pemesanan Analisis
              </h5>

              <Step number="01" title="Isi Formulir Pemesanan" desc="Lengkapi data sampel melalui tombol Buat Pemesanan Baru." />
              <Step number="02" title="Kirim Sampel ke Laboratorium" desc="Kirim sampel fisik beserta kode pendaftaran." />
              <Step number="03" title="Pantau & Unduh Hasil" desc="Hasil tersedia setelah pengujian selesai." />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }
        
        @media (max-width: 768px) {
          .floating-faq {
            bottom: 20px !important;
            right: 20px !important;
            width: 60px !important;
            height: 60px !important;
            font-size: 28px !important;
          }
        }
      `}</style>
      <FooterSetelahLogin />
    </NavbarLoginKlien>
  );
}

export default Dashboard;
