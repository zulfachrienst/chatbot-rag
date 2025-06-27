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

## 📚 API Usage & Contoh Payload

### 1. Chat Endpoint

#### POST `/api/chat`

- **Deskripsi:** Kirim pesan user ke AI, dapatkan balasan dan produk relevan.
- **Headers:**  
  `Content-Type: application/json`  
  `Authorization: Bearer <Firebase_ID_Token>`
- **Body:**
    ```json
    {
      "userId": "6281234567890",
      "message": "Saya cari HP Xiaomi RAM 8GB"
    }
    ```
- **Response:**
    ```json
    {
      "success": true,
      "data": {
        "response": "Berikut produk Xiaomi RAM 8GB yang tersedia...",
        "relatedProducts": [
          {
            "id": "1dagw4o0eAzjeIBxUBvk",
            "name": "Xiaomi Redmi Note 13",
            "price": 2999000,
            "images": ["https://..."],
            "variants": [
              {
                "name": "Warna",
                "options": [
                  { "value": "Hitam", "images": ["https://..."] }
                ]
              }
            ]
          }
        ],
        "timestamp": "2025-06-27T08:34:12.332Z"
      },
      "request_id": "req_abcdef1234567890"
    }
    ```

---

### 2. Produk

#### GET `/api/products`

- **Deskripsi:** Ambil list semua produk.
- **Headers:**  
  `Authorization: Bearer <Firebase_ID_Token>`
- **Response:**
    ```json
    {
      "success": true,
      "data": [
        {
          "id": "xxx",
          "name": "Infinix Note 50",
          "price": 2625000,
          "images": ["https://..."],
          "variants": [
            {
              "name": "Warna",
              "options": [
                { "value": "Hitam", "images": ["https://..."] }
              ]
            }
          ],
          "...": "..."
        }
      ],
      "request_id": "req_abcdef1234567890"
    }
    ```

#### POST `/api/products`

- **Deskripsi:** Tambah produk baru (admin).
- **Headers:**  
  `Authorization: Bearer <Firebase_ID_Token>`
- **Body:**  
  Kirim sebagai `multipart/form-data`:
    - `data`: JSON string produk (tanpa field `images`)
    - `images`: file gambar utama (bisa multiple)
    - `variant_{vIdx}_{oIdx}_images`: file gambar untuk variant option tertentu (bisa multiple per option)
- **Contoh `data`:**
    ```json
    {
      "name": "Infinix Note 50",
      "slug": "infinix-note-50",
      "description": "Smartphone dengan baterai besar...",
      "category": ["Elektronik", "Smartphone"],
      "tags": ["android", "infinix"],
      "brand": "Infinix",
      "price": 2625000,
      "discount": { "percent": 10, "priceAfterDiscount": 2362500 },
      "stock": 25,
      "features": ["Baterai 5000mAh"],
      "specs": [{ "key": "RAM", "value": "8GB" }],
      "variants": [
        {
          "name": "Warna",
          "options": [
            { "value": "Hitam", "images": [] },
            { "value": "Biru", "images": [] }
          ]
        }
      ],
      "images": [],
      "rating": { "average": 4.6, "count": 87 },
      "status": "active",
      "isFeatured": true,
      "warehouseLocation": "Jakarta"
    }
    ```
- **Response:**  
  Sama seperti GET `/api/products` (produk yang baru ditambah).

#### PUT `/api/products/:id`

- **Deskripsi:** Update produk (admin).
- **Headers:**  
  `Authorization: Bearer <Firebase_ID_Token>`
- **Body:**  
  Sama seperti POST `/api/products` (lihat di atas).

#### DELETE `/api/products/:id`

- **Deskripsi:** Hapus produk (admin).
- **Headers:**  
  `Authorization: Bearer <Firebase_ID_Token>`
- **Response:**
    ```json
    {
      "success": true,
      "message": "Product deleted",
      "request_id": "req_abcdef1234567890"
    }
    ```

---

### 3. Riwayat Chat

#### GET `/api/history/:userId`

- **Deskripsi:** Ambil riwayat chat user tertentu.
- **Headers:**  
  `Authorization: Bearer <Firebase_ID_Token>`
- **Response:**
    ```json
    {
      "success": true,
      "data": [
        { "role": "user", "content": "Saya cari HP murah", "timestamp": 1723456789123 },
        { "role": "assistant", "content": "Berikut rekomendasi HP murah...", "timestamp": 1723456789456 }
      ],
      "request_id": "req_abcdef1234567890"
    }
    ```

#### DELETE `/api/history/:userId`

- **Deskripsi:** Hapus riwayat chat user tertentu (hanya user sendiri atau admin).
- **Headers:**  
  `Authorization: Bearer <Firebase_ID_Token>`
- **Response:**  
  Sama seperti GET.

---

### 4. Admin & Monitoring

#### GET `/api/logs`

- **Deskripsi:** List system logs (admin).
- **Headers:**  
  `Authorization: Bearer <Firebase_ID_Token>`
- **Query:**  
  - `severity` (opsional): `HIGH`, `MEDIUM`, `LOW`
  - `limit` (opsional): default 20, max 100
- **Response:**
    ```json
    {
      "success": true,
      "data": [
        {
          "timestamp": "2025-06-27T08:34:12.332Z",
          "level": "ERROR",
          "severity": "HIGH",
          "message": "Error updating product",
          "details": "...",
          "request_id": "req_abcdef1234567890"
        }
      ],
      "request_id": "req_abcdef1234567890"
    }
    ```

#### DELETE `/api/clear-logs`

- **Deskripsi:** Hapus log lama (admin).
- **Headers:**  
  `Authorization: Bearer <Firebase_ID_Token>`
