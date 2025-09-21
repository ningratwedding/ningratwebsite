
'use client';

import { useContext, type ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { getAuth, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { app } from '@/lib/firebase';
import {
  Home,
  Settings,
  Menu,
  FileText,
  Folder,
  LogOut,
  Briefcase,
  CreditCard,
  Inbox,
  Receipt
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { getSiteSettings } from '@/lib/actions';
import Image from 'next/image';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { AdminTitleContext, AdminTitleProvider } from '@/contexts/AdminTitleContext';

const Logo = ({logoUrl}: {logoUrl?: string}) => {
    if (logoUrl) {
        return <Image src={logoUrl} alt="Logo" width={32} height={32} className="text-current" />;
    }
    return (
        <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-current">
            <path d="M25.43,26.16l-5.35-8.34,5.2-8.31H21.43l-3,5-1.32,2.07h0l-1.32-2.07-3-5H8.93l5.2,8.31-5.35,8.34h3.9l3.33-5.28,1.32-2.07h0l1.32,2.07,3.33,5.28h3.92Z" fill="currentColor"/>
        </svg>
    );
};

function AdminLayoutContent({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const auth = getAuth(app);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [siteSettings, setSiteSettings] = useState<{ appName?: string; logoUrl?: string }>({});
  const { pageTitle } = useContext(AdminTitleContext)!;

  useEffect(() => {
    async function fetchSettings() {
      const settings = await getSiteSettings();
      if (settings) {
        setSiteSettings(settings);
      }
    }
    fetchSettings();
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [auth, router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Gagal keluar:', error);
    }
  };

  const isLinkActive = (href: string) => pathname === href;

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen w-full">
        <header className="flex h-14 items-center gap-4 border-b bg-muted px-4 lg:h-[60px] lg:px-6">
           <Skeleton className="h-8 w-8" />
           <div className="w-full flex-1"></div>
           <Skeleton className="h-8 w-8 rounded-full" />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-muted px-4 lg:h-[60px] lg:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Buka menu navigasi</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col bg-slate-900 text-white border-slate-800 w-[280px] sm:max-w-[280px]">
            <SheetHeader>
                <SheetTitle className="sr-only">Menu Admin</SheetTitle>
            </SheetHeader>
            <nav className="grid gap-2 text-lg font-medium">
              <Link
                href="/"
                className="flex items-center gap-2 text-lg font-semibold mb-4 text-white"
              >
                <Logo logoUrl={siteSettings.logoUrl} />
                <span className="">{siteSettings.appName || 'Ningrat Stories'}</span>
              </Link>
              <Link
                href="/admin/dashboard"
                className={cn("mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2", isLinkActive('/admin/dashboard') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white')}
              >
                <Home className="h-5 w-5" />
                Dasbor
              </Link>
              <Link
                href="/admin/inbox"
                className={cn("mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2", isLinkActive('/admin/inbox') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white')}
              >
                <Inbox className="h-5 w-5" />
                Pesan Masuk
              </Link>
              <Link
                href="/admin/stories/new"
                className={cn("mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2", isLinkActive('/admin/stories/new') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white')}
              >
                <FileText className="h-5 w-5" />
                Cerita Baru
              </Link>
               <Link
                href="/admin/file-manager"
                className={cn("mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2", isLinkActive('/admin/file-manager') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white')}
              >
                <Folder className="h-5 w-5" />
                Pengelola File
              </Link>
              <Link
                href="/admin/invoice"
                className={cn("mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2", isLinkActive('/admin/invoice') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white')}
              >
                <Receipt className="h-5 w-5" />
                Faktur
              </Link>
              <Link
                href="/admin/checkout"
                className={cn("mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2", isLinkActive('/admin/checkout') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white')}
              >
                <CreditCard className="h-5 w-5" />
                Checkout
              </Link>
               <Accordion type="single" collapsible className="w-full" defaultValue={pathname.startsWith('/admin/settings') ? 'settings' : ''}>
                <AccordionItem value="settings" className="border-b-0">
                  <AccordionTrigger className={cn("mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-slate-400 hover:text-white hover:no-underline [&[data-state=open]>svg]:text-white", pathname.startsWith('/admin/settings') && 'text-white')}>
                     <div className="flex items-center gap-4">
                        <Settings className="h-5 w-5" />
                        Pengaturan
                     </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-10">
                    <nav className="grid gap-2 text-base font-medium">
                       <Link
                        href="/admin/settings"
                        className={cn("flex items-center gap-3 rounded-lg py-2 transition-all", isLinkActive('/admin/settings') ? 'text-white font-semibold' : 'text-slate-400 hover:text-white')}
                      >
                        Umum
                      </Link>
                      <Link
                        href="/admin/settings/home"
                        className={cn("flex items-center gap-3 rounded-lg py-2 transition-all", isLinkActive('/admin/settings/home') ? 'text-white font-semibold' : 'text-slate-400 hover:text-white')}
                      >
                        Halaman Beranda
                      </Link>
                      <Link
                        href="/admin/settings/portfolio"
                        className={cn("flex items-center gap-3 rounded-lg py-2 transition-all", isLinkActive('/admin/settings/portfolio') ? 'text-white font-semibold' : 'text-slate-400 hover:text-white')}
                      >
                        Halaman Portofolio
                      </Link>
                      <Link
                        href="/admin/settings/about"
                        className={cn("flex items-center gap-3 rounded-lg py-2 transition-all", isLinkActive('/admin/settings/about') ? 'text-white font-semibold' : 'text-slate-400 hover:text-white')}
                      >
                        Halaman Tentang
                      </Link>
                      <Link
                        href="/admin/settings/contact"
                        className={cn("flex items-center gap-3 rounded-lg py-2 transition-all", isLinkActive('/admin/settings/contact') ? 'text-white font-semibold' : 'text-slate-400 hover:text-white')}
                      >
                        Halaman Kontak
                      </Link>
                      <Link
                        href="/admin/settings/services"
                        className={cn("flex items-center gap-3 rounded-lg py-2 transition-all", isLinkActive('/admin/settings/services') ? 'text-white font-semibold' : 'text-slate-400 hover:text-white')}
                      >
                        Halaman Layanan
                      </Link>
                    </nav>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </nav>
            <div className="mt-auto">
                <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-4 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800">
                    <LogOut className="h-5 w-5" />
                    Keluar
                </Button>
            </div>
          </SheetContent>
        </Sheet>
        
        <div className="w-full flex-1">
           <h1 className="text-lg font-semibold">{pageTitle}</h1>
        </div>
        
        <div className="ml-auto flex items-center gap-4">
          <Button onClick={() => router.push('/')} variant="outline" size="sm">
                Lihat Situs
            </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <span className="sr-only">Buka menu pengguna</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/admin/settings')}>Pengaturan</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/admin/settings/home')}>Halaman Beranda</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/admin/settings/portfolio')}>Halaman Portofolio</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/admin/settings/about')}>Halaman Tentang</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/admin/settings/contact')}>Halaman Kontak</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/admin/settings/services')}>Halaman Layanan</DropdownMenuItem>
              <DropdownMenuItem>Dukungan</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Keluar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <div className="flex flex-1 flex-col">
          {children}
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminTitleProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminTitleProvider>
  )
}
