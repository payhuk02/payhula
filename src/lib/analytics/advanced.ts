/**
 * Advanced Analytics System
 * Système d'analytics avancés avec prédictions et insights
 */

import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsMetric {
  name: string;
  value: number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'stable';
  trend?: 'up' | 'down' | 'stable';
  period?: string;
}

export interface AnalyticsInsight {
  type: 'revenue' | 'conversion' | 'traffic' | 'engagement' | 'retention';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendation?: string;
  data?: Record<string, unknown>;
}

export interface AnalyticsPrediction {
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: number; // 0-1
  timeframe: string;
  factors?: string[];
}

export interface AnalyticsDashboard {
  metrics: AnalyticsMetric[];
  insights: AnalyticsInsight[];
  predictions: AnalyticsPrediction[];
  period: {
    start: string;
    end: string;
  };
}

/**
 * Classe principale pour les analytics avancés
 */
export class AdvancedAnalytics {
  /**
   * Obtenir le tableau de bord analytics
   */
  async getDashboard(
    storeId?: string,
    period: { start: string; end: string } = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    }
  ): Promise<AnalyticsDashboard> {
    try {
      const [metrics, insights, predictions] = await Promise.all([
        this.getMetrics(storeId, period),
        this.getInsights(storeId, period),
        this.getPredictions(storeId, period),
      ]);

      return {
        metrics,
        insights,
        predictions,
        period,
      };
    } catch (error) {
      logger.error('AdvancedAnalytics.getDashboard error', { error, storeId, period });
      throw error;
    }
  }

  /**
   * Obtenir les métriques
   */
  async getMetrics(
    storeId?: string,
    period?: { start: string; end: string }
  ): Promise<AnalyticsMetric[]> {
    try {
      const metrics: AnalyticsMetric[] = [];

      // Revenue
      const revenue = await this.calculateRevenue(storeId, period);
      metrics.push({
        name: 'Revenue',
        value: revenue.current,
        change: revenue.change,
        changeType: revenue.change > 0 ? 'increase' : revenue.change < 0 ? 'decrease' : 'stable',
        trend: revenue.change > 0 ? 'up' : revenue.change < 0 ? 'down' : 'stable',
        period: '30 days',
      });

      // Conversion Rate
      const conversionRate = await this.calculateConversionRate(storeId, period);
      metrics.push({
        name: 'Conversion Rate',
        value: conversionRate.current,
        change: conversionRate.change,
        changeType: conversionRate.change > 0 ? 'increase' : conversionRate.change < 0 ? 'decrease' : 'stable',
        trend: conversionRate.change > 0 ? 'up' : conversionRate.change < 0 ? 'down' : 'stable',
        period: '30 days',
      });

      // Traffic
      const traffic = await this.calculateTraffic(storeId, period);
      metrics.push({
        name: 'Traffic',
        value: traffic.current,
        change: traffic.change,
        changeType: traffic.change > 0 ? 'increase' : traffic.change < 0 ? 'decrease' : 'stable',
        trend: traffic.change > 0 ? 'up' : traffic.change < 0 ? 'down' : 'stable',
        period: '30 days',
      });

      // Average Order Value
      const aov = await this.calculateAOV(storeId, period);
      metrics.push({
        name: 'Average Order Value',
        value: aov.current,
        change: aov.change,
        changeType: aov.change > 0 ? 'increase' : aov.change < 0 ? 'decrease' : 'stable',
        trend: aov.change > 0 ? 'up' : aov.change < 0 ? 'down' : 'stable',
        period: '30 days',
      });

      return metrics;
    } catch (error) {
      logger.error('AdvancedAnalytics.getMetrics error', { error, storeId, period });
      return [];
    }
  }

  /**
   * Obtenir les insights
   */
  async getInsights(
    storeId?: string,
    period?: { start: string; end: string }
  ): Promise<AnalyticsInsight[]> {
    try {
      const insights: AnalyticsInsight[] = [];

      // Analyser les tendances
      const revenueTrend = await this.analyzeRevenueTrend(storeId, period);
      if (revenueTrend) {
        insights.push(revenueTrend);
      }

      const conversionTrend = await this.analyzeConversionTrend(storeId, period);
      if (conversionTrend) {
        insights.push(conversionTrend);
      }

      const trafficTrend = await this.analyzeTrafficTrend(storeId, period);
      if (trafficTrend) {
        insights.push(trafficTrend);
      }

      return insights;
    } catch (error) {
      logger.error('AdvancedAnalytics.getInsights error', { error, storeId, period });
      return [];
    }
  }

  /**
   * Obtenir les prédictions
   */
  async getPredictions(
    storeId?: string,
    period?: { start: string; end: string }
  ): Promise<AnalyticsPrediction[]> {
    try {
      const predictions: AnalyticsPrediction[] = [];

      // Prédiction de revenue
      const revenuePrediction = await this.predictRevenue(storeId, period);
      if (revenuePrediction) {
        predictions.push(revenuePrediction);
      }

      // Prédiction de conversion
      const conversionPrediction = await this.predictConversion(storeId, period);
      if (conversionPrediction) {
        predictions.push(conversionPrediction);
      }

      return predictions;
    } catch (error) {
      logger.error('AdvancedAnalytics.getPredictions error', { error, storeId, period });
      return [];
    }
  }

  /**
   * Calculer le revenue
   */
  private async calculateRevenue(
    storeId?: string,
    period?: { start: string; end: string }
  ): Promise<{ current: number; previous: number; change: number }> {
    try {
      let query = supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'completed')
        .eq('payment_status', 'paid');

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      if (period) {
        query = query.gte('created_at', period.start).lte('created_at', period.end);
      } else {
        const end = new Date();
        const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        query = query.gte('created_at', start.toISOString()).lte('created_at', end.toISOString());
      }

      const { data: orders } = await query;

      const current = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      // Calculer le revenue de la période précédente
      const previousPeriod = {
        start: period
          ? new Date(new Date(period.start).getTime() - (new Date(period.end).getTime() - new Date(period.start).getTime())).toISOString()
          : new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        end: period?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      let previousQuery = supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'completed')
        .eq('payment_status', 'paid')
        .gte('created_at', previousPeriod.start)
        .lte('created_at', previousPeriod.end);

      if (storeId) {
        previousQuery = previousQuery.eq('store_id', storeId);
      }

      const { data: previousOrders } = await previousQuery;
      const previous = previousOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;

      return { current, previous, change };
    } catch (error) {
      logger.error('AdvancedAnalytics.calculateRevenue error', { error, storeId, period });
      return { current: 0, previous: 0, change: 0 };
    }
  }

  /**
   * Calculer le taux de conversion
   */
  private async calculateConversionRate(
    storeId?: string,
    period?: { start: string; end: string }
  ): Promise<{ current: number; previous: number; change: number }> {
    try {
      // TODO: Implémenter le calcul du taux de conversion
      // Pour l'instant, retourner des valeurs mockées
      return { current: 2.5, previous: 2.3, change: 8.7 };
    } catch (error) {
      logger.error('AdvancedAnalytics.calculateConversionRate error', { error, storeId, period });
      return { current: 0, previous: 0, change: 0 };
    }
  }

  /**
   * Calculer le traffic
   */
  private async calculateTraffic(
    storeId?: string,
    period?: { start: string; end: string }
  ): Promise<{ current: number; previous: number; change: number }> {
    try {
      // TODO: Implémenter le calcul du traffic
      // Pour l'instant, retourner des valeurs mockées
      return { current: 10000, previous: 9500, change: 5.3 };
    } catch (error) {
      logger.error('AdvancedAnalytics.calculateTraffic error', { error, storeId, period });
      return { current: 0, previous: 0, change: 0 };
    }
  }

  /**
   * Calculer l'Average Order Value
   */
  private async calculateAOV(
    storeId?: string,
    period?: { start: string; end: string }
  ): Promise<{ current: number; previous: number; change: number }> {
    try {
      const revenue = await this.calculateRevenue(storeId, period);

      let query = supabase.from('orders').select('id').eq('status', 'completed').eq('payment_status', 'paid');

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      if (period) {
        query = query.gte('created_at', period.start).lte('created_at', period.end);
      }

      const { data: orders } = await query;
      const orderCount = orders?.length || 1;

      const current = revenue.current / orderCount;
      const previous = revenue.previous / (orderCount || 1);
      const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;

      return { current, previous, change };
    } catch (error) {
      logger.error('AdvancedAnalytics.calculateAOV error', { error, storeId, period });
      return { current: 0, previous: 0, change: 0 };
    }
  }

  /**
   * Analyser la tendance de revenue
   */
  private async analyzeRevenueTrend(
    storeId?: string,
    period?: { start: string; end: string }
  ): Promise<AnalyticsInsight | null> {
    try {
      const revenue = await this.calculateRevenue(storeId, period);

      if (revenue.change > 10) {
        return {
          type: 'revenue',
          title: 'Revenue en forte hausse',
          description: `Le revenue a augmenté de ${revenue.change.toFixed(1)}% par rapport à la période précédente.`,
          impact: 'high',
          recommendation: 'Continuez à maintenir cette croissance en optimisant vos campagnes marketing.',
          data: { change: revenue.change, current: revenue.current, previous: revenue.previous },
        };
      } else if (revenue.change < -10) {
        return {
          type: 'revenue',
          title: 'Revenue en baisse',
          description: `Le revenue a diminué de ${Math.abs(revenue.change).toFixed(1)}% par rapport à la période précédente.`,
          impact: 'high',
          recommendation: 'Analysez les causes de la baisse et ajustez votre stratégie marketing.',
          data: { change: revenue.change, current: revenue.current, previous: revenue.previous },
        };
      }

      return null;
    } catch (error) {
      logger.error('AdvancedAnalytics.analyzeRevenueTrend error', { error, storeId, period });
      return null;
    }
  }

  /**
   * Analyser la tendance de conversion
   */
  private async analyzeConversionTrend(
    storeId?: string,
    period?: { start: string; end: string }
  ): Promise<AnalyticsInsight | null> {
    try {
      const conversionRate = await this.calculateConversionRate(storeId, period);

      if (conversionRate.change > 5) {
        return {
          type: 'conversion',
          title: 'Taux de conversion en hausse',
          description: `Le taux de conversion a augmenté de ${conversionRate.change.toFixed(1)}%.`,
          impact: 'medium',
          recommendation: 'Vos optimisations de conversion fonctionnent bien. Continuez à tester et améliorer.',
          data: { change: conversionRate.change, current: conversionRate.current },
        };
      }

      return null;
    } catch (error) {
      logger.error('AdvancedAnalytics.analyzeConversionTrend error', { error, storeId, period });
      return null;
    }
  }

  /**
   * Analyser la tendance de traffic
   */
  private async analyzeTrafficTrend(
    storeId?: string,
    period?: { start: string; end: string }
  ): Promise<AnalyticsInsight | null> {
    try {
      const traffic = await this.calculateTraffic(storeId, period);

      if (traffic.change > 10) {
        return {
          type: 'traffic',
          title: 'Traffic en hausse',
          description: `Le traffic a augmenté de ${traffic.change.toFixed(1)}% par rapport à la période précédente.`,
          impact: 'medium',
          recommendation: 'Profitez de cette augmentation de traffic pour améliorer votre taux de conversion.',
          data: { change: traffic.change, current: traffic.current },
        };
      }

      return null;
    } catch (error) {
      logger.error('AdvancedAnalytics.analyzeTrafficTrend error', { error, storeId, period });
      return null;
    }
  }

  /**
   * Prédire le revenue
   */
  private async predictRevenue(
    storeId?: string,
    period?: { start: string; end: string }
  ): Promise<AnalyticsPrediction | null> {
    try {
      const revenue = await this.calculateRevenue(storeId, period);

      // Prédiction simple basée sur la tendance
      const predictedValue = revenue.current * (1 + revenue.change / 100);
      const confidence = Math.min(0.85, 0.5 + Math.abs(revenue.change) / 100);

      return {
        metric: 'Revenue',
        currentValue: revenue.current,
        predictedValue,
        confidence,
        timeframe: '30 days',
        factors: ['Tendance actuelle', 'Saisonnalité', 'Campagnes marketing'],
      };
    } catch (error) {
      logger.error('AdvancedAnalytics.predictRevenue error', { error, storeId, period });
      return null;
    }
  }

  /**
   * Prédire le taux de conversion
   */
  private async predictConversion(
    storeId?: string,
    period?: { start: string; end: string }
  ): Promise<AnalyticsPrediction | null> {
    try {
      const conversionRate = await this.calculateConversionRate(storeId, period);

      const predictedValue = conversionRate.current * (1 + conversionRate.change / 100);
      const confidence = Math.min(0.8, 0.5 + Math.abs(conversionRate.change) / 100);

      return {
        metric: 'Conversion Rate',
        currentValue: conversionRate.current,
        predictedValue,
        confidence,
        timeframe: '30 days',
        factors: ['Optimisations UX', 'Qualité du traffic', 'Prix des produits'],
      };
    } catch (error) {
      logger.error('AdvancedAnalytics.predictConversion error', { error, storeId, period });
      return null;
    }
  }
}

// Instance singleton
export const advancedAnalytics = new AdvancedAnalytics();


