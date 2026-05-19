from django.urls import path
from api.views.financials import (
    EmpresaListView,
    EmpresaDetailView,
    ReporteFinancieroListView,
    IndicadorFinancieroListView,
    FinancialSimulatorView
)
from api.views.biometric import BiometricVerifyView

urlpatterns = [
    path('companies/', EmpresaListView.as_view(), name='empresa-list'),
    path('companies/<int:pk>/', EmpresaDetailView.as_view(), name='empresa-detail'),
    path('reports/', ReporteFinancieroListView.as_view(), name='reporte-list'),
    path('metrics/', IndicadorFinancieroListView.as_view(), name='metric-list'),
    path('simulator/', FinancialSimulatorView.as_view(), name='simulator'),
    path('biometric/verify/', BiometricVerifyView.as_view(), name='biometric-verify'),
]
