
import { NextResponse } from 'next/server';
import AWS from 'aws-sdk';
import { db } from '@/lib/firebase';
import { collectionGroup, getDocs, writeBatch, query, where, doc } from 'firebase/firestore';


// Function to generate a URL-friendly slug
const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
};

async function updateUrlReferences(oldUrl: string, newUrl: string) {
  const batch = writeBatch(db);
  const collectionsToSearch = ['stories', 'blogPosts', 'settings'];

  for (const collectionName of collectionsToSearch) {
    const collRef = collection(db, collectionName);
    const snapshot = await getDocs(collRef);

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const docRef = doc(db, collectionName, docSnap.id);
      let updated = false;
      const newData = { ...data };

      // Recursively search and replace the URL in the document data
      const recursiveUpdate = (obj: any) => {
        for (const key in obj) {
          if (typeof obj[key] === 'string' && obj[key] === oldUrl) {
            obj[key] = newUrl;
            updated = true;
          } else if (Array.isArray(obj[key])) {
             obj[key] = obj[key].map((item: any) => {
               if (typeof item === 'string' && item === oldUrl) {
                  updated = true;
                  return newUrl;
               }
               if(typeof item === 'object' && item !== null) {
                  recursiveUpdate(item);
               }
               return item;
            });
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            recursiveUpdate(obj[key]);
          }
        }
      };

      recursiveUpdate(newData);

      if (updated) {
        batch.set(docRef, newData);
      }
    });
  }

  try {
      await batch.commit();
      console.log("Referensi URL berhasil diperbarui di Firestore.");
  } catch (error) {
      console.error("Gagal memperbarui referensi URL di Firestore:", error);
      // We don't re-throw, as the file rename was successful. Log and monitor.
  }
}

export async function POST(request: Request) {
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
        const { oldKey, newName } = await request.json();

        if (!oldKey || !newName) {
            return NextResponse.json({ error: 'oldKey and newName are required.' }, { status: 400 });
        }
        
        const bucket = 'gallery-photos';
        const fileExtension = oldKey.split('.').pop();
        
        if (!fileExtension) {
             return NextResponse.json({ error: 'Could not determine file extension.' }, { status: 400 });
        }

        const sanitizedNewName = generateSlug(newName);
        let newKey = `uploads/${sanitizedNewName}.${fileExtension}`;
        let counter = 2;

        if (oldKey !== newKey) {
            while (true) {
                try {
                    await s3.headObject({ Bucket: bucket, Key: newKey }).promise();
                    // File exists, so we append a counter and try again
                    newKey = `uploads/${sanitizedNewName}-${counter}.${fileExtension}`;
                    counter++;
                } catch (error: any) {
                    if (error.code === 'NotFound') {
                        // File does not exist, this is a unique name
                        break;
                    }
                    // Another error occurred, re-throw it
                    throw error;
                }
            }
        }
        
        if (oldKey === newKey) {
             return NextResponse.json({ message: 'New name is the same as the old name. No changes made.' });
        }

        // Copy object
        const copyParams = {
            Bucket: bucket,
            CopySource: `${bucket}/${oldKey}`,
            Key: newKey,
            ACL: 'public-read' as const,
        };
        await s3.copyObject(copyParams).promise();

        // Delete old object
        const deleteParams = {
            Bucket: bucket,
            Key: oldKey,
        };
        await s3.deleteObject(deleteParams).promise();
        
        const oldUrl = `https://nos.wjv-1.neo.id/gallery-photos/${oldKey}`;
        const newUrl = `https://nos.wjv-1.neo.id/gallery-photos/${newKey}`;

        // Update references in Firestore
        await updateUrlReferences(oldUrl, newUrl);

        return NextResponse.json({ message: 'File renamed successfully and references updated.', newKey, newUrl });

    } catch (error: any) {
        console.error("Error renaming file in NEO:", error);
        
        let errorMessage = 'Failed to rename file in bucket.';
        if (error.code === 'NoSuchKey') {
            errorMessage = 'The specified file to rename does not exist.';
        } else if (error.code === 'AccessDenied') {
            errorMessage = 'Access denied. Check your S3 credentials and permissions.';
        }

        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
