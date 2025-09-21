
"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2, Trash2, ArrowUp, ArrowDown, Library } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { uploadFileToNeo } from "@/lib/neo-storage";
import { saveBlogPost } from "@/lib/actions";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { app } from "@/lib/firebase";
import { v4 as uuidv4 } from 'uuid';
import { AdminTitleContext } from "@/contexts/AdminTitleContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import FileManagerDialog from "@/components/file-manager-dialog";
import Image from "next/image";

type BlockType = 'text' | 'h1' | 'h2' | 'title_and_paragraph' | 'image_full' | 'image_split' | 'image_tri';

interface ContentBlock {
  id: string;
  type: BlockType;
  content: any; // string | (File | string)[] | { title: string; paragraph: string }
}

const blogPostSchema = z.object({
  title: z.string().min(3, "Judul harus terdiri dari minimal 3 karakter."),
  author: z.string().min(3, "Nama penulis harus terdiri dari minimal 3 karakter."),
  excerpt: z.string().min(10, "Kutipan harus terdiri dari minimal 10 karakter.").max(200, "Kutipan tidak boleh lebih dari 200 karakter.").optional(),
});

const BlockRenderer = ({ block, index, updateBlockContent, removeContentBlock, moveBlock, isProcessing, contentBlocks, openFileManager }: { 
    block: ContentBlock;
    index: number;
    updateBlockContent: (id: string, content: any) => void;
    removeContentBlock: (id: string) => void;
    moveBlock: (index: number, direction: 'up' | 'down') => void;
    isProcessing: boolean;
    contentBlocks: ContentBlock[];
    openFileManager: (blockId: string, maxFiles: number) => void;
}) => {
    const fileCount = block.type === 'image_full' ? 1 : block.type === 'image_split' ? 2 : 3;

    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        blockId: string,
        maxFiles: number
      ) => {
        if (e.target.files) {
          const newFiles = Array.from(e.target.files).slice(0, maxFiles);
          const existingFiles = Array.isArray(block.content) 
            ? block.content.filter(item => item instanceof File)
            : [];
          const combinedFiles = [...existingFiles, ...newFiles].slice(0, maxFiles);
          updateBlockContent(blockId, combinedFiles);
        }
      };
      
    const getPreviewUrl = (content: string | File): string => {
        return typeof content === 'string' ? content : URL.createObjectURL(content);
    }

    return (
      <Card key={block.id} className="relative group">
        <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
             <Button type="button" size="icon" variant="ghost" className="h-8 w-8" disabled={index === 0} onClick={() => moveBlock(index, 'up')}><ArrowUp className="h-4 w-4" /></Button>
             <Button type="button" size="icon" variant="ghost" className="h-8 w-8" disabled={index === contentBlocks.length - 1} onClick={() => moveBlock(index, 'down')}><ArrowDown className="h-4 w-4" /></Button>
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" size="icon" variant="destructive" className="h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tindakan ini tidak bisa dibatalkan. Ini akan menghapus blok konten ini secara permanen.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={() => removeContentBlock(block.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Hapus</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
        <CardHeader>
          <CardTitle className="capitalize">
            {block.type.replace(/_/g, ' ').replace('h1', 'Judul H1').replace('h2', 'Judul H2')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {block.type === 'text' ? (
            <Textarea 
              placeholder="Ceritakan kisah Anda..."
              className="min-h-[150px]"
              value={block.content as string}
              onChange={(e) => updateBlockContent(block.id, e.target.value)}
              disabled={isProcessing}
            />
          ) : block.type === 'h1' ? (
             <Input 
              placeholder="Judul H1..."
              value={block.content as string}
              onChange={(e) => updateBlockContent(block.id, e.target.value)}
              disabled={isProcessing}
              className="text-2xl font-bold"
            />
           ) : block.type === 'h2' ? (
             <Input 
              placeholder="Judul H2..."
              value={block.content as string}
              onChange={(e) => updateBlockContent(block.id, e.target.value)}
              disabled={isProcessing}
              className="text-xl font-semibold"
            />
           ) : block.type === 'title_and_paragraph' ? (
            <div className="space-y-4">
              <Input
                placeholder="Judul..."
                value={block.content.title}
                onChange={(e) => updateBlockContent(block.id, { ...block.content, title: e.target.value })}
                disabled={isProcessing}
                className="text-xl font-semibold"
              />
              <Textarea
                placeholder="Paragraf..."
                className="min-h-[120px]"
                value={block.content.paragraph}
                onChange={(e) => updateBlockContent(block.id, { ...block.content, paragraph: e.target.value })}
                disabled={isProcessing}
              />
            </div>
          ) : (
            <div className="space-y-4">
                 <div className="flex gap-2">
                    <label htmlFor={`file-upload-${block.id}`} className={`flex-1 flex flex-col items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted ${isProcessing ? 'cursor-not-allowed' : ''}`}>
                        <div className="flex flex-col items-center justify-center">
                            <Upload className="w-6 h-6 mb-2 text-muted-foreground" />
                            <p className="text-sm font-semibold">Unggahan Baru</p>
                        </div>
                        <input id={`file-upload-${block.id}`} type="file" className="hidden" multiple={fileCount > 1} accept="image/*" onChange={(e) => handleFileChange(e, block.id, fileCount)} disabled={isProcessing} />
                    </label>
                    <Button type="button" variant="outline" className="flex-1 h-auto flex-col" onClick={() => openFileManager(block.id, fileCount)}>
                        <Library className="w-6 h-6 mb-2" />
                        <p className="text-sm font-semibold">Pilih dari Galeri</p>
                    </Button>
                </div>
                 {(block.content as (File | string)[]).length > 0 && (
                  <div className={`grid grid-cols-${fileCount} gap-2`}>
                    {(block.content as (File | string)[]).map((item, i) => (
                      <div key={i} className="relative aspect-square">
                        <Image src={getPreviewUrl(item)} alt={`preview ${i}`} fill className="object-cover rounded-md" />
                      </div>
                    ))}
                  </div>
                )}
                 <p className="text-xs text-muted-foreground">Unggah atau pilih hingga {fileCount} gambar.</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
};

export default function NewBlogPostPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [heroImage, setHeroImage] = useState<File | null>(null);
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { setPageTitle } = useContext(AdminTitleContext)!;

  const [isFileManagerOpen, setIsFileManagerOpen] = useState(false);
  const [selectionTarget, setSelectionTarget] = useState<{ blockId: string, maxFiles: number } | 'hero' | null>(null);

  useEffect(() => {
    setPageTitle('Buat Postingan Blog Baru');
  }, [setPageTitle]);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        form.setValue('author', user.displayName || user.email || 'Admin');
        setLoading(false);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const form = useForm<z.infer<typeof blogPostSchema>>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: "",
      author: "",
      excerpt: "",
    },
  });

  const addContentBlock = (type: BlockType) => {
    let newBlock: ContentBlock;
    if (type === 'title_and_paragraph') {
      newBlock = { id: uuidv4(), type, content: { title: '', paragraph: '' } };
    } else {
      newBlock = {
        id: uuidv4(),
        type,
        content: (type === 'text' || type === 'h1' || type === 'h2') ? '' : [],
      };
    }
    setContentBlocks((prev) => [...prev, newBlock]);
  };
  
  const updateBlockContent = (id: string, newContent: any) => {
    setContentBlocks((prev) => 
      prev.map((block) => (block.id === id ? { ...block, content: newContent } : block))
    );
  };
  
  const removeContentBlock = (id: string) => {
    setContentBlocks((prev) => prev.filter(block => block.id !== id));
  };
  
  const moveBlock = (index: number, direction: 'up' | 'down') => {
      setContentBlocks(prev => {
          const newBlocks = [...prev];
          const newIndex = direction === 'up' ? index - 1 : index + 1;
          if (newIndex < 0 || newIndex >= newBlocks.length) return newBlocks;
          const temp = newBlocks[index];
          newBlocks[index] = newBlocks[newIndex];
          newBlocks[newIndex] = temp;
          return newBlocks;
      });
  };

  const handleHeroFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setHeroImage(e.target.files[0]);
          setHeroImageUrl(null);
      }
  }

  const openFileManager = (target: 'hero' | { blockId: string, maxFiles: number }) => {
    setSelectionTarget(target);
    setIsFileManagerOpen(true);
  };

  const handleFileSelect = (file: { url: string; type: string }) => {
    if (!selectionTarget) return;

    if (selectionTarget === 'hero') {
      setHeroImageUrl(file.url);
      setHeroImage(null);
    } else if (typeof selectionTarget === 'object' && 'blockId' in selectionTarget) {
      const { blockId, maxFiles } = selectionTarget;
      setContentBlocks(prev =>
        prev.map(block => {
          if (block.id === blockId) {
            const currentContent = Array.isArray(block.content) ? block.content : [];
            const newContent = [...currentContent, file.url].slice(0, maxFiles);
            return { ...block, content: newContent };
          }
          return block;
        })
      );
    }
  };

  const onSubmit = async (values: z.infer<typeof blogPostSchema>) => {
    if (!heroImage && !heroImageUrl) {
        toast({ title: "Gambar Hero Diperlukan", description: "Silakan unggah gambar hero.", variant: "destructive"});
        return;
    }
    
    setIsProcessing(true);
    toast({ title: "Memproses Postingan Blog...", description: "Harap tunggu, ini mungkin memakan waktu sejenak." });

    try {
      let finalHeroImageUrl = heroImageUrl;
      if (heroImage) {
        toast({ title: "Mengunggah Gambar Hero..." });
        finalHeroImageUrl = await uploadFileToNeo(heroImage);
      }
      
      const processedContentBlocks = await Promise.all(contentBlocks.map(async (block, index) => {
        if (block.type === 'text' || block.type === 'h1' || block.type === 'h2' || block.type === 'title_and_paragraph') {
          return { id: block.id, type: block.type, content: block.content };
        } else {
           toast({ title: `Memproses Blok ${index + 1}`, description: `Mengunggah gambar...` });
           const uploadedUrls = await Promise.all(
             (block.content as (File | string)[]).map(item => {
                if (typeof item === 'string') return item;
                return uploadFileToNeo(item);
             })
           );
           return { id: block.id, type: block.type, content: uploadedUrls };
        }
      }));

      toast({ title: "Finalisasi...", description: "Menyimpan postingan blog lengkap ke database." });
      const result = await saveBlogPost({
        ...values,
        excerpt: values.excerpt || '',
        heroImageUrl: finalHeroImageUrl,
        contentBlocks: processedContentBlocks,
      });

      if (result.success) {
        toast({ title: "Postingan Blog Dibuat!", description: "Postingan blog baru Anda telah berhasil dibuat." });
        router.push("/admin/blog");
      } else {
        throw new Error(result.message || "Gagal menyimpan postingan blog.");
      }

    } catch (error: any) {
      console.error("Gagal membuat postingan blog:", error);
      toast({ title: "Operasi Gagal", description: error.message || "Terjadi kesalahan. Silakan periksa konsol.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6"></main>;
  }

  const currentHeroImageUrl = heroImage ? URL.createObjectURL(heroImage) : heroImageUrl;

  return (
    <>
    <FileManagerDialog 
      open={isFileManagerOpen}
      onOpenChange={setIsFileManagerOpen}
      onFileSelect={handleFileSelect}
    />
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Detail Postingan Blog</CardTitle>
                  <CardDescription>Isi detail utama untuk postingan blog baru Anda.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Judul</FormLabel><FormControl><Input placeholder="Judul yang menarik" {...field} disabled={isProcessing} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="author" render={({ field }) => (
                    <FormItem><FormLabel>Penulis</FormLabel><FormControl><Input {...field} disabled={isProcessing} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="excerpt" render={({ field }) => (
                    <FormItem><FormLabel>Kutipan</FormLabel><FormControl><Textarea placeholder="Ringkasan singkat dari postingan blog..." {...field} disabled={isProcessing} /></FormControl><FormMessage /></FormItem>
                  )} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                    <CardTitle>Pembangun Konten</CardTitle>
                    <CardDescription>Tambah dan atur blok konten untuk membangun halaman postingan blog Anda.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {contentBlocks.map((block, index) => <BlockRenderer 
                        key={block.id} 
                        block={block} 
                        index={index} 
                        updateBlockContent={updateBlockContent}
                        removeContentBlock={removeContentBlock}
                        moveBlock={moveBlock}
                        isProcessing={isProcessing}
                        contentBlocks={contentBlocks}
                        openFileManager={(id, max) => openFileManager({blockId: id, maxFiles: max})}
                    />)}
                    
                    <Select onValueChange={(value) => addContentBlock(value as BlockType)} disabled={isProcessing}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Tambahkan blok konten baru..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Blok Teks</SelectItem>
                        <SelectItem value="h1">Judul Teks H1</SelectItem>
                        <SelectItem value="h2">Judul Teks H2</SelectItem>
                        <SelectItem value="title_and_paragraph">Judul &amp; Paragraf</SelectItem>
                        <SelectItem value="image_full">Gambar Lebar Penuh</SelectItem>
                        <SelectItem value="image_split">Gambar 2 Kolom</SelectItem>
                        <SelectItem value="image_tri">Gambar 3 Kolom</SelectItem>
                      </SelectContent>
                    </Select>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              <Card>
                <CardHeader><CardTitle>Gambar Hero</CardTitle><CardDescription>Gambar utama untuk postingan blog Anda.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className={`aspect-video w-full rounded-lg border-2 border-dashed bg-muted flex items-center justify-center ${isProcessing ? 'cursor-not-allowed' : ''}`}>
                    {currentHeroImageUrl ? (<Image src={currentHeroImageUrl} alt="hero preview" width={400} height={225} className="object-cover w-full h-full rounded-lg" />) : (
                      <div className="text-center text-muted-foreground p-4">
                          <Upload className="w-8 h-8 mb-3 mx-auto" />
                          <p className="mb-2 text-sm font-semibold">Tidak Ada Gambar</p>
                          <p className="text-xs">Rasio 16:9 disarankan</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <label htmlFor="hero-upload" className="flex-1 cursor-pointer">
                        <Button type="button" variant="outline" className="w-full" asChild>
                            <span>
                                <Upload className="mr-2 h-4 w-4" />
                                Unggahan Baru
                            </span>
                        </Button>
                        <input id="hero-upload" type="file" className="hidden" accept="image/*" onChange={handleHeroFileChange} disabled={isProcessing} />
                    </label>
                    <Button type="button" variant="secondary" className="flex-1" onClick={() => openFileManager('hero')} disabled={isProcessing}>
                        <Library className="mr-2 h-4 w-4" />
                        Galeri
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end gap-2 pb-8">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/blog')} disabled={isProcessing}>Batal</Button>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Postingan Blog
            </Button>
          </div>
        </form>
      </Form>
    </main>
    </>
  );
}
