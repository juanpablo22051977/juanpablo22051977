#!/bin/bash
# Installation script for Microsoft Fabric MCP Server

set -e

echo "=================================================="
echo "  Microsoft Fabric MCP Server - Installation"
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "📁 Script directory: $SCRIPT_DIR"
echo "📁 Project root: $PROJECT_ROOT"
echo ""

# Step 1: Check Python
echo "🔍 Step 1: Checking Python installation..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✅ Python found: $PYTHON_VERSION${NC}"
else
    echo -e "${RED}❌ Python 3 not found. Please install Python 3.8 or higher.${NC}"
    exit 1
fi
echo ""

# Step 2: Install dependencies
echo "📦 Step 2: Installing Python dependencies..."
cd "$SCRIPT_DIR"

if [ -f "requirements.txt" ]; then
    python3 -m pip install -r requirements.txt --quiet
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${RED}❌ requirements.txt not found${NC}"
    exit 1
fi
echo ""

# Step 3: Check environment variables
echo "🔐 Step 3: Checking environment variables..."
ENV_FILE="$PROJECT_ROOT/.env"

if [ -f "$ENV_FILE" ]; then
    echo -e "${GREEN}✅ .env file found${NC}"

    # Source the .env file
    source "$ENV_FILE"

    # Check required variables
    MISSING_VARS=()

    [ -z "$FABRIC_TENANT_ID" ] && MISSING_VARS+=("FABRIC_TENANT_ID")
    [ -z "$FABRIC_CLIENT_ID" ] && MISSING_VARS+=("FABRIC_CLIENT_ID")
    [ -z "$FABRIC_CLIENT_SECRET" ] && MISSING_VARS+=("FABRIC_CLIENT_SECRET")
    [ -z "$FABRIC_WORKSPACE_ID" ] && MISSING_VARS+=("FABRIC_WORKSPACE_ID")
    [ -z "$FABRIC_LAKEHOUSE_ID" ] && MISSING_VARS+=("FABRIC_LAKEHOUSE_ID")

    if [ ${#MISSING_VARS[@]} -gt 0 ]; then
        echo -e "${RED}❌ Missing environment variables:${NC}"
        for var in "${MISSING_VARS[@]}"; do
            echo "   - $var"
        done
        exit 1
    else
        echo -e "${GREEN}✅ All required environment variables present${NC}"
    fi
else
    echo -e "${RED}❌ .env file not found at $ENV_FILE${NC}"
    echo "   Please create a .env file with your Fabric credentials"
    exit 1
fi
echo ""

# Step 4: Test the server
echo "🧪 Step 4: Testing server connection..."
export FABRIC_TENANT_ID FABRIC_CLIENT_ID FABRIC_CLIENT_SECRET FABRIC_WORKSPACE_ID FABRIC_LAKEHOUSE_ID

python3 "$SCRIPT_DIR/fabric_server.py" <<EOF &
{"jsonrpc": "2.0", "method": "initialize", "id": 1}
EOF

SERVER_PID=$!
sleep 2

if ps -p $SERVER_PID > /dev/null; then
    echo -e "${GREEN}✅ Server started successfully${NC}"
    kill $SERVER_PID 2>/dev/null || true
else
    echo -e "${YELLOW}⚠️  Server test skipped (may require stdin interaction)${NC}"
fi
echo ""

# Step 5: Generate Claude Desktop configuration
echo "⚙️  Step 5: Generating Claude Desktop configuration..."

CONFIG_FILE="$SCRIPT_DIR/claude_desktop_config.json"

cat > "$CONFIG_FILE" << EOF
{
  "mcpServers": {
    "fabric": {
      "command": "python3",
      "args": [
        "$SCRIPT_DIR/fabric_server.py"
      ],
      "env": {
        "FABRIC_TENANT_ID": "$FABRIC_TENANT_ID",
        "FABRIC_CLIENT_ID": "$FABRIC_CLIENT_ID",
        "FABRIC_CLIENT_SECRET": "$FABRIC_CLIENT_SECRET",
        "FABRIC_WORKSPACE_ID": "$FABRIC_WORKSPACE_ID",
        "FABRIC_LAKEHOUSE_ID": "$FABRIC_LAKEHOUSE_ID"
      }
    }
  }
}
EOF

echo -e "${GREEN}✅ Configuration generated: $CONFIG_FILE${NC}"
echo ""

# Step 6: Instructions for Claude Desktop
echo "=================================================="
echo "  ✅ Installation Complete!"
echo "=================================================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Copy the configuration to Claude Desktop:"
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
    CLAUDE_CONFIG_PATH="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
    echo "   For macOS:"
    echo "   cp \"$CONFIG_FILE\" \"$CLAUDE_CONFIG_PATH\""
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    CLAUDE_CONFIG_PATH="$HOME/.config/Claude/claude_desktop_config.json"
    echo "   For Linux:"
    echo "   mkdir -p \"$HOME/.config/Claude\""
    echo "   cp \"$CONFIG_FILE\" \"$CLAUDE_CONFIG_PATH\""
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    CLAUDE_CONFIG_PATH="%APPDATA%\\Claude\\claude_desktop_config.json"
    echo "   For Windows:"
    echo "   copy \"$CONFIG_FILE\" \"$CLAUDE_CONFIG_PATH\""
fi

echo ""
echo "2. Restart Claude Desktop"
echo ""
echo "3. Test the integration by asking Claude:"
echo "   \"Lista mis workspaces de Fabric\""
echo ""
echo "=================================================="
echo ""
echo "📚 For more information, see: $SCRIPT_DIR/README.md"
echo ""
