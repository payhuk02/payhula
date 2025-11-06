/**
 * Physical Promotions Management Page
 * Date: 2025-01-28
 */

import React from 'react';
import { PromotionsManager } from '@/components/physical/promotions';

export default function PhysicalPromotions() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Promotions et réductions</h1>
        <p className="text-muted-foreground mt-2">
          Gérez vos promotions, codes de réduction et offres spéciales
        </p>
      </div>

      <PromotionsManager />
    </div>
  );
}

