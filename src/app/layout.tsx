
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { getSiteSettings } from '@/lib/actions';
import { headers } from 'next/headers';
import { Open_Sans, Playfair_Display } from 'next/font/google';

const openSans = Open_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-open-sans',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair-display',
});


const BASE_URL = 'https://www.ningratwedding.id';

export async function generateMetadata() {
  const settings = await getSiteSettings();
  const siteName = settings?.appName || 'Ningrat Stories';
  const description = settings?.metaDescription || 'A collection of beautiful stories told through photography.';
  const ogImage = settings?.logoUrl || `${BASE_URL}/og-image.png`;

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description: description,
    keywords: settings?.metaKeywords || 'wedding, photography, story',
    openGraph: {
      title: siteName,
      description: description,
      url: '/',
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
    <html lang="en" className={cn("h-full", openSans.variable, playfairDisplay.variable)}>
      <head>
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
