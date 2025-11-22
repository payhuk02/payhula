/**
 * Page de gestion multi-devises
 * Date: 28 Janvier 2025
 * Design responsive avec le même style que Mes Templates
 */

import { useTranslation } from 'react-i18next';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { CurrencyManager } from '@/components/physical/currencies/CurrencyManager';
import { CurrencyConverter } from '@/components/physical/currencies/CurrencyConverter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

export default function PhysicalMultiCurrency() {
  const { t } = useTranslation();
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header - Responsive & Animated */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                    <svg className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {t('admin.physicalMultiCurrency.title')}
                  </span>
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                  {t('admin.physicalMultiCurrency.description')}
                </p>
              </div>
            </div>

            <Tabs defaultValue="manager" className="space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-muted/50 backdrop-blur-sm">
                <TabsTrigger 
                  value="manager"
                  className="text-xs sm:text-sm px-2 sm:px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <span className="hidden xs:inline">{t('admin.physicalMultiCurrency.tabs.currencies')}</span>
                  <span className="xs:hidden">{t('admin.physicalMultiCurrency.tabs.currenciesShort')}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="converter"
                  className="text-xs sm:text-sm px-2 sm:px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                >
                  {t('admin.physicalMultiCurrency.tabs.converter')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="manager" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                <CurrencyManager />
              </TabsContent>

              <TabsContent value="converter" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                <CurrencyConverter />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
