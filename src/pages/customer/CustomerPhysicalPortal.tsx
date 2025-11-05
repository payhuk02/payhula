/**
 * Customer Physical Portal - Portail Client pour Produits Physiques
 * Date: 2025-01-27
 * 
 * Page principale du portail client avec navigation par onglets
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, RotateCcw, Shield, History, MapPin } from 'lucide-react';
import { MyOrders } from '@/components/physical/customer/MyOrders';
import { OrderTracking } from '@/components/physical/customer/OrderTracking';
import { MyReturns } from '@/components/physical/customer/MyReturns';
import { MyWarranties } from '@/components/physical/customer/MyWarranties';
import { OrderHistory } from '@/components/physical/customer/OrderHistory';

export default function CustomerPhysicalPortal() {
  const [activeTab, setActiveTab] = useState('orders');

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mon Portail Produits Physiques</h1>
        <p className="text-muted-foreground">
          Gérez vos commandes, retours, garanties et suivez vos expéditions
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Mes Commandes</span>
          </TabsTrigger>
          <TabsTrigger value="tracking" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Suivi</span>
          </TabsTrigger>
          <TabsTrigger value="returns" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Retours</span>
          </TabsTrigger>
          <TabsTrigger value="warranties" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Garanties</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Historique</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-6">
          <MyOrders />
        </TabsContent>

        <TabsContent value="tracking" className="mt-6">
          <OrderTracking />
        </TabsContent>

        <TabsContent value="returns" className="mt-6">
          <MyReturns />
        </TabsContent>

        <TabsContent value="warranties" className="mt-6">
          <MyWarranties />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <OrderHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