- **Body (opsional):**
    ```json
    {
      "olderThanHours": 168, // default 7 hari
      "level": "ALL" // atau "ERROR", "INFO", "WARN"
    }
    ```
- **Response:**
    ```json
    {
      "success": true,
      "deletedCount": 123,
      "request_id": "req_abcdef1234567890"
    }
    ```

#### GET `/api/health`

- **Deskripsi:** Health check semua layanan eksternal.
- **Headers:**  
  `Authorization: Bearer <Firebase_ID_Token>`
- **Response:**
    ```json
    {
      "success": true,
      "data": {
        "huggingface": { "uptime": 100, "avgResponse": 120 },
        "groq": { "uptime": 100, "avgResponse": 90 },
        "pinecone": { "uptime": 100, "avgResponse": 80 },
        "firebase": { "uptime": 100, "avgResponse": 50 }
      },
      "request_id": "req_abcdef1234567890"
    }
    ```

---

### ⚠️ **Catatan Umum**

- Semua endpoint (kecuali `/api/chat`) membutuhkan autentikasi Firebase ID Token di header Authorization.
- Untuk upload gambar produk/variant, gunakan field `images` dan `variant_{vIdx}_{oIdx}_images` di multipart form-data.
- Semua response selalu mengandung `request_id` untuk trace log.

---

**Untuk detail struktur produk, lihat bagian [Data Produk](#data-produk) di bawah.**

---

### Upload Gambar Produk & Variant (Multipart Form-Data)

#### POST `/api/products` atau PUT `/api/products/:id`

**Deskripsi:**  
Upload gambar utama dan gambar per variant option dalam satu request.

**Headers:**  
`Authorization: Bearer <Firebase_ID_Token>`

**Body:**  
Kirim sebagai `multipart/form-data`:
- `data`: JSON string produk (lihat contoh di atas)
- `images`: file gambar utama produk (bisa multiple)
- `variant_{vIdx}_{oIdx}_images`: file gambar untuk variant option tertentu (bisa multiple per option)
  - Contoh: `variant_0_1_images` untuk variant ke-0, option ke-1

**Contoh penggunaan dengan curl:**
```sh
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer <Firebase_ID_Token>" \
  -F "data={...}" \
  -F "images=@/path/to/main1.jpg" \
  -F "images=@/path/to/main2.jpg" \
  -F "variant_0_0_images=@/path/to/varian1a.jpg" \
  -F "variant_0_1_images=@/path/to/varian1b.jpg"
```

---

### Pagination pada List Produk & Log

#### GET `/api/products?limit=20&startAfter=<lastId>`

**Deskripsi:**  
Ambil produk dengan pagination.

**Query:**
- `limit`: jumlah produk per page (default 20, max 100)
- `startAfter`: id produk terakhir dari page sebelumnya (untuk next page)

**Response:**
```json
{
  "success": true,
  "data": [ ... ],
  "nextPageToken": "xxx", // gunakan untuk startAfter di request berikutnya
  "request_id": "req_abcdef1234567890"
}
```

#### GET `/api/logs?limit=20&startAfter=<timestamp>`

**Deskripsi:**  
Ambil log dengan pagination.

**Query:**
- `limit`: jumlah log per page
- `startAfter`: timestamp terakhir dari page sebelumnya

---

### Filter & Search Produk

#### GET `/api/products?search=keyword&category=Smartphone&minPrice=1000000&maxPrice=5000000`

**Deskripsi:**  
Filter produk berdasarkan keyword, kategori, dan rentang harga.

**Query:**
- `search`: kata kunci pencarian (nama/brand/fitur)
- `category`: filter kategori
- `minPrice`, `maxPrice`: filter harga

---

### Export Produk ke JSON

**Deskripsi:**  
Export seluruh produk ke file JSON lokal.

**Cara pakai:**
```sh
node scripts/getAllJSONProduct.js
```
File akan tersimpan di `scripts/json/{timestamp}.json`.

---

### Error Handling & Response

Semua response error akan mengandung:
```json
{
  "error": "Internal server error",
  "message": "Deskripsi error (hanya di development)",
  "request_id": "req_xxxxxxxxxxxxxxxx"
}
```
Gunakan `request_id` untuk trace log di dashboard admin.

---

### Tips Penggunaan API

- **Selalu gunakan HTTPS** di production.
- **Gunakan Firebase ID Token** untuk autentikasi di semua endpoint kecuali `/api/chat`.
- **Perhatikan limit upload gambar** (ukuran file & jumlah file).
- **Gunakan pagination** untuk list produk/log agar performa tetap optimal.
- **Cek response `nextPageToken`** untuk navigasi ke halaman berikutnya.
- **Gunakan field `request_id`** untuk troubleshooting dan audit log.

---

### Contoh Struktur Data Variant dengan Gambar

```json
"variants": [
  {
    "name": "Warna",
    "options": [
      {
        "value": "Hitam",
        "images": [
          "https://firebasestorage.googleapis.com/..."
        ]
      },
      {
        "value": "Biru",
        "images": [
          "https://firebasestorage.googleapis.com/..."
        ]
      }
    ]
  }
]
```

---

### FAQ

**Q: Bagaimana cara menambah admin baru?**  
A: Jalankan  
```sh
node scripts/createFirebaseUser.js <email> <password> admin
node scripts/setAdminClaim.js <uid>
```

**Q: Bagaimana cara clear log lama?**  
A: Panggil endpoint  
```http
DELETE /api/clear-logs
```
dengan body  
```json
{ "olderThanHours": 168 }
```
untuk hapus log lebih dari 7 hari.

**Q: Bagaimana jika ingin menambah field baru di produk?**  
A: Tambahkan field di struktur JSON produk, backend dan Firestore mendukung field dinamis.

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