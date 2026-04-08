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
    queryset = ReporteFinanciero.objects.all()
    serializer_class = ReporteFinancieroSerializer

class IndicadorFinancieroListView(generics.ListAPIView):
    queryset = IndicadorFinanciero.objects.all()
    serializer_class = IndicadorFinancieroSerializer
