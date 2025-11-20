/**
 * Section Design & Branding
 * Permet de personnaliser les couleurs, logos, typographie
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Palette, Image as ImageIcon, Type, Upload, Eye, RefreshCw } from 'lucide-react';
import { usePlatformCustomization } from '@/hooks/admin/usePlatformCustomization';
import { designTokens } from '@/lib/design-system';

interface DesignBrandingSectionProps {
  onChange?: () => void;
}

export const DesignBrandingSection = ({ onChange }: DesignBrandingSectionProps) => {
  const { customizationData, setCustomizationData, save } = usePlatformCustomization();
  const [localColors, setLocalColors] = useState({
    primary: customizationData?.design?.colors?.primary || 'hsl(210, 100%, 60%)',
    secondary: customizationData?.design?.colors?.secondary || 'hsl(220, 20%, 50%)',
    accent: customizationData?.design?.colors?.accent || 'hsl(45, 100%, 60%)',
    success: customizationData?.design?.colors?.success || 'hsl(142, 71%, 45%)',
    warning: customizationData?.design?.colors?.warning || 'hsl(38, 92%, 50%)',
    error: customizationData?.design?.colors?.error || 'hsl(0, 84%, 60%)',
  });

  const [localTheme, setLocalTheme] = useState<'light' | 'dark' | 'auto'>(
    customizationData?.design?.theme || 'auto'
  );

  useEffect(() => {
    if (onChange) onChange();
  }, [localColors, localTheme, onChange]);

  const handleColorChange = (colorKey: keyof typeof localColors, value: string) => {
    setLocalColors(prev => ({ ...prev, [colorKey]: value }));
    setCustomizationData(prev => ({
      ...prev,
      design: {
        ...prev?.design,
        colors: {
          ...prev?.design?.colors,
          [colorKey]: value,
        },
      },
    }));
    
    // Application en temps réel
    applyColorInRealTime(colorKey, value);
  };

  const applyColorInRealTime = (colorKey: string, value: string) => {
    const root = document.documentElement;
    const hslValue = value.replace('hsl(', '').replace(')', '');
    
    // Mapper les clés aux variables CSS
    const cssVarMap: Record<string, string> = {
      primary: '--primary',
      secondary: '--secondary',
      accent: '--accent',
      success: '--success',
      warning: '--warning',
      error: '--destructive',
    };

    const cssVar = cssVarMap[colorKey];
    if (cssVar) {
      root.style.setProperty(cssVar, hslValue);
    }
  };

  const handleSave = async () => {
    await save('design', {
      colors: localColors,
      theme: localTheme,
      ...customizationData?.design,
    });
  };

  const resetToDefault = () => {
    setLocalColors({
      primary: designTokens.colors.primary[500],
      secondary: designTokens.colors.secondary[500],
      accent: designTokens.colors.accent[500],
      success: designTokens.colors.success[500],
      warning: designTokens.colors.warning[500],
      error: designTokens.colors.error[500],
    });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="colors">
            <Palette className="h-4 w-4 mr-2" />
            Couleurs
          </TabsTrigger>
          <TabsTrigger value="logos">
            <ImageIcon className="h-4 w-4 mr-2" />
            Logos
          </TabsTrigger>
          <TabsTrigger value="typography">
            <Type className="h-4 w-4 mr-2" />
            Typographie
          </TabsTrigger>
        </TabsList>

        {/* Couleurs */}
        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Palette de couleurs</CardTitle>
                  <CardDescription>
                    Personnalisez les couleurs principales de la plateforme
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={resetToDefault}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(localColors).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <Label className="capitalize">{key}</Label>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg border-2 border-border"
                      style={{ backgroundColor: value }}
                    />
                    <Input
                      type="text"
                      value={value}
                      onChange={(e) => handleColorChange(key as keyof typeof localColors, e.target.value)}
                      className="flex-1"
                      placeholder="hsl(210, 100%, 60%)"
                    />
                    <Input
                      type="color"
                      value={value}
                      onChange={(e) => handleColorChange(key as keyof typeof localColors, e.target.value)}
                      className="w-20"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thème</CardTitle>
              <CardDescription>
                Choisissez le thème par défaut de la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                {(['light', 'dark', 'auto'] as const).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => setLocalTheme(theme)}
                    className={`
                      flex-1 p-4 rounded-lg border-2 transition-all
                      ${localTheme === theme
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                      }
                    `}
                  >
                    <div className="text-sm font-medium capitalize mb-1">{theme}</div>
                    <div className="text-xs text-muted-foreground">
                      {theme === 'auto' ? 'Suivre les préférences système' : `Thème ${theme}`}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logos */}
        <TabsContent value="logos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Logos et images</CardTitle>
              <CardDescription>
                Téléchargez les logos pour les thèmes clair et sombre
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Logo (Thème clair)</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-16 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/50">
                      {customizationData?.design?.logo?.light ? (
                        <img
                          src={customizationData.design.logo.light}
                          alt="Logo clair"
                          className="max-w-full max-h-full"
                        />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Télécharger
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Logo (Thème sombre)</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-16 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/50">
                      {customizationData?.design?.logo?.dark ? (
                        <img
                          src={customizationData.design.logo.dark}
                          alt="Logo sombre"
                          className="max-w-full max-h-full"
                        />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Télécharger
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Favicon</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/50">
                      {customizationData?.design?.logo?.favicon ? (
                        <img
                          src={customizationData.design.logo.favicon}
                          alt="Favicon"
                          className="max-w-full max-h-full"
                        />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Télécharger
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typographie */}
        <TabsContent value="typography" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Typographie</CardTitle>
              <CardDescription>
                Configurez les polices et tailles de texte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Famille de police principale</Label>
                <Input
                  defaultValue={designTokens.typography.fontFamily.sans[0]}
                  placeholder="Poppins, system-ui, sans-serif"
                />
              </div>
              <Separator />
              <div className="space-y-4">
                <Label>Tailles de police</Label>
                {Object.entries(designTokens.typography.fontSize).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="text-sm">{key}</Label>
                    <Input
                      defaultValue={value}
                      className="w-32"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={resetToDefault}>
          Réinitialiser
        </Button>
        <Button onClick={handleSave}>
          Sauvegarder les modifications
        </Button>
      </div>
    </div>
  );
};

