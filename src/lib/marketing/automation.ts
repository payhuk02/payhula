/**
 * Marketing Automation System
 * Système d'automatisation marketing pour emails, campagnes et workflows
 */

import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import { sendEmail as sendEmailViaSendGrid } from '@/lib/sendgrid';
import type { SendEmailPayload } from '@/types/email';

export interface EmailCampaign {
  id: string;
  name: string;
  type: 'transactional' | 'marketing' | 'newsletter' | 'abandoned_cart' | 'welcome';
  subject: string;
  template: string;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
  scheduledAt?: string;
  targetAudience?: {
    segment?: string;
    filters?: Record<string, any>;
  };
  metrics?: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  };
}

export interface WorkflowTrigger {
  type: 'event' | 'schedule' | 'condition';
  event?: string;
  schedule?: string;
  condition?: Record<string, any>;
}

export interface WorkflowAction {
  type: 'send_email' | 'send_sms' | 'update_tag' | 'add_to_segment' | 'webhook';
  config: Record<string, any>;
}

export interface MarketingWorkflow {
  id: string;
  name: string;
  description?: string;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  status: 'active' | 'paused' | 'draft';
  createdAt: string;
  updatedAt: string;
}

/**
 * Classe principale pour le marketing automation
 */
export class MarketingAutomation {
  /**
   * Envoyer un email transactionnel
   */
  async sendTransactionalEmail(
    to: string,
    template: string,
    data: Record<string, any>
  ): Promise<boolean> {
    try {
      const result = await sendEmailViaSendGrid({
        to,
        templateSlug: template,
        variables: data,
        type: 'transactional',
      } as SendEmailPayload);
      const emailSent = result.success;

      // Logger l'envoi
      await this.logEmailEvent({
        email: to,
        type: 'transactional',
        template,
        status: emailSent ? 'sent' : 'failed',
        data,
      });

      return emailSent;
    } catch (error) {
      logger.error('MarketingAutomation.sendTransactionalEmail error', { error, to, template });
      return false;
    }
  }

  /**
   * Envoyer un email marketing
   */
  async sendMarketingEmail(
    to: string,
    campaignId: string,
    data: Record<string, any>
  ): Promise<boolean> {
    try {
      // Vérifier si l'utilisateur a désabonné
      const isUnsubscribed = await this.isUnsubscribed(to);
      if (isUnsubscribed) {
        logger.warn('User unsubscribed, skipping email', { email: to });
        return false;
      }

      // Récupérer la campagne
      const campaign = await this.getCampaign(campaignId);
      if (!campaign || campaign.status !== 'active') {
        logger.warn('Campaign not found or not active', { campaignId });
        return false;
      }

      const result = await sendEmailViaSendGrid({
        to,
        templateSlug: campaign.template,
        variables: {
          ...data,
          unsubscribeUrl: `${window.location.origin}/unsubscribe?email=${encodeURIComponent(to)}&campaign=${campaignId}`,
        },
        type: 'marketing',
      } as SendEmailPayload);
      const emailSent = result.success;

      // Logger l'envoi
      await this.logEmailEvent({
        email: to,
        type: 'marketing',
        campaignId,
        template: campaign.template,
        status: emailSent ? 'sent' : 'failed',
        data,
      });

      // Mettre à jour les métriques de la campagne
      if (emailSent) {
        await this.updateCampaignMetrics(campaignId, 'sent');
      }

      return emailSent;
    } catch (error) {
      logger.error('MarketingAutomation.sendMarketingEmail error', { error, to, campaignId });
      return false;
    }
  }

  /**
   * Envoyer un email d'abandon de panier
   */
  async sendAbandonedCartEmail(userId: string, cartItems: any[]): Promise<boolean> {
    try {
      // Récupérer les informations utilisateur
      const { data: user } = await supabase.auth.admin.getUserById(userId);
      if (!user || !user.email) {
        return false;
      }

      // Vérifier si l'utilisateur a désabonné
      const isUnsubscribed = await this.isUnsubscribed(user.email);
      if (isUnsubscribed) {
        return false;
      }

      const result = await sendEmailViaSendGrid({
        to: user.email,
        templateSlug: 'abandoned_cart',
        variables: {
          userName: user.user_metadata?.name || 'Client',
          cartItems,
          cartUrl: `${window.location.origin}/cart`,
        },
        type: 'transactional',
      } as SendEmailPayload);
      const emailSent = result.success;

      // Logger l'envoi
      await this.logEmailEvent({
        email: user.email,
        type: 'abandoned_cart',
        userId,
        status: emailSent ? 'sent' : 'failed',
        data: { cartItemsCount: cartItems.length },
      });

      return emailSent;
    } catch (error) {
      logger.error('MarketingAutomation.sendAbandonedCartEmail error', { error, userId });
      return false;
    }
  }

  /**
   * Envoyer un email de bienvenue
   */
  async sendWelcomeEmail(userId: string): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.admin.getUserById(userId);
      if (!user || !user.email) {
        return false;
      }

      const result = await sendEmailViaSendGrid({
        to: user.email,
        templateSlug: 'welcome',
        variables: {
          userName: user.user_metadata?.name || 'Client',
          dashboardUrl: `${window.location.origin}/dashboard`,
        },
        type: 'transactional',
      } as SendEmailPayload);
      const emailSent = result.success;

      // Logger l'envoi
      await this.logEmailEvent({
        email: user.email,
        type: 'welcome',
        userId,
        status: emailSent ? 'sent' : 'failed',
      });

