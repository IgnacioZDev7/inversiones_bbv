class IndicatorEngine:
    def calculate(self, datos_limpios):
        """Toma los datos limpios y calcula los indicadores que pueda."""
        indicators = {}
        
        activo_corriente = datos_limpios.get('total_activo_corriente')
        pasivo_corriente = datos_limpios.get('total_pasivo_corriente')
        total_pasivo = datos_limpios.get('total_pasivo')
        total_patrimonio = datos_limpios.get('total_patrimonio')
        
        # Liquidez corriente
        if activo_corriente and pasivo_corriente and pasivo_corriente > 0:
            indicators['liquidez_corriente'] = activo_corriente / pasivo_corriente
            
        # Endeudamiento
        if total_pasivo and total_patrimonio and total_patrimonio > 0:
            indicators['endeudamiento'] = total_pasivo / total_patrimonio
            
        return {
            'success': True,
            'indicators': indicators
        }
