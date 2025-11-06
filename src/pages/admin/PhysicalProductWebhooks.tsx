/**
 * Physical Product Webhooks Admin Page
 * Date: 2025-01-27
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { WebhooksManager } from '@/components/physical/webhooks/WebhooksManager';

export default function PhysicalProductWebhooks() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-6">
          <div className="container mx-auto">
            <WebhooksManager />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}


