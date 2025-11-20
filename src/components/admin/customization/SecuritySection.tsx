/**
 * Section Sécurité
 * 2FA, permissions, audit
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Key, Lock } from 'lucide-react';

interface SecuritySectionProps {
  onChange?: () => void;
}

export const SecuritySection = ({ onChange }: SecuritySectionProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sécurité
          </CardTitle>
          <CardDescription>
            Configuration de la sécurité de la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Configuration de la sécurité à venir...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

