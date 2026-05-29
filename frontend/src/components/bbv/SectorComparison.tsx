import React, { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { fetchSectorComparison } from '../../api/client';

interface Company {
  id: string | number;
  nombre: string;
  codigo_bbv: string;
  sector?: string;
  [key: string]: any;
}

interface SectorComparisonProps {
  companies: Company[];
  selectedCompanyId: string;
}

export default function SectorComparison({ companies, selectedCompanyId }: SectorComparisonProps) {
  const [chartData, setChartData] = useState<{ name: string; liquidez: number; endeudamiento: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [cachedSector, setCachedSector] = useState<string | null>(null);

  useEffect(() => {
    const loadComparisonData = async () => {
      const currentCompany = companies.find(c => String(c.id) === String(selectedCompanyId));
      const currentSector = currentCompany?.sector;
      
      if (!currentSector) return;

      // Caché básico para evitar re-fetches de la misma empresa/sector
      if (currentSector === cachedSector && chartData.length > 0) return;

      setLoading(true);
      try {
        const start = performance.now();
        const results = await fetchSectorComparison(currentSector);
        const end = performance.now();
        console.log(`[PERFORMANCE] fetchSectorComparison(${currentSector}) completado en ${(end - start).toFixed(2)}ms. Empresas procesadas: ${results.length}. Peticiones de red: 1`);
        
        const newChartData = results.map((item: any) => ({
          name: item.codigo_bbv,
          liquidez: item.liquidez_corriente,
          endeudamiento: item.endeudamiento
        }));
        
        setChartData(newChartData);
        setCachedSector(currentSector);
      } catch (error) {
        console.error("Error al cargar datos comparativos sectoriales:", error);
      } finally {
        setLoading(false);
      }
    };

    if (companies && companies.length > 0 && selectedCompanyId) {
      loadComparisonData();
    }
  }, [companies, selectedCompanyId, cachedSector, chartData.length]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-brand-500/10 hover:border-brand-500/30 animate-pulse">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="w-full">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
        <div className="h-[350px] w-full bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] mb-6 flex h-64 items-center justify-center text-gray-500">
        No hay datos suficientes para la comparación sectorial.
      </div>
    );
  }

  const options: ApexOptions = {
    chart: {
      type: 'bar',
      fontFamily: 'Inter, sans-serif',
      toolbar: { show: false },
      dropShadow: {
        enabled: true,
        top: 8,
        left: 0,
        blur: 5,
        color: '#000',
        opacity: 0.08
      }
    },
    colors: ['#3b82f6', '#f59e0b'], // Azul y Naranja
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.25,
        opacityFrom: 1,
        opacityTo: 0.75,
        stops: [0, 100]
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 6,
        dataLabels: {
          position: 'top', // Etiquetas arriba de la barra
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => val.toFixed(2),
      offsetY: -20,
      style: {
        fontSize: '11px',
        fontWeight: 600,
        colors: ['#87909e'], // Color neutro para adaptarse a modo claro/oscuro
      },
      background: {
        enabled: false,
      }
    },
    stroke: {
      show: true,
      width: 3,
      colors: ['transparent'],
    },
    xaxis: {
      categories: chartData.map(d => d.name),
      labels: {
        style: {
          colors: '#6b7280',
          fontWeight: 500,
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      title: {
        text: 'Valor de Ratio',
        style: { color: '#6b7280', fontWeight: 500 },
      },
      labels: {
        style: { colors: '#6b7280' },
        formatter: (val) => val.toFixed(2),
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      labels: { colors: '#6b7280' },
      markers: {
        radius: 12,
      }
    },
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 4,
      padding: {
        top: 20, // Dar espacio para los dataLabels
      }
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: function (val) {
          return val.toFixed(2);
        },
      },
    },
  };

  const series = [
    {
      name: 'Liquidez Corriente',
      data: chartData.map(d => d.liquidez),
    },
    {
      name: 'Endeudamiento',
      data: chartData.map(d => d.endeudamiento),
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-brand-500/10 hover:border-brand-500/30">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">
            Comparación Sectorial
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Posición de la empresa frente a pares del mismo sector
          </p>
        </div>
      </div>
      <div>
        <ReactApexChart options={options} series={series} type="bar" height={350} />
      </div>
    </div>
  );
}
