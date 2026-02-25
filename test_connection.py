#!/usr/bin/env python3
"""Test script for Fabric Service Principal connection"""

import os
import sys
from msal import ConfidentialClientApplication
import requests

def test_fabric_connection():
    """Test connection to Fabric using Service Principal"""

    # Get credentials from environment
    tenant_id = os.getenv('FABRIC_TENANT_ID')
    client_id = os.getenv('FABRIC_CLIENT_ID')
    client_secret = os.getenv('FABRIC_CLIENT_SECRET')

    print("🔍 Testing Fabric Service Principal Connection...")
    print(f"   Tenant ID: {tenant_id[:8]}..." if tenant_id else "   ❌ FABRIC_TENANT_ID not set")
    print(f"   Client ID: {client_id[:8]}..." if client_id else "   ❌ FABRIC_CLIENT_ID not set")
    print(f"   Client Secret: {'*' * 8}..." if client_secret else "   ❌ FABRIC_CLIENT_SECRET not set")
    print()

    if not all([tenant_id, client_id, client_secret]):
        print("❌ Missing environment variables!")
        print("   Run: source .env")
        return False

    # Step 1: Get access token
    print("📝 Step 1: Requesting access token...")
    authority = f"https://login.microsoftonline.com/{tenant_id}"
    scopes = ["https://analysis.windows.net/powerbi/api/.default"]

    try:
        app = ConfidentialClientApplication(
            client_id=client_id,
            client_credential=client_secret,
            authority=authority
        )

        result = app.acquire_token_for_client(scopes=scopes)

        if "access_token" in result:
            print("   ✅ Access token obtained successfully!")
            token = result["access_token"]
        else:
            error = result.get("error_description", result.get("error", "Unknown error"))
            print(f"   ❌ Failed to get token: {error}")
            return False

    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")
        return False

    # Step 2: Test API call - List workspaces
    print()
    print("📝 Step 2: Testing API call (list workspaces)...")

    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        url = "https://api.fabric.microsoft.com/v1/workspaces"
        response = requests.get(url, headers=headers, timeout=30)

        if response.status_code == 200:
            data = response.json()
            workspaces = data.get("value", [])
            print(f"   ✅ API call successful!")
            print(f"   📁 Found {len(workspaces)} workspace(s)")

            if workspaces:
                print("\n   Workspaces accessible:")
                for ws in workspaces[:5]:  # Show first 5
                    print(f"      - {ws.get('displayName', 'N/A')} (ID: {ws.get('id', 'N/A')})")
                if len(workspaces) > 5:
                    print(f"      ... and {len(workspaces) - 5} more")
            return True

        elif response.status_code == 403:
            print(f"   ❌ Access denied (403)")
            print(f"   🔐 Service Principal needs permissions!")
            print()
            print("   Possible causes:")
            print("   1. Service Principals not enabled in Fabric admin portal")
            print("   2. Service Principal not added to workspace as Admin/Member")
            print("   3. Workspace permissions not propagated yet (wait 5-10 min)")
            return False

        elif response.status_code == 401:
            print(f"   ❌ Unauthorized (401)")
            print(f"   🔐 Token may be invalid or expired")
            return False

        else:
            print(f"   ❌ API call failed with status {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            return False

    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("  Microsoft Fabric Service Principal Connection Test")
    print("=" * 60)
    print()

    success = test_fabric_connection()

    print()
    print("=" * 60)
    if success:
        print("✅ CONNECTION SUCCESSFUL!")
        print("   Your Service Principal is properly configured.")
    else:
        print("❌ CONNECTION FAILED!")
        print("   Check the errors above and follow the suggested steps.")
    print("=" * 60)

    sys.exit(0 if success else 1)
