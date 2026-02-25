#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# get_azure_credentials.sh  —  Asistente interactivo para obtener credenciales
# ─────────────────────────────────────────────────────────────────────────────

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
RESET='\033[0m'

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${CYAN}║   🔐  ASISTENTE DE CREDENCIALES DE AZURE                  ║${RESET}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${RESET}\n"

echo -e "${YELLOW}Este asistente te guiará para obtener tus credenciales de Azure.${RESET}"
echo -e "${YELLOW}Sigue las instrucciones en cada paso.${RESET}\n"

read -p "$(echo -e ${GREEN}Presiona Enter para comenzar...${RESET})"

# ── Paso 1 ─────────────────────────────────────────────────────────────────
clear
echo -e "${CYAN}═══════════════════════════════════════════════════════════${RESET}"
echo -e "${CYAN}   PASO 1/6: Acceder a Azure Portal${RESET}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${RESET}\n"

echo -e "1. Abre tu navegador"
echo -e "2. Ve a: ${GREEN}https://portal.azure.com${RESET}"
echo -e "3. Inicia sesión con tu cuenta de Microsoft 365\n"

read -p "$(echo -e ${YELLOW}¿Ya iniciaste sesión? \(s/n\): ${RESET})" step1
if [[ ! "$step1" =~ ^[sS]$ ]]; then
    echo -e "${RED}Ve a Azure Portal primero y luego vuelve a ejecutar este script.${RESET}"
    exit 0
fi

# ── Paso 2 ─────────────────────────────────────────────────────────────────
clear
echo -e "${CYAN}═══════════════════════════════════════════════════════════${RESET}"
echo -e "${CYAN}   PASO 2/6: Crear App Registration${RESET}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${RESET}\n"

echo -e "1. En Azure Portal, busca: ${GREEN}Azure Active Directory${RESET}"
echo -e "   (También puede llamarse 'Microsoft Entra ID')"
echo -e "2. Haz clic en ${GREEN}App registrations${RESET} (menú izquierdo)"
echo -e "3. Haz clic en ${GREEN}+ New registration${RESET}\n"

echo -e "${YELLOW}Configuración:${RESET}"
echo -e "   Name: ${GREEN}PowerBI-Fabric-Integration${RESET}"
echo -e "   Supported account types: ${GREEN}Single tenant${RESET}"
echo -e "   Redirect URI: ${GREEN}(dejar vacío)${RESET}\n"

echo -e "4. Haz clic en ${GREEN}Register${RESET}\n"

read -p "$(echo -e ${YELLOW}¿Ya creaste la app? \(s/n\): ${RESET})" step2
if [[ ! "$step2" =~ ^[sS]$ ]]; then
    echo -e "${RED}Crea la app primero.${RESET}"
    exit 0
fi

# ── Paso 3 ─────────────────────────────────────────────────────────────────
clear
echo -e "${CYAN}═══════════════════════════════════════════════════════════${RESET}"
echo -e "${CYAN}   PASO 3/6: Copiar TENANT_ID y CLIENT_ID${RESET}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${RESET}\n"

echo -e "Después de crear la app, verás dos IDs importantes:\n"

echo -e "   ${GREEN}Application (client) ID:${RESET}"
echo -e "   ${YELLOW}abc12345-1234-5678-90ab-cdef12345678${RESET}"
echo -e "   ↑ COPIA ESTE (será tu AZURE_CLIENT_ID)\n"

echo -e "   ${GREEN}Directory (tenant) ID:${RESET}"
echo -e "   ${YELLOW}xyz98765-9876-5432-10fe-dcba98765432${RESET}"
echo -e "   ↑ COPIA ESTE (será tu AZURE_TENANT_ID)\n"

read -p "Pega tu TENANT_ID aquí: " TENANT_ID
read -p "Pega tu CLIENT_ID aquí: " CLIENT_ID

echo -e "\n${GREEN}✅ TENANT_ID guardado${RESET}"
echo -e "${GREEN}✅ CLIENT_ID guardado${RESET}\n"
read -p "$(echo -e ${GREEN}Presiona Enter para continuar...${RESET})"

# ── Paso 4 ─────────────────────────────────────────────────────────────────
clear
echo -e "${CYAN}═══════════════════════════════════════════════════════════${RESET}"
echo -e "${CYAN}   PASO 4/6: Crear Client Secret${RESET}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${RESET}\n"

echo -e "1. En el menú izquierdo, haz clic en ${GREEN}Certificates & secrets${RESET}"
echo -e "2. Haz clic en ${GREEN}+ New client secret${RESET}"
echo -e "3. Description: ${GREEN}PowerBI Connection Secret${RESET}"
echo -e "4. Expires: ${GREEN}24 months${RESET}"
echo -e "5. Haz clic en ${GREEN}Add${RESET}\n"

echo -e "${RED}⚠️  IMPORTANTE:${RESET}"
echo -e "${YELLOW}   El 'Value' solo se muestra UNA VEZ.${RESET}"
echo -e "${YELLOW}   Cópialo AHORA o tendrás que crear uno nuevo.${RESET}\n"

