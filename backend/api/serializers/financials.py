from rest_framework import serializers
from apps.financials.models import Empresa, ReporteFinanciero, IndicadorFinanciero

class EmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empresa
        fields = '__all__'

class ReporteFinancieroSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReporteFinanciero
        fields = '__all__'

class IndicadorFinancieroSerializer(serializers.ModelSerializer):
    class Meta:
        model = IndicadorFinanciero
        fields = '__all__'
