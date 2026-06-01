import axios from "axios";

const API_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000/api";

// Mendapatkan daftar harga analisis dari backend
export const getAnalysisPrices = async () => {
  const response = await axios.get(`${API_URL}/analysis-prices-grouped`);
  return response.data;
};
