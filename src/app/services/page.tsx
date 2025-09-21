
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { getServicesSettings } from "@/lib/actions";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Image from "next/image";

interface CapturedMoment {
  title: string;
  description: string;
  imageUrl?: string;
}

interface ServicePackage {
  id: string;
  name: string;
  price: string;
  features: string[];
  highlight: boolean;
}

interface ServicesSettings {
  heroImageUrl?: string;
  tagline: string;
  momentsTitle: string;
  momentsDescription: string;
  capturedMoments: CapturedMoment[];
  packagesTitle: string;
  packagesDescription: string;
  packages: ServicePackage[];
}

const defaultSettings: ServicesSettings = {
    heroImageUrl: "https://images.unsplash.com/photo-1511281423824-9b4626b15a1a?q=80&w=2574&auto=format&fit=crop",
    tagline: "Menceritakan Kisah Tanpa Kata-kata",
    momentsTitle: "Momen yang Diabadikan",
    momentsDescription: "Kami fokus menangkap esensi dari setiap momen berharga untuk menceritakan kisah Anda secara utuh.",
    capturedMoments: [
      { title: "KEDATANGAN PENGANTIN DAN TAMU UTAMA", description: "Abadikan saat pengantin dan keluarga utama tiba di lokasi resepsi. Ini merupakan momen awal yang menunjukkan antusiasme dan kebahagiaan." },
      { title: "MOMEN BERJALAN MENUJU PELAMINAN", description: "Dokumentasikan perjalanan pengantin menuju pelaminan, terutama jika ada pengiring atau prosesi khusus. Fokus pada busana dan ekspresi untuk menambah kesan elegan." },
      { title: "EKSPRESI DAN EMOSI", description: "Tangkap momen ekspresi bahagia, tawa, atau haru pengantin saat berinteraksi dengan keluarga dan tamu. Ini akan menambah kedalaman emosional dalam dokumentasi." },
      { title: "FOTO BERSAMA KELUARGA DAN TAMU", description: "Potret pengantin bersama keluarga dan teman-teman dekat di pelaminan. Foto ini sangat penting sebagai kenang-kenangan bagi mereka yang hadir." },
      { title: "MOMEN SAKRAL DAN TRADISI ADAT", description: "Abadikan setiap momen sakral atau tradisi adat yang dilakukan, seperti pemberian doa, potong tumpeng, atau penyerahan simbolis dari keluarga." },
      { title: "DETAIL DEKORASI DAN SUASANA", description: "Foto detail dekorasi, seserahan, ornamen meja, karangan bunga, dan pencahayaan. Hal ini akan menambah estetika album dan menggambarkan suasana pesta." },
      { title: "PANGGUNG HIBURAN DAN PENAMPILAN KHUSUS", description: "Dokumentasikan panggung hiburan, seperti penampilan band, penari tradisional, atau pertunjukan spesial lainnya, sebagai pelengkap cerita acara." },
      { title: "POTONGAN KUE ATAU TOAST", description: "Tangkap momen simbolis seperti potong kue atau toast sebagai lambang kebersamaan dan awal yang baru untuk pengantin." },
      { title: "MOMEN SPONTAN DENGAN TAMU", description: "Abadikan momen candid antara pengantin dan tamu, seperti tawa spontan atau pelukan hangat, untuk menunjukkan kehangatan dan keakraban acara." },
      { title: "PENUTUPAN RESEPSI", description: "Ambil gambar momen pengantin pamit kepada tamu atau saat meninggalkan lokasi resepsi. Ini akan menjadi penutup sempurna untuk rangkaian dokumentasi yang mengesankan." }
    ],
    packagesTitle: "Paket Foto",
    packagesDescription: "Pilih paket yang paling sesuai dengan kebutuhan hari istimewa Anda.",
    packages: [
      { id: '1', name: "Standard", price: "IDR 950.000", features: ["4 Jam Acara", "1 Fotografer", "1 Flash disk", "Semua File diberikan", "Edit 30 foto", "Photo Book ukuran 20x30 cm"], highlight: false },
      { id: '2', name: "Silver", price: "IDR 1.600.000", features: ["8 Jam acara", "2 Fotografer", "1 Flash disk", "Semua File diberikan", "Edit 100 foto", "2x cetak 10r", "Photo Book ukuran 20x30 cm"], highlight: false },
      { id: '3', name: "Gold", price: "IDR 3.600.000", features: ["Video cinematic", "1 Videografer", "12 jam acara", "2 Fotografer", "1 Flash disk", "Semua File diberikan", "Edit 100 foto", "2x cetak 16r", "Photo Book ukuran 20x30 cm"], highlight: true }
    ],
};


