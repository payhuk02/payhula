import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencySelect } from "@/components/ui/currency-select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generateSlug } from "@/lib/store-utils";
import { logger } from "@/lib/logger";
import { useStoreContext } from "@/contexts/StoreContext";
import { Loader2, Check, X, Globe, Phone, Info } from '@/components/icons';
import { Image as ImageIcon, Mail, Facebook, Instagram, Twitter, Linkedin, Palette } from 'lucide-react';
import StoreImageUpload from "./StoreImageUpload";

interface StoreFormProps {
  onSuccess: () => void;
  initialData?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    default_currency?: string;
    logo_url?: string | null;
    banner_url?: string | null;
    about?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    facebook_url?: string | null;
    instagram_url?: string | null;
    twitter_url?: string | null;
    linkedin_url?: string | null;
    info_message?: string | null;
    info_message_color?: string | null;
    info_message_font?: string | null;
  };
}

const StoreForm = ({ onSuccess, initialData }: StoreFormProps) => {
  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [defaultCurrency, setDefaultCurrency] = useState(initialData?.default_currency || "XOF");
  const [logoUrl, setLogoUrl] = useState(initialData?.logo_url || "");
  const [bannerUrl, setBannerUrl] = useState(initialData?.banner_url || "");
  const [about, setAbout] = useState(initialData?.about || "");
  const [contactEmail, setContactEmail] = useState(initialData?.contact_email || "");
  const [contactPhone, setContactPhone] = useState(initialData?.contact_phone || "");
  const [facebookUrl, setFacebookUrl] = useState(initialData?.facebook_url || "");
  const [instagramUrl, setInstagramUrl] = useState(initialData?.instagram_url || "");
  const [twitterUrl, setTwitterUrl] = useState(initialData?.twitter_url || "");
  const [linkedinUrl, setLinkedinUrl] = useState(initialData?.linkedin_url || "");
  const [infoMessage, setInfoMessage] = useState(initialData?.info_message || "");
  const [infoMessageColor, setInfoMessageColor] = useState(initialData?.info_message_color || "#3b82f6");
  const [infoMessageFont, setInfoMessageFont] = useState(initialData?.info_message_font || "Inter");
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { refreshStores } = useStoreContext();

  const checkSlugAvailability = useCallback(async (slugToCheck: string) => {
    if (!slugToCheck) {
      setSlugAvailable(null);
      return;
    }

    setIsCheckingSlug(true);
    try {
      const { data, error } = await supabase.rpc('is_store_slug_available', {
        check_slug: slugToCheck,
        exclude_store_id: initialData?.id ?? undefined,
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
            logo_url: logoUrl || null,
            banner_url: bannerUrl || null,
            about: about || null,
            contact_email: contactEmail || null,
            contact_phone: contactPhone || null,
            facebook_url: facebookUrl || null,
            instagram_url: instagramUrl || null,
            twitter_url: twitterUrl || null,
            linkedin_url: linkedinUrl || null,
            info_message: infoMessage || null,
            info_message_color: infoMessageColor || "#3b82f6",
            info_message_font: infoMessageFont || "Inter",
          })
          .eq('id', initialData.id);

        if (error) throw error;

        toast({
          title: "Boutique mise à jour",
          description: "Votre boutique a été mise à jour avec succès",
        });
      } else {
        // Create new store - Vérifier la limite de 3 boutiques
        const { data: existingStores, error: checkError } = await supabase
          .from('stores')
          .select('id')
          .eq('user_id', user.id);

        if (checkError) {
          throw checkError;
        }

        const storeCount = existingStores?.length || 0;
        if (storeCount >= 3) {
          toast({
            title: "Limite atteinte",
            description: "Limite de 3 boutiques par utilisateur atteinte. Vous devez supprimer une boutique existante avant d'en créer une nouvelle.",
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
            logo_url: logoUrl || null,
            banner_url: bannerUrl || null,
            about: about || null,
            contact_email: contactEmail || null,
            contact_phone: contactPhone || null,
            facebook_url: facebookUrl || null,
            instagram_url: instagramUrl || null,
            twitter_url: twitterUrl || null,
            linkedin_url: linkedinUrl || null,
            info_message: infoMessage || null,
            info_message_color: infoMessageColor || "#3b82f6",
            info_message_font: infoMessageFont || "Inter",
          });

        if (error) {
          // Gérer l'erreur spécifique de limite de la base de données
          if (error.message && error.message.includes('Limite de 3 boutiques')) {
            toast({
              title: "Limite atteinte",
              description: "Limite de 3 boutiques par utilisateur atteinte. Vous devez supprimer une boutique existante avant d'en créer une nouvelle.",
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

        // Rafraîchir la liste des boutiques et sélectionner la nouvelle
        await refreshStores();
        // La nouvelle boutique sera automatiquement sélectionnée par le contexte
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
  }, [name, slug, slugAvailable, defaultCurrency, description, logoUrl, bannerUrl, about, contactEmail, contactPhone, facebookUrl, instagramUrl, twitterUrl, linkedinUrl, initialData, onSuccess, refreshStores, toast]);

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
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span className="hidden sm:inline">Informations</span>
                <span className="sm:hidden">Infos</span>
              </TabsTrigger>
              <TabsTrigger value="branding" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Image & Design</span>
                <span className="sm:hidden">Design</span>
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Contact & Réseaux</span>
                <span className="sm:hidden">Contact</span>
              </TabsTrigger>
            </TabsList>

            {/* Onglet Informations de base */}
            <TabsContent value="basic" className="space-y-4 mt-4">
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
                <Label htmlFor="description">Description courte</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez votre boutique en quelques mots..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Cette description apparaîtra sur la page de votre boutique
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="about">À propos (optionnel)</Label>
                <Textarea
                  id="about"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="Racontez l'histoire de votre boutique, vos valeurs, votre mission..."
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  Texte détaillé qui apparaîtra dans l'onglet "À propos" de votre boutique
                </p>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="info_message">Message informatif (optionnel)</Label>
                  <Textarea
                    id="info_message"
                    value={infoMessage}
                    onChange={(e) => setInfoMessage(e.target.value)}
                    placeholder="Ex: 🎉 Promotion spéciale : -20% sur tous les produits jusqu'au 31 janvier !"
                    rows={3}
                    maxLength={500}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Message qui s'affichera en haut de votre boutique (promotions, alertes, annonces, etc.)
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {infoMessage.length}/500
                    </span>
                  </div>
                </div>

                {infoMessage && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="info_message_color" className="flex items-center gap-2">
                          <Palette className="h-4 w-4" />
                          Couleur du message
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="info_message_color"
                            type="color"
                            value={infoMessageColor}
                            onChange={(e) => setInfoMessageColor(e.target.value)}
                            className="h-10 w-20 cursor-pointer"
                          />
                          <Input
                            type="text"
                            value={infoMessageColor}
                            onChange={(e) => setInfoMessageColor(e.target.value)}
                            placeholder="#3b82f6"
                            pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                            className="flex-1 font-mono text-sm"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Format hexadécimal (ex: #3b82f6)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="info_message_font">Police du message</Label>
                        <Select
                          value={infoMessageFont}
                          onValueChange={setInfoMessageFont}
                        >
                          <SelectTrigger id="info_message_font">
                            <SelectValue placeholder="Choisir une police" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Inter">Inter (par défaut)</SelectItem>
                            <SelectItem value="Roboto">Roboto</SelectItem>
                            <SelectItem value="Open Sans">Open Sans</SelectItem>
                            <SelectItem value="Lato">Lato</SelectItem>
                            <SelectItem value="Montserrat">Montserrat</SelectItem>
                            <SelectItem value="Poppins">Poppins</SelectItem>
                            <SelectItem value="Raleway">Raleway</SelectItem>
                            <SelectItem value="Ubuntu">Ubuntu</SelectItem>
                            <SelectItem value="Nunito">Nunito</SelectItem>
                            <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Police utilisée pour afficher le message
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Aperçu du message</Label>
                      <div 
                        className="p-4 rounded-lg border-2 border-dashed"
                        style={{
                          backgroundColor: `${infoMessageColor}15`,
                          borderColor: `${infoMessageColor}40`,
                        }}
                      >
                        <p
                          className="text-sm text-center"
                          style={{
                            color: infoMessageColor,
                            fontFamily: infoMessageFont,
                          }}
                        >
                          {infoMessage || "Votre message apparaîtra ici..."}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Aperçu de l'apparence du message sur votre boutique
                      </p>
                    </div>
                  </>
                )}
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
            </TabsContent>

            {/* Onglet Image & Design */}
            <TabsContent value="branding" className="space-y-6 mt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Images de votre boutique
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Personnalisez l'apparence de votre boutique avec un logo et une bannière professionnels
                  </p>
                </div>

                <div className="space-y-4">
                  <StoreImageUpload
                    label="Logo de la boutique"
                    value={logoUrl}
                    onChange={setLogoUrl}
                    aspectRatio="square"
                    description="Format recommandé: 500×500 (ratio 1:1) pour les logos. Le logo apparaîtra sur votre page boutique."
                    maxSize={5}
                    imageType="store-logo"
                  />

                  <StoreImageUpload
                    label="Bannière de la boutique"
                    value={bannerUrl}
                    onChange={setBannerUrl}
                    aspectRatio="banner"
                    description="Format recommandé: 1920×600 (ratio 16:5) pour les bannières. La bannière apparaîtra en haut de votre page boutique."
                    maxSize={10}
                    imageType="store-banner"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Onglet Contact & Réseaux sociaux */}
            <TabsContent value="contact" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Informations de contact
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Permettez à vos clients de vous contacter facilement
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_email">
                    <Mail className="inline-block h-4 w-4 mr-2" />
                    Email de contact
                  </Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contact@votreboutique.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Cet email sera affiché sur votre page boutique pour les demandes de contact
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone">
                    <Phone className="inline-block h-4 w-4 mr-2" />
                    Téléphone de contact
                  </Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+226 XX XX XX XX"
                  />
                  <p className="text-xs text-muted-foreground">
                    Numéro de téléphone pour contacter votre boutique
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Réseaux sociaux
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Liez vos réseaux sociaux pour renforcer votre présence en ligne
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="facebook_url" className="flex items-center gap-2">
                      <Facebook className="h-4 w-4 text-blue-600" />
                      Facebook
                    </Label>
                    <Input
                      id="facebook_url"
                      type="url"
                      value={facebookUrl}
                      onChange={(e) => setFacebookUrl(e.target.value)}
                      placeholder="https://facebook.com/votreboutique"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram_url" className="flex items-center gap-2">
                      <Instagram className="h-4 w-4 text-pink-600" />
                      Instagram
                    </Label>
                    <Input
                      id="instagram_url"
                      type="url"
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                      placeholder="https://instagram.com/votreboutique"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitter_url" className="flex items-center gap-2">
                      <Twitter className="h-4 w-4 text-blue-400" />
                      Twitter / X
                    </Label>
                    <Input
                      id="twitter_url"
                      type="url"
                      value={twitterUrl}
                      onChange={(e) => setTwitterUrl(e.target.value)}
                      placeholder="https://twitter.com/votreboutique"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url" className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4 text-blue-700" />
                      LinkedIn
                    </Label>
                    <Input
                      id="linkedin_url"
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/company/votreboutique"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="pt-4 border-t">
            <Button
              type="submit" 
              className="w-full"
              disabled={isSubmitting || slugAvailable === false}
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {initialData ? "Mise à jour..." : "Création..."}
                </>
              ) : (
                <>
                  {initialData ? "Mettre à jour la boutique" : "Créer ma boutique"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default StoreForm;
