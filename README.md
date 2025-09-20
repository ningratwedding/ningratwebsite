# NingratWeb

Repositori resmi untuk website Ningrat Wedding. Proyek ini dibangun menggunakan Next.js dan Firebase, menampilkan halaman untuk klien dan dasbor admin untuk manajemen konten.

## ✨ Fitur

*   **Halaman Klien:**
    *   Halaman Beranda, Tentang Kami, Layanan, Portofolio, dan Kontak.
    *   Galeri atau cerita pernikahan yang bisa dilihat publik.
*   **Dasbor Admin:**
    *   Login yang aman.
    *   Manajemen konten untuk semua halaman (Beranda, Tentang, dll.).
    *   Penyusun cerita (Stories) dengan editor berbasis blok (judul, teks, gambar).
    *   Manajer file untuk mengunggah dan mengelola aset gambar.

## 🚀 Teknologi yang Digunakan

*   **Framework:** [Next.js](https://nextjs.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Komponen UI:** [shadcn/ui](https://ui.shadcn.com/)
*   **Backend & Hosting:** [Firebase](https://firebase.google.com/) (Authentication, Firestore, Storage, Hosting)
*   **Bahasa:** [TypeScript](https://www.typescriptlang.org/)

##  स्थानीय Menjalankan Proyek Secara Lokal

### Prasyarat

*   Node.js (v18 atau lebih baru)
*   NPM atau Yarn

### Instalasi

1.  **Clone repositori ini:**
    ```bash
    git clone https://github.com/dimassujatmiko/ningratweb.git
    cd ningratweb
    ```

2.  **Install semua dependensi:**
    ```bash
    npm install
    ```

3.  **Setup Firebase:**
    *   Buat proyek baru di [Firebase Console](https://console.firebase.google.com/).
    *   Salin konfigurasi Firebase Anda ke dalam file baru bernama `.env.local`.
    ```
    NEXT_PUBLIC_FIREBASE_API_KEY=...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
    NEXT_PUBLIC_FIREBASE_APP_ID=...
    ```

4.  **Jalankan server pengembangan:**
    ```bash
    npm run dev
    ```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

## 🚀 Deployment

Proyek ini sudah dikonfigurasi untuk di-deploy menggunakan Firebase Hosting.
```bash
firebase deploy
```
