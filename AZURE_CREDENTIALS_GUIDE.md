# 🔐 Guía Completa: Obtener Credenciales de Azure para Power BI

Esta guía te llevará paso a paso para obtener todas las credenciales necesarias.

---

## 📋 ¿Qué Credenciales Necesitas?

Necesitas obtener estos 4 valores:

1. ✅ **AZURE_TENANT_ID** - ID de tu organización
2. ✅ **AZURE_CLIENT_ID** - ID de la aplicación
3. ✅ **AZURE_CLIENT_SECRET** - Contraseña de la aplicación
4. ✅ **FABRIC_WORKSPACE_ID** - ID del workspace de Power BI

---

## 🌐 Paso 1: Acceder a Azure Portal

1. Abre tu navegador
2. Ve a: **https://portal.azure.com**
3. Inicia sesión con tu cuenta de Microsoft 365

---

## 📱 Paso 2: Crear App Registration

### 2.1 Ir a Azure Active Directory (Microsoft Entra ID)

1. En Azure Portal, busca **"Azure Active Directory"** o **"Microsoft Entra ID"** en la barra de búsqueda superior
2. Haz clic en el resultado

### 2.2 Crear la Aplicación

1. En el menú izquierdo, busca y haz clic en **"App registrations"**
2. Haz clic en el botón **"+ New registration"** (arriba)

### 2.3 Configurar la Aplicación

Completa el formulario:

**Name (Nombre):**
```
PowerBI-Fabric-Integration
```
(puedes usar cualquier nombre descriptivo)

**Supported account types:**
- Selecciona: **"Accounts in this organizational directory only (Single tenant)"**

**Redirect URI:**
- Déjalo **vacío** (no es necesario por ahora)

Haz clic en **"Register"** (abajo)

---

## 🔑 Paso 3: Obtener TENANT_ID y CLIENT_ID

### Después de crear la app, verás una pantalla con información:

