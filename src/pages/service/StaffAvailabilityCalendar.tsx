/**
 * Staff Availability Calendar Page
 * Date: 28 Janvier 2025
 * 
 * Page de calendrier pour gérer les disponibilités du staff
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  Clock,
  Users,
  Plus,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { StaffAvailabilityCalendarView } from '@/components/service/staff/StaffAvailabilityCalendarView';
import { StaffAvailabilityManager } from '@/components/service/StaffAvailabilityManager';
import { StaffAvailabilitySettings } from '@/components/service/staff/StaffAvailabilitySettings';

export default function StaffAvailabilityCalendar() {
  const { serviceId } = useParams<{ serviceId?: string }>();
  const { store } = useStore();
  const [selectedStaffId, setSelectedStaffId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('calendar');

  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-8">
            <div className="text-center">
              <p className="text-muted-foreground">Chargement du store...</p>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 lg:p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <div>
                  <h1 className="text-3xl font-bold flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/5 border border-blue-500/20">
                      <Users className="h-6 w-6 text-blue-500" />
                    </div>
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Calendrier Staff
                    </span>
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gérez les disponibilités et horaires du personnel
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList>
                <TabsTrigger value="calendar">
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendrier
                </TabsTrigger>
                <TabsTrigger value="management">
                  <Clock className="h-4 w-4 mr-2" />
                  Gestion
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Paramètres
                </TabsTrigger>
              </TabsList>

              {/* Calendar Tab */}
              <TabsContent value="calendar" className="space-y-6">
                <StaffAvailabilityCalendarView
                  storeId={store.id}
                  serviceId={serviceId}
                  selectedStaffId={selectedStaffId}
                  onStaffSelect={setSelectedStaffId}
                />
              </TabsContent>

              {/* Management Tab */}
              <TabsContent value="management" className="space-y-6">
                <StaffAvailabilityManager
                  storeId={store.id}
                  staffMemberId={selectedStaffId}
                />
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                <StaffAvailabilitySettings
                  storeId={store.id}
                  serviceId={serviceId}
                />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

