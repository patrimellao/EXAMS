export type Hero = {
  type: 'gradient' | 'solid' | 'image' | 'image-gradient';
  gradient?: 'warm' | 'trust' | 'brand';
  color?: string;
  image?: { url: string; alt: string };
};

export const DEFAULT_HERO: Hero = { type: 'gradient', gradient: 'brand' };
