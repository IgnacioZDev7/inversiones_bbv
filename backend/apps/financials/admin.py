from django.contrib import admin
from .models import Empresa, ReporteFinanciero, IndicadorFinanciero, ProcesoCarga


@admin.register(Empresa)
class EmpresaAdmin(admin.ModelAdmin):
    list_display = ("id", "nombre", "codigo_bbv", "sector", "activa")
    search_fields = ("nombre", "codigo_bbv", "sector")
    list_filter = ("activa", "sector")


@admin.register(ReporteFinanciero)
class ReporteFinancieroAdmin(admin.ModelAdmin):
    list_display = ("id", "empresa", "gestion", "trimestre", "estado_procesamiento", "fecha_publicacion")
    search_fields = ("empresa__nombre", "empresa__codigo_bbv")
    list_filter = ("estado_procesamiento", "trimestre", "gestion")


@admin.register(IndicadorFinanciero)
class IndicadorFinancieroAdmin(admin.ModelAdmin):
    list_display = ("id", "reporte", "score_financiero", "clasificacion_riesgo", "recomendacion")
    search_fields = ("reporte__empresa__nombre",)


@admin.register(ProcesoCarga)
class ProcesoCargaAdmin(admin.ModelAdmin):
    list_display = ("id", "tipo_proceso", "estado", "empresa", "fecha_inicio", "fecha_fin")
    list_filter = ("tipo_proceso", "estado")
    search_fields = ("empresa__nombre", "detalle")