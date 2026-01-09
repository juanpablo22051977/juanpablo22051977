"""
Módulo de conexión a Microsoft Fabric / OneLake
Proporciona funciones para autenticarse y conectarse a OneLake
"""

import os
from azure.identity import ClientSecretCredential
from azure.storage.filedatalake import DataLakeServiceClient
from dotenv import load_dotenv
from colorama import Fore, Style, init

# Initialize colorama
init(autoreset=True)

# Load environment variables
load_dotenv()


class FabricConnection:
    """
    Clase para manejar la conexión a Microsoft Fabric / OneLake
    """

    def __init__(self):
        """Inicializa la conexión con las credenciales del .env"""
        self.tenant_id = os.getenv('AZURE_TENANT_ID')
        self.client_id = os.getenv('AZURE_CLIENT_ID')
        self.client_secret = os.getenv('AZURE_CLIENT_SECRET')
        self.onelake_endpoint = os.getenv('ONELAKE_ENDPOINT', 'https://onelake.dfs.fabric.microsoft.com')
        self.workspace_id = os.getenv('FABRIC_WORKSPACE_ID')
        self.lakehouse_name = os.getenv('LAKEHOUSE_NAME')

        self.credential = None
        self.service_client = None

    def validate_credentials(self):
        """Valida que todas las credenciales necesarias estén configuradas"""
        required_vars = {
            'AZURE_TENANT_ID': self.tenant_id,
            'AZURE_CLIENT_ID': self.client_id,
            'AZURE_CLIENT_SECRET': self.client_secret,
            'FABRIC_WORKSPACE_ID': self.workspace_id,
            'LAKEHOUSE_NAME': self.lakehouse_name
        }

        missing = [key for key, value in required_vars.items() if not value]

        if missing:
            print(f"{Fore.RED}❌ Faltan las siguientes variables en el archivo .env:{Style.RESET_ALL}")
            for var in missing:
                print(f"   - {var}")
            return False

        print(f"{Fore.GREEN}✅ Todas las credenciales están configuradas{Style.RESET_ALL}")
        return True

    def authenticate(self):
        """Autentica usando Azure AD / Entra ID"""
        try:
            print(f"{Fore.CYAN}🔐 Autenticando con Azure AD...{Style.RESET_ALL}")

            self.credential = ClientSecretCredential(
                tenant_id=self.tenant_id,
                client_id=self.client_id,
                client_secret=self.client_secret
            )

            print(f"{Fore.GREEN}✅ Autenticación exitosa{Style.RESET_ALL}")
            return True

        except Exception as e:
            print(f"{Fore.RED}❌ Error en la autenticación: {str(e)}{Style.RESET_ALL}")
            return False

    def connect_to_onelake(self):
        """Conecta al servicio de OneLake"""
        try:
            if not self.credential:
                print(f"{Fore.YELLOW}⚠️  No hay credenciales. Autenticando primero...{Style.RESET_ALL}")
                if not self.authenticate():
                    return False

            print(f"{Fore.CYAN}🔗 Conectando a OneLake...{Style.RESET_ALL}")

            # Construir la URL del servicio
            account_url = f"{self.onelake_endpoint}/{self.workspace_id}"

            self.service_client = DataLakeServiceClient(
                account_url=account_url,
                credential=self.credential
            )

            print(f"{Fore.GREEN}✅ Conexión a OneLake establecida{Style.RESET_ALL}")
            print(f"{Fore.CYAN}📍 Workspace: {self.workspace_id}{Style.RESET_ALL}")
            print(f"{Fore.CYAN}🏠 Lakehouse: {self.lakehouse_name}{Style.RESET_ALL}")

            return True

        except Exception as e:
            print(f"{Fore.RED}❌ Error al conectar a OneLake: {str(e)}{Style.RESET_ALL}")
            return False

    def get_file_system_client(self):
        """Obtiene el cliente del sistema de archivos (Lakehouse)"""
        try:
            if not self.service_client:
                if not self.connect_to_onelake():
                    return None

            file_system_client = self.service_client.get_file_system_client(
                file_system=self.lakehouse_name
            )

            return file_system_client

        except Exception as e:
            print(f"{Fore.RED}❌ Error al obtener file system client: {str(e)}{Style.RESET_ALL}")
            return None

    def list_files(self, path="/Files"):
        """Lista los archivos en un path específico de OneLake"""
        try:
            file_system_client = self.get_file_system_client()
            if not file_system_client:
                return []

            print(f"{Fore.CYAN}📂 Listando archivos en: {path}{Style.RESET_ALL}")

            paths = file_system_client.get_paths(path=path.lstrip('/'))

            files = []
            for path_item in paths:
                files.append(path_item.name)
                print(f"   📄 {path_item.name}")

            return files

        except Exception as e:
            print(f"{Fore.RED}❌ Error al listar archivos: {str(e)}{Style.RESET_ALL}")
            return []

    def test_connection(self):
        """Prueba completa de la conexión"""
        print(f"\n{Fore.YELLOW}{'='*60}{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}🧪 PRUEBA DE CONEXIÓN A MICROSOFT FABRIC{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}{'='*60}{Style.RESET_ALL}\n")

        # Step 1: Validate credentials
        if not self.validate_credentials():
            return False

        # Step 2: Authenticate
        if not self.authenticate():
            return False

        # Step 3: Connect to OneLake
        if not self.connect_to_onelake():
            return False

        # Step 4: List files (optional test)
        print(f"\n{Fore.CYAN}📋 Intentando listar archivos...{Style.RESET_ALL}")
        self.list_files()

        print(f"\n{Fore.GREEN}{'='*60}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}✅ CONEXIÓN EXITOSA A MICROSOFT FABRIC{Style.RESET_ALL}")
        print(f"{Fore.GREEN}{'='*60}{Style.RESET_ALL}\n")

        return True


def main():
    """Función principal para probar la conexión"""
    connection = FabricConnection()
    connection.test_connection()


if __name__ == "__main__":
    main()
