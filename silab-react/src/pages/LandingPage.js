import React, { useState, useEffect } from "react";
import axios from "axios";
import { Carousel, Container, Row, Col, Image, Card, Button } from "react-bootstrap";
import { useHistory } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../css/LandingPage.css";
import "@fontsource/poppins";
import Footer from "./Footer";

// --- ENV ---
const API_URL = process.env.REACT_APP_API_BASE_URL;
// URL S3 untuk gambar analisis
const S3_BASE_URL = "https://silab-ntdk-assets.s3.ap-southeast-1.amazonaws.com/DaftarAnalisis";

function LandingPage() {
  const history = useHistory();
  const [index, setIndex] = useState(0);
  const [daftarAnalisis, setDaftarAnalisis] = useState([]);

  useEffect(() => {
    document.title = "SILAB-NTDK - Beranda";
    if (API_URL) {
      axios.get(`${API_URL}/analysis-prices`)
        .then((res) => setDaftarAnalisis(res.data))
        .catch((err) => console.error("Gagal mengambil daftar harga:", err));
    }
  }, []);

  const handleSelect = (selectedIndex) => setIndex(selectedIndex);

  const images = [
    { src: "/asset/Galeri_Landing_Page/galeriLandingPage1.png", text: "Alat Laboratorium modern dengan teknologi terbaru" },
    { src: "/asset/Galeri_Landing_Page/galeriLandingPage5.png", text: "Tenaga ahli profesional dan berpengalaman" },
    { src: "/asset/Galeri_Landing_Page/galeriLandingPage4.png", text: "Fasilitas laboratorium yang nyaman dan aman" },
  ];

  return (
    <div id="pageWrapper">
      <section id="beranda" className="no-overflow">
        <Carousel activeIndex={index} onSelect={handleSelect} fade interval={2000} indicators={false}>
          <Carousel.Item><img className="d-block w-100 hero-img" src="/asset/Slider1.jpg" alt="Slide 1" /></Carousel.Item>
          <Carousel.Item><img className="d-block w-100 hero-img" src="/asset/Slider2.png" alt="Slide 2" /></Carousel.Item>
          <Carousel.Item><img className="d-block w-100 hero-img" src="/asset/Slider3.png" alt="Slide 3" /></Carousel.Item>
        </Carousel>

        <div className="carousel-custom-indicators">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`indicator-dot ${index === i ? "active" : ""}`} onClick={() => setIndex(i)}></span>
          ))}
        </div>

        <div className="text-center mt-5 mb-5"><h4>Galeri Divisi NTDK</h4></div>

        <section id="galeriHeader" className="gallery-section no-overflow" style={{ backgroundColor: "#A6887D", padding: "3rem 0" }}>
          <Container>
            <Row className="g-4">
              {images.map((item, idx) => (
                <Col key={idx} md={4} sm={6} xs={12} className="d-flex justify-content-center">
                  <div className="gallery-image-wrapper text-center">
                    <Image src={item.src} className="gallery-image" fluid style={{ borderRadius: "20px", width: "398px" }} />
                    <p className="gallery-caption mt-2" style={{ color: "#000", fontSize: "14px" }}>{item.text}</p>
                  </div>
                </Col>
              ))}
            </Row>
          </Container>
        </section>

        <div className="text-center mt-5 mb-5"><h4>Daftar Jenis dan Biaya</h4></div>

        <Container className="py-4">
          <Row className="g-4 justify-content-center">
            {daftarAnalisis.length === 0 ? (
              <Col className="text-center">Memuat daftar harga...</Col>
            ) : (
              daftarAnalisis.slice(0, 4).map((item, idx) => (
                <Col key={idx} xs={12} sm={6} md={4} lg={3}>
                  <Card 
                    className="h-100 shadow-sm border-0" 
                    style={{ 
                      background: "linear-gradient(160deg, #8D6E63, #8D6E63)", 
                      borderRadius: "16px",
                      transition: "transform 0.3s ease"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                  >
                    <Card.Img 
                      variant="top" 
                      src={`${S3_BASE_URL}/Spektro.jpg`} 
                      style={{ height: "160px", objectFit: "cover" }} 
                    />
                    <Card.Body className="text-white text-center">
                      <Card.Title style={{ fontSize: "0.95rem", fontWeight: "600" }}>{item.jenis_analisis}</Card.Title>
                      <Card.Text style={{ fontSize: "0.85rem" }}>Rp. {item.harga.toLocaleString("id-ID")}</Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            )}
          </Row>
        </Container>

        <div className="d-flex justify-content-end px-5 mb-5">
          <Button
            variant="light"
            className="px-4 shadow-sm"
            style={{ backgroundColor: "#45352F", color: "#F2F2F2", borderRadius: "8px" }}
            onClick={() => { history.push("/daftarAnalisis"); window.scrollTo(0, 0); }}
          >
            Lihat Lebih Banyak
          </Button>
        </div>

        <Footer />
      </section>
    </div>
  );
}

export default LandingPage;
