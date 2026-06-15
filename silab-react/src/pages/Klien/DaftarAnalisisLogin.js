import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Badge } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import NavbarLogin from "./NavbarLoginKlien";
import FooterSetelahLogin from "../FooterSetelahLogin";
import BrownSpinner from "../../components/Common/LoadingSpinner";
import axios from "axios";

function DaftarAnalisisLogin() {
  // S3 Base URL (Pastikan ini sesuai dengan folder DaftarAnalisis di S3 Anda)
  const S3_BASE_URL = "https://silab-ntdk-assets.s3.ap-southeast-1.amazonaws.com/DaftarAnalisis";

  useEffect(() => {
    document.title = "SILAB-NTDK - Daftar Analisis";
  }, []);

  const [dataAnalisis, setDataAnalisis] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get("http://52.77.226.138:8000/api/analysis-prices-grouped")
      .then((res) => {
        setDataAnalisis(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Gagal mengambil data analisis.");
        setLoading(false);
      });
  }, []);

  // Fungsi pembantu untuk membuat nama file dari nama analisis
  const getS3ImageUrl = (name) => {
    const formatted = name.toString().replace(/\s+/g, "_").replace(/[^\w_]/g, "");
    return `${S3_BASE_URL}/${formatted}.png`;
  };

  const CardAnalisis = ({ item, kategori }) => (
    <Col xs={12} sm={6} lg={3}>
      <Card
        className="h-100 border-0 shadow-sm"
        style={{
          borderRadius: "20px",
          overflow: "hidden",
          transition: "all 0.3s ease",
          backgroundColor: "#ffffff",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-8px)";
          e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.05)";
        }}
      >
        <div style={{ position: "relative" }}>
          <Card.Img
            variant="top"
            src={getS3ImageUrl(item.jenis_analisis || item.nama)}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `${S3_BASE_URL}/Spektro.jpg`;
            }}
            style={{ height: "180px", objectFit: "cover" }}
          />
          <Badge 
            bg="light" 
            text="dark" 
            className="position-absolute top-0 end-0 m-3 shadow-sm" 
            style={{ borderRadius: "8px", fontWeight: "500", opacity: "0.9" }}
          >
            {kategori}
          </Badge>
        </div>

        <Card.Body className="p-4">
          <Card.Title
            className="mb-2"
            style={{
              fontSize: "1.1rem",
              fontWeight: "700",
              color: "#2D3436",
            }}
          >
            {item.jenis_analisis || item.nama}
          </Card.Title>

          <Card.Text
            style={{
              color: "#8D6E63", // Warna espresso/mocha
              fontSize: "1.15rem",
              fontWeight: "600",
            }}
          >
            Rp {Number(item.harga).toLocaleString("id-ID")}
          </Card.Text>
        </Card.Body>
      </Card>
    </Col>
  );

  return (
    <NavbarLogin>
      <Container style={{ marginTop: "2rem" }}>
        <div className="mb-3 text-center text-md-start">
          <h2 className="fw-bold" style={{ color: "#45352F", fontSize: "2.5rem" }}>
            Daftar <span style={{ color: "#8D6E63" }}>Layanan Analisis</span>
          </h2>
          <p className="text-muted">Pilih jenis analisis laboratorium yang Anda butuhkan</p>
        </div>

        {loading ? (
          <div style={{ minHeight: "500px", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <BrownSpinner />
          </div>
        ) : error ? (
          <div className="text-center text-danger py-5">{error}</div>
        ) : (
          Object.entries(dataAnalisis).map(([kategori, items]) => (
            <div key={kategori} className="mb-5">
              <div className="d-flex align-items-center mb-4">
                <div
                  style={{
                    width: "5px",
                    height: "30px",
                    backgroundColor: "#8D6E63",
                    borderRadius: "10px",
                    marginRight: "15px",
                  }}
                />
                <h4 className="fw-bold m-0" style={{ color: "#4E342E" }}>
                  Kategori {kategori}
                </h4>
              </div>

              <Row className="g-4">
                {items.map((item, idx) => (
                  <CardAnalisis key={idx} item={item} kategori={kategori} />
                ))}
              </Row>
            </div>
          ))
        )}
      </Container>
      <FooterSetelahLogin />
    </NavbarLogin>
  );
}

export default DaftarAnalisisLogin;