export default function ServicesPage() {
  const [settings, setSettings] = useState<ServicesSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      setLoading(true);
      const fetchedSettings = await getServicesSettings();
      if (fetchedSettings) {
        setSettings({ ...defaultSettings, ...fetchedSettings });
      } else {
        setSettings(defaultSettings);
      }
      setLoading(false);
    }
    fetchSettings();
  }, []);

  if (loading) {
    return (
        <div className="bg-[#F8F5F1] text-gray-800">
            <Skeleton className="h-[60vh] w-full" />
            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <Skeleton className="h-10 w-2/3 mx-auto" />
                        <Skeleton className="h-5 w-1/2 mt-4 mx-auto" />
                    </div>
                    <div className="space-y-4">
                        {[...Array(6)].map((_, i) => (
                             <Skeleton key={i} className="h-16 w-full" />
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
  }

  return (
    <div className="bg-[#F8F5F1] text-gray-800">
      <section className="relative h-[60vh] w-full flex items-center justify-center text-center text-white bg-black">
        <Image
          src={settings.heroImageUrl!}
          alt={settings.tagline}
          fill
          className="object-cover opacity-50"
          priority
        />
        <div className="relative z-10 p-4">
           <h1 className="font-headline text-4xl md:text-6xl tracking-tight">{settings.tagline}</h1>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-headline tracking-tight">{settings.momentsTitle}</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">{settings.momentsDescription}</p>
          </div>
           <Accordion type="single" collapsible className="w-full">
             {settings.capturedMoments.map((moment, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger className="text-left font-semibold tracking-wide text-lg hover:no-underline">{moment.title}</AccordionTrigger>
                    <AccordionContent className="pt-4">
                        <div className="grid md:grid-cols-3 gap-6 items-center">
                            {moment.imageUrl && (
                                <div className="relative aspect-[4/3] overflow-hidden md:col-span-1">
                                    <Image src={moment.imageUrl} alt={moment.title} fill className="object-cover" />
                                </div>
                            )}
                            <p className={`text-muted-foreground ${moment.imageUrl ? 'md:col-span-2' : 'md:col-span-3'}`}>
                                {moment.description}
                            </p>
                        </div>
                    </AccordionContent>
                </AccordionItem>
             ))}
           </Accordion>
        </div>
      </section>
      
      <Separator className="my-8 max-w-4xl mx-auto bg-gray-200" />


      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-headline tracking-tight">{settings.packagesTitle}</h2>
            <p className="text-muted-foreground mt-2">{settings.packagesDescription}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {settings.packages.map((pkg, index) => (
              <Card key={pkg.id || index} className={`flex flex-col bg-transparent rounded-none ${pkg.highlight ? 'border-primary' : 'border-gray-200'}`}>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-headline">{pkg.name}</CardTitle>
                  <CardDescription className="text-3xl font-bold text-primary mt-2 pb-6">{pkg.price}</CardDescription>
                   <Separator />
                </CardHeader>
                <CardContent className="flex-grow pt-6">
                  <h4 className="font-semibold mb-4 text-center text-muted-foreground">YANG DI DAPATKAN</h4>
                  <ul className="space-y-3 text-sm">
                    {pkg.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="h-4 w-4 mr-3 mt-0.5 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <div className="p-6 pt-0 mt-6">
                  <Button asChild className="w-full" variant={pkg.highlight ? 'default' : 'outline'}>
                    <Link href={`/checkout?package=${pkg.id}`}>Pilih Paket</Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
