import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  CreditCard,
  BarChart3,
  Tag,
  LogOut,
  Store,
  Shield,
  ShieldCheck,
  DollarSign,
  UserPlus,
  History,
  Bell,
  Target,
  Search,
  MessageSquare,
  TrendingUp,
  BookOpen,
  GraduationCap,
  Download,
  Key,
  Truck,
  Warehouse,
  Calendar,
  FileText,
  Scale,
  Headphones,
  Palette,
  Layout,
  Sparkles,
  User,
  Heart,
  Receipt,
  RotateCcw,
  Webhook,
  Gift,
  Star,
  Percent,
  Repeat,
  GanttChart,
  Boxes,
  DollarSign as DollarSignIcon,
  PackageSearch,
  Factory,
  Hash,
  Building2,
  BarChart,
  Layers,
  FileBarChart,
  ShoppingBag,
  Camera,
  Globe,
  Trophy,
  ArrowRight,
} from "lucide-react";
import payhukLogo from "@/assets/payhuk-logo.png";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { logger } from "@/lib/logger";

// Menu organisé par sections
const menuSections = [
  {
    label: "Principal",
    items: [
      {
        title: "Tableau de bord",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Boutique",
        url: "/dashboard/store",
        icon: Store,
      },
      {
        title: "Marketplace",
        url: "/marketplace",
        icon: ShoppingCart,
      },
    ]
  },
  {
    label: "Mon Compte",
    items: [
      {
        title: "Portail Client",
        url: "/account",
        icon: User,
      },
      {
        title: "Mes Commandes",
        url: "/account/orders",
        icon: ShoppingCart,
      },
      {
        title: "Commandes Multi-Stores",
        url: "/account/orders/multi-store",
        icon: ShoppingBag,
      },
      {
        title: "Mes Téléchargements",
        url: "/account/downloads",
        icon: Download,
      },
      {
        title: "Gamification",
        url: "/dashboard/gamification",
        icon: Trophy,
      },
      {
        title: "Mon Portail Digital",
        url: "/account/digital",
        icon: Package,
      },
      {
        title: "Mon Portail Produits Physiques",
        url: "/account/physical",
        icon: ShoppingBag,
      },
      {
        title: "Mes Cours",
        url: "/account/courses",
        icon: GraduationCap,
      },
      {
        title: "Créer un Cours",
        url: "/dashboard/courses/new",
        icon: GraduationCap,
      },
      {
        title: "Ma Liste de Souhaits",
        url: "/account/wishlist",
        icon: Heart,
      },
      {
        title: "Mes Alertes",
        url: "/account/alerts",
        icon: Bell,
      },
      {
        title: "Mes Factures",
        url: "/account/invoices",
        icon: Receipt,
      },
      {
        title: "Mes Retours",
        url: "/account/returns",
        icon: RotateCcw,
      },
      {
        title: "Mon Profil",
        url: "/account/profile",
        icon: User,
      },
    ]
  },
  {
    label: "Produits & Cours",
    items: [
      {
        title: "Produits",
        url: "/dashboard/products",
        icon: Package,
      },
      {
        title: "Mes Cours",
        url: "/dashboard/my-courses",
        icon: GraduationCap,
      },
      {
        title: "Produits Digitaux",
        url: "/dashboard/digital-products",
        icon: Download,
      },
      {
        title: "Mes Téléchargements",
        url: "/dashboard/my-downloads",
        icon: Download,
      },
      {
        title: "Mes Licences",
        url: "/dashboard/my-licenses",
        icon: Key,
      },
      {
        title: "Bundles Produits",
        url: "/dashboard/digital-products/bundles/create",
        icon: Layers,
      },
      {
        title: "Analytics Digitaux",
        url: "/dashboard/digital-products",
        icon: BarChart,
      },
    ]
  },
  {
    label: "Templates & Design",
    items: [
      {
        title: "Marketplace Templates",
        url: "/demo/templates-ui",
        icon: Palette,
      },
      {
        title: "Mes Templates",
        url: "/dashboard/my-templates",
        icon: Layout,
      },
      {
        title: "Créer avec Template",
        url: "/dashboard/products/new",
        icon: Sparkles,
      },
    ]
  },
  {
    label: "Ventes & Logistique",
    items: [
      {
        title: "Commandes",
        url: "/dashboard/orders",
        icon: ShoppingCart,
      },
      {
        title: "Commandes Avancées",
        url: "/dashboard/advanced-orders",
        icon: MessageSquare,
      },
      {
        title: "Réservations",
        url: "/dashboard/bookings",
        icon: Calendar,
      },
      {
        title: "Calendrier Avancé",
        url: "/dashboard/advanced-calendar",
        icon: Calendar,
      },
      {
        title: "Gestion des Services",
        url: "/dashboard/service-management",
        icon: Calendar,
      },
      {
        title: "Réservations Récurrentes",
        url: "/dashboard/recurring-bookings",
        icon: Repeat,
      },
      {
        title: "Inventaire",
        url: "/dashboard/inventory",
        icon: Warehouse,
      },
      {
        title: "Expéditions",
        url: "/dashboard/shipping",
        icon: Truck,
      },
      {
        title: "Expéditions Batch",
        url: "/dashboard/batch-shipping",
        icon: PackageSearch,
      },
      {
        title: "Kits Produits",
        url: "/dashboard/product-kits",
        icon: Boxes,
      },
      {
        title: "Prévisions Demande",
        url: "/dashboard/demand-forecasting",
        icon: TrendingUp,
      },
      {
        title: "Optimisation Coûts",
        url: "/dashboard/cost-optimization",
        icon: DollarSignIcon,
      },
      {
        title: "Fournisseurs",
        url: "/dashboard/suppliers",
        icon: Factory,
      },
      {
        title: "Entrepôts",
        url: "/dashboard/warehouses",
        icon: Building2,
      },
      {
        title: "Gestion Stocks Produits Physiques",
        url: "/dashboard/physical-inventory",
        icon: Warehouse,
      },
      {
        title: "Analytics Produits Physiques",
        url: "/dashboard/physical-analytics",
        icon: BarChart3,
      },
      {
        title: "Lots & Expiration",
        url: "/dashboard/physical-lots",
        icon: Package,
      },
      {
        title: "Numéros de Série & Traçabilité",
        url: "/dashboard/physical-serial-tracking",
        icon: Hash,
      },
      {
        title: "Scanner Codes-barres",
        url: "/dashboard/physical-barcode-scanner",
        icon: Camera,
      },
      {
        title: "Précommandes",
        url: "/dashboard/physical-preorders",
        icon: Package,
      },
      {
        title: "Backorders",
        url: "/dashboard/physical-backorders",
        icon: Package,
      },
      {
        title: "Bundles Produits",
        url: "/dashboard/physical-bundles",
        icon: ShoppingBag,
      },
      {
        title: "Multi-devises",
        url: "/dashboard/multi-currency",
        icon: Globe,
      },
    ]
  },
  {
    label: "Finance & Paiements",
    items: [
      {
        title: "Paiements",
        url: "/dashboard/payments",
        icon: CreditCard,
      },
      {
        title: "Solde à Payer",
        url: "/dashboard/pay-balance",
        icon: DollarSign,
      },
      {
        title: "Gestion Paiements",
        url: "/dashboard/payment-management",
        icon: FileText,
      },
    ]
  },
  {
    label: "Marketing & Croissance",
    items: [
      {
        title: "Clients",
        url: "/dashboard/customers",
        icon: Users,
      },
      {
        title: "Promotions",
        url: "/dashboard/promotions",
        icon: Tag,
      },
      {
        title: "Promotions Produits Physiques",
        url: "/dashboard/physical-promotions",
        icon: Percent,
      },
      {
        title: "Parrainage",
        url: "/dashboard/referrals",
        icon: UserPlus,
      },
      {
        title: "Affiliation",
        url: "/dashboard/affiliates",
        icon: TrendingUp,
      },
      {
        title: "Cours Promus",
        url: "/affiliate/courses",
        icon: GraduationCap,
      },
    ]
  },
  {
    label: "Analytics & SEO",
    items: [
      {
        title: "Statistiques",
        url: "/dashboard/analytics",
        icon: BarChart3,
      },
      {
        title: "Mes Pixels",
        url: "/dashboard/pixels",
        icon: Target,
      },
      {
        title: "Mon SEO",
        url: "/dashboard/seo",
        icon: Search,
      },
    ]
  },
      {
        label: "Systèmes & Intégrations",
        items: [
      {
        title: "Intégrations",
        url: "/dashboard/integrations",
        icon: Settings,
      },
      {
        title: "Webhooks",
        url: "/dashboard/webhooks",
        icon: Webhook,
      },
      {
        title: "Webhooks Produits Digitaux",
        url: "/dashboard/digital-webhooks",
        icon: Webhook,
      },
      {
        title: "Webhooks Produits Physiques",
        url: "/dashboard/physical-webhooks",
        icon: Webhook,
      },
      {
        title: "Programme de Fidélité",
        url: "/dashboard/loyalty",
        icon: Star,
      },
      {
        title: "Cartes Cadeaux",
        url: "/dashboard/gift-cards",
        icon: Gift,
      },
    ]
  },
  {
    label: "Configuration",
    items: [
      {
        title: "KYC",
        url: "/dashboard/kyc",
        icon: Shield,
      },
      {
        title: "Paramètres",
        url: "/dashboard/settings",
        icon: Settings,
      },
    ]
  },
];

