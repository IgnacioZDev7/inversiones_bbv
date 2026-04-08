import React from 'react';

interface Metric {
  id: number;
  reporte: number;
  activos: string | null;
  pasivos: string | null;
  patrimonio: string | null;
  activo_corriente: string | null;
  pasivo_corriente: string | null;
  liquidez_corriente: string | null;
  endeudamiento: string | null;
}

interface MetricsTableProps {
  metrics: Metric[];
}

const formatCurrency = (val: string | null) => {
  if (!val) return '-';
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    maximumFractionDigits: 0
  }).format(Number(val));
};

const formatDecimal = (val: string | null) => {
  if (!val) return '-';
  return Number(val).toFixed(2);
};

export default function MetricsTable({ metrics }: MetricsTableProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
        Indicadores Financieros
      </h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-gray-500 dark:text-gray-400">
          <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3 font-medium">Rept ID</th>
              <th scope="col" className="px-6 py-3 font-medium">Activos</th>
              <th scope="col" className="px-6 py-3 font-medium">Pasivos</th>
              <th scope="col" className="px-6 py-3 font-medium">Patrimonio</th>
              <th scope="col" className="px-6 py-3 font-medium">Liq. Corriente</th>
              <th scope="col" className="px-6 py-3 font-medium">Endeudamiento</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric) => (
              <tr 
                key={metric.id}
                className="border-b border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
              >
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                  #{metric.reporte}
                </td>
                <td className="px-6 py-4">{formatCurrency(metric.activos)}</td>
                <td className="px-6 py-4">{formatCurrency(metric.pasivos)}</td>
                <td className="px-6 py-4">{formatCurrency(metric.patrimonio)}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                    {formatDecimal(metric.liquidez_corriente)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                    {formatDecimal(metric.endeudamiento)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
