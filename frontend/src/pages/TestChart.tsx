import React, { useState, useEffect } from 'react';
import PageMeta from '../components/common/PageMeta';
import { fetchCompanies, fetchMetrics } from '../api/client';
import FinancialChart from '../components/bbv/FinancialChart';

export default function TestChart() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTestData = async () => {
      try {
        setLoading(true);
        const companies = await fetchCompanies();
        if (companies && companies.length > 0) {
          // Tomar la primera empresa disponible para el test
          const data = await fetchMetrics(String(companies[0].id));
          setMetrics(data);
        }
      } catch (err) {
        console.error(err);
        setError("Error al cargar datos para el gráfico experimental.");
      } finally {
        setLoading(false);
      }
    };

    loadTestData();
  }, []);

  return (
    <>
      <PageMeta
        title="Test TradingView | Inversiones BBV"
        description="Página de prueba para integración de Lightweight Charts"
      />
      
      <div className="space-y-6 p-4 bg-white min-h-screen">
        <div className="bg-yellow-100 p-2 text-center text-xs font-mono text-yellow-800">
          DEBUG: TestChart.tsx Rendered | URL: /test-chart
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900/30 dark:bg-blue-900/10">
          <h1 className="text-xl font-bold text-blue-900 dark:text-blue-200">
            Laboratorio Experimental: TradingView Charts
          </h1>
          <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
            Esta página es un entorno de pruebas aislado para validar la interactividad de Lightweight Charts antes de su integración final en el Dashboard.
          </p>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-4 text-red-800">
            {error}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <FinancialChart metrics={metrics} />
            
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                <h3 className="font-semibold text-gray-800 dark:text-white">Ventajas Detectadas</h3>
                <ul className="mt-3 space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    Rendimiento superior en series de tiempo largas.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    Interactividad nativa (zoom/pan) fluida.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    Estética financiera tipo "Terminal Bloomberg".
                  </li>
                </ul>
              </div>
              
              <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                <h3 className="font-semibold text-gray-800 dark:text-white">Estado de Integración</h3>
                <div className="mt-4 space-y-3">
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden dark:bg-gray-800">
                    <div className="h-full w-3/4 bg-brand-500 rounded-full"></div>
                  </div>
                  <p className="text-xs text-gray-500">75% - Fase de Validación de Datos</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
