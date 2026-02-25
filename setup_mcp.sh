#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# setup_mcp.sh  —  Instala y registra el servidor MCP de Power BI en Claude Code
# ─────────────────────────────────────────────────────────────────────────────

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
RESET='\033[0m'

echo -e "${CYAN}============================================================${RESET}"
echo -e "${CYAN}   🚀  CONFIGURACIÓN MCP — Microsoft Power BI + Claude     ${RESET}"
echo -e "${CYAN}============================================================${RESET}\n"

# ── 1. Verificar Python ────────────────────────────────────────────────────────
echo -e "${YELLOW}[1/4] Verificando Python...${RESET}"
if ! command -v python3 &>/dev/null && ! command -v python &>/dev/null; then
    echo -e "${RED}❌  Python no encontrado. Instala Python 3.8+${RESET}"
    exit 1
fi
PYTHON=$(command -v python3 || command -v python)
echo -e "${GREEN}✅  Python: $($PYTHON --version)${RESET}\n"

# ── 2. Instalar dependencias ───────────────────────────────────────────────────
echo -e "${YELLOW}[2/4] Instalando dependencias...${RESET}"
$PYTHON -m pip install --upgrade pip -q
$PYTHON -m pip install -r requirements.txt -q
echo -e "${GREEN}✅  Dependencias instaladas${RESET}\n"

# ── 3. Verificar .env ──────────────────────────────────────────────────────────
echo -e "${YELLOW}[3/4] Verificando credenciales (.env)...${RESET}"
if [ ! -f ".env" ]; then
    echo -e "${RED}❌  No se encontró el archivo .env${RESET}"
    echo -e "${YELLOW}👉  Copia .env.example a .env y completa con tus credenciales:${RESET}"
    echo -e "    cp .env.example .env && nano .env"
    exit 1
fi

check_var() {
    local var_name=$1
    local value
    value=$(grep "^${var_name}=" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    if [ -z "$value" ] || [[ "$value" == *"your-"* ]]; then
        echo -e "${RED}   ❌  ${var_name} no configurado${RESET}"
        return 1
    else
        echo -e "${GREEN}   ✅  ${var_name} OK${RESET}"
        return 0
    fi
}

ALL_OK=true
check_var "AZURE_TENANT_ID"    || ALL_OK=false
check_var "AZURE_CLIENT_ID"    || ALL_OK=false
check_var "AZURE_CLIENT_SECRET" || ALL_OK=false
check_var "LAKEHOUSE_NAME"     || ALL_OK=false

if [ "$ALL_OK" = false ]; then
    echo -e "\n${RED}❌  Completa las variables faltantes en .env antes de continuar${RESET}"
    echo -e "${YELLOW}👉  Lee FABRIC_README.md para obtener las credenciales${RESET}"
    exit 1
fi
echo -e "${GREEN}✅  Credenciales configuradas${RESET}\n"

# ── 4. Registrar servidor MCP con Claude Code ──────────────────────────────────
echo -e "${YELLOW}[4/4] Registrando servidor MCP en Claude Code...${RESET}"

# Leer variables del .env
export_from_env() {
    local var_name=$1
    local value
    value=$(grep "^${var_name}=" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    echo "$value"
}

TENANT_ID=$(export_from_env "AZURE_TENANT_ID")
CLIENT_ID=$(export_from_env "AZURE_CLIENT_ID")
CLIENT_SECRET=$(export_from_env "AZURE_CLIENT_SECRET")
WORKSPACE_ID=$(export_from_env "FABRIC_WORKSPACE_ID")

if command -v claude &>/dev/null; then
    # Registrar via CLI (eliminar si ya existe)
    claude mcp remove powerbi 2>/dev/null || true

    claude mcp add \
        --scope project \
        --transport stdio \
        --env "AZURE_TENANT_ID=${TENANT_ID}" \
        --env "AZURE_CLIENT_ID=${CLIENT_ID}" \
        --env "AZURE_CLIENT_SECRET=${CLIENT_SECRET}" \
        --env "FABRIC_WORKSPACE_ID=${WORKSPACE_ID}" \
        powerbi \
        -- $PYTHON "$(pwd)/mcp/powerbi_server.py"

    echo -e "${GREEN}✅  Servidor MCP 'powerbi' registrado con Claude Code${RESET}"
else
    echo -e "${YELLOW}⚠️   Claude Code CLI no encontrado en PATH${RESET}"
    echo -e "${YELLOW}    El archivo .mcp.json ya fue creado en el proyecto.${RESET}"
    echo -e "${YELLOW}    Claude Code lo detectará automáticamente al abrir el proyecto.${RESET}"
fi

# ── Resumen final ──────────────────────────────────────────────────────────────
echo -e "\n${CYAN}============================================================${RESET}"
echo -e "${GREEN}   ✅  CONFIGURACIÓN COMPLETADA${RESET}"
echo -e "${CYAN}============================================================${RESET}"
echo ""
echo -e "   📋 Herramientas disponibles en Claude:"
echo -e "      • list_workspaces       — Lista tus workspaces"
echo -e "      • list_reports          — Lista reportes de Power BI"
echo -e "      • list_datasets         — Lista datasets"
echo -e "      • get_dataset_tables    — Estructura de tablas"
echo -e "      • run_dax_query         — Ejecuta consultas DAX"
echo -e "      • refresh_dataset       — Actualiza datos"
echo -e "      • list_dashboards       — Lista dashboards"
echo -e "      • check_connection      — Verifica la conexión"
echo ""
echo -e "   🧪 Prueba la conexión ejecutando:"
echo -e "      $PYTHON mcp/powerbi_server.py"
echo ""
echo -e "   💬 Luego en Claude puedes pedir:"
echo -e "      \"Lista mis workspaces de Power BI\""
echo -e "      \"Muéstrame los reportes del workspace [id]\""
echo -e "      \"Ejecuta esta consulta DAX: EVALUATE ...\""
echo ""
