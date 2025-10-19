
import imageCompression from 'browser-image-compression';

export const uploadFileToNeo = async (file: File) => {
    let fileToUpload = file;

    // Kompresi gambar jika itu adalah file gambar
    if (file.type.startsWith('image/')) {
        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
        };
        try {
            console.log(`Ukuran gambar asli: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
            const compressedFile = await imageCompression(file, options);
            console.log(`Ukuran gambar terkompresi: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
            fileToUpload = compressedFile;
        } catch (error) {
            console.error("Gagal mengompres gambar, mengunggah file asli:", error);
            // Jika kompresi gagal, lanjutkan dengan file asli
        }
    }


    const formData = new FormData();
    formData.append('file', fileToUpload);

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'File upload failed');
        }

        const data = await response.json();
        return data.url;
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
};