```
┌─────────────────────────────────────────────────────────┐
│  PowerBI-Fabric-Integration                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Display name: PowerBI-Fabric-Integration               │
│                                                          │
│  Application (client) ID:                               │
│  ┌────────────────────────────────────────────────┐    │
│  │  abc12345-1234-5678-90ab-cdef12345678          │ ← COPIA ESTO (CLIENT_ID)
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Directory (tenant) ID:                                 │
│  ┌────────────────────────────────────────────────┐    │
│  │  xyz98765-9876-5432-10fe-dcba98765432          │ ← COPIA ESTO (TENANT_ID)
│  └────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Guarda estos dos valores:**
- ✅ **Application (client) ID** → Este es tu `AZURE_CLIENT_ID`
- ✅ **Directory (tenant) ID** → Este es tu `AZURE_TENANT_ID`

---

## 🔒 Paso 4: Crear Client Secret

### 4.1 Ir a Certificates & Secrets

1. En el menú izquierdo de tu app, busca **"Certificates & secrets"**
2. Haz clic en la pestaña **"Client secrets"**

### 4.2 Crear Nuevo Secret

1. Haz clic en **"+ New client secret"**
2. Completa:

**Description:**
```
PowerBI Connection Secret
```

**Expires:**
- Selecciona: **24 months** (2 años)

3. Haz clic en **"Add"**

### 4.3 IMPORTANTE: Copiar el Secret AHORA

Verás algo así:

```
┌─────────────────────────────────────────────────────────────┐
│  Description          │  Value                │  Expires    │
├───────────────────────┼───────────────────────┼─────────────┤
│  PowerBI Connection   │  abc~xyz123...ABC789  │  2026-12-31 │
│  Secret               │  [Click to copy]      │             │
└─────────────────────────────────────────────────────────────┘
```

⚠️ **MUY IMPORTANTE:**
- El **Value** solo se muestra UNA VEZ
- Haz clic en el icono de copiar junto al Value
- Guárdalo en un lugar seguro temporalmente
- ✅ Este es tu `AZURE_CLIENT_SECRET`

**Si no lo copias ahora, tendrás que crear uno nuevo.**

---

## 🔐 Paso 5: Configurar Permisos de Power BI

### 5.1 Ir a API Permissions

1. En el menú izquierdo, haz clic en **"API permissions"**

### 5.2 Agregar Power BI Service

1. Haz clic en **"+ Add a permission"**
2. Busca y selecciona **"Power BI Service"**
3. Selecciona **"Delegated permissions"**
4. Marca las siguientes opciones:
   - ☑️ `Dataset.Read.All`
   - ☑️ `Dataset.ReadWrite.All`
   - ☑️ `Workspace.Read.All`
   - ☑️ `Workspace.ReadWrite.All`
   - ☑️ `Dashboard.Read.All`
   - ☑️ `Report.Read.All`
5. Haz clic en **"Add permissions"**

### 5.3 Agregar Azure Storage (para OneLake)

1. Haz clic nuevamente en **"+ Add a permission"**
2. Selecciona **"Azure Storage"**
3. Marca:
   - ☑️ `user_impersonation`
4. Haz clic en **"Add permissions"**

### 5.4 Otorgar Consentimiento de Administrador

⚠️ **Necesitas ser administrador para este paso. Si no lo eres, pídele a tu admin que lo haga.**

1. Haz clic en el botón **"Grant admin consent for [tu organización]"**
2. Confirma haciendo clic en **"Yes"**
3. Verás checkmarks verdes ✅ junto a cada permiso

Si no tienes permisos de admin, envía el enlace de la app a tu administrador.

---

## 🏢 Paso 6: Obtener FABRIC_WORKSPACE_ID

### 6.1 Ir a Power BI / Microsoft Fabric

1. Abre una nueva pestaña
2. Ve a: **https://app.fabric.microsoft.com**
3. Inicia sesión (misma cuenta)

### 6.2 Seleccionar o Crear Workspace

**Si ya tienes un Workspace:**
1. Haz clic en tu workspace en el panel izquierdo
2. Mira la URL en el navegador:
   ```
   https://app.fabric.microsoft.com/groups/abc12345-xxxx-xxxx-xxxx-xxxxxxxxxxxx/...
                                           └────────────────────────────────┘
                                                  Este es tu WORKSPACE_ID
   ```
3. Copia el GUID (el ID largo entre `/groups/` y el siguiente `/`)

**Si no tienes un Workspace:**
1. Haz clic en **"Workspaces"** (panel izquierdo)
2. Haz clic en **"+ New workspace"**
3. Dale un nombre: `EVA Analytics`
4. Haz clic en **"Apply"**
5. Una vez creado, copia el ID de la URL

✅ Guarda este valor como `FABRIC_WORKSPACE_ID`

### 6.3 Crear Lakehouse (Opcional pero recomendado)

1. Dentro del workspace, haz clic en **"+ New"**
2. Selecciona **"Lakehouse"**
3. Nombre: `EVA_Data`
4. Haz clic en **"Create"**

✅ Guarda el nombre como `LAKEHOUSE_NAME` (ejemplo: `EVA_Data`)

---

## ✅ Resumen de Credenciales Obtenidas

Al final deberías tener:

```env
AZURE_TENANT_ID=xyz98765-9876-5432-10fe-dcba98765432
AZURE_CLIENT_ID=abc12345-1234-5678-90ab-cdef12345678
AZURE_CLIENT_SECRET=abc~xyz123...ABC789
FABRIC_WORKSPACE_ID=workspace123-4567-8901-2345-678901234567
LAKEHOUSE_NAME=EVA_Data
```

---

## 🚀 Siguiente Paso

Una vez que tengas todas las credenciales:

1. Abre el archivo `.env`:
   ```bash
   nano .env
   ```

2. Pega tus valores:
   ```env
   AZURE_TENANT_ID=tu-tenant-id-aqui
   AZURE_CLIENT_ID=tu-client-id-aqui
   AZURE_CLIENT_SECRET=tu-client-secret-aqui
   FABRIC_WORKSPACE_ID=tu-workspace-id-aqui
   LAKEHOUSE_NAME=EVA_Data
   ```

3. Guarda y ejecuta:
   ```bash
   bash setup_mcp.sh
   ```

---

## 🆘 Problemas Comunes

### "No tengo permisos de administrador"

**Solución:**
- Pide a tu administrador de Microsoft 365 que:
  1. Cree la App Registration por ti
  2. Otorgue los permisos de Power BI API
  3. Te dé el Client Secret

### "No encuentro Azure Active Directory"

**Solución:**
- Busca "Microsoft Entra ID" (es el nuevo nombre)
- O usa el enlace directo: https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade

### "El Client Secret expiró"

**Solución:**
- Ve a "Certificates & secrets"
- Elimina el viejo
- Crea uno nuevo
- Actualiza el .env con el nuevo valor

### "No veo mi Workspace en Power BI"

**Solución:**
- Asegúrate de tener licencia de Power BI Pro o Fabric
- Activa el trial gratuito en: https://app.fabric.microsoft.com

---

## 📞 Ayuda Adicional

Si te atascas en algún paso, dime en cuál y te ayudo específicamente.

¿En qué paso estás ahora?
