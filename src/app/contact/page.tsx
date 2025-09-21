
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { getContactSettings } from '@/lib/actions';
import Link from "next/link";
import { Skeleton } from '@/components/ui/skeleton';
import { Download } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import ContactForm from '@/components/contact-form';


interface ContactSettings {
    heroImageUrl?: string;
    headline?: string;
    paragraph?: string;
    downloadableFileUrl?: string;
}

const defaultSettings: ContactSettings = {
    heroImageUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2670&auto=format&fit=crop",
    headline: "Hai, akhirnya kita bertemu.",
    paragraph: "Senang bertemu dengan Anda di sini. Jika Anda tertarik dengan layanan kami, itu berarti Anda memiliki selera tinggi dalam melihat gambar dan fotografi, sama seperti kami. Jika Anda memiliki pertanyaan, Anda dapat menghubungi kami melalui WhatsApp melalui tautan di bawah ini. Semoga harimu menyenangkan! Kami berharap dapat bertemu Anda di momen terindah Anda.",
    downloadableFileUrl: "",
};

export default function ContactPage() {
  const [settings, setSettings] = useState<ContactSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      setLoading(true);
      const fetchedSettings = await getContactSettings();
      
      const paragraph = "Senang bertemu dengan Anda di sini. Jika Anda tertarik dengan layanan kami, itu berarti Anda memiliki selera tinggi dalam melihat gambar dan fotografi, sama seperti kami. Jika Anda memiliki pertanyaan, Anda dapat menghubungi kami melalui WhatsApp melalui tautan di bawah ini. Semoga harimu menyenangkan! Kami berharap dapat bertemu Anda di momen terindah Anda.";

      setSettings({
          heroImageUrl: fetchedSettings?.heroImageUrl || defaultSettings.heroImageUrl,
          headline: fetchedSettings?.headline || defaultSettings.headline,
          paragraph: fetchedSettings?.paragraph || paragraph,
          downloadableFileUrl: fetchedSettings?.downloadableFileUrl || "",
      });
      
      setLoading(false);
    }
    fetchSettings();
  }, []);

  if (loading) {
      return (
          <>
            <Skeleton className="h-[50vh] md:h-[60vh] w-full" />
            <div className="container mx-auto max-w-2xl px-4 py-12 md:py-20">
                <div className="text-center mb-10">
                    <Skeleton className="h-10 w-2/3 mx-auto" />
                    <div className="mt-6 space-y-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6 mx-auto" />
                    </div>
                </div>
                 <div className="w-full">
                    <div className="space-y-6">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-12 w-full mt-8" />
                 </div>
            </div>
          </>
      )
  }

  return (
    <>
      <section className="relative h-[50vh] md:h-[60vh] w-full flex items-center justify-center text-center text-white bg-black">
        {settings.heroImageUrl && (
            <Image
              src={settings.heroImageUrl}
              alt="Hubungi Kami"
              fill
              className="object-cover opacity-50"
              data-ai-hint="pasangan lanskap"
              priority
            />
        )}
        <div className="relative z-10 p-4">
        </div>
      </section>

      <div className="container mx-auto max-w-2xl px-4 py-12 md:py-20 animate-in fade-in duration-1500">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight font-headline">{settings.headline}</h1>
          <div className="mt-6 text-base text-muted-foreground font-story space-y-4 whitespace-pre-line tracking-wider">
              <p>
                  {settings.paragraph}
              </p>
          </div>
        </div>
          <div className="text-center mt-8 space-y-4">
              {settings.downloadableFileUrl && (
                  <AlertDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <AlertDialogTrigger asChild>
                       <Button variant="default" className="rounded-sm uppercase tracking-widest font-normal px-8 py-6">
                         <Download className="mr-2 h-4 w-4" />
                         Unduh Katalog
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Unduh Katalog Harga</AlertDialogTitle>
                        <AlertDialogDescription>
                          Silakan isi detail di bawah ini untuk memulai unduhan Anda.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <ContactForm onFormSubmit={() => setIsFormOpen(false)} />
                    </AlertDialogContent>
                  </AlertDialog>
              )}
               <Button asChild variant="outline" className="bg-accent text-accent-foreground hover:bg-accent/90 border-accent hover:border-accent/90 rounded-sm uppercase tracking-widest font-normal px-8 py-6">
                  <Link href="https://wa.me/6282340211624" target="_blank">
                      WHATSAPP | PENAWARAN KHUSUS
                  </Link>
              </Button>
        </div>
      </div>
      
      <section className="py-12 md:py-20">
          <div className="container mx-auto px-4">
               <div className="w-full h-[450px] rounded-lg overflow-hidden">
                    <iframe 
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d507529.79742349574!2d106.9097039!3d-6.3841224500000004!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xace75a453968d025%3A0x4779ebe223cdb1a0!2sNingrat%20Wedding!5e0!3m2!1sid!2sid!4v1758385658817!5m2!1sid!2sid" 
                        width="100%" 
                        height="100%" 
                        style={{ border: 0 }}
                        allowFullScreen={true}
                        loading="lazy" 
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Lokasi Kami"
                    ></iframe>
               </div>
          </div>
      </section>
    </>
  );
}
