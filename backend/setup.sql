-- İsteğe bağlı referans şeması.
-- `node server.js` çalıştığında veritabanı, tablolar ve örnek veriler otomatik oluşturulur.

CREATE DATABASE IF NOT EXISTS fukampus_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE fukampus_db;

CREATE TABLE IF NOT EXISTS news (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  `date` DATE NOT NULL,
  image_url VARCHAR(2000) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quick_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  subtitle VARCHAR(500) NULL,
  url VARCHAR(2000) NOT NULL,
  icon_name VARCHAR(80) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  icon_name VARCHAR(80) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  description TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contact_info (
  id INT PRIMARY KEY,
  lead_text VARCHAR(500) NOT NULL,
  email VARCHAR(200) NOT NULL,
  phone VARCHAR(120) NOT NULL,
  address VARCHAR(600) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
