/**
 * Page: PaymentMethods
 * Description: Gestion des méthodes de paiement sauvegardées pour les retraits
 * Date: 2025-02-03
 */

import { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/hooks/useStore';
import { useStorePaymentMethods } from '@/hooks/useStorePaymentMethods';
import { SavedStorePaymentMethod, StorePaymentMethodForm, StorePaymentMethod } from '@/types/store-withdrawals';
import { COUNTRIES } from '@/lib/countries';
import { getMobileMoneyOperatorsForCountry } from '@/lib/mobile-money-operators';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Plus, Edit, Trash2, Star, StarOff, Wallet, CreditCard, Building2, Loader2 } from 'lucide-react';
import { PaymentMethodDialog } from '@/components/store/PaymentMethodDialog';

const PaymentMethods = () => {
  const { store, loading: storeLoading } = useStore();
  const { paymentMethods, loading, createPaymentMethod, updatePaymentMethod, deletePaymentMethod, setAsDefault } = useStorePaymentMethods({
    storeId: store?.id,
    activeOnly: false, // Afficher aussi les méthodes inactives
  });

  const [showDialog, setShowDialog] = useState(false);
  const [editingMethod, setEditingMethod] = useState<SavedStorePaymentMethod | null>(null);

  const handleCreate = () => {
    setEditingMethod(null);
    setShowDialog(true);
  };

  const handleEdit = (method: SavedStorePaymentMethod) => {
    setEditingMethod(method);
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette méthode de paiement ?')) {
      await deletePaymentMethod(id);
    }
  };

  const handleSubmit = async (formData: StorePaymentMethodForm) => {
    if (editingMethod) {
      await updatePaymentMethod(editingMethod.id, formData);
    } else {
      await createPaymentMethod(formData);
    }
    setShowDialog(false);
    setEditingMethod(null);
  };

  const getPaymentMethodIcon = (method: StorePaymentMethod) => {
    switch (method) {
      case 'mobile_money':
        return <Wallet className="h-5 w-5" />;
      case 'bank_card':
        return <CreditCard className="h-5 w-5" />;
      case 'bank_transfer':
        return <Building2 className="h-5 w-5" />;
      default:
        return <Wallet className="h-5 w-5" />;
    }
  };

  const getPaymentMethodLabel = (method: StorePaymentMethod) => {
    switch (method) {
      case 'mobile_money':
        return 'Mobile Money';
      case 'bank_card':
        return 'Carte bancaire';
      case 'bank_transfer':
        return 'Virement bancaire';
      default:
        return method;
    }
  };

  const formatPaymentDetails = (method: SavedStorePaymentMethod) => {
    const details = method.payment_details;
    if (method.payment_method === 'mobile_money') {
      const mobileDetails = details as any;
      const countryName = mobileDetails.country 
        ? COUNTRIES.find(c => c.code === mobileDetails.country)?.name || mobileDetails.country
        : '';
      const operatorLabel = mobileDetails.operator 
        ? getMobileMoneyOperatorsForCountry(mobileDetails.country || 'BF')
            .find(op => op.value === mobileDetails.operator)?.label || mobileDetails.operator
        : 'N/A';
      return `${mobileDetails.phone}${countryName ? ` (${countryName})` : ''} - ${operatorLabel}`;
    } else if (method.payment_method === 'bank_card') {
      const cardDetails = details as any;
      const cardNumber = cardDetails.card_number || '';
      const masked = cardNumber.length > 4 
        ? `****${cardNumber.slice(-4)}` 
        : '****';
      return `${masked} - ${cardDetails.cardholder_name || 'N/A'}`;
    } else {
      const transferDetails = details as any;
      return `${transferDetails.account_number || 'N/A'} - ${transferDetails.bank_name || 'N/A'}`;
    }
  };

  if (storeLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-64 w-full" />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Vous devez créer une boutique avant de pouvoir gérer vos méthodes de paiement.
              </AlertDescription>
            </Alert>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Méthodes de paiement</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
                Gérez vos numéros de mobile money et cartes bancaires pour faciliter les retraits
              </p>
            </div>
            <Button 
              onClick={handleCreate}
              className="w-full sm:w-auto"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une méthode
            </Button>
          </div>

          {/* Liste des méthodes */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : paymentMethods.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 sm:py-12 text-muted-foreground">
                  <Wallet className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 opacity-20" />
                  <p className="text-sm sm:text-base font-medium mb-2">Aucune méthode de paiement</p>
                  <p className="text-xs sm:text-sm mb-4">
                    Ajoutez vos numéros de mobile money ou cartes bancaires pour faciliter vos retraits
                  </p>
                  <Button onClick={handleCreate} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une méthode
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
              {paymentMethods.map((method) => (
                <Card key={method.id} className={!method.is_active ? 'opacity-60' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {getPaymentMethodIcon(method.payment_method)}
                        </div>
                        <div>
                          <CardTitle className="text-base sm:text-lg">{method.label}</CardTitle>
                          <CardDescription className="text-xs sm:text-sm mt-1">
                            {getPaymentMethodLabel(method.payment_method)}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {method.is_default && (
                          <Badge variant="default" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Défaut
                          </Badge>
                        )}
                        {!method.is_active && (
                          <Badge variant="secondary" className="text-xs">
                            Inactif
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">Détails</p>
                        <p className="text-sm sm:text-base font-medium">{formatPaymentDetails(method)}</p>
                      </div>
                      {method.notes && (
                        <div>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-1">Notes</p>
                          <p className="text-xs sm:text-sm">{method.notes}</p>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {!method.is_default && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setAsDefault(method.id)}
                            className="text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
                          >
                            <StarOff className="h-3 w-3 sm:mr-1" />
                            <span className="hidden sm:inline">Définir par défaut</span>
                            <span className="sm:hidden">Défaut</span>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(method)}
                          className="text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
                        >
                          <Edit className="h-3 w-3 sm:mr-1" />
                          <span className="hidden sm:inline">Modifier</span>
                          <span className="sm:hidden">Mod.</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(method.id)}
                          className="text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
                        >
                          <Trash2 className="h-3 w-3 sm:mr-1" />
                          <span className="hidden sm:inline">Supprimer</span>
                          <span className="sm:hidden">Suppr.</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Dialog */}
          <PaymentMethodDialog
            open={showDialog}
            onOpenChange={setShowDialog}
            method={editingMethod}
            onSubmit={handleSubmit}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default PaymentMethods;

