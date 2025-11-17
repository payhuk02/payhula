/**
 * Composant: PaymentMethodDialog
 * Description: Dialog pour ajouter/modifier une méthode de paiement sauvegardée
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { 
  SavedStorePaymentMethod, 
  StorePaymentMethodForm,
  StorePaymentMethod,
  MobileMoneyDetails,
  BankCardDetails,
  BankTransferDetails,
  MobileMoneyOperator
} from '@/types/store-withdrawals';
import { COUNTRIES } from '@/lib/countries';
import { getMobileMoneyOperatorsForCountry, getDefaultOperatorForCountry, MobileMoneyOperatorInfo } from '@/lib/mobile-money-operators';

interface PaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  method?: SavedStorePaymentMethod | null;
  onSubmit: (formData: StorePaymentMethodForm) => Promise<void>;
}

export const PaymentMethodDialog = ({
  open,
  onOpenChange,
  method,
  onSubmit,
}: PaymentMethodDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<StorePaymentMethod>('mobile_money');
  const [label, setLabel] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('');

  // Mobile Money fields
  const [mobileCountry, setMobileCountry] = useState('BF'); // Burkina Faso par défaut
  const [mobilePhone, setMobilePhone] = useState('');
  const [mobileOperator, setMobileOperator] = useState<MobileMoneyOperator>('orange_money');
  const [mobileFullName, setMobileFullName] = useState('');

  // Opérateurs disponibles selon le pays
  const availableOperators = getMobileMoneyOperatorsForCountry(mobileCountry);

  // Bank Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [bankName, setBankName] = useState('');

  // Bank Transfer fields
  const [accountNumber, setAccountNumber] = useState('');
  const [transferBankName, setTransferBankName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [iban, setIban] = useState('');

  // Initialiser les champs si on modifie une méthode existante
  useEffect(() => {
    if (method) {
      setPaymentMethod(method.payment_method);
      setLabel(method.label);
      setIsDefault(method.is_default);
      setIsActive(method.is_active);
      setNotes(method.notes || '');

      const details = method.payment_details;
      if (method.payment_method === 'mobile_money') {
        const mobileDetails = details as MobileMoneyDetails;
        setMobileCountry(mobileDetails.country || 'BF');
        setMobilePhone(mobileDetails.phone || '');
        setMobileOperator(mobileDetails.operator || 'orange_money');
        setMobileFullName(mobileDetails.full_name || '');
      } else if (method.payment_method === 'bank_card') {
        const cardDetails = details as BankCardDetails;
        setCardNumber(cardDetails.card_number || '');
        setCardholderName(cardDetails.cardholder_name || '');
        setExpiryMonth(cardDetails.expiry_month || '');
        setExpiryYear(cardDetails.expiry_year || '');
        setBankName(cardDetails.bank_name || '');
      } else {
        const transferDetails = details as BankTransferDetails;
        setAccountNumber(transferDetails.account_number || '');
        setTransferBankName(transferDetails.bank_name || '');
        setAccountHolderName(transferDetails.account_holder_name || '');
        setIban(transferDetails.iban || '');
      }
    } else {
      // Réinitialiser pour une nouvelle méthode
      setPaymentMethod('mobile_money');
      setLabel('');
      setIsDefault(false);
      setIsActive(true);
      setNotes('');
      setMobileCountry('BF');
      setMobilePhone('');
      setMobileOperator('orange_money');
      setMobileFullName('');
      setCardNumber('');
      setCardholderName('');
      setExpiryMonth('');
      setExpiryYear('');
      setBankName('');
      setAccountNumber('');
      setTransferBankName('');
      setAccountHolderName('');
      setIban('');
    }
  }, [method, open]);

  const handleSubmit = async () => {
    if (!label.trim()) {
      return;
    }

    let paymentDetails: MobileMoneyDetails | BankCardDetails | BankTransferDetails;

    if (paymentMethod === 'mobile_money') {
      if (!mobilePhone || !mobileOperator || !mobileCountry) return;
      paymentDetails = {
        phone: mobilePhone,
        operator: mobileOperator,
        country: mobileCountry,
        full_name: mobileFullName,
      };
    } else if (paymentMethod === 'bank_card') {
      if (!cardNumber || !cardholderName) return;
      paymentDetails = {
        card_number: cardNumber,
        cardholder_name: cardholderName,
        expiry_month: expiryMonth,
        expiry_year: expiryYear,
        bank_name: bankName,
      };
    } else {
      if (!accountNumber || !transferBankName || !accountHolderName) return;
      paymentDetails = {
        account_number: accountNumber,
        bank_name: transferBankName,
        account_holder_name: accountHolderName,
        iban: iban,
      };
    }

    setLoading(true);
    try {
      await onSubmit({
        payment_method: paymentMethod,
        label: label.trim(),
        payment_details: paymentDetails,
        is_default: isDefault,
        is_active: isActive,
        notes: notes.trim() || undefined,
      });
      onOpenChange(false);
    } catch (error) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  const isValid = () => {
    if (!label.trim()) return false;

    if (paymentMethod === 'mobile_money') {
      return !!mobilePhone && !!mobileOperator && !!mobileCountry;
    } else if (paymentMethod === 'bank_card') {
      return !!cardNumber && !!cardholderName;
    } else {
      return !!accountNumber && !!transferBankName && !!accountHolderName;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {method ? 'Modifier la méthode de paiement' : 'Ajouter une méthode de paiement'}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Enregistrez vos informations de paiement pour faciliter vos retraits
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor="label" className="text-xs sm:text-sm">Nom de la méthode *</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Orange Money Principal, Carte UBA..."
              className="text-sm sm:text-base"
            />
          </div>

          {/* Type de méthode */}
          <div className="space-y-2">
            <Label htmlFor="payment_method" className="text-xs sm:text-sm">Type de paiement *</Label>
            <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
              <SelectTrigger className="text-sm sm:text-base" id="payment_method">
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[1060]">
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
                <SelectItem value="bank_card">Carte bancaire</SelectItem>
                <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Détails selon la méthode */}
          {paymentMethod === 'mobile_money' && (
            <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 border rounded-lg">
              <h4 className="font-semibold text-sm sm:text-base">Détails Mobile Money</h4>
              <div className="space-y-2">
                <Label htmlFor="mobile_country" className="text-xs sm:text-sm">Pays *</Label>
                <Select value={mobileCountry} onValueChange={(value) => {
                  setMobileCountry(value);
                  // Réinitialiser l'opérateur avec le défaut du nouveau pays
                  const defaultOp = getDefaultOperatorForCountry(value);
                  setMobileOperator(defaultOp);
                }}>
                  <SelectTrigger className="text-sm sm:text-base" id="mobile_country">
                    <SelectValue placeholder="Sélectionner un pays" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[1060] max-h-[300px]">
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="operator" className="text-xs sm:text-sm">Opérateur *</Label>
                <Select value={mobileOperator} onValueChange={(value: any) => setMobileOperator(value)}>
                  <SelectTrigger className="text-sm sm:text-base" id="operator">
                    <SelectValue placeholder="Sélectionner un opérateur" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[1060]">
                    {availableOperators.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile_phone" className="text-xs sm:text-sm">Numéro de téléphone *</Label>
                <Input
                  id="mobile_phone"
                  type="tel"
                  value={mobilePhone}
                  onChange={(e) => setMobilePhone(e.target.value)}
                  placeholder="+226 XX XX XX XX"
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile_full_name" className="text-xs sm:text-sm">Nom complet (optionnel)</Label>
                <Input
                  id="mobile_full_name"
                  value={mobileFullName}
                  onChange={(e) => setMobileFullName(e.target.value)}
                  placeholder="Nom complet du titulaire"
                  className="text-sm sm:text-base"
                />
              </div>
            </div>
          )}

          {paymentMethod === 'bank_card' && (
            <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 border rounded-lg">
              <h4 className="font-semibold text-sm sm:text-base">Détails Carte bancaire</h4>
              <div className="space-y-2">
                <Label htmlFor="card_number" className="text-xs sm:text-sm">Numéro de carte *</Label>
                <Input
                  id="card_number"
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardholder_name" className="text-xs sm:text-sm">Nom du titulaire *</Label>
                <Input
                  id="cardholder_name"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  placeholder="Nom complet"
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry_month" className="text-xs sm:text-sm">Mois d'expiration</Label>
                  <Input
                    id="expiry_month"
                    type="text"
                    value={expiryMonth}
                    onChange={(e) => setExpiryMonth(e.target.value)}
                    placeholder="MM"
                    maxLength={2}
                    className="text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiry_year" className="text-xs sm:text-sm">Année d'expiration</Label>
                  <Input
                    id="expiry_year"
                    type="text"
                    value={expiryYear}
                    onChange={(e) => setExpiryYear(e.target.value)}
                    placeholder="YYYY"
                    maxLength={4}
                    className="text-sm sm:text-base"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_name" className="text-xs sm:text-sm">Nom de la banque (optionnel)</Label>
                <Input
                  id="bank_name"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Nom de la banque"
                  className="text-sm sm:text-base"
                />
              </div>
            </div>
          )}

          {paymentMethod === 'bank_transfer' && (
            <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 border rounded-lg">
              <h4 className="font-semibold text-sm sm:text-base">Détails Virement bancaire</h4>
              <div className="space-y-2">
                <Label htmlFor="account_number" className="text-xs sm:text-sm">Numéro de compte *</Label>
                <Input
                  id="account_number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Numéro de compte bancaire"
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transfer_bank_name" className="text-xs sm:text-sm">Nom de la banque *</Label>
                <Input
                  id="transfer_bank_name"
                  value={transferBankName}
                  onChange={(e) => setTransferBankName(e.target.value)}
                  placeholder="Nom de la banque"
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_holder_name" className="text-xs sm:text-sm">Nom du titulaire *</Label>
                <Input
                  id="account_holder_name"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="Nom complet du titulaire"
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="iban" className="text-xs sm:text-sm">IBAN (optionnel)</Label>
                <Input
                  id="iban"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  placeholder="IBAN"
                  className="text-sm sm:text-base"
                />
              </div>
            </div>
          )}

          {/* Options */}
          <div className="space-y-3 p-3 sm:p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_default" className="text-xs sm:text-sm">Méthode par défaut</Label>
                <p className="text-xs text-muted-foreground">
                  Cette méthode sera sélectionnée automatiquement lors des retraits
                </p>
              </div>
              <Switch
                id="is_default"
                checked={isDefault}
                onCheckedChange={setIsDefault}
              />
            </div>
            {method && (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_active" className="text-xs sm:text-sm">Active</Label>
                  <p className="text-xs text-muted-foreground">
                    Désactiver pour masquer sans supprimer
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs sm:text-sm">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informations supplémentaires..."
              rows={3}
              className="text-sm sm:text-base"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={loading}
            className="w-full sm:w-auto"
            size="sm"
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isValid() || loading}
            className="w-full sm:w-auto"
            size="sm"
          >
            {loading && <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />}
            <span className="text-xs sm:text-sm">{method ? 'Enregistrer' : 'Ajouter'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

