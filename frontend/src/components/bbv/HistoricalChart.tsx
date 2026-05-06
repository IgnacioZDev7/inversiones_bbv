import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface Metric {
  id: number;
  gestion: number;
  trimestre: number;
  activos: string | null;
  pasivos: string | null;
  patrimonio: string | null;
}

interface HistoricalChartProps {
  metrics: Metric[];
}

export default function HistoricalChart({ metrics }: HistoricalChartProps) {
  // Debug para verificar años en consola
  console.log("DEBUG HistoricalChart (ApexCharts) metrics:", metrics);

  if (!metrics || metrics.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] flex items-center justify-center h-[400px]">
        <p className="text-gray-500">No hay datos históricos disponibles</p>
      </div>
    );
  }

  // Ordenar cronológicamente (Gestion ASC, Trimestre ASC) para asegurar que 2024+ se vea al final
  const sortedMetrics = [...metrics].sort((a, b) => {
    const yearA = Number(a.gestion || 0);
    const yearB = Number(b.gestion || 0);
    if (yearA !== yearB) return yearA - yearB;
    return Number(a.trimestre || 0) - Number(b.trimestre || 0);
  });

  const categories = sortedMetrics.map(m => `${m.gestion} T${m.trimestre}`);
  const activosData = sortedMetrics.map(m => Number(m.activos || 0));
  const pasivosData = sortedMetrics.map(m => Number(m.pasivos || 0));
  const patrimonioData = sortedMetrics.map(m => Number(m.patrimonio || 0));

  const options: ApexOptions = {
    chart: {
      type: 'area',
      height: 350,
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'Outfit, sans-serif',
      background: 'transparent',
    },
    colors: ['#3b82f6', '#ef4444', '#10b981'], // Azul, Rojo, Verde
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.3,
        opacityTo: 0.05,
        stops: [0, 90, 100]
      }
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor: '#1e293b',
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } },
    },
    xaxis: {
      categories: categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: '#64748b', fontSize: '12px' }
      }
    },
    yaxis: {
      labels: {
        style: { colors: '#64748b', fontSize: '12px' },
        formatter: (val) => {
          if (val >= 1000000000) return (val / 1000000000).toFixed(1) + 'B';
          if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
          if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
          return val.toLocaleString();
        }
      }
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      labels: { colors: '#94a3b8' },
      markers: { radius: 12 }
    },
    tooltip: {
      theme: 'dark',
      x: { show: true },
      y: {
        formatter: (val) => `Bs. ${val.toLocaleString()}`
      }
    }
  };

  const series = [
    { name: 'Activos', data: activosData },
    { name: 'Pasivos', data: pasivosData },
    { name: 'Patrimonio', data: patrimonioData }
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">
          Evolución Financiera Histórica
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Tendencia multivariable (Activos, Pasivos y Patrimonio)
        </p>
      </div>
      <div className="h-[350px] w-full">
        <ReactApexChart 
          options={options} 
          series={series} 
          type="area" 
          height={350} 
        />
      </div>
    </div>
  );
}
