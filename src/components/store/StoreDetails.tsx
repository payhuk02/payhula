import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, ExternalLink, Save, X, BarChart3, Settings, Palette, Globe, AlertCircle } from "lucide-react";
import { useStore, Store } from "@/hooks/useStore";
import { useToast } from "@/hooks/use-toast";
import StoreSlugEditor from "./StoreSlugEditor";
import StoreImageUpload from "./StoreImageUpload";
import StoreAnalytics from "./StoreAnalytics";
import { validateStoreForm } from "@/lib/validation-utils";

interface ExtendedStore extends Store {
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
}

interface StoreDetailsProps {
  store: ExtendedStore;
}

const StoreDetails = ({ store }: StoreDetailsProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(store.name);
  const [description, setDescription] = useState(store.description || "");
  const [logoUrl, setLogoUrl] = useState(store.logo_url || "");
  const [bannerUrl, setBannerUrl] = useState(store.banner_url || "");
  const [about, setAbout] = useState(store.about || "");
  const [contactEmail, setContactEmail] = useState(store.contact_email || "");
  const [contactPhone, setContactPhone] = useState(store.contact_phone || "");
  const [facebookUrl, setFacebookUrl] = useState(store.facebook_url || "");
  const [instagramUrl, setInstagramUrl] = useState(store.instagram_url || "");
  const [twitterUrl, setTwitterUrl] = useState(store.twitter_url || "");
  const [linkedinUrl, setLinkedinUrl] = useState(store.linkedin_url || "");
  const [infoMessage, setInfoMessage] = useState(store.info_message || "");
  const [infoMessageColor, setInfoMessageColor] = useState(store.info_message_color || "#3b82f6");
  const [infoMessageFont, setInfoMessageFont] = useState(store.info_message_font || "Inter");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { updateStore, getStoreUrl, checkSlugAvailability } = useStore();
  const { toast } = useToast();

  const handleSlugUpdate = async (newSlug: string): Promise<boolean> => {
    return await updateStore({ slug: newSlug });
  };

  const storeUrl = getStoreUrl();

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(storeUrl);
    toast({
      title: "Lien copié !",
      description: "Le lien de votre boutique a été copié dans le presse-papiers."
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    
    // Validation du formulaire
    const formData = {
      name: name.trim(),
      description: description.trim() || undefined,
      contact_email: contactEmail.trim() || undefined,
      contact_phone: contactPhone.trim() || undefined,
      facebook_url: facebookUrl.trim() || undefined,
      instagram_url: instagramUrl.trim() || undefined,
      twitter_url: twitterUrl.trim() || undefined,
      linkedin_url: linkedinUrl.trim() || undefined,
    };

    const validation = validateStoreForm(formData);

    if (!validation.valid) {
      setValidationErrors(validation.errors);
      toast({
        title: "Erreurs de validation",
        description: "Veuillez corriger les erreurs avant de continuer.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    const updates: any = {
      name: name.trim(),
      description: description.trim() || null,
      logo_url: logoUrl || null,
      banner_url: bannerUrl || null,
      about: about.trim() || null,
      info_message: infoMessage.trim() || null,
      info_message_color: infoMessageColor || "#3b82f6",
      info_message_font: infoMessageFont || "Inter",
      contact_email: contactEmail.trim() || null,
      contact_phone: contactPhone.trim() || null,
      facebook_url: facebookUrl.trim() || null,
      instagram_url: instagramUrl.trim() || null,
      twitter_url: twitterUrl.trim() || null,
      linkedin_url: linkedinUrl.trim() || null,
    };

    const success = await updateStore(updates);
    setIsSubmitting(false);

    if (success) {
      setIsEditing(false);
      setValidationErrors({});
      toast({
        title: "Boutique mise à jour",
        description: "Toutes les modifications ont été enregistrées."
      });
    }
  };

  const handleCancel = () => {
    setName(store.name);
    setDescription(store.description || "");
    setLogoUrl(store.logo_url || "");
    setBannerUrl(store.banner_url || "");
    setAbout(store.about || "");
    setInfoMessage(store.info_message || "");
    setInfoMessageColor(store.info_message_color || "#3b82f6");
    setInfoMessageFont(store.info_message_font || "Inter");
    setContactEmail(store.contact_email || "");
    setContactPhone(store.contact_phone || "");
    setFacebookUrl(store.facebook_url || "");
    setInstagramUrl(store.instagram_url || "");
    setTwitterUrl(store.twitter_url || "");
    setLinkedinUrl(store.linkedin_url || "");
    setValidationErrors({});
    setIsEditing(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header avec informations de la boutique */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4 sm:p-6 border border-primary/20 border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            {store.logo_url ? (
              <img 
                src={store.logo_url} 
                alt={`Logo ${store.name}`}
                className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg object-cover border border-border shadow-sm"
              />
            ) : (
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/10 flex items-center justify-center border border-purple-500/30">
                <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400" />
              </div>
            )}
            <div>
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-foreground">{store.name}</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Boutique en ligne</p>
              {store.description && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">{store.description}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/stores/${store.slug}`, '_blank')}
              className="touch-manipulation text-xs sm:text-sm h-8 sm:h-10"
              aria-label={`Ouvrir la boutique ${store.name} dans un nouvel onglet`}
            >
              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" aria-hidden="true" />
              <span className="hidden sm:inline">Voir la boutique</span>
              <span className="sm:hidden">Voir</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyUrl}
              className="touch-manipulation text-xs sm:text-sm h-8 sm:h-10"
              aria-label={`Copier le lien de la boutique ${store.name}`}
            >
              <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" aria-hidden="true" />
              <span className="hidden sm:inline">Copier le lien</span>
              <span className="sm:hidden">Copier</span>
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 mb-4 sm:mb-6">
          <TabsTrigger value="settings" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm touch-manipulation min-h-[44px]">
            <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Paramètres</span>
            <span className="sm:hidden">Config</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm touch-manipulation min-h-[44px]">
            <Palette className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Apparence</span>
            <span className="sm:hidden">Style</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm touch-manipulation min-h-[44px]">
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Analytics</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
          <TabsTrigger value="url" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm touch-manipulation min-h-[44px]">
            <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">URL</span>
            <span className="sm:hidden">Lien</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4 sm:space-y-6">
          <Card className="store-card">
            <CardHeader className="store-card-header">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-lg sm:text-xl font-semibold">Paramètres de la boutique</CardTitle>
                  <CardDescription className="text-sm sm:text-base mt-1">
                    Gérez tous les détails de votre boutique en ligne
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2 self-end sm:self-auto">
                  {isEditing ? (
                    <>
                      <Button 
                        size="sm" 
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="store-button-primary text-xs sm:text-sm shrink-0 min-w-[100px] sm:min-w-[120px]"
                      >
                        <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        {isSubmitting ? "..." : "Enregistrer"}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleCancel}
                        disabled={isSubmitting}
                        className="store-button-secondary text-xs sm:text-sm shrink-0 min-w-[90px] sm:min-w-[100px]"
                      >
                        <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        Annuler
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsEditing(true)}
                      className="store-button-secondary text-xs sm:text-sm shrink-0 min-w-[90px] sm:min-w-[100px]"
                    >
                      <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      Modifier
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="store-card-content">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Nom de la boutique *</Label>
                    <Input
                      id="edit-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                    {name !== store.name && (
                      <p className="text-xs text-muted-foreground">
                        Nouveau slug : {name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Description courte</Label>
                    <Textarea
                      id="edit-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder="Une brève description de votre boutique"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Email de contact</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="contact@votreboutique.com"
                      disabled={isSubmitting}
                      className={validationErrors.contact_email ? "border-destructive" : ""}
                    />
                    {validationErrors.contact_email && (
                      <div className="flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        <span>{validationErrors.contact_email}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-phone">Téléphone de contact</Label>
                    <Input
                      id="contact-phone"
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+225 XX XX XX XX"
                      disabled={isSubmitting}
                      className={validationErrors.contact_phone ? "border-destructive" : ""}
                    />
                    {validationErrors.contact_phone && (
                      <div className="flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        <span>{validationErrors.contact_phone}</span>
                      </div>
                    )}
                  </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="about">À propos de votre boutique</Label>
                    <Textarea
                      id="about"
                      value={about}
                      onChange={(e) => setAbout(e.target.value)}
                      rows={8}
                      placeholder="Racontez l'histoire de votre boutique, vos valeurs, votre mission..."
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ce texte apparaîtra dans l'onglet "À propos" de votre boutique
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
                        disabled={isSubmitting}
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
                              disabled={isSubmitting}
                            />
                            <Input
                              type="text"
                              value={infoMessageColor}
                              onChange={(e) => setInfoMessageColor(e.target.value)}
                              placeholder="#3b82f6"
                              pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                              className="flex-1 font-mono text-sm"
                              disabled={isSubmitting}
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
                            disabled={isSubmitting}
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
                    )}

                    {infoMessage && (
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
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Nom</p>
                    <p className="font-medium">{store.name}</p>
                  </div>

                  {store.description && (
                    <div>
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p className="text-sm">{store.description}</p>
                    </div>
                  )}

                  {(store.contact_email || store.contact_phone) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {store.contact_email && (
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="text-sm">{store.contact_email}</p>
                        </div>
                      )}
                      {store.contact_phone && (
                        <div>
                          <p className="text-sm text-muted-foreground">Téléphone</p>
                          <p className="text-sm">{store.contact_phone}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {store.about && (
                    <div>
                      <p className="text-sm text-muted-foreground">À propos</p>
                      <p className="text-sm whitespace-pre-wrap">{store.about}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Apparence de la boutique</CardTitle>
              <CardDescription className="text-sm">Personnalisez le look de votre boutique</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              {isEditing ? (
                <div className="space-y-6">
                  <StoreImageUpload
                    label="Logo de la boutique"
                    value={logoUrl}
                    onChange={setLogoUrl}
                    disabled={isSubmitting}
                    aspectRatio="square"
                    description="Format carré recommandé (ex: 500x500px)"
                    imageType="store-logo"
                  />

                  <StoreImageUpload
                    label="Bannière de la boutique"
                    value={bannerUrl}
                    onChange={setBannerUrl}
                    disabled={isSubmitting}
                    aspectRatio="banner"
                    description="Format paysage recommandé (ex: 1920x640px)"
                    imageType="store-banner"
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {store.logo_url && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Logo</p>
                        <img 
                          src={store.logo_url} 
                          alt="Logo" 
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                    {store.banner_url && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground mb-2">Bannière</p>
                        <img 
                          src={store.banner_url} 
                          alt="Bannière" 
                          className="w-full max-h-48 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
          <Card className="store-card">
            <CardHeader className="store-card-header">
              <CardTitle className="text-lg sm:text-xl font-semibold">Analytics de votre boutique</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Suivez les performances de votre boutique avec des statistiques détaillées
              </CardDescription>
            </CardHeader>
            <CardContent className="store-card-content">
              <StoreAnalytics storeId={store.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="url" className="space-y-6">
          <StoreSlugEditor
            currentSlug={store.slug}
            onSlugChange={handleSlugUpdate}
            onCheckAvailability={checkSlugAvailability}
            storeId={store.id}
          />

          <Card className="shadow-medium border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Lien de votre boutique</CardTitle>
              <CardDescription className="text-sm">Partagez ce lien pour que vos clients accèdent à votre boutique</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Input
                  value={storeUrl}
                  readOnly
                  className="font-mono text-xs sm:text-sm flex-1 touch-manipulation"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyUrl}
                    title="Copier le lien"
                    className="touch-manipulation flex-1 sm:flex-none"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(storeUrl, '_blank')}
                    title="Ouvrir dans un nouvel onglet"
                    className="touch-manipulation flex-1 sm:flex-none"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-3 sm:p-4 bg-muted rounded-lg">
                <p className="text-xs sm:text-sm">
                  <strong>Format du lien :</strong>
                </p>
                <p className="text-xs text-muted-foreground mt-1 break-all">
                  https://{store.slug}.{store.custom_domain || window.location.hostname}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Vos produits seront accessibles à :<br />
                  <code className="text-xs break-all">https://{store.slug}.{store.custom_domain || window.location.hostname}/nom-du-produit</code>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Réseaux sociaux */}
      {(store.facebook_url || store.instagram_url || store.twitter_url || store.linkedin_url) && (
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Réseaux sociaux</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="flex flex-wrap gap-2">
              {store.facebook_url && (
                <a 
                  href={store.facebook_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Facebook
                </a>
              )}
              {store.instagram_url && (
                <a 
                  href={store.instagram_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Instagram
                </a>
              )}
              {store.twitter_url && (
                <a 
                  href={store.twitter_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Twitter
                </a>
              )}
              {store.linkedin_url && (
                <a 
                  href={store.linkedin_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  LinkedIn
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StoreDetails;
