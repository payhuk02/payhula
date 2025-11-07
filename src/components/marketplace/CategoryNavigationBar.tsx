import { useMemo } from 'react';
import { 
  Sparkles, 
  Star, 
  Palette, 
  TrendingUp, 
  Video, 
  Code, 
  FileText, 
  Users, 
  Briefcase,
  Globe,
  Target,
  Wrench,
  Info,
  Compass
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryNavigationBarProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

// Définition des catégories avec leurs icônes et labels
const CATEGORY_CONFIG = [
  { 
    value: 'all', 
    label: 'Pour vous', 
    icon: Compass,
    color: 'text-gray-600'
  },
  { 
    value: 'featured', 
    label: 'Meilleurs services', 
    icon: Star,
    color: 'text-gray-900'
  },
  { 
    value: 'design', 
    label: 'Design & Graphisme', 
    icon: Palette,
    color: 'text-gray-600'
  },
  { 
    value: 'marketing', 
    label: 'SEO & Communication', 
    icon: TrendingUp,
    color: 'text-gray-600'
  },
  { 
    value: 'video', 
    label: 'Audiovisuel', 
    icon: Video,
    color: 'text-gray-600'
  },
  { 
    value: 'developpement', 
    label: 'Site & Développement', 
    icon: Code,
    color: 'text-gray-600'
  },
  { 
    value: 'redaction', 
    label: 'Rédaction', 
    icon: FileText,
    color: 'text-gray-600'
  },
  { 
    value: 'consultation', 
    label: 'Réseaux sociaux', 
    icon: Users,
    color: 'text-gray-600'
  },
  { 
    value: 'conseil', 
    label: 'Business', 
    icon: Briefcase,
    color: 'text-gray-600'
  },
  { 
    value: 'traduction', 
    label: 'Traduction', 
    icon: Globe,
    color: 'text-gray-600'
  },
  { 
    value: 'coaching', 
    label: 'Coaching', 
    icon: Target,
    color: 'text-gray-600'
  },
  { 
    value: 'maintenance', 
    label: 'Maintenance', 
    icon: Wrench,
    color: 'text-gray-600'
  },
  { 
    value: 'formation', 
    label: 'Formation', 
    icon: Info,
    color: 'text-gray-600'
  },
];

export function CategoryNavigationBar({
  categories,
  selectedCategory,
  onCategoryChange,
}: CategoryNavigationBarProps) {
  // Filtrer les catégories disponibles basées sur les produits réels
  const availableCategories = useMemo(() => {
    const available = CATEGORY_CONFIG.filter(cat => {
      if (cat.value === 'all' || cat.value === 'featured') return true;
      return categories.includes(cat.value);
    });
    return available;
  }, [categories]);

  return (
    <div className="w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav 
          className="flex items-center gap-4 sm:gap-6 lg:gap-8 overflow-x-auto scrollbar-hide py-4"
          role="tablist"
          aria-label="Catégories de services"
        >
          {availableCategories.map((category) => {
            const Icon = category.icon;
            const isActive = selectedCategory === category.value;
            
            return (
              <button
                key={category.value}
                onClick={() => onCategoryChange(category.value)}
                className={cn(
                  "flex flex-col items-center gap-2 min-w-[80px] sm:min-w-[100px] px-2 py-2 transition-all duration-200 hover:opacity-80",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
                )}
                role="tab"
                aria-selected={isActive}
                aria-controls={`category-${category.value}`}
              >
                {/* Icône */}
                <div className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-all duration-200",
                  isActive 
                    ? "bg-gray-900 text-white" 
                    : "bg-transparent border-2 border-gray-300 text-gray-600"
                )}>
                  <Icon className={cn(
                    "w-4 h-4 sm:w-5 sm:h-5",
                    isActive ? "fill-current" : ""
                  )} />
                </div>
                
                {/* Texte */}
                <span className={cn(
                  "text-xs sm:text-sm font-medium text-center whitespace-nowrap transition-colors duration-200",
                  isActive 
                    ? "text-gray-900 font-bold" 
                    : "text-gray-600 font-normal"
                )}>
                  {category.label}
                </span>
                
                {/* Ligne de soulignement pour l'élément actif */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-900 rounded-t-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

