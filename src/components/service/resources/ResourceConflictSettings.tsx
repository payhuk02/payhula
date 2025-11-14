/**
 * Resource Conflict Settings Component
 * Date: 28 Janvier 2025
 * 
 * Paramètres de détection et gestion des conflits de ressources
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Settings, Save, Loader2, AlertTriangle } from 'lucide-react';

interface ResourceConflictSettingsProps {
  storeId: string;
}

export function ResourceConflictSettings({
  storeId,
}: ResourceConflictSettingsProps) {
  const { toast } = useToast();

  const [settings, setSettings] = useState({
    autoDetectConflicts: true,
    detectIntervalMinutes: 30,
    preventDoubleBooking: true,
    checkResourceAvailability: true,
    checkCapacity: true,
    checkTimeSlots: true,
    notifyOnConflict: true,
    autoResolveConflicts: false,
    conflictResolutionMethod: 'manual' as 'manual' | 'auto' | 'suggest',
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Save to database
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call

      toast({
        title: '✅ Paramètres sauvegardés',
        description: 'Les paramètres de détection de conflits ont été sauvegardés',
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

  return (
    <div className="space-y-6">
      {/* Detection Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Détection Automatique
          </CardTitle>
          <CardDescription>
            Configurez la détection automatique des conflits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Détection automatique des conflits</Label>
              <p className="text-sm text-muted-foreground">
                Détecter automatiquement les conflits de ressources
              </p>
            </div>
            <Switch
              checked={settings.autoDetectConflicts}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, autoDetectConflicts: checked })
              }
            />
          </div>

          {settings.autoDetectConflicts && (
            <div className="space-y-2">
              <Label>Intervalle de détection (minutes)</Label>
              <Input
                type="number"
                min={5}
                max={1440}
                value={settings.detectIntervalMinutes}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    detectIntervalMinutes: parseInt(e.target.value) || 30,
                  })
                }
              />
              <p className="text-sm text-muted-foreground">
                Fréquence de vérification des conflits (5-1440 minutes)
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notifications sur conflit</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir des notifications lorsqu'un conflit est détecté
              </p>
            </div>
            <Switch
              checked={settings.notifyOnConflict}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, notifyOnConflict: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Prevention Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Prévention des Conflits</CardTitle>
          <CardDescription>
            Options pour prévenir les conflits lors de la création de réservations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Empêcher les doubles réservations</Label>
              <p className="text-sm text-muted-foreground">
                Empêcher la réservation d'un staff déjà réservé
              </p>
            </div>
            <Switch
              checked={settings.preventDoubleBooking}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, preventDoubleBooking: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Vérifier la disponibilité des ressources</Label>
              <p className="text-sm text-muted-foreground">
                Vérifier que les ressources requises sont disponibles
              </p>
            </div>
            <Switch
              checked={settings.checkResourceAvailability}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, checkResourceAvailability: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Vérifier la capacité</Label>
              <p className="text-sm text-muted-foreground">
                Vérifier que la capacité maximale n'est pas dépassée
              </p>
            </div>
            <Switch
              checked={settings.checkCapacity}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, checkCapacity: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Vérifier les créneaux horaires</Label>
              <p className="text-sm text-muted-foreground">
                Vérifier que le créneau horaire est disponible
              </p>
            </div>
            <Switch
              checked={settings.checkTimeSlots}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, checkTimeSlots: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Resolution Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Résolution des Conflits</CardTitle>
          <CardDescription>
            Configurez comment les conflits sont résolus
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Résolution automatique</Label>
              <p className="text-sm text-muted-foreground">
                Résoudre automatiquement les conflits simples
              </p>
            </div>
            <Switch
              checked={settings.autoResolveConflicts}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, autoResolveConflicts: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Méthode de résolution</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={settings.conflictResolutionMethod}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  conflictResolutionMethod: e.target.value as 'manual' | 'auto' | 'suggest',
                })
              }
            >
              <option value="manual">Manuelle (nécessite validation)</option>
              <option value="suggest">Suggérer des solutions</option>
              <option value="auto">Automatique (si activé)</option>
            </select>
            <p className="text-sm text-muted-foreground">
              Comment les conflits sont gérés lorsqu'ils sont détectés
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
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
    </div>
  );
}

