#!/usr/bin/env python3
"""Simple test to verify the MCP server can be imported and initialized"""

import os
import sys

# Set environment variables from .env file
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv()

def test_imports():
    """Test that all required modules can be imported"""
    print("🔍 Testing imports...")

    try:
        import mcp
        print("   ✅ mcp")
    except ImportError as e:
        print(f"   ❌ mcp: {e}")
        return False

    try:
        import msal
        print("   ✅ msal")
    except ImportError as e:
        print(f"   ❌ msal: {e}")
        return False

    try:
        import aiohttp
        print("   ✅ aiohttp")
    except ImportError as e:
        print(f"   ❌ aiohttp: {e}")
        return False

    return True


def test_environment():
    """Test that environment variables are set"""
    print("\n🔍 Testing environment variables...")

    required_vars = [
        'FABRIC_TENANT_ID',
        'FABRIC_CLIENT_ID',
        'FABRIC_CLIENT_SECRET',
        'FABRIC_WORKSPACE_ID',
        'FABRIC_LAKEHOUSE_ID'
    ]

    missing = []
    for var in required_vars:
        value = os.getenv(var)
        if value:
            print(f"   ✅ {var}: {value[:8]}...")
        else:
            print(f"   ❌ {var}: Not set")
            missing.append(var)

    return len(missing) == 0


def test_server_module():
    """Test that the server module can be loaded"""
    print("\n🔍 Testing server module...")

    try:
        # Add the mcp_server directory to the path
        mcp_server_dir = os.path.dirname(__file__)
        sys.path.insert(0, mcp_server_dir)

        # Try to import the fabric_server module
        import importlib.util
        spec = importlib.util.spec_from_file_location(
            "fabric_server",
            os.path.join(mcp_server_dir, "fabric_server.py")
        )
        fabric_server = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(fabric_server)

        print("   ✅ fabric_server.py loaded successfully")

        # Check that required functions exist
        if hasattr(fabric_server, 'initialize_auth'):
            print("   ✅ initialize_auth() found")
        else:
            print("   ❌ initialize_auth() not found")
            return False

        if hasattr(fabric_server, 'get_access_token'):
            print("   ✅ get_access_token() found")
        else:
            print("   ❌ get_access_token() not found")
            return False

        # Test authentication initialization
        try:
            fabric_server.initialize_auth()
            print("   ✅ Authentication client initialized")
        except Exception as e:
            print(f"   ❌ Failed to initialize authentication: {e}")
            return False

        return True

    except Exception as e:
        print(f"   ❌ Failed to load server module: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests"""
    print("=" * 60)
    print("  Microsoft Fabric MCP Server - Test Suite")
    print("=" * 60)
    print()

    tests = [
        ("Imports", test_imports),
        ("Environment", test_environment),
        ("Server Module", test_server_module)
    ]

    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n❌ Test '{name}' crashed: {e}")
            results.append((name, False))

    # Summary
    print("\n" + "=" * 60)
    print("  Test Summary")
    print("=" * 60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status} - {name}")

    print()
    print(f"  Total: {passed}/{total} tests passed")
    print("=" * 60)

    return passed == total


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
