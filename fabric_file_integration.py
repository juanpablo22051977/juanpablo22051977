#!/usr/bin/env python3
"""
Microsoft Fabric Lakehouse Integration Script
Connects to Fabric Lakehouse and provides file upload functionality
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import requests
import json

# Load environment variables
load_dotenv()

class FabricLakehouseClient:
    """Client for interacting with Microsoft Fabric Lakehouse"""

    def __init__(self):
        """Initialize the Fabric client with credentials from .env"""
        self.tenant_id = os.getenv('FABRIC_TENANT_ID')
        self.client_id = os.getenv('FABRIC_CLIENT_ID')
        self.client_secret = os.getenv('FABRIC_CLIENT_SECRET')
        self.workspace_id = os.getenv('FABRIC_WORKSPACE_ID')
        self.lakehouse_id = os.getenv('FABRIC_LAKEHOUSE_ID')

        # Validate credentials
        if not all([self.tenant_id, self.client_id, self.client_secret,
                   self.workspace_id, self.lakehouse_id]):
            raise ValueError("Missing required environment variables in .env file")

        # Fabric API endpoint
        self.base_url = "https://api.fabric.microsoft.com/v1"
        self.token = None

    def authenticate(self):
        """Authenticate with Azure AD and get access token using REST API"""
        try:
            # Azure AD OAuth2 token endpoint
            token_url = f"https://login.microsoftonline.com/{self.tenant_id}/oauth2/v2.0/token"

            # Request body for client credentials flow
            data = {
                'grant_type': 'client_credentials',
                'client_id': self.client_id,
                'client_secret': self.client_secret,
                'scope': 'https://api.fabric.microsoft.com/.default'
            }

            # Request access token
            response = requests.post(token_url, data=data)

            if response.status_code == 200:
                token_response = response.json()
                self.token = token_response.get('access_token')
                print("✅ Authentication successful!")
                return True
            else:
                print(f"❌ Authentication failed: {response.status_code}")
                print(f"   Details: {response.text}")
                return False

        except Exception as e:
            print(f"❌ Authentication failed: {str(e)}")
            return False

    def get_headers(self):
        """Get headers for API requests"""
        if not self.token:
            raise ValueError("Not authenticated. Call authenticate() first.")
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

    def test_connection(self):
        """Test connection to Fabric workspace and lakehouse"""
        try:
            # Test workspace access
            workspace_url = f"{self.base_url}/workspaces/{self.workspace_id}"
            response = requests.get(workspace_url, headers=self.get_headers())

            if response.status_code == 200:
                workspace = response.json()
                print(f"✅ Connected to workspace: {workspace.get('displayName', 'Unknown')}")
            else:
                print(f"⚠️  Workspace response: {response.status_code}")
                print(f"   Details: {response.text}")

            # Test lakehouse access
            lakehouse_url = f"{self.base_url}/workspaces/{self.workspace_id}/lakehouses/{self.lakehouse_id}"
            response = requests.get(lakehouse_url, headers=self.get_headers())

            if response.status_code == 200:
                lakehouse = response.json()
                print(f"✅ Connected to lakehouse: {lakehouse.get('displayName', 'Unknown')}")
                return True
            else:
                print(f"⚠️  Lakehouse response: {response.status_code}")
                print(f"   Details: {response.text}")
                return False

        except Exception as e:
            print(f"❌ Connection test failed: {str(e)}")
            return False

    def list_files(self, path="Files"):
        """List files in the lakehouse"""
        try:
            # Use OneLake API to list files
            url = f"{self.base_url}/workspaces/{self.workspace_id}/lakehouses/{self.lakehouse_id}/files"
            response = requests.get(url, headers=self.get_headers())

            if response.status_code == 200:
                files = response.json()
                print(f"\n📁 Files in lakehouse '{path}':")
                if isinstance(files, dict) and 'value' in files:
                    for file in files['value']:
                        print(f"   - {file.get('name', 'Unknown')}")
                else:
                    print("   (Empty or structure unknown)")
                return files
            else:
                print(f"⚠️  List files failed: {response.status_code}")
                print(f"   Details: {response.text}")
                return None

        except Exception as e:
            print(f"❌ List files error: {str(e)}")
            return None

    def upload_file(self, local_path, lakehouse_path=None):
        """
        Upload a file to Fabric Lakehouse

        Args:
            local_path: Local file path to upload
            lakehouse_path: Destination path in lakehouse (default: Files/{filename})
        """
        try:
            local_file = Path(local_path)
            if not local_file.exists():
                print(f"❌ File not found: {local_path}")
                return False

            if not lakehouse_path:
                lakehouse_path = f"Files/{local_file.name}"

            print(f"📤 Uploading {local_file.name} to {lakehouse_path}...")

            # Read file content
            with open(local_file, 'rb') as f:
                file_content = f.read()

            # Upload using OneLake API
            url = f"{self.base_url}/workspaces/{self.workspace_id}/lakehouses/{self.lakehouse_id}/upload"

            files = {
                'file': (local_file.name, file_content)
            }

            headers = {
                "Authorization": f"Bearer {self.token}"
            }

            data = {
                'path': lakehouse_path
            }

            response = requests.post(url, headers=headers, files=files, data=data)

            if response.status_code in [200, 201]:
                print(f"✅ File uploaded successfully!")
                return True
            else:
                print(f"⚠️  Upload failed: {response.status_code}")
                print(f"   Details: {response.text}")
                return False

        except Exception as e:
            print(f"❌ Upload error: {str(e)}")
            return False


def main():
    """Main function to test the integration"""
    print("=" * 60)
    print("🚀 Microsoft Fabric Lakehouse Integration Test")
    print("=" * 60)

    try:
        # Initialize client
        print("\n1️⃣ Initializing Fabric client...")
        client = FabricLakehouseClient()

        # Authenticate
        print("\n2️⃣ Authenticating with Azure AD...")
        if not client.authenticate():
            sys.exit(1)

        # Test connection
        print("\n3️⃣ Testing connection to Fabric...")
        if not client.test_connection():
            print("\n⚠️  Connection test had issues, but continuing...")

        # List files
        print("\n4️⃣ Listing files in lakehouse...")
        client.list_files()

        print("\n" + "=" * 60)
        print("✅ Integration test completed!")
        print("=" * 60)
        print("\n💡 You can now use this client to:")
        print("   - Upload CSV files: client.upload_file('data.csv')")
        print("   - List files: client.list_files()")
        print("   - Access lakehouse data programmatically")

    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
