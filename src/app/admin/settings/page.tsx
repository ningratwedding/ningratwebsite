
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useContext } from "react";
import { Loader2, Upload, Library } from "lucide-react";
import { getSiteSettings, saveSiteSettings } from "@/lib/actions";
import { uploadFileToNeo } from "@/lib/neo-storage";
import Image from "next/image";
import { AdminTitleContext } from "@/contexts/AdminTitleContext";
import FileManagerDialog from "@/components/file-manager-dialog";

interface SiteSettings {
    appName: string;
    metaDescription: string;
    metaKeywords?: string;
    logoUrl?: string;
    faviconUrl?: string;
}

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Partial<SiteSettings>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { setPageTitle } = useContext(AdminTitleContext)!;
  const [isFileManagerOpen, setIsFileManagerOpen] = useState(false);
  const [selectionTarget, setSelectionTarget] = useState<'logo' | 'favicon' | null>(null);


  useEffect(() => {
    setPageTitle('Pengaturan Umum');
  }, [setPageTitle]);

  useEffect(() => {
    async function fetchSettings() {
      setIsLoading(true);
      const currentSettings = await getSiteSettings();
      if (currentSettings) {
        setSettings(currentSettings);
      }
      setIsLoading(false);
    }
    fetchSettings();
  }, []);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
        let { appName, metaDescription, metaKeywords, logoUrl, faviconUrl } = settings;
        
        if (logoFile) {
            toast({ title: "Mengunggah Logo..." });
            logoUrl = await uploadFileToNeo(logoFile);
        }

        if (faviconFile) {
            toast({ title: "Mengunggah Favicon..." });
            faviconUrl = await uploadFileToNeo(faviconFile);
        }
        
        const result = await saveSiteSettings({
            appName: appName || 'Ningrat Stories',
            metaDescription: metaDescription || 'Kumpulan cerita indah yang diceritakan melalui fotografi.',
            metaKeywords: metaKeywords || '',
            logoUrl,
            faviconUrl,
        });

        if (result.success) {
            toast({
                title: "Pengaturan Disimpan",
                description: "Perubahan Anda telah berhasil disimpan.",
            });
            const currentSettings = await getSiteSettings();
            if (currentSettings) setSettings(currentSettings);
        } else {
            throw new Error(result.message || "Gagal menyimpan pengaturan");
        }

    } catch (error: any) {
        toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
        });
    } finally {
        setIsSaving(false);
        setLogoFile(null);
        setFaviconFile(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const getPreviewUrl = (file: File | null, existingUrl?: string): string | null => {
      if (file) return URL.createObjectURL(file);
      if (existingUrl) return existingUrl;
      return null;
  }
  
  const logoPreview = getPreviewUrl(logoFile, settings.logoUrl);
  const faviconPreview = getPreviewUrl(faviconFile, settings.faviconUrl);

  const handleOpenFileManager = (target: 'logo' | 'favicon') => {
    setSelectionTarget(target);
    setIsFileManagerOpen(true);
  };

  const handleFileSelect = (file: { url: string }) => {
    if (selectionTarget) {
      setSettings(prev => ({ ...prev, [`${selectionTarget}Url`]: file.url }));
      if (selectionTarget === 'logo') setLogoFile(null);
      if (selectionTarget === 'favicon') setFaviconFile(null);
    }
  };

  return (
    <>
    <FileManagerDialog 
      open={isFileManagerOpen}
      onOpenChange={setIsFileManagerOpen}
      onFileSelect={handleFileSelect}
    />
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <form onSubmit={handleSaveChanges}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Umum</CardTitle>
                        <CardDescription>Perbarui nama situs dan informasi meta Anda untuk SEO.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="appName">Nama Aplikasi</Label>
                            <Input id="appName" name="appName" value={settings.appName || ''} onChange={handleInputChange} placeholder="Contoh: Ningrat Stories" disabled={isSaving} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="metaDescription">Deskripsi Meta</Label>
                            <Textarea id="metaDescription" name="metaDescription" value={settings.metaDescription || ''} onChange={handleInputChange} placeholder="Deskripsi singkat tentang situs web Anda." className="min-h-[100px]" disabled={isSaving} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="metaKeywords">Kata Kunci Meta</Label>
                            <Textarea id="metaKeywords" name="metaKeywords" value={settings.metaKeywords || ''} onChange={handleInputChange} placeholder="Contoh: fotografi, pernikahan, bali, sesi pasangan" className="min-h-[100px]" disabled={isSaving} />
                            <p className="text-xs text-muted-foreground">Pisahkan kata kunci dengan koma.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>Branding</CardTitle>
                        <CardDescription>Unggah logo dan favicon situs Anda.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Logo</Label>
                            <div className="relative w-full aspect-video border-2 border-dashed rounded-lg bg-muted">
                                {logoPreview && (
                                    <Image src={logoPreview} alt="Pratinjau logo" fill className="object-contain p-4" />
                                )}
                            </div>
                             <div className="flex gap-2 mt-2">
                                <Button type="button" variant="outline" size="sm" className="w-full" asChild>
                                    <label htmlFor="logo-upload" className="cursor-pointer">
                                        <Upload className="mr-2 h-4 w-4" />
                                        Unggahan Baru
                                        <input id="logo-upload" type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && setLogoFile(e.target.files[0])} disabled={isSaving} />
                                    </label>
                                </Button>
                                <Button type="button" variant="secondary" size="sm" className="w-full" onClick={() => handleOpenFileManager('logo')}>
                                    <Library className="mr-2 h-4 w-4" />
                                    Pilih dari Galeri
                                </Button>
                             </div>
                             <p className="text-xs text-muted-foreground">Disarankan: SVG atau PNG transparan.</p>
                        </div>
                         <div className="space-y-2">
                            <Label>Favicon</Label>
                            <div className="relative w-24 h-24 border-2 border-dashed rounded-lg bg-muted">
                                {faviconPreview && (
                                    <Image src={faviconPreview} alt="Pratinjau favicon" fill className="object-contain p-2" />
                                )}
                            </div>
                             <div className="flex gap-2 mt-2 max-w-xs">
                                <Button type="button" variant="outline" size="sm" className="w-full" asChild>
                                    <label htmlFor="favicon-upload" className="cursor-pointer">
                                        <Upload className="mr-2 h-4 w-4" />
                                        Unggah
                                        <input id="favicon-upload" type="file" className="hidden" accept="image/png, image/x-icon, image/svg+xml" onChange={(e) => e.target.files && setFaviconFile(e.target.files[0])} disabled={isSaving} />
                                    </label>
                                </Button>
                                <Button type="button" variant="secondary" size="sm" className="w-full" onClick={() => handleOpenFileManager('favicon')}>
                                    <Library className="mr-2 h-4 w-4" />
                                    Galeri
                                </Button>
                             </div>
                             <p className="text-xs text-muted-foreground">Disarankan: 32x32 atau 64x64 PNG atau ICO.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>

        <div className="flex justify-end gap-2 py-8 mt-4">
            <Button type="submit" disabled={isSaving || isLoading}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Simpan Perubahan
            </Button>
        </div>
      </form>
    </main>
    </>
  );
}
