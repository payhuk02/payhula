import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { TwoFactorAuth } from "@/components/auth/TwoFactorAuth";
import { 
  Loader2, 
  Shield, 
  Key, 
  CheckCircle2, 
  AlertCircle,
  Save,
  Eye,
  EyeOff,
  Clock,
  Trash2,
  Settings,
  Activity
} from "lucide-react";

interface SecuritySettings {
  // Password
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  
  // Session management
  activeSessions: Array<{
    id: string;
    device: string;
    location: string;
    lastActive: string;
    current: boolean;
  }>;
  
  // Security events
  recentLogins: Array<{
    id: string;
    timestamp: string;
    device: string;
    location: string;
    success: boolean;
  }>;
  
  // Privacy settings
  showOnlineStatus: boolean;
  allowDataCollection: boolean;
  marketingEmails: boolean;
}

export const SecuritySettings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [settings, setSettings] = useState<SecuritySettings>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    activeSessions: [],
    recentLogins: [],
    showOnlineStatus: true,
    allowDataCollection: false,
    marketingEmails: false,
  });

  useEffect(() => {
    loadSecuritySettings();
  }, []);

  const loadSecuritySettings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load active sessions (if table exists)
      const { data: sessionsData } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_active', { ascending: false });

      // Load recent logins (if table exists)
      const { data: loginsData } = await supabase
        .from('user_login_history')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(10);

      // Load privacy settings from profile or user_security_settings
      const { data: privacyData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setSettings(prev => ({
        ...prev,
        activeSessions: sessionsData || [],
        recentLogins: loginsData || [],
        showOnlineStatus: privacyData?.show_online_status ?? true,
        allowDataCollection: privacyData?.allow_data_collection ?? false,
        marketingEmails: privacyData?.marketing_emails ?? false,
      }));
    } catch (error: any) {
      console.error('Error loading security settings:', error);
      // Don't show error toast if tables don't exist yet (graceful degradation)
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (settings.newPassword !== settings.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return;
    }

    if (settings.newPassword.length < 8) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 8 caractères",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: settings.newPassword,
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Mot de passe modifié avec succès",
      });

      setSettings(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };


  const terminateSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      setSettings(prev => ({
        ...prev,
        activeSessions: prev.activeSessions.filter(s => s.id !== sessionId),
      }));

      toast({
        title: "Succès",
        description: "Session terminée",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de terminer la session",
        variant: "destructive",
      });
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (password.match(/[a-z]/)) strength += 20;
    if (password.match(/[A-Z]/)) strength += 20;
    if (password.match(/[0-9]/)) strength += 20;
    if (password.match(/[^a-zA-Z0-9]/)) strength += 20;
    return strength;
  };

  const getPasswordStrengthColor = (strength: number) => {
    if (strength < 40) return "bg-red-500";
    if (strength < 60) return "bg-orange-500";
    if (strength < 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = (strength: number) => {
    if (strength < 40) return "Faible";
    if (strength < 60) return "Moyen";
    if (strength < 80) return "Bon";
    return "Très fort";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des paramètres de sécurité...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Vue d'ensemble de la sécurité
          </CardTitle>
          <CardDescription>
            État actuel de la sécurité de votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-blue-600">
                {settings.activeSessions.length}
              </div>
              <div className="text-sm text-muted-foreground">Sessions actives</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-purple-600">
                {settings.recentLogins.filter(l => l.success).length}
              </div>
              <div className="text-sm text-muted-foreground">Connexions réussies</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Mot de passe
          </CardTitle>
          <CardDescription>
            Changez votre mot de passe pour sécuriser votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mot de passe actuel</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={settings.currentPassword}
                  onChange={(e) => setSettings(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Votre mot de passe actuel"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={settings.newPassword}
                  onChange={(e) => setSettings(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Votre nouveau mot de passe"
                  minLength={8}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {settings.newPassword && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Force du mot de passe</span>
                    <span>{getPasswordStrengthText(getPasswordStrength(settings.newPassword))}</span>
                  </div>
                  <Progress 
                    value={getPasswordStrength(settings.newPassword)} 
                    className="h-2"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={settings.confirmPassword}
                  onChange={(e) => setSettings(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirmez votre nouveau mot de passe"
                  minLength={8}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Changer le mot de passe
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication - Professional Component */}
      <TwoFactorAuth />

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Sessions actives
          </CardTitle>
          <CardDescription>
            Gérez les appareils connectés à votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {settings.activeSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{session.device}</span>
                    {session.current && (
                      <Badge variant="secondary">Actuel</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {session.location} • Dernière activité: {new Date(session.lastActive).toLocaleString()}
                  </div>
                </div>
                {!session.current && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => terminateSession(session.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {settings.activeSessions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucune session active
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Logins */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Connexions récentes
          </CardTitle>
          <CardDescription>
            Historique des connexions à votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {settings.recentLogins.map((login) => (
              <div key={login.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{login.device}</span>
                    {login.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {login.location} • {new Date(login.timestamp).toLocaleString()}
                  </div>
                </div>
                <Badge variant={login.success ? "default" : "destructive"}>
                  {login.success ? "Réussi" : "Échec"}
                </Badge>
              </div>
            ))}
            {settings.recentLogins.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucune connexion récente
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Paramètres de confidentialité
          </CardTitle>
          <CardDescription>
            Contrôlez la visibilité de votre compte et l'utilisation des données
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Statut en ligne</Label>
              <p className="text-sm text-muted-foreground">
                Permettre aux autres utilisateurs de voir que vous êtes en ligne
              </p>
            </div>
            <Button
              variant={settings.showOnlineStatus ? "default" : "outline"}
              onClick={() => setSettings(prev => ({ ...prev, showOnlineStatus: !prev.showOnlineStatus }))}
            >
              {settings.showOnlineStatus ? "Activé" : "Désactivé"}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Collecte de données</Label>
              <p className="text-sm text-muted-foreground">
                Permettre la collecte de données anonymes pour améliorer le service
              </p>
            </div>
            <Button
              variant={settings.allowDataCollection ? "default" : "outline"}
              onClick={() => setSettings(prev => ({ ...prev, allowDataCollection: !prev.allowDataCollection }))}
            >
              {settings.allowDataCollection ? "Activé" : "Désactivé"}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Emails marketing</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir des emails marketing et des offres spéciales
              </p>
            </div>
            <Button
              variant={settings.marketingEmails ? "default" : "outline"}
              onClick={() => setSettings(prev => ({ ...prev, marketingEmails: !prev.marketingEmails }))}
            >
              {settings.marketingEmails ? "Activé" : "Désactivé"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};