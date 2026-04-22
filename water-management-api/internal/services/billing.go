package services

import (
	"water-management-api/config"
)

// CalculateWaterBill calcula el monto total a pagar según el consumo
// Lógica de tarifas escalonadas:
// - 0-10 m³: 37 Bs (consumo mínimo)
// - 11-25 m³: 3 Bs por m³ adicional
// - 26+ m³: 8 Bs por m³ adicional
func CalculateWaterBill(consumption float64) float64 {
	cfg := config.AppConfig

	// Si consume menos del mínimo, se cobra el mínimo
	if consumption <= cfg.MinConsumption {
		return cfg.MinCost
	}

	total := cfg.MinCost // Comienza con el costo mínimo

	// Si consume entre 11 y 25 m³
	if consumption <= cfg.Tier1Limit {
		excess := consumption - cfg.MinConsumption
		total += excess * cfg.Tier1Price
		return total
	}

	// Si consume más de 25 m³
	// Primero cobra los m³ del 11 al 25 a 3 Bs
	tier1Consumption := cfg.Tier1Limit - cfg.MinConsumption
	total += tier1Consumption * cfg.Tier1Price

	// Luego cobra los m³ del 26 en adelante a 8 Bs
	tier2Consumption := consumption - cfg.Tier1Limit
	total += tier2Consumption * cfg.Tier2Price

	return total
}

// Ejemplos de cálculo:
// CalculateWaterBill(8)  = 37 Bs
// CalculateWaterBill(10) = 37 Bs
// CalculateWaterBill(15) = 37 + (5 * 3) = 52 Bs
// CalculateWaterBill(25) = 37 + (15 * 3) = 82 Bs
// CalculateWaterBill(30) = 37 + (15 * 3) + (5 * 8) = 122 Bs
