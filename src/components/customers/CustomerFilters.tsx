import React, { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface CustomerFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  sortOrder?: 'asc' | 'desc';
  onSortOrderChange?: (value: 'asc' | 'desc') => void;
}

const CustomerFiltersComponent = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  sortOrder = 'asc',
  onSortOrderChange,
}: CustomerFiltersProps) => {
  const filtersRef = useScrollAnimation<HTMLDivElement>();

  const handleClearSearch = useCallback(() => {
    onSearchChange("");
  }, [onSearchChange]);

  return (
    <div 
      ref={filtersRef}
      className="flex flex-col sm:flex-row gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
    >
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        <Input
          placeholder="Rechercher par nom, email ou téléphone..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-9 h-9 sm:h-10 text-xs sm:text-sm"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-muted"
            onClick={handleClearSearch}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-full sm:w-[200px] h-9 sm:h-10 text-xs sm:text-sm">
          <SelectValue placeholder="Trier par" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name">Nom</SelectItem>
          <SelectItem value="created_at">Date de création</SelectItem>
          <SelectItem value="total_orders">Nombre de commandes</SelectItem>
          <SelectItem value="total_spent">Total dépensé</SelectItem>
        </SelectContent>
      </Select>
      
      {onSortOrderChange && (
        <Select value={sortOrder} onValueChange={onSortOrderChange}>
          <SelectTrigger className="w-full sm:w-[150px] h-9 sm:h-10 text-xs sm:text-sm">
            <SelectValue placeholder="Ordre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Croissant</SelectItem>
            <SelectItem value="desc">Décroissant</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

CustomerFiltersComponent.displayName = 'CustomerFiltersComponent';

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const CustomerFilters = React.memo(CustomerFiltersComponent, (prevProps, nextProps) => {
  return (
    prevProps.searchQuery === nextProps.searchQuery &&
    prevProps.sortBy === nextProps.sortBy &&
    prevProps.sortOrder === nextProps.sortOrder &&
    prevProps.onSearchChange === nextProps.onSearchChange &&
    prevProps.onSortChange === nextProps.onSortChange &&
    prevProps.onSortOrderChange === nextProps.onSortOrderChange
  );
});

CustomerFilters.displayName = 'CustomerFilters';
