# 🔍 Guía de Depuración Exhaustiva - Cookies Cross-Domain

Esta guía te ayudará a identificar exactamente dónde falla el flujo de cookies en la aplicación.

## 📋 Prerequisitos

1. **Activar debugging en backend:**
   ```bash
   export DEBUG_COOKIES=true
   npm run start:dev
   ```

2. **Abrir DevTools en el navegador:**
   - Presiona F12
   - Ve a la pestaña **Console**
   - Activa "Preserve log" para no perder logs al navegar

## 🔄 Flujo Completo de Debugging

El flujo está dividido en PASOS que se loggean en orden:

```
FRONTEND                           BACKEND
=========                          =======

📍 Paso 0: AuthService prepara
           petición
           ↓
📍 Paso 1: Interceptor recibe
           request original
           ↓
📍 Paso 2: Interceptor clona
           request
           ↓
           ========== HTTP ==========>
                                    📍 Paso A: Backend recibe request
                                              ↓
                                    📍 Paso B: Backend setea cookie
                                              ↓
                                    📍 Paso C: Verifica Set-Cookie header
                                              ↓
                                    📍 Paso D: Envía respuesta
           <========== HTTP ==========
           ↓
📍 Paso 3: Interceptor recibe
           respuesta
           ↓
📍 Paso 4: AuthService verifica
           cookies
```

## 🎯 Puntos de Fallo Comunes

### ❌ FALLO #1: withCredentials = false en interceptor

**Síntomas en logs:**
```
🌐 HTTP Interceptor - POST .../activate-account
📍 Paso 1: Request original recibido
  withCredentials (original): true
📍 Paso 2: Request clonado
  withCredentials (después de clone): false  ← ❌ PROBLEMA
⚠️  ADVERTENCIA: withCredentials forzado a FALSE
❌ PROBLEMA DETECTADO: Endpoint de auth SIN withCredentials!
```

**Causa:** El interceptor está forzando `withCredentials: false`

**Solución:** Modificar `/src/app/interceptors/http.interceptor.ts`:
```typescript
// Opción A: Remover withCredentials del interceptor
const clonedRequest = req.clone({
  setHeaders: { ... }
  // NO incluir: withCredentials: false
});

// Opción B: Hacer condicional
const isAuthEndpoint = req.url.includes('/auth/');
const clonedRequest = req.clone({
  setHeaders: { ... },
  withCredentials: isAuthEndpoint || req.withCredentials
});
```

---

### ❌ FALLO #2: Set-Cookie no llega del backend

**Síntomas en logs:**
```
✅ HTTP Response - POST .../activate-account
📍 Paso 3: Respuesta recibida
  Status: 201
  Set-Cookie header: NO PRESENTE  ← ❌ PROBLEMA
```

**Causa:** Backend no está seteando la cookie O CORS está bloqueando el header

**Verificar en logs del backend:**
```
📍 PASO B: Backend seteando cookie
  Cookie name: authToken
  Cookie options: {...}
📍 PASO C: Verificando Set-Cookie header
  Set-Cookie presente: true  ← Debe ser true
```

**Si backend setea pero frontend no recibe:**
- Verificar CORS `exposedHeaders` incluye `'Set-Cookie'`
- Verificar `Access-Control-Allow-Credentials: true`

---

### ❌ FALLO #3: Cookie seteada pero navegador la rechaza

**Síntomas en logs:**
```
✅ HTTP Response - POST .../activate-account
  Set-Cookie header: authToken=...  ← ✅ Presente
❌ PROBLEMA: Hay Set-Cookie pero request fue sin credentials!
   El navegador RECHAZARÁ estas cookies
```

**Causa:** Request enviado con `withCredentials: false`

**Navegador rechaza cookies si:**
- Request no tiene `credentials: 'include'` / `withCredentials: true`
- Cookie tiene `SameSite=None` pero no `Secure`
- Cookie `Domain` no coincide con el origen

---

### ❌ FALLO #4: Cookie configurada incorrectamente

**Síntomas en backend logs:**
```
📍 PASO C: Verificando Set-Cookie header
  🔍 Análisis de cookie:
    - HttpOnly: ✅
    - Secure: ❌  ← PROBLEMA (debe ser ✅ en HTTPS)
    - SameSite: None
    - Domain: .oceanix.space
```

**Solución:**
- Asegurar `secure: true` en producción (HTTPS)
- Asegurar `sameSite: 'none'` para cross-domain
- Asegurar `domain: '.oceanix.space'` (con punto inicial)

---

## 🧪 Checklist de Depuración

Sigue esta checklist en orden:

### ✅ Frontend - Paso 0 (AuthService)
- [ ] `withCredentials configurado: true` aparece en logs
- [ ] URL correcta del backend
- [ ] Headers incluyen `Content-Type: application/json`

### ✅ Frontend - Paso 1-2 (Interceptor)
- [ ] `withCredentials (original): true`
- [ ] `withCredentials (después de clone): true` ← **CRÍTICO**
- [ ] NO aparece "⚠️ ADVERTENCIA: withCredentials forzado a FALSE"
- [ ] NO aparece "❌ PROBLEMA DETECTADO: Endpoint de auth SIN withCredentials!"

### ✅ Backend - Paso A (Recepción)
- [ ] `Origin: https://xxx.oceanix.space` presente
- [ ] `Host: backend-dev.oceanix.space` correcto

### ✅ Backend - Paso B-C (Cookie)
- [ ] `Cookie name: authToken`
- [ ] `Set-Cookie presente: true`
- [ ] `HttpOnly: ✅`
- [ ] `Secure: ✅`
- [ ] `SameSite: None`
- [ ] `Domain: .oceanix.space`

