"""
Servidor MCP para Microsoft Power BI
Expone herramientas para que Claude interactúe con Power BI REST API

Instalación:
    pip install mcp httpx python-dotenv

Uso con Claude Code:
    claude mcp add --scope project --transport stdio powerbi -- python mcp/powerbi_server.py
"""

import json
import sys
import os

# Asegurar que el directorio raíz esté en el path para encontrar .env
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from mcp.server.fastmcp import FastMCP
from powerbi_client import PowerBIClient

# ── Inicializar servidor y cliente ────────────────────────────────────────────

mcp = FastMCP(
    name="powerbi",
    instructions=(
        "Servidor MCP para Microsoft Power BI. "
        "Usa estas herramientas para listar workspaces, reportes, datasets, "
        "ejecutar consultas DAX y actualizar datos en Power BI."
    ),
)

client = PowerBIClient()

# ── Herramientas: Workspaces ──────────────────────────────────────────────────


@mcp.tool()
def list_workspaces() -> str:
    """
    Lista todos los workspaces de Power BI del usuario autenticado.
    Devuelve id, nombre y tipo de cada workspace.
    """
    workspaces = client.list_workspaces()
    result = [
        {
            "id": ws.get("id"),
            "name": ws.get("name"),
            "type": ws.get("type", "Workspace"),
            "isReadOnly": ws.get("isReadOnly", False),
        }
        for ws in workspaces
    ]
    return json.dumps(result, ensure_ascii=False, indent=2)


@mcp.tool()
def get_workspace_info(workspace_id: str) -> str:
    """
    Obtiene información detallada de un workspace específico.

    Args:
        workspace_id: ID del workspace de Power BI (GUID)
    """
    ws = client.get_workspace(workspace_id)
    return json.dumps(ws, ensure_ascii=False, indent=2)


# ── Herramientas: Reportes ────────────────────────────────────────────────────


@mcp.tool()
def list_reports(workspace_id: str = "") -> str:
    """
    Lista los reportes de Power BI.
    Si se proporciona workspace_id, filtra por ese workspace.
    Sin workspace_id, devuelve todos los reportes del usuario.

    Args:
        workspace_id: (Opcional) ID del workspace. Dejar vacío para todos.
    """
    reports = client.list_reports(workspace_id or None)
    result = [
        {
            "id": r.get("id"),
            "name": r.get("name"),
            "datasetId": r.get("datasetId"),
            "webUrl": r.get("webUrl"),
            "embedUrl": r.get("embedUrl"),
        }
        for r in reports
    ]
    return json.dumps(result, ensure_ascii=False, indent=2)


@mcp.tool()
def get_report_details(workspace_id: str, report_id: str) -> str:
    """
    Obtiene los detalles completos de un reporte específico.

    Args:
        workspace_id: ID del workspace
        report_id: ID del reporte
    """
    report = client.get_report(workspace_id, report_id)
    return json.dumps(report, ensure_ascii=False, indent=2)


@mcp.tool()
def get_report_pages(workspace_id: str, report_id: str) -> str:
    """
    Lista todas las páginas (pestañas) de un reporte de Power BI.

    Args:
        workspace_id: ID del workspace
        report_id: ID del reporte
    """
    pages = client.get_report_pages(workspace_id, report_id)
    result = [
        {
            "name": p.get("name"),
            "displayName": p.get("displayName"),
            "order": p.get("order"),
        }
        for p in pages
    ]
    return json.dumps(result, ensure_ascii=False, indent=2)


# ── Herramientas: Datasets ────────────────────────────────────────────────────


@mcp.tool()
def list_datasets(workspace_id: str = "") -> str:
    """
    Lista los datasets de Power BI.
    Si se proporciona workspace_id, filtra por ese workspace.

    Args:
        workspace_id: (Opcional) ID del workspace. Dejar vacío para todos.
    """
    datasets = client.list_datasets(workspace_id or None)
    result = [
        {
            "id": d.get("id"),
            "name": d.get("name"),
            "isRefreshable": d.get("isRefreshable"),
            "configuredBy": d.get("configuredBy"),
            "createdDate": d.get("createdDate"),
        }
        for d in datasets
    ]
    return json.dumps(result, ensure_ascii=False, indent=2)


