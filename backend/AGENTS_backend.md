# Backend - Sistema BBV

## 1. Stack

* Django
* Django REST Framework
* PostgreSQL (Supabase)
* Pandas

---

## 2. Arquitectura

Estructura en capas:

* apps → dominio
* services → lógica reutilizable
* api → endpoints
* models → persistencia

---

## 3. Estructura

backend/
├── apps/
├── services/
├── api/
├── legacy/
└── core/

---

## 4. Convención de nombres

### Español

* Modelos (Empresa, ReporteFinanciero, IndicadorFinanciero)
* Campos
* Lógica financiera

### Inglés

* endpoints (/api/companies/)
* servicios
* rutas

---

## 5. Uso de legacy/

Los scripts en `/legacy/` son prototipos funcionales.

### Contienen:

* descarga de PDFs
* parsing PDF → CSV
* limpieza
* generación de gráficos

---

## 6. Reglas sobre legacy (CRÍTICO)

* NO usar scripts directamente en producción
* NO copiar y pegar lógica sin refactorizar
* NO usar CSV como fuente principal

---

## 7. Adaptación de legacy al sistema real

Los scripts deben ser:

1. Analizados
2. Desacoplados
3. Refactorizados
4. Integrados en services/

---

## 8. Cambio de enfoque (IMPORTANTE)

ANTES:

* ejecución manual
* empresa por empresa
* procesamiento local

AHORA:

* sistema basado en base de datos
* empresas registradas
* procesamiento automático
* trazabilidad

---

## 9. Flujo esperado

1. Empresas registradas en BD
2. Proceso identifica reportes nuevos
3. Descarga PDFs
4. Extrae datos
5. Limpia datos
6. Calcula indicadores
7. Guarda en BD
8. Registra estado del proceso

---

## 10. Modelos obligatorios

* Empresa
* ReporteFinanciero
* IndicadorFinanciero
* ProcesoCarga (opcional pero recomendado)

---

## 11. Services esperados

* bbv_downloader.py
* pdf_parser.py
* cleaners.py
* indicator_engine.py

---

## 12. API mínima

* GET /api/companies/
* GET /api/reports/
* GET /api/metrics/

---

## 13. Reglas críticas

* backend NO genera gráficos
* backend solo entrega datos
* lógica compleja va en services
* views deben ser simples

---

## 14. Restricciones actuales

* NO IA todavía
* NO AWS todavía
* NO optimización prematura

---

## 15. Objetivo actual

* modelos funcionando
* migraciones correctas
* datos reales en BD
* API consumible por frontend

---
