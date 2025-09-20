
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useCallback, useContext } from "react";
import { Loader2, Upload, Trash2, Library, File as FileIcon } from "lucide-react";
import { useDropzone } from 'react-dropzone';
import { getContactSettings, saveContactSettings } from "@/lib/actions";
import { uploadFileToNeo } from "@/lib/neo-storage";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminTitleContext } from "@/contexts/AdminTitleContext";
import FileManagerDialog from "@/components/file-manager-dialog";

interface ContactSettings {
    heroImageUrl?: string;
    headline?: string;
    paragraph?: string;
    downloadableFileUrl?: string;
}

type MediaFile = File & { preview: string };

export default function AdminContactSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<ContactSettings>({});
  const [heroImageFile, setHeroImageFile] = useState<MediaFile | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { setPageTitle } = useContext(AdminTitleContext)!;
  const [isFileManagerOpen, setIsFileManagerOpen] = useState(false);
  const [selectionTarget, setSelectionTarget] = useState<'hero' | 'pdf' | null>(null);

  useEffect(() => {
    setPageTitle('Kontak');
  }, [setPageTitle]);

  useEffect(() => {
    async function fetchSettings() {
        setIsLoading(true);
        const currentSettings = await getContactSettings();
        if (currentSettings) {
            setSettings(currentSettings);
        }
        setIsLoading(false);
    }
    fetchSettings();
  }, []);

  const onDropHero = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setHeroImageFile(Object.assign(file, {
          preview: URL.createObjectURL(file)
      }));
    }
  }, []);
  
  const onDropPdf = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setPdfFile(file);
    }
  }, []);

  const { getRootProps: getHeroRootProps, getInputProps: getHeroInputProps, isDragActive: isHeroDragActive } = useDropzone({
    onDrop: onDropHero,
    accept: { 'image/*': [] },
    multiple: false,
  });
  
  const { getRootProps: getPdfRootProps, getInputProps: getPdfInputProps, isDragActive: isPdfDragActive } = useDropzone({
    onDrop: onDropPdf,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
  });

  const handleRemoveImage = () => {
    setSettings(prev => ({ ...prev, heroImageUrl: undefined }));
    if (heroImageFile) {
        URL.revokeObjectURL(heroImageFile.preview);
        setHeroImageFile(null);
    }
  }
  
  const handleRemovePdf = () => {
    setSettings(prev => ({ ...prev, downloadableFileUrl: undefined }));
    setPdfFile(null);
  }

  const handleSaveChanges = async () => {
    setIsSaving(true);
    toast({ title: "Menyimpan perubahan..." });

    try {
        let finalImageUrl = settings.heroImageUrl;
        let finalPdfUrl = settings.downloadableFileUrl;

        if (heroImageFile) {
            toast({ title: "Mengunggah gambar hero..." });
            finalImageUrl = await uploadFileToNeo(heroImageFile);
        }
        
        if (pdfFile) {
            toast({ title: "Mengunggah file PDF..." });
            finalPdfUrl = await uploadFileToNeo(pdfFile);
        }

        const result = await saveContactSettings({ 
            ...settings,
            heroImageUrl: finalImageUrl,
            downloadableFileUrl: finalPdfUrl,
        });

        if (result.success) {
            toast({
                title: "Pengaturan Disimpan",
                description: "Pengaturan halaman kontak Anda telah diperbarui.",
            });
            setSettings(prev => ({...prev, heroImageUrl: finalImageUrl, downloadableFileUrl: finalPdfUrl }));
            setHeroImageFile(null);
            setPdfFile(null);
        } else {
            throw new Error(result.message || "Gagal menyimpan pengaturan");
        }
    } catch (error: any) {
         toast({
            title: "Gagal Menyimpan",
            description: error.message,
            variant: "destructive"
        });
    } finally {
        setIsSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (file: { url: string; type: string }) => {
    if (selectionTarget === 'hero') {
        setSettings(prev => ({ ...prev, heroImageUrl: file.url }));
        setHeroImageFile(null);
    } else if (selectionTarget === 'pdf') {
        setSettings(prev => ({ ...prev, downloadableFileUrl: file.url }));
        setPdfFile(null);
    }
  };
  
  const openFileManager = (target: 'hero' | 'pdf') => {
    setSelectionTarget(target);
    setIsFileManagerOpen(true);
  }

  const currentHeroImage = heroImageFile?.preview || settings.heroImageUrl;
  const currentPdfName = pdfFile?.name || settings.downloadableFileUrl?.split('/').pop();

  if (isLoading) {
      return (
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <Card>
                <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
                <CardContent className="space-y-6">
                    <Skeleton className="w-full h-64" />
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                </CardContent>
            </Card>
        </main>
      );
  }
  

  return (
    <>
    <FileManagerDialog 
      open={isFileManagerOpen}
      onOpenChange={setIsFileManagerOpen}
      onFileSelect={handleFileSelect}
    />
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="grid grid-cols-1 gap-8">
          <Card>
              <CardHeader>
                  <CardTitle>Konten Halaman</CardTitle>
                  <CardDescription>Kelola konten untuk halaman "Kontak" Anda.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Gambar Hero</Label>
                        <div className="relative group aspect-video w-full max-w-2xl rounded-lg overflow-hidden border bg-muted">
                            {currentHeroImage && (
                                <Image src={currentHeroImage} alt="Pratinjau Hero" fill className="object-cover" />
                            )}
                            {currentHeroImage && (
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button variant="destructive" size="icon" onClick={handleRemoveImage}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2 max-w-2xl">
                            <div {...getHeroRootProps()} className={`flex-1 flex flex-col items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors ${isHeroDragActive ? 'border-primary' : ''}`}>
                               <input {...getHeroInputProps()} />
                               <div className="text-center text-muted-foreground">
                                 <Upload className="w-6 h-6 mx-auto mb-2" />
                                 <p className="font-semibold text-sm">Unggahan Baru</p>
                                 <p className="text-xs">Seret & lepas</p>
                               </div>
                             </div>
                             <Button type="button" variant="outline" className="flex-1 h-auto flex-col" onClick={() => openFileManager('hero')}>
                                <Library className="w-6 h-6 mx-auto mb-2" />
                                <p className="font-semibold text-sm">Pilih dari Galeri</p>
                             </Button>
                        </div>
                    </div>
              
                   <div className="space-y-2">
                       <Label htmlFor="headline">Judul</Label>
                       <Input id="headline" name="headline" value={settings.headline || ""} onChange={handleInputChange} placeholder="Contoh: Hai, akhirnya kita bertemu." disabled={isSaving} />
                   </div>
                    <div className="space-y-2">
                       <Label htmlFor="paragraph">Paragraf</Label>
                       <Textarea id="paragraph" name="paragraph" value={settings.paragraph || ""} onChange={handleInputChange} placeholder="Senang bertemu dengan Anda di sini..." className="min-h-[150px]" disabled={isSaving} />
                   </div>
                   
                   <div className="space-y-2">
                        <Label>File yang Dapat Diunduh (PDF)</Label>
                         <div className="relative w-full max-w-2xl rounded-lg border bg-muted p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <FileIcon className="h-6 w-6 text-muted-foreground" />
                               <span className="text-sm text-muted-foreground truncate">{currentPdfName || 'Tidak ada file yang dipilih'}</span>
                            </div>
                            {currentPdfName && (
                                <Button variant="ghost" size="icon" onClick={handleRemovePdf}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            )}
                         </div>

                        <div className="flex gap-2 max-w-2xl">
                           <div {...getPdfRootProps()} className={`flex-1 flex flex-col items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors ${isPdfDragActive ? 'border-primary' : ''}`}>
                               <input {...getPdfInputProps()} />
                               <div className="text-center text-muted-foreground">
                                 <Upload className="w-6 h-6 mx-auto mb-2" />
                                 <p className="font-semibold text-sm">Unggah PDF Baru</p>
                               </div>
                             </div>
                             <Button type="button" variant="outline" className="flex-1 h-auto flex-col" onClick={() => openFileManager('pdf')}>
                                <Library className="w-6 h-6 mx-auto mb-2" />
                                <p className="font-semibold text-sm">Pilih dari Galeri</p>
                             </Button>
                        </div>
                    </div>
              </CardContent>
          </Card>

      </div>

      <div className="flex justify-end gap-2 py-8 mt-4">
          <Button onClick={handleSaveChanges} disabled={isSaving || isLoading}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Simpan Perubahan
          </Button>
      </div>
    </main>
    </>
  );
}
