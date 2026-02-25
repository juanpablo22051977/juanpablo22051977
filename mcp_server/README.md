# Microsoft Fabric MCP Server

Un servidor MCP (Model Context Protocol) que permite a Claude interactuar directamente con Microsoft Fabric workspaces, lakehouses y archivos.

## 🎯 ¿Qué es esto?

Este servidor MCP expone herramientas que Claude puede usar para:

- 📁 Listar workspaces de Fabric
- 🏗️ Gestionar lakehouses
- 📤 Subir archivos a lakehouses
- 📊 Listar archivos y directorios
- 🔍 Obtener información de workspaces

## 📦 Instalación

### 1. Instalar dependencias

```bash
cd mcp_server
pip install -r requirements.txt
```

### 2. Configurar variables de entorno

Asegúrate de que el archivo `.env` en la raíz del proyecto contenga:

```bash
FABRIC_TENANT_ID=tu-tenant-id
FABRIC_CLIENT_ID=tu-client-id
FABRIC_CLIENT_SECRET=tu-client-secret
FABRIC_WORKSPACE_ID=tu-workspace-id
FABRIC_LAKEHOUSE_ID=tu-lakehouse-id
```

### 3. Configurar Claude Desktop

Edita el archivo de configuración de Claude Desktop:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

**Linux**: `~/.config/Claude/claude_desktop_config.json`

Agrega la siguiente configuración:

```json
{
  "mcpServers": {
    "fabric": {
      "command": "python3",
      "args": [
        "/ruta/completa/a/mcp_server/fabric_server.py"
      ],
      "env": {
        "FABRIC_TENANT_ID": "tu-tenant-id",
        "FABRIC_CLIENT_ID": "tu-client-id",
        "FABRIC_CLIENT_SECRET": "tu-client-secret",
        "FABRIC_WORKSPACE_ID": "tu-workspace-id",
        "FABRIC_LAKEHOUSE_ID": "tu-lakehouse-id"
      }
    }
  }
}
```

### 4. Reiniciar Claude Desktop

Después de configurar, reinicia Claude Desktop para que cargue el servidor MCP.

## 🛠️ Herramientas Disponibles

### 1. `list_workspaces`
Lista todos los workspaces accesibles.

**Ejemplo de uso en Claude:**
> "Lista mis workspaces de Fabric"

### 2. `list_lakehouses`
Lista todos los lakehouses en un workspace.

**Parámetros:**
- `workspace_id` (opcional): ID del workspace

**Ejemplo de uso en Claude:**
> "Muéstrame los lakehouses del workspace INVENTARIOS"

### 3. `list_lakehouse_files`
Lista archivos en una ruta del lakehouse.

**Parámetros:**
- `path` (requerido): Ruta dentro del lakehouse (ej: "Files/uploads")
- `workspace_id` (opcional)
- `lakehouse_id` (opcional)

**Ejemplo de uso en Claude:**
> "Lista los archivos en Files/uploads del lakehouse"

### 4. `upload_file_to_lakehouse`
Sube un archivo al lakehouse.

**Parámetros:**
- `local_path` (requerido): Ruta local del archivo
- `lakehouse_path` (requerido): Ruta destino en lakehouse
- `overwrite` (opcional): Sobrescribir si existe (default: false)
- `workspace_id` (opcional)
- `lakehouse_id` (opcional)

**Ejemplo de uso en Claude:**
> "Sube el archivo data.csv a Files/uploads/ en el lakehouse"

### 5. `get_workspace_info`
Obtiene información detallada de un workspace.

**Parámetros:**
- `workspace_id` (opcional)

**Ejemplo de uso en Claude:**
> "Dame información del workspace INVENTARIOS"

### 6. `create_delta_table`
Proporciona código para crear una tabla Delta desde un archivo.

**Parámetros:**
- `file_path` (requerido): Ruta del archivo en lakehouse
- `table_name` (requerido): Nombre de la tabla
- `mode` (opcional): "overwrite" o "append"

**Ejemplo de uso en Claude:**
> "Crea una tabla Delta llamada ventas desde el archivo data.csv"

## 🧪 Pruebas

### Probar el servidor manualmente

```bash
# Cargar variables de entorno
source ../.env

# Ejecutar el servidor
python3 fabric_server.py
```

El servidor iniciará y esperará mensajes MCP por stdin/stdout.

### Probar desde Claude Desktop

Una vez configurado, simplemente abre Claude Desktop y pregunta:

```
"Lista mis workspaces de Fabric"
"Sube el archivo test.csv al lakehouse"
"Muéstrame los archivos en Files/uploads"
```

Claude usará automáticamente las herramientas del servidor MCP.

## 🔐 Seguridad

- Las credenciales se pasan como variables de entorno
- El token de acceso se refresca automáticamente
- Todas las comunicaciones usan HTTPS
- El servidor solo escucha en stdin/stdout (no hay puerto de red)

## 🐛 Troubleshooting

### Error: "Missing required environment variables"
- Verifica que el archivo `.env` exista
- Asegúrate de que las variables estén en la configuración de Claude Desktop

### Error: "Failed to acquire token"
- Verifica las credenciales del Service Principal
- Asegúrate de que el Service Principal tenga permisos en Fabric

### El servidor no aparece en Claude
- Verifica la ruta completa al script en `claude_desktop_config.json`
- Reinicia Claude Desktop
- Revisa los logs en: `~/Library/Logs/Claude/` (MacOS)

## 📚 Referencias

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Microsoft Fabric REST API](https://learn.microsoft.com/en-us/rest/api/fabric/)
- [Claude Desktop](https://claude.ai/download)

## 🤝 Contribuciones

Este servidor es parte del proyecto de integración con Fabric. Para mejoras o problemas, crea un issue en el repositorio.
