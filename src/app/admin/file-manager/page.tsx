
"use client";

import { useEffect, useState, useContext, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Copy, Check, Trash2, Loader2, HardDrive, FileVideo, ImageIcon, Upload, Music, File as FileIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
} from "@/components/ui/alert-dialog"
import { AdminTitleContext } from "@/contexts/AdminTitleContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDropzone } from "react-dropzone";
import { uploadFileToNeo } from "@/lib/neo-storage";

interface UploadedFile {
  key: string;
  url: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
}

interface StorageUsage {
  totalUsage: number;
  quota: number;
}

interface UploadProgress {
  fileName: string;
  progress: number; // 0-100
  error?: string;
}


export default function FileManagerPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  
  const { toast } = useToast();
  const { setPageTitle } = useContext(AdminTitleContext)!;

  useEffect(() => {
    setPageTitle('Pengelola File');
  }, [setPageTitle]);

  const fetchFilesAndUsage = async () => {
    setLoading(true);
    try {
      const [filesResponse, usageResponse] = await Promise.all([
        fetch("/api/list-files"),
        fetch("/api/storage-usage")
      ]);

      if (!filesResponse.ok) {
        throw new Error("Gagal mengambil file dari bucket.");
      }
      const filesData = await filesResponse.json();
      setFiles(filesData.files);
      
      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        setStorageUsage(usageData);
      } else {
        console.warn("Tidak dapat mengambil penggunaan penyimpanan.");
      }

    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "Tidak dapat memuat file.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newUploads = acceptedFiles.map(file => ({
      fileName: file.name,
      progress: 0,
    }));
    setUploads(prev => [...newUploads, ...prev]);

    for (const file of acceptedFiles) {
        try {
            setUploads(prev => prev.map(u => u.fileName === file.name ? { ...u, progress: 50 } : u));
            
            await uploadFileToNeo(file);
            
            setUploads(prev => prev.map(u => u.fileName === file.name ? { ...u, progress: 100 } : u));
            
            setTimeout(() => {
                setUploads(prev => prev.filter(u => u.fileName !== file.name));
            }, 2000);

        } catch (error: any) {
            setUploads(prev => prev.map(u => u.fileName === file.name ? { ...u, progress: 100, error: error.message } : u));
             toast({
                title: `Unggah Gagal: ${file.name}`,
                description: error.message,
                variant: 'destructive'
            });
        }
    }
    
    await fetchFilesAndUsage();
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
        'image/*': [], 
        'video/*': [], 
        'audio/*': [],
        'application/pdf': ['.pdf']
    },
  });


  useEffect(() => {
    fetchFilesAndUsage();
  }, []);
  
  const refreshData = () => {
    fetchFilesAndUsage();
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast({
        title: "Tersalin!",
        description: "URL file disalin ke papan klip.",
    });
    setTimeout(() => setCopiedUrl(null), 2000);
  };
  
  const handleDelete = async (fileKey: string) => {
    setIsDeleting(fileKey);
    try {
        const response = await fetch('/api/delete-file', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: fileKey }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Gagal menghapus file.');
        }

        toast({
            title: 'File Dihapus',
            description: 'File telah berhasil dihapus dari penyimpanan.',
        });
        
        refreshData();

    } catch (error: any) {
        console.error("Gagal menghapus file:", error);
        toast({
            title: 'Penghapusan Gagal',
            description: error.message,
            variant: 'destructive',
        });
    } finally {
        setIsDeleting(null);
    }
  };

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || file.type === activeTab;
    return matchesSearch && matchesTab;
  });
  
  const formatBytes = (bytes: number, decimals = 2) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
  
  const usagePercentage = storageUsage ? (storageUsage.totalUsage / storageUsage.quota) * 100 : 0;
  
  const renderFilePreview = (file: UploadedFile) => {
    if (file.type === 'image') {
       return (
          <Image
              src={file.url}
              alt={file.key}
              width={200}
              height={200}
              className="h-auto w-full object-contain transition-transform group-hover:scale-105"
            />
       )
    }
    
    if (file.type === 'video') {
       return (
         <div className="w-full h-full bg-black flex items-center justify-center aspect-square">
            <FileVideo className="h-10 w-10 text-muted-foreground" />
         </div>
       )
    }
    
    if (file.type === 'audio') {
        return (
          <div className="w-full h-full bg-muted-foreground/20 flex items-center justify-center aspect-square">
             <Music className="h-10 w-10 text-muted-foreground" />
          </div>
        )
     }
     
    if (file.type === 'document') {
        return (
          <div className="w-full h-full bg-blue-100 flex items-center justify-center aspect-square">
             <FileIcon className="h-10 w-10 text-blue-500" />
          </div>
        )
    }

    return (
      <div className="w-full h-full bg-muted flex items-center justify-center aspect-square">
        <ImageIcon className="h-10 w-10 text-muted-foreground" />
      </div>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div {...getRootProps()} className={`w-full p-6 border-2 border-dashed rounded-lg cursor-pointer text-center bg-muted/50 hover:bg-muted transition-colors ${isDragActive ? 'border-primary' : ''}`}>
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center">
            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="font-semibold">Seret & lepas file di sini, atau klik untuk memilih file</p>
            <p className="text-sm text-muted-foreground mt-1">Gambar, video, audio, dan PDF didukung.</p>
        </div>
      </div>
      
       {uploads.length > 0 && (
         <Card>
            <CardHeader className="pb-4">
                <CardTitle>Unggahan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {uploads.map(upload => (
                    <div key={upload.fileName}>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-muted-foreground truncate max-w-xs">{upload.fileName}</span>
                            {upload.error ? <span className="text-xs text-destructive">Gagal</span> : <span className="text-xs text-muted-foreground">{Math.round(upload.progress)}%</span>}
                        </div>
                        <Progress value={upload.progress} className={`h-1 ${upload.error ? '[&>div]:bg-destructive' : ''}`} />
                    </div>
                ))}
            </CardContent>
        </Card>
      )}


       {storageUsage && storageUsage.quota > 0 && (
         <Card>
            <CardHeader className="pb-4">
                <CardTitle>Ikhtisar Penyimpanan</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <Progress value={usagePercentage} className="w-full h-2" />
                    <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
                       <div>
                           {formatBytes(storageUsage.totalUsage)} dari {formatBytes(storageUsage.quota)} terpakai
                       </div>
                       <div>
                           Tersisa: <span className="font-medium text-foreground">{formatBytes(storageUsage.quota - storageUsage.totalUsage)}</span>
                       </div>
                    </div>
                </div>
            </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>File yang Diunggah</CardTitle>
          <CardDescription>Jelajahi dan kelola file di bucket penyimpanan Anda.</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex items-center justify-between flex-wrap gap-4">
                     <TabsList>
                        <TabsTrigger value="all">Semua</TabsTrigger>
                        <TabsTrigger value="image">Gambar</TabsTrigger>
                        <TabsTrigger value="video">Video</TabsTrigger>
                        <TabsTrigger value="audio">Audio</TabsTrigger>
                        <TabsTrigger value="document">Dokumen</TabsTrigger>
                      </TabsList>
                     <div className="relative flex-grow max-w-sm">
                         <Input
                            placeholder="Cari file..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                     </div>
                </div>
               
                <div className="mt-6">
                  {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                      {[...Array(16)].map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="aspect-square w-full rounded-md" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-6 space-y-6">
                      {filteredFiles.map((file) => (
                        <div key={file.key} className="break-inside-avoid group relative">
                          <div className="w-full overflow-hidden rounded-lg bg-muted shadow-md flex items-center justify-center">
                            {renderFilePreview(file)}
                          </div>
                          <div className="mt-2 text-xs truncate text-muted-foreground">{file.key.replace('uploads/', '')}</div>
                          
                          <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-8 w-8"
                              onClick={() => handleCopy(file.url)}
                              disabled={!!isDeleting}
                            >
                              {copiedUrl === file.url ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              <span className="sr-only">Salin URL</span>
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                 <Button
                                  size="icon"
                                  variant="destructive"
                                  className="h-8 w-8"
                                  disabled={!!isDeleting}
                                >
                                  {isDeleting === file.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                  <span className="sr-only">Hapus File</span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tindakan ini tidak bisa dibatalkan. Ini akan menghapus file secara permanen
                                    <span className="font-semibold break-all"> {file.key.replace('uploads/', '')} </span> 
                                     dari bucket penyimpanan.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(file.key)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                    Lanjutkan
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                   {(!loading && filteredFiles.length === 0) && (
                      <div className="text-center py-12 text-muted-foreground">
                        Tidak ada file yang cocok dengan kriteria Anda.
                      </div>
                    )}
                </div>
            </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}
