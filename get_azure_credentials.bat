@echo off
REM ============================================================================
REM  get_azure_credentials.bat  -  Asistente para obtener credenciales Azure
REM ============================================================================

color 0B
cls

echo.
echo  ============================================================
echo    ASISTENTE DE CREDENCIALES DE AZURE
echo  ============================================================
echo.
echo  Este asistente te guiara para obtener tus credenciales.
echo.
pause

REM ── Paso 1 ──────────────────────────────────────────────────────────
cls
echo.
echo  ============================================================
echo    PASO 1/6: Acceder a Azure Portal
echo  ============================================================
echo.
echo  1. Abre tu navegador
echo  2. Ve a: https://portal.azure.com
echo  3. Inicia sesion con tu cuenta de Microsoft 365
echo.
set /p step1="Ya iniciaste sesion? (s/n): "
if /i not "%step1%"=="s" (
    echo Ve a Azure Portal primero y luego vuelve a ejecutar este script.
    pause
    exit /b
)

REM ── Paso 2 ──────────────────────────────────────────────────────────
cls
echo.
echo  ============================================================
echo    PASO 2/6: Crear App Registration
echo  ============================================================
echo.
echo  1. En Azure Portal, busca: Azure Active Directory
echo     (Tambien puede llamarse 'Microsoft Entra ID')
echo  2. Haz clic en App registrations (menu izquierdo)
echo  3. Haz clic en + New registration
echo.
echo  Configuracion:
echo     Name: PowerBI-Fabric-Integration
echo     Supported account types: Single tenant
echo     Redirect URI: (dejar vacio)
echo.
echo  4. Haz clic en Register
echo.
set /p step2="Ya creaste la app? (s/n): "
if /i not "%step2%"=="s" (
    echo Crea la app primero.
    pause
    exit /b
)

REM ── Paso 3 ──────────────────────────────────────────────────────────
cls
echo.
echo  ============================================================
echo    PASO 3/6: Copiar TENANT_ID y CLIENT_ID
echo  ============================================================
echo.
echo  Despues de crear la app, veras dos IDs importantes:
echo.
echo     Application (client) ID:
echo     abc12345-1234-5678-90ab-cdef12345678
echo     ^-- COPIA ESTE (sera tu AZURE_CLIENT_ID)
echo.
echo     Directory (tenant) ID:
echo     xyz98765-9876-5432-10fe-dcba98765432
echo     ^-- COPIA ESTE (sera tu AZURE_TENANT_ID)
echo.
set /p TENANT_ID="Pega tu TENANT_ID aqui: "
set /p CLIENT_ID="Pega tu CLIENT_ID aqui: "
echo.
echo  OK TENANT_ID guardado
echo  OK CLIENT_ID guardado
echo.
pause

REM ── Paso 4 ──────────────────────────────────────────────────────────
cls
echo.
echo  ============================================================
echo    PASO 4/6: Crear Client Secret
echo  ============================================================
echo.
echo  1. En el menu izquierdo, haz clic en Certificates ^& secrets
echo  2. Haz clic en + New client secret
echo  3. Description: PowerBI Connection Secret
echo  4. Expires: 24 months
echo  5. Haz clic en Add
echo.
echo  IMPORTANTE:
echo     El 'Value' solo se muestra UNA VEZ.
echo     Copialo AHORA o tendras que crear uno nuevo.
echo.
set /p step4="Ya creaste el secret? (s/n): "
if /i not "%step4%"=="s" (
    echo Crea el secret primero.
    pause
    exit /b
)
set /p CLIENT_SECRET="Pega tu CLIENT_SECRET aqui: "
echo.
echo  OK CLIENT_SECRET guardado
echo.
pause

REM ── Paso 5 ──────────────────────────────────────────────────────────
cls
echo.
echo  ============================================================
echo    PASO 5/6: Configurar Permisos
echo  ============================================================
echo.
echo  1. En el menu izquierdo, haz clic en API permissions
echo  2. Haz clic en + Add a permission
echo  3. Selecciona Power BI Service
echo  4. Marca estos permisos (Delegated):
echo     [x] Dataset.Read.All
echo     [x] Dataset.ReadWrite.All
echo     [x] Workspace.Read.All
echo     [x] Workspace.ReadWrite.All
echo  5. Haz clic en Add permissions
echo  6. Haz clic en Grant admin consent
echo.
echo  Si no tienes permisos de admin, pide a tu administrador.
echo.
set /p step5="Configuraste los permisos? (s/n): "

REM ── Paso 6 ──────────────────────────────────────────────────────────
cls
echo.
echo  ============================================================
echo    PASO 6/6: Obtener WORKSPACE_ID de Power BI
echo  ============================================================
echo.
echo  1. Ve a https://app.fabric.microsoft.com
echo  2. Selecciona o crea un Workspace
echo  3. Mira la URL del navegador:
echo     https://app.fabric.microsoft.com/groups/abc12345-xxxx.../...
echo                                              ^-- Copia este ID
echo.
set /p WORKSPACE_ID="Pega tu WORKSPACE_ID aqui: "
echo.
echo  OK WORKSPACE_ID guardado
echo.
set /p LAKEHOUSE_NAME="Nombre de tu Lakehouse (Enter para usar 'EVA_Data'): "
if "%LAKEHOUSE_NAME%"=="" set LAKEHOUSE_NAME=EVA_Data

REM ── Crear archivo .env ──────────────────────────────────────────────
cls
echo.
echo  ============================================================
echo    CREDENCIALES OBTENIDAS
echo  ============================================================
echo.

(
echo # Microsoft Fabric / OneLake Configuration
echo # Generado automaticamente
echo.
echo # Azure AD / Entra ID Credentials
echo AZURE_TENANT_ID=%TENANT_ID%
echo AZURE_CLIENT_ID=%CLIENT_ID%
echo AZURE_CLIENT_SECRET=%CLIENT_SECRET%
echo.
echo # Microsoft Fabric Workspace
echo FABRIC_WORKSPACE_ID=%WORKSPACE_ID%
echo FABRIC_WORKSPACE_NAME=EVA Analytics
echo.
echo # OneLake Configuration
echo ONELAKE_ENDPOINT=https://onelake.dfs.fabric.microsoft.com
echo ONELAKE_ACCOUNT_NAME=%WORKSPACE_ID%
echo.
echo # Lakehouse Configuration
echo LAKEHOUSE_NAME=%LAKEHOUSE_NAME%
echo LAKEHOUSE_ID=%WORKSPACE_ID%
echo.
echo # Storage Paths
echo ONELAKE_BASE_PATH=/Files
echo LOCAL_DATA_PATH=./fabric/data
echo.
echo # Optional: Power BI Configuration
echo POWERBI_GROUP_ID=%WORKSPACE_ID%
echo POWERBI_DATASET_ID=
) > .env

echo  OK Archivo .env creado exitosamente
echo.
echo  Credenciales guardadas en: .env
echo.
echo  ============================================================
echo    SIGUIENTE PASO
echo  ============================================================
echo.
echo  Ahora necesitas instalar Node.js y el servidor MCP.
echo.
echo  Te creare un instalador automatico...
echo.
pause
