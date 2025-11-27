import { LayoutGrid, PenTool, Pencil, Sparkles, Smile, Feather } from 'lucide-react';

export type AppStep = 'hero' | 'character' | 'story' | 'style' | 'result';

export enum CharacterMode {
  UPLOAD = 'upload',
  TEXT = 'text',
  SKIP = 'skip',
  AUTO = 'auto'
}

export interface CharacterData {
  // Refactored to allow hybrid inputs
  mode?: CharacterMode;
  imageBase64?: string | null;
  previewUrl?: string | null;
  description: string;
}

export interface Scene {
  id: string;
  description: string;
  imageUrl?: string | null;
  isGenerating?: boolean;
  isLoading?: boolean;
  error?: string | null;
}

export interface StyleOption {
  id: string;
  name: string;
  description: string;
  promptModifier: string;
  previewColor: string;
  previewImage: string;
  icon: any;
}

export const STYLES: StyleOption[] = [
  {
    id: 'corporate',
    name: 'Modern Corp',
    description: 'Clean, flat vector art. Perfect for professional presentations.',
    promptModifier: 'flat vector art style, corporate memphis style, clean lines, minimal details, soft pastel colors, white background, professional presentation graphic, STRICTLY NO FRAME, NO BORDER, frameless, open composition, spot illustration, no background box, object only',
    previewColor: 'bg-gradient-to-br from-blue-100 to-indigo-200',
    previewImage: 'https://i.imgur.com/vVo6nry.png',
    icon: LayoutGrid
  },
  {
    id: 'lineart',
    name: 'Minimal Line',
    description: 'Black & white sketchy style. Focuses purely on the scenario.',
    promptModifier: 'minimalist black and white line art, continuous line drawing, sketch style, clean white background, ink illustration, STRICTLY NO FRAME, NO BORDER, frameless, open composition, spot illustration, no background box, object only, no canvas frame',
    previewColor: 'bg-gradient-to-br from-gray-100 to-gray-300',
    previewImage: 'https://i.imgur.com/yD2qKG2.png',
    icon: PenTool
  },
  {
    id: 'doodle',
    name: 'Hand-drawn Doodle',
    description: 'Playful, marker-style sketches. No borders or frames.',
    promptModifier: 'Hand-drawn flat illustration, thick sketchy black outlines, crayon texture, simple minimalist characters, dot eyes, flat color blocks, playful professional style, Open Peeps style, isolated on white background, STRICTLY NO FRAME, NO BORDER, frameless, open composition, spot illustration, no background box, object only, no canvas frame',
    previewColor: 'bg-gradient-to-br from-yellow-50 to-orange-100',
    previewImage: 'https://i.imgur.com/sH8wM4s.png',
    icon: Pencil
  },
  {
    id: 'comic',
    name: 'Americana',
    description: 'Bold outlines and halftones. Strong storytelling vibe.',
    promptModifier: 'american comic book style, halftone patterns, bold black outlines, vibrant pop art colors, dramatic lighting, graphic novel panel',
    previewColor: 'bg-gradient-to-br from-yellow-100 to-red-200',
    previewImage: 'https://i.imgur.com/rheFvCH.png',
    icon: Sparkles
  },
  {
    id: 'indie',
    name: 'Indie Webcomic',
    description: 'Wholesome, wobbly lines & muted colors. Funny and relatable.',
    promptModifier: 'Indie webcomic style, 4-panel comic strip aesthetic, hand-drawn wobbly thick outlines, flat muted colors, retro color palette, simple minimalist characters, dot eyes, funny and wholesome vibe',
    previewColor: 'bg-gradient-to-br from-teal-100 to-emerald-200',
    previewImage: 'https://i.imgur.com/y0g4oKH.png',
    icon: Smile
  },
  {
    id: 'loose',
    name: 'Loose Ink',
    description: 'Messy, expressive ink sketches. Funny and relatable.',
    promptModifier: 'Comic strip in the style of Cassandra Calin, black and white ink sketch, loose gestural lines, messy scribble shading, minimalist character design, funny relatable situation, cute and charming, soft features, STRICTLY NO FRAME, NO BORDER, frameless, open composition, spot illustration, no background box, object only, no canvas frame',
    previewColor: 'bg-gradient-to-br from-gray-200 to-stone-300',
    previewImage: 'https://i.imgur.com/tGTQnft.png',
    icon: Feather
  }
];