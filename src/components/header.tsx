
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { getSiteSettings } from '@/lib/actions';
import Image from 'next/image';

const navLinks = [
  { href: '/portfolio', label: 'Portofolio' },
  { href: '/services', label: 'Layanan' },
  { href: '/about', label: 'Tentang' },
  { href: '/contact', label: 'Hubungi kami' },
];

const Logo = ({logoUrl}: {logoUrl?: string}) => {
    if (logoUrl) {
        return <Image src={logoUrl} alt="Logo" width={32} height={32} className="text-current" />;
    }
    return (
        <svg width="32" height="32" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.62939 5.46875L5.85739 19.5312H8.68339L8.71939 10.1625L14.7314 19.5312H18.5714L18.7994 5.46875H15.9734L15.9374 14.8L9.92539 5.46875H5.62939Z" fill="currentColor"/>
        </svg>
    );
};


export default function Header() {
  const pathname = usePathname();
  const [siteSettings, setSiteSettings] = useState<{ appName?: string; logoUrl?: string }>({});

  useEffect(() => {
    async function fetchSettings() {
      const settings = await getSiteSettings();
      if (settings) {
        setSiteSettings(settings);
      }
    }
    fetchSettings();
  }, []);

  return (
    <header className="absolute top-0 z-50 w-full text-white">
      <div className="container flex h-24 items-center justify-between mx-auto px-6">
        
        <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:text-white hover:bg-white/10">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Buka Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-[#F8F5F1] p-0">
                <SheetHeader>
                  <SheetTitle className="sr-only">Menu</SheetTitle>
                </SheetHeader>
                <div className="p-6 pt-12">
                  <nav className="flex flex-col space-y-6 text-lg uppercase tracking-widest">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="text-foreground/80 transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
        </div>

        <div className="hidden md:flex w-full items-center justify-center">
            <div className="flex items-center gap-10">
                <nav className="flex items-center space-x-8 text-sm uppercase tracking-widest">
                    <Link href="/portfolio" className="transition-opacity hover:opacity-80">Portofolio</Link>
                    <Link href="/services" className="transition-opacity hover:opacity-80">Layanan</Link>
                </nav>
                
                <Link href="/" className="flex-shrink-0">
                    <Logo logoUrl={siteSettings.logoUrl} />
                </Link>

                <nav className="flex items-center space-x-8 text-sm uppercase tracking-widest">
                    <Link href="/about" className="transition-opacity hover:opacity-80">Tentang</Link>
                    <Link href="/contact" className="transition-opacity hover:opacity-80">Hubungi Kami</Link>
                </nav>
            </div>
        </div>
        
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:hidden">
          <Link href="/" className="flex items-center space-x-2 transition-opacity hover:opacity-80">
            <Logo logoUrl={siteSettings.logoUrl} />
          </Link>
        </div>
        
        <div className="w-10 md:hidden"></div>
      </div>
    </header>
  );
}