read -p "$(echo -e ${YELLOW}¿Ya creaste el secret? \(s/n\): ${RESET})" step4
if [[ ! "$step4" =~ ^[sS]$ ]]; then
    echo -e "${RED}Crea el secret primero.${RESET}"
    exit 0
fi

read -sp "Pega tu CLIENT_SECRET aquí (no se mostrará): " CLIENT_SECRET
echo -e "\n${GREEN}✅ CLIENT_SECRET guardado${RESET}\n"
read -p "$(echo -e ${GREEN}Presiona Enter para continuar...${RESET})"

# ── Paso 5 ─────────────────────────────────────────────────────────────────
clear
echo -e "${CYAN}═══════════════════════════════════════════════════════════${RESET}"
echo -e "${CYAN}   PASO 5/6: Configurar Permisos${RESET}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${RESET}\n"

echo -e "1. En el menú izquierdo, haz clic en ${GREEN}API permissions${RESET}"
echo -e "2. Haz clic en ${GREEN}+ Add a permission${RESET}"
echo -e "3. Selecciona ${GREEN}Power BI Service${RESET}"
echo -e "4. Marca estos permisos (Delegated):"
echo -e "   ${YELLOW}☑ Dataset.Read.All${RESET}"
echo -e "   ${YELLOW}☑ Dataset.ReadWrite.All${RESET}"
echo -e "   ${YELLOW}☑ Workspace.Read.All${RESET}"
echo -e "   ${YELLOW}☑ Workspace.ReadWrite.All${RESET}"
echo -e "5. Haz clic en ${GREEN}Add permissions${RESET}"
echo -e "6. Haz clic en ${GREEN}Grant admin consent${RESET}\n"

echo -e "${YELLOW}Si no tienes permisos de admin, pide a tu administrador que lo haga.${RESET}\n"

read -p "$(echo -e ${YELLOW}¿Configuraste los permisos? \(s/n\): ${RESET})" step5

# ── Paso 6 ─────────────────────────────────────────────────────────────────
clear
echo -e "${CYAN}═══════════════════════════════════════════════════════════${RESET}"
echo -e "${CYAN}   PASO 6/6: Obtener WORKSPACE_ID de Power BI${RESET}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${RESET}\n"

echo -e "1. Ve a ${GREEN}https://app.fabric.microsoft.com${RESET}"
echo -e "2. Selecciona o crea un Workspace"
echo -e "3. Mira la URL del navegador:"
echo -e "   ${YELLOW}https://app.fabric.microsoft.com/groups/abc12345-xxxx.../...${RESET}"
echo -e "                                             ${GREEN}└─ Copia este ID${RESET}\n"

read -p "Pega tu WORKSPACE_ID aquí: " WORKSPACE_ID

echo -e "\n${GREEN}✅ WORKSPACE_ID guardado${RESET}\n"

echo -e "Nombre de tu Lakehouse (opcional, presiona Enter para usar 'EVA_Data'):"
read -p "> " LAKEHOUSE_NAME
LAKEHOUSE_NAME=${LAKEHOUSE_NAME:-EVA_Data}

# ── Crear archivo .env ─────────────────────────────────────────────────────
clear
echo -e "${CYAN}═══════════════════════════════════════════════════════════${RESET}"
echo -e "${GREEN}   ✅ CREDENCIALES OBTENIDAS${RESET}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${RESET}\n"

cat > .env << EOF
# Microsoft Fabric / OneLake Configuration
# Generado automáticamente por get_azure_credentials.sh

# Azure AD / Entra ID Credentials
AZURE_TENANT_ID=${TENANT_ID}
AZURE_CLIENT_ID=${CLIENT_ID}
AZURE_CLIENT_SECRET=${CLIENT_SECRET}

# Microsoft Fabric Workspace
FABRIC_WORKSPACE_ID=${WORKSPACE_ID}
FABRIC_WORKSPACE_NAME=EVA Analytics

# OneLake Configuration
ONELAKE_ENDPOINT=https://onelake.dfs.fabric.microsoft.com
ONELAKE_ACCOUNT_NAME=${WORKSPACE_ID}

# Lakehouse Configuration
LAKEHOUSE_NAME=${LAKEHOUSE_NAME}
LAKEHOUSE_ID=${WORKSPACE_ID}

# Storage Paths
ONELAKE_BASE_PATH=/Files
LOCAL_DATA_PATH=./fabric/data

# Optional: Power BI Configuration
POWERBI_GROUP_ID=${WORKSPACE_ID}
POWERBI_DATASET_ID=
EOF

echo -e "${GREEN}✅ Archivo .env creado exitosamente${RESET}\n"
echo -e "Credenciales guardadas en: ${YELLOW}.env${RESET}\n"

echo -e "${CYAN}═══════════════════════════════════════════════════════════${RESET}"
echo -e "${GREEN}   🚀 SIGUIENTE PASO${RESET}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${RESET}\n"

echo -e "Ejecuta el script de instalación:"
echo -e "${GREEN}bash setup_mcp.sh${RESET}\n"

echo -e "Esto instalará las dependencias y activará el servidor MCP de Power BI.\n"
