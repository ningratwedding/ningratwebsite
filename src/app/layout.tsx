

import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { getSiteSettings } from '@/lib/actions';
import { headers } from 'next/headers';

export async function generateMetadata() {
  const settings = await getSiteSettings();
  const siteName = settings?.appName || 'Ningrat Stories';
  const description = settings?.metaDescription || 'A collection of beautiful stories told through photography.';
  const ogImage = settings?.logoUrl || '/og-image.png'; // Fallback OG image

  return {
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description: description,
    keywords: settings?.metaKeywords || 'wedding, photography, story',
    openGraph: {
      title: siteName,
      description: description,
      url: './',
      siteName: siteName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
        },
      ],
      locale: 'id_ID',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: siteName,
      description: description,
      images: [ogImage],
    },
    icons: {
      icon: settings?.faviconUrl || '/favicon.ico',
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = headers().get('x-next-pathname') || '';
  const isAdminPage = pathname.startsWith('/admin');
  const isLoginPage = pathname.startsWith('/login');
  const isInvoicePage = pathname.startsWith('/invoice');

  const showHeaderFooter = !isAdminPage && !isLoginPage && !isInvoicePage;
  const isDarkPage = pathname === '/portfolio' || pathname === '/about';

  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Raleway:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased h-full flex flex-col", (isAdminPage || isLoginPage || isInvoicePage) ? "bg-muted/40" : (isDarkPage ? "bg-background" : "bg-[#F8F5F1]"))}>
        <div id="root-layout-content" className="flex flex-col flex-grow">
          {showHeaderFooter && <Header />}
          <main className={cn("flex-grow", !showHeaderFooter && "h-full")}>{children}</main>
          {showHeaderFooter && <Footer />}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
