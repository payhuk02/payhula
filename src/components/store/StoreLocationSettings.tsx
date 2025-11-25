/**
 * StoreLocationSettings Component
 * Composant pour la configuration de la localisation et des horaires
 * Phase 1 - Fonctionnalités avancées
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { MapPin, Clock, Globe } from 'lucide-react';
import { useSpaceInputFix } from '@/hooks/useSpaceInputFix';
import { StoreOpeningHours } from '@/hooks/useStores';

interface StoreLocationSettingsProps {
  // Adresse
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  // Horaires
  openingHours: StoreOpeningHours | null;
  // Callbacks
  onAddressChange: (field: string, value: string) => void;
  onLocationChange: (field: string, value: number | null) => void;
  onTimezoneChange: (value: string) => void;
  onOpeningHoursChange: (hours: StoreOpeningHours) => void;
}

const DAYS = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
] as const;

const TIMEZONES = [
  { value: 'Africa/Ouagadougou', label: 'Ouagadougou (GMT+0)' },
  { value: 'Africa/Abidjan', label: 'Abidjan (GMT+0)' },
  { value: 'Africa/Dakar', label: 'Dakar (GMT+0)' },
  { value: 'Europe/Paris', label: 'Paris (GMT+1)' },
  { value: 'America/New_York', label: 'New York (GMT-5)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (GMT-8)' },
];

export const StoreLocationSettings: React.FC<StoreLocationSettingsProps> = ({
  addressLine1,
  addressLine2,
  city,
  stateProvince,
  postalCode,
  country,
  latitude,
  longitude,
  timezone,
  openingHours,
  onAddressChange,
  onLocationChange,
  onTimezoneChange,
  onOpeningHoursChange,
}) => {
  const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();

  const defaultHours: StoreOpeningHours = openingHours || {
    monday: { open: '09:00', close: '18:00', closed: false },
    tuesday: { open: '09:00', close: '18:00', closed: false },
    wednesday: { open: '09:00', close: '18:00', closed: false },
    thursday: { open: '09:00', close: '18:00', closed: false },
    friday: { open: '09:00', close: '18:00', closed: false },
    saturday: { open: '09:00', close: '18:00', closed: false },
    sunday: { open: '09:00', close: '18:00', closed: false },
    timezone: timezone || 'Africa/Ouagadougou',
    special_hours: [],
  };

  const handleDayChange = (day: keyof StoreOpeningHours, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    const updatedHours = {
      ...defaultHours,
      [day]: {
        ...defaultHours[day],
        [field]: value,
      },
    };
    onOpeningHoursChange(updatedHours);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Localisation et horaires
        </CardTitle>
        <CardDescription>
          Configurez l'adresse complète et les horaires d'ouverture de votre boutique
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Adresse complète */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Adresse complète</h4>
          
          <div className="space-y-2">
            <Label htmlFor="address_line1">Adresse ligne 1 *</Label>
            <Input
              id="address_line1"
              value={addressLine1}
              onChange={(e) => onAddressChange('address_line1', e.target.value)}
              onKeyDown={handleSpaceKeyDown}
              placeholder="123 Rue de la Paix"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_line2">Adresse ligne 2</Label>
            <Input
              id="address_line2"
              value={addressLine2}
              onChange={(e) => onAddressChange('address_line2', e.target.value)}
              onKeyDown={handleSpaceKeyDown}
              placeholder="Appartement, bureau, etc."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Ville *</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => onAddressChange('city', e.target.value)}
                onKeyDown={handleSpaceKeyDown}
                placeholder="Ouagadougou"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state_province">État/Province</Label>
              <Input
                id="state_province"
                value={stateProvince}
                onChange={(e) => onAddressChange('state_province', e.target.value)}
                onKeyDown={handleSpaceKeyDown}
                placeholder="Kadiogo"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postal_code">Code postal</Label>
              <Input
                id="postal_code"
                value={postalCode}
                onChange={(e) => onAddressChange('postal_code', e.target.value)}
                onKeyDown={handleSpaceKeyDown}
                placeholder="01 BP"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Pays *</Label>
              <Input
                id="country"
                value={country}
                onChange={(e) => onAddressChange('country', e.target.value)}
                onKeyDown={handleSpaceKeyDown}
                placeholder="Burkina Faso"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={latitude || ''}
                onChange={(e) => onLocationChange('latitude', e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="12.3714"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={longitude || ''}
                onChange={(e) => onLocationChange('longitude', e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="-1.5197"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Fuseau horaire</Label>
            <Select value={timezone} onValueChange={onTimezoneChange}>
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Horaires d'ouverture */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4" />
            <h4 className="text-sm font-semibold">Horaires d'ouverture</h4>
          </div>

          <div className="space-y-3">
            {DAYS.map((day) => {
              const dayHours = defaultHours[day.key];
              return (
                <div key={day.key} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg">
                  <div className="w-full sm:w-24 flex-shrink-0">
                    <Label className="text-sm font-medium">{day.label}</Label>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
                    <Switch
                      checked={!dayHours.closed}
                      onCheckedChange={(checked) => handleDayChange(day.key, 'closed', !checked)}
                    />
                    <span className="text-xs text-muted-foreground">
                      {dayHours.closed ? 'Fermé' : 'Ouvert'}
                    </span>
                  </div>

                  {!dayHours.closed && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`${day.key}_open`} className="text-xs whitespace-nowrap">Ouverture</Label>
                        <Input
                          id={`${day.key}_open`}
                          type="time"
                          value={dayHours.open}
                          onChange={(e) => handleDayChange(day.key, 'open', e.target.value)}
                          className="w-28 sm:w-32"
                        />
                      </div>
                      <span className="text-muted-foreground hidden sm:inline">-</span>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`${day.key}_close`} className="text-xs whitespace-nowrap">Fermeture</Label>
                        <Input
                          id={`${day.key}_close`}
                          type="time"
                          value={dayHours.close}
                          onChange={(e) => handleDayChange(day.key, 'close', e.target.value)}
                          className="w-28 sm:w-32"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            Les horaires sont définis dans le fuseau horaire : {timezone}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

