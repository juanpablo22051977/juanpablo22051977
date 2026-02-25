"""
Cliente de Power BI REST API con autenticación Azure AD
Maneja tokens, reintentos y todas las llamadas a la API
"""

import os
import time
import httpx
from dotenv import load_dotenv

load_dotenv()

POWERBI_BASE_URL = "https://api.powerbi.com/v1.0/myorg"
AZURE_TOKEN_URL = "https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
POWERBI_SCOPE = "https://analysis.windows.net/powerbi/api/.default"


class PowerBIClient:
    """
    Cliente para interactuar con la Power BI REST API.
    Maneja autenticación automática y renovación de tokens.
    """

    def __init__(self):
        self.tenant_id = os.getenv("AZURE_TENANT_ID")
        self.client_id = os.getenv("AZURE_CLIENT_ID")
        self.client_secret = os.getenv("AZURE_CLIENT_SECRET")

        self._access_token: str | None = None
        self._token_expires_at: float = 0

    def _get_access_token(self) -> str:
        """Obtiene o renueva el access token de Azure AD."""
        now = time.time()
        if self._access_token and now < self._token_expires_at - 60:
            return self._access_token

        url = AZURE_TOKEN_URL.format(tenant_id=self.tenant_id)
        data = {
            "grant_type": "client_credentials",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "scope": POWERBI_SCOPE,
        }

        resp = httpx.post(url, data=data, timeout=30)
        resp.raise_for_status()
        payload = resp.json()

        self._access_token = payload["access_token"]
        self._token_expires_at = now + payload.get("expires_in", 3600)
        return self._access_token

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self._get_access_token()}",
            "Content-Type": "application/json",
        }

    def _get(self, path: str, params: dict | None = None) -> dict:
        url = f"{POWERBI_BASE_URL}{path}"
        resp = httpx.get(url, headers=self._headers(), params=params, timeout=30)
        resp.raise_for_status()
        return resp.json()

    def _post(self, path: str, body: dict | None = None) -> dict:
        url = f"{POWERBI_BASE_URL}{path}"
        resp = httpx.post(url, headers=self._headers(), json=body or {}, timeout=30)
        resp.raise_for_status()
        return resp.json() if resp.content else {}

    # ── Workspaces ────────────────────────────────────────────────────────────

    def list_workspaces(self) -> list[dict]:
        """Lista todos los workspaces del usuario."""
        data = self._get("/groups")
        return data.get("value", [])

    def get_workspace(self, workspace_id: str) -> dict:
        """Obtiene detalles de un workspace específico."""
        return self._get(f"/groups/{workspace_id}")

    # ── Reports ───────────────────────────────────────────────────────────────

    def list_reports(self, workspace_id: str | None = None) -> list[dict]:
        """Lista reportes. Si no se especifica workspace, lista todos."""
        if workspace_id:
            data = self._get(f"/groups/{workspace_id}/reports")
        else:
            data = self._get("/reports")
        return data.get("value", [])

    def get_report(self, workspace_id: str, report_id: str) -> dict:
        """Obtiene detalles de un reporte."""
        return self._get(f"/groups/{workspace_id}/reports/{report_id}")

    def get_report_pages(self, workspace_id: str, report_id: str) -> list[dict]:
        """Lista las páginas de un reporte."""
        data = self._get(f"/groups/{workspace_id}/reports/{report_id}/pages")
        return data.get("value", [])

    # ── Datasets ──────────────────────────────────────────────────────────────

    def list_datasets(self, workspace_id: str | None = None) -> list[dict]:
        """Lista datasets. Si no se especifica workspace, lista todos."""
        if workspace_id:
            data = self._get(f"/groups/{workspace_id}/datasets")
        else:
            data = self._get("/datasets")
        return data.get("value", [])

    def get_dataset(self, workspace_id: str, dataset_id: str) -> dict:
        """Obtiene detalles de un dataset."""
        return self._get(f"/groups/{workspace_id}/datasets/{dataset_id}")

    def get_dataset_tables(self, workspace_id: str, dataset_id: str) -> list[dict]:
        """Lista las tablas de un dataset."""
        data = self._get(f"/groups/{workspace_id}/datasets/{dataset_id}/tables")
        return data.get("value", [])

    def refresh_dataset(self, workspace_id: str, dataset_id: str) -> dict:
        """Dispara una actualización de datos del dataset."""
        return self._post(f"/groups/{workspace_id}/datasets/{dataset_id}/refreshes")

    def get_refresh_history(self, workspace_id: str, dataset_id: str) -> list[dict]:
        """Obtiene el historial de actualizaciones de un dataset."""
        data = self._get(f"/groups/{workspace_id}/datasets/{dataset_id}/refreshes")
        return data.get("value", [])

    def run_dax_query(self, workspace_id: str, dataset_id: str, query: str) -> dict:
        """Ejecuta una consulta DAX contra el dataset."""
        body = {"queries": [{"query": query}], "serializerSettings": {"includeNulls": True}}
        return self._post(f"/groups/{workspace_id}/datasets/{dataset_id}/executeQueries", body)

    # ── Dashboards ────────────────────────────────────────────────────────────

    def list_dashboards(self, workspace_id: str | None = None) -> list[dict]:
        """Lista dashboards."""
        if workspace_id:
            data = self._get(f"/groups/{workspace_id}/dashboards")
        else:
            data = self._get("/dashboards")
        return data.get("value", [])

    def get_dashboard_tiles(self, workspace_id: str, dashboard_id: str) -> list[dict]:
        """Lista los tiles (widgets) de un dashboard."""
        data = self._get(f"/groups/{workspace_id}/dashboards/{dashboard_id}/tiles")
        return data.get("value", [])
