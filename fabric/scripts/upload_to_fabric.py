"""
Script para subir archivos Excel y otros archivos a Microsoft Fabric / OneLake
"""

import os
import sys
from pathlib import Path
from fabric_connection import FabricConnection
from colorama import Fore, Style, init
from tqdm import tqdm

init(autoreset=True)


class FabricUploader:
    """Clase para manejar la subida de archivos a OneLake"""

    def __init__(self):
        self.connection = FabricConnection()

    def upload_file(self, local_file_path, remote_path=None, overwrite=True):
        """
        Sube un archivo a OneLake

        Args:
            local_file_path (str): Ruta del archivo local
            remote_path (str): Ruta destino en OneLake (opcional)
            overwrite (bool): Si debe sobrescribir archivos existentes

        Returns:
            bool: True si la subida fue exitosa
        """
        try:
            # Validar que el archivo existe
            if not os.path.exists(local_file_path):
                print(f"{Fore.RED}❌ El archivo no existe: {local_file_path}{Style.RESET_ALL}")
                return False

            # Obtener el nombre del archivo
            file_name = os.path.basename(local_file_path)

            # Si no se especifica remote_path, usar /Files/
            if remote_path is None:
                remote_path = f"Files/{file_name}"
            elif not remote_path.startswith('Files/'):
                remote_path = f"Files/{remote_path}"

            print(f"\n{Fore.CYAN}📤 Preparando subida de archivo...{Style.RESET_ALL}")
            print(f"   📄 Archivo local: {local_file_path}")
            print(f"   📍 Destino: {remote_path}")

            # Conectar a OneLake
            file_system_client = self.connection.get_file_system_client()
            if not file_system_client:
                return False

            # Obtener el cliente del archivo
            file_client = file_system_client.get_file_client(remote_path)

            # Obtener tamaño del archivo
            file_size = os.path.getsize(local_file_path)
            file_size_mb = file_size / (1024 * 1024)

            print(f"   💾 Tamaño: {file_size_mb:.2f} MB")

            # Leer y subir el archivo con barra de progreso
            with open(local_file_path, 'rb') as file:
                file_data = file.read()

                print(f"\n{Fore.YELLOW}⏳ Subiendo archivo...{Style.RESET_ALL}")

                # Crear o sobrescribir el archivo
                file_client.upload_data(
                    data=file_data,
                    overwrite=overwrite
                )

            print(f"{Fore.GREEN}✅ Archivo subido exitosamente{Style.RESET_ALL}")
            print(f"{Fore.GREEN}📍 Ubicación: {remote_path}{Style.RESET_ALL}")

            return True

        except Exception as e:
            print(f"{Fore.RED}❌ Error al subir archivo: {str(e)}{Style.RESET_ALL}")
            return False

    def upload_folder(self, local_folder_path, remote_folder=None):
        """
        Sube una carpeta completa a OneLake

        Args:
            local_folder_path (str): Ruta de la carpeta local
            remote_folder (str): Carpeta destino en OneLake

        Returns:
            dict: Resultado de la subida (exitosos, fallidos)
        """
        try:
            if not os.path.isdir(local_folder_path):
                print(f"{Fore.RED}❌ La carpeta no existe: {local_folder_path}{Style.RESET_ALL}")
                return {"success": 0, "failed": 0}

            # Si no se especifica remote_folder, usar el nombre de la carpeta local
            if remote_folder is None:
                remote_folder = os.path.basename(local_folder_path.rstrip('/'))

            print(f"\n{Fore.CYAN}📂 Preparando subida de carpeta...{Style.RESET_ALL}")
            print(f"   📁 Carpeta local: {local_folder_path}")
            print(f"   📍 Destino: Files/{remote_folder}/")

            # Obtener lista de archivos
            files = []
            for root, dirs, filenames in os.walk(local_folder_path):
                for filename in filenames:
                    file_path = os.path.join(root, filename)
                    rel_path = os.path.relpath(file_path, local_folder_path)
                    files.append((file_path, rel_path))

            print(f"   📊 Total de archivos: {len(files)}")

            # Subir cada archivo
            success_count = 0
            failed_count = 0

            for file_path, rel_path in tqdm(files, desc="Subiendo archivos"):
                remote_path = f"{remote_folder}/{rel_path}".replace('\\', '/')
                if self.upload_file(file_path, remote_path):
                    success_count += 1
                else:
                    failed_count += 1

            print(f"\n{Fore.GREEN}✅ Subida completada{Style.RESET_ALL}")
            print(f"   ✅ Exitosos: {success_count}")
            print(f"   ❌ Fallidos: {failed_count}")

            return {"success": success_count, "failed": failed_count}

        except Exception as e:
            print(f"{Fore.RED}❌ Error al subir carpeta: {str(e)}{Style.RESET_ALL}")
            return {"success": 0, "failed": 0}

    def upload_excel(self, excel_file_path, remote_path=None):
        """
        Sube un archivo Excel específicamente (wrapper con validación)

        Args:
            excel_file_path (str): Ruta del archivo Excel
            remote_path (str): Ruta destino en OneLake

        Returns:
            bool: True si la subida fue exitosa
        """
        # Validar que sea un archivo Excel
        valid_extensions = ['.xlsx', '.xls', '.xlsm']
        file_ext = Path(excel_file_path).suffix.lower()

        if file_ext not in valid_extensions:
            print(f"{Fore.RED}❌ El archivo no es un Excel válido: {excel_file_path}{Style.RESET_ALL}")
            print(f"   Extensiones válidas: {', '.join(valid_extensions)}")
            return False

        print(f"{Fore.CYAN}📊 Subiendo archivo Excel...{Style.RESET_ALL}")
        return self.upload_file(excel_file_path, remote_path)


def main():
    """Función principal para usar desde línea de comandos"""
    if len(sys.argv) < 2:
        print(f"\n{Fore.YELLOW}Uso:{Style.RESET_ALL}")
        print(f"  python upload_to_fabric.py <archivo_o_carpeta> [ruta_destino]")
        print(f"\n{Fore.CYAN}Ejemplos:{Style.RESET_ALL}")
        print(f"  python upload_to_fabric.py datos.xlsx")
        print(f"  python upload_to_fabric.py datos.xlsx mi_carpeta/datos.xlsx")
        print(f"  python upload_to_fabric.py ./carpeta_datos/")
        return

    uploader = FabricUploader()

    # Conectar a Fabric
    if not uploader.connection.validate_credentials():
        return

    if not uploader.connection.authenticate():
        return

    local_path = sys.argv[1]
    remote_path = sys.argv[2] if len(sys.argv) > 2 else None

    # Determinar si es archivo o carpeta
    if os.path.isfile(local_path):
        # Es un archivo
        uploader.upload_file(local_path, remote_path)
    elif os.path.isdir(local_path):
        # Es una carpeta
        uploader.upload_folder(local_path, remote_path)
    else:
        print(f"{Fore.RED}❌ La ruta no existe: {local_path}{Style.RESET_ALL}")


if __name__ == "__main__":
    main()