### ✅ Backend - Paso D (CORS)
- [ ] `Access-Control-Allow-Origin: https://xxx.oceanix.space`
- [ ] `Access-Control-Allow-Credentials: true`
- [ ] `Access-Control-Expose-Headers` incluye `Set-Cookie`

### ✅ Frontend - Paso 3 (Respuesta)
- [ ] `Status: 201`
- [ ] `Set-Cookie header: authToken=...` presente
- [ ] NO aparece "❌ PROBLEMA: Hay Set-Cookie pero request fue sin credentials!"

### ✅ Frontend - Paso 4 (Verificación)
- [ ] Abrir DevTools > Application > Cookies
- [ ] Buscar cookie `authToken` para dominio `.oceanix.space`
- [ ] Verificar valores:
  - Domain: `.oceanix.space`
  - Path: `/`
  - Expires: Fecha futura (24h)
  - HttpOnly: ✓
  - Secure: ✓
  - SameSite: None

---

## 🔬 Debugging Avanzado

### Verificar que la cookie se envía en requests subsiguientes

1. Activar cuenta (debe setear cookie)
2. Hacer otra petición autenticada (ej: `/api/v1/users/me`)
3. En DevTools > Network > Request Headers:
   ```
   Cookie: authToken=eyJhbG...
   ```
4. Si NO aparece:
   - Cookie no se guardó (revisar pasos anteriores)
   - Domain de la cookie no coincide con el request
   - Cookie expiró

### Verificar configuración de Chrome

1. Ve a: `chrome://settings/cookies`
2. Debe estar en: "Permitir cookies de terceros" o similar
3. Verifica que `.oceanix.space` no esté en lista de bloqueados

### Logs en Network Tab

1. DevTools > Network
2. Click en request `activate-account`
3. Tab "Headers":
   - **Request Headers**: debe incluir `Cookie` si ya había una cookie
   - **Response Headers**: debe incluir `Set-Cookie: authToken=...`
4. Si Set-Cookie aparece en Network pero NO en Application > Cookies:
   - **El navegador está bloqueando la cookie**
   - Revisar logs de consola para errores específicos

---

## 📊 Interpretando los Logs

### ✅ Logs Exitosos

```javascript
🔐 AuthService.activateAccount()
📍 Paso 0: Preparando petición
  withCredentials configurado: true

🌐 HTTP Interceptor - POST .../activate-account
📍 Paso 1: Request original recibido
  withCredentials (original): true
📍 Paso 2: Request clonado
  withCredentials (después de clone): true  ← ✅ BIEN

🔍 [Cookie Debug] POST /api/v1/auth/activate-account
📍 PASO A: Request recibido en backend
  Origin: https://techsol-xxx.oceanix.space
📍 PASO B: Backend seteando cookie
  Cookie name: authToken
📍 PASO C: Verificando Set-Cookie header
  Set-Cookie presente: true
  🔍 Análisis:
    - HttpOnly: ✅
    - Secure: ✅
    - SameSite: None
    - Domain: .oceanix.space
📍 PASO D: Enviando respuesta
  Status Code: 201
  CORS Headers:
    - Access-Control-Allow-Credentials: true
✅ Respuesta incluye Set-Cookie

✅ HTTP Response - POST .../activate-account
📍 Paso 3: Respuesta recibida
  Set-Cookie header: authToken=...
🍪 Set-Cookie detectado en respuesta
✅ Request con credentials, navegador debería guardar la cookie

✅ AuthService - Respuesta de activación
  Success: true
📍 Paso 4: Verificando cookies en navegador
  💡 Verifica DevTools > Application > Cookies manualmente
```

### ❌ Logs con Problema

```javascript
🌐 HTTP Interceptor - POST .../activate-account
📍 Paso 2: Request clonado
  withCredentials (después de clone): false  ← ❌ PROBLEMA
⚠️  ADVERTENCIA: withCredentials forzado a FALSE
❌ PROBLEMA DETECTADO: Endpoint de auth SIN withCredentials!
   Esto impedirá que el navegador guarde cookies

✅ HTTP Response - POST .../activate-account
  Set-Cookie header: authToken=...
❌ PROBLEMA: Hay Set-Cookie pero request fue sin credentials!
   El navegador RECHAZARÁ estas cookies
```

---

## 🚀 Solución Rápida

Si ves el problema de `withCredentials: false`, el fix es simple:

**Editar:** `/Users/oceanix/Documents/Oceanix_Angular/src/app/interceptors/http.interceptor.ts`

```typescript
// ANTES (❌ Causa el problema)
const clonedRequest = req.clone({
  setHeaders: { ... },
  withCredentials: false
});

// DESPUÉS (✅ Solución)
const clonedRequest = req.clone({
  setHeaders: { ... }
  // Sin withCredentials, o con lógica condicional
});
```

Reinicia el frontend y prueba de nuevo.

---

## 📞 Ayuda Adicional

Si después de seguir todos los pasos aún no funciona, verifica:

1. **Versión de Chrome:** Algunas versiones tienen bugs con SameSite=None
2. **Extensiones de navegador:** Desactiva ad-blockers y privacy extensions
3. **Modo incógnito:** Prueba en una ventana incógnita limpia
4. **Certificado SSL:** Verifica que HTTPS esté funcionando correctamente

---

**Última actualización:** $(date)
**Proyecto:** Oceanix Multi-Tenant Platform
