#!/usr/bin/env python3
"""
Microsoft Fabric MCP Server

This MCP server provides tools for interacting with Microsoft Fabric workspaces,
lakehouses, and file operations using Azure AD Service Principal authentication.
"""

import os
import json
import asyncio
import logging
from typing import Any, Optional
from datetime import datetime
import base64

import mcp.types as types
from mcp.server import Server
from mcp.server.stdio import stdio_server
from msal import ConfidentialClientApplication
import aiohttp

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("fabric-mcp-server")

# Initialize MCP server
app = Server("fabric-server")

# Global variables for authentication
access_token: Optional[str] = None
token_expiry: Optional[datetime] = None
client_app: Optional[ConfidentialClientApplication] = None

# Configuration from environment variables
TENANT_ID = os.getenv('FABRIC_TENANT_ID')
CLIENT_ID = os.getenv('FABRIC_CLIENT_ID')
CLIENT_SECRET = os.getenv('FABRIC_CLIENT_SECRET')
WORKSPACE_ID = os.getenv('FABRIC_WORKSPACE_ID')
LAKEHOUSE_ID = os.getenv('FABRIC_LAKEHOUSE_ID')

FABRIC_API_BASE = "https://api.fabric.microsoft.com/v1"


def initialize_auth():
    """Initialize the MSAL client application"""
    global client_app

    if not all([TENANT_ID, CLIENT_ID, CLIENT_SECRET]):
        raise ValueError(
            "Missing required environment variables: "
            "FABRIC_TENANT_ID, FABRIC_CLIENT_ID, FABRIC_CLIENT_SECRET"
        )

    authority = f"https://login.microsoftonline.com/{TENANT_ID}"
    client_app = ConfidentialClientApplication(
        client_id=CLIENT_ID,
        client_credential=CLIENT_SECRET,
        authority=authority
    )
    logger.info("Authentication client initialized")


async def get_access_token() -> str:
    """Get or refresh the access token"""
    global access_token, token_expiry

    # Check if token is still valid
    if access_token and token_expiry and datetime.now() < token_expiry:
        return access_token

    # Acquire new token
    scopes = ["https://analysis.windows.net/powerbi/api/.default"]
    result = client_app.acquire_token_for_client(scopes=scopes)

    if "access_token" in result:
        access_token = result["access_token"]
        # Set expiry to 50 minutes (tokens are valid for 60 minutes)
        from datetime import timedelta
        token_expiry = datetime.now() + timedelta(minutes=50)
        logger.info("Access token acquired successfully")
        return access_token
    else:
        error = result.get("error_description", result.get("error", "Unknown error"))
        raise Exception(f"Failed to acquire token: {error}")


async def make_fabric_request(
    method: str,
    endpoint: str,
    data: Optional[dict] = None,
    files: Optional[dict] = None
) -> dict:
    """Make an authenticated request to Fabric API"""
    token = await get_access_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    url = f"{FABRIC_API_BASE}{endpoint}"

    async with aiohttp.ClientSession() as session:
        if method.upper() == "GET":
            async with session.get(url, headers=headers) as response:
                response.raise_for_status()
                return await response.json()

        elif method.upper() == "POST":
            if files:
                # For file uploads, use multipart/form-data
                headers.pop("Content-Type", None)
                form_data = aiohttp.FormData()
                for key, value in files.items():
                    form_data.add_field(key, value)

                async with session.post(url, headers=headers, data=form_data) as response:
                    response.raise_for_status()
                    text = await response.text()
                    return {"status": "success", "response": text}
            else:
                async with session.post(url, headers=headers, json=data) as response:
                    response.raise_for_status()
                    text = await response.text()
                    if text:
                        return await response.json()
                    return {"status": "success"}

        elif method.upper() == "PUT":
            headers["Content-Type"] = "application/octet-stream"
            async with session.put(url, headers=headers, data=data) as response:
                response.raise_for_status()
                return {"status": "success"}

        elif method.upper() == "DELETE":
            async with session.delete(url, headers=headers) as response:
                response.raise_for_status()
                return {"status": "success"}


