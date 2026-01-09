"""
Script para descargar archivos desde Microsoft Fabric / OneLake
"""

import os
import sys
from pathlib import Path
from fabric_connection import FabricConnection
from colorama import Fore, Style, init
from tqdm import tqdm

init(autoreset=True)


class FabricDownloader:
    """Clase para manejar la descarga de archivos desde OneLake"""

    def __init__(self):
        self.connection = FabricConnection()
        self.local_data_path = os.getenv('LOCAL_DATA_PATH', './fabric/data')

    def download_file(self, remote_path, local_file_path=None):
        """
        Descarga un archivo desde OneLake

        Args:
            remote_path (str): Ruta del archivo en OneLake
            local_file_path (str): Ruta destino local (opcional)

        Returns:
            bool: True si la descarga fue exitosa
        """
        try:
            # Si no empieza con Files/, agregarlo
            if not remote_path.startswith('Files/'):
                remote_path = f"Files/{remote_path}"

            # Si no se especifica local_file_path, usar el nombre del archivo
            if local_file_path is None:
                file_name = os.path.basename(remote_path)
                local_file_path = os.path.join(self.local_data_path, file_name)

            # Crear directorio si no existe
            os.makedirs(os.path.dirname(local_file_path), exist_ok=True)

            print(f"\n{Fore.CYAN}📥 Preparando descarga de archivo...{Style.RESET_ALL}")
            print(f"   📍 Origen: {remote_path}")
            print(f"   💾 Destino: {local_file_path}")

            # Conectar a OneLake
            file_system_client = self.connection.get_file_system_client()
            if not file_system_client:
                return False

            # Obtener el cliente del archivo
            file_client = file_system_client.get_file_client(remote_path)

            # Verificar si el archivo existe
            try:
                properties = file_client.get_file_properties()
                file_size = properties.size
                file_size_mb = file_size / (1024 * 1024)
                print(f"   📊 Tamaño: {file_size_mb:.2f} MB")
            except Exception:
                print(f"{Fore.RED}❌ El archivo no existe en OneLake: {remote_path}{Style.RESET_ALL}")
                return False

            # Descargar el archivo
            print(f"\n{Fore.YELLOW}⏳ Descargando archivo...{Style.RESET_ALL}")

            download_stream = file_client.download_file()
            file_data = download_stream.readall()

            # Guardar el archivo localmente
            with open(local_file_path, 'wb') as file:
                file.write(file_data)

            print(f"{Fore.GREEN}✅ Archivo descargado exitosamente{Style.RESET_ALL}")
            print(f"{Fore.GREEN}💾 Ubicación: {local_file_path}{Style.RESET_ALL}")

            return True

        except Exception as e:
            print(f"{Fore.RED}❌ Error al descargar archivo: {str(e)}{Style.RESET_ALL}")
            return False

    def download_folder(self, remote_folder, local_folder=None):
        """
        Descarga una carpeta completa desde OneLake

        Args:
            remote_folder (str): Carpeta en OneLake
            local_folder (str): Carpeta destino local

        Returns:
            dict: Resultado de la descarga (exitosos, fallidos)
        """
        try:
            # Si no se especifica local_folder, usar el nombre de la carpeta remota
            if local_folder is None:
                folder_name = os.path.basename(remote_folder.rstrip('/'))
                local_folder = os.path.join(self.local_data_path, folder_name)

            print(f"\n{Fore.CYAN}📂 Preparando descarga de carpeta...{Style.RESET_ALL}")
            print(f"   📍 Origen: {remote_folder}")
            print(f"   💾 Destino: {local_folder}")

            # Conectar a OneLake
            file_system_client = self.connection.get_file_system_client()
            if not file_system_client:
                return {"success": 0, "failed": 0}

            # Listar archivos en la carpeta remota
            if not remote_folder.startswith('Files/'):
                remote_folder = f"Files/{remote_folder}"

            paths = file_system_client.get_paths(path=remote_folder.lstrip('/'))

            files = []
            for path_item in paths:
                if not path_item.is_directory:
                    files.append(path_item.name)

            print(f"   📊 Total de archivos: {len(files)}")

            # Descargar cada archivo
            success_count = 0
            failed_count = 0

            for remote_file in tqdm(files, desc="Descargando archivos"):
                # Calcular ruta local
                rel_path = remote_file.replace(remote_folder.lstrip('/'), '').lstrip('/')
                local_file = os.path.join(local_folder, rel_path)

                if self.download_file(remote_file, local_file):
                    success_count += 1
                else:
                    failed_count += 1

            print(f"\n{Fore.GREEN}✅ Descarga completada{Style.RESET_ALL}")
            print(f"   ✅ Exitosos: {success_count}")
            print(f"   ❌ Fallidos: {failed_count}")

            return {"success": success_count, "failed": failed_count}

        except Exception as e:
            print(f"{Fore.RED}❌ Error al descargar carpeta: {str(e)}{Style.RESET_ALL}")
            return {"success": 0, "failed": 0}

    def list_available_files(self, remote_path="Files"):
        """
        Lista los archivos disponibles en OneLake

        Args:
            remote_path (str): Ruta a listar

        Returns:
            list: Lista de archivos
        """
        print(f"\n{Fore.CYAN}📋 Listando archivos disponibles en OneLake...{Style.RESET_ALL}")
        files = self.connection.list_files(remote_path)

        if not files:
            print(f"{Fore.YELLOW}⚠️  No se encontraron archivos{Style.RESET_ALL}")

        return files

    def download_excel(self, remote_excel_path, local_path=None):
        """
        Descarga un archivo Excel específicamente

        Args:
            remote_excel_path (str): Ruta del Excel en OneLake
            local_path (str): Ruta destino local

        Returns:
            bool: True si la descarga fue exitosa
        """
        print(f"{Fore.CYAN}📊 Descargando archivo Excel...{Style.RESET_ALL}")
        return self.download_file(remote_excel_path, local_path)


def main():
    """Función principal para usar desde línea de comandos"""
    if len(sys.argv) < 2:
        print(f"\n{Fore.YELLOW}Uso:{Style.RESET_ALL}")
        print(f"  python download_from_fabric.py <archivo_remoto> [ruta_local]")
        print(f"  python download_from_fabric.py --list [carpeta]")
        print(f"\n{Fore.CYAN}Ejemplos:{Style.RESET_ALL}")
        print(f"  python download_from_fabric.py datos.xlsx")
        print(f"  python download_from_fabric.py mi_carpeta/datos.xlsx ./descargados/datos.xlsx")
        print(f"  python download_from_fabric.py --list")
        print(f"  python download_from_fabric.py --list mi_carpeta")
        return

    downloader = FabricDownloader()

    # Conectar a Fabric
    if not downloader.connection.validate_credentials():
        return

    if not downloader.connection.authenticate():
        return

    # Opción de listar archivos
    if sys.argv[1] == "--list":
        remote_path = sys.argv[2] if len(sys.argv) > 2 else "Files"
        downloader.list_available_files(remote_path)
        return

    remote_path = sys.argv[1]
    local_path = sys.argv[2] if len(sys.argv) > 2 else None

    # Descargar el archivo
    downloader.download_file(remote_path, local_path)


if __name__ == "__main__":
    main()
