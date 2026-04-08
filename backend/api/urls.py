from django.urls import path
from api.views.financials import (
    EmpresaListView,
    EmpresaDetailView,
    ReporteFinancieroListView,
    IndicadorFinancieroListView
)

urlpatterns = [
    path('companies/', EmpresaListView.as_view(), name='empresa-list'),
    path('companies/<int:pk>/', EmpresaDetailView.as_view(), name='empresa-detail'),
    path('reports/', ReporteFinancieroListView.as_view(), name='reporte-list'),
    path('metrics/', IndicadorFinancieroListView.as_view(), name='metric-list'),
]
