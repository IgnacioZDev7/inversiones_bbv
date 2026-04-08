class DataCleaner:
    def __init__(self, multiplier=1000):
        # Los reportes usualmente están en "Miles de Bolivianos"
        self.multiplier = multiplier
        
    def clean(self, raw_data):
        """Valida y limpia los valores extraídos."""
        cleaned = {}
        campos = [
            'total_activo_corriente', 'total_activo_no_corriente', 'total_activo',
            'total_pasivo_corriente', 'total_pasivo_no_corriente', 'total_pasivo',
            'total_patrimonio'
        ]
        
        for campo in campos:
            val = raw_data.get(campo)
            if val is not None:
                # Multiplica por 1000 u otro valor parametrizado
                cleaned[campo] = val * self.multiplier
            else:
                cleaned[campo] = None

        # Validación fundamental
        if not cleaned.get('total_activo') or cleaned['total_activo'] <= 0:
            return {
                'success': False,
                'error': "Falla de validación: total_activo es nulo o menor/igual a cero."
            }
            
        return {
            'success': True,
            'valores_limpios': cleaned
        }