@app.list_tools()
async def list_tools() -> list[types.Tool]:
    """List available MCP tools for Fabric"""
    return [
        types.Tool(
            name="list_workspaces",
            description="List all accessible Microsoft Fabric workspaces",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        ),
        types.Tool(
            name="list_lakehouses",
            description="List all lakehouses in a workspace",
            inputSchema={
                "type": "object",
                "properties": {
                    "workspace_id": {
                        "type": "string",
                        "description": "Workspace ID (optional, uses FABRIC_WORKSPACE_ID if not provided)"
                    }
                }
            }
        ),
        types.Tool(
            name="list_lakehouse_files",
            description="List files in a lakehouse path",
            inputSchema={
                "type": "object",
                "properties": {
                    "workspace_id": {
                        "type": "string",
                        "description": "Workspace ID (optional)"
                    },
                    "lakehouse_id": {
                        "type": "string",
                        "description": "Lakehouse ID (optional)"
                    },
                    "path": {
                        "type": "string",
                        "description": "Path within lakehouse (e.g., 'Files/uploads')"
                    }
                },
                "required": ["path"]
            }
        ),
        types.Tool(
            name="upload_file_to_lakehouse",
            description="Upload a file to a Fabric lakehouse",
            inputSchema={
                "type": "object",
                "properties": {
                    "workspace_id": {
                        "type": "string",
                        "description": "Workspace ID (optional)"
                    },
                    "lakehouse_id": {
                        "type": "string",
                        "description": "Lakehouse ID (optional)"
                    },
                    "local_path": {
                        "type": "string",
                        "description": "Local file path to upload"
                    },
                    "lakehouse_path": {
                        "type": "string",
                        "description": "Destination path in lakehouse (e.g., 'Files/uploads/data.csv')"
                    },
                    "overwrite": {
                        "type": "boolean",
                        "description": "Whether to overwrite if file exists",
                        "default": False
                    }
                },
                "required": ["local_path", "lakehouse_path"]
            }
        ),
        types.Tool(
            name="create_delta_table",
            description="Create a Delta table from a file in the lakehouse",
            inputSchema={
                "type": "object",
                "properties": {
                    "workspace_id": {
                        "type": "string",
                        "description": "Workspace ID (optional)"
                    },
                    "lakehouse_id": {
                        "type": "string",
                        "description": "Lakehouse ID (optional)"
                    },
                    "file_path": {
                        "type": "string",
                        "description": "Path to file in lakehouse (e.g., 'Files/uploads/data.csv')"
                    },
                    "table_name": {
                        "type": "string",
                        "description": "Name for the Delta table"
                    },
                    "mode": {
                        "type": "string",
                        "description": "Write mode: 'overwrite' or 'append'",
                        "enum": ["overwrite", "append"],
                        "default": "overwrite"
                    }
                },
                "required": ["file_path", "table_name"]
            }
        ),
        types.Tool(
            name="get_workspace_info",
            description="Get detailed information about a workspace",
            inputSchema={
                "type": "object",
                "properties": {
                    "workspace_id": {
                        "type": "string",
                        "description": "Workspace ID (optional)"
                    }
                }
            }
        )
    ]


