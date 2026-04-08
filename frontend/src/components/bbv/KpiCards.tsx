import React from 'react';

// Si no declaraste ui/badge/Badge en el request anterior, 
// lo omitiremos de usar componentes externos no estandarizados de tailadmin.

interface Metric {
  id: number;
  reporte: number;
  gestion: number;
  trimestre: number;
  activos: string | null;
  pasivos: string | null;
  patrimonio: string | null;
  activo_corriente: string | null;
  pasivo_corriente: string | null;
  liquidez_corriente: string | null;
  endeudamiento: string | null;
}

interface KpiCardsProps {
  metrics: Metric[];
}

const formatCurrency = (val: string | null) => {
  if (!val) return '-';
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    maximumFractionDigits: 0,
    notation: 'compact'
  }).format(Number(val));
};

const formatDecimal = (val: string | null) => {
  if (!val) return '-';
  return Number(val).toFixed(2);
};

export default function KpiCards({ metrics }: KpiCardsProps) {
  if (!metrics || metrics.length === 0) {
    return null;
  }

  // Encontrar el métrico más reciente cronológicamente
  const sortedMetrics = [...metrics].sort((a, b) => {
    if (a.gestion !== b.gestion) return b.gestion - a.gestion;
    return b.trimestre - a.trimestre;
  });

  const latest = sortedMetrics[0];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 md:gap-6 mb-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Activo Total</span>
        <h4 className="mt-2 text-xl font-bold text-gray-800 dark:text-white/90">
          {formatCurrency(latest.activos)}
        </h4>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Al {latest.gestion} T{latest.trimestre}
        </div>
      </div>
      
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Pasivo Total</span>
        <h4 className="mt-2 text-xl font-bold text-gray-800 dark:text-white/90">
          {formatCurrency(latest.pasivos)}
        </h4>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Al {latest.gestion} T{latest.trimestre}
        </div>
      </div>
      
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Patrimonio Neto</span>
        <h4 className="mt-2 text-xl font-bold text-gray-800 dark:text-white/90">
          {formatCurrency(latest.patrimonio)}
        </h4>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Al {latest.gestion} T{latest.trimestre}
        </div>
      </div>
      
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Liquidez Corriente</span>
        <h4 className="mt-2 text-xl font-bold text-brand-500 dark:text-brand-400">
          {formatDecimal(latest.liquidez_corriente)}
        </h4>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Al {latest.gestion} T{latest.trimestre}
        </div>
      </div>
      
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Endeudamiento</span>
        <h4 className="mt-2 text-xl font-bold text-blue-500 dark:text-blue-400">
          {formatDecimal(latest.endeudamiento)}
        </h4>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Al {latest.gestion} T{latest.trimestre}
        </div>
      </div>
    </div>
  );
}
