from django.db import models
from django.contrib.auth.models import AbstractUser

class Genero(models.Model):
    nombre = models.CharField(max_length=30, unique=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        db_table = "genero"
        verbose_name = "Género"
        verbose_name_plural = "Géneros"

    def __str__(self):
        return self.nombre


class Direccion(models.Model):
    zona = models.CharField(max_length=150, blank=True, null=True)
    avenida_calle = models.CharField(max_length=150, blank=True, null=True)
    numero_vivienda = models.CharField(max_length=20, blank=True, null=True)
    referencia = models.TextField(blank=True, null=True)
    ciudad = models.CharField(max_length=100, blank=True, null=True)
    departamento = models.CharField(max_length=100, blank=True, null=True)
    pais = models.CharField(max_length=100, default='Bolivia')

    class Meta:
        db_table = "direccion"
        verbose_name = "Dirección"
        verbose_name_plural = "Direcciones"

    def __str__(self):
        return f"{self.avenida_calle} {self.numero_vivienda}, {self.ciudad}"


class Usuario(AbstractUser):
    # AbstractUser already provides first_name, last_name, email, password, etc.
    # We will use the custom fields as requested.
    nombres = models.CharField(max_length=150, blank=True, null=True)
    apellido_paterno = models.CharField(max_length=100, blank=True, null=True)
    apellido_materno = models.CharField(max_length=100, blank=True, null=True)
    
    correo = models.EmailField(unique=True)
    ci = models.CharField(max_length=20, unique=True, null=True, blank=True)
    complemento_ci = models.CharField(max_length=10, blank=True, null=True)
    telefono = models.CharField(max_length=30, blank=True, null=True)
    
    fotografia = models.ImageField(upload_to='usuarios/fotos/', blank=True, null=True)
    autenticado_google = models.BooleanField(default=False)
    
    fecha_creacion = models.DateTimeField(auto_now_add=True, null=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True, null=True)

    # Relaciones
    genero = models.ForeignKey(Genero, on_delete=models.SET_NULL, null=True, blank=True, related_name='usuarios')
    direccion = models.OneToOneField(Direccion, on_delete=models.SET_NULL, null=True, blank=True, related_name='usuario')

    # Setting correo as the email field for authentication compatibility if desired, 
    # but we retain AbstractUser's USERNAME_FIELD = 'username' unless specified otherwise.
    # The user requested "índices sobre correo y ci"
    
    class Meta:
        db_table = "usuario"
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"
        indexes = [
            models.Index(fields=["correo"]),
            models.Index(fields=["ci"]),
        ]

    def __str__(self):
        if self.nombres and self.apellido_paterno:
            return f"{self.nombres} {self.apellido_paterno}"
        return self.username


class SesionBiometrica(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='sesiones_biometricas')
    similarity = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    confidence = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    challenge_type = models.CharField(max_length=50, blank=True, null=True)
    liveness_aprobado = models.BooleanField(default=False)
    
    fecha_inicio = models.DateTimeField(auto_now_add=True)
    fecha_expiracion = models.DateTimeField(null=True, blank=True)
    activa = models.BooleanField(default=True)

    class Meta:
        db_table = "sesion_biometrica"
        verbose_name = "Sesión Biométrica"
        verbose_name_plural = "Sesiones Biométricas"
        indexes = [
            models.Index(fields=["usuario", "activa"]),
            models.Index(fields=["fecha_expiracion"]),
        ]

    def __str__(self):
        return f"Sesión {self.id} - {self.usuario}"


class BitacoraAcceso(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='bitacoras_acceso', null=True, blank=True)
    accion = models.CharField(max_length=100)
    ip = models.GenericIPAddressField(null=True, blank=True)
    navegador = models.CharField(max_length=255, null=True, blank=True)
    sistema_operativo = models.CharField(max_length=100, null=True, blank=True)
    exitoso = models.BooleanField(default=False)
    descripcion = models.TextField(null=True, blank=True)
    fecha_hora = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "bitacora_acceso"
        verbose_name = "Bitácora de Acceso"
        verbose_name_plural = "Bitácoras de Acceso"
        indexes = [
            models.Index(fields=["usuario", "fecha_hora"]),
            models.Index(fields=["fecha_hora"]),
        ]

    def __str__(self):
        estado = "Éxito" if self.exitoso else "Fallo"
        return f"{self.accion} - {self.usuario} ({estado})"
