Objetivo:
Revertir el componente "Evolución Financiera Histórica" a su implementación anterior basada en ApexCharts, eliminando completamente la implementación con TradingView Lightweight Charts.

---

ALCANCE

- Solo afectar: HistoricalChart.tsx
- NO modificar:
  - FinancialChart (Evolución Patrimonial)
  - KpiCards
  - RiskGauge
  - Layout del dashboard

---

ACCIONES

1. Eliminar completamente:
   - importaciones de lightweight-charts
   - lógica de createChart
   - useEffect asociado al chart manual
   - series múltiples manuales
   - markers personalizados

2. Restaurar gráfico con ApexCharts:

Debe incluir:

- tipo: line o area
- 3 series:
  - Activos
  - Pasivos
  - Patrimonio

3. Configuración mínima:

series: [
{ name: 'Activos', data: [...] },
{ name: 'Pasivos', data: [...] },
{ name: 'Patrimonio', data: [...] }
]

xaxis:

- categorías por trimestre (ej: 2023 T1, T2...)

4. Mantener:

- datos reales desde metrics
- orden correcto por gestión + trimestre
- diseño compatible con TailAdmin

---

VALIDACIÓN

✔ El gráfico renderiza sin errores
✔ No hay errores en consola
✔ Cambiar empresa actualiza el gráfico
✔ Se ven las 3 líneas correctamente

---

NO HACER

- NO dejar código muerto de TradingView
- NO mezclar ambas librerías
- NO cambiar estilos globales

---

ENTREGA

- HistoricalChart.tsx limpio con ApexCharts
- Confirmación de funcionamiento estable
