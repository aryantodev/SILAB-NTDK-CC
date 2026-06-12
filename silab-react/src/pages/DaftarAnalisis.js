import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import Footer from "./Footer";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fontsource/poppins";

function DaftarAnalisis() {
  const [groupedAnalisis, setGroupedAnalisis] = useState({});
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const API_URL = process.env.REACT_APP_API_BASE_URL;

  // Fungsi untuk membersihkan nama agar sesuai dengan nama file
  const getImagePath = (name) => {
    if (!name) return "/asset/daftarAnalisis/Spektro.jpg";
    
    // 1. Ubah ke lowercase 
    // 2. Ganti spasi dengan underscore
    // 3. Hapus karakter non-alfanumerik
    const formatted = name
      .toString()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^\w_]/g, "");
      
    return `/asset/daftarAnalisis/${formatted}.png`;
  };

  useEffect(() => {
    document.title = "SILAB-NTDK - Daftar Analisis";
    if (API_URL && !hasLoaded) {
      setHasLoaded(true);
      fetch(`${API_URL}/analysis-prices-grouped`)
        .then((res) => res.json())
        .then((data) => {
          const cleanedData = {};
          Object.entries(data).forEach(([kategori, items]) => {
            const uniqueItems = items.filter(
              (item, index, self) => 
                index === self.findIndex((t) => t.jenis_analisis === item.jenis_analisis)
            );
            cleanedData[kategori] = uniqueItems;
          });
          setGroupedAnalisis(cleanedData);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Gagal mengambil daftar analisis:", err);
          setLoading(false);
        });
    }
  }, [API_URL, hasLoaded]);

  const renderKategori = (title, data) => (
    <div key={title}>
      <h4
        className="fw-bold mb-4 text-center text-md-start"
        style={{
          color: "#4E342E",
          marginTop: "3rem",
          marginLeft: "2rem",
          marginRight: "2rem",
        }}
      >
        {title}
      </h4>

      <Container className="py-2">
        <Row className="g-4 justify-content-center justify-content-md-start">
          {data.map((item, index) => (
            <Col key={`${item.jenis_analisis}-${index}`} xs={12} sm={6} md={4} lg={3}>
              <Card
                className="h-100 shadow-sm border-0 daftarAnalisis-card"
                style={{
                  background: "linear-gradient(160deg, #8D6E63, #8D6E63)",
                  borderRadius: "16px",
                  overflow: "hidden",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.03)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <Card.Img
                  variant="top"
                  src={getImagePath(item.jenis_analisis)}
                  onError={(e) => {
                    e.target.onerror = null; // Mencegah looping
                    e.target.src = "/asset/daftarAnalisis/Spektro.jpg";
                  }}
                  style={{ objectFit: "cover", height: "180px" }}
                />
                <Card.Body className="text-white">
                  <Card.Title style={{ fontSize: "1rem", fontWeight: "600" }}>{item.jenis_analisis}</Card.Title>
                  <Card.Text style={{ fontSize: "0.9rem" }}>
                    Rp. {Number(item.harga).toLocaleString("id-ID")}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </div>
  );

  return (
    <>
      <section
        id="daftarAnalisis"
        style={{
          fontFamily: "Poppins, sans-serif",
          backgroundColor: "#FAF7F5",
          padding: "50px 0 0 0",
          minHeight: "500px",
        }}
      >
        {loading ? (
          <LoadingSpinner />
        ) : Object.keys(groupedAnalisis).length === 0 ? (
          <div className="text-center py-5">Tidak ada data analisis tersedia.</div>
        ) : (
          Object.entries(groupedAnalisis).map(([kategori, data]) => renderKategori(kategori, data))
        )}
      </section>

      <Footer />
    </>
  );
}

export default DaftarAnalisis;
