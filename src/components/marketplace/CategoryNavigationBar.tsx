import { useMemo, useRef, useEffect, useState } from 'react';
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
  Compass,
  BookOpen,
  Layout,
  Smartphone,
  Camera,
  Music,
  ShoppingBag,
  Zap,
  Image as ImageIcon,
  BarChart3,
  MessageSquare,
  Search,
  Gift,
  Package,
  GraduationCap,
  Headphones,
  Mic,
  Film,
  PenTool,
  Layers,
  Database,
  Cloud,
  Shield,
  Heart,
  DollarSign,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface CategoryNavigationBarProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

// Définition complète des catégories avec leurs icônes et labels (style comeup.com)
const CATEGORY_CONFIG = [
  { 
    value: 'all', 
    label: 'Pour vous', 
    icon: Compass,
    popular: false
  },
  { 
    value: 'featured', 
    label: 'Meilleurs services', 
    icon: Star,
    popular: true
  },
  { 
    value: 'design', 
    label: 'Design & Graphisme', 
    icon: Palette,
    popular: true
  },
  { 
    value: 'marketing', 
    label: 'SEO & Marketing', 
    icon: TrendingUp,
    popular: true
  },
  { 
    value: 'developpement', 
    label: 'Développement Web', 
    icon: Code,
    popular: true
  },
  { 
    value: 'redaction', 
    label: 'Rédaction', 
    icon: FileText,
    popular: true
  },
  { 
    value: 'video', 
    label: 'Vidéo & Montage', 
    icon: Video,
    popular: true
  },
  { 
    value: 'audio', 
    label: 'Audio & Musique', 
    icon: Music,
    popular: false
  },
  { 
    value: 'photographie', 
    label: 'Photographie', 
    icon: Camera,
    popular: false
  },
  { 
    value: 'ebook', 
    label: 'Ebooks & Guides', 
    icon: BookOpen,
    popular: false
  },
  { 
    value: 'template', 
    label: 'Templates', 
    icon: Layout,
    popular: false
  },
  { 
    value: 'logiciel', 
    label: 'Logiciels', 
    icon: Smartphone,
    popular: false
  },
  { 
    value: 'app', 
    label: 'Applications', 
    icon: Smartphone,
    popular: false
  },
  { 
    value: 'traduction', 
    label: 'Traduction', 
    icon: Globe,
    popular: false
  },
  { 
    value: 'coaching', 
    label: 'Coaching', 
    icon: Target,
    popular: false
  },
  { 
    value: 'consultation', 
    label: 'Consultation', 
    icon: Users,
    popular: false
  },
  { 
    value: 'conseil', 
    label: 'Conseil Business', 
    icon: Briefcase,
    popular: false
  },
  { 
    value: 'formation', 
    label: 'Formation', 
    icon: GraduationCap,
    popular: false
  },
  { 
    value: 'social', 
    label: 'Réseaux sociaux', 
    icon: MessageSquare,
    popular: false
  },
  { 
    value: 'maintenance', 
    label: 'Maintenance', 
    icon: Wrench,
    popular: false
  },
  { 
    value: 'graphisme', 
    label: 'Graphisme', 
    icon: ImageIcon,
    popular: false
  },
  { 
    value: 'animation', 
    label: 'Animation', 
    icon: Film,
    popular: false
  },
  { 
    value: 'illustration', 
    label: 'Illustration', 
    icon: PenTool,
    popular: false
  },
  { 
    value: 'ui-ux', 
    label: 'UI/UX Design', 
    icon: Layers,
    popular: false
  },
  { 
    value: 'data', 
    label: 'Data & Analytics', 
    icon: BarChart3,
    popular: false
  },
  { 
    value: 'cloud', 
    label: 'Cloud & DevOps', 
    icon: Cloud,
    popular: false
  },
  { 
    value: 'securite', 
    label: 'Sécurité', 
    icon: Shield,
    popular: false
  },
  { 
    value: 'podcast', 
    label: 'Podcast', 
    icon: Mic,
    popular: false
  },
  { 
    value: 'voix-off', 
    label: 'Voix-off', 
    icon: Headphones,
    popular: false
  },
];

export function CategoryNavigationBar({
  categories,
  selectedCategory,
  onCategoryChange,
}: CategoryNavigationBarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Filtrer les catégories disponibles basées sur les produits réels
  const availableCategories = useMemo(() => {
    const available = CATEGORY_CONFIG.filter(cat => {
      if (cat.value === 'all' || cat.value === 'featured') return true;
      return categories.includes(cat.value);
    });
    return available;
  }, [categories]);

  // Gérer le scroll horizontal
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleScroll();
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [availableCategories]);

  return (
    <div className="sticky top-0 z-40 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="relative max-w-7xl mx-auto">
        {/* Flèche gauche */}
        {showLeftArrow && (
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-0 bottom-0 z-10 flex items-center justify-center w-12 bg-gradient-to-r from-white via-white to-transparent hover:from-gray-50 transition-all duration-200"
            aria-label="Faire défiler vers la gauche"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}

        {/* Flèche droite */}
        {showRightArrow && (
          <button
            onClick={scrollRight}
            className="absolute right-0 top-0 bottom-0 z-10 flex items-center justify-center w-12 bg-gradient-to-l from-white via-white to-transparent hover:from-gray-50 transition-all duration-200"
            aria-label="Faire défiler vers la droite"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        )}

        <div className="px-4 sm:px-6 lg:px-8 overflow-hidden">
          <nav 
            ref={scrollContainerRef}
            className="flex items-center gap-3 sm:gap-4 lg:gap-6 overflow-x-auto scrollbar-hide py-3 sm:py-4 scroll-smooth"
            role="tablist"
            aria-label="Catégories de services"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {availableCategories.map((category) => {
              const Icon = category.icon;
              const isActive = selectedCategory === category.value;
              
              return (
                <button
                  key={category.value}
                  onClick={() => onCategoryChange(category.value)}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1.5 sm:gap-2 min-w-[70px] sm:min-w-[85px] px-2 sm:px-3 py-2 sm:py-2.5 transition-all duration-300",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg",
                    "hover:bg-gray-50 active:scale-95",
                    isActive && "bg-gray-50"
                  )}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`category-${category.value}`}
                >
                  {/* Icône avec style amélioré */}
                  <div className={cn(
                    "relative w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-full transition-all duration-300",
                    "transform",
                    isActive 
                      ? "bg-gray-900 text-white scale-110 shadow-lg" 
                      : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 hover:scale-105"
                  )}>
                    <Icon className={cn(
                      "w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300",
                      isActive ? "fill-current" : ""
                    )} />
                    
                    {/* Badge "Populaire" pour les catégories populaires */}
                    {category.popular && !isActive && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  
                  {/* Texte avec style amélioré */}
                  <span className={cn(
                    "text-[10px] sm:text-xs font-medium text-center whitespace-nowrap transition-all duration-300 leading-tight",
                    isActive 
                      ? "text-gray-900 font-bold" 
                      : "text-gray-600 font-normal"
                  )}>
                    {category.label}
                  </span>
                  
                  {/* Ligne de soulignement épaisse pour l'élément actif */}
                  {isActive && (
                    <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-10 sm:w-12 h-1 bg-gray-900 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
