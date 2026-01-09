"""
Script de inicio rápido para Microsoft Fabric
Wizard interactivo para configurar y probar la conexión
"""

import os
import sys
from colorama import Fore, Style, init

init(autoreset=True)


def print_header():
    """Imprime el header del wizard"""
    print(f"\n{Fore.CYAN}{'='*70}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}      🚀 MICROSOFT FABRIC - CONFIGURACIÓN RÁPIDA{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'='*70}{Style.RESET_ALL}\n")


def print_step(number, title):
    """Imprime el título de un paso"""
    print(f"\n{Fore.YELLOW}{'─'*70}{Style.RESET_ALL}")
    print(f"{Fore.YELLOW}PASO {number}: {title}{Style.RESET_ALL}")
    print(f"{Fore.YELLOW}{'─'*70}{Style.RESET_ALL}\n")


def check_env_file():
    """Verifica si existe el archivo .env"""
    env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
    env_example_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env.example')

    if os.path.exists(env_path):
        print(f"{Fore.GREEN}✅ Archivo .env encontrado{Style.RESET_ALL}")
        return True
    else:
        print(f"{Fore.RED}❌ No se encontró el archivo .env{Style.RESET_ALL}")
        print(f"\n{Fore.YELLOW}Necesitas crear el archivo .env con tus credenciales.{Style.RESET_ALL}")

        if os.path.exists(env_example_path):
            print(f"\n{Fore.CYAN}Pasos para crear .env:{Style.RESET_ALL}")
            print(f"1. Copia el archivo .env.example a .env:")
            print(f"   cp .env.example .env")
            print(f"2. Edita .env y completa con tus credenciales")
            print(f"3. Lee FABRIC_README.md para obtener las credenciales")
        else:
            print(f"\n{Fore.RED}Tampoco se encontró .env.example{Style.RESET_ALL}")

        return False


def check_dependencies():
    """Verifica que las dependencias estén instaladas"""
    try:
        import azure.identity
        import azure.storage.filedatalake
        import pandas
        import openpyxl
        from dotenv import load_dotenv

        print(f"{Fore.GREEN}✅ Todas las dependencias están instaladas{Style.RESET_ALL}")
        return True
    except ImportError as e:
        print(f"{Fore.RED}❌ Faltan dependencias: {str(e)}{Style.RESET_ALL}")
        print(f"\n{Fore.YELLOW}Instala las dependencias con:{Style.RESET_ALL}")
        print(f"   pip install -r requirements.txt")
        return False


def test_connection():
    """Prueba la conexión a Fabric"""
    try:
        from fabric_connection import FabricConnection

        print(f"\n{Fore.CYAN}Probando conexión a Microsoft Fabric...{Style.RESET_ALL}\n")

        connection = FabricConnection()
        result = connection.test_connection()

        return result

    except Exception as e:
        print(f"{Fore.RED}❌ Error al probar conexión: {str(e)}{Style.RESET_ALL}")
        return False


def show_menu():
    """Muestra el menú de opciones"""
    print(f"\n{Fore.CYAN}{'='*70}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}                    ¿QUÉ QUIERES HACER?{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'='*70}{Style.RESET_ALL}\n")

    print(f"{Fore.GREEN}1.{Style.RESET_ALL} Probar conexión a Fabric")
    print(f"{Fore.GREEN}2.{Style.RESET_ALL} Listar archivos en OneLake")
    print(f"{Fore.GREEN}3.{Style.RESET_ALL} Subir un archivo")
    print(f"{Fore.GREEN}4.{Style.RESET_ALL} Descargar un archivo")
    print(f"{Fore.GREEN}5.{Style.RESET_ALL} Leer documentación completa")
    print(f"{Fore.GREEN}6.{Style.RESET_ALL} Salir")

    choice = input(f"\n{Fore.YELLOW}Elige una opción (1-6): {Style.RESET_ALL}")
    return choice


def handle_option(choice):
    """Maneja la opción seleccionada"""
    if choice == '1':
        print_step(1, "Probando Conexión")
        test_connection()

    elif choice == '2':
        print_step(2, "Listando Archivos")
        from download_from_fabric import FabricDownloader
        downloader = FabricDownloader()
        if downloader.connection.authenticate():
            downloader.list_available_files()

    elif choice == '3':
        print_step(3, "Subir Archivo")
        file_path = input(f"{Fore.YELLOW}Ruta del archivo a subir: {Style.RESET_ALL}")
        remote_path = input(f"{Fore.YELLOW}Ruta destino (Enter para usar nombre original): {Style.RESET_ALL}")

        from upload_to_fabric import FabricUploader
        uploader = FabricUploader()
        if uploader.connection.authenticate():
            uploader.upload_file(file_path, remote_path if remote_path else None)

    elif choice == '4':
        print_step(4, "Descargar Archivo")
        remote_path = input(f"{Fore.YELLOW}Nombre del archivo remoto: {Style.RESET_ALL}")
        local_path = input(f"{Fore.YELLOW}Ruta local (Enter para carpeta por defecto): {Style.RESET_ALL}")

        from download_from_fabric import FabricDownloader
        downloader = FabricDownloader()
        if downloader.connection.authenticate():
            downloader.download_file(remote_path, local_path if local_path else None)

    elif choice == '5':
        print_step(5, "Documentación")
        readme_path = os.path.join(os.path.dirname(__file__), '..', '..', 'FABRIC_README.md')
        print(f"\n{Fore.CYAN}Lee la documentación completa en:{Style.RESET_ALL}")
        print(f"   {readme_path}")
        print(f"\n{Fore.CYAN}O ábrela con:{Style.RESET_ALL}")
        print(f"   cat FABRIC_README.md")

    elif choice == '6':
        print(f"\n{Fore.GREEN}👋 ¡Hasta luego!{Style.RESET_ALL}\n")
        sys.exit(0)

    else:
        print(f"{Fore.RED}❌ Opción inválida{Style.RESET_ALL}")


def main():
    """Función principal del wizard"""
    print_header()

    print_step(1, "Verificando Configuración")

    # Verificar dependencias
    if not check_dependencies():
        print(f"\n{Fore.RED}No se puede continuar sin las dependencias{Style.RESET_ALL}")
        return

    # Verificar archivo .env
    if not check_env_file():
        print(f"\n{Fore.RED}No se puede continuar sin el archivo .env{Style.RESET_ALL}")
        print(f"\n{Fore.CYAN}Lee FABRIC_README.md para instrucciones detalladas{Style.RESET_ALL}\n")
        return

    # Menú interactivo
    while True:
        choice = show_menu()
        handle_option(choice)

        input(f"\n{Fore.YELLOW}Presiona Enter para continuar...{Style.RESET_ALL}")


if __name__ == "__main__":
    main()
