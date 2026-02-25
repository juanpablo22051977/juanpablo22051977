# 🚀 Quick Start - Microsoft Fabric MCP Server

## ¿Qué acabas de crear?

Un **servidor MCP** que permite a Claude Desktop interactuar directamente con tu workspace de Microsoft Fabric.

---

## 🎯 Cómo Funciona

```
┌──────────────────┐
│  Claude Desktop  │
│                  │
│  "Lista mis      │
│   workspaces"    │
└────────┬─────────┘
         │ MCP Protocol
         ↓
┌──────────────────┐
│  Fabric MCP      │
│  Server          │
│  (Python)        │
└────────┬─────────┘
         │ REST API
         ↓
┌──────────────────┐
│  Microsoft       │
│  Fabric          │
│  (Cloud)         │
└──────────────────┘
```

---

## 📥 Instalación Rápida

### Opción 1: Usar el script de instalación

```bash
cd /home/user/juanpablo22051977/mcp_server
./install.sh
```

El script:
1. ✅ Verificará Python
2. ✅ Instalará dependencias
3. ✅ Validará credenciales
4. ✅ Generará configuración para Claude Desktop

### Opción 2: Manual

```bash
# 1. Instalar dependencias
cd /home/user/juanpablo22051977/mcp_server
pip install -r requirements.txt

# 2. Verificar que funciona
python3 test_server.py
```

---

## ⚙️ Configurar Claude Desktop

### 1. Localizar el archivo de configuración

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### 2. Editar el archivo

Si el archivo no existe, créalo. Luego agrega:

```json
{
  "mcpServers": {
    "fabric": {
      "command": "python3",
      "args": [
        "/ruta/completa/al/mcp_server/fabric_server.py"
      ],
      "env": {
        "FABRIC_TENANT_ID": "your-tenant-id-here",
        "FABRIC_CLIENT_ID": "your-client-id-here",
        "FABRIC_CLIENT_SECRET": "your-client-secret-here",
        "FABRIC_WORKSPACE_ID": "your-workspace-id-here",
        "FABRIC_LAKEHOUSE_ID": "your-lakehouse-id-here"
      }
    }
  }
}
```

**📝 Nota**: Reemplaza los valores `your-*-here` con tus credenciales reales del archivo `.env`.

**💡 Tip**: Ejecuta el script de instalación para generar el archivo de configuración con tus credenciales:
```bash
/home/user/juanpablo22051977/mcp_server/install.sh
```

### 3. Reiniciar Claude Desktop

Cierra completamente Claude Desktop y vuelve a abrirlo.

---

## 🎮 Ejemplos de Uso

Una vez configurado, puedes preguntarle a Claude:

### Listar Workspaces
```
"Lista todos mis workspaces de Fabric"
```

**Respuesta esperada:**
```
Found 1 workspace(s):

- INVENTARIOS
  ID: 814285da-f0fb-4c30-86c0-4904dad46cb7
  Type: Workspace
```

### Listar Lakehouses
```
"Muéstrame los lakehouses en mi workspace"
```

### Subir un Archivo
```
"Sube el archivo /ruta/al/archivo.csv al lakehouse en Files/uploads/"
```

### Listar Archivos
```
"Lista los archivos en Files/uploads/ del lakehouse"
```

### Obtener Info del Workspace
```
"Dame información detallada del workspace INVENTARIOS"
```

---

## 🛠️ Herramientas Disponibles

El servidor expone las siguientes herramientas que Claude puede usar:

| Herramienta | Descripción |
|-------------|-------------|
| `list_workspaces` | Lista todos los workspaces accesibles |
| `list_lakehouses` | Lista lakehouses en un workspace |
| `list_lakehouse_files` | Lista archivos en una ruta del lakehouse |
| `upload_file_to_lakehouse` | Sube un archivo al lakehouse |
| `get_workspace_info` | Obtiene info detallada de un workspace |
| `create_delta_table` | Proporciona código para crear tabla Delta |

---

## ✅ Verificar que Funciona

### Desde la terminal:

```bash
# Test completo
python3 /home/user/juanpablo22051977/mcp_server/test_server.py

# Test de conexión a Fabric
python3 /home/user/juanpablo22051977/test_connection.py
```

### Desde Claude Desktop:

1. Abre una nueva conversación
2. Escribe: **"Lista mis workspaces de Fabric"**
3. Si Claude responde con los workspaces, ¡funciona! 🎉

---

## 🐛 Solución de Problemas

### Error: "command not found: python3"

Usa `python` en lugar de `python3` en la configuración:

```json
"command": "python",
```

### Error: "Module 'mcp' not found"

Instala las dependencias:
```bash
pip install -r /home/user/juanpablo22051977/mcp_server/requirements.txt
```

### Claude no muestra las herramientas

1. Verifica que la ruta al script es absoluta (no relativa)
2. Reinicia Claude Desktop completamente
3. Verifica los logs de Claude:
   - macOS: `~/Library/Logs/Claude/`
   - Windows: `%APPDATA%\Claude\Logs\`

### Error: "Failed to acquire token"

Verifica que las credenciales en la configuración sean correctas.

---

## 📚 Más Información

- **README completo**: `/home/user/juanpablo22051977/mcp_server/README.md`
- **Documentación MCP**: https://modelcontextprotocol.io/
- **Fabric API Docs**: https://learn.microsoft.com/en-us/rest/api/fabric/

---

## 🎉 ¡Listo!

Ahora Claude puede interactuar directamente con tu workspace de Fabric.

**Próximos pasos sugeridos:**
1. Sube algunos archivos CSV de prueba
2. Explora los archivos existentes en tu lakehouse
3. Crea tablas Delta desde tus archivos

---

**¿Necesitas ayuda?** Pregúntale a Claude:
> "Ayúdame a subir un archivo al lakehouse de Fabric"
