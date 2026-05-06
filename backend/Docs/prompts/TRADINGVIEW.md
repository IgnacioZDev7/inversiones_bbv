Objetivo:
Reintroducir el gráfico avanzado con TradingView Lightweight Charts en "Evolución Financiera Histórica", asegurando implementación limpia, validada y sin errores previos.

---

PRECONDICIÓN

- El componente actual está en ApexCharts funcionando correctamente

---

ALCANCE

- Solo modificar: HistoricalChart.tsx
- NO tocar otros componentes

---

ACCIONES

1. Reemplazar ApexCharts por TradingView Lightweight Charts

2. Implementar:

- 3 series:
  - Activos (azul)
  - Pasivos (rojo)
  - Patrimonio (verde)

3. Transformación de datos:

[
{
time: 'YYYY-MM-DD',
activos: number,
pasivos: number,
patrimonio: number
}
]

✔ Ordenados por gestión + trimestre
✔ Convertidos con Number()

---

4. Funcionalidades obligatorias:

- Zoom con scroll
- Pan con drag
- fitContent()

---

5. Leyenda interactiva:

[✔] Activos
[✔] Pasivos
[✔] Patrimonio

Usar applyOptions({ visible: ... })

---

6. Lógica financiera:

- Riesgo:
  pasivos > activos → marcador rojo

- Crecimiento:
  patrimonio actual > anterior → marcador verde

✔ Ignorar primer punto
✔ Evitar NaN

---

7. FIX OBLIGATORIO JSX

- Reemplazar ">" por "&gt;" en textos

---

8. Validación interna

Agregar logs temporales:

console.log("metrics", metrics)
console.log("transformed", data)

✔ Verificar coherencia datos vs gráfico

---

VALIDACIÓN FINAL

✔ No errores en consola
✔ Datos coinciden con backend
✔ Marcadores correctos
✔ Sin lag
✔ Escala coherente

---

NO HACER

- NO mezclar ApexCharts
- NO usar datos mock
- NO modificar otros módulos

---

ENTREGA

- HistoricalChart.tsx funcional con TradingView
- Confirmación de:
  ✔ datos correctos
  ✔ visual correcto
  ✔ rendimiento estable
