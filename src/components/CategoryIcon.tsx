import React from 'react';
import {
  Sparkles,
  Utensils,
  Sparkle,
  Coins,
  HeartPulse,
  Compass,
  Smartphone,
  Trees,
  HelpCircle,
  Flag,
  Tv,
  Trophy,
  Newspaper,
} from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-5 h-5' }) => {
  switch (name) {
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'Utensils':
      return <Utensils className={className} />;
    case 'Sparkle':
      return <Sparkle className={className} />;
    case 'Coins':
      return <Coins className={className} />;
    case 'HeartPulse':
      return <HeartPulse className={className} />;
    case 'Compass':
      return <Compass className={className} />;
    case 'Smartphone':
      return <Smartphone className={className} />;
    case 'Trees':
      return <Trees className={className} />;
    case 'Flag':
      return <Flag className={className} />;
    case 'Tv':
      return <Tv className={className} />;
    case 'Trophy':
      return <Trophy className={className} />;
    case 'Newspaper':
      return <Newspaper className={className} />;
    default:
      return <HelpCircle className={className} />;
  }
};

