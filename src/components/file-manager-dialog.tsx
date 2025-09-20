
'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { FileVideo, ImageIcon, Upload, Music, File as FileIcon } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { uploadFileToNeo } from '@/lib/neo-storage';
import { Progress } from '@/components/ui/progress';

interface UploadedFile {
  key: string;
  url: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
}

interface UploadProgress {
  fileName: string;
  progress: number;
  error?: string;
}

interface FileManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileSelect: (file: UploadedFile) => void;
}

export default function FileManagerDialog({
  open,
  onOpenChange,
  onFileSelect,
}: FileManagerDialogProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('image');
  const [uploads, setUploads] = useState<UploadProgress[]>([]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/list-files');
      if (!response.ok) {
        throw new Error('Gagal mengambil file.');
      }
      const data = await response.json();
      setFiles(data.files);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchFiles();
      setUploads([]);
    }
  }, [open]);

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
    
    await fetchFiles();
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

  const handleSelectFile = (file: UploadedFile) => {
    onFileSelect(file);
    onOpenChange(false);
  };

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || file.type === activeTab;
    return matchesSearch && matchesTab;
  });

  const renderFilePreview = (file: UploadedFile) => {
    if (file.type === 'image') {
       return (
          <Image
              src={file.url}
              alt={file.key}
              width={200}
              height={200}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
       )
    }
    
    if (file.type === 'video') {
       return (
         <div className="w-full h-full bg-black flex items-center justify-center">
            <FileVideo className="h-10 w-10 text-muted-foreground" />
         </div>
       )
    }

    if (file.type === 'audio') {
        return (
          <div className="w-full h-full bg-muted-foreground/20 flex items-center justify-center">
             <Music className="h-10 w-10 text-muted-foreground" />
          </div>
        )
    }
    
    if (file.type === 'document') {
        return (
          <div className="w-full h-full bg-blue-100 flex items-center justify-center">
             <FileIcon className="h-10 w-10 text-blue-500" />
          </div>
        )
    }


    return (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <ImageIcon className="h-10 w-10 text-muted-foreground" />
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Pilih dari Galeri</DialogTitle>
          <DialogDescription>
            Pilih file yang ada atau unggah yang baru.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-shrink-0">
          <div {...getRootProps()} className={`w-full p-4 mb-4 border-2 border-dashed rounded-lg cursor-pointer text-center bg-muted/50 hover:bg-muted transition-colors ${isDragActive ? 'border-primary' : ''}`}>
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center">
                <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                <p className="text-sm font-semibold">Seret & lepas atau klik untuk mengunggah</p>
            </div>
          </div>
          
          {uploads.length > 0 && (
            <div className="space-y-2 mb-4">
                {uploads.map(upload => (
                    <div key={upload.fileName}>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">{upload.fileName}</span>
                            {upload.error ? <span className="text-xs text-destructive">Gagal</span> : <span className="text-xs text-muted-foreground">{Math.round(upload.progress)}%</span>}
                        </div>
                        <Progress value={upload.progress} className={`h-1 ${upload.error ? '[&>div]:bg-destructive' : ''}`} />
                    </div>
                ))}
            </div>
          )}
        </div>
        
        <div className="flex-shrink-0 flex items-center justify-between flex-wrap gap-4 sticky top-0 bg-background pt-2 pb-4 z-10 border-b -mx-6 px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">Semua</TabsTrigger>
              <TabsTrigger value="image">Gambar</TabsTrigger>
              <TabsTrigger value="video">Video</TabsTrigger>
              <TabsTrigger value="audio">Audio</TabsTrigger>
              <TabsTrigger value="document">Dokumen</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative flex-grow max-w-sm">
            <Input
              placeholder="Cari file..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-grow overflow-y-auto -mx-6 px-6 pt-4">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-square w-full rounded-md" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredFiles.map((file) => (
                <div
                  key={file.key}
                  className="group relative cursor-pointer"
                  onClick={() => handleSelectFile(file)}
                >
                  <div className="aspect-square w-full overflow-hidden rounded-lg bg-muted shadow-md">
                     {renderFilePreview(file)}
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button size="sm">Pilih</Button>
                     </div>
                  </div>
                  <div className="mt-2 text-xs truncate text-muted-foreground">
                    {file.key.replace('uploads/', '')}
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && filteredFiles.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Tidak ada file yang cocok dengan kriteria Anda.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