// Menu flat pour rétrocompatibilité
const menuItems = menuSections.flatMap(section => section.items);

// Menu Admin organisé par sections
const adminMenuSections = [
  {
    label: "Administration",
    items: [
      {
        title: "Vue d'ensemble",
        url: "/admin",
        icon: LayoutDashboard,
      },
      {
        title: "Utilisateurs",
        url: "/admin/users",
        icon: Users,
      },
      {
        title: "Boutiques",
        url: "/admin/stores",
        icon: Store,
      },
    ]
  },
  {
    label: "Catalogue",
    items: [
      {
        title: "Produits",
        url: "/admin/products",
        icon: Package,
      },
      {
        title: "Cours",
        url: "/admin/courses",
        icon: GraduationCap,
      },
      {
        title: "Produits Digitaux",
        url: "/dashboard/digital-products",
        icon: Download,
      },
      {
        title: "Produits Physiques",
        url: "/dashboard/products",
        icon: Package,
      },
      {
        title: "Services",
        url: "/dashboard/bookings",
        icon: Calendar,
      },
      {
        title: "Avis",
        url: "/admin/reviews",
        icon: FileText,
      },
      {
        title: "Licences",
        url: "/dashboard/license-management",
        icon: Key,
      },
    ]
  },
  {
    label: "Templates & Design",
    items: [
      {
        title: "Marketplace Templates",
        url: "/demo/templates-ui",
        icon: Palette,
      },
      {
        title: "Gestion Templates",
        url: "/admin/templates",
        icon: Layout,
      },
      {
        title: "Templates Premium",
        url: "/admin/templates-premium",
        icon: Sparkles,
      },
    ]
  },
  {
    label: "Commerce",
    items: [
      {
        title: "Ventes",
        url: "/admin/sales",
        icon: ShoppingCart,
      },
      {
        title: "Commandes",
        url: "/admin/orders",
        icon: ShoppingCart,
      },
      {
        title: "Inventaire Global",
        url: "/admin/inventory",
        icon: Warehouse,
      },
      {
        title: "Expéditions",
        url: "/admin/shipping",
        icon: Truck,
      },
      {
        title: "Retours",
        url: "/admin/returns",
        icon: RotateCcw,
      },
      {
        title: "Calendrier Avancé",
        url: "/dashboard/advanced-calendar",
        icon: Calendar,
      },
      {
        title: "Gestion des Services",
        url: "/dashboard/service-management",
        icon: Calendar,
      },
      {
        title: "Réservations Récurrentes",
        url: "/dashboard/recurring-bookings",
        icon: Repeat,
      },
      {
        title: "Kits Produits",
        url: "/dashboard/product-kits",
        icon: Boxes,
      },
      {
        title: "Prévisions Demande",
        url: "/dashboard/demand-forecasting",
        icon: TrendingUp,
      },
      {
        title: "Optimisation Coûts",
        url: "/dashboard/cost-optimization",
        icon: DollarSignIcon,
      },
      {
        title: "Expéditions Batch",
        url: "/dashboard/batch-shipping",
        icon: PackageSearch,
      },
      {
        title: "Fournisseurs",
        url: "/dashboard/suppliers",
        icon: Factory,
      },
      {
        title: "Entrepôts",
        url: "/dashboard/warehouses",
        icon: Building2,
      },
      {
        title: "Gestion des Affiliés",
        url: "/dashboard/store-affiliates",
        icon: TrendingUp,
      },
    ]
  },
  {
    label: "Finance",
    items: [
      {
        title: "Revenus Plateforme",
        url: "/admin/revenue",
        icon: DollarSign,
      },
      {
        title: "Paiements",
        url: "/admin/payments",
        icon: CreditCard,
      },
      {
        title: "Taxes",
        url: "/admin/taxes",
        icon: Percent,
      },
      {
        title: "Litiges",
        url: "/admin/disputes",
        icon: Scale,
      },
      {
        title: "Statistiques Moneroo",
        url: "/admin/moneroo-analytics",
        icon: BarChart3,
      },
      {
        title: "Réconciliation Moneroo",
        url: "/admin/moneroo-reconciliation",
        icon: RotateCcw,
      },
      {
        title: "Monitoring Transactions",
        url: "/admin/transaction-monitoring",
        icon: BarChart, // Utiliser BarChart au lieu de AlertCircle pour éviter les problèmes de bundling
      },
    ]
  },
    {
    label: "Systèmes & Intégrations",
    items: [
      {
        title: "Intégrations",
        url: "/admin/integrations",
        icon: Settings,
      },
      {
        title: "Webhooks",
        url: "/admin/webhooks",
        icon: Webhook,
      },
      {
        title: "Webhooks Produits Digitaux",
        url: "/dashboard/digital-webhooks",
        icon: Webhook,
      },
      {
        title: "Webhooks Produits Physiques",
        url: "/dashboard/physical-webhooks",
        icon: Webhook,
      },
      {
        title: "Programme de Fidélité",
        url: "/admin/loyalty",
        icon: Star,
      },
      {
        title: "Cartes Cadeaux",
        url: "/admin/gift-cards",
        icon: Gift,
      },
    ]
  },
  {
    label: "Croissance",
    items: [
      {
        title: "Parrainages",
        url: "/admin/referrals",
        icon: UserPlus,
      },
      {
        title: "Affiliation",
        url: "/admin/affiliates",
        icon: TrendingUp,
      },
      {
        title: "Analytics",
        url: "/admin/analytics",
        icon: BarChart3,
      },
    ]
  },
  {
    label: "Sécurité & Support",
    items: [
      {
        title: "Admin KYC",
        url: "/admin/kyc",
        icon: ShieldCheck,
      },
      {
        title: "Sécurité 2FA",
        url: "/admin/security",
        icon: Shield,
      },
      {
        title: "Activité",
        url: "/admin/activity",
        icon: History,
      },
      {
        title: "Audit",
        url: "/admin/audit",
        icon: FileText,
      },
      {
        title: "Support",
        url: "/admin/support",
        icon: Headphones,
      },
      {
        title: "Notifications",
        url: "/admin/notifications",
        icon: Bell,
      },
    ]
  },
  {
    label: "Configuration",
    items: [
      {
        title: "Paramètres",
        url: "/admin/settings",
        icon: Settings,
      },
      {
        title: "Commissions",
        url: "/admin/commission-settings",
        icon: Percent,
      },
      {
        title: "Paiements Commissions",
        url: "/admin/commission-payments",
        icon: DollarSign,
      },
    ]
  },
];

