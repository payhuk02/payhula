/**
 * Section Paramètres Plateforme
 * Commissions, retraits, limites
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { DollarSign, Wallet, Users, Info } from 'lucide-react';
import { usePlatformCustomization } from '@/hooks/admin/usePlatformCustomization';
import { usePlatformSettingsDirect } from '@/hooks/usePlatformSettingsDirect';

interface PlatformSettingsSectionProps {
  onChange?: () => void;
}

export const PlatformSettingsSection = ({ onChange }: PlatformSettingsSectionProps) => {
  const { customizationData, save } = usePlatformCustomization();
  const { settings, updateSettings, isLoading } = usePlatformSettingsDirect();

  const handleSettingChange = (updates: any) => {
    if (settings) {
      updateSettings(updates);
    }
    if (onChange) onChange();
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Commissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Commissions
          </CardTitle>
          <CardDescription>
            Configurez les taux de commission de la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="platform-commission">
              Commission plateforme (%)
            </Label>
            <Input
              id="platform-commission"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={settings?.platform_commission_rate || 10}
              onChange={(e) => {
                handleSettingChange({
                  platform_commission_rate: parseFloat(e.target.value),
                });
              }}
            />
            <p className="text-xs text-muted-foreground">
              Pourcentage prélevé sur chaque vente
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="referral-commission">
              Commission parrainage (%)
            </Label>
            <Input
              id="referral-commission"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={settings?.referral_commission_rate || 2}
              onChange={(e) => {
                handleSettingChange({
                  referral_commission_rate: parseFloat(e.target.value),
                });
              }}
            />
            <p className="text-xs text-muted-foreground">
              Pourcentage versé aux parrains
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Retraits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Retraits
          </CardTitle>
          <CardDescription>
            Paramètres de retrait pour les vendeurs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="min-withdrawal">
              Montant minimum de retrait (FCFA)
            </Label>
            <Input
              id="min-withdrawal"
              type="number"
              min="0"
              value={settings?.min_withdrawal_amount || 10000}
              onChange={(e) => {
                handleSettingChange({
                  min_withdrawal_amount: parseInt(e.target.value),
                });
              }}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Approbation automatique</Label>
              <p className="text-xs text-muted-foreground">
                Les retraits sont approuvés automatiquement
              </p>
            </div>
            <Switch
              checked={settings?.auto_approve_withdrawals || false}
              onCheckedChange={(checked) => {
                handleSettingChange({
                  auto_approve_withdrawals: checked,
                });
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Limites */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Limites
          </CardTitle>
          <CardDescription>
            Limites par utilisateur ou boutique
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="max-products">
              Nombre maximum de produits par boutique
            </Label>
            <Input
              id="max-products"
              type="number"
              min="0"
              value={customizationData?.settings?.limits?.maxProducts || 0}
              onChange={(e) => {
                save('settings', {
                  ...customizationData?.settings,
                  limits: {
                    ...customizationData?.settings?.limits,
                    maxProducts: parseInt(e.target.value) || 0,
                  },
                });
              }}
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" />
              0 = illimité
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="max-stores">
              Nombre maximum de boutiques par utilisateur
            </Label>
            <Input
              id="max-stores"
              type="number"
              min="0"
              value={customizationData?.settings?.limits?.maxStores || 0}
              onChange={(e) => {
                save('settings', {
                  ...customizationData?.settings,
                  limits: {
                    ...customizationData?.settings?.limits,
                    maxStores: parseInt(e.target.value) || 0,
                  },
                });
              }}
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" />
              0 = illimité
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

