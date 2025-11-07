/**
 * Gamification Page
 * Date: 30 Janvier 2025
 * 
 * Page complète pour la gamification (points, badges, achievements, leaderboard)
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { GamificationDashboard } from '@/components/gamification/GamificationDashboard';
import { Trophy } from 'lucide-react';

export default function GamificationPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Trophy className="h-8 w-8" />
                Gamification
              </h1>
              <p className="text-muted-foreground">
                Suivez vos points, badges, achievements et votre classement
              </p>
            </div>

            <GamificationDashboard />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

