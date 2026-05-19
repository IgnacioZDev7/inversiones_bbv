import React, { useState, useEffect, useRef } from 'react';
import * as LightweightCharts from 'lightweight-charts';
import { useFinancialSimulator } from '../../agents/useFinancialSimulator';

const { createChart, ColorType } = LightweightCharts;

interface SimulatorProps {
  companies: any[];
  isVerified?: boolean;
}

export default function Simulator({ companies, isVerified = false }: SimulatorProps) {
  const { simulate, loading, error, result } = useFinancialSimulator();

  
  const [params, setParams] = useState({
    empresa: companies.length > 0 ? companies[0].id : '',
    monto: 10000,
    anios: 5,
    escenario: 'base' as 'conservador' | 'base' | 'optimista',
    modo: 'avanzado' as 'basico' | 'avanzado'
  });

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  const handleSimulate = () => {
    if (!params.empresa) return;
    simulate({
      empresa: Number(params.empresa),
      monto: params.monto,
      anios: params.anios,
      escenario: params.escenario,
      modo: params.modo
    });
  };

  useEffect(() => {
    if (!chartContainerRef.current || !result) return;

    if (chartRef.current) {
      chartRef.current.remove();
    }

    const chart = createChart(chartContainerRef.current, {
      height: 350,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      timeScale: {
        visible: true,
        borderColor: '#1e293b',
      },
    });

    if (result.modo === 'avanzado') {
      const p75Series = chart.addLineSeries({ color: '#10b981', lineWidth: 1, lineStyle: 2, title: 'Optimista (P75)' });
      const baseSeries = chart.addAreaSeries({ 
        lineColor: '#3b82f6', 
        topColor: 'rgba(59, 130, 246, 0.4)', 
        bottomColor: 'rgba(59, 130, 246, 0.0)', 
        lineWidth: 3, 
        title: 'Mediana (P50)' 
      });
      const p25Series = chart.addLineSeries({ color: '#ef4444', lineWidth: 1, lineStyle: 2, title: 'Pesimista (P25)' });

      const tBase = result.serie.map(i => ({ time: `${2024 + i.year}-01-01`, value: i.value }));
      const tP25 = result.serie.map(i => ({ time: `${2024 + i.year}-01-01`, value: i.p25 }));
      const tP75 = result.serie.map(i => ({ time: `${2024 + i.year}-01-01`, value: i.p75 }));

      p75Series.setData(tP75 as any);
      baseSeries.setData(tBase as any);
      p25Series.setData(tP25 as any);
    } else {
      const baseSeries = chart.addAreaSeries({ 
        lineColor: '#3b82f6', 
        topColor: 'rgba(59, 130, 246, 0.4)', 
        bottomColor: 'rgba(59, 130, 246, 0.0)', 
        lineWidth: 3, 
        title: 'CAGR Directo' 
      });
      const tBase = result.serie.map(i => ({ time: `${2024 + i.year}-01-01`, value: i.value }));
      baseSeries.setData(tBase as any);
    }

    chart.timeScale().fitContent();
    chartRef.current = chart;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [result]);

  const getConfidenceColor = (score: string) => {
    switch (score) {
      case 'Alta': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'Media': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default: return 'text-red-500 bg-red-500/10 border-red-500/20';
    }
  };

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">
              Simulator <span className="text-brand-500">v2.0</span>
            </h3>
            {result && (
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getConfidenceColor(result.confidence_score)}`}>
                Confianza {result.confidence_score}
              </div>
            )}
          </div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Análisis estadístico avanzado basado en comportamiento patrimonial histórico.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <button 
              onClick={() => setParams({...params, modo: 'basico'})}
              className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${params.modo === 'basico' ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500'}`}
            >
              Básico
            </button>
            <button 
              onClick={() => setParams({...params, modo: 'avanzado'})}
              className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${params.modo === 'avanzado' ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500'}`}
            >
              Avanzado
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="md:col-span-2 space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Entidad Financiera</label>
          <select
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm font-bold dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 outline-none focus:ring-4 focus:ring-brand-500/10 transition-all appearance-none"
            value={params.empresa}
            onChange={(e) => setParams({ ...params, empresa: e.target.value })}
          >
            <option value="">Seleccionar empresa...</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Capital Inicial (Bs.)</label>
          <input
            type="number"
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm font-bold dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 outline-none focus:ring-4 focus:ring-brand-500/10 transition-all"
            value={params.monto}
            onChange={(e) => setParams({ ...params, monto: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Horizonte (Años)</label>
          <input
            type="number"
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm font-bold dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 outline-none focus:ring-4 focus:ring-brand-500/10 transition-all"
            value={params.anios}
            onChange={(e) => setParams({ ...params, anios: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6 mb-10">
        <div className="flex-1 w-full space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Escenario de Crecimiento</label>
          <div className="flex rounded-2xl bg-gray-100 p-1.5 dark:bg-gray-800">
            {['conservador', 'base', 'optimista'].map((e) => (
              <button
                key={e}
                onClick={() => setParams({...params, escenario: e as any})}
                className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${
                  params.escenario === e 
                  ? 'bg-white text-brand-600 shadow-xl dark:bg-gray-700 dark:text-white' 
                  : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        <div className="w-full md:w-auto flex flex-col items-center mt-5 md:mt-6">
          <button
            onClick={handleSimulate}
            disabled={loading || !params.empresa || (params.modo === 'avanzado' && !isVerified)}
            className="w-full md:w-auto px-12 py-4 bg-brand-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-brand-600 active:scale-95 transition-all shadow-2xl shadow-brand-500/30 disabled:opacity-50 disabled:bg-gray-500 disabled:shadow-none"
          >
            {loading ? 'Simulando...' : params.modo === 'avanzado' && !isVerified ? 'BLOQUEADO' : 'Ejecutar'}
          </button>
          {params.modo === 'avanzado' && !isVerified && (
            <span className="text-[10px] font-bold text-red-500 mt-2 text-center">
              ⚠️ Verificación biométrica requerida
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-8 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs font-bold text-red-500 animate-shake">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-10 animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.05] group hover:border-brand-500/30 transition-all">
              <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-2">CAGR Real</p>
              <h4 className="text-xl font-black text-gray-900 dark:text-white">
                {(result.cagr * 100).toFixed(2)}%
              </h4>
            </div>
            <div className="p-6 rounded-3xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.05]">
              <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-2">Volatilidad (σ)</p>
              <h4 className="text-xl font-black text-gray-900 dark:text-white">
                {(result.volatility * 100).toFixed(2)}%
              </h4>
            </div>
            <div className="p-6 rounded-3xl bg-brand-500/5 border border-brand-500/10 group hover:bg-brand-500/10 transition-all">
              <p className="text-[9px] text-brand-500 uppercase font-black tracking-widest mb-2">Error Validación</p>
              <h4 className="text-xl font-black text-brand-600 dark:text-brand-400">
                {result.backtesting_error}%
              </h4>
              <p className="text-[8px] text-brand-400 mt-1 font-bold">MAPE (Backtesting)</p>
            </div>
            <div className="p-6 rounded-3xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.05]">
              <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-2">ROI Proyectado</p>
              <h4 className="text-xl font-black text-green-500">
                {result.roi.toFixed(1)}%
              </h4>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-6 relative">
              <div 
                className={`transition-all duration-500 ${params.modo === 'avanzado' && !isVerified ? 'blur-md pointer-events-none opacity-50 select-none' : ''}`}
              >
                <div ref={chartContainerRef} className="h-[380px] w-full" />
                {result.modo === 'avanzado' && (
                  <div className="flex flex-wrap items-center justify-center gap-8 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mt-4">
                    <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"></span> Mediana</span>
                    <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></span> P75 (Optimista)</span>
                    <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></span> P25 (Pesimista)</span>
                  </div>
                )}
              </div>
              
              {params.modo === 'avanzado' && !isVerified && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-6 animate-fade-in pointer-events-none">
                  <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm text-center">
                    <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    </div>
                    <h4 className="text-white font-black uppercase tracking-widest text-sm mb-2">Acceso Biométrico Requerido</h4>
                    <p className="text-gray-400 text-xs leading-relaxed font-medium">
                      Para visualizar las proyecciones estocásticas del motor Monte Carlo, por favor verifica tu identidad en el panel inferior.
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-6">
              <div className="p-8 rounded-[2.5rem] bg-slate-950 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 h-32 w-32 bg-brand-500/10 rounded-full blur-3xl group-hover:bg-brand-500/20 transition-all" />
                <p className="text-[10px] text-brand-400 uppercase font-black tracking-[0.3em] mb-3">Valor Futuro Estimado</p>
                <h4 className="text-4xl font-black text-white mb-8 tracking-tighter">
                  Bs. {result.valor_futuro.toLocaleString()}
                </h4>
                
                <div className="space-y-5">
                  <div className="p-5 rounded-3xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                    <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                      Metodología del Modelo
                    </h5>
                    <p className="text-[10px] text-gray-400 leading-relaxed font-medium italic">
                      {result.modo === 'avanzado' 
                        ? 'Modelo Probabilístico Monte Carlo (500 iteraciones) con truncamiento de outliers (±2σ) y validación mediante Backtesting histórico.'
                        : 'Modelo Determinístico basado en Tasa de Crecimiento Anual Compuesta (CAGR) absoluta sin considerar factores de riesgo o volatilidad.'}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[9px] text-gray-500 leading-relaxed font-bold uppercase tracking-widest">
                      Nota de Transparencia:
                    </p>
                    <p className="text-[10px] text-brand-500/80 leading-relaxed font-black italic">
                      “Los percentiles son resultados de simulación estadística basados en comportamiento histórico, no constituyen probabilidades exactas ni garantías de rendimiento futuro.”
                    </p>
                  </div>
                </div>
              </div>

              {result.outliers && (
                <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                  <p className="text-[10px] text-amber-500 leading-relaxed font-black uppercase tracking-widest mb-1">
                    Gestión de Outliers:
                  </p>
                  <p className="text-[10px] text-amber-500/70 leading-relaxed font-medium italic">
                    Se han excluido variaciones extremas (&gt;300%) en el cálculo de volatilidad para evitar sesgos en el "Cap Dinámico".
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
