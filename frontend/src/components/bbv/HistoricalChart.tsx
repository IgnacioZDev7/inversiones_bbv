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
  if (!metrics || metrics.length === 0) {
    return null;
  }

  // Ordenar cronológicamente del más antiguo al más nuevo
  const sortedMetrics = [...metrics].sort((a, b) => {
    if (a.gestion !== b.gestion) return a.gestion - b.gestion;
    return a.trimestre - b.trimestre;
  });

  const getQuarterDate = (gestion: number, trimestre: number) => {
    switch (trimestre) {
      case 1: return `${gestion}-03-31T00:00:00Z`;
      case 2: return `${gestion}-06-30T00:00:00Z`;
      case 3: return `${gestion}-09-30T00:00:00Z`;
      case 4: return `${gestion}-12-31T00:00:00Z`;
      default: return `${gestion}-01-01T00:00:00Z`;
    }
  };

  const activosData = sortedMetrics.map(m => ({
    x: getQuarterDate(m.gestion, m.trimestre),
    y: Number(m.activos || 0)
  }));
  const pasivosData = sortedMetrics.map(m => ({
    x: getQuarterDate(m.gestion, m.trimestre),
    y: Number(m.pasivos || 0)
  }));
  const patrimonioData = sortedMetrics.map(m => ({
    x: getQuarterDate(m.gestion, m.trimestre),
    y: Number(m.patrimonio || 0)
  }));

  const formatYAxis = (val: number) => {
    if (val >= 1000000) {
      return (val / 1000000).toFixed(1) + 'M';
    }
    if (val >= 1000) {
      return (val / 1000).toFixed(0) + 'k';
    }
    return val.toString();
  };

  const options: ApexOptions = {
    chart: {
      type: 'line',
      fontFamily: 'Inter, sans-serif',
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    colors: ['#3b82f6', '#ef4444', '#10b981'], // Azul, Rojo, Verde
    stroke: {
      curve: 'smooth',
      width: 3
    },
    xaxis: {
      type: 'datetime',
      labels: {
        datetimeFormatter: {
          year: 'yyyy',
          month: 'MMM yyyy',
          day: 'dd MMM'
        },
        style: {
          colors: '#6b7280',
        }
      }
    },
    yaxis: [
      {
        seriesName: 'Activo Total',
        title: { 
          text: 'Activo y Pasivo (Bs)',
          style: { color: '#6b7280' }
        },
        labels: {
          style: { colors: '#6b7280' },
          formatter: formatYAxis
        }
      },
      {
        seriesName: 'Activo Total', // Oculto, se ancla al Activo
        show: false
      },
      {
        opposite: true,
        seriesName: 'Patrimonio Neto',
        title: { 
          text: 'Patrimonio Neto (Bs)',
          style: { color: '#6b7280' }
        },
        labels: {
          style: { colors: '#6b7280' },
          formatter: formatYAxis
        }
      }
    ],
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      labels: {
        colors: '#6b7280'
      }
    },
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 4,
    },
    tooltip: {
      theme: 'dark',
      x: {
        format: 'MMM yyyy'
      },
      y: {
        formatter: function (val) {
          return new Intl.NumberFormat('es-BO', {
            style: 'currency',
            currency: 'BOB',
            maximumFractionDigits: 0
          }).format(val);
        }
      }
    }
  };

  const series = [
    { name: 'Activo Total', data: activosData },
    { name: 'Pasivo Total', data: pasivosData },
    { name: 'Patrimonio Neto', data: patrimonioData }
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] mb-6">
      <div className="mb-6 flex justify-between">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">
          Evolución Financiera Histórica
        </h3>
      </div>
      <div>
        <ReactApexChart options={options} series={series} type="line" height={350} />
      </div>
    </div>
  );
}
