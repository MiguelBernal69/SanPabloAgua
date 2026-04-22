package handlers

import (
	"water-management-api/internal/database"
	"water-management-api/internal/models"

	"github.com/gofiber/fiber/v2"
)

// MonthlyReport representa el reporte mensual
type MonthlyReport struct {
	Month              int     `json:"month"`
	Year               int     `json:"year"`
	TotalReadings      int64   `json:"total_readings"`
	TotalConsumption   float64 `json:"total_consumption"`
	TotalBilled        float64 `json:"total_billed"`
	TotalPaid          float64 `json:"total_paid"`
	TotalPending       float64 `json:"total_pending"`
	ReadingsPaid       int64   `json:"readings_paid"`
	ReadingsPending    int64   `json:"readings_pending"`
	AverageConsumption float64 `json:"average_consumption"`
}

// GetMonthlyReport obtiene el reporte del mes especificado
func GetMonthlyReport(c *fiber.Ctx) error {
	month := c.QueryInt("month")
	year := c.QueryInt("year")

	if month < 1 || month > 12 || year < 2020 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Mes o año inválido",
		})
	}

	var report MonthlyReport
	report.Month = month
	report.Year = year

	// Total de lecturas
	database.DB.Model(&models.Reading{}).
		Where("month = ? AND year = ?", month, year).
		Count(&report.TotalReadings)

	// Suma de consumo y monto total facturado
	database.DB.Model(&models.Reading{}).
		Where("month = ? AND year = ?", month, year).
		Select("COALESCE(SUM(consumption), 0) as consumption, COALESCE(SUM(total_amount), 0) as billed").
		Row().Scan(&report.TotalConsumption, &report.TotalBilled)

	// Lecturas pagadas y pendientes
	database.DB.Model(&models.Reading{}).
		Where("month = ? AND year = ? AND is_paid = ?", month, year, true).
		Count(&report.ReadingsPaid)

	database.DB.Model(&models.Reading{}).
		Where("month = ? AND year = ? AND is_paid = ?", month, year, false).
		Count(&report.ReadingsPending)

	// Total pagado (suma de pagos del mes)
	database.DB.Model(&models.Payment{}).
		Where("EXTRACT(MONTH FROM payment_date) = ? AND EXTRACT(YEAR FROM payment_date) = ?", month, year).
		Select("COALESCE(SUM(amount), 0)").
		Row().Scan(&report.TotalPaid)

	// Calcular pendiente
	report.TotalPending = report.TotalBilled - report.TotalPaid

	// Promedio de consumo
	if report.TotalReadings > 0 {
		report.AverageConsumption = report.TotalConsumption / float64(report.TotalReadings)
	}

	return c.JSON(report)
}

// DebtorInfo información de clientes morosos
type DebtorInfo struct {
	CustomerID   string  `json:"customer_id"`
	CustomerCode string  `json:"customer_code"`
	Name         string  `json:"name"`
	Phone        string  `json:"phone"`
	Address      string  `json:"address"`
	MonthsInDebt int     `json:"months_in_debt"`
	TotalDebt    float64 `json:"total_debt"`
	OldestDebt   string  `json:"oldest_debt"` // "MM/YYYY"
}

// GetDebtorsReport obtiene la lista de clientes con deudas
func GetDebtorsReport(c *fiber.Ctx) error {
	var debtors []DebtorInfo

	// Query SQL para obtener morosos con múltiples meses de deuda
	query := `
		SELECT 
			c.id as customer_id,
			c.customer_code,
			u.name,
			u.phone,
			c.address,
			COUNT(r.id) as months_in_debt,
			SUM(r.total_amount) as total_debt,
			MIN(r.month || '/' || r.year) as oldest_debt
		FROM customers c
		JOIN users u ON c.user_id = u.id
		JOIN readings r ON c.id = r.customer_id
		WHERE r.is_paid = false
		GROUP BY c.id, c.customer_code, u.name, u.phone, c.address
		ORDER BY months_in_debt DESC, total_debt DESC
	`

	if err := database.DB.Raw(query).Scan(&debtors).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error al generar reporte de morosos",
		})
	}

	return c.JSON(fiber.Map{
		"total_debtors": len(debtors),
		"debtors":       debtors,
	})
}
