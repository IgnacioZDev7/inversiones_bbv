import React from 'react';
import TiltCard from '../common/TiltCard';

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

const calcVariation = (actual: string | null, prev: string | null): number | null => {
  const nActual = Number(actual);
  const nPrev = Number(prev);
  if (!nActual || !nPrev || nPrev === 0) return null;
  return ((nActual - nPrev) / nPrev) * 100;
};

const VariationBadge = ({ val, invertColors = false }: { val: number | null, invertColors?: boolean }) => {
  if (val === null) return null;
  
  const isPositive = val >= 0;
  // Para Pasivos o Endeudamiento, un aumento es "negativo" y caída es "positivo"
  const isGood = invertColors ? !isPositive : isPositive;
  
  const colorClass = isGood 
    ? "text-emerald-500 bg-emerald-100 dark:bg-emerald-500/10" 
    : "text-red-500 bg-red-100 dark:bg-red-500/10";
    
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
      {isPositive ? (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
      ) : (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
      )}
      {Math.abs(val).toFixed(1)}%
    </span>
  );
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
  const previous = sortedMetrics.length > 1 ? sortedMetrics[1] : null;

  const varActivo = calcVariation(latest.activos, previous?.activos || null);
  const varPasivo = calcVariation(latest.pasivos, previous?.pasivos || null);
  const varPatrimonio = calcVariation(latest.patrimonio, previous?.patrimonio || null);
  const varLiquidez = calcVariation(latest.liquidez_corriente, previous?.liquidez_corriente || null);
  const varEndeudamiento = calcVariation(latest.endeudamiento, previous?.endeudamiento || null);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 md:gap-6">
      <TiltCard className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex justify-between items-start">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Activo Total</span>
          <VariationBadge val={varActivo} />
        </div>
        <h4 className="mt-2 text-xl font-bold text-gray-800 dark:text-white/90">
          {formatCurrency(latest.activos)}
        </h4>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Al {latest.gestion} T{latest.trimestre}
        </div>
      </TiltCard>
      
      <TiltCard className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex justify-between items-start">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Pasivo Total</span>
          <VariationBadge val={varPasivo} invertColors={true} />
        </div>
        <h4 className="mt-2 text-xl font-bold text-gray-800 dark:text-white/90">
          {formatCurrency(latest.pasivos)}
        </h4>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Al {latest.gestion} T{latest.trimestre}
        </div>
      </TiltCard>
      
      <TiltCard className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex justify-between items-start">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Patrimonio Neto</span>
          <VariationBadge val={varPatrimonio} />
        </div>
        <h4 className="mt-2 text-xl font-bold text-gray-800 dark:text-white/90">
          {formatCurrency(latest.patrimonio)}
        </h4>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Al {latest.gestion} T{latest.trimestre}
        </div>
      </TiltCard>
      
      <TiltCard className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex justify-between items-start">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Liquidez Corriente</span>
          <VariationBadge val={varLiquidez} />
        </div>
        <h4 className="mt-2 text-xl font-bold text-brand-500 dark:text-brand-400">
          {formatDecimal(latest.liquidez_corriente)}
        </h4>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Al {latest.gestion} T{latest.trimestre}
        </div>
      </TiltCard>
      
      <TiltCard className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex justify-between items-start">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Endeudamiento</span>
          <VariationBadge val={varEndeudamiento} invertColors={true} />
        </div>
        <h4 className="mt-2 text-xl font-bold text-blue-500 dark:text-blue-400">
          {formatDecimal(latest.endeudamiento)}
        </h4>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Al {latest.gestion} T{latest.trimestre}
        </div>
      </TiltCard>
    </div>
  );
}
