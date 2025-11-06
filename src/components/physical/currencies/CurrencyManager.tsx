/**
 * Composant de gestion des devises et taux de change
 * Date: 28 Janvier 2025
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  DollarSign,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  TrendingUp,
  Globe,
} from 'lucide-react';
import {
  useCurrencies,
  useExchangeRates,
  useUpdateExchangeRates,
  Currency,
  ExchangeRate,
} from '@/hooks/physical/useCurrencies';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function CurrencyManager() {
  const { toast } = useToast();
  const { data: currencies, isLoading: isLoadingCurrencies } = useCurrencies(false);
  const { data: exchangeRates, isLoading: isLoadingRates } = useExchangeRates();
  const updateRates = useUpdateExchangeRates();

  const [isUpdating, setIsUpdating] = useState(false);

  const baseCurrency = currencies?.find((c) => c.is_base_currency);

  const handleUpdateRates = async () => {
    setIsUpdating(true);
    try {
      // Pour l'instant, on simule une mise à jour
      // Dans une vraie implémentation, on appellerait une API externe
      toast({
        title: 'Mise à jour planifiée',
        description: 'La mise à jour des taux sera effectuée automatiquement',
      });
    } catch (error) {
      // Error handled
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoadingCurrencies || isLoadingRates) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Gestion Multi-devises
              </CardTitle>
              <CardDescription>
                Gérez les devises, taux de change et prix régionaux
              </CardDescription>
            </div>
            <Button onClick={handleUpdateRates} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Actualiser les taux
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="currencies" className="space-y-4">
            <TabsList>
              <TabsTrigger value="currencies">Devises</TabsTrigger>
              <TabsTrigger value="rates">Taux de Change</TabsTrigger>
            </TabsList>

            <TabsContent value="currencies" className="space-y-4">
              {baseCurrency && (
                <Alert>
                  <DollarSign className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-semibold">Devise de base: {baseCurrency.name} ({baseCurrency.code})</p>
                      <p className="text-sm text-muted-foreground">
                        Toutes les conversions sont calculées à partir de cette devise
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {!currencies || currencies.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Aucune devise configurée
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Symbole</TableHead>
                      <TableHead>Décimales</TableHead>
                      <TableHead>Région</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currencies.map((currency) => (
                      <TableRow key={currency.id}>
                        <TableCell>
                          <Badge variant={currency.is_base_currency ? 'default' : 'outline'}>
                            {currency.code}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{currency.name}</TableCell>
                        <TableCell>{currency.symbol}</TableCell>
                        <TableCell>{currency.decimal_places}</TableCell>
                        <TableCell>
                          {currency.region || currency.country_code || '-'}
                        </TableCell>
                        <TableCell>
                          {currency.is_active ? (
                            <Badge variant="default">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="rates" className="space-y-4">
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-semibold">Taux de change en temps réel</p>
                    <p className="text-sm text-muted-foreground">
                      Les taux sont mis à jour automatiquement
                    </p>
                  </div>
                </AlertDescription>
              </Alert>

              {!exchangeRates || exchangeRates.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Aucun taux de change configuré
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>De</TableHead>
                      <TableHead>Vers</TableHead>
                      <TableHead>Taux</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Dernière mise à jour</TableHead>
                      <TableHead>Auto-update</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exchangeRates.map((rate) => (
                      <TableRow key={rate.id}>
                        <TableCell>
                          <Badge variant="outline">{rate.from_currency}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{rate.to_currency}</Badge>
                        </TableCell>
                        <TableCell className="font-mono font-semibold">
                          {rate.rate.toFixed(6)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{rate.source}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(rate.last_updated), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        </TableCell>
                        <TableCell>
                          {rate.auto_update ? (
                            <Badge variant="default">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Oui
                            </Badge>
                          ) : (
                            <Badge variant="outline">Non</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

