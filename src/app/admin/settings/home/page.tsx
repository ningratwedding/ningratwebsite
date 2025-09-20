
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useCallback, useContext } from "react";
import { Loader2, Upload, Trash2, Video, FileImage, Library } from "lucide-react";
import { useDropzone } from 'react-dropzone';
import { getHomeSettings, saveHomeSettings } from "@/lib/actions";
import { uploadFileToNeo } from "@/lib/neo-storage";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AdminTitleContext } from "@/contexts/AdminTitleContext";
import FileManagerDialog from "@/components/file-manager-dialog";

interface HeroMedia {
    url: string;
    type: string;
}

type MediaFile = File & { preview: string };

export default function AdminHomeSettingsPage() {
  const { toast } = useToast();
  const [heroMedia, setHeroMedia] = useState<HeroMedia[]>([]);
  const [filesToUpload, setFilesToUpload] = useState<MediaFile[]>([]);
  
  const [introHeadline, setIntroHeadline] = useState("");
  const [introParagraph1, setIntroParagraph1] = useState("");
  const [introParagraph2, setIntroParagraph2] = useState("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { setPageTitle } = useContext(AdminTitleContext)!;
  const [isFileManagerOpen, setIsFileManagerOpen] = useState(false);


  useEffect(() => {
    setPageTitle('Beranda');
  }, [setPageTitle]);


  useEffect(() => {
    async function fetchSettings() {
        setIsLoading(true);
        const currentSettings = await getHomeSettings();
        if (currentSettings) {
            setHeroMedia(currentSettings.heroMedia || []);
            setIntroHeadline(currentSettings.introHeadline || "");
            setIntroParagraph1(currentSettings.introParagraph1 || "");
            setIntroParagraph2(currentSettings.introParagraph2 || "");
        }
        setIsLoading(false);
    }
    fetchSettings();
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const mediaFiles = acceptedFiles.map(file => Object.assign(file, {
        preview: URL.createObjectURL(file)
    }));
    setFilesToUpload(prev => [...prev, ...mediaFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'video/*': [],
    },
  });

  const removeExistingMedia = (url: string) => {
    setHeroMedia(prev => prev.filter(media => media.url !== url));
  };

  const removeNewFile = (previewUrl: string) => {
    setFilesToUpload(prev => {
        const fileToRemove = prev.find(f => f.preview === previewUrl);
        if (fileToRemove) {
            URL.revokeObjectURL(fileToRemove.preview);
        }
        return prev.filter(f => f.preview !== previewUrl);
    });
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    toast({ title: "Menyimpan Perubahan..." });

    try {
        let finalMediaList = [...heroMedia];

        if (filesToUpload.length > 0) {
            toast({ title: "Mengunggah media baru...", description: `0/${filesToUpload.length} terunggah.` });
            
            const uploadPromises = filesToUpload.map(async (file, index) => {
                const url = await uploadFileToNeo(file);
                toast({ title: "Mengunggah media baru...", description: `${index + 1}/${filesToUpload.length} terunggah.` });
                return { url, type: file.type.startsWith('video') ? 'video' : 'image' };
            });

            const newMediaUrls = await Promise.all(uploadPromises);
            finalMediaList = [...finalMediaList, ...newMediaUrls];
        }

        const result = await saveHomeSettings({ 
            heroMedia: finalMediaList,
            introHeadline,
            introParagraph1,
            introParagraph2,
        });

        if (result.success) {
            toast({
                title: "Pengaturan Disimpan",
                description: "Pengaturan halaman beranda Anda telah diperbarui.",
            });
            setHeroMedia(finalMediaList);
            setFilesToUpload([]);
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
  
  const handleFileSelect = (file: { url: string; type: string }) => {
    setHeroMedia(prev => [...prev, { url: file.url, type: file.type }]);
  };

  const MediaPreview = ({ media, onRemove, isNew = false }: { media: { url: string; type: string } | { preview: string, type: string }, onRemove: (url: string) => void, isNew?: boolean }) => {
    const url = isNew ? (media as { preview: string }).preview : (media as HeroMedia).url;
    const type = media.type.startsWith('video') ? 'video' : 'image';

    return (
        <div className="relative group aspect-video w-full rounded-lg overflow-hidden border">
            {type === 'video' ? (
                <video src={url} className="w-full h-full object-cover" muted loop playsInline />
            ) : (
                <Image src={url} alt="Pratinjau Hero" fill className="object-cover" />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <Button variant="destructive" size="icon" onClick={() => onRemove(url)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
            <div className="absolute top-2 left-2 bg-black/50 text-white rounded-full p-1.5">
                {type === 'video' ? <Video className="h-4 w-4" /> : <FileImage className="h-4 w-4" />}
            </div>
        </div>
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
                  <CardTitle>Bagian Hero</CardTitle>
                  <CardDescription>Kelola gambar dan video di carousel hero halaman beranda Anda.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                    <div className="flex gap-2">
                        <div {...getRootProps()} className={`flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80 transition-colors ${isDragActive ? 'border-primary' : ''}`}>
                            <input {...getInputProps()} />
                            <div className="text-center text-muted-foreground">
                                <Upload className="w-8 h-8 mx-auto mb-2" />
                                <p className="font-semibold">Unggahan Baru</p>
                                <p className="text-xs mt-1">Seret & lepas file di sini</p>
                            </div>
                        </div>
                        <Button variant="outline" className="w-full flex-col h-auto p-6" onClick={() => setIsFileManagerOpen(true)}>
                             <Library className="w-8 h-8 mx-auto mb-2" />
                             <p className="font-semibold">Pilih Dari Galeri</p>
                        </Button>
                    </div>


                    {(heroMedia.length > 0 || filesToUpload.length > 0) && (
                        <div className="space-y-4 pt-6">
                            <h3 className="text-sm font-medium text-muted-foreground">Antrian Media</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {heroMedia.map((media) => (
                                    <MediaPreview key={media.url} media={media} onRemove={removeExistingMedia} />
                                ))}
                                {filesToUpload.map((file) => (
                                    <MediaPreview key={file.preview} media={{preview: file.preview, type: file.type}} onRemove={removeNewFile} isNew={true} />
                                ))}
                            </div>
                        </div>
                    )}
              </CardContent>
          </Card>

          <Card>
              <CardHeader>
                  <CardTitle>Bagian Intro</CardTitle>
                  <CardDescription>Kelola teks pengantar di bawah hero.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                   <div className="space-y-2">
                       <Label htmlFor="introHeadline">Judul</Label>
                       <Input id="introHeadline" value={introHeadline} onChange={(e) => setIntroHeadline(e.target.value)} placeholder="Hai, Anda menemukan kami!" disabled={isSaving} />
                   </div>
                    <div className="space-y-2">
                       <Label htmlFor="introParagraph1">Paragraf 1</Label>
                       <Textarea id="introParagraph1" value={introParagraph1} onChange={(e) => setIntroParagraph1(e.target.value)} placeholder="Selamat datang. Kami melihat cinta sebagai sebuah mahakarya..." disabled={isSaving} />
                   </div>
                    <div className="space-y-2">
                       <Label htmlFor="introParagraph2">Paragraf 2</Label>
                       <Textarea id="introParagraph2" value={introParagraph2} onChange={(e) => setIntroParagraph2(e.target.value)} placeholder="Kami mengabadikan momen nyata tanpa naskah..." disabled={isSaving} />
                   </div>
              </CardContent>
          </Card>

           <Card>
              <CardHeader>
                  <CardTitle>Bagian Ajakan Bertindak (CTA)</CardTitle>
                  <CardDescription>Kelola bagian CTA besar di bagian bawah halaman.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                  <p className="text-muted-foreground">Pengaturan bagian CTA akan segera tersedia di sini.</p>
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
