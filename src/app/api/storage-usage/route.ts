
import { NextResponse } from 'next/server';
import AWS from 'aws-sdk';

export async function GET() {
    // Configure S3 client
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
    };
    
    // Get quota from environment variables (in GB)
    const quotaGB = parseFloat(process.env.NEO_STORAGE_QUOTA_GB || '0');
    const quotaBytes = quotaGB * 1024 * 1024 * 1024;

    let totalSize = 0;
    let continuationToken;

    try {
        do {
            const listParams: AWS.S3.ListObjectsV2Request = { ...params };
            if (continuationToken) {
                listParams.ContinuationToken = continuationToken;
            }

            const data = await s3.listObjectsV2(listParams).promise();
            
            if (data.Contents) {
                totalSize += data.Contents.reduce((sum, item) => sum + (item.Size || 0), 0);
            }

            continuationToken = data.NextContinuationToken;
        } while (continuationToken);

        return NextResponse.json({ 
            totalUsage: totalSize,
            quota: quotaBytes,
        });

    } catch (error) {
        console.error("Error calculating bucket size from NEO:", error);
        return NextResponse.json(
            { error: 'Failed to calculate storage usage.' },
            { status: 500 }
        );
    }
}
