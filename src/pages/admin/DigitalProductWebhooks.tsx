/**
 * Digital Product Webhooks Page
 * Date: 2025-01-27
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { WebhooksManager } from '@/components/digital/webhooks';

export const DigitalProductWebhooks = () => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6">
            <WebhooksManager />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