@mcp.tool()
def get_dataset_tables(workspace_id: str, dataset_id: str) -> str:
    """
    Lista todas las tablas de un dataset de Power BI.
    Útil para conocer la estructura antes de ejecutar DAX.

    Args:
        workspace_id: ID del workspace
        dataset_id: ID del dataset
    """
    tables = client.get_dataset_tables(workspace_id, dataset_id)
    return json.dumps(tables, ensure_ascii=False, indent=2)


@mcp.tool()
def refresh_dataset(workspace_id: str, dataset_id: str) -> str:
    """
    Dispara una actualización de datos del dataset (equivale a "Actualizar ahora" en Power BI).

    Args:
        workspace_id: ID del workspace
        dataset_id: ID del dataset a actualizar
    """
    result = client.refresh_dataset(workspace_id, dataset_id)
    return json.dumps(
        {"status": "refresh_triggered", "response": result},
        ensure_ascii=False,
        indent=2,
    )


@mcp.tool()
def get_refresh_history(workspace_id: str, dataset_id: str) -> str:
    """
    Muestra el historial de actualizaciones de un dataset,
    incluyendo estado, hora de inicio/fin y errores.

    Args:
        workspace_id: ID del workspace
        dataset_id: ID del dataset
    """
    history = client.get_refresh_history(workspace_id, dataset_id)
    result = [
        {
            "requestId": h.get("requestId"),
            "status": h.get("status"),
            "startTime": h.get("startTime"),
            "endTime": h.get("endTime"),
            "serviceExceptionJson": h.get("serviceExceptionJson"),
        }
        for h in history[:10]  # Últimas 10 actualizaciones
    ]
    return json.dumps(result, ensure_ascii=False, indent=2)


@mcp.tool()
def run_dax_query(workspace_id: str, dataset_id: str, dax_query: str) -> str:
    """
    Ejecuta una consulta DAX contra un dataset de Power BI y devuelve los resultados.
    Útil para extraer datos específicos o validar cálculos.

    Ejemplo de consulta DAX:
        EVALUATE SUMMARIZE('Ventas', 'Ventas'[Región], "Total", SUM('Ventas'[Monto]))

    Args:
        workspace_id: ID del workspace
        dataset_id: ID del dataset
        dax_query: Consulta DAX a ejecutar (debe comenzar con EVALUATE)
    """
    result = client.run_dax_query(workspace_id, dataset_id, dax_query)
    return json.dumps(result, ensure_ascii=False, indent=2)


# ── Herramientas: Dashboards ──────────────────────────────────────────────────


@mcp.tool()
def list_dashboards(workspace_id: str = "") -> str:
    """
    Lista los dashboards de Power BI.
    Si se proporciona workspace_id, filtra por ese workspace.

    Args:
        workspace_id: (Opcional) ID del workspace. Dejar vacío para todos.
    """
    dashboards = client.list_dashboards(workspace_id or None)
    result = [
        {
            "id": d.get("id"),
            "displayName": d.get("displayName"),
            "isReadOnly": d.get("isReadOnly"),
            "webUrl": d.get("webUrl"),
        }
        for d in dashboards
    ]
    return json.dumps(result, ensure_ascii=False, indent=2)


@mcp.tool()
def get_dashboard_tiles(workspace_id: str, dashboard_id: str) -> str:
    """
    Lista todos los tiles (widgets/visualizaciones) de un dashboard.

    Args:
        workspace_id: ID del workspace
        dashboard_id: ID del dashboard
    """
    tiles = client.get_dashboard_tiles(workspace_id, dashboard_id)
    result = [
        {
            "id": t.get("id"),
            "title": t.get("title"),
            "subTitle": t.get("subTitle"),
            "reportId": t.get("reportId"),
            "datasetId": t.get("datasetId"),
        }
        for t in tiles
    ]
    return json.dumps(result, ensure_ascii=False, indent=2)


# ── Herramienta de diagnóstico ─────────────────────────────────────────────────


@mcp.tool()
def check_connection() -> str:
    """
    Verifica que la conexión a Power BI REST API funciona correctamente.
    Intenta obtener un token de acceso y lista los workspaces.
    """
    try:
        token = client._get_access_token()
        workspaces = client.list_workspaces()
        return json.dumps(
            {
                "status": "connected",
                "token_preview": f"{token[:20]}...",
                "workspaces_count": len(workspaces),
            },
            ensure_ascii=False,
            indent=2,
        )
    except Exception as e:
        return json.dumps(
            {"status": "error", "message": str(e)},
            ensure_ascii=False,
            indent=2,
        )


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    mcp.run(transport="stdio")
