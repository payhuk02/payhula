# 🔧 Correction : Endpoint Moneroo Incorrect

## 📋 Problème Identifié

D'après les logs Supabase Edge Functions, l'erreur suivante apparaît :

```
Moneroo API error: {
  message: "The route v1/checkout/initialize could not be found.",
  data: null,
  errors: []
}
```

## 🔍 Analyse

L'endpoint `/checkout/initialize` n'existe pas dans l'API Moneroo. Il faut vérifier la documentation Moneroo pour trouver le bon endpoint.

## ✅ Solutions Possibles

### Solution 1: Utiliser l'endpoint `/checkout` (sans `/initialize`)

L'endpoint pourrait être simplement `/checkout` au lieu de `/checkout/initialize`.

**Code corrigé :**
```typescript
case 'create_checkout':
  endpoint = '/checkout';  // Au lieu de '/checkout/initialize'
  method = 'POST';
  break;
```

### Solution 2: Utiliser l'endpoint `/payments`

L'API Moneroo pourrait utiliser `/payments` pour créer un checkout.

**Code corrigé :**
```typescript
case 'create_checkout':
  endpoint = '/payments';  // Utiliser /payments pour créer un checkout
  method = 'POST';
  break;
```

### Solution 3: Vérifier la Documentation Moneroo

**Actions requises :**
1. Consulter la documentation officielle Moneroo
2. Vérifier l'URL de base de l'API
3. Vérifier les endpoints disponibles
4. Corriger le code selon la documentation

## 🔗 Documentation Moneroo

- **Dashboard Moneroo** : https://moneroo.io/dashboard
- **Documentation API** : Vérifier dans le dashboard Moneroo → Documentation
- **Support** : Contacter le support Moneroo si nécessaire

## 📝 Prochaines Étapes

1. **Vérifier la documentation Moneroo** pour l'endpoint correct
2. **Tester différents endpoints** :
   - `/checkout`
   - `/payments`
   - `/v1/checkout`
   - Autre endpoint selon la documentation
3. **Mettre à jour le code** avec le bon endpoint
4. **Redéployer l'Edge Function**
5. **Tester à nouveau**

## 🎯 Endpoints à Tester

### Test 1: `/checkout`
```typescript
endpoint = '/checkout';
```

### Test 2: `/payments`
```typescript
endpoint = '/payments';
```

### Test 3: `/v1/checkout`
```typescript
endpoint = '/v1/checkout';
```

### Test 4: Endpoint selon documentation
Vérifier la documentation Moneroo pour l'endpoint exact.

## ⚠️ Important

**Avant de corriger :**
1. Vérifier la documentation officielle Moneroo
2. Tester l'endpoint avec Postman ou curl
3. Vérifier le format des données attendu par Moneroo
4. Vérifier l'authentification (Bearer token, header, etc.)

## 🔧 Correction Temporaire

En attendant de vérifier la documentation, j'ai modifié le code pour :
1. Utiliser `/checkout` au lieu de `/checkout/initialize`
2. Formater les données selon le format Moneroo attendu
3. Ajouter des logs pour diagnostic

**Si l'erreur persiste :**
1. Vérifier la documentation Moneroo
2. Contacter le support Moneroo
3. Tester avec Postman pour trouver le bon endpoint

