# 🧪 Guide de Test des Edge Functions

## 🔍 Vérification que les Edge Functions fonctionnent

### Étape 1: Vérifier que les Edge Functions sont déployées

1. **Ouvrez Supabase Dashboard** → **Edge Functions** → **Functions**
2. **Vérifiez que les fonctions suivantes existent** :
   - ✅ `moneroo`
   - ✅ `paydunya`
   - ✅ `moneroo-webhook`
   - ✅ `paydunya-webhook`

### Étape 2: Vérifier les logs des Edge Functions

1. **Ouvrez Supabase Dashboard** → **Edge Functions** → **Logs**
2. **Sélectionnez la fonction `moneroo`**
3. **Cliquez sur "View logs"**
4. **Cherchez les erreurs récentes** lors d'une tentative de paiement

### Étape 3: Tester les Edge Functions manuellement

#### Test 1: Tester la fonction Moneroo

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
   - ✅ Si succès : Vous devriez voir `{"success": true, "data": {...}}`
   - ❌ Si erreur : Vous verrez le message d'erreur détaillé

#### Test 2: Vérifier les secrets dans les logs

Dans les logs de l'Edge Function, vérifiez :

```
✅ "Moneroo request: { action: 'create_checkout', hasData: true }"
✅ "Moneroo response success: { action: 'create_checkout', status: 200 }"
```

Si vous voyez :
```
❌ "MONEROO_API_KEY is not configured"
```
→ Le secret n'est pas correctement configuré

## 🔧 Résolution des Problèmes

### Problème 1: "Configuration API manquante"

**Cause** : Le secret n'existe pas ou a un mauvais nom

**Solution** :
1. Vérifiez que `MONEROO_API_KEY` existe dans Supabase Dashboard → Edge Functions → Secrets
2. Vérifiez que le nom est **exactement** `MONEROO_API_KEY` (sans `VITE_`)
3. Vérifiez que la valeur est correcte

### Problème 2: "Edge Function returned a non-2xx status code"

**Causes possibles** :
1. **Secrets manquants ou incorrects**
2. **Edge Function non déployée**
3. **Erreur dans l'API externe (Moneroo/PayDunya)**
4. **Erreur de parsing JSON**

**Solution** :
1. **Vérifiez les logs Supabase Edge Functions** pour voir l'erreur exacte
2. **Vérifiez que tous les secrets sont configurés**
3. **Redéployez les Edge Functions** si nécessaire

### Problème 3: Les Edge Functions ne sont pas déployées

**Solution** :
1. **Installez Supabase CLI** :
   ```bash
   npm install -g supabase
   ```

2. **Connectez-vous à Supabase** :
   ```bash
   supabase login
   ```

3. **Déployez les Edge Functions** :
   ```bash
   supabase functions deploy moneroo
   supabase functions deploy paydunya
   ```

## 📝 Checklist de Vérification

- [ ] Les secrets sont configurés dans Supabase Dashboard → Edge Functions → Secrets
- [ ] Les noms des secrets sont corrects (SANS `VITE_`)
- [ ] Les valeurs des secrets sont correctes
- [ ] Les Edge Functions sont déployées
- [ ] Les logs ne montrent pas d'erreurs de configuration
- [ ] Les Edge Functions répondent aux tests manuels

## 🎯 Prochaines Étapes

1. **Vérifiez les logs Supabase Edge Functions** pour voir l'erreur exacte
2. **Testez les Edge Functions manuellement** dans Supabase Dashboard
3. **Vérifiez que les secrets sont correctement configurés**
4. **Redéployez les Edge Functions** si nécessaire






