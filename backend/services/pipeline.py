from django.utils import timezone
from apps.financials.models import Empresa, ReporteFinanciero, IndicadorFinanciero, ProcesoCarga
from services.bbv_downloader import BBVDownloader
from services.pdf_parser import PDFParser
from services.cleaners import DataCleaner
from services.indicator_engine import IndicatorEngine

class FinancialPipeline:
    def __init__(self):
        self.downloader = BBVDownloader()
        self.parser = PDFParser()
        self.cleaner = DataCleaner()
        self.engine = IndicatorEngine()
        
    def _crear_proceso(self, empresa, reporte, tipo):
        return ProcesoCarga.objects.create(
            empresa=empresa,
            reporte=reporte,
            tipo_proceso=tipo,
            estado=ProcesoCarga.EstadoChoices.EN_PROCESO
        )

    def _actualizar_proceso(self, proceso, error=None):
        if error:
            proceso.estado = ProcesoCarga.EstadoChoices.FALLIDO
            proceso.mensaje_error = str(error)
        else:
            proceso.estado = ProcesoCarga.EstadoChoices.EXITOSO
        proceso.fecha_fin = timezone.now()
        proceso.save()
        
    def procesar_reporte(self, empresa: Empresa, gestion: int, trimestre: int) -> dict:
        """
        Orquesta el flujo: Descarga -> Parser -> Limpiar -> Calcular Ratios -> Guardar BD.
        Devuelve el resultado del proceso.
        """
        proceso_carga_completa = self._crear_proceso(empresa, None, ProcesoCarga.TipoProcesoChoices.CARGA)
        
        # 1: Descargar
        try:
            reporte, _ = ReporteFinanciero.objects.get_or_create(
                empresa=empresa,
                gestion=gestion,
                trimestre=trimestre,
                defaults={'estado_procesamiento': ReporteFinanciero.EstadoProcesamientoChoices.PENDIENTE}
            )
            proceso_carga_completa.reporte = reporte
            proceso_carga_completa.save()

            proceso_desc = self._crear_proceso(empresa, reporte, ProcesoCarga.TipoProcesoChoices.DESCARGA)
            download_result = self.downloader.download_report(empresa.codigo_bbv, gestion, trimestre)
            
            if not download_result['success']:
                self._actualizar_proceso(proceso_desc, download_result.get('error'))
                self._actualizar_proceso(proceso_carga_completa, "Falla en descarga.")
                reporte.estado_procesamiento = ReporteFinanciero.EstadoProcesamientoChoices.ERROR
                reporte.mensaje_error = download_result.get('error')
                reporte.save()
                return download_result

            reporte.url_pdf = download_result['url']
            reporte.ruta_archivo_local = download_result['ruta_archivo_local']
            reporte.nombre_archivo = download_result['nombre_archivo']
            reporte.hash_archivo = download_result['hash_archivo']
            reporte.tamano_archivo_bytes = download_result['tamano_bytes']
            reporte.fecha_descarga = timezone.now()
            reporte.estado_procesamiento = ReporteFinanciero.EstadoProcesamientoChoices.DESCARGADO
            reporte.save()
            self._actualizar_proceso(proceso_desc)
            
            # 2: Parsear
            proceso_extr = self._crear_proceso(empresa, reporte, ProcesoCarga.TipoProcesoChoices.EXTRACCION)
            parse_result = self.parser.parse(reporte.ruta_archivo_local)
            
            if not parse_result['success']:
                self._actualizar_proceso(proceso_extr, parse_result.get('error'))
                self._actualizar_proceso(proceso_carga_completa, "Falla extracción.")
                reporte.estado_procesamiento = ReporteFinanciero.EstadoProcesamientoChoices.ERROR
                reporte.mensaje_error = parse_result.get('error')
                reporte.save()
                return parse_result
                
            reporte.fecha_publicacion = parse_result.get('fecha_publicacion')
            reporte.datos_extraidos_json = parse_result.get('valores_brutos')
            reporte.save()
            self._actualizar_proceso(proceso_extr)

            # 3: Limpiar
            proceso_limp = self._crear_proceso(empresa, reporte, ProcesoCarga.TipoProcesoChoices.LIMPIEZA)
            clean_result = self.cleaner.clean(parse_result['valores_brutos'])
            if not clean_result['success']:
                self._actualizar_proceso(proceso_limp, clean_result.get('error'))
                self._actualizar_proceso(proceso_carga_completa, "Falla limpieza.")
                reporte.estado_procesamiento = ReporteFinanciero.EstadoProcesamientoChoices.ERROR
                reporte.mensaje_error = clean_result.get('error')
                reporte.save()
                return clean_result
                
            self._actualizar_proceso(proceso_limp)
            valores_limpios = clean_result['valores_limpios']
            
            # 4: Calcular Indicadores
            proceso_calc = self._crear_proceso(empresa, reporte, ProcesoCarga.TipoProcesoChoices.CALCULO)
            calc_result = self.engine.calculate(valores_limpios)
            self._actualizar_proceso(proceso_calc)
            
            # 5: Guardar todo en Base de Datos
            reporte.estado_procesamiento = ReporteFinanciero.EstadoProcesamientoChoices.PROCESADO
            reporte.save()
            
            indicador, _ = IndicadorFinanciero.objects.update_or_create(
                reporte=reporte,
                defaults={
                    'activos': valores_limpios.get('total_activo'),
                    'pasivos': valores_limpios.get('total_pasivo'),
                    'patrimonio': valores_limpios.get('total_patrimonio'),
                    'activo_corriente': valores_limpios.get('total_activo_corriente'),
                    'pasivo_corriente': valores_limpios.get('total_pasivo_corriente'),
                    'liquidez_corriente': calc_result['indicators'].get('liquidez_corriente'),
                    'endeudamiento': calc_result['indicators'].get('endeudamiento'),
                }
            )
            
            self._actualizar_proceso(proceso_carga_completa)
            return {'success': True, 'report_id': reporte.id, 'indicator_id': indicador.id}
            
        except Exception as e:
            self._actualizar_proceso(proceso_carga_completa, str(e))
            return {'success': False, 'error': f"Error en pipeline central: {str(e)}"}
