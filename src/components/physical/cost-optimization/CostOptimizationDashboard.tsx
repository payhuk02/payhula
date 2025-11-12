/**
 * Cost Optimization Dashboard Component
 * Date: 27 Janvier 2025
 * 
 * Dashboard complet pour l'analyse des coûts, marges et optimisation des prix
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProductCosts, useMarginAnalysis, usePriceOptimizationRecommendations, useCalculateProductMargin, useGeneratePriceOptimizationRecommendations, useUpdateRecommendationStatus, type PriceOptimizationRecommendation, type MarginAnalysis, type ProductCost } from '@/hooks/physical/useCostOptimization';
import { useStore } from '@/hooks/useStore';
import { TrendingUp, TrendingDown, DollarSign, Percent, AlertTriangle, RefreshCw, Calculator, Target } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

// Types étendus avec relation product
interface PriceOptimizationRecommendationWithProduct extends PriceOptimizationRecommendation {
  product?: {
    id: string;
    name: string;
    image_url?: string | null;
  } | null;
}

interface MarginAnalysisWithProduct extends MarginAnalysis {
  product?: {
    id: string;
    name: string;
    image_url?: string | null;
  } | null;
}

interface ProductCostWithProduct extends ProductCost {
  product?: {
    id: string;
    name: string;
    image_url?: string | null;
  } | null;
}

export default function CostOptimizationDashboard() {
  const { store } = useStore();
  const { data: costs, isLoading: costsLoading } = useProductCosts(store?.id);
  const { data: margins, isLoading: marginsLoading } = useMarginAnalysis(store?.id);
  const { data: recommendations, isLoading: recommendationsLoading } = usePriceOptimizationRecommendations(store?.id, {
    status: 'pending',
  });
  const calculateMargin = useCalculateProductMargin();
  const generateRecommendations = useGeneratePriceOptimizationRecommendations();
  const updateStatus = useUpdateRecommendationStatus();

  const handleCalculateMargins = async () => {
    if (!store?.id || !costs || costs.length === 0) return;

    // Calculer marges pour tous les produits avec coûts
    for (const cost of costs) {
      try {
        await calculateMargin.mutateAsync({
          storeId: store.id,
          productId: cost.product_id,
          variantId: cost.variant_id,
        });
      } catch (error) {
        // Continuer avec les autres produits
      }
    }
  };

  const handleGenerateRecommendations = async () => {
    if (!store?.id) return;
    await generateRecommendations.mutateAsync(store.id);
  };

  const handleUpdateRecommendationStatus = async (recommendationId: string, status: string) => {
    await updateStatus.mutateAsync({
      recommendationId,
      status: status as any,
    });
  };

  // Animations
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const actionsRef = useScrollAnimation<HTMLDivElement>();
  const tabsRef = useScrollAnimation<HTMLDivElement>();

  // Calculer statistiques globales
  const costsWithProducts = (costs || []) as ProductCostWithProduct[];
  const marginsWithProducts = (margins || []) as MarginAnalysisWithProduct[];
  const recommendationsWithProducts = (recommendations || []) as PriceOptimizationRecommendationWithProduct[];

  const totalCosts = costsWithProducts.reduce((sum, cost) => sum + (cost.total_cost_per_unit || 0), 0);
  const averageCost = costsWithProducts.length > 0 ? totalCosts / costsWithProducts.length : 0;
  const averageMargin = marginsWithProducts.length > 0
    ? marginsWithProducts.reduce((sum, m) => sum + m.net_margin_percentage, 0) / marginsWithProducts.length
    : 0;
  const urgentRecommendations = recommendationsWithProducts.filter(r => r.priority === 'urgent');
  const highValueRecommendations = recommendationsWithProducts.filter(r => 
    r.expected_profit_change && r.expected_profit_change > 1000
  );

  // Préparer données pour graphiques
  const marginTrendData = marginsWithProducts.slice(0, 10).map(m => ({
    date: format(new Date(m.analysis_date), 'dd MMM', { locale: fr }),
    grossMargin: m.gross_margin_percentage,
    netMargin: m.net_margin_percentage,
    revenue: m.total_revenue,
  }));

  if (costsLoading || marginsLoading || recommendationsLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-full sm:w-auto" />
        </div>
        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Action Buttons */}
      <div
        ref={actionsRef}
        className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        <Button 
          onClick={handleCalculateMargins} 
          variant="outline" 
          disabled={calculateMargin.isPending}
          className="h-10 sm:h-11 flex-1 sm:flex-none"
        >
          <Calculator className={`mr-2 h-4 w-4 ${calculateMargin.isPending ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Calculer marges</span>
          <span className="sm:hidden">Calculer</span>
        </Button>
        <Button 
          onClick={handleGenerateRecommendations} 
          disabled={generateRecommendations.isPending}
          className="h-10 sm:h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex-1 sm:flex-none"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${generateRecommendations.isPending ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Générer recommandations</span>
          <span className="sm:hidden">Recommandations</span>
        </Button>
      </div>

      {/* Stats Cards - Responsive & Animated */}
      <div
        ref={statsRef}
        className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        {[
          {
            label: 'Coût total moyen',
            value: costsWithProducts.length > 0
              ? new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'XOF',
                }).format(averageCost)
              : '0 XOF',
            description: `${costsWithProducts.length} produit${costsWithProducts.length > 1 ? 's' : ''} avec coûts`,
            icon: DollarSign,
            color: 'from-yellow-600 to-orange-600',
          },
          {
            label: 'Marge nette moyenne',
            value: averageMargin > 0 ? `${averageMargin.toFixed(1)}%` : 'N/A',
            description: `${marginsWithProducts.length} analyse${marginsWithProducts.length > 1 ? 's' : ''}`,
            icon: Percent,
            color: averageMargin > 20 ? 'from-green-600 to-emerald-600' : averageMargin > 0 ? 'from-yellow-600 to-orange-600' : 'from-gray-600 to-gray-600',
          },
          {
            label: 'Recommandations urgentes',
            value: urgentRecommendations.length,
            description: 'Nécessitent attention immédiate',
            icon: AlertTriangle,
            color: 'from-red-600 to-rose-600',
          },
          {
            label: 'Opportunités élevées',
            value: highValueRecommendations.length,
            description: 'Impact profit > 1000 XOF',
            icon: Target,
            color: 'from-green-600 to-emerald-600',
          },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className={`text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs - Responsive & Animated */}
      <div
        ref={tabsRef}
        className="animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        <Tabs defaultValue="recommendations" className="w-full">
          <TabsList className="bg-muted/50 backdrop-blur-sm h-auto p-1 w-full sm:w-auto grid grid-cols-2 lg:grid-cols-4 sm:flex overflow-x-auto">
            <TabsTrigger
              value="recommendations"
              className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
            >
              <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Recommandations</span>
              <span className="sm:hidden">Recom.</span>
            </TabsTrigger>
            <TabsTrigger
              value="margins"
              className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
            >
              <Percent className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Analyses de Marge</span>
              <span className="sm:hidden">Marges</span>
            </TabsTrigger>
            <TabsTrigger
              value="costs"
              className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
            >
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Coûts Produits</span>
              <span className="sm:hidden">Coûts</span>
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
            >
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Analytics</span>
            </TabsTrigger>
          </TabsList>

        {/* Recommandations */}
        <TabsContent value="recommendations" className="mt-4 sm:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 dark:text-purple-400" />
                </div>
                Recommandations d'Optimisation de Prix
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {recommendationsWithProducts.length} recommandation{recommendationsWithProducts.length > 1 ? 's' : ''} en attente
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {recommendationsWithProducts.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Target className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <p className="text-sm sm:text-base text-muted-foreground mb-2">
                    Aucune recommandation disponible
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Générez des recommandations pour optimiser vos prix
                  </p>
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Produit</TableHead>
                        <TableHead className="text-xs sm:text-sm">Type</TableHead>
                        <TableHead className="text-xs sm:text-sm">Prix actuel</TableHead>
                        <TableHead className="text-xs sm:text-sm">Prix recommandé</TableHead>
                        <TableHead className="text-xs sm:text-sm">Changement</TableHead>
                        <TableHead className="text-xs sm:text-sm">Impact prévu</TableHead>
                        <TableHead className="text-xs sm:text-sm">Confiance</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recommendationsWithProducts.map((rec) => (
                        <TableRow key={rec.id}>
                          <TableCell className="text-xs sm:text-sm">
                            {rec.product?.name || 'N/A'}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            <Badge variant={
                              rec.recommendation_type === 'increase_price' ? 'default' :
                              rec.recommendation_type === 'decrease_price' ? 'secondary' :
                              'outline'
                            } className="text-xs">
                              {rec.recommendation_type === 'increase_price' ? 'Augmenter' :
                               rec.recommendation_type === 'decrease_price' ? 'Diminuer' :
                               'Maintenir'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'XOF',
                            }).format(rec.current_price)}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            <span className="font-medium">
                              {new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: 'XOF',
                              }).format(rec.recommended_price)}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            <div className="flex items-center gap-1">
                              {rec.price_change_percentage > 0 ? (
                                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                              ) : rec.price_change_percentage < 0 ? (
                                <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />
                              ) : null}
                              <span className={rec.price_change_percentage > 0 ? 'text-green-600' : rec.price_change_percentage < 0 ? 'text-red-600' : ''}>
                                {rec.price_change_percentage > 0 ? '+' : ''}{rec.price_change_percentage.toFixed(1)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            {rec.expected_profit_change ? (
                              <span className="font-medium text-green-600">
                                +{new Intl.NumberFormat('fr-FR', {
                                  style: 'currency',
                                  currency: 'XOF',
                                }).format(rec.expected_profit_change)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs sm:text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            <Badge variant={
                              rec.confidence_level >= 0.8 ? 'default' :
                              rec.confidence_level >= 0.6 ? 'secondary' :
                              'outline'
                            } className="text-xs">
                              {(rec.confidence_level * 100).toFixed(0)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Select
                              value={rec.status}
                              onValueChange={(value) => handleUpdateRecommendationStatus(rec.id, value)}
                            >
                              <SelectTrigger className="w-28 sm:w-32 h-8 sm:h-10 text-xs sm:text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">En attente</SelectItem>
                                <SelectItem value="approved">Approuvé</SelectItem>
                                <SelectItem value="implemented">Implémenté</SelectItem>
                                <SelectItem value="dismissed">Ignoré</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analyses de Marge */}
        <TabsContent value="margins" className="mt-4 sm:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/5 backdrop-blur-sm border border-green-500/20">
                  <Percent className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 dark:text-green-400" />
                </div>
                Analyses de Marge
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {marginsWithProducts.length} analyse{marginsWithProducts.length > 1 ? 's' : ''} disponible{marginsWithProducts.length > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {marginsWithProducts.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Percent className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <p className="text-sm sm:text-base text-muted-foreground mb-2">
                    Aucune analyse disponible
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Calculez les marges pour voir les analyses
                  </p>
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Produit</TableHead>
                        <TableHead className="text-xs sm:text-sm">Période</TableHead>
                        <TableHead className="text-xs sm:text-sm">Revenu</TableHead>
                        <TableHead className="text-xs sm:text-sm">Coûts</TableHead>
                        <TableHead className="text-xs sm:text-sm">Profit net</TableHead>
                        <TableHead className="text-xs sm:text-sm">Marge brute</TableHead>
                        <TableHead className="text-xs sm:text-sm">Marge nette</TableHead>
                        <TableHead className="text-xs sm:text-sm">Profit/unité</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {marginsWithProducts.slice(0, 20).map((margin) => (
                        <TableRow key={margin.id}>
                          <TableCell className="text-xs sm:text-sm">
                            {margin.product?.name || 'N/A'}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            {format(new Date(margin.analysis_period_start), 'dd MMM', { locale: fr })} - {' '}
                            {format(new Date(margin.analysis_period_end), 'dd MMM yyyy', { locale: fr })}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'XOF',
                            }).format(margin.total_revenue)}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'XOF',
                            }).format(margin.total_costs)}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            <span className={margin.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: 'XOF',
                              }).format(margin.net_profit)}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            <Badge variant={
                              margin.gross_margin_percentage >= 50 ? 'default' :
                              margin.gross_margin_percentage >= 30 ? 'secondary' :
                              'outline'
                            } className="text-xs">
                              {margin.gross_margin_percentage.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            <Badge variant={
                              margin.net_margin_percentage >= 20 ? 'default' :
                              margin.net_margin_percentage >= 10 ? 'secondary' :
                              'destructive'
                            } className="text-xs">
                              {margin.net_margin_percentage.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'XOF',
                            }).format(margin.profit_per_unit)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coûts Produits */}
        <TabsContent value="costs" className="mt-4 sm:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500/10 to-orange-500/5 backdrop-blur-sm border border-yellow-500/20">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 dark:text-yellow-400" />
                </div>
                Coûts des Produits
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {costsWithProducts.length} produit{costsWithProducts.length > 1 ? 's' : ''} avec coûts enregistrés
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {costsWithProducts.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <DollarSign className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <p className="text-sm sm:text-base text-muted-foreground mb-2">
                    Aucun coût enregistré
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Ajoutez des coûts pour vos produits pour commencer l'analyse
                  </p>
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Produit</TableHead>
                        <TableHead className="text-xs sm:text-sm">COGS</TableHead>
                        <TableHead className="text-xs sm:text-sm">Fabrication</TableHead>
                        <TableHead className="text-xs sm:text-sm">Emballage</TableHead>
                        <TableHead className="text-xs sm:text-sm">Expédition</TableHead>
                        <TableHead className="text-xs sm:text-sm">Coût total</TableHead>
                        <TableHead className="text-xs sm:text-sm">Date référence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {costsWithProducts.map((cost) => (
                        <TableRow key={cost.id}>
                          <TableCell className="text-xs sm:text-sm">
                            {cost.product?.name || 'N/A'}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'XOF',
                            }).format(cost.cost_of_goods_sold)}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'XOF',
                            }).format(cost.manufacturing_cost)}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'XOF',
                            }).format(cost.packaging_cost)}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'XOF',
                            }).format(cost.shipping_cost_per_unit)}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            <span className="font-medium">
                              {new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: 'XOF',
                              }).format(cost.total_cost_per_unit)}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            {format(new Date(cost.cost_basis_date), 'dd MMM yyyy', { locale: fr })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="mt-4 sm:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5 backdrop-blur-sm border border-blue-500/20">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 dark:text-blue-400" />
                  </div>
                  Évolution des Marges
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Marge brute et nette sur les 10 dernières analyses
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {marginTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={marginTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="grossMargin" stroke="#8884d8" name="Marge brute (%)" />
                      <Line type="monotone" dataKey="netMargin" stroke="#82ca9d" name="Marge nette (%)" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-sm sm:text-base mb-2">Pas assez de données</p>
                    <p className="text-xs sm:text-sm">Calculez les marges pour voir les graphiques</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20">
                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 dark:text-purple-400" />
                  </div>
                  Revenus par Période
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Revenus totaux sur les 10 dernières analyses
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {marginTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={marginTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="revenue" fill="#8884d8" name="Revenus (XOF)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                    <DollarSign className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-sm sm:text-base mb-2">Pas assez de données</p>
                    <p className="text-xs sm:text-sm">Calculez les marges pour voir les graphiques</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}

