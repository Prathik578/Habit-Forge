import {
  BookOpen, Dumbbell, Brain, PenTool, Code, Footprints, Apple, Droplets,
  Moon, Sunrise, Music, Palette, Leaf, Heart, Timer, Languages, Calculator,
  Sprout, Coffee, Bike, type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  BookOpen, Dumbbell, Brain, PenTool, Code, Footprints, Apple, Droplets,
  Moon, Sunrise, Music, Palette, Leaf, Heart, Timer, Languages, Calculator,
  Sprout, Coffee, Bike,
};

export function getIconComponent(name: string): LucideIcon {
  return iconMap[name] ?? BookOpen;
}
