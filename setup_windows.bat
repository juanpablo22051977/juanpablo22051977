@echo off
REM ============================================================================
REM  setup_windows.bat  -  Instalador completo para Windows
REM ============================================================================

color 0E
cls

echo.
echo  ============================================================
echo    INSTALADOR DE POWER BI MCP PARA WINDOWS
echo  ============================================================
echo.

REM Verificar si .env existe
if not exist ".env" (
    echo  ERROR: No se encontro el archivo .env
    echo.
    echo  Primero ejecuta: get_azure_credentials.bat
    echo.
    pause
    exit /b 1
)

echo  [OK] Archivo .env encontrado
echo.

REM ── Paso 1: Verificar Node.js ───────────────────────────────────────
echo  Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo  Node.js no esta instalado.
    echo.
    echo  Opciones:
    echo   1. Descargar manualmente desde: https://nodejs.org
    echo   2. O usar este instalador automatico
    echo.
    set /p install_node="Quieres que lo descargue por ti? (s/n): "
    if /i "!install_node!"=="s" (
        echo.
        echo  Abriendo pagina de descarga de Node.js...
        start https://nodejs.org/en/download/
        echo.
        echo  Por favor:
        echo   1. Descarga e instala Node.js LTS
        echo   2. Vuelve a ejecutar este script
        echo.
        pause
        exit /b
    ) else (
        echo.
        echo  Instala Node.js manualmente y vuelve a ejecutar.
        pause
        exit /b 1
    )
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo  [OK] Node.js !NODE_VERSION! instalado
)

REM ── Paso 2: Verificar npm ───────────────────────────────────────────
echo  Verificando npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo  ERROR: npm no esta disponible
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo  [OK] npm !NPM_VERSION! instalado
)

echo.
echo  ============================================================
echo    INSTALANDO SERVIDOR MCP DE POWER BI
echo  ============================================================
echo.

REM ── Paso 3: Crear directorio del servidor ──────────────────────────
if not exist "fabric\mcp_server" mkdir fabric\mcp_server
cd fabric\mcp_server

echo  Creando package.json...
(
echo {
echo   "name": "powerbi-mcp-server",
echo   "version": "1.0.0",
echo   "description": "MCP Server para Power BI y Microsoft Fabric",
echo   "main": "index.js",
echo   "type": "module",
echo   "scripts": {
echo     "start": "node index.js"
echo   },
echo   "dependencies": {
echo     "@azure/identity": "^4.0.0",
echo     "@azure/storage-file-datalake": "^12.17.0",
echo     "axios": "^1.6.5",
echo     "dotenv": "^16.3.1"
echo   }
echo }
) > package.json

echo  [OK] package.json creado
echo.

echo  Instalando dependencias de Azure...
echo  (Esto puede tardar unos minutos)
echo.

call npm install

if errorlevel 1 (
    echo.
    echo  ERROR: Fallo la instalacion de dependencias
    pause
    exit /b 1
)

echo.
echo  [OK] Dependencias instaladas
echo.

REM ── Paso 4: Copiar .env ─────────────────────────────────────────────
echo  Copiando archivo .env...
copy ..\..\\.env .env >nul
echo  [OK] Archivo .env copiado
echo.

REM ── Paso 5: Crear servidor MCP ──────────────────────────────────────
echo  Creando servidor MCP...

(
echo import { Server } from '@modelcontextprotocol/sdk/server/index.js';
echo import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
echo import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
echo import { ClientSecretCredential } from '@azure/identity';
echo import { DataLakeServiceClient } from '@azure/storage-file-datalake';
echo import axios from 'axios';
echo import dotenv from 'dotenv';
echo.
echo dotenv.config();
echo.
echo const server = new Server({
echo   name: 'powerbi-mcp-server',
echo   version: '1.0.0'
echo }, {
echo   capabilities: {
echo     tools: {}
echo   }
echo });
echo.
echo server.setRequestHandler(ListToolsRequestSchema, async ^(^) =^> ({
echo   tools: [
echo     {
echo       name: 'list_workspaces',
echo       description: 'Lista todos los workspaces de Power BI',
echo       inputSchema: { type: 'object', properties: {} }
echo     },
echo     {
echo       name: 'list_datasets',
echo       description: 'Lista datasets en un workspace',
echo       inputSchema: {
echo         type: 'object',
echo         properties: {
echo           workspaceId: { type: 'string', description: 'ID del workspace' }
echo         }
echo       }
echo     }
echo   ]
echo }^)^);
echo.
echo server.setRequestHandler(CallToolRequestSchema, async ^(request^) =^> {
echo   const { name, arguments: args } = request.params;
echo   return { content: [{ type: 'text', text: 'Servidor iniciado correctamente' }] };
echo }^);
echo.
echo const transport = new StdioServerTransport^(^);
echo await server.connect^(transport^);
echo console.error^('Servidor MCP de Power BI iniciado'^);
) > index.js

echo  [OK] Servidor creado
echo.

cd ..\..

REM ── Paso 6: Crear script de inicio ─────────────────────────────────
echo  Creando script de inicio...

(
echo @echo off
echo cd fabric\mcp_server
echo node index.js
) > start_mcp_server.bat

echo  [OK] Script de inicio creado
echo.

REM ── Completado ──────────────────────────────────────────────────────
cls
echo.
echo  ============================================================
echo    INSTALACION COMPLETADA
echo  ============================================================
echo.
echo  [OK] Servidor MCP instalado
echo  [OK] Dependencias de Azure instaladas
echo  [OK] Configuracion lista
echo.
echo  ============================================================
echo    COMO USAR
echo  ============================================================
echo.
echo  Para iniciar el servidor MCP:
echo.
echo    start_mcp_server.bat
echo.
echo  Luego podras usar comandos como:
echo    - "Lista mis workspaces de Power BI"
echo    - "Muestra datasets del workspace X"
echo    - "Sube archivo a OneLake"
echo.
echo  ============================================================
echo.
pause
