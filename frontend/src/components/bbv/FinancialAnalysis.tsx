import React from 'react';

interface Metric {
  id: number;
  reporte: number;
  gestion: number;
  trimestre: number;
  activos: string | null;
  pasivos: string | null;
  patrimonio: string | null;
  liquidez_corriente: string | null;
  endeudamiento: string | null;
}

interface FinancialAnalysisProps {
  metrics: Metric[];
}

export default function FinancialAnalysis({ metrics }: FinancialAnalysisProps) {
  if (!metrics || metrics.length === 0) return null;

  // Ordenar cronológicamente para obtener métricas actuales y anteriores
  const sortedMetrics = [...metrics].sort((a, b) => {
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

  // 1. Lógica de Clasificación Financiera (Académicamente defendible)
  let isSaludable = false;
  if (nLiquidez >= 1.2 && nEndeudamiento <= 0.6 && varPatrimonio >= 0) {
    isSaludable = true;
  }

  let isRiesgoso = false;
  if (nLiquidez < 1.0 || nEndeudamiento > 0.8 || varPatrimonio < -0.10) {
    isRiesgoso = true;
  }

  // 2. Resolver Clasificación y Estilos
  let status = "Moderado";
  let statusColor = "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-800";
  let icon = (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
  );

  if (isSaludable && !isRiesgoso) {
    status = "Saludable";
    statusColor = "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-800";
    icon = (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
    );
  } else if (isRiesgoso) {
    status = "Riesgoso";
    statusColor = "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10 border-red-200 dark:border-red-800";
    icon = (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
    );
  }

  // 3. Generación de Texto Neutral y Desglose de Indicadores
  let interpretationText = "";
  if (status === "Saludable") {
    interpretationText = "La entidad presenta una posición financiera sólida con capacidad de cobertura a corto plazo garantizada y un nivel de apalancamiento conservador.";
  } else if (status === "Riesgoso") {
    interpretationText = "La entidad muestra indicadores de atención prioritaria que podrían reflejar presión en la estabilidad operativa o estructural.";
  } else {
    interpretationText = "La entidad mantiene indicadores estables con variaciones moderadas, ubicándose dentro de los rangos de tolerancia convencionales.";
  }

  // Generación de lista de viñetas (Iconografía)
  const getLiqItem = () => {
    if (nLiquidez >= 1.2) return <span className="flex items-center gap-2"><span className="text-emerald-500">✔</span> Liquidez óptima</span>;
    if (nLiquidez < 1.0) return <span className="flex items-center gap-2"><span className="text-red-500">❌</span> Liquidez insuficiente a corto plazo</span>;
    return <span className="flex items-center gap-2"><span className="text-yellow-500">⚠</span> Liquidez dentro de márgenes aceptables</span>;
  };

  const getEndItem = () => {
    if (nEndeudamiento <= 0.6) return <span className="flex items-center gap-2"><span className="text-emerald-500">✔</span> Bajo endeudamiento</span>;
    if (nEndeudamiento > 0.8) return <span className="flex items-center gap-2"><span className="text-red-500">❌</span> Alto endeudamiento (Apalancamiento elevado)</span>;
    return <span className="flex items-center gap-2"><span className="text-yellow-500">⚠</span> Nivel de endeudamiento admisible</span>;
  };

  const getPatItem = () => {
    if (varPatrimonio >= 0) return <span className="flex items-center gap-2"><span className="text-emerald-500">✔</span> Evolución positiva o estable del patrimonio</span>;
    if (varPatrimonio >= -0.10) return <span className="flex items-center gap-2"><span className="text-yellow-500">⚠</span> Ligera disminución del patrimonio</span>;
    return <span className="flex items-center gap-2"><span className="text-red-500">❌</span> Contracción del patrimonio superior al 10%</span>;
  };

  return (
    <div className={`mb-6 p-5 rounded-2xl border ${statusColor}`}>
      <div className="flex gap-4">
        {icon}
        <div className="flex-1">
          <h4 className="text-base font-bold pb-1 flex items-center gap-2">
            Clasificación Financiera Preliminar: {status}
          </h4>
          <p className="text-sm font-medium opacity-90 leading-relaxed mb-3">
            {interpretationText}
          </p>
          
          <div className="text-sm opacity-90 rounded bg-black/5 dark:bg-white/5 p-3 font-medium flex flex-col gap-1.5">
            <span className="text-xs opacity-70 mb-1 border-b border-black/10 dark:border-white/10 pb-1">Evaluación de indicadores base:</span>
            {getLiqItem()}
            {getEndItem()}
            {getPatItem()}
          </div>

          <div className="mt-3 text-xs opacity-70">
            * Clasificación algorítmica de diagnóstico preliminar calculada a cierre {latest.gestion} T{latest.trimestre} e inferida mediante métricas de Liquidez, Endeudamiento y Tendencia Patrimonial.
          </div>
        </div>
      </div>
    </div>
  );
}
