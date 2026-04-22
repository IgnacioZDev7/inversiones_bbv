import os
import requests
import hashlib
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

MESES = {1: '03', 2: '06', 3: '09', 4: '12'}
FECHAS_FIN = {1: '31MAR', 2: '30JUN', 3: '30SEP', 4: '31DIC'}

class BBVDownloader:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    
    def _generate_candidates(self, codigo_bbv: str, gestion: int, trimestre: int) -> list:
        mes = MESES[trimestre]
        fecha_fin = FECHAS_FIN[trimestre]
        return [
            # Patrones históricos (BVC, etc)
            f"{gestion}{mes}_{codigo_bbv}_EEFF_BG.PDF",
            f"{gestion}{mes}_{codigo_bbv}_EEFF_BG.pdf",
            
            # Patrones Agroindustriales observados
            f"BG_{codigo_bbv}_2_{fecha_fin}{gestion}.pdf",
            f"BG_{codigo_bbv}_2_{fecha_fin}{gestion}.PDF",
            f"BG_{codigo_bbv}_1_{fecha_fin}{gestion}.pdf",
            f"BG_{codigo_bbv}_1_{fecha_fin}{gestion}.PDF",
            f"BG_{codigo_bbv}_{fecha_fin}{gestion}.pdf",
            f"BG_{codigo_bbv}_{fecha_fin}{gestion}.PDF",
        ]

    def download_report(self, codigo_bbv: str, gestion: int, trimestre: int) -> dict:
        """
        Descarga el PDF intentando múltiples patrones de nombre y devuelve atributos de la descarga.
        """
        if trimestre not in MESES:
            return {'success': False, 'error': "Trimestre inválido (debe ser 1-4)"}
            
        base_url = f"https://www.bbv.com.bo/EEFF2/{codigo_bbv}/Estados Financieros Trimestrales/Gestion {gestion}/Trimestre {trimestre}/"
        candidates = self._generate_candidates(codigo_bbv, gestion, trimestre)
        
        last_error = "No se intentó descargar"
        last_url = ""
        
        for nombre_archivo in candidates:
            url = base_url + nombre_archivo
            last_url = url
            try:
                # Se imprime a nivel de logger o se puede hacer stdout desde el pipeline,
                # pero guardamos el patron exitoso para retornarlo
                response = requests.get(url, headers=self.headers, timeout=30)
                if response.status_code == 200:
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
                        'tamano_bytes': tamano_bytes,
                        'patron_exitoso': nombre_archivo
                    }
                else:
                    last_error = f"Error HTTP {response.status_code}"
            except requests.RequestException as e:
                last_error = f"Excepción de conexión descargando {url}: {str(e)}"
                
        # Si terminamos el bucle y no hubo return, ninguno funcionó
        return {
            'success': False,
            'error': f"No se encontró el PDF tras intentar {len(candidates)} patrones. Último error: {last_error}",
            'url': last_url
        }
