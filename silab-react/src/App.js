import React from "react";
import { BrowserRouter as Router, Switch, Route, Redirect } from "react-router-dom";
import { useAutoLogout } from "./hooks/useAutoLogout";

// --- IMPORT COMPONENT ---
import NavbarLandingPage from "./pages/NavbarLandingPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Profile from "./pages/Profile";
import DaftarAnalisis from "./pages/DaftarAnalisis";
import ForgetPassword from "./pages/ForgetPassword";
import Galeri from "./pages/Galeri";
import PanduanSampel from "./pages/PanduanSampel";
import PrivateRoute from "./pages/PrivateRoute"; // Pastikan file ini sudah diupdate dengan logika Role!
import PopupProvider from "./components/Common/PopupProvider";
import UnauthorizedPage from "./pages/UnauthorizedPage"; // ⭐ NEW: Halaman Unauthorized

// --- IMPORT FITUR DASHBOARD KLIEN ---
import Dashboard from "./pages/Klien/Dashboard"; // Dashboard Klien
import PanduanSampelKlien from "./pages/Klien/PanduanSampelKlien";
import BookingCalenderKlien from "./pages/Klien/BookingCalenderKlien";
import PemesananSampelKlien from "./pages/Klien/PemesananSampelKlien";
import Metabolit from "./pages/Klien/Metabolit";
import Hematologi from "./pages/Klien/Hematologi";
import HematologiDanMetabolit from "./pages/Klien/HematologiDanMetabolit";
import MenungguPersetujuan from "./pages/Klien/MenungguPersetujuan";
import ProsesAnalisis from "./pages/Klien/ProsesAnalisis";
import ProfileAkunKlien from "./pages/Klien/ProfileAkunKlien";
import EditProfileKlien from "./pages/Klien/EditProfileKlien";
import DaftarAnalisisLogin from "./pages/Klien/DaftarAnalisisLogin";
import PembayaranKlien from "./pages/Klien/PembayaranKlien";
import RiwayatAnalisisKlien from "./pages/Klien/RiwayatAnalisisKlien";

// --- IMPORT FITUR DASHBOARD TEKNISI ---
import DashboardTeknisi from "./pages/Teknisi/DashboardTeknisi";
import AturTanggalTeknisi from "./pages/Teknisi/AturTanggalTeknisi";
import JadwalSampel from "./pages/Teknisi/JadwalSampel";
import VerifikasiSampel from "./pages/Teknisi/VerifikasiSampel";
import AlasanMenolak from "./pages/Teknisi/AlasanMenolak";
import InputNilaiAnalisis from "./pages/Teknisi/InputNilaiAnalisis";
import FormInputNilaiAnalisis from "./pages/Teknisi/FormInputNilaiAnalisis";
import GeneratePdfAnalysis from "./pages/Teknisi/GeneratePdfAnalysis";
import ProfileAkunTeknisi from "./pages/Teknisi/ProfileAkunTeknisi";
import EditProfileTeknisi from "./pages/Teknisi/EditProfileTeknisi";

// --- IMPORT FITUR DASHBOARD Koordinator ---
import DashboardKoordinator from "./pages/Koordinator/DashboardKoordinator";
import VerifikasiSampelKoordinator from "./pages/Koordinator/VerifikasiSampelKoordinator";
import LihatHasilPdfKoordinator from "./pages/Koordinator/LihatHasilPdfKoordinator";
import TandaTanganKoordinator from "./pages/Koordinator/TandaTanganKoordinator";
import ManajemenPembayaran from "./pages/Koordinator/ManajemenPembayaran";
import LaporanKoordinator from "./pages/Koordinator/LaporanKoordinator";
import ManajemenAkun from "./pages/Koordinator/ManajemenRole";
import ProfileAkunKoordinator from "./pages/Koordinator/ProfileAkunKoordinator";
import EditProfileKoordinator from "./pages/Koordinator/EditProfileKoordinator";

// --- IMPORT FITUR DASHBOARD Kepala ---
import MentoringKepala from "./pages/Kepala/MentoringKepala";
import LaporanKepala from "./pages/Kepala/LaporanKepala";
import DashboardKepala from "./pages/Kepala/DashboardKepala";
import VerifikasiKepala from "./pages/Kepala/VerifikasiKepala";
import LihatHasilPdfKepala from "./pages/Kepala/LihatHasilPdfKepala";
import ProfileAkunKepala from "./pages/Kepala/ProfileAkunKepala";
import EditProfileKepala from "./pages/Kepala/EditProfileKepala";

