
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useContext } from "react";
import { Loader2 } from "lucide-react";
import { AdminTitleContext } from "@/contexts/AdminTitleContext";

export default function AdminCheckoutSettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { setPageTitle } = useContext(AdminTitleContext)!;

  useEffect(() => {
    setPageTitle('Pengaturan Checkout');
  }, [setPageTitle]);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="grid grid-cols-1 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Integrasi Gerbang Pembayaran</CardTitle>
            <CardDescription>
              Konfigurasikan pengaturan penyedia pembayaran Anda di sini. Fitur ini akan segera hadir.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              Di pembaruan mendatang, Anda akan dapat memasukkan kunci API Anda untuk gerbang pembayaran seperti Midtrans, Xendit, atau Stripe.
            </p>
          </CardContent>
        </Card>
      </div>

       <div className="flex justify-end gap-2 py-8 mt-4">
          <Button disabled={true}>
              Simpan Perubahan
          </Button>
      </div>
    </main>
  );
}
