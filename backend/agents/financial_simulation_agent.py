import numpy as np
from apps.financials.models import IndicadorFinanciero

class FinancialSimulationAgent:
    """
    Agente de simulación financiera avanzada.
    Incluye Backtesting, Score de Confianza y Monte Carlo truncado (500 iter).
    """

    def simulate(self, empresa_id: int, monto: float, anios: int, escenario: str, modo: str = 'avanzado'):
        # 1. Obtener indicadores financieros ordenados
        indicadores = IndicadorFinanciero.objects.filter(
            reporte__empresa_id=empresa_id
        ).order_by('reporte__gestion', 'reporte__trimestre')

        count = indicadores.count()
        if count < 8:
            raise ValueError(f"Datos insuficientes ({count}/8). Se requieren al menos 2 años de historial.")

        patrimonios = [float(i.patrimonio or 0) for i in indicadores]
        
        # 2. Procesamiento de Retornos y Capping Dinámico
        all_returns = []
        for i in range(1, len(patrimonios)):
            if patrimonios[i-1] > 0:
                all_returns.append((patrimonios[i] / patrimonios[i-1]) - 1)
        
        # Excluir outliers (>300%) para el cálculo del Cap y Volatilidad estable
        filtered_returns = [r for r in all_returns if r <= 3.0]
        outliers_detected = len(all_returns) > len(filtered_returns)
        
        # Volatilidad basada en datos filtrados
        volatility = np.std(filtered_returns) * np.sqrt(4) if filtered_returns else 0.2
        
        # Cap dinámico: Percentil 95 de los retornos filtrados
        p95_growth = np.percentile(filtered_returns, 95) * 4 if filtered_returns else 0.6
        
        # CAGR Histórico Real
        n_years = (count - 1) / 4.0
        cagr = (patrimonios[-1] / patrimonios[0]) ** (1 / n_years) - 1

        # 3. Ajuste por Riesgo y Capping
        multiplicadores_riesgo = {
            'conservador': 1.2,
            'base': 1.0,
            'optimista': 0.7
        }
        factor = multiplicadores_riesgo.get(escenario, 1.0)
        adjusted_cagr = cagr - (volatility * factor)
        capped_cagr = min(adjusted_cagr, p95_growth)

        # 4. Backtesting (Validación Histórica)
        # Usamos los datos previos al último año para "predecir" el último patrimonio conocido
        mape_error = 0
        if count >= 12:
            train_data = patrimonios[:-4] # Quitar último año
            test_actual = patrimonios[-1]
            n_train = (len(train_data) - 1) / 4.0
            cagr_train = (train_data[-1] / train_data[0]) ** (1 / n_train) - 1
            # Proyectar 1 año
            predicted = train_data[-1] * (1 + cagr_train)
            mape_error = abs(predicted - test_actual) / test_actual if test_actual > 0 else 0

        # 5. Score de Confianza
        confidence = "Baja"
        if count >= 16 and mape_error < 0.15 and volatility < 0.4:
            confidence = "Alta"
        elif count >= 12 and mape_error < 0.30:
            confidence = "Media"

        # 6. Simulación
        serie = []
        if modo == 'basico':
            current_val = monto
            for t in range(anios + 1):
                serie.append({
                    "year": t, "value": round(current_val, 2),
                    "p25": round(current_val, 2), "p75": round(current_val, 2)
                })
                current_val *= (1 + cagr)
        else:
            # Monte Carlo con Truncamiento (±2σ)
            num_simulations = 500
            simulations = []
            std_sim = volatility * 0.5
            
            for _ in range(num_simulations):
                path = [monto]
                current_value = monto
                for _ in range(anios):
                    # Generar shock y truncar a ±2 desviaciones estándar
                    shock = np.random.normal(0, std_sim)
                    shock = np.clip(shock, -2 * std_sim, 2 * std_sim)
                    
                    growth_year = capped_cagr + shock
                    current_value = current_value * (1 + growth_year)
                    path.append(max(0.01, current_value))
                simulations.append(path)

            simulations = np.array(simulations)
            p25_series = np.percentile(simulations, 25, axis=0)
            p50_series = np.percentile(simulations, 50, axis=0)
            p75_series = np.percentile(simulations, 75, axis=0)
            
            for t in range(anios + 1):
                serie.append({
                    "year": t,
                    "value": round(float(p50_series[t]), 2),
                    "p25": round(float(p25_series[t]), 2),
                    "p75": round(float(p75_series[t]), 2)
                })

        valor_futuro = serie[-1]["value"]
        roi = ((valor_futuro - monto) / monto) * 100 if monto > 0 else 0

        return {
            "cagr": round(float(cagr), 4),
            "adjusted_cagr": round(float(adjusted_cagr), 4),
            "volatility": round(float(volatility), 4),
            "dynamic_cap": round(float(p95_growth), 4),
            "backtesting_error": round(float(mape_error * 100), 2),
            "confidence_score": confidence,
            "outliers": outliers_detected,
            "valor_futuro": round(float(valor_futuro), 2),
            "roi": round(float(roi), 2),
            "serie": serie,
            "modo": modo
        }
