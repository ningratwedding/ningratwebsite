
import { NextResponse } from 'next/server';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from "uuid";

// Konfigurasi ke NEO Object Storage
const s3 = new AWS.S3({
    endpoint: "https://nos.wjv-1.neo.id",
    accessKeyId: process.env.NEO_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEO_SECRET_ACCESS_KEY,
    region: 'idn',
    s3ForcePathStyle: true,
    signatureVersion: 'v4'
});

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }
        
        const fileExtension = file.name.split(".").pop();
        const newFileName = `${uuidv4()}.${fileExtension}`;
        const fileBuffer = await file.arrayBuffer();

        const params = {
            Bucket: 'gallery-photos',
            Key: `uploads/${newFileName}`,
            Body: Buffer.from(fileBuffer),
            ACL: 'public-read' as const,
            ContentType: file.type
        };

        await s3.upload(params).promise();

        const url = `https://nos.wjv-1.neo.id/gallery-photos/uploads/${newFileName}`;

        return NextResponse.json({ url });

    } catch (error) {
        console.error("Error uploading file to NEO Object Storage from server:", error);
        return NextResponse.json({ error: 'Server error during file upload.' }, { status: 500 });
    }
}
