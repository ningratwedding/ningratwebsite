
import { NextResponse } from 'next/server';
import AWS from 'aws-sdk';

const getFileType = (key: string): 'image' | 'video' | 'audio' | 'document' | 'other' => {
    const extension = key.split('.').pop()?.toLowerCase();
    if (!extension) return 'other';

    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico'];
    const videoExtensions = ['mp4', 'mov', 'webm', 'mkv', 'avi'];
    const audioExtensions = ['mp3', 'wav', 'm4a', 'ogg', 'flac'];
    const documentExtensions = ['pdf', 'doc', 'docx', 'txt'];

    if (imageExtensions.includes(extension)) {
        return 'image';
    }
    if (videoExtensions.includes(extension)) {
        return 'video';
    }
    if (audioExtensions.includes(extension)) {
        return 'audio';
    }
    if (documentExtensions.includes(extension)) {
        return 'document';
    }
    return 'other';
};


export async function GET() {
    // Konfigurasi ke NEO Object Storage
    const s3 = new AWS.S3({
        endpoint: "https://nos.wjv-1.neo.id",
        accessKeyId: process.env.NEO_ACCESS_KEY_ID,
        secretAccessKey: process.env.NEO_SECRET_ACCESS_KEY,
        region: 'idn',
        s3ForcePathStyle: true,
        signatureVersion: 'v4'
    });

    const params = {
        Bucket: 'gallery-photos',
        Prefix: 'uploads/', // Hanya ambil file dari folder 'uploads'
    };

    try {
        const data = await s3.listObjectsV2(params).promise();
        const files = data.Contents
            ?.filter(item => item.Key && item.Size > 0) // Filter out empty files/folders
            ?.map(item => ({
                key: item.Key!,
                url: `https://nos.wjv-1.neo.id/gallery-photos/${item.Key!}`,
                type: getFileType(item.Key!),
            }))
            .sort((a,b) => a.key < b.key ? 1 : -1) // Sort descending by key (name)
            || [];

        return NextResponse.json({ files });

    } catch (error) {
        console.error("Error listing files from NEO:", error);
        return NextResponse.json(
            { error: 'Failed to list files from bucket.' },
            { status: 500 }
        );
    }
}
