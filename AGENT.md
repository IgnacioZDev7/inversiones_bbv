# Proyecto: Sistema de Análisis de Inversiones BBV

## 1. Descripción General

Sistema web para análisis financiero de empresas de la Bolsa Boliviana de Valores (BBV).

El sistema automatiza:

* adquisición de estados financieros (PDF)
* procesamiento y estructuración de datos
* análisis financiero
* visualización interactiva
* simulación de inversión
* apoyo a decisiones mediante IA

---

## 2. Arquitectura

* Monorepo: frontend + backend
* Backend: Django + API REST
* Frontend: React (TailAdmin)
* Base de datos: PostgreSQL (Supabase)

---

## 3. Módulos del sistema

1. Adquisición y procesamiento de datos
2. Visualización y dashboard
3. Inteligencia analítica
4. Seguridad

---

## 4. Convención general

* Dominio de negocio → Español
* Infraestructura → Inglés

---

## 5. Estado actual

* Backend estructurado
* Frontend con TailAdmin integrado
* Scripts prototipo disponibles en `legacy/`

---

## 6. Prioridad actual

Construir el núcleo funcional:

* base de datos
* modelos
* API
* dashboard con datos reales

---

## 7. Reglas globales

* No construir todo de una vez
* No romper arquitectura definida
* No hardcodear datos
* Todo debe ser incremental y verificable

---
