# Arquitectura y Análisis: Sistema "BBV Inversiones"

## 1. Introducción

El sistema **BBV Inversiones** surge de la necesidad de automatizar y centralizar el análisis de estados financieros reportados por empresas registradas en la Bolsa Boliviana de Valores (BBV). Tradicionalmente, la evaluación de estos documentos requiere la extracción manual de datos desde formatos no estructurados (PDFs escaneados o nativos), un proceso lento y propenso a errores. 

El **objetivo del proyecto** es proveer una plataforma analítica de grado institucional (B2B) que extraiga de forma autónoma los estados financieros, los procese mediante un motor de transformación y exponga indicadores clave de rendimiento (KPIs) a través de un dashboard profesional. De este modo, los analistas y tomadores de decisión pueden identificar instantáneamente el perfil de riesgo, la evolución patrimonial y el posicionamiento sectorial de las entidades bursátiles.

---

## 2. Visión General del Sistema

El sistema opera bajo un modelo *End-to-End* altamente automatizado, abarcando desde la adquisición de la materia prima (documentos en la web) hasta la presentación interactiva de *insights* financieros.

**Flujo General (Pipeline):**
1. **Identificación y Generación (URL):** El sistema identifica los parámetros de la empresa y construye las rutas de los reportes.
2. **Descarga (PDF BBV):** Se obtiene el archivo PDF oficial desde el repositorio de la Bolsa Boliviana de Valores.
3. **Extracción (Parsing):** Se lee el PDF y se capturan las líneas de texto relevantes mediante expresiones regulares (regex).
4. **Transformación (Cleaning):** Los datos crudos se limpian y se estandarizan numéricamente (ej. conversión de cifras expresadas en miles).
5. **Cálculo (Indicadores):** Un motor financiero evalúa el riesgo y la salud de la empresa.
6. **Almacenamiento (Persistencia):** La base de datos relacional almacena el reporte y sus indicadores asociados.
7. **Consumo (API → Dashboard):** El frontend interroga los endpoints REST y construye las visualizaciones dinámicas de alto impacto.

---

## 3. Arquitectura por Capas

El diseño del backend aplica estrictamente los principios de separación de responsabilidades (*Separation of Concerns*) bajo una arquitectura orientada a servicios.

### 3.1 Capa de Adquisición de Datos
Encapsulada principalmente en `bbv_downloader.py`. Es la responsable de gestionar la comunicación con servidores externos. Posee lógica para el manejo de excepciones HTTP (errores 404, Timeouts) y utiliza estrategias de *fallback* para intentar múltiples combinaciones de URLs y patrones de nombres en caso de inconsistencias en los servidores de origen.

### 3.2 Capa de Procesamiento
Compuesta por `pdf_parser.py` y `cleaners.py`. 
- El **Parser** emplea herramientas como `pdfplumber` e implementa patrones regex sofisticados para aislar secciones clave del documento (Activos, Pasivos, Patrimonio).
- El **Cleaner** actúa como validador y normalizador. Es crítico para asegurar la integridad contable; por ejemplo, reescalando automáticamente magnitudes numéricas multiplicando por 1000 cuando las cuentas vienen "expresadas en miles de bolivianos".

### 3.3 Capa de Dominio Financiero
Soportada por `indicator_engine.py`. Esta capa aplica el conocimiento de dominio puro. Calcula ratios esenciales:
- **Liquidez Corriente:** (Activo Corriente / Pasivo Corriente).
- **Endeudamiento:** (Pasivo Total / Activo Total).
Además, inyecta algoritmos heurísticos para la clasificación de estados (Riesgoso, Moderado, Saludable), desacoplando esta lógica de la base de datos y de la vista.

### 3.4 Capa de Persistencia
Utiliza modelos de Django (`Empresa`, `ReporteFinanciero`, `IndicadorFinanciero`, `ProcesoCarga`) bajo una arquitectura ORM conectada a PostgreSQL. Garantiza la integridad referencial y permite auditorías (trazabilidad de qué reportes fallaron o fueron exitosos). 

