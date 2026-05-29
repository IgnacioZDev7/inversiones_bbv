from django.urls import path
from api.views.financials import (
    EmpresaListView,
    EmpresaDetailView,
    ReporteFinancieroListView,
    IndicadorFinancieroListView,
    LatestMetricsView,
    SectorComparisonView,
    FinancialSimulatorView
)
from api.views.biometric import BiometricVerifyView

urlpatterns = [
    path('companies/', EmpresaListView.as_view(), name='empresa-list'),
    path('companies/<int:pk>/', EmpresaDetailView.as_view(), name='empresa-detail'),
    path('reports/', ReporteFinancieroListView.as_view(), name='reporte-list'),
    path('metrics/', IndicadorFinancieroListView.as_view(), name='metric-list'),
    path('metrics/latest/', LatestMetricsView.as_view(), name='metric-latest'),
    path('metrics/sector-comparison/', SectorComparisonView.as_view(), name='metric-sector'),
    path('simulator/', FinancialSimulatorView.as_view(), name='simulator'),
    path('biometric/verify/', BiometricVerifyView.as_view(), name='biometric-verify'),
]
