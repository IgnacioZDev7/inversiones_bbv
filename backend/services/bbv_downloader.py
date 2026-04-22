import os
import requests
import hashlib
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

MESES = {1: '03', 2: '06', 3: '09', 4: '12'}
FECHAS_ESPERADAS = {
    1: ['31MAR'],
    2: ['30JUN'],
    3: ['30SEP'],
    4: ['31DIC', '31DEC']
}

class BBVDownloader:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    
    def _generate_candidates(self, codigo_bbv: str, gestion: int, trimestre: int) -> list:
        candidates = []
        
        # Función auxiliar para generar variaciones de patrones por fecha
        def get_patterns_for_dates(fechas):
            pats = []
            for fecha in fechas:
                pats.extend([
                    f"BG_{codigo_bbv}_2_{fecha}{gestion}.pdf",
                    f"BG_{codigo_bbv}_2_{fecha}{gestion}.PDF",
                    f"BG_{codigo_bbv}_1_{fecha}{gestion}.pdf",
                    f"BG_{codigo_bbv}_1_{fecha}{gestion}.PDF",
                    f"BG_{codigo_bbv}_{fecha}{gestion}.pdf",
                    f"BG_{codigo_bbv}_{fecha}{gestion}.PDF",
                ])
            return pats
            
        def get_historical_patterns(mes_str):
            return [
                f"{gestion}{mes_str}_{codigo_bbv}_EEFF_BG.PDF",
                f"{gestion}{mes_str}_{codigo_bbv}_EEFF_BG.pdf",
            ]

        # 1. Patrones esperados (prioridad alta)
        mes_num = MESES[trimestre]
        candidates.extend(get_historical_patterns(mes_num))
        candidates.extend(get_patterns_for_dates(FECHAS_ESPERADAS[trimestre]))
        
        # 2. Fallback: otras fechas del año por si se equivocaron al nombrar el archivo
        fallback_fechas = []
        for t, fechas in FECHAS_ESPERADAS.items():
            if t != trimestre:
                fallback_fechas.extend(fechas)
                candidates.extend(get_historical_patterns(MESES[t]))
                
        candidates.extend(get_patterns_for_dates(fallback_fechas))
        
        return candidates

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
