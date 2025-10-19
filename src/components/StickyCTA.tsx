
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CalendarCheck, MessageCircle } from 'lucide-react';

export default function StickyCTA() {
  const handleCTAClick = (cta_text: string) => {
    // Placeholder untuk pelacakan acara Google Analytics 4
    // Di sini Anda akan memanggil fungsi pelacakan Anda, contohnya:
    // window.gtag('event', 'generate_lead', { 'cta_text': cta_text });
    console.log(`GA4 Event Triggered: generate_lead, CTA Text: '${cta_text}'`);
  };

  return (
    <div className="fixed bottom-0 w-full z-50 bg-[#F8F5F1]/80 backdrop-blur-sm border-t border-gray-200 p-3" role="complementary" aria-label="Primary actions">
      <div className="container mx-auto flex items-center justify-center sm:justify-between gap-4">
        <p className="hidden sm:block text-sm font-medium text-gray-800">
          Siap mewujudkan hari istimewa Anda?
        </p>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button asChild variant="outline" className="w-full bg-white" onClick={() => handleCTAClick('Cek Ketersediaan Tanggal')}>
            <Link href="/contact">
              <CalendarCheck className="mr-2 h-4 w-4" />
              Cek Ketersediaan
            </Link>
          </Button>
          <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => handleCTAClick('Konsultasi Gratis Sekarang')}>
            <Link href="/contact">
              <MessageCircle className="mr-2 h-4 w-4" />
              Konsultasi Gratis
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
