/**
 * Staff Availability Calendar View Component
 * Date: 28 Janvier 2025
 * 
 * Vue calendrier interactive pour visualiser et gérer les disponibilités du staff
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Plus,
  Edit,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface StaffAvailabilityCalendarViewProps {
  storeId: string;
  serviceId?: string;
  selectedStaffId?: string;
  onStaffSelect?: (staffId: string | undefined) => void;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  is_active: boolean;
}

interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  staff_member_id?: string;
  is_active: boolean;
}

interface TimeOff {
  id: string;
  staff_member_id: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  time_off_type: string;
}

interface CustomHours {
  id: string;
  staff_member_id: string;
  specific_date?: string;
  day_of_week?: number;
  start_time: string;
  end_time: string;
  is_unavailable: boolean;
  is_active: boolean;
}

export function StaffAvailabilityCalendarView({
  storeId,
  serviceId,
  selectedStaffId,
  onStaffSelect,
}: StaffAvailabilityCalendarViewProps) {
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch staff members
  const { data: staffMembers = [], isLoading: isLoadingStaff } = useQuery({
    queryKey: ['staff-members-calendar', storeId, serviceId],
    queryFn: async () => {
      let query = supabase
        .from('service_staff_members')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (serviceId) {
        query = query.eq('service_product_id', serviceId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as StaffMember[];
    },
    enabled: !!storeId,
  });

  // Fetch availability slots
  const { data: availabilitySlots = [] } = useQuery({
    queryKey: ['availability-slots-calendar', serviceId],
    queryFn: async () => {
      if (!serviceId) return [];

      const { data, error } = await supabase
        .from('service_availability_slots')
        .select('*')
        .eq('service_product_id', serviceId)
        .eq('is_active', true);

      if (error) throw error;
      return (data || []) as AvailabilitySlot[];
    },
    enabled: !!serviceId,
  });

  // Fetch time off
  const { data: timeOffs = [] } = useQuery({
    queryKey: ['staff-time-off-calendar', storeId, selectedStaffId],
    queryFn: async () => {
      let query = supabase
        .from('staff_time_off')
        .select('*')
        .eq('store_id', storeId)
        .eq('status', 'approved')
        .order('start_date', { ascending: true });

      if (selectedStaffId) {
        query = query.eq('staff_member_id', selectedStaffId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as TimeOff[];
    },
    enabled: !!storeId,
  });

  // Fetch custom hours
  const { data: customHours = [] } = useQuery({
    queryKey: ['staff-custom-hours-calendar', storeId, selectedStaffId],
    queryFn: async () => {
      let query = supabase
        .from('staff_custom_hours')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true);

      if (selectedStaffId) {
        query = query.eq('staff_member_id', selectedStaffId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CustomHours[];
    },
    enabled: !!storeId,
  });

  // Calculate availability for each day
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getDayAvailability = (date: Date) => {
    const dayOfWeek = getDay(date);
    const dateStr = format(date, 'yyyy-MM-dd');

    // Check time off
    const timeOff = timeOffs.find((to) => {
      const start = new Date(to.start_date);
      const end = new Date(to.end_date);
      return date >= start && date <= end;
    });

    if (timeOff) {
      return {
        status: 'unavailable' as const,
        reason: 'Congé',
        type: timeOff.time_off_type,
      };
    }

    // Check custom hours
    const customHour = customHours.find((ch) => {
      if (ch.specific_date) {
        return ch.specific_date === dateStr;
      }
      if (ch.day_of_week !== null && ch.day_of_week !== undefined) {
        return ch.day_of_week === dayOfWeek;
      }
      return false;
    });

    if (customHour) {
      return {
        status: customHour.is_unavailable ? ('unavailable' as const) : ('available' as const),
        reason: customHour.is_unavailable ? 'Indisponible' : 'Disponible (heures personnalisées)',
        startTime: customHour.start_time,
        endTime: customHour.end_time,
      };
    }

    // Check regular availability slots
    const slots = availabilitySlots.filter((slot) => {
      if (selectedStaffId && slot.staff_member_id) {
        return slot.staff_member_id === selectedStaffId && slot.day_of_week === dayOfWeek;
      }
      return slot.day_of_week === dayOfWeek;
    });

    if (slots.length > 0) {
      return {
        status: 'available' as const,
        reason: 'Disponible',
        slots: slots.map((s) => ({
          start: s.start_time,
          end: s.end_time,
        })),
      };
    }

    return {
      status: 'no-schedule' as const,
      reason: 'Aucun horaire',
    };
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => (direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)));
  };

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  if (isLoadingStaff) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Staff Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Sélectionner un membre du staff
          </CardTitle>
          <CardDescription>
            Choisissez un membre du staff pour voir ses disponibilités
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select
              value={selectedStaffId || 'all'}
              onValueChange={(value) => onStaffSelect?.(value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Tous les membres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les membres</SelectItem>
                {staffMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedStaffId && (
              <Button
                variant="outline"
                onClick={() => onStaffSelect?.(undefined)}
              >
                Effacer la sélection
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Calendrier des Disponibilités</CardTitle>
              <CardDescription>
                {format(currentMonth, 'MMMM yyyy', { locale: fr })}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentMonth(new Date())}
              >
                Aujourd'hui
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day Names */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {dayNames.map((day) => (
              <div key={day} className="text-center font-semibold text-sm text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before month start */}
            {Array.from({ length: getDay(monthDays[0]) }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Month Days */}
            {monthDays.map((date) => {
              const availability = getDayAvailability(date);
              const isToday = isSameDay(date, new Date());
              const isSelected = selectedDate && isSameDay(date, selectedDate);

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    'aspect-square p-2 rounded-lg border transition-all hover:shadow-md',
                    isToday && 'ring-2 ring-primary',
                    isSelected && 'bg-primary/10 border-primary',
                    availability.status === 'available' && 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
                    availability.status === 'unavailable' && 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
                    availability.status === 'no-schedule' && 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
                  )}
                >
                  <div className="flex flex-col h-full">
                    <div className={cn(
                      'text-sm font-semibold',
                      isToday && 'text-primary'
                    )}>
                      {format(date, 'd')}
                    </div>
                    <div className="flex-1 flex items-center justify-center mt-1">
                      {availability.status === 'available' && (
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      )}
                      {availability.status === 'unavailable' && (
                        <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      )}
                      {availability.status === 'no-schedule' && (
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-6 pt-6 border-t">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800" />
              <span className="text-sm">Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800" />
              <span className="text-sm">Indisponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800" />
              <span className="text-sm">Aucun horaire</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle>Détails - {format(selectedDate, 'dd MMMM yyyy', { locale: fr })}</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const availability = getDayAvailability(selectedDate);
              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        availability.status === 'available'
                          ? 'default'
                          : availability.status === 'unavailable'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {availability.reason}
                    </Badge>
                  </div>

                  {availability.status === 'available' && availability.slots && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Horaires disponibles :</p>
                      <div className="grid grid-cols-2 gap-2">
                        {availability.slots.map((slot, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 p-2 bg-muted rounded-lg"
                          >
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {slot.start} - {slot.end}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {availability.status === 'available' && availability.startTime && (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {availability.startTime} - {availability.endTime}
                      </span>
                    </div>
                  )}

                  {availability.type && (
                    <div className="text-sm text-muted-foreground">
                      Type : {availability.type}
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

