/**
 * Composant de conversion de devises
 * Date: 28 Janvier 2025
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowRightLeft,
  DollarSign,
  TrendingUp,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  useCurrencies,
  useConvertCurrency,
  useExchangeRates,
} from '@/hooks/physical/useCurrencies';

export function CurrencyConverter() {
  const { data: currencies } = useCurrencies(true);
  const { data: exchangeRates } = useExchangeRates();
  const convertMutation = useConvertCurrency();

  const [amount, setAmount] = useState(100);
  const [fromCurrency, setFromCurrency] = useState('XOF');
  const [toCurrency, setToCurrency] = useState('USD');
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);

  const currentRate = exchangeRates?.find(
    (r) => r.from_currency === fromCurrency && r.to_currency === toCurrency
  );

  const handleConvert = async () => {
    try {
      const result = await convertMutation.mutateAsync({
        amount,
        fromCurrency,
        toCurrency,
      });
      setConvertedAmount(result);
    } catch (error) {
      setConvertedAmount(null);
    }
  };

  const handleSwapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
    setConvertedAmount(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5" />
          Convertisseur de Devises
        </CardTitle>
        <CardDescription>
          Convertissez instantanément entre différentes devises
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>De</Label>
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies?.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Vers</Label>
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies?.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Montant</Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min="0"
            step="0.01"
          />
        </div>

        {currentRate && (
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="text-sm">
                  Taux actuel: <span className="font-mono font-semibold">1 {fromCurrency} = {currentRate.rate.toFixed(6)} {toCurrency}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Source: {currentRate.source}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-2">
          <Button onClick={handleConvert} disabled={convertMutation.isPending} className="flex-1">
            {convertMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Conversion...
              </>
            ) : (
              <>
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Convertir
              </>
            )}
          </Button>
          <Button variant="outline" size="icon" onClick={handleSwapCurrencies}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {convertedAmount !== null && (
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Résultat</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {convertedAmount.toFixed(2)} {toCurrency}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

