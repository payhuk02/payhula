/**
 * Page Admin - Monitoring en Temps Réel
 * Affiche le dashboard de monitoring avec les métriques et alertes
 */

import { AdminLayout } from '@/components/admin/AdminLayout';
import { MonitoringDashboard } from '@/components/monitoring/MonitoringDashboard';

export default function AdminMonitoring() {
  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <MonitoringDashboard />
      </div>
    </AdminLayout>
  );
}

