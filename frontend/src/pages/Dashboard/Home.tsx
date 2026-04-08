import React, { useState, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import { fetchCompanies, fetchMetrics } from '../../api/client';
import MetricsTable from '../../components/bbv/MetricsTable';
import KpiCards from '../../components/bbv/KpiCards';
import HistoricalChart from '../../components/bbv/HistoricalChart';

export default function Home() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [metrics, setMetrics] = useState<any[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Cargar empresas al montar
    const loadCompanies = async () => {
      try {
        setLoading(true);
        const data = await fetchCompanies();
        setCompanies(data);
        setError(null);
        // Autoseleccionar la primera empresa si existe
        if (data && data.length > 0) {
            setSelectedCompany(data[0].id.toString());
        }
      } catch (err: any) {
        setError('Error al cargar la lista de empresas. Verifica que el servidor Backend esté corriendo en el puerto 8000.');
      } finally {
        setLoading(false);
      }
    };
    loadCompanies();
  }, []);

  useEffect(() => {
    // Cargar métricas según el cambio de empresa
    const loadMetrics = async () => {
      if (!selectedCompany) return; // Esperar a tener empresa seleccionada

      setLoading(true);
      try {
        const data = await fetchMetrics(selectedCompany);
        setMetrics(data);
        setError(null);
      } catch (err: any) {
        // Fallar de forma limpia
        setMetrics([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadMetrics();
  }, [selectedCompany]);

  // Derivar si mostramos o no vistas basadas en filtros
  const isGlobalView = !selectedCompany;

  return (
    <>
      <PageMeta
        title="Dashboard Financiero | Inversiones BBV"
        description="Dashboard del sistema de inversiones de la Bolsa Boliviana de Valores"
      />
      
      <div className="space-y-4">
        {/* Filtros */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="mb-4 text-xl font-bold text-gray-800 dark:text-white/90">
            Monitor Financiero
          </h2>
          
          <div className="flex items-center gap-4">
            <label htmlFor="company-select" className="text-sm font-medium text-gray-700 dark:text-gray-400">
              Empresa Analizada:
            </label>
            <select
              id="company-select"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              disabled={loading}
            >
              <option value="" disabled>Selecciona una empresa...</option>
              {companies.map((comp) => (
                <option key={comp.id} value={comp.id}>
                  {comp.nombre} ({comp.codigo_bbv})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Carga y datos */}
        {error ? (
          <div className="rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        ) : loading ? (
          <div className="flex h-64 items-center justify-center">
            {/* Spinner básico al estilo TailAdmin */}
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent dark:border-brand-400 dark:border-t-transparent"></div>
          </div>
        ) : isGlobalView ? (
          <div className="rounded-lg bg-gray-50 p-8 text-center text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
            Por favor, selecciona una empresa del menú superior para empezar a analizar.
          </div>
        ) : metrics.length === 0 ? (
          <div className="rounded-lg bg-gray-50 p-8 text-center text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
            Aún no hay métricas extraídas ni descargadas para esta entidad.
          </div>
        ) : (
          <div>
            <KpiCards metrics={metrics} />
            <HistoricalChart metrics={metrics} />
            <MetricsTable metrics={metrics} />
          </div>
        )}
      </div>
    </>
  );
}
