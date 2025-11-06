/**
 * Physical Inventory Management Page
 * Date: 2025-01-28
 */

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WarehouseManager, StockAlerts } from '@/components/physical/inventory';
import { Package, AlertTriangle } from 'lucide-react';

export default function PhysicalInventoryManagement() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion des stocks</h1>
        <p className="text-muted-foreground mt-2">
          Gérez vos entrepôts, stocks et alertes de réapprovisionnement
        </p>
      </div>

      <Tabs defaultValue="warehouses" className="space-y-6">
        <TabsList>
          <TabsTrigger value="warehouses" className="gap-2">
            <Package className="h-4 w-4" />
            Entrepôts
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alertes de stock
          </TabsTrigger>
        </TabsList>

        <TabsContent value="warehouses" className="space-y-6">
          <WarehouseManager />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <StockAlerts />
        </TabsContent>
      </Tabs>
    </div>
  );
}



