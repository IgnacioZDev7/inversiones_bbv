from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.financials.models import Empresa, ReporteFinanciero, IndicadorFinanciero
from api.serializers.financials import (
    EmpresaSerializer,
    ReporteFinancieroSerializer,
    IndicadorFinancieroSerializer
)
from agents.financial_simulation_agent import FinancialSimulationAgent

# Vistas de empresas
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
        
        # DEBUG: Verificar cantidad de registros en el servidor
        print(f"DEBUG: Enviando {queryset.count()} registros para empresa_id={empresa_id}")
            
        return queryset.order_by('reporte__gestion', 'reporte__trimestre')

class FinancialSimulatorView(APIView):
    """
    Endpoint para realizar simulaciones financieras.
    Delega toda la lógica al FinancialSimulationAgent.
    """
    def get(self, request):
        try:
            empresa_id = request.query_params.get('empresa')
            monto = request.query_params.get('monto', 1000)
            anios = request.query_params.get('anios', 5)
            escenario = request.query_params.get('escenario', 'base')
            modo = request.query_params.get('modo', 'avanzado')

            if not empresa_id:
                return Response({"error": "Debe especificar una empresa"}, status=status.HTTP_400_BAD_REQUEST)

            agent = FinancialSimulationAgent()
            result = agent.simulate(
                empresa_id=int(empresa_id),
                monto=float(monto),
                anios=int(anios),
                escenario=escenario,
                modo=modo
            )
            
            return Response(result, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error en simulador: {str(e)}")
            return Response({"error": "Error interno en el simulador"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
