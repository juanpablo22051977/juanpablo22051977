# 🚀 Integración con Microsoft Fabric / OneLake

Guía completa para conectarse y trabajar con archivos Excel en Microsoft Fabric.

---

## 📋 Contenido

1. [¿Qué es Microsoft Fabric?](#qué-es-microsoft-fabric)
2. [Pre-requisitos](#pre-requisitos)
3. [Configuración Inicial](#configuración-inicial)
4. [Obtener Credenciales de Azure](#obtener-credenciales-de-azure)
5. [Instalación](#instalación)
6. [Uso Básico](#uso-básico)
7. [Scripts Disponibles](#scripts-disponibles)
8. [Ejemplos Prácticos](#ejemplos-prácticos)
9. [Solución de Problemas](#solución-de-problemas)

---

## 🌐 ¿Qué es Microsoft Fabric?

**Microsoft Fabric** es una plataforma unificada de análisis de datos en la nube que incluye:

- **OneLake**: Lago de datos centralizado (similar a OneDrive pero para datos empresariales)
- **Power BI**: Visualización de datos
- **Data Factory**: ETL y movimiento de datos
- **Synapse**: Procesamiento de datos y machine learning
- **Real-Time Intelligence**: Análisis en tiempo real

---

## ✅ Pre-requisitos

Antes de comenzar, necesitas:

1. **Cuenta de Microsoft 365** (Organizacional o Personal)
2. **Licencia de Microsoft Fabric** (Trial gratuito disponible)
3. **Python 3.8+** instalado en tu computadora
4. **Workspace en Microsoft Fabric** (Se crea desde el portal)
5. **Lakehouse** creado en tu Workspace

### 🆓 Obtener Trial Gratuito de Fabric

1. Ve a [Microsoft Fabric](https://app.fabric.microsoft.com/)
2. Inicia sesión con tu cuenta de Microsoft
3. Activa el trial gratuito de 60 días

---

## ⚙️ Configuración Inicial

### Paso 1: Clonar o Descargar el Repositorio

Si ya tienes el repositorio, ve directamente al Paso 2.

### Paso 2: Crear un App Registration en Azure

Para conectarte a Fabric necesitas crear una **App Registration** en Azure AD:

#### 2.1 Acceder al Portal de Azure

1. Ve a [Azure Portal](https://portal.azure.com/)
2. Inicia sesión con tu cuenta

#### 2.2 Crear App Registration

1. Busca **"Azure Active Directory"** o **"Microsoft Entra ID"**
2. En el menú izquierdo, selecciona **"App registrations"**
3. Haz clic en **"+ New registration"**

#### 2.3 Configurar la Aplicación

- **Name**: `FabricIntegration` (o el nombre que prefieras)
- **Supported account types**:
  - "Accounts in this organizational directory only" (Single tenant)
- **Redirect URI**: Dejar vacío por ahora
- Haz clic en **"Register"**

#### 2.4 Obtener Credenciales

Una vez creada la app:

**Application (client) ID**:
- Copia el valor de **Application (client) ID**
- Lo necesitarás para `AZURE_CLIENT_ID`

**Directory (tenant) ID**:
- Copia el valor de **Directory (tenant) ID**
- Lo necesitarás para `AZURE_TENANT_ID`

**Client Secret**:
1. En el menú izquierdo, haz clic en **"Certificates & secrets"**
2. Haz clic en **"+ New client secret"**
3. Agrega una descripción: `FabricConnection`
4. Selecciona expiración: **24 months**
5. Haz clic en **"Add"**
6. **IMPORTANTE**: Copia el **Value** inmediatamente (solo se muestra una vez)
7. Lo necesitarás para `AZURE_CLIENT_SECRET`

#### 2.5 Configurar Permisos

1. En el menú izquierdo, haz clic en **"API permissions"**
2. Haz clic en **"+ Add a permission"**
3. Selecciona **"Power BI Service"**
4. Selecciona **"Delegated permissions"**
5. Marca las siguientes opciones:
   - `Workspace.Read.All`
   - `Dataset.Read.All`
   - `Content.Create`
6. También agrega **"Azure Storage"**:
   - Busca "Azure Storage" en APIs
   - Selecciona `user_impersonation`
7. Haz clic en **"Add permissions"**
8. Haz clic en **"Grant admin consent"** (si tienes permisos de admin)

### Paso 3: Obtener IDs de Fabric

#### 3.1 Workspace ID

1. Ve a [Microsoft Fabric](https://app.fabric.microsoft.com/)
2. Abre tu **Workspace** (o crea uno nuevo)
3. En la URL verás algo como:
   ```
   https://app.fabric.microsoft.com/groups/XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX/...
   ```
4. Ese valor `XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX` es tu **WORKSPACE_ID**

#### 3.2 Lakehouse Name

1. Dentro de tu Workspace, crea un **Lakehouse** (si no tienes uno)
2. Haz clic en **"+ New"** → **"Lakehouse"**
3. Dale un nombre, por ejemplo: `EVA_Data`
4. Ese nombre será tu **LAKEHOUSE_NAME**

---

## 🔧 Instalación

### Paso 1: Instalar Dependencias

```bash
pip install -r requirements.txt
```

Esto instalará:
- `azure-identity`: Autenticación con Azure
- `azure-storage-file-datalake`: Conexión a OneLake
- `pandas`: Manipulación de datos
- `openpyxl`: Lectura/escritura de Excel
- `python-dotenv`: Gestión de variables de entorno
- Y más...

### Paso 2: Configurar Variables de Entorno

1. Copia el archivo de ejemplo:

```bash
cp .env.example .env
```

2. Edita el archivo `.env` y completa con tus credenciales:

```bash
nano .env   # o usa tu editor favorito
```

3. Completa los siguientes valores:

```env
# Azure AD / Entra ID Credentials
AZURE_TENANT_ID=tu-tenant-id-aqui
AZURE_CLIENT_ID=tu-client-id-aqui
AZURE_CLIENT_SECRET=tu-client-secret-aqui

# Microsoft Fabric Workspace
FABRIC_WORKSPACE_ID=tu-workspace-id-aqui
FABRIC_WORKSPACE_NAME=tu-workspace-name

# OneLake Configuration
ONELAKE_ENDPOINT=https://onelake.dfs.fabric.microsoft.com
ONELAKE_ACCOUNT_NAME=tu-onelake-account

# Lakehouse Configuration
LAKEHOUSE_NAME=tu-lakehouse-name
LAKEHOUSE_ID=tu-lakehouse-id
```

4. Guarda el archivo

---

## 🎯 Uso Básico

### 1. Probar la Conexión

Primero, verifica que la conexión funciona:

```bash
cd fabric/scripts
python fabric_connection.py
```

Deberías ver:
```
✅ Todas las credenciales están configuradas
🔐 Autenticando con Azure AD...
✅ Autenticación exitosa
🔗 Conectando a OneLake...
✅ Conexión a OneLake establecida
```

### 2. Listar Archivos en OneLake

```bash
python download_from_fabric.py --list
```

### 3. Subir un Archivo Excel

```bash
python upload_to_fabric.py ruta/a/tu/archivo.xlsx
```

### 4. Descargar un Archivo

```bash
python download_from_fabric.py nombre_del_archivo.xlsx
```

---

## 📦 Scripts Disponibles

### 1. `fabric_connection.py`

Conexión básica a Microsoft Fabric / OneLake.

**Uso:**
```bash
python fabric_connection.py
```

**Funcionalidades:**
- ✅ Valida credenciales
- ✅ Autentica con Azure AD
- ✅ Conecta a OneLake
- ✅ Lista archivos disponibles

---

### 2. `upload_to_fabric.py`

Sube archivos y carpetas a OneLake.

**Uso:**
```bash
# Subir un archivo
python upload_to_fabric.py archivo.xlsx

# Subir a una carpeta específica
python upload_to_fabric.py archivo.xlsx mi_carpeta/archivo.xlsx

# Subir una carpeta completa
python upload_to_fabric.py ./carpeta_datos/
```

**Funcionalidades:**
- ✅ Sube archivos individuales
- ✅ Sube carpetas completas
- ✅ Validación de archivos Excel
- ✅ Barra de progreso
- ✅ Sobrescritura opcional

**Ejemplo de código Python:**
```python
from upload_to_fabric import FabricUploader

uploader = FabricUploader()
uploader.connection.authenticate()

# Subir Excel
uploader.upload_excel('datos_eva.xlsx', 'analisis/eva_2024.xlsx')

# Subir carpeta
uploader.upload_folder('./reportes/', 'reportes_mensuales')
```

---

### 3. `download_from_fabric.py`

Descarga archivos desde OneLake.

**Uso:**
```bash
# Listar archivos disponibles
python download_from_fabric.py --list

# Listar carpeta específica
python download_from_fabric.py --list mi_carpeta

# Descargar archivo
python download_from_fabric.py archivo.xlsx

# Descargar a ubicación específica
python download_from_fabric.py archivo.xlsx ./descargados/archivo.xlsx
```

**Funcionalidades:**
- ✅ Descarga archivos individuales
- ✅ Descarga carpetas completas
- ✅ Lista archivos disponibles
- ✅ Barra de progreso
- ✅ Creación automática de directorios

**Ejemplo de código Python:**
```python
from download_from_fabric import FabricDownloader

downloader = FabricDownloader()
downloader.connection.authenticate()

# Descargar Excel
downloader.download_excel('analisis/eva_2024.xlsx', './local/eva.xlsx')

# Listar archivos
files = downloader.list_available_files('analisis')
```

---

## 💡 Ejemplos Prácticos

### Ejemplo 1: Subir Datos de EVA a Fabric

```bash
# Crear archivo Excel con datos de EVA
python
>>> import pandas as pd
>>> data = {
...     'Empresa': ['XYZ', 'ALFA', 'BETA'],
...     'NOPAT': [100000, 150000, 120000],
...     'Capital': [500000, 600000, 550000],
...     'WACC': [0.10, 0.08, 0.11],
...     'EVA': [-50000, 42000, -60500]
... }
>>> df = pd.DataFrame(data)
>>> df.to_excel('datos_eva.xlsx', index=False)
>>> exit()

# Subir a Fabric
python upload_to_fabric.py datos_eva.xlsx analisis/eva_2024.xlsx
```

### Ejemplo 2: Descargar y Procesar Datos

```bash
# Descargar datos
python download_from_fabric.py analisis/eva_2024.xlsx ./fabric/data/eva.xlsx

# Procesar con pandas
python
>>> import pandas as pd
>>> df = pd.read_excel('./fabric/data/eva.xlsx')
>>> print(df.describe())
>>> # Hacer análisis...
>>> exit()
```

### Ejemplo 3: Sincronización Bidireccional

```python
# sync_data.py - Script personalizado
from upload_to_fabric import FabricUploader
from download_from_fabric import FabricDownloader

# Descargar datos más recientes
downloader = FabricDownloader()
downloader.connection.authenticate()
downloader.download_excel('datos_maestros.xlsx', './local/datos.xlsx')

# Procesar localmente
import pandas as pd
df = pd.read_excel('./local/datos.xlsx')
# ... hacer análisis ...
df_actualizado = df  # tus cambios
df_actualizado.to_excel('./local/datos_actualizado.xlsx', index=False)

# Subir de vuelta
uploader = FabricUploader()
uploader.upload_excel('./local/datos_actualizado.xlsx', 'datos_maestros.xlsx')
```

---

## 🔍 Solución de Problemas

### Error: "Missing credentials"

**Problema**: No encuentra las variables en `.env`

**Solución**:
1. Verifica que el archivo `.env` existe
2. Verifica que está en la raíz del proyecto
3. Verifica que las variables están correctamente escritas

### Error: "Authentication failed"

**Problema**: Las credenciales son incorrectas

**Solución**:
1. Verifica el `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`
2. Asegúrate de que el Client Secret no haya expirado
3. Verifica que la App tiene los permisos correctos

### Error: "File not found in OneLake"

**Problema**: El archivo no existe en la ruta especificada

**Solución**:
1. Lista los archivos disponibles: `python download_from_fabric.py --list`
2. Verifica la ruta exacta del archivo
3. Recuerda que las rutas en OneLake empiezan en `Files/`

### Error: "Permission denied"

**Problema**: La App no tiene permisos suficientes

**Solución**:
1. Ve a Azure Portal → App registrations → Tu app
2. Verifica los permisos en "API permissions"
3. Asegúrate de que "Grant admin consent" está activado

### Error: "Cannot connect to OneLake"

**Problema**: No puede conectarse al endpoint de OneLake

**Solución**:
1. Verifica tu conexión a internet
2. Verifica que el `FABRIC_WORKSPACE_ID` es correcto
3. Verifica que el `LAKEHOUSE_NAME` existe en ese workspace

---

## 📚 Recursos Adicionales

- [Documentación oficial de Microsoft Fabric](https://learn.microsoft.com/en-us/fabric/)
- [OneLake Documentation](https://learn.microsoft.com/en-us/fabric/onelake/)
- [Azure Identity SDK](https://learn.microsoft.com/en-us/python/api/azure-identity/)
- [Power BI REST API](https://learn.microsoft.com/en-us/rest/api/power-bi/)

---

## ❓ FAQ

**P: ¿Puedo trabajar Excel directamente desde Fabric?**
R: Sí, pero con limitaciones. Excel Online funciona bien para archivos pequeños y medianos, pero para análisis complejos es mejor descargar, procesar localmente, y subir de vuelta.

**P: ¿Cuánto cuesta Microsoft Fabric?**
R: Fabric tiene un trial gratuito de 60 días. Después, los precios varían según el plan. Consulta [Fabric Pricing](https://azure.microsoft.com/en-us/pricing/details/microsoft-fabric/).

**P: ¿Puedo automatizar la sincronización?**
R: Sí, puedes crear scripts Python con `schedule` o usar GitHub Actions / Azure Functions para automatizar la sincronización.

**P: ¿Qué pasa con los archivos grandes (>100MB)?**
R: OneLake maneja archivos grandes sin problema, pero la carga/descarga puede ser lenta. Considera usar Azure Data Factory para archivos muy grandes.

**P: ¿Puedo conectar Power BI a mis datos?**
R: Sí, una vez que tus archivos están en OneLake, puedes conectarlos directamente a Power BI para crear dashboards.

---

## 🤝 Soporte

Si tienes problemas:
1. Revisa la sección de [Solución de Problemas](#solución-de-problemas)
2. Contacta al administrador de tu tenant de Microsoft 365
3. Consulta la documentación oficial de Microsoft Fabric

---

## 📄 Licencia

Este proyecto es parte del repositorio EVA y se proporciona tal cual para uso educativo.

---

**¡Listo para conectarte a Fabric!** 🚀
