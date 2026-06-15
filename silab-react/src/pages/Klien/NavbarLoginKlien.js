import React, { useState, useEffect } from "react";
import { Image, Nav, Dropdown, Badge } from "react-bootstrap";
import { useHistory, useLocation } from "react-router-dom";
import { FaTachometerAlt, FaFileAlt, FaCalendarAlt, FaClipboardList, FaClock, FaFlask, FaCreditCard, FaHistory, FaBars, FaUserCircle, FaBell, FaTimes } from "react-icons/fa";
import { getUnreadNotifications, getAllNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "../../services/NotificationService";
import "@fontsource/poppins";
import ConfirmModal from "../../components/Common/ConfirmModal";

function NavbarLogin({ children }) {
  const history = useHistory();
  const location = useLocation();

  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      const allResp = await getAllNotifications(1, 50);
      const allData = allResp && allResp.data && allResp.data.data ? allResp.data.data : [];
      const unreadResp = await getUnreadNotifications();
      const unreadCount = unreadResp && unreadResp.count ? unreadResp.count : 0;
      setNotifications(allData || []);
      setNotifCount(unreadCount);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (notif) => {
    try {
      await markNotificationAsRead(notif.id);
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)));
      setNotifCount((c) => Math.max(0, c - 1));
      fetchNotifications().catch((e) => console.error("Background fetch error:", e));
      if (notif.booking_id) {
        history.push("/dashboard/prosesAnalisis");
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      fetchNotifications();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  useEffect(() => {
    const checkProfileCompletion = () => {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (storedUser) {
        const isProfileIncomplete = !storedUser.full_name || !storedUser.institusi;
        const editProfilePath = "ProfileAkunKlien/EditProfileKlien";
        const isCurrentlyOnEditPage = location.pathname.includes(editProfilePath);
        if (isProfileIncomplete && !isCurrentlyOnEditPage) {
          history.replace("/dashboard/ProfileAkunKlien/EditProfileKlien");
        }
      }
    };
    checkProfileCompletion();
  }, [location.pathname, history]);

  const menus = [
    { key: "dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
    { key: "daftarAnalisisLogin", label: "Daftar Harga Analisis", icon: <FaClipboardList /> },
    { key: "panduanSampelKlien", label: "SOP Analisis Lab", icon: <FaFileAlt /> },
    { key: "bookingCalenderKlien", label: "Kalender Pemesanan", icon: <FaCalendarAlt /> },
    { key: "pemesananSampelKlien", label: "Pemesanan Sampel", icon: <FaClipboardList /> },
    { key: "menungguPersetujuan", label: "Menunggu Persetujuan", icon: <FaClock /> },
    { key: "prosesAnalisis", label: "Proses Sampel", icon: <FaFlask /> },
    { key: "pembayaranKlien", label: "Pembayaran & Invoice", icon: <FaCreditCard /> },
    { key: "riwayatAnalisisKlien", label: "Riwayat", icon: <FaHistory /> },
  ];

  useEffect(() => {
    const path = location.pathname.replace("/dashboard/", "");
    const found = menus.find((m) => path.startsWith(m.key));
    if (found) {
      setActiveMenu(found.key);
    }
  }, [location.pathname]);

  const currentTitle = menus.find((m) => m.key === activeMenu)?.label;

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    history.push("/LandingPage");
  };

  // Avatar source (prioritas: avatar_url dari backend -> fallback key S3 -> fallback full url)
  const avatarSrc = (() => {
    if (!user) return null;

    // Backend /login mengirim avatar_url (full URL S3)
    if (user.avatar_url) return user.avatar_url;

    // Jika avatar sudah berupa full URL / blob
    if (user.avatar && (user.avatar.startsWith("http") || user.avatar.startsWith("blob"))) return user.avatar;

    // Jika avatar berupa key path S3 (mis. avatars/xxx.jpg)
    // Host S3 pada backend saat ini: https://{bucket}.s3.{region}.amazonaws.com/{key}
    if (user.avatar) return `https://silab-ntdk-storage.ap-southeast-1.amazonaws.com/${user.avatar}`;

    return null;
  })();

  return (
    <div className="dashboard-layout" style={{ fontFamily: "Poppins, sans-serif" }}>
      <header className="dashboard-header d-flex justify-content-between align-items-center px-4 py-2 shadow-sm bg-white border-bottom sticky-top">
        <div className="d-flex align-items-center">
          <button className="btn btn-light border-0 me-3 d-lg-none rounded-circle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar">
            {sidebarOpen ? <FaTimes size={22} className="text-secondary" /> : <FaBars size={20} className="text-secondary" />}
          </button>
          <div className="d-flex align-items-center gap-3">
            <Image src="/asset/gambarLogo.png" alt="IPB Logo" style={{ width: "120px", height: "auto" }} />
            <div className="vr d-none d-md-block mx-2 text-muted opacity-25" style={{ height: "30px" }}></div>
            <div className="d-none d-md-flex flex-column justify-content-center">
              <span className="fw-bold text-dark mb-0" style={{ fontSize: "0.85rem", lineHeight: "1.2" }}>
                Sistem Informasi Laboratorium
              </span>
              <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                Nutrisi Ternak Daging Dan Kerja
              </span>
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Dropdown show={showNotifDropdown} onToggle={(isOpen) => setShowNotifDropdown(isOpen)} align="end">
            <Dropdown.Toggle variant="light" className="border-0 bg-transparent position-relative p-2 rounded-circle" style={{ width: "40px", height: "40px" }}>
              <FaBell size={18} className="text-secondary" />
              {notifCount > 0 && (
                <Badge bg="danger" pill className="position-absolute border border-white" style={{ top: "4px", right: "4px", fontSize: "0.6rem" }}>
                  {notifCount}
                </Badge>
              )}
            </Dropdown.Toggle>
            <Dropdown.Menu className="shadow-lg border-0 mt-2" style={{ width: "320px", borderRadius: "12px" }}>
              <div className="d-flex justify-content-between align-items-center px-3 py-3 bg-light">
                <h6 className="mb-0 fw-bold">Notifikasi</h6>
                {notifCount > 0 && (
                  <button className="btn btn-sm btn-link text-decoration-none p-0 fw-semibold" onClick={handleMarkAllAsRead}>
                    Tandai Semua
                  </button>
                )}
              </div>
              <div style={{ maxHeight: "350px", overflowY: "auto" }}>
                {notifications.map((notif) => (
                  <Dropdown.Item key={notif.id} onClick={() => handleNotificationClick(notif)} className="py-3 px-3 border-bottom">
                    {notif.title}
                  </Dropdown.Item>
                ))}
              </div>
            </Dropdown.Menu>
          </Dropdown>

          <Dropdown align="end">
            <Dropdown.Toggle variant="light" className="d-flex align-items-center border-0 bg-light rounded-pill px-3 py-1 gap-2">
              {avatarSrc ? <Image src={avatarSrc} roundedCircle width={28} height={28} style={{ objectFit: "cover" }} /> : <FaUserCircle size={24} className="text-primary" />}
              <span className="fw-semibold d-none d-md-inline" style={{ fontSize: "0.85rem" }}>
                {user?.name || "User"}
              </span>
            </Dropdown.Toggle>
            <Dropdown.Menu className="shadow-lg border-0 mt-2" style={{ borderRadius: "10px" }}>
              <Dropdown.Item className="py-2" onClick={() => history.push("/dashboard/ProfileAkunKlien")}>
                <i className="bi bi-person me-2"></i> Profil Akun
              </Dropdown.Item>
              <hr className="dropdown-divider opacity-50" />
              <Dropdown.Item className="py-2 text-danger" onClick={() => setShowLogout(true)}>
                <i className="bi bi-box-arrow-right me-2"></i> Logout
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </header>

      <aside className={`dashboard-sidebar bg-white p-3 shadow-sm ${sidebarOpen ? "open" : ""}`}>
        <Nav className="flex-column mt-2">
          {menus.map((menu) => (
            <Nav.Link
              key={menu.key}
              onClick={() => {
                setActiveMenu(menu.key);
                history.push(`/dashboard/${menu.key}`);
                setSidebarOpen(false);
              }}
              className={`d-flex align-items-center mb-2 py-2 px-3 rounded ${activeMenu === menu.key ? "active" : ""}`}
              style={{
                color: "#000",
                fontSize: "0.95rem",
                transition: "background 0.3s, color 0.3s",
                cursor: "pointer",
              }}
            >
              <span className="me-3">{menu.icon}</span>
              {menu.label}
            </Nav.Link>
          ))}
        </Nav>
      </aside>

      <main className="dashboard-content">
        <div className="page-title-bar">
          <h5 className="m-0 px-4 py-2">{currentTitle}</h5>
        </div>
        <div className="dashboard-inner">{children}</div>
      </main>

      <style>{`
        .dashboard-layout { display: flex; min-height: 100vh; flex-direction: column; }
        .dashboard-header { position: fixed; top: 0; left: 0; right: 0; height: 70px; z-index: 1060; background: #fff; }
        .dashboard-sidebar { width: 240px; position: fixed; top: 70px; left: 0; height: calc(100vh - 70px); overflow-y: auto; transform: translateX(-100%); transition: transform 0.3s; z-index: 1055; }
        .dashboard-sidebar.open { transform: translateX(0); }
        .dashboard-content { flex: 1; margin-top: 70px; }
        .page-title-bar { background-color: #a6867b; color: #fff; border-bottom-left-radius: 30px; border-bottom-right-radius: 30px; }
        @media (min-width: 992px) { .dashboard-sidebar { transform: translateX(0); } .dashboard-content { margin-left: 240px; } }
      `}</style>

      <ConfirmModal
        show={showLogout}
        title="Konfirmasi Logout"
        message="Anda yakin ingin keluar?"
        onConfirm={() => {
          handleLogout();
          setShowLogout(false);
        }}
        onCancel={() => setShowLogout(false)}
      />
    </div>
  );
}

export default NavbarLogin;
