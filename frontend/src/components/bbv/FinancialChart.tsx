import React, { useEffect, useRef, useState } from 'react';
import * as LightweightCharts from 'lightweight-charts';

const { createChart, ColorType } = LightweightCharts;

interface FinancialChartProps {
  metrics?: any[];
  title?: string;
  height?: number;
}

/**
 * Transforma los datos del backend (gestión/trimestre) a formato compatible con Lightweight Charts (YYYY-MM-DD)
 */
const transformData = (indicators: any[]) => {
  console.log("DEBUG FinancialChart RAW METRICS:", indicators);
  if (!indicators || indicators.length === 0) return [];

  const transformed = [...indicators]
    .sort((a, b) => {
      const yearA = Number(a.gestion || 0);
      const yearB = Number(b.gestion || 0);
      if (yearA !== yearB) return yearA - yearB;
      return Number(a.trimestre || 0) - Number(b.trimestre || 0);
    })
    .map((item) => {
      let month = '03';
      let day = '31';
      if (item.trimestre === 2) { month = '06'; day = '30'; }
      if (item.trimestre === 3) { month = '09'; day = '30'; }
      if (item.trimestre === 4) { month = '12'; day = '31'; }
      
      return {
        time: `${item.gestion}-${month}-${day}`,
        value: parseFloat(item.patrimonio || 0),
      };
    });

  console.log("DEBUG FinancialChart TRANSFORMED:", transformed);
  return transformed;
};

const FinancialChart: React.FC<FinancialChartProps> = ({ 
  metrics = [], 
  title = "Evolución de Patrimonio",
  height = 450 
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  
  const [chartType, setChartType] = useState<'line' | 'area'>('area');

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // 1. Crear el Chart
    const chart = createChart(chartContainerRef.current, {
      height: height,
      layout: {
        background: { type: ColorType.Solid, color: '#0f172a' }, // Slate 900
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        rightBarStaysOnScroll: true,
      },
    });

    chartRef.current = chart;

    // 2. Añadir Serie
    const data = transformData(metrics);
    
    if (chartType === 'area') {
      const series = chart.addAreaSeries({
        lineColor: '#3b82f6',
        topColor: 'rgba(59, 130, 246, 0.4)',
        bottomColor: 'rgba(59, 130, 246, 0.0)',
        lineWidth: 2,
      });
      series.setData(data);
      seriesRef.current = series;
    } else {
      const series = chart.addLineSeries({
        color: '#10b981',
        lineWidth: 2,
      });
      series.setData(data);
      seriesRef.current = series;
    }

    // Forzar visualización de todo el contenido temporal
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [height, metrics, chartType]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-slate-900">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Análisis de Evolución Temporal (TradingView)
          </p>
        </div>

        <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          <button
            onClick={() => setChartType('line')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              chartType === 'line' 
              ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' 
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Line
          </button>
          <button
            onClick={() => setChartType('area')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              chartType === 'area' 
              ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' 
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Area
          </button>
        </div>
      </div>

      <div 
        ref={chartContainerRef} 
        className="w-full" 
        style={{ height: `${height}px`, minHeight: '450px' }} 
      />
      
      <div className="mt-4 flex gap-4 text-[10px] text-gray-400">
        <span className="flex items-center gap-1 italic">
          Tip: Usa el scroll para zoom y arrastra para mover el tiempo.
        </span>
      </div>
    </div>
  );
};

export default FinancialChart;
