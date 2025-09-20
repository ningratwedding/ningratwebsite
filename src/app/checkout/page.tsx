
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getPackageById } from '@/lib/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Check, CreditCard, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ServicePackage {
  id: string;
  name: string;
  price: string;
  features: string[];
  highlight: boolean;
}

function CheckoutPageContent() {
    const searchParams = useSearchParams();
    const packageId = searchParams.get('package');
    const [pkg, setPkg] = useState<ServicePackage | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!packageId) {
            setError("Tidak ada paket yang dipilih.");
            setLoading(false);
            return;
        }

        async function fetchPackage() {
            try {
                const foundPackage = await getPackageById(packageId!);
                if (foundPackage) {
                    setPkg(foundPackage);
                } else {
                    setError("Paket yang dipilih tidak dapat ditemukan.");
                }
            } catch (err) {
                setError("Gagal memuat detail paket.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchPackage();
    }, [packageId]);

    const handlePayment = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
        }, 3000);
    }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-12 md:py-24 max-w-4xl">
                <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-40 w-full" />
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-20">
                <p className="text-destructive">{error}</p>
            </div>
        )
    }

    if (!pkg) {
         return (
            <div className="text-center py-20">
                <p className="text-muted-foreground">Tidak ada informasi paket yang tersedia.</p>
            </div>
        )
    }
    
    return (
        <div className="container mx-auto px-4 py-12 md:py-24 max-w-4xl">
            <h1 className="text-3xl md:text-4xl font-headline tracking-tight text-center mb-12">Selesaikan Pemesanan Anda</h1>
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
                <Card className="bg-background">
                    <CardHeader>
                        <CardTitle>Paket {pkg.name}</CardTitle>
                        <CardDescription className="text-2xl font-bold text-primary pt-2">{pkg.price}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <h4 className="font-semibold mb-3 text-muted-foreground">Fitur yang termasuk:</h4>
                        <ul className="space-y-2 text-sm">
                        {pkg.features.map((feature, i) => (
                            <li key={i} className="flex items-center">
                                <Check className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                                <span>{feature}</span>
                            </li>
                        ))}
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Detail Pembayaran</CardTitle>
                        <CardDescription>Masukkan informasi Anda untuk menyelesaikan pemesanan.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                           <Label htmlFor="name">Nama Lengkap</Label>
                           <Input id="name" placeholder="Nama Anda" disabled={isProcessing} />
                        </div>
                         <div className="space-y-2">
                           <Label htmlFor="email">Alamat Email</Label>
                           <Input id="email" type="email" placeholder="anda@contoh.com" disabled={isProcessing} />
                        </div>
                        <Separator />
                        <div className="space-y-2">
                             <Label>Metode Pembayaran</Label>
                             <div className="rounded-md border p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                   <CreditCard className="h-6 w-6 text-muted-foreground" />
                                   <span className="font-semibold">Kartu Kredit/Debit</span>
                                </div>
                                <span className="text-xs text-muted-foreground">Via Midtrans</span>
                             </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" size="lg" onClick={handlePayment} disabled={isProcessing}>
                           {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                           {isProcessing ? "Memproses..." : `Bayar ${pkg.price}`}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="w-full h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
            <CheckoutPageContent />
        </Suspense>
    )
}
