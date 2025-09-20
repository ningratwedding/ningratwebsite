
export const uploadFileToNeo = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

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
