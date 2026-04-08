import traceback
import pdfplumber
import re

class PDFParser:
    def extraer_fecha(self, text):
        match = re.search(r'al\s+(\d{1,2})\s+de\s+([^\d]+)\s+de\s+(\d{4})', text, re.IGNORECASE)
        if match:
            dia = match.group(1).zfill(2)
            mes_nombre = match.group(2).strip().lower()
            año = match.group(3)
            meses = {
                'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
                'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
                'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
            }
            mes = meses.get(mes_nombre, '01')
            return f"{año}-{mes}-{dia}"
        return None

    def extraer_totales(self, lineas_texto):
        datos = {
            'total_activo_corriente': None,
            'total_activo_no_corriente': None,
            'total_activo': None,
            'total_pasivo_corriente': None,
            'total_pasivo_no_corriente': None,
            'total_pasivo': None,
            'total_patrimonio': None
        }
        for line in lineas_texto:
            line_upper = line.upper()
            if 'TOTAL' in line_upper:
                numeros = re.findall(r'[\d\.,]+', line)
                if numeros:
                    # Parsear el último número ignorando si hay texto sucio alrededor
                    raw_val = numeros[-1].replace(',', '').replace('.', '')
                    try:
                        valor = float(raw_val)
                    except Exception:
                        continue
                        
                    if 'TOTAL PASIVO Y PATRIMONIO' in line_upper:
                        continue
                        
                    if 'ACTIVO CORRIENTE' in line_upper:
                        datos['total_activo_corriente'] = valor
                    elif 'ACTIVO NO CORRIENTE' in line_upper or ('NO CORRIENTE' in line_upper and 'PASIVO' not in line_upper):
                        datos['total_activo_no_corriente'] = valor
                    elif 'TOTAL ACTIVO' in line_upper and 'CORRIENTE' not in line_upper:
                        datos['total_activo'] = valor
                    elif 'PASIVO CORRIENTE' in line_upper:
                        datos['total_pasivo_corriente'] = valor
                    elif 'PASIVO NO CORRIENTE' in line_upper or ('NO CORRIENTE' in line_upper and 'ACTIVO' not in line_upper):
                        datos['total_pasivo_no_corriente'] = valor
                    elif 'TOTAL PASIVO' in line_upper and 'CORRIENTE' not in line_upper and 'PATRIMONIO' not in line_upper:
                        datos['total_pasivo'] = valor
                    elif ('TOTAL PATRIMONIO' in line_upper or 'PATRIMONIO' in line_upper) and 'PASIVO' not in line_upper:
                        datos['total_patrimonio'] = valor
        return datos

    def parse(self, pdf_path):
        """Abre el PDF local y extrae los datos."""
        try:
            texto_completo = ""
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        texto_completo += text + "\n"
                        
            if not texto_completo:
                return {'success': False, 'error': 'El documento PDF no contiene texto extraíble.'}
                
            fecha = self.extraer_fecha(texto_completo)
            lineas = texto_completo.split('\n')
            valores = self.extraer_totales(lineas)
            
            return {
                'success': True,
                'fecha_publicacion': fecha,
                'valores_brutos': valores
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Error procesando PDF: {str(e)}',
                'traceback': traceback.format_exc()
            }
