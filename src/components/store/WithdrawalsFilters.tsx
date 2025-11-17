/**
 * Composant: WithdrawalsFilters
 * Description: Filtres avancés pour les retraits
 * Date: 2025-02-03
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { 
  Filter, 
  X, 
  Calendar as CalendarIcon,
  Search,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { StorePaymentMethod, StoreWithdrawalStatus } from '@/types/store-withdrawals';

interface WithdrawalsFiltersProps {
  onFiltersChange: (filters: {
    status?: StoreWithdrawalStatus;
    paymentMethod?: StorePaymentMethod;
    dateFrom?: Date;
    dateTo?: Date;
    minAmount?: number;
    maxAmount?: number;
    search?: string;
  }) => void;
  onQuickFilter?: (period: 'week' | 'month' | 'year' | 'all') => void;
  showQuickFilters?: boolean;
}

export const WithdrawalsFilters = ({ 
  onFiltersChange, 
  onQuickFilter,
  showQuickFilters = true 
}: WithdrawalsFiltersProps) => {
  const [status, setStatus] = useState<StoreWithdrawalStatus | 'all'>('all');
  const [paymentMethod, setPaymentMethod] = useState<StorePaymentMethod | 'all'>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [search, setSearch] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleApplyFilters = () => {
    onFiltersChange({
      status: status !== 'all' ? status : undefined,
      paymentMethod: paymentMethod !== 'all' ? paymentMethod : undefined,
      dateFrom,
      dateTo,
      minAmount: minAmount ? parseFloat(minAmount) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
      search: search || undefined,
    });
  };

  const handleReset = () => {
    setStatus('all');
    setPaymentMethod('all');
    setDateFrom(undefined);
    setDateTo(undefined);
    setMinAmount('');
    setMaxAmount('');
    setSearch('');
    onFiltersChange({});
  };

  const hasActiveFilters = status !== 'all' || paymentMethod !== 'all' || dateFrom || dateTo || minAmount || maxAmount || search;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtres
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2 text-xs">
                Actifs
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-xs sm:text-sm h-7 sm:h-8"
              >
                <X className="h-3 w-3 mr-1" />
                Réinitialiser
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs sm:text-sm h-7 sm:h-8"
            >
              {isExpanded ? 'Réduire' : 'Développer'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {/* Recherche */}
        <div className="space-y-2">
          <Label htmlFor="search" className="text-xs sm:text-sm">Recherche</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Rechercher par référence, boutique..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
              className="pl-8 sm:pl-10 text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Filtres rapides par période */}
        {showQuickFilters && onQuickFilter && (
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Période rapide</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onQuickFilter('week')}
                className="text-xs sm:text-sm h-7 sm:h-8"
              >
                Cette semaine
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onQuickFilter('month')}
                className="text-xs sm:text-sm h-7 sm:h-8"
              >
                Ce mois
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onQuickFilter('year')}
                className="text-xs sm:text-sm h-7 sm:h-8"
              >
                Cette année
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onQuickFilter('all')}
                className="text-xs sm:text-sm h-7 sm:h-8"
              >
                Tout
              </Button>
            </div>
          </div>
        )}

        {/* Filtres avancés (expandable) */}
        {isExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pt-2 border-t">
            {/* Statut */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-xs sm:text-sm">Statut</Label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                <SelectTrigger id="status" className="text-sm sm:text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[1060]">
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="processing">En cours</SelectItem>
                  <SelectItem value="completed">Complétés</SelectItem>
                  <SelectItem value="failed">Échoués</SelectItem>
                  <SelectItem value="cancelled">Annulés</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Méthode de paiement */}
            <div className="space-y-2">
              <Label htmlFor="payment_method" className="text-xs sm:text-sm">Méthode de paiement</Label>
              <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                <SelectTrigger id="payment_method" className="text-sm sm:text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[1060]">
                  <SelectItem value="all">Toutes les méthodes</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="bank_card">Carte bancaire</SelectItem>
                  <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date de début */}
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Date de début</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-sm sm:text-base h-9 sm:h-10",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd/MM/yyyy", { locale: fr }) : "Sélectionner"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date de fin */}
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Date de fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-sm sm:text-base h-9 sm:h-10",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd/MM/yyyy", { locale: fr }) : "Sélectionner"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Montant minimum */}
            <div className="space-y-2">
              <Label htmlFor="min_amount" className="text-xs sm:text-sm">Montant minimum (XOF)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  id="min_amount"
                  type="number"
                  placeholder="0"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className="pl-8 sm:pl-10 text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Montant maximum */}
            <div className="space-y-2">
              <Label htmlFor="max_amount" className="text-xs sm:text-sm">Montant maximum (XOF)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  id="max_amount"
                  type="number"
                  placeholder="0"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  className="pl-8 sm:pl-10 text-sm sm:text-base"
                />
              </div>
            </div>
          </div>
        )}

        {/* Bouton Appliquer */}
        <div className="flex justify-end pt-2 border-t">
          <Button
            onClick={handleApplyFilters}
            size="sm"
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            Appliquer les filtres
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