      return emailSent;
    } catch (error) {
      logger.error('MarketingAutomation.sendWelcomeEmail error', { error, userId });
      return false;
    }
  }

  /**
   * Créer une campagne email
   */
  async createCampaign(campaign: Omit<EmailCampaign, 'id' | 'metrics'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('email_campaigns')
        .insert({
          name: campaign.name,
          type: campaign.type,
          subject: campaign.subject,
          template: campaign.template,
          status: campaign.status,
          scheduled_at: campaign.scheduledAt,
          target_audience: campaign.targetAudience,
          metrics: {
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            bounced: 0,
            unsubscribed: 0,
          },
        })
        .select('id')
        .single();

      if (error || !data) {
        throw new Error(`Failed to create campaign: ${error?.message || 'Unknown error'}`);
      }

      return data.id;
    } catch (error) {
      logger.error('MarketingAutomation.createCampaign error', { error, campaign });
      throw error;
    }
  }

  /**
   * Exécuter un workflow
   */
  async executeWorkflow(workflowId: string, context: Record<string, any>): Promise<boolean> {
    try {
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow || workflow.status !== 'active') {
        logger.warn('Workflow not found or not active', { workflowId });
        return false;
      }

      // Vérifier le trigger
      const shouldExecute = await this.checkTrigger(workflow.trigger, context);
      if (!shouldExecute) {
        return false;
      }

      // Exécuter les actions
      for (const action of workflow.actions) {
        await this.executeAction(action, context);
      }

      return true;
    } catch (error) {
      logger.error('MarketingAutomation.executeWorkflow error', { error, workflowId, context });
      return false;
    }
  }

  /**
   * Vérifier si un utilisateur a désabonné
   */
  private async isUnsubscribed(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('email_unsubscribes')
        .select('id')
        .eq('email', email)
        .single();

      return !error && !!data;
    } catch (error) {
      logger.error('MarketingAutomation.isUnsubscribed error', { error, email });
      return false;
    }
  }

  /**
   * Récupérer une campagne
   */
  private async getCampaign(campaignId: string): Promise<EmailCampaign | null> {
    try {
      const { data, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        type: data.type,
        subject: data.subject,
        template: data.template,
        status: data.status,
        scheduledAt: data.scheduled_at,
        targetAudience: data.target_audience,
        metrics: data.metrics,
      };
    } catch (error) {
      logger.error('MarketingAutomation.getCampaign error', { error, campaignId });
      return null;
    }
  }

  /**
   * Récupérer un workflow
   */
  private async getWorkflow(workflowId: string): Promise<MarketingWorkflow | null> {
    try {
      const { data, error } = await supabase
        .from('marketing_workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        trigger: data.trigger,
        actions: data.actions,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      logger.error('MarketingAutomation.getWorkflow error', { error, workflowId });
      return null;
    }
  }

  /**
   * Vérifier un trigger
   */
  private async checkTrigger(trigger: WorkflowTrigger, context: Record<string, any>): Promise<boolean> {
    switch (trigger.type) {
      case 'event':
        return context.event === trigger.event;
      case 'schedule':
        // TODO: Implémenter la vérification de schedule
        return true;
      case 'condition':
        // TODO: Implémenter la vérification de condition
        return true;
      default:
        return false;
    }
  }

  /**
   * Exécuter une action
   */
  private async executeAction(action: WorkflowAction, context: Record<string, any>): Promise<void> {
    switch (action.type) {
      case 'send_email':
        await this.sendMarketingEmail(
          context.email || context.user?.email,
          action.config.campaignId,
          { ...context, ...action.config.data }
        );
        break;
      case 'send_sms':
        // TODO: Implémenter l'envoi SMS
        logger.warn('SMS sending not implemented yet');
        break;
      case 'update_tag':
        // TODO: Implémenter la mise à jour de tags
        logger.warn('Tag update not implemented yet');
        break;
      case 'add_to_segment':
        // TODO: Implémenter l'ajout à un segment
        logger.warn('Segment addition not implemented yet');
        break;
      case 'webhook':
        // TODO: Implémenter l'appel webhook
        logger.warn('Webhook call not implemented yet');
        break;
    }
  }

  /**
   * Logger un événement email
   */
  private async logEmailEvent(event: {
    email: string;
    type: string;
    campaignId?: string;
    userId?: string;
    template?: string;
    status: string;
    data?: Record<string, any>;
  }): Promise<void> {
    try {
      await supabase.from('email_events').insert({
        email: event.email,
        type: event.type,
        campaign_id: event.campaignId,
        user_id: event.userId,
        template: event.template,
        status: event.status,
        metadata: event.data,
      });
    } catch (error) {
      logger.error('MarketingAutomation.logEmailEvent error', { error, event });
    }
  }

  /**
   * Mettre à jour les métriques d'une campagne
   */
  private async updateCampaignMetrics(campaignId: string, metric: keyof EmailCampaign['metrics']): Promise<void> {
    try {
      const { data: campaign } = await supabase
        .from('email_campaigns')
        .select('metrics')
        .eq('id', campaignId)
        .single();

      if (!campaign) {
        return;
      }

      const metrics = campaign.metrics || {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        unsubscribed: 0,
      };

      metrics[metric] = (metrics[metric] || 0) + 1;

      await supabase
        .from('email_campaigns')
        .update({ metrics })
        .eq('id', campaignId);
    } catch (error) {
      logger.error('MarketingAutomation.updateCampaignMetrics error', { error, campaignId, metric });
    }
  }
}

// Instance singleton
export const marketingAutomation = new MarketingAutomation();

