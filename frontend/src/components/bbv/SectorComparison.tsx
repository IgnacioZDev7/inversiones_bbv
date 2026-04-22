import React, { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { fetchMetrics } from '../../api/client';

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

  useEffect(() => {
    const loadComparisonData = async () => {
      setLoading(true);
      try {
        const currentCompany = companies.find(c => String(c.id) === String(selectedCompanyId));
        const currentSector = currentCompany?.sector;
        
        // 1. Filtrar estrictamente por sector:
        // SOLO incluir empresas del sector actual
        const sectorCompanies = currentSector 
          ? companies.filter(c => c.sector === currentSector)
          : companies;

        // 2. Agrupar datos por empresa: pedimos los datos de cada empresa por id
        const dataPromises = sectorCompanies.map(comp => fetchMetrics(String(comp.id)));
        const results = await Promise.all(dataPromises);
        
        const newChartData = [];
        
        for (let i = 0; i < sectorCompanies.length; i++) {
          const compMetrics = results[i];
          if (Array.isArray(compMetrics) && compMetrics.length > 0) {
            // 3. Seleccionar únicamente el último reporte por empresa:
            // ordenar por fecha y tomar el más reciente
            const sortedMetrics = [...compMetrics].sort((a: any, b: any) => {
              const gestionA = Number(a.gestion);
              const gestionB = Number(b.gestion);
              const trimA = Number(a.trimestre);
              const trimB = Number(b.trimestre);
              
              if (gestionA !== gestionB) return gestionB - gestionA;
              return trimB - trimA;
            });
            const latest = sortedMetrics[0];
            
            // 4. Generar el dataset final: 1 punto por empresa
            newChartData.push({
              name: sectorCompanies[i].codigo_bbv,
              liquidez: Number(latest.liquidez_corriente) || 0,
              endeudamiento: Number(latest.endeudamiento) || 0
            });
          }
        }
        
        setChartData(newChartData);
      } catch (error) {
        console.error("Error al cargar datos comparativos:", error);
      } finally {
        setLoading(false);
      }
    };

    if (companies && companies.length > 0 && selectedCompanyId) {
      loadComparisonData();
    }
  }, [companies, selectedCompanyId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] mb-6 flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent dark:border-brand-400 dark:border-t-transparent"></div>
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
    },
    colors: ['#3b82f6', '#f59e0b'], // Azul y Naranja
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '50%',
        borderRadius: 4,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    xaxis: {
      categories: chartData.map(d => d.name),
      labels: {
        style: {
          colors: '#6b7280',
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
        style: { color: '#6b7280', fontWeight: 400 },
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
    },
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 4,
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
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] mb-6">
      <div className="mb-6 flex justify-between">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">
          Comparación Sectorial
        </h3>
      </div>
      <div>
        <ReactApexChart options={options} series={series} type="bar" height={350} />
      </div>
    </div>
  );
}