@app.call_tool()
async def call_tool(name: str, arguments: Any) -> list[types.TextContent]:
    """Handle tool calls"""

    try:
        if name == "list_workspaces":
            result = await make_fabric_request("GET", "/workspaces")
            workspaces = result.get("value", [])

            output = f"Found {len(workspaces)} workspace(s):\n\n"
            for ws in workspaces:
                output += f"- {ws.get('displayName', 'N/A')}\n"
                output += f"  ID: {ws.get('id', 'N/A')}\n"
                output += f"  Type: {ws.get('type', 'N/A')}\n\n"

            return [types.TextContent(type="text", text=output)]

        elif name == "list_lakehouses":
            workspace_id = arguments.get("workspace_id", WORKSPACE_ID)
            if not workspace_id:
                return [types.TextContent(
                    type="text",
                    text="Error: workspace_id required"
                )]

            result = await make_fabric_request(
                "GET",
                f"/workspaces/{workspace_id}/lakehouses"
            )
            lakehouses = result.get("value", [])

            output = f"Found {len(lakehouses)} lakehouse(s):\n\n"
            for lh in lakehouses:
                output += f"- {lh.get('displayName', 'N/A')}\n"
                output += f"  ID: {lh.get('id', 'N/A')}\n"
                output += f"  Description: {lh.get('description', 'N/A')}\n\n"

            return [types.TextContent(type="text", text=output)]

        elif name == "list_lakehouse_files":
            workspace_id = arguments.get("workspace_id", WORKSPACE_ID)
            lakehouse_id = arguments.get("lakehouse_id", LAKEHOUSE_ID)
            path = arguments.get("path", "Files")

            if not workspace_id or not lakehouse_id:
                return [types.TextContent(
                    type="text",
                    text="Error: workspace_id and lakehouse_id required"
                )]

            result = await make_fabric_request(
                "GET",
                f"/workspaces/{workspace_id}/lakehouses/{lakehouse_id}/listPaths?path={path}"
            )

            items = result.get("value", [])
            output = f"Items in '{path}':\n\n"

            for item in items:
                item_type = "📁" if item.get("isDirectory") else "📄"
                output += f"{item_type} {item.get('name', 'N/A')}\n"
                if not item.get("isDirectory"):
                    size = item.get("contentLength", 0)
                    output += f"   Size: {size:,} bytes\n"

            return [types.TextContent(type="text", text=output)]

        elif name == "upload_file_to_lakehouse":
            workspace_id = arguments.get("workspace_id", WORKSPACE_ID)
            lakehouse_id = arguments.get("lakehouse_id", LAKEHOUSE_ID)
            local_path = arguments["local_path"]
            lakehouse_path = arguments["lakehouse_path"]
            overwrite = arguments.get("overwrite", False)

            if not workspace_id or not lakehouse_id:
                return [types.TextContent(
                    type="text",
                    text="Error: workspace_id and lakehouse_id required"
                )]

            # Read file content
            if not os.path.exists(local_path):
                return [types.TextContent(
                    type="text",
                    text=f"Error: File not found: {local_path}"
                )]

            with open(local_path, 'rb') as f:
                file_content = f.read()

            # Upload file
            endpoint = f"/workspaces/{workspace_id}/lakehouses/{lakehouse_id}/uploadFile"
            endpoint += f"?path={lakehouse_path}&overwrite={str(overwrite).lower()}"

            result = await make_fabric_request(
                "PUT",
                endpoint,
                data=file_content
            )

            output = f"✅ File uploaded successfully!\n"
            output += f"   Local: {local_path}\n"
            output += f"   Lakehouse: {lakehouse_path}\n"
            output += f"   Size: {len(file_content):,} bytes\n"

            return [types.TextContent(type="text", text=output)]

        elif name == "create_delta_table":
            # This would require a Spark notebook execution
            # For now, return a message about manual creation
            output = "⚠️ Delta table creation requires Spark execution.\n\n"
            output += "To create a Delta table, use a Fabric notebook with:\n\n"
            output += "```python\n"
            output += f"df = spark.read.csv('{arguments['file_path']}', header=True, inferSchema=True)\n"
            output += f"df.write.format('delta').mode('{arguments.get('mode', 'overwrite')}').saveAsTable('{arguments['table_name']}')\n"
            output += "```\n"

            return [types.TextContent(type="text", text=output)]

        elif name == "get_workspace_info":
            workspace_id = arguments.get("workspace_id", WORKSPACE_ID)
            if not workspace_id:
                return [types.TextContent(
                    type="text",
                    text="Error: workspace_id required"
                )]

            result = await make_fabric_request(
                "GET",
                f"/workspaces/{workspace_id}"
            )

            output = f"Workspace Information:\n\n"
            output += f"Name: {result.get('displayName', 'N/A')}\n"
            output += f"ID: {result.get('id', 'N/A')}\n"
            output += f"Type: {result.get('type', 'N/A')}\n"
            output += f"Capacity ID: {result.get('capacityId', 'N/A')}\n"

            return [types.TextContent(type="text", text=output)]

        else:
            return [types.TextContent(
                type="text",
                text=f"Unknown tool: {name}"
            )]

    except Exception as e:
        logger.error(f"Error executing tool {name}: {str(e)}")
        return [types.TextContent(
            type="text",
            text=f"Error: {str(e)}"
        )]


async def main():
    """Main entry point for the MCP server"""
    logger.info("Starting Microsoft Fabric MCP Server...")

    # Initialize authentication
    initialize_auth()

    # Test authentication
    try:
        await get_access_token()
        logger.info("Authentication successful")
    except Exception as e:
        logger.error(f"Authentication failed: {e}")
        raise

    # Run the server
    async with stdio_server() as (read_stream, write_stream):
        logger.info("Server running on stdio")
        await app.run(
            read_stream,
            write_stream,
            app.create_initialization_options()
        )


if __name__ == "__main__":
    asyncio.run(main())
