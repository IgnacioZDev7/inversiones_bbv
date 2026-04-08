import os
import requests
import hashlib
from django.conf import settings

MESES = {1: '03', 2: '06', 3: '09', 4: '12'}

class BBVDownloader:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    
    def download_report(self, codigo_bbv: str, gestion: int, trimestre: int) -> dict:
        """
        Descarga el PDF y devuelve atributos de la descarga.
        """
        mes = MESES.get(trimestre)
        if not mes:
            return {'success': False, 'error': "Trimestre inválido (debe ser 1-4)"}
            
        nombre_archivo = f"{gestion}{mes}_{codigo_bbv}_EEFF_BG.PDF"
        base_url = f"https://www.bbv.com.bo/EEFF2/{codigo_bbv}/Estados Financieros Trimestrales/Gestion {gestion}/Trimestre {trimestre}/"
        url = base_url + nombre_archivo
        
        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            if response.status_code != 200:
                return {
                    'success': False,
                    'error': f"Error HTTP {response.status_code} al descargar de {url}",
                    'url': url
                }
                
            content = response.content
            hash_archivo = hashlib.md5(content).hexdigest()
            tamano_bytes = len(content)
            
            # Directorios locales en /media/pdfs
            base_dir = getattr(settings, 'MEDIA_ROOT', os.path.join(settings.BASE_DIR, 'media'))
            dir_pdf = os.path.join(base_dir, 'pdfs', codigo_bbv, str(gestion), f"Q{trimestre}")
            os.makedirs(dir_pdf, exist_ok=True)
            
            path_local = os.path.join(dir_pdf, nombre_archivo)
            with open(path_local, 'wb') as f:
                f.write(content)
                
            return {
                'success': True,
                'url': url,
                'ruta_archivo_local': path_local,
                'nombre_archivo': nombre_archivo,
                'hash_archivo': hash_archivo,
                'tamano_bytes': tamano_bytes
            }
        except requests.RequestException as e:
            return {
                'success': False,
                'error': f"Excepción de conexión descargando {url}: {str(e)}",
                'url': url
            }
