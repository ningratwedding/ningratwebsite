// This component is no longer in use and can be removed or kept for future reference.
// The accessibility error related to DialogTitle was resolved by removing the unused
// Dialog component from `src/app/stories/[id]/page.tsx`.

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ImagePlaceholder } from "@/lib/placeholder-images";
import { Button } from "./ui/button";
import { Share2 } from "lucide-react";

interface ImageDetailDialogProps {
  image: ImagePlaceholder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ImageDetailDialog({
  image,
  open,
  onOpenChange,
}: ImageDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0">
        <div className="grid md:grid-cols-2">
          <div className="relative w-full aspect-[3/4]">
             <Image
              src={image.imageUrl}
              alt={image.title}
              fill
              data-ai-hint={image.imageHint}
              className="object-cover rounded-l-lg"
            />
          </div>
          <div className="p-6 flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold mb-2 font-headline">{image.title}</DialogTitle>
              <DialogDescription className="text-muted-foreground text-base">
                {image.description}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 pt-4 border-t">
                <span className="text-sm font-semibold text-muted-foreground">Category: {image.category}</span>
            </div>
            <div className="mt-auto pt-6 flex justify-end">
              <Button variant="outline">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
