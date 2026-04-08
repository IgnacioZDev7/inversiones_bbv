from django.db import models


class Empresa(models.Model):
    """
    Empresas listadas o monitoreadas dentro del sistema.
    """

    nombre = models.CharField(max_length=200)
    codigo_bbv = models.CharField(max_length=30, unique=True)
    sigla = models.CharField(max_length=20, blank=True, null=True)
    sector = models.CharField(max_length=100, blank=True, null=True)
    descripcion = models.TextField(blank=True, null=True)
    sitio_web = models.URLField(blank=True, null=True)

    activa = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "empresa"
        verbose_name = "Empresa"
        verbose_name_plural = "Empresas"
        ordering = ["nombre"]
        indexes = [
            models.Index(fields=["codigo_bbv"]),
            models.Index(fields=["activa"]),
            models.Index(fields=["sector"]),
        ]

    def __str__(self):
        return f"{self.nombre} ({self.codigo_bbv})"


class ReporteFinanciero(models.Model):
    """
    Reporte financiero trimestral asociado a una empresa.
    """

    class TrimestreChoices(models.IntegerChoices):
        PRIMER_TRIMESTRE = 1, "Primer Trimestre"
        SEGUNDO_TRIMESTRE = 2, "Segundo Trimestre"
        TERCER_TRIMESTRE = 3, "Tercer Trimestre"
        CUARTO_TRIMESTRE = 4, "Cuarto Trimestre"

    class EstadoProcesamientoChoices(models.TextChoices):
        PENDIENTE = "pendiente", "Pendiente"
        DESCARGADO = "descargado", "Descargado"
        PROCESADO = "procesado", "Procesado"
        ERROR = "error", "Error"

    empresa = models.ForeignKey(
        Empresa,
        on_delete=models.CASCADE,
        related_name="reportes_financieros"
    )

    gestion = models.PositiveIntegerField()
    trimestre = models.PositiveSmallIntegerField(choices=TrimestreChoices.choices)

    fecha_publicacion = models.DateField(blank=True, null=True)
    fecha_descarga = models.DateTimeField(blank=True, null=True)

    url_pdf = models.URLField(max_length=500)
    nombre_archivo = models.CharField(max_length=255, blank=True, null=True)
    ruta_archivo_local = models.CharField(max_length=500, blank=True, null=True)

    hash_archivo = models.CharField(max_length=128, blank=True, null=True)
    tamano_archivo_bytes = models.BigIntegerField(blank=True, null=True)

    estado_procesamiento = models.CharField(
        max_length=20,
        choices=EstadoProcesamientoChoices.choices,
        default=EstadoProcesamientoChoices.PENDIENTE
    )
    mensaje_error = models.TextField(blank=True, null=True)

    datos_extraidos_json = models.JSONField(blank=True, null=True)

    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "reporte_financiero"
        verbose_name = "Reporte financiero"
        verbose_name_plural = "Reportes financieros"
        ordering = ["-gestion", "-trimestre", "empresa__nombre"]
        constraints = [
            models.UniqueConstraint(
                fields=["empresa", "gestion", "trimestre"],
                name="unique_reporte_por_empresa_gestion_trimestre"
            )
        ]
        indexes = [
            models.Index(fields=["empresa", "gestion", "trimestre"]),
            models.Index(fields=["estado_procesamiento"]),
            models.Index(fields=["fecha_publicacion"]),
        ]

    def __str__(self):
        return f"{self.empresa.nombre} - {self.gestion} T{self.trimestre}"


