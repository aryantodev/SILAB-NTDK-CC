# Menggunakan image Node.js versi 18 yang ringan (alpine)
FROM node:18-alpine

# Menentukan direktori kerja
WORKDIR /app

# Menyalin file konfigurasi npm terlebih dahulu untuk caching
COPY package.json package-lock.json* ./

# Menginstal dependensi React
RUN npm install

# Menyalin sisa file proyek
COPY . .

# Membuka port 3000
EXPOSE 3000

# Menjalankan development server React
CMD ["npm", "start"]