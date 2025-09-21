
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useContext, useCallback } from "react";
import { Loader2, Trash2, PlusCircle, ArrowUp, ArrowDown, Upload, Library, Image as ImageIcon } from "lucide-react";
import { getServicesSettings, saveServicesSettings } from "@/lib/actions";
import { AdminTitleContext } from "@/contexts/AdminTitleContext";
import { v4 as uuidv4 } from 'uuid';
import { Skeleton } from "@/components/ui/skeleton";
import FileManagerDialog from "@/components/file-manager-dialog";
import Image from "next/image";
import { useDropzone } from 'react-dropzone';


interface CapturedMoment {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
}

interface PackageFeature {
    id: string;
    text: string;
}

interface ServicePackage {
  id: string;
  name: string;
  price: string;
  features: PackageFeature[];
  highlight: boolean;
}

interface ServicesSettings {
  heroImageUrl?: string;
  tagline: string;
  momentsTitle: string;
  momentsDescription: string;
  capturedMoments: CapturedMoment[];
  packagesTitle: string;
  packagesDescription: string;
  packages: ServicePackage[];
}

type MediaFile = File & { preview: string };

const defaultSettings: ServicesSettings = {
    tagline: 'Menceritakan Kisah Tanpa Kata-kata',
    momentsTitle: 'Momen yang Diabadikan',
    momentsDescription: 'Kami fokus menangkap esensi dari setiap momen berharga untuk menceritakan kisah Anda secara utuh.',
    capturedMoments: [],
    packagesTitle: 'Paket Foto',
    packagesDescription: 'Pilih paket yang paling sesuai dengan kebutuhan hari istimewa Anda.',
    packages: [],
};