// Menu Admin flat pour rétrocompatibilité
const adminMenuItems = adminMenuSections.flatMap(section => section.items);

export function AppSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { isAdmin } = useAdmin();
  const isCollapsed = state === "collapsed";
  
  // Détecte si on est sur une page admin
  const isOnAdminPage = location.pathname.startsWith('/admin');

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
      navigate("/");
    } catch (error) {
      logger.error('Logout error', {
        error: error instanceof Error ? error.message : String(error),
      });
      toast({
        title: "Erreur",
        description: "Impossible de se déconnecter",
        variant: "destructive"
      });
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        {/* Logo */}
        <div className="p-3 sm:p-4 border-b">
          <div className="flex items-center gap-2">
            <img 
              src={payhukLogo} 
              alt="Payhuk" 
              className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 object-contain" 
            />
            {!isCollapsed && (
              <span className="text-base sm:text-lg font-bold text-white dark:text-black truncate">
                Payhuk
              </span>
            )}
          </div>
        </div>

        {/* Menu Items - Organisé par sections (masqué sur pages admin) */}
        {!isOnAdminPage && menuSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="!text-white dark:!text-black">
              {!isCollapsed && section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const IconComponent = item.icon;
                  if (!IconComponent) {
                    logger.warn('Menu item missing icon:', item.title);
                    return null;
                  }
                  // Afficher une flèche pour "Mes Commandes", "Commandes Multi-Stores" et "Mes Téléchargements" pour améliorer la visibilité
                  const showArrow = item.title === "Mes Commandes" || item.title === "Commandes Multi-Stores" || item.title === "Mes Téléchargements";
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end={item.url === "/dashboard"}
                          className={({ isActive }) =>
                            `transition-all duration-300 group relative flex items-center ${
                              isActive
                                ? "bg-primary/20 text-primary font-semibold border-l-2 border-primary"
                                : "!text-white dark:!text-black hover:bg-muted hover:translate-x-1"
                            }`
                          }
                        >
                          <IconComponent 
                            className={`${showArrow ? 'h-5 w-5 text-primary mr-2' : 'h-4 w-4 text-white dark:text-black'} flex-shrink-0`}
                            style={showArrow ? { strokeWidth: 2.5 } : undefined}
                          />
                          {!isCollapsed && (
                            <>
                              <span className={`flex-1 ${showArrow ? 'font-semibold' : 'font-medium'}`}>{item.title}</span>
                              {showArrow && (
                                <ArrowRight 
                                  className="h-5 w-5 ml-auto flex-shrink-0 text-primary opacity-90 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" 
                                  style={{ strokeWidth: 2.5 }}
                                  aria-hidden="true"
                                />
                              )}
                            </>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Bouton Retour Dashboard (visible uniquement sur pages admin) */}
        {isAdmin && isOnAdminPage && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/dashboard"
                      className="!text-white dark:!text-black hover:bg-primary/10 hover:translate-x-1 transition-all duration-300"
                    >
                      <LayoutDashboard className="h-4 w-4 text-white dark:text-black" />
                      {!isCollapsed && <span>← Retour Dashboard</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin Menu Items - Organisé par sections */}
        {isAdmin && adminMenuSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="!text-white dark:!text-black">
              {!isCollapsed && section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const IconComponent = item.icon;
                  if (!IconComponent) {
                    logger.warn('Menu item missing icon:', item.title);
                    return null;
                  }
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={({ isActive }) =>
                            `transition-all duration-300 ${
                              isActive
                                ? "bg-primary/20 text-primary font-semibold border-l-2 border-primary"
                                : "!text-white dark:!text-black hover:bg-muted hover:translate-x-1"
                            }`
                          }
                        >
                          <IconComponent className="h-4 w-4 text-white dark:text-black" />
                          {!isCollapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t p-4 space-y-2">
        {!isCollapsed && (
          <LanguageSwitcher variant="outline" showLabel={true} className="w-full" />
        )}
        <Button
          variant="ghost"
          className="w-full justify-start !text-white dark:!text-black"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 text-white dark:text-black" />
          {!isCollapsed && <span>Déconnexion</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