class IndicadorFinanciero(models.Model):
    """
    Indicadores y métricas calculadas a partir de un reporte financiero.
    Una fila por reporte.
    """

    reporte = models.OneToOneField(
        ReporteFinanciero,
        on_delete=models.CASCADE,
        related_name="indicadores"
    )

    # Valores base extraídos o normalizados
    ingresos = models.DecimalField(max_digits=18, decimal_places=2, blank=True, null=True)
    utilidad_neta = models.DecimalField(max_digits=18, decimal_places=2, blank=True, null=True)
    activos = models.DecimalField(max_digits=18, decimal_places=2, blank=True, null=True)
    pasivos = models.DecimalField(max_digits=18, decimal_places=2, blank=True, null=True)
    patrimonio = models.DecimalField(max_digits=18, decimal_places=2, blank=True, null=True)

    activo_corriente = models.DecimalField(max_digits=18, decimal_places=2, blank=True, null=True)
    pasivo_corriente = models.DecimalField(max_digits=18, decimal_places=2, blank=True, null=True)

    # Ratios e indicadores calculados
    liquidez_corriente = models.DecimalField(max_digits=10, decimal_places=4, blank=True, null=True)
    endeudamiento = models.DecimalField(max_digits=10, decimal_places=4, blank=True, null=True)
    margen_neto = models.DecimalField(max_digits=10, decimal_places=4, blank=True, null=True)
    roa = models.DecimalField(max_digits=10, decimal_places=4, blank=True, null=True)
    roe = models.DecimalField(max_digits=10, decimal_places=4, blank=True, null=True)

    crecimiento_ingresos_trimestral = models.DecimalField(max_digits=10, decimal_places=4, blank=True, null=True)
    crecimiento_ingresos_interanual = models.DecimalField(max_digits=10, decimal_places=4, blank=True, null=True)
    crecimiento_utilidad_trimestral = models.DecimalField(max_digits=10, decimal_places=4, blank=True, null=True)
    crecimiento_utilidad_interanual = models.DecimalField(max_digits=10, decimal_places=4, blank=True, null=True)

    score_financiero = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    clasificacion_riesgo = models.CharField(max_length=50, blank=True, null=True)
    recomendacion = models.CharField(max_length=100, blank=True, null=True)
    resumen_interpretativo = models.TextField(blank=True, null=True)

    fecha_calculo = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "indicador_financiero"
        verbose_name = "Indicador financiero"
        verbose_name_plural = "Indicadores financieros"
        indexes = [
            models.Index(fields=["score_financiero"]),
            models.Index(fields=["clasificacion_riesgo"]),
        ]

    def __str__(self):
        return f"Indicadores - {self.reporte}"


class ProcesoCarga(models.Model):
    """
    Registro de ejecuciones del pipeline de adquisición/procesamiento.
    Ayuda para trazabilidad y auditoría técnica.
    """

    class TipoProcesoChoices(models.TextChoices):
        DESCARGA = "descarga", "Descarga"
        EXTRACCION = "extraccion", "Extracción"
        LIMPIEZA = "limpieza", "Limpieza"
        CALCULO = "calculo", "Cálculo"
        CARGA = "carga", "Carga completa"

    class EstadoChoices(models.TextChoices):
        EN_PROCESO = "en_proceso", "En proceso"
        EXITOSO = "exitoso", "Exitoso"
        FALLIDO = "fallido", "Fallido"

    empresa = models.ForeignKey(
        Empresa,
        on_delete=models.SET_NULL,
        related_name="procesos_carga",
        blank=True,
        null=True
    )
    reporte = models.ForeignKey(
        ReporteFinanciero,
        on_delete=models.SET_NULL,
        related_name="procesos_carga",
        blank=True,
        null=True
    )

    tipo_proceso = models.CharField(max_length=20, choices=TipoProcesoChoices.choices)
    estado = models.CharField(max_length=20, choices=EstadoChoices.choices, default=EstadoChoices.EN_PROCESO)

    fecha_inicio = models.DateTimeField(auto_now_add=True)
    fecha_fin = models.DateTimeField(blank=True, null=True)

    detalle = models.TextField(blank=True, null=True)
    mensaje_error = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "proceso_carga"
        verbose_name = "Proceso de carga"
        verbose_name_plural = "Procesos de carga"
        ordering = ["-fecha_inicio"]
        indexes = [
            models.Index(fields=["tipo_proceso"]),
            models.Index(fields=["estado"]),
            models.Index(fields=["fecha_inicio"]),
        ]

    def __str__(self):
        empresa = self.empresa.nombre if self.empresa else "Sin empresa"
        return f"{self.tipo_proceso} - {empresa} - {self.estado}"