export default function AdminServicesSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<ServicesSettings>(defaultSettings);
  const [heroImageFile, setHeroImageFile] = useState<MediaFile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { setPageTitle } = useContext(AdminTitleContext)!;
  const [isFileManagerOpen, setIsFileManagerOpen] = useState(false);
  const [selectionTarget, setSelectionTarget] = useState<'hero' | { momentId: string } | null>(null);

  useEffect(() => {
    setPageTitle('Layanan');
  }, [setPageTitle]);

  useEffect(() => {
    async function fetchSettings() {
      setIsLoading(true);
      const currentSettings = await getServicesSettings();
      if (currentSettings) {
        const momentsWithIds = currentSettings.capturedMoments?.map(m => ({ ...m, id: m.id || uuidv4() })) || [];
        const packagesWithIds = currentSettings.packages?.map(p => ({
             ...p,
             id: p.id || uuidv4(),
             features: p.features.map(f => (typeof f === 'string' ? { id: uuidv4(), text: f } : { ...f, id: f.id || uuidv4() }))
        })) || [];
        setSettings({ ...defaultSettings, ...currentSettings, capturedMoments: momentsWithIds, packages: packagesWithIds });
      } else {
        setSettings(defaultSettings);
      }
      setIsLoading(false);
    }
    fetchSettings();
  }, []);

  const onDropHeroImage = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setHeroImageFile(Object.assign(file, {
          preview: URL.createObjectURL(file)
      }));
    }
  }, []);

  const { getRootProps: getHeroRootProps, getInputProps: getHeroInputProps, isDragActive: isHeroDragActive } = useDropzone({
    onDrop: onDropHeroImage,
    accept: { 'image/*': [] },
    multiple: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    toast({ title: "Menyimpan perubahan..." });

    try {
      
      let finalHeroImageUrl = settings.heroImageUrl;
      if (heroImageFile) {
          finalHeroImageUrl = await (async () => {
              toast({ title: "Mengunggah gambar hero..." });
              return await import('@/lib/neo-storage').then(mod => mod.uploadFileToNeo(heroImageFile));
          })();
      }

      const settingsToSave = {
        ...settings,
        heroImageUrl: finalHeroImageUrl,
        packages: settings.packages.map(p => ({
          ...p,
          features: p.features.map(f => f.text)
        }))
      };

      const result = await saveServicesSettings(settingsToSave);

      if (result.success) {
        toast({
          title: "Pengaturan Disimpan",
          description: "Pengaturan halaman layanan Anda telah diperbarui.",
        });
        setSettings(prev => ({...prev, heroImageUrl: finalHeroImageUrl}));
        setHeroImageFile(null);
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

  const handleMomentChange = (id: string, field: 'title' | 'description' | 'imageUrl', value: string) => {
    setSettings(prev => ({
      ...prev,
      capturedMoments: prev.capturedMoments.map(m => m.id === id ? { ...m, [field]: value } : m)
    }));
  };
  
  const addMoment = () => {
    setSettings(prev => ({
        ...prev,
        capturedMoments: [...prev.capturedMoments, { id: uuidv4(), title: 'Momen Baru', description: 'Deskripsi baru', imageUrl: ''}]
    }))
  };

  const removeMoment = (id: string) => {
    setSettings(prev => ({
        ...prev,
        capturedMoments: prev.capturedMoments.filter(m => m.id !== id)
    }));
  };

  const openFileManager = (target: 'hero' | { momentId: string }) => {
    setSelectionTarget(target);
    setIsFileManagerOpen(true);
  };
  
  const handleFileSelect = (file: { url: string }) => {
    if (!selectionTarget) return;

    if (selectionTarget === 'hero') {
        setSettings(prev => ({ ...prev, heroImageUrl: file.url }));
        setHeroImageFile(null);
    } else if (typeof selectionTarget === 'object' && 'momentId' in selectionTarget) {
        handleMomentChange(selectionTarget.momentId, 'imageUrl', file.url);
    }
  };
  
  const moveItem = <T extends {id: string}>(list: T[], index: number, direction: 'up' | 'down'): T[] => {
    const newList = [...list];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newList.length) return newList;
    [newList[index], newList[newIndex]] = [newList[newIndex], newList[index]]; // Swap
    return newList;
  };

  const handlePackageChange = (id: string, field: keyof ServicePackage, value: any) => {
     setSettings(prev => ({
      ...prev,
      packages: prev.packages.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };
  
  const addPackage = () => {
    setSettings(prev => ({
        ...prev,
        packages: [...prev.packages, { id: uuidv4(), name: 'Paket Baru', price: 'IDR 0', features: [], highlight: false}]
    }))
  };
  
  const removePackage = (id: string) => {
     setSettings(prev => ({
        ...prev,
        packages: prev.packages.filter(p => p.id !== id)
    }));
  }
  
  const handleFeatureChange = (pkgId: string, featureId: string, value: string) => {
      setSettings(prev => ({
          ...prev,
          packages: prev.packages.map(pkg => 
              pkg.id === pkgId 
              ? { ...pkg, features: pkg.features.map(f => f.id === featureId ? { ...f, text: value} : f) }
              : pkg
          )
      }))
  };
  
  const addFeature = (pkgId: string) => {
      setSettings(prev => ({
          ...prev,
          packages: prev.packages.map(pkg => 
              pkg.id === pkgId
              ? { ...pkg, features: [...pkg.features, { id: uuidv4(), text: 'Fitur baru' }] }
              : pkg
          )
      }));
  };
  
  const removeFeature = (pkgId: string, featureId: string) => {
       setSettings(prev => ({
          ...prev,
          packages: prev.packages.map(pkg => 
              pkg.id === pkgId
              ? { ...pkg, features: pkg.features.filter(f => f.id !== featureId) }
              : pkg
          )
      }));
  }
  
  const currentHeroImage = heroImageFile?.preview || settings.heroImageUrl;

  if (isLoading) {
      return (
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <Card>
                <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2"><Skeleton className="h-5 w-20" /><Skeleton className="h-10 w-full" /></div>
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-72 w-full" />
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
                <CardTitle>Bagian Hero</CardTitle>
                <CardDescription>Kelola gambar utama dan tagline untuk halaman layanan.</CardDescription>
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
                                <Button variant="destructive" size="icon" onClick={() => { setSettings(prev => ({ ...prev, heroImageUrl: undefined })); setHeroImageFile(null); }}>
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
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input id="tagline" name="tagline" value={settings.tagline} onChange={handleInputChange} placeholder="Contoh: Menceritakan Kisah Tanpa Kata-kata" disabled={isSaving} />
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Bagian Momen yang Diabadikan</CardTitle>
                 <CardDescription>Kelola daftar momen yang Anda abadikan selama acara.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="momentsTitle">Judul Bagian</Label>
                    <Input id="momentsTitle" name="momentsTitle" value={settings.momentsTitle} onChange={handleInputChange} disabled={isSaving} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="momentsDescription">Deskripsi Bagian</Label>
                    <Textarea id="momentsDescription" name="momentsDescription" value={settings.momentsDescription} onChange={handleInputChange} disabled={isSaving} />
                </div>

                <div className="space-y-4 pt-4">
                  {settings.capturedMoments.map((moment, index) => (
                    <Card key={moment.id} className="p-4">
                        <div className="flex gap-4 flex-wrap md:flex-nowrap">
                            <div className="w-full md:w-48 flex-shrink-0">
                                <div className="relative w-full aspect-video bg-muted rounded-md flex items-center justify-center">
                                    {moment.imageUrl ? (
                                        <Image src={moment.imageUrl} alt={moment.title} fill className="object-cover rounded-md"/>
                                    ) : (
                                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <Button variant="outline" size="sm" className="w-full" onClick={() => openFileManager({ momentId: moment.id })}>
                                        <Library className="h-4 w-4 mr-2" /> Galeri
                                    </Button>
                                    <Button variant="destructive" size="icon" onClick={() => handleMomentChange(moment.id, 'imageUrl', '')}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-3 flex-grow">
                                <Input value={moment.title} onChange={(e) => handleMomentChange(moment.id, 'title', e.target.value)} disabled={isSaving} placeholder="Judul Momen" />
                                <Textarea value={moment.description} onChange={(e) => handleMomentChange(moment.id, 'description', e.target.value)} disabled={isSaving} className="text-sm" placeholder="Deskripsi Momen" />
                            </div>
                            <div className="flex flex-row md:flex-col gap-1">
                                <Button size="icon" variant="ghost" onClick={() => setSettings(prev => ({...prev, capturedMoments: moveItem(prev.capturedMoments, index, 'up')}))} disabled={isSaving || index === 0}><ArrowUp className="h-4 w-4" /></Button>
                                <Button size="icon" variant="ghost" onClick={() => setSettings(prev => ({...prev, capturedMoments: moveItem(prev.capturedMoments, index, 'down')}))} disabled={isSaving || index === settings.capturedMoments.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                                <Button size="icon" variant="destructive" onClick={() => removeMoment(moment.id)} disabled={isSaving}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </Card>
                  ))}
                  <Button variant="outline" onClick={addMoment} disabled={isSaving}><PlusCircle className="mr-2" /> Tambah Momen</Button>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Bagian Paket</CardTitle>
                <CardDescription>Kelola paket fotografi Anda.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="packagesTitle">Judul Bagian</Label>
                    <Input id="packagesTitle" name="packagesTitle" value={settings.packagesTitle} onChange={handleInputChange} disabled={isSaving} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="packagesDescription">Deskripsi Bagian</Label>
                    <Textarea id="packagesDescription" name="packagesDescription" value={settings.packagesDescription} onChange={handleInputChange} disabled={isSaving} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
                    {settings.packages.map((pkg, index) => (
                        <Card key={pkg.id} className="flex flex-col">
                           <CardHeader>
                               <Input value={pkg.name} onChange={(e) => handlePackageChange(pkg.id, 'name', e.target.value)} disabled={isSaving} className="text-xl font-bold" />
                               <Input value={pkg.price} onChange={(e) => handlePackageChange(pkg.id, 'price', e.target.value)} disabled={isSaving} />
                           </CardHeader>
                           <CardContent className="flex-grow space-y-3">
                                {pkg.features.map((feature, fIndex) => (
                                    <div key={feature.id} className="flex items-center gap-2">
                                        <Input value={feature.text} onChange={(e) => handleFeatureChange(pkg.id, feature.id, e.target.value)} disabled={isSaving} />
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setSettings(prev => ({...prev, packages: prev.packages.map(p => p.id === pkg.id ? {...p, features: moveItem(p.features, fIndex, 'up')} : p)}))} disabled={fIndex === 0}><ArrowUp className="h-4 w-4"/></Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setSettings(prev => ({...prev, packages: prev.packages.map(p => p.id === pkg.id ? {...p, features: moveItem(p.features, fIndex, 'down')} : p)}))} disabled={fIndex === pkg.features.length - 1}><ArrowDown className="h-4 w-4"/></Button>
                                        <Button size="icon" variant="destructive" className="h-8 w-8 flex-shrink-0" onClick={() => removeFeature(pkg.id, feature.id)} disabled={isSaving}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={() => addFeature(pkg.id)} disabled={isSaving} className="w-full"><PlusCircle className="mr-2 h-4 w-4"/> Tambah Fitur</Button>
                           </CardContent>
                           <div className="p-4 border-t flex flex-col gap-4">
                                <div className="flex items-center space-x-2">
                                    <Switch id={`highlight-${pkg.id}`} checked={pkg.highlight} onCheckedChange={(checked) => handlePackageChange(pkg.id, 'highlight', checked)} disabled={isSaving} />
                                    <Label htmlFor={`highlight-${pkg.id}`}>Sorot Paket</Label>
                                </div>
                                <Button variant="destructive" onClick={() => removePackage(pkg.id)} disabled={isSaving}>Hapus Paket</Button>
                           </div>
                        </Card>
                    ))}
                    <Button variant="outline" onClick={addPackage} disabled={isSaving} className="h-auto py-8 text-lg"><PlusCircle className="mr-2" /> Tambah Paket</Button>
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
