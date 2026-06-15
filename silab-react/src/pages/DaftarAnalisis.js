import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import Footer from "./Footer";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fontsource/poppins";

function DaftarAnalisis() {
  // Gunakan folder "DaftarAnalisis" dengan D kapital sesuai yang Anda temukan
  const S3_BASE_URL = "https://silab-ntdk-assets.s3.ap-southeast-1.amazonaws.com/DaftarAnalisis";

  // Mapping nama analisis ke nama file asli di S3
  const imageMap = {
    "BDM": "BDM.png",
    "BDP": "BDP.png",
    "Hemoglobin Darah": "Hemoglobin_Darah.png",
    "Hematokrit": "Hematokrit.png",
    "Diferensiasi Leukosit": "Diferensiasi_Leukosit.png",
  };

  const dataAnalisis = [
    {
      kategori: "Metabolit",
      items: [
        { nama: "Glukosa", harga: 40000 },
        { nama: "Total Protein", harga: 40000 },
        { nama: "Albumin", harga: 40000 },
        { nama: "Trigliserida", harga: 65000 },
        { nama: "Kolestrol", harga: 55000 },
        { nama: "HDL-kol", harga: 90000 },
        { nama: "LDL-kol", harga: 110000 },
        { nama: "Urea/BUN", harga: 40000 },
        { nama: "Kreatinin", harga: 40000 },
        { nama: "Kalsium", harga: 50000 },
      ],
    },
    {
      kategori: "Hematologi",
      items: [
        { nama: "BDM", harga: 25000 },
        { nama: "BDP", harga: 25000 },
        { nama: "Hemoglobin Darah", harga: 15000 },
        { nama: "Hematokrit", harga: 15000 },
        { nama: "Diferensiasi Leukosit", harga: 30000 },
      ],
    },
  ];

  const getImagePath = (nama) => {
    // Jika ada di mapping, gunakan nama file spesifik, jika tidak gunakan Spektro.jpg
    const fileName = imageMap[nama] || "Spektro.jpg";
    return `${S3_BASE_URL}/${fileName}`;
  };

  return (
    <>
      <section
        id="daftarAnalisis"
        style={{
          fontFamily: "Poppins, sans-serif",
          backgroundColor: "#FAF7F5",
          padding: "50px 0",
          minHeight: "500px",
        }}
      >
        {dataAnalisis.map((kategoriGroup) => (
          <div key={kategoriGroup.kategori}>
            <h4
              className="fw-bold mb-4 text-center text-md-start"
              style={{
                color: "#4E342E",
                marginTop: "3rem",
                marginLeft: "2rem",
                marginRight: "2rem",
              }}
            >
              {kategoriGroup.kategori}
            </h4>

            <Container className="py-2">
              <Row className="g-4 justify-content-center justify-content-md-start">
                {kategoriGroup.items.map((item, index) => (
                  <Col key={index} xs={12} sm={6} md={4} lg={3}>
                    <Card
                      className="h-100 shadow-sm border-0"
                      style={{
                        background: "linear-gradient(160deg, #8D6E63, #8D6E63)",
                        borderRadius: "16px",
                        overflow: "hidden",
                      }}
                    >
                      <Card.Img
                        variant="top"
                        src={getImagePath(item.nama)}
                        style={{ objectFit: "cover", height: "180px" }}
                        onError={(e) => {
                          e.target.onerror = null;
                          // Fallback ke Spektro.jpg jika gambar spesifik tidak ditemukan
                          e.target.src = `${S3_BASE_URL}/Spektro.jpg`;
                        }}
                      />
                      <Card.Body className="text-white">
                        <Card.Title style={{ fontSize: "1rem", fontWeight: "600" }}>
                          {item.nama}
                        </Card.Title>
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
        ))}
      </section>
      <Footer />
    </>
  );
}

export default DaftarAnalisis;
