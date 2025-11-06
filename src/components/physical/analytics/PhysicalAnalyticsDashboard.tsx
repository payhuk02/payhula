/**
 * Dashboard Analytics Produits Physiques
 * Date: 28 Janvier 2025
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Warehouse,
  MapPin,
  RefreshCw,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useStorePhysicalAnalytics, useStoreWarehousePerformance, useGeographicSalesPerformance } from '@/hooks/physical/usePhysicalAnalytics';
import { SalesOverview } from './SalesOverview';
import { WarehousePerformanceChart } from './WarehousePerformanceChart';
import { GeographicHeatmap } from './GeographicHeatmap';
import { StockRotationTable } from './StockRotationTable';
import { cn } from '@/lib/utils';

interface PhysicalAnalyticsDashboardProps {
  storeId: string;
}

export function PhysicalAnalyticsDashboard({ storeId }: PhysicalAnalyticsDashboardProps) {
  const [periodType, setPeriodType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  });

  const { data: analytics, isLoading: analyticsLoading } = useStorePhysicalAnalytics(storeId, {
    periodType,
    startDate: format(dateRange.from, 'yyyy-MM-dd'),
    endDate: format(dateRange.to, 'yyyy-MM-dd'),
  });

  const { data: warehousePerformance, isLoading: warehouseLoading } = useStoreWarehousePerformance(storeId, {
    periodType,
    startDate: format(dateRange.from, 'yyyy-MM-dd'),
    endDate: format(dateRange.to, 'yyyy-MM-dd'),
  });

  const { data: geographicSales, isLoading: geographicLoading } = useGeographicSalesPerformance(storeId, {
    periodType,
    startDate: format(dateRange.from, 'yyyy-MM-dd'),
    endDate: format(dateRange.to, 'yyyy-MM-dd'),
  });

  if (analyticsLoading || warehouseLoading || geographicLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = analytics || {
    total_revenue: 0,
    total_units_sold: 0,
    total_products: 0,
    average_order_value: 0,
    total_gross_profit: 0,
    total_net_profit: 0,
    average_gross_margin: 0,
    average_net_margin: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics Produits Physiques</h2>
          <p className="text-muted-foreground">
            Analysez les performances de vos produits physiques
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={periodType} onValueChange={(value: any) => setPeriodType(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Quotidien</SelectItem>
              <SelectItem value="weekly">Hebdomadaire</SelectItem>
              <SelectItem value="monthly">Mensuel</SelectItem>
              <SelectItem value="yearly">Annuel</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-[240px] justify-start text-left font-normal')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from && dateRange.to ? (
                  `${format(dateRange.from, 'dd MMM', { locale: fr })} - ${format(dateRange.to, 'dd MMM', { locale: fr })}`
                ) : (
                  <span>Sélectionner une période</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range: any) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XOF',
                minimumFractionDigits: 0,
              }).format(stats.total_revenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.total_units_sold} unités vendues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Brut</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XOF',
                minimumFractionDigits: 0,
              }).format(stats.total_gross_profit)}
            </div>
            <p className="text-xs text-muted-foreground">
              Marge: {stats.average_gross_margin.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Net</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XOF',
                minimumFractionDigits: 0,
              }).format(stats.total_net_profit)}
            </div>
            <p className="text-xs text-muted-foreground">
              Marge: {stats.average_net_margin.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XOF',
                minimumFractionDigits: 0,
              }).format(stats.average_order_value)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.total_products} produits actifs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">
            <BarChart3 className="mr-2 h-4 w-4" />
            Ventes
          </TabsTrigger>
          <TabsTrigger value="warehouses">
            <Warehouse className="mr-2 h-4 w-4" />
            Entrepôts
          </TabsTrigger>
          <TabsTrigger value="geographic">
            <MapPin className="mr-2 h-4 w-4" />
            Géographique
          </TabsTrigger>
          <TabsTrigger value="rotation">
            <RefreshCw className="mr-2 h-4 w-4" />
            Rotation Stocks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <SalesOverview
            storeId={storeId}
            periodType={periodType}
            startDate={format(dateRange.from, 'yyyy-MM-dd')}
            endDate={format(dateRange.to, 'yyyy-MM-dd')}
          />
        </TabsContent>

        <TabsContent value="warehouses" className="space-y-4">
          <WarehousePerformanceChart
            warehousePerformance={warehousePerformance || []}
            periodType={periodType}
          />
        </TabsContent>

        <TabsContent value="geographic" className="space-y-4">
          <GeographicHeatmap
            geographicSales={geographicSales || []}
          />
        </TabsContent>

        <TabsContent value="rotation" className="space-y-4">
          <StockRotationTable
            storeId={storeId}
            startDate={format(dateRange.from, 'yyyy-MM-dd')}
            endDate={format(dateRange.to, 'yyyy-MM-dd')}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}



