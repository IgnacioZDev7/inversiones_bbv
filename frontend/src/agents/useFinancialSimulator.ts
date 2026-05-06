import { useState } from 'react';
import axios from 'axios';

interface SimulationResult {
  cagr: number;
  adjusted_cagr: number;
  volatility: number;
  dynamic_cap: number;
  backtesting_error: number;
  confidence_score: 'Alta' | 'Media' | 'Baja';
  outliers: boolean;
  valor_futuro: number;
  roi: number;
  modo: 'basico' | 'avanzado';
  serie: Array<{ 
    year: number; 
    value: number;
    p25: number;
    p75: number;
  }>;
}

interface SimulationParams {
  empresa: number;
  monto: number;
  anios: number;
  escenario: 'conservador' | 'base' | 'optimista';
  modo: 'basico' | 'avanzado';
}

export const useFinancialSimulator = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const simulate = async (params: SimulationParams) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:8000/api/simulator/', {
        params: {
          empresa: params.empresa,
          monto: params.monto,
          anios: params.anios,
          escenario: params.escenario,
          modo: params.modo
        }
      });
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al conectar con el simulador');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    simulate,
    loading,
    error,
    result,
    setResult
  };
};