// ====================================================================
// 1. Layout dengan Navbar (Untuk Landing Page - PUBLIK)
// ====================================================================
function AppLayoutWithNavbar() {
  return (
    <>
      <NavbarLandingPage />
      <Switch>
        {/* Semua di sini bisa diakses TANPA Login */}
        <Route path="/landingPage" component={LandingPage} />
        <Route path="/profile" component={Profile} />
        <Route path="/daftarAnalisis" component={DaftarAnalisis} />
        <Route path="/galeri" component={Galeri} />
        <Route path="/panduanSampel" component={PanduanSampel} />
        <Redirect exact from="/" to="/LandingPage" />
      </Switch>
    </>
  );
}

// ====================================================================
// 2. Layout TANPA Navbar Landing Page (Login & Dashboard - PROTECTED)
// ====================================================================
function AppLayoutWithoutNavbar() {
  // Setup auto logout: 15 menit inaktivitas
  useAutoLogout(5, () => {
    console.log("User telah di-logout karena inaktivitas");
  });

  return (
    <Switch>
      {/* Alias route untuk /teknisi/dashboard/riwayat agar menampilkan RiwayatAnalisisTeknisi */}
      <PrivateRoute path="/teknisi/dashboard/riwayat" component={require("./pages/Teknisi/RiwayatAnalisisTeknisi").default} allowedRoles={["teknisi"]} />
      {/* --- HALAMAN AKSES PUBLIK (Login/Register) --- */}
      {/* Tetap Route biasa, karena user belum login di sini */}
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/forgetPassword" component={ForgetPassword} />
      <Route path="/unauthorized" component={UnauthorizedPage} /> {/* ⭐ NEW: Halaman Unauthorized */}
      {/* --- DASHBOARD INTERNAL (WAJIB LOGIN + CEK ROLE) --- */}
      {/* 1. Koordinator (Hanya role 'koordinator' yang boleh masuk) */}
      <PrivateRoute path="/koordinator/dashboard/profile/edit" component={EditProfileKoordinator} allowedRoles={["koordinator"]} />
      <PrivateRoute path="/koordinator/dashboard/profile" component={ProfileAkunKoordinator} allowedRoles={["koordinator"]} />
      <PrivateRoute path="/koordinator/dashboard/manajemenAkun" component={ManajemenAkun} allowedRoles={["koordinator"]} />
      <PrivateRoute path="/koordinator/dashboard/laporanKoordinator" component={LaporanKoordinator} allowedRoles={["koordinator"]} />
      <PrivateRoute path="/koordinator/dashboard/tandaTanganKoordinator" component={TandaTanganKoordinator} allowedRoles={["koordinator"]} />
      <PrivateRoute path="/koordinator/dashboard/manajemenPembayaran" component={ManajemenPembayaran} allowedRoles={["koordinator"]} />
      <PrivateRoute path="/koordinator/dashboard/verifikasiSampelKoordinator/lihatHasilPdfKoordinator/:id" component={LihatHasilPdfKoordinator} allowedRoles={["koordinator"]} />
      <PrivateRoute path="/koordinator/dashboard/verifikasiSampelKoordinator" component={VerifikasiSampelKoordinator} allowedRoles={["koordinator"]} />
      <PrivateRoute path="/koordinator/dashboard" component={DashboardKoordinator} allowedRoles={["koordinator"]} />
      {/* 2. Kepala (Hanya role 'kepala' yang boleh masuk) */}
      <PrivateRoute path="/kepala/dashboard/mentoringKepala" component={MentoringKepala} allowedRoles={["kepala"]} />
      <PrivateRoute path="/kepala/dashboard/verifikasiKepala/lihatHasilPdfKepala/:id" component={LihatHasilPdfKepala} allowedRoles={["kepala"]} />
      <PrivateRoute path="/kepala/dashboard/profile/edit" component={EditProfileKepala} allowedRoles={["kepala"]} />
      <PrivateRoute path="/kepala/dashboard/profile" component={ProfileAkunKepala} allowedRoles={["kepala"]} />
      <PrivateRoute path="/kepala/dashboard/verifikasiKepala" component={VerifikasiKepala} allowedRoles={["kepala"]} />
      <PrivateRoute path="/kepala/dashboard/laporanKepala" component={LaporanKepala} allowedRoles={["kepala"]} />
      <PrivateRoute path="/kepala/dashboard" component={DashboardKepala} allowedRoles={["kepala"]} />
      {/* 3. Teknisi (Hanya role 'teknisi' yang boleh masuk) */}
      <PrivateRoute path="/teknisi/dashboard/generatePdfAnalysis" component={GeneratePdfAnalysis} allowedRoles={["teknisi"]} />
      <PrivateRoute path="/teknisi/dashboard/inputNilaiAnalisis/input-analisis/:id" component={FormInputNilaiAnalisis} allowedRoles={["teknisi"]} />
      <PrivateRoute path="/teknisi/dashboard/inputNilaiAnalisis" component={InputNilaiAnalisis} allowedRoles={["teknisi"]} />
      <PrivateRoute path="/teknisi/dashboard/verifikasiSampel/alasanMenolak" component={AlasanMenolak} allowedRoles={["teknisi"]} />
      <PrivateRoute path="/teknisi/dashboard/verifikasiSampel" component={VerifikasiSampel} allowedRoles={["teknisi"]} />
      <PrivateRoute path="/teknisi/dashboard/jadwalSampel" component={JadwalSampel} allowedRoles={["teknisi"]} />
      <PrivateRoute path="/teknisi/dashboard/aturTanggalTeknisi" component={AturTanggalTeknisi} allowedRoles={["teknisi"]} />
      <PrivateRoute path="/teknisi/dashboard/profile/edit" component={EditProfileTeknisi} allowedRoles={["teknisi"]} />
      <PrivateRoute path="/teknisi/dashboard/profile" component={ProfileAkunTeknisi} allowedRoles={["teknisi"]} />
      {/* Route baru untuk Riwayat Analisis Teknisi */}
      <PrivateRoute path="/teknisi/dashboard/riwayat-analisis" component={require("./pages/Teknisi/RiwayatAnalisisTeknisi").default} allowedRoles={["teknisi"]} />
      <PrivateRoute path="/teknisi/dashboard" component={DashboardTeknisi} allowedRoles={["teknisi"]} />
      {/* 4. Klien / Umum (Hanya role 'klien' yang boleh masuk) */}
      {/* Saya tambahkan pembatasan 'klien' agar teknisi tidak salah masuk ke sini */}
      <PrivateRoute path="/dashboard/riwayatAnalisisKlien" component={RiwayatAnalisisKlien} allowedRoles={["klien"]} />
      <PrivateRoute path="/dashboard/pembayaranKlien" component={PembayaranKlien} allowedRoles={["klien"]} />
      <PrivateRoute path="/dashboard/prosesAnalisis" component={ProsesAnalisis} allowedRoles={["klien"]} />
      <PrivateRoute path="/dashboard/menungguPersetujuan" component={MenungguPersetujuan} allowedRoles={["klien"]} />
      <PrivateRoute path="/dashboard/pemesananSampelKlien/hematologiDanMetabolit" component={HematologiDanMetabolit} allowedRoles={["klien"]} />
      <PrivateRoute path="/dashboard/pemesananSampelKlien/hematologi" component={Hematologi} allowedRoles={["klien"]} />
      <PrivateRoute path="/dashboard/pemesananSampelKlien/metabolit" component={Metabolit} allowedRoles={["klien"]} />
      <PrivateRoute path="/dashboard/pemesananSampelKlien" component={PemesananSampelKlien} allowedRoles={["klien"]} />
      <PrivateRoute path="/dashboard/panduanSampelKlien" component={PanduanSampelKlien} allowedRoles={["klien"]} />
      <PrivateRoute path="/dashboard/daftarAnalisisLogin" component={DaftarAnalisisLogin} allowedRoles={["klien"]} />
      <PrivateRoute path="/dashboard/bookingCalenderKlien" component={BookingCalenderKlien} allowedRoles={["klien"]} />
      <PrivateRoute path="/dashboard/ProfileAkunKlien/EditProfileKlien" component={EditProfileKlien} allowedRoles={["klien"]} />
      <PrivateRoute path="/dashboard/ProfileAkunKlien" component={ProfileAkunKlien} allowedRoles={["klien"]} />
      {/* Halaman Utama Dashboard Klien */}
      <PrivateRoute path="/dashboard-klien" component={Dashboard} allowedRoles={["klien"]} />
      <PrivateRoute path="/dashboard" component={Dashboard} allowedRoles={["klien"]} />
    </Switch>
  );
}

// ====================================================================
// 3. Main App Router
// ====================================================================
function App() {
  return (
    <Router>
      <PopupProvider />
      <Switch>
        {/* A. Rute yang masuk ke Layout Tanpa Navbar (Login & Dashboard) */}
        <Route path="/login" component={AppLayoutWithoutNavbar} />
        <Route path="/register" component={AppLayoutWithoutNavbar} />
        <Route path="/forgetPassword" component={AppLayoutWithoutNavbar} />

        {/* Group Dashboard berdasarkan Role */}
        <Route path="/teknisi" component={AppLayoutWithoutNavbar} />
        <Route path="/koordinator" component={AppLayoutWithoutNavbar} />
        <Route path="/kepala" component={AppLayoutWithoutNavbar} />
        <Route path="/dashboard" component={AppLayoutWithoutNavbar} />

        {/* B. Sisanya masuk ke Layout DENGAN Navbar (Landing Page) */}
        <Route component={AppLayoutWithNavbar} />
      </Switch>
    </Router>
  );
}

export default App;
