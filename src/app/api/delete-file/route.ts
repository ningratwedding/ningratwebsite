
import { NextResponse } from 'next/server';
import AWS from 'aws-sdk';

export async function DELETE(request: Request) {
    // Configure S3 client for NEO Object Storage
    const s3 = new AWS.S3({
        endpoint: "https://nos.wjv-1.neo.id",
        accessKeyId: process.env.NEO_ACCESS_KEY_ID,
        secretAccessKey: process.env.NEO_SECRET_ACCESS_KEY,
        region: 'idn',
        s3ForcePathStyle: true,
        signatureVersion: 'v4'
    });

    try {
        const { key } = await request.json();

        if (!key) {
            return NextResponse.json({ error: 'File key is required.' }, { status: 400 });
        }

        const params = {
            Bucket: 'gallery-photos',
            Key: key,
        };

        await s3.deleteObject(params).promise();

        return NextResponse.json({ message: 'File deleted successfully.' });

    } catch (error) {
        console.error("Error deleting file from NEO:", error);
        return NextResponse.json(
            { error: 'Failed to delete file from bucket.' },
            { status: 500 }
        );
    }
}
