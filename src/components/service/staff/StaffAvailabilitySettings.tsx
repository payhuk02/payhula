/**
 * Staff Availability Settings Component
 * Date: 28 Janvier 2025
 * 
 * Paramètres de disponibilité du staff
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Settings, Save, Loader2 } from 'lucide-react';

interface StaffAvailabilitySettingsProps {
  storeId: string;
  serviceId?: string;
}

export function StaffAvailabilitySettings({
  storeId,
  serviceId,
}: StaffAvailabilitySettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState({
    autoBlockOnTimeOff: true,
    maxBookingsPerDay: 8,
    bookingDensityWarningThreshold: 70,
    bookingDensityCriticalThreshold: 85,
    defaultWorkHoursStart: '09:00',
    defaultWorkHoursEnd: '18:00',
    bufferTimeBetweenBookings: 15,
  });

  const [isSaving, setIsSaving] = useState(false);

  // Load settings (if stored in database)
  const { isLoading } = useQuery({
    queryKey: ['staff-availability-settings', storeId],
    queryFn: async () => {
      // TODO: Load from database if settings table exists
      return settings;
    },
    enabled: false, // Disabled for now, using local state
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Save to database
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call

      toast({
        title: '✅ Paramètres sauvegardés',
        description: 'Les paramètres de disponibilité ont été sauvegardés',
      });
    } catch (error: any) {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de sauvegarder les paramètres',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Paramètres de Disponibilité
          </CardTitle>
          <CardDescription>
            Configurez les paramètres par défaut pour la gestion des disponibilités
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto-block on time off */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Bloquer automatiquement les réservations en congé</Label>
              <p className="text-sm text-muted-foreground">
                Les réservations seront automatiquement bloquées pendant les congés approuvés
              </p>
            </div>
            <Switch
              checked={settings.autoBlockOnTimeOff}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, autoBlockOnTimeOff: checked })
              }
            />
          </div>

          {/* Max bookings per day */}
          <div className="space-y-2">
            <Label>Nombre maximum de réservations par jour</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={settings.maxBookingsPerDay}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maxBookingsPerDay: parseInt(e.target.value) || 8,
                })
              }
            />
            <p className="text-sm text-muted-foreground">
              Nombre maximum de réservations qu'un membre du staff peut avoir par jour
            </p>
          </div>

          {/* Booking density thresholds */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Seuil d'avertissement (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={settings.bookingDensityWarningThreshold}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    bookingDensityWarningThreshold: parseInt(e.target.value) || 70,
                  })
                }
              />
              <p className="text-sm text-muted-foreground">
                Pourcentage de charge pour déclencher un avertissement
              </p>
            </div>
            <div className="space-y-2">
              <Label>Seuil critique (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={settings.bookingDensityCriticalThreshold}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    bookingDensityCriticalThreshold: parseInt(e.target.value) || 85,
                  })
                }
              />
              <p className="text-sm text-muted-foreground">
                Pourcentage de charge pour déclencher une alerte critique
              </p>
            </div>
          </div>

          {/* Default work hours */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Heure de début par défaut</Label>
              <Input
                type="time"
                value={settings.defaultWorkHoursStart}
                onChange={(e) =>
                  setSettings({ ...settings, defaultWorkHoursStart: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Heure de fin par défaut</Label>
              <Input
                type="time"
                value={settings.defaultWorkHoursEnd}
                onChange={(e) =>
                  setSettings({ ...settings, defaultWorkHoursEnd: e.target.value })
                }
              />
            </div>
          </div>

          {/* Buffer time */}
          <div className="space-y-2">
            <Label>Temps de transition entre réservations (minutes)</Label>
            <Input
              type="number"
              min={0}
              max={60}
              value={settings.bufferTimeBetweenBookings}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  bufferTimeBetweenBookings: parseInt(e.target.value) || 15,
                })
              }
            />
            <p className="text-sm text-muted-foreground">
              Temps de transition recommandé entre deux réservations consécutives
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder les paramètres
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

