
'use client';

import Link from 'next/link';
import { Instagram, Facebook, Mail } from 'lucide-react';
import { getSiteSettings } from '@/lib/actions';
import { useState, useEffect } from 'react';

const socialLinks = [
    { Icon: Instagram, href: "https://www.instagram.com/ningrat_wedding" },
    { Icon: Facebook, href: "#" },
    { Icon: Mail, href: "mailto:ningratwedding@gmail.com" },
]

export default function Footer() {
  const [appName, setAppName] = useState('Ningrat Stories');

  useEffect(() => {
    async function fetchSettings() {
      const settings = await getSiteSettings();
      if (settings?.appName) {
        setAppName(settings.appName);
      }
    }
    fetchSettings();
  }, []);

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };


  return (
    <footer className="bg-[#F8F5F1] py-8 text-sm text-gray-600">
      <div className="container mx-auto px-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center md:text-left">
            <div>
                <h4 className="font-semibold text-gray-800 mb-4 uppercase tracking-wider">Navigasi</h4>
                <nav className="flex flex-col space-y-2">
                    <Link href="/portfolio" className="hover:text-gray-900">Portofolio</Link>
                    <Link href="/about" className="hover:text-gray-900">Tentang</Link>
                    <Link href="/contact" className="hover:text-gray-900">Hubungi kami</Link>
                </nav>
            </div>
            <div>
                <h4 className="font-semibold text-gray-800 mb-4 uppercase tracking-wider">Sosial</h4>
                <div className="flex justify-center md:justify-start space-x-4">
                    {socialLinks.map(({ Icon, href }, index) => (
                        <Link key={index} href={href} className="text-gray-600 hover:text-gray-900" target="_blank" rel="noopener noreferrer">
                            <Icon className="h-5 w-5" />
                        </Link>
                    ))}
                </div>
            </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between">
            <p className="order-2 sm:order-1 mt-4 sm:mt-0 text-xs">&copy; {new Date().getFullYear()} {appName}. Semua Hak Cipta Dilindungi.</p>
            <div className="order-1 sm:order-2 flex items-center gap-4">
                 <button onClick={scrollToTop} className="text-xs uppercase tracking-wider hover:text-gray-900">
                    Kembali ke Atas
                </button>
            </div>
        </div>
      </div>
    </footer>
  );
}
