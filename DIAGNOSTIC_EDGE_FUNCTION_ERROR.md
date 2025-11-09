# 🔍 Diagnostic : Erreur "Edge Function returned a non-2xx status code"

## 📋 Problème

L'erreur `Edge Function returned a non-2xx status code` apparaît lors de la tentative de paiement sur le marketplace.

## 🔍 Étapes de Diagnostic

### Étape 1: Vérifier les Logs Supabase Edge Functions

**C'est la première chose à faire** pour voir l'erreur exacte :

1. **Ouvrez Supabase Dashboard** : https://supabase.com/dashboard
2. **Allez dans Edge Functions** → **Logs**
3. **Sélectionnez la fonction `moneroo`**
4. **Filtrez par "Error"** ou cherchez les logs récents
5. **Cherchez l'erreur** qui correspond à votre tentative de paiement

**Que chercher dans les logs :**
- ✅ `"Moneroo request: { action: 'create_checkout', hasData: true }"` - La requête est reçue
- ❌ `"MONEROO_API_KEY is not configured"` - Secret manquant
- ❌ `"Error parsing request JSON"` - Erreur de format JSON
- ❌ `"Moneroo API error"` - Erreur de l'API Moneroo
- ❌ `"Error in moneroo function"` - Erreur interne

### Étape 2: Vérifier que les Secrets sont Correctement Configurés

Dans Supabase Dashboard → Edge Functions → Secrets, vérifiez :

✅ **Secrets requis (SANS `VITE_`) :**
- `MONEROO_API_KEY` (pas `VITE_MONEROO_API_KEY`)
- `PAYDUNYA_MASTER_KEY` (pas `VITE_PAYDUNYA_MASTER_KEY`)
- `PAYDUNYA_PRIVATE_KEY` (pas `VITE_PAYDUNYA_PRIVATE_KEY`)
- `PAYDUNYA_TOKEN` (pas `VITE_PAYDUNYA_TOKEN`)

✅ **Vérifiez que les valeurs sont correctes :**
- Les clés API doivent être les vraies clés depuis Moneroo/PayDunya
- Pas de caractères supplémentaires ou d'espaces

### Étape 3: Tester l'Edge Function Manuellement

1. **Ouvrez Supabase Dashboard** → **Edge Functions** → **Functions** → **moneroo**
2. **Cliquez sur "Invoke"** ou utilisez l'onglet "Test"
3. **Exécutez cette requête de test** :

```json
{
  "action": "create_checkout",
  "data": {
    "amount": 1000,
    "currency": "XOF",
    "description": "Test payment",
    "return_url": "https://payhula.vercel.app/checkout/success",
    "cancel_url": "https://payhula.vercel.app/checkout/cancel"
  }
}
```

4. **Vérifiez la réponse** :
   - ✅ Si succès : `{"success": true, "data": {...}}`
   - ❌ Si erreur : Notez le message d'erreur exact

### Étape 4: Vérifier que l'Edge Function est Déployée

1. **Vérifiez que l'Edge Function existe** :
   - Supabase Dashboard → Edge Functions → Functions
   - La fonction `moneroo` doit être listée

2. **Vérifiez la version déployée** :
   - Les améliorations récentes (gestion d'erreurs améliorée) doivent être déployées
   - Si nécessaire, redéployez l'Edge Function

### Étape 5: Vérifier les Erreurs dans la Console du Navigateur

1. **Ouvrez la console du navigateur** (F12 → Console)
2. **Essayez d'acheter un produit**
3. **Notez les erreurs** affichées dans la console
4. **Cherchez les messages commençant par** `[MonerooClient]` ou `[MonerooPayment]`

## 🔧 Solutions selon l'Erreur

### Erreur 1: "MONEROO_API_KEY is not configured"

**Cause** : Le secret n'existe pas ou a un mauvais nom

**Solution** :
1. Vérifiez que `MONEROO_API_KEY` existe dans Supabase Dashboard → Edge Functions → Secrets
2. Vérifiez que le nom est **exactement** `MONEROO_API_KEY` (sans `VITE_`)
3. Vérifiez que la valeur est correcte (clé API Moneroo valide)

### Erreur 2: "Error parsing request JSON"

**Cause** : Le format de la requête est incorrect

**Solution** :
1. Vérifiez les logs pour voir le format de la requête reçue
2. Vérifiez que `action` et `data` sont bien présents dans la requête

### Erreur 3: "Moneroo API error" (401, 403, etc.)

**Cause** : La clé API Moneroo est invalide ou expirée

**Solution** :
1. Vérifiez que la clé API Moneroo est valide
2. Vérifiez que la clé API n'a pas expiré
3. Régénérez une nouvelle clé API dans Moneroo Dashboard si nécessaire

### Erreur 4: "Error in moneroo function"

**Cause** : Erreur interne dans l'Edge Function

**Solution** :
1. Vérifiez les logs pour voir la stack trace complète
2. Vérifiez que l'Edge Function est à jour (redéployez si nécessaire)
3. Vérifiez que toutes les dépendances sont correctes

## 📝 Checklist de Diagnostic

- [ ] Les logs Supabase Edge Functions ont été consultés
- [ ] L'erreur exacte a été identifiée dans les logs
- [ ] Les secrets sont correctement configurés (noms et valeurs)
- [ ] L'Edge Function a été testée manuellement
- [ ] L'Edge Function est déployée et à jour
- [ ] Les erreurs dans la console du navigateur ont été vérifiées
- [ ] La clé API Moneroo est valide et active

## 🎯 Prochaines Étapes

1. **Consultez les logs Supabase Edge Functions** - C'est la source de vérité
2. **Identifiez l'erreur exacte** dans les logs
3. **Appliquez la solution** correspondante ci-dessus
4. **Testez à nouveau** le paiement

## 📚 Ressources

- [Guide Configuration Secrets](./GUIDE_CONFIGURATION_SECRETS_SUPABASE.md)
- [Guide Test Edge Functions](./GUIDE_TEST_EDGE_FUNCTIONS.md)
- [Documentation Supabase Edge Functions](https://supabase.com/docs/guides/functions)