### 3.5 Capa API (Django REST Framework)
La carpeta `api/` expone las vistas y serializadores. Define endpoints consumibles (ej. `/api/metrics/`, `/api/companies/`) dedicados exclusivamente a inyectar JSONs estructurados y limpios al cliente, actuando como un contrato inmutable entre el backend y el frontend.

### 3.6 Capa de Presentación (Frontend)
Construida sobre **React 19** y **TailAdmin** (Tailwind CSS).
Presenta un Dashboard Financiero responsivo que renderiza:
- **Tarjetas KPI** con efecto 3D interactivo (Tilt).
- **Comparación Sectorial:** (Gráfico de barras) Analizando a la empresa contra sus pares.
- **RiskGauge:** Un medidor visual paramétrico sobre el riesgo institucional.
- **Gráficos Históricos:** Evolución de patrimonio y deuda a lo largo del tiempo.
Utiliza persistencia de estado mediante parámetros URL (`?company=ID`), garantizando que las vistas sean enlazables (linkeables) y navegables de manera fluida.

---

## 4. Estructura del Proyecto

### Backend
La separación en `/apps`, `/services` y `/api` obedece a la Arquitectura Limpia:
- `/apps` (`financials`, `accounts`, `analytics`, `audit`, etc.): Albergan los Modelos (entidades de base de datos) y su configuración Django pura.
- `/services` (`pipeline`, `downloader`, `parser`, `cleaners`): Contienen lógica de negocio agnóstica. Son clases puras de Python que pueden ser probadas (Unit Testing) sin requerir el motor HTTP de Django.
- **Management Commands:** (`run_pipeline.py`): Permiten ejecutar flujos pesados por consola, ideal para tareas en segundo plano (Cron Jobs / Celery) sin bloquear los servidores web.

### Frontend
Sigue una estructura modular por dominios:
- `/components/bbv`: Componentes encapsulados (`RiskGauge.tsx`, `KpiCards.tsx`) enfocados en reusabilidad pura.
- `/pages/Dashboard/Home.tsx`: Actúa como el controlador de vista, gestionando llamadas a la API y distribuyendo el estado a los componentes hijos.
- `/layout`: Asegura la coherencia visual con la plantilla B2B TailAdmin (Sidebar, Headers).

---

## 5. Pipeline de Procesamiento (Paso a Paso)

El módulo `pipeline.py` orquesta la automatización:
1. **Selección de empresa:** Se itera sobre los modelos `Empresa` en BD.
2. **Generación de URLs:** Se construye dinámicamente la petición basada en la `gestión` y `trimestre`.
3. **Descarga de PDF:** El `BBVDownloader` baja el reporte a un buffer temporal en memoria.
4. **Parsing:** El `PDFParser` busca patrones regex como `al \d{1,2} de [mes] de \d{4}` para verificar validez y extraer tablas.
5. **Limpieza:** `DataCleaner` estandariza montos flotantes y aplica multiplicadores.
6. **Cálculo de indicadores:** Se llama a `IndicatorEngine` para generar los ratios.
7. **Guardado en BD:** El pipeline guarda el reporte, los indicadores y marca el estado del proceso en `ProcesoCarga` como `EXITOSO` o `FALLIDO`.

---

## 6. Consumo de Servicios

### 6.1 Servicios Internos
- **`downloader`**: Servicio puente de entrada.
- **`parser` y `cleaners`**: Transformadores ETL (Extract, Transform, Load).
- **`engine`**: Lógica de negocio dura.
El desacople en servicios internos permite que el día de mañana se cambie el origen de datos (ej. descargar de un FTP local en lugar de la BBV) modificando únicamente el `downloader`.

### 6.2 Servicios Externos (Propuestos)
Para una iteración futura, la arquitectura actual soporta la fácil integración de:
- **API de Tipos de Cambio:** (Ej. BCB) Aportaría la capacidad de renderizar el Dashboard bimonetario (Bs / USD) dinámicamente.
- **Noticias Financieras (Web Scraping / NLP):** Un servicio adicional que cruce los indicadores cuantitativos con análisis de sentimiento cualitativo en medios sobre la empresa elegida.

