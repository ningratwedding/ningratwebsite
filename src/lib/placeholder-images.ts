
export type Category = 'Portret' | 'Pernikahan' | 'Lanskap' | 'Acara';

export type ImagePlaceholder = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: Category;
  imageUrl: string;
  width: number;
  height: number;
  imageHint: string;
};

export const categories: Category[] = [
  'Lanskap',
  'Pernikahan',
  'Portret',
  'Acara',
];
