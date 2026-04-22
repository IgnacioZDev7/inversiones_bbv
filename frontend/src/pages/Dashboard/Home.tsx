import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import PageMeta from '../../components/common/PageMeta';
import { fetchCompanies, fetchMetrics } from '../../api/client';
import MetricsTable from '../../components/bbv/MetricsTable';
import KpiCards from '../../components/bbv/KpiCards';
import HistoricalChart from '../../components/bbv/HistoricalChart';
import FinancialAnalysis from '../../components/bbv/FinancialAnalysis';
import SectorComparison from '../../components/bbv/SectorComparison';
import RiskGauge from '../../components/bbv/RiskGauge';

// --- Multimedia: Feedback Sonoro Simple ---
let audioCtx: AudioContext | null = null;
const playBeep = (type: 'normal' | 'riesgoso') => {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'riesgoso') {
      // Tono de alerta (baja frecuencia, onda triangle)
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.6, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.3);
    } else {
      // Tono de confirmación (alta frecuencia, pop rápido)
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.1);
    }
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};
// ------------------------------------------

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCompany = searchParams.get('company') || '';

  const setSelectedCompany = (id: string) => {
    setSearchParams({ company: id }, { replace: true });
  };

  const [companies, setCompanies] = useState<Record<string, unknown>[]>([]);
  const [metrics, setMetrics] = useState<Record<string, unknown>[]>([]);
  
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
        // Autoseleccionar la primera empresa si existe y no hay una en la URL
        if (data && data.length > 0 && !searchParams.get('company')) {
            setSelectedCompany(String(data[0].id));
        }
      } catch {
        setError('Error al cargar la lista de empresas. Verifica que el servidor Backend esté corriendo en el puerto 8000.');
      } finally {
        setLoading(false);
      }
    };
    loadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        
        // Reproducir sonido basado en el estado financiero
        if (data && data.length > 0) {
          const sortedMetrics = [...data].sort((a: any, b: any) => {
            if (a.gestion !== b.gestion) return b.gestion - a.gestion;
            return b.trimestre - a.trimestre;
          });
          const latest = sortedMetrics[0];
          const previous = sortedMetrics.length > 1 ? sortedMetrics[1] : null;

          const nLiquidez = Number(latest.liquidez_corriente || 0);
          const nEndeudamiento = Number(latest.endeudamiento || 0);
          const nPatrimonioAct = Number(latest.patrimonio || 0);
          const nPatrimonioPrev = Number(previous?.patrimonio || 0);
          const varPatrimonio = (nPatrimonioPrev !== 0) ? ((nPatrimonioAct - nPatrimonioPrev) / nPatrimonioPrev) : 0;

          // Mismo criterio que FinancialAnalysis
          const isRiesgoso = (nLiquidez < 1.0 || nEndeudamiento > 0.8 || varPatrimonio < -0.10);
          playBeep(isRiesgoso ? 'riesgoso' : 'normal');
        }
      } catch {
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
        {/* Filtros - Diseño secundario/minimizado */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="mb-2 sm:mb-0 text-xl font-bold text-gray-800 dark:text-white/90">
            Monitor Financiero
          </h2>
          
          <div className="flex items-center gap-2">
            <label htmlFor="company-select" className="text-xs font-medium text-gray-500 dark:text-gray-400 hidden sm:block">
              Selección rápida:
            </label>
            <select
              id="company-select"
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
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
            Por favor, selecciona una empresa del menú lateral o superior para empezar a analizar.
          </div>
        ) : metrics.length === 0 ? (
          <div className="rounded-lg bg-gray-50 p-8 text-center text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
            Aún no hay métricas extraídas ni descargadas para esta entidad.
          </div>
        ) : (
          <div key={selectedCompany} className="animate-fade-in space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <FinancialAnalysis metrics={metrics} />
              </div>
              <div>
                <RiskGauge metrics={metrics} />
              </div>
            </div>
            <KpiCards metrics={metrics} />
            <HistoricalChart metrics={metrics} />
            <SectorComparison companies={companies as any} selectedCompanyId={selectedCompany} />
            <MetricsTable metrics={metrics} />
          </div>
        )}
      </div>
    </>
  );
}