---

## 7. Componentes Visuales y Multimedia

La interfaz implementa UX moderna y retención de atención sin recargar el navegador:
- **RiskGauge:** Utiliza *ApexCharts RadialBar* para inyectar una representación visual instantánea del riesgo financiero (saludable verde, moderado amarillo, riesgo rojo), leyendo directamente las métricas del trimestre más reciente.
- **Comparación Sectorial:** Agrupa lógicamente entidades bajo el mismo rubro (ej. "Agroindustrial") para análisis relativo contra el mercado, empleando tooltips oscuros y gradientes 3D-like sutiles.
- **Efectos 3D Tilt:** Componentes nativos de React (`onMouseMove`) que aplican transformaciones vectoriales de rotación, simulando elementos holográficos físicos en las tarjetas KPI.
- **Feedback Sonoro:** Implementado mediante `Web Audio API` (sin archivos pesados), genera frecuencias paramétricas (`sine` u onda de confirmación, `triangle` para alertas) al mutar la vista, mejorando el profesionalismo en las demostraciones de producto.

---

## 8. Decisiones Técnicas Clave

- **Uso de Django + DRF:** Seleccionado por la solidez de su ORM relacional y su seguridad empresarial (Admin Panel integrado), vital para aplicaciones financieras.
- **Pipeline basado en `/services`:** Evitó el anti-patrón de "Fat Models" (Modelos obesos). El procesamiento no vive ni en el ORM ni en las vistas REST, sino aislado en su propia capa.
- **Fallback iterativo en BBV:** Se tomó la decisión de programar arreglos de URLs con distintos nombres por la alta volatilidad e inconsistencia humana detectada en los reportes (nombres de archivo cambiantes en el servidor origen).
- **React + URL Params (`?company=X`):** Permite que cualquier vista específica del dashboard se pueda compartir mediante un simple Copy/Paste de URL, una cualidad altamente valorada por analistas y gerentes.

---

## 9. Problemas Encontrados y Soluciones

1. **PDFs con nombres inconsistentes:** 
   - *Problema:* La BBV cambia la convención de nombres (ej. `EEFF_TRIM_1` vs `EEFF_TRIMESTRAL`). 
   - *Solución:* Implementación de una lista de patrones de *fallback* en el Downloader.
2. **Cifras expresadas en Miles:** 
   - *Problema:* Las sumas de activos rompían los ratios lógicos porque algunos reportes dividían sus montos entre 1000 en el documento impreso.
   - *Solución:* Detección heurística en el `Cleaner` para aplicar el ajuste automático (factor x1000) basado en palabras clave.
3. **Pérdida de Contexto en UI y Sobreposición:** 
   - *Problema:* Gráficos densos ensuciaban la UX (solapamiento en el RiskGauge).
   - *Solución:* Desacople del texto en Tailwind, dejando a *ApexCharts* lidiar puramente con el render numérico.
4. **Falsos Negativos en Errores:**
   - *Problema:* El crasheo de un PDF específico detenía la carga de 20 empresas.
   - *Solución:* Integración del log persistente (`ProcesoCarga`) que captura el Traceback y permite a la aplicación continuar iterando el resto del bloque (fail-safe tolerance).

---

## 10. Conclusión

El sistema **BBV Inversiones** ha logrado superar la barrera crítica de la ingesta automatizada de datos no estructurados en Bolivia. El nivel actual del producto es un MVP avanzado (Most Viable Product) funcional, con una capa visual refinada digna de entornos corporativos y un backend transaccionalmente seguro.

**Posibles Mejoras Futuras:**
- Implementación de un modelo predictivo clásico (Time Series / ARIMA) o Inteligencia Artificial para inferir la probabilidad de incumplimiento (*Default*) basado en el tracking histórico del patrimonio.
- Ampliación de la base de datos de extracción a otros sectores bursátiles (Banca, Seguros, Pymes).
- Exportación automatizada de reportes gerenciales consolidados desde el Dashboard hacia formatos PDF imprimibles.
