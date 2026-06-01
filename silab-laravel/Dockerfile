# Menggunakan image PHP 8.2 versi CLI untuk lokal
FROM php:8.3-cli

# Menginstal dependensi sistem yang dibutuhkan Laravel
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    && docker-php-ext-install pdo_mysql zip

# Menginstal Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Menentukan direktori kerja di dalam kontainer
WORKDIR /var/www/html

# Menyalin seluruh file proyek ke dalam kontainer
COPY . .

# Menginstal dependensi Laravel
RUN composer install --no-interaction --optimize-autoloader

# Membuka port 8000
EXPOSE 8000

# Menjalankan server bawaan Laravel agar bisa diakses dari luar kontainer
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
