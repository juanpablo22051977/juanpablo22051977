# 🪟 GUÍA RÁPIDA PARA WINDOWS

## 🎯 Pasos Simples

### Paso 1: Obtener Credenciales de Azure

Haz doble clic en:
```
get_azure_credentials.bat
```

Este script te guiará para:
- ✅ Crear una App en Azure Portal
- ✅ Copiar los 4 valores necesarios (TENANT_ID, CLIENT_ID, SECRET, WORKSPACE_ID)
- ✅ Crear el archivo `.env` automáticamente

**Sigue las instrucciones en pantalla.**

---

### Paso 2: Instalar Node.js (si no lo tienes)

1. Ve a: https://nodejs.org
2. Descarga la versión **LTS** (recomendada)
3. Instala con todas las opciones por defecto
4. Reinicia el símbolo del sistema

**Para verificar:**
```cmd
node --version
npm --version
```

---

### Paso 3: Instalar el Servidor MCP

Haz doble clic en:
```
setup_windows.bat
```

Este script:
- ✅ Verifica que Node.js esté instalado
- ✅ Instala las dependencias de Azure
- ✅ Crea el servidor MCP de Power BI
- ✅ Prepara todo para usar

---

### Paso 4: ¡Listo!

Ahora puedes iniciar el servidor:
```
start_mcp_server.bat
```

Y usar comandos como:
- "Lista mis workspaces de Power BI"
- "Muestra los datasets del workspace X"
- "Sube un archivo a OneLake"

---

## ⚡ TL;DR (Super Rápido)

```cmd
1. get_azure_credentials.bat    → Obtener credenciales
2. setup_windows.bat             → Instalar todo
3. start_mcp_server.bat          → Iniciar servidor
```

---

## 🆘 Problemas Comunes

### "node no se reconoce como comando"
**Solución:** Instala Node.js desde https://nodejs.org y reinicia el CMD.

### "No se encontró .env"
**Solución:** Ejecuta primero `get_azure_credentials.bat`.

### "Acceso denegado en Azure"
**Solución:** Pide a tu administrador que te dé permisos de "Application Administrator".

---

## 📞 ¿Necesitas Ayuda?

Si te atascas en algún paso, dime exactamente qué error ves y te ayudo.
