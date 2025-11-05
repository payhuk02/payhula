/**
 * Customer Digital Portal - Portail Client pour Produits Digitaux
 * Date: 2025-01-27
 * 
 * Page principale du portail client avec navigation par onglets
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Key, Download, BarChart3, Settings } from 'lucide-react';
import { MyDigitalProducts } from '@/components/digital/customer/MyDigitalProducts';
import { MyLicenses } from '@/components/digital/customer/MyLicenses';
import { MyDownloads } from '@/components/digital/customer/MyDownloads';
import { DigitalProductStats } from '@/components/digital/customer/DigitalProductStats';
import { DigitalPreferences } from '@/components/digital/customer/DigitalPreferences';

export const CustomerDigitalPortal = () => {
  const [activeTab, setActiveTab] = useState('products');

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mon Portail Digital</h1>
        <p className="text-muted-foreground">
          Gérez tous vos produits digitaux, licences et téléchargements
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Mes Produits</span>
          </TabsTrigger>
          <TabsTrigger value="licenses" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">Mes Licences</span>
          </TabsTrigger>
          <TabsTrigger value="downloads" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Téléchargements</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Statistiques</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Paramètres</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-6">
          <MyDigitalProducts />
        </TabsContent>

        <TabsContent value="licenses" className="mt-6">
          <MyLicenses />
        </TabsContent>

        <TabsContent value="downloads" className="mt-6">
          <MyDownloads />
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <DigitalProductStats />
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          <DigitalPreferences />
        </TabsContent>
      </Tabs>
    </div>
  );
};

