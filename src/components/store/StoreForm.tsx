import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencySelect } from "@/components/ui/currency-select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generateSlug } from "@/lib/store-utils";
import { logger } from "@/lib/logger";
import { Loader2, Check, X } from '@/components/icons';

interface StoreFormProps {
  onSuccess: () => void;
  initialData?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    default_currency?: string;
  };
}

const StoreForm = ({ onSuccess, initialData }: StoreFormProps) => {
  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [defaultCurrency, setDefaultCurrency] = useState(initialData?.default_currency || "XOF");
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const checkSlugAvailability = useCallback(async (slugToCheck: string) => {
    if (!slugToCheck) {
      setSlugAvailable(null);
      return;
    }

    setIsCheckingSlug(true);
    try {
      const { data, error } = await supabase.rpc('is_store_slug_available', {
        check_slug: slugToCheck,
        exclude_store_id: initialData?.id || null,
      });

      if (error) throw error;
      setSlugAvailable(data);
    } catch (error: any) {
      logger.error("Error checking slug", { error, slug: slugToCheck });
      setSlugAvailable(null);
    } finally {
      setIsCheckingSlug(false);
    }
  }, [initialData?.id]); // Note: toast est stable

  const handleNameChange = useCallback((value: string) => {
    setName(value);
    const generatedSlug = generateSlug(value);
    setSlug(generatedSlug);
    if (generatedSlug) {
      checkSlugAvailability(generatedSlug);
    }
  }, [checkSlugAvailability]);

  const handleSlugChange = useCallback((value: string) => {
    const cleanSlug = generateSlug(value);
    setSlug(cleanSlug);
    if (cleanSlug) {
      checkSlugAvailability(cleanSlug);
    }
  }, [checkSlugAvailability]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !slug) {
      toast({
        title: "Erreur",
        description: "Le nom et le slug sont obligatoires",
        variant: "destructive",
      });
      return;
    }

    if (slugAvailable === false) {
      toast({
        title: "Erreur",
        description: "Ce nom de boutique est déjà utilisé",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Vous devez être connecté");
      }

      if (initialData) {
        // Update existing store
        const { error } = await supabase
          .from('stores')
          .update({
            name,
            slug,
            description: description || null,
            default_currency: defaultCurrency,
          })
          .eq('id', initialData.id);

        if (error) throw error;

        toast({
          title: "Boutique mise à jour",
          description: "Votre boutique a été mise à jour avec succès",
        });
      } else {
        // Create new store - Vérifier si l'utilisateur a déjà une boutique
        const { data: existingStores, error: checkError } = await supabase
          .from('stores')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (checkError) {
          throw checkError;
        }

        if (existingStores && existingStores.length > 0) {
          toast({
            title: "Boutique existante",
            description: "Vous avez déjà une boutique. Un seul compte boutique est autorisé par utilisateur.",
            variant: "destructive",
          });
          return;
        }

        const { error } = await supabase
          .from('stores')
          .insert({
            user_id: user.id,
            name,
            slug,
            description: description || null,
            default_currency: defaultCurrency,
          });

        if (error) {
          // Gérer l'erreur spécifique de limite de la base de données
          if (error.message && (error.message.includes('Limite de 3 boutiques') || error.message.includes('déjà une boutique'))) {
            toast({
              title: "Boutique existante",
              description: "Vous avez déjà une boutique. Un seul compte boutique est autorisé par utilisateur.",
              variant: "destructive",
            });
            return;
          }
          throw error;
        }

        toast({
          title: "Boutique créée",
          description: "Votre boutique a été créée avec succès",
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [name, slug, slugAvailable, defaultCurrency, description, initialData, onSuccess]); // Note: toast est stable

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialData ? "Modifier la boutique" : "Créer votre boutique"}
        </CardTitle>
        <CardDescription>
          {initialData 
            ? "Mettez à jour les informations de votre boutique" 
            : "Configurez votre boutique en ligne"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la boutique *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ma Boutique Pro"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">
              Nom d'URL (slug) *
              {isCheckingSlug && (
                <Loader2 className="inline-block ml-2 h-4 w-4 animate-spin" />
              )}
              {!isCheckingSlug && slugAvailable === true && (
                <Check className="inline-block ml-2 h-4 w-4 text-accent" />
              )}
              {!isCheckingSlug && slugAvailable === false && (
                <X className="inline-block ml-2 h-4 w-4 text-destructive" />
              )}
            </Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="ma-boutique-pro"
              required
            />
            {slug && (
              <p className="text-sm text-muted-foreground">
                Votre boutique sera accessible à : 
                <span className="font-mono ml-1">https://{slug}.lovableproject.com</span>
              </p>
            )}
            {slugAvailable === false && (
              <p className="text-sm text-destructive">
                Ce nom de boutique est déjà pris. Veuillez en choisir un autre.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre boutique..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Devise par défaut</Label>
            <CurrencySelect
              value={defaultCurrency}
              onValueChange={setDefaultCurrency}
            />
            <p className="text-sm text-muted-foreground">
              Cette devise sera utilisée par défaut pour vos nouveaux produits
            </p>
          </div>

          <Button
            type="submit" 
            className="w-full"
            disabled={isSubmitting || slugAvailable === false}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {initialData ? "Mise à jour..." : "Création..."}
              </>
            ) : (
              initialData ? "Mettre à jour" : "Créer ma boutique"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default StoreForm;
