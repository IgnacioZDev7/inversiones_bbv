from django.core.management.base import BaseCommand, CommandError
from apps.financials.models import Empresa
from services.pipeline import FinancialPipeline

class Command(BaseCommand):
    help = 'Ejecuta el pipeline de forma individual o en bloque para varios periodos y empresas.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--empresas', 
            nargs='+', 
            type=str, 
            help='Códigos BBV de empresas a procesar separadas por espacio (ej. --empresas BVC ICT)'
        )
        parser.add_argument(
            '--gestiones', 
            nargs='+', 
            type=int, 
            help='Años a procesar (ej. --gestiones 2022 2023)'
        )
        parser.add_argument(
            '--trimestres', 
            nargs='+', 
            type=int, 
            help='Trimestres a procesar (ej. --trimestres 1 2 3)'
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Procesar todos los años (2020-2023) y todos sus trimestres'
        )

    def handle(self, *args, **options):
        codigos = options['empresas']
        mod_gestiones = options['gestiones']
        mod_trimestres = options['trimestres']
        is_all = options['all']
        
        if not codigos:
            raise CommandError("Debes especificar al menos un código de empresa con --empresas (ej. --empresas BVC)")
            
        empresas = []
        for c in codigos:
            # Facilitamos el test creando la empresa si no existiera
            emp, created = Empresa.objects.get_or_create(
                codigo_bbv=c.upper(), 
                defaults={'nombre': f'Empresa {c.upper()} S.A.'}
            )
            if created:
                self.stdout.write(self.style.WARNING(f'La empresa {c.upper()} se creó automáticamente para este test.'))
            empresas.append(emp)

        if is_all:
            gestiones = [2020, 2021, 2022, 2023]
            trimestres = [1, 2, 3, 4]
        else:
            if not mod_gestiones or not mod_trimestres:
                raise CommandError('Si no usas --all, debes proporcionar --gestiones y --trimestres específicos.')
            gestiones = mod_gestiones
            trimestres = mod_trimestres

        pipeline = FinancialPipeline()
        
        self.stdout.write(self.style.MIGRATE_HEADING('\n--- INICIANDO PIPELINE DE EXTRACCIÓN ---'))
        for empresa in empresas:
            for gestion in gestiones:
                for trimestre in trimestres:
                    self.stdout.write(f'Procesando {empresa.codigo_bbv} - {gestion} T{trimestre}...')
                    resultado = pipeline.procesar_reporte(empresa, gestion, trimestre)
                    if resultado.get('success'):
                        self.stdout.write(self.style.SUCCESS(
                            f'  ✅ OK | Reporte ID: {resultado.get("report_id")} | Indicador ID: {resultado.get("indicator_id")}'
                        ))
                    else:
                        self.stdout.write(self.style.ERROR(
                            f'  ❌ Falló: {resultado.get("error")}'
                        ))
        
        self.stdout.write(self.style.SUCCESS('\n--- FINALIZADO ---'))
