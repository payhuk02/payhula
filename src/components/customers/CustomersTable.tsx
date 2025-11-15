import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit, Trash2, Mail, Phone, MapPin, ShoppingBag, DollarSign, Calendar } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/hooks/useCustomers";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface CustomersTableProps {
  customers: Customer[];
  onUpdate: () => void;
}

// CustomerCard component for mobile view
const CustomerCard = ({ 
  customer, 
  onDelete 
}: { 
  customer: Customer; 
  onDelete: (id: string) => void;
}) => {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4" style={{ willChange: 'transform' }}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-base sm:text-lg mb-1">{customer.name}</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {customer.email && (
                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[200px]">{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{customer.phone}</span>
                </div>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(customer.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2 pt-3 border-t border-border/50">
          {customer.city || customer.country ? (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{customer.city && customer.country ? `${customer.city}, ${customer.country}` : customer.city || customer.country}</span>
            </div>
          ) : null}
          
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <ShoppingBag className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Commandes</p>
                <p className="text-sm font-semibold">{customer.total_orders || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <DollarSign className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-sm font-semibold">{Number(customer.total_spent).toLocaleString()} XOF</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
            <Calendar className="h-3.5 w-3.5" />
            <span>Inscrit le {format(new Date(customer.created_at), "dd MMM yyyy", { locale: fr })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const CustomersTableComponent = ({ customers, onUpdate }: CustomersTableProps) => {
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const tableRef = useScrollAnimation<HTMLDivElement>();

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Client supprimé avec succès",
      });

      onUpdate();
      setDeleteId(null);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Desktop Table View */}
      <div ref={tableRef} className="hidden lg:block animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Nom</TableHead>
                  <TableHead className="text-xs sm:text-sm">Contact</TableHead>
                  <TableHead className="text-xs sm:text-sm">Localisation</TableHead>
                  <TableHead className="text-xs sm:text-sm">Commandes</TableHead>
                  <TableHead className="text-xs sm:text-sm">Total dépensé</TableHead>
                  <TableHead className="text-xs sm:text-sm">Inscrit le</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium text-xs sm:text-sm">{customer.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs sm:text-sm">
                        {customer.email && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="truncate max-w-[200px]">{customer.email}</span>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {customer.city && customer.country
                        ? `${customer.city}, ${customer.country}`
                        : customer.city || customer.country || "—"}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">{customer.total_orders || 0}</TableCell>
                    <TableCell className="text-xs sm:text-sm font-medium">
                      {Number(customer.total_spent).toLocaleString()} XOF
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {format(new Date(customer.created_at), "dd MMM yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteId(customer.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {customers.map((customer) => (
          <CustomerCard 
            key={customer.id} 
            customer={customer} 
            onDelete={setDeleteId}
          />
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={loading} className="w-full sm:w-auto">Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={loading}
              className="w-full sm:w-auto bg-destructive hover:bg-destructive/90"
            >
              {loading ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const CustomersTable = React.memo(CustomersTableComponent, (prevProps, nextProps) => {
  return (
    prevProps.customers.length === nextProps.customers.length &&
    prevProps.onUpdate === nextProps.onUpdate &&
    // Comparaison superficielle des customers (comparer les IDs)
    prevProps.customers.every((customer, index) => 
      customer.id === nextProps.customers[index]?.id &&
      customer.name === nextProps.customers[index]?.name &&
      customer.total_orders === nextProps.customers[index]?.total_orders &&
      customer.total_spent === nextProps.customers[index]?.total_spent
    )
  );
});

CustomersTable.displayName = 'CustomersTable';
