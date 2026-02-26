# 🪟 Instalación en Windows (CMD/PowerShell)

## 📋 Requisitos Previos

1. **Python 3.8 o superior** instalado
2. **Git** instalado (para clonar el repositorio)
3. **Claude Desktop** instalado

---

## 🚀 Pasos de Instalación

### 1️⃣ Abrir PowerShell o CMD

**PowerShell** (Recomendado):
- Presiona `Win + X`
- Selecciona "Windows PowerShell" o "Terminal"

**CMD**:
- Presiona `Win + R`
- Escribe `cmd`
- Presiona Enter

---

### 2️⃣ Navegar al Directorio del Proyecto

```powershell
# Si clonaste el repositorio en tu carpeta de usuario:
cd %USERPROFILE%\juanpablo22051977\mcp_server

# O si está en otra ubicación, ajusta la ruta:
cd C:\ruta\a\tu\juanpablo22051977\mcp_server
```

---

### 3️⃣ Verificar Python

```powershell
python --version
```

Si aparece algo como `Python 3.11.x`, estás listo. Si no:
- Instala Python desde: https://www.python.org/downloads/
- ✅ Marca "Add Python to PATH" durante la instalación

---

### 4️⃣ Instalar Dependencias

```powershell
# Instalar las dependencias del servidor MCP
pip install -r requirements.txt
```

O si tienes múltiples versiones de Python:

```powershell
python -m pip install -r requirements.txt
```

---

### 5️⃣ Verificar Instalación

```powershell
# Ejecutar las pruebas
python test_server.py
```

Deberías ver:
```
✅ PASS - Imports
✅ PASS - Environment
✅ PASS - Server Module
Total: 3/3 tests passed
```

---

## ⚙️ Configurar Claude Desktop en Windows

### 1️⃣ Localizar el Archivo de Configuración

El archivo está en:
```
%APPDATA%\Claude\claude_desktop_config.json
```

Para abrirlo:

**Opción A - Desde PowerShell/CMD:**
```powershell
notepad %APPDATA%\Claude\claude_desktop_config.json
```

**Opción B - Explorador de Archivos:**
1. Presiona `Win + R`
2. Escribe: `%APPDATA%\Claude`
3. Presiona Enter
4. Busca o crea el archivo `claude_desktop_config.json`

---

### 2️⃣ Editar el Archivo de Configuración

Si el archivo **NO existe**, créalo con este contenido:

```json
{
  "mcpServers": {
    "fabric": {
      "command": "python",
      "args": [
        "C:\\ruta\\completa\\a\\juanpablo22051977\\mcp_server\\fabric_server.py"
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

**📝 NOTA:** Reemplaza los valores `your-*-here` con tus credenciales reales del archivo `.env` en la raíz del proyecto.

**⚠️ IMPORTANTE:**
- Usa `\\` (doble barra) en las rutas de Windows
- Reemplaza `C:\\ruta\\completa\\a\\` con la ruta real
- El comando es `python` (no `python3` en Windows)

---

### 3️⃣ Obtener la Ruta Completa

Para saber la ruta completa del archivo, en PowerShell/CMD:

```powershell
cd %USERPROFILE%\juanpablo22051977\mcp_server
echo %CD%\fabric_server.py
```

O en PowerShell:
```powershell
(Get-Location).Path + "\fabric_server.py"
```

Copia esa ruta y úsala en el archivo de configuración (con `\\` en lugar de `\`).

---

## 🎮 Ejemplo Completo

### Paso a Paso en PowerShell:

```powershell
# 1. Navegar al directorio
cd C:\Users\TuUsuario\juanpablo22051977\mcp_server

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Probar el servidor
python test_server.py

# 4. Obtener la ruta completa
$rutaCompleta = (Get-Location).Path + "\fabric_server.py"
echo $rutaCompleta

# 5. Abrir la configuración de Claude
notepad $env:APPDATA\Claude\claude_desktop_config.json
```

---

## 🔧 Configuración Final

Si tu proyecto está en `C:\Users\Juan\juanpablo22051977`, la configuración sería:

```json
{
  "mcpServers": {
    "fabric": {
      "command": "python",
      "args": [
        "C:\\Users\\Juan\\juanpablo22051977\\mcp_server\\fabric_server.py"
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

---

## 🔄 Reiniciar Claude Desktop

1. **Cierra** completamente Claude Desktop
   - Click derecho en el icono de la barra de tareas
   - "Cerrar" o "Exit"
2. **Abre** Claude Desktop de nuevo

---

## ✅ Probar que Funciona

En Claude Desktop, escribe:

```
"Lista mis workspaces de Fabric"
```

Si Claude responde con tus workspaces, ¡funcionó! 🎉

---

## 🐛 Solución de Problemas en Windows

### Error: "python: command not found"

Reinstala Python y marca "Add Python to PATH"

### Error: "pip: command not found"

Usa:
```powershell
python -m pip install -r requirements.txt
```

### Claude no ve el servidor

1. Verifica la ruta con `\\` (doble barra)
2. Usa rutas absolutas, no relativas
3. Reinicia Claude completamente

### Verificar que Python encuentra los módulos

```powershell
python -c "import mcp; print('MCP instalado')"
```

---

## 📝 Resumen de Comandos

```powershell
# Ir al directorio
cd %USERPROFILE%\juanpablo22051977\mcp_server

# Instalar
pip install -r requirements.txt

# Probar
python test_server.py

# Ver ruta
echo %CD%\fabric_server.py

# Editar config de Claude
notepad %APPDATA%\Claude\claude_desktop_config.json
```

---

## 🎯 Checklist de Instalación

- [ ] Python 3.8+ instalado
- [ ] Repositorio clonado
- [ ] Dependencias instaladas (`pip install -r requirements.txt`)
- [ ] Pruebas pasadas (`python test_server.py`)
- [ ] Ruta completa copiada
- [ ] Archivo de configuración de Claude editado (con `\\`)
- [ ] Claude Desktop reiniciado
- [ ] Probado con "Lista mis workspaces de Fabric"

---

¡Listo! Ahora Claude puede interactuar con tu Fabric workspace desde Windows. 🚀
