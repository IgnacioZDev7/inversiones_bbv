from rest_framework import generics
from apps.financials.models import Empresa, ReporteFinanciero, IndicadorFinanciero
from api.serializers.financials import (
    EmpresaSerializer,
    ReporteFinancieroSerializer,
    IndicadorFinancieroSerializer
)

class EmpresaListView(generics.ListAPIView):
    queryset = Empresa.objects.all()
    serializer_class = EmpresaSerializer

class EmpresaDetailView(generics.RetrieveAPIView):
    queryset = Empresa.objects.all()
    serializer_class = EmpresaSerializer

class ReporteFinancieroListView(generics.ListAPIView):
    serializer_class = ReporteFinancieroSerializer

    def get_queryset(self):
        queryset = ReporteFinanciero.objects.all()
        empresa_id = self.request.query_params.get('empresa')
        gestion = self.request.query_params.get('gestion')
        trimestre = self.request.query_params.get('trimestre')

        if empresa_id:
            queryset = queryset.filter(empresa_id=empresa_id)
        if gestion:
            queryset = queryset.filter(gestion=gestion)
        if trimestre:
            queryset = queryset.filter(trimestre=trimestre)
            
        return queryset

class IndicadorFinancieroListView(generics.ListAPIView):
    serializer_class = IndicadorFinancieroSerializer

    def get_queryset(self):
        queryset = IndicadorFinanciero.objects.all()
        empresa_id = self.request.query_params.get('empresa')
        gestion = self.request.query_params.get('gestion')
        trimestre = self.request.query_params.get('trimestre')

        if empresa_id:
            queryset = queryset.filter(reporte__empresa_id=empresa_id)
        if gestion:
            queryset = queryset.filter(reporte__gestion=gestion)
        if trimestre:
            queryset = queryset.filter(reporte__trimestre=trimestre)
            
        return queryset
