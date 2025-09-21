
'use server';

import { z } from 'zod';
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
  setDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { revalidatePath } from 'next/cache';

const contactSchema = z.object({
  name: z.string().min(2, { message: 'Nama harus terdiri dari minimal 2 karakter.' }),
  email: z.string().email({ message: 'Silakan masukkan email yang valid.' }),
  whatsapp: z.string().min(6, { message: 'Nomor WhatsApp harus terdiri dari minimal 6 digit.'}),
  location: z.string().min(2, { message: "Lokasi wajib diisi." }),
  knowFrom: z.array(z.string()).refine((value) => value.length > 0, {
    message: "Anda harus memilih setidaknya satu item.",
  }),
});

export async function submitContactForm(prevState: any, formData: FormData) {
  const validatedFields = contactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    whatsapp: formData.get('whatsapp'),
    location: formData.get('location'),
    knowFrom: formData.getAll('knowFrom'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Harap perbaiki kesalahan dan coba lagi.',
    };
  }
  
  try {
    const contactSettings = await getContactSettings();
    
    await addDoc(collection(db, 'contactSubmissions'), {
      ...validatedFields.data,
      submittedAt: serverTimestamp(),
    });
    
    revalidatePath('/admin/inbox');

    return { 
        success: true,
        message: 'Terima kasih! Unduhan Anda akan segera dimulai.',
        downloadUrl: contactSettings?.downloadableFileUrl || null
    };

  } catch(e) {
    console.error("Gagal mengirimkan formulir kontak: ", e);
    return { 
        success: false,
        message: 'Gagal memproses permintaan Anda. Silakan coba lagi.' 
    };
  }
}

const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
};


const contentBlockSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'h1', 'h2', 'image_full', 'image_split', 'image_tri', 'title_and_paragraph']),
  content: z.any(),
});

const storySchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  credit: z.string(),
  slug: z.string(),
  story: z.string().optional(),
  contentBlocks: z.array(contentBlockSchema).optional(),
  heroImageUrl: z.string().url().optional().nullable(),
  audioFileUrl: z.string().url().optional().nullable(),
  galleryImageUrls: z.array(z.string().url()).optional(),
});

export async function saveStory(data: {
  title: string;
  description?: string;
  credit: string;
  heroImageUrl?: string | null;
  audioFileUrl?: string | null;
  contentBlocks: any[];
}) {
  const slug = generateSlug(data.title);

  const validatedFields = storySchema.safeParse({
    ...data,
    slug,
    story: '',
  });

  if (!validatedFields.success) {
    console.error(
      'Kesalahan validasi:',
      validatedFields.error.flatten().fieldErrors
    );
    return {
      success: false,
      message: 'Data yang diberikan tidak valid.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const docRef = await addDoc(collection(db, 'stories'), {
      ...validatedFields.data,
      createdAt: serverTimestamp(),
    });
    console.log('Dokumen ditulis dengan ID: ', docRef.id);
    revalidatePath('/');
    revalidatePath('/portfolio');
    return { success: true, message: 'Cerita berhasil disimpan!' };
  } catch (e) {
    console.error('Gagal menambahkan dokumen: ', e);
    return { success: false, message: 'Gagal menyimpan cerita.' };
  }
}

