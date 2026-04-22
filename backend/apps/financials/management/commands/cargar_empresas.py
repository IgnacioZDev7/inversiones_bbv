import json
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.financials.models import Empresa

class Command(BaseCommand):
    help = 'Carga empresas desde un archivo JSON (data/empresas.json) a la base de datos'

    def handle(self, *args, **kwargs):
        base_dir = settings.BASE_DIR
        file_path = os.path.join(base_dir, 'data', 'empresas.json')

        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f'El archivo no existe: {file_path}'))
            return

        with open(file_path, 'r', encoding='utf-8') as file:
            try:
                empresas_data = json.load(file)
            except json.JSONDecodeError as e:
                self.stdout.write(self.style.ERROR(f'Error al parsear el JSON: {e}'))
                return

        creadas = 0
        actualizadas = 0

        for item in empresas_data:
            codigo_bbv = item.get('codigo_bbv')
            if not codigo_bbv:
                self.stdout.write(self.style.WARNING(f'Empresa ignorada por no tener codigo_bbv: {item}'))
                continue

            empresa, created = Empresa.objects.update_or_create(
                codigo_bbv=codigo_bbv,
                defaults={
                    'nombre': item.get('nombre', ''),
                    'sector': item.get('sector', ''),
                    'activa': item.get('activa', True)
                }
            )

            if created:
                creadas += 1
                self.stdout.write(self.style.SUCCESS(f'Empresa creada: {empresa.nombre} ({codigo_bbv})'))
            else:
                actualizadas += 1
                self.stdout.write(self.style.SUCCESS(f'Empresa actualizada: {empresa.nombre} ({codigo_bbv})'))

        self.stdout.write(self.style.SUCCESS(f'Proceso completado. Creadas: {creadas}, Actualizadas: {actualizadas}'))
