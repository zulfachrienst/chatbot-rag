# Chatbot RAG (Retrieval-Augmented Generation) WhatsApp & Web API

Chatbot ini adalah solusi AI asisten penjualan produk berbasis Node.js, dengan fitur RAG (Retrieval-Augmented Generation), integrasi WhatsApp, dan dukungan context-aware product search. Data produk dan riwayat chat disimpan di Firestore, serta didukung pencarian vektor Pinecone dan embedding HuggingFace.

---

## Fitur Utama

- **Chatbot API**: Endpoint `/api/chat` untuk menerima pesan user dan membalas dengan konteks produk.
- **Integrasi WhatsApp**: Bot WhatsApp otomatis membalas chat user dengan jawaban AI.
- **Manajemen Produk**: CRUD produk, upload gambar, update embedding Pinecone.
- **RAG (Retrieval-Augmented Generation)**: Jawaban AI selalu relevan dengan data produk yang diisi admin.
- **Riwayat Chat**: Menyimpan dan mengambil riwayat chat per user.
- **Health Monitoring**: Cek status layanan eksternal (HuggingFace, Pinecone, Firebase, GROQ).
- **Admin Panel**: Otorisasi berbasis Firebase custom claims (`role: admin`), endpoint khusus admin untuk clear logs, dsb.
- **Logging & Alert**: Logging ke Firestore dengan severity detection dan alert untuk error kritikal.

---

## Struktur Direktori

```
.
├── .env.example              # Contoh environment variables
├── firebase-service.json     # Service account Firebase (jangan commit ke repo publik)
├── package.json
├── server.js                 # Entry point server Express
├── wa-bot.js                 # WhatsApp bot integration
├── scripts/                  # Script utilitas (setup data, export produk, dsb)
│   ├── createFirebaseUser.js
│   ├── getAllJSONProduct.js
│   ├── setAdminClaim.js
│   ├── setupData.js
│   └── json/                 # Hasil export produk ke JSON
├── src/
│   ├── config/               # Konfigurasi layanan eksternal
│   ├── controllers/          # Controller API
│   ├── middleware/           # Middleware autentikasi, upload, error handler
│   ├── routes/               # Routing Express
│   ├── services/             # Bisnis logic (chat, produk, embedding, dsb)
│   └── utils/                # Utility (logger, firebase storage, dsb)
└── README.md
```

---

## Cara Instalasi

1. **Clone repo & install dependencies**
    ```sh
    git clone <repo-url>
    cd chatbot-rag
    pnpm install
    # atau npm install
    ```

2. **Siapkan file environment**
    - Copy `.env.example` ke `.env` dan isi sesuai kredensial Anda (Firebase, Pinecone, HuggingFace, GROQ, dsb).

3. **Siapkan service account Firebase**
    - Download file `firebase-service.json` dari Firebase Console dan letakkan di root project.

4. **Jalankan server**
    ```sh
    node server.js
    # atau dengan nodemon
    pnpm dev
    ```

5. **Jalankan WhatsApp Bot**
    ```sh
    node wa-bot.js
    ```
    Scan QR code yang muncul di terminal.

---

## API Endpoint

### Chat Endpoint

- **POST `/api/chat`**
    - Body: `{ "userId": "<whatsapp_number>", "message": "<pesan user>" }`
    - Response: `{ "response": "<jawaban AI>", "relatedProducts": [...], "timestamp": "<ISO>" }`

### Produk

- **GET `/api/products`**: List produk.
- **POST `/api/products`**: Tambah produk (admin).
- **PUT `/api/products/:id`**: Update produk (admin).
- **DELETE `/api/products/:id`**: Hapus produk (admin).
- **POST `/api/products/:id/upload-image`**: Upload gambar produk.

### Riwayat Chat

- **GET `/api/history/:userId`**: Ambil riwayat chat user.
- **DELETE `/api/history/:userId`**: Hapus riwayat chat user.

### Admin & Monitoring

- **GET `/api/logs`**: List system logs (admin).
- **DELETE `/api/clear-logs`**: Hapus log lama (admin).
- **GET `/api/health`**: Health check semua layanan eksternal.

---

## Data Produk

Struktur produk future-proof, contoh:
```json
{
  "id": "xxx",
  "name": "Infinix Note 50",
  "description": "Smartphone dengan baterai besar...",
  "category": ["Elektronik", "Smartphone"],
  "tags": ["android", "infinix", "baterai besar"],
  "brand": "Infinix",
  "price": 2625000,
  "discount": { "percent": 15, "priceAfterDiscount": 2231250 },
  "stock": 25,
  "features": ["Baterai 5000mAh", "Layar 6,78 inci"],
  "specs": [{ "key": "RAM", "value": "8GB" }, ...],
  "variants": [{ "name": "Warna", "options": ["Hitam", "Biru"] }],
  "images": ["https://..."],
  "rating": { "average": 4.5, "count": 123 },
  "status": "active",
  "isFeatured": true,
  "warehouseLocation": "Jakarta",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

## Logging & Monitoring

- Semua aktivitas penting dan error dicatat ke Firestore (`systemLogs`, `errorLogs`, `criticalAlerts`).
- Severity error otomatis terdeteksi (HIGH/MEDIUM/LOW).
- Admin dapat clear log lama via endpoint.

---

## Scripts Utilitas

- **Setup Data Dummy**:  
  Jalankan `node scripts/setupData.js` untuk mengisi produk contoh ke Firestore.
- **Export Produk ke JSON**:  
  Jalankan `node scripts/getAllJSONProduct.js` untuk export seluruh produk ke file JSON di `scripts/json/`.
- **Buat User Firebase**:  
  Jalankan `node scripts/createFirebaseUser.js <email> <password> [role]`.
- **Set Admin Claim**:  
  Jalankan `node scripts/setAdminClaim.js <uid>`.

---

## Catatan Pengembangan

- **RAG**: Jawaban AI selalu berdasarkan data produk yang diisi admin, tidak mengarang produk.
- **Formatting WhatsApp**: Jawaban AI otomatis menyesuaikan format WhatsApp (bold, italic, dsb).
- **Extensible**: Mudah dikembangkan untuk kategori produk lain, integrasi marketplace, dsb.

---

## Lisensi

Lihat [LICENSE](LICENSE).

---

## Kontribusi

Pull request dan issue sangat diterima!  
Pastikan tidak meng-commit file sensitif seperti `.env` dan `firebase-service.json`.

---

## Author

Workspace ini dikembangkan untuk kebutuhan chatbot penjualan produk dengan teknologi cloud dan AI modern.