export async function updateStory(
  id: string,
  data: {
    title: string;
    description?: string;
    credit: string;
    heroImageUrl?: string | null;
    audioFileUrl?: string | null;
    contentBlocks: any[];
  }
) {
  const slug = generateSlug(data.title);

  const validatedFields = storySchema.safeParse({
    ...data,
    slug,
    story: '',
  });

  if (!validatedFields.success) {
    console.error(
      'Kesalahan validasi:',
      validatedFields.error.flatten().fieldErrors
    );
    return {
      success: false,
      message: 'Data untuk pembaruan tidak valid.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const storyRef = doc(db, 'stories', id);
    const docSnap = await getDoc(storyRef);
    if (!docSnap.exists()) {
      return { success: false, message: "Cerita tidak ditemukan." };
    }
    const existingData = docSnap.data();

    await updateDoc(storyRef, {
      ...validatedFields.data,
      createdAt: existingData.createdAt,
      updatedAt: serverTimestamp(),
    });

    console.log('Dokumen diperbarui dengan ID: ', id);
    revalidatePath('/');
    revalidatePath('/portfolio');
    revalidatePath(`/stories/${slug}`);
    return { success: true, message: 'Cerita berhasil diperbarui!' };
  } catch (e) {
    console.error('Gagal memperbarui dokumen: ', e);
    return { success: false, message: 'Gagal memperbarui cerita.' };
  }
}

export async function deleteStory(id: string) {
  if (!id) {
    return { success: false, message: 'ID cerita diperlukan.' };
  }
  try {
    await deleteDoc(doc(db, 'stories', id));
    revalidatePath('/');
    revalidatePath('/portfolio');
    return { success: true, message: 'Cerita berhasil dihapus.' };
  } catch (error) {
    console.error('Gagal menghapus cerita: ', error);
    return { success: false, message: 'Gagal menghapus cerita.' };
  }
}

const siteSettingsSchema = z.object({
    appName: z.string().min(1, "Nama aplikasi wajib diisi."),
    metaDescription: z.string().min(1, "Deskripsi meta wajib diisi."),
    metaKeywords: z.string().optional(),
    logoUrl: z.string().url("URL logo tidak valid.").optional(),
    faviconUrl: z.string().url("URL favicon tidak valid.").optional(),
});


export async function getSiteSettings() {
    try {
        const settingsRef = doc(db, 'settings', 'general');
        const docSnap = await getDoc(settingsRef);

        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (error) {
        console.error("Gagal mengambil pengaturan situs:", error);
        return null;
    }
}


export async function saveSiteSettings(data: {
    appName: string;
    metaDescription: string;
    metaKeywords?: string;
    logoUrl?: string;
    faviconUrl?: string;
}) {
    const validatedFields = siteSettingsSchema.safeParse(data);

    if (!validatedFields.success) {
        return {
            success: false,
            message: "Data yang diberikan untuk pengaturan situs tidak valid.",
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        const settingsRef = doc(db, 'settings', 'general');
        await setDoc(settingsRef, validatedFields.data, { merge: true });
        
        revalidatePath('/', 'layout');

        return { success: true, message: 'Pengaturan berhasil disimpan!' };
    } catch (e) {
        console.error('Gagal menyimpan pengaturan situs: ', e);
        return { success: false, message: 'Gagal menyimpan pengaturan.' };
    }
}


const homeSettingsSchema = z.object({
    heroMedia: z.array(z.object({
        url: z.string().url(),
        type: z.string(),
    })).optional(),
    introHeadline: z.string().optional(),
    introParagraph1: z.string().optional(),
    introParagraph2: z.string().optional(),
});

export async function getHomeSettings() {
    try {
        const settingsRef = doc(db, 'settings', 'home');
        const docSnap = await getDoc(settingsRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return { heroMedia: [], introHeadline: "", introParagraph1: "", introParagraph2: "" };
    } catch (error) {
        console.error("Gagal mengambil pengaturan halaman beranda:", error);
        return { heroMedia: [], introHeadline: "", introParagraph1: "", introParagraph2: "" };
    }
}

export async function saveHomeSettings(data: { 
    heroMedia?: { url: string; type: string }[],
    introHeadline?: string;
    introParagraph1?: string;
    introParagraph2?: string;
}) {
    const validatedFields = homeSettingsSchema.safeParse(data);

    if (!validatedFields.success) {
        console.log(validatedFields.error.flatten().fieldErrors)
        return {
            success: false,
            message: "Data yang diberikan untuk pengaturan halaman beranda tidak valid.",
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        const settingsRef = doc(db, 'settings', 'home');
        await setDoc(settingsRef, validatedFields.data, { merge: true });
        revalidatePath('/');
        return { success: true, message: 'Pengaturan halaman beranda berhasil disimpan!' };
    } catch (e) {
        console.error('Gagal menyimpan pengaturan halaman beranda: ', e);
        return { success: false, message: 'Gagal menyimpan pengaturan halaman beranda.' };
    }
}

const aboutSettingsSchema = z.object({
    heroImageUrl: z.string().url("URL Gambar Hero tidak valid.").optional(),
    headline: z.string().optional(),
    paragraph: z.string().optional(),
});

export async function getAboutSettings() {
    try {
        const settingsRef = doc(db, 'settings', 'about');
        const docSnap = await getDoc(settingsRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return { heroImageUrl: "", headline: "", paragraph: "" };
    } catch (error) {
        console.error("Gagal mengambil pengaturan halaman tentang:", error);
        return { heroImageUrl: "", headline: "", paragraph: "" };
    }
}

export async function saveAboutSettings(data: {
    heroImageUrl?: string;
    headline?: string;
    paragraph?: string;
}) {
    const validatedFields = aboutSettingsSchema.safeParse(data);

    if (!validatedFields.success) {
        console.log(validatedFields.error.flatten().fieldErrors)
        return {
            success: false,
            message: "Data yang diberikan untuk pengaturan halaman tentang tidak valid.",
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        const settingsRef = doc(db, 'settings', 'about');
        await setDoc(settingsRef, validatedFields.data, { merge: true });
        revalidatePath('/about');
        return { success: true, message: 'Pengaturan halaman tentang berhasil disimpan!' };
    } catch (e) {
        console.error('Gagal menyimpan pengaturan halaman tentang: ', e);
        return { success: false, message: 'Gagal menyimpan pengaturan halaman tentang.' };
    }
}


const contactSettingsSchema = z.object({
    heroImageUrl: z.string().url("URL Gambar Hero tidak valid.").optional().or(z.literal('')),
    headline: z.string().optional(),
    paragraph: z.string().optional(),
    downloadableFileUrl: z.string().url("URL File tidak valid.").optional().or(z.literal('')),
});

export async function getContactSettings() {
    try {
        const settingsRef = doc(db, 'settings', 'contact');
        const docSnap = await getDoc(settingsRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return { heroImageUrl: "", headline: "", paragraph: "", downloadableFileUrl: "" };
    } catch (error) {
        console.error("Gagal mengambil pengaturan halaman kontak:", error);
        return { heroImageUrl: "", headline: "", paragraph: "", downloadableFileUrl: "" };
    }
}

export async function saveContactSettings(data: {
    heroImageUrl?: string;
    headline?: string;
    paragraph?: string;
    downloadableFileUrl?: string;
}) {
    const validatedFields = contactSettingsSchema.safeParse(data);

    if (!validatedFields.success) {
        console.log(validatedFields.error.flatten().fieldErrors)
        return {
            success: false,
            message: "Data yang diberikan untuk pengaturan halaman kontak tidak valid.",
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        const settingsRef = doc(db, 'settings', 'contact');
        await setDoc(settingsRef, validatedFields.data, { merge: true });
        revalidatePath('/contact');
        return { success: true, message: 'Pengaturan halaman kontak berhasil disimpan!' };
    } catch (e) {
        console.error('Gagal menyimpan pengaturan halaman kontak: ', e);
        return { success: false, message: 'Gagal menyimpan pengaturan halaman kontak.' };
    }
}

const portfolioSettingsSchema = z.object({
    heroImageUrl: z.string().url("URL Gambar Hero tidak valid.").optional(),
    headline: z.string().optional(),
    paragraph: z.string().optional(),
});

export async function getPortfolioSettings() {
    try {
        const settingsRef = doc(db, 'settings', 'portfolio');
        const docSnap = await getDoc(settingsRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return { heroImageUrl: "", headline: "", paragraph: "" };
    } catch (error) {
        console.error("Gagal mengambil pengaturan halaman portofolio:", error);
        return { heroImageUrl: "", headline: "", paragraph: "" };
    }
}

export async function savePortfolioSettings(data: {
    heroImageUrl?: string;
    headline?: string;
    paragraph?: string;
}) {
    const validatedFields = portfolioSettingsSchema.safeParse(data);

    if (!validatedFields.success) {
        console.log(validatedFields.error.flatten().fieldErrors)
        return {
            success: false,
            message: "Data yang diberikan untuk pengaturan halaman portofolio tidak valid.",
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        const settingsRef = doc(db, 'settings', 'portfolio');
        await setDoc(settingsRef, validatedFields.data, { merge: true });
        revalidatePath('/portfolio');
        return { success: true, message: 'Pengaturan halaman portofolio berhasil disimpan!' };
    } catch (e) {
        console.error('Gagal menyimpan pengaturan halaman portofolio: ', e);
        return { success: false, message: 'Gagal menyimpan pengaturan halaman portofolio.' };
    }
}

const servicesSettingsSchema = z.object({
    heroImageUrl: z.string().url().optional(),
    tagline: z.string().optional(),
    momentsTitle: z.string().optional(),
    momentsDescription: z.string().optional(),
    capturedMoments: z.array(z.object({
        id: z.string().optional(),
        title: z.string(),
        description: z.string(),
        imageUrl: z.string().url().optional(),
    })).optional(),
    packagesTitle: z.string().optional(),
    packagesDescription: z.string().optional(),
    packages: z.array(z.object({
        id: z.string().optional(),
        name: z.string(),
        price: z.string(),
        features: z.array(z.string()),
        highlight: z.boolean(),
    })).optional(),
});


export async function getServicesSettings(): Promise<any> {
    try {
        const settingsRef = doc(db, 'settings', 'services');
        const docSnap = await getDoc(settingsRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (error) {
        console.error("Gagal mengambil pengaturan halaman layanan:", error);
        return null;
    }
}

export async function saveServicesSettings(data: z.infer<typeof servicesSettingsSchema>) {
    const validatedFields = servicesSettingsSchema.safeParse(data);

    if (!validatedFields.success) {
        console.log(validatedFields.error.flatten().fieldErrors)
        return {
            success: false,
            message: "Data yang diberikan untuk pengaturan halaman layanan tidak valid.",
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }
    
    const dataToSave = {
        ...validatedFields.data,
        capturedMoments: validatedFields.data.capturedMoments?.map(({id, ...rest}) => rest),
        packages: validatedFields.data.packages?.map(({id, ...rest}) => rest),
    };


    try {
        const settingsRef = doc(db, 'settings', 'services');
        await setDoc(settingsRef, dataToSave, { merge: true });
        revalidatePath('/services');
        return { success: true, message: 'Pengaturan halaman layanan berhasil disimpan!' };
    } catch (e) {
        console.error('Gagal menyimpan pengaturan halaman layanan: ', e);
        return { success: false, message: 'Gagal menyimpan pengaturan halaman layanan.' };
    }
}

export async function getPackageById(packageId: string) {
    if (!packageId) return null;
    try {
        const settings = await getServicesSettings();
        if (settings && settings.packages) {
            const foundPackage = settings.packages.find((p: any) => p.id === packageId);
            return foundPackage || null;
        }
        return null;
    } catch (error) {
        console.error("Gagal mengambil paket berdasarkan ID:", error);
        return null;
    }
